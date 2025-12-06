
export enum AnimalType {
  OWL = 'OWL',       // Night owl
  LARK = 'LARK',     // Early bird
  KOALA = 'KOALA',   // Low energy / Quiet
  PUPPY = 'PUPPY',   // Social / High energy
  CAT = 'CAT',       // Independent / Clean
  PEACOCK = 'PEACOCK', // Expressive / Messy ok
  HAMSTER = 'HAMSTER', // Cold / Nesting / Safe
  RABBIT = 'RABBIT'   // Sensitive / Quiet / Introverted (New)
}

export interface QuizAnswer {
  questionId: number;
  answerValue: number; // 1-5 scale usually
  answerText: string;
  extraText?: string; // For typed inputs (comma separated for multiple names)
}

export interface QuizOption {
    value: number;
    text: string;
    hasInput?: boolean; // Does selecting this trigger a text input?
}

export interface QuizQuestion {
    id: number;
    text: string;
    options: QuizOption[];
}

export interface StudentProfile {
  id: string;
  name: string;
  gender?: string; // Gender from roster (Male/Female)
  originalRoom?: string; // Current room number from roster
  animalType: AnimalType;
  animalName: string; // Display name e.g., "夜貓子貓頭鷹"
  description: string; // Personality analysis text
  traits: string[];
  preferredRoommates: string[]; // Array of strings (Names or "續住" or "隨緣")
  habits: {
    sleepTime: string;
    cleanliness: number; // 1-10
    socialEnergy: number; // 1-10
    noiseTolerance: number; // 1-10
  };
  rawAnswers?: QuizAnswer[];
}

export interface RoomGroup {
  roomId: string;
  students: StudentProfile[];
  compatibilityScore: number;
  reason: string;
  potentialConflicts: string;
}

// Defines a student from the uploaded excel roster
export interface OfficialStudent {
  name: string;
  gender?: string;       
  originalRoom?: string; 
  studentId?: string;    
}

export type ViewState = 'LANDING' | 'QUIZ' | 'RESULT' | 'TEACHER_DASHBOARD';
