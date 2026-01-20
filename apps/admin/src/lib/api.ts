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
    // Admin
    getMetrics: () => fetchAPI('/admin/metrics'),
    getMasteryBreakdown: (groupBy: 'subject' | 'class' | 'chapter') =>
        fetchAPI(`/admin/mastery?groupBy=${groupBy}`),
    getTeacherLeaderboard: () => fetchAPI('/admin/teachers/leaderboard'),
    getSystemHealth: () => fetchAPI('/admin/health'),
};

export default api;
