import Elysia from 'elysia';
import { getCollection, COLLECTIONS } from '../db/connection';
import type { Concept, Question } from '@amep/shared';
import { ObjectId } from 'mongodb';

export const conceptRoutes = new Elysia({ prefix: '/api/concepts' })
    // Get all concepts
    .get('/', async ({ query }) => {
        const collection = getCollection<Concept>(COLLECTIONS.CONCEPTS);
        const filter: any = {};

        if (query.subject) filter.subject = query.subject;
        if (query.chapter) filter.chapter = query.chapter;
        if (query.gradeLevel) filter.gradeLevel = parseInt(query.gradeLevel as string);

        const concepts = await collection.find(filter).sort({ chapterNumber: 1, name: 1 }).toArray();
        return { success: true, data: concepts };
    })

    // Get concept by ID
    .get('/:id', async ({ params }) => {
        const collection = getCollection<Concept>(COLLECTIONS.CONCEPTS);
        const concept = await collection.findOne({ _id: new ObjectId(params.id) as any });

        if (!concept) {
            return { success: false, error: 'Concept not found' };
        }
        return { success: true, data: concept };
    })

    // Get concepts by chapter
    .get('/chapter/:chapterNumber', async ({ params }) => {
        const collection = getCollection<Concept>(COLLECTIONS.CONCEPTS);
        const concepts = await collection.find({
            chapterNumber: parseInt(params.chapterNumber)
        }).toArray();
        return { success: true, data: concepts };
    });

export const questionRoutes = new Elysia({ prefix: '/api/questions' })
    // Get questions
    .get('/', async ({ query }) => {
        const collection = getCollection<Question>(COLLECTIONS.QUESTIONS);
        const filter: any = {};

        if (query.conceptId) filter.conceptId = query.conceptId;
        if (query.difficulty) filter.difficulty = query.difficulty;
        if (query.type) filter.type = query.type;

        const limit = parseInt(query.limit as string) || 20;
        const questions = await collection.find(filter).limit(limit).toArray();

        // Remove correct answers for student view
        const safeQuestions = questions.map((q: any) => ({
            ...q,
            correctAnswer: undefined, // Don't expose correct answer
        }));

        return { success: true, data: safeQuestions };
    })

    // Get question by ID (with answer for teacher)
    .get('/:id', async ({ params, query }) => {
        const collection = getCollection<Question>(COLLECTIONS.QUESTIONS);
        const question = await collection.findOne({ _id: new ObjectId(params.id) as any });

        if (!question) {
            return { success: false, error: 'Question not found' };
        }

        // Only include answer if teacher
        if (query.includeAnswer !== 'true') {
            (question as any).correctAnswer = undefined;
        }

        return { success: true, data: question };
    })

    // Get questions by concept
    .get('/concept/:conceptId', async ({ params, query }) => {
        const collection = getCollection<Question>(COLLECTIONS.QUESTIONS);
        const filter: any = { conceptId: params.conceptId };

        if (query.difficulty) filter.difficulty = query.difficulty;

        const questions = await collection.find(filter).toArray();
        return { success: true, data: questions };
    })

    // Create question (teacher)
    .post('/', async ({ body }) => {
        const { conceptId, type, text, options, correctAnswer, difficulty, points, timeLimit, explanation, tags } = body as any;

        const collection = getCollection<Question>(COLLECTIONS.QUESTIONS);

        const question = {
            conceptId,
            type,
            text,
            options,
            correctAnswer,
            difficulty,
            points: points || (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30),
            timeLimit: timeLimit || 60,
            explanation,
            tags: tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(question as any);
        return { success: true, data: { id: result.insertedId.toString(), ...question } };
    });
