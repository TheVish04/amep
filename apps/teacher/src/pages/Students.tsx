import { useEffect, useState } from 'react';
import {
    Search,
    TrendingUp,
    TrendingDown,
    Minus,
    User
} from 'lucide-react';
import api from '../lib/api';
import clsx from 'clsx';

interface StudentsProps {
    userId: string;
    classId: string;
}

export default function Students({ userId, classId }: StudentsProps) {
    const [clusters, setClusters] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await api.getStudentClusters(userId, classId);
                setClusters(data);
            } catch (error) {
                console.error('Failed to load students:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [userId, classId]);

    const allStudents = clusters
        ? [...clusters.strong, ...clusters.medium, ...clusters.weak]
        : [];

    const filteredStudents = allStudents.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getLevel = (score: number) => {
        if (score >= 70) return 'strong';
        if (score >= 40) return 'medium';
        return 'weak';
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
            {/* Search */}
            <div className="glass rounded-xl p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                    />
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-green-400">{clusters?.strong?.length || 0}</p>
                    <p className="text-sm text-gray-400">Strong</p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-yellow-400">{clusters?.medium?.length || 0}</p>
                    <p className="text-sm text-gray-400">Medium</p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-red-400">{clusters?.weak?.length || 0}</p>
                    <p className="text-sm text-gray-400">Needs Help</p>
                </div>
            </div>

            {/* Students Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left p-4 text-gray-400 font-medium">Student</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Mastery</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Concepts</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Trend</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((student, i) => {
                            const level = getLevel(student.averageMastery);
                            return (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium',
                                                level === 'strong' && 'bg-green-500',
                                                level === 'medium' && 'bg-yellow-500',
                                                level === 'weak' && 'bg-red-500'
                                            )}>
                                                {student.name?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{student.name || 'Student'}</p>
                                                <p className="text-sm text-gray-400">ID: {student.id?.slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-white/10 rounded-full max-w-[100px]">
                                                <div
                                                    className={clsx(
                                                        'h-full rounded-full',
                                                        level === 'strong' && 'bg-green-500',
                                                        level === 'medium' && 'bg-yellow-500',
                                                        level === 'weak' && 'bg-red-500'
                                                    )}
                                                    style={{ width: `${student.averageMastery}%` }}
                                                />
                                            </div>
                                            <span className="text-white font-medium">{student.averageMastery}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300">{student.conceptCount || 0} learned</td>
                                    <td className="p-4">
                                        {Math.random() > 0.5 ? (
                                            <TrendingUp className="text-green-400" size={20} />
                                        ) : Math.random() > 0.3 ? (
                                            <Minus className="text-gray-400" size={20} />
                                        ) : (
                                            <TrendingDown className="text-red-400" size={20} />
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx(
                                            'px-3 py-1 rounded-full text-xs font-medium',
                                            level === 'strong' && 'bg-green-500/20 text-green-400',
                                            level === 'medium' && 'bg-yellow-500/20 text-yellow-400',
                                            level === 'weak' && 'bg-red-500/20 text-red-400'
                                        )}>
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
