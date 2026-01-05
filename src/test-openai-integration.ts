/**
 * Test script for OpenAI Quiz Generation
 * Run this to verify your integration works
 */

import { generateQuizzesWithAI } from './api/quiz-ai-service';

// Sample study material for testing
const testMaterial = `
Photosynthesis is the process by which green plants convert light energy into chemical energy.
This occurs in the chloroplasts of plant cells, where chlorophyll captures sunlight.
The overall equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2.

There are two main stages of photosynthesis:
1. Light-dependent reactions occur in the thylakoid membranes
2. Light-independent reactions (Calvin cycle) occur in the stroma

The products of photosynthesis include glucose and oxygen.
Plants use glucose for energy and growth, while oxygen is released as a byproduct.
`;

/**
 * Test function
 */
async function testOpenAIIntegration() {
  console.log('🧪 Testing OpenAI Quiz Generation...\n');

  try {
    // Test 1: Generate mixed-type quizzes
    console.log('📝 Test 1: Generating 3 mixed-type quizzes...');
    const mixedQuizzes = await generateQuizzesWithAI(testMaterial, 'mixed', 3);
    console.log('✅ Generated:', mixedQuizzes.length, 'quizzes');
    console.log('Types:', mixedQuizzes.map(q => q.type).join(', '));
    console.log('\n');

    // Test 2: Generate specific type
    console.log('📝 Test 2: Generating 2 identification quizzes...');
    const idQuizzes = await generateQuizzesWithAI(testMaterial, 'identification', 2);
    console.log('✅ Generated:', idQuizzes.length, 'identification quizzes');
    console.log('Questions:', idQuizzes.map(q => q.question.substring(0, 50) + '...'));
    console.log('\n');

    // Test 3: Generate multiple types
    console.log('📝 Test 3: Generating specific types...');
    const specificQuizzes = await generateQuizzesWithAI(
      testMaterial,
      ['fill_blank', 'true_false', 'multiple_choice'],
      3
    );
    console.log('✅ Generated:', specificQuizzes.length, 'specific-type quizzes');
    console.log('Types:', specificQuizzes.map(q => q.type).join(', '));
    console.log('\n');

    // Display a sample quiz
    if (mixedQuizzes.length > 0) {
      console.log('📋 Sample Quiz:');
      console.log('─────────────────────────────────────');
      const sample = mixedQuizzes[0];
      console.log('Type:', sample.type);
      console.log('Question:', sample.question);
      console.log('Answer:', sample.correct_answer);
      console.log('Explanation:', sample.explanation);
      console.log('─────────────────────────────────────\n');
    }

    console.log('🎉 All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    } else {
      console.error('Error details:', String(error));
    }

    return false;
  }
}

// Run tests
testOpenAIIntegration().then(success => {
  if (success) {
    console.log('\n✅ OpenAI integration is working correctly!');
    console.log('💡 You can now use generateQuizzesWithAI() in your components');
  } else {
    console.log('\n❌ OpenAI integration has issues');
    console.log('💡 Check your API key and internet connection');
  }
});

export default testOpenAIIntegration;
