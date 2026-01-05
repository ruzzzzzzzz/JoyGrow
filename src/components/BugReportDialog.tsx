import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Bug, Upload, X, Image, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../contexts/UserContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { db } from '../database';

const BUG_CATEGORIES = [
  'Login & Account',
  'AI-Generated Quizzes',
  'Customize Quizzes',
  'Study Materials',
  'Productivity Tools',
  'Offline Mode',
  'Online Mode',
  'Other',
] as const;

type BugCategory = (typeof BUG_CATEGORIES)[number];

interface BugReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportDialog({ open, onOpenChange }: BugReportDialogProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BugCategory | ''>('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useUser();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload only image files');
        return false;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return false;
      }
      return true;
    });

    if (screenshots.length + validFiles.length > 3) {
      toast.error('You can upload maximum 3 screenshots');
      return;
    }

    // Create preview URLs for display
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

    setScreenshots((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeScreenshot = (index: number) => {
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(previewUrls[index]);

    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please describe the bug');
      return;
    }

    if (!category) {
      toast.error('Please select a bug category');
      return;
    }

    if (!currentUser) {
      toast.error('You must be logged in to submit a bug report.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert screenshots to base64 for persistent storage
      const base64Screenshots: string[] = [];

      for (const file of screenshots) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        base64Screenshots.push(base64);
      }

      // Save bug report to database
      try {
        await db.createBugReport({
          user_id: currentUser.id,
          username: currentUser.username,
          type: 'bug_report',
          category,
          description,
          screenshot_count: screenshots.length,
          screenshots: base64Screenshots,
          status: 'pending',
          priority: 'normal',
          platform: {
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
          },
        });

        // Create a notification for admin in database
        await db.createNotification({
          user_id: 'admin', // Admin notification
          type: 'update',
          title: '🐛 New Bug Report',
          message: `${currentUser.username} reported a bug`,
          icon: '🐛',
          read: false,
          metadata: {
            reportId: 'bug-report',
            userId: currentUser.id,
            bugType: 'bug_report',
          },
          synced: false,
        });
      } catch (error) {
        console.error('Error saving bug report:', error);
        throw error;
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Bug report submitted successfully!', {
        description:
          'Thank you for helping us improve JoyGrow. Our team will review your report.',
      });

      // Reset form
      setDescription('');
      setCategory('');
      screenshots.forEach((_, index) =>
        URL.revokeObjectURL(previewUrls[index]),
      );
      setScreenshots([]);
      setPreviewUrls([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error('Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Clean up preview URLs
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setDescription('');
      setCategory('');
      setScreenshots([]);
      setPreviewUrls([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="size-5 text-primary" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us improve JoyGrow by reporting any bugs or issues you
            encounter. Please provide as much detail as possible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bug Description */}
          <div className="space-y-2">
            <Label htmlFor="bug-description">
              Describe the bug <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bug-description"
              placeholder="What happened? What did you expect to happen? Please include steps to reproduce the bug..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px] resize-none bg-input-background border-border"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Bug Category */}
          <div className="space-y-2">
            <Label htmlFor="bug-category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(value: string) => setCategory(value as BugCategory)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category">
                  {category || 'Select a category'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BUG_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label>Screenshots (Optional)</Label>
            <div className="space-y-3">
              {/* Upload Button */}
              <Button
                type="button"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={screenshots.length >= 3 || isSubmitting}
              >
                <Upload className="mr-2 size-4" />
                Upload Screenshots ({screenshots.length}/3)
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={screenshots.length >= 3 || isSubmitting}
              />

              {/* Preview Screenshots */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted"
                    >
                      <img
                        src={url}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        disabled={isSubmitting}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs text-center py-0.5 rounded">
                        <Image className="size-3 inline mr-1" />
                        {(screenshots[index].size / 1024).toFixed(0)}KB
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                You can upload up to 3 screenshots (max 5MB each). Supported
                formats: JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>

          {/* User Info Display */}
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              Report will be submitted as:
            </p>
            <p className="text-sm">
              <span className="font-medium">
                {currentUser?.username || 'Anonymous User'}
              </span>
              {currentUser && (
                <span className="text-muted-foreground ml-2">
                  (User #{currentUser.id})
                </span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || isSubmitting}
            className="min-w-[120px] bg-pink-600 hover:bg-pink-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Bug className="mr-2 size-4" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
