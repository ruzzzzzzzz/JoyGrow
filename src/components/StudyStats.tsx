import { Calendar, Clock, Target, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ProgressRing } from './ProgressRing';
import { motion } from 'motion/react';

interface StudyStatsProps {
  stats: {
    dailyGoal: number;
    dailyProgress: number;
    weeklyStreak: number;
    totalQuizzes: number;
    studyTime: number;
    accuracy: number;
  };
}

export function StudyStats({ stats }: StudyStatsProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const statCards = [
    {
      icon: Target,
      title: 'Daily Goal',
      value: `${stats.dailyProgress}/${stats.dailyGoal}`,
      subtitle: 'questions',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      progress: (stats.dailyProgress / stats.dailyGoal) * 100,
    },
    {
      icon: Calendar,
      title: 'Study Streak',
      value: stats.weeklyStreak.toString(),
      subtitle: 'days',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Clock,
      title: 'Study Time',
      value: formatTime(stats.studyTime),
      subtitle: 'today',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Trophy,
      title: 'Accuracy',
      value: `${stats.accuracy}%`,
      subtitle: 'this week',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-2 md:mb-3`}>
                  <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-600 text-xs md:text-sm">{stat.title}</p>
                  <p className={`text-base md:text-lg ${stat.color}`}>{stat.value}</p>
                  <p className="text-gray-500 text-xs">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}