import { Server, Socket } from 'socket.io';
import { MasteryEngine, EngagementEngine, HomeworkEngine } from '../engines';
import { getCollection, COLLECTIONS } from '../db/connection';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    JoinSessionPayload,
    LeaveSessionPayload,
    PushQuestionPayload,
    AnswerQuestionPayload,
    QuestionPushedPayload,
    QuestionResultsPayload,
    ClassEngagementState,
    Question,
} from '@amep/shared';
import { ObjectId } from 'mongodb';

// Session state tracking
interface SessionState {
    id: string;
    classId: string;
    teacherId: string;
    conceptId: string;
    students: Set<string>;
    activeQuestion: {
        questionId: string;
        pushedAt: Date;
        answers: Map<string, { answer: string | string[]; timeTaken: number; isCorrect: boolean }>;
    } | null;
    startedAt: Date;
}

const sessions: Map<string, SessionState> = new Map();

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Join session
        socket.on('session:join', async (data: JoinSessionPayload) => {
            const { sessionId, userId, role } = data;

            socket.join(sessionId);

            if (role === 'teacher') {
                // Teacher starting a session
                let session = sessions.get(sessionId);
                if (!session) {
                    session = {
                        id: sessionId,
                        classId: '', // Will be set from teacher data
                        teacherId: userId,
                        conceptId: '',
                        students: new Set(),
                        activeQuestion: null,
                        startedAt: new Date(),
                    };
                    sessions.set(sessionId, session);
                }

                console.log(`👨‍🏫 Teacher ${userId} started session ${sessionId}`);
            } else if (role === 'student') {
                // Student joining
                const session = sessions.get(sessionId);
                if (session) {
                    session.students.add(userId);

                    // Update engagement state
                    const engagementState = EngagementEngine.updateEngagementState(
                        sessionId,
                        session.classId,
                        Array.from(session.students),
                        session.students.size,
                        0,
                        0,
                        0
                    );

                    io.to(sessionId).emit('engagement:update', engagementState);
                    console.log(`👨‍🎓 Student ${userId} joined session ${sessionId}`);
                }
            }
        });

        // Leave session
        socket.on('session:leave', (data: LeaveSessionPayload) => {
            const { sessionId, userId } = data;

            socket.leave(sessionId);

            const session = sessions.get(sessionId);
            if (session) {
                session.students.delete(userId);

                // Update engagement
                const engagementState = EngagementEngine.updateEngagementState(
                    sessionId,
                    session.classId,
                    Array.from(session.students),
                    session.students.size,
                    0,
                    0,
                    0
                );

                io.to(sessionId).emit('engagement:update', engagementState);
            }
        });

        // Teacher pushes a question
        socket.on('question:push', async (data: PushQuestionPayload) => {
            const { sessionId, questionId, timeLimit = 60 } = data;

            const session = sessions.get(sessionId);
            if (!session) return;

            // Fetch question from database
            const questionCollection = getCollection<Question>(COLLECTIONS.QUESTIONS);
            const question = await questionCollection.findOne({ _id: new ObjectId(questionId) as any });

            if (!question) return;

            // Set active question
            session.activeQuestion = {
                questionId,
                pushedAt: new Date(),
                answers: new Map(),
            };

            // Update concept if from question
            session.conceptId = (question as any).conceptId;

            const payload: QuestionPushedPayload = {
                sessionId,
                question: { ...question, _id: (question as any)._id.toString() } as Question,
                pushedAt: new Date(),
                timeLimit,
            };

            io.to(sessionId).emit('question:pushed', payload);
            console.log(`❓ Question ${questionId} pushed to session ${sessionId}`);

            // Auto-close question after time limit
            setTimeout(async () => {
                if (session.activeQuestion?.questionId === questionId) {
                    await closeQuestion(io, session);
                }
            }, timeLimit * 1000);
        });

        // Student answers a question
        socket.on('question:answer', async (data: AnswerQuestionPayload) => {
            const { sessionId, questionId, studentId, answer, timeTaken } = data;

            const session = sessions.get(sessionId);
            if (!session || !session.activeQuestion || session.activeQuestion.questionId !== questionId) {
                return;
            }

            // Fetch question to check answer
            const questionCollection = getCollection<Question>(COLLECTIONS.QUESTIONS);
            const question = await questionCollection.findOne({ _id: new ObjectId(questionId) as any });

            if (!question) return;

            const isCorrect = Array.isArray((question as any).correctAnswer)
                ? JSON.stringify((question as any).correctAnswer.sort()) === JSON.stringify((answer as string[]).sort())
                : (question as any).correctAnswer === answer;

            // Store answer
            session.activeQuestion.answers.set(studentId, { answer, timeTaken, isCorrect });

            // Update mastery score in real-time
            const mastery = await MasteryEngine.updateMastery(
                studentId,
                session.conceptId,
                questionId,
                isCorrect,
                timeTaken
            );

            // Notify student of mastery update
            socket.emit('student:mastery-update', {
                studentId,
                conceptId: session.conceptId,
                newScore: mastery.overallScore,
                previousScore: mastery.overallScore, // Would need to track previous
                change: 0,
            });

            // Update engagement state
            const answers = session.activeQuestion.answers;
            const totalResponses = answers.size;
            const correctResponses = Array.from(answers.values()).filter(a => a.isCorrect).length;
            const avgTime = Array.from(answers.values()).reduce((sum, a) => sum + a.timeTaken, 0) / totalResponses;

            const engagementState = EngagementEngine.updateEngagementState(
                sessionId,
                session.classId,
                Array.from(session.students),
                session.students.size,
                correctResponses,
                totalResponses,
                avgTime
            );

            io.to(sessionId).emit('engagement:update', engagementState);

            console.log(`✅ Student ${studentId} answered question ${questionId} - ${isCorrect ? 'Correct' : 'Incorrect'}`);
        });

        // Teacher requests current engagement state
        socket.on('teacher:request-engagement', (data) => {
            const state = EngagementEngine.getEngagementState(data.sessionId);
            if (state) {
                socket.emit('engagement:update', state);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
}

async function closeQuestion(io: Server, session: SessionState): Promise<void> {
    if (!session.activeQuestion) return;

    const answers = session.activeQuestion.answers;
    const totalResponses = answers.size;
    const correctResponses = Array.from(answers.values()).filter(a => a.isCorrect).length;
    const avgTime = totalResponses > 0
        ? Array.from(answers.values()).reduce((sum, a) => sum + a.timeTaken, 0) / totalResponses
        : 0;

    // Calculate option distribution
    const optionDistribution: Record<string, number> = {};
    for (const [, data] of answers) {
        const answerStr = Array.isArray(data.answer) ? data.answer.join(',') : data.answer;
        optionDistribution[answerStr] = (optionDistribution[answerStr] || 0) + 1;
    }

    const results: QuestionResultsPayload = {
        questionId: session.activeQuestion.questionId,
        totalResponses,
        correctResponses,
        optionDistribution,
        averageTime: Math.round(avgTime),
    };

    io.to(session.id).emit('question:results', results);

    // Log engagement
    await EngagementEngine.logEngagement(
        session.id,
        session.classId,
        session.teacherId,
        session.conceptId,
        (totalResponses / session.students.size) * 100,
        totalResponses,
        session.students.size,
        avgTime,
        (correctResponses / totalResponses) * 100
    );

    session.activeQuestion = null;
}

export function endSession(sessionId: string): void {
    const session = sessions.get(sessionId);
    if (session) {
        EngagementEngine.clearEngagementState(sessionId);
        sessions.delete(sessionId);
    }
}
