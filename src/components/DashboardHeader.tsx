import { Bell, Settings, User, LogOut, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ProgressRing } from './ProgressRing';
import { useProgress } from '../contexts/ProgressContext';
import { useSettings } from '../contexts/SettingsContext';
import { useState, useEffect } from 'react';
import joyImage from 'figma:asset/ebd33da1c91354be18169c74abee5c02fe5f89cc.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface DashboardHeaderProps {
  userName: string;
  notifications: number;
  profileImage?: string;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
  onLogout: () => void;
  onMenuClick?: () => void;
  networkIndicator?: React.ReactNode;
}

export function DashboardHeader({ 
  userName, 
  notifications, 
  profileImage,
  onProfileClick, 
  onSettingsClick, 
  onNotificationsClick,
  onLogout,
  onMenuClick,
  networkIndicator
}: DashboardHeaderProps) {
  const { getProgressStats } = useProgress();
  const { settings } = useSettings();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(profileImage);

  useEffect(() => {
    if (profileImage) {
      setAvatarSrc(profileImage);
    }
  }, [profileImage]);
  
  const stats = getProgressStats();
  const todayAnswered = stats.todayQuestionsAnswered;
  
  // Dynamic goal doubling logic - keep doubling until a is <= b
  let currentGoal = settings.studyGoal;
  while (todayAnswered > currentGoal) {
    currentGoal *= 2;
  }
  
  const progressPercent = Math.min(100, (todayAnswered / currentGoal) * 100);
  
  // Dynamic color based on progress (like Gizmo AI)
  const getProgressColor = () => {
    if (progressPercent >= 100) return 'rgb(34, 197, 94)'; // green
    if (progressPercent >= 75) return 'rgb(59, 130, 246)'; // blue
    if (progressPercent >= 50) return 'rgb(168, 85, 247)'; // purple
    if (progressPercent >= 25) return 'rgb(236, 72, 153)'; // pink
    return 'rgb(249, 115, 22)'; // orange
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 py-3 sm:px-4 sm:py-3 md:px-6 md:py-4 bg-white/95 backdrop-blur-lg border-b border-pink-100 shadow-md">
      {/* Left side: Menu button + Logo + Name - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-3">
        {/* Hamburger Menu Button */}
        {onMenuClick && (
          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-pink-50"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        
        {/* App Logo and Name */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
            <img src={joyImage} alt="Joy" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
      
      {/* App Logo/Name + Progress for mobile */}
      <div className="flex md:hidden items-center gap-2">
        <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center">
          <img src={joyImage} alt="Joy" className="w-full h-full object-contain" />
        </div>
        <h2 className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent text-base">
          JoyGrow
        </h2>
        {/* Today's Progress Ring - Mobile */}
        <div className="ml-auto">
          <ProgressRing
            progress={progressPercent}
            size={42}
            strokeWidth={4}
            color={getProgressColor()}
            value={`${todayAnswered}/${currentGoal}`}
          />
        </div>
      </div>
      
    

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
        
        {networkIndicator}
        
        <Button 
          variant="ghost" 
          size="icon"
          className="relative h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg sm:rounded-xl hover:bg-pink-50"
          onClick={onNotificationsClick}
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          {notifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-5 sm:h-5 p-0 flex items-center justify-center text-[8px] sm:text-[10px] md:text-xs bg-pink-500"
            >
              {notifications > 9 ? '9+' : notifications}
            </Badge>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg sm:rounded-xl hover:bg-pink-50"
          onClick={onSettingsClick}
        >
          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </Button>
        
        {/* User Profile - Desktop only */}
        <button 
          onClick={onProfileClick}
          className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-pink-50 transition-colors cursor-pointer group"
        >
          <Avatar className="w-10 h-10 ring-2 ring-pink-100 group-hover:ring-pink-300 transition-all">
            {avatarSrc ? (
              <AvatarImage key={avatarSrc} src={avatarSrc} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600">
                <User className="w-5 h-5" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="text-left">
            <h2 className="text-sm font-medium text-gray-900 group-hover:text-pink-600 transition-colors">{userName}</h2>
          </div>
        </button>
        
        {/* Logout button - Hidden on mobile, shown on desktop */}
        <Button 
          variant="ghost" 
          size="icon"
          className="hidden md:flex h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg sm:rounded-xl hover:bg-pink-50"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </Button>
      </div>
      

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
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
              onClick={onLogout}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}