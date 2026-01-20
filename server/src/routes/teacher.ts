import Elysia from 'elysia';
import { getCollection, COLLECTIONS } from '../db/connection';
import { MasteryEngine, EngagementEngine, HomeworkEngine, SkillEngine } from '../engines';
import { generateQuestions, generateClassInsights } from '../ai';
import type { User, Question, Concept, Project } from '@amep/shared';
import { ObjectId } from 'mongodb';

export const teacherRoutes = new Elysia({ prefix: '/api/teachers' })
    // Get teacher profile
    .get('/:id', async ({ params }) => {
        const collection = getCollection<User>(COLLECTIONS.USERS);
        const teacher = await collection.findOne({ _id: new ObjectId(params.id) as any, role: 'teacher' });
        if (!teacher) {
            return { success: false, error: 'Teacher not found' };
        }
        return { success: true, data: teacher };
    })

    // Get class mastery overview
    .get('/:id/class/:classId/mastery', async ({ params, query }) => {
        const conceptId = query.conceptId as string;

        // Get students in class
        const userCollection = getCollection<User>(COLLECTIONS.USERS);
        const students = await userCollection.find({
            role: 'student',
            classId: params.classId
        }).toArray();
        const studentIds = students.map((s: any) => s._id.toString());

        if (conceptId) {
            const mastery = await MasteryEngine.getClassMastery(conceptId, studentIds);
            return { success: true, data: mastery };
        }

        // Get overall class mastery
        const masteryCollection = getCollection(COLLECTIONS.MASTERY_SCORES);
        const allScores = await masteryCollection.find({
            studentId: { $in: studentIds },
        }).toArray();

        // Aggregate by concept
        const conceptScores: Map<string, number[]> = new Map();
        for (const score of allScores) {
            const s = score as any;
            const existing = conceptScores.get(s.conceptId) || [];
            existing.push(s.overallScore);
            conceptScores.set(s.conceptId, existing);
        }

        const conceptCollection = getCollection<Concept>(COLLECTIONS.CONCEPTS);
        const conceptMastery = await Promise.all(
            Array.from(conceptScores.entries()).map(async ([conceptId, scores]) => {
                const concept = await conceptCollection.findOne({ _id: new ObjectId(conceptId) as any });
                const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                return {
                    conceptId,
                    conceptName: (concept as any)?.name || 'Unknown',
                    chapter: (concept as any)?.chapter || 'Unknown',
                    averageScore: Math.round(avgScore),
                    studentCount: scores.length,
                };
            })
        );

        return { success: true, data: conceptMastery };
    })

    // Get weak student clusters
    .get('/:id/class/:classId/clusters', async ({ params }) => {
        const userCollection = getCollection<User>(COLLECTIONS.USERS);
        const students = await userCollection.find({
            role: 'student',
            classId: params.classId
        }).toArray();

        const clusters = { weak: [] as any[], medium: [] as any[], strong: [] as any[] };

        for (const student of students) {
            const scores = await MasteryEngine.getStudentMastery((student as any)._id.toString());
            const avgScore = scores.length > 0
                ? scores.reduce((sum, s: any) => sum + s.overallScore, 0) / scores.length
                : 0;

            const studentData = {
                id: (student as any)._id.toString(),
                name: (student as any).name,
                averageMastery: Math.round(avgScore),
                conceptCount: scores.length,
            };

            if (avgScore < 40) clusters.weak.push(studentData);
            else if (avgScore < 70) clusters.medium.push(studentData);
            else clusters.strong.push(studentData);
        }

        return { success: true, data: clusters };
    })

    // Get class engagement trends
    .get('/:id/class/:classId/engagement', async ({ params, query }) => {
        const days = parseInt(query.days as string) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const trends = await EngagementEngine.getEngagementTrends(
            params.classId,
            startDate,
            new Date()
        );

        return { success: true, data: trends };
    })

    // Get AI-powered class insights
    .get('/:id/class/:classId/insights', async ({ params }) => {
        const userCollection = getCollection<User>(COLLECTIONS.USERS);
        const students = await userCollection.find({
            role: 'student',
            classId: params.classId
        }).toArray();
        const studentIds = students.map((s: any) => s._id.toString());

        // Calculate class metrics
        const masteryCollection = getCollection(COLLECTIONS.MASTERY_SCORES);
        const allScores = await masteryCollection.find({
            studentId: { $in: studentIds },
        }).toArray();

        const studentAvgs: Map<string, number[]> = new Map();
        for (const score of allScores) {
            const s = score as any;
            const existing = studentAvgs.get(s.studentId) || [];
            existing.push(s.overallScore);
            studentAvgs.set(s.studentId, existing);
        }

        let totalMastery = 0;
        let topPerformers = 0;
        let strugglingStudents = 0;

        for (const [, scores] of studentAvgs) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            totalMastery += avg;
            if (avg >= 80) topPerformers++;
            if (avg < 40) strugglingStudents++;
        }

        const averageMastery = studentAvgs.size > 0
            ? Math.round(totalMastery / studentAvgs.size)
            : 0;

        // Get weakest concepts
        const conceptScores: Map<string, number[]> = new Map();
        for (const score of allScores) {
            const s = score as any;
            const existing = conceptScores.get(s.conceptId) || [];
            existing.push(s.overallScore);
            conceptScores.set(s.conceptId, existing);
        }

        const conceptCollection = getCollection<Concept>(COLLECTIONS.CONCEPTS);
        const weakestConcepts: string[] = [];
        for (const [conceptId, scores] of conceptScores) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            if (avg < 50) {
                const concept = await conceptCollection.findOne({ _id: new ObjectId(conceptId) as any });
                weakestConcepts.push((concept as any)?.name || conceptId);
            }
        }

        const insights = await generateClassInsights({
            averageMastery,
            engagementLevel: averageMastery >= 70 ? 'green' : averageMastery >= 40 ? 'yellow' : 'red',
            weakestConcepts: weakestConcepts.slice(0, 5),
            topPerformers,
            strugglingStudents,
        });

        return { success: true, data: { insights, metrics: { averageMastery, topPerformers, strugglingStudents } } };
    })

    // Assign homework to class
    .post('/:id/class/:classId/homework', async ({ params, body }) => {
        const { conceptId, title, dueDays = 3 } = body as { conceptId: string; title: string; dueDays?: number };

        const userCollection = getCollection<User>(COLLECTIONS.USERS);
        const students = await userCollection.find({
            role: 'student',
            classId: params.classId
        }).toArray();
        const studentIds = students.map((s: any) => s._id.toString());

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);

        const homework = await HomeworkEngine.generateClassHomework(
            studentIds,
            conceptId,
            title,
            dueDate
        );

        return { success: true, data: { assigned: homework.length } };
    })

    // Get homework stats for class
    .get('/:id/class/:classId/homework/stats', async ({ params }) => {
        const userCollection = getCollection<User>(COLLECTIONS.USERS);
        const students = await userCollection.find({
            role: 'student',
            classId: params.classId
        }).toArray();
        const studentIds = students.map((s: any) => s._id.toString());

        const stats = await HomeworkEngine.getClassHomeworkStats(studentIds);
        return { success: true, data: stats };
    })

    // Generate AI questions
    .post('/:id/questions/generate', async ({ body }) => {
        const { concept, difficulty, count = 5 } = body as { concept: string; difficulty: 'easy' | 'medium' | 'hard'; count?: number };

        const questions = await generateQuestions(concept, difficulty, count);
        return { success: true, data: questions };
    })

    // Create a project
    .post('/:id/projects', async ({ params, body }) => {
        const { title, description, conceptIds, classId, teamSize, startDate, endDate, rubric } = body as any;

        const userCollection = getCollection<User>(COLLECTIONS.USERS);
        const students = await userCollection.find({
            role: 'student',
            classId
        }).toArray();
        const studentIds = students.map((s: any) => s._id.toString());

        // Form balanced teams
        const teams = await SkillEngine.formTeams(studentIds, teamSize);

        const projectCollection = getCollection(COLLECTIONS.PROJECTS);
        const project: Omit<Project, '_id'> = {
            title,
            description,
            conceptIds,
            classId,
            teacherId: params.id,
            teamSize,
            teams,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'planning',
            rubric,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await projectCollection.insertOne(project as any);
        return { success: true, data: { projectId: result.insertedId.toString(), teams } };
    });
