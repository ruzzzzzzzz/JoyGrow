import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ArrowLeft, Save, X, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useCustomQuiz, CustomQuestion } from '../contexts/CustomQuizContext';
import { ModifiedTrueFalseSelector } from './ModifiedTrueFalseSelector';
import { FillBlankEditor } from './FillBlankEditor';

interface QuizBuilderProps {
  onBack: () => void;
  editQuizId?: string;
}

const questionTypes = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '🔘' },
  { value: 'true_false', label: 'Modified True or False', icon: '✓✗' },
  { value: 'fill_blank', label: 'Fill in the Blank', icon: '___' },
  { value: 'matching', label: 'Matching', icon: '🔗' },
  { value: 'enumeration', label: 'Enumeration', icon: '📝' },
  { value: 'identification', label: 'Identification', icon: '🔍' },
];

const categories = [
  'Mathematics',
  'History',
  'Language',
  'Geography',
  'Technology',
  'Arts',
  'General Knowledge',
  'Other',
];

export function QuizBuilder({ onBack, editQuizId }: QuizBuilderProps) {
  const { addQuiz, updateQuiz, getQuiz } = useCustomQuiz();
  const editingQuiz = editQuizId ? getQuiz(editQuizId) : undefined;

  const [title, setTitle] = useState(editingQuiz?.title || '');
  const [description, setDescription] = useState(editingQuiz?.description || '');
  const [category, setCategory] = useState(editingQuiz?.category || '');
  const [customCategory, setCustomCategory] = useState(
    editingQuiz?.category && !categories.includes(editingQuiz.category)
      ? editingQuiz.category
      : '',
  );
  const [tags, setTags] = useState<string[]>(editingQuiz?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [questions, setQuestions] = useState<CustomQuestion[]>(
    editingQuiz?.questions || [],
  );
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [incompleteQuestions, setIncompleteQuestions] = useState<Set<string>>(new Set());

  const addQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      pairs: [{ left: '', right: '' }, { left: '', right: '' }],
      underlinedText: '',
      correctReplacement: '',
    };
    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(newQuestion.id);

    setTimeout(() => {
      const element = document.getElementById(`question-${newQuestion.id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const updateQuestion = (id: string, updates: Partial<CustomQuestion>) => {
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    toast.success('Question removed');
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const validateQuestion = (q: CustomQuestion): boolean => {
    if (!q.question.trim()) return false;

    if (q.type === 'multiple_choice') {
      const nonEmptyOptions = (q.options || []).filter(o => o.trim());
      const uniqueOptions = new Set(nonEmptyOptions.map(o => o.trim().toLowerCase()));
      if (nonEmptyOptions.length !== uniqueOptions.size) {
        toast.error('Multiple choice options must be unique');
        return false;
      }
      if (!q.options || q.options.some(o => !o.trim())) return false;
      if (!q.correct_answer || !q.correct_answer.toString().trim()) return false;
    } else if (q.type === 'fill_blank') {
      const blankCount = (q.question.match(/\[BLANK\d+\]/g) || []).length;
      if (blankCount > 0) {
        const answers = q.fill_blank_answers || [];
        if (answers.length < blankCount) {
          toast.error('Please provide answers for all blanks');
          return false;
        }
        for (let i = 0; i < blankCount; i++) {
          if (!answers[i] || !answers[i].trim()) {
            toast.error('Please provide answers for all blanks');
            return false;
          }
        }
      } else {
        if (
          !q.correct_answer ||
          (typeof q.correct_answer === 'string' && !q.correct_answer.trim())
        ) {
          toast.error('Please add at least one blank and its answer');
          return false;
        }
      }
    } else if (q.type === 'matching') {
      const validPairs = (q.pairs || []).filter(p => p.left.trim() && p.right.trim());
      if (validPairs.length < 2) {
        toast.error('Matching questions need at least 2 complete pairs');
        return false;
      }
    } else if (q.type === 'enumeration') {
      const validAnswers = Array.isArray(q.correct_answer)
        ? q.correct_answer.filter(a => a && a.trim())
        : [];
      if (validAnswers.length === 0) return false;
    } else if (q.type === 'true_false') {
      if (!q.correct_answer || (q.correct_answer !== 'True' && q.correct_answer !== 'False')) {
        toast.error('Please select True or False for the Modified True/False question');
        return false;
      }
      if (!q.underlinedText || !q.underlinedText.trim()) {
        toast.error('Please select a word/phrase to check for Modified True/False');
        return false;
      }
      if (
        q.correct_answer === 'False' &&
        (!q.correctReplacement || !q.correctReplacement.trim())
      ) {
        toast.error('Please provide the correct replacement for the false statement');
        return false;
      }
      const hasUnderlineMarkup =
        q.question.includes('[UNDERLINE]') && q.question.includes('[/UNDERLINE]');
      if (!hasUnderlineMarkup && !q.question.includes(q.underlinedText)) {
        toast.error('The selected word/phrase must exist in your question text');
        return false;
      }
    } else {
      if (!q.correct_answer || (typeof q.correct_answer === 'string' && !q.correct_answer.trim()))
        return false;
    }

    return true;
  };

  const finalCategory = category === 'Other' ? customCategory : category;
  const canSaveTopLevel =
    title.trim().length > 0 &&
    questions.length > 0 &&
    finalCategory.trim().length > 0;

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    if (!finalCategory.trim()) {
      toast.error('Please select a category (or enter a custom one)');
      return;
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    const incomplete = new Set<string>();

    for (const q of questions) {
      if (!validateQuestion(q)) {
        incomplete.add(q.id);
      }
    }

    setIncompleteQuestions(incomplete);

    if (incomplete.size > 0) {
      toast.error('Please complete all question fields', {
        description: `${incomplete.size} question${incomplete.size !== 1 ? 's' : ''} need${
          incomplete.size === 1 ? 's' : ''
        } attention. Check highlighted questions below.`,
        duration: 6000,
      });

      const firstIncomplete = questions.find(q => incomplete.has(q.id));
      if (firstIncomplete) {
        setTimeout(() => {
          const element = document.getElementById(`question-${firstIncomplete.id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setExpandedQuestion(firstIncomplete.id);
        }, 100);
      }
      return;
    }

    const quizData = {
      title,
      description,
      category: finalCategory || 'Other',
      tags,
      questions,
    };

    if (editQuizId) {
      updateQuiz(editQuizId, quizData);
      toast.success('Quiz updated successfully!');
    } else {
      addQuiz(quizData);
      toast.success('Quiz created successfully!');
    }
    onBack();
  };

  const renderQuestionEditor = (question: CustomQuestion, index: number) => {
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
            <Badge variant="outline" className="text-[10px] md:text-xs bg_WHITE mt-1 bg-white">
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
                    onValueChange={(value: CustomQuestion['type']) => {
                      const updates: Partial<CustomQuestion> = { type: value };
                      if (value === 'multiple_choice') {
                        updates.options = ['', '', '', ''];
                        updates.correct_answer = '';
                      } else if (value === 'true_false') {
                        updates.correct_answer = 'True';
                        updates.underlinedText = '';
                        updates.correctReplacement = '';
                      } else if (value === 'matching') {
                        updates.pairs = [{ left: '', right: '' }, { left: '', right: '' }];
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
                      value={question.question}
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
                            idx !== i &&
                            opt.trim().toLowerCase() === option.trim().toLowerCase(),
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
                      correctAnswer={
                        Array.isArray(question.correct_answer)
                          ? question.correct_answer[0] || ''
                          : (question.correct_answer as string) || ''
                      }
                      correctReplacement={question.correctReplacement || ''}
                      onTextSelect={text => {
                        updateQuestion(question.id, {
                          underlinedText: text,
                        });
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
                    questionText={question.question}
                    answers={question.fill_blank_answers || []}
                    onQuestionChange={text => {
                      updateQuestion(question.id, { question: text });
                    }}
                    onAnswersChange={answers => {
                      updateQuestion(question.id, {
                        fill_blank_answers: answers,
                        correct_answer: answers.join(' | '),
                      });
                    }}
                  />
                )}

                {question.type === 'identification' && (
                  <div className="space-y-2">
                    <Label className="text-pink-700">Correct Answer</Label>
                    <Input
                      value={question.correct_answer as string}
                      onChange={e =>
                        updateQuestion(question.id, { correct_answer: e.target.value })
                      }
                      placeholder="Enter the correct answer..."
                      className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                    />
                  </div>
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
                    {(question.pairs || [{ left: '', right: '' }, { left: '', right: '' }]).map(
                      (pair, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-5 flex-shrink-0">
                            {i + 1}.
                          </span>
                          <Input
                            value={pair.left}
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
                            value={pair.right}
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
                                const newPairs = (question.pairs || []).filter(
                                  (_, idx) => idx !== i,
                                );
                                updateQuestion(question.id, { pairs: newPairs });
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-9 w-9"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          {!i || i === 1 ? <div className="w-9 flex-shrink-0" /> : null}
                        </div>
                      ),
                    )}
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
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-800">
                        💡 Complete pairs:{' '}
                        {(question.pairs || []).filter(
                          p => p.left.trim() && p.right.trim(),
                        ).length}{' '}
                        / Minimum required: 2
                      </p>
                    </div>
                  </div>
                )}

                {question.type === 'enumeration' && (
                  <div className="space-y-3">
                    <Label className="text-pink-700">Correct Answers (List)</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Add each correct answer as a separate entry
                    </p>
                    <div className="space-y-2 bg-pink-50 p-3 rounded-lg border border-pink-200">
                      {(Array.isArray(question.correct_answer)
                        ? question.correct_answer
                        : ['']
                      ).map((answer, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-sm text-gray-700 w-6 mt-2 flex-shrink-0">
                            {i + 1}.
                          </span>
                          <Input
                            value={answer}
                            onChange={e => {
                              const answers = Array.isArray(question.correct_answer)
                                ? [...question.correct_answer]
                                : [''];
                              answers[i] = e.target.value;
                              updateQuestion(question.id, { correct_answer: answers });
                            }}
                            placeholder={`Answer ${i + 1}`}
                            className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 flex-1 bg-white"
                          />
                          {i > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const answers = Array.isArray(question.correct_answer)
                                  ? question.correct_answer.filter((_, idx) => idx !== i)
                                  : [];
                                updateQuestion(question.id, { correct_answer: answers });
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-9 w-9"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const answers = Array.isArray(question.correct_answer)
                          ? [...question.correct_answer, '']
                          : [''];
                        updateQuestion(question.id, { correct_answer: answers });
                      }}
                      className="border-pink-300 text-pink-600 hover:bg-pink-50 w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Answer
                    </Button>
                    <p className="text-xs text-gray-500 italic">
                      💡 Students will need to provide all{' '}
                      {Array.isArray(question.correct_answer)
                        ? question.correct_answer.filter(a => a.trim()).length
                        : 0}{' '}
                      answers
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-pink-700">Explanation (Optional)</Label>
                  <Textarea
                    value={question.explanation}
                    onChange={e =>
                      updateQuestion(question.id, { explanation: e.target.value })
                    }
                    placeholder="Explain why this is the correct answer..."
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
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
    <div className="max-w-4xl mx-auto space-y-6 pb-24 pt-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Materials
          </Button>
          <h1 className="text-2xl md:text-3xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            {editQuizId ? 'Edit Quiz' : 'Create Custom Quiz'}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Build your own personalized quiz with custom questions
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-pink-100 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
            <CardTitle className="text-pink-700">Quiz Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-pink-700">Quiz Title *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., World History Chapter 5"
                className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-pink-700">Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of what this quiz covers..."
                className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-pink-700">Category</Label>
              <Select
                value={category}
                onValueChange={(value: string) => {
                  setCategory(value);
                  if (value !== 'Other') setCustomCategory('');
                }}
              >
                <SelectTrigger className="border-pink-200 focus:border-pink-400 focus:ring-pink-400">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {category === 'Other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category..."
                    className="border-pink-200 focus:border-pink-400 mt-2 bg-pink-50/30"
                  />
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-pink-700">Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags (press Enter)"
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
                <Button
                  onClick={addTag}
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-pink-100 text-pink-700"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-pink-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl text-pink-700">Questions ({questions.length})</h2>
            <p className="text-sm text-gray-600">Click on a question to edit it</p>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {questions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-pink-50 rounded-2xl border-2 border-dashed border-pink-200"
              >
                <p className="text-gray-500 mb-4">No questions yet</p>
                <Button
                  onClick={addQuestion}
                  variant="outline"
                  className="border-pink-300 text-pink-600 hover:bg-pink-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Question
                </Button>
              </motion.div>
            ) : (
              questions.map((question, index) => renderQuestionEditor(question, index))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-20 right-4 z-40"
        >
          <Button
            onClick={addQuestion}
            size="lg"
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-xl rounded-full flex items-center gap-2 px-5 h-12"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Question</span>
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-pink-200 shadow-2xl z-50"
      >
        <div className="max-w-4xl mx-auto p-3 sm:p-4 flex gap-2 sm:gap-3 justify-end items-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-pink-200 text-pink-600 hover:bg-pink-50 h-10 sm:h-11"
          >
            <X className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Cancel</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSaveTopLevel}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white disabled:opacity-50 h-10 sm:h-11"
          >
            <Save className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {editQuizId ? 'Update Quiz' : 'Save Quiz'}
            </span>
            <span className="sm:hidden">{editQuizId ? 'Update' : 'Save'}</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
