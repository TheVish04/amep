import { getCollection, COLLECTIONS } from '../db/connection';
import { SOFT_SKILLS, SKILL_WEIGHTS } from '@amep/shared';
import type { SkillScore, SkillRating, PeerReview, TeacherReview, Project, ProjectTeam } from '@amep/shared';
import { ObjectId } from 'mongodb';

/**
 * PBL & Skill Engine
 * 
 * Manages project-based learning and soft skill scoring:
 * - Team formation
 * - Task tracking
 * - Peer review
 * - Skill scoring (weighted: Self 20%, Peer 30%, Teacher 50%)
 */
export class SkillEngine {
    /**
     * Create balanced teams from a list of students
     * Attempts to mix students with different mastery levels
     */
    static async formTeams(
        studentIds: string[],
        teamSize: number
    ): Promise<ProjectTeam[]> {
        const masteryCollection = getCollection(COLLECTIONS.MASTERY_SCORES);

        // Get average mastery for each student
        const studentMastery: { id: string; avgMastery: number }[] = [];

        for (const studentId of studentIds) {
            const scores = await masteryCollection.find({ studentId }).toArray();
            const avgMastery = scores.length > 0
                ? scores.reduce((sum, s: any) => sum + s.overallScore, 0) / scores.length
                : 50;
            studentMastery.push({ id: studentId, avgMastery });
        }

        // Sort by mastery level
        studentMastery.sort((a, b) => b.avgMastery - a.avgMastery);

        // Distribute students into teams (snake draft style for balance)
        const numTeams = Math.ceil(studentIds.length / teamSize);
        const teams: ProjectTeam[] = [];

        for (let i = 0; i < numTeams; i++) {
            teams.push({
                id: new ObjectId().toString(),
                name: `Team ${i + 1}`,
                members: [],
                leaderId: '',
                tasks: [],
                submissions: [],
            });
        }

        let direction = 1;
        let teamIndex = 0;

        for (const student of studentMastery) {
            teams[teamIndex].members.push(student.id);

            teamIndex += direction;
            if (teamIndex >= numTeams || teamIndex < 0) {
                direction *= -1;
                teamIndex += direction;
            }
        }

        // Assign highest mastery student as team leader
        for (const team of teams) {
            if (team.members.length > 0) {
                // First member has highest mastery due to sorting
                team.leaderId = team.members[0];
            }
        }

        return teams;
    }

    /**
     * Calculate skill score from self, peer, and teacher reviews
     */
    static calculateSkillScore(
        selfRatings: SkillRating[],
        peerReviews: PeerReview[],
        teacherReview?: TeacherReview
    ): { skills: SkillRating[]; overallScore: number } {
        const skillScores: Map<string, { self: number; peer: number[]; teacher: number }> = new Map();

        // Initialize with all soft skills
        for (const skill of SOFT_SKILLS) {
            skillScores.set(skill, { self: 0, peer: [], teacher: 0 });
        }

        // Add self ratings
        for (const rating of selfRatings) {
            const existing = skillScores.get(rating.skill);
            if (existing) {
                existing.self = rating.score;
            }
        }

        // Add peer ratings
        for (const review of peerReviews) {
            for (const rating of review.ratings) {
                const existing = skillScores.get(rating.skill);
                if (existing) {
                    existing.peer.push(rating.score);
                }
            }
        }

        // Add teacher ratings
        if (teacherReview) {
            for (const rating of teacherReview.ratings) {
                const existing = skillScores.get(rating.skill);
                if (existing) {
                    existing.teacher = rating.score;
                }
            }
        }

        // Calculate weighted scores
        const skills: SkillRating[] = [];
        let totalScore = 0;

        for (const [skill, scores] of skillScores) {
            const peerAvg = scores.peer.length > 0
                ? scores.peer.reduce((a, b) => a + b, 0) / scores.peer.length
                : 0;

            const weightedScore = Math.round(
                scores.self * SKILL_WEIGHTS.SELF_ASSESSMENT +
                peerAvg * SKILL_WEIGHTS.PEER_REVIEW +
                scores.teacher * SKILL_WEIGHTS.TEACHER_REVIEW
            );

            skills.push({
                skill,
                score: weightedScore,
                evidence: [],
            });

            totalScore += weightedScore;
        }

        const overallScore = skills.length > 0 ? Math.round(totalScore / skills.length) : 0;

        return { skills, overallScore };
    }

