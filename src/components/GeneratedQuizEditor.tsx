import { useState } from 'react';
import { ArrowLeft, Play, Save, Edit2, Trash2, GripVertical, Plus, X, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ModifiedTrueFalseSelector } from './ModifiedTrueFalseSelector';
import { FillBlankEditor } from './FillBlankEditor';
import { QuizPreviewCard } from './QuizPreviewCard';

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

interface GeneratedQuizEditorProps {
  quizzes: Quiz[];
  onStartQuiz: (quizzes: Quiz[]) => void;
  onSaveAndStart: (quizzes: Quiz[]) => void;
  onBack: () => void;
}

const questionTypes = [
  { value: 'identification', label: 'Identification', icon: '🎯' },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '✓' },
  { value: 'true_false', label: 'Modified True/False', icon: '⚖️' },
  { value: 'fill_blank', label: 'Fill in the Blank', icon: '📝' },
  { value: 'matching', label: 'Matching', icon: '🔗' },
  { value: 'enumeration', label: 'Enumeration', icon: '📋' },
];

export function GeneratedQuizEditor({
  quizzes: initialQuizzes,
  onStartQuiz,
  onSaveAndStart,
  onBack,
}: GeneratedQuizEditorProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [incompleteQuestions, setIncompleteQuestions] = useState<Set<string>>(new Set());

  const updateQuestion = (id: string, updates: Partial<Quiz>) => {
    setQuizzes(prev => prev.map(q => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (id: string) => {
    if (quizzes.length <= 1) {
      toast.error('You must have at least one question');
      return;
    }
    setQuizzes(prev => prev.filter(q => q.id !== id));
    toast.success('Question deleted');
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuizzes = [...quizzes];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newQuizzes.length) return;

    [newQuizzes[index], newQuizzes[newIndex]] = [newQuizzes[newIndex], newQuizzes[index]];
    setQuizzes(newQuizzes);
  };

  const validateQuizzes = () => {
    const incomplete = new Set<string>();
    for (const quiz of quizzes) {
      if (!quiz.question.trim()) {
        incomplete.add(quiz.id);
        toast.error('All questions must have text');
        continue;
      }

      if (quiz.type === 'multiple_choice') {
        if (!quiz.options || quiz.options.length < 2) {
          incomplete.add(quiz.id);
          toast.error('Multiple choice questions must have at least 2 options');
          continue;
        }
        const uniqueOptions = new Set(quiz.options.map(o => o.trim().toLowerCase()));
        if (uniqueOptions.size !== quiz.options.length) {
          incomplete.add(quiz.id);
          toast.error('All options must be unique');
          continue;
        }
        if (!quiz.correct_answer || !quiz.options.includes(quiz.correct_answer as string)) {
          incomplete.add(quiz.id);
          toast.error('Please select a correct answer for all multiple choice questions');
          continue;
        }
      }

      if (quiz.type === 'matching') {
        if (!quiz.pairs || quiz.pairs.length < 2) {
          incomplete.add(quiz.id);
          toast.error('Matching questions must have at least 2 pairs');
          continue;
        }
        for (const pair of quiz.pairs) {
          if (!pair.left.trim() || !pair.right.trim()) {
            incomplete.add(quiz.id);
            toast.error('All matching pairs must have both left and right values');
            continue;
          }
        }
      }

      if (quiz.type === 'enumeration') {
        const answers = Array.isArray(quiz.correct_answer) ? quiz.correct_answer : [quiz.correct_answer];
        if (answers.length === 0 || answers.every(a => !a.trim())) {
          incomplete.add(quiz.id);
          toast.error('Enumeration questions must have at least one answer');
          continue;
        }
      }

      if (quiz.type === 'fill_blank') {
        const blankCount =
          (quiz.question.match(/_____/g) || []).length +
          (quiz.question.match(/\[BLANK\d+\]/g) || []).length;
        if (blankCount === 0) {
          incomplete.add(quiz.id);
          toast.error('Fill in the blank questions must have at least one blank');
          continue;
        }
        const answers = quiz.fill_blank_answers || [];
        if (answers.length < blankCount) {
          incomplete.add(quiz.id);
          toast.error('Please provide answers for all blanks in fill-in-the-blank questions');
          continue;
        }
        if (answers.some(a => !a || !a.trim())) {
          incomplete.add(quiz.id);
          toast.error('All blank answers must have text');
          continue;
        }
      }

      if (quiz.type === 'true_false') {
        if (!quiz.underlinedText || !quiz.underlinedText.trim()) {
          incomplete.add(quiz.id);
          toast.error('Modified True/False questions must have underlined text');
          continue;
        }
        if (!quiz.correctReplacement || !quiz.correctReplacement.trim()) {
          incomplete.add(quiz.id);
          toast.error('Modified True/False questions must have a correct replacement text');
          continue;
        }
        if (quiz.question.includes('[UNDERLINE]') || quiz.question.includes('[/UNDERLINE]')) {
          incomplete.add(quiz.id);
          toast.error('Please remove placeholder tags from Modified True/False questions');
          continue;
        }
      }

      if (quiz.type === 'identification') {
        if (
          !quiz.correct_answer ||
          (typeof quiz.correct_answer === 'string' && !quiz.correct_answer.trim())
        ) {
          incomplete.add(quiz.id);
          toast.error('Identification questions must have an expected answer');
          continue;
        }
      }

      if (!quiz.explanation.trim()) {
        incomplete.add(quiz.id);
        toast.error('All questions must have an explanation');
        continue;
      }
    }
    setIncompleteQuestions(incomplete);
    return incomplete.size === 0;
  };

  const handleStartQuiz = () => {
    if (!validateQuizzes()) return;
    onStartQuiz(quizzes);
  };

  const handleSaveAndStart = () => {
    if (!validateQuizzes()) return;
    onSaveAndStart(quizzes);
  };

  const renderQuestionEditor = (question: Quiz, index: number) => {
    const isExpanded = expandedQuestion === question.id;
    const isIncomplete = incompleteQuestions.has(question.id);

    const displayQuestion =
      question.question.length > 60
        ? question.question.substring(0, 60) + '...'
        : question.question || 'New Question';

    return (
      <motion.div
        key={question.id}
        id={`question-${question.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all ${
          isIncomplete ? 'border-red-400 ring-2 ring-red-200' : 'border-pink-100'
        }`}
      >
        {isIncomplete && (
          <div className="bg-red-50 border-b-2 border-red-200 px-3 py-2">
            <p className="text-xs text-red-700 flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <strong>Incomplete question:</strong> Please fill in all required fields before saving
            </p>
          </div>
        )}

        <div
          className={`p-3 md:p-4 flex items-center gap-2 cursor-pointer ${
            isIncomplete
              ? 'bg-gradient-to-r from-red-50 to-orange-50'
              : 'bg-gradient-to-r from-pink-50 to-rose-50'
          }`}
          onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                moveQuestion(index, 'up');
              }}
              disabled={index === 0}
              className="h-7 w-7 p-0 hover:bg-pink-100"
            >
              <GripVertical className="w-4 h-4 text-pink-400" />
            </Button>
            <span className="text-pink-600 font-semibold text-sm">Q{index + 1}</span>
          </div>

          <div className="flex-1 min-w-0 mr-2">
            <p className="text-xs md:text-sm text-gray-700 truncate">{displayQuestion}</p>
            <Badge variant="outline" className="text-[10px] md:text-xs bg-white mt-1">
              {questionTypes.find(t => t.value === question.type)?.icon}{' '}
              <span className="hidden sm:inline">
                {questionTypes.find(t => t.value === question.type)?.label}
              </span>
            </Badge>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                deleteQuestion(question.id);
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center w-8 h-8"
            >
              <Edit2 className="w-4 h-4 text-pink-500" />
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4 border-t border-pink-100">
                <div className="space-y-2">
                  <Label className="text-pink-700">Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value: string) => {
                      const updates: Partial<Quiz> = { type: value as Quiz['type'] };
                      if (value === 'multiple_choice') {
                        updates.options = ['', '', '', ''];
                        updates.correct_answer = '';
                      } else if (value === 'true_false') {
                        updates.correct_answer = 'True';
                        updates.underlinedText = '';
                        updates.correctReplacement = '';
                      } else if (value === 'matching') {
                        updates.pairs = [
                          { left: '', right: '' },
                          { left: '', right: '' },
                        ];
                      } else if (value === 'enumeration') {
                        updates.correct_answer = [''];
                      } else {
                        updates.correct_answer = '';
                      }
                      updateQuestion(question.id, updates);
                    }}
                  >
                    <SelectTrigger className="border-pink-200 focus:border-pink-400 focus:ring-pink-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {question.type !== 'fill_blank' && (
                  <div className="space-y-2">
                    <Label className="text-pink-700">Question</Label>
                    <Textarea
                      value={question.question || ''}
                      onChange={e => updateQuestion(question.id, { question: e.target.value })}
                      placeholder="Enter your question here..."
                      className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 min-h-[80px]"
                    />
                  </div>
                )}

                {question.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <Label className="text-pink-700">Answer Options (must be unique)</Label>
                    {question.options?.map((option, i) => {
                      const isDuplicate =
                        option.trim() &&
                        question.options?.some(
                          (opt, idx) =>
                            idx !== i && opt.trim().toLowerCase() === option.trim().toLowerCase(),
                        );

                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 w-6">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <Input
                              value={option}
                              onChange={e => {
                                const newOptions = [...(question.options || [])];
                                newOptions[i] = e.target.value;
                                updateQuestion(question.id, { options: newOptions });
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              className={`border-pink-200 focus:border-pink-400 focus:ring-pink-400 ${
                                isDuplicate ? 'border-red-300 bg-red-50' : ''
                              }`}
                            />
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correct_answer === option}
                              onChange={() =>
                                updateQuestion(question.id, { correct_answer: option })
                              }
                              className="w-5 h-5 text-pink-600 focus:ring-pink-500 flex-shrink-0"
                            />
                          </div>
                          {isDuplicate && (
                            <p className="text-xs text-red-500 ml-8">
                              ⚠ This option is a duplicate
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-500 italic">
                      Select the radio button for the correct answer. Each option must be unique.
                    </p>
                  </div>
                )}

                {question.type === 'true_false' && (
                  <div className="space-y-4">
                    <ModifiedTrueFalseSelector
                      questionText={question.question || ''}
                      selectedText={question.underlinedText || ''}
                      correctReplacement={question.correctReplacement || ''}
                      correctAnswer={(question.correct_answer as string) || 'True'}
                      isAIGenerated={true}
                      onTextSelect={text => {
                        updateQuestion(question.id, { underlinedText: text });
                      }}
                      onAnswerChange={(answer, replacement) => {
                        updateQuestion(question.id, {
                          correct_answer: answer,
                          correctReplacement: replacement,
                        });
                      }}
                    />
                  </div>
                )}

                {question.type === 'fill_blank' && (
                  <FillBlankEditor
                    questionText={question.question || ''}
                    answers={question.fill_blank_answers || []}
                    isAIGenerated={true}
                    onQuestionChange={text => {
                      updateQuestion(question.id, { question: text });
                    }}
                    onAnswersChange={answers => {
                      updateQuestion(question.id, {
                        fill_blank_answers: answers,
                        correct_answer: answers,
                      });
                    }}
                  />
                )}

                {question.type === 'matching' && (
                  <div className="space-y-3">
                    <Label className="text-pink-700">
                      Matching Pairs (minimum 2 pairs required)
                    </Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Create pairs that need to be matched. You need at least 2 complete pairs to
                      save.
                    </p>
                    {(question.pairs || [
                      { left: '', right: '' },
                      { left: '', right: '' },
                    ]).map((pair, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-5 flex-shrink-0">{i + 1}.</span>
                        <Input
                          value={pair.left || ''}
                          onChange={e => {
                            const newPairs = [...(question.pairs || [])];
                            newPairs[i] = { ...newPairs[i], left: e.target.value };
                            updateQuestion(question.id, { pairs: newPairs });
                          }}
                          placeholder="Left item"
                          className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 flex-1"
                        />
                        <span className="text-pink-500 flex-shrink-0">↔</span>
                        <Input
                          value={pair.right || ''}
                          onChange={e => {
                            const newPairs = [...(question.pairs || [])];
                            newPairs[i] = { ...newPairs[i], right: e.target.value };
                            updateQuestion(question.id, { pairs: newPairs });
                          }}
                          placeholder="Right item"
                          className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 flex-1"
                        />
                        {i > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newPairs = (question.pairs || []).filter((_, idx) => idx !== i);
                              updateQuestion(question.id, { pairs: newPairs });
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-9 w-9"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {!i || i === 1 ? <div className="w-9 flex-shrink-0" /> : null}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPairs = [...(question.pairs || []), { left: '', right: '' }];
                        updateQuestion(question.id, { pairs: newPairs });
                      }}
                      className="border-pink-300 text-pink-600 hover:bg-pink-50 w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pair
                    </Button>
                  </div>
                )}

                {question.type === 'enumeration' && (
                  <div className="space-y-2">
                    <Label className="text-pink-700">
                      Correct Answers (List all acceptable answers)
                    </Label>
                    {(Array.isArray(question.correct_answer)
                      ? question.correct_answer
                      : [question.correct_answer || '']
                    ).map((answer, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-6">{i + 1}.</span>
                        <Input
                          value={answer || ''}
                          onChange={e => {
                            const answers = Array.isArray(question.correct_answer)
                              ? [...question.correct_answer]
                              : [question.correct_answer || ''];
                            answers[i] = e.target.value;
                            updateQuestion(question.id, { correct_answer: answers });
                          }}
                          placeholder={`Answer ${i + 1}`}
                          className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const answers = Array.isArray(question.correct_answer)
                              ? question.correct_answer.filter((_, idx) => idx !== i)
                              : [];
                            if (answers.length === 0) answers.push('');
                            updateQuestion(question.id, { correct_answer: answers });
                          }}
                          className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const answers = Array.isArray(question.correct_answer)
                          ? [...question.correct_answer]
                          : [question.correct_answer || ''];
                        answers.push('');
                        updateQuestion(question.id, { correct_answer: answers });
                      }}
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Answer
                    </Button>
                  </div>
                )}

                {question.type === 'identification' && (
                  <div className="space-y-2">
                    <Label className="text-pink-700">Expected Answer</Label>
                    <Textarea
                      value={(question.correct_answer as string) || ''}
                      onChange={e =>
                        updateQuestion(question.id, { correct_answer: e.target.value })
                      }
                      placeholder="Enter the expected answer or key points..."
                      className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 min-h-[60px]"
                    />
                    <p className="text-xs text-gray-500 italic">
                      This is a reference answer. Student responses will be compared for similarity.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-pink-700">Explanation</Label>
                  <Textarea
                    value={question.explanation || ''}
                    onChange={e => updateQuestion(question.id, { explanation: e.target.value })}
                    placeholder="Explain why this is the correct answer..."
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 min-h-[60px]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-6 pt-16">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-2xl md:text-3xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Review AI-Generated Quiz
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {viewMode === 'preview' ? 'Preview' : 'Edit'} {quizzes.length} question
            {quizzes.length !== 1 ? 's' : ''} before starting
          </p>
        </div>
        <div className="w-[100px]" />
      </div>

      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border-2 border-pink-200 bg-pink-50 p-1">
          <Button
            variant={viewMode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('preview')}
            className={
              viewMode === 'preview'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Mode
          </Button>
          <Button
            variant={viewMode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('edit')}
            className={
              viewMode === 'edit'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Mode
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-3">
              <p className="text-sm text-center text-gray-700">
                <strong className="text-pink-700">
                  ✨ All questions generated from your study material
                </strong>
                <br />
                <span className="text-xs">
                  Each question type follows the proper formatting rules
                </span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSaveAndStart}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save & Start Quiz
              </Button>
              <Button
                onClick={handleStartQuiz}
                variant="outline"
                className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Without Saving
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Save to access this quiz later from Study Materials, or start now without saving
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {viewMode === 'preview'
            ? quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <QuizPreviewCard quiz={quiz} index={index} showAnswers={true} />
                </motion.div>
              ))
            : quizzes.map((quiz, index) => renderQuestionEditor(quiz, index))}
        </AnimatePresence>
      </div>
    </div>
  );
}
