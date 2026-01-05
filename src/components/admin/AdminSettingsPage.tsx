import { useState } from 'react';
import { Save, AlertTriangle, Users, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useAdmin } from '../../contexts/AdminContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../ui/badge';

export function AdminSettingsPage() {
  const { appSettings, updateAppSettings } = useAdmin();
  const [localSettings, setLocalSettings] = useState(appSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateAppSettings(localSettings);
    setHasChanges(false);
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    setLocalSettings(appSettings);
    setHasChanges(false);
    toast.info('Changes discarded');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-semibold bg-gradient-to-r from-gray-700 to-slate-700 bg-clip-text text-transparent mb-2">
            Application Settings
          </h2>
          <p className="text-sm lg:text-base text-gray-600">
            Configure global application settings and controls
          </p>
        </div>
        {hasChanges && (
          <Badge className="bg-orange-500 text-white">Unsaved Changes</Badge>
        )}
      </div>

      {/* System Status */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">System Status & Controls</CardTitle>
              <CardDescription>Critical system-wide settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-5 lg:p-6 border-2 rounded-2xl transition-all ${
            localSettings.maintenanceMode 
              ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  localSettings.maintenanceMode ? 'bg-orange-600' : 'bg-gray-300'
                }`}>
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="maintenance-mode" className="text-base font-semibold cursor-pointer block mb-2">
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    When enabled, users will see a maintenance message and won't be able to access the app. Use this for system updates or critical fixes.
                  </p>
                  {localSettings.maintenanceMode && (
                    <Badge className="mt-3 bg-orange-600 text-white">
                      ⚠️ Currently in Maintenance Mode
                    </Badge>
                  )}
                </div>
              </div>
              <Switch
                id="maintenance-mode"
                checked={localSettings.maintenanceMode}
                onCheckedChange={(checked: boolean) => handleChange('maintenanceMode', checked)}
                className="flex-shrink-0 data-[state=checked]:bg-orange-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Permissions */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">User Permissions</CardTitle>
              <CardDescription>Control what users can do in the app</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quiz Creation */}
          <div className="p-5 lg:p-6 border-2 rounded-2xl bg-white border-gray-200 hover:border-purple-300 transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="allow-quiz-creation" className="text-base font-semibold cursor-pointer">
                    Allow User Quiz Creation
                  </Label>
                  {localSettings.allowUserQuizCreation && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Enable or disable users' ability to create AI-generated quizzes
                </p>
              </div>
              <Switch
                id="allow-quiz-creation"
                checked={localSettings.allowUserQuizCreation}
                onCheckedChange={(checked: boolean) => handleChange('allowUserQuizCreation', checked)}
                className="flex-shrink-0 data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>

          {/* Offline Mode */}
          <div className="p-5 lg:p-6 border-2 rounded-2xl bg-white border-gray-200 hover:border-purple-300 transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="enable-offline" className="text-base font-semibold cursor-pointer">
                    Enable Offline Mode
                  </Label>
                  {localSettings.enableOfflineMode && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Allow users to access features while offline with local storage
                </p>
              </div>
              <Switch
                id="enable-offline"
                checked={localSettings.enableOfflineMode}
                onCheckedChange={(checked: boolean) => handleChange('enableOfflineMode', checked)}
                className="flex-shrink-0 data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Note */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardContent className="p-5 lg:p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Data Privacy & Security</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                All settings are stored securely. Changes to user permissions take effect immediately. 
                Maintenance mode will prevent all user access except admin. Always communicate with users before enabling maintenance mode.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Save Bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 lg:p-6 bg-gradient-to-t from-gray-900/95 to-gray-900/90 backdrop-blur-xl border-t border-gray-700 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left text-white">
                <p className="text-base lg:text-lg font-semibold flex items-center justify-center sm:justify-start gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  You have unsaved changes
                </p>
                <p className="text-sm text-gray-300">Don't forget to save your settings before leaving</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1 sm:flex-none h-12 rounded-xl border-gray-600 bg-transparent text-white hover:bg-white/10 px-6"
                >
                  Discard Changes
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 sm:flex-none h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg px-6"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for floating bar */}
      {hasChanges && <div className="h-24" />}
    </div>
  );
}