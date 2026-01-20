import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * AI Integration Module
 * 
 * Uses OpenAI/GPT for:
 * - Gap analysis
 * - Learning recommendations
 * - Question generation
 * - Performance insights
 */

export interface GapAnalysisResult {
    weakConcepts: string[];
    recommendations: string[];
    suggestedPath: string[];
    estimatedTime: string;
}

export interface QuestionSuggestion {
    text: string;
    options: string[];
    correctAnswer: string;
    difficulty: 'easy' | 'medium' | 'hard';
    explanation: string;
}

/**
 * Analyze student's learning gaps based on mastery scores
 */
export async function analyzeGaps(
    studentName: string,
    masteryData: { concept: string; score: number }[],
    subject: string
): Promise<GapAnalysisResult> {
    const weakConcepts = masteryData
        .filter(m => m.score < 50)
        .sort((a, b) => a.score - b.score)
        .map(m => m.concept);

    const mediumConcepts = masteryData
        .filter(m => m.score >= 50 && m.score < 70)
        .map(m => m.concept);

    if (!process.env.OPENAI_API_KEY) {
        // Return mock data if no API key
        return {
            weakConcepts,
            recommendations: [
                `Focus on understanding the fundamentals of ${weakConcepts[0] || 'core concepts'}`,
                'Practice more problems with step-by-step solutions',
                'Review video explanations for visual learning',
            ],
            suggestedPath: weakConcepts.slice(0, 3),
            estimatedTime: '2-3 hours',
        };
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert ${subject} tutor analyzing a student's learning gaps. Provide actionable recommendations.`,
                },
                {
                    role: 'user',
                    content: `Student ${studentName} has the following mastery scores:
${masteryData.map(m => `- ${m.concept}: ${m.score}%`).join('\n')}

Identify weak areas and provide:
1. Top 3 concepts to focus on (prioritized)
2. Specific recommendations for improvement
3. Suggested learning path
4. Estimated time to improve

Respond in JSON format:
{
  "weakConcepts": ["concept1", "concept2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "suggestedPath": ["step1", "step2"],
  "estimatedTime": "X hours"
}`,
                },
            ],
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        return {
            weakConcepts: result.weakConcepts || weakConcepts,
            recommendations: result.recommendations || [],
            suggestedPath: result.suggestedPath || [],
            estimatedTime: result.estimatedTime || 'Unknown',
        };
    } catch (error) {
        console.error('AI gap analysis error:', error);
        return {
            weakConcepts,
            recommendations: ['Review foundational concepts', 'Practice regularly'],
            suggestedPath: weakConcepts.slice(0, 3),
            estimatedTime: '2-3 hours',
        };
    }
}

/**
 * Generate questions for a concept using AI
 */
export async function generateQuestions(
    concept: string,
    difficulty: 'easy' | 'medium' | 'hard',
    count: number = 5,
    subject: string = 'Physics'
): Promise<QuestionSuggestion[]> {
    if (!process.env.OPENAI_API_KEY) {
        // Return mock questions if no API key
        return [{
            text: `Sample question about ${concept}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            difficulty,
            explanation: 'This is a sample explanation.',
        }];
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert ${subject} teacher creating MCQ questions for NCERT Class 11. Generate clear, accurate questions.`,
                },
                {
                    role: 'user',
                    content: `Generate ${count} ${difficulty} MCQ questions about "${concept}" in ${subject}.

Each question should have:
- Clear question text
- 4 options (A, B, C, D)
- One correct answer
- Brief explanation

Respond in JSON format:
{
  "questions": [
    {
      "text": "question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "difficulty": "${difficulty}",
      "explanation": "why this is correct"
    }
  ]
}`,
                },
            ],
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        return result.questions || [];
    } catch (error) {
        console.error('AI question generation error:', error);
        return [];
    }
}

/**
 * Generate performance insights for a class
 */
export async function generateClassInsights(
    classData: {
        averageMastery: number;
        engagementLevel: string;
        weakestConcepts: string[];
        topPerformers: number;
        strugglingStudents: number;
    }
): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        return `Class is performing at ${classData.averageMastery}% mastery with ${classData.engagementLevel} engagement. Focus areas: ${classData.weakestConcepts.join(', ')}.`;
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an educational analyst providing insights for teachers.',
                },
                {
                    role: 'user',
                    content: `Analyze this class performance and provide 2-3 actionable insights:
- Average Mastery: ${classData.averageMastery}%
- Engagement Level: ${classData.engagementLevel}
- Weakest Concepts: ${classData.weakestConcepts.join(', ')}
- Top Performers: ${classData.topPerformers} students
- Struggling Students: ${classData.strugglingStudents} students

Keep the response concise and actionable.`,
                },
            ],
        });

        return completion.choices[0].message.content || 'Unable to generate insights.';
    } catch (error) {
        console.error('AI insights generation error:', error);
        return `Class is performing at ${classData.averageMastery}% mastery. Consider reviewing ${classData.weakestConcepts[0]}.`;
    }
}

/**
 * Generate personalized feedback for homework
 */
export async function generateHomeworkFeedback(
    score: number,
    concept: string,
    wrongAnswers: { question: string; studentAnswer: string; correctAnswer: string }[]
): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        if (score >= 80) return '🌟 Excellent work! Keep it up!';
        if (score >= 60) return '👍 Good effort! Review the incorrect answers.';
        return '📚 Keep practicing! Consider reviewing the concept material.';
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a supportive tutor providing encouraging, constructive feedback.',
                },
                {
                    role: 'user',
                    content: `A student scored ${score}% on homework about "${concept}".

Wrong answers:
${wrongAnswers.map(w => `Q: ${w.question}\nStudent answered: ${w.studentAnswer}\nCorrect: ${w.correctAnswer}`).join('\n\n')}

Provide brief, encouraging feedback with specific tips for improvement. Keep it under 100 words.`,
                },
            ],
        });

        return completion.choices[0].message.content || 'Keep practicing!';
    } catch (error) {
        console.error('AI feedback generation error:', error);
        return score >= 70 ? '👍 Good work!' : '📚 Keep practicing!';
    }
}
