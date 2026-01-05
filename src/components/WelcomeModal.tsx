import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  FileText, 
  Shield, 
  CheckCircle, 
  ArrowLeft,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface WelcomeModalProps {
  username: string;
  onAgree: () => void;
  onCancel: () => void;
}

export function WelcomeModal({ username, onAgree, onCancel }: WelcomeModalProps) {
  const [currentView, setCurrentView] = useState<'welcome' | 'terms' | 'privacy'>('welcome');
  const [hasViewedTerms, setHasViewedTerms] = useState(false);
  const [hasViewedPrivacy, setHasViewedPrivacy] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false);
  const [isAgreeLoading, setIsAgreeLoading] = useState(false);

  const handleViewTerms = () => {
    setCurrentView('terms');
    setHasViewedTerms(true);
  };

  const handleViewPrivacy = () => {
    setCurrentView('privacy');
    setHasViewedPrivacy(true);
  };

  const handleBackToWelcome = () => {
    setCurrentView('welcome');
  };

  const handleScrollTerms = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (scrolledToBottom && !hasScrolledTerms) {
      setHasScrolledTerms(true);
    }
  };

  const handleScrollPrivacy = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (scrolledToBottom && !hasScrolledPrivacy) {
      setHasScrolledPrivacy(true);
    }
  };

  const canAgree =
    hasViewedTerms && hasViewedPrivacy && hasScrolledTerms && hasScrolledPrivacy;

  const handleAgree = async () => {
    if (!canAgree || isAgreeLoading) return;

    setIsAgreeLoading(true);
    try {
      await onAgree();            // if onAgree is sync this still works
    } finally {
      setIsAgreeLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? You will need to sign up again to use JoyGrow.')) {
      onCancel();
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] sm:max-h-[85vh] p-0 gap-0 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 border-pink-200 overflow-hidden flex flex-col [&>button]:hidden"
        onPointerDownOutside={(e: any) => e.preventDefault()}
        onEscapeKeyDown={(e: any) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {/* Welcome View */}
          {currentView === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col max-h-full overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
                <DialogHeader className="text-center space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <DialogTitle className="text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    Welcome to JoyGrow! 🎉
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base text-gray-700">
                    Hi <span className="font-semibold text-pink-600">{username}</span>, we're excited to have you here!
                  </DialogDescription>
                </DialogHeader>

                {/* Introductory Text */}
                <Card className="border-pink-200 bg-white/80 backdrop-blur-sm shadow-md mb-4 sm:mb-6">
                  <CardContent className="pt-4 sm:pt-6 pb-4">
                    <p className="text-sm sm:text-base text-gray-700 text-center leading-relaxed mb-4">
                      JoyGrow is your AI-enhanced learning companion designed to make studying engaging and effective. 
                      With personalized quizzes, gamification features, and productivity tools, you'll build consistent 
                      learning habits while having fun!
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="outline" className="border-pink-300 text-pink-700 bg-pink-50 text-xs">
                        AI-Powered Quizzes
                      </Badge>
                      <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 text-xs">
                        Achievement Badges
                      </Badge>
                      <Badge variant="outline" className="border-pink-300 text-pink-700 bg-pink-50 text-xs">
                        Streak Tracking
                      </Badge>
                      <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 text-xs">
                        Study Tools
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents to Review */}
                <div className="space-y-3 mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-gray-600 text-center font-medium">
                    Before you begin, please review our policies:
                  </p>

                  {/* Terms and Conditions Card */}
                  <Card 
                    className="border-2 cursor-pointer hover:border-pink-400 transition-all hover:shadow-lg bg-white"
                    onClick={handleViewTerms}
                  >
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 flex-shrink-0" />
                          <span>Terms and Conditions</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasScrolledTerms ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          ) : hasViewedTerms ? (
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                          ) : (
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                      <p className="text-xs text-gray-600">
                        {hasScrolledTerms 
                          ? '✓ Read completely' 
                          : hasViewedTerms 
                          ? 'Please scroll to the end' 
                          : 'Tap to read our terms of service'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Privacy Policy Card */}
                  <Card 
                    className="border-2 cursor-pointer hover:border-pink-400 transition-all hover:shadow-lg bg-white"
                    onClick={handleViewPrivacy}
                  >
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 flex-shrink-0" />
                          <span>Privacy Policy</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasScrolledPrivacy ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          ) : hasViewedPrivacy ? (
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                          ) : (
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                      <p className="text-xs text-gray-600">
                        {hasScrolledPrivacy 
                          ? '✓ Read completely' 
                          : hasViewedPrivacy 
                          ? 'Please scroll to the end' 
                          : 'Tap to read how we protect your data'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-3">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAgree}
                    disabled={!canAgree || isAgreeLoading}
                    className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAgreeLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : canAgree ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        I Agree
                      </>
                    ) : (
                      'Read Both Documents First'
                    )}
                  </Button>
                </div>

                {!canAgree && (
                  <p className="text-xs text-center text-gray-500 pb-2">
                    You must read and scroll through both documents to continue
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Terms and Conditions View */}
          {currentView === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh]"
            >
              <div className="flex-shrink-0 p-4 sm:p-6 border-b border-pink-200 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToWelcome}
                    className="text-pink-600 hover:text-pink-700 hover:bg-pink-100 h-8 sm:h-9"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  {hasScrolledTerms && (
                    <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-lg sm:text-xl md:text-2xl text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                  Terms and Conditions
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-600 mt-1">
                  Please scroll to read all terms
                </DialogDescription>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-8"
                onScroll={handleScrollTerms}
              >
                <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
                  <p className="text-xs text-gray-500">Last Updated: December 4, 2024</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">1. Acceptance of Terms</h3>
                  <p>
                    By creating an account and using JoyGrow ("the App"), you agree to be bound by these Terms and Conditions. 
                    If you do not agree to these terms, please do not use the App.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">2. User Accounts</h3>
                  <p>
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities 
                    that occur under your account. You agree to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide accurate and complete information during registration</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                    <li>Use the App only for lawful educational purposes</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">3. AI-Generated Content</h3>
                  <p>
                    JoyGrow uses artificial intelligence to generate quiz questions and study materials. While we strive for accuracy:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>AI-generated content may contain errors or inaccuracies</li>
                    <li>Users should verify important information with authoritative sources</li>
                    <li>JoyGrow is not liable for any consequences resulting from reliance on AI-generated content</li>
                    <li>We continuously improve our AI models but cannot guarantee 100% accuracy</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">4. User Content and Data</h3>
                  <p>
                    You retain ownership of any content you upload or create within the App. By using JoyGrow, you grant us:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>The right to store and process your content to provide our services</li>
                    <li>Permission to use anonymized data to improve our AI models</li>
                    <li>The ability to display your achievements and progress within the App</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">5. Acceptable Use</h3>
                  <p>You agree NOT to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Upload copyrighted materials without proper authorization</li>
                    <li>Share inappropriate, offensive, or harmful content</li>
                    <li>Attempt to hack, reverse engineer, or exploit the App</li>
                    <li>Use the App to cheat on exams or academic assessments</li>
                    <li>Create multiple accounts to manipulate leaderboards or achievements</li>
                    <li>Harass, abuse, or harm other users</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">6. Gamification and Points</h3>
                  <p>
                    JoyGrow includes gamification features such as points, badges, streaks, and leaderboards:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>These features are for motivational purposes only and have no monetary value</li>
                    <li>We reserve the right to adjust point values and reset progress if abuse is detected</li>
                    <li>Leaderboard rankings are based on user activity within the App</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">7. Offline and Online Modes</h3>
                  <p>
                    JoyGrow offers both offline and online functionality:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Offline data is stored locally on your device</li>
                    <li>Online features require an internet connection and may sync your data</li>
                    <li>We are not responsible for data loss due to device issues or user error</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">8. Subscription and Payments</h3>
                  <p>
                    If you purchase a premium subscription:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Subscriptions automatically renew unless canceled before the renewal date</li>
                    <li>Refund policies are subject to platform guidelines (App Store, Google Play)</li>
                    <li>We may change subscription pricing with advance notice</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">9. Termination</h3>
                  <p>
                    We reserve the right to suspend or terminate your account if:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You violate these Terms and Conditions</li>
                    <li>We detect fraudulent or abusive behavior</li>
                    <li>You request account deletion</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">10. Limitation of Liability</h3>
                  <p>
                    JoyGrow is provided "as is" without warranties of any kind. We are not liable for:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Any direct, indirect, or consequential damages from using the App</li>
                    <li>Academic performance or outcomes related to using our study tools</li>
                    <li>Data loss, security breaches, or technical failures</li>
                    <li>Third-party content or links within the App</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">11. Changes to Terms</h3>
                  <p>
                    We may update these Terms and Conditions from time to time. Continued use of the App after changes 
                    constitutes acceptance of the updated terms. We will notify users of significant changes via email 
                    or in-app notifications.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">12. Contact Us</h3>
                  <p>
                    If you have questions about these Terms and Conditions, please contact us at:
                  </p>
                  <div className="pl-4 space-y-2">
                    <p>
                      <strong>Admin Application Email:</strong><br />
                      <a href="mailto:joygrowapplication@gmail.com" className="text-pink-600 hover:underline">
                        joygrowapplication@gmail.com
                      </a>
                    </p>
                    <p>
                      <strong>Creators' Emails:</strong><br />
                      <a href="mailto:roseannjoy.mendoza@cvsu.edu.ph" className="text-pink-600 hover:underline">
                        roseannjoy.mendoza@cvsu.edu.ph
                      </a><br />
                      <a href="mailto:merryjoy.villanueva@cvsu.edu.ph" className="text-pink-600 hover:underline">
                        merryjoy.villanueva@cvsu.edu.ph
                      </a><br />
                      <a href="mailto:jannahjoy.condes@cvsu.edu.ph" className="text-pink-600 hover:underline">
                        jannahjoy.condes@cvsu.edu.ph
                      </a>
                    </p>
                  </div>

                  <div className="mt-8 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                    <p className="text-sm text-center text-gray-700">
                      By clicking "I Agree," you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-pink-200 bg-white/80 backdrop-blur-sm">
                <Button
                  onClick={handleBackToWelcome}
                  className="w-full h-11 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {hasScrolledTerms ? 'Continue' : 'Back to Welcome'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Privacy Policy View */}
          {currentView === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh]"
            >
              <div className="flex-shrink-0 p-4 sm:p-6 border-b border-pink-200 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToWelcome}
                    className="text-pink-600 hover:text-pink-700 hover:bg-pink-100 h-8 sm:h-9"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  {hasScrolledPrivacy && (
                    <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-lg sm:text-xl md:text-2xl text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                  Privacy Policy
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-600 mt-1">
                  Please scroll to read our complete privacy policy
                </DialogDescription>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-8"
                onScroll={handleScrollPrivacy}
              >
                <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
                  <p className="text-xs text-gray-500">Last Updated: December 4, 2024</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">1. Introduction</h3>
                  <p>
                    Welcome to JoyGrow! We respect your privacy and are committed to protecting your personal data. 
                    This Privacy Policy explains how we collect, use, store, and protect your information when you use our App.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">2. Information We Collect</h3>
                  
                  <h4 className="text-base font-semibold text-gray-800 mt-4">2.1 Account Information</h4>
                  <p>When you create an account, we collect:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Username (used for login and display purposes)</li>
                    <li>Password (encrypted and securely stored)</li>
                    <li>Security questions and answers (encrypted)</li>
                    <li>Profile picture (optional)</li>
                  </ul>

                  <h4 className="text-base font-semibold text-gray-800 mt-4">2.2 Study and Activity Data</h4>
                  <p>To provide personalized learning experiences, we collect:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Quiz scores, answers, and performance history</li>
                    <li>Study materials and notes you create or upload</li>
                    <li>Todo lists and task completion data</li>
                    <li>Pomodoro timer usage and session history</li>
                    <li>Streak tracking and achievement progress</li>
                    <li>Leaderboard rankings and points</li>
                  </ul>

                  <h4 className="text-base font-semibold text-gray-800 mt-4">2.3 Device and Usage Information</h4>
                  <p>We may collect:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Device type, operating system, and app version</li>
                    <li>Usage patterns and feature interactions</li>
                    <li>Error logs and crash reports</li>
                    <li>Offline/online mode preferences</li>
                  </ul>

                  <h4 className="text-base font-semibold text-gray-800 mt-4">2.4 AI-Generated Content</h4>
                  <p>When you use AI quiz generation:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>We process the content you input to generate quizzes</li>
                    <li>AI interactions may be logged for quality improvement</li>
                    <li>Generated quizzes are stored in your account</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">3. How We Use Your Information</h3>
                  <p>We use your data to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Provide Services:</strong> Enable core features like quizzes, streaks, and leaderboards</li>
                    <li><strong>Personalization:</strong> Customize your learning experience and recommendations</li>
                    <li><strong>AI Improvement:</strong> Train and improve our AI models using anonymized data</li>
                    <li><strong>Analytics:</strong> Understand usage patterns to enhance app features</li>
                    <li><strong>Communication:</strong> Send important updates, reminders, and notifications</li>
                    <li><strong>Security:</strong> Detect fraud, abuse, and security threats</li>
                    <li><strong>Support:</strong> Respond to your questions and resolve issues</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">4. Data Storage and Security</h3>
                  
                  <h4 className="text-base font-semibold text-gray-800 mt-4">4.1 Local Storage (Offline Mode)</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Study materials, quizzes, and progress are stored locally on your device</li>
                    <li>We use browser localStorage for data persistence</li>
                    <li>Data remains on your device unless you enable sync</li>
                  </ul>

                  <h4 className="text-base font-semibold text-gray-800 mt-4">4.2 Cloud Storage (Online Mode)</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>When you enable sync, data is encrypted and stored on Supabase servers</li>
                    <li>Passwords are hashed using industry-standard encryption</li>
                    <li>We implement SSL/TLS for data transmission</li>
                    <li>Regular security audits and backups are performed</li>
                  </ul>

                  <h4 className="text-base font-semibold text-gray-800 mt-4">4.3 Security Measures</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Encrypted password storage</li>
                    <li>Secure authentication protocols</li>
                    <li>Regular security updates and patches</li>
                    <li>Access controls and monitoring</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">5. Data Sharing and Disclosure</h3>
                  <p>We do NOT sell your personal information. We may share data only in these circumstances:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Service Providers:</strong> Third-party services (Supabase, Firebase) that help operate the App</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                    <li><strong>Aggregated Data:</strong> Anonymized statistics for research or analytics</li>
                    <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">6. Your Privacy Rights</h3>
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                    <li><strong>Portability:</strong> Export your data in a usable format</li>
                    <li><strong>Opt-Out:</strong> Disable notifications or data collection features</li>
                    <li><strong>Revoke Consent:</strong> Withdraw permission for data processing</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">7. Data Retention</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Account data is retained while your account is active</li>
                    <li>Deleted accounts are purged within 30 days</li>
                    <li>Anonymized analytics may be retained longer for research</li>
                    <li>Backup data is retained for 90 days</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">8. Children's Privacy</h3>
                  <p>
                    JoyGrow is designed for users aged 13 and above. We do not knowingly collect personal information 
                    from children under 13. If we discover such data, we will delete it immediately. Parents or guardians 
                    who believe their child has provided information should contact us.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">9. International Data Transfers</h3>
                  <p>
                    Your data may be processed in countries outside your residence. We ensure appropriate safeguards 
                    are in place to protect your information in compliance with applicable laws (GDPR, CCPA, etc.).
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">10. Cookies and Tracking</h3>
                  <p>
                    JoyGrow uses minimal tracking technologies:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>LocalStorage for offline functionality</li>
                    <li>Session cookies for authentication</li>
                    <li>Analytics cookies (can be disabled in settings)</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">11. Third-Party Services</h3>
                  <p>We use the following third-party services:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Supabase:</strong> Database and authentication</li>
                    <li><strong>Firebase:</strong> Cloud messaging and analytics</li>
                    <li><strong>TensorFlow Lite:</strong> AI quiz generation (on-device)</li>
                  </ul>
                  <p className="text-sm italic">
                    These services have their own privacy policies which we encourage you to review.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">12. Changes to This Policy</h3>
                  <p>
                    We may update this Privacy Policy periodically. We will notify you of significant changes via:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>In-app notifications</li>
                    <li>Email (if provided)</li>
                    <li>Updated "Last Modified" date</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">13. Contact Us</h3>
                  <p>
                    If you have questions, concerns, or requests regarding your privacy or this policy:
                  </p>
                  <div className="pl-4 space-y-2">
                    <p>
                      <strong>Admin Application Email:</strong><br />
                      <a href="mailto:joygrowapplication@gmail.com" className="text-pink-600 hover:underline">
                        joygrowapplication@gmail.com
                      </a>
                    </p>
                    <p>
                      <strong>Creators' Emails:</strong><br />
                      <a href="mailto:roseannjoy.mendoza@cvsu.edu.ph" className="text-pink-600 hover:underline">
                        roseannjoy.mendoza@cvsu.edu.ph
                      </a><br />
                      <a href="mailto:merryjoy.villanueva@cvsu.edu.ph" className="text-pink-600 hover:underline">
                        merryjoy.villanueva@cvsu.edu.ph
                      </a><br />
                      <a href="mailto:jannahjoy.condes@cvsu.edu.ph" className="text-pink-600 hover:underline">
                        jannahjoy.condes@cvsu.edu.ph
                      </a>
                    </p>
                  </div>

                  <div className="mt-8 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                    <p className="text-sm text-center text-gray-700">
                      By using JoyGrow, you acknowledge that you have read and understood this Privacy Policy and 
                      consent to the collection, use, and sharing of your information as described herein.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-pink-200 bg-white/80 backdrop-blur-sm">
                <Button
                  onClick={handleBackToWelcome}
                  className="w-full h-11 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {hasScrolledPrivacy ? 'Continue' : 'Back to Welcome'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}