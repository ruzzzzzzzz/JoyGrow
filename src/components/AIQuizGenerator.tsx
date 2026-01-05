/**
 * Example: Using OpenAI Quiz Generation in a React Component
 */

import React, { useState } from 'react';
import { generateQuizzesWithAI } from '../api/quiz-ai-service';
import type { Quiz } from '../api/quiz-ai-service'; 

type QuizType = Quiz;

export function AIQuizGenerator() {
  const [material, setMaterial] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    if (!material.trim()) {
      setError('Please enter study material');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate 5 mixed-type quizzes
      const generatedQuizzes: QuizType[] = await generateQuizzesWithAI(
        material,
        'mixed', // or ['identification', 'fill_blank', 'true_false']
        5 // number of questions
      );

      setQuizzes(generatedQuizzes);
      console.log('✅ Generated quizzes:', generatedQuizzes);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate quizzes');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">AI Quiz Generator</h2>

      {/* Material Input */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Study Material:</label>
        <textarea
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          className="w-full h-40 p-3 border rounded"
          placeholder="Paste your study material here..."
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '🤖 Generating...' : '✨ Generate Quizzes'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Quiz Display */}
      {quizzes.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Generated Quizzes ({quizzes.length})</h3>
          {quizzes.map((quiz, index) => (
            <div key={quiz.id} className="mb-4 p-4 border rounded bg-white shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                  {quiz.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-gray-500 text-sm">Question {index + 1}</span>
              </div>

              <p className="font-medium mb-2">{quiz.question}</p>

              {/* Multiple Choice Options */}
              {quiz.type === 'multiple_choice' && quiz.options && (
                <ul className="ml-4 mb-2">
                  {quiz.options.map((opt, i) => (
                    <li
                      key={i}
                      className={opt === quiz.correct_answer ? 'text-green-600 font-medium' : ''}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </li>
                  ))}
                </ul>
              )}

              {/* Answer */}
              <div className="mt-2 p-2 bg-green-50 rounded">
                <strong className="text-green-700">Answer:</strong>{' '}
                {Array.isArray(quiz.correct_answer)
                  ? quiz.correct_answer.join(', ')
                  : quiz.correct_answer}
              </div>

              {/* Explanation */}
              <p className="mt-2 text-sm text-gray-600">
                <strong>Explanation:</strong> {quiz.explanation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AIQuizGenerator;
