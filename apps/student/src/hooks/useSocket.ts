import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@amep/shared';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSocket() {
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeQuestion, setActiveQuestion] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [engagementState, setEngagementState] = useState<any>(null);
    const [masteryUpdate, setMasteryUpdate] = useState<any>(null);
    const [questionResults, setQuestionResults] = useState<any>(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('🔌 Connected to server');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('🔌 Disconnected from server');
        });

        socket.on('question:pushed', (data) => {
            console.log('❓ Question received:', data);
            setActiveQuestion(data);
        });

        socket.on('question:results', (data) => {
            console.log('📊 Question results:', data);
            setQuestionResults(data);
            setTimeout(() => setActiveQuestion(null), 5000);
        });

        socket.on('engagement:update', (data) => {
            setEngagementState(data);
        });

        socket.on('student:mastery-update', (data) => {
            setMasteryUpdate(data);
        });

        socket.on('student:homework-assigned', (data) => {
            console.log('📚 New homework assigned:', data);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const joinSession = useCallback((newSessionId: string, userId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('session:join', {
                sessionId: newSessionId,
                userId,
                role: 'student',
            });
            setSessionId(newSessionId);
        }
    }, []);

    const leaveSession = useCallback((userId: string) => {
        if (socketRef.current && sessionId) {
            socketRef.current.emit('session:leave', {
                sessionId,
                userId,
            });
            setSessionId(null);
            setActiveQuestion(null);
        }
    }, [sessionId]);

    const submitAnswer = useCallback((questionId: string, studentId: string, answer: string | string[], timeTaken: number) => {
        if (socketRef.current && sessionId) {
            socketRef.current.emit('question:answer', {
                sessionId,
                questionId,
                studentId,
                answer,
                timeTaken,
            });
        }
    }, [sessionId]);

    return {
        isConnected,
        sessionId,
        activeQuestion,
        engagementState,
        masteryUpdate,
        questionResults,
        joinSession,
        leaveSession,
        submitAnswer,
    };
}
