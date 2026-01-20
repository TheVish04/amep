const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'API request failed');
    }

    return data.data;
}

export const api = {
    // Auth
    login: (email: string, password: string) =>
        fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    // Student
    getStudentMastery: (studentId: string) =>
        fetchAPI(`/students/${studentId}/mastery`),

    getStudentHomework: (studentId: string, status?: string) =>
        fetchAPI(`/students/${studentId}/homework${status ? `?status=${status}` : ''}`),

    submitHomework: (studentId: string, homeworkId: string, answers: any[]) =>
        fetchAPI(`/students/${studentId}/homework/${homeworkId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers }),
        }),

    getGapAnalysis: (studentId: string) =>
        fetchAPI(`/students/${studentId}/gaps`),

    getProjects: (studentId: string) =>
        fetchAPI(`/students/${studentId}/projects`),

    // Concepts
    getConcepts: (params?: { subject?: string; chapter?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return fetchAPI(`/concepts${query ? `?${query}` : ''}`);
    },

    // Questions
    getQuestions: (conceptId: string, difficulty?: string) => {
        const params = new URLSearchParams({ conceptId });
        if (difficulty) params.append('difficulty', difficulty);
        return fetchAPI(`/questions?${params}`);
    },
};

export default api;
