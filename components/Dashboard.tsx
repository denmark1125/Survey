
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Login from './Login';
import StudentDetailModal from './StudentDetailModal';
import { generateRoomGroups, generateMockStudents } from '../services/geminiService';
import { groupStudentsLocally, validateFinalGroups } from '../services/localGroupingService';
import { fetchClassroomData, clearDatabase, deleteStudent, updateStudentName, updateStudentGender, saveOfficialRoster, fetchOfficialRoster, updateStudentFinalRoom, bulkUpdateFinalRooms } from '../services/dbService';
import { parseRosterFile, exportDashboardToExcel, downloadRosterTemplate } from '../services/excelService';
import { StudentProfile, RoomGroup, AnimalType, OfficialStudent } from '../types';
import { ANIMAL_DETAILS } from '../constants';
import { Users, Wand2, CloudDownload, Trash2, AlertTriangle, CheckCircle2, LogOut, Clock, Ghost, BarChart3, Moon, Sun, Home, UserCheck, Sparkles, Zap, Upload, FileSpreadsheet, UserX, AlertCircle, Download, XCircle, HeartPulse, Pencil, Key, FileInput } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [groups, setGroups] = useState<RoomGroup[]>([]);
  
  // Roster Management State
  const [officialRoster, setOfficialRoster] = useState<OfficialStudent[]>([]);
  const [rosterUpdatedAt, setRosterUpdatedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const finalRoomInputRef = useRef<HTMLInputElement>(null);

  // Status states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'DESIGNATED' | 'STAY' | 'MISSING'>('ALL');

  // Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  // --- Statistics Logic (useMemo) ---
  const stats = useMemo(() => {
      const total = students.length || 1;
      const owls = students.filter(s => s.animalType === AnimalType.OWL).length;
      const larks = students.filter(s => s.animalType === AnimalType.LARK).length;
      
      // Calculate based on the array
      const stayRequest = students.filter(s => s.preferredRoommates?.some(r => r.includes('續住') || r.includes('不'))).length;
      
      const designated = students.filter(s => {
          const prefs = s.preferredRoommates || [];
          return prefs.length > 0 && !prefs.includes('隨緣') && !prefs.some(r => r.includes('續住'));
      }).length;
      
      const avgClean = Math.round(students.reduce((acc, s) => acc + (s.habits?.cleanliness || 5), 0) / total * 10) / 10;

      return { owls, larks, stayRequest, designated, avgClean };
  }, [students]);

  // --- Missing Students Logic ---
  const missingStudents = useMemo(() => {
      if (officialRoster.length === 0) return [];
      
      // Normalize names for comparison (remove ALL spaces, lowercase)
      const normalize = (n: string) => n.replace(/\s+/g, '').toLowerCase();
      const takenQuizNames = new Set(students.map(s => normalize(s.name)));
      
      return officialRoster.filter(official => {
          const normalizedOfficial = normalize(official.name);
          return !takenQuizNames.has(normalizedOfficial);
      });
  }, [students, officialRoster]);

  // --- Filtering Logic ---
  const filteredStudents = useMemo(() => {
      switch (filterTab) {
          case 'STAY': return students.filter(s => s.preferredRoommates?.some(r => r.includes('續住') || r.includes('不')));
          case 'DESIGNATED': return students.filter(s => {
              const prefs = s.preferredRoommates || [];
              return prefs.length > 0 && !prefs.includes('隨緣') && !prefs.some(r => r.includes('續住'));
          });
          case 'MISSING': return []; // Handled separately in UI
          default: return students;
      }
  }, [students, filterTab]);

  // --- Handlers ---

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError('');
    try {
        // Fetch both students AND the official roster from cloud
        const [cloudStudents, rosterData] = await Promise.all([
            fetchClassroomData(),
            fetchOfficialRoster()
        ]);
        
        setStudents(cloudStudents);
        setOfficialRoster(rosterData.students);
        if (rosterData.updatedAt) {
            setRosterUpdatedAt(new Date(rosterData.updatedAt).toLocaleString('zh-TW', { hour12: false }));
        }
        
        setLastSyncedTime(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }));
        console.log("Synced successfully. Students:", cloudStudents.length, "Roster:", rosterData.students.length);
    } catch (e: any) {
        setSyncError(e.message || '讀取失敗');
        console.error("Sync failed", e);
    } finally {
        setIsSyncing(false);
    }
  };

  const handleGenerateMock = async () => {
    setIsSyncing(true);
    try {
      const mockData = await generateMockStudents(12); 
      setStudents(prev => [...prev, ...mockData]);
    } catch (e) {
      alert("生成失敗");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAnalyzeLocal = () => {
      if (students.length < 2) { // Allow smaller groups for testing
        alert("學生人數不足，無法分組");
        return;
      }
      setIsGrouping(true);

      // Helper to clean strings (Remove ALL spaces)
      const normalize = (n: string) => n.replace(/\s+/g, '').toLowerCase();

      // Pre-processing: Merge originalRoom AND GENDER from officialRoster if available
      const enhancedStudents = students.map(s => {
          const normalizedStudentName = normalize(s.name);
          
          const rosterInfo = officialRoster.find(r => 
              normalize(r.name) === normalizedStudentName
          );
          
          return {
              ...s,
              originalRoom: rosterInfo?.originalRoom ? String(rosterInfo.originalRoom) : s.originalRoom,
              // PRIORITY: Roster > DB (unless Unknown)
              // If roster has valid gender, use it. Otherwise fall back to DB.
              gender: rosterInfo?.gender || s.gender || "Unknown"
          };
      });

      setTimeout(() => {
          try {
              const result = groupStudentsLocally(enhancedStudents);
              setGroups(result);
          } catch(e) {
              console.error(e);
              alert("分組運算錯誤");
          } finally {
              setIsGrouping(false);
          }
      }, 600);
  };

  const handleValidateFinal = () => {
      if (students.length < 2) return;
      setIsGrouping(true);
      setTimeout(() => {
          try {
              const result = validateFinalGroups(students);
              setGroups(result);
          } catch(e) {
              alert("驗證失敗");
          } finally {
              setIsGrouping(false);
          }
      }, 300);
  };

  const handleAnalyzeAI = async () => {
    if (students.length < 3) {
      alert("學生人數不足，無法分組");
      return;
    }
    setIsGrouping(true);
    try {
      // Merge Roster Data similar to Local Grouping for AI
      const normalize = (n: string) => n.replace(/\s+/g, '').toLowerCase();
      const enhancedStudents = students.map(s => {
          const normalizedStudentName = normalize(s.name);
          const rosterInfo = officialRoster.find(r => 
              normalize(r.name) === normalizedStudentName
          );
          return {
              ...s,
              originalRoom: rosterInfo?.originalRoom ? String(rosterInfo.originalRoom) : s.originalRoom,
              gender: rosterInfo?.gender || s.gender || "Unknown"
          };
      });

      const result = await generateRoomGroups(enhancedStudents);
      setGroups(result);
    } catch (e) {
      alert("分組分析失敗 (請檢查 API Key 或網路)");
    } finally {
      setIsGrouping(false);
    }
  };

  const handleClearAll = async () => {
    if (confirm("【危險】這將會永久刪除雲端資料庫中的所有學生資料！確定要執行嗎？")) {
        if (confirm("再次確認：您真的要清空資料庫嗎？")) {
            setIsSyncing(true);
            try {
                await clearDatabase();
                setStudents([]);
                setGroups([]);
                alert("資料庫已清空");
            } catch(e) {
                alert("刪除失敗");
            } finally {
                setIsSyncing(false);
            }
        }
    }
  };

  const handleSingleDelete = async (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation(); // Stop clicking row from opening detail modal
      if (confirm(`確定要刪除「${name}」的資料嗎？\n此動作無法復原。`)) {
          try {
              await deleteStudent(id);
              // Update local state directly for speed
              setStudents(prev => prev.filter(s => s.id !== id));
          } catch (error) {
              alert("刪除失敗，請檢查網路");
              console.error(error);
          }
      }
  };

  const handleEditName = async (e: React.MouseEvent, id: string, currentName: string) => {
      e.stopPropagation();
      const newName = prompt("請輸入新的姓名 (系統將自動去除空白):", currentName);
      
      if (newName && newName.trim() !== currentName) {
          const cleanName = newName.replace(/\s+/g, ''); // Remove all spaces
          try {
              await updateStudentName(id, cleanName);
              // Update local state
              setStudents(prev => prev.map(s => s.id === id ? { ...s, name: cleanName } : s));
          } catch (error) {
              alert("更新失敗，請檢查網路");
              console.error(error);
          }
      }
  };

  const handleEditFinalRoom = async (e: React.MouseEvent, id: string, currentRoom?: string) => {
      e.stopPropagation();
      const newRoom = prompt("請輸入最終確認的房號 (例如 101):", currentRoom || '');
      
      if (newRoom !== null && newRoom !== currentRoom) {
          try {
              await updateStudentFinalRoom(id, newRoom.trim());
              setStudents(prev => prev.map(s => s.id === id ? { ...s, finalRoom: newRoom.trim() } : s));
          } catch (error) {
              alert("更新失敗");
          }
      }
  };

  const handleGenderToggle = async (e: React.MouseEvent, id: string, currentGender: string) => {
      e.stopPropagation();
      
      // Determine next state: M -> F -> Unknown -> M
      let nextGender = 'M';
      let g = (currentGender || '').trim().toUpperCase();
      
      // Robust normalization before switching
      if (['M', 'MALE', 'BOY', '男'].includes(g)) g = 'M';
      else if (['F', 'FEMALE', 'GIRL', '女'].includes(g)) g = 'F';
      else g = 'Unknown';

      if (g === 'M') nextGender = 'F';
      else if (g === 'F') nextGender = 'Unknown';
      else nextGender = 'M';

      try {
          await updateStudentGender(id, nextGender);
          // Update local state immediately
          setStudents(prev => prev.map(s => s.id === id ? { ...s, gender: nextGender } : s));
      } catch (error) {
          console.error(error);
          alert("更新性別失敗");
      }
  };

  // Excel Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
          setIsSyncing(true); // Show loading
          const roster = await parseRosterFile(file);
          
          // SAVE TO CLOUD IMMEDIATELY (Overwrite old)
          await saveOfficialRoster(roster);
          
          setOfficialRoster(roster);
          // Update the "Last Updated" display immediately
          setRosterUpdatedAt(new Date().toLocaleString('zh-TW', { hour12: false }));
          
          alert(`成功匯入 ${roster.length} 筆名單資料並同步至雲端 (已覆蓋舊資料)`);
      } catch (error) {
          alert("Excel 讀取或上傳失敗");
          console.error(error);
      } finally {
          setIsSyncing(false);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFinalRoomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          setIsSyncing(true);
          const roster = await parseRosterFile(file);
          
          // Match roster data to existing students and prepare bulk update
          const updates: {id: string, finalRoom: string}[] = [];
          const normalize = (n: string) => n.replace(/\s+/g, '').toLowerCase();

          roster.forEach(r => {
              if (r.finalRoom) {
                  const student = students.find(s => normalize(s.name) === normalize(r.name));
                  if (student) {
                      updates.push({ id: student.id, finalRoom: r.finalRoom.toString() });
                  }
              }
          });

          if (updates.length > 0) {
              await bulkUpdateFinalRooms(updates);
              // Refresh local state
              setStudents(prev => prev.map(s => {
                  const update = updates.find(u => u.id === s.id);
                  return update ? { ...s, finalRoom: update.finalRoom } : s;
              }));
              alert(`成功匯入並更新 ${updates.length} 筆最終房號！`);
          } else {
              alert("未找到可匹配的學生或 Excel 中沒有最終房號欄位");
          }

      } catch (error) {
          alert("匯入失敗");
          console.error(error);
      } finally {
          setIsSyncing(false);
          if (finalRoomInputRef.current) finalRoomInputRef.current.value = '';
      }
  };

  const handleExportExcel = () => {
      const missingNames = missingStudents.map(s => s.name);
      exportDashboardToExcel(students, groups, missingNames);
  };

  // 1. Auto-sync Data from Cloud when logged in
  useEffect(() => {
    if (isLoggedIn) {
        handleSync();
    }
  }, [isLoggedIn]);

  // --- Render ---

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} onBack={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans">
      {/* Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal 
            student={selectedStudent} 
            allStudents={students} 
            onClose={() => setSelectedStudent(null)} 
        />
      )}

      {/* --- HEADER --- */}
      <header className="mb-8 border-b border-gray-100 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">教師管理後台</h1>
            <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${students.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span>測驗人數: <b className="text-gray-900">{students.length}</b> 人</span>
                </div>
                {lastSyncedTime && (
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock size={12} /> 資料同步: {lastSyncedTime}
                    </p>
                )}
            </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
                {/* Cloud Sync */}
                <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    {isSyncing ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"/> : <CloudDownload size={18} />}
                    {isSyncing ? '同步中' : '同步資料'}
                </button>
                
                <button 
                    onClick={handleGenerateMock}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-bold flex items-center gap-2 transition-colors"
                >
                    <Sparkles size={18} /> 模擬
                </button>
            
                <button 
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                    <Trash2 size={18} /> 重置
                </button>

                <button
                    onClick={() => setIsLoggedIn(false)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black font-bold flex items-center gap-2 transition-colors ml-2"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>

        {/* --- EXCEL MANAGEMENT BAR --- */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
                 {/* Upload */}
                 <div className="flex flex-col gap-1">
                    <div className="flex gap-2 items-center">
                        <div className="relative">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Upload size={18} /> 上傳名單 (Excel)
                            </button>
                        </div>
                        {/* Template Download */}
                        <button 
                            onClick={downloadRosterTemplate}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                            title="下載Excel範本 (姓名/性別/房號)"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                    {/* Timestamp Display */}
                    {rosterUpdatedAt && (
                        <div className="text-[10px] text-gray-400 pl-1">
                            📅 名單更新於: {rosterUpdatedAt}
                        </div>
                    )}
                 </div>

                 {/* Progress Info - Persists from Cloud */}
                 {officialRoster.length > 0 && (
                     <div className="flex flex-col animate-in fade-in slide-in-from-right-4">
                         <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                            <span>完成度: {students.length} / {officialRoster.length}</span>
                            {missingStudents.length > 0 ? (
                                <span className="text-red-500 text-xs bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertCircle size={10} /> 缺 {missingStudents.length} 人
                                </span>
                            ) : (
                                <span className="text-emerald-500 text-xs bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 size={10} /> 全員到齊
                                </span>
                            )}
                         </div>
                         <div className="w-40 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                             <div 
                                className={`h-full rounded-full transition-all duration-500 ${missingStudents.length === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                style={{ width: `${Math.min(100, (students.length / officialRoster.length) * 100)}%` }}
                             ></div>
                         </div>
                     </div>
                 )}
             </div>

             {/* Export */}
             <button 
                 onClick={handleExportExcel}
                 className="w-full md:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-100"
             >
                 <FileSpreadsheet size={18} /> 匯出完整報表
             </button>
        </div>
      </header>

      {syncError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={18} /> {syncError}
          </div>
      )}

      {/* --- DASHBOARD METRICS --- */}
      {students.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-2"><Moon size={20}/></div>
                  <div className="text-2xl font-black text-gray-800">{stats.owls}</div>
                  <div className="text-xs text-gray-500 font-bold">夜貓子</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-yellow-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-2"><Sun size={20}/></div>
                  <div className="text-2xl font-black text-gray-800">{stats.larks}</div>
                  <div className="text-xs text-gray-500 font-bold">晨型人</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-2"><Home size={20}/></div>
                  <div className="text-2xl font-black text-gray-800">{stats.stayRequest}</div>
                  <div className="text-xs text-gray-500 font-bold">續住需求</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2"><UserCheck size={20}/></div>
                  <div className="text-2xl font-black text-gray-800">{stats.designated}</div>
                  <div className="text-xs text-gray-500 font-bold">已指定室友</div>
              </div>
          </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Col: Roster List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[70vh]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm">
              <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
                <Users size={18} className="text-gray-400" /> 學生名單
              </h2>
              {/* Filter Tabs */}
              <div className="flex bg-gray-200/50 p-1 rounded-xl">
                  {['ALL', 'DESIGNATED', 'STAY', 'MISSING'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setFilterTab(tab as any)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filterTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'} ${tab === 'MISSING' && missingStudents.length > 0 ? 'text-red-500' : ''}`}
                      >
                          {tab === 'ALL' ? '全部' : tab === 'DESIGNATED' ? '有指定' : tab === 'STAY' ? '續住' : `缺 ${missingStudents.length}`}
                      </button>
                  ))}
              </div>
            </div>
            
            <div className="overflow-y-auto p-3 flex-grow space-y-2 scrollbar-hide">
              {isSyncing ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center opacity-60">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full mb-4"></div>
                    <p className="text-sm">正在從雲端讀取...</p>
                 </div>
              ) : filterTab === 'MISSING' ? (
                // --- MISSING STUDENTS LIST ---
                missingStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center opacity-60">
                        <CheckCircle2 size={48} className="mb-4 text-emerald-200" />
                        <p className="font-bold text-emerald-600">太棒了！</p>
                        <p className="text-xs">名單上的學生都已完成測驗</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {missingStudents.map((s, idx) => (
                            <div key={idx} className="w-full text-left flex items-center justify-between p-3 rounded-2xl bg-red-50/50 border border-red-100">
                                <div>
                                    <div className="font-bold text-gray-800 text-sm">{s.name}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">
                                        房:{s.originalRoom || '-'} | 性別:{s.gender || '-'}
                                    </div>
                                </div>
                                <UserX size={16} className="text-red-300" />
                            </div>
                        ))}
                        <div className="text-center text-xs text-red-400 pt-2">
                            共 {missingStudents.length} 位學生尚未測驗
                        </div>
                    </div>
                )
              ) : filteredStudents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center opacity-60">
                  <Ghost size={48} className="mb-4 text-gray-200" />
                  <p className="font-bold">沒有符合的資料</p>
                  {students.length === 0 && (
                      <button onClick={handleGenerateMock} className="mt-4 text-xs bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 text-gray-600">
                          生成測試資料看看?
                      </button>
                  )}
                </div>
              ) : (
                filteredStudents.map((s) => {
                  // Re-calculate enhanced data locally for display consistency if needed
                  const normalizedName = s.name.replace(/\s+/g, '').toLowerCase();
                  const rosterMatch = officialRoster.find(r => r.name.replace(/\s+/g, '').toLowerCase() === normalizedName);
                  // Prefer Roster gender, then DB gender. 
                  const rosterG = rosterMatch?.gender;
                  let displayGender = s.gender || "Unknown";
                  
                  // Heuristic: If roster has valid gender, use it. Else use DB.
                  if (rosterG && (rosterG.toLowerCase().startsWith('m') || rosterG.toLowerCase().startsWith('f') || rosterG.includes('男') || rosterG.includes('女'))) {
                      displayGender = rosterG;
                  }

                  // Normalize for display
                  let displayGenderNormalized = (displayGender || '').trim().toUpperCase();
                  if (['M', 'MALE', 'BOY', '男'].includes(displayGenderNormalized)) displayGenderNormalized = 'M';
                  else if (['F', 'FEMALE', 'GIRL', '女'].includes(displayGenderNormalized)) displayGenderNormalized = 'F';
                  else displayGenderNormalized = 'UNKNOWN';
                  
                  // Gender Badge Color
                  let genderBadgeClass = "bg-gray-200 text-gray-500";
                  if (displayGenderNormalized === 'M') genderBadgeClass = "bg-blue-100 text-blue-600";
                  if (displayGenderNormalized === 'F') genderBadgeClass = "bg-pink-100 text-pink-600";
                  if (displayGenderNormalized === 'UNKNOWN') genderBadgeClass = "bg-red-100 text-red-500";

                  return (
                  <div 
                    key={s.id} 
                    className="w-full flex items-center p-3 rounded-2xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 relative group"
                  >
                    {/* Main content - Click to open modal */}
                    <button 
                        onClick={() => setSelectedStudent(s)}
                        className="flex-grow flex items-center text-left min-w-0"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1 mr-3 shadow-sm flex-shrink-0 ${ANIMAL_DETAILS[s.animalType]?.color.replace('text-', 'bg-').replace('100', '50')}`}>
                        {ANIMAL_DETAILS[s.animalType]?.svg}
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <div className="font-bold text-gray-800 text-sm flex items-center gap-1 truncate">
                                    {s.name}
                                </div>
                                <div className="flex gap-1 flex-shrink-0 items-center">
                                     {/* Clickable Gender Badge */}
                                    <div 
                                        role="button"
                                        onClick={(e) => handleGenderToggle(e, s.id, displayGenderNormalized)}
                                        className={`text-[9px] px-2 py-0.5 rounded font-bold cursor-pointer hover:scale-110 transition-transform ${genderBadgeClass}`}
                                        title="點擊切換性別 (男/女/未知)"
                                    >
                                        {displayGenderNormalized === 'UNKNOWN' ? '?' : displayGenderNormalized === 'M' ? '男' : '女'}
                                    </div>

                                    {s.preferredRoommates && s.preferredRoommates.some(r => r !== "無 (隨緣)") && (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.preferredRoommates.some(r => r.includes('不')) ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {s.preferredRoommates.some(r => r.includes('不')) ? '續' : `指(${s.preferredRoommates.length})`}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1 truncate">
                                {/* Final Room Badge if Set */}
                                {s.finalRoom && (
                                    <span className="bg-purple-100 text-purple-600 px-1.5 rounded mr-1">
                                        定:{s.finalRoom}
                                    </span>
                                )}
                                <span className="bg-gray-100 px-1.5 rounded">{s.animalName}</span>
                                {s.originalRoom && <span className="text-gray-300">| 原:{s.originalRoom}</span>}
                            </div>
                        </div>
                    </button>

                    {/* Final Room Edit Button */}
                    <button
                        onClick={(e) => handleEditFinalRoom(e, s.id, s.finalRoom)}
                        className="ml-1 p-2 text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        title="設定最終房號"
                    >
                        <Key size={16} />
                    </button>

                    {/* Edit Name Button */}
                    <button
                        onClick={(e) => handleEditName(e, s.id, s.name)}
                        className="ml-1 p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        title="修改姓名 (除錯用)"
                    >
                        <Pencil size={16} />
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={(e) => handleSingleDelete(e, s.id, s.name)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        title="刪除此筆資料"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                );})
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Grouping Results (8 cols) */}
        <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 min-h-[70vh] flex flex-col relative overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center z-10 relative gap-4">
                    <h2 className="font-bold text-gray-700 text-lg flex items-center gap-2">
                        <Wand2 size={20} className="text-purple-400"/> 智慧分房結果
                    </h2>
                    
                    <div className="flex gap-2 items-center flex-wrap justify-end">
                        {/* Import Final Room */}
                        <div className="relative">
                            <input 
                                type="file" 
                                ref={finalRoomInputRef}
                                onChange={handleFinalRoomUpload}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                            <button 
                                onClick={() => finalRoomInputRef.current?.click()}
                                className="px-3 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full font-bold transition-all text-xs flex items-center gap-1"
                                title="匯入Excel檔更新最終房號"
                            >
                                <Upload size={14} /> 匯入最終房號
                            </button>
                        </div>

                        {/* Validate Final Grouping */}
                        <button 
                            onClick={handleValidateFinal}
                            disabled={students.length === 0 || isGrouping}
                            className="px-4 py-2.5 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-full font-bold transition-all text-xs flex items-center gap-2"
                            title="依據已輸入的『最終房號』進行衝突檢測"
                        >
                            <BarChart3 size={16} /> 驗證最終編排
                        </button>

                        {/* AI Analysis Button (Restored) */}
                        <button 
                            onClick={handleAnalyzeAI}
                            disabled={students.length === 0 || isGrouping}
                            className="px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full font-bold transition-all text-xs flex items-center gap-2 border border-indigo-100"
                            title="使用 Google Gemini AI 進行深度分析 (需設定 API Key)"
                        >
                            <Sparkles size={14} /> AI 分析
                        </button>

                        {/* Primary Local Grouping Button */}
                        <button 
                            onClick={handleAnalyzeLocal}
                            disabled={students.length === 0 || isGrouping}
                            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none text-sm flex items-center gap-2"
                            title="依照性別、作息與整潔度自動分組"
                        >
                            <Zap size={16} fill="currentColor"/> {isGrouping ? '運算中...' : '快速分組'}
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/30 flex-grow overflow-y-auto relative">
                    {groups.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <BarChart3 size={40} className="text-gray-300" />
                            </div>
                            <p className="font-medium">尚未進行分組</p>
                            <p className="text-sm mt-1 opacity-70 max-w-xs text-center">準備好學生名單(含性別)後，點擊「快速分組」，系統將會依照性別分流並進行最佳配對</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-5">
                            {groups.map((group, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-white min-w-[3.5rem] px-2 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${group.roomId.includes('男') ? 'bg-blue-600 shadow-blue-200' : group.roomId.includes('女') ? 'bg-pink-500 shadow-pink-200' : 'bg-gray-500'} shadow-md`}>{group.roomId}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${group.compatibilityScore >= 90 ? 'bg-emerald-100 text-emerald-700' : group.compatibilityScore >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                契合度 {group.compatibilityScore}
                                            </span>
                                            {/* Score Visualization Bar */}
                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${group.compatibilityScore >= 90 ? 'bg-emerald-500' : group.compatibilityScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${group.compatibilityScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Avatars */}
                                    <div className="flex -space-x-2 mb-4 px-2">
                                        {group.students.map(s => (
                                            <div key={s.id} className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center p-0.5 relative z-0 hover:z-10 hover:scale-125 transition-transform shadow-sm ${ANIMAL_DETAILS[s.animalType]?.color.replace('text-', 'bg-').replace('100', '50')}`} title={s.name}>
                                                {ANIMAL_DETAILS[s.animalType]?.svg}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Names */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {group.students.map(s => (
                                            <span key={s.id} className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                {s.name} 
                                            </span>
                                        ))}
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-gray-50">
                                        <div className="flex items-start gap-2">
                                            <HeartPulse size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-gray-600 leading-relaxed text-justify">{group.reason}</p>
                                        </div>
                                        {group.potentialConflicts && (
                                            <div className="flex items-start gap-2 bg-orange-50 p-2 rounded-lg mt-2">
                                                <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-[10px] text-orange-700 leading-relaxed font-bold whitespace-pre-line">
                                                    {group.potentialConflicts.split('。').join('\n')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
