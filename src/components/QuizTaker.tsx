import { useState, useEffect } from 'react';
import { Clock, ArrowRight, ArrowLeft, RotateCcw, Shuffle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
import { OfflineQuiz } from '../data/offlineQuizzes';
import { cleanQuestionText, extractUnderlinedText, parseUnderlineMarkup } from '../utils/questionFormatting';

interface QuizTakerProps {
  quizzes: (Quiz | OfflineQuiz)[];
  onComplete: (results: QuizResults) => void;
  onBack: () => void;
}

interface Quiz {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'enumeration' | 'identification';
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  pairs?: { left: string; right: string }[];
  // For Modified True/False questions
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
  quizzes?: any[];
}

export function QuizTaker({ quizzes, onComplete, onBack }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [shuffledQuizzes, setShuffledQuizzes] = useState<(Quiz | OfflineQuiz)[]>([]);

  // Matching specific state
  const [matchingAnswers, setMatchingAnswers] = useState<{ [key: string]: string }>({});
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  // Enumeration specific state
  const [enumerationAnswers, setEnumerationAnswers] = useState<string[]>(['']);
  
  // Modified True/False specific state
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<string>('');
  const [correctionText, setCorrectionText] = useState<string>('');

  // Shuffle quizzes on mount
  useEffect(() => {
    const shuffled = [...quizzes].sort(() => Math.random() - 0.5);
    setShuffledQuizzes(shuffled);
  }, [quizzes]);

  // Timer effect - must be before any conditional returns
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Reset states when question changes - must be before any conditional returns
  useEffect(() => {
    if (shuffledQuizzes.length === 0) return;
    
    const currentQuiz = shuffledQuizzes[currentQuestionIndex];
    const savedAnswer = answers[currentQuiz.id];
    
    // Reset states when question changes
    setShowExplanation(false);
    
    // Check if this question has been answered before
    const hasBeenAnswered = savedAnswer !== undefined;
    setIsAnswered(hasBeenAnswered);
    
    // Restore or reset matching answers
    if (currentQuiz.type === 'matching') {
      if (hasBeenAnswered && Array.isArray(savedAnswer)) {
        // Restore matching answers from saved answer
        const restored: { [key: string]: string } = {};
        savedAnswer.forEach((pair: string) => {
          const [left, right] = pair.split(':');
          if (left && right) {
            restored[left] = right;
          }
        });
        setMatchingAnswers(restored);
      } else {
        setMatchingAnswers({});
      }
    }
    
    // Restore or reset enumeration answers
    if (currentQuiz.type === 'enumeration') {
      if (hasBeenAnswered && Array.isArray(savedAnswer)) {
        // Restore enumeration answers from saved answer
        setEnumerationAnswers(savedAnswer.length > 0 ? savedAnswer : ['']);
      } else {
        setEnumerationAnswers(['']);
      }
    }
    
    // Restore or reset modified true/false answers
    if (currentQuiz.type === 'true_false') {
      if (hasBeenAnswered) {
        const savedAnswerStr = Array.isArray(savedAnswer) ? savedAnswer[0] : savedAnswer;
        if (savedAnswerStr === 'True' || savedAnswerStr === 'False') {
          setTrueFalseAnswer(savedAnswerStr);
          setCorrectionText('');
        } else {
          // It's a correction text for False answer
          setTrueFalseAnswer('False');
          setCorrectionText(savedAnswerStr || '');
        }
      } else {
        setTrueFalseAnswer('');
        setCorrectionText('');
      }
    }

    // Initialize shuffled options for matching type
    if (currentQuiz.type === 'matching' && currentQuiz.pairs) {
      const rightOptions = currentQuiz.pairs.map(pair => pair.right);
      setShuffledOptions(rightOptions.sort(() => 0.5 - Math.random()));
    }
  }, [currentQuestionIndex, shuffledQuizzes, answers]);

  // Handle Enter key to move to next question
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        // Only trigger if answer is provided (question is answered)
        if (isCurrentAnswered()) {
          event.preventDefault();
          nextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, shuffledQuizzes, answers, matchingAnswers, enumerationAnswers, trueFalseAnswer]);

  // Helper function to parse question with underlined text
  const parseQuestionWithUnderline = (question: string) => {
    const parts = question.split(/\[UNDERLINE\](.*?)\[\/UNDERLINE\]/);
    return parts;
  };

  // Return loading state if quizzes haven't been shuffled yet
  if (shuffledQuizzes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shuffle className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Shuffling quiz questions...</p>
        </div>
      </div>
    );
  }

  const currentQuiz = shuffledQuizzes[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / shuffledQuizzes.length) * 100;

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [currentQuiz.id]: answer }));
    setIsAnswered(true);
  };

  const handleMatchingAnswer = (leftItem: string, rightItem: string) => {
    setMatchingAnswers(prev => {
      const updated = { ...prev, [leftItem]: rightItem };
      
      // Check if all pairs are matched
      if (currentQuiz.pairs && Object.keys(updated).length === currentQuiz.pairs.length) {
        const formattedAnswer = Object.entries(updated).map(([left, right]) => `${left}:${right}`);
        handleAnswer(formattedAnswer);
      }
      
      return updated;
    });
  };

  const handleEnumerationChange = (index: number, value: string) => {
    const updated = [...enumerationAnswers];
    updated[index] = value;
    setEnumerationAnswers(updated);
    
    // Filter out empty answers and update
    const nonEmptyAnswers = updated.filter(answer => answer.trim() !== '');
    if (nonEmptyAnswers.length > 0) {
      handleAnswer(nonEmptyAnswers);
    }
  };

  const addEnumerationField = () => {
    setEnumerationAnswers(prev => [...prev, '']);
  };

  const removeEnumerationField = (index: number) => {
    if (enumerationAnswers.length > 1) {
      const updated = enumerationAnswers.filter((_, i) => i !== index);
      setEnumerationAnswers(updated);
      const nonEmptyAnswers = updated.filter(answer => answer.trim() !== '');
      if (nonEmptyAnswers.length > 0) {
        handleAnswer(nonEmptyAnswers);
      }
    }
  };

  const checkAnswer = () => {
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < shuffledQuizzes.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeQuiz = () => {
    const correctAnswers = shuffledQuizzes.reduce((count, quiz) => {
      const userAnswer = answers[quiz.id];
      if (!userAnswer) return count;

      // Special handling for Modified True/False
      if (quiz.type === 'true_false') {
        const correctAnswer = typeof quiz.correct_answer === 'string' ? quiz.correct_answer : quiz.correct_answer[0];
        const userAnswerStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
        
        // If the correct answer is True, just check if user said True
        if (correctAnswer === 'True') {
          return userAnswerStr === 'True' ? count + 1 : count;
        }
        
        // If the correct answer is False, check the replacement text
        if (correctAnswer === 'False' && quiz.correctReplacement) {
          // User must provide the correct replacement
          const isCorrect = userAnswerStr.toLowerCase().trim() === quiz.correctReplacement.toLowerCase().trim();
          return isCorrect ? count + 1 : count;
        }
        
        // Fallback to string comparison
        return correctAnswer.toLowerCase().trim() === userAnswerStr.toLowerCase().trim() ? count + 1 : count;
      }

      if (quiz.type === 'matching') {
        // For matching, check if pairs match correctly
        const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        const correctPairs = quiz.pairs || [];
        
        if (userArray.length !== correctPairs.length) return count;
        
        // Check if all user pairs match the correct pairs
        const isCorrect = userArray.every((userPair: string) => {
          const [userLeft, userRight] = (userPair || '').split(':').map(s => (s || '').trim().toLowerCase());
          return correctPairs.some(correctPair => 
            correctPair?.left?.trim().toLowerCase() === userLeft &&
            correctPair?.right?.trim().toLowerCase() === userRight
          );
        });
        
        return isCorrect ? count + 1 : count;
      }
      
      if (quiz.type === 'enumeration') {
        // For enumeration, check if all answers match
        const correctArray = Array.isArray(quiz.correct_answer) ? quiz.correct_answer : [quiz.correct_answer];
        const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        
        if (correctArray.length !== userArray.length) return count;
        
        const isCorrect = correctArray.every(correct => 
          userArray.some(user => 
            user.toLowerCase().trim() === correct.toLowerCase().trim()
          )
        );
        
        return isCorrect ? count + 1 : count;
      }
      
      if (quiz.type === 'fill_blank') {
        // Use fill_blank_answers as the source of truth if available
        const typedQuiz = quiz as Quiz;
        const correctArray =
          typedQuiz.fill_blank_answers && typedQuiz.fill_blank_answers.length > 0
            ? typedQuiz.fill_blank_answers
            : (Array.isArray(quiz.correct_answer) ? quiz.correct_answer : [quiz.correct_answer]);
        const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        
        // Check if lengths match
        if (correctArray.length !== userArray.length) return count;
        
        // Check if all answers match in order
        const isCorrect = correctArray.every((correct, index) => 
          userArray[index]?.toLowerCase().trim() === correct.toLowerCase().trim()
        );
        
        return isCorrect ? count + 1 : count;
      }
      
      // For other types (strings), normalize and compare
      const correctAnswer = typeof quiz.correct_answer === 'string' ? quiz.correct_answer : quiz.correct_answer[0];
      const userAnswerStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
      return correctAnswer.toLowerCase().trim() === userAnswerStr.toLowerCase().trim() ? count + 1 : count;
    }, 0);

    const timeTaken = Math.floor(timeElapsed / 1000); // Convert milliseconds to seconds

    const results: QuizResults = {
      correctAnswers,
      totalQuestions: shuffledQuizzes.length,
      timeTaken,
      answers, // include all user answers so it matches QuizResults
      score: Math.round((correctAnswers / shuffledQuizzes.length) * 100),
      quizzes: shuffledQuizzes as any[]
    };

    // Quiz results are already saved to database via ProgressContext
    // No need for redundant localStorage storage

    onComplete(results);
  };

  const renderQuestionContent = () => {
    switch (currentQuiz.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={(answers[currentQuiz.id] as string) || ''}
            onValueChange={(value: string) => handleAnswer(value)}
            className="space-y-3"
          >
            {currentQuiz.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true_false':
        // Check if question has [UNDERLINE] markup from AI generation
        const hasMarkup = currentQuiz.question.includes('[UNDERLINE]');
        
        // Extract underlined text from markup if present, otherwise use underlinedText field
        const keywordToHighlight = hasMarkup 
          ? extractUnderlinedText(currentQuiz.question)
          : (currentQuiz.underlinedText || '');
        
        // Helper function to render question with highlighted keyword
        const renderHighlightedQuestion = () => {
          if (hasMarkup) {
            // Parse and render the markup
            const { parts } = parseUnderlineMarkup(currentQuiz.question);
            return (
              <>
                {parts.map((part, index) => (
                  <span key={index}>
                    {part.isUnderlined ? (
                      <strong className="font-bold text-pink-600 bg-pink-100 px-1 py-0.5 rounded">
                        {part.text}
                      </strong>
                    ) : (
                      part.text
                    )}
                  </span>
                ))}
              </>
            );
          } else if (keywordToHighlight && currentQuiz.question.includes(keywordToHighlight)) {
            // Use underlinedText field for custom quizzes
            const parts = currentQuiz.question.split(keywordToHighlight);
            return (
              <>
                {parts.map((part, index) => (
                  <span key={index}>
                    {part}
                    {index < parts.length - 1 && (
                      <strong className="font-bold text-pink-600 bg-pink-100 px-1 py-0.5 rounded">
                        {keywordToHighlight}
                      </strong>
                    )}
                  </span>
                ))}
              </>
            );
          } else {
            // No highlighting needed
            return <span>{currentQuiz.question}</span>;
          }
        };
        
        return (
          <div className="space-y-4">
            {/* Display question with highlighted keyword */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-base leading-relaxed">
                {renderHighlightedQuestion()}
              </p>
            </div>

            <div className="space-y-3">
              <RadioGroup
                value={trueFalseAnswer}
                onValueChange={(value: string) => {
                  setTrueFalseAnswer(value);
                  setCorrectionText('');

                  if (value === 'True') {
                    handleAnswer('True'); // save True immediately
                    setIsAnswered(true);
                  } else if (value === 'False') {
                    // Wait for user to type correction
                    setIsAnswered(false);
                  }
                }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="True" id="true-option" />
                  <Label htmlFor="true-option" className="flex-1 cursor-pointer">
                    True
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="False" id="false-option" />
                  <Label htmlFor="false-option" className="flex-1 cursor-pointer">
                    False
                  </Label>
                </div>
              </RadioGroup>
              
              <AnimatePresence>
                {trueFalseAnswer === 'False' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-6 overflow-hidden"
                  >
                    <Input
                      type="text"
                      value={correctionText}
                      onChange={(e) => {
                        setCorrectionText(e.target.value);
                        if (e.target.value.trim()) {
                          handleAnswer(e.target.value);
                          setIsAnswered(true);
                        }
                      }}
                      placeholder="Type the correct word/phrase here..."
                      className="w-full rounded-lg border border-pink-300 bg-white px-3 py-2 text-sm shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-500
                                placeholder:text-gray-400"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      case 'fill_blank':
        // Count the number of blanks in the question text
        const blankCount = (currentQuiz.question.match(/_____/g) || []).length;
        const fillBlankAnswers = (answers[currentQuiz.id] as string[]) || Array(blankCount).fill('');
        
        return (
          <div className="space-y-3">
            {blankCount > 0 ? (
              Array.from({ length: blankCount }).map((_, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-sm text-gray-700">
                    Blank {index + 1}:
                  </Label>
                  <Input
                    type="text"
                    placeholder={`Answer for blank ${index + 1}...`}
                    value={fillBlankAnswers[index] || ''}
                    onChange={(e) => {
                      const newAnswers = [...fillBlankAnswers];
                      newAnswers[index] = e.target.value;
                      handleAnswer(newAnswers);
                    }}
                    className="w-full border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                    autoFocus={index === 0}
                  />
                </div>
              ))
            ) : (
              <Input
                type="text"
                placeholder="Type your answer here..."
                value={(answers[currentQuiz.id] as string) || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full"
                autoFocus
              />
            )}
          </div>
        );

      case 'matching':
        if (!currentQuiz.pairs) return null;
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Match each item on the left with the correct item on the right:
            </p>
            
            <div className="ggrid grid-cols-1 gap-6 md:hidden">
              {/* Left column */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Items to Match:</h4>
                {currentQuiz.pairs.map((pair, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg transition-colors ${
                      matchingAnswers[pair.left] 
                        ? 'bg-pink-50 border-pink-200 cursor-pointer hover:bg-pink-100 active:bg-pink-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      // Remove match when clicking on a matched pair
                      if (matchingAnswers[pair.left]) {
                        setMatchingAnswers(prev => {
                          const updated = { ...prev };
                          delete updated[pair.left];
                          
                          // Update answers if no matches remain
                          if (Object.keys(updated).length === 0) {
                            setAnswers(prev => {
                              const newAnswers = { ...prev };
                              delete newAnswers[currentQuiz.id];
                              return newAnswers;
                            });
                            setIsAnswered(false);
                          } else {
                            // Update answers with remaining matches
                            const formattedAnswer = Object.entries(updated).map(([left, right]) => `${left}:${right}`);
                            setAnswers(prev => ({ ...prev, [currentQuiz.id]: formattedAnswer }));
                          }
                          
                          return updated;
                        });
                      }
                    }}
                    title={matchingAnswers[pair.left] ? 'Click to remove this match' : ''}
                  >
                    <span>{pair.left}</span>
                    {matchingAnswers[pair.left] && (
                      <span className="ml-2 text-pink-600">→ {matchingAnswers[pair.left]}</span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Right column */}
              <div className="space-y-3 px-2">
                <h4 className="font-medium text-gray-800 mb-2 mt-6">Available Options:</h4>
                {shuffledOptions.map((option, index) => {
                  const isUsed = Object.values(matchingAnswers).includes(option);
                  return (
                    <Button
                      key={index}
                      variant={isUsed ? "outline" : "default"}
                      className={`
                        w-full justify-start transition-all duration-200
                        whitespace-normal break-words text-left
                        px-4 py-8 text-base leading-snug
                        ${isUsed
                          ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-500 border-gray-300'
                          : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg border-2 border-pink-400'
                        }
                      `}
                      onClick={() => {
                        const unmatched = currentQuiz.pairs?.find(
                          pair => !matchingAnswers[pair.left]
                        );
                        if (unmatched && !isUsed) {
                          handleMatchingAnswer(unmatched.left, option);
                        }
                      }}
                      disabled={isUsed}
                    >
                      <span className="block w-full whitespace-normal break-words py-3">
                        {option}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Desktop Layout - Side by side columns with horizontal alignment */}
            <div className="hidden md:block">
              <div className="grid grid-cols-2 gap-8">
                {/* Left column header */}
                <h4 className="font-medium text-gray-800 text-lg mb-3 mt-4">
                  Items to Match:
                </h4>
                {/* Right column header */}
                <h4 className="font-medium text-gray-800 text-lg mb-3 mt-4">
                  Available Options:
                </h4>
              </div>
                          
              <div className="mt-4 space-y-2">
                {currentQuiz.pairs.map((pair, index) => {
                  const matchedOption = matchingAnswers[pair.left];
                  const isCurrentItemMatched = !!matchedOption;
                  
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-2 items-stretch"
                    >
                      {/* Left item */}
                      <div className="pr-4">
                        <div
                          className={`p-4 border-2 rounded-lg ${
                          isCurrentItemMatched 
                            ? 'bg-pink-50 border-pink-300 hover:bg-pink-100' 
                            : 'bg-white border-orange-300 hover:bg-orange-50'
                        }`}
                        onClick={() => {
                          if (isCurrentItemMatched) {
                            setMatchingAnswers(prev => {
                              const updated = { ...prev };
                              delete updated[pair.left];
                              
                              if (Object.keys(updated).length === 0) {
                                setAnswers(prev => {
                                  const newAnswers = { ...prev };
                                  delete newAnswers[currentQuiz.id];
                                  return newAnswers;
                                });
                                setIsAnswered(false);
                              } else {
                                const formattedAnswer = Object.entries(updated).map(
                                  ([left, right]) => `${left}:${right}`
                                );
                                setAnswers(prev => ({ ...prev, [currentQuiz.id]: formattedAnswer }));
                              }
                              
                              return updated;
                            });
                          }
                        }}
                        title={isCurrentItemMatched ? 'Click to remove this match' : ''}
                      >
                        <span className="block text-base font-medium text-gray-800 break-words">
                          {pair.left}
                        </span>
                        {isCurrentItemMatched && (
                          <div className="mt-3 pt-3 border-t border-pink-200">
                            <span className="mt-1 block text-base text-pink-700 font-medium break-words">
                              {matchedOption}
                            </span>
                          </div>
                        )}
                        </div>
                      </div>
                      
                      {/* Right option - aligned with left item */}
                      <div className="pl-4 flex">
                        {index < shuffledOptions.length && (() => {
                          const option = shuffledOptions[index];
                          const isUsed = Object.values(matchingAnswers).includes(option);
                          return (
                            <Button
                              variant={isUsed ? 'outline' : 'default'}
                              className={`
                                w-full justify-start transition-all duration-200
                                whitespace-normal break-words text-left
                                text-base leading-snug
                                px-4 py-3 min-h-auto h-full
                                ${
                                  isUsed
                                    ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-500 border-gray-300' 
                                    : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg border-2 border-pink-400'
                                }
                              `}
                              onClick={() => {
                                const unmatched = currentQuiz.pairs?.find(
                                  pair => !matchingAnswers[pair.left]
                                );
                                if (unmatched) {
                                  handleMatchingAnswer(unmatched.left, option);
                                }
                              }}
                              disabled={isUsed}
                            >
                              <span className="block w-full whitespace-normal break-words">
                                {option}
                              </span>
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Helper text */}
            <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200 mt-4">
              💡 Tip: {typeof window !== 'undefined' && window.innerWidth < 768 
                ? 'Tap to match items' 
                : 'Click on any matched pair (pink items) to remove the match'}
            </p>
            
            {/* Reset button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMatchingAnswers({});
                setAnswers(prev => ({ ...prev, [currentQuiz.id]: [] }));
                setIsAnswered(false);
              }}
              className="mt-4"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All Matches
            </Button>
          </div>
        );

      case 'enumeration':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              List your answers (one per field). Add more fields if needed:
            </p>
            {enumerationAnswers.map((answer, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  placeholder={`Answer ${index + 1}`}
                  value={answer}
                  onChange={(e) => handleEnumerationChange(index, e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                {enumerationAnswers.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeEnumerationField(index)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addEnumerationField}
              className="mt-2"
            >
              + Add Another Answer
            </Button>
          </div>
        );

      case 'identification':
        return (
          <Textarea
            placeholder="Write your answer here..."
            value={(answers[currentQuiz.id] as string) || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full min-h-[100px]"
            autoFocus
          />
        );

      default:
        return null;
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return '🔘';
      case 'true_false': return '✓✗';
      case 'fill_blank': return '___';
      case 'matching': return '↔️';
      case 'enumeration': return '📝';
      case 'identification': return '🔍';
      default: return '❓';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'Modified True or False';
      case 'fill_blank': return 'Fill in the Blank';
      case 'matching': return 'Matching';
      case 'enumeration': return 'Enumeration';
      case 'identification': return 'Identification';
      default: return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const isCurrentAnswered = () => {
    const answer = answers[currentQuiz.id];
    if (!answer) return false;
    
    if (Array.isArray(answer)) {
      return answer.length > 0 && answer.every(a => a.trim() !== '');
    }
    
    return typeof answer === 'string' && answer.trim() !== '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-300">
            <Shuffle className="w-3 h-3 mr-1" />
            Randomized
          </Badge>
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(timeElapsed)}
          </Badge>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {shuffledQuizzes.length}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div>
                {/* Question Type Badge */}
                <span className="inline-block px-3 py-1 mb-3 text-sm font-medium bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded-full border border-pink-200">
                  {getQuestionTypeLabel(currentQuiz.type)}
                </span>
                
                {/* Question Title */}
                <CardTitle className="text-lg">
                  {currentQuiz.type === 'true_false' 
                    ? cleanQuestionText(currentQuiz.question)
                    : currentQuiz.question}
                </CardTitle>
              </div>
              {(currentQuiz as OfflineQuiz).subject && (
                <Badge variant="secondary" className="w-fit mt-2">
                  {(currentQuiz as OfflineQuiz).subject}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {renderQuestionContent()}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <Button
                  onClick={nextQuestion}
                  disabled={!isCurrentAnswered()}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 w-full sm:w-auto"
                >
                  {currentQuestionIndex === shuffledQuizzes.length - 1 ? 'Finish Quiz' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="flex justify-center space-x-2">
        {shuffledQuizzes.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentQuestionIndex
                ? 'bg-pink-500'
                : answers[shuffledQuizzes[index].id]
                ? 'bg-green-400'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
