import { useState } from 'react';
import { ArrowLeft, Bell, Check, Trophy, Zap, Clock, Star, Target, BookOpen, X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface NotificationsProps {
  onBack: () => void;
}

interface Notification {
  id: string;
  type: 'achievement' | 'reminder' | 'streak' | 'quiz' | 'update' | 'level';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: any;
  color: string;
}

import { useNotifications } from '../contexts/NotificationContext';
import { useProgress } from '../contexts/ProgressContext';

export function Notifications({ onBack }: NotificationsProps) {
  const { notifications: contextNotifications, markAsRead: contextMarkAsRead, markAllAsRead: contextMarkAllAsRead, clearNotification, clearAllNotifications } = useNotifications();
  const { getProgressStats, achievements } = useProgress();
  const [filterType, setFilterType] = useState<string>('all');
  
  // Get real-time stats with error handling
  const stats = getProgressStats() || {
    totalQuizzes: 0,
    averageScore: 0,
    currentStreak: 0,
    typesMastered: 0,
    todayQuizzes: 0,
    todayScore: 0,
    todayQuestionsAnswered: 0,
    totalPoints: 0,
    level: 1,
    levelProgress: 0,
    pointsToNextLevel: 300
  };
  
  const unlockedAchievements = achievements?.filter(a => a.unlocked).length || 0;
  const totalAchievements = achievements?.length || 0;
  
  // Get recently unlocked achievements (within last 7 days)
  const recentlyUnlocked = achievements?.filter(a => {
    if (!a.unlocked || !a.unlockedAt) return false;
    const daysSinceUnlock = (Date.now() - a.unlockedAt) / (1000 * 60 * 60 * 24);
    return daysSinceUnlock <= 7;
  }) || [];

  const notifications = filterType === 'all' 
    ? contextNotifications 
    : contextNotifications.filter(n => n.type === filterType);
  const unreadCount = contextNotifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    contextMarkAsRead(id);
  };

  const markAllAsRead = () => {
    contextMarkAllAsRead();
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    clearNotification(id);
    toast.success('Notification deleted');
  };

  const clearAll = () => {
    clearAllNotifications();
    toast.success('All notifications cleared');
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'achievement': return Trophy;
      case 'quiz': return BookOpen;
      case 'reminder': return Bell;
      case 'streak': return Zap;
      case 'level': return Star;
      case 'update': return Target;
      default: return Bell;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'achievement': return 'text-yellow-500 bg-yellow-50';
      case 'quiz': return 'text-blue-500 bg-blue-50';
      case 'reminder': return 'text-purple-500 bg-purple-50';
      case 'streak': return 'text-orange-500 bg-orange-50';
      case 'level': return 'text-pink-500 bg-pink-50';
      case 'update': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) return 'Recently';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getNotificationsByType = (type: string) => {
    return (contextNotifications || []).filter(n => n.type === type);
  };

  const todayNotifications = (notifications || []).filter(n => {
    const diff = Date.now() - (n.timestamp || Date.now());
    return diff < 86400000; // Less than 24 hours
  });
  
  const yesterdayNotifications = (notifications || []).filter(n => {
    const diff = Date.now() - (n.timestamp || Date.now());
    return diff >= 86400000 && diff < 172800000; // Between 24-48 hours
  });
  
  const olderNotifications = (notifications || []).filter(n => {
    const diff = Date.now() - (n.timestamp || Date.now());
    return diff >= 172800000; // More than 48 hours
  });

  const NotificationItem = ({ notification }: { notification: any }) => {
    const Icon = getIconForType(notification.type);
    const colorClass = getColorForType(notification.type);
    
    // Extract metadata for display
    const metadata = notification.metadata || {};
    const showProgress = metadata.progress !== undefined && metadata.maxProgress !== undefined;
    const progressPercentage = showProgress ? (metadata.progress / metadata.maxProgress) * 100 : 0;
    const isAchievement = notification.type === 'achievement';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`p-4 border-l-4 ${
          isAchievement 
            ? notification.read
              ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-yellow-500'
              : 'bg-gradient-to-r from-yellow-100 to-amber-100 border-l-yellow-600'
            : notification.read 
              ? 'bg-gray-50 border-l-gray-300' 
              : 'bg-pink-50 border-l-pink-500'
        } rounded-r-lg ${isAchievement ? 'ring-2 ring-yellow-200' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${notification.read ? 'bg-gray-100' : colorClass.split(' ')[1]} ${
            isAchievement && !notification.read ? 'ring-2 ring-yellow-400 ring-offset-2 animate-pulse' : ''
          }`}>
            {notification.icon ? <span className="text-xl">{notification.icon}</span> : <Icon className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className={`${!notification.read ? 'font-semibold' : ''} text-gray-900 ${
                  isAchievement ? 'text-yellow-900' : ''
                }`}>
                  {notification.title}
                  {isAchievement && !notification.read && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-200 text-yellow-800 animate-pulse">
                      NEW
                    </span>
                  )}
                </h4>
                <p className="text-gray-600 text-sm mt-1">
                  {notification.message}
                </p>
                
                {/* Display metadata details */}
                {(metadata.score !== undefined || metadata.points !== undefined || metadata.streakCount !== undefined || metadata.level !== undefined) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {metadata.score !== undefined && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        Score: {metadata.score}%
                      </Badge>
                    )}
                    {metadata.points !== undefined && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        +{metadata.points} points
                      </Badge>
                    )}
                    {metadata.streakCount !== undefined && (
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                        {metadata.streakCount} day streak
                      </Badge>
                    )}
                    {metadata.level !== undefined && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                        Level {metadata.level}
                      </Badge>
                    )}
                  </div>
                )}
                
                
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(notification.timestamp)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      notification.type === 'achievement' ? 'border-yellow-300 text-yellow-700' :
                      notification.type === 'streak' ? 'border-orange-300 text-orange-700' :
                      notification.type === 'quiz' ? 'border-green-300 text-green-700' :
                      notification.type === 'reminder' ? 'border-blue-300 text-blue-700' :
                      notification.type === 'level' ? 'border-pink-300 text-pink-700' :
                      notification.type === 'update' ? 'border-purple-300 text-purple-700' :
                      'border-gray-300 text-gray-700'
                    }`}
                  >
                    {notification.type}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsRead(notification.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteNotification(notification.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 pt-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <Button variant="ghost" onClick={onBack} className="p-2 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl truncate">
              Notifications
              {filterType !== 'all' && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filterType}
                </Badge>
              )}
            </h1>
            {unreadCount > 0 ? (
              <p className="text-pink-600 text-xs md:text-sm">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-gray-500 text-xs md:text-sm">
                All caught up! {contextNotifications.length} total notification{contextNotifications.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-1 md:gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {filterType === 'all' ? 'All' : filterType}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                All Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('achievement')}>
                <Trophy className="w-4 h-4 mr-2" /> Achievements
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('streak')}>
                <Zap className="w-4 h-4 mr-2" /> Streaks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('quiz')}>
                <BookOpen className="w-4 h-4 mr-2" /> Quiz Results
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('level')}>
                <Star className="w-4 h-4 mr-2" /> Level Ups
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('reminder')}>
                <Bell className="w-4 h-4 mr-2" /> Reminders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('update')}>
                <Target className="w-4 h-4 mr-2" /> Updates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="text-xs md:text-sm px-2 md:px-4">
              <span className="hidden md:inline">Mark all read</span>
              <span className="md:hidden">Mark</span>
            </Button>
          )}
          {contextNotifications.length > 0 && (
            <Button variant="outline" onClick={clearAll} className="text-xs md:text-sm px-2 md:px-4">
              <span className="hidden md:inline">Clear all</span>
              <span className="md:hidden">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl text-gray-600 mb-2">
              {filterType === 'all' ? 'No notifications' : `No ${filterType} notifications`}
            </h3>
            <p className="text-gray-500">
              {filterType === 'all' 
                ? "You're all caught up! We'll notify you when there's something new."
                : `No ${filterType} notifications yet. They'll appear here when available.`}
            </p>
          </motion.div>
          
        </>
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {todayNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg mb-4 text-gray-800">Today</h2>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {todayNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Yesterday */}
          {yesterdayNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg mb-4 text-gray-800">Yesterday</h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {yesterdayNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Older */}
          {olderNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg mb-4 text-gray-800">Earlier</h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {olderNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}