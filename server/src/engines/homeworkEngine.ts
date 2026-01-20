import { getCollection, COLLECTIONS } from '../db/connection';
import { HOMEWORK_DIFFICULTY_MAP, MASTERY_THRESHOLDS } from '@amep/shared';
import { MasteryEngine } from './masteryEngine';
import type { Homework, HomeworkAssignment, Question, MasteryScore } from '@amep/shared';
import { ObjectId } from 'mongodb';

/**
 * Adaptive Homework Engine
 * 
 * Auto-assigns homework based on mastery level:
 * Weak (0-40) → Easy questions + More quantity
 * Medium (41-70) → Medium difficulty
 * Strong (71-100) → Hard questions + Fewer quantity
 */
export class HomeworkEngine {
    /**
     * Determine difficulty and question count based on mastery level
     */
    static getAssignmentConfig(masteryScore: number): HomeworkAssignment['assignedDifficulty'] & {
        difficulty: 'easy' | 'medium' | 'hard';
        questionCount: number;
        timeMultiplier: number;
    } {
        if (masteryScore <= MASTERY_THRESHOLDS.WEAK) {
            return { ...HOMEWORK_DIFFICULTY_MAP.weak, difficulty: 'easy' as const };
        }
        if (masteryScore <= MASTERY_THRESHOLDS.MEDIUM) {
            return { ...HOMEWORK_DIFFICULTY_MAP.medium, difficulty: 'medium' as const };
        }
        return { ...HOMEWORK_DIFFICULTY_MAP.strong, difficulty: 'hard' as const };
    }

    /**
     * Generate adaptive homework for a student on a concept
     */
    static async generateHomework(
        studentId: string,
        conceptId: string,
        title: string,
        dueDate: Date
    ): Promise<Homework> {
        const masteryCollection = getCollection<MasteryScore>(COLLECTIONS.MASTERY_SCORES);
        const questionCollection = getCollection<Question>(COLLECTIONS.QUESTIONS);
        const homeworkCollection = getCollection<Homework>(COLLECTIONS.HOMEWORK);

        // Get student's mastery for this concept
        const mastery = await masteryCollection.findOne({ studentId, conceptId });
        const masteryScore = mastery?.overallScore || 0;

        // Get assignment configuration
        const config = this.getAssignmentConfig(masteryScore);

        // Select appropriate questions
        const questions = await questionCollection.find({
            conceptId,
            difficulty: config.difficulty,
        }).limit(config.questionCount).toArray();

        // If not enough questions at target difficulty, supplement with adjacent
        if (questions.length < config.questionCount) {
            const additionalDifficulty = config.difficulty === 'easy' ? 'medium' :
                config.difficulty === 'hard' ? 'medium' : 'easy';
            const moreQuestions = await questionCollection.find({
                conceptId,
                difficulty: additionalDifficulty,
                _id: { $nin: questions.map(q => q._id) },
            }).limit(config.questionCount - questions.length).toArray();
            questions.push(...moreQuestions);
        }

        const masteryLevel = masteryScore <= MASTERY_THRESHOLDS.WEAK ? 'weak' :
            masteryScore <= MASTERY_THRESHOLDS.MEDIUM ? 'medium' : 'strong';

        const homework: Omit<Homework, '_id'> = {
            studentId,
            conceptId,
            title,
            description: `Adaptive homework based on your ${masteryLevel} mastery level`,
            questions: questions.map(q => (q as any)._id.toString()),
            difficulty: 'adaptive',
            dueDate,
            status: 'pending',
            adaptiveReason: `Assigned ${config.difficulty} difficulty with ${config.questionCount} questions based on mastery score of ${masteryScore}%`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await homeworkCollection.insertOne(homework as any);
        return { _id: result.insertedId.toString(), ...homework } as Homework;
    }

    /**
     * Generate bulk homework for a class on a concept
     */
    static async generateClassHomework(
        studentIds: string[],
        conceptId: string,
        title: string,
        dueDate: Date
    ): Promise<Homework[]> {
        const results: Homework[] = [];

        for (const studentId of studentIds) {
            const homework = await this.generateHomework(studentId, conceptId, title, dueDate);
            results.push(homework);
        }

        return results;
    }

    /**
     * Submit homework and calculate score
     */
    static async submitHomework(
        homeworkId: string,
        answers: { questionId: string; answer: string | string[]; timeTaken: number }[]
    ): Promise<{ score: number; correctCount: number; total: number; feedback: string }> {
        const homeworkCollection = getCollection<Homework>(COLLECTIONS.HOMEWORK);
        const questionCollection = getCollection<Question>(COLLECTIONS.QUESTIONS);

        const homework = await homeworkCollection.findOne({ _id: new ObjectId(homeworkId) as any });
        if (!homework) throw new Error('Homework not found');

        let correctCount = 0;
        const total = answers.length;

        // Check each answer
        for (const ans of answers) {
            const question = await questionCollection.findOne({ _id: new ObjectId(ans.questionId) as any });
            if (!question) continue;

            const isCorrect = Array.isArray(question.correctAnswer)
                ? JSON.stringify(question.correctAnswer.sort()) === JSON.stringify((ans.answer as string[]).sort())
                : question.correctAnswer === ans.answer;

            if (isCorrect) correctCount++;

            // Update mastery for each answer
            await MasteryEngine.updateMastery(
                (homework as any).studentId,
                (homework as any).conceptId,
                ans.questionId,
                isCorrect,
                ans.timeTaken
            );
        }

        const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

        // Generate feedback based on performance
        let feedback = '';
        if (score >= 80) {
            feedback = '🌟 Excellent work! You have demonstrated strong understanding of this concept.';
        } else if (score >= 60) {
            feedback = '👍 Good effort! Review the incorrect answers to strengthen your understanding.';
        } else if (score >= 40) {
            feedback = '📚 Keep practicing! Consider reviewing the concept material before trying again.';
        } else {
            feedback = '💪 Don\'t give up! Let\'s schedule some extra practice on this topic.';
        }

        // Update homework status
        await homeworkCollection.updateOne(
            { _id: new ObjectId(homeworkId) as any },
            {
                $set: {
                    status: 'completed',
                    score,
                    completedAt: new Date(),
                    feedback,
                    updatedAt: new Date(),
                },
            }
        );

        return { score, correctCount, total, feedback };
    }

    /**
     * Get pending homework for a student
     */
    static async getStudentHomework(
        studentId: string,
        status?: 'pending' | 'in-progress' | 'completed' | 'overdue'
    ): Promise<Homework[]> {
        const collection = getCollection<Homework>(COLLECTIONS.HOMEWORK);

        const query: any = { studentId };
        if (status) query.status = status;

        // Check for overdue homework
        const now = new Date();
        await collection.updateMany(
            { studentId, status: 'pending', dueDate: { $lt: now } },
            { $set: { status: 'overdue', updatedAt: now } }
        );

        return collection.find(query).sort({ dueDate: 1 }).toArray() as Promise<Homework[]>;
    }

    /**
     * Get homework completion rates for a class
     */
    static async getClassHomeworkStats(
        studentIds: string[],
        conceptId?: string
    ): Promise<{
        completionRate: number;
        averageScore: number;
        overdueCount: number;
        byStudent: { studentId: string; completed: number; pending: number; avgScore: number }[];
    }> {
        const collection = getCollection<Homework>(COLLECTIONS.HOMEWORK);

        const query: any = { studentId: { $in: studentIds } };
        if (conceptId) query.conceptId = conceptId;

        const allHomework = await collection.find(query).toArray();

        let totalCompleted = 0;
        let totalScore = 0;
        let scoredCount = 0;
        let overdueCount = 0;

        const studentStats: Map<string, { completed: number; pending: number; totalScore: number; scoreCount: number }> = new Map();

        for (const hw of allHomework) {
            const h = hw as any;
            if (!studentStats.has(h.studentId)) {
                studentStats.set(h.studentId, { completed: 0, pending: 0, totalScore: 0, scoreCount: 0 });
            }
            const stats = studentStats.get(h.studentId)!;

            if (h.status === 'completed') {
                totalCompleted++;
                stats.completed++;
                if (h.score !== undefined) {
                    totalScore += h.score;
                    scoredCount++;
                    stats.totalScore += h.score;
                    stats.scoreCount++;
                }
            } else if (h.status === 'overdue') {
                overdueCount++;
                stats.pending++;
            } else {
                stats.pending++;
            }
        }

        const byStudent = Array.from(studentStats.entries()).map(([studentId, stats]) => ({
            studentId,
            completed: stats.completed,
            pending: stats.pending,
            avgScore: stats.scoreCount > 0 ? Math.round(stats.totalScore / stats.scoreCount) : 0,
        }));

        return {
            completionRate: allHomework.length > 0 ? Math.round((totalCompleted / allHomework.length) * 100) : 0,
            averageScore: scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0,
            overdueCount,
            byStudent,
        };
    }
}
