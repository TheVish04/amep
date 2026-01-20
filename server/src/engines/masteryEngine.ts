import { getCollection, COLLECTIONS } from '../db/connection';
import { MASTERY_WEIGHTS, MASTERY_THRESHOLDS, MASTERY_LEVELS } from '@amep/shared';
import type { MasteryScore, MasteryHistoryEntry } from '@amep/shared';

/**
 * Mastery Score Engine
 * 
 * Calculates student mastery per concept using:
 * Mastery = Accuracy(50%) + Consistency(30%) + Speed(20%)
 */
export class MasteryEngine {
    /**
     * Calculate accuracy score based on correct/incorrect answers
     */
    static calculateAccuracy(history: MasteryHistoryEntry[]): number {
        if (history.length === 0) return 0;

        const correctCount = history.filter(h => h.isCorrect).length;
        return Math.round((correctCount / history.length) * 100);
    }

    /**
     * Calculate consistency score based on recent performance trend
     * Higher score = more consistent correct answers
     */
    static calculateConsistency(history: MasteryHistoryEntry[]): number {
        if (history.length < 3) return 50; // Neutral score for insufficient data

        // Take last 10 attempts for consistency calculation
        const recentHistory = history.slice(-10);

        // Calculate streak bonus
        let currentStreak = 0;
        let maxStreak = 0;

        for (const entry of recentHistory) {
            if (entry.isCorrect) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        // Calculate variance in performance
        const correctnessArray = recentHistory.map(h => h.isCorrect ? 1 : 0);
        const mean = correctnessArray.reduce((a, b) => a + b, 0) / correctnessArray.length;
        const variance = correctnessArray.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / correctnessArray.length;

        // Lower variance = higher consistency
        const varianceScore = Math.max(0, 100 - (variance * 100));

        // Combine streak bonus and variance score
        const streakBonus = (maxStreak / recentHistory.length) * 50;

        return Math.min(100, Math.round(varianceScore * 0.6 + streakBonus));
    }

    /**
     * Calculate speed score based on response time
     * Faster = higher score, with diminishing returns
     */
    static calculateSpeed(history: MasteryHistoryEntry[], expectedTime: number = 60): number {
        if (history.length === 0) return 0;

        const recentHistory = history.slice(-10);
        const avgTimeTaken = recentHistory.reduce((sum, h) => sum + h.timeTaken, 0) / recentHistory.length;

        // Score based on how fast compared to expected time
        // If avgTime <= expectedTime/2: 100 points
        // If avgTime >= expectedTime*2: 0 points
        // Linear interpolation in between

        if (avgTimeTaken <= expectedTime * 0.5) return 100;
        if (avgTimeTaken >= expectedTime * 2) return 0;

        const speedRatio = (expectedTime * 2 - avgTimeTaken) / (expectedTime * 1.5);
        return Math.round(speedRatio * 100);
    }

    /**
     * Calculate overall mastery score
     */
    static calculateMasteryScore(
        accuracy: number,
        consistency: number,
        speed: number
    ): number {
        return Math.round(
            accuracy * MASTERY_WEIGHTS.ACCURACY +
            consistency * MASTERY_WEIGHTS.CONSISTENCY +
            speed * MASTERY_WEIGHTS.SPEED
        );
    }

    /**
     * Get mastery level based on score
     */
    static getMasteryLevel(score: number): 'weak' | 'medium' | 'strong' {
        if (score <= MASTERY_THRESHOLDS.WEAK) return MASTERY_LEVELS.WEAK;
        if (score <= MASTERY_THRESHOLDS.MEDIUM) return MASTERY_LEVELS.MEDIUM;
        return MASTERY_LEVELS.STRONG;
    }

    /**
     * Update mastery score for a student-concept pair
     */
    static async updateMastery(
        studentId: string,
        conceptId: string,
        questionId: string,
        isCorrect: boolean,
        timeTaken: number
    ): Promise<MasteryScore> {
        const collection = getCollection<MasteryScore>(COLLECTIONS.MASTERY_SCORES);

        // Get existing mastery record or create new
        let mastery = await collection.findOne({ studentId, conceptId });

        const newEntry: MasteryHistoryEntry = {
            timestamp: new Date(),
            score: 0, // Will be calculated
            questionId,
            isCorrect,
            timeTaken,
        };

        const history = mastery?.history || [];
        history.push(newEntry);

        // Calculate new scores
        const accuracy = this.calculateAccuracy(history);
        const consistency = this.calculateConsistency(history);
        const speed = this.calculateSpeed(history);
        const overallScore = this.calculateMasteryScore(accuracy, consistency, speed);

        // Update the entry with the calculated score
        newEntry.score = overallScore;

        const updateData = {
            studentId,
            conceptId,
            accuracy,
            consistency,
            speed,
            overallScore,
            attempts: history.length,
            lastAttemptAt: new Date(),
            history,
            updatedAt: new Date(),
        };

        if (mastery) {
            await collection.updateOne(
                { _id: mastery._id },
                { $set: updateData }
            );
            return { ...mastery, ...updateData } as MasteryScore;
        } else {
            const result = await collection.insertOne({
                ...updateData,
                createdAt: new Date(),
            } as any);
            return { _id: result.insertedId.toString(), ...updateData } as MasteryScore;
        }
    }

    /**
     * Get mastery scores for a student across all concepts
     */
    static async getStudentMastery(studentId: string): Promise<MasteryScore[]> {
        const collection = getCollection<MasteryScore>(COLLECTIONS.MASTERY_SCORES);
        return collection.find({ studentId }).toArray() as Promise<MasteryScore[]>;
    }

    /**
     * Get class mastery for a specific concept
     */
    static async getClassMastery(conceptId: string, studentIds: string[]): Promise<{
        average: number;
        distribution: { weak: number; medium: number; strong: number };
        scores: { studentId: string; score: number; level: string }[];
    }> {
        const collection = getCollection<MasteryScore>(COLLECTIONS.MASTERY_SCORES);
        const scores = await collection.find({
            conceptId,
            studentId: { $in: studentIds },
        }).toArray();

        const distribution = { weak: 0, medium: 0, strong: 0 };
        let totalScore = 0;

        const studentScores = scores.map((s: any) => {
            const level = this.getMasteryLevel(s.overallScore);
            distribution[level]++;
            totalScore += s.overallScore;
            return { studentId: s.studentId, score: s.overallScore, level };
        });

        return {
            average: scores.length > 0 ? Math.round(totalScore / scores.length) : 0,
            distribution,
            scores: studentScores,
        };
    }
}
