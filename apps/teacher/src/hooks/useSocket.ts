import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@amep/shared';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSocket() {
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [engagementState, setEngagementState] = useState<any>(null);
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

        socket.on('engagement:update', (data) => {
            console.log('📊 Engagement update:', data);
            setEngagementState(data);
        });

        socket.on('question:results', (data) => {
            console.log('📊 Question results:', data);
            setQuestionResults(data);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const startSession = useCallback((newSessionId: string, userId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('session:join', {
                sessionId: newSessionId,
                userId,
                role: 'teacher',
            });
            setSessionId(newSessionId);
        }
    }, []);

    const endSession = useCallback((userId: string) => {
        if (socketRef.current && sessionId) {
            socketRef.current.emit('session:leave', {
                sessionId,
                userId,
            });
            setSessionId(null);
            setEngagementState(null);
        }
    }, [sessionId]);

    const pushQuestion = useCallback((questionId: string, timeLimit?: number) => {
        if (socketRef.current && sessionId) {
            socketRef.current.emit('question:push', {
                sessionId,
                questionId,
                timeLimit,
            });
        }
    }, [sessionId]);

    const requestEngagement = useCallback((classId: string) => {
        if (socketRef.current && sessionId) {
            socketRef.current.emit('teacher:request-engagement', {
                classId,
                sessionId,
            });
        }
    }, [sessionId]);

    return {
        isConnected,
        sessionId,
        engagementState,
        questionResults,
        startSession,
        endSession,
        pushQuestion,
        requestEngagement,
    };
}
