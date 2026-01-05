import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { useSettings } from '../contexts/SettingsContext';
import { TodoList } from './TodoList';
import { BugReportDialog } from './BugReportDialog';
import { db } from '../database/database-service';
import { authService } from '../database/auth-service'; // <-- make sure this path matches your project

import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';

import {
  ArrowLeft,
  User,
  Bell,
  Smartphone,
  Wifi,
  Bug,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SettingsProps {
  user: any;
  onBack: () => void;
  onDeleteAccount?: () => void;
  onLogout?: () => void;
  networkStatus?: {
    isOnline: boolean;
    isOfflineMode: boolean;
    setOfflineMode: (enabled: boolean) => void;
  };
}

export function Settings({
  user,
  onBack,
  onDeleteAccount,
  onLogout,
  networkStatus,
}: SettingsProps) {
  const [showTodoList, setShowTodoList] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const { settings, updateSetting } = useSettings();

  const handleSettingChange = (key: string, value: any) => {
    updateSetting(key as any, value);
    toast.success('Setting updated successfully');
  };

    const handleDeleteAccount = async () => {
      if (!deletePassword.trim()) {
        setDeletePasswordError('Password is required to delete your account');
        return;
      }

      try {
        // 1) Reuse existing sign-in logic to verify password
        const loginResult = await authService.signIn(
          user.username,
          deletePassword.trim()
        );

        if (!loginResult || loginResult.error) {
          setDeletePasswordError('Incorrect password');
          toast.error('Incorrect password. Please try again.');
          return;
        }

        // 2) Password is correct -> delete from DB
        await db.deleteUser(user.id);

        setDeletePassword('');
        setDeletePasswordError('');
        setShowDeletePassword(false);
        setDeleteDialogOpen(false);

        toast.success('Account deleted successfully');

        if (onDeleteAccount) {
          onDeleteAccount();
        } else {
          onBack();
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account');
      }
    };


  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeletePassword('');
      setDeletePasswordError('');
      setShowDeletePassword(false);
    }
  };

  const copyUserID = async () => {
    try {
      const userId = user?.id || 'NO_ID';
      await navigator.clipboard.writeText(userId);
      toast.success('User ID copied to clipboard!');
    } catch (error) {
      const userId = user?.id || 'NO_ID';
      const textArea = document.createElement('textarea');
      textArea.value = userId;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('User ID copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy user ID');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 pb-20 pt-16">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="p-1.5 md:p-2 h-8 w-8 md:h-auto md:w-auto"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
        <h1 className="text-lg md:text-2xl">Settings</h1>
      </div>

      {/* Account Information */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-pink-500" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Username</Label>
                <p className="text-lg font-mono bg-gray-50 p-2 rounded">
                  {user?.username}
                </p>
              </div>
              <div>
                <Label>Account Level</Label>
                <p className="text-lg bg-gray-50 p-2 rounded">
                  Level {user?.level || 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-pink-500" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3 p-3 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs sm:text-sm">Daily Study Reminders</Label>
                  <Switch
                    checked={settings.dailyReminders}
                    onCheckedChange={(checked: boolean) =>
                      handleSettingChange('dailyReminders', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs sm:text-sm">Streak Notifications</Label>
                  <Switch
                    checked={settings.streakNotifications}
                    onCheckedChange={(checked: boolean) =>
                      handleSettingChange('streakNotifications', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs sm:text-sm">Achievement Alerts</Label>
                  <Switch
                    checked={settings.achievementAlerts}
                    onCheckedChange={(checked: boolean) =>
                      handleSettingChange('achievementAlerts', checked)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs sm:text-sm">Quiz Reminders</Label>
                  <Switch
                    checked={settings.quizReminders}
                    onCheckedChange={(checked: boolean) =>
                      handleSettingChange('quizReminders', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs sm:text-sm">Weekly Progress</Label>
                  <Switch
                    checked={settings.weeklyProgress}
                    onCheckedChange={(checked: boolean) =>
                      handleSettingChange('weeklyProgress', checked)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Study Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-pink-500" />
              Study Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Daily Study Goal</Label>
                  <Select
                    value={settings.studyGoal.toString()}
                    onValueChange={(value: string) =>
                      handleSettingChange('studyGoal', parseInt(value))
                    }
                  >
                    <SelectTrigger className="mt-1.5 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 questions per day</SelectItem>
                      <SelectItem value="15">15 questions per day</SelectItem>
                      <SelectItem value="20">20 questions per day</SelectItem>
                      <SelectItem value="25">25 questions per day</SelectItem>
                      <SelectItem value="30">30 questions per day</SelectItem>
                      <SelectItem value="40">40 questions per day</SelectItem>
                      <SelectItem value="50">50 questions per day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Quiz Difficulty</Label>
                  <Select
                    value={settings.quizDifficulty}
                    onValueChange={(value: string) =>
                      handleSettingChange('quizDifficulty', value)
                    }
                  >
                    <SelectTrigger className="mt-1.5 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="adaptive">Adaptive (Recommended)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs sm:text-sm">Quiz Timer</Label>
                  <Switch
                    checked={settings.timerEnabled}
                    onCheckedChange={(checked: boolean) =>
                      handleSettingChange('timerEnabled', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs sm:text-sm">Instant Feedback</Label>
                  <Switch
                    checked={settings.instantFeedback}
                    onCheckedChange={(checked: boolean) =>
                      handleSettingChange('instantFeedback', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs sm:text-sm">Sound Effects</Label>
                  <Switch
                    checked={settings.soundEffects}
                    onCheckedChange={(checked: boolean) =>
                      handleSettingChange('soundEffects', checked)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* App Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-pink-500" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label>Auto-sync</Label>
                  <p className="text-sm text-gray-500">
                    Automatically sync your data when online
                  </p>
                </div>
                <Switch
                  checked={settings.autoSync}
                  onCheckedChange={(checked: boolean) =>
                    handleSettingChange('autoSync', checked)
                  }
                />
              </div>
              <Separator />

              <div className="space-y-3">
                <Label className="text-sm">Available Features by Mode</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Online Mode */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm font-medium text-green-800">
                        Online Mode
                      </p>
                    </div>
                    <ul className="text-xs text-green-700 space-y-1">
                      <li>✓ AI-generated Quizzes</li>
                      <li>✓ Upload Materials</li>
                      <li>✓ Customize Quiz Creation</li>
                      <li>✓ Calendar & Streak Tracking</li>
                      <li>✓ To-do List</li>
                      <li>✓ Note-taking</li>
                      <li>✓ Pomodoro Timer</li>
                      <li>✓ Take Quizzes</li>
                      <li>✓ Sync Progress Across Devices</li>
                    </ul>
                  </div>

                  {/* Offline Mode */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <p className="text-sm font-medium text-gray-800">
                        Offline Mode
                      </p>
                    </div>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>✓ Customize Quiz Creation</li>
                      <li>✓ Calendar & Streak Tracking</li>
                      <li>✓ To-do List</li>
                      <li>✓ Note-taking</li>
                      <li>✓ Pomodoro Timer</li>
                      <li>✓ Take Quizzes</li>
                      <li className="text-gray-400">✗ AI-generated Quizzes</li>
                      <li className="text-gray-400">✗ Upload Materials</li>
                      <li className="text-gray-400">✗ Sync Progress</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 bg-pink-50 p-3 rounded-lg">
                💡 Tip: Use the offline mode toggle in the top navigation to
                manually switch between online and offline modes.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Help & Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-pink-500" />
              Help & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Report a Bug</Label>
                <p className="text-sm text-gray-500">
                  Found an issue? Help us improve JoyGrow by reporting bugs
                </p>
              </div>
              <Button
                onClick={() => setShowBugReport(true)}
                className="shrink-0 bg-pink-600 hover:bg-pink-700 text-white"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Bug
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Actions */}
      {onLogout && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-pink-500" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label>Log Out</Label>
                  <p className="text-sm text-gray-500">
                    Sign out of your account and return to the login screen
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="shrink-0 bg-pink-600 hover:bg-pink-700 text-white">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Log out of your account?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to log out? You'll need to sign in
                        again to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onLogout}
                        className="bg-pink-500 hover:bg-pink-600"
                      >
                        Yes, log me out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-2 border-red-400 bg-red-50/50">
          <CardHeader className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-6 h-6" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Alert className="border-red-300 bg-red-100">
              <AlertDescription className="text-red-900 font-semibold">
                ⚠️ WARNING: These actions cannot be undone. This will permanently
                delete your account and all associated data. Please be absolutely
                certain before proceeding.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-4">
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={handleDeleteDialogChange}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold py-6 text-base shadow-lg border-2 border-red-700"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete Account Permanently
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-2 border-red-400 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600 text-xl flex items-center gap-2">
                      <Trash2 className="w-6 h-6" />
                      Delete Account - Final Warning
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="text-base space-y-3">
                        <div className="font-bold text-red-700">
                          ⚠️ THIS ACTION IS PERMANENT AND IRREVERSIBLE!
                        </div>
                        <div>Deleting your account will:</div>
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                          <li>
                            Permanently delete all your quiz progress and scores
                          </li>
                          <li>Remove all your achievements and badges</li>
                          <li>Delete your notes and study materials</li>
                          <li>Erase all your tasks and productivity data</li>
                          <li>
                            Remove your profile and account information forever
                          </li>
                        </ul>
                        <div className="font-semibold text-red-600 mt-4">
                          This data cannot be recovered once deleted!
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  {/* Password Verification */}
                  <div className="space-y-2 px-6 pb-2">
                    <Label
                      htmlFor="delete-password"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Enter your password to confirm
                    </Label>
                    <div className="relative">
                      <Input
                        id="delete-password"
                        type={showDeletePassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={deletePassword}
                        onChange={(e) => {
                          setDeletePassword(e.target.value);
                          setDeletePasswordError('');
                        }}
                        className={`pr-10 ${
                          deletePasswordError ? 'border-red-500' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowDeletePassword(!showDeletePassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showDeletePassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {deletePasswordError && (
                      <p className="text-sm text-red-600 font-medium">
                        {deletePasswordError}
                      </p>
                    )}
                  </div>

                  <AlertDialogFooter className="flex-col sm:flex-row gap-3">
                    <AlertDialogCancel
                      className="font-semibold w-full sm:w-auto"
                      onClick={() => {
                        setDeletePassword('');
                        setDeletePasswordError('');
                        setShowDeletePassword(false);
                      }}
                    >
                      Cancel - Keep My Account
                    </AlertDialogCancel>
                    <Button
                      onClick={handleDeleteAccount}
                      className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 font-bold w-full sm:w-auto text-sm"
                    >
                      Yes, Delete Permanently
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bug Report Dialog */}
      <BugReportDialog open={showBugReport} onOpenChange={setShowBugReport} />
    </div>
  );
}
