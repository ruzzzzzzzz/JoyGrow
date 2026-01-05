import { Brain, BookOpen, Clock, CheckSquare, Sparkles, Zap, Trophy, Timer, StickyNote, Target, TrendingUp, Activity, History, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { useProgress } from '../contexts/ProgressContext';
import { useTodos } from '../contexts/TodoContext';
import { usePomodoro } from '../contexts/PomodoroContext';

interface QuickActionsProps {
  onStartQuiz: () => void;
  onViewMaterials: () => void;
  onViewTodos: () => void;
  onViewPomodoro: () => void;
  onCreateQuiz?: () => void;
  onViewNotes?: () => void;
  onViewAchievements?: () => void;
}

export function QuickActions({ 
  onStartQuiz, 
  onViewMaterials, 
  onViewTodos, 
  onViewPomodoro,
  onCreateQuiz,
  onViewNotes,
  onViewAchievements
}: QuickActionsProps) {
  
  const { getProgressStats, quizAttempts } = useProgress();
  const { getActiveTodos, getTodayTodos } = useTodos();
  const { isRunning, timeLeft } = usePomodoro();
  
  const stats = getProgressStats();
  const activeTodos = getActiveTodos();
  const todayTodos = getTodayTodos();
  const recentQuizzes = quizAttempts.slice(-5).reverse();

  // Learning Actions
  const learningActions = [
    {
      id: 'ai-quiz',
      title: 'AI Quiz Generator',
      description: 'Generate smart questions from any topic',
      icon: Brain,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      badge: '⚡ Quick',
      action: onStartQuiz
    },
    {
      id: 'custom-quiz',
      title: 'Build Custom Quiz',
      description: 'Create personalized quiz questions',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      badge: '🎨 Custom',
      action: onCreateQuiz
    },
    {
      id: 'study-library',
      title: 'Study Library',
      description: 'Browse all saved quizzes & materials',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      action: onViewMaterials
    }
  ];

  // Productivity Actions
  const productivityActions = [
    {
      id: 'pomodoro',
      title: 'Pomodoro Focus',
      description: isRunning ? `Active: ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')} left` : '25-minute focused study sessions',
      icon: Timer,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      badge: isRunning ? '🔥 Active' : '⏱️ Start',
      active: isRunning,
      action: onViewPomodoro
    },
    {
      id: 'tasks',
      title: 'Task Manager',
      description: `${activeTodos.length} active tasks • ${todayTodos.length} due today`,
      icon: CheckSquare,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      badge: activeTodos.length > 0 ? `${activeTodos.length} active` : '✓ All done',
      action: onViewTodos
    },
    {
      id: 'notes',
      title: 'Quick Notes',
      description: 'Jot down ideas and study notes',
      icon: StickyNote,
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      action: onViewNotes
    }
  ];

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-7 h-7 text-pink-600" />
                  <h1 className="text-3xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    Quick Actions
                  </h1>
                </div>
                <p className="text-gray-600">
                  Lightning-fast access to all your learning tools
                </p>
              </div>
              <Badge className="bg-pink-500 text-white">
                Level {stats.level}
              </Badge>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <Target className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Today's Goal</p>
                <p className="text-lg text-pink-600">{stats.todayQuestionsAnswered}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <TrendingUp className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Streak</p>
                <p className="text-lg text-orange-600">{stats.currentStreak} 🔥</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <Activity className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Total Quizzes</p>
                <p className="text-lg text-blue-600">{stats.totalQuizzes}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <Star className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Accuracy</p>
                <p className="text-lg text-purple-600">{stats.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Learning Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-pink-500" />
              Learning Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {learningActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={action.action}
                    className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-pink-300 transition-all bg-white hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center`}>
                        <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                      </div>
                      {action.badge && (
                        <Badge variant="outline" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Productivity Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Productivity Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {productivityActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={action.action}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      action.active 
                        ? 'border-orange-400 bg-orange-50 shadow-lg' 
                        : 'border-gray-200 hover:border-pink-300 bg-white hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center ${action.active ? 'animate-pulse' : ''}`}>
                        <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                      </div>
                      {action.badge && (
                        <Badge variant={action.active ? "default" : "outline"} className={action.active ? "bg-orange-500" : "text-xs"}>
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quiz Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Recent Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {recentQuizzes.map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm line-clamp-1">{quiz.quizTitle}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(quiz.timestamp)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={quiz.score >= 80 ? "default" : "secondary"} className={quiz.score >= 80 ? "bg-green-500" : ""}>
                          {quiz.score}%
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No quiz history yet</p>
                  <p className="text-xs">Start your first quiz!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Achievement Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={onViewAchievements}
                className="w-full p-8 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 hover:border-yellow-300 transition-all hover:shadow-lg group"
              >
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl mb-2">View Your Achievements</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Track your progress and unlock rewards
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge className="bg-pink-500">{stats.totalQuizzes} Quizzes</Badge>
                  <Badge className="bg-purple-500">{stats.currentStreak} Day Streak</Badge>
                </div>
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}