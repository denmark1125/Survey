
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Login from './Login';
import StudentDetailModal from './StudentDetailModal';
import { generateRoomGroups, generateMockStudents } from '../services/geminiService';
import { groupStudentsLocally } from '../services/localGroupingService';
import { fetchClassroomData, clearDatabase, deleteStudent } from '../services/dbService';
import { parseRosterFile, exportDashboardToExcel, downloadRosterTemplate } from '../services/excelService';
import { StudentProfile, RoomGroup, AnimalType, OfficialStudent } from '../types';
import { ANIMAL_DETAILS } from '../constants';
import { Users, Wand2, CloudDownload, Trash2, AlertTriangle, CheckCircle2, LogOut, Clock, Ghost, BarChart3, Moon, Sun, Home, UserCheck, Sparkles, Zap, Upload, FileSpreadsheet, UserX, AlertCircle, Download, XCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [groups, setGroups] = useState<RoomGroup[]>([]);
  
  // Roster Management State
  const [officialRoster, setOfficialRoster] = useState<OfficialStudent[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
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
      
      const takenQuizNames = new Set(students.map(s => s.name.trim().toLowerCase()));
      return officialRoster.filter(official => {
          // Check if name exists in takenQuizNames
          // Simple match: exact trim match
          return !takenQuizNames.has(official.name.trim().toLowerCase());
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
        const cloudData = await fetchClassroomData();
        setStudents(cloudData);
        setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }));
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
      if (students.length < 3) {
        alert("學生人數不足，無法分組");
        return;
      }
      setIsGrouping(true);

      // Pre-processing: Merge originalRoom from officialRoster if available
      // This is crucial for the "Preserve Existing Room" logic
      const enhancedStudents = students.map(s => {
          const rosterInfo = officialRoster.find(r => r.name.trim() === s.name.trim());
          return {
              ...s,
              originalRoom: rosterInfo?.originalRoom || s.originalRoom
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

  const handleAnalyzeAI = async () => {
    if (students.length < 3) {
      alert("學生人數不足，無法分組");
      return;
    }
    setIsGrouping(true);
    try {
      const result = await generateRoomGroups(students);
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

  // Excel Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
          const roster = await parseRosterFile(file);
          setOfficialRoster(roster);
          alert(`成功匯入 ${roster.length} 筆名單資料`);
      } catch (error) {
          alert("Excel 讀取失敗，請確認格式正確 (需包含 '姓名' 欄位)");
          console.error(error);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportExcel = () => {
      const missingNames = missingStudents.map(s => s.name);
      exportDashboardToExcel(students, groups, missingNames);
  };

  // Auto-sync when logged in
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
                {lastUpdated && (
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock size={12} /> 更新: {lastUpdated}
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
                        title="下載Excel範本"
                    >
                        <Download size={18} />
                    </button>
                 </div>

                 {/* Progress Info */}
                 {officialRoster.length > 0 && (
                     <div className="flex flex-col">
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
                                    <div className="text-[10px] text-gray-400 font-medium">原房號: {s.originalRoom || '未填寫'}</div>
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
                filteredStudents.map((s) => (
                  <div 
                    key={s.id} 
                    className="w-full flex items-center p-3 rounded-2xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 relative group"
                  >
                    {/* Main content - Click to open modal */}
                    <button 
                        onClick={() => setSelectedStudent(s)}
                        className="flex-grow flex items-center text-left"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1 mr-3 shadow-sm ${ANIMAL_DETAILS[s.animalType]?.color.replace('text-', 'bg-').replace('100', '50')}`}>
                        {ANIMAL_DETAILS[s.animalType]?.svg}
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <div className="font-bold text-gray-800 text-sm">{s.name}</div>
                                {s.preferredRoommates && s.preferredRoommates.some(r => r !== "無 (隨緣)") && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s.preferredRoommates.some(r => r.includes('不')) ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {s.preferredRoommates.some(r => r.includes('不')) ? '續住' : `指定(${s.preferredRoommates.length})`}
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium flex items-center gap-2">
                                <span className="bg-gray-100 px-1.5 rounded">{s.animalName}</span>
                                {s.originalRoom && <span className="text-gray-300">| 原:{s.originalRoom}</span>}
                            </div>
                        </div>
                    </button>

                    {/* Delete Button (Visible on hover) */}
                    <button
                        onClick={(e) => handleSingleDelete(e, s.id, s.name)}
                        className="ml-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        title="刪除此筆資料"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                ))
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
                    
                    <div className="flex gap-2">
                        {/* Primary Local Grouping Button */}
                        <button 
                            onClick={handleAnalyzeLocal}
                            disabled={students.length === 0 || isGrouping}
                            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none text-sm flex items-center gap-2"
                            title="依照作息與整潔度自動分組"
                        >
                            <Zap size={16} fill="currentColor"/> {isGrouping ? '運算中...' : '快速分組 (本地運算)'}
                        </button>
                        
                        {/* Secondary AI Button */}
                        <button 
                            onClick={handleAnalyzeAI}
                            disabled={students.length === 0 || isGrouping}
                            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-full font-bold transition-all text-xs"
                            title="使用 Gemini AI 進行進階分組 (需 API Key)"
                        >
                            AI 進階分組
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
                            <p className="text-sm mt-1 opacity-70 max-w-xs text-center">準備好學生名單後，點擊「快速分組」，系統將會依照作息一致性進行最佳配對</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-5">
                            {groups.map((group, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                            <span className="bg-gray-800 text-white w-6 h-6 rounded flex items-center justify-center text-xs">{group.roomId}</span>
                                            寢室
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${group.compatibilityScore > 85 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            契合度 {group.compatibilityScore}%
                                        </span>
                                    </div>
                                    
                                    {/* Avatars */}
                                    <div className="flex -space-x-2 mb-4 px-2">
                                        {group.students.map(s => (
                                            <div key={s.id} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center p-0.5 relative z-0 hover:z-10 hover:scale-125 transition-transform shadow-sm ${ANIMAL_DETAILS[s.animalType]?.color.replace('text-', 'bg-').replace('100', '50')}`} title={s.name}>
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
                                            <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-gray-600 leading-relaxed text-justify">{group.reason}</p>
                                        </div>
                                        {group.potentialConflicts && (
                                            <div className="flex items-start gap-2 bg-orange-50 p-2 rounded-lg mt-2">
                                                <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-[10px] text-orange-700 leading-relaxed font-bold">{group.potentialConflicts}</p>
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
