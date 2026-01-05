import { useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAdmin } from '../contexts/AdminContext';

interface OfflineModeIndicatorProps {
  isOnline: boolean;
  isOfflineMode: boolean;
  connectionType: string;
  onToggleOfflineMode: (enabled: boolean) => void;
}

export function OfflineModeIndicator({ 
  isOnline, 
  isOfflineMode, 
  connectionType,
  onToggleOfflineMode 
}: OfflineModeIndicatorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { appSettings, isAdmin } = useAdmin();

  const effectivelyOffline = !isOnline || isOfflineMode;

  const handleToggleOfflineMode = (enabled: boolean) => {
    // Check if offline mode is allowed by admin (unless user is admin)
    if (!appSettings.enableOfflineMode && !isAdmin) {
      toast.error('Offline mode disabled', {
        description: 'Offline mode has been disabled by your administrator.',
        duration: 4000
      });
      return;
    }
    
    onToggleOfflineMode(enabled);
    if (enabled) {
      toast.success('Offline mode enabled. You can still take quizzes!');
    } else {
      toast.success('Online mode enabled. All features available!');
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (isOfflineMode) return <CloudOff className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getConnectionText = () => {
    if (!isOnline) return 'No Internet';
    if (isOfflineMode) return 'Offline Mode';
    return 'Online';
  };

  const getConnectionColor = () => {
    if (!isOnline) return 'destructive';
    if (isOfflineMode) return 'secondary';
    return 'default';
  };

  return (
    <>
      {/* Main Indicator */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 md:h-9 gap-1 px-1.5 sm:px-2 md:px-3 rounded-xl hover:bg-pink-50">
            {getConnectionIcon()}
            <Badge variant={getConnectionColor()} className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 md:px-2">
              {effectivelyOffline ? 'Off' : 'On'}
            </Badge>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {getConnectionIcon()}
              Connection Status
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View and manage your connection settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Current Status */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Status</p>
                    <p className="text-sm text-gray-600">
                      {!isOnline ? 'No internet connection detected' : 
                       isOfflineMode ? 'Offline mode is enabled' : 
                       'Connected and online'}
                    </p>
                    {isOnline && (
                      <p className="text-xs text-gray-500 mt-1">
                        Connection: {connectionType}
                      </p>
                    )}
                  </div>
                  <Badge variant={getConnectionColor()}>
                    {effectivelyOffline ? 'Offline' : 'Online'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Offline Mode Toggle */}
            {isOnline && appSettings.enableOfflineMode && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Offline Mode</Label>
                      <p className="text-sm text-gray-600">
                        Use offline mode to save data
                      </p>
                    </div>
                    <Switch
                      checked={isOfflineMode}
                      onCheckedChange={handleToggleOfflineMode}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Show message when offline mode is disabled by admin */}
            {isOnline && !appSettings.enableOfflineMode && !isAdmin && (
              <Alert>
                <CloudOff className="h-4 w-4" />
                <AlertDescription>
                  Offline mode has been disabled by your administrator.
                </AlertDescription>
              </Alert>
            )}

            {/* Feature Availability */}
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm">Available Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6">
                {/* Online Mode Features */}
                {!effectivelyOffline && (
                  <div className="space-y-2">
                    <p className="text-[10px] sm:text-xs text-green-600 font-medium">Online Mode Features:</p>
                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>AI-generated Quizzes</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Upload Materials</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Customize Quiz Creation</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Calendar & Streak Tracking</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>To-do List</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Note-taking</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Pomodoro Timer</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Take Quizzes</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Sync Progress Across Devices</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Offline Mode Features */}
                {effectivelyOffline && (
                  <div className="space-y-2">
                    <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Offline Mode Features:</p>
                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Customize Quiz Creation</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Calendar & Streak Tracking</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>To-do List</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Note-taking</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Pomodoro Timer</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✓</Badge>
                        <span>Take Quizzes</span>
                      </div>
                    </div>
                    <div className="pt-1.5 sm:pt-2 border-t">
                      <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1 sm:mb-1.5">Unavailable Offline:</p>
                      <div className="space-y-1 sm:space-y-1.5">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                          <Badge variant="secondary" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✗</Badge>
                          <span>AI-generated Quizzes</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                          <Badge variant="secondary" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">✗</Badge>
                          <span>Upload Materials</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                          <Badge variant="secondary" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">⏳</Badge>
                          <span className="break-words">Sync Progress (syncs when online)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alerts */}
            {!isOnline && (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  No internet connection. You can still take offline quizzes, and your progress will sync when you're back online.
                </AlertDescription>
              </Alert>
            )}

            {isOfflineMode && isOnline && (
              <Alert>
                <CloudOff className="h-4 w-4" />
                <AlertDescription>
                  Offline mode is enabled. Turn it off to access quiz generation and material uploads.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto-suggest offline mode when no internet */}
      <AnimatePresence>
        {!isOnline && !isOfflineMode && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <WifiOff className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">
                      No internet connection
                    </p>
                    <p className="text-xs text-orange-600">
                      Enable offline mode to continue learning
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleToggleOfflineMode(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Go Offline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}