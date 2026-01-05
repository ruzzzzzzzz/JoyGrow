import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Save, BookOpen, Tag, Calendar, Brain, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

interface Quiz {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'enumeration' | 'identification';
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  pairs?: { left: string; right: string }[];
  underlinedText?: string;
  correctReplacement?: string;
}

interface SaveQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizzes: Quiz[];
  onSave: (title: string, description: string, category: string, tags: string[]) => void;
  studyMaterial?: string;
  onClose: () => void;
  onSkip: () => void;
}

const PREDEFINED_CATEGORIES = [
  'Mathematics',
  'History',
  'Language',
  'Geography',
  'Technology',
  'Arts',
  'General Knowledge',
  'Other'
];

export function SaveQuizDialog({ open, onOpenChange, quizzes, onSave, studyMaterial, onClose, onSkip }: SaveQuizDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setSelectedCategory('');
      setCustomCategory('');
      setTagInput('');
      setTags([]);
    }
  }, [open]);

  const getQuizTypeLabel = (type: Quiz['type']): string => {
    const labels: { [key: string]: string } = {
      multiple_choice: 'Multiple Choice',
      true_false: 'True/False',
      fill_blank: 'Fill Blank',
      matching: 'Matching',
      enumeration: 'Enumeration',
      identification: 'Identification'
    };
    return labels[type] || type;
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const finalCategory = selectedCategory === 'Other' ? customCategory : selectedCategory;
  const canSave =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    finalCategory.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(title, description, finalCategory, tags);
    onOpenChange(false);
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-pink-500" />
            Save Quiz to Study Materials
          </DialogTitle>
          <DialogDescription>
            Your AI-generated quiz is ready! Add details to save it to your study materials for future practice.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4"
        >
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-4 border-2 border-pink-200">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-pink-600" />
              <h3 className="font-medium text-pink-800">Quiz Summary</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <p className="text-gray-600">Questions</p>
                <p className="text-xl font-semibold text-pink-600">{quizzes.length}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <p className="text-gray-600">Types</p>
                <p className="text-xl font-semibold text-purple-600">
                  {new Set(quizzes.map(q => q.type)).size}
                </p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <p className="text-gray-600">Est. Time</p>
                <p className="text-xl font-semibold text-blue-600">{quizzes.length * 2}-{quizzes.length * 3}m</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <p className="text-gray-600">Created</p>
                <p className="text-sm font-semibold text-green-600">Just now</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pink-500" />
              Quiz Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your quiz..."
              className="border-pink-200 focus:border-pink-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-500" />
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or details about this quiz (optional)..."
              className="min-h-20 border-pink-200 focus:border-pink-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2 text-pink-700">
              Category
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(value: string) => {
                setSelectedCategory(value);
                if (value !== 'Other') {
                  setCustomCategory('');
                }
              }}
            >
              <SelectTrigger className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 [&_span]:text-base">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory === 'Other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  id="custom-category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category..."
                  className="border-pink-200 focus:border-pink-400 mt-2 bg-pink-50/30"
                  autoFocus
                />
              </motion.div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-pink-500" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tags (press Enter)"
                className="border-pink-200 focus:border-pink-400"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Badge
                      variant="secondary"
                      className="bg-pink-100 text-pink-700 border-pink-200 cursor-pointer hover:bg-pink-200"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save to Study Materials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
