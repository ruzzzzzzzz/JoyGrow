import React from 'react';
import { Trophy, Star, Target, Zap, Clock, Brain, Heart, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { motion } from 'motion/react';

type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: AchievementRarity;
  earnedDate?: string;
}

// Shape coming from ProgressContext (or wherever you pass achievements)
interface IncomingAchievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  rarity?: AchievementRarity;
}

interface AchievementsProps {
  achievements: IncomingAchievement[];
}

// Color map keyed by rarity
const rarityColors: Record<
  AchievementRarity,
  { bg: string; text: string; border: string }
> = {
  common: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
  rare: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  epic: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
  legendary: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
  },
};

export function Achievements({ achievements: passedAchievements }: AchievementsProps) {
  // Normalize incoming achievements into renderable form
  const achievements: Achievement[] = passedAchievements.map((a) => {
    let iconNode: React.ReactNode;

    if (typeof a.icon === 'string') {
      iconNode = <span className="text-2xl">{a.icon}</span>;
    } else {
      const IconComp = a.icon;
      iconNode = <IconComp className="w-6 h-6" />;
    }

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      icon: iconNode,
      earned: a.unlocked || false,
      progress: a.progress,
      maxProgress: a.maxProgress,
      rarity: a.rarity ?? 'common',
      earnedDate: a.unlockedAt
        ? new Date(a.unlockedAt).toLocaleDateString()
        : undefined,
    };
  });

  const earnedAchievements = achievements.filter((a) => a.earned);
  const totalAchievements = achievements.length;
  const completionPercentage =
    totalAchievements > 0
      ? (earnedAchievements.length / totalAchievements) * 100
      : 0;

  // Static preview data for new users
  const availableAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first quiz',
      icon: <Star className="w-5 h-5" />,
      earned: false,
      rarity: 'common',
      progress: 0,
      maxProgress: 1,
      earnedDate: undefined,
    },
    {
      id: '2',
      title: '7-Day Streak',
      description: 'Study for 7 consecutive days',
      icon: <Zap className="w-5 h-5" />,
      earned: false,
      rarity: 'rare',
      progress: 0,
      maxProgress: 7,
      earnedDate: undefined,
    },
    {
      id: '3',
      title: 'Perfect Score',
      description: 'Get 100% on any quiz',
      icon: <Target className="w-5 h-5" />,
      earned: false,
      rarity: 'epic',
      progress: 0,
      maxProgress: 1,
      earnedDate: undefined,
    },
    {
      id: '4',
      title: 'Speed Learner',
      description: 'Complete a quiz in under 2 minutes',
      icon: <Clock className="w-5 h-5" />,
      earned: false,
      rarity: 'rare',
      progress: 0,
      maxProgress: 1,
      earnedDate: undefined,
    },
    {
      id: '5',
      title: 'Quiz Explorer',
      description: 'Generate 10 quizzes',
      icon: <Brain className="w-5 h-5" />,
      earned: false,
      rarity: 'common',
      progress: 0,
      maxProgress: 10,
      earnedDate: undefined,
    },
    {
      id: '6',
      title: '30-Day Champion',
      description: 'Study for 30 consecutive days',
      icon: <Heart className="w-5 h-5" />,
      earned: false,
      rarity: 'legendary',
      progress: 0,
      maxProgress: 30,
      earnedDate: undefined,
    },
    {
      id: '7',
      title: 'Quiz Master',
      description: 'Complete 100 quizzes',
      icon: <Award className="w-5 h-5" />,
      earned: false,
      rarity: 'legendary',
      progress: 0,
      maxProgress: 100,
      earnedDate: undefined,
    },
    {
      id: '8',
      title: 'Early Bird',
      description: 'Study before 8 AM for 3 days',
      icon: <Clock className="w-5 h-5" />,
      earned: false,
      rarity: 'common',
      progress: 0,
      maxProgress: 3,
      earnedDate: undefined,
    },
    {
      id: '9',
      title: 'Study Marathon',
      description: 'Study for over 2 hours in a single day',
      icon: <Trophy className="w-5 h-5" />,
      earned: false,
      rarity: 'epic',
      progress: 0,
      maxProgress: 120,
      earnedDate: undefined,
    },
    {
      id: '10',
      title: 'High Achiever',
      description: 'Score 90% or above on 10 quizzes',
      icon: <Award className="w-5 h-5" />,
      earned: false,
      rarity: 'epic',
      progress: 0,
      maxProgress: 10,
      earnedDate: undefined,
    },
  ];

  // Show preview when user has no earned achievements yet
  if (earnedAchievements.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6 pb-16 md:pb-6 pt-16 md:pt-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements You Can Earn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 mb-6">
              <Trophy className="w-12 h-12 md:w-16 md:h-16 text-pink-300 mx-auto mb-3" />
              <h3 className="text-gray-900 mb-2">Start Your Journey!</h3>
              <p className="text-sm md:text-base text-gray-600 px-4">
                Work hard and unlock these amazing achievements. Complete quizzes,
                maintain streaks, and reach milestones!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableAchievements.map((achievement, index) => {
                const colors = rarityColors[achievement.rarity];

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-gray-200 opacity-80 hover:opacity-100 transition-opacity">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-400 text-lg">
                              {achievement.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-gray-700 truncate">
                                {achievement.title}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`${colors.bg} ${colors.text} border-0 text-xs flex-shrink-0`}
                              >
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>🔒 Locked</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 pt-16">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievement Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Overall Progress</span>
              <span>
                {earnedAchievements.length}/{totalAchievements}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <p className="text-center text-gray-600">
              {Math.round(completionPercentage)}% Complete
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {earnedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {earnedAchievements
                .slice(-3)
                .reverse()
                .map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-lg">
                        {achievement.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-green-700">{achievement.title}</h4>
                      <p className="text-green-600 text-sm">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.earnedDate && (
                      <Badge variant="secondary">
                        {achievement.earnedDate}
                      </Badge>
                    )}
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement, index) => {
          const colors = rarityColors[achievement.rarity];

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`${
                  achievement.earned ? colors.border : 'border-gray-200'
                } ${achievement.earned ? '' : 'opacity-60'}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 ${
                        achievement.earned ? colors.bg : 'bg-gray-100'
                      } rounded-lg flex items-center justify-center`}
                    >
                      <span
                        className={`text-lg ${
                          achievement.earned ? colors.text : 'text-gray-400'
                        }`}
                      >
                        {achievement.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className={
                            achievement.earned
                              ? 'text-gray-900'
                              : 'text-gray-500'
                          }
                        >
                          {achievement.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${colors.bg} ${colors.text} border-0 text-xs`}
                        >
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p
                        className={`mb-3 text-sm ${
                          achievement.earned
                            ? 'text-gray-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {achievement.description}
                      </p>

                      {/* Progress bar for achievements in progress */}
                      {!achievement.earned &&
                        achievement.progress !== undefined &&
                        achievement.maxProgress && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Progress</span>
                              <span>
                                {achievement.progress}/{achievement.maxProgress}
                              </span>
                            </div>
                            <Progress
                              value={
                                (achievement.progress /
                                  achievement.maxProgress) *
                                100
                              }
                              className="h-2"
                            />
                          </div>
                        )}

                      {achievement.earned && achievement.earnedDate && (
                        <p className="text-sm text-green-600">
                          Earned on {achievement.earnedDate}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Sample achievements data
export const sampleAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first quiz',
    icon: <Star className="w-5 h-5" />,
    earned: true,
    rarity: 'common',
    earnedDate: 'Oct 1, 2024',
  },
  {
    id: '2',
    title: 'Study Streak',
    description: 'Study for 7 consecutive days',
    icon: <Zap className="w-5 h-5" />,
    earned: true,
    rarity: 'rare',
    earnedDate: 'Oct 3, 2024',
  },
  {
    id: '3',
    title: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: <Target className="w-5 h-5" />,
    earned: false,
    rarity: 'epic',
    progress: 98,
    maxProgress: 100,
  },
  {
    id: '4',
    title: 'Speed Demon',
    description: 'Complete a quiz in under 2 minutes',
    icon: <Clock className="w-5 h-5" />,
    earned: false,
    rarity: 'rare',
    progress: 2.5,
    maxProgress: 2,
  },
  {
    id: '5',
    title: 'Knowledge Seeker',
    description: 'Generate 50 quizzes',
    icon: <Brain className="w-5 h-5" />,
    earned: false,
    rarity: 'epic',
    progress: 23,
    maxProgress: 50,
  },
  {
    id: '6',
    title: 'Persistent Learner',
    description: 'Study for 30 consecutive days',
    icon: <Heart className="w-5 h-5" />,
    earned: false,
    rarity: 'legendary',
    progress: 7,
    maxProgress: 30,
  },
];
