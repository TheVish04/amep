import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { connectDB } from './db/connection';
import { setupSocketHandlers } from './socket/handlers';
import {
    studentRoutes,
    teacherRoutes,
    adminRoutes,
    authRoutes,
    conceptRoutes,
    questionRoutes,
} from './routes';

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
    // Connect to MongoDB
    await connectDB();

    // Create Elysia app
    const app = new Elysia()
        .use(cors({
            origin: process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
            credentials: true,
        }))
        // Health check
        .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
        // API routes
        .use(authRoutes)
        .use(studentRoutes)
        .use(teacherRoutes)
        .use(adminRoutes)
        .use(conceptRoutes)
        .use(questionRoutes);

    // Create HTTP server (Elysia handles extraction)
    // In Elysia, we attach Socket.IO to the native server after listening, 
    // or we can use a plugin pattern. 
    // However, simplest migration: Elysia listens, and we attach IO to that server instance.

    // Start Elysia
    const server = app.listen(PORT);

    // Setup Socket.IO on the same server instance
    const io = new Server(server.server, {
        cors: {
            origin: process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
            credentials: true,
        },
    });

    setupSocketHandlers(io);

    console.log(`Server running at http://localhost:${PORT}`);

    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║     █████╗ ███╗   ███╗███████╗██████╗                     ║
  ║    ██╔══██╗████╗ ████║██╔════╝██╔══██╗                    ║
  ║    ███████║██╔████╔██║█████╗  ██████╔╝                    ║
  ║    ██╔══██║██║╚██╔╝██║██╔══╝  ██╔═══╝                     ║
  ║    ██║  ██║██║ ╚═╝ ██║███████╗██║                         ║
  ║    ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝                         ║
  ║                                                           ║
  ║    Adaptive Mastery & Engagement Platform                 ║
  ║                                                           ║
  ╠═══════════════════════════════════════════════════════════╣
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

main().catch(console.error);
