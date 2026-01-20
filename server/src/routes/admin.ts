import Elysia from 'elysia';
import { getCollection, COLLECTIONS } from '../db/connection';
import type { AdminMetrics, User } from '@amep/shared';

export const adminRoutes = new Elysia({ prefix: '/api/admin' })
    // Get institution metrics
    .get('/metrics', async () => {
        const userCollection = getCollection<User>(COLLECTIONS.USERS);
        const masteryCollection = getCollection(COLLECTIONS.MASTERY_SCORES);
        const engagementCollection = getCollection(COLLECTIONS.ENGAGEMENT_LOGS);
        const homeworkCollection = getCollection(COLLECTIONS.HOMEWORK);
        const sessionCollection = getCollection(COLLECTIONS.SESSIONS);

        // Count users by role
        const students = await userCollection.countDocuments({ role: 'student' });
        const teachers = await userCollection.countDocuments({ role: 'teacher' });

        // Get recent engagement logs (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentEngagement = await engagementCollection.find({
            timestamp: { $gte: sevenDaysAgo },
        }).toArray();

        // Calculate teacher adoption
        const activeTeachers = new Set(recentEngagement.map((e: any) => e.teacherId));
        const adoptionRate = teachers > 0 ? Math.round((activeTeachers.size / teachers) * 100) : 0;

        // Calculate average engagement
        const avgEngagement = recentEngagement.length > 0
            ? Math.round(recentEngagement.reduce((sum, e: any) => sum + e.participationRate, 0) / recentEngagement.length)
            : 0;

        // Calculate mastery rate
        const allMastery = await masteryCollection.find({}).toArray();
        const avgMastery = allMastery.length > 0
            ? Math.round(allMastery.reduce((sum, m: any) => sum + m.overallScore, 0) / allMastery.length)
            : 0;

        // Calculate homework completion
        const totalHomework = await homeworkCollection.countDocuments({});
        const completedHomework = await homeworkCollection.countDocuments({ status: 'completed' });
        const homeworkCompletionRate = totalHomework > 0
            ? Math.round((completedHomework / totalHomework) * 100)
            : 0;

        // Calculate confidence score (weighted average of key metrics)
        const confidenceScore = Math.round(
            avgMastery * 0.4 +
            adoptionRate * 0.3 +
            homeworkCompletionRate * 0.2 +
            avgEngagement * 0.1
        );

        // Generate alerts
        const alerts: any[] = [];
        if (avgMastery < 50) {
            alerts.push({
                id: '1',
                type: 'warning',
                message: 'Average mastery below 50% - consider intervention strategies',
                category: 'mastery',
                timestamp: new Date(),
                resolved: false,
            });
        }
        if (adoptionRate < 60) {
            alerts.push({
                id: '2',
                type: 'warning',
                message: `Only ${activeTeachers.size} of ${teachers} teachers active this week`,
                category: 'adoption',
                timestamp: new Date(),
                resolved: false,
            });
        }

        const metrics = {
            totalStudents: students,
            totalTeachers: teachers,
            masteryRate: {
                overall: avgMastery,
                trend: avgMastery >= 60 ? 'improving' : avgMastery >= 40 ? 'stable' : 'declining',
            },
            teacherAdoption: {
                totalTeachers: teachers,
                activeTeachers: activeTeachers.size,
                adoptionRate,
                sessionsThisWeek: recentEngagement.length,
            },
            studentEngagement: {
                totalStudents: students,
                activeStudents: new Set(allMastery.map((m: any) => m.studentId)).size,
                averageParticipation: avgEngagement,
                homeworkCompletionRate,
            },
            confidenceScore,
            alerts,
        };

        return { success: true, data: metrics };
    })

    // Get mastery breakdown by subject/class
    .get('/mastery', async ({ query }) => {
        const groupBy = query.groupBy as 'subject' | 'class' | 'chapter';

        const masteryCollection = getCollection(COLLECTIONS.MASTERY_SCORES);
        const conceptCollection = getCollection(COLLECTIONS.CONCEPTS);
        const userCollection = getCollection<User>(COLLECTIONS.USERS);

        const allMastery = await masteryCollection.find({}).toArray();
        const concepts = await conceptCollection.find({}).toArray();
        const conceptMap = new Map(concepts.map((c: any) => [c._id.toString(), c]));

        const grouped: Map<string, number[]> = new Map();

        for (const m of allMastery) {
            const mastery = m as any;
            const concept = conceptMap.get(mastery.conceptId);
            if (!concept) continue;

            let key: string;
            switch (groupBy) {
                case 'subject':
                    key = concept.subject;
                    break;
                case 'chapter':
                    key = concept.chapter;
                    break;
                case 'class':
                default:
                    const student = await userCollection.findOne({ _id: mastery.studentId });
                    key = (student as any)?.classId || 'Unknown';
                    break;
            }

            const existing = grouped.get(key) || [];
            existing.push(mastery.overallScore);
            grouped.set(key, existing);
        }

        const result = Array.from(grouped.entries()).map(([key, scores]) => ({
            name: key,
            averageMastery: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            studentCount: scores.length,
        }));

        return { success: true, data: result };
    })

    // Get teacher leaderboard
    .get('/teachers/leaderboard', async () => {
        const engagementCollection = getCollection(COLLECTIONS.ENGAGEMENT_LOGS);
        const userCollection = getCollection<User>(COLLECTIONS.USERS);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentLogs = await engagementCollection.find({
            timestamp: { $gte: thirtyDaysAgo },
        }).toArray();

        const teacherStats: Map<string, { sessions: number; totalEngagement: number }> = new Map();

        for (const log of recentLogs) {
            const l = log as any;
            const existing = teacherStats.get(l.teacherId) || { sessions: 0, totalEngagement: 0 };
            existing.sessions++;
            existing.totalEngagement += l.participationRate;
            teacherStats.set(l.teacherId, existing);
        }

        const leaderboard = await Promise.all(
            Array.from(teacherStats.entries()).map(async ([teacherId, stats]) => {
                const teacher = await userCollection.findOne({ _id: teacherId as any });
                return {
                    teacherId,
                    teacherName: (teacher as any)?.name || 'Unknown',
                    sessions: stats.sessions,
                    avgEngagement: Math.round(stats.totalEngagement / stats.sessions),
                };
            })
        );

        leaderboard.sort((a, b) => b.sessions - a.sessions);

        return { success: true, data: leaderboard };
    })

    // Get system health
    .get('/health', async () => {
        const collections = [
            COLLECTIONS.USERS,
            COLLECTIONS.CONCEPTS,
            COLLECTIONS.QUESTIONS,
            COLLECTIONS.MASTERY_SCORES,
        ];

        const health: Record<string, number> = {};
        for (const col of collections) {
            const collection = getCollection(col);
            health[col] = await collection.countDocuments({});
        }

        return {
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date(),
                collections: health,
            },
        };
    });
