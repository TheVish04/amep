import { useState, useEffect } from 'react';
import {
    Clock,
    CheckCircle,
    AlertCircle,
    BookOpen,
    ChevronRight,
    Calendar,
    Target
} from 'lucide-react';
import api from '../lib/api';
import clsx from 'clsx';

interface HomeworkProps {
    userId: string;
}

export default function Homework({ userId }: HomeworkProps) {
    const [homework, setHomework] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHomework() {
            try {
                const data = await api.getStudentHomework(userId);
                setHomework(data as any[]);
            } catch (error) {
                console.error('Failed to load homework:', error);
            } finally {
                setLoading(false);
            }
        }
        loadHomework();
    }, [userId]);

    const pendingHomework = homework.filter(h => h.status === 'pending' || h.status === 'in-progress');
    const completedHomework = homework.filter(h => h.status === 'completed');
    const overdueHomework = homework.filter(h => h.status === 'overdue');

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = d.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days < 0) return 'Overdue';
        if (days === 0) return 'Due Today';
        if (days === 1) return 'Due Tomorrow';
        return `Due in ${days} days`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingHomework.length}</p>
                            <p className="text-sm text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{completedHomework.length}</p>
                            <p className="text-sm text-gray-500">Completed</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{overdueHomework.length}</p>
                            <p className="text-sm text-gray-500">Overdue</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={clsx(
                        'px-4 py-2 rounded-lg font-medium transition-colors',
                        activeTab === 'pending'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                >
                    Pending ({pendingHomework.length + overdueHomework.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={clsx(
                        'px-4 py-2 rounded-lg font-medium transition-colors',
                        activeTab === 'completed'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                >
                    Completed ({completedHomework.length})
                </button>
            </div>

            {/* Homework List */}
            <div className="space-y-4">
                {activeTab === 'pending' ? (
                    [...overdueHomework, ...pendingHomework].length > 0 ? (
                        [...overdueHomework, ...pendingHomework].map((hw, i) => (
                            <div
                                key={i}
                                className={clsx(
                                    'bg-white rounded-2xl p-6 shadow-sm border-2 card-hover cursor-pointer',
                                    hw.status === 'overdue' ? 'border-red-200' : 'border-gray-100'
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {hw.status === 'overdue' && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                    Overdue
                                                </span>
                                            )}
                                            <span className={clsx(
                                                'px-2 py-1 rounded-full text-xs font-medium',
                                                hw.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                                    hw.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        hw.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                                            'bg-purple-100 text-purple-700'
                                            )}>
                                                {hw.difficulty === 'adaptive' ? '🎯 Adaptive' : hw.difficulty}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">{hw.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{hw.description}</p>
                                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <BookOpen size={16} />
                                                {hw.questions?.length || 0} questions
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={16} />
                                                {formatDate(hw.dueDate)}
                                            </span>
                                        </div>
                                        {hw.adaptiveReason && (
                                            <p className="mt-3 text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                                                ✨ {hw.adaptiveReason}
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-gray-400" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No pending homework! Great job! 🎉</p>
                        </div>
                    )
                ) : (
                    completedHomework.length > 0 ? (
                        completedHomework.map((hw, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 opacity-80"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span className="text-sm font-medium text-green-600">
                                                Score: {hw.score}%
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">{hw.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{hw.description}</p>
                                        {hw.feedback && (
                                            <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                                <p className="text-sm text-green-700">{hw.feedback}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No completed homework yet.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
