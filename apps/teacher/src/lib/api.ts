const API_BASE = '/api';

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
    // Teacher
    getClassMastery: (teacherId: string, classId: string, conceptId?: string) =>
        fetchAPI(`/teachers/${teacherId}/class/${classId}/mastery${conceptId ? `?conceptId=${conceptId}` : ''}`),

    getStudentClusters: (teacherId: string, classId: string) =>
        fetchAPI(`/teachers/${teacherId}/class/${classId}/clusters`),

    getEngagementTrends: (teacherId: string, classId: string, days?: number) =>
        fetchAPI(`/teachers/${teacherId}/class/${classId}/engagement${days ? `?days=${days}` : ''}`),

    getClassInsights: (teacherId: string, classId: string) =>
        fetchAPI(`/teachers/${teacherId}/class/${classId}/insights`),

    assignHomework: (teacherId: string, classId: string, data: { conceptId: string; title: string; dueDays?: number }) =>
        fetchAPI(`/teachers/${teacherId}/class/${classId}/homework`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getHomeworkStats: (teacherId: string, classId: string) =>
        fetchAPI(`/teachers/${teacherId}/class/${classId}/homework/stats`),

    generateQuestions: (teacherId: string, concept: string, difficulty: string, count?: number) =>
        fetchAPI(`/teachers/${teacherId}/questions/generate`, {
            method: 'POST',
            body: JSON.stringify({ concept, difficulty, count }),
        }),

    createProject: (teacherId: string, data: any) =>
        fetchAPI(`/teachers/${teacherId}/projects`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Concepts & Questions
    getConcepts: (params?: { subject?: string; chapter?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return fetchAPI(`/concepts${query ? `?${query}` : ''}`);
    },

    getQuestions: (conceptId: string, difficulty?: string) => {
        const params = new URLSearchParams({ conceptId });
        if (difficulty) params.append('difficulty', difficulty);
        return fetchAPI(`/questions?${params}&includeAnswer=true`);
    },
};

export default api;
