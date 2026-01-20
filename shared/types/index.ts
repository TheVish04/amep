// ================================
// USER TYPES
// ================================

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
    _id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
    classId?: string; // For students
    subjects?: string[]; // For teachers
    createdAt: Date;
    updatedAt: Date;
}

export interface Student extends User {
    role: 'student';
    classId: string;
    section: string;
    rollNumber: string;
}

export interface Teacher extends User {
    role: 'teacher';
    subjects: string[];
    classIds: string[];
}

export interface Admin extends User {
    role: 'admin';
    permissions: string[];
}

// ================================
// CONCEPT & CURRICULUM TYPES
// ================================

export interface Concept {
    _id: string;
    name: string;
    description: string;
    subject: string;
    chapter: string;
    chapterNumber: number;
    gradeLevel: number; // Class 11 = 11
    prerequisites: string[]; // Concept IDs
    difficulty: 'easy' | 'medium' | 'hard';
    keywords: string[];
    createdAt: Date;
    updatedAt: Date;
}

// ================================
// QUESTION TYPES
// ================================

export type QuestionType = 'mcq' | 'poll' | 'true-false' | 'numeric';

export interface QuestionOption {
    id: string;
    text: string;
    isCorrect?: boolean;
}

export interface Question {
    _id: string;
    conceptId: string;
    type: QuestionType;
    text: string;
    options: QuestionOption[];
    correctAnswer: string | string[];
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    timeLimit: number; // in seconds
    explanation?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

// ================================
// MASTERY SCORE TYPES
// ================================

export interface MasteryScore {
    _id: string;
    studentId: string;
    conceptId: string;
    accuracy: number; // 0-100
    consistency: number; // 0-100
    speed: number; // 0-100
    overallScore: number; // Weighted: Accuracy(50%) + Consistency(30%) + Speed(20%)
    attempts: number;
    lastAttemptAt: Date;
    history: MasteryHistoryEntry[];
    createdAt: Date;
    updatedAt: Date;
}

export interface MasteryHistoryEntry {
    timestamp: Date;
    score: number;
    questionId: string;
    isCorrect: boolean;
    timeTaken: number; // in seconds
}

// ================================
// ENGAGEMENT TYPES
// ================================

export type EngagementLevel = 'green' | 'yellow' | 'red';

export interface EngagementLog {
    _id: string;
    sessionId: string;
    classId: string;
    teacherId: string;
    conceptId: string;
    timestamp: Date;
    participationRate: number; // 0-100
    engagementLevel: EngagementLevel;
    activeStudents: number;
    totalStudents: number;
    averageResponseTime: number; // in seconds
    correctResponseRate: number; // 0-100
}

export interface ClassEngagementState {
    sessionId: string;
    classId: string;
    currentLevel: EngagementLevel;
    participationRate: number;
    activeStudents: string[];
    lastUpdated: Date;
}

// ================================
// HOMEWORK TYPES
// ================================

export type HomeworkStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
export type HomeworkDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

export interface Homework {
    _id: string;
    studentId: string;
    conceptId: string;
    title: string;
    description: string;
    questions: string[]; // Question IDs
    difficulty: HomeworkDifficulty;
    dueDate: Date;
    status: HomeworkStatus;
    score?: number;
    completedAt?: Date;
    feedback?: string;
    adaptiveReason?: string; // Why this difficulty was assigned
    createdAt: Date;
    updatedAt: Date;
}

export interface HomeworkAssignment {
    studentId: string;
    masteryLevel: 'weak' | 'medium' | 'strong';
    assignedDifficulty: HomeworkDifficulty;
    questionCount: number;
}

// ================================
// PROJECT & SKILL TYPES
// ================================

export type ProjectStatus = 'planning' | 'in-progress' | 'review' | 'completed';

export interface Project {
    _id: string;
    title: string;
    description: string;
    conceptIds: string[];
    classId: string;
    teacherId: string;
    teamSize: number;
    teams: ProjectTeam[];
    startDate: Date;
    endDate: Date;
    status: ProjectStatus;
    rubric: ProjectRubric[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectTeam {
    id: string;
    name: string;
    members: string[]; // Student IDs
    leaderId: string;
    tasks: ProjectTask[];
    submissions: ProjectSubmission[];
}

export interface ProjectTask {
    id: string;
    title: string;
    description: string;
    assigneeId: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate: Date;
    completedAt?: Date;
}

export interface ProjectSubmission {
    id: string;
    type: 'file' | 'link' | 'text';
    content: string;
    submittedBy: string;
    submittedAt: Date;
    feedback?: string;
}

export interface ProjectRubric {
    skill: string;
    maxPoints: number;
    description: string;
}

// ================================
// SKILL SCORE TYPES
// ================================

export interface SkillScore {
    _id: string;
    studentId: string;
    projectId: string;
    skills: SkillRating[];
    peerReviews: PeerReview[];
    teacherReview?: TeacherReview;
    overallScore: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SkillRating {
    skill: string;
    score: number; // 0-100
    evidence: string[];
}

export interface PeerReview {
    reviewerId: string;
    ratings: SkillRating[];
    comment: string;
    submittedAt: Date;
}

export interface TeacherReview {
    ratings: SkillRating[];
    comment: string;
    submittedAt: Date;
}

// ================================
// ADMIN METRICS TYPES
// ================================

export interface AdminMetrics {
    _id: string;
    date: Date;
    institutionId: string;
    masteryRate: InstitutionMasteryRate;
    teacherAdoption: TeacherAdoptionMetrics;
    confidenceScore: number; // 0-100
    studentEngagement: StudentEngagementMetrics;
    alerts: AdminAlert[];
}

export interface InstitutionMasteryRate {
    overall: number;
    bySubject: Record<string, number>;
    byClass: Record<string, number>;
    trend: 'improving' | 'stable' | 'declining';
}

export interface TeacherAdoptionMetrics {
    totalTeachers: number;
    activeTeachers: number;
    adoptionRate: number;
    sessionsThisWeek: number;
    averageSessionDuration: number;
}

export interface StudentEngagementMetrics {
    totalStudents: number;
    activeStudents: number;
    averageParticipation: number;
    homeworkCompletionRate: number;
}

export interface AdminAlert {
    id: string;
    type: 'warning' | 'critical' | 'info';
    message: string;
    category: 'mastery' | 'engagement' | 'adoption' | 'system';
    timestamp: Date;
    resolved: boolean;
}

// ================================
// SOCKET.IO EVENT TYPES
// ================================

export interface ServerToClientEvents {
    // Session events
    'session:started': (data: SessionStartedPayload) => void;
    'session:ended': (data: SessionEndedPayload) => void;

    // Question events
    'question:pushed': (data: QuestionPushedPayload) => void;
    'question:results': (data: QuestionResultsPayload) => void;

    // Engagement events
    'engagement:update': (data: ClassEngagementState) => void;

    // Student events
    'student:mastery-update': (data: MasteryUpdatePayload) => void;
    'student:homework-assigned': (data: Homework) => void;
}

export interface ClientToServerEvents {
    // Session events
    'session:join': (data: JoinSessionPayload) => void;
    'session:leave': (data: LeaveSessionPayload) => void;

    // Question events
    'question:push': (data: PushQuestionPayload) => void;
    'question:answer': (data: AnswerQuestionPayload) => void;

    // Teacher events
    'teacher:request-engagement': (data: RequestEngagementPayload) => void;
}

// Socket Payloads
export interface SessionStartedPayload {
    sessionId: string;
    classId: string;
    teacherId: string;
    conceptId: string;
    startedAt: Date;
}

export interface SessionEndedPayload {
    sessionId: string;
    endedAt: Date;
    summary: {
        questionsAsked: number;
        averageEngagement: number;
        participationRate: number;
    };
}

export interface QuestionPushedPayload {
    sessionId: string;
    question: Question;
    pushedAt: Date;
    timeLimit: number;
}

export interface QuestionResultsPayload {
    questionId: string;
    totalResponses: number;
    correctResponses: number;
    optionDistribution: Record<string, number>;
    averageTime: number;
}

export interface MasteryUpdatePayload {
    studentId: string;
    conceptId: string;
    newScore: number;
    previousScore: number;
    change: number;
}

export interface JoinSessionPayload {
    sessionId: string;
    userId: string;
    role: UserRole;
}

export interface LeaveSessionPayload {
    sessionId: string;
    userId: string;
}

export interface PushQuestionPayload {
    sessionId: string;
    questionId: string;
    timeLimit?: number;
}

export interface AnswerQuestionPayload {
    sessionId: string;
    questionId: string;
    studentId: string;
    answer: string | string[];
    timeTaken: number;
}

export interface RequestEngagementPayload {
    classId: string;
    sessionId: string;
}

// ================================
// API RESPONSE TYPES
// ================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
