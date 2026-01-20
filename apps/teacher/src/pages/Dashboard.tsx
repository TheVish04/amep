import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    Users,
    Target,
    Clock,
    ChevronRight,
    Brain,
    AlertTriangle,
    Radio
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../lib/api';
import clsx from 'clsx';

interface DashboardProps {
    userId: string;
    classId: string;
}

export default function Dashboard({ userId, classId }: DashboardProps) {
    const [mastery, setMastery] = useState<any[]>([]);
    const [clusters, setClusters] = useState<any>(null);
    const [insights, setInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [masteryData, clustersData, insightsData] = await Promise.all([
                    api.getClassMastery(userId, classId),
                    api.getStudentClusters(userId, classId),
                    api.getClassInsights(userId, classId),
                ]);
                setMastery(masteryData as any[]);
                setClusters(clustersData);
                setInsights(insightsData);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [userId, classId]);

    // Calculate overall stats
    const totalStudents = clusters ?
        clusters.weak.length + clusters.medium.length + clusters.strong.length : 0;

    const avgMastery = mastery.length > 0
        ? Math.round(mastery.reduce((sum, m) => sum + (m.averageScore || 0), 0) / mastery.length)
        : insights?.metrics?.averageMastery || 0;

    // Chart data
    const masteryChartData = mastery.slice(0, 8).map(m => ({
        name: m.conceptName?.split(' ').slice(0, 2).join(' ') || 'Concept',
        mastery: m.averageScore || 0,
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Class Mastery */}
                <div className="glass rounded-2xl p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-primary-500/20 rounded-xl">
                            <Brain className="w-6 h-6 text-primary-400" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{avgMastery}%</p>
                    <p className="text-sm text-gray-400 mt-1">Class Mastery</p>
                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                            style={{ width: `${avgMastery}%` }}
                        />
                    </div>
                </div>

                {/* Active Students */}
                <div className="glass rounded-2xl p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <Users className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalStudents}</p>
                    <p className="text-sm text-gray-400 mt-1">Total Students</p>
                    <p className="text-xs text-green-400 mt-2">{clusters?.strong?.length || 0} performing well</p>
                </div>

                {/* Needs Attention */}
                <div className="glass rounded-2xl p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-500/20 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{clusters?.weak?.length || 0}</p>
                    <p className="text-sm text-gray-400 mt-1">Need Attention</p>
                    <p className="text-xs text-red-400 mt-2">Below 40% mastery</p>
                </div>

                {/* Sessions This Week */}
                <div className="glass rounded-2xl p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <Radio className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">5</p>
                    <p className="text-sm text-gray-400 mt-1">Sessions This Week</p>
                    <Link to="/session" className="text-xs text-primary-400 hover:underline mt-2 inline-flex items-center gap-1">
                        Start Session <ChevronRight size={12} />
                    </Link>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Concept Mastery */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Concept Mastery</h3>
                    {masteryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={masteryChartData}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white'
                                    }}
                                />
                                <Bar
                                    dataKey="mastery"
                                    fill="url(#colorGradient)"
                                    radius={[4, 4, 0, 0]}
                                />
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            No mastery data available
                        </div>
                    )}
                </div>

                {/* Student Clusters */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Student Clusters</h3>
                        <Link to="/students" className="text-sm text-primary-400 hover:underline flex items-center gap-1">
                            View All <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {/* Strong */}
                        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-green-400 font-medium">Strong (70%+)</span>
                                <span className="text-white font-bold">{clusters?.strong?.length || 0}</span>
                            </div>
                            <div className="flex -space-x-2">
                                {clusters?.strong?.slice(0, 5).map((s: any, i: number) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-medium"
                                        title={s.name}
                                    >
                                        {s.name?.charAt(0)}
                                    </div>
                                ))}
                                {(clusters?.strong?.length || 0) > 5 && (
                                    <div className="w-8 h-8 rounded-full bg-green-500/50 border-2 border-slate-900 flex items-center justify-center text-white text-xs">
                                        +{clusters.strong.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Medium */}
                        <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-yellow-400 font-medium">Medium (40-70%)</span>
                                <span className="text-white font-bold">{clusters?.medium?.length || 0}</span>
                            </div>
                            <div className="flex -space-x-2">
                                {clusters?.medium?.slice(0, 5).map((s: any, i: number) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 rounded-full bg-yellow-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-medium"
                                        title={s.name}
                                    >
                                        {s.name?.charAt(0)}
                                    </div>
                                ))}
                                {(clusters?.medium?.length || 0) > 5 && (
                                    <div className="w-8 h-8 rounded-full bg-yellow-500/50 border-2 border-slate-900 flex items-center justify-center text-white text-xs">
                                        +{clusters.medium.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weak */}
                        <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-red-400 font-medium">Needs Help (&lt;40%)</span>
                                <span className="text-white font-bold">{clusters?.weak?.length || 0}</span>
                            </div>
                            <div className="flex -space-x-2">
                                {clusters?.weak?.slice(0, 5).map((s: any, i: number) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 rounded-full bg-red-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-medium"
                                        title={s.name}
                                    >
                                        {s.name?.charAt(0)}
                                    </div>
                                ))}
                                {(clusters?.weak?.length || 0) > 5 && (
                                    <div className="w-8 h-8 rounded-full bg-red-500/50 border-2 border-slate-900 flex items-center justify-center text-white text-xs">
                                        +{clusters.weak.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            {insights && (
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                            <Brain className="w-6 h-6 text-primary-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">AI Class Insights</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{insights.insights}</p>
                </div>
            )}
        </div>
    );
}
