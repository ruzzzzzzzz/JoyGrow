/**
 * OfflineQuizSelector Component
 * 
 * This component serves as the Practice Quiz configuration screen.
 * It allows users to customize their quiz experience and then seamlessly
 * transitions to the quiz-taking flow.
 * 
 * FLOW:
 * 1. User configures quiz settings (subject, type, difficulty, count)
 * 2. User clicks "Start Practice Quiz"
 * 3. QuizTaker component displays questions one-by-one
 * 4. QuizResults component shows score and detailed review
 * 
 * FEATURES:
 * - Supports all 6 question types (Multiple Choice, True/False, Fill Blank, 
 *   Matching, Enumeration, Identification)
 * - Randomizable questions
 * - Filterable by subject, type, and difficulty
 * - Works 100% offline
 * - Consistent UI/UX with Custom Quiz flow
 */

import { useState, useEffect } from 'react';
import { Brain, BookOpen, Clock, Target, List, Search, Shuffle, PlayCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { motion } from 'motion/react';
import { getAllSubjects, getRandomOfflineQuiz, getQuizzesByType, getQuizzesBySubjectAndType, OfflineQuiz } from '../data/offlineQuizzes';

interface OfflineQuizSelectorProps {
  onStartQuiz: (quizzes: OfflineQuiz[]) => void;
}

export function OfflineQuizSelector({ onStartQuiz }: OfflineQuizSelectorProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState([10]);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);

  const subjects = getAllSubjects();
  
  const quizTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice', icon: '🔘' },
    { value: 'true_false', label: 'Modified True or False', icon: '✓✗' },
    { value: 'fill_blank', label: 'Fill in the Blank', icon: '___' },
    { value: 'matching', label: 'Matching', icon: '↔️' },
    { value: 'enumeration', label: 'Enumeration', icon: '📝' },
    { value: 'identification', label: 'Identification', icon: '🔍' }
  ];

  // Get available questions based on filters
  const getAvailableQuizCount = () => {
    const filteredQuizzes = getQuizzesBySubjectAndType(
      selectedSubject === 'all' ? undefined : selectedSubject,
      selectedType === 'all' ? undefined : (selectedType as OfflineQuiz['type']),
      1000 // Get a large number to count all available
    );
    return filteredQuizzes.length;
  };

  // Adjust question count when filters change
  useEffect(() => {
    const availableCount = getAvailableQuizCount();
    if (questionCount[0] > availableCount) {
      setQuestionCount([Math.max(5, availableCount)]);
    }
  }, [selectedSubject, selectedType]);

  const handleStartQuiz = () => {
    // Get filtered quizzes based on subject and type
    const quizzes = getQuizzesBySubjectAndType(
      selectedSubject === 'all' ? undefined : selectedSubject,
      selectedType === 'all' ? undefined : (selectedType as OfflineQuiz['type']),
      questionCount[0]
    );

    // Randomize questions if selected
    if (randomizeQuestions) {
      quizzes.sort(() => Math.random() - 0.5);
    }

    onStartQuiz(quizzes.slice(0, questionCount[0]));
  };

  const getQuizTypeSummary = () => {
    const typeCounts: { [key: string]: number } = {};
    quizTypes.forEach(type => {
      typeCounts[type.value] = getQuizzesByType(type.value as OfflineQuiz['type'], 100).length;
    });
    return typeCounts;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-16 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl mb-2 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Practice Quiz
        </h1>
        <p className="text-gray-600">
          Test your knowledge with our curated collection of educational quizzes
        </p>
        <Badge variant="outline" className="mt-2">
          📱 Works offline • 🔄 Syncs when online
        </Badge>
      </motion.div>

      {/* Quiz Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-pink-500" />
              Quiz Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject.charAt(0).toUpperCase() + subject.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quiz Type Selection */}
              <div className="space-y-2">
                <Label>Quiz Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quiz type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {quizTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Count */}
              <div className="space-y-2">
                <Label>Number of Questions: {questionCount[0]}</Label>
                <Slider
                  value={questionCount}
                  onValueChange={setQuestionCount}
                  max={Math.max(5, Math.min(50, getAvailableQuizCount()))}
                  min={5}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Available: {getAvailableQuizCount()} questions
                </p>
              </div>
            </div>

            {/* Randomize Questions Checkbox */}
            <div className="flex items-center space-x-2 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <Checkbox
                id="randomize"
                checked={randomizeQuestions}
                onCheckedChange={(checked: boolean | string) => setRandomizeQuestions(checked as boolean)}
              />
              <div className="flex-1">
                <label
                  htmlFor="randomize"
                  className="text-sm cursor-pointer flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4 text-pink-600" />
                  <span className="font-medium">Randomize Questions</span>
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Questions will appear in a random order each time
                </p>
              </div>
            </div>

            {/* Quiz Summary */}
            <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border-2 border-pink-200">
              <h3 className="font-medium text-pink-800 mb-3 text-center">Your Quiz Setup</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2 rounded border border-pink-200">
                  <span className="text-gray-600">Subject:</span>
                  <p className="font-medium capitalize text-pink-700">
                    {selectedSubject === 'all' ? 'All Subjects' : selectedSubject}
                  </p>
                </div>
                <div className="bg-white p-2 rounded border border-pink-200">
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium text-pink-700">
                    {selectedType === 'all' ? 'All Types' : quizTypes.find(t => t.value === selectedType)?.label}
                  </p>
                </div>
                <div className="bg-white p-2 rounded border border-pink-200 col-span-2">
                  <span className="text-gray-600">Questions:</span>
                  <p className="font-medium text-pink-700">{questionCount[0]} Questions</p>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleStartQuiz}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 px-8 h-14 text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <PlayCircle className="w-6 h-6 mr-2" />
                Start Practice Quiz ({questionCount[0]} questions)
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quiz Type Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5 text-pink-500" />
              All 6 Question Types Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizTypes.map((type, index) => (
                <motion.div
                  key={type.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                    selectedType === type.value
                      ? 'bg-pink-100 border-pink-500 shadow-md'
                      : 'border-gray-200 hover:bg-pink-50 hover:border-pink-300'
                  }`}
                  onClick={() => setSelectedType(type.value)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <h3 className={`font-medium mb-1 ${selectedType === type.value ? 'text-pink-700' : ''}`}>
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {type.value === 'multiple_choice' && 'Choose the correct option from 4 choices'}
                      {type.value === 'true_false' && 'Evaluate underlined text, provide correction if false'}
                      {type.value === 'fill_blank' && 'Complete sentences with missing words'}
                      {type.value === 'matching' && 'Match pairs of related concepts'}
                      {type.value === 'enumeration' && 'List multiple correct answers'}
                      {type.value === 'identification' && 'Identify and explain concepts'}
                    </p>
                    {selectedType === type.value && (
                      <Badge className="mt-2 bg-pink-500">Selected</Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subject Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-500" />
              Subject Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subjects.map((subject, index) => {
                const questionCount = getRandomOfflineQuiz(subject, 100).length;
                return (
                  <motion.div
                    key={subject}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`text-center cursor-pointer transition-all ${
                      selectedSubject === subject
                        ? 'transform scale-105'
                        : ''
                    }`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <div className={`p-4 rounded-lg border-2 transition-all ${
                      selectedSubject === subject
                        ? 'bg-pink-100 border-pink-500 shadow-md'
                        : 'bg-pink-50 border-pink-200 hover:border-pink-400'
                    }`}>
                      <BookOpen className={`w-6 h-6 mx-auto mb-2 ${
                        selectedSubject === subject ? 'text-pink-700' : 'text-pink-600'
                      }`} />
                      <h3 className={`font-medium capitalize ${
                        selectedSubject === subject ? 'text-pink-700' : ''
                      }`}>{subject}</h3>
                      <p className="text-sm text-gray-600">
                        {questionCount} questions
                      </p>
                      {selectedSubject === subject && (
                        <Badge className="mt-2 bg-pink-500 text-xs">Selected</Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}