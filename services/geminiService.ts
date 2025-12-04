import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnimalType, QuizAnswer, StudentProfile, RoomGroup } from "../types";
import { ANIMAL_DETAILS } from "../constants";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for the bulk grouping response
const groupingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    groups: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          roomId: { type: Type.STRING },
          studentIds: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "The IDs of students assigned to this room"
          },
          compatibilityScore: { type: Type.NUMBER, description: "0-100 score" },
          reason: { type: Type.STRING, description: "Why these students were grouped together" },
          potentialConflicts: { type: Type.STRING, description: "What they might argue about" },
        },
        required: ["roomId", "studentIds", "compatibilityScore", "reason", "potentialConflicts"],
      },
    },
  },
  required: ["groups"],
};


// --- Service Functions ---

/**
 * Analyzes a single student's quiz answers LOCALLY (Deterministically).
 * Updated for 11 questions + Hamster Logic.
 */
export const analyzeStudentProfile = async (name: string, answers: QuizAnswer[]): Promise<StudentProfile> => {
  // Simulate a short delay for UX "calculating" feel
  await new Promise(resolve => setTimeout(resolve, 800));

  // Helper to safely get answer value (default to 2 if missing)
  const getAns = (id: number) => answers.find(a => a.questionId === id);
  const getVal = (id: number) => getAns(id)?.answerValue || 2;
  
  // Mapping Answers to Traits
  const sleepTime = getVal(1);     // 1: Early, 3: Late
  const cleanliness = getVal(2);   // 3: Messy, 1: Clean (Note: Inverted scale in Q2 options)
  const weekend = getVal(3);       // 1: Active, 3: Sleep in
  const smell = getVal(4);         // 1: Sensitive, 3: Dull
  const freeTime = getVal(5);      // 1: Introvert, 3: Extrovert
  const homeFreq = getVal(6);      // 1: Often Home, 3: Stay Dorm
  const alarm = getVal(7);         // 1: Instant, 3: Dead
  const sharing = getVal(8);       // 1: Strict, 3: Free
  const temp = getVal(9);          // 1: Cold (Hamster), 3: Hot
  const noise = getVal(10);        // 1: Tolerant/Passive, 3: Active/Aggressive
  
  const prefAns = getAns(11);
  // If Q11 is 2 (Yes), we take the extraText, otherwise "隨緣"
  const preferredRoommate = (prefAns?.answerValue === 2 && prefAns.extraText) 
    ? prefAns.extraText 
    : "無 (隨緣)";

  let type: AnimalType = AnimalType.KOALA;
  let traits: string[] = [];
  
  // --- Determination Logic (Heuristic) ---
  
  // Calculate Scores
  // Note: Q2 Cleanliness is: 1=Clean, 3=Messy
  const cleanScore = (4 - cleanliness) + (4 - smell); // Higher = Cleaner
  const socialScore = freeTime + sharing + (homeFreq === 3 ? 1 : 0); // Higher = More Social
  const sleepScore = sleepTime + (weekend === 3 ? 1 : 0); // Higher = Later/Sleepy
  
  // 1. HAMSTER Logic (Special Case: Cold + Dorm lover/Introvert)
  // Needs to strictly be afraid of cold (1) and not super extroverted
  if (temp === 1 && (homeFreq === 3 || freeTime === 1)) {
    type = AnimalType.HAMSTER;
    traits.push("極度怕冷", "戀家/戀床");
  } 
  // 2. Sleep Dominance (Owl vs Lark)
  else if (sleepTime === 3 && weekend >= 2) {
    type = AnimalType.OWL;
    traits.push("越夜越美麗", "靈感型");
  } else if (sleepTime === 1) {
    type = AnimalType.LARK;
    traits.push("晨間效率派", "規律作息");
  } else {
    // 3. Personality Dominance
    if (cleanScore >= 5 && sharing === 1) {
      type = AnimalType.CAT;
      traits.push("極度愛乾淨", "重視隱私");
    } else if (socialScore >= 7) {
      type = AnimalType.PUPPY;
      traits.push("社交小能手", "害怕孤單");
    } else if (cleanliness === 3 && sharing >= 2) { // Messy but shares
      type = AnimalType.PEACOCK;
      traits.push("隨性自在", "不拘小節");
    } else {
      type = AnimalType.KOALA;
      traits.push("和平主義", "隨遇而安");
    }
  }

  // Add specific secondary traits based on specific answers
  if (homeFreq === 1) traits.push("每週返鄉");
  if (homeFreq === 3) traits.push("宿舍守護者");
  if (temp === 3) traits.push("極度怕熱");
  if (alarm === 3) traits.push("鬧鐘絕緣體");
  if (smell === 1) traits.push("好鼻師");
  if (preferredRoommate !== "無 (隨緣)") traits.push("已有指定室友");

  // Deduplicate and limit traits
  traits = [...new Set(traits)].slice(0, 3);

  // Map values to 1-10 scale for the dashboard
  const cleanMetric = Math.min(10, (4 - cleanliness) * 3 + 1);
  const socialMetric = Math.min(10, freeTime * 3 + 1);
  const noiseMetric = Math.min(10, alarm * 3 + 1);

  // Construct sleep string
  let sleepStr = "12:00 AM";
  if (sleepTime === 1) sleepStr = "10:30 PM";
  if (sleepTime === 3) sleepStr = "02:30 AM";

  return {
    id: crypto.randomUUID(),
    name,
    animalType: type,
    animalName: ANIMAL_DETAILS[type].label,
    description: ANIMAL_DETAILS[type].description,
    traits: traits,
    preferredRoommate: preferredRoommate,
    habits: {
      sleepTime: sleepStr,
      cleanliness: cleanMetric,
      socialEnergy: socialMetric,
      noiseTolerance: noiseMetric,
    },
    rawAnswers: answers,
  };
};

/**
 * Takes a list of student profiles and groups them into rooms.
 */
export const generateRoomGroups = async (students: StudentProfile[]): Promise<RoomGroup[]> => {
  // We need to keep the payload efficient.
  const rosterData = students.map(s => ({
    id: s.id,
    name: s.name,
    animal: s.animalName,
    preferredRoommate: s.preferredRoommate,
    traits: s.traits, // Include traits for better context
    habits: s.habits
  }));

  const prompt = `
    You are an expert dormitory coordinator. 
    I have ${students.length} students. 
    Group them into optimal rooms of 3 to 4 people (prioritize 4).
    
    Rules for grouping:
    1. **CRITICAL**: Check 'preferredRoommate'. If Student A wants Student B, put them in the same room if possible.
    2. Sleep schedules MUST match (Early birds with Early birds). This is the most critical physiological factor.
    3. Cleanliness levels should be similar.
    4. Social energy should be compatible (e.g. don't put one quiet person with 3 loud party animals).
    5. Use the "traits" to find common ground.
    
    Roster:
    ${JSON.stringify(rosterData)}
    
    Return a JSON object containing the groups.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: groupingSchema,
      },
    });

    const result = JSON.parse(response.text);

    // Rehydrate the result with full student objects
    const finalGroups: RoomGroup[] = result.groups.map((g: any) => ({
      ...g,
      students: g.studentIds.map((sid: string) => students.find(s => s.id === sid)).filter(Boolean)
    }));

    return finalGroups;

  } catch (error) {
    console.error("Error grouping students:", error);
    throw error;
  }
};

/**
 * Generates mock data for the teacher to test the dashboard.
 */
export const generateMockStudents = async (count: number = 20): Promise<StudentProfile[]> => {
    // Generate locally to be fast and safe
    const mockNames = ["小明", "小華", "美美", "阿強", "建國", "雅婷", "冠宇", "怡君", "志豪", "淑芬"];
    const results: StudentProfile[] = [];

    for (let i = 0; i < count; i++) {
        const name = `${mockNames[i % mockNames.length]}${i + 1}`;
        // Random answers for 11 questions
        const answers = Array.from({ length: 11 }, (_, idx) => ({ 
            questionId: idx + 1, 
            answerValue: Math.floor(Math.random() * 3) + 1,
            answerText: "Mock" 
        }));
        
        const profile = await analyzeStudentProfile(name, answers);
        results.push(profile);
    }
    return results;
}