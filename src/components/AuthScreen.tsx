import { useState, useEffect } from 'react';
import { User, ArrowLeft, Eye, EyeOff, Lock, LogIn, UserPlus, WifiOff, Wifi } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import joyImage from 'figma:asset/ebd33da1c91354be18169c74abee5c02fe5f89cc.png';
import { SecurityQuestionsSetup, SecurityQuestion } from './SecurityQuestionsSetup';
import { ForgotPasswordFlow } from './ForgotPasswordFlow';
import { WelcomeModal } from './WelcomeModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { createSession } from '../utils/session-manager';
import { authService } from '../database';

interface AuthScreenProps {
  onLogin: (userData: any, isAdmin: boolean) => void;
  onBack: () => void;
}

interface StoredUser {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  level: number;
  streak: number;
  totalPoints: number;
  securityQuestions?: SecurityQuestion[];
  isAdmin?: boolean;
  hasCompletedRecovery?: boolean;
  hasAcceptedTerms?: boolean;
}

export function AuthScreen({ onLogin, onBack }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [view, setView] =
    useState<'auth' | 'security-questions' | 'forgot-password'>('auth');
  const [newUserData, setNewUserData] =
    useState<{ username: string; userId: string } | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeUsername, setWelcomeUsername] = useState('');
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);

  // Track online/offline status for auth screen
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineSignupModal, setShowOfflineSignupModal] = useState(false);

  // Store temporary signup data (username, password, security questions)
  // User account is NOT created until all steps are completed
  const [tempSignupData, setTempSignupData] = useState<{
    userId: string;
    username: string;
    passwordHash: string;
    securityQuestions: SecurityQuestion[];
  } | null>(null);

  // Registration state
  const [signupData, setSignupData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [signupErrors, setSignupErrors] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  // Login state
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Track server username check
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckTimeoutId, setUsernameCheckTimeoutId] = useState<number | null>(null);


  // Password hashing (client-side helper; real hashing done in DB/app layer)
  const hashPassword = (password: string): string => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36) + btoa(password).split('').reverse().join('');
  };

  // Validate username format
  const validateUsername = (inputUsername: string): string => {
    if (inputUsername.length < 6) return 'Username must be at least 6 characters';
    if (inputUsername.length > 30) return 'Username must be no more than 30 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(inputUsername)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };
  
  // Validate password
  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password.length > 50) return 'Password must be no more than 50 characters';
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  // Handle signup username change (with backend check)
  const handleSignupUsernameChange = (value: string) => {
    const trimmed = value.trim();
    setSignupData(prev => ({ ...prev, username: trimmed }));

    const formatError = validateUsername(trimmed);
    setSignupErrors(prev => ({ ...prev, username: formatError }));

    // If invalid or too short, don't hit backend
    if (formatError || trimmed.length < 6) {
      setIsCheckingUsername(false);
      if (usernameCheckTimeoutId !== null) {
        window.clearTimeout(usernameCheckTimeoutId);
        setUsernameCheckTimeoutId(null);
      }
      return;
    }

    // Debounce backend calls
    if (usernameCheckTimeoutId !== null) {
      window.clearTimeout(usernameCheckTimeoutId);
    }
    setIsCheckingUsername(true);

    const timeoutId = window.setTimeout(async () => {
      const result = await authService.checkUsername(trimmed);
      setSignupErrors(prev => ({
        ...prev,
        username: result.exists ? 'Username already exists' : '',
      }));
      setIsCheckingUsername(false);
    }, 300);

    setUsernameCheckTimeoutId(timeoutId);
  };


  // Handle signup password change
  const handleSignupPasswordChange = (value: string) => {
    setSignupData(prev => ({ ...prev, password: value }));
    setSignupErrors(prev => ({ ...prev, password: validatePassword(value) }));

    // Revalidate confirm password if it's already filled
    if (signupData.confirmPassword) {
      setSignupErrors(prev => ({
        ...prev,
        confirmPassword:
          value !== signupData.confirmPassword ? 'Passwords do not match' : '',
      }));
    }
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (value: string) => {
    setSignupData(prev => ({ ...prev, confirmPassword: value }));
    setSignupErrors(prev => ({
      ...prev,
      confirmPassword:
        value !== signupData.password ? 'Passwords do not match' : '',
    }));
  };

  // Monitor online/offline status on auth screen
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('No internet connection', {
        description: 'You can still login with cached credentials',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle signup - STEP 1: Validate username/password but DON'T create user yet
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block signup if offline
    if (!isOnline) {
      setShowOfflineSignupModal(true);
      return;
    }

    // Validate all fields
    const usernameError = validateUsername(signupData.username.trim());
    const passwordError = validatePassword(signupData.password);
    const confirmPasswordError =
      signupData.password !== signupData.confirmPassword
        ? 'Passwords do not match'
        : '';

    setSignupErrors({
      username: usernameError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    if (usernameError || passwordError || confirmPasswordError) {
      return;
    }

    setIsLoading(true);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate user ID and hash password, but DON'T create user yet
    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(signupData.password);

    // Store temporary data - user is NOT created yet
    const cleanedUsername = signupData.username.trim();
    setNewUserData({ username: cleanedUsername, userId });
    setTempSignupData({
      userId,
      username: cleanedUsername,
      passwordHash,
      securityQuestions: [],
    });

    setIsLoading(false);
    toast.info('Step 2 of 3: Please set up your security questions');

    // Move to security questions step
    setView('security-questions');
  };

  // Handle security questions completion - STEP 2: Store security questions but DON'T create user yet
  const handleSecurityQuestionsComplete = (securityQuestions: SecurityQuestion[]) => {
    if (!tempSignupData) return;

    // Update temp data with security questions
    setTempSignupData(prev =>
      prev
        ? {
            ...prev,
            securityQuestions,
          }
        : null,
    );

    // Show welcome modal (Terms & Privacy) - user still not created
    setWelcomeUsername(tempSignupData.username);
    toast.info('Step 3 of 3: Please read and accept Terms & Privacy Policy');
    setShowWelcomeModal(true);
  };

  // Handle welcome modal agreement - STEP 3: FINALLY create the user account
  const handleWelcomeAgree = async () => {
    if (!tempSignupData) return;

    try {
      setIsLoading(true);
      console.log('🔐 Creating user account in database...');

      // Use the unified auth service to create user in Supabase + SQLite
      const result = await authService.signUp(
        tempSignupData.username.trim(),
        signupData.password,
        tempSignupData.securityQuestions,
      );

      // NEW: handle username already exists (and other sign-up errors) from authService
      if (!result.success || !result.user) {
        if (result.error === 'Username already exists') {
          setSignupErrors(prev => ({
            ...prev,
            username: 'Username already exists',
          }));
          toast.error('Username already exists. Please choose another one.');
        } else {
          toast.error(result.error || 'Failed to create account. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      console.log('✅ User created successfully:', result.user);

      setShowWelcomeModal(false);
      toast.success('Account created successfully! Welcome to JoyGrow! 🎉');

      // Create persistent session for the new user
      try {
        await createSession(
          result.user.id,
          result.user.username,
          false, // isAdmin
          true, // keepSignedIn - default to true for new users
          result.mode === 'online' ? 'supabase' : 'local', // authSource
        );
        console.log('✅ Session created for new user:', result.user.username);
      } catch (sessionError) {
        console.error('Failed to create session:', sessionError);
        // Don't block login if session creation fails
      }

      // Auto login
      onLogin(
        {
          id: result.user.id,
          name: result.user.username,
          username: result.user.username,
          level: result.user.level,
          streak: result.user.streak,
          totalPoints: result.user.total_points,
        },
        false,
      );

      // Clean up temp data
      setTempSignupData(null);
      setNewUserData(null);
      setSignupData({ username: '', password: '', confirmPassword: '' });
    } catch (error) {
      console.error('❌ Error creating user:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create account. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle welcome modal cancellation - Clean up and reset
  const handleWelcomeCancel = () => {
    setShowWelcomeModal(false);
    setView('auth');
    setNewUserData(null);
    setTempSignupData(null);

    toast.info('Account creation cancelled. Your information has not been saved.');
  };

  // Handle forgot password success
  const handleForgotPasswordSuccess = () => {
    setView('auth');
    toast.info('You can now log in with your new password');
  };

  // Handle login (admin and regular users both go through authService)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 Attempting login with unified auth service...');
      const result = await authService.signIn(
        loginData.username.trim(),
        loginData.password,
      );
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Login failed');
      }

      console.log('✅ Login successful:', result.user, '(Mode:', result.mode + ')');

      // Check if user is blocked
      if (result.user.is_blocked) {
        setShowBlockedDialog(true);
        setIsLoading(false);
        return;
      }

      // Create persistent session for user (admin flag comes from DB)
      try {
        await createSession(
          result.user.id,
          result.user.username,
          result.user.is_admin, // Use the admin flag from database
          true, // keepSignedIn
          result.mode === 'online' ? 'supabase' : 'local', // authSource
        );
        console.log('✅ Session created for user:', result.user.username);
      } catch (sessionError) {
        console.error('Failed to create user session:', sessionError);
      }

      // Show online/offline indicator
      const modeMessage = result.mode === 'online' ? '🌐 Online' : '📴 Offline';
      toast.success(`Welcome back, ${result.user.username}! ${modeMessage} 🎉`);

      onLogin(
        {
          id: result.user.id,
          name: result.user.username,
          username: result.user.username,
          level: result.user.level,
          streak: result.user.streak,
          totalPoints: result.user.total_points,
          profileImage: result.user.profile_image || '',
        },
        result.user.is_admin || false,
      );
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Invalid username or password',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Security Questions Setup View */}
      {view === 'security-questions' && newUserData && (
        <SecurityQuestionsSetup
          username={newUserData.username}
          userId={newUserData.userId}
          onComplete={handleSecurityQuestionsComplete}
        />
      )}

      {/* Forgot Password Flow */}
      {view === 'forgot-password' && (
        <ForgotPasswordFlow
          onBack={() => setView('auth')}
          onSuccess={handleForgotPasswordSuccess}
        />
      )}

      {/* Auth Screen */}
      {view === 'auth' && (
        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Soft background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-rose-50/80 to-pink-100/80"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl"></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md relative z-10"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={onBack}
                className="absolute top-4 left-4 text-pink-700 hover:bg-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-20 h-20 mx-auto mb-4 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-300/40 to-rose-400/40 rounded-full blur-3xl"></div>
                <img
                  src={joyImage}
                  alt="Joy"
                  className="w-full h-full object-contain drop-shadow-lg relative z-10"
                />
              </motion.div>

              <h1 className="text-3xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2 drop-shadow-sm">
                Welcome to JoyGrow
              </h1>
              <p className="text-pink-700 drop-shadow-sm">
                Start your learning journey today
              </p>
            </div>

            {/* Auth Card */}
            <Card className="bg-white/80 backdrop-blur-md border-pink-200 shadow-lg">
              <CardContent className="p-6">
                {/* Connection Status Indicator */}
                {!isOnline && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium">No Internet Connection</p>
                      <p className="text-red-600 text-xs">
                        Sign up requires internet. You can still login with cached
                        credentials.
                      </p>
                    </div>
                  </div>
                )}

                <Tabs defaultValue="login" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-pink-50">
                    <TabsTrigger
                      value="login"
                      className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-pink-600"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      disabled={!isOnline}
                      className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e: any) => {
                        if (!isOnline) {
                          e.preventDefault();
                          setShowOfflineSignupModal(true);
                        }
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  {/* Login Form */}
                  <TabsContent value="login" className="space-y-4 mt-0">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-pink-700">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-4 h-4" />
                          <Input
                            id="username"
                            name="login-identifier"
                            type="text"
                            inputMode="text"
                            autoComplete="off"
                            placeholder="Enter your username"
                            value={loginData.username}
                            onChange={e =>
                              setLoginData(prev => ({ ...prev, username: e.target.value }))
                            }
                            className="pl-10 bg-pink-50 border-pink-200 text-pink-800 placeholder:text-pink-400"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-pink-700">Password</Label>
                          <button
                            type="button"
                            onClick={() => setView('forgot-password')}
                            className="text-xs text-pink-600 hover:text-pink-700 underline hover:no-underline transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-4 h-4" />
                          <Input
                            type={showLoginPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            value={loginData.password}
                            onChange={e =>
                              setLoginData(prev => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                            className="pl-10 pr-10 bg-pink-50 border-pink-200 text-pink-800 placeholder:text-pink-400"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600"
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Logging in...' : 'Login'}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Sign Up Form */}
                  <TabsContent value="signup" className="space-y-4 mt-0">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-pink-700">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-4 h-4" />
                          <Input
                            id="username"
                            type="text"
                            name="username-new"
                            inputMode="text"
                            autoComplete="off"
                            placeholder="Choose a username (6–30 characters)"
                            value={signupData.username}
                            onChange={e => handleSignupUsernameChange(e.target.value)}
                            className={`pl-10 bg-pink-50 border-pink-200 text-pink-800 placeholder:text-pink-400 ${
                              signupErrors.username ? 'border-red-400' : ''
                            }`}
                            minLength={6}
                            maxLength={30}
                            required
                          />
                        </div>
                        {signupErrors.username && (
                          <p className="text-red-500 text-sm">{signupErrors.username}</p>
                        )}
                        <p className="text-pink-600 text-xs">
                          {signupData.username.length}/30 characters. Letters, numbers, and underscores only.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-pink-700">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-4 h-4" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            autoComplete="new-password"
                            value={signupData.password}
                            onChange={e =>
                              handleSignupPasswordChange(e.target.value)
                            }
                            className={`pl-10 pr-10 bg-pink-50 border-pink-200 text-pink-800 placeholder:text-pink-400 ${
                              signupErrors.password ? 'border-red-400' : ''
                            }`}
                            minLength={8}
                            maxLength={50}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {signupErrors.password && (
                          <p className="text-red-500 text-sm">
                            {signupErrors.password}
                          </p>
                        )}
                        <p className="text-pink-600 text-xs">
                          Minimum 8 characters with uppercase, lowercase, and
                          numbers
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-pink-700">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-4 h-4" />
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                            value={signupData.confirmPassword}
                            onChange={e =>
                              handleConfirmPasswordChange(e.target.value)
                            }
                            className={`pl-10 pr-10 bg-pink-50 border-pink-200 text-pink-800 placeholder:text-pink-400 ${
                              signupErrors.confirmPassword ? 'border-red-400' : ''
                            }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {signupErrors.confirmPassword && (
                          <p className="text-red-500 text-sm">
                            {signupErrors.confirmPassword}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={
                          isLoading ||
                          isCheckingUsername ||
                          signupErrors.username === 'Username already exists' ||
                          !!signupErrors.password ||
                          !!signupErrors.confirmPassword
                        }
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md"
                      >
                        {isLoading ? 'Processing...' : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Footer */}
            <p className="text-center text-pink-200 text-sm mt-6">
              Secure • Private • Easy to use
            </p>
          </motion.div>
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <WelcomeModal
          username={welcomeUsername}
          onAgree={handleWelcomeAgree}
          onCancel={handleWelcomeCancel}
        />
      )}

      {/* Blocked Account Dialog */}
      <AlertDialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
        <AlertDialogContent className="border-2 border-red-300 max-w-[95vw] sm:max-w-md max-h-[90vh] bg-gradient-to-br from-red-50 to-rose-50 flex flex-col overflow-hidden">
          <AlertDialogHeader className="flex-shrink-0">
            <div className="flex flex-col items-center text-center space-y-4 pb-2">
              {/* Animated Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-red-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-full">
                  <svg
                    className="w-12 h-12 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
              </div>

              <AlertDialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Account Blocked
              </AlertDialogTitle>
            </div>

            <AlertDialogDescription className="sr-only">
              Your account has been blocked by an administrator
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-4">
              <div className="text-base text-gray-700 leading-relaxed text-center">
                Your account has been blocked by an administrator and you cannot
                access JoyGrow at this time.
              </div>

              <div className="bg-white border-2 border-red-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3 text-left">
                  <svg
                    className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      Why was I blocked?
                    </div>
                    <div className="text-sm text-gray-600">
                      Account blocks may occur due to policy violations or
                      administrative decisions. Please contact your administrator
                      for more information.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl p-4 border border-cyan-200 text-left">
                <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-cyan-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Contact Information
                </div>

                {/* Admin Email */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-1">
                    Admin Application Email:
                  </div>
                  <a
                    href="mailto:joygrowapplication@gmail.com"
                    className="text-xs text-cyan-700 hover:text-cyan-900 hover:underline break-all"
                  >
                    joygrowapplication@gmail.com
                  </a>
                </div>

                {/* Creators' Emails */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-1">
                    Creators' Emails:
                  </div>
                  <div className="space-y-1">
                    <a
                      href="mailto:roseannjoy.mendoza@cvsu.edu.ph"
                      className="block text-xs text-cyan-700 hover:text-cyan-900 hover:underline break-all"
                    >
                      roseannjoy.mendoza@cvsu.edu.ph
                    </a>
                    <a
                      href="mailto:merryjoy.villanueva@cvsu.edu.ph"
                      className="block text-xs text-cyan-700 hover:text-cyan-900 hover:underline break-all"
                    >
                      merryjoy.villanueva@cvsu.edu.ph
                    </a>
                    <a
                      href="mailto:jannahjoy.condes@cvsu.edu.ph"
                      className="block text-xs text-cyan-700 hover:text-cyan-900 hover:underline break-all"
                    >
                      jannahjoy.condes@cvsu.edu.ph
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center pt-2">
                If you believe this is a mistake, please reach out using the
                contact information above.
              </div>
            </div>
          </div>

          <AlertDialogFooter className="flex-shrink-0 sm:justify-center pt-4">
            <AlertDialogAction
              onClick={() => setShowBlockedDialog(false)}
              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold px-8 py-2 shadow-lg"
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Offline Signup Modal */}
      <AlertDialog
        open={showOfflineSignupModal}
        onOpenChange={setShowOfflineSignupModal}
      >
        <AlertDialogContent className="max-w-md bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center space-y-4 pb-2">
              {/* Animated Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-full">
                  <WifiOff className="w-12 h-12 text-white" />
                </div>
              </div>

              <AlertDialogTitle className="text-2xl text-gray-900">
                Sign up requires internet
              </AlertDialogTitle>
            </div>

            <AlertDialogDescription className="text-center text-gray-700 leading-relaxed pt-2">
              You cannot create a new account without internet access. Please
              connect to the internet and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-white/60 rounded-lg p-4 my-2 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Wifi className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">
                <span className="font-semibold">Why is internet required?</span>{' '}
                <br />
                New accounts must be created online to ensure proper security and
                data synchronization.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <LogIn className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">
                <span className="font-semibold">Already have an account?</span>{' '}
                <br />
                You can still login offline if you&apos;ve logged in before.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowOfflineSignupModal(false)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-2.5 shadow-lg"
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
