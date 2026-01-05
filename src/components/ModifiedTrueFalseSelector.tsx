import { useState, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';

interface ModifiedTrueFalseSelectorProps {
  questionText: string;
  selectedText: string;
  correctAnswer: string;
  correctReplacement: string;
  onTextSelect: (text: string) => void;
  onAnswerChange: (answer: string, replacement: string) => void;
  // Add support for AI-generated questions that already have data
  isAIGenerated?: boolean;
}

export function ModifiedTrueFalseSelector({ 
  questionText, 
  selectedText,
  correctAnswer,
  correctReplacement,
  onTextSelect,
  onAnswerChange,
  isAIGenerated = false
}: ModifiedTrueFalseSelectorProps) {
  // If AI-generated and has selectedText, start with question confirmed
  const [isQuestionConfirmed, setIsQuestionConfirmed] = useState(!!selectedText || isAIGenerated);
  const questionRef = useRef<HTMLDivElement>(null);

  // Handle word tap/click selection
  const handleWordClick = (word: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!word.trim()) return;
    
    // Remove punctuation from the word
    const cleanedWord = word.replace(/[^a-zA-Z0-9]/g, '');
    
    // Check if it's a single word (no spaces)
    if (cleanedWord.includes(' ') || /\s/.test(cleanedWord)) {
      toast.error('Please select only a single word', {
        description: 'Multi-word phrases are not allowed. Tap a single word only.',
        duration: 4000,
      });
      return;
    }

    onTextSelect(cleanedWord);
    toast.success(`✓ Selected: "${cleanedWord}"`);
  };

  // Handle text selection (for drag selection as backup)
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const selectedTextContent = selection.toString().trim();
    
    if (!selectedTextContent) {
      return;
    }

    // Check if selected text is within the question
    if (!questionText.includes(selectedTextContent)) {
      toast.error('⚠️ Please select text from within the question');
      return;
    }
    
    // Check if it's a single word (no spaces)
    if (selectedTextContent.includes(' ')) {
      toast.error('Please select only a single word', {
        description: 'Multi-word phrases are not allowed. Select a single word only.',
        duration: 4000,
      });
      // Clear selection
      selection.removeAllRanges();
      return;
    }

    onTextSelect(selectedTextContent);
    toast.success(`✓ Selected: "${selectedTextContent}"`);
    
    // Clear selection
    selection.removeAllRanges();
  };

  // Handle touch/mobile selection (with slight delay to ensure selection is complete)
  const handleTouchEnd = () => {
    // Small timeout to ensure selection is complete on mobile
    setTimeout(() => {
      handleTextSelection();
    }, 150);
  };

  const handleQuestionConfirm = () => {
    if (!questionText || !questionText.trim()) {
      toast.error('⚠️ Please enter a question first');
      return;
    }
    setIsQuestionConfirmed(true);
    toast.success('✓ Question confirmed! Now select the keyword to evaluate.');
  };

  const handleEditQuestion = () => {
    setIsQuestionConfirmed(false);
    onTextSelect('');
    onAnswerChange('', '');
  };

  // Render question with tappable/clickable words
  const renderQuestionWithTappableWords = () => {
    // Split the question into words while preserving punctuation and spaces
    const words = questionText.split(/(\s+)/);
    
    return (
      <div className="flex flex-wrap gap-1">
        {words.map((word, index) => {
          // If it's just whitespace, render as is
          if (/^\s+$/.test(word)) {
            return <span key={index} className="whitespace-pre">{word}</span>;
          }
          
          // Check if this word is the selected text
          const isSelected = selectedText === word;
          
          return (
            <span
              key={index}
              onClick={(e) => handleWordClick(word, e)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleWordClick(word, e);
              }}
              className={`
                cursor-pointer px-1.5 py-0.5 rounded transition-all duration-200
                ${isSelected 
                  ? 'bg-pink-200 text-pink-800 font-bold border-2 border-pink-400' 
                  : 'hover:bg-pink-50 active:bg-pink-100'
                }
              `}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {!isQuestionConfirmed ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 p-4 rounded-lg border border-blue-200"
        >
          <Label className="text-blue-700 mb-2 block flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Confirm Your Question
          </Label>
          <p className="text-xs text-gray-600 mb-3">
            Make sure your question is complete before selecting the keyword to evaluate.
          </p>
          <Button 
            type="button"
            onClick={handleQuestionConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            ✓ Question is Complete
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Display Question with Highlighting */}
          <div className="bg-white p-4 rounded-lg border-2 border-pink-200">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-pink-700">Your Question:</Label>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={handleEditQuestion}
                className="text-xs"
              >
                Edit Question
              </Button>
            </div>
            <div
              ref={questionRef}
              onMouseUp={handleTextSelection}
              onTouchEnd={handleTouchEnd}
              className="text-base leading-relaxed p-3 bg-gray-50 rounded cursor-text select-text touch-manipulation"
              style={{ 
                userSelect: 'text',
                WebkitUserSelect: 'text',
                MozUserSelect: 'text',
                msUserSelect: 'text'
              }}
            >
              {renderQuestionWithTappableWords()}
            </div>
            {!selectedText && (
              <p className="text-xs text-gray-500 mt-2 italic">
                💡 <strong>Tap any word</strong> to select the word or phrase that determines if the statement is true or false
              </p>
            )}
            {selectedText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-pink-50 rounded border border-pink-300"
              >
                <p className="text-xs text-pink-700 mb-1">✓ Selected keyword:</p>
                <p className="text-sm">
                  <strong className="font-bold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded">
                    {selectedText}
                  </strong>
                </p>
              </motion.div>
            )}
          </div>

          {/* True/False Selection */}
          {selectedText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 bg-pink-50 p-4 rounded-lg border border-pink-200"
            >
              <Label className="text-pink-700">Is this statement True or False?</Label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border-2 transition-colors hover:border-pink-300">
                  <input
                    type="radio"
                    name="true-false-answer"
                    checked={correctAnswer === 'True'}
                    onChange={() => onAnswerChange('True', '')}
                    className="w-5 h-5 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="font-medium">True</span>
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border-2 transition-colors hover:border-pink-300">
                    <input
                      type="radio"
                      name="true-false-answer"
                      checked={correctAnswer === 'False'}
                      onChange={() => onAnswerChange('False', correctReplacement)}
                      className="w-5 h-5 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="font-medium">False</span>
                  </label>

                  {/* Correct Replacement Input */}
                  {correctAnswer === 'False' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-7 space-y-2"
                    >
                      <Label className="text-xs text-pink-700">
                        Enter the correct word/phrase:
                      </Label>
                      <Input
                        value={correctReplacement || ''}
                        onChange={(e) => onAnswerChange('False', e.target.value)}
                        placeholder="Type the correct word/phrase here"
                        className="border-pink-300 focus:border-pink-500 focus:ring-pink-500"
                      />
                      <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                        <p className="text-xs text-green-800">
                          💡 Students who answer "False" will need to provide this replacement to get the answer correct.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}