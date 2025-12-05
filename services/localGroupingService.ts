import { StudentProfile, RoomGroup } from "../types";

/**
 * Deterministic Algorithm for Grouping Students
 * Priority:
 * 1. Sleep Schedule (Strict sorting)
 * 2. Cleanliness (Sorting within sleep schedule)
 * 3. Social Energy
 * 
 * Note: Mutual matching is handled as a "Soft Factor" - meaning if A and B want each other,
 * but have drastically different sleep schedules, they might be separated, but a warning flag is raised.
 */
export const groupStudentsLocally = (students: StudentProfile[]): RoomGroup[] => {
  // 1. Calculate a "Sort Score" for every student
  // Sleep is the most significant digit (100s place), then Cleanliness (10s), then Social (1s)
  // Lower score = Early Bird / Cleaner
  
  const scoredStudents = students.map(s => {
    // Determine Sleep Factor (using habits string logic or raw if needed, lets use raw inferred)
    let sleepFactor = 2;
    if (s.habits.sleepTime.includes("PM") || s.habits.sleepTime.includes("10:30")) sleepFactor = 1;
    else if (s.habits.sleepTime.includes("02:30")) sleepFactor = 3;
    
    const sortScore = (sleepFactor * 1000) + ((10 - s.habits.cleanliness) * 10) + (10 - s.habits.socialEnergy);
    
    return { ...s, sortScore, sleepFactor };
  });

  // 2. Sort the roster
  scoredStudents.sort((a, b) => a.sortScore - b.sortScore);

  // 3. Slice into chunks of 4 (or 3 if remainder)
  const groups: RoomGroup[] = [];
  const roomSize = 4;
  let roomIdCounter = 1;

  for (let i = 0; i < scoredStudents.length; i += roomSize) {
    const chunk = scoredStudents.slice(i, i + roomSize);
    
    // Analyze the chunk
    const avgSleep = chunk.reduce((acc, c) => acc + c.sleepFactor, 0) / chunk.length;
    let type = "混合型";
    if (avgSleep < 1.5) type = "晨型人 (早睡區)";
    else if (avgSleep > 2.5) type = "夜貓子 (熬夜區)";
    
    // Generate Reason
    const reason = `本寢室為「${type}」。成員作息相近，能大幅減少睡眠干擾。平均整潔指數為 ${(chunk.reduce((acc, c) => acc + c.habits.cleanliness, 0) / chunk.length).toFixed(1)}/10。`;

    // Check for Conflicts and Matches
    const conflicts: string[] = [];
    
    chunk.forEach(s => {
        // Only check valid requests (ignore "None" and "Stay")
        const validRequests = s.preferredRoommates.filter(name => 
            name !== "無 (隨緣)" && !name.includes("續住")
        );

        if (validRequests.length > 0) {
            validRequests.forEach(targetName => {
                // 1. Ghost Detection: Does this target exist in the entire class?
                const targetProfile = students.find(st => st.name === targetName);
                if (!targetProfile) {
                     conflicts.push(`❓ ${s.name} 指定了找不到的對象「${targetName}」，請確認姓名`);
                     return;
                }

                // 2. Is target in this room?
                if (chunk.find(c => c.name === targetName)) {
                    // Good, they are together.
                } else {
                    // Warning: Target is NOT in this room.
                    // 3. Check if it was Mutual (Did target also want s?)
                    if (targetProfile.preferredRoommates.includes(s.name)) {
                        conflicts.push(`⚠️ ${s.name} 與 ${targetName} 互相指定，但因作息差異被拆開`);
                    }
                }
            });
        }
        
        // Stay request warning if moved? (Assuming current logic moves everyone)
        if (s.preferredRoommates.some(r => r.includes("續住"))) {
             conflicts.push(`ℹ️ ${s.name} 提出續住需求，請確認是否原房`);
        }
    });

    groups.push({
      roomId: String(roomIdCounter).padStart(3, '0'),
      students: chunk,
      compatibilityScore: 90 - (conflicts.length * 5), 
      reason: reason,
      potentialConflicts: conflicts.join("。")
    });

    roomIdCounter++;
  }

  return groups;
};