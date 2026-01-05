import { useState } from 'react';
import { Brain, Play, BookOpen, Target, Zap, CheckCircle, Star, Trophy, Plus, Edit2, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { predefinedQuizzes, getQuizByType } from '../data/predefinedQuizzes';
import { OfflineQuiz } from '../data/offlineQuizzes';
import { useProgress } from '../contexts/ProgressContext';
import { useCustomQuiz } from '../contexts/CustomQuizContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';

interface StudyMaterialsProps {
  onGenerateQuiz: (quizzes: OfflineQuiz[]) => void;
  onCreateQuiz: () => void;
  onEditQuiz: (quizId: string) => void;
  isOffline?: boolean;
}

interface QuizTypeInfo {
  type: OfflineQuiz['type'];
  title: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  color: string;
  bgColor: string;
  estimatedTime: string;
  questionsCount: number;
}

const quizTypes: QuizTypeInfo[] = [
  {
    type: 'multiple_choice',
    title: 'Multiple Choice',
    description: 'Choose the correct answer from 4 options. Perfect for testing factual knowledge and comprehension.',
    icon: '📘',
    difficulty: 'easy',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    estimatedTime: '3-5 min',
    questionsCount: 1
  },
  {
    type: 'true_false',
    title: 'Modified True or False',
    description: 'Underlined text shows what to evaluate. If false, replace it with the correct text in the blank.',
    icon: '✓✗',
    difficulty: 'easy',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    estimatedTime: '3-5 min',
    questionsCount: 1
  },
  {
    type: 'fill_blank',
    title: 'Fill in the Blank',
    description: 'Complete sentences by filling in missing words. Tests specific terminology and concepts.',
    icon: '___',
    difficulty: 'medium',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    estimatedTime: '4-6 min',
    questionsCount: 1
  },
  {
    type: 'matching',
    title: 'Matching',
    description: 'Connect related items from two columns. Excellent for learning relationships and associations.',
    icon: '↔️',
    difficulty: 'medium',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    estimatedTime: '5-8 min',
    questionsCount: 1
  },
  {
    type: 'enumeration',
    title: 'Enumeration',
    description: 'List multiple correct answers. Perfect for testing comprehensive knowledge of categories.',
    icon: '📝',
    difficulty: 'hard',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    estimatedTime: '6-10 min',
    questionsCount: 1
  },
  {
    type: 'identification',
    title: 'Identification',
    description: 'Provide detailed answers to open-ended questions. Tests deep understanding and analysis.',
    icon: '🔍',
    difficulty: 'hard',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    estimatedTime: '8-12 min',
    questionsCount: 1
  }
];

export function StudyMaterials({ onGenerateQuiz, onCreateQuiz, onEditQuiz, isOffline = false }: StudyMaterialsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const { getQuizTypeProgress, getProgressStats } = useProgress();
  const { customQuizzes, deleteQuiz } = useCustomQuiz();
  const quizzesPerPage = 6;

  const handleStartCustomQuiz = (quizId: string) => {
    const quiz = customQuizzes.find(q => q.id === quizId);
    if (quiz) {
      onGenerateQuiz(quiz.questions as OfflineQuiz[]);
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    deleteQuiz(quizId);
    toast.success('Quiz deleted successfully');
  };

  const handleStartPracticeQuiz = () => {
    const allQuizzes: OfflineQuiz[] = [];
    quizTypes.forEach(quizType => {
      const quiz = getQuizByType(quizType.type);
      if (quiz) {
        allQuizzes.push(quiz);
      }
    });
    
    if (allQuizzes.length > 0) {
      onGenerateQuiz(allQuizzes);
      toast.success('Starting practice quiz with all 6 question types! 🎯');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredQuizzes = customQuizzes.filter(quiz => {
    return quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredQuizzes.length / quizzesPerPage);
  const startIndex = (currentPage - 1) * quizzesPerPage;
  const endIndex = startIndex + quizzesPerPage;
  const paginatedQuizzes = filteredQuizzes.slice(startIndex, endIndex);

  const categories = Array.from(new Set(customQuizzes.map(q => q.category)));

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterCategory(value);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-16 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl md:text-3xl mb-2 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Study Materials
        </h1>
        <p className="text-sm md:text-base text-gray-600 mb-4 px-2">
          Create custom quizzes and practice with our curated collection
        </p>
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4 md:mb-6 px-2">
          <Badge variant="outline" className="flex items-center gap-1 text-xs md:text-sm bg-pink-50 border-pink-200">
            <Brain className="w-3 h-3 md:w-4 md:h-4 text-pink-600" />
            {customQuizzes.length} Quiz{customQuizzes.length !== 1 ? 'zes' : ''}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-xs md:text-sm bg-rose-50 border-rose-200">
            <Target className="w-3 h-3 md:w-4 md:h-4 text-rose-600" />
            6 Quiz Types
          </Badge>
          {isOffline ? (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs md:text-sm bg-gray-100 text-gray-700">
              📱 Offline Mode
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs md:text-sm bg-green-100 text-green-700">
              🌐 Online Mode
            </Badge>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              My Custom Quizzes
            </h2>
            <p className="text-gray-600 text-sm">Create and manage your own quizzes</p>
          </div>
          <Button
            onClick={onCreateQuiz}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        </div>

        {customQuizzes.length === 0 ? (
          <Card className="bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 border-2 border-pink-200">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg text-pink-800 mb-2">No Custom Quizzes Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first custom quiz to personalize your learning experience
              </p>
              <Button
                onClick={onCreateQuiz}
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {filteredQuizzes.length === 0 ? (
              <Card className="bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 border-2 border-pink-200">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">No quizzes found matching your search</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedQuizzes.map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="h-full border-2 border-pink-100 hover:border-pink-300 transition-all shadow-sm hover:shadow-md bg-gradient-to-br from-white to-pink-50">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                              {quiz.category}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditQuiz(quiz.id)}
                                className="h-8 w-8 p-0 text-pink-600 hover:text-pink-700 hover:bg-pink-100"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{quiz.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteQuiz(quiz.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          <CardTitle className="text-lg text-pink-800 line-clamp-2">
                            {quiz.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {quiz.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {quiz.description}
                            </p>
                          )}

                          <div className="space-y-2">
                            <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2 md:gap-1.5 text-sm">
                              <span className="flex items-center gap-2 text-gray-500">
                                <Brain className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}</span>
                              </span>
                              <span className="flex items-center gap-2 text-gray-500">
                                <CalendarIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{formatDate(quiz.createdAt)}</span>
                              </span>
                            </div>

                            {quiz.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {quiz.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs bg-white border-pink-200 text-pink-600">
                                    {tag}
                                  </Badge>
                                ))}
                                {quiz.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs bg-white border-pink-200 text-pink-600">
                                    +{quiz.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => handleStartCustomQuiz(quiz.id)}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Quiz
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white disabled:opacity-50"
                    >
                      ← Previous
                    </Button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white disabled:opacity-50"
                    >
                      Next →
                    </Button>
                  </div>
                )}

              </>
            )}
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-500" />
              Your Quiz Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Star className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-blue-600">{getProgressStats().totalQuizzes}</p>
                <p className="text-sm text-gray-600">Quizzes Completed</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-green-600">{getProgressStats().averageScore}%</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Zap className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-orange-600">{getProgressStats().currentStreak}</p>
                <p className="text-sm text-gray-600">Current Streak</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-purple-600">{getProgressStats().typesMastered}</p>
                <p className="text-sm text-gray-600">Types Mastered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 border-2 border-pink-300 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-pink-700">
                <Brain className="w-6 h-6 text-pink-600" />
                Practice Quiz — All Question Types
              </CardTitle>
              <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
                6 Questions
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Test your knowledge across all quiz formats with this comprehensive practice session
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quizTypes.map((quizType) => (
                <div
                  key={quizType.type}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 ${quizType.bgColor} transition-all hover:scale-105`}
                >
                  <span className="text-xl">{quizType.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${quizType.color} truncate`}>
                      {quizType.title}
                    </p>
                    <p className="text-xs text-gray-500">1 question</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 p-3 bg-white/50 rounded-lg border border-pink-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-pink-500" />
                <span>~15-20 min</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Target className="w-4 h-4 text-pink-500" />
                <span>All Difficulty Levels</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-pink-500" />
                <span>Comprehensive Practice</span>
              </div>
            </div>

            <Button
              onClick={handleStartPracticeQuiz}
              className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:via-rose-600 hover:to-orange-600 text-white shadow-md h-12"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Practice Quiz
            </Button>

            <p className="text-xs text-center text-gray-500 italic">
              Practice all question types in one session to build confidence and master every format
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

interface StudyMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'txt' | 'notes';
  subject: string;
  dateAdded: string;
  size: string;
  quizzesGenerated: number;
  tags: string[];
  content?: string;
}

export const sampleStudyMaterials: StudyMaterial[] = [];