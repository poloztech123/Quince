/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question } from './types';

export const defaultQuestions: Question[] = [
  // ROUND 1 QUESTIONS (20 questions, 1 point each)
  {
    id: 'r1-q1',
    round: 1,
    text: 'Which planet in our solar system is known as the Red Planet?',
    options: {
      A: 'Venus',
      B: 'Mars',
      C: 'Jupiter',
      D: 'Saturn'
    },
    correctAnswer: 'B',
    points: 1
  },
  {
    id: 'r1-q2',
    round: 1,
    text: 'Who painted the famous artwork "Mona Lisa"?',
    options: {
      A: 'Michelangelo',
      B: 'Vincent van Gogh',
      C: 'Leonardo da Vinci',
      D: 'Pablo Picasso'
    },
    correctAnswer: 'C',
    points: 1
  },
  {
    id: 'r1-q3',
    round: 1,
    text: 'What is the largest organ of the human body?',
    options: {
      A: 'Liver',
      B: 'Brain',
      C: 'Lungs',
      D: 'Skin'
    },
    correctAnswer: 'D',
    points: 1
  },
  {
    id: 'r1-q4',
    round: 1,
    text: 'Which of the following elements has the chemical symbol "O"?',
    options: {
      A: 'Osmium',
      B: 'Oxygen',
      C: 'Gold',
      D: 'Helium'
    },
    correctAnswer: 'B',
    points: 1
  },
  {
    id: 'r1-q5',
    round: 1,
    text: 'How many bones are there in an adult human skeleton?',
    options: {
      A: '156',
      B: '206',
      C: '256',
      D: '306'
    },
    correctAnswer: 'B',
    points: 1
  },
  {
    id: 'r1-q6',
    round: 1,
    text: 'Which ocean is the largest on Earth?',
    options: {
      A: 'Atlantic Ocean',
      B: 'Indian Ocean',
      C: 'Arctic Ocean',
      D: 'Pacific Ocean'
    },
    correctAnswer: 'D',
    points: 1
  },
  {
    id: 'r1-q7',
    round: 1,
    text: 'What is the capital city of France?',
    options: {
      A: 'London',
      B: 'Rome',
      C: 'Paris',
      D: 'Madrid'
    },
    correctAnswer: 'C',
    points: 1
  },
  {
    id: 'r1-q8',
    round: 1,
    text: 'What kind of animal is a Komodo dragon?',
    options: {
      A: 'Lizard',
      B: 'Mammal',
      C: 'Bird',
      D: 'Amphibian'
    },
    correctAnswer: 'A',
    points: 1
  },
  {
    id: 'r1-q9',
    round: 1,
    text: 'How many days are there in a standard leap year?',
    options: {
      A: '365',
      B: '366',
      C: '364',
      D: '368'
    },
    correctAnswer: 'B',
    points: 1
  },
  {
    id: 'r1-q10',
    round: 1,
    text: 'Which is the tallest mammal on Earth?',
    options: {
      A: 'Elephant',
      B: 'Giraffe',
      C: 'Blue Whale',
      D: 'Horse'
    },
    correctAnswer: 'B',
    points: 1
  },
  {
    id: 'r1-q11',
    round: 1,
    text: 'Which gas do plants absorb from the atmosphere for photosynthesis?',
    options: {
      A: 'Oxygen',
      B: 'Nitrogen',
      C: 'Carbon Dioxide',
      D: 'Hydrogen'
    },
    correctAnswer: 'C',
    points: 1
  },
  {
    id: 'r1-q12',
    round: 1,
    text: 'What is the primary color of an emerald?',
    options: {
      A: 'Red',
      B: 'Blue',
      C: 'Yellow',
      D: 'Green'
    },
    correctAnswer: 'D',
    points: 1
  },
  {
    id: 'r1-q13',
    round: 1,
    text: 'What is the boiling point of water at sea level in degrees Celsius?',
    options: {
      A: '90°C',
      B: '100°C',
      C: '120°C',
      D: '80°C'
    },
    correctAnswer: 'B',
    points: 1
  },
  {
    id: 'r1-q14',
    round: 1,
    text: 'Which company created the search engine "Google"?',
    options: {
      A: 'Microsoft',
      B: 'Apple',
      C: 'Google',
      D: 'Amazon'
    },
    correctAnswer: 'C',
    points: 1
  },
  {
    id: 'r1-q15',
    round: 1,
    text: 'How many stripes are on the national flag of the United States?',
    options: {
      A: '10',
      B: '13',
      C: '15',
      D: '50'
    },
    correctAnswer: 'B',
    points: 1
  },
  {
    id: 'r1-q16',
    round: 1,
    text: 'What is the opposite of the word "synonym"?',
    options: {
      A: 'Antonym',
      B: 'Homonym',
      C: 'Metaphor',
      D: 'Acronym'
    },
    correctAnswer: 'A',
    points: 1
  },
  {
    id: 'r1-q17',
    round: 1,
    text: 'In which country was the game of golf invented?',
    options: {
      A: 'England',
      B: 'Scotland',
      C: 'Ireland',
      D: 'United States'
    },
    correctAnswer: 'B',
    points: 1
  },
  {
    id: 'r1-q18',
    round: 1,
    text: 'Which instrument is used to measure air pressure?',
    options: {
      A: 'Thermometer',
      B: 'Barometer',
      C: 'Seismograph',
      D: 'Speedometer'
    },
    correctAnswer: 'B',
    points: 1
  },
  {
    id: 'r1-q19',
    round: 1,
    text: 'How many sides does an octagon have?',
    options: {
      A: '6',
      B: '7',
      C: '8',
      D: '10'
    },
    correctAnswer: 'C',
    points: 1
  },
  {
    id: 'r1-q20',
    round: 1,
    text: 'Who is the author of the Harry Potter book series?',
    options: {
      A: 'J.R.R. Tolkien',
      B: 'J.K. Rowling',
      C: 'George R.R. Martin',
      D: 'C.S. Lewis'
    },
    correctAnswer: 'B',
    points: 1
  },

  // ROUND 2 QUESTIONS (20 questions, 2 points each)
  {
    id: 'r2-q1',
    round: 2,
    text: 'What is the capital city of Australia?',
    options: {
      A: 'Sydney',
      B: 'Melbourne',
      C: 'Brisbane',
      D: 'Canberra'
    },
    correctAnswer: 'D',
    points: 2
  },
  {
    id: 'r2-q2',
    round: 2,
    text: 'Which gas is the most abundant in the Earth\'s atmosphere?',
    options: {
      A: 'Oxygen',
      B: 'Carbon Dioxide',
      C: 'Nitrogen',
      D: 'Argon'
    },
    correctAnswer: 'C',
    points: 2
  },
  {
    id: 'r2-q3',
    round: 2,
    text: 'In what year did the Titanic sink?',
    options: {
      A: '1905',
      B: '1912',
      C: '1918',
      D: '1923'
    },
    correctAnswer: 'B',
    points: 2
  },
  {
    id: 'r2-q4',
    round: 2,
    text: 'Which organ of the body is responsible for producing insulin?',
    options: {
      A: 'Liver',
      B: 'Pancreas',
      C: 'Kidney',
      D: 'Gallbladder'
    },
    correctAnswer: 'B',
    points: 2
  },
  {
    id: 'r2-q5',
    round: 2,
    text: 'Who wrote the play "Romeo and Juliet"?',
    options: {
      A: 'William Shakespeare',
      B: 'Charles Dickens',
      C: 'Jane Austen',
      D: 'Mark Twain'
    },
    correctAnswer: 'A',
    points: 2
  },
  {
    id: 'r2-q6',
    round: 2,
    text: 'What is the chemical symbol for the element Gold?',
    options: {
      A: 'Ag',
      B: 'Au',
      C: 'Fe',
      D: 'Pb'
    },
    correctAnswer: 'B',
    points: 2
  },
  {
    id: 'r2-q7',
    round: 2,
    text: 'What is the longest river in the world?',
    options: {
      A: 'Amazon River',
      B: 'Nile River',
      C: 'Yangtze River',
      D: 'Mississippi River'
    },
    correctAnswer: 'B',
    points: 2
  },
  {
    id: 'r2-q8',
    round: 2,
    text: 'Who was the first President of the United States?',
    options: {
      A: 'Thomas Jefferson',
      B: 'Abraham Lincoln',
      C: 'John Adams',
      D: 'George Washington'
    },
    correctAnswer: 'D',
    points: 2
  },
  {
    id: 'r2-q9',
    round: 2,
    text: 'Which metal is liquid at room temperature?',
    options: {
      A: 'Mercury',
      B: 'Lead',
      C: 'Bismuth',
      D: 'Copper'
    },
    correctAnswer: 'A',
    points: 2
  },
  {
    id: 'r2-q10',
    round: 2,
    text: 'How many planets in our solar system have rings?',
    options: {
      A: '1',
      B: '2',
      C: '4',
      D: '8'
    },
    correctAnswer: 'C',
    points: 2
  },
  {
    id: 'r2-q11',
    round: 2,
    text: 'Which non-metal is the best conductor of electricity?',
    options: {
      A: 'Diamond',
      B: 'Graphite',
      C: 'Sulfur',
      D: 'Phosphorus'
    },
    correctAnswer: 'B',
    points: 2
  },
  {
    id: 'r2-q12',
    round: 2,
    text: 'In which continent is the Sahara Desert located?',
    options: {
      A: 'Asia',
      B: 'Africa',
      C: 'Australia',
      D: 'South America'
    },
    correctAnswer: 'B',
    points: 2
  },
  {
    id: 'r2-q13',
    round: 2,
    text: 'What is the speed of light in a vacuum (approximately)?',
    options: {
      A: '150,000 km/s',
      B: '300,000 km/s',
      C: '450,000 km/s',
      D: '600,000 km/s'
    },
    correctAnswer: 'B',
    points: 2
  },
  {
    id: 'r2-q14',
    round: 2,
    text: 'Which standard musical clef is also known as the G-clef?',
    options: {
      A: 'Bass Clef',
      B: 'Alto Clef',
      C: 'Treble Clef',
      D: 'Tenor Clef'
    },
    correctAnswer: 'C',
    points: 2
  },
  {
    id: 'r2-q15',
    round: 2,
    text: 'Who is considered the "Father of Computers"?',
    options: {
      A: 'Alan Turing',
      B: 'Charles Babbage',
      C: 'Ada Lovelace',
      D: 'Steve Jobs'
    },
    correctAnswer: 'B',
    points: 2
  },
  {
    id: 'r2-q16',
    round: 2,
    text: 'How many continents are there on Earth?',
    options: {
      A: '5',
      B: '6',
      C: '7',
      D: '8'
    },
    correctAnswer: 'C',
    points: 2
  },
  {
    id: 'r2-q17',
    round: 2,
    text: 'Which country is home to the Kangaroo?',
    options: {
      A: 'New Zealand',
      B: 'South Africa',
      C: 'Australia',
      D: 'Austria'
    },
    correctAnswer: 'C',
    points: 2
  },
  {
    id: 'r2-q18',
    round: 2,
    text: 'What component of blood carries oxygen throughout the body?',
    options: {
      A: 'White blood cells',
      B: 'Platelets',
      C: 'Plasma',
      D: 'Red blood cells (Hemoglobin)'
    },
    correctAnswer: 'D',
    points: 2
  },
  {
    id: 'r2-q19',
    round: 2,
    text: 'Which language is the most spoken worldwide by native speakers?',
    options: {
      A: 'English',
      B: 'Spanish',
      C: 'Mandarin Chinese',
      D: 'Hindi'
    },
    correctAnswer: 'C',
    points: 2
  },
  {
    id: 'r2-q20',
    round: 2,
    text: 'What is the value of Pi rounded to the nearest two decimal places?',
    options: {
      A: '3.12',
      B: '3.14',
      C: '3.16',
      D: '3.18'
    },
    correctAnswer: 'B',
    points: 2
  },

  // ROUND 3 QUESTIONS (20 questions, 3 points each)
  {
    id: 'r3-q1',
    round: 3,
    text: 'What state of matter is formed when a gas is heated to extremely high temperatures and ionizes?',
    options: {
      A: 'Liquid',
      B: 'Solid',
      C: 'Plasma',
      D: 'Bose-Einstein Condensate'
    },
    correctAnswer: 'C',
    points: 3
  },
  {
    id: 'r3-q2',
    round: 3,
    text: 'Which legendary unit of length is defined as approximately 5.88 trillion miles (9.46 trillion km)?',
    options: {
      A: 'Astronomical Unit (AU)',
      B: 'Light Year',
      C: 'Parsec',
      D: 'Kiloparsec'
    },
    correctAnswer: 'B',
    points: 3
  },
  {
    id: 'r3-q3',
    round: 3,
    text: 'Who discovered penicillin in 1928?',
    options: {
      A: 'Louis Pasteur',
      B: 'Alexander Fleming',
      C: 'Robert Koch',
      D: 'Edward Jenner'
    },
    correctAnswer: 'B',
    points: 3
  },
  {
    id: 'r3-q4',
    round: 3,
    text: 'Which deep trench is the lowest point on Earth\'s crust?',
    options: {
      A: 'Puerto Rico Trench',
      B: 'Java Trench',
      C: 'Mariana Trench',
      D: 'Sunda Trench'
    },
    correctAnswer: 'C',
    points: 3
  },
  {
    id: 'r3-q5',
    round: 3,
    text: 'What is the oldest active volcano on Earth, located in Sicily, Italy?',
    options: {
      A: 'Vesuvius',
      B: 'Mount Etna',
      C: 'Stromboli',
      D: 'Kilauea'
    },
    correctAnswer: 'B',
    points: 3
  },
  {
    id: 'r3-q6',
    round: 3,
    text: 'Which hormone is known as the "flight-or-fight" hormone, secreted during high stress?',
    options: {
      A: 'Melatonin',
      B: 'Insulin',
      C: 'Adrenaline (Epinephrine)',
      D: 'Thyroxine'
    },
    correctAnswer: 'C',
    points: 3
  },
  {
    id: 'r3-q7',
    round: 3,
    text: 'What was the first artificial satellite launched into space by humans (in 1957)?',
    options: {
      A: 'Explorer 1',
      B: 'Vanguard 1',
      C: 'Sputnik 1',
      D: 'Apollo 11'
    },
    correctAnswer: 'C',
    points: 3
  },
  {
    id: 'r3-q8',
    round: 3,
    text: 'What temperature is absolute zero in Kelvins?',
    options: {
      A: '-273.15 K',
      B: '0 K',
      C: '273.15 K',
      D: '-100 K'
    },
    correctAnswer: 'B',
    points: 3
  },
  {
    id: 'r3-q9',
    round: 3,
    text: 'In which city is the famous ancient amphitheater, the Colosseum, located?',
    options: {
      A: 'Athens',
      B: 'Rome',
      C: 'Pompeii',
      D: 'Verona'
    },
    correctAnswer: 'B',
    points: 3
  },
  {
    id: 'r3-q10',
    round: 3,
    text: 'Which subatomic particle has an electrical charge value of zero?',
    options: {
      A: 'Proton',
      B: 'Electron',
      C: 'Neutron',
      D: 'Positron'
    },
    correctAnswer: 'C',
    points: 3
  },
  {
    id: 'r3-q11',
    round: 3,
    text: 'What is the capital city of Japan?',
    options: {
      A: 'Osaka',
      B: 'Kyoto',
      C: 'Seoul',
      D: 'Tokyo'
    },
    correctAnswer: 'D',
    points: 3
  },
  {
    id: 'r3-q12',
    round: 3,
    text: 'Which vitamin is synthesized by the human skin when exposed to sunlight?',
    options: {
      A: 'Vitamin A',
      B: 'Vitamin B12',
      C: 'Vitamin C',
      D: 'Vitamin D'
    },
    correctAnswer: 'D',
    points: 3
  },
  {
    id: 'r3-q13',
    round: 3,
    text: 'What is the name of the nearest major spiral galaxy to our own Milky Way?',
    options: {
      A: 'Andromeda',
      B: 'Triangulum',
      C: 'Large Magellanic Cloud',
      D: 'Sombrero Galaxy'
    },
    correctAnswer: 'A',
    points: 3
  },
  {
    id: 'r3-q14',
    round: 3,
    text: 'Which planet possesses the most extensive and brilliant ring system in our solar system?',
    options: {
      A: 'Jupiter',
      B: 'Neptune',
      C: 'Uranus',
      D: 'Saturn'
    },
    correctAnswer: 'D',
    points: 3
  },
  {
    id: 'r3-q15',
    round: 3,
    text: 'What is the standard unit of frequency in the International System of Units (SI)?',
    options: {
      A: 'Volt',
      B: 'Hertz (Hz)',
      C: 'Watt',
      D: 'Joule'
    },
    correctAnswer: 'B',
    points: 3
  },
  {
    id: 'r3-q16',
    round: 3,
    text: 'Which desert is famed as the driest non-polar desert place on planet Earth?',
    options: {
      A: 'Gobi Desert',
      B: 'Atacama Desert',
      C: 'Sahara Desert',
      D: 'Mojave Desert'
    },
    correctAnswer: 'B',
    points: 3
  },
  {
    id: 'r3-q17',
    round: 3,
    text: 'According to physics, how high is the magnitude of the charge of an electron compared to a proton?',
    options: {
      A: 'Directly double',
      B: 'Directly half',
      C: 'Exactly equal',
      D: 'Varies dramatically'
    },
    correctAnswer: 'C',
    points: 3
  },
  {
    id: 'r3-q18',
    round: 3,
    text: 'Which is the fastest land animal in the world?',
    options: {
      A: 'Lion',
      B: 'Cheetah',
      C: 'Leopard',
      D: 'Wildebeest'
    },
    correctAnswer: 'B',
    points: 3
  },
  {
    id: 'r3-q19',
    round: 3,
    text: 'Who proposed the scientific Theory of General Relativity?',
    options: {
      A: 'Isaac Newton',
      B: 'Galileo Galilei',
      C: 'Albert Einstein',
      D: 'Stephen Hawking'
    },
    correctAnswer: 'C',
    points: 3
  },
  {
    id: 'r3-q20',
    round: 3,
    text: 'What structure holds the planetary atmospheres in place against expanding into deep space?',
    options: {
      A: 'Inertia',
      B: 'Solar winds',
      C: 'Magnetic fields',
      D: 'Gravitational force'
    },
    correctAnswer: 'D',
    points: 3
  }
];

export const defaultAds = [
  {
    id: 'ad-1',
    title: '🌐 TECH ACADEMY BOOTCAMP',
    description: 'Learn Software Engineering from top mentors. 50% discount this month!',
    imageUrl: '', // can be inline styling/svg if no image, but we can render beautiful designs
    clickUrl: '#'
  },
  {
    id: 'ad-2',
    title: '⚡ CLOUD SERVICES PRO',
    description: 'Deploy containers globally with 99.99% SLA. Sign up for $200 free credits.',
    imageUrl: '',
    clickUrl: '#'
  },
  {
    id: 'ad-3',
    title: '🧠 AI STUDIO DEVELOPER PORTAL',
    description: 'Build responsive web apps instantly with Gemini models. Harness AI power.',
    imageUrl: '',
    clickUrl: '#'
  },
  {
    id: 'ad-4',
    title: '☕ GOURMET ROASTERS COFFEE',
    description: 'Artisanal single-origin beans roasted fresh and delivered right to your lab.',
    imageUrl: '',
    clickUrl: '#'
  }
];
