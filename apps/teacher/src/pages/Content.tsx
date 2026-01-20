import { useEffect, useState } from 'react';
import {
    BookOpen,
    Plus,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import api from '../lib/api';
import clsx from 'clsx';

interface ContentProps {
    userId: string;
}

export default function Content({ userId }: ContentProps) {
    const [concepts, setConcepts] = useState<any[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await api.getConcepts({ subject: 'Physics' });
                setConcepts(data as any[]);
            } catch (error) {
                console.error('Failed to load concepts:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Group by chapter
    const chapters = concepts.reduce((acc, concept) => {
        const chapterNum = concept.chapterNumber;
        if (!acc[chapterNum]) {
            acc[chapterNum] = {
                number: chapterNum,
                name: concept.chapter,
                concepts: [],
            };
        }
        acc[chapterNum].concepts.push(concept);
        return acc;
    }, {} as Record<number, any>);

    const chapterList = Object.values(chapters).sort((a: any, b: any) => a.number - b.number);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">NCERT Class 11 Physics</h2>
                    <p className="text-gray-400">{concepts.length} concepts across {chapterList.length} chapters</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                    <Sparkles size={18} />
                    Generate Questions
                </button>
            </div>

            {/* Chapters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapterList.map((chapter: any) => (
                    <div
                        key={chapter.number}
                        className={clsx(
                            'glass rounded-2xl p-6 cursor-pointer transition-all',
                            selectedChapter === chapter.number
                                ? 'ring-2 ring-primary-500'
                                : 'hover:bg-white/5'
                        )}
                        onClick={() => setSelectedChapter(
                            selectedChapter === chapter.number ? null : chapter.number
                        )}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-primary-500/20 rounded-xl">
                                <BookOpen className="w-6 h-6 text-primary-400" />
                            </div>
                            <span className="text-2xl font-bold text-white/20">
                                {String(chapter.number).padStart(2, '0')}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{chapter.name}</h3>
                        <p className="text-sm text-gray-400">{chapter.concepts.length} concepts</p>

                        {selectedChapter === chapter.number && (
                            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                {chapter.concepts.map((concept: any) => (
                                    <div
                                        key={concept._id}
                                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                                    >
                                        <span className="text-gray-300 text-sm">{concept.name}</span>
                                        <ChevronRight size={16} className="text-gray-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
