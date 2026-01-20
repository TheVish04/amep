// ================================
// MASTERY ENGINE CONSTANTS
// ================================

export const MASTERY_WEIGHTS = {
    ACCURACY: 0.5,    // 50%
    CONSISTENCY: 0.3, // 30%
    SPEED: 0.2,       // 20%
} as const;

export const MASTERY_THRESHOLDS = {
    WEAK: 40,      // 0-40: Weak
    MEDIUM: 70,    // 41-70: Medium
    STRONG: 100,   // 71-100: Strong
} as const;

export const MASTERY_LEVELS = {
    WEAK: 'weak',
    MEDIUM: 'medium',
    STRONG: 'strong',
} as const;

// ================================
// ENGAGEMENT ENGINE CONSTANTS
// ================================

export const ENGAGEMENT_THRESHOLDS = {
    GREEN: 70,   // >= 70%: Green
    YELLOW: 40,  // 40-69%: Yellow
    RED: 0,      // < 40%: Red
} as const;

export const ENGAGEMENT_COLORS = {
    GREEN: '#22c55e',
    YELLOW: '#eab308',
    RED: '#ef4444',
} as const;

export const ENGAGEMENT_WEIGHTS = {
    PARTICIPATION: 0.4,      // 40%
    CORRECT_RESPONSES: 0.35, // 35%
    RESPONSE_TIME: 0.25,     // 25%
} as const;

// ================================
// HOMEWORK ENGINE CONSTANTS
// ================================

export const HOMEWORK_DIFFICULTY_MAP = {
    weak: {
        difficulty: 'easy',
        questionCount: 8,
        timeMultiplier: 1.5,
    },
    medium: {
        difficulty: 'medium',
        questionCount: 6,
        timeMultiplier: 1.0,
    },
    strong: {
        difficulty: 'hard',
        questionCount: 4,
        timeMultiplier: 0.8,
    },
} as const;

// ================================
// SKILL ENGINE CONSTANTS
// ================================

export const SOFT_SKILLS = [
    'Communication',
    'Collaboration',
    'Critical Thinking',
    'Problem Solving',
    'Creativity',
    'Leadership',
    'Time Management',
    'Adaptability',
] as const;

export const SKILL_WEIGHTS = {
    SELF_ASSESSMENT: 0.2,    // 20%
    PEER_REVIEW: 0.3,        // 30%
    TEACHER_REVIEW: 0.5,     // 50%
} as const;

// ================================
// NCERT CLASS 11 PHYSICS CHAPTERS
// ================================

export const NCERT_PHYSICS_11_CHAPTERS = [
    { number: 1, name: 'Physical World', concepts: ['Scientific Method', 'Physics Scope', 'Fundamental Forces'] },
    { number: 2, name: 'Units and Measurements', concepts: ['SI Units', 'Dimensional Analysis', 'Errors and Accuracy'] },
    { number: 3, name: 'Motion in a Straight Line', concepts: ['Distance vs Displacement', 'Speed vs Velocity', 'Acceleration', 'Equations of Motion'] },
    { number: 4, name: 'Motion in a Plane', concepts: ['Vectors', 'Projectile Motion', 'Circular Motion'] },
    { number: 5, name: 'Laws of Motion', concepts: ['Newtons First Law', 'Newtons Second Law', 'Newtons Third Law', 'Friction'] },
    { number: 6, name: 'Work, Energy and Power', concepts: ['Work', 'Kinetic Energy', 'Potential Energy', 'Conservation of Energy', 'Power'] },
    { number: 7, name: 'System of Particles and Rotational Motion', concepts: ['Center of Mass', 'Angular Momentum', 'Torque', 'Moment of Inertia'] },
    { number: 8, name: 'Gravitation', concepts: ['Universal Gravitation', 'Gravitational Potential', 'Keplers Laws', 'Satellite Motion'] },
    { number: 9, name: 'Mechanical Properties of Solids', concepts: ['Stress and Strain', 'Elastic Moduli', 'Hookes Law'] },
    { number: 10, name: 'Mechanical Properties of Fluids', concepts: ['Pressure', 'Buoyancy', 'Viscosity', 'Surface Tension'] },
    { number: 11, name: 'Thermal Properties of Matter', concepts: ['Temperature', 'Heat Transfer', 'Thermal Expansion', 'Specific Heat'] },
    { number: 12, name: 'Thermodynamics', concepts: ['First Law', 'Second Law', 'Heat Engines', 'Entropy'] },
    { number: 13, name: 'Kinetic Theory', concepts: ['Ideal Gas Law', 'Molecular Motion', 'Mean Free Path'] },
    { number: 14, name: 'Oscillations', concepts: ['Simple Harmonic Motion', 'Damped Oscillations', 'Forced Oscillations'] },
    { number: 15, name: 'Waves', concepts: ['Wave Motion', 'Sound Waves', 'Doppler Effect', 'Standing Waves'] },
] as const;

// ================================
// QUESTION CONSTANTS
// ================================

export const QUESTION_TIME_LIMITS = {
    easy: 60,    // 60 seconds
    medium: 90,  // 90 seconds
    hard: 120,   // 120 seconds
} as const;

export const QUESTION_POINTS = {
    easy: 10,
    medium: 20,
    hard: 30,
} as const;

// ================================
// SESSION CONSTANTS
// ================================

export const SESSION_CONFIG = {
    MAX_DURATION_MINUTES: 60,
    AUTO_END_INACTIVE_MINUTES: 15,
    MIN_STUDENTS_FOR_ENGAGEMENT: 3,
} as const;

// ================================
// UI CONSTANTS
// ================================

export const COLORS = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',
    dark: '#1e293b',
    light: '#f8fafc',
} as const;

export const GRADIENTS = {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    warning: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
} as const;

// ================================
// API ENDPOINTS
// ================================

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        ME: '/api/auth/me',
    },
    STUDENTS: {
        BASE: '/api/students',
        MASTERY: '/api/students/:id/mastery',
        HOMEWORK: '/api/students/:id/homework',
        PROJECTS: '/api/students/:id/projects',
    },
    TEACHERS: {
        BASE: '/api/teachers',
        SESSIONS: '/api/teachers/:id/sessions',
        QUESTIONS: '/api/teachers/:id/questions',
    },
    ADMIN: {
        METRICS: '/api/admin/metrics',
        REPORTS: '/api/admin/reports',
        ALERTS: '/api/admin/alerts',
    },
    CONCEPTS: {
        BASE: '/api/concepts',
        BY_CHAPTER: '/api/concepts/chapter/:chapter',
    },
    QUESTIONS: {
        BASE: '/api/questions',
        BY_CONCEPT: '/api/questions/concept/:conceptId',
    },
    SESSIONS: {
        BASE: '/api/sessions',
        ACTIVE: '/api/sessions/active',
    },
} as const;
