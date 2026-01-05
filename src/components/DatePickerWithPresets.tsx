import { useState } from 'react';
import { CalendarIcon, X, Zap, Calendar as CalendarDaysIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface DatePickerWithPresetsProps {
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
}

export function DatePickerWithPresets({ value, onChange, placeholder = 'Set due date' }: DatePickerWithPresetsProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'quick' | 'calendar'>('quick');

  const selectedDate = value ? new Date(value) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setOpen(false);
    }
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const setPresetDate = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setOpen(false);
  };

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return placeholder;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time parts for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      // Format as "MMM dd, yyyy"
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${
            !value && 'text-muted-foreground'
          }`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplayDate(value)}
          {value && (
            <X
              className="ml-auto h-4 w-4 hover:text-red-500 transition-colors"
              onClick={handleClearDate}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[95vw]" align="start" sideOffset={5}>
        <div className="w-full min-w-[280px] sm:min-w-[320px]">
          {/* Tab Headers - Visible on all devices */}
          <div className="flex border-b bg-gray-50/50">
            <button
              onClick={() => setView('quick')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                view === 'quick'
                  ? 'text-pink-600 border-b-2 border-pink-600 bg-white shadow-sm'
                  : 'text-gray-600 hover:text-pink-500 hover:bg-white/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Quick</span>
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                view === 'calendar'
                  ? 'text-pink-600 border-b-2 border-pink-600 bg-white shadow-sm'
                  : 'text-gray-600 hover:text-pink-500 hover:bg-white/50'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              <span>Calendar</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="bg-white">
            {/* Quick Presets */}
            {view === 'quick' && (
              <div className="p-4 space-y-1.5 min-h-[280px]">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-pink-50 hover:text-pink-700 text-sm h-10 transition-colors"
                  onClick={() => setPresetDate(0)}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  <span>Today</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-pink-50 hover:text-pink-700 text-sm h-10 transition-colors"
                  onClick={() => setPresetDate(1)}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  <span>Tomorrow</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-pink-50 hover:text-pink-700 text-sm h-10 transition-colors"
                  onClick={() => setPresetDate(3)}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  <span>In 3 Days</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-pink-50 hover:text-pink-700 text-sm h-10 transition-colors"
                  onClick={() => setPresetDate(7)}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  <span>Next Week</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-pink-50 hover:text-pink-700 text-sm h-10 transition-colors"
                  onClick={() => setPresetDate(14)}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  <span>In 2 Weeks</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-pink-50 hover:text-pink-700 text-sm h-10 transition-colors"
                  onClick={() => setPresetDate(30)}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  <span>In 1 Month</span>
                </Button>
              </div>
            )}
            
            {/* Calendar */}
            {view === 'calendar' && (
              <div className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="rounded-md"
                />
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
