
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnimalType, QuizAnswer, StudentProfile, RoomGroup } from "../types";
import { ANIMAL_DETAILS } from "../constants";

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
  
  // Parse Preferred Roommates (Array)
  let preferredRoommates: string[] = [];
  
  if (prefAns?.answerValue === 2 && prefAns.extraText) {
      // Split comma separated names, trim whitespace, remove empty
      preferredRoommates = prefAns.extraText.split(',')
          .map(n => n.trim())
          .filter(n => n.length > 0);
  } else if (prefAns?.answerValue === 3) {
      preferredRoommates = ["不想換宿舍 (續住)"];
  } else {
      preferredRoommates = ["無 (隨緣)"];
  }

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
  // 2. RABBIT Logic (New: Sensitive to noise + Introvert)
  // Needs to be sensitive to noise (1) and like solitude (1)
  else if (noise === 1 && freeTime === 1) {
    type = AnimalType.RABBIT;
    traits.push("對聲音敏感", "慢熟", "需要安靜");
  }
  // 3. Sleep Dominance (Owl vs Lark)
  else if (sleepTime === 3 && weekend >= 2) {
    type = AnimalType.OWL;
    traits.push("越夜越美麗", "靈感型");
  } else if (sleepTime === 1) {
    type = AnimalType.LARK;
    traits.push("晨間效率派", "規律作息");
  } else {
    // 4. Personality Dominance
    if (cleanScore >= 5 && sharing === 1) {
      type = AnimalType.CAT;
      traits.push("極度愛乾淨", "重視隱私");
    } else if (socialScore >= 5) { // Updated from 7 to 5 based on user feedback
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
  
  if (prefAns?.answerValue === 2) traits.push("已有指定室友");
  if (prefAns?.answerValue === 3) traits.push("續住意願");

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
    preferredRoommates: preferredRoommates,
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
 * Takes a list of student profiles and groups them into rooms using Gemini AI.
 */
export const generateRoomGroups = async (students: StudentProfile[]): Promise<RoomGroup[]> => {
  // Initialize Gemini ONLY when needed, to prevent crash on load if key is missing
  if (!process.env.API_KEY) {
      throw new Error("請先設定 Google Gemini API Key (API_KEY)");
  }
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

  const rosterData = students.map(s => ({
    id: s.id,
    name: s.name,
    gender: s.gender,
    animal: s.animalName,
    preferredRoommates: s.preferredRoommates,
    traits: s.traits, 
    habits: s.habits
  }));

  const prompt = `
    你是一位專業的大學宿舍分配協調員。
    我有 ${students.length} 位學生。
    請將他們分配到最合適的寢室，每間房 3 到 4 人（優先以 4 人一間為主）。
    
    分組規則：
    1. **關鍵**：檢查 'preferredRoommates' (指定室友)。如果 A 想跟 B 住，請務必將他們安排在同一間。
    2. 作息時間 (Sleep schedules) 必須一致（早睡配早睡，熬夜配熬夜）。這是最重要的生理指標。
    3. 整潔度 (Cleanliness) 應該要相近。
    4. 社交能量 (Social energy) 應該要相容（例如：不要把一個極度內向的人跟三個喜歡開派對的人放在一起）。
    5. **嚴格禁止**男女混宿 (Check 'gender' field)。男生跟男生住，女生跟女生住。
    
    請回傳 JSON 格式。
    **重要：回傳結果中的所有文字描述 (reason, potentialConflicts) 必須完全使用「繁體中文」 (Traditional Chinese) 撰寫。**
    
    學生名單：
    ${JSON.stringify(rosterData)}
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
 * NEW: Analyzes EXISTING room groups (e.g. from Manual Final Assignment) using AI.
 */
export const analyzeExistingGroups = async (groups: RoomGroup[]): Promise<RoomGroup[]> => {
    if (!process.env.API_KEY) {
        throw new Error("請先設定 Google Gemini API Key");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // We only need Gemini to fill in 'compatibilityScore', 'reason', and 'potentialConflicts'
    // The grouping is already done.
    
    const analysisSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            analyzedGroups: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        roomId: { type: Type.STRING },
                        compatibilityScore: { type: Type.NUMBER },
                        reason: { type: Type.STRING },
                        potentialConflicts: { type: Type.STRING }
                    },
                    required: ["roomId", "compatibilityScore", "reason", "potentialConflicts"]
                }
            }
        },
        required: ["analyzedGroups"]
    };

    const roomsData = groups.map(g => ({
        roomId: g.roomId,
        students: g.students.map(s => ({
            name: s.name,
            gender: s.gender,
            animal: s.animalName,
            habits: s.habits,
            preferred: s.preferredRoommates
        }))
    }));

    const prompt = `
        我已經手動將學生分好房間了。請你幫我針對每一間房進行「健康檢查」。
        請依據學生的生活習慣數據，計算他們的契合度分數 (0-100)，並用繁體中文給出分析評語。
        
        重點觀察：
        1. 睡眠時間是否衝突？
        2. 是否有人際關係問題（如指定室友未同房，或互斥）？
        3. 性別是否混宿（若有請標註嚴重警告）？
        
        房客資料：
        ${JSON.stringify(roomsData)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        const result = JSON.parse(response.text);
        
        // Merge AI analysis back into original groups
        return groups.map(g => {
            const analysis = result.analyzedGroups.find((ag: any) => ag.roomId === g.roomId);
            if (analysis) {
                return {
                    ...g,
                    compatibilityScore: analysis.compatibilityScore,
                    reason: analysis.reason,
                    potentialConflicts: analysis.potentialConflicts
                };
            }
            return g;
        });

    } catch (error) {
        console.error("AI Analysis failed:", error);
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
        const answers: QuizAnswer[] = Array.from({ length: 11 }, (_, idx) => ({ 
            questionId: idx + 1, 
            answerValue: Math.floor(Math.random() * 3) + 1,
            answerText: "Mock",
            extraText: undefined 
        }));
        
        // Mock Q11 logic properly to test dashboard filters
        const q11 = answers.find(a => a.questionId === 11);
        if (q11) {
             const r = Math.random();
             if (r > 0.8) {
                 q11.answerValue = 3; // Stay
             } else if (r > 0.7) {
                 q11.answerValue = 2; // Designated
                 q11.extraText = `好友${i}`;
             } else {
                 q11.answerValue = 1; // Random
                 q11.extraText = undefined; 
             }
        }

        const profile = await analyzeStudentProfile(name, answers);
        results.push(profile);
    }
    return results;
}
