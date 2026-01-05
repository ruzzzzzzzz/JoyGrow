import { useState, useEffect, JSX } from 'react';
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { useProgress } from '../contexts/ProgressContext';
import { useUser } from '../contexts/UserContext';
import { db } from '../database';

interface LoginDate {
  date: string; // YYYY-MM-DD format
  timestamp: number;
}

/**
 * Helper: get today's date as YYYY-MM-DD (local time).
 */
const getTodayYMD = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Given all login dates, compute the set of dates that belong to the
 * current streak (a block of consecutive days ending at today).
 */
const getCurrentStreakSet = (loginDates: LoginDate[]): Set<string> => {
  const today = getTodayYMD();
  const daySet = new Set(loginDates.map((d) => d.date));
  const streakSet = new Set<string>();

  // No login today → no active streak → no fire icons.
  if (!daySet.has(today)) {
    return streakSet;
  }

  let cursor = new Date(today);

  // Walk backwards from today while each previous day also has a login.
  for (let i = 0; i < 365; i++) {
    const cursorStr = cursor.toISOString().split('T')[0];
    if (daySet.has(cursorStr)) {
      streakSet.add(cursorStr);
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streakSet;
};

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loginDates, setLoginDates] = useState<LoginDate[]>([]);
  const { getProgressStats } = useProgress();
  const { currentUser } = useUser();
  const stats = getProgressStats();

  useEffect(() => {
    const loadLoginHistory = async () => {
      if (!currentUser?.id) return;

      try {
        const history = await db.getLoginHistory(currentUser.id);
        const dates: LoginDate[] = history.map((record: any) => ({
          date: record.login_date,
          timestamp: new Date(record.created_at).getTime(),
        }));
        setLoginDates(dates);

        // Ensure today is recorded
        const today = getTodayYMD();
        const hasToday = dates.some((d) => d.date === today);

        if (!hasToday) {
          await db.recordLogin(currentUser.id, today);
          const updatedHistory = await db.getLoginHistory(currentUser.id);
          const updatedDates: LoginDate[] = updatedHistory.map((record: any) => ({
            date: record.login_date,
            timestamp: new Date(record.created_at).getTime(),
          }));
          setLoginDates(updatedDates);
        }
      } catch (error) {
        console.error('Error loading login history from database:', error);
      }
    };

    loadLoginHistory();
  }, [currentUser]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const isToday = (date: string) => date === getTodayYMD();

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Active streak dates ending at today; only these may show fire.
  const currentStreakSet = getCurrentStreakSet(loginDates);

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const days: JSX.Element[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Weekday headers
    dayNames.forEach((name) => {
      days.push(
        <div key={`header-${name}`} className="text-center text-sm text-gray-500 p-2">
          {name}
        </div>,
      );
    });

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const isTodayDate = isToday(dateStr);

      // Core rule: only dates in the current streak get fire.
      const isStreakDay = currentStreakSet.has(dateStr);

      days.push(
        <motion.div key={day} whileHover={{ scale: 1.05 }} className="p-1">
          <div
            className={`
              relative aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer
              transition-all duration-200
              ${isTodayDate ? 'bg-pink-500 text-white ring-2 ring-pink-300' : 'bg-pink-100 text-pink-700'}
            `}
          >
            <span className="text-sm">{day}</span>

            {/* Fire icon ONLY on current-streak days */}
            {isStreakDay && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-400 drop-shadow" />
              </div>
            )}
          </div>
        </motion.div>,
      );
    }

    return days;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentMonthLoginCount = loginDates.filter((d) => {
    const loginDate = new Date(d.date);
    return (
      loginDate.getMonth() === currentDate.getMonth() &&
      loginDate.getFullYear() === currentDate.getFullYear()
    );
  }).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl mb-1">{stats.currentStreak}</p>
            <p className="text-gray-600 text-sm">Day Streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CalendarIcon className="w-8 h-8 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl mb-1">{loginDates.length}</p>
            <p className="text-gray-600 text-sm">Total Days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CalendarIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl mb-1">{currentMonthLoginCount}</p>
            <p className="text-gray-600 text-sm">This Month</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-pink-500" />
                Login Streak Calendar
              </CardTitle>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={previousMonth}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-xl">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button variant="ghost" onClick={nextMonth}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Login Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loginDates.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No login history yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...loginDates]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .slice(0, 10)
                  .map((login, index) => {
                    const date = new Date(login.date);
                    const isTodayDate = login.date === getTodayYMD();

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="w-5 h-5 text-pink-500" />
                          <div>
                            <p className="font-medium">
                              {date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(login.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTodayDate && <Badge className="bg-pink-500">Today</Badge>}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
