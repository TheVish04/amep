import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    Target,
    BookOpen,
    Clock,
    Award,
    ChevronRight,
    Zap,
    Brain
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../lib/api';
import clsx from 'clsx';

interface DashboardProps {
    userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
    const [mastery, setMastery] = useState<any[]>([]);
    const [gaps, setGaps] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [masteryData, gapsData] = await Promise.all([
                    api.getStudentMastery(userId),
                    api.getGapAnalysis(userId),
                ]);
                setMastery(masteryData as any[]);
                setGaps(gapsData);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [userId]);

    // Calculate overall mastery
    const overallMastery = mastery.length > 0
        ? Math.round(mastery.reduce((sum, m) => sum + m.overallScore, 0) / mastery.length)
        : 0;

    // Mock data for charts
    const radarData = mastery.slice(0, 6).map(m => ({
        subject: m.conceptName?.split(' ').slice(0, 2).join(' ') || 'Concept',
        score: m.overallScore,
        fullMark: 100,
    }));

    const trendData = [
        { day: 'Mon', score: 65 },
        { day: 'Tue', score: 68 },
        { day: 'Wed', score: 72 },
        { day: 'Thu', score: 70 },
        { day: 'Fri', score: 75 },
        { day: 'Sat', score: 78 },
        { day: 'Today', score: overallMastery },
    ];

    const getMasteryColor = (score: number) => {
        if (score >= 70) return 'text-green-500';
        if (score >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getMasteryLabel = (score: number) => {
        if (score >= 70) return 'Strong';
        if (score >= 40) return 'Medium';
        return 'Needs Work';
    };

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
                {/* Overall Mastery */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-primary-100 rounded-xl">
                            <Brain className="w-6 h-6 text-primary-600" />
                        </div>
                        <span className={clsx('text-sm font-medium', getMasteryColor(overallMastery))}>
                            {getMasteryLabel(overallMastery)}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{overallMastery}%</p>
                    <p className="text-sm text-gray-500 mt-1">Overall Mastery</p>
                    <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${overallMastery}%` }}
                        />
                    </div>
                </div>

                {/* Concepts Mastered */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <Target className="w-6 h-6 text-green-600" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {mastery.filter(m => m.overallScore >= 70).length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Concepts Mastered</p>
                    <p className="text-xs text-gray-400 mt-2">out of {mastery.length} total</p>
                </div>

                {/* Learning Streak */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                            🔥 Hot!
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">7</p>
                    <p className="text-sm text-gray-500 mt-1">Day Streak</p>
                    <p className="text-xs text-gray-400 mt-2">Keep it going!</p>
                </div>

                {/* Study Time */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <Award className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">4.5h</p>
                    <p className="text-sm text-gray-500 mt-1">This Week</p>
                    <p className="text-xs text-gray-400 mt-2">+30% from last week</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mastery Radar */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Concept Mastery</h3>
                    {radarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Radar
                                    name="Mastery"
                                    dataKey="score"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No mastery data yet. Start learning!
                        </div>
                    )}
                </div>

                {/* Progress Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#colorScore)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Recommendations */}
            {gaps && (
                <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Brain className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold">AI Learning Insights</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium mb-2 opacity-90">Focus Areas</h4>
                            <ul className="space-y-2">
                                {gaps.weakConcepts?.slice(0, 3).map((concept: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <span className="w-2 h-2 bg-white/60 rounded-full" />
                                        {concept}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2 opacity-90">Recommendations</h4>
                            <ul className="space-y-2">
                                {gaps.recommendations?.slice(0, 3).map((rec: string, i: number) => (
                                    <li key={i} className="text-sm opacity-90">• {rec}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                        <span className="text-sm opacity-75">Estimated improvement time: {gaps.estimatedTime}</span>
                        <Link
                            to="/learn"
                            className="flex items-center gap-1 text-sm font-medium hover:underline"
                        >
                            Start Learning <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            )}

            {/* Concept List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Concepts</h3>
                    <Link to="/learn" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                        View All <ChevronRight size={16} />
                    </Link>
                </div>
                <div className="space-y-3">
                    {mastery.slice(0, 5).map((m, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className={clsx(
                                'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white',
                                m.overallScore >= 70 ? 'bg-green-500' :
                                    m.overallScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            )}>
                                {m.overallScore}%
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{m.conceptName}</p>
                                <p className="text-sm text-gray-500">{m.conceptChapter}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{m.attempts} attempts</p>
                                <p className="text-xs text-gray-500">{getMasteryLabel(m.overallScore)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
