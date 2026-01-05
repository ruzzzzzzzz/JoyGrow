import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Lightbulb, RotateCcw, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { motion, AnimatePresence } from 'motion/react';
import { cleanQuestionText } from '../utils/questionFormatting';

interface Quiz {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'enumeration' | 'identification';
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  pairs?: { left: string; right: string }[];
  underlinedText?: string;
  correctReplacement?: string;
  fill_blank_answers?: string[];
}

interface QuizAttempt {
  id: string;
  date: Date;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeTaken: number;
  answers: { [key: string]: string | string[] };
  quizzes?: Quiz[];
}

interface WrongAnswerReviewProps {
  attempt: QuizAttempt;
  onBack: () => void;
  onRetakeWrongAnswers: (quizzes: Quiz[]) => void;
}

const QUESTION_TYPE_LABELS = {
  identification: 'Identification',
  multiple_choice: 'Multiple Choice',
  true_false: 'Modified True/False',
  fill_blank: 'Fill in the Blank',
  matching: 'Matching',
  enumeration: 'Enumeration',
};

const QUESTION_TYPE_ICONS = {
  identification: '🎯',
  multiple_choice: '✓',
  true_false: '⚖️',
  fill_blank: '📝',
  matching: '🔗',
  enumeration: '📋',
};

export function WrongAnswerReview({ attempt, onBack, onRetakeWrongAnswers }: WrongAnswerReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);

  if (!attempt.quizzes || attempt.quizzes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Quiz data not available for review.</p>
            <Button onClick={onBack} className="mt-4 bg-pink-500 hover:bg-pink-600">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter wrong answers
  const wrongAnswers = attempt.quizzes.filter(quiz => {
    const userAnswer = attempt.answers[quiz.id];
    const correctAnswer = quiz.correct_answer;
    return !isCorrectAnswer(userAnswer, correctAnswer, quiz.type);
  });

  if (wrongAnswers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl mb-2">Perfect Score!</h2>
            <p className="text-gray-600">You got all questions correct!</p>
            <Button onClick={onBack} className="mt-4 bg-pink-500 hover:bg-pink-600">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuiz = wrongAnswers[currentIndex];
  const userAnswer = attempt.answers[currentQuiz.id];
  const correctAnswer = currentQuiz.correct_answer;

  function isCorrectAnswer(userAnswer: string | string[] | undefined, correctAnswer: string | string[], questionType: string): boolean {
    if (!userAnswer) return false;

    if (questionType === 'enumeration' || questionType === 'fill_blank') {
      const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      const correctArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
      
      if (userArray.length !== correctArray.length) return false;
      
      return userArray.every((ans, idx) => 
        ans.toLowerCase().trim() === correctArray[idx].toLowerCase().trim()
      );
    }

    if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
      return JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort());
    }

    return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
  }

  const goToNext = () => {
    if (currentIndex < wrongAnswers.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(true);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowExplanation(true);
    }
  };

  const renderAnswer = (answer: string | string[] | undefined, isCorrect: boolean) => {
    if (!answer) return <span className="text-gray-400 italic">No answer provided</span>;

    if (Array.isArray(answer)) {
      return (
        <div className="space-y-1">
          {answer.map((ans, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              <span>{ans}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {isCorrect ? (
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        )}
        <span>{answer}</span>
      </div>
    );
  };

  const renderQuestionContent = () => {
    const cleanedQuestion = cleanQuestionText(currentQuiz.question);

    switch (currentQuiz.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <p className="text-lg">{cleanedQuestion}</p>
            <div className="space-y-2">
              {currentQuiz.options?.map((option, idx) => {
                const isUserAnswer = userAnswer === option;
                const isCorrectOption = option === correctAnswer;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 ${
                      isCorrectOption
                        ? 'border-green-500 bg-green-50'
                        : isUserAnswer
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCorrectOption && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {isUserAnswer && !isCorrectOption && <XCircle className="h-5 w-5 text-red-500" />}
                      <span className={isUserAnswer || isCorrectOption ? '' : 'text-gray-500'}>
                        {option}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-4">
            <p className="text-lg">{cleanedQuestion}</p>
            {currentQuiz.underlinedText && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 mb-1">Underlined portion:</p>
                <p className="font-semibold">{currentQuiz.underlinedText}</p>
              </div>
            )}
          </div>
        );

      case 'fill_blank':
        return (
          <div className="space-y-4">
            <p className="text-lg">{cleanedQuestion}</p>
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            <p className="text-lg">{cleanedQuestion}</p>
            {currentQuiz.pairs && (
              <div className="grid gap-2">
                {currentQuiz.pairs.map((pair, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="flex-1">{pair.left}</span>
                    <span className="text-gray-400">→</span>
                    <span className="flex-1">{pair.right}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'enumeration':
      case 'identification':
        return (
          <div className="space-y-4">
            <p className="text-lg">{cleanedQuestion}</p>
          </div>
        );

      default:
        return <p className="text-lg">{cleanedQuestion}</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              <div>
                <h1 className="text-2xl">Wrong Answer Review</h1>
                <p className="text-pink-100 text-sm">Learn from your mistakes</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => onRetakeWrongAnswers(wrongAnswers)}
              className="bg-white text-pink-600 hover:bg-pink-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake These
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Progress */}
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Question {currentIndex + 1} of {wrongAnswers.length} wrong answers
              </span>
              <span className="text-sm text-gray-600">
                {wrongAnswers.length} / {attempt.totalQuestions} incorrect
              </span>
            </div>
            <Progress value={((currentIndex + 1) / wrongAnswers.length) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {QUESTION_TYPE_ICONS[currentQuiz.type as keyof typeof QUESTION_TYPE_ICONS]}
                    </span>
                    <div>
                      <CardTitle className="text-lg">
                        {QUESTION_TYPE_LABELS[currentQuiz.type as keyof typeof QUESTION_TYPE_LABELS]}
                      </CardTitle>
                      <p className="text-sm text-gray-500">Review your answer</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Incorrect</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Question */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {renderQuestionContent()}
                </div>

                {/* Your Answer */}
                <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">Your Answer</span>
                  </div>
                  <div className="text-gray-700">
                    {renderAnswer(userAnswer, false)}
                  </div>
                </div>

                {/* Correct Answer */}
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700">Correct Answer</span>
                  </div>
                  <div className="text-gray-700">
                    {renderAnswer(correctAnswer, true)}
                  </div>
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-blue-50 rounded-lg p-4 border border-blue-200"
                    >
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-blue-700 mb-2">Explanation</h3>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {currentQuiz.explanation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="outline"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  {showExplanation ? 'Hide' : 'Show'} Explanation
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {currentIndex + 1} / {wrongAnswers.length}
          </span>
          <Button
            variant="outline"
            onClick={goToNext}
            disabled={currentIndex === wrongAnswers.length - 1}
            className="flex-1"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Study Tips */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
          <CardContent className="p-6">
            <h3 className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5" />
              Study Tips
            </h3>
            <ul className="space-y-2 text-sm text-pink-100">
              <li>• Take time to understand why your answer was incorrect</li>
              <li>• Read the explanation carefully and relate it to the question</li>
              <li>• Try to identify patterns in your mistakes</li>
              <li>• Review similar concepts in your study materials</li>
              <li>• Retake these questions after studying to reinforce learning</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}