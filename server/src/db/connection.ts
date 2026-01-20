import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/amep';

export async function connectDB(): Promise<Db> {
    if (db) return db;

    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db();
        console.log('✅ Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

export function getDB(): Db {
    if (!db) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return db;
}

export function getCollection<T extends Document>(name: string): Collection<T> {
    return getDB().collection<T>(name);
}

export async function disconnectDB(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Collection names
export const COLLECTIONS = {
    USERS: 'users',
    CONCEPTS: 'concepts',
    QUESTIONS: 'questions',
    MASTERY_SCORES: 'masteryScores',
    ENGAGEMENT_LOGS: 'engagementLogs',
    HOMEWORK: 'homework',
    PROJECTS: 'projects',
    SKILL_SCORES: 'skillScores',
    SESSIONS: 'sessions',
    ADMIN_METRICS: 'adminMetrics',
} as const;
