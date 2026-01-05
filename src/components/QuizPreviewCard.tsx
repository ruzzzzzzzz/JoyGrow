import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

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
  fill_blank_answers?: string[];}

interface QuizPreviewCardProps {
  quiz: Quiz;
  index: number;
  showAnswers?: boolean;
}

const questionTypeConfig = {
  identification: { label: 'Identification', icon: '🎯', color: 'from-pink-500 to-rose-500' },
  multiple_choice: { label: 'Multiple Choice', icon: '✓', color: 'from-blue-500 to-cyan-500' },
  true_false: { label: 'Modified True/False', icon: '⚖️', color: 'from-purple-500 to-indigo-500' },
  fill_blank: { label: 'Fill in the Blank', icon: '📝', color: 'from-green-500 to-emerald-500' },
  matching: { label: 'Matching', icon: '🔗', color: 'from-orange-500 to-amber-500' },
  enumeration: { label: 'Enumeration', icon: '📋', color: 'from-violet-500 to-purple-500' },
};

export function QuizPreviewCard({ quiz, index, showAnswers = true }: QuizPreviewCardProps) {
  const config = questionTypeConfig[quiz.type];
  
  const renderQuestionContent = () => {
    switch (quiz.type) {
      case 'identification':
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border-2 border-pink-100">
              <p className="text-gray-800">{quiz.question}</p>
            </div>
            {showAnswers && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs font-semibold text-green-800 mb-1">Answer:</p>
                <p className="text-green-900">{quiz.correct_answer as string}</p>
              </div>
            )}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border-2 border-blue-100">
              <p className="text-gray-800 mb-3">{quiz.question}</p>
              <div className="space-y-2">
                {quiz.options?.map((option, i) => {
                  const isCorrect = option === quiz.correct_answer;
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border-2 ${
                        showAnswers && isCorrect
                          ? 'bg-green-50 border-green-400'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                      <span className={showAnswers && isCorrect ? 'text-green-800 font-medium' : ''}>
                        {option}
                      </span>
                      {showAnswers && isCorrect && (
                        <Badge className="ml-2 bg-green-600 text-white text-xs">✓ Correct</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'true_false':
        const isTrue = quiz.correct_answer === 'True';
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border-2 border-purple-100">
              <p className="text-gray-800">
                {quiz.question.split(quiz.underlinedText || '').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="bg-yellow-200 px-1 rounded font-medium">
                        {quiz.underlinedText}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
            {showAnswers && (
              <div className={`rounded-lg p-3 border ${
                isTrue ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${
                  isTrue ? 'text-green-800' : 'text-red-800'
                }`}>
                  Answer: {quiz.correct_answer as string}
                </p>
                {!isTrue && quiz.correctReplacement && (
                  <p className="text-sm text-red-900">
                    Correction: <span className="font-medium">{quiz.correctReplacement}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 'fill_blank':
        // Replace [BLANK1], [BLANK2], etc. with visual blanks (always show as _____)
        const renderWithBlanks = () => {
          let questionText = quiz.question;
          const blankMatches = questionText.match(/\[BLANK\d+\]/g) || [];
          
          const parts = questionText.split(/(\[BLANK\d+\])/);
          let blankIndex = 0;
          
          return (
            <p className="text-gray-800">
              {parts.map((part, i) => {
                if (part.match(/\[BLANK\d+\]/)) {
                  blankIndex++;
                  // Always show blanks as _____ in preview
                  return (
                    <span
                      key={i}
                      className="inline-block mx-1 px-3 py-1 rounded bg-gray-200 border-2 border-gray-300 font-mono"
                      style={{ minWidth: '80px', textAlign: 'center' }}
                    >
                      _______
                    </span>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
            </p>
          );
        };

        return (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border-2 border-green-100">
              {renderWithBlanks()}
            </div>
            {showAnswers && quiz.fill_blank_answers && quiz.fill_blank_answers.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs font-semibold text-green-800 mb-1">Answers:</p>
                <div className="flex flex-wrap gap-2">
                  {quiz.fill_blank_answers.map((answer, i) => (
                    <Badge key={i} className="bg-green-600 text-white">
                      {i + 1}. {answer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border-2 border-orange-100">
              <p className="text-gray-800 mb-4">{quiz.question}</p>
              <div className="space-y-3">
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs font-semibold text-orange-800 mb-2">Pairs to Match:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {quiz.pairs?.map((pair, i) => (
                      <div key={i} className="p-3 bg-white rounded border border-orange-200 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <Badge className="bg-orange-500 text-white text-xs px-2 py-1 whitespace-normal break-words text-left w-fit">
                            {i + 1}. {pair.left}
                          </Badge>
                          <span className="hidden sm:inline text-orange-400 flex-shrink-0">→</span>
                          <span className="text-sm text-gray-700 break-words">
                            {pair.right}
                          </span>
                        </div>
                        {showAnswers && (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-semibold pt-1 border-t border-orange-100">
                            <span>Matched</span>
                            <span>✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {showAnswers && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-2">Correct Matches:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {quiz.pairs?.map((pair, i) => (
                        <div key={i} className="text-sm text-green-900 break-words">
                          <span className="font-semibold break-words">{pair.left}</span> ↔ <span className="break-words">{pair.right}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'enumeration':
        const answers = Array.isArray(quiz.correct_answer) ? quiz.correct_answer : [quiz.correct_answer];
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border-2 border-violet-100">
              <p className="text-gray-800">{quiz.question}</p>
            </div>
            {showAnswers && (
              <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                <p className="text-xs font-semibold text-violet-800 mb-2">Answers:</p>
                <ol className="list-decimal list-inside space-y-1">
                  {answers.map((answer, i) => (
                    <li key={i} className="text-violet-900">{answer}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg p-4 border-2 border-gray-100">
            <p className="text-gray-800">{quiz.question}</p>
          </div>
        );
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-gray-200 hover:border-pink-300 transition-colors">
      <div className={`bg-gradient-to-r ${config.color} p-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="text-white font-semibold">Question {index + 1}</p>
            <p className="text-white/90 text-xs">{config.label}</p>
          </div>
        </div>
        <Badge className="bg-white/20 text-white border-white/30">
          Q{index + 1}
        </Badge>
      </div>
      <CardContent className="p-4">
        {renderQuestionContent()}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-1">Explanation:</p>
          <p className="text-sm text-gray-600">{quiz.explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}