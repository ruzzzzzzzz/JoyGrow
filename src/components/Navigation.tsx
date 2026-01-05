import { Home, Brain, FileText, Trophy, Settings, User, Timer, CheckSquare, Menu, X, LogOut, Zap, Bell, Wrench, Mail, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import joyImage from 'figma:asset/ebd33da1c91354be18169c74abee5c02fe5f89cc.png';
import { usePomodoro } from '../contexts/PomodoroContext';
import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  notifications?: number;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  networkIndicator?: React.ReactNode;
  isOfflineMode?: boolean;
}

// Color themes for each nav item
const NAV_COLORS = {
  dashboard: {
    bg: 'hover:bg-pink-50',
    activeBg: 'bg-pink-100',
    text: 'hover:text-pink-700',
    activeText: 'text-pink-900',
    icon: 'group-hover:text-pink-600',
    activeIcon: 'text-pink-600',
    indicator: 'bg-pink-600',
  },
  quiz: {
    bg: 'hover:bg-purple-50',
    activeBg: 'bg-purple-100',
    text: 'hover:text-purple-700',
    activeText: 'text-purple-900',
    icon: 'group-hover:text-purple-600',
    activeIcon: 'text-purple-600',
    indicator: 'bg-purple-600',
  },
  'quick-actions': {
    bg: 'hover:bg-yellow-50',
    activeBg: 'bg-yellow-100',
    text: 'hover:text-yellow-700',
    activeText: 'text-yellow-900',
    icon: 'group-hover:text-yellow-600',
    activeIcon: 'text-yellow-600',
    indicator: 'bg-yellow-600',
  },
  'productivity-tools': {
    bg: 'hover:bg-indigo-50',
    activeBg: 'bg-indigo-100',
    text: 'hover:text-indigo-700',
    activeText: 'text-indigo-900',
    icon: 'group-hover:text-indigo-600',
    activeIcon: 'text-indigo-600',
    indicator: 'bg-indigo-600',
  },
  todos: {
    bg: 'hover:bg-blue-50',
    activeBg: 'bg-blue-100',
    text: 'hover:text-blue-700',
    activeText: 'text-blue-900',
    icon: 'group-hover:text-blue-600',
    activeIcon: 'text-blue-600',
    indicator: 'bg-blue-600',
  },
  timer: {
    bg: 'hover:bg-orange-50',
    activeBg: 'bg-orange-100',
    text: 'hover:text-orange-700',
    activeText: 'text-orange-900',
    icon: 'group-hover:text-orange-600',
    activeIcon: 'text-orange-600',
    indicator: 'bg-orange-600',
  },
  materials: {
    bg: 'hover:bg-green-50',
    activeBg: 'bg-green-100',
    text: 'hover:text-green-700',
    activeText: 'text-green-900',
    icon: 'group-hover:text-green-600',
    activeIcon: 'text-green-600',
    indicator: 'bg-green-600',
  },
  leaderboard: {
    bg: 'hover:bg-amber-50',
    activeBg: 'bg-amber-100',
    text: 'hover:text-amber-700',
    activeText: 'text-amber-900',
    icon: 'group-hover:text-amber-600',
    activeIcon: 'text-amber-600',
    indicator: 'bg-amber-600',
  },
  achievements: {
    bg: 'hover:bg-amber-50',
    activeBg: 'bg-amber-100',
    text: 'hover:text-amber-700',
    activeText: 'text-amber-900',
    icon: 'group-hover:text-amber-600',
    activeIcon: 'text-amber-600',
    indicator: 'bg-amber-600',
  },
  admin: {
    bg: 'hover:bg-indigo-50',
    activeBg: 'bg-indigo-100',
    text: 'hover:text-indigo-700',
    activeText: 'text-indigo-900',
    icon: 'group-hover:text-indigo-600',
    activeIcon: 'text-indigo-600',
    indicator: 'bg-indigo-600',
  },
  profile: {
    bg: 'hover:bg-rose-50',
    activeBg: 'bg-rose-100',
    text: 'hover:text-rose-700',
    activeText: 'text-rose-900',
    icon: 'group-hover:text-rose-600',
    activeIcon: 'text-rose-600',
    indicator: 'bg-rose-600',
  },
  contact: {
    bg: 'hover:bg-cyan-50',
    activeBg: 'bg-cyan-100',
    text: 'hover:text-cyan-700',
    activeText: 'text-cyan-900',
    icon: 'group-hover:text-cyan-600',
    activeIcon: 'text-cyan-600',
    indicator: 'bg-cyan-600',
  },
};

export function Navigation({ currentView, onViewChange, onLogout, isOpen, onOpenChange, notifications, onNotificationsClick, onSettingsClick, networkIndicator, isOfflineMode }: NavigationProps) {
  const { isRunning } = usePomodoro();
  
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'quiz', label: 'Quiz', icon: Brain },
    { id: 'productivity-tools', label: 'Tools', icon: Wrench },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-pink-100 shadow-lg px-0.5 py-1 md:hidden z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto gap-0">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              whileTap={{ scale: 0.96 }}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all min-w-0 flex-1 touch-manipulation ${
                isActive 
                  ? 'bg-pink-50 text-pink-600' 
                  : 'text-gray-500 active:bg-gray-50'
              }`}
            >
              <div className="relative">
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {isActive && (
                  <motion.div
                    className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-pink-600 rounded-full"
                    layoutId="activeTab"
                  />
                )}
              </div>
              <span className={`text-[8.5px] mt-0.5 truncate max-w-full leading-tight ${isActive ? '' : ''}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function DesktopSidebar({ currentView, onViewChange, onLogout, isOpen, onOpenChange, notifications, onNotificationsClick, onSettingsClick, networkIndicator, isOfflineMode }: NavigationProps) {
  const { isRunning } = usePomodoro();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'quiz', label: isOfflineMode ? 'Practice Quiz' : 'Quiz Generator', icon: Brain },
    { id: 'materials', label: 'Study Materials', icon: FileText },
    { id: 'productivity-tools', label: 'Productivity Tools', icon: Wrench },
    { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'contact', label: 'Contact Us', icon: Mail },
  ];

  const handleNavigation = (viewId: string) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false);
    onOpenChange?.(false); // Close desktop sidebar on navigation
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    onOpenChange?.(false);
    setShowLogoutDialog(false);
    onLogout?.();
  };

  const handleLogoClick = () => {
    onViewChange('dashboard');
    setIsMobileMenuOpen(false);
    onOpenChange?.(false);
  };

  return (
    <>
      {/* Mobile Hamburger Menu Button - Shows on small screens */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-pink-100 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 hover:bg-pink-50"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-700" />
            ) : (
              <Menu className="w-5 h-5 text-gray-700" />
            )}
          </Button>

          {/* Logo - Center on mobile header */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
              <img src={joyImage} alt="Joy" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              JoyGrow
            </span>
          </button>

          {/* Action Buttons - Right side */}
          <div className="flex items-center gap-1">
            {/* Network Indicator */}
            {networkIndicator}
            
            {/* Notifications Button */}
            {onNotificationsClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNotificationsClick}
                className="relative h-9 w-9 hover:bg-pink-50"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-gray-700" />
                {notifications !== undefined && notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 p-0 flex items-center justify-center text-[9px] bg-pink-500"
                  >
                    {notifications > 9 ? '9+' : notifications}
                  </Badge>
                )}
              </Button>
            )}
            
            {/* Settings Button */}
            {onSettingsClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSettingsClick}
                className="h-9 w-9 hover:bg-pink-50"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-gray-700" />
              </Button>
            )}
            
            {/* Logout Button */}
            {onLogout && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutDialog(true)}
                className="h-9 w-9 hover:bg-pink-50"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-gray-700" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Side Menu - Slides in from left */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Side Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl overflow-y-auto"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-pink-100">
                <button 
                  onClick={handleLogoClick}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                    <img src={joyImage} alt="Joy" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    JoyGrow
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Navigation Items */}
              <nav className="p-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.id;
                  const colors = NAV_COLORS[item.id as keyof typeof NAV_COLORS] || NAV_COLORS.dashboard;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`group flex items-center w-full px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? `${colors.activeBg} ${colors.activeText}`
                          : `text-gray-600 ${colors.bg} ${colors.text}`
                      }`}
                    >
                      <div className="relative mr-3">
                        <item.icon
                          className={`flex-shrink-0 h-5 w-5 transition-colors ${
                            isActive ? colors.activeIcon : `text-gray-400 ${colors.icon}`
                          }`}
                        />
                      </div>
                      <span className="text-sm">{item.label}</span>
                      {isActive && (
                        <motion.div
                          className={`ml-auto w-1 h-6 rounded-full ${colors.indicator}`}
                          layoutId="activeMobileTab"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Logout Button at Bottom */}
              {onLogout && (
                <div className="p-3 border-t border-pink-100 mt-auto">
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="flex items-center w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Slides in from left */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Desktop Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange?.(false)}
              className="hidden md:block fixed inset-0 bg-black/30 z-40"
            />
            
            {/* Desktop Side Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl"
            >
              <div className="flex flex-col flex-grow overflow-y-auto">
                {/* Logo */}
                <div className="flex items-center flex-shrink-0 px-4 pt-5 pb-4 border-b border-gray-200">
                  <button 
                    onClick={handleLogoClick}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                      <img src={joyImage} alt="Joy" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-lg bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      JoyGrow
                    </span>
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="mt-5 flex-1 px-3 space-y-1">
                  {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    const colors = NAV_COLORS[item.id as keyof typeof NAV_COLORS] || NAV_COLORS.dashboard;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className={`group flex items-center px-3 py-3 text-sm w-full rounded-lg transition-all ${
                          isActive
                            ? `${colors.activeBg} ${colors.activeText}`
                            : `text-gray-600 ${colors.bg} ${colors.text}`
                        }`}
                      >
                        <div className="relative mr-3">
                          <item.icon
                            className={`flex-shrink-0 h-5 w-5 transition-colors ${
                              isActive ? colors.activeIcon : `text-gray-400 ${colors.icon}`
                            }`}
                          />
                        </div>
                        {item.label}
                        {isActive && (
                          <motion.div
                            className={`ml-auto w-1 h-6 rounded-full ${colors.indicator}`}
                            layoutId="activeDesktopSidebarTab"
                          />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
