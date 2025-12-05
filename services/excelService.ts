import * as XLSX from 'xlsx';
import { StudentProfile, RoomGroup, OfficialStudent, QuizAnswer } from '../types';
import { QUIZ_QUESTIONS } from '../constants';

/**
 * Parses an uploaded Excel file to extract the student roster.
 * Looks for columns: "姓名" (Name) and optional "房號" (Room) or "學號" (ID).
 */
export const parseRosterFile = async (file: File): Promise<OfficialStudent[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON array of arrays or objects
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        // Map loose column names to strict interface
        const roster: OfficialStudent[] = json.map((row: any) => ({
          // Try various common column headers for Name
          name: (row['姓名'] || row['Name'] || row['學生姓名'] || '').toString().trim(),
          originalRoom: (row['房號'] || row['Room'] || row['原寢室'] || '').toString().trim(),
          studentId: (row['學號'] || row['ID'] || '').toString().trim()
        })).filter(s => s.name.length > 0); // Filter out empty rows

        resolve(roster);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

/**
 * Downloads a template Excel file for the teacher to fill out.
 */
export const downloadRosterTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  // Create headers and some dummy example data
  const ws_data = [
    ["姓名", "房號", "學號"], // Required Headers
    ["王小明", "101", "A112001"], // Example 1
    ["陳大文", "102", "A112002"], // Example 2
    ["(請將範例資料刪除後，貼上您的學生名單)", "", ""] // Instruction
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  
  // Set column widths for better readability
  ws['!cols'] = [
    { wch: 15 }, // Name width
    { wch: 10 }, // Room width
    { wch: 15 }  // ID width
  ];

  XLSX.utils.book_append_sheet(wb, ws, "名單匯入範本");
  XLSX.writeFile(wb, "學生名單匯入範本.xlsx");
};

/**
 * Exports all system data into a comprehensive Excel file.
 * Sheets:
 * 1. 總表 (Overview): Name, Animal, Habits, RoommatePref, Status
 * 2. 分組結果 (Grouping): New Room, Name, Reason
 * 3. 原始問卷 (Raw Data): Name, Q1..Q11
 */
export const exportDashboardToExcel = (students: StudentProfile[], groups: RoomGroup[], missingStudents: string[]) => {
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: 學生概況 (Overview) ---
  const overviewData = students.map(s => ({
    "姓名": s.name,
    "測驗結果": s.animalName,
    "指定室友": s.preferredRoommates ? s.preferredRoommates.join(", ") : '',
    "作息(睡覺)": s.habits.sleepTime,
    "整潔度(1-10)": s.habits.cleanliness,
    "社交能量(1-10)": s.habits.socialEnergy,
    "特質標籤": s.traits.join(", ")
  }));
  
  // Add missing students to the bottom of overview
  missingStudents.forEach(name => {
      overviewData.push({
          "姓名": name,
          "測驗結果": "尚未測驗",
          "指定室友": "-",
          "作息(睡覺)": "-",
          "整潔度(1-10)": 0,
          "社交能量(1-10)": 0,
          "特質標籤": "缺席"
      });
  });

  const wsOverview = XLSX.utils.json_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, "學生概況總表");


  // --- SHEET 2: 分組結果 (Grouping) ---
  if (groups.length > 0) {
      const groupingData: any[] = [];
      groups.forEach(g => {
          g.students.forEach(s => {
              groupingData.push({
                  "分配寢室": g.roomId,
                  "姓名": s.name,
                  "動物人格": s.animalName,
                  "契合度": `${g.compatibilityScore}%`,
                  "分組理由": g.reason,
                  "潛在衝突": g.potentialConflicts
              });
          });
      });
      const wsGrouping = XLSX.utils.json_to_sheet(groupingData);
      XLSX.utils.book_append_sheet(wb, wsGrouping, "分組結果建議");
  }

  // --- SHEET 3: 原始問卷 (Raw Data) ---
  const rawData = students.map(s => {
      const row: any = { "姓名": s.name };
      // Sort answers to ensure Q1, Q2... order
      const answers = s.rawAnswers?.sort((a, b) => a.questionId - b.questionId) || [];
      
      answers.forEach(a => {
          row[`Q${a.questionId}`] = `${a.answerValue} - ${a.answerText} ${a.extraText ? '(' + a.extraText + ')' : ''}`;
      });
      
      // Fill Q11 explicitly if missing (legacy data)
      if (!row['Q11']) {
        row['Q11'] = s.preferredRoommates ? s.preferredRoommates.join(", ") : '';
      }

      return row;
  });
  const wsRaw = XLSX.utils.json_to_sheet(rawData);
  XLSX.utils.book_append_sheet(wb, wsRaw, "原始問卷資料");

  // Write file
  XLSX.writeFile(wb, `宿舍測驗結果報表_${new Date().toLocaleDateString()}.xlsx`);
};