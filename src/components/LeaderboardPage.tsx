import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  ArrowLeft,
  Trophy,
  Crown,
  Medal,
  WifiOff,
  Wifi,
  RefreshCw,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { db } from '../database';

interface LeaderboardUser {
  id: string;
  username: string;
  fullName: string;
  points: number;
  profilePicture?: string;
  streak?: number;
}

interface LeaderboardPageProps {
  currentUserId: string;
  onBack: () => void;
  isOnline?: boolean;
}

export function LeaderboardPage({
  currentUserId,
  onBack,
  isOnline = true,
}: LeaderboardPageProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('all-time');

  // Load and rank users from database
  const loadLeaderboard = async () => {
    setIsLoading(true);

    try {
      const allUsers = await db.getAllUsers();

      const rankedUsers: LeaderboardUser[] = allUsers
        // NOTE: DB field is is_admin (snake_case)
        .filter((user: any) => user.username !== 'admin123' && !user.is_admin)
        .map((user: any) => ({
          id: user.id,
          username: user.username,
          fullName: user.username,
          // DB uses total_points; keep fallbacks just in case some rows use camelCase
          points:
            user.total_points ??
            user.totalPoints ??
            user.totalpoints ??
            0,
          // DB uses profile_image
          profilePicture: user.profile_image,
          streak: user.streak ?? 0,
        }))
        .sort((a, b) => b.points - a.points);

      setUsers(rankedUsers);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading leaderboard from database:', error);
      toast.error('Failed to load leaderboard');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleRefresh = () => {
    if (!isOnline) {
      toast.error('You must be online to refresh the leaderboard');
      return;
    }
    toast.success('Refreshing leaderboard...');
    loadLeaderboard();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const currentUserRank = users.findIndex((u) => u.id === currentUserId) + 1;
  const currentUserData = users.find((u) => u.id === currentUserId);

  const getFilteredUsers = () => {
    switch (activeTab) {
      case 'weekly':
        return users.slice(0, 10);
      case 'monthly':
        return users.slice(0, 10);
      default:
        return users;
    }
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-rose-100 dark:from-[#1b0b1f] dark:via-[#220422] dark:to-[#1b0b1f] pt-16 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-4 md:p-6 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl flex items-center gap-2">
                <TrendingUp className="w-7 h-7" />
                Leaderboard
              </h1>
              <p className="text-white/90 text-sm mt-1">
                Compete with learners from around the world
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-300" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-300" />
              )}
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                disabled={!isOnline || isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>

          {/* Current User Stats */}
          {currentUserData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-pink-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white">
                    {currentUserData.profilePicture ? (
                      <AvatarImage
                        src={currentUserData.profilePicture}
                        alt={currentUserData.username}
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                        {currentUserData.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div>
                    <p className="font-semibold">{currentUserData.fullName}</p>
                    <p className="text-sm text-pink-700">
                      Your Rank: #{currentUserRank}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-gradient-to-br from-pink-600 via-rose-600 to-rose-700 text-white text-sm font-semibold shadow-[0_0_14px_rgba(190,24,93,0.85),0_0_26px_rgba(190,24,93,0.6)] hover:shadow-[0_0_18px_rgba(190,24,93,1),0_0_34px_rgba(190,24,93,0.8)] transition-all duration-300"
                  >
                    <Zap className="w-4 h-4 fill-white drop-shadow-md" />
                    <span className="text-base tracking-wide">
                      {currentUserData.points.toLocaleString()}
                    </span>
                  </motion.div>
                  <div className="text-[11px] text-pink-700 mt-1 font-semibold tracking-[0.18em] uppercase">
                    points
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all-time">
                <Trophy className="w-4 h-4 mr-2" />
                All Time
              </TabsTrigger>
              <TabsTrigger value="weekly">
                <TrendingUp className="w-4 h-4 mr-2" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly">
                <Award className="w-4 h-4 mr-2" />
                Monthly
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-3 p-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Loading leaderboard...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    No users on the leaderboard yet
                  </p>
                  <p className="text-sm text-gray-500">
                    {!isOnline
                      ? 'Connect to the internet to see the leaderboard'
                      : 'Be the first to earn points!'}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredUsers.map((user, index) => {
                    const rank = index + 1;
                    const isCurrentUser = user.id === currentUserId;

                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`overflow-hidden ${
                            isCurrentUser
                              ? 'ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/20'
                              : ''
                          } ${rank <= 3 ? 'shadow-lg' : ''}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {/* Rank */}
                              <div className="flex-shrink-0 w-12 flex justify-center">
                                {getRankIcon(rank)}
                              </div>

                              {/* User Info */}
                              <Avatar className="h-12 w-12 border-2 border-gray-200">
                                {user.profilePicture ? (
                                  <AvatarImage
                                    src={user.profilePicture}
                                    alt={user.username}
                                  />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                                    {user.username.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold truncate">
                                    {user.fullName}
                                    {isCurrentUser && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-xs"
                                      >
                                        You
                                      </Badge>
                                    )}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                  {(user.streak ?? 0) > 0 && (
                                    <span className="flex items-center gap-1">
                                      🔥 {user.streak}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Points */}
                              <motion.div
                                whileHover={{ scale: 1.04 }}
                                className="text-right flex-shrink-0"
                              >
                                <div className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 bg-gradient-to-br from-pink-600 via-rose-600 to-rose-700 text-white text-xs font-semibold shadow-[0_0_12px_rgba(190,24,93,0.8),0_0_22px_rgba(190,24,93,0.5)] hover:shadow-[0_0_16px_rgba(190,24,93,1),0_0_28px_rgba(190,24,93,0.7)] transition-all duration-300"
                                >
                                  <Zap className="w-3.5 h-3.5 fill-white drop-shadow-sm" />
                                  <span className="tracking-tight">
                                    {user.points.toLocaleString()}
                                  </span>
                                </div>
                              </motion.div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}

              {!isLoading && filteredUsers.length > 0 && (
                <div className="text-center text-xs text-gray-500 pt-4">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Info Card */}
        {!isOnline && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <WifiOff className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Offline Mode</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Connect to the internet to see the latest leaderboard
                    rankings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
