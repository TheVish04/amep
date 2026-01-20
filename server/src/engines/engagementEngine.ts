import { getCollection, COLLECTIONS } from '../db/connection';
import { ENGAGEMENT_THRESHOLDS, ENGAGEMENT_WEIGHTS } from '@amep/shared';
import type { EngagementLog, EngagementLevel, ClassEngagementState } from '@amep/shared';

/**
 * Engagement Index Engine
 * 
 * Computes class readiness:
 * >= 70% → GREEN (Class is engaged and ready)
 * 40-70% → YELLOW (Moderate engagement, needs attention)
 * < 40% → RED (Low engagement, intervention needed)
 */
export class EngagementEngine {
    // In-memory store for real-time engagement states
    private static engagementStates: Map<string, ClassEngagementState> = new Map();

    /**
     * Calculate engagement level based on score
     */
    static getEngagementLevel(score: number): EngagementLevel {
        if (score >= ENGAGEMENT_THRESHOLDS.GREEN) return 'green';
        if (score >= ENGAGEMENT_THRESHOLDS.YELLOW) return 'yellow';
        return 'red';
    }

    /**
     * Calculate engagement score for a class session
     */
    static calculateEngagementScore(
        participationRate: number,
        correctResponseRate: number,
        averageResponseTime: number,
        expectedResponseTime: number = 30
    ): number {
        // Normalize response time score (faster = higher)
        const responseTimeScore = Math.max(0, Math.min(100,
            ((expectedResponseTime * 2 - averageResponseTime) / expectedResponseTime) * 100
        ));

        return Math.round(
            participationRate * ENGAGEMENT_WEIGHTS.PARTICIPATION +
            correctResponseRate * ENGAGEMENT_WEIGHTS.CORRECT_RESPONSES +
            responseTimeScore * ENGAGEMENT_WEIGHTS.RESPONSE_TIME
        );
    }

    /**
     * Update engagement state for a session
     */
    static updateEngagementState(
        sessionId: string,
        classId: string,
        activeStudents: string[],
        totalStudents: number,
        correctResponses: number,
        totalResponses: number,
        averageResponseTime: number
    ): ClassEngagementState {
        const participationRate = totalStudents > 0
            ? (activeStudents.length / totalStudents) * 100
            : 0;

        const correctResponseRate = totalResponses > 0
            ? (correctResponses / totalResponses) * 100
            : 0;

        const engagementScore = this.calculateEngagementScore(
            participationRate,
            correctResponseRate,
            averageResponseTime
        );

        const state: ClassEngagementState = {
            sessionId,
            classId,
            currentLevel: this.getEngagementLevel(engagementScore),
            participationRate,
            activeStudents,
            lastUpdated: new Date(),
        };

        this.engagementStates.set(sessionId, state);
        return state;
    }

    /**
     * Get current engagement state for a session
     */
    static getEngagementState(sessionId: string): ClassEngagementState | undefined {
        return this.engagementStates.get(sessionId);
    }

    /**
     * Log engagement data to database
     */
    static async logEngagement(
        sessionId: string,
        classId: string,
        teacherId: string,
        conceptId: string,
        participationRate: number,
        activeStudents: number,
        totalStudents: number,
        averageResponseTime: number,
        correctResponseRate: number
    ): Promise<void> {
        const collection = getCollection<EngagementLog>(COLLECTIONS.ENGAGEMENT_LOGS);

        const engagementScore = this.calculateEngagementScore(
            participationRate,
            correctResponseRate,
            averageResponseTime
        );

        await collection.insertOne({
            sessionId,
            classId,
            teacherId,
            conceptId,
            timestamp: new Date(),
            participationRate,
            engagementLevel: this.getEngagementLevel(engagementScore),
            activeStudents,
            totalStudents,
            averageResponseTime,
            correctResponseRate,
        } as any);
    }

    /**
     * Get engagement trends for a class over time
     */
    static async getEngagementTrends(
        classId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        averageEngagement: number;
        sessionCount: number;
        trend: 'improving' | 'stable' | 'declining';
        timeline: { date: Date; level: EngagementLevel; score: number }[];
    }> {
        const collection = getCollection<EngagementLog>(COLLECTIONS.ENGAGEMENT_LOGS);

        const logs = await collection.find({
            classId,
            timestamp: { $gte: startDate, $lte: endDate },
        }).sort({ timestamp: 1 }).toArray();

        if (logs.length === 0) {
            return {
                averageEngagement: 0,
                sessionCount: 0,
                trend: 'stable',
                timeline: [],
            };
        }

        // Calculate scores for each log
        const timeline = logs.map((log: any) => {
            const score = this.calculateEngagementScore(
                log.participationRate,
                log.correctResponseRate,
                log.averageResponseTime
            );
            return {
                date: log.timestamp,
                level: log.engagementLevel,
                score,
            };
        });

        const totalScore = timeline.reduce((sum, t) => sum + t.score, 0);
        const averageEngagement = Math.round(totalScore / timeline.length);

        // Calculate trend (compare first half vs second half)
        const midpoint = Math.floor(timeline.length / 2);
        const firstHalfAvg = timeline.slice(0, midpoint).reduce((sum, t) => sum + t.score, 0) / midpoint || 0;
        const secondHalfAvg = timeline.slice(midpoint).reduce((sum, t) => sum + t.score, 0) / (timeline.length - midpoint) || 0;

        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (secondHalfAvg - firstHalfAvg > 5) trend = 'improving';
        else if (firstHalfAvg - secondHalfAvg > 5) trend = 'declining';

        return {
            averageEngagement,
            sessionCount: logs.length,
            trend,
            timeline,
        };
    }

    /**
     * Get students who need attention (consistently low engagement)
     */
    static async getStudentsNeedingAttention(
        classId: string,
        minSessions: number = 3
    ): Promise<{ studentId: string; avgParticipation: number; sessions: number }[]> {
        const collection = getCollection<EngagementLog>(COLLECTIONS.ENGAGEMENT_LOGS);

        // Get recent sessions for the class
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sessions = await collection.find({
            classId,
            timestamp: { $gte: thirtyDaysAgo },
        }).toArray();

        // Track participation per student
        const studentParticipation: Map<string, { sessions: number; participated: number }> = new Map();

        for (const session of sessions) {
            const activeSet = new Set((session as any).activeStudents || []);
            // Note: We'd need to cross-reference with class roster for full tracking
        }

        // For now, return empty - this would need class roster integration
        return [];
    }

    /**
     * Clear engagement state (when session ends)
     */
    static clearEngagementState(sessionId: string): void {
        this.engagementStates.delete(sessionId);
    }
}
