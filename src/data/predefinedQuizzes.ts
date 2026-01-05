import { OfflineQuiz } from './offlineQuizzes';

export const predefinedQuizzes: OfflineQuiz[] = [
  // Multiple Choice Quiz
  {
    id: 'predefined_mc_1',
    type: 'multiple_choice',
    question: 'What is the largest planet in our solar system?',
    options: ['Earth', 'Jupiter', 'Saturn', 'Neptune'],
    correct_answer: 'Jupiter',
    explanation: 'Jupiter is the largest planet in our solar system, with a mass greater than all other planets combined.',
    difficulty: 'medium',
    subject: 'Astronomy'
  },
  
  // Modified True/False Quiz
  {
    id: 'predefined_tf_1',
    type: 'true_false',
    question: 'The Great Wall of China is [UNDERLINE]visible[/UNDERLINE] from space with the naked eye.',
    options: ['True', 'False'],
    correct_answer: 'False',
    explanation: 'This is a common myth. The Great Wall of China is not visible from space with the naked eye. This misconception has been debunked by astronauts.',
    difficulty: 'medium',
    subject: 'Geography',
    underlinedText: 'visible',
    correctReplacement: 'not visible'
  },
  
  // Fill in the Blank Quiz
  {
    id: 'predefined_fb_1',
    type: 'fill_blank',
    question: 'The process by which plants convert carbon dioxide and water into glucose using sunlight is called ___.',
    correct_answer: 'photosynthesis',
    explanation: 'Photosynthesis is the biological process where plants use chlorophyll to capture sunlight energy and convert CO₂ and H₂O into glucose and oxygen.',
    difficulty: 'easy',
    subject: 'Biology'
  },
  
  // Matching Quiz
  {
    id: 'predefined_match_1',
    type: 'matching',
    question: 'Match the programming languages with their primary use cases:',
    pairs: [
      { left: 'Python', right: 'Data Science & AI' },
      { left: 'JavaScript', right: 'Web Development' },
      { left: 'SQL', right: 'Database Management' },
      { left: 'Swift', right: 'iOS Development' }
    ],
    correct_answer: ['Python:Data Science & AI', 'JavaScript:Web Development', 'SQL:Database Management', 'Swift:iOS Development'],
    explanation: 'Each programming language has evolved to excel in specific domains: Python for data science and AI, JavaScript for web development, SQL for databases, and Swift for iOS apps.',
    difficulty: 'medium',
    subject: 'Computer Science'
  },
  
  // Enumeration Quiz
  {
    id: 'predefined_enum_1',
    type: 'enumeration',
    question: 'List the four fundamental forces of nature in physics.',
    correct_answer: ['gravitational force', 'electromagnetic force', 'strong nuclear force', 'weak nuclear force'],
    explanation: 'The four fundamental forces are: gravitational force (attracts masses), electromagnetic force (between charged particles), strong nuclear force (holds atomic nuclei together), and weak nuclear force (responsible for radioactive decay).',
    difficulty: 'hard',
    subject: 'Physics'
  },
  
  // Identification Quiz
  {
    id: 'predefined_id_1',
    type: 'identification',
    question: 'What literary device is being used in this sentence: "The wind whispered through the trees"?',
    correct_answer: 'personification',
    explanation: 'Personification is a literary device where human characteristics are given to non-human things. In this case, the wind is given the human ability to whisper.',
    difficulty: 'medium',
    subject: 'Literature'
  }
];

export const getQuizByType = (type: OfflineQuiz['type']): OfflineQuiz | undefined => {
  return predefinedQuizzes.find(quiz => quiz.type === type);
};

export const getAllPredefinedQuizzes = (): OfflineQuiz[] => {
  return predefinedQuizzes;
};

export const getQuizzesBySubject = (subject: string): OfflineQuiz[] => {
  return predefinedQuizzes.filter(quiz => 
    quiz.subject.toLowerCase().includes(subject.toLowerCase())
  );
};