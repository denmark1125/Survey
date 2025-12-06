
import { StudentProfile, RoomGroup } from "../types";
import { ANIMAL_DETAILS } from "../constants";

// Helper to normalize gender strings
const normalizeGender = (g?: string): 'M' | 'F' | 'U' => {
    if (!g) return 'U';
    const s = g.replace(/\s+/g, '').trim().toUpperCase(); // Strict clean
    if (['M', 'MALE', 'BOY', '男', '男生'].includes(s)) return 'M';
    if (['F', 'FEMALE', 'GIRL', '女', '女生'].includes(s)) return 'F';
    return 'U';
};

/**
 * Advanced Score Calculation for a group of students.
 * Base Score: 100
 * Penalties: Variance in habits (Sleep is heavily penalized)
 * Bonuses: Mutual preferences, Preserved room status
 */
const calculateScore = (group: StudentProfile[], isPreservedRoom: boolean = false) => {
    if (group.length < 2) return 100; // Single person is perfectly compatible with themselves

    let score = 100;
    
    // 1. Calculate Averages
    let sumSleep = 0; // 1 (Early) to 3 (Late)
    let sumClean = 0; // 1-10
    let sumSocial = 0; // 1-10
    let sumNoise = 0; // 1-10

    group.forEach(s => {
        sumSleep += s.habits.sleepTime.includes("PM") ? 1 : 3; 
        sumClean += s.habits.cleanliness;
        sumSocial += s.habits.socialEnergy;
        sumNoise += s.habits.noiseTolerance;
    });

    const avgSleep = sumSleep / group.length;
    const avgClean = sumClean / group.length;
    const avgSocial = sumSocial / group.length;
    const avgNoise = sumNoise / group.length;

    // 2. Calculate Penalties (Variance)
    let totalSleepDiff = 0;
    let totalCleanDiff = 0;
    let totalSocialDiff = 0;
    let totalNoiseDiff = 0;

    group.forEach(s => {
        const sleepVal = s.habits.sleepTime.includes("PM") ? 1 : 3;
        totalSleepDiff += Math.abs(sleepVal - avgSleep);
        totalCleanDiff += Math.abs(s.habits.cleanliness - avgClean);
        totalSocialDiff += Math.abs(s.habits.socialEnergy - avgSocial);
        totalNoiseDiff += Math.abs(s.habits.noiseTolerance - avgNoise);
    });

    // Weights: Sleep is critical (x15), Clean/Noise (x2), Social (x1)
    // Sleep diff max is roughly 1 per person. x15 means heavy penalty for mixed sleep schedules.
    score -= (totalSleepDiff * 15); 
    score -= (totalCleanDiff * 2);
    score -= (totalNoiseDiff * 2);
    score -= (totalSocialDiff * 1);

    // 3. Bonuses
    // Bonus for Preserved Room (Stability)
    if (isPreservedRoom) score += 10;

    // Bonus for Mutual Preferences
    // Check pairs
    for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
            const s1 = group[i];
            const s2 = group[j];
            if (s1.preferredRoommates?.includes(s2.name) || s2.preferredRoommates?.includes(s1.name)) {
                score += 5; // +5 for each satisfied preference link
            }
        }
    }

    // Clamp score 0-100
    return Math.min(100, Math.max(0, Math.round(score)));
};

export const groupStudentsLocally = (allStudents: StudentProfile[]): RoomGroup[] => {
    // 1. Partition by Gender - STRICT SEPARATION
    const males: StudentProfile[] = [];
    const females: StudentProfile[] = [];
    const unknown: StudentProfile[] = [];

    allStudents.forEach(s => {
        const g = normalizeGender(s.gender);
        if (g === 'M') males.push(s);
        else if (g === 'F') females.push(s);
        else unknown.push(s);
    });

    // Helper to process a single gender group
    const processGroup = (students: StudentProfile[], prefixName: string): RoomGroup[] => {
        const groups: RoomGroup[] = [];
        let remaining = [...students];

        // --- PHASE 1: PRESERVE EXISTING ROOMS ---
        // Group by original room
        const roomMap = new Map<string, StudentProfile[]>();
        remaining.forEach(s => {
            if (s.originalRoom) {
                if (!roomMap.has(s.originalRoom)) roomMap.set(s.originalRoom, []);
                roomMap.get(s.originalRoom)?.push(s);
            }
        });

        // Evaluate each existing room
        roomMap.forEach((occupants, roomId) => {
            // Only try to preserve if we have enough people (e.g. at least 2)
            if (occupants.length >= 2) { 
                
                // For simplicity & robustness: 
                // We preserve the subset of occupants who:
                // 1. Want to "Stay" OR
                // 2. Are "Neutral/Random" OR
                // 3. Designated someone who IS ALSO in the room.
                
                const candidates = occupants.filter(s => {
                    const prefs = s.preferredRoommates || [];
                    const wantsToStay = prefs.some(r => r.includes("續住") || r.includes("不"));
                    const isNeutral = prefs.includes("無 (隨緣)") || prefs.length === 0;
                    
                    // Specific names designated
                    const designatedNames = prefs.filter(r => !r.includes("續住") && !r.includes("不") && !r.includes("無 (隨緣)"));
                    const designatedInRoom = designatedNames.length > 0 && designatedNames.every(name => occupants.some(o => o.name === name));
                    
                    // If they designated someone, they only stay if that person is here. 
                    // If they didn't designate anyone, they stay if they are neutral or explicitly want to stay.
                    return wantsToStay || isNeutral || designatedInRoom;
                });

                // --- REVISED LOGIC: PRESERVE EVEN IF SCORE IS LOW ---
                // If candidates >= 2, we lock them in to respect their wish to stay (or lack of wish to move).
                if (candidates.length >= 2) {
                     const score = calculateScore(candidates, true);
                     let reason = `【原房續住】保留原寢室 ${roomId} 成員 (${candidates.length}人)`;
                     let warnings = "";
                     
                     // Compatibility Check (Threshold: 60)
                     if (score < 60) {
                         reason += " (⚠️ 契合度偏低)";
                         warnings = `⚠️ 注意：雖然學生選擇續住，但生活習慣契合度僅 ${score}%，未來可能產生摩擦。`;
                         
                         // Add specific conflict details
                         const hasEarly = candidates.some(s => s.habits.sleepTime.includes("PM"));
                         const hasLate = candidates.some(s => s.habits.sleepTime.includes("AM"));
                         if (hasEarly && hasLate) warnings += " (作息衝突)";
                     } else {
                         reason += " - 生活習慣契合";
                     }

                     groups.push({
                        roomId: roomId, // Keep original room ID (e.g., 101)
                        students: candidates,
                        compatibilityScore: score,
                        reason: reason,
                        potentialConflicts: warnings
                     });
                     
                     // Remove from remaining
                     remaining = remaining.filter(s => !candidates.includes(s));
                }
            }
        });

        // --- PHASE 2: SORT & SLICE REMAINING ---
        // Sort criteria: 1. Sleep Time (Early to Late), 2. Cleanliness
        remaining.sort((a, b) => {
            // Sleep: Early (1) < Late (3)
            const sleepA = a.habits.sleepTime.includes("PM") ? 1 : 3;
            const sleepB = b.habits.sleepTime.includes("PM") ? 1 : 3;
            if (sleepA !== sleepB) return sleepA - sleepB;
            
            // Cleanliness: High to Low
            return b.habits.cleanliness - a.habits.cleanliness;
        });

        // Slice into chunks of 4 (preferred) or 3
        let roomCount = 1;
        while (remaining.length > 0) {
            let size = 4;
            // Adjustment for remainders to avoid solo rooms
            if (remaining.length === 5 || remaining.length === 6) size = 3; 

            const chunk = remaining.splice(0, size);
            
            // Format: "男宿-01", "女宿-01"
            const roomId = `${prefixName}-${String(roomCount++).padStart(2, '0')}`;
            
            // Logic to check Mutual Matches and Ghosts
            let conflicts: string[] = [];

            // Check Ghost Names (Requested someone not in list)
            chunk.forEach(s => {
                s.preferredRoommates?.forEach(reqName => {
                    if (!['無 (隨緣)', '續住', '不想換宿舍 (續住)'].includes(reqName) && !reqName.includes('不')) {
                        // Check if the requested name exists in the FULL student list (not just this chunk)
                        const exists = allStudents.some(poolS => poolS.name === reqName);
                        if (!exists) {
                            conflicts.push(`❓ ${s.name} 指定了「${reqName}」但名單中找不到此人`);
                        }
                    }
                });
            });

            // Check if someone wanted to stay but got moved
            chunk.forEach(s => {
                if (s.preferredRoommates?.some(r => r.includes("續住") || r.includes("不"))) {
                     if (s.originalRoom && s.originalRoom !== roomId) { 
                        conflicts.push(`⚠️ ${s.name} 想續住 (原:${s.originalRoom}) 但被分配到新房`);
                     }
                }
            });

            // Detect Compatibility issues
            const hasEarly = chunk.some(s => s.habits.sleepTime.includes("PM"));
            const hasLate = chunk.some(s => s.habits.sleepTime.includes("AM"));
            if (hasEarly && hasLate) conflicts.push("⚠️ 作息衝突：早睡與熬夜混住");

            groups.push({
                roomId: roomId,
                students: chunk,
                compatibilityScore: calculateScore(chunk),
                reason: `依生活作息排序分配 (${hasEarly ? '早睡' : '晚睡'}組)`,
                potentialConflicts: conflicts.join("。 ")
            });
        }
        return groups;
    };

    // Execute logic for each gender separately
    // If unknown gender, put them in a special warning group
    const unknownGroups: RoomGroup[] = [];
    if (unknown.length > 0) {
        unknownGroups.push({
            roomId: "⚠️待確認",
            students: unknown,
            compatibilityScore: 0,
            reason: "資料缺漏：請檢查 Excel 是否包含正確性別",
            potentialConflicts: "無法進行性別分流"
        });
    }

    return [
        ...processGroup(males, '男宿'),
        ...processGroup(females, '女宿'),
        ...unknownGroups
    ];
};