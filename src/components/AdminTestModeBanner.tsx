import { ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';

interface AdminTestModeBannerProps {
  onBackToAdmin: () => void;
}

export function AdminTestModeBanner({ onBackToAdmin }: AdminTestModeBannerProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="sticky top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#ff4bb5] to-[#ff8a5c] shadow-lg"
    >
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4 py-2 sm:py-2.5 md:py-3">
          {/* Left: Mode Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Icons */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg backdrop-blur-sm">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 animate-pulse" />
            </div>
            
            {/* Badge & Text */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Badge 
                className="bg-white text-[#ff4bb5] hover:bg-white font-bold text-xs sm:text-sm shadow-md flex-shrink-0 whitespace-nowrap"
              >
                🔐 Admin Mode
              </Badge>
              <span className="text-white font-medium text-xs sm:text-sm hidden sm:inline truncate">
                Experiencing JoyGrow as a learner
              </span>
            </div>
          </div>

          {/* Right: Back Button - Pastel pink matching JoyGrow theme */}
          <Button
            onClick={onBackToAdmin}
            size="sm"
            className="bg-pink-200 hover:bg-pink-300 text-pink-900 font-bold shadow-md h-8 sm:h-9 px-3 sm:px-4 flex-shrink-0 border-2 border-pink-300 hover:border-pink-400 transition-all whitespace-nowrap text-xs sm:text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="ml-1.5 sm:ml-2">Back</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}