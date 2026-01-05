import { useState } from 'react';
import { 
  Users, 
  Brain, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  Shield,
  Home,
  Activity,
  Bug,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { useAdmin } from '../contexts/AdminContext';
import { toast } from 'sonner';
import { AdminOverview } from './admin/AdminOverview';
import { AdminUserManagement } from './admin/AdminUserManagement';
import { AdminActivityTracking } from './admin/AdminActivityTracking';
import { AdminSettingsPage } from './admin/AdminSettingsPage';
import { BugReports } from './admin/BugReports';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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

interface AdminDashboardProps {
  onLogout: () => void;
  onSwitchToLearner?: () => void;
}

export function AdminDashboard({ onLogout, onSwitchToLearner }: AdminDashboardProps) {
  const { isAdmin, logoutAdmin } = useAdmin();
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
            <Button 
              onClick={onLogout} 
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 h-11 rounded-xl"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogoutClick = () => {
    logoutAdmin();
    toast.success('Logged out from admin dashboard');
    onLogout();
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home, color: 'from-pink-400 to-rose-400' },
    { id: 'users', label: 'User Management', icon: Users, color: 'from-pink-500 to-rose-500' },
    { id: 'activity', label: 'Activity Tracking', icon: Activity, color: 'from-pink-500 to-rose-600' },
    { id: 'bugs', label: 'Bug Reports', icon: Bug, color: 'from-rose-500 to-pink-600' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'from-pink-600 to-rose-700' },
  ];

  const currentMenuItem = menuItems.find(item => item.id === activeSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* Fixed Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-pink-200 shadow-sm">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left: Hamburger Menu + Logo & Title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-10 w-10 p-0 rounded-xl hover:bg-pink-100"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-pink-600" />
                ) : (
                  <Menu className="w-5 h-5 text-pink-600" />
                )}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                  <img 
                    src={joyImage} 
                    alt="Joy" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-base lg:text-xl font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    JoyGrow Admin
                  </h1>
                  <p className="text-xs text-pink-600 hidden sm:block">Management Dashboard</p>
                </div>
              </div>
            </div>

            {/* Right: Logout */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutDialog(true)}
              className="h-9 lg:h-10 rounded-xl border-pink-300 text-pink-700 hover:bg-pink-50 hover:border-pink-400"
            >
              <LogOut className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Spacer so content starts below fixed header */}
      <div className="h-16 lg:h-20" />

      <div className="flex">
        {/* Hamburger Menu Sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      Navigation
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="h-9 w-9 p-0 rounded-xl hover:bg-pink-50"
                    >
                      <X className="w-5 h-5 text-pink-600" />
                    </Button>
                  </div>

                  <nav className="space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                              : 'text-gray-700 hover:bg-pink-50'
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                    
                    {onSwitchToLearner && (
                      <>
                        <div className="py-2">
                          <div className="border-t border-pink-200"></div>
                        </div>
                        <button
                          onClick={() => {
                            onSwitchToLearner();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg group"
                        >
                          <Sparkles className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Use JoyGrow as a Learner</span>
                        </button>
                      </>
                    )}
                  </nav>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'overview' && <AdminOverview />}
                {activeSection === 'users' && <AdminUserManagement />}
                {activeSection === 'activity' && <AdminActivityTracking />}
                {activeSection === 'bugs' && <BugReports />}
                {activeSection === 'settings' && <AdminSettingsPage />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Logout Dialog */}
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
              onClick={handleLogoutClick}
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
