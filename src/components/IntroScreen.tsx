import { useEffect, useState } from 'react';
import { Brain, BookOpen, Trophy, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import joyImage from 'figma:asset/ebd33da1c91354be18169c74abee5c02fe5f89cc.png';

interface IntroScreenProps {
  onComplete: () => void;
}

type DragEndHandler = NonNullable<
  React.ComponentProps<typeof motion.div>['onDragEnd']
>;

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(0);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Transform your study materials into personalized quizzes instantly',
      color: 'from-pink-500 to-rose-600',
    },
    {
      icon: Trophy,
      title: 'Gamified Experience',
      description: 'Earn achievements, maintain streaks, and level up your knowledge',
      color: 'from-rose-500 to-pink-600',
    },
    {
      icon: Zap,
      title: 'Study Anywhere',
      description: 'Seamless offline-online sync keeps your progress everywhere',
      color: 'from-purple-500 to-pink-600',
    },
  ];

  const nextSlide = () => {
    if (currentStep < features.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
      setIsAutoPlaying(false);
    }
  };

  const prevSlide = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
      setIsAutoPlaying(false);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
    setIsAutoPlaying(false);
  };

  const handleDragEnd: DragEndHandler = (_event, info) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      prevSlide();
    } else if (info.offset.x < -threshold) {
      nextSlide();
    }
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setTimeout(() => {
      if (currentStep < features.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsAutoPlaying(false);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentStep, isAutoPlaying, features.length]);

  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-rose-50/80 to-pink-100/80"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full text-center relative z-10 px-2 sm:px-0">
        <motion.div
          initial={{ scale: 0, y: -100 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
          className="mb-8"
        >
          <motion.div
            animate={{
              y: [0, -15, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-32 h-32 mx-auto relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-300/40 to-rose-400/40 rounded-full blur-3xl"></div>
            <img
              src={joyImage}
              alt="Joy - Your Study Companion"
              className="w-full h-full object-contain drop-shadow-2xl relative z-10"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-4"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 bg-clip-text text-transparent mb-2 drop-shadow-sm">
            JoyGrow
          </h1>
          <p className="text-pink-700 text-base sm:text-lg drop-shadow-sm">
            AI-Enhanced Learning Companion
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mb-8 h-48 relative"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 300 : -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -300 : 300 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-pink-200/50 shadow-lg cursor-grab active:cursor-grabbing touch-pan-x"
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-r ${features[currentStep].color} rounded-2xl flex items-center justify-center shadow-md`}
              >
                {(() => {
                  const IconComponent = features[currentStep].icon;
                  return (
                    <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  );
                })()}
              </div>
              <h3 className="text-pink-800 text-lg sm:text-xl mb-2 sm:mb-3">
                {features[currentStep].title}
              </h3>
              <p className="text-pink-600 text-sm sm:text-base">
                {features[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="flex justify-center mb-6 sm:mb-8 space-x-1">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all duration-300 touch-manipulation ${
                index === currentStep
                  ? 'w-1.5 h-1.5 bg-white/70'
                  : 'w-1 h-1 bg-white/15 hover:bg-white/30 active:bg-white/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <Button
            onClick={handleGetStarted}
            className="w-full h-12 sm:h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 rounded-2xl touch-manipulation"
          >
            Get Started
          </Button>
        </motion.div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-sm"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 5 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.7,
                ease: 'easeInOut',
              }}
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + i * 10}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
