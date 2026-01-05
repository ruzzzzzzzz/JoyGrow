/**
 * OpenAI Quiz Generation Service for JoyGrow
 * ENHANCED: Ensures exact question count with context enrichment
 */

import OpenAI from 'openai';

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

interface OpenAIQuizConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

class OpenAIQuizService {
  private openai: OpenAI;
  private config: OpenAIQuizConfig;

  constructor(config: OpenAIQuizConfig) {
    this.config = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateQuizzes(
    material: string,
    questionTypes: string[],
    questionCount: number
  ): Promise<Quiz[]> {
    try {
      console.log('🤖 Generating quizzes with OpenAI...');
      console.log(`📄 Material length: ${material.length} characters`);
      console.log(`📊 Types: ${questionTypes.join(', ')}`);
      console.log(`🔢 Requested: ${questionCount} questions`);

      const quizzes: Quiz[] = [];
      const batchSize = 10;
      const maxAttempts = 5; // Maximum regeneration attempts
      
      // Generate in batches with retry logic
      for (let attempt = 0; attempt < maxAttempts && quizzes.length < questionCount; attempt++) {
        const remainingCount = questionCount - quizzes.length;
        console.log(`🔄 Attempt ${attempt + 1}: Need ${remainingCount} more questions`);
        
        for (let i = 0; i < remainingCount; i += batchSize) {
          const currentBatchSize = Math.min(batchSize, remainingCount - i);
          const startIndex = quizzes.length;
          
          // Cycle through question types
          const batchTypes: string[] = [];
          for (let j = 0; j < currentBatchSize; j++) {
            batchTypes.push(questionTypes[(startIndex + j) % questionTypes.length]);
          }

          const batchQuizzes = await this.generateQuizBatch(
            material,
            batchTypes,
            currentBatchSize,
            startIndex,
            quizzes // Pass existing quizzes to avoid duplicates
          );

          quizzes.push(...batchQuizzes);
          console.log(`✅ Progress: ${quizzes.length}/${questionCount} questions`);
          
          // Stop if we have enough
          if (quizzes.length >= questionCount) {
            break;
          }
        }
      }

      // Final check and trim to exact count
      if (quizzes.length > questionCount) {
        console.log(`✂️ Trimming from ${quizzes.length} to ${questionCount} questions`);
        return quizzes.slice(0, questionCount);
      }

      if (quizzes.length < questionCount) {
        console.warn(`⚠️ Only generated ${quizzes.length} of ${questionCount} requested questions`);
      }

      console.log('🎉 Quiz generation complete!');
      return quizzes;
    } catch (error) {
      console.error('❌ OpenAI quiz generation error:', error);
      throw new Error(`Failed to generate quizzes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateQuizBatch(
    material: string,
    questionTypes: string[],
    count: number,
    startIndex: number,
    existingQuizzes: Quiz[] = []
  ): Promise<Quiz[]> {
    const prompt = this.buildPrompt(material, questionTypes, count, startIndex, existingQuizzes);

    const response = await this.openai.chat.completions.create({
      model: this.config.model!,
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    const quizzes = parsed.quizzes || [];

    return quizzes.map((quiz: Quiz, idx: number) => ({
      ...quiz,
      id: `openai_quiz_${startIndex + idx}_${Date.now()}`,
    }));
  }

  private buildPrompt(
    material: string,
    questionTypes: string[],
    count: number,
    startIndex: number,
    existingQuizzes: Quiz[]
  ): string {
    const typeInstructions = this.getTypeInstructions(questionTypes, startIndex);
    
    const truncatedMaterial = material.length > 4000
      ? material.substring(0, 4000) + '...\n[Material truncated for processing]'
      : material;

    // Build list of existing questions to avoid duplicates
    const existingQuestionsText = existingQuizzes.length > 0
      ? `\n\n📝 EXISTING QUESTIONS (DO NOT DUPLICATE):\n${existingQuizzes.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}`
      : '';

    return `Generate EXACTLY ${count} unique quiz questions based on this study material.

STUDY MATERIAL:

${truncatedMaterial}

🎯 CRITICAL REQUIREMENTS:

1. ✅ MUST generate EXACTLY ${count} questions - no more, no less
2. ✅ ALL questions must be UNIQUE and NOT duplicate any existing questions${existingQuestionsText ? ' (see list below)' : ''}
3. ✅ Questions must be based on the study material content
4. ✅ If the study material lacks detail, you may ADD RELATED CONTEXT:
   - Add background information about concepts mentioned
   - Include related facts, definitions, or examples
   - Expand on topics with standard educational content
   - IMPORTANT: All additions must be directly related to the material's subject matter
   
5. ✅ Example of context enrichment:
   - Material mentions "photosynthesis" → You can add: "Photosynthesis is the process where plants convert light energy into chemical energy using chlorophyll..."
   - Material mentions "World War II" → You can add: "World War II (1939-1945) was a global conflict involving..."
   
6. ❌ NEVER create questions about:
   - PDF versions, formats, or specifications
   - File encoding or technical metadata
   - Software names or document processing
   - "The process where a digital document is converted..."

7. ✅ UNIQUENESS RULES:
   - Each question must test a DIFFERENT concept or aspect
   - Vary question difficulty and complexity
   - Cover different sections of the material
   - Use different phrasing and approaches
   - NO repetitive or similar questions

8. ✅ If material is limited:
   - Research and add standard educational content related to the topic
   - Expand definitions and explanations
   - Add examples and applications
   - Include related subtopics
   ${existingQuestionsText}

QUESTION TYPES TO GENERATE:

${typeInstructions}

⚠️ VALIDATION BEFORE RETURNING:
- Count your questions: Must be EXACTLY ${count}
- Check uniqueness: No duplicates or similar questions
- Verify quality: Each question is clear and educational
- Confirm relevance: All questions relate to the material's subject

Return ONLY valid JSON in this exact format (no additional text):

{
  "quizzes": [
    // Array of EXACTLY ${count} quiz objects following the type-specific formats above
  ]
}`;
  }

  private getSystemPrompt(): string {
    return `You are an expert educational content creator for JoyGrow, a quiz learning platform.

🎯 PRIMARY MISSION:
Generate EXACTLY the requested number of UNIQUE quiz questions based on study material.

✅ CONTENT ENRICHMENT GUIDELINES:
- When study material is brief or lacks detail, ADD RELATED EDUCATIONAL CONTENT
- Research standard facts, definitions, and concepts related to the topic
- Expand on mentioned concepts with proper context
- Add background information that enhances understanding
- All additions must be relevant and educational

❌ ABSOLUTE PROHIBITIONS - NEVER CREATE QUESTIONS ABOUT:
- File formats (PDF, DOCX, etc.)
- Software names (Adobe, Microsoft, etc.)
- Document processing or technical operations
- File metadata or properties

✅ UNIQUENESS REQUIREMENTS:
- Every question must be distinct and test different knowledge
- Vary difficulty levels (easy, medium, hard)
- Cover different aspects and concepts
- Use diverse question structures
- NO duplicate or near-duplicate questions

🔢 QUANTITY GUARANTEE:
- You MUST return EXACTLY the requested number of questions
- If you generate fewer than requested, you have FAILED
- Count your questions before returning the JSON
- Quality AND quantity are both required

Your role is to generate high-quality, pedagogically sound quiz questions that:
- Test genuine understanding
- Are strictly accurate and educational
- Follow EXACT formatting rules for each question type
- Are completely unique from each other
- Number exactly as requested

FORMATTING RULES BY TYPE:
- IDENTIFICATION: Plain question, short answer (1-3 words)
- FILL IN THE BLANK: Use _____ (exactly 5 underscores) for blanks
- TRUE/FALSE: Plain statement with NO underscores, NO brackets, NO tags
- MATCHING: Pairs with numbered labels (left) and plain text (right)
- ENUMERATION: List items as array
- MULTIPLE CHOICE: 4 options

Always return valid JSON that matches the requested quiz format exactly.`;
  }

  private getTypeInstructions(types: string[], startIndex: number): string {
    const instructions: string[] = [];

    types.forEach((type, idx) => {
      const questionIndex = startIndex + idx;

      switch (type) {
        case 'identification':
          const useStatementFormat = questionIndex % 2 === 0;
          instructions.push(`
${idx + 1}. IDENTIFICATION (${useStatementFormat ? 'Statement Format' : 'Question Format'})
Format:
{
  "type": "identification",
  "question": "${useStatementFormat ? 'A clear definition that identifies a term' : 'What is the term for [description]?'}",
  "correct_answer": "Term",
  "explanation": "Why this term is correct"
}

Rules:
- Answer is ONLY the key term (1-3 words maximum)
- No underscores, no brackets, no tags

Example:
{
  "type": "identification",
  "question": "A transformation that changes the position of an object along coordinate axes",
  "correct_answer": "Translation",
  "explanation": "Translation moves objects from one position to another."
}`);
          break;

        case 'fill_blank':
          instructions.push(`
${idx + 1}. FILL IN THE BLANK
Format:
{
  "type": "fill_blank",
  "question": "Sentence with _____ for each blank (EXACTLY 5 underscores)",
  "fill_blank_answers": ["answer1", "answer2"],
  "correct_answer": ["answer1", "answer2"],
  "explanation": "Why these are correct"
}

CRITICAL RULES:
- Use _____ (EXACTLY 5 underscores) for EACH blank
- Each blank separated by at least one word
- Arrays must match number of blanks
- NO brackets like [BLANK1], NO tags`);
          break;

        case 'true_false':
          instructions.push(`
${idx + 1}. MODIFIED TRUE/FALSE
Format:
{
  "type": "true_false",
  "question": "Complete statement in plain text (NO underscores, NO brackets, NO tags)",
  "correct_answer": "True" or "False",
  "underlinedText": "word",
  "correctReplacement": "correctword",
  "explanation": "Why true/false"
}

CRITICAL RULES:
- Question is PLAIN TEXT statement
- NO underscores (_____), NO brackets ([BLANK]), NO tags
- underlinedText: ONE word that will be highlighted
- If True: correctReplacement = underlinedText (same word)
- If False: correctReplacement = the correct replacement word`);
          break;

        case 'matching':
          instructions.push(`
${idx + 1}. MATCHING
Format:
{
  "type": "matching",
  "question": "Match the items based on...",
  "pairs": [
    {"left": "1. Term 1", "right": "Definition for Term 1"},
    {"left": "2. Term 2", "right": "Definition for Term 2"},
    {"left": "3. Term 3", "right": "Definition for Term 3"},
    {"left": "4. Term 4", "right": "Definition for Term 4"}
  ],
  "correct_answer": ["1:1", "2:2", "3:3", "4:4"],
  "explanation": "How these pairs match"
}

Rules:
- At least 4 pairs
- Left: Use "1. ", "2. ", "3. ", "4. " format with the TERM
- Right: Plain text definition WITHOUT any prefix`);
          break;

        case 'enumeration':
          instructions.push(`
${idx + 1}. ENUMERATION
Format:
{
  "type": "enumeration",
  "question": "List the [NUMBER] types/items of [concept]:",
  "correct_answer": ["Item 1", "Item 2", "Item 3"],
  "explanation": "Why these are correct"
}

Rules:
- Question must specify exact number
- Array length must match number in question
- Items should be 1-3 words each`);
          break;

        case 'multiple_choice':
          instructions.push(`
${idx + 1}. MULTIPLE CHOICE
Format:
{
  "type": "multiple_choice",
  "question": "Clear question about concept?",
  "options": ["Correct answer", "Wrong 1", "Wrong 2", "Wrong 3"],
  "correct_answer": "Correct answer",
  "explanation": "Why this is correct"
}

Rules:
- Exactly 4 options
- First option should be correct
- Wrong options must be plausible`);
          break;
      }
    });

    return instructions.join('\n\n');
  }

  validateQuiz(quiz: Quiz): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!quiz.type) errors.push('Missing quiz type');
    if (!quiz.question) errors.push('Missing question');
    if (!quiz.correct_answer) errors.push('Missing correct answer');
    if (!quiz.explanation) errors.push('Missing explanation');

    switch (quiz.type) {
      case 'multiple_choice':
        if (!quiz.options || quiz.options.length < 4) {
          errors.push('Multiple choice needs 4 options');
        }
        if (!quiz.options?.includes(quiz.correct_answer as string)) {
          errors.push('Correct answer not in options');
        }
        break;

      case 'fill_blank':
        const blankCount = (quiz.question.match(/_____/g) || []).length;
        if (blankCount === 0) {
          errors.push('Fill blank question missing _____ markers');
        }
        if (!quiz.fill_blank_answers || quiz.fill_blank_answers.length !== blankCount) {
          errors.push(`Fill blank needs ${blankCount} answers, got ${quiz.fill_blank_answers?.length || 0}`);
        }
        if (quiz.question.includes('[BLANK')) {
          errors.push('Fill blank should use _____ not [BLANK]');
        }
        break;

      case 'true_false':
        if (!quiz.underlinedText) {
          errors.push('True/false missing underlinedText');
        }
        if (!quiz.correctReplacement) {
          errors.push('True/false missing correctReplacement');
        }
        if (quiz.question.includes('_____')) {
          errors.push('True/false should NOT have underscores in question');
        }
        if (quiz.question.includes('[BLANK')) {
          errors.push('True/false should NOT have [BLANK] in question');
        }
        break;

      case 'matching':
        if (!quiz.pairs || quiz.pairs.length < 2) {
          errors.push('Matching needs at least 2 pairs');
        }
        break;

      case 'enumeration':
        if (!Array.isArray(quiz.correct_answer) || quiz.correct_answer.length < 2) {
          errors.push('Enumeration needs at least 2 items');
        }
        break;

      case 'identification':
        if (typeof quiz.correct_answer !== 'string') {
          errors.push('Identification answer must be a string');
        }
        if (typeof quiz.correct_answer === 'string' && quiz.correct_answer.length > 50) {
          errors.push('Identification answer too long (should be a term)');
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }
}

let openAIQuizService: OpenAIQuizService | null = null;

export function initializeOpenAIQuizService(apiKey: string): OpenAIQuizService {
  openAIQuizService = new OpenAIQuizService({ apiKey });
  return openAIQuizService;
}

export function getOpenAIQuizService(): OpenAIQuizService {
  if (!openAIQuizService) {
    throw new Error('OpenAI Quiz Service not initialized. Call initializeOpenAIQuizService first.');
  }
  return openAIQuizService;
}

export default OpenAIQuizService;