
import { StudentProfile, RoomGroup } from "../types";
import { calculateCompatibility } from "./matchingService";

/**
 * Groups students locally based on gender, preferences, and compatibility.
 * Features:
 * 1. Strict Gender Partitioning
 * 2. Preserve Existing Rooms (if requested) - NOW PROTECTS SINGLE STUDENTS
 * 3. Aggressive Mutual Match Magnet (Friends stick together)
 * 4. Habit-based sorting for remainder
 */
export const groupStudentsLocally = (students: StudentProfile[]): RoomGroup[] => {
  const groups: RoomGroup[] = [];
  
  // 1. Separate by Gender (Strict)
  const isMale = (g?: string) => {
      if (!g) return false;
      const u = g.trim().toUpperCase();
      return ['M', 'MALE', 'BOY', '男'].some(x => u === x || u.startsWith(x));
  };

  const isFemale = (g?: string) => {
      if (!g) return false;
      const u = g.trim().toUpperCase();
      return ['F', 'FEMALE', 'GIRL', '女'].some(x => u === x || u.startsWith(x));
  };

  const males = students.filter(s => isMale(s.gender));
  const females = students.filter(s => isFemale(s.gender));
  // Unknown gender goes to a separate pool
  const others = students.filter(s => !isMale(s.gender) && !isFemale(s.gender));

  // 2. Process each pool independently
  processPool(males, "男宿", 101, groups, students);
  processPool(females, "女宿", 501, groups, students);
  
  // Handle unknowns
  if (others.length > 0) {
      groups.push({
          roomId: "資料缺漏區",
          students: others,
          compatibilityScore: 0,
          reason: "⚠️ 性別資料遺失",
          potentialConflicts: "請檢查 Excel 名單或手動編輯性別"
      });
  }

  return groups;
};

/**
 * Validates manual grouping based on 'finalRoom' field.
 */
export const validateFinalGroups = (students: StudentProfile[]): RoomGroup[] => {
    const map = new Map<string, StudentProfile[]>();
    const unassigned: StudentProfile[] = [];

    students.forEach(s => {
        if (s.finalRoom && s.finalRoom.trim()) {
            const room = s.finalRoom.trim();
            if (!map.has(room)) map.set(room, []);
            map.get(room)?.push(s);
        } else {
            unassigned.push(s);
        }
    });

    const groups: RoomGroup[] = [];
    
    // Analyzed manual groups
    map.forEach((members, room) => {
        const analysis = analyzeGroup(members, false, students);
        groups.push({
            roomId: room,
            students: members,
            compatibilityScore: analysis.score,
            reason: "手動確認 (" + analysis.reason + ")",
            potentialConflicts: analysis.conflict
        });
    });

    // Bucket for unassigned
    if (unassigned.length > 0) {
        groups.push({
            roomId: "未分配/待確認",
            students: unassigned,
            compatibilityScore: 0,
            reason: "尚未輸入最終房號",
            potentialConflicts: `有 ${unassigned.length} 位學生未設定`
        });
    }

    return groups.sort((a,b) => a.roomId.localeCompare(b.roomId));
};


// --- Helper Logic ---

const processPool = (pool: StudentProfile[], prefix: string, startRoomNum: number, groups: RoomGroup[], allStudents: StudentProfile[]) => {
    if (pool.length === 0) return;

    let remaining = [...pool];
    
    // --- PHASE 1: PRESERVE EXISTING ROOMS ---
    const roomClusters = new Map<string, StudentProfile[]>();
    
    remaining.forEach(s => {
        if (s.originalRoom) {
            // Normalize room name (trim) just in case
            const rName = s.originalRoom.trim();
            if (!roomClusters.has(rName)) {
                roomClusters.set(rName, []);
            }
            roomClusters.get(rName)?.push(s);
        }
    });

    const preservedIds = new Set<string>();

    roomClusters.forEach((members, roomName) => {
        // Condition: Has ANYONE wanting to stay?
        // Logic: If Student A says "Stay", and Student B is "Neutral", keep them together.
        // Even if only 1 person exists in the quiz data for this room, we preserve it 
        // to prevent them from being thrown into the random pool.
        
        const stayers = members.filter(m => {
            const prefs = m.preferredRoommates || [];
            const wantsToStay = prefs.some(p => p.includes('續住') || p.includes('不'));
            const isNeutral = prefs.includes('隨緣') || prefs.length === 0;
            
            // Designated someone INSIDE this room? -> Treat as stay
            const designatedInside = prefs.some(p => members.some(roomie => roomie.name === p));

            return wantsToStay || isNeutral || designatedInside;
        });

        // CRITICAL FIX: Changed threshold from 2 to 1.
        // If even ONE person wants to stay (or is neutral in an existing room), we hold the room.
        // This protects small cohorts (boys) from being split if they are the only ones who took the quiz so far.
        if (stayers.length >= 1) {
             const analysis = analyzeGroup(stayers, true, allStudents); // true = isPreserved
             groups.push({
                 roomId: roomName, // Keep Original Name!
                 students: stayers,
                 compatibilityScore: analysis.score,
                 reason: "🏠 " + analysis.reason,
                 potentialConflicts: analysis.conflict
             });
             
             stayers.forEach(s => preservedIds.add(s.id));
        }
    });

    // Remove preserved students from the pool
    remaining = remaining.filter(s => !preservedIds.has(s.id));


    // --- PHASE 2: NEW GROUPING (SORT + MAGNET) ---
    
    // Initial Sort: By Sleep Time
    const getSleepScore = (s: StudentProfile) => {
        if (s.habits.sleepTime.includes('10:30')) return 1;
        if (s.habits.sleepTime.includes('02:30')) return 3;
        return 2;
    };
    remaining.sort((a, b) => getSleepScore(a) - getSleepScore(b));

    let roomCounter = startRoomNum;

    while (remaining.length > 0) {
        const size = calculateGroupSize(remaining.length);
        const currentRoom: StudentProfile[] = [];

        // 1. Seed
        currentRoom.push(remaining.shift()!);

        // 2. MAGNET LOOP
        while (currentRoom.length < size && remaining.length > 0) {
            let addedSomeone = false;

            // A. MUTUAL MAGNET (Absolute Priority)
            for (const member of currentRoom) {
                if (currentRoom.length >= size) break;

                const mutualIndex = remaining.findIndex(candidate => 
                    hasPreference(member, candidate) && hasPreference(candidate, member)
                );

                if (mutualIndex !== -1) {
                    currentRoom.push(remaining.splice(mutualIndex, 1)[0]);
                    addedSomeone = true;
                    break; 
                }
            }
            if (addedSomeone) continue;

            // B. ONE-WAY MAGNET
            for (const member of currentRoom) {
                if (currentRoom.length >= size) break;
                const targetIndex = remaining.findIndex(candidate => hasPreference(member, candidate));
                if (targetIndex !== -1) {
                    currentRoom.push(remaining.splice(targetIndex, 1)[0]);
                    addedSomeone = true;
                    break;
                }
            }
            if (addedSomeone) continue;

            // C. FALLBACK
            const bestIdx = findBestMatchIndex(currentRoom, remaining);
            if (bestIdx !== -1) {
                 currentRoom.push(remaining.splice(bestIdx, 1)[0]);
            } else {
                 currentRoom.push(remaining.shift()!);
            }
        }

        // 3. Finalize Room
        const analysis = analyzeGroup(currentRoom, false, allStudents);
        groups.push({
            roomId: `${prefix}-${roomCounter}`,
            students: currentRoom,
            compatibilityScore: analysis.score,
            reason: analysis.reason,
            potentialConflicts: analysis.conflict
        });
        roomCounter++;
    }
};

// --- Helpers ---

const calculateGroupSize = (remainingCount: number): number => {
    if (remainingCount === 5) return 3;
    if (remainingCount === 6) return 3;
    if (remainingCount === 2) return 2;
    return 4; // Default target
};

const findBestMatchIndex = (currentRoom: StudentProfile[], candidates: StudentProfile[]): number => {
    let bestIdx = -1;
    let maxScore = -9999;
    const searchLimit = Math.min(candidates.length, 10); 

    for (let i = 0; i < searchLimit; i++) {
        const candidate = candidates[i];
        let scoreSum = 0;
        
        for (const member of currentRoom) {
            scoreSum += calculateCompatibility(member, candidate).score;
        }
        const avg = scoreSum / currentRoom.length;
        if (avg > maxScore) {
            maxScore = avg;
            bestIdx = i;
        }
    }
    return bestIdx;
};

const analyzeGroup = (students: StudentProfile[], isPreserved: boolean = false, allStudentsPool?: StudentProfile[]) => {
    if (students.length <= 1) return { score: 100, reason: "單人", conflict: "" };

    let totalScore = 0;
    let pairs = 0;
    const reasons = new Set<string>();
    const conflicts = new Set<string>();
    let hasMutual = false;
    let hasStay = false;

    for (let i = 0; i < students.length; i++) {
        if (students[i].preferredRoommates?.some(p => p.includes('續住') || p.includes('不'))) {
            hasStay = true;
        }

        for (let j = i + 1; j < students.length; j++) {
            const match = calculateCompatibility(students[i], students[j]);
            totalScore += match.score;
            pairs++;
            
            match.details.forEach(d => {
                if (d.includes('衝突') || d.includes('落差') || d.includes('相反')) {
                    conflicts.add(d);
                }
            });

            if (hasPreference(students[i], students[j]) && hasPreference(students[j], students[i])) {
                hasMutual = true;
                reasons.add("互選成功");
            }
        }
        
        if (allStudentsPool) {
            students[i].preferredRoommates?.forEach(p => {
                if (['無 (隨緣)', '續住', '不想換宿舍 (續住)'].includes(p) || p.includes('不')) return;
                const exists = allStudentsPool.some(s => s.name === p);
                if (!exists) {
                    conflicts.add(`❓ ${students[i].name} 指定了不存在的對象「${p}」`);
                }
            });
        }
    }

    let avgScore = pairs > 0 ? Math.round(totalScore / pairs) : 100;
    if (avgScore > 100) avgScore = 100;

    if (isPreserved) {
        if (hasStay) reasons.add("原房續住");
        else reasons.add("保留原寢");
    } else {
        if (avgScore >= 80) reasons.add("契合度高");
    }

    if (avgScore < 60) {
        if (isPreserved) {
            conflicts.add("⚠️ 保留續住但契合度低");
        } else if (hasMutual) {
            conflicts.add("⚠️ 依互選意願安排 (契合度低)");
        } else {
            conflicts.add("需多磨合");
        }
    }

    return {
        score: avgScore,
        reason: Array.from(reasons).join('、') || "系統分配",
        conflict: Array.from(conflicts).join('。')
    };
};

const hasPreference = (a: StudentProfile, b: StudentProfile) => {
    if (!a.preferredRoommates || a.preferredRoommates.some(p => p.includes("隨緣"))) return false;
    // Flexible match: name includes name
    return a.preferredRoommates.some(name => b.name.includes(name) || name.includes(b.name));
};
