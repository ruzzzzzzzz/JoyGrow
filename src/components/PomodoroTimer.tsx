import { useState } from 'react';
import { Timer, Play, Pause, RotateCcw, Settings, Coffee, Brain, History, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { usePomodoro } from '../contexts/PomodoroContext';

export function PomodoroTimer() {
  const {
    timeLeft,
    isRunning,
    currentMode,
    sessions,
    completedCycles,
    settings,
    toggleTimer,
    resetTimer,
    switchMode,
    updateSettings,
    getProgress,
    formatTime,
  } = usePomodoro();

  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  const saveSettings = () => {
    // Validate settings
    const validated = {
      workDuration: Math.max(1, Math.min(60, tempSettings.workDuration || 25)),
      breakDuration: Math.max(1, Math.min(30, tempSettings.breakDuration || 5)),
      longBreakDuration: Math.max(1, Math.min(60, tempSettings.longBreakDuration || 15)),
      sessionsUntilLongBreak: Math.max(1, Math.min(10, tempSettings.sessionsUntilLongBreak || 4)),
    };
    updateSettings(validated);
    setTempSettings(validated);
    setShowSettings(false);
  };

  // Calculate stats
  const todaySessions = sessions.filter(s => s.date === new Date().toISOString().split('T')[0]);
  const todayWorkSessions = todaySessions.filter(s => s.type === 'work').length;
  const totalWorkMinutes = sessions.filter(s => s.type === 'work').reduce((acc, s) => acc + s.duration / 60, 0);
  const weekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  }).filter(s => s.type === 'work').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl flex items-center gap-2">
            <Timer className="w-7 h-7 text-pink-500" />
            Pomodoro Timer
          </h1>
          <p className="text-gray-600 mt-1">
            Stay focused with the Pomodoro Technique
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </motion.div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-pink-200">
              <CardHeader>
                <CardTitle>Timer Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Work Duration (minutes)</Label>
                    <div className="relative mt-2">
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={tempSettings.workDuration || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setTempSettings({ ...tempSettings, workDuration: '' as any });
                          } else {
                            const num = parseInt(val);
                            if (!isNaN(num)) {
                              setTempSettings({ ...tempSettings, workDuration: Math.max(1, Math.min(60, num)) });
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (!e.target.value || parseInt(e.target.value) < 1) {
                            setTempSettings({ ...tempSettings, workDuration: 25 });
                          }
                        }}
                        className="pr-8"
                        required
                      />
                      {tempSettings.workDuration && (
                        <button
                          type="button"
                          onClick={() => setTempSettings({ ...tempSettings, workDuration: '' as any })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Break Duration (minutes)</Label>
                    <div className="relative mt-2">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={tempSettings.breakDuration || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setTempSettings({ ...tempSettings, breakDuration: '' as any });
                          } else {
                            const num = parseInt(val);
                            if (!isNaN(num)) {
                              setTempSettings({ ...tempSettings, breakDuration: Math.max(1, Math.min(30, num)) });
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (!e.target.value || parseInt(e.target.value) < 1) {
                            setTempSettings({ ...tempSettings, breakDuration: 5 });
                          }
                        }}
                        className="pr-8"
                        required
                      />
                      {tempSettings.breakDuration && (
                        <button
                          type="button"
                          onClick={() => setTempSettings({ ...tempSettings, breakDuration: '' as any })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Long Break Duration (minutes)</Label>
                    <div className="relative mt-2">
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={tempSettings.longBreakDuration || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setTempSettings({ ...tempSettings, longBreakDuration: '' as any });
                          } else {
                            const num = parseInt(val);
                            if (!isNaN(num)) {
                              setTempSettings({ ...tempSettings, longBreakDuration: Math.max(1, Math.min(60, num)) });
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (!e.target.value || parseInt(e.target.value) < 1) {
                            setTempSettings({ ...tempSettings, longBreakDuration: 15 });
                          }
                        }}
                        className="pr-8"
                        required
                      />
                      {tempSettings.longBreakDuration && (
                        <button
                          type="button"
                          onClick={() => setTempSettings({ ...tempSettings, longBreakDuration: '' as any })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Sessions Until Long Break</Label>
                    <div className="relative mt-2">
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={tempSettings.sessionsUntilLongBreak || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setTempSettings({ ...tempSettings, sessionsUntilLongBreak: '' as any });
                          } else {
                            const num = parseInt(val);
                            if (!isNaN(num)) {
                              setTempSettings({ ...tempSettings, sessionsUntilLongBreak: Math.max(1, Math.min(10, num)) });
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (!e.target.value || parseInt(e.target.value) < 1) {
                            setTempSettings({ ...tempSettings, sessionsUntilLongBreak: 4 });
                          }
                        }}
                        className="pr-8"
                        required
                      />
                      {tempSettings.sessionsUntilLongBreak && (
                        <button
                          type="button"
                          onClick={() => setTempSettings({ ...tempSettings, sessionsUntilLongBreak: '' as any })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveSettings} className="bg-pink-500 hover:bg-pink-600">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <Brain className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <p className="text-xl mb-1">{todayWorkSessions}</p>
            <p className="text-sm text-gray-600">Today's Sessions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xl mb-1">{completedCycles}</p>
            <p className="text-sm text-gray-600">Total Cycles</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xl mb-1">{weekSessions}</p>
            <p className="text-sm text-gray-600">This Week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Coffee className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xl mb-1">{Math.round(totalWorkMinutes)}</p>
            <p className="text-sm text-gray-600">Total Minutes</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={`${currentMode === 'work' ? 'border-pink-300' : 'border-green-300'} border-2`}>
          <CardContent className="p-8">
            {/* Mode Selector */}
            <div className="flex gap-2 justify-center mb-6">
              <Button
                variant={currentMode === 'work' ? 'default' : 'outline'}
                onClick={() => switchMode('work')}
                disabled={isRunning}
                className={currentMode === 'work' ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                <Brain className="w-4 h-4 mr-2" />
                Work
              </Button>
              <Button
                variant={currentMode === 'break' ? 'default' : 'outline'}
                onClick={() => switchMode('break')}
                disabled={isRunning}
                className={currentMode === 'break' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                <Coffee className="w-4 h-4 mr-2" />
                Break
              </Button>
            </div>

            {/* Timer Display */}
            <div className="text-center mb-6">
              <motion.div
                key={timeLeft}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-8xl md:text-9xl mb-4"
              >
                {formatTime(timeLeft)}
              </motion.div>
              <Badge variant="outline" className={`text-lg px-4 py-2 ${
                currentMode === 'work' ? 'border-pink-300 text-pink-600' : 'border-green-300 text-green-600'
              }`}>
                {currentMode === 'work' ? '🧠 Focus Time' : '☕ Break Time'}
              </Badge>
            </div>

            {/* Progress Bar */}
            <Progress 
              value={getProgress()} 
              className="h-2 mb-6"
            />

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              <Button
                size="lg"
                onClick={toggleTimer}
                className={currentMode === 'work' 
                  ? 'bg-pink-500 hover:bg-pink-600 px-8' 
                  : 'bg-green-500 hover:bg-green-600 px-8'
                }
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>

            {/* Cycle Progress */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Progress to long break: {completedCycles % settings.sessionsUntilLongBreak} / {settings.sessionsUntilLongBreak}
              </p>
              <div className="flex gap-1 justify-center">
                {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < completedCycles % settings.sessionsUntilLongBreak
                        ? 'bg-pink-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Session History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-pink-500" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Timer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No sessions completed yet</p>
                <p className="text-sm text-gray-500">Start your first Pomodoro session!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sessions.slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {session.type === 'work' ? (
                        <Brain className="w-5 h-5 text-pink-500" />
                      ) : (
                        <Coffee className="w-5 h-5 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {session.type === 'work' ? 'Work Session' : 'Break Session'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.completedAt).toLocaleDateString()} at{' '}
                          {new Date(session.completedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {Math.round(session.duration / 60)} min
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}