import { useState, useEffect } from 'react';
import {
    Radio,
    Send,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    Zap
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import api from '../lib/api';
import clsx from 'clsx';

interface SessionProps {
    userId: string;
    classId: string;
}

export default function Session({ userId, classId }: SessionProps) {
    const { isConnected, sessionId, engagementState, questionResults, pushQuestion } = useSocket();
    const [questions, setQuestions] = useState<any[]>([]);
    const [concepts, setConcepts] = useState<any[]>([]);
    const [selectedConcept, setSelectedConcept] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [pushedQuestion, setPushedQuestion] = useState<any>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const conceptsData = await api.getConcepts({ subject: 'Physics' });
                setConcepts(conceptsData as any[]);
            } catch (error) {
                console.error('Failed to load concepts:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        async function loadQuestions() {
            if (!selectedConcept) return;
            try {
                const questionsData = await api.getQuestions(selectedConcept);
                setQuestions(questionsData as any[]);
            } catch (error) {
                console.error('Failed to load questions:', error);
            }
        }
        loadQuestions();
    }, [selectedConcept]);

    const handlePushQuestion = (question: any) => {
        pushQuestion(question._id, question.timeLimit || 60);
        setPushedQuestion(question);
    };

    const getEngagementColor = () => {
        if (!engagementState) return 'gray';
        switch (engagementState.currentLevel) {
            case 'green': return 'green';
            case 'yellow': return 'yellow';
            case 'red': return 'red';
            default: return 'gray';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Panel */}
            <div className="lg:col-span-2 space-y-6">
                {/* Engagement Light */}
                <div className={clsx(
                    'glass rounded-2xl p-8 text-center transition-all duration-500',
                    engagementState?.currentLevel === 'green' && 'engagement-green',
                    engagementState?.currentLevel === 'yellow' && 'engagement-yellow',
                    engagementState?.currentLevel === 'red' && 'engagement-red'
                )}>
                    <div className={clsx(
                        'w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-500',
                        engagementState?.currentLevel === 'green' && 'bg-green-500',
                        engagementState?.currentLevel === 'yellow' && 'bg-yellow-500',
                        engagementState?.currentLevel === 'red' && 'bg-red-500',
                        !engagementState && 'bg-gray-600'
                    )}>
                        <span className="text-5xl font-bold text-white">
                            {engagementState ? `${Math.round(engagementState.participationRate)}%` : '--'}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {engagementState?.currentLevel === 'green' && '🎉 Class is Engaged!'}
                        {engagementState?.currentLevel === 'yellow' && '⚠️ Moderate Engagement'}
                        {engagementState?.currentLevel === 'red' && '🚨 Low Engagement'}
                        {!engagementState && 'Waiting for Activity...'}
                    </h3>
                    <div className="flex items-center justify-center gap-6 text-gray-400">
                        <div className="flex items-center gap-2">
                            <Users size={18} />
                            <span>{engagementState?.activeStudents?.length || 0} Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Radio size={18} />
                            <span>{isConnected ? 'Live' : 'Offline'}</span>
                        </div>
                    </div>
                </div>

                {/* Current Question */}
                {pushedQuestion && (
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Current Question</h3>
                            <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm flex items-center gap-1">
                                <Zap size={14} /> Live
                            </span>
                        </div>
                        <p className="text-gray-300 mb-4">{pushedQuestion.text}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {pushedQuestion.options?.map((opt: any) => (
                                <div
                                    key={opt.id}
                                    className={clsx(
                                        'p-3 rounded-lg border',
                                        opt.id === pushedQuestion.correctAnswer
                                            ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                            : 'border-white/10 text-gray-400'
                                    )}
                                >
                                    <span className="font-medium mr-2">{opt.id}.</span>
                                    {opt.text}
                                </div>
                            ))}
                        </div>

                        {/* Results */}
                        {questionResults && (
                            <div className="mt-6 grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-white/5 rounded-xl">
                                    <p className="text-2xl font-bold text-white">{questionResults.totalResponses}</p>
                                    <p className="text-xs text-gray-400">Responses</p>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-xl">
                                    <p className="text-2xl font-bold text-green-400">
                                        {Math.round((questionResults.correctResponses / questionResults.totalResponses) * 100) || 0}%
                                    </p>
                                    <p className="text-xs text-gray-400">Correct</p>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-xl">
                                    <p className="text-2xl font-bold text-white">{questionResults.averageTime}s</p>
                                    <p className="text-xs text-gray-400">Avg Time</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Question Bank */}
            <div className="glass rounded-2xl p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <h3 className="text-lg font-semibold text-white mb-4">Question Bank</h3>

                {/* Concept Selector */}
                <select
                    value={selectedConcept}
                    onChange={(e) => setSelectedConcept(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4 focus:outline-none focus:border-primary-500"
                >
                    <option value="">Select a concept...</option>
                    {concepts.map((concept: any) => (
                        <option key={concept._id} value={concept._id} className="bg-slate-800">
                            {concept.name}
                        </option>
                    ))}
                </select>

                {/* Questions List */}
                <div className="space-y-3">
                    {questions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {selectedConcept ? 'No questions found' : 'Select a concept to view questions'}
                        </div>
                    ) : (
                        questions.map((question: any) => (
                            <div
                                key={question._id}
                                className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <span className={clsx(
                                            'inline-block px-2 py-0.5 rounded text-xs font-medium mb-2',
                                            question.difficulty === 'easy' && 'bg-green-500/20 text-green-400',
                                            question.difficulty === 'medium' && 'bg-yellow-500/20 text-yellow-400',
                                            question.difficulty === 'hard' && 'bg-red-500/20 text-red-400'
                                        )}>
                                            {question.difficulty}
                                        </span>
                                        <p className="text-gray-300 text-sm line-clamp-2">{question.text}</p>
                                    </div>
                                    <button
                                        onClick={() => handlePushQuestion(question)}
                                        className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex-shrink-0"
                                        title="Push Question"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