    /**
     * Submit self assessment for a project
     */
    static async submitSelfAssessment(
        studentId: string,
        projectId: string,
        ratings: SkillRating[]
    ): Promise<SkillScore> {
        const collection = getCollection<SkillScore>(COLLECTIONS.SKILL_SCORES);

        let skillScore = await collection.findOne({ studentId, projectId });

        if (skillScore) {
            await collection.updateOne(
                { _id: (skillScore as any)._id },
                {
                    $set: {
                        skills: ratings,
                        updatedAt: new Date(),
                    },
                }
            );
        } else {
            const newScore: Omit<SkillScore, '_id'> = {
                studentId,
                projectId,
                skills: ratings,
                peerReviews: [],
                overallScore: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const result = await collection.insertOne(newScore as any);
            skillScore = { _id: result.insertedId.toString(), ...newScore } as any;
        }

        return skillScore as unknown as SkillScore;
    }

    /**
     * Submit peer review for a team member
     */
    static async submitPeerReview(
        reviewerId: string,
        studentId: string,
        projectId: string,
        ratings: SkillRating[],
        comment: string
    ): Promise<void> {
        const collection = getCollection<SkillScore>(COLLECTIONS.SKILL_SCORES);

        const peerReview: PeerReview = {
            reviewerId,
            ratings,
            comment,
            submittedAt: new Date(),
        };

        let skillScore = await collection.findOne({ studentId, projectId });

        if (skillScore) {
            await collection.updateOne(
                { _id: (skillScore as any)._id },
                {
                    $push: { peerReviews: peerReview as any },
                    $set: { updatedAt: new Date() },
                }
            );
        } else {
            await collection.insertOne({
                studentId,
                projectId,
                skills: [],
                peerReviews: [peerReview],
                overallScore: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);
        }

        // Recalculate overall score
        await this.recalculateSkillScore(studentId, projectId);
    }

    /**
     * Submit teacher review
     */
    static async submitTeacherReview(
        studentId: string,
        projectId: string,
        ratings: SkillRating[],
        comment: string
    ): Promise<void> {
        const collection = getCollection<SkillScore>(COLLECTIONS.SKILL_SCORES);

        const teacherReview: TeacherReview = {
            ratings,
            comment,
            submittedAt: new Date(),
        };

        await collection.updateOne(
            { studentId, projectId },
            {
                $set: {
                    teacherReview,
                    updatedAt: new Date(),
                },
            },
            { upsert: true }
        );

        // Recalculate overall score
        await this.recalculateSkillScore(studentId, projectId);
    }

    /**
     * Recalculate skill score after new reviews
     */
    static async recalculateSkillScore(studentId: string, projectId: string): Promise<void> {
        const collection = getCollection<SkillScore>(COLLECTIONS.SKILL_SCORES);

        const skillScore = await collection.findOne({ studentId, projectId }) as any;
        if (!skillScore) return;

        const { skills, overallScore } = this.calculateSkillScore(
            skillScore.skills || [],
            skillScore.peerReviews || [],
            skillScore.teacherReview
        );

        await collection.updateOne(
            { _id: skillScore._id },
            {
                $set: {
                    skills,
                    overallScore,
                    updatedAt: new Date(),
                },
            }
        );
    }

    /**
     * Get skill scores for a student across all projects
     */
    static async getStudentSkillScores(studentId: string): Promise<SkillScore[]> {
        const collection = getCollection<SkillScore>(COLLECTIONS.SKILL_SCORES);
        return collection.find({ studentId }).toArray() as Promise<SkillScore[]>;
    }

    /**
     * Get aggregated skill profile for a student
     */
    static async getSkillProfile(
        studentId: string
    ): Promise<{ skill: string; averageScore: number; projectCount: number }[]> {
        const scores = await this.getStudentSkillScores(studentId);

        const skillAggregates: Map<string, { total: number; count: number }> = new Map();

        for (const score of scores) {
            for (const skillRating of score.skills) {
                const existing = skillAggregates.get(skillRating.skill) || { total: 0, count: 0 };
                existing.total += skillRating.score;
                existing.count++;
                skillAggregates.set(skillRating.skill, existing);
            }
        }

        return Array.from(skillAggregates.entries()).map(([skill, data]) => ({
            skill,
            averageScore: Math.round(data.total / data.count),
            projectCount: data.count,
        }));
    }
}
