import { Timer, Play, Pause, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePomodoro } from '../contexts/PomodoroContext';
import { Card } from './ui/card';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface PomodoroWidgetProps {
  onNavigateToTimer: () => void;
  onClose?: () => void;
}

export function PomodoroWidget({ onNavigateToTimer, onClose }: PomodoroWidgetProps) {
  const { timeLeft, isRunning, currentMode, toggleTimer, formatTime } = usePomodoro();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load visibility state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pomodoro-widget-visible');
      if (saved !== null) {
        setIsVisible(saved === 'true');
      }
    } catch (error) {
      console.log('Failed to load visibility state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save visibility state when timer starts
  useEffect(() => {
    if (isRunning && !isLoading) {
      try {
        localStorage.setItem('pomodoro-widget-visible', 'true');
        setIsVisible(true);
      } catch (error) {
        console.error('Failed to save visibility state:', error);
      }
    }
  }, [isRunning, isLoading]);

  // Don't show widget if timer is at default state and not running, or if user closed it
  if (isLoading || !isVisible || (!isRunning && timeLeft >= 25 * 60 - 5)) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('pomodoro-widget-visible', 'false');
    } catch (error) {
      console.error('Failed to save visibility state:', error);
    }
    onClose?.();
  };

  const buttonBgClass =
    currentMode === 'work' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-green-500 hover:bg-green-600';
  const cardBgClass =
    currentMode === 'work' ? 'bg-pink-50 border-pink-300' : 'bg-green-50 border-green-300';
  const dotBgClass = currentMode === 'work' ? 'bg-pink-500' : 'bg-green-500';
  const textColorClass = currentMode === 'work' ? 'text-pink-700' : 'text-green-700';
  const iconColorClass = currentMode === 'work' ? 'text-pink-600' : 'text-green-600';
  const controlButtonClass =
    currentMode === 'work'
      ? 'bg-pink-500 hover:bg-pink-600 text-white'
      : 'bg-green-500 hover:bg-green-600 text-white';
  const linkColorClass =
    currentMode === 'work' ? 'text-pink-600 hover:text-pink-700' : 'text-green-600 hover:text-green-700';

  return (
    <AnimatePresence>
      {/* Toggle button - positioned in bottom-right corner on all screen sizes */}
      <motion.div
        key="toggle-button"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50"
      >
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center ${buttonBgClass} text-white transition-colors`}
          aria-label={isMinimized ? 'Expand timer' : 'Collapse timer'}
        >
          {isMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </motion.div>

      {/* Widget card */}
      {!isMinimized && (
        <motion.div
          key="widget-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-36 right-4 md:bottom-20 md:right-6 z-40 max-w-[280px]"
        >
          <Card className={`${cardBgClass} border-2 shadow-xl`}>
            {/* Header with close button */}
            <div className="flex items-center justify-between p-2 border-b border-current/10">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Timer className={`w-4 h-4 ${iconColorClass}`} />
                  {isRunning && (
                    <motion.div
                      className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${dotBgClass}`}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </div>
                <span className={`text-xs ${textColorClass}`}>
                  {currentMode === 'work' ? 'Focus Time' : 'Break Time'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-6 w-6 rounded-full hover:bg-current/10"
                aria-label="Close timer"
              >
                <X className={`w-3 h-3 ${iconColorClass}`} />
              </Button>
            </div>

            {/* Timer content */}
            <div
              className="p-4 cursor-pointer hover:bg-current/5 transition-colors"
              onClick={onNavigateToTimer}
            >
              <div className="flex flex-col items-center gap-3">
                {/* Timer display */}
                <div className="text-center">
                  <p className={`text-sm mb-1 ${textColorClass}`}>
                    {currentMode === 'work' ? '🧠 Focus Session' : '☕ Break Time'}
                  </p>
                  <p className="text-3xl font-mono tabular-nums">{formatTime(timeLeft)}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTimer();
                    }}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm ${controlButtonClass} transition-colors flex items-center justify-center gap-2`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                </div>

                {/* View full timer link */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTimer();
                  }}
                  className={`text-xs underline ${linkColorClass}`}
                >
                  View Full Timer
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}