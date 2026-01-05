import { motion } from 'motion/react';
import { Brain, Heart, Star, Zap } from 'lucide-react';
import { useState } from 'react';
import joyImage from 'figma:asset/ebd33da1c91354be18169c74abee5c02fe5f89cc.png';

interface JoyCharacterProps {
  mood: 'happy' | 'excited' | 'thinking' | 'sleepy' | 'encouraging';
  streak: number;
}

export function JoyCharacter({ mood, streak }: JoyCharacterProps) {
  // Collection of motivational affirmations
  const affirmations = [
    "You are capable of amazing things! 🌟",
    "Every mistake is a step toward mastery! 💪",
    "Your curiosity is your superpower! 🧠",
    "Believe in yourself - I believe in you! ❤️",
    "You're growing stronger with every question! 🌱",
    "Learning is an adventure, and you're the hero! 🚀",
    "Your persistence will pay off! Keep going! ⚡",
    "You have the power to understand anything! 🧩",
    "Small steps lead to big achievements! 👣",
    "Your brain is like a muscle - it gets stronger with use! 💪",
    "You're not just learning, you're transforming! ✨",
    "Every challenge is a chance to shine! 💎",
    "Your potential is limitless! 🌈",
    "You make me proud every single day! 🏆",
    "Trust the process - you're exactly where you need to be! 🎯",
    "Your dedication inspires me! 🔥",
    "Knowledge is power, and you're becoming powerful! ⚡",
    "You turn obstacles into opportunities! 🌟",
    "Your mind is a treasure chest of possibilities! 💎",
    "Keep shining, brilliant human! ✨"
  ];

  const [currentAffirmation, setCurrentAffirmation] = useState<string>("");
  const [showAffirmation, setShowAffirmation] = useState(false);

  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'thinking': return '🤔';
      case 'sleepy': return '😴';
      case 'encouraging': return '💪';
      default: return '😊';
    }
  };

  const handleJoyClick = () => {
    const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
    setCurrentAffirmation(randomAffirmation);
    setShowAffirmation(true);
  };

  const getMoodMessage = () => {
    switch (mood) {
      case 'happy': return `Great job! You're on a ${streak}-day streak! 🔥`;
      case 'excited': return "You're crushing it today! Keep going! ⚡";
      case 'thinking': return "What should we study today? 🧠";
      case 'sleepy': return "Ready for some learning? Let's wake up that brain! ☕";
      case 'encouraging': return "You've got this! Every question makes you stronger! 💪";
      default: return "Let's learn something amazing together! 📚";
    }
  };

  const getFloatingIcon = () => {
    switch (mood) {
      case 'happy': return <Heart className="w-4 h-4 text-red-400" />;
      case 'excited': return <Star className="w-4 h-4 text-yellow-400" />;
      case 'thinking': return <Brain className="w-4 h-4 text-blue-400" />;
      case 'encouraging': return <Zap className="w-4 h-4 text-orange-400" />;
      default: return <Star className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <motion.div 
      className="relative flex flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl md:rounded-3xl border-2 border-pink-200 cursor-pointer active:shadow-lg transition-all duration-300 shadow-sm"
      onClick={handleJoyClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      title="Click me for daily motivation!"
    >
      {/* Floating icons animation */}
      <motion.div
        className="absolute top-3 right-3 md:top-4 md:right-4"
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {getFloatingIcon()}
      </motion.div>

      {/* Joy Character */}
      <motion.div
        className="relative w-32 h-32 md:w-40 md:h-40 mb-3 md:mb-4"
        animate={{ 
          y: [0, -10, 0],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <img 
          src={joyImage} 
          alt="Joy - Your Study Companion" 
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </motion.div>

      {/* Character Name */}
      <motion.h3 
        className="mb-1.5 md:mb-2 text-lg md:text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Joy
      </motion.h3>

      {/* Mood Message */}
      <motion.p 
        className="text-center text-gray-600 px-3 md:px-4 text-sm md:text-base"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {getMoodMessage()}
      </motion.p>
      
      {/* Click hint */}
      {!showAffirmation && (
        <motion.p 
          className="text-[10px] md:text-xs text-pink-500 mt-2 opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6 }}
        >
          💕 Tap me for daily motivation!
        </motion.p>
      )}

      {/* Affirmation Display */}
      {showAffirmation && (
        <motion.div
          className="mt-3 md:mt-4 p-3 md:p-4 bg-pink-50 border-2 border-pink-200 rounded-xl max-w-sm mx-auto"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <p className="text-center text-pink-700 mb-2 md:mb-3 text-sm md:text-base">
            {currentAffirmation}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAffirmation(false);
            }}
            className="w-full text-[10px] md:text-xs text-pink-500 hover:text-pink-600 active:text-pink-700 transition-colors py-1"
          >
            ✨ Thank you, Joy! ✨
          </button>
        </motion.div>
      )}

      {/* Streak indicator */}
      {streak > 0 && (
        <motion.div 
          className={`${showAffirmation ? 'mt-2' : 'mt-2 md:mt-3'} flex items-center gap-1.5 md:gap-2 bg-orange-100 px-2.5 md:px-3 py-1 rounded-full`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
        >
          <span className="text-orange-600 text-sm md:text-base">🔥</span>
          <span className="text-orange-700 text-xs md:text-sm">{streak} days</span>
        </motion.div>
      )}
    </motion.div>
  );
}