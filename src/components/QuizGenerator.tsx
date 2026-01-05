import { useState, useEffect } from 'react';
import { Upload, FileText, Sparkles, CheckCircle, X, Brain, BookOpen, Loader2, Settings2, AlertCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { generateQuizzesWithAI, validateQuiz } from '../api/quiz-ai-service';
import { 
  parseDocument, 
  generateSmartSummary, 
  extractKeyTerms, 
  extractMainConcepts,
  detectTopics 
} from '../api/advanced-document-parser';
import { useAdmin } from '../contexts/AdminContext';
import { useUser } from '../contexts/UserContext';
import { 
  canGenerateAIQuiz, 
  canUploadDocument, 
  getRemainingAIQuizGenerations, 
  getRemainingDocumentUploads,
  incrementAIQuizGeneration,
  incrementDocumentUpload 
} from '../api/ai-usage-service';

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
  fill_blank_answers?: string[];
}

interface QuizGeneratorProps {
  onQuizGenerated: (quizzes: Quiz[], studyMaterial?: string) => void;
}

interface QuestionTypeConfig {
  id: string;
  name: string;
  description: string;
  example: string;
  icon: string;
  color: string;
  enabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function QuizGenerator({ onQuizGenerated }: QuizGeneratorProps) {
  const [studyMaterial, setStudyMaterial] = useState('');
  const [questionCount, setQuestionCount] = useState('10');
  const [customCount, setCustomCount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processedDocumentText, setProcessedDocumentText] = useState<string>('');
  const [remainingUses, setRemainingUses] = useState(3);
  const [refreshUsage, setRefreshUsage] = useState(0);
  
  const { appSettings, isAdmin } = useAdmin();
  const { currentUser } = useUser();
  
  const canCreateAIQuiz = appSettings.allowUserQuizCreation || isAdmin;
  const isDailyLimitReached = currentUser ? !canGenerateAIQuiz(currentUser.id) : false;
  
  useEffect(() => {
    if (currentUser) {
      const remaining = getRemainingAIQuizGenerations(currentUser.id);
      setRemainingUses(remaining);
    }
  }, [currentUser, refreshUsage]);
  
  const [documentAnalysis, setDocumentAnalysis] = useState<{
    summary: string;
    keyTerms: string[];
    concepts: string[];
    metadata: {
      wordCount: number;
      estimatedReadTime: number;
      topics: string[];
    };
  } | null>(null);

  const [questionTypes, setQuestionTypes] = useState<QuestionTypeConfig[]>([
    {
      id: 'identification',
      name: 'Identification',
      description: 'Define a term or concept. Question describes it, answer is the key term only.',
      example: 'Q: What is the term for: the process by which plants convert light?\nA: Photosynthesis',
      icon: '🎯',
      color: 'from-pink-500 to-rose-500',
      enabled: true,
      difficulty: 'medium',
    },
    {
      id: 'multiple_choice',
      name: 'Multiple Choice',
      description: 'Students select the correct answer from four given options (A, B, C, D).',
      example: 'Q: What is the capital of France?\nA) London  B) Berlin  C) Paris ✓  D) Rome',
      icon: '✓',
      color: 'from-blue-500 to-cyan-500',
      enabled: true,
      difficulty: 'easy',
    },
    {
      id: 'true_false',
      name: 'Modified True/False',
      description: 'Statement with highlighted part. If false, provide the correct replacement.',
      example: 'Statement: Water boils at 90°C.\n✗ False - Correction: 100°C',
      icon: '⚖️',
      color: 'from-purple-500 to-indigo-500',
      enabled: true,
      difficulty: 'easy',
    },
    {
      id: 'fill_blank',
      name: 'Fill in the Blank',
      description: 'Complete sentences by filling in missing words shown as _____.',
      example: 'Q: The _____ is the powerhouse of the cell.\nA: mitochondria',
      icon: '📝',
      color: 'from-green-500 to-emerald-500',
      enabled: true,
      difficulty: 'medium',
    },
    {
      id: 'matching',
      name: 'Matching',
      description: 'Match items from Column A with Column B based on relationships.',
      example: 'Match: A → Capital cities, B → Countries, etc.',
      icon: '🔗',
      color: 'from-orange-500 to-amber-500',
      enabled: true,
      difficulty: 'medium',
    },
    {
      id: 'enumeration',
      name: 'Enumeration',
      description: 'List multiple items (types, components, categories) in order.',
      example: 'Q: List 3 primary colors.\nA: 1) Red  2) Blue  3) Yellow',
      icon: '📋',
      color: 'from-violet-500 to-purple-500',
      enabled: true,
      difficulty: 'hard',
    },
  ]);

  const toggleQuestionType = (id: string) => {
    setQuestionTypes(prev => 
      prev.map(type => 
        type.id === id ? { ...type, enabled: !type.enabled } : type
      )
    );
  };

  const toggleAllQuestionTypes = (enabled: boolean) => {
    setQuestionTypes(prev => 
      prev.map(type => ({ ...type, enabled }))
    );
  };

  const getEnabledQuestionTypes = () => {
    return questionTypes.filter(type => type.enabled).map(type => type.id);
  };

  const getQuizTypeForGeneration = (): string | string[] => {
    const enabledTypes = getEnabledQuestionTypes();
    
    if (enabledTypes.length === 0) {
      toast.error('Please enable at least one question type');
      return 'mixed';
    }
    
    if (enabledTypes.length === 6) {
      return 'mixed';
    }
    
    if (enabledTypes.length === 1) {
      return enabledTypes[0];
    }
    
    return enabledTypes;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Please upload a file smaller than 10MB.');
      return;
    }
    
    setUploadedFile(file);
    setIsProcessingFile(true);
    setDocumentAnalysis(null);
    setProcessedDocumentText('');
    
    try {
      toast.loading('Processing document...', { id: 'file-processing' });
      
      const parsedDoc = await parseDocument(file);
      const summary = generateSmartSummary(parsedDoc.text);
      const keyTerms = extractKeyTerms(parsedDoc.text);
      const concepts = extractMainConcepts(parsedDoc.text);
      const topics = detectTopics(parsedDoc.text, keyTerms);
      
      setProcessedDocumentText(parsedDoc.text);
      
      setDocumentAnalysis({
        summary,
        keyTerms,
        concepts,
        metadata: {
          wordCount: parsedDoc.wordCount,
          estimatedReadTime: Math.ceil(parsedDoc.wordCount / 200),
          topics,
        },
      });
      
      toast.success('Document processed successfully!', { 
        id: 'file-processing'
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Failed to process document', {
        id: 'file-processing',
        description: error instanceof Error ? error.message : 'Please try again or paste text manually.'
      });
      setUploadedFile(null);
      setProcessedDocumentText('');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setProcessedDocumentText('');
    setDocumentAnalysis(null);
  };

  const handleGenerateQuiz = async () => {
    const contentForQuiz = processedDocumentText || studyMaterial.trim();
    
    if (!contentForQuiz) {
      toast.error('Please provide study material or upload a document');
      return;
    }
    
    if (!currentUser) {
      toast.error('Please log in to use AI generation');
      return;
    }
    
    if (isDailyLimitReached) {
      toast.error('Daily AI Limit Reached', {
        description: "You've used your 3 AI generations for today. You can use the AI again tomorrow when your daily limit resets.",
        duration: 6000,
      });
      return;
    }
    
    const enabledTypes = getEnabledQuestionTypes();
    if (enabledTypes.length === 0) {
      toast.error('No question types selected', {
        description: 'Please enable at least one question type before generating quizzes.',
        duration: 5000,
      });
      return;
    }

    const count = questionCount === 'custom' 
      ? parseInt(customCount) || 10
      : parseInt(questionCount);

    if (count < 1 || count > 100) {
      toast.error('Please enter a valid number of questions (1-100)');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      toast.loading(`Generating ${count} unique questions...`, { id: 'quiz-gen' });
      
      const quizzes = await generateQuizzesWithAI(contentForQuiz, getQuizTypeForGeneration(), count);
      const validQuizzes = quizzes.filter(quiz => validateQuiz(quiz));
      
      if (validQuizzes.length === 0) {
        toast.error('Failed to generate valid quizzes. Please try again.', { id: 'quiz-gen' });
        setIsGenerating(false);
        return;
      }
      
      // Increment usage counter on successful generation
      if (currentUser) {
        incrementAIQuizGeneration(currentUser.id);
        const newRemaining = getRemainingAIQuizGenerations(currentUser.id);
        setRemainingUses(newRemaining);
      }
      
      onQuizGenerated(validQuizzes, contentForQuiz);
      
      const newRemaining = currentUser ? getRemainingAIQuizGenerations(currentUser.id) : 0;
      
      // Success message with details
      if (validQuizzes.length === count) {
        toast.success(`Perfect! Generated exactly ${count} unique questions! 🎯`, {
          id: 'quiz-gen',
          description: `You have ${newRemaining} AI generation${newRemaining !== 1 ? 's' : ''} left for today.`,
        });
      } else {
        toast.success(`Generated ${validQuizzes.length} unique questions`, {
          id: 'quiz-gen',
          description: `Requested ${count}, got ${validQuizzes.length} unique questions. You have ${newRemaining} AI generation${newRemaining !== 1 ? 's' : ''} left today.`,
        });
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast.error('Failed to generate quizzes. Please try again.', { id: 'quiz-gen' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pt-16 pb-4">
      {/* Permission Check Warning */}
      {!canCreateAIQuiz && (
        <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-full">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-orange-900 mb-2">
                  AI Quiz Creation Disabled
                </h3>
                <p className="text-orange-800 leading-relaxed max-w-md">
                  AI-generated quiz creation has been disabled by your administrator. 
                  Please contact your admin if you need access to this feature.
                </p>
              </div>
              
              <div className="bg-white/60 border-2 border-orange-200 rounded-xl p-4 max-w-md">
                <div className="flex items-start gap-3 text-left">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      What can you do instead?
                    </div>
                    <div className="text-sm text-gray-600">
                      You can still access Practice Quiz in offline mode and other study features.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-500" />
            Study Material
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center hover:border-pink-300 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={!canCreateAIQuiz}
            />
            {!uploadedFile ? (
              <label htmlFor="file-upload" className={canCreateAIQuiz ? "cursor-pointer" : "cursor-not-allowed opacity-50"}>
                <Upload className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                <p className="text-gray-600">Upload your study materials</p>
                <p className="text-sm text-gray-400 mt-1">PDF, DOC, TXT files supported</p>
              </label>
            ) : (
              <motion.div 
                className="flex items-center justify-center gap-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-600">{uploadedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="h-8 w-8 p-0"
                  disabled={!canCreateAIQuiz}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Or paste your study material here:</Label>
            <Textarea
              placeholder="Enter your study notes, textbook excerpts, or any learning material..."
              value={studyMaterial}
              onChange={(e) => setStudyMaterial(e.target.value)}
              className="min-h-32"
              disabled={!canCreateAIQuiz}
            />
            {studyMaterial && (
              <p className="text-sm text-gray-500">
                {studyMaterial.length} characters • ~{Math.ceil(studyMaterial.split(' ').length / 5)} concepts detected
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Analysis Display */}
      <AnimatePresence mode="wait">
        {isProcessingFile && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Type Configuration */}
      <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50/50 to-rose-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-pink-600" />
              Question Type Configuration
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllQuestionTypes(true)}
                className="text-xs h-8 border-pink-300 text-pink-700 hover:bg-pink-100"
                disabled={!canCreateAIQuiz}
              >
                Enable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllQuestionTypes(false)}
                className="text-xs h-8 border-gray-300 text-gray-700 hover:bg-gray-100"
                disabled={!canCreateAIQuiz}
              >
                Disable All
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Select which question types to include in your quiz. Toggle individual types on or off.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {questionTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div 
                className={`
                  relative rounded-xl border-2 p-3 transition-all duration-300
                  ${type.enabled 
                    ? 'border-pink-300 bg-white shadow-sm hover:shadow-md' 
                    : 'border-gray-200 bg-gray-50 opacity-60'
                  }
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`
                      text-2xl p-2 rounded-lg 
                      ${type.enabled 
                        ? `bg-gradient-to-br ${type.color} bg-opacity-10` 
                        : 'bg-gray-200'
                      }
                    `}>
                      {type.icon}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className={`font-semibold ${type.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {type.name}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`
                          text-xs
                          ${type.difficulty === 'easy' ? 'bg-green-50 text-green-700 border-green-300' : ''}
                          ${type.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : ''}
                          ${type.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-300' : ''}
                        `}
                      >
                        {type.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={type.enabled}
                    onCheckedChange={() => toggleQuestionType(type.id)}
                    className="flex-shrink-0 data-[state=checked]:bg-pink-600"
                    disabled={!canCreateAIQuiz}
                  />
                </div>
              </div>
            </motion.div>
          ))}

          <div className="pt-4 mt-4 border-t border-pink-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-pink-100 text-pink-700 border-pink-300">
                  {getEnabledQuestionTypes().length} of 6 Types Enabled
                </Badge>
                {getEnabledQuestionTypes().length === 0 && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    ⚠️ Please enable at least one question type
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {getEnabledQuestionTypes().map(typeId => {
                  const type = questionTypes.find(t => t.id === typeId);
                  return type ? (
                    <Badge 
                      key={typeId} 
                      variant="outline" 
                      className="text-xs bg-white"
                    >
                      {type.icon} {type.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Number of Questions</Label>
            <Select value={questionCount} onValueChange={setQuestionCount} disabled={!canCreateAIQuiz || isDailyLimitReached}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="15">15 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Daily Usage Counter */}
          {currentUser && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border-2 ${
                isDailyLimitReached 
                  ? 'bg-red-50 border-red-300' 
                  : 'bg-blue-50 border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {isDailyLimitReached ? '🔒 Daily Limit Reached' : `📊 AI Uses Today`}
                  </p>
                  <p className={`text-xs ${isDailyLimitReached ? 'text-red-700' : 'text-blue-700'}`}>
                    {isDailyLimitReached 
                      ? 'Come back tomorrow for 3 more AI generations.' 
                      : `You have ${remainingUses} of 3 AI generation${remainingUses !== 1 ? 's' : ''} left today.`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" className="bg-pink-100 text-pink-700">AI-Powered</Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">Context Enrichment</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Exact Count</Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700">100% Unique</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button 
        className={`w-full h-12 ${
          isDailyLimitReached
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700'
        }`}
        onClick={handleGenerateQuiz}
        disabled={(!studyMaterial.trim() && !processedDocumentText) || isGenerating || !canCreateAIQuiz || isDailyLimitReached}
        title={isDailyLimitReached ? 'Daily AI generation limit reached. Come back tomorrow.' : ''}
      >
        {isDailyLimitReached ? (
          <motion.div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Daily Limit Reached - Come Back Tomorrow
          </motion.div>
        ) : isGenerating ? (
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5" />
            Generating {questionCount === 'custom' ? customCount || '10' : questionCount} Unique Questions...
          </motion.div>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate {questionCount === 'custom' ? (customCount || '10') : questionCount} Questions with AI
          </>
        )}
      </Button>
    </div>
  );
}