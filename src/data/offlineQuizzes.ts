export interface OfflineQuiz {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'enumeration' | 'identification';
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  pairs?: { left: string; right: string }[];
  // For Modified True/False questions
  underlinedText?: string; // The word/phrase that is underlined (what's incorrect if False)
  correctReplacement?: string; // What should replace the underlined text if False
}

export const offlineQuizDatabase: { [key: string]: OfflineQuiz[] } = {
  mathematics: [
    // Multiple Choice Questions
    {
      id: 'math_mc_1',
      type: 'multiple_choice',
      question: 'What is the result of 8 × 7?',
      options: ['54', '56', '58', '64'],
      correct_answer: '56',
      explanation: '8 multiplied by 7 equals 56.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_mc_2',
      type: 'multiple_choice',
      question: 'Which of the following numbers is a perfect square?',
      options: ['48', '64', '72', '80'],
      correct_answer: '64',
      explanation: '64 is a perfect square because 8 × 8 = 64.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_mc_3',
      type: 'multiple_choice',
      question: 'What is 25% of 200?',
      options: ['25', '40', '50', '75'],
      correct_answer: '50',
      explanation: '25% of 200 is calculated as (25/100) × 200 = 50.',
      difficulty: 'medium',
      subject: 'Mathematics'
    },
    {
      id: 'math_mc_4',
      type: 'multiple_choice',
      question: 'If a triangle has angles of 60°, 60°, and 60°, what type of triangle is it?',
      options: ['Scalene', 'Isosceles', 'Equilateral', 'Right'],
      correct_answer: 'Equilateral',
      explanation: 'A triangle with all angles equal to 60° is an equilateral triangle.',
      difficulty: 'medium',
      subject: 'Mathematics'
    },
    {
      id: 'math_mc_5',
      type: 'multiple_choice',
      question: 'What is the value of 3³ (3 cubed)?',
      options: ['6', '9', '18', '27'],
      correct_answer: '27',
      explanation: '3³ means 3 × 3 × 3 = 27.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_mc_6',
      type: 'multiple_choice',
      question: 'What is the least common multiple (LCM) of 4 and 6?',
      options: ['8', '10', '12', '24'],
      correct_answer: '12',
      explanation: 'The multiples of 4 are 4, 8, 12, 16... and the multiples of 6 are 6, 12, 18... The least common multiple is 12.',
      difficulty: 'hard',
      subject: 'Mathematics'
    },

    // Modified True/False Questions
    {
      id: 'math_tf_1',
      type: 'true_false',
      question: 'A square has [UNDERLINE]four[/UNDERLINE] equal sides.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'A square is defined as a quadrilateral with four equal sides and four right angles.',
      difficulty: 'easy',
      subject: 'Mathematics',
      underlinedText: 'four',
      correctReplacement: 'four'
    },
    {
      id: 'math_tf_2',
      type: 'true_false',
      question: 'The sum of angles in a triangle is [UNDERLINE]360[/UNDERLINE] degrees.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'The sum of angles in a triangle is 180 degrees, not 360.',
      difficulty: 'easy',
      subject: 'Mathematics',
      underlinedText: '360',
      correctReplacement: '180'
    },
    {
      id: 'math_tf_3',
      type: 'true_false',
      question: 'Zero is a [UNDERLINE]negative[/UNDERLINE] number.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'Zero is neither positive nor negative; it is neutral.',
      difficulty: 'easy',
      subject: 'Mathematics',
      underlinedText: 'negative',
      correctReplacement: 'neutral'
    },
    {
      id: 'math_tf_4',
      type: 'true_false',
      question: 'The number 1 is a [UNDERLINE]prime[/UNDERLINE] number.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'By mathematical definition, 1 is not considered a prime number. Prime numbers must have exactly two distinct factors.',
      difficulty: 'medium',
      subject: 'Mathematics',
      underlinedText: 'prime',
      correctReplacement: 'composite'
    },
    {
      id: 'math_tf_5',
      type: 'true_false',
      question: 'The diameter of a circle is [UNDERLINE]twice[/UNDERLINE] the length of its radius.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'The diameter is exactly twice the radius (d = 2r).',
      difficulty: 'easy',
      subject: 'Mathematics',
      underlinedText: 'twice',
      correctReplacement: 'twice'
    },
    {
      id: 'math_tf_6',
      type: 'true_false',
      question: 'Division by [UNDERLINE]zero[/UNDERLINE] is undefined in mathematics.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'Division by zero is undefined because it has no meaningful result.',
      difficulty: 'medium',
      subject: 'Mathematics',
      underlinedText: 'zero',
      correctReplacement: 'zero'
    },

    // Fill in the Blank Questions
    {
      id: 'math_fb_1',
      type: 'fill_blank',
      question: 'The number _____ is the smallest prime number.',
      correct_answer: '2',
      explanation: '2 is the smallest prime number and the only even prime number.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_fb_2',
      type: 'fill_blank',
      question: 'In a right triangle, the longest side opposite the right angle is called the _____.',
      correct_answer: 'hypotenuse',
      explanation: 'The hypotenuse is the longest side of a right triangle, opposite the 90-degree angle.',
      difficulty: 'medium',
      subject: 'Mathematics'
    },
    {
      id: 'math_fb_3',
      type: 'fill_blank',
      question: 'The perimeter of a rectangle is calculated as 2 × (length + _____).',
      correct_answer: 'width',
      explanation: 'The perimeter formula for a rectangle is P = 2(l + w), where w is the width.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_fb_4',
      type: 'fill_blank',
      question: 'A polygon with five sides is called a _____.',
      correct_answer: 'pentagon',
      explanation: 'A pentagon is a five-sided polygon.',
      difficulty: 'medium',
      subject: 'Mathematics'
    },
    {
      id: 'math_fb_5',
      type: 'fill_blank',
      question: 'The result of _____ divided by any non-zero number is always zero.',
      correct_answer: '0',
      explanation: 'Zero divided by any non-zero number equals zero (0 ÷ n = 0).',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_fb_6',
      type: 'fill_blank',
      question: 'In the fraction 3/4, the number 4 is called the _____.',
      correct_answer: 'denominator',
      explanation: 'In a fraction, the bottom number is called the denominator.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },

    // Matching Questions
    {
      id: 'math_match_1',
      type: 'matching',
      question: 'Match each geometric shape with its number of sides:',
      pairs: [
        { left: 'Triangle', right: '3' },
        { left: 'Square', right: '4' },
        { left: 'Pentagon', right: '5' },
        { left: 'Hexagon', right: '6' }
      ],
      correct_answer: ['Triangle:3', 'Square:4', 'Pentagon:5', 'Hexagon:6'],
      explanation: 'Triangles have 3 sides, squares have 4, pentagons have 5, and hexagons have 6.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_match_2',
      type: 'matching',
      question: 'Match each term with its mathematical meaning:',
      pairs: [
        { left: 'Sum', right: 'Result of addition' },
        { left: 'Product', right: 'Result of multiplication' },
        { left: 'Quotient', right: 'Result of division' },
        { left: 'Difference', right: 'Result of subtraction' }
      ],
      correct_answer: ['Sum:Result of addition', 'Product:Result of multiplication', 'Quotient:Result of division', 'Difference:Result of subtraction'],
      explanation: 'Each arithmetic operation has a specific name for its result.',
      difficulty: 'medium',
      subject: 'Mathematics'
    },
    {
      id: 'math_match_3',
      type: 'matching',
      question: 'Match each angle type with its degree measure:',
      pairs: [
        { left: 'Acute angle', right: 'Less than 90°' },
        { left: 'Right angle', right: 'Exactly 90°' },
        { left: 'Obtuse angle', right: 'Between 90° and 180°' },
        { left: 'Straight angle', right: 'Exactly 180°' }
      ],
      correct_answer: ['Acute angle:Less than 90°', 'Right angle:Exactly 90°', 'Obtuse angle:Between 90° and 180°', 'Straight angle:Exactly 180°'],
      explanation: 'Angles are classified by their degree measurements.',
      difficulty: 'medium',
      subject: 'Mathematics'
    },

    // Enumeration Questions
    {
      id: 'math_enum_1',
      type: 'enumeration',
      question: 'List the first 4 even numbers greater than zero.',
      correct_answer: ['2', '4', '6', '8'],
      explanation: 'The first four positive even numbers are 2, 4, 6, and 8.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_enum_2',
      type: 'enumeration',
      question: 'Name 3 types of triangles classified by their sides.',
      correct_answer: ['equilateral', 'isosceles', 'scalene'],
      explanation: 'Triangles are classified as equilateral (all sides equal), isosceles (two sides equal), or scalene (no sides equal).',
      difficulty: 'medium',
      subject: 'Mathematics'
    },
    {
      id: 'math_enum_3',
      type: 'enumeration',
      question: 'List 4 basic arithmetic operations.',
      correct_answer: ['addition', 'subtraction', 'multiplication', 'division'],
      explanation: 'The four basic arithmetic operations are addition, subtraction, multiplication, and division.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },

    // Identification Questions
    {
      id: 'math_id_1',
      type: 'identification',
      question: 'What do you call a number that can only be divided by 1 and itself?',
      correct_answer: 'prime',
      explanation: 'A prime number has exactly two factors: 1 and itself.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_id_2',
      type: 'identification',
      question: 'What is the name of a four-sided polygon?',
      correct_answer: 'quadrilateral',
      explanation: 'A quadrilateral is any polygon with four sides.',
      difficulty: 'easy',
      subject: 'Mathematics'
    },
    {
      id: 'math_id_3',
      type: 'identification',
      question: 'What mathematical constant represents the ratio of a circle\'s circumference to its diameter?',
      correct_answer: 'pi',
      explanation: 'Pi (π) is approximately 3.14159 and represents the ratio of circumference to diameter.',
      difficulty: 'medium',
      subject: 'Mathematics'
    },
    {
      id: 'math_id_4',
      type: 'identification',
      question: 'What term describes the point where two lines meet?',
      correct_answer: 'vertex',
      explanation: 'A vertex (plural: vertices) is the point where two or more lines intersect.',
      difficulty: 'medium',
      subject: 'Mathematics'
    }
  ],

  science: [
    // Multiple Choice Questions
    {
      id: 'sci_mc_1',
      type: 'multiple_choice',
      question: 'What is the center of an atom called?',
      options: ['Electron', 'Nucleus', 'Proton', 'Neutron'],
      correct_answer: 'Nucleus',
      explanation: 'The nucleus is the central core of an atom, containing protons and neutrons.',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_mc_2',
      type: 'multiple_choice',
      question: 'Which gas do plants absorb from the atmosphere during photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
      correct_answer: 'Carbon dioxide',
      explanation: 'Plants absorb carbon dioxide (CO₂) and release oxygen during photosynthesis.',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_mc_3',
      type: 'multiple_choice',
      question: 'What is the largest organ in the human body?',
      options: ['Heart', 'Brain', 'Liver', 'Skin'],
      correct_answer: 'Skin',
      explanation: 'The skin is the largest organ, covering the entire body and protecting internal structures.',
      difficulty: 'medium',
      subject: 'Science'
    },
    {
      id: 'sci_mc_4',
      type: 'multiple_choice',
      question: 'Which planet is closest to the Sun?',
      options: ['Venus', 'Earth', 'Mercury', 'Mars'],
      correct_answer: 'Mercury',
      explanation: 'Mercury is the closest planet to the Sun in our solar system.',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_mc_5',
      type: 'multiple_choice',
      question: 'What type of energy is stored in food?',
      options: ['Kinetic', 'Chemical', 'Thermal', 'Electrical'],
      correct_answer: 'Chemical',
      explanation: 'Food contains chemical energy that is released during digestion.',
      difficulty: 'medium',
      subject: 'Science'
    },
    {
      id: 'sci_mc_6',
      type: 'multiple_choice',
      question: 'What is the pH value of pure water?',
      options: ['5', '7', '9', '14'],
      correct_answer: '7',
      explanation: 'Pure water has a neutral pH of 7.',
      difficulty: 'hard',
      subject: 'Science'
    },

    // Modified True/False Questions
    {
      id: 'sci_tf_1',
      type: 'true_false',
      question: 'The Earth revolves around the [UNDERLINE]Sun[/UNDERLINE].',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'The Earth orbits (revolves) around the Sun, taking approximately 365.25 days to complete one revolution.',
      difficulty: 'easy',
      subject: 'Science',
      underlinedText: 'Sun',
      correctReplacement: 'Sun'
    },
    {
      id: 'sci_tf_2',
      type: 'true_false',
      question: 'Water boils at [UNDERLINE]90[/UNDERLINE] degrees Celsius at sea level.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'Water boils at 100 degrees Celsius at sea level, not 90.',
      difficulty: 'easy',
      subject: 'Science',
      underlinedText: '90',
      correctReplacement: '100'
    },
    {
      id: 'sci_tf_3',
      type: 'true_false',
      question: 'Humans have [UNDERLINE]five[/UNDERLINE] basic senses.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'The five basic senses are sight, hearing, smell, taste, and touch.',
      difficulty: 'easy',
      subject: 'Science',
      underlinedText: 'five',
      correctReplacement: 'five'
    },
    {
      id: 'sci_tf_4',
      type: 'true_false',
      question: 'The force of [UNDERLINE]magnetism[/UNDERLINE] pulls objects toward the center of Earth.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'Gravity, not magnetism, pulls objects toward Earth\'s center.',
      difficulty: 'medium',
      subject: 'Science',
      underlinedText: 'magnetism',
      correctReplacement: 'gravity'
    },
    {
      id: 'sci_tf_5',
      type: 'true_false',
      question: 'Sound travels [UNDERLINE]faster[/UNDERLINE] than light.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'Light travels much faster than sound. Light travels at about 300,000 km/s while sound travels at about 343 m/s in air.',
      difficulty: 'easy',
      subject: 'Science',
      underlinedText: 'faster',
      correctReplacement: 'slower'
    },
    {
      id: 'sci_tf_6',
      type: 'true_false',
      question: 'The human body has [UNDERLINE]206[/UNDERLINE] bones in an adult.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'An adult human body has 206 bones, though babies are born with about 270 bones that fuse as they grow.',
      difficulty: 'medium',
      subject: 'Science',
      underlinedText: '206',
      correctReplacement: '206'
    },

    // Fill in the Blank Questions
    {
      id: 'sci_fb_1',
      type: 'fill_blank',
      question: 'The process by which liquid water turns into water vapor is called _____.',
      correct_answer: 'evaporation',
      explanation: 'Evaporation is the process where liquid water changes to gas (water vapor) due to heat.',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_fb_2',
      type: 'fill_blank',
      question: 'Animals that eat only plants are called _____.',
      correct_answer: 'herbivores',
      explanation: 'Herbivores are animals that feed exclusively on plant material.',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_fb_3',
      type: 'fill_blank',
      question: 'The smallest unit of life is called a _____.',
      correct_answer: 'cell',
      explanation: 'The cell is the basic structural and functional unit of all living organisms.',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_fb_4',
      type: 'fill_blank',
      question: 'The layer of gases surrounding Earth is called the _____.',
      correct_answer: 'atmosphere',
      explanation: 'The atmosphere is the envelope of gases that surrounds our planet.',
      difficulty: 'medium',
      subject: 'Science'
    },
    {
      id: 'sci_fb_5',
      type: 'fill_blank',
      question: 'The circuit is _____ when electricity cannot flow through it.',
      correct_answer: 'open',
      explanation: 'An open circuit has a break in the path, preventing electricity from flowing.',
      difficulty: 'medium',
      subject: 'Science'
    },
    {
      id: 'sci_fb_6',
      type: 'fill_blank',
      question: 'The green pigment in plants that absorbs sunlight is called _____.',
      correct_answer: 'chlorophyll',
      explanation: 'Chlorophyll is the green pigment that enables photosynthesis by absorbing light energy.',
      difficulty: 'hard',
      subject: 'Science'
    },

    // Matching Questions
    {
      id: 'sci_match_1',
      type: 'matching',
      question: 'Match each state of matter with its properties:',
      pairs: [
        { left: 'Solid', right: 'Fixed shape and volume' },
        { left: 'Liquid', right: 'Fixed volume, takes container shape' },
        { left: 'Gas', right: 'No fixed shape or volume' },
        { left: 'Plasma', right: 'Ionized gas at high temperature' }
      ],
      correct_answer: ['Solid:Fixed shape and volume', 'Liquid:Fixed volume, takes container shape', 'Gas:No fixed shape or volume', 'Plasma:Ionized gas at high temperature'],
      explanation: 'Each state of matter has distinct properties based on particle arrangement and movement.',
      difficulty: 'medium',
      subject: 'Science'
    },
    {
      id: 'sci_match_2',
      type: 'matching',
      question: 'Match each scientist with their famous discovery:',
      pairs: [
        { left: 'Isaac Newton', right: 'Gravity' },
        { left: 'Albert Einstein', right: 'Theory of relativity' },
        { left: 'Marie Curie', right: 'Radioactivity' },
        { left: 'Charles Darwin', right: 'Evolution' }
      ],
      correct_answer: ['Isaac Newton:Gravity', 'Albert Einstein:Theory of relativity', 'Marie Curie:Radioactivity', 'Charles Darwin:Evolution'],
      explanation: 'These scientists made groundbreaking contributions to their fields.',
      difficulty: 'hard',
      subject: 'Science'
    },
    {
      id: 'sci_match_3',
      type: 'matching',
      question: 'Match each organ system with its primary function:',
      pairs: [
        { left: 'Circulatory', right: 'Transports blood' },
        { left: 'Respiratory', right: 'Exchanges gases' },
        { left: 'Digestive', right: 'Processes food' },
        { left: 'Nervous', right: 'Controls body functions' }
      ],
      correct_answer: ['Circulatory:Transports blood', 'Respiratory:Exchanges gases', 'Digestive:Processes food', 'Nervous:Controls body functions'],
      explanation: 'Each organ system has specialized functions to maintain life.',
      difficulty: 'medium',
      subject: 'Science'
    },

    // Enumeration Questions
    {
      id: 'sci_enum_1',
      type: 'enumeration',
      question: 'Name the 4 inner planets of our solar system (in order from the Sun).',
      correct_answer: ['Mercury', 'Venus', 'Earth', 'Mars'],
      explanation: 'The four inner planets, also called terrestrial planets, are Mercury, Venus, Earth, and Mars.',
      difficulty: 'medium',
      subject: 'Science'
    },
    {
      id: 'sci_enum_2',
      type: 'enumeration',
      question: 'List 3 renewable sources of energy.',
      correct_answer: ['solar', 'wind', 'hydro'],
      explanation: 'Renewable energy sources include solar, wind, hydro (water), geothermal, and biomass.',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_enum_3',
      type: 'enumeration',
      question: 'Name 3 types of rocks.',
      correct_answer: ['igneous', 'sedimentary', 'metamorphic'],
      explanation: 'The three main types of rocks are igneous (formed from cooled magma), sedimentary (formed from compressed sediments), and metamorphic (formed from transformed existing rocks).',
      difficulty: 'medium',
      subject: 'Science'
    },

    // Identification Questions
    {
      id: 'sci_id_1',
      type: 'identification',
      question: 'What do you call the path that planets follow around the Sun?',
      correct_answer: 'orbit',
      explanation: 'An orbit is the curved path that a celestial object follows around another object.',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_id_2',
      type: 'identification',
      question: 'What is the process by which plants make their own food using sunlight?',
      correct_answer: 'photosynthesis',
      explanation: 'Photosynthesis is the process where plants convert light energy into chemical energy (glucose).',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_id_3',
      type: 'identification',
      question: 'What instrument is used to measure temperature?',
      correct_answer: 'thermometer',
      explanation: 'A thermometer is a device used to measure temperature.',
      difficulty: 'easy',
      subject: 'Science'
    },
    {
      id: 'sci_id_4',
      type: 'identification',
      question: 'What type of animal lays eggs and has scales?',
      correct_answer: 'reptile',
      explanation: 'Reptiles are cold-blooded vertebrates that typically lay eggs and have scaly skin.',
      difficulty: 'medium',
      subject: 'Science'
    }
  ],

  history: [
    // Multiple Choice Questions
    {
      id: 'hist_mc_1',
      type: 'multiple_choice',
      question: 'Who was the first President of the United States?',
      options: ['Thomas Jefferson', 'George Washington', 'Benjamin Franklin', 'John Adams'],
      correct_answer: 'George Washington',
      explanation: 'George Washington served as the first President from 1789 to 1797.',
      difficulty: 'easy',
      subject: 'History'
    },
    {
      id: 'hist_mc_2',
      type: 'multiple_choice',
      question: 'In which year did Christopher Columbus reach the Americas?',
      options: ['1492', '1500', '1776', '1620'],
      correct_answer: '1492',
      explanation: 'Columbus reached the Americas in 1492, landing in the Caribbean.',
      difficulty: 'medium',
      subject: 'History'
    },
    {
      id: 'hist_mc_3',
      type: 'multiple_choice',
      question: 'Which ancient civilization built the pyramids?',
      options: ['Romans', 'Greeks', 'Egyptians', 'Mayans'],
      correct_answer: 'Egyptians',
      explanation: 'The ancient Egyptians built the pyramids as tombs for their pharaohs.',
      difficulty: 'easy',
      subject: 'History'
    },
    {
      id: 'hist_mc_4',
      type: 'multiple_choice',
      question: 'World War I began in which year?',
      options: ['1912', '1914', '1916', '1918'],
      correct_answer: '1914',
      explanation: 'World War I began in 1914 and lasted until 1918.',
      difficulty: 'medium',
      subject: 'History'
    },
    {
      id: 'hist_mc_5',
      type: 'multiple_choice',
      question: 'Who wrote the Declaration of Independence?',
      options: ['George Washington', 'Benjamin Franklin', 'Thomas Jefferson', 'John Adams'],
      correct_answer: 'Thomas Jefferson',
      explanation: 'Thomas Jefferson was the primary author of the Declaration of Independence in 1776.',
      difficulty: 'medium',
      subject: 'History'
    },
    {
      id: 'hist_mc_6',
      type: 'multiple_choice',
      question: 'The Renaissance began in which country?',
      options: ['France', 'England', 'Italy', 'Spain'],
      correct_answer: 'Italy',
      explanation: 'The Renaissance, a period of cultural rebirth, began in Italy in the 14th century.',
      difficulty: 'hard',
      subject: 'History'
    },

    // Modified True/False Questions
    {
      id: 'hist_tf_1',
      type: 'true_false',
      question: 'The Roman Empire fell in the year [UNDERLINE]476[/UNDERLINE] AD.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'The Western Roman Empire fell in 476 AD when the last emperor was deposed.',
      difficulty: 'hard',
      subject: 'History',
      underlinedText: '476',
      correctReplacement: '476'
    },
    {
      id: 'hist_tf_2',
      type: 'true_false',
      question: 'The Titanic sank in the [UNDERLINE]Pacific[/UNDERLINE] Ocean.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'The Titanic sank in the Atlantic Ocean in 1912, not the Pacific.',
      difficulty: 'easy',
      subject: 'History',
      underlinedText: 'Pacific',
      correctReplacement: 'Atlantic'
    },
    {
      id: 'hist_tf_3',
      type: 'true_false',
      question: 'The Berlin Wall fell in [UNDERLINE]1989[/UNDERLINE].',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'The Berlin Wall, which divided East and West Berlin, fell on November 9, 1989.',
      difficulty: 'medium',
      subject: 'History',
      underlinedText: '1989',
      correctReplacement: '1989'
    },
    {
      id: 'hist_tf_4',
      type: 'true_false',
      question: 'Abraham Lincoln was the [UNDERLINE]first[/UNDERLINE] U.S. President.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'Abraham Lincoln was the 16th President, not the first. George Washington was first.',
      difficulty: 'easy',
      subject: 'History',
      underlinedText: 'first',
      correctReplacement: '16th'
    },
    {
      id: 'hist_tf_5',
      type: 'true_false',
      question: 'The French Revolution began in [UNDERLINE]1789[/UNDERLINE].',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'The French Revolution began in 1789 with the storming of the Bastille.',
      difficulty: 'hard',
      subject: 'History',
      underlinedText: '1789',
      correctReplacement: '1789'
    },
    {
      id: 'hist_tf_6',
      type: 'true_false',
      question: 'The Great Wall of China was built to protect against [UNDERLINE]floods[/UNDERLINE].',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'The Great Wall was built to protect against invasions, not floods.',
      difficulty: 'medium',
      subject: 'History',
      underlinedText: 'floods',
      correctReplacement: 'invasions'
    },

    // Fill in the Blank Questions
    {
      id: 'hist_fb_1',
      type: 'fill_blank',
      question: 'The ancient city of _____ was destroyed by a volcanic eruption in 79 AD.',
      correct_answer: 'Pompeii',
      explanation: 'Pompeii was buried under volcanic ash when Mount Vesuvius erupted in 79 AD.',
      difficulty: 'medium',
      subject: 'History'
    },
    {
      id: 'hist_fb_2',
      type: 'fill_blank',
      question: 'The _____ Age came before the Iron Age.',
      correct_answer: 'Bronze',
      explanation: 'The Bronze Age preceded the Iron Age in human technological development.',
      difficulty: 'medium',
      subject: 'History'
    },
    {
      id: 'hist_fb_3',
      type: 'fill_blank',
      question: 'Martin Luther King Jr. delivered his famous "I Have a _____" speech in 1963.',
      correct_answer: 'Dream',
      explanation: 'The "I Have a Dream" speech was delivered during the March on Washington.',
      difficulty: 'easy',
      subject: 'History'
    },
    {
      id: 'hist_fb_4',
      type: 'fill_blank',
      question: 'The Magna Carta was signed in the year _____.',
      correct_answer: '1215',
      explanation: 'The Magna Carta, a foundational document for constitutional law, was signed in 1215.',
      difficulty: 'hard',
      subject: 'History'
    },
    {
      id: 'hist_fb_5',
      type: 'fill_blank',
      question: 'The ancient wonder called the Hanging Gardens was located in _____.',
      correct_answer: 'Babylon',
      explanation: 'The Hanging Gardens of Babylon were one of the Seven Wonders of the Ancient World.',
      difficulty: 'hard',
      subject: 'History'
    },
    {
      id: 'hist_fb_6',
      type: 'fill_blank',
      question: 'Julius _____ was a famous Roman general and statesman.',
      correct_answer: 'Caesar',
      explanation: 'Julius Caesar was a military leader who played a critical role in the fall of the Roman Republic.',
      difficulty: 'easy',
      subject: 'History'
    },

    // Matching Questions
    {
      id: 'hist_match_1',
      type: 'matching',
      question: 'Match each historical figure with their achievement:',
      pairs: [
        { left: 'Neil Armstrong', right: 'First person on the Moon' },
        { left: 'Wright Brothers', right: 'First powered flight' },
        { left: 'Alexander Fleming', right: 'Discovered penicillin' },
        { left: 'Johannes Gutenberg', right: 'Invented printing press' }
      ],
      correct_answer: ['Neil Armstrong:First person on the Moon', 'Wright Brothers:First powered flight', 'Alexander Fleming:Discovered penicillin', 'Johannes Gutenberg:Invented printing press'],
      explanation: 'Each of these individuals made revolutionary contributions to human progress.',
      difficulty: 'medium',
      subject: 'History'
    },
    {
      id: 'hist_match_2',
      type: 'matching',
      question: 'Match each ancient civilization with its location:',
      pairs: [
        { left: 'Mesopotamia', right: 'Between Tigris and Euphrates' },
        { left: 'Ancient Egypt', right: 'Along the Nile River' },
        { left: 'Indus Valley', right: 'Present-day Pakistan/India' },
        { left: 'Ancient China', right: 'Along the Yellow River' }
      ],
      correct_answer: ['Mesopotamia:Between Tigris and Euphrates', 'Ancient Egypt:Along the Nile River', 'Indus Valley:Present-day Pakistan/India', 'Ancient China:Along the Yellow River'],
      explanation: 'These ancient civilizations developed along major river systems.',
      difficulty: 'hard',
      subject: 'History'
    },
    {
      id: 'hist_match_3',
      type: 'matching',
      question: 'Match each war with its time period:',
      pairs: [
        { left: 'Revolutionary War', right: '1775-1783' },
        { left: 'Civil War', right: '1861-1865' },
        { left: 'World War I', right: '1914-1918' },
        { left: 'World War II', right: '1939-1945' }
      ],
      correct_answer: ['Revolutionary War:1775-1783', 'Civil War:1861-1865', 'World War I:1914-1918', 'World War II:1939-1945'],
      explanation: 'These major wars shaped modern history.',
      difficulty: 'medium',
      subject: 'History'
    },

    // Enumeration Questions
    {
      id: 'hist_enum_1',
      type: 'enumeration',
      question: 'Name 3 of the original 13 American colonies.',
      correct_answer: ['Virginia', 'Massachusetts', 'New York'],
      explanation: 'The 13 original colonies included Virginia, Massachusetts, New York, and 10 others.',
      difficulty: 'medium',
      subject: 'History'
    },
    {
      id: 'hist_enum_2',
      type: 'enumeration',
      question: 'List 3 continents that were part of the Allied Powers in World War II.',
      correct_answer: ['Europe', 'North America', 'Asia'],
      explanation: 'The Allied Powers included countries from Europe (UK, France), North America (USA), and Asia (China, Soviet Union).',
      difficulty: 'hard',
      subject: 'History'
    },
    {
      id: 'hist_enum_3',
      type: 'enumeration',
      question: 'Name 3 ancient wonders of the world.',
      correct_answer: ['Pyramids', 'Colossus', 'Lighthouse'],
      explanation: 'The Seven Wonders included the Great Pyramids, Colossus of Rhodes, Lighthouse of Alexandria, and four others.',
      difficulty: 'hard',
      subject: 'History'
    },

    // Identification Questions
    {
      id: 'hist_id_1',
      type: 'identification',
      question: 'What document declared American independence from Britain in 1776?',
      correct_answer: 'Declaration of Independence',
      explanation: 'The Declaration of Independence formally announced the separation of the colonies from Britain.',
      difficulty: 'easy',
      subject: 'History'
    },
    {
      id: 'hist_id_2',
      type: 'identification',
      question: 'What was the name of the ship that transported the Pilgrims to America in 1620?',
      correct_answer: 'Mayflower',
      explanation: 'The Mayflower carried the Pilgrims from England to Plymouth, Massachusetts.',
      difficulty: 'medium',
      subject: 'History'
    },
    {
      id: 'hist_id_3',
      type: 'identification',
      question: 'What empire was ruled by Caesar Augustus?',
      correct_answer: 'Roman',
      explanation: 'Caesar Augustus was the first emperor of the Roman Empire.',
      difficulty: 'easy',
      subject: 'History'
    },
    {
      id: 'hist_id_4',
      type: 'identification',
      question: 'What period followed the Middle Ages in European history?',
      correct_answer: 'Renaissance',
      explanation: 'The Renaissance was a period of cultural rebirth that followed the Middle Ages.',
      difficulty: 'medium',
      subject: 'History'
    }
  ],

  english: [
    // Multiple Choice Questions
    {
      id: 'eng_mc_1',
      type: 'multiple_choice',
      question: 'Which word is a proper noun?',
      options: ['city', 'London', 'building', 'street'],
      correct_answer: 'London',
      explanation: 'A proper noun names a specific person, place, or thing and is capitalized. London is a specific city.',
      difficulty: 'easy',
      subject: 'English'
    },
    {
      id: 'eng_mc_2',
      type: 'multiple_choice',
      question: 'What is the plural of "child"?',
      options: ['childs', 'childes', 'children', 'childrens'],
      correct_answer: 'children',
      explanation: 'Child is an irregular noun, and its plural form is "children".',
      difficulty: 'easy',
      subject: 'English'
    },
    {
      id: 'eng_mc_3',
      type: 'multiple_choice',
      question: 'Which sentence uses correct punctuation?',
      options: [
        'I like apples, oranges and bananas',
        'I like apples oranges, and bananas',
        'I like apples, oranges, and bananas',
        'I like apples oranges and bananas'
      ],
      correct_answer: 'I like apples, oranges, and bananas',
      explanation: 'Items in a list should be separated by commas, including before the conjunction.',
      difficulty: 'medium',
      subject: 'English'
    },
    {
      id: 'eng_mc_4',
      type: 'multiple_choice',
      question: 'What type of word is "quickly" in the sentence "She runs quickly"?',
      options: ['Noun', 'Verb', 'Adjective', 'Adverb'],
      correct_answer: 'Adverb',
      explanation: 'An adverb modifies a verb, adjective, or another adverb. "Quickly" describes how she runs.',
      difficulty: 'medium',
      subject: 'English'
    },
    {
      id: 'eng_mc_5',
      type: 'multiple_choice',
      question: 'Which sentence is in passive voice?',
      options: [
        'The cat chased the mouse',
        'The mouse was chased by the cat',
        'The cat is chasing the mouse',
        'The cat will chase the mouse'
      ],
      correct_answer: 'The mouse was chased by the cat',
      explanation: 'In passive voice, the subject receives the action. The mouse (subject) is being acted upon.',
      difficulty: 'hard',
      subject: 'English'
    },
    {
      id: 'eng_mc_6',
      type: 'multiple_choice',
      question: 'What is an antonym of "ancient"?',
      options: ['old', 'historic', 'modern', 'traditional'],
      correct_answer: 'modern',
      explanation: 'An antonym is a word with opposite meaning. Modern is the opposite of ancient.',
      difficulty: 'easy',
      subject: 'English'
    },

    // Modified True/False Questions
    {
      id: 'eng_tf_1',
      type: 'true_false',
      question: 'A [UNDERLINE]verb[/UNDERLINE] is an action word.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'A verb expresses an action, occurrence, or state of being.',
      difficulty: 'easy',
      subject: 'English',
      underlinedText: 'verb',
      correctReplacement: 'verb'
    },
    {
      id: 'eng_tf_2',
      type: 'true_false',
      question: 'The word "their" shows [UNDERLINE]possession[/UNDERLINE].',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: '"Their" is a possessive pronoun indicating ownership.',
      difficulty: 'easy',
      subject: 'English',
      underlinedText: 'possession',
      correctReplacement: 'possession'
    },
    {
      id: 'eng_tf_3',
      type: 'true_false',
      question: 'An adjective describes a [UNDERLINE]verb[/UNDERLINE].',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'An adjective describes a noun or pronoun, not a verb. Adverbs describe verbs.',
      difficulty: 'medium',
      subject: 'English',
      underlinedText: 'verb',
      correctReplacement: 'noun'
    },
    {
      id: 'eng_tf_4',
      type: 'true_false',
      question: 'The sentence "Where are you going?" is [UNDERLINE]interrogative[/UNDERLINE].',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'An interrogative sentence asks a question and ends with a question mark.',
      difficulty: 'medium',
      subject: 'English',
      underlinedText: 'interrogative',
      correctReplacement: 'interrogative'
    },
    {
      id: 'eng_tf_5',
      type: 'true_false',
      question: 'A metaphor makes a comparison using [UNDERLINE]like[/UNDERLINE] or as.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'A simile uses "like" or "as" for comparison. A metaphor makes a direct comparison without these words.',
      difficulty: 'hard',
      subject: 'English',
      underlinedText: 'like',
      correctReplacement: 'without'
    },
    {
      id: 'eng_tf_6',
      type: 'true_false',
      question: 'The prefix "[UNDERLINE]un[/UNDERLINE]" means not or opposite.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'The prefix "un-" negates the meaning of the root word (e.g., unhappy, unfair).',
      difficulty: 'easy',
      subject: 'English',
      underlinedText: 'un',
      correctReplacement: 'un'
    },

    // Fill in the Blank Questions
    {
      id: 'eng_fb_1',
      type: 'fill_blank',
      question: 'A sentence must have a subject and a _____.',
      correct_answer: 'predicate',
      explanation: 'Every complete sentence contains a subject (who or what) and a predicate (what the subject does).',
      difficulty: 'medium',
      subject: 'English'
    },
    {
      id: 'eng_fb_2',
      type: 'fill_blank',
      question: 'Words that sound the same but have different meanings are called _____.',
      correct_answer: 'homophones',
      explanation: 'Homophones are words that sound identical but have different spellings and meanings (e.g., there/their/they\'re).',
      difficulty: 'hard',
      subject: 'English'
    },
    {
      id: 'eng_fb_3',
      type: 'fill_blank',
      question: 'The past tense of "go" is _____.',
      correct_answer: 'went',
      explanation: 'Go is an irregular verb, and its past tense form is "went".',
      difficulty: 'easy',
      subject: 'English'
    },
    {
      id: 'eng_fb_4',
      type: 'fill_blank',
      question: 'A word that takes the place of a noun is called a _____.',
      correct_answer: 'pronoun',
      explanation: 'Pronouns (like he, she, it, they) replace nouns to avoid repetition.',
      difficulty: 'easy',
      subject: 'English'
    },
    {
      id: 'eng_fb_5',
      type: 'fill_blank',
      question: 'An exclamation point shows strong _____ or surprise.',
      correct_answer: 'emotion',
      explanation: 'Exclamation points are used to express strong feelings, excitement, or emphasis.',
      difficulty: 'easy',
      subject: 'English'
    },
    {
      id: 'eng_fb_6',
      type: 'fill_blank',
      question: 'The main idea of a paragraph is often found in the _____ sentence.',
      correct_answer: 'topic',
      explanation: 'The topic sentence introduces the main idea that the paragraph will develop.',
      difficulty: 'medium',
      subject: 'English'
    },

    // Matching Questions
    {
      id: 'eng_match_1',
      type: 'matching',
      question: 'Match each punctuation mark with its primary use:',
      pairs: [
        { left: 'Period', right: 'Ends a statement' },
        { left: 'Question mark', right: 'Ends a question' },
        { left: 'Comma', right: 'Separates items' },
        { left: 'Apostrophe', right: 'Shows possession' }
      ],
      correct_answer: ['Period:Ends a statement', 'Question mark:Ends a question', 'Comma:Separates items', 'Apostrophe:Shows possession'],
      explanation: 'Each punctuation mark serves a specific grammatical purpose.',
      difficulty: 'easy',
      subject: 'English'
    },
    {
      id: 'eng_match_2',
      type: 'matching',
      question: 'Match each literary device with its definition:',
      pairs: [
        { left: 'Simile', right: 'Comparison using like or as' },
        { left: 'Metaphor', right: 'Direct comparison' },
        { left: 'Personification', right: 'Giving human qualities to non-human' },
        { left: 'Alliteration', right: 'Repetition of initial sounds' }
      ],
      correct_answer: ['Simile:Comparison using like or as', 'Metaphor:Direct comparison', 'Personification:Giving human qualities to non-human', 'Alliteration:Repetition of initial sounds'],
      explanation: 'These literary devices add depth and creativity to writing.',
      difficulty: 'medium',
      subject: 'English'
    },
    {
      id: 'eng_match_3',
      type: 'matching',
      question: 'Match each sentence type with its purpose:',
      pairs: [
        { left: 'Declarative', right: 'Makes a statement' },
        { left: 'Interrogative', right: 'Asks a question' },
        { left: 'Imperative', right: 'Gives a command' },
        { left: 'Exclamatory', right: 'Shows strong emotion' }
      ],
      correct_answer: ['Declarative:Makes a statement', 'Interrogative:Asks a question', 'Imperative:Gives a command', 'Exclamatory:Shows strong emotion'],
      explanation: 'The four sentence types serve different communicative purposes.',
      difficulty: 'medium',
      subject: 'English'
    },

    // Enumeration Questions
    {
      id: 'eng_enum_1',
      type: 'enumeration',
      question: 'List 3 common coordinating conjunctions (FANBOYS).',
      correct_answer: ['for', 'and', 'but'],
      explanation: 'FANBOYS stands for: For, And, Nor, But, Or, Yet, So - the seven coordinating conjunctions.',
      difficulty: 'medium',
      subject: 'English'
    },
    {
      id: 'eng_enum_2',
      type: 'enumeration',
      question: 'Name 3 types of pronouns.',
      correct_answer: ['personal', 'possessive', 'demonstrative'],
      explanation: 'Types of pronouns include personal (I, you), possessive (my, your), demonstrative (this, that), and others.',
      difficulty: 'hard',
      subject: 'English'
    },
    {
      id: 'eng_enum_3',
      type: 'enumeration',
      question: 'List 3 vowels in the English alphabet.',
      correct_answer: ['a', 'e', 'i'],
      explanation: 'The five vowels in English are a, e, i, o, and u (sometimes y).',
      difficulty: 'easy',
      subject: 'English'
    },

    // Identification Questions
    {
      id: 'eng_id_1',
      type: 'identification',
      question: 'What do you call a word that connects clauses or sentences?',
      correct_answer: 'conjunction',
      explanation: 'A conjunction joins words, phrases, or clauses (e.g., and, but, or, because).',
      difficulty: 'easy',
      subject: 'English'
    },
    {
      id: 'eng_id_2',
      type: 'identification',
      question: 'What is the term for the feeling or atmosphere created by a literary work?',
      correct_answer: 'mood',
      explanation: 'Mood is the emotional atmosphere that a writer creates for the reader.',
      difficulty: 'medium',
      subject: 'English'
    },
    {
      id: 'eng_id_3',
      type: 'identification',
      question: 'What part of speech describes a noun?',
      correct_answer: 'adjective',
      explanation: 'An adjective modifies or describes a noun or pronoun.',
      difficulty: 'easy',
      subject: 'English'
    },
    {
      id: 'eng_id_4',
      type: 'identification',
      question: 'What do you call a group of words that contains a subject and predicate?',
      correct_answer: 'clause',
      explanation: 'A clause is a group of words containing a subject and a predicate.',
      difficulty: 'medium',
      subject: 'English'
    }
  ]
};

export const getRandomOfflineQuiz = (subject?: string, count: number = 10): OfflineQuiz[] => {
  let allQuizzes: OfflineQuiz[] = [];
  
  if (subject && offlineQuizDatabase[subject.toLowerCase()]) {
    allQuizzes = [...offlineQuizDatabase[subject.toLowerCase()]];
  } else {
    // Combine all subjects
    Object.values(offlineQuizDatabase).forEach(quizzes => {
      allQuizzes.push(...quizzes);
    });
  }
  
  // Shuffle and return requested count
  const shuffled = allQuizzes.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const getQuizzesByType = (type: OfflineQuiz['type'], count: number = 5): OfflineQuiz[] => {
  let allQuizzes: OfflineQuiz[] = [];
  
  Object.values(offlineQuizDatabase).forEach(quizzes => {
    allQuizzes.push(...quizzes.filter(quiz => quiz.type === type));
  });
  
  const shuffled = allQuizzes.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const getQuizzesBySubjectAndType = (subject?: string, type?: OfflineQuiz['type'], count: number = 5): OfflineQuiz[] => {
  let allQuizzes: OfflineQuiz[] = [];
  
  // Get quizzes by subject
  if (subject && offlineQuizDatabase[subject.toLowerCase()]) {
    allQuizzes = [...offlineQuizDatabase[subject.toLowerCase()]];
  } else {
    // Combine all subjects
    Object.values(offlineQuizDatabase).forEach(quizzes => {
      allQuizzes.push(...quizzes);
    });
  }
  
  // Filter by type if specified
  if (type) {
    allQuizzes = allQuizzes.filter(quiz => quiz.type === type);
  }
  
  // Shuffle and return requested count
  const shuffled = allQuizzes.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const getAllSubjects = (): string[] => {
  return Object.keys(offlineQuizDatabase);
};
