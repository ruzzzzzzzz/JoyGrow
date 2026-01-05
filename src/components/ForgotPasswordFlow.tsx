import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  User,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { db } from '../database';
import * as Types from '../database/types';
import { authService } from '../database'; // 👈 NEW: use authService for reset

interface ForgotPasswordFlowProps {
  onBack: () => void;
  onSuccess: () => void;
}

type Step = 'username' | 'security-questions' | 'reset-password' | 'success';

// Proper TypeScript typing
interface UserData {
  id: string;
  username: string;
  securityQuestions: Types.SecurityQuestion[];
}

export function ForgotPasswordFlow({
  onBack,
  onSuccess,
}: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const getProgress = () => {
    switch (step) {
      case 'username':
        return 25;
      case 'security-questions':
        return 50;
      case 'reset-password':
        return 75;
      case 'success':
        return 100;
      default:
        return 0;
    }
  };

  // Simple hash function matching SecurityQuestionsSetup
  const hashAnswer = (answer: string): string => {
    const salt = 'joygrow_security_salt';
    return btoa(answer.toLowerCase().trim() + salt);
  };

  // Validate password - MUST match signup requirements exactly
  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 8)
      return 'Password must be at least 8 characters';
    if (password.length > 50)
      return 'Password must be no more than 50 characters';
    if (!/[A-Z]/.test(password))
      return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password))
      return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password))
      return 'Password must contain at least one number';
    return '';
  };

  // Step 1: find user and load security questions
  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      toast.error('Please enter your username');
      return;
    }

    setIsProcessing(true);

    try {
      // Find user in database
      const user = await db.getUserByUsername(username.trim());

      if (!user) {
        toast.error('User not found. Please check your username.');
        setIsProcessing(false);
        return;
      }

      const securityQuestions = user.securityquestions;
      if (!securityQuestions || securityQuestions.length === 0) {
        toast.error(
          'No security questions found for this account. Please contact support.',
        );
        setIsProcessing(false);
        return;
      }

      // Set user data and show all security questions
      setUserData({
        id: user.id,
        username: user.username,
        securityQuestions,
      });

      // Initialize answer array with empty strings
      setUserAnswers(new Array(securityQuestions.length).fill(''));

      setStep('security-questions');
      toast.success(
        'User found! Please answer your security questions.',
      );
    } catch (error) {
      console.error('Error finding user:', error);
      toast.error('Failed to verify username');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: verify all security questions
  const handleSecurityQuestionsSubmit = () => {
    if (!userData) return;

    // Verify that all questions are answered
    if (userAnswers.some(answer => !answer.trim())) {
      toast.error('Please answer all security questions');
      return;
    }

    setIsProcessing(true);

    try {
      // Compare hashed user answers with stored hashed answers
      const allCorrect = userData.securityQuestions.every(
        (sq, index) => {
          const userAnswerHash = hashAnswer(userAnswers[index]);
          return userAnswerHash === sq.answer;
        },
      );

      if (!allCorrect) {
        toast.error(
          'Incorrect answers. Please try again or contact support.',
        );
        setIsProcessing(false);
        return;
      }

      setStep('reset-password');
      toast.success(
        'Security verification successful! Now set your new password.',
      );
    } catch (error) {
      console.error('Error verifying security questions:', error);
      toast.error('Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3: reset password using authService (bcrypt)
  const handlePasswordReset = async () => {
    if (!userData) return;

    // Validate password
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      toast.error(passwordValidationError);
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setIsProcessing(true);

    try {
      // Use unified auth service so hashing matches signUp/signIn
      await authService.resetPasswordByUsername(
        userData.username,
        newPassword,
      );

      setStep('success');
      toast.success('Password reset successfully!');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to reset password',
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl">
          <CardContent className="pt-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl">Reset Your Password</h2>
              <p className="text-gray-600 text-sm">
                {step === 'username' &&
                  'Enter your username to get started'}
                {step === 'security-questions' &&
                  'Answer all security questions'}
                {step === 'reset-password' &&
                  'Create a new password'}
                {step === 'success' &&
                  'Password reset successful!'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={getProgress()} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Step {getProgress() / 25} of 4</span>
                <span>{getProgress()}%</span>
              </div>
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              {/* Step 1: Username */}
              {step === 'username' && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={e =>
                          setUsername(e.target.value)
                        }
                        onKeyDown={e =>
                          e.key === 'Enter' &&
                          handleUsernameSubmit()
                        }
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={onBack}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                    <Button
                      onClick={handleUsernameSubmit}
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
                    >
                      {isProcessing ? 'Checking...' : 'Continue'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Security Questions */}
              {step === 'security-questions' && userData && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Alert>
                    <AlertDescription className="text-sm">
                      For security, please answer all{' '}
                      {userData.securityQuestions.length} questions
                      correctly.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {userData.securityQuestions.map((sq, index) => (
                      <div
                        key={index}
                        className="space-y-2"
                      >
                        <Label htmlFor={`question-${index}`}>
                          Question {index + 1}: {sq.question}
                        </Label>
                        <Input
                          id={`question-${index}`}
                          type="text"
                          placeholder="Your answer..."
                          value={userAnswers[index] || ''}
                          onChange={e => {
                            const newAnswers = [...userAnswers];
                            newAnswers[index] = e.target.value;
                            setUserAnswers(newAnswers);
                          }}
                          autoFocus={index === 0}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep('username')}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSecurityQuestionsSubmit}
                      disabled={
                        isProcessing ||
                        userAnswers.some(a => !a.trim())
                      }
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
                    >
                      {isProcessing
                        ? 'Verifying...'
                        : 'Verify Answers'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Reset Password */}
              {step === 'reset-password' && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Alert>
                    <AlertDescription className="text-sm">
                      Password must be 8-50 characters with at least
                      one uppercase, lowercase, and number.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={e => {
                          setNewPassword(e.target.value);
                          setPasswordError('');
                        }}
                        className="pl-10 pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-red-600">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="confirm-password"
                        type={
                          showConfirmPassword
                            ? 'text'
                            : 'password'
                        }
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={e => {
                          setConfirmPassword(e.target.value);
                          setConfirmPasswordError('');
                        }}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button" 
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword,
                          )
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {confirmPasswordError && (
                      <p className="text-sm text-red-600">
                        {confirmPasswordError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setStep('security-questions')
                      }
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handlePasswordReset}
                      disabled={
                        isProcessing ||
                        !newPassword ||
                        !confirmPassword
                      }
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
                    >
                      {isProcessing
                        ? 'Resetting...'
                        : 'Reset Password'}
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Success */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl mb-2">
                      Password Reset Complete!
                    </h3>
                    <p className="text-gray-600">
                      Your password has been successfully reset.
                      <br />
                      Redirecting to login...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
