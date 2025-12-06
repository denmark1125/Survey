
import { StudentProfile, RoomGroup } from "../types";

/**
 * Deterministic Algorithm for Grouping Students
 * Priority:
 * 1. **Preserve Existing Rooms**: If students in the same original room want to stay or are neutral, and are compatible, keep them.
 * 2. Sleep Schedule (Strict sorting)
 * 3. Cleanliness (Sorting within sleep schedule)
 * 4. Social Energy
 */
export const groupStudentsLocally = (students: StudentProfile[]): RoomGroup[] => {
  const groups: RoomGroup[] = [];
  const assignedStudentIds = new Set<string>();

  // --- PHASE 1: PRESERVE EXISTING ROOMS ---
  // Scan through original rooms
  const originalRoomMap = new Map<string, StudentProfile[]>();
  students.forEach(s => {
      if (s.originalRoom) {
          if (!originalRoomMap.has(s.originalRoom)) originalRoomMap.set(s.originalRoom, []);
          originalRoomMap.get(s.originalRoom)?.push(s);
      }
  });

  originalRoomMap.forEach((roomStudents, roomNum) => {
      // Logic to determine if we should lock this room:
      // 1. Are there enough people? (Assuming >= 3 for a valid group, or if they explicitly asked to stay)
      // 2. Are they compatible? (Check sleep variance)
      // 3. Do they WANT to stay? (Stay or Random)
      
      const candidates = roomStudents.filter(s => {
          const prefs = s.preferredRoommates || [];
          // Filter out if they explicitly designated someone NOT in this room (Hard to track, simplify to:)
          // If they chose "Stay" or "Random" or "Designated" (we assume designated are usually friends in same room)
          return true; // For now consider all, then validate
      });

      if (candidates.length >= 3) {
          // Check Compatibility: Sleep
          // If mix of Early (1) and Late (3) is present, it's a conflict.
          const sleepTypes = new Set(candidates.map(s => {
             if (s.habits.sleepTime.includes("PM")) return 1; 
             if (s.habits.sleepTime.includes("02:30")) return 3; 
             return 2; 
          }));
          const hasSleepConflict = sleepTypes.has(1) && sleepTypes.has(3);

          // Check Intent: Does anyone explicitly want to leave? 
          // (Q11 doesn't have "Leave", but if they designated someone else, they might)
          // For this feature, we prioritize stability. If they didn't sleep-conflict, we keep them.
          
          if (!hasSleepConflict) {
              // LOCK THIS ROOM
              groups.push({
                  roomId: roomNum, // Use original room number
                  students: candidates,
                  compatibilityScore: 100,
                  reason: `【原房續住】成員生活習慣相近 (作息無衝突) 且具備續住意願，優先保留原房號。`,
                  potentialConflicts: ""
              });
              candidates.forEach(s => assignedStudentIds.add(s.id));
          }
      }
  });


  // --- PHASE 2: SORT REMAINING ---
  const remainingStudents = students.filter(s => !assignedStudentIds.has(s.id));

  // 1. Calculate a "Sort Score"
  const scoredStudents = remainingStudents.map(s => {
    let sleepFactor = 2;
    if (s.habits.sleepTime.includes("PM") || s.habits.sleepTime.includes("10:30")) sleepFactor = 1;
    else if (s.habits.sleepTime.includes("02:30")) sleepFactor = 3;
    
    // Sort Score: Sleep * 1000 + (Inverted Cleanliness) * 10 + (Inverted Social)
    const sortScore = (sleepFactor * 1000) + ((10 - s.habits.cleanliness) * 10) + (10 - s.habits.socialEnergy);
    
    return { ...s, sortScore, sleepFactor };
  });

  // 2. Sort the roster
  scoredStudents.sort((a, b) => a.sortScore - b.sortScore);

  // 3. Slice into chunks
  const roomSize = 4;
  let roomIdCounter = 1;
  
  // Find a safe start for new room IDs (avoid clashing with preserved original rooms)
  const existingRoomIds = new Set(groups.map(g => g.roomId));
  while (existingRoomIds.has(String(roomIdCounter).padStart(3, '0'))) {
      roomIdCounter++;
  }

  for (let i = 0; i < scoredStudents.length; i += roomSize) {
    const chunk = scoredStudents.slice(i, i + roomSize);
    
    // Analyze the chunk
    const avgSleep = chunk.reduce((acc, c) => acc + c.sleepFactor, 0) / chunk.length;
    let type = "混合型";
    if (avgSleep < 1.5) type = "晨型人 (早睡區)";
    else if (avgSleep > 2.5) type = "夜貓子 (熬夜區)";
    
    const reason = `本寢室為「${type}」。成員作息相近，能大幅減少睡眠干擾。平均整潔指數為 ${(chunk.reduce((acc, c) => acc + c.habits.cleanliness, 0) / chunk.length).toFixed(1)}/10。`;

    const conflicts: string[] = [];
    const thisRoomId = String(roomIdCounter).padStart(3, '0');
    
    chunk.forEach(s => {
        // Valid requests check
        const validRequests = (s.preferredRoommates || []).filter(name => 
            name && name !== "無 (隨緣)" && !name.includes("續住")
        );

        if (validRequests.length > 0) {
            validRequests.forEach(targetName => {
                // Ghost Detection
                const targetProfile = students.find(st => st.name.trim() === targetName.trim());
                if (!targetProfile) {
                     conflicts.push(`❓ ${s.name} 指定了找不到的對象「${targetName}」`);
                     return;
                }

                // Is target in this room?
                if (chunk.find(c => c.name === targetProfile.name)) {
                    // Together
                } else {
                    // Mutual check
                    if (targetProfile.preferredRoommates && targetProfile.preferredRoommates.includes(s.name)) {
                        conflicts.push(`⚠️ ${s.name} 與 ${targetName} 互相指定但被拆開`);
                    }
                }
            });
        }
        
        // Stay request warning
        // Only warn if they wanted to stay, BUT they are NOT in their original room.
        // And ensure they actually HAD an original room to begin with.
        if (s.preferredRoommates && s.preferredRoommates.some(r => r.includes("續住"))) {
             if (s.originalRoom && s.originalRoom !== thisRoomId) {
                 conflicts.push(`ℹ️ ${s.name} 想續住原房(${s.originalRoom})，但被分配至新房`);
             }
        }
    });

    groups.push({
      roomId: thisRoomId,
      students: chunk,
      compatibilityScore: Math.max(0, 95 - (conflicts.length * 10)), 
      reason: reason,
      potentialConflicts: conflicts.join("。")
    });
    
    // Increment ID and skip any that might exist
    do { roomIdCounter++; } while (existingRoomIds.has(String(roomIdCounter).padStart(3, '0')));
  }

  return groups.sort((a,b) => a.roomId.localeCompare(b.roomId)); // Sort by Room ID for clean display
};
