import { useState, useEffect } from 'react';
import {
    Brain,
    Users,
    GraduationCap,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Activity,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import api from './lib/api';
import clsx from 'clsx';

export default function App() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    async function loadData() {
        try {
            const data = await api.getMetrics();
            setMetrics(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load metrics:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const confidenceScore = metrics?.confidenceScore || 0;
    const confidenceColor = confidenceScore >= 70 ? 'green' : confidenceScore >= 40 ? 'yellow' : 'red';

    // Mock trend data
    const trendData = [
        { name: 'Week 1', mastery: 45, engagement: 55 },
        { name: 'Week 2', mastery: 52, engagement: 60 },
        { name: 'Week 3', mastery: 58, engagement: 65 },
        { name: 'Week 4', mastery: 65, engagement: 72 },
        { name: 'Current', mastery: metrics?.masteryRate?.overall || 70, engagement: metrics?.studentEngagement?.averageParticipation || 75 },
    ];

    const adoptionData = [
        { name: 'Active', value: metrics?.teacherAdoption?.activeTeachers || 0 },
        { name: 'Inactive', value: (metrics?.teacherAdoption?.totalTeachers || 0) - (metrics?.teacherAdoption?.activeTeachers || 0) },
    ];

    const COLORS = ['#22c55e', '#374151'];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">GYANSETU Intelligence Cockpit</h1>
                    <p className="text-gray-400 mt-1">Institutional Learning Analytics Dashboard</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={loadData}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <RefreshCw size={20} className="text-gray-400" />
                    </button>
                </div>
            </header>

            {/* Confidence Score - Hero */}
            <div className="glass rounded-3xl p-8 mb-8 text-center animate-glow">
                <p className="text-gray-400 text-sm uppercase tracking-wider mb-4">Institutional Confidence Score</p>
                <div className={clsx(
                    'w-48 h-48 mx-auto rounded-full flex items-center justify-center mb-6 transition-all',
                    confidenceColor === 'green' && 'bg-gradient-to-br from-green-500 to-emerald-600',
                    confidenceColor === 'yellow' && 'bg-gradient-to-br from-yellow-500 to-amber-600',
                    confidenceColor === 'red' && 'bg-gradient-to-br from-red-500 to-rose-600'
                )}>
                    <span className="text-6xl font-bold text-white">{confidenceScore}</span>
                </div>
                <p className="text-xl font-semibold text-white mb-2">
                    {confidenceScore >= 70 && '✨ Excellent Learning Health'}
                    {confidenceScore >= 40 && confidenceScore < 70 && '⚡ Moderate - Room for Improvement'}
                    {confidenceScore < 40 && '🚨 Needs Immediate Attention'}
                </p>
                <p className="text-gray-400 max-w-md mx-auto">
                    Based on mastery rates, teacher adoption, homework completion, and engagement metrics.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Mastery Rate */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-primary-500/20 rounded-xl">
                            <Brain className="w-6 h-6 text-primary-400" />
                        </div>
                        <span className={clsx(
                            'text-xs px-2 py-1 rounded-full font-medium',
                            metrics?.masteryRate?.trend === 'improving' && 'bg-green-500/20 text-green-400',
                            metrics?.masteryRate?.trend === 'stable' && 'bg-gray-500/20 text-gray-400',
                            metrics?.masteryRate?.trend === 'declining' && 'bg-red-500/20 text-red-400'
                        )}>
                            {metrics?.masteryRate?.trend || 'stable'}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-white">{metrics?.masteryRate?.overall || 0}%</p>
                    <p className="text-sm text-gray-400 mt-1">Average Mastery Rate</p>
                </div>

                {/* Students */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <GraduationCap className="w-6 h-6 text-blue-400" />
                        </div>
                        <TrendingUp className="text-green-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-white">{metrics?.totalStudents || 0}</p>
                    <p className="text-sm text-gray-400 mt-1">Total Students</p>
                    <p className="text-xs text-green-400 mt-2">
                        {metrics?.studentEngagement?.activeStudents || 0} active this week
                    </p>
                </div>

                {/* Teacher Adoption */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <Users className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{metrics?.teacherAdoption?.adoptionRate || 0}%</p>
                    <p className="text-sm text-gray-400 mt-1">Teacher Adoption</p>
                    <p className="text-xs text-gray-500 mt-2">
                        {metrics?.teacherAdoption?.activeTeachers || 0} of {metrics?.teacherAdoption?.totalTeachers || 0} active
                    </p>
                </div>

                {/* Homework Completion */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{metrics?.studentEngagement?.homeworkCompletionRate || 0}%</p>
                    <p className="text-sm text-gray-400 mt-1">Homework Completion</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Learning Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="mastery"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#colorMastery)"
                                name="Mastery"
                            />
                            <Area
                                type="monotone"
                                dataKey="engagement"
                                stroke="#22c55e"
                                strokeWidth={2}
                                fill="url(#colorEngagement)"
                                name="Engagement"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Adoption Pie */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Teacher Adoption</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={adoptionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {adoptionData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-sm text-gray-400">Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-600" />
                            <span className="text-sm text-gray-400">Inactive</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {metrics?.alerts && metrics.alerts.length > 0 && (
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" size={20} />
                        Active Alerts
                    </h3>
                    <div className="space-y-3">
                        {metrics.alerts.map((alert: any, i: number) => (
                            <div
                                key={i}
                                className={clsx(
                                    'p-4 rounded-xl flex items-start gap-3',
                                    alert.type === 'warning' && 'bg-yellow-500/10 border border-yellow-500/20',
                                    alert.type === 'critical' && 'bg-red-500/10 border border-red-500/20',
                                    alert.type === 'info' && 'bg-blue-500/10 border border-blue-500/20'
                                )}
                            >
                                <AlertTriangle className={clsx(
                                    'flex-shrink-0 mt-0.5',
                                    alert.type === 'warning' && 'text-yellow-500',
                                    alert.type === 'critical' && 'text-red-500',
                                    alert.type === 'info' && 'text-blue-500'
                                )} size={18} />
                                <div>
                                    <p className="text-white">{alert.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(alert.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
