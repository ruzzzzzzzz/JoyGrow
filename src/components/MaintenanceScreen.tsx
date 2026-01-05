import { Settings, AlertTriangle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface MaintenanceScreenProps {
  onLogout: () => void;
}

export function MaintenanceScreen({ onLogout }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-orange-300 shadow-2xl">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-full">
                <Settings className="w-16 h-16 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Under Maintenance
                </h1>
              </div>
              <p className="text-gray-600">
                We're currently performing system updates
              </p>
            </div>

            {/* Message */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 space-y-3 w-full">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    What's happening?
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    JoyGrow is currently under maintenance for system updates and improvements. 
                    We're working hard to bring you a better learning experience!
                  </p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-orange-200">
                <p className="text-sm font-medium text-gray-700">
                  ⏰ Please check back in a few minutes
                </p>
              </div>
            </div>

            {/* Features List */}
            <div className="w-full space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                What we're working on:
              </p>
              <div className="bg-white rounded-lg p-4 space-y-2 border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>System performance improvements</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Bug fixes and optimizations</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>New feature updates</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="w-full pt-4">
              <Button
                onClick={onLogout}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
                size="lg"
              >
                Return to Login
              </Button>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-500 pt-2">
              Thank you for your patience! 💖
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
