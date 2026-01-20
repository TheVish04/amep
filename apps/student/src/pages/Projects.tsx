import { useState, useEffect } from 'react';
import {
    Users,
    Calendar,
    CheckCircle,
    Clock,
    Upload,
    Star,
    MessageSquare
} from 'lucide-react';
import api from '../lib/api';
import clsx from 'clsx';

interface ProjectsProps {
    userId: string;
}

export default function Projects({ userId }: ProjectsProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProjects() {
            try {
                const data = await api.getProjects(userId);
                setProjects(data as any[]);
            } catch (error) {
                console.error('Failed to load projects:', error);
            } finally {
                setLoading(false);
            }
        }
        loadProjects();
    }, [userId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'planning': return 'bg-blue-100 text-blue-700';
            case 'in-progress': return 'bg-yellow-100 text-yellow-700';
            case 'review': return 'bg-purple-100 text-purple-700';
            case 'completed': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Projects Yet</h2>
                <p className="text-gray-500">
                    Your teacher will assign project-based learning activities here.
                    Check back later!
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="grid gap-6">
                {projects.map((project, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <span className={clsx(
                                    'inline-block px-3 py-1 rounded-full text-xs font-medium mb-2',
                                    getStatusColor(project.status)
                                )}>
                                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                </span>
                                <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                                <p className="text-gray-500 mt-1">{project.description}</p>
                            </div>
                        </div>

                        {/* Project Meta */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                            <span className="flex items-center gap-1">
                                <Users size={16} />
                                {project.teamSize} members
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={16} />
                                Due: {new Date(project.endDate).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Team Members */}
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Your Team</h4>
                            <div className="flex -space-x-2">
                                {Array(4).fill(0).map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 border-2 border-white flex items-center justify-center text-white text-sm font-medium"
                                    >
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                                <Upload size={16} />
                                Submit Work
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                <Star size={16} />
                                Self Assess
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                <MessageSquare size={16} />
                                Peer Review
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600">Project Progress</span>
                                <span className="font-medium text-gray-900">60%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-3/5 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
