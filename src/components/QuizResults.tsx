import { useState } from 'react';
import {
  Trophy,
  Star,
  Clock,
  Target,
  RotateCcw,
  Home,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { motion } from 'motion/react';
import { extractUnderlinedText, parseUnderlineMarkup } from '../utils/questionFormatting';

interface Quiz {
  id: string;
  type:
    | 'multiple_choice'
    | 'true_false'
    | 'fill_blank'
    | 'matching'
    | 'enumeration'
    | 'identification';
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  pairs?: { left: string; right: string }[];
  underlinedText?: string;
  correctReplacement?: string;
  // For Fill in the Blank questions - stores exact answers entered in editor
  fill_blank_answers?: string[];
}

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  answers: { [key: string]: string | string[] };
  score: number;
  quizzes?: Quiz[];
}

interface QuizResultsProps {
  results: QuizResults;
  onRetake: () => void;
  onHome: () => void;
  onBackToMaterials?: () => void;
}

export function QuizResults({
  results,
  onRetake,
  onHome,
  onBackToMaterials
}: QuizResultsProps) {
  // safety: if results is somehow missing, do not render
  if (!results) {
    return null;
  }

  const [showReview, setShowReview] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90)
      return {
        level: 'Excellent',
        color: 'text-green-600',
        bg: 'bg-green-50',
        emoji: '🏆'
      };
    if (score >= 80)
      return {
        level: 'Great',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        emoji: '⭐'
      };
    if (score >= 70)
      return {
        level: 'Good',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        emoji: '👍'
      };
    if (score >= 60)
      return {
        level: 'Fair',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        emoji: '📈'
      };
    return {
      level: 'Needs Improvement',
      color: 'text-red-600',
      bg: 'bg-red-50',
      emoji: '💪'
    };
  };

  const performance = getPerformanceLevel(results.score);
  const answersMap = results.answers || {};

  const statsData = [
    {
      icon: Target,
      label: 'Score',
      value: `${results.score}%`,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      icon: Trophy,
      label: 'Correct',
      value: `${results.correctAnswers}/${results.totalQuestions}`,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      icon: Clock,
      label: 'Time',
      value: formatTime(results.timeTaken),
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-16 pb-6">
      {/* Back Button */}
      {onBackToMaterials && (
        <Button variant="ghost" onClick={onBackToMaterials} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      {/* Celebration Header */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-6xl">{performance.emoji}</div>
        <div>
          <h1 className="text-3xl mb-2">Quiz Complete!</h1>
          <Badge
            className={`${performance.bg} ${performance.color} border-0 px-4 py-1`}
          >
            {performance.level}
          </Badge>
        </div>
      </motion.div>

      {/* Score Circle */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="transparent"
              stroke={
                results.score >= 80
                  ? '#10b981'
                  : results.score >= 60
                  ? '#f59e0b'
                  : '#ef4444'
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - results.score / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 56 * (1 - results.score / 100)
              }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">{results.score}%</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 text-center">
                <div
                  className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-gray-600 mb-1">{stat.label}</p>
                <p className={`${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Overall Accuracy</span>
                <span>{results.score}%</span>
              </div>
              <Progress value={results.score} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-green-600 mb-1">✅ Correct Answers</p>
                <p className="text-2xl">{results.correctAnswers}</p>
              </div>
              <div>
                <p className="text-red-600 mb-1">❌ Incorrect Answers</p>
                <p className="text-2xl">
                  {results.totalQuestions - results.correctAnswers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Motivational Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className={performance.bg}>
          <CardContent className="p-6 text-center">
            <p className={`${performance.color} mb-4`}>
              {results.score >= 90
                ? "Outstanding performance! You've mastered this topic! 🎉"
                : results.score >= 80
                ? "Great job! You're really getting the hang of this! 🌟"
                : results.score >= 70
                ? 'Good work! Keep practicing to improve even more! 📚'
                : results.score >= 60
                ? "You're on the right track! A bit more study will help you excel! 💡"
                : "Don't give up! Every attempt is a step closer to mastery! 🚀"}
            </p>
            <p className="text-gray-600">
              {results.score < 80
                ? 'Consider reviewing the material and trying again to reinforce your learning.'
                : "You're doing excellent! Ready for the next challenge?"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Review Answers Section */}
      {results.quizzes && results.quizzes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-pink-500" />
                  Review Your Answers
                </span>
                <Button
                  onClick={() => setShowReview(!showReview)}
                  className={`${
                    showReview
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-pink-500 hover:bg-pink-600 text-white'
                  } px-6 py-2 font-medium shadow-sm transition-all duration-200`}
                >
                  {showReview ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Hide Review
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Review
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            {showReview && (
              <CardContent className="space-y-4">
                {results.quizzes.map((quiz, index) => {
                  const userAnswer = answersMap[quiz.id];
                  let isCorrect = false;

                  // helper to normalize user answer to string
                  const toStr = (val: string | string[] | undefined): string => {
                    if (Array.isArray(val)) {
                      return (val[0] || '').toString();
                    }
                    return (val || '').toString();
                  };

                  // TRUE/FALSE
                  if (quiz.type === 'true_false') {
                    const correctAnswer =
                      typeof quiz.correct_answer === 'string'
                        ? quiz.correct_answer
                        : quiz.correct_answer[0];
                    const userAnswerStr = toStr(userAnswer);

                    if (correctAnswer === 'True') {
                      isCorrect = userAnswerStr === 'True';
                    } else if (correctAnswer === 'False' && quiz.correctReplacement) {
                      isCorrect =
                        userAnswerStr.toLowerCase().trim() ===
                        quiz.correctReplacement.toLowerCase().trim();
                    }
                  } else if (quiz.type === 'matching') {
                    const userArray = Array.isArray(userAnswer)
                      ? userAnswer
                      : userAnswer != null
                      ? [userAnswer]
                      : [];
                    const correctPairs = quiz.pairs || [];

                    isCorrect =
                      userArray.length === correctPairs.length &&
                      userArray.every((userPair: string) => {
                        const [userLeftRaw, userRightRaw] = (userPair || '')
                          .split(':')
                          .map((s) => (s || '').trim().toLowerCase());
                        return correctPairs.some((correctPair) => {
                          const left = correctPair?.left?.trim().toLowerCase();
                          const right = correctPair?.right?.trim().toLowerCase();
                          return left === userLeftRaw && right === userRightRaw;
                        });
                      });
                  } else if (quiz.type === 'enumeration') {
                    const correctArray = Array.isArray(quiz.correct_answer)
                      ? quiz.correct_answer
                      : [quiz.correct_answer];
                    const userArray = Array.isArray(userAnswer)
                      ? userAnswer
                      : userAnswer != null
                      ? [userAnswer]
                      : [];

                    isCorrect =
                      correctArray.length === userArray.length &&
                      correctArray.every((correct) =>
                        userArray.some(
                          (user) =>
                            user?.toLowerCase().trim() ===
                            correct.toLowerCase().trim()
                        )
                      );
                  } else if (quiz.type === 'fill_blank') {
                    const correctArray =
                      quiz.fill_blank_answers && quiz.fill_blank_answers.length > 0
                        ? quiz.fill_blank_answers
                        : Array.isArray(quiz.correct_answer)
                        ? quiz.correct_answer
                        : [quiz.correct_answer];

                    let userArray: string[] = [];
                    if (Array.isArray(userAnswer)) {
                      userArray = userAnswer.map((u) => u.toString());
                    } else if (typeof userAnswer === 'string') {
                      userArray = [userAnswer];
                    }

                    isCorrect =
                      correctArray.length === userArray.length &&
                      correctArray.every(
                        (correct, i) =>
                          (userArray[i] || '')
                            .toLowerCase()
                            .trim() === correct.toLowerCase().trim()
                      );
                  } else {
                    const correctAnswer =
                      typeof quiz.correct_answer === 'string'
                        ? quiz.correct_answer
                        : quiz.correct_answer[0];
                    const userAnswerStr = toStr(userAnswer);
                    isCorrect =
                      correctAnswer
                        ?.toLowerCase()
                        .trim() === userAnswerStr.toLowerCase().trim();
                  }

                  // render each question block (unchanged except for using userAnswer safely)
                  return (
                    <div
                      key={quiz.id}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Badge variant="outline" className="shrink-0">
                          Q{index + 1}
                        </Badge>
                        <div className="flex-1">
                          <p className="mb-2 text-gray-600 italic font-medium">
                            {quiz.type === 'multiple_choice' &&
                              'Multiple Choice Question'}
                            {quiz.type === 'true_false' &&
                              'Modified True/False Question'}
                            {quiz.type === 'fill_blank' &&
                              'Fill in the Blank Question'}
                            {quiz.type === 'matching' && 'Matching Question'}
                            {quiz.type === 'enumeration' &&
                              'Enumeration Question'}
                            {quiz.type === 'identification' &&
                              'Identification Question'}
                          </p>
                          {quiz.type !== 'true_false' && (
                            <p className="mb-3 text-gray-800">{quiz.question}</p>
                          )}
                          <Badge
                            className={
                              isCorrect ? 'bg-green-600' : 'bg-red-600'
                            }
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" /> Correct
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" /> Incorrect
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>

                      {/* Display options for multiple choice */}
                      {quiz.type === 'multiple_choice' && quiz.options && (
                        <div className="space-y-2 mb-3 ml-16">
                          {quiz.options.map((option, idx) => {
                            const isUserChoice = userAnswer === option;
                            const isCorrectOption = quiz.correct_answer === option;
                            return (
                              <div 
                                key={idx}
                                className={`p-2 rounded ${
                                  isCorrectOption 
                                    ? 'bg-green-100 border border-green-300' 
                                    : isUserChoice 
                                    ? 'bg-red-100 border border-red-300'
                                    : 'bg-white'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {isCorrectOption && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  {isUserChoice && !isCorrectOption && <XCircle className="w-4 h-4 text-red-600" />}
                                  {option}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Show user answer and correct answer */}
                      <div className="ml-16 space-y-2 text-sm">
                        {/* Special handling for Modified True/False */}
                        {quiz.type === 'true_false' && (
                          <>
                            {/* Full Statement Display */}
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                              <span className="text-gray-700 block mb-1">
                                <span className="font-semibold text-gray-800">Full Statement:</span>
                              </span>
                              <p className="text-gray-900 leading-relaxed">
                                {(() => {
                                  // Check if question has [UNDERLINE] markup from AI generation
                                  const hasMarkup = quiz.question.includes('[UNDERLINE]');
                                  
                                  if (hasMarkup) {
                                    // Parse and render the markup
                                    const { parts } = parseUnderlineMarkup(quiz.question);
                                    return (
                                      <>
                                        {parts.map((part, idx) => (
                                          part.isUnderlined ? (
                                            <strong key={idx} className="font-bold text-pink-600 bg-pink-100 px-1 py-0.5 rounded">
                                              {part.text}
                                            </strong>
                                          ) : (
                                            <span key={idx}>{part.text}</span>
                                          )
                                        ))}
                                      </>
                                    );
                                  }
                                  
                                  // Use underlinedText field for custom quizzes
                                  const keywordToHighlight = quiz.underlinedText || '';
                                  
                                  if (!keywordToHighlight || !quiz.question.includes(keywordToHighlight)) {
                                    return quiz.question;
                                  }
                                  
                                  return quiz.question.split(keywordToHighlight).map((part, idx, array) => {
                                    if (idx < array.length - 1) {
                                      return (
                                        <span key={idx}>
                                          {part}
                                          <strong className="font-bold text-pink-600 bg-pink-100 px-1 py-0.5 rounded">
                                            {keywordToHighlight}
                                          </strong>
                                        </span>
                                      );
                                    }
                                    return <span key={idx}>{part}</span>;
                                  });
                                })()}
                              </p>
                            </div>

                            {/* Your Answer Display */}
                            <div className={`p-3 rounded-lg border-2 ${
                              isCorrect 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-red-50 border-red-300'
                            }`}>
                              <span className={`font-semibold block mb-2 ${
                                isCorrect ? 'text-green-700' : 'text-red-700'
                              }`}>
                                Your Answer:
                              </span>
                              <div className="space-y-1">
                                {(() => {
                                  const correctAnswerValue = typeof quiz.correct_answer === 'string' ? quiz.correct_answer : quiz.correct_answer[0];
                                  const userAnswerStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
                                  
                                  // If correct answer is False, user should provide replacement word
                                  if (correctAnswerValue === 'False') {
                                    return (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-700">True/False:</span>
                                          <span className={`px-2 py-1 rounded font-medium ${
                                            userAnswerStr === 'True' 
                                              ? 'bg-gray-100 text-gray-900'
                                              : 'bg-blue-100 text-blue-900' 
                                          }`}>
                                            {userAnswerStr === 'True' ? 'True' : 'False'}
                                          </span>
                                        </div>
                                        {/* Only show replacement word field if user answered False (i.e., not True) */}
                                        {userAnswerStr !== 'True' && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-700">Replacement word:</span>
                                            <span className={`px-2 py-1 rounded font-medium ${
                                              isCorrect 
                                                ? 'bg-green-100 text-green-900' 
                                                : 'bg-red-100 text-red-900'
                                            }`}>
                                              {userAnswerStr || '(not provided)'}
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    );
                                  } else {
                                    // If correct answer is True, user just needs to select True
                                    return (
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-700">True/False:</span>
                                        <span className={`px-2 py-1 rounded font-medium ${
                                          isCorrect 
                                            ? 'bg-green-100 text-green-900' 
                                            : 'bg-red-100 text-red-900'
                                        }`}>
                                          {userAnswerStr || '(not answered)'}
                                        </span>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>

                            {/* Correct Answer Display */}
                            <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
                              <span className="font-semibold text-green-700 block mb-2">
                                Correct Answer:
                              </span>
                              <div className="space-y-1">
                                {(() => {
                                  const correctAnswerValue = typeof quiz.correct_answer === 'string' ? quiz.correct_answer : quiz.correct_answer[0];
                                  
                                  if (correctAnswerValue === 'False' && quiz.correctReplacement) {
                                    return (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-700">True/False:</span>
                                          <span className="px-2 py-1 rounded font-medium bg-green-100 text-green-900">
                                            False
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-700">Replacement word:</span>
                                          <span className="px-2 py-1 rounded font-medium bg-green-100 text-green-900">
                                            {quiz.correctReplacement}
                                          </span>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-green-200">
                                          <span className="text-gray-600 text-xs">
                                            The highlighted word "{quiz.underlinedText}" should be replaced with "{quiz.correctReplacement}"
                                          </span>
                                        </div>
                                      </>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-700">True/False:</span>
                                          <span className="px-2 py-1 rounded font-medium bg-green-100 text-green-900">
                                            True
                                          </span>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-green-200">
                                          <span className="text-gray-600 text-xs">
                                            The statement is true as written. The highlighted word "{quiz.underlinedText}" is correct.
                                          </span>
                                        </div>
                                      </>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Special handling for Matching type */}
                        {quiz.type === 'matching' && quiz.pairs && (
                          <>
                            {!isCorrect && userAnswer && Array.isArray(userAnswer) && (
                              <div className="p-2 bg-white rounded border border-gray-200">
                                <span className="text-blue-600 block mb-2">Your matches:</span>
                                <div className="space-y-1">
                                  {userAnswer.map((pair: string, idx: number) => {
                                    const [left, right] = (pair || '').split(':');
                                    const isThisPairCorrect = quiz.pairs?.some(correctPair => 
                                      correctPair?.left?.trim().toLowerCase() === left?.trim().toLowerCase() &&
                                      correctPair?.right?.trim().toLowerCase() === right?.trim().toLowerCase()
                                    );
                                    return (
                                      <div key={idx} className={`p-1.5 rounded ${isThisPairCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <span className="text-gray-700">
                                          {left || 'N/A'} → {right || 'N/A'}
                                          {isThisPairCorrect && <span className="ml-2 text-green-600">✓</span>}
                                          {!isThisPairCorrect && <span className="ml-2 text-red-600">✗</span>}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <div className="p-2 bg-green-50 rounded border border-green-200">
                              <span className="text-green-700 block mb-2">Correct matches:</span>
                              <div className="space-y-1">
                                {quiz.pairs.map((pair, idx) => (
                                  <div key={idx} className="p-1.5 bg-white rounded">
                                    <span className="text-gray-700">
                                      {pair?.left || 'N/A'} → {pair?.right || 'N/A'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Special handling for Fill in the Blank type */}
                        {quiz.type === 'fill_blank' && (() => {
                          // Use fill_blank_answers as the source of truth if available
                          const correctArray = quiz.fill_blank_answers && quiz.fill_blank_answers.length > 0
                            ? quiz.fill_blank_answers
                            : (Array.isArray(quiz.correct_answer) ? quiz.correct_answer : [quiz.correct_answer]);
                          
                          // Normalize user answers to array
                          let userArray: string[] = [];
                          if (Array.isArray(userAnswer)) {
                            userArray = userAnswer;
                          } else if (typeof userAnswer === 'string') {
                            // If user answer is a string, it might be a single answer
                            userArray = [userAnswer];
                          }
                          
                          // Determine if we should show per-blank feedback (multiple blanks)
                          const hasMultipleBlanks = correctArray.length > 1 || userArray.length > 1;
                          const maxBlanks = Math.max(correctArray.length, userArray.length);
                          
                          // Display the question with blanks as _____
                          const renderQuestionWithBlanks = () => {
                            const parts = quiz.question.split(/(\[BLANK\d+\])/);
                            return (
                              <p className="text-gray-900 mb-3 leading-relaxed">
                                {parts.map((part, idx) => {
                                  if (part.match(/\[BLANK\d+\]/)) {
                                    return (
                                      <span
                                        key={idx}
                                        className="inline-block mx-1 px-3 py-1 rounded bg-gray-200 border-2 border-gray-300 font-mono"
                                        style={{ minWidth: '80px', textAlign: 'center' }}
                                      >
                                        _______
                                      </span>
                                    );
                                  }
                                  return <span key={idx}>{part}</span>;
                                })}
                              </p>
                            );
                          };
                          
                          return (
                            <div className="space-y-2">
                              {/* Show question with blanks as _____ */}
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                                <span className="text-gray-700 block mb-2">
                                  <span className="font-semibold text-gray-800">Question with blanks:</span>
                                </span>
                                {renderQuestionWithBlanks()}
                              </div>
                              
                              {hasMultipleBlanks ? (
                                // Show per-blank feedback
                                Array.from({ length: maxBlanks }).map((_, blankIndex) => {
                                  const correctAnswer = correctArray[blankIndex] || '';
                                  const userBlankAnswer = userArray[blankIndex] || '';
                                  const isBlankCorrect = userBlankAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
                                  
                                  return (
                                    <div key={blankIndex} className={`p-3 rounded-lg border-2 ${isBlankCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-gray-700">Blank {blankIndex + 1}</span>
                                        {isBlankCorrect ? (
                                          <Badge className="bg-green-600 text-white">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Correct
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-red-600 text-white">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Incorrect
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-1.5 text-sm">
                                        <div className="flex items-start gap-2">
                                          <span className={`font-medium min-w-[100px] ${isBlankCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                            Your answer:
                                          </span>
                                          <span className={`flex-1 px-2 py-1 rounded ${isBlankCorrect ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
                                            {userBlankAnswer || '(empty)'}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <span className="font-medium text-green-700 min-w-[100px]">
                                            Correct answer:
                                          </span>
                                          <span className="flex-1 px-2 py-1 rounded bg-green-100 text-green-900">
                                            {correctAnswer || '(none)'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                // Single blank - show simple format
                                <>
                                  {!isCorrect && userArray[0] && (
                                    <div className="p-2 bg-white rounded border border-gray-200">
                                      <span className="text-red-600 font-medium">Your answer: </span>
                                      <span className="text-gray-700">{userArray[0]}</span>
                                    </div>
                                  )}
                                  <div className="p-2 bg-white rounded border border-gray-200">
                                    <span className="text-green-600 font-medium">Correct answer: </span>
                                    <span className="text-gray-700">{correctArray[0]}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* Special handling for Identification type */}
                        {quiz.type === 'identification' && (
                          <>
                            {!isCorrect && userAnswer && (
                              <div className="p-2 bg-white rounded border border-gray-200">
                                <span className="text-red-600 font-medium">Your answer: </span>
                                <span className="text-gray-700">
                                  {Array.isArray(userAnswer) ? userAnswer[0] : userAnswer}
                                </span>
                              </div>
                            )}
                            <div className="p-2 bg-green-50 rounded border border-green-200">
                              <span className="text-green-700 font-medium">Correct answer: </span>
                              <span className="text-gray-700">
                                {Array.isArray(quiz.correct_answer) ? quiz.correct_answer[0] : quiz.correct_answer}
                              </span>
                            </div>
                          </>
                        )}
                        
                        {/* Special handling for Enumeration type */}
                        {quiz.type === 'enumeration' && (() => {
                          const correctArray = Array.isArray(quiz.correct_answer) ? quiz.correct_answer : [quiz.correct_answer];
                          const userArray = Array.isArray(userAnswer) ? userAnswer : (userAnswer ? [userAnswer] : []);
                          
                          return (
                            <div className="space-y-2">
                              {!isCorrect && userArray.length > 0 && (
                                <div className="p-2 bg-white rounded border border-gray-200">
                                  <span className="text-blue-600 font-medium block mb-2">Your answers:</span>
                                  <div className="space-y-1">
                                    {userArray.map((answer: string, idx: number) => {
                                      const isThisCorrect = correctArray.some(correct => 
                                        correct.toLowerCase().trim() === answer.toLowerCase().trim()
                                      );
                                      return (
                                        <div key={idx} className={`p-1.5 rounded ${isThisCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                                          <span className="text-gray-700">
                                            {idx + 1}. {answer}
                                            {isThisCorrect && <span className="ml-2 text-green-600">✓</span>}
                                            {!isThisCorrect && <span className="ml-2 text-red-600">✗</span>}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              <div className="p-2 bg-green-50 rounded border border-green-200">
                                <span className="text-green-700 font-medium block mb-2">Correct answers:</span>
                                <div className="space-y-1">
                                  {correctArray.map((answer, idx) => (
                                    <div key={idx} className="p-1.5 bg-white rounded">
                                      <span className="text-gray-700">
                                        {idx + 1}. {answer}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        
                        {quiz.explanation && (
                          <div className="p-2 bg-blue-50 rounded">
                            <span className="text-blue-700">💡 Explanation: </span>
                            <span className="text-gray-700">{quiz.explanation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onHome}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
        <Button
          onClick={onRetake}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <RotateCcw className="w-4 h-4" />
          Retake Quiz
        </Button>
      </div>
    </div>
  );
}