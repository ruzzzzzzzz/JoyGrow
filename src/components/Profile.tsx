import { useState, useEffect } from 'react';
import { Calendar, Target, Clock, Trophy, Settings, Camera, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { motion } from 'motion/react';
import { useProgress } from '../contexts/ProgressContext';
import { useUser } from '../contexts/UserContext';
import { ImageCropModal } from './ImageCropModal';
import { db } from '../database';
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogFooter, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogCancel, 
  AlertDialogAction 
} from "./ui/alert-dialog"

interface ProfileProps {
  user: any;
  onSettings: () => void;
  onLogout?: () => void;
}

export function Profile({ user, onSettings, onLogout }: ProfileProps) {
  const [showCropModal, setShowCropModal] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState('');

  const { getProgressStats, achievements: progressAchievements, quizAttempts } = useProgress();
  const { currentUser, updateUserProfile, refreshUserData } = useUser();

  const stats = getProgressStats();

  // Load profile data from database
  const [profilePicture, setProfilePicture] = useState('');
  const [profileData, setProfileData] = useState({
    name: user?.username || user?.name || 'User',
    joinDate: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Recently',
    level: stats.level,
    totalPoints: stats.totalPoints,
    streak: stats.currentStreak,
  });

  // ---- Level progress calculation (per level, not total XP) ----
  const totalXp = Number(stats.totalPoints ?? 0);
  const currentLevel = Number(stats.level ?? 1);

  // 300 XP per level (matches ProgressContext).
  const XP_PER_LEVEL = 300;

  const xpForCurrentLevel = (currentLevel - 1) * XP_PER_LEVEL;
  const xpForNextLevel = currentLevel * XP_PER_LEVEL;

  const xpIntoThisLevel = Math.max(0, totalXp - xpForCurrentLevel);
  const xpNeededThisLevel = Math.max(0, xpForNextLevel - xpForCurrentLevel);

  let progressRatio = 1;
  if (xpNeededThisLevel > 0) {
    progressRatio = Math.min(1, Math.max(0, xpIntoThisLevel / xpNeededThisLevel));
  }

  const progressPercent = Math.round(progressRatio * 100);

  // Load user-specific profile data from database on mount and when user changes
  useEffect(() => {
    const loadProfileData = async () => {
      if (user?.id) {
        try {
          const dbUser = await db.getUserById(user.id);
          if (dbUser) {
            setProfilePicture(dbUser.profile_image || '');
            setProfileData((prev) => ({
              ...prev,
              name: dbUser.username,
            }));
          }
        } catch (error) {
          console.error('Error loading profile data from database:', error);
        }
      }
    };

    loadProfileData();
  }, [user?.id]);

  // Handle profile picture upload
  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempImageSrc(result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile picture crop
  const handleProfilePictureCrop = async (croppedImage: string) => {
    setProfilePicture(croppedImage);

    // Save to database
    if (user?.id) {
      try {
        await updateUserProfile(user.id, {
          profile_image: croppedImage,
        });

        if (currentUser) {
          await refreshUserData(user.id);
        }

        toast.success('Profile picture updated!');
      } catch (error) {
        console.error('Error saving profile picture to database:', error);
        toast.error('Failed to update profile picture');
      }
    }

    setShowCropModal(false);
  };

  // Count achievements
  const unlockedAchievements = progressAchievements?.filter((a) => a.unlocked).length || 0;
  const totalAchievements = progressAchievements?.length || 0;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pt-16">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden bg-gradient-to-b from-pink-50 via-rose-50 to-white">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center gap-4">
                {/* Clean Avatar - No overlays */}
                <Avatar className="h-28 w-28 md:h-36 md:w-36 ring-4 ring-white/50 shadow-xl border-4 border-pink-100">
                  {profilePicture ? (
                    <AvatarImage src={profilePicture} alt={profileData.name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-3xl font-bold">
                      {profileData.name?.slice(0, 2).toUpperCase() || 'JR'}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* DEDICATED Edit Button */}
                <label 
                  htmlFor="profile-picture-upload"
                  className="flex items-center gap-2 px-6 py-2 text-pink-700 
                            bg-white80 hover:bg-pink-50 rounded-full shadow-sm 
                            hover:shadow-md transform hover:scale-105
                            transition-all duration-200 cursor-pointer text-sm font-medium"
                >
                  <Camera className="h-4 w-4" />
                  Edit
                </label>
                
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                />
              </div>

              {/* User Info Section */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold text-pink-700">
                    {profileData.name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                  <Badge variant="secondary" className="bg-pink-500 text-white">
                    Level {profileData.level}
                  </Badge>
                  <Badge variant="outline" className="border-rose-200 text-rose-700 bg-white/70">
                    <Trophy className="h-3 w-3 mr-1" />
                    {profileData.totalPoints} Points
                  </Badge>
                  <Badge variant="outline" className="border-pink-200 text-pink-700 bg-white/70">
                    🔥 {profileData.streak} Day Streak
                  </Badge>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Joined {profileData.joinDate}
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex md:flex-col gap-2">
                <Button
                  onClick={onSettings}
                  variant="outline"
                  size="sm"
                  className="border-pink-200 text-pink-700 bg-white/80 hover:bg-pink-50"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
                {onLogout && (
                  <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-white/80 hover:bg-red-50">
                        <LogOut className="h-4 w-4 mr-1" />
                        Logout
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Log out of your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to log out? You'll need to sign in again to access your account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            setShowLogoutDialog(false)
                            if (onLogout) onLogout()
                          }}
                          className="bg-pink-500 hover:bg-pink-600"
                        >
                          Yes, log me out
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid (Level Progress first) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-white/95 border-pink-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-pink-700">
                <Trophy className="h-4 w-4 text-amber-500" />
                Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Bold, visible level label */}
              <p className="text-sm font-bold text-pink-700 text-center">
                Level {currentLevel}
              </p>

              <div className="space-y-2">
                {/* Progress bar on its own row */}
                <Progress value={progressPercent} className="h-3" />

                {/* XP and percentage below the bar */}
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>
                    {xpIntoThisLevel} / {xpNeededThisLevel} XP
                  </span>
                  <span className="text-pink-600 font-semibold">
                    {progressPercent}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quizzes Completed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white/95 border-pink-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-pink-700">
                <Target className="h-4 w-4 text-pink-500" />
                Quizzes Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quizAttempts?.length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total quizzes taken
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Study Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white/95 border-pink-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-pink-700">
                <Clock className="h-4 w-4 text-rose-500" />
                Study Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profileData.streak} Days
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Keep it going! 🔥
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-white/95 border-pink-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-800">
              <Trophy className="h-5 w-5 text-amber-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {progressAchievements
                ?.filter((a) => a.unlocked)
                .slice(0, 8)
                .map((achievement, index) => (
                  <div
                    key={achievement.id ?? index}
                    className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100"
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <div className="text-xs font-medium text-center text-gray-700">
                      {achievement.title}
                    </div>
                  </div>
                ))}
            </div>
            {unlockedAchievements === 0 && (
              <p className="text-center text-gray-500 py-8">
                Complete quizzes and tasks to unlock achievements!
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onCancel={() => setShowCropModal(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleProfilePictureCrop}
      />
    </div>
  );
}
