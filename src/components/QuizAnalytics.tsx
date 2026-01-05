import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Brain, Award, ChevronRight, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface QuizAttempt {
  id: string;
  date: Date;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeTaken: number;
  answers: { [key: string]: string | string[] };
  quizzes?: any[];
}

interface QuizAnalyticsProps {
  attempts: QuizAttempt[];
  onReviewAttempt: (attempt: QuizAttempt) => void;
  onBack: () => void;
}

interface QuestionTypeStats {
  type: string;
  total: number;
  correct: number;
  accuracy: number;
}

const COLORS = {
  identification: '#ec4899',
  multiple_choice: '#3b82f6',
  true_false: '#8b5cf6',
  fill_blank: '#f59e0b',
  matching: '#10b981',
  enumeration: '#ef4444',
};

const QUESTION_TYPE_LABELS = {
  identification: 'Identification',
  multiple_choice: 'Multiple Choice',
  true_false: 'Modified True/False',
  fill_blank: 'Fill in the Blank',
  matching: 'Matching',
  enumeration: 'Enumeration',
};

export function QuizAnalytics({ attempts, onReviewAttempt, onBack }: QuizAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [questionTypeStats, setQuestionTypeStats] = useState<QuestionTypeStats[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);

  useEffect(() => {
    calculateStats();
  }, [attempts, selectedPeriod]);

  const calculateStats = () => {
    if (attempts.length === 0) return;

    // Filter attempts based on selected period
    const now = new Date();
    const filteredAttempts = attempts.filter(attempt => {
      const attemptDate = new Date(attempt.date);
      const daysDiff = Math.floor((now.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (selectedPeriod === 'week') return daysDiff <= 7;
      if (selectedPeriod === 'month') return daysDiff <= 30;
      return true;
    });

    // Calculate question type statistics
    const typeStats: { [key: string]: { total: number; correct: number } } = {};
    
    filteredAttempts.forEach(attempt => {
      if (!attempt.quizzes) return;
      
      attempt.quizzes.forEach((quiz: any) => {
        const type = quiz.type;
        if (!typeStats[type]) {
          typeStats[type] = { total: 0, correct: 0 };
        }
        typeStats[type].total++;
        
        // Check if answer was correct
        const userAnswer = attempt.answers[quiz.id];
        const correctAnswer = quiz.correct_answer;
        
        if (isCorrectAnswer(userAnswer, correctAnswer, quiz.type)) {
          typeStats[type].correct++;
        }
      });
    });

    const stats: QuestionTypeStats[] = Object.entries(typeStats).map(([type, data]) => ({
      type,
      total: data.total,
      correct: data.correct,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    }));

    setQuestionTypeStats(stats);

    // Calculate performance trend (last 10 attempts)
    const trend = filteredAttempts
      .slice(-10)
      .map((attempt, index) => ({
        attempt: index + 1,
        score: attempt.score,
        accuracy: (attempt.correctAnswers / attempt.totalQuestions) * 100,
      }));

    setPerformanceTrend(trend);
  };

  const isCorrectAnswer = (userAnswer: string | string[] | undefined, correctAnswer: string | string[], questionType: string): boolean => {
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
  };

  const totalQuizzesTaken = attempts.length;
  const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
  const totalCorrect = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const averageScore = attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length : 0;
  const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeTaken, 0);

  const recentAttempts = attempts.slice(-5).reverse();

  // Find weak areas (question types with < 70% accuracy)
  const weakAreas = questionTypeStats.filter(stat => stat.accuracy < 70);
  const strongAreas = questionTypeStats.filter(stat => stat.accuracy >= 85);

  // Prepare data for charts
  const accuracyChartData = questionTypeStats.map(stat => ({
    name: QUESTION_TYPE_LABELS[stat.type as keyof typeof QUESTION_TYPE_LABELS] || stat.type,
    accuracy: stat.accuracy,
    type: stat.type,
  }));

  const pieChartData = questionTypeStats.map(stat => ({
    name: QUESTION_TYPE_LABELS[stat.type as keyof typeof QUESTION_TYPE_LABELS] || stat.type,
    value: stat.total,
    type: stat.type,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white hover:bg-white/20 mb-4"
          >
            ← Back
          </Button>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            <div>
              <h1 className="text-2xl">Quiz Analytics</h1>
              <p className="text-pink-100 text-sm">Track your learning progress</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2 justify-center">
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('week')}
            className={selectedPeriod === 'week' ? 'bg-pink-500 hover:bg-pink-600' : ''}
          >
            Last Week
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('month')}
            className={selectedPeriod === 'month' ? 'bg-pink-500 hover:bg-pink-600' : ''}
          >
            Last Month
          </Button>
          <Button
            variant={selectedPeriod === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('all')}
            className={selectedPeriod === 'all' ? 'bg-pink-500 hover:bg-pink-600' : ''}
          >
            All Time
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5" />
                  <span className="text-sm opacity-90">Quizzes Taken</span>
                </div>
                <p className="text-3xl">{totalQuizzesTaken}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5" />
                  <span className="text-sm opacity-90">Total Questions</span>
                </div>
                <p className="text-3xl">{totalQuestions}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5" />
                  <span className="text-sm opacity-90">Avg Score</span>
                </div>
                <p className="text-3xl">{averageScore.toFixed(0)}%</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5" />
                  <span className="text-sm opacity-90">Accuracy</span>
                </div>
                <p className="text-3xl">{overallAccuracy.toFixed(0)}%</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="accuracy" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="accuracy">By Type</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="trend">Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="accuracy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Question Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={accuracyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#ec4899" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Question Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS] || '#888'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="attempt" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="score" stroke="#ec4899" strokeWidth={2} name="Score %" />
                      <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} name="Accuracy %" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    Not enough data to show trend
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Insights Section */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Weak Areas */}
          {weakAreas.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <TrendingDown className="h-5 w-5" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weakAreas.map(area => (
                  <div key={area.type} className="bg-white rounded-lg p-3 border border-orange-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">
                        {QUESTION_TYPE_LABELS[area.type as keyof typeof QUESTION_TYPE_LABELS]}
                      </span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                        {area.accuracy.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={area.accuracy} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">
                      {area.correct} / {area.total} correct
                    </p>
                  </div>
                ))}
                <p className="text-sm text-orange-700 mt-4">
                  💡 Focus on these question types in your next study session!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Strong Areas */}
          {strongAreas.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Strong Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {strongAreas.map(area => (
                  <div key={area.type} className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">
                        {QUESTION_TYPE_LABELS[area.type as keyof typeof QUESTION_TYPE_LABELS]}
                      </span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        {area.accuracy.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={area.accuracy} className="h-2 [&>div]:bg-green-500" />
                    <p className="text-xs text-gray-600 mt-1">
                      {area.correct} / {area.total} correct
                    </p>
                  </div>
                ))}
                <p className="text-sm text-green-700 mt-4">
                  🎉 Great job! Keep up the excellent work!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Attempts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quiz Attempts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAttempts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No quiz attempts yet. Start taking quizzes to see your progress!
              </div>
            ) : (
              recentAttempts.map((attempt, index) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200 hover:border-pink-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">
                          {new Date(attempt.date).toLocaleDateString()} at {new Date(attempt.date).toLocaleTimeString()}
                        </span>
                        <Badge className={attempt.score >= 80 ? 'bg-green-500' : attempt.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}>
                          {attempt.score}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{attempt.correctAnswers} / {attempt.totalQuestions} correct</span>
                        <span>⏱️ {Math.floor(attempt.timeTaken / 60000)}:{((attempt.timeTaken % 60000) / 1000).toFixed(0).padStart(2, '0')}</span>
                      </div>
                    </div>
                    {attempt.correctAnswers < attempt.totalQuestions && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReviewAttempt(attempt)}
                        className="border-pink-300 text-pink-600 hover:bg-pink-50"
                      >
                        Review Wrong Answers
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Study Recommendations */}
        {weakAreas.length > 0 && (
          <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Study Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-pink-100">Based on your recent performance, we recommend:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-pink-200 mt-0.5">•</span>
                  <span>Practice more {QUESTION_TYPE_LABELS[weakAreas[0].type as keyof typeof QUESTION_TYPE_LABELS]} questions to improve your {weakAreas[0].accuracy.toFixed(0)}% accuracy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-200 mt-0.5">•</span>
                  <span>Review your wrong answers to understand common mistakes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-200 mt-0.5">•</span>
                  <span>Create custom quizzes focusing on weak areas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-200 mt-0.5">•</span>
                  <span>Take regular breaks using the Pomodoro timer for better retention</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
