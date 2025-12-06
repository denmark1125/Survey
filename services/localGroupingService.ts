
import { StudentProfile, RoomGroup } from "../types";
import { ANIMAL_DETAILS } from "../constants";

// Helper to normalize gender strings
const normalizeGender = (g?: string): 'M' | 'F' | 'U' => {
    if (!g) return 'U';
    const s = g.trim().toUpperCase();
    if (['M', 'MALE', 'BOY', '男', '男生'].includes(s)) return 'M';
    if (['F', 'FEMALE', 'GIRL', '女', '女生'].includes(s)) return 'F';
    return 'U';
};

const calculateScore = (group: StudentProfile[]) => {
    let score = 100;
    // Simple habit comparison logic
    let avgSleep = 0;
    let avgClean = 0;
    group.forEach(s => {
        avgSleep += s.habits.sleepTime.includes("AM") ? 3 : 1; 
        avgClean += s.habits.cleanliness;
    });
    avgSleep /= group.length;
    avgClean /= group.length;

    // Deduct points for variance
    group.forEach(s => {
        const sleep = s.habits.sleepTime.includes("AM") ? 3 : 1;
        score -= Math.abs(sleep - avgSleep) * 10;
        score -= Math.abs(s.habits.cleanliness - avgClean) * 2;
    });

    return Math.max(0, Math.round(score));
};

export const groupStudentsLocally = (allStudents: StudentProfile[]): RoomGroup[] => {
    // 1. Partition by Gender
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
    const processGroup = (students: StudentProfile[], prefix: string): RoomGroup[] => {
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
            if (occupants.length >= 3) { // Only preserve if enough people
                // Check if they want to stay or don't care
                const stayVotes = occupants.filter(s => 
                    s.preferredRoommates?.some(r => r.includes("續住") || r.includes("不")) || 
                    s.preferredRoommates?.includes("無 (隨緣)") ||
                    (!s.preferredRoommates || s.preferredRoommates.length === 0)
                ).length;
                
                // If majority implies staying, lock them
                if (stayVotes >= occupants.length / 2) {
                    groups.push({
                        roomId: roomId, // Keep original room ID
                        students: occupants,
                        compatibilityScore: calculateScore(occupants),
                        reason: `【原房續住】保留原寢室 ${roomId} 成員 (${occupants.length}人)`,
                        potentialConflicts: ""
                    });
                    // Remove form remaining
                    remaining = remaining.filter(s => !occupants.includes(s));
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
            const roomId = `${prefix}-${roomCount++}`;
            
            // Logic to check Mutual Matches and Ghosts
            let conflicts: string[] = [];
            let mutualTags: string[] = [];

            // Check Ghost Names (Requested someone not in list)
            chunk.forEach(s => {
                s.preferredRoommates?.forEach(reqName => {
                    if (!['無 (隨緣)', '續住', '不想換宿舍 (續住)'].includes(reqName) && !reqName.includes('不')) {
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
                     if (s.originalRoom && s.originalRoom !== roomId) { // Note: roomId might be different format, heuristic check
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

    // Execute logic for each gender
    return [
        ...processGroup(males, 'M'),
        ...processGroup(females, 'F'),
        ...processGroup(unknown, 'U')
    ];
};
