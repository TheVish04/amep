# AMEP - Adaptive Mastery & Engagement Platform

A real-time, AI-powered Learning Intelligence Platform that measures understanding, personalizes learning, and converts classroom data into institutional intelligence.

## Quick Start

```bash
# Install dependencies
bun install

# Seed the database with NCERT Class 11 Physics content
bun run seed

# Run all apps in development
bun run dev:all
```

## Architecture

```
amep2/
├── shared/          # Shared types, constants, and utilities
├── server/          # Elysia backend with Socket.IO
└── apps/
    ├── student/     # Student learning app
    ├── teacher/     # Teacher control panel
    └── admin/       # Admin intelligence cockpit
```

## Core Intelligence Engines

1. **Mastery Score Engine**: `Accuracy(50%) + Consistency(30%) + Speed(20%)`
2. **Engagement Index**: Real-time class health (Green/Yellow/Red)
3. **Adaptive Homework Engine**: Personalized difficulty assignment
4. **Skill Engine**: PBL & soft skill scoring

## Tech Stack

- **Runtime**: Bun
- **Frontend**: React + Vite + Tailwind
- **Backend**: Elysia
- **Realtime**: Socket.IO
- **Database**: MongoDB
- **AI**: OpenAI / Gemini

## Environment Variables

Create a `.env` file in the server directory:

```env
MONGODB_URI=mongodb://localhost:27017/amep
OPENAI_API_KEY=your_key_here
PORT=3001
```

## License

MIT
