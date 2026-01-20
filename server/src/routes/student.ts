import Elysia from 'elysia';
import { getCollection, COLLECTIONS } from '../db/connection';
import { MasteryEngine, HomeworkEngine } from '../engines';
import { analyzeGaps } from '../ai';
import type { User, MasteryScore, Homework, Concept } from '@amep/shared';
import { ObjectId } from 'mongodb';

export const studentRoutes = new Elysia({ prefix: '/api/students' })
    // Get student profile
    .get('/:id', async ({ params }) => {
        const collection = getCollection<User>(COLLECTIONS.USERS);
        const student = await collection.findOne({ _id: new ObjectId(params.id) as any, role: 'student' });
        if (!student) {
            return { success: false, error: 'Student not found' };
        }
        return { success: true, data: student };
    })

    // Get student mastery scores
    .get('/:id/mastery', async ({ params }) => {
        const scores = await MasteryEngine.getStudentMastery(params.id);

        // Enrich with concept names
        const conceptCollection = getCollection<Concept>(COLLECTIONS.CONCEPTS);
        const enrichedScores = await Promise.all(
            scores.map(async (score: any) => {
                const concept = await conceptCollection.findOne({ _id: new ObjectId(score.conceptId) as any });
                return {
                    ...score,
                    conceptName: (concept as any)?.name || 'Unknown',
                    conceptChapter: (concept as any)?.chapter || 'Unknown',
                };
            })
        );

        return { success: true, data: enrichedScores };
    })

    // Get AI-powered gap analysis
    .get('/:id/gaps', async ({ params }) => {
        const userCollection = getCollection<User>(COLLECTIONS.USERS);
        const student = await userCollection.findOne({ _id: new ObjectId(params.id) as any });

        const scores = await MasteryEngine.getStudentMastery(params.id);
        const conceptCollection = getCollection<Concept>(COLLECTIONS.CONCEPTS);

        const masteryData = await Promise.all(
            scores.map(async (score: any) => {
                const concept = await conceptCollection.findOne({ _id: new ObjectId(score.conceptId) as any });
                return {
                    concept: (concept as any)?.name || 'Unknown',
                    score: score.overallScore,
                };
            })
        );

        const analysis = await analyzeGaps(
            (student as any)?.name || 'Student',
            masteryData,
            'Physics'
        );

        return { success: true, data: analysis };
    })

    // Get student homework
    .get('/:id/homework', async ({ params, query }) => {
        const status = query.status as any;
        const homework = await HomeworkEngine.getStudentHomework(params.id, status);
        return { success: true, data: homework };
    })

    // Submit homework
    .post('/:id/homework/:homeworkId/submit', async ({ params, body }) => {
        const { answers } = body as { answers: { questionId: string; answer: string | string[]; timeTaken: number }[] };

        try {
            const result = await HomeworkEngine.submitHomework(params.homeworkId, answers);
            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    })

    // Get student projects
    .get('/:id/projects', async ({ params }) => {
        const collection = getCollection(COLLECTIONS.PROJECTS);
        const projects = await collection.find({
            'teams.members': params.id,
        }).toArray();
        return { success: true, data: projects };
    });
