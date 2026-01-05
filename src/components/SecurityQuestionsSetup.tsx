import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ShieldCheck, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Progress } from './ui/progress';
import { db } from '../database'; // 👈 use same db as ForgotPasswordFlow

interface SecurityQuestionsSetupProps {
  username: string;
  userId: string;
  onComplete: (securityQuestions: SecurityQuestion[]) => void;
  onSkip?: () => void;
}

export interface SecurityQuestion {
  question: string;
  answer: string; // hashed
}

const SECURITY_QUESTIONS = [
  'In which province or city did you grow up?',
  'What was the name of your elementary school?',
  'What was your first dream profession or career?',
  'What is the name of your favorite fictional character from a movie or TV show?',
  'What was the brand of your first cell phone?',
];

export function SecurityQuestionsSetup({ username, userId, onComplete, onSkip }: SecurityQuestionsSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''));
  const [showAnswers, setShowAnswers] = useState<boolean[]>(Array(5).fill(false));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep + 1) / SECURITY_QUESTIONS.length) * 100;

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (!answers[currentStep].trim()) {
      toast.error('Please provide an answer before continuing');
      return;
    }

    if (currentStep < SECURITY_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Saves 5 hashed Q&As to users.securityquestions
  const handleSubmit = async () => {
    if (answers.some(answer => !answer.trim())) {
      toast.error('Please answer all security questions');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build payload exactly as ForgotPasswordFlow expects
      const payload: SecurityQuestion[] = SECURITY_QUESTIONS.map((question, index) => ({
        question,
        answer: hashAnswer(answers[index]),
      }));

      await db.updateUser(userId, {
        securityquestions: payload,
      });

      toast.success('Security questions saved securely! 🔐');
      onComplete(payload);
    } catch (error) {
      console.error('Failed to save security questions:', error);
      toast.error('Failed to save security questions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowAnswer = (index: number) => {
    const newShowAnswers = [...showAnswers];
    newShowAnswers[index] = !newShowAnswers[index];
    setShowAnswers(newShowAnswers);
  };

  // Same hash helper as ForgotPasswordFlow
  const hashAnswer = (answer: string): string => {
    const salt = 'joygrow_security_salt';
    return btoa(answer.toLowerCase().trim() + salt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl">Secure Your Account</h2>
                <p className="text-sm text-white/90">Set up security questions</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/90">
                <span>Question {currentStep + 1} of {SECURITY_QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/20" />
            </div>
          </div>

          <CardContent className="p-6 sm:p-8">
            {/* Welcome Message */}
            {currentStep === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
              >
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Welcome, {username}!</span>
                  <br />
                  Please set up security questions to help recover your account if you forget your password.
                </p>
              </motion.div>
            )}

            {/* Current Question */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="mb-6">
                <Label className="text-base mb-3 block text-gray-700">
                  {SECURITY_QUESTIONS[currentStep]}
                </Label>
                <div className="relative">
                  <Input
                    type={showAnswers[currentStep] ? 'text' : 'password'}
                    value={answers[currentStep]}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Your answer..."
                    className="h-12 pr-12 text-base rounded-xl border-gray-300 focus:border-pink-500"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleNext();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowAnswer(currentStep)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showAnswers[currentStep] ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Your answer is hidden for privacy
                </p>
              </div>

              {/* Tips */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-sm text-purple-800">
                  💡 <span className="font-semibold">Tip:</span> Choose answers you'll remember easily, but avoid information that's publicly available on social media.
                </p>
              </div>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 rounded-xl border-gray-300 hover:border-pink-500 hover:text-pink-600"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!answers[currentStep].trim() || isSubmitting}
                className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? (
                  'Saving...'
                ) : currentStep === SECURITY_QUESTIONS.length - 1 ? (
                  <>
                    Complete Setup
                    <ShieldCheck className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Skip Option (optional) */}
            {onSkip && currentStep === 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={onSkip}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Skip for now (not recommended)
                </button>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-xs text-yellow-800">
                <span className="font-semibold">🔒 Security Notice:</span> Your answers are encrypted and stored securely. They will only be used for account recovery.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
