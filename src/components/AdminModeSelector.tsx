import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Shield, Users, Sparkles, ArrowRight } from 'lucide-react';
import joyImage from 'figma:asset/ebd33da1c91354be18169c74abee5c02fe5f89cc.png';

interface AdminModeSelectorProps {
  adminUsername: string;
  onSelectMode: (mode: 'admin' | 'learner') => void;
}

export function AdminModeSelector({ adminUsername, onSelectMode }: AdminModeSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <img 
                src={joyImage} 
                alt="Joy" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Welcome, {adminUsername}!
              </h1>
              <p className="text-gray-600 mt-1">Choose how you'd like to use JoyGrow</p>
            </div>
          </div>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin Dashboard Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card 
              className="border-2 border-pink-200 hover:border-pink-400 hover:shadow-2xl transition-all cursor-pointer group h-full"
              onClick={() => onSelectMode('admin')}
            >
              <CardContent className="p-8 h-full flex flex-col">
                <div className="flex-1">
                  {/* Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Enter Admin Dashboard
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">
                    Access the full admin interface to manage users, quizzes, view analytics, track activity, and configure system settings.
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      User Management
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      Analytics & Reporting
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      System Configuration
                    </li>
                  </ul>
                </div>

                {/* Button */}
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white h-12 rounded-xl group-hover:shadow-lg transition-all"
                  onClick={() => onSelectMode('admin')}
                >
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Learner Mode Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card 
              className="border-2 border-purple-200 hover:border-purple-400 hover:shadow-2xl transition-all cursor-pointer group h-full"
              onClick={() => onSelectMode('learner')}
            >
              <CardContent className="p-8 h-full flex flex-col">
                <div className="flex-1">
                  {/* Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Use JoyGrow as a Learner
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">
                    Experience the complete student interface to test features, explore the app, and understand the user journey firsthand.
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Complete User Experience
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Test All Features
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Quiz & Study Tools
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="flex items-center gap-1">
                        Admin Test Mode
                        <Sparkles className="w-3 h-3 text-purple-500" />
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Button */}
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-12 rounded-xl group-hover:shadow-lg transition-all"
                  onClick={() => onSelectMode('learner')}
                >
                  Start Learning
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            💡 You can switch between modes at any time
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
