import { StudentProfile } from "../types";

export interface MatchResult {
  score: number;
  details: string[];
}

/**
 * Calculates a compatibility score (0-100) between two students.
 * Weighted Logic:
 * - Sleep Cycle: 40% (Critical)
 * - Cleanliness: 20%
 * - Social Energy: 20%
 * - Noise Tolerance: 10%
 * - Temperature (if available in raw answers, implied): 10%
 */
export const calculateCompatibility = (s1: StudentProfile, s2: StudentProfile): MatchResult => {
  let score = 100;
  const details: string[] = [];

  // 1. Sleep Schedule (Max penalty: 40)
  // Converting string "10:30 PM" etc back to rough integers for comparison isn't ideal, 
  // so we look at the raw answers if available, or parse the habits.
  // We'll use a simplified heuristic based on the stored 'habits' metric implicitly or raw answers.
  
  // Let's rely on raw answers for precision if possible.
  const getAns = (p: StudentProfile, qId: number) => p.rawAnswers?.find(a => a.questionId === qId)?.answerValue || 2;

  const s1Sleep = getAns(s1, 1); // 1: Early, 3: Late
  const s2Sleep = getAns(s2, 1);
  const sleepDiff = Math.abs(s1Sleep - s2Sleep);
  
  if (sleepDiff === 2) { // Extreme opposite (Early vs Late)
    score -= 40;
    details.push("作息時間完全相反 (早睡 vs 熬夜)");
  } else if (sleepDiff === 1) {
    score -= 15;
  } else {
    details.push("作息時間相近");
  }

  // 2. Cleanliness (Max penalty: 20)
  const cleanDiff = Math.abs(s1.habits.cleanliness - s2.habits.cleanliness);
  // scale is 1-10. Max diff is 9.
  const cleanPenalty = (cleanDiff / 9) * 20;
  score -= cleanPenalty;
  if (cleanDiff > 4) details.push("整潔習慣有明顯落差");

  // 3. Social Energy (Max penalty: 20)
  // Sometimes opposites attract, but in dorms, high energy vs low energy can be annoying.
  const socialDiff = Math.abs(s1.habits.socialEnergy - s2.habits.socialEnergy);
  const socialPenalty = (socialDiff / 9) * 20;
  score -= socialPenalty;

  // 4. Temperature Preference (Max penalty: 20) - Using Q9
  const s1Temp = getAns(s1, 9);
  const s2Temp = getAns(s2, 9);
  const tempDiff = Math.abs(s1Temp - s2Temp);
  
  if (tempDiff === 2) { // 1 (Cold) vs 3 (Hot)
    score -= 20;
    details.push("冷氣溫度需求衝突 (怕冷 vs 怕熱)");
  } else if (tempDiff === 1) {
    score -= 5;
  }

  // Bonus: Designated Roommate
  if (s1.preferredRoommates?.includes(s2.name) || s2.preferredRoommates?.includes(s1.name)) {
    score = 100; // Override
    details.push("✨ 雙方指定室友");
  }

  return {
    score: Math.max(0, Math.round(score)),
    details
  };
};

/**
 * Finds the top 3 matches and bottom 1 match for a specific student.
 */
export const findBestMatches = (target: StudentProfile, allStudents: StudentProfile[]) => {
  // GENDER FILTER: Only match with same gender (or Unknown if Unknown)
  const candidates = allStudents.filter(s => {
      if (s.id === target.id) return false;
      
      const normalize = (g?: string) => {
          if (!g) return 'U';
          const u = g.toUpperCase();
          if (u.startsWith('M') || u.includes('男')) return 'M';
          if (u.startsWith('F') || u.includes('女')) return 'F';
          return 'U';
      };

      const targetG = normalize(target.gender);
      const candidateG = normalize(s.gender);

      if (targetG === 'U' || candidateG === 'U') return true; // Allow matching if gender is missing
      return targetG === candidateG; // Strict same-sex matching
  });
  
  const scored = candidates.map(c => ({
    student: c,
    ...calculateCompatibility(target, c)
  }));

  // Sort descending
  scored.sort((a, b) => b.score - a.score);

  return {
    best: scored.slice(0, 3),
    worst: scored[scored.length - 1]
  };
};