import Elysia from 'elysia';
import { getCollection, COLLECTIONS } from '../db/connection';
import { ObjectId } from 'mongodb';
import type { User } from '@amep/shared';

// Simple in-memory session store (use Redis in production)
const sessions: Map<string, { userId: string; role: string }> = new Map();

export const authRoutes = new Elysia({ prefix: '/api/auth' })
    // Login (simplified - use proper auth in production)
    .post('/login', async ({ body, set }) => {
        const { email, password } = body as { email: string; password: string };

        const collection = getCollection<User>(COLLECTIONS.USERS);
        const user = await collection.findOne({ email });

        if (!user) {
            set.status = 401;
            return { success: false, error: 'Invalid credentials' };
        }

        // In production, verify password hash
        // For demo, we just check email exists

        const sessionId = crypto.randomUUID();
        sessions.set(sessionId, { userId: (user as any)._id.toString(), role: (user as any).role });

        return {
            success: true,
            data: {
                sessionId,
                user: {
                    id: (user as any)._id.toString(),
                    name: (user as any).name,
                    email: (user as any).email,
                    role: (user as any).role,
                },
            },
        };
    })

    // Get current user
    .get('/me', async ({ headers, set }) => {
        const sessionId = headers.authorization?.replace('Bearer ', '');

        if (!sessionId || !sessions.has(sessionId)) {
            set.status = 401;
            return { success: false, error: 'Not authenticated' };
        }

        const session = sessions.get(sessionId)!;
        const collection = getCollection<User>(COLLECTIONS.USERS);
        const user = await collection.findOne({ _id: new ObjectId(session.userId) as any });

        if (!user) {
            set.status = 401;
            return { success: false, error: 'User not found' };
        }

        return {
            success: true,
            data: {
                id: (user as any)._id.toString(),
                name: (user as any).name,
                email: (user as any).email,
                role: (user as any).role,
            },
        };
    })

    // Logout
    .post('/logout', async ({ headers }) => {
        const sessionId = headers.authorization?.replace('Bearer ', '');

        if (sessionId) {
            sessions.delete(sessionId);
        }

        return { success: true };
    })

    // Register (for demo)
    .post('/register', async ({ body }) => {
        const { name, email, role, classId, section, rollNumber } = body as any;

        const collection = getCollection<User>(COLLECTIONS.USERS);

        // Check if user exists
        const existing = await collection.findOne({ email });
        if (existing) {
            return { success: false, error: 'Email already registered' };
        }

        const user = {
            name,
            email,
            role,
            classId,
            section,
            rollNumber,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(user as any);

        return {
            success: true,
            data: {
                id: result.insertedId.toString(),
                ...user,
            },
        };
    });
