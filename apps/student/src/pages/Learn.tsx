import { useState, useEffect, useCallback } from 'react';
import { Play, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import clsx from 'clsx';

interface LearnProps {
    userId: string;
}

export default function Learn({ userId }: LearnProps) {
    const { activeQuestion, submitAnswer, questionResults, isConnected } = useSocket();
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Timer countdown
    useEffect(() => {
        if (!activeQuestion || hasSubmitted) return;

        setTimeLeft(activeQuestion.timeLimit);
        setStartTime(Date.now());
        setSelectedAnswer(null);
        setHasSubmitted(false);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [activeQuestion]);

    const handleSubmit = useCallback(() => {
        if (!selectedAnswer || !activeQuestion || hasSubmitted) return;

        const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
        submitAnswer(activeQuestion.question._id, userId, selectedAnswer, timeTaken);
        setHasSubmitted(true);
    }, [selectedAnswer, activeQuestion, startTime, submitAnswer, userId, hasSubmitted]);

    // Auto-submit when time runs out
    useEffect(() => {
        if (timeLeft === 0 && activeQuestion && !hasSubmitted && selectedAnswer) {
            handleSubmit();
        }
    }, [timeLeft, handleSubmit, activeQuestion, hasSubmitted, selectedAnswer]);

    // Waiting state
    if (!activeQuestion) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <Play className="w-10 h-10 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Learn?</h2>
                    <p className="text-gray-500 mb-6">
                        {isConnected
                            ? "Waiting for your teacher to push a question..."
                            : "Connecting to the learning session..."}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <div className={clsx(
                            'w-3 h-3 rounded-full animate-pulse',
                            isConnected ? 'bg-green-500' : 'bg-yellow-500'
                        )} />
                        <span className="text-sm text-gray-500">
                            {isConnected ? 'Connected & Waiting' : 'Connecting...'}
                        </span>
                    </div>
                </div>

                {/* Practice Mode Placeholder */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white card-hover cursor-pointer">
                        <Zap className="w-8 h-8 mb-4" />
                        <h3 className="font-semibold text-lg">Quick Practice</h3>
                        <p className="text-sm opacity-80 mt-1">5 random questions to warm up</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white card-hover cursor-pointer">
                        <CheckCircle className="w-8 h-8 mb-4" />
                        <h3 className="font-semibold text-lg">Focus Mode</h3>
                        <p className="text-sm opacity-80 mt-1">Practice your weak concepts</p>
                    </div>
                </div>
            </div>
        );
    }

    const question = activeQuestion.question;
    const isCorrect = questionResults?.correctResponses > 0 && hasSubmitted;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Timer Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={18} />
                        <span className="font-medium">{timeLeft}s remaining</span>
                    </div>
                    {hasSubmitted && (
                        <span className={clsx(
                            'px-3 py-1 rounded-full text-sm font-medium',
                            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                        </span>
                    )}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={clsx(
                            'h-full rounded-full transition-all duration-1000',
                            timeLeft > 30 ? 'bg-green-500' :
                                timeLeft > 10 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${(timeLeft / activeQuestion.timeLimit) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)} • {question.points} points
                    </span>
                    <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                        {question.text}
                    </h2>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {question.options.map((option: any) => {
                        const isSelected = selectedAnswer === option.id;
                        const showResult = hasSubmitted && questionResults;
                        const isCorrectOption = showResult && option.id === question.correctAnswer;
                        const isWrongSelection = showResult && isSelected && !isCorrectOption;

                        return (
                            <button
                                key={option.id}
                                onClick={() => !hasSubmitted && setSelectedAnswer(option.id)}
                                disabled={hasSubmitted}
                                className={clsx(
                                    'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                                    !hasSubmitted && isSelected && 'border-primary-500 bg-primary-50',
                                    !hasSubmitted && !isSelected && 'border-gray-200 hover:border-primary-300 hover:bg-gray-50',
                                    hasSubmitted && isCorrectOption && 'border-green-500 bg-green-50',
                                    hasSubmitted && isWrongSelection && 'border-red-500 bg-red-50',
                                    hasSubmitted && !isCorrectOption && !isWrongSelection && 'border-gray-200 opacity-50'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={clsx(
                                        'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm',
                                        !hasSubmitted && isSelected && 'bg-primary-500 text-white',
                                        !hasSubmitted && !isSelected && 'bg-gray-200 text-gray-600',
                                        hasSubmitted && isCorrectOption && 'bg-green-500 text-white',
                                        hasSubmitted && isWrongSelection && 'bg-red-500 text-white',
                                        hasSubmitted && !isCorrectOption && !isWrongSelection && 'bg-gray-200 text-gray-400'
                                    )}>
                                        {option.id}
                                    </span>
                                    <span className={clsx(
                                        'flex-1',
                                        hasSubmitted && !isCorrectOption && !isWrongSelection && 'text-gray-400'
                                    )}>
                                        {option.text}
                                    </span>
                                    {hasSubmitted && isCorrectOption && <CheckCircle className="w-5 h-5 text-green-500" />}
                                    {hasSubmitted && isWrongSelection && <XCircle className="w-5 h-5 text-red-500" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Submit Button */}
                {!hasSubmitted && (
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedAnswer}
                        className={clsx(
                            'w-full mt-6 py-4 rounded-xl font-semibold text-white transition-all duration-200',
                            selectedAnswer
                                ? 'bg-gradient-to-r from-primary-500 to-purple-500 hover:shadow-lg hover:shadow-primary-500/30'
                                : 'bg-gray-300 cursor-not-allowed'
                        )}
                    >
                        Submit Answer
                    </button>
                )}

                {/* Explanation */}
                {hasSubmitted && question.explanation && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm font-medium text-blue-800 mb-1">Explanation</p>
                        <p className="text-sm text-blue-700">{question.explanation}</p>
                    </div>
                )}

                {/* Results Stats */}
                {questionResults && (
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-bold text-gray-900">{questionResults.totalResponses}</p>
                            <p className="text-xs text-gray-500">Responses</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-bold text-green-600">
                                {Math.round((questionResults.correctResponses / questionResults.totalResponses) * 100)}%
                            </p>
                            <p className="text-xs text-gray-500">Correct</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-bold text-gray-900">{questionResults.averageTime}s</p>
                            <p className="text-xs text-gray-500">Avg Time</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
