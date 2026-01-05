import { useState, useRef, useEffect } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';

interface FillBlankEditorProps {
  questionText: string;
  answers: string[];
  onQuestionChange: (text: string) => void;
  onAnswersChange: (answers: string[]) => void;
  // Add support for AI-generated questions with [BLANK1] format
  isAIGenerated?: boolean;
}

export function FillBlankEditor({
  questionText,
  answers,
  onQuestionChange,
  onAnswersChange,
  isAIGenerated = false
}: FillBlankEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Convert [BLANK1], [BLANK2] format to _____ format on mount if AI-generated
  useEffect(() => {
    if (isAIGenerated && questionText.includes('[BLANK')) {
      const convertedText = questionText.replace(/\[BLANK\d+\]/g, '_____');
      if (convertedText !== questionText) {
        onQuestionChange(convertedText);
      }
    }
  }, []); // Only run once on mount

  // Extract blank count from question text by counting "_____" occurrences
  const blankCount = (questionText.match(/_____/g) || []).length;

  // Update cursor position when textarea selection changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onQuestionChange(newText);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleTextareaClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0);
    }
  };

  const handleTextareaKeyUp = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0);
    }
  };

  // Insert blank at cursor position
  const insertBlank = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = questionText;

    // Insert the blank line "_____"
    const blankPlaceholder = '_____';
    const newText = text.slice(0, start) + blankPlaceholder + text.slice(end);
    
    onQuestionChange(newText);

    // Count total blanks after insertion
    const totalBlanks = (newText.match(/_____/g) || []).length;

    // Add a new empty answer for this blank
    const newAnswers = [...answers];
    newAnswers[totalBlanks - 1] = '';
    onAnswersChange(newAnswers);

    // Set cursor position after the inserted blank
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = start + blankPlaceholder.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
        setCursorPosition(newPosition);
      }
    }, 0);
  };

  // Update answer for a specific blank
  const updateAnswer = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    onAnswersChange(newAnswers);
  };

  // Remove a blank and its answer
  const removeBlank = (blankIndex: number) => {
    // Find and remove the specific blank occurrence
    let count = 0;
    let position = -1;
    let index = questionText.indexOf('_____');
    
    while (index !== -1 && count < blankIndex) {
      position = index;
      count++;
      index = questionText.indexOf('_____', index + 1);
    }
    
    if (count === blankIndex && position !== -1) {
      // Remove the blank at this position
      const newText = questionText.substring(0, position) + questionText.substring(position + 5);
      onQuestionChange(newText);
      
      // Remove the corresponding answer
      const newAnswers = answers.filter((_, idx) => idx !== blankIndex - 1);
      onAnswersChange(newAnswers);
    }
  };

  // Get all blanks in order (1-indexed)
  const getBlanksInOrder = () => {
    const blanks: number[] = [];
    for (let i = 0; i < blankCount; i++) {
      blanks.push(i + 1);
    }
    return blanks;
  };

  const blanksInOrder = getBlanksInOrder();

  return (
    <div className="space-y-4">
      {/* Question Text Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-pink-700">Question Text</Label>
          <Button
            type="button"
            size="sm"
            onClick={insertBlank}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Insert Blank
          </Button>
        </div>
        <Textarea
          ref={textareaRef}
          value={questionText}
          onChange={handleTextareaChange}
          onClick={handleTextareaClick}
          onKeyUp={handleTextareaKeyUp}
          placeholder="Type your question and click 'Insert Blank' to add blanks..."
          className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 min-h-[100px]"
        />
        <p className="text-xs text-gray-500">
          💡 Click where you want to insert a blank, then press the "Insert Blank" button
        </p>
      </div>

      {/* Answer Inputs */}
      {blanksInOrder.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-pink-700">Correct Answers</Label>
            <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-300">
              {blanksInOrder.length} {blanksInOrder.length === 1 ? 'blank' : 'blanks'}
            </Badge>
          </div>
          
          <div className="space-y-2 bg-pink-50 p-3 rounded-lg border border-pink-200">
            <AnimatePresence>
              {blanksInOrder.map((blankNum) => (
                <motion.div
                  key={blankNum}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-700">
                        Blank {blankNum}:
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlank(blankNum)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 px-2"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <Input
                      value={answers[blankNum - 1] || ''}
                      onChange={(e) => updateAnswer(blankNum - 1, e.target.value)}
                      placeholder={`Answer for blank ${blankNum}...`}
                      className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {blanksInOrder.length > 0 && blanksInOrder.some(num => !answers[num - 1] || !answers[num - 1].trim()) && (
        <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-800">
            Please provide answers for all blanks before saving the question.
          </p>
        </div>
      )}
    </div>
  );
}