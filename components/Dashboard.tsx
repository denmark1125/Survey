import React, { useState, useEffect, useMemo } from 'react';
import Login from './Login';
import StudentDetailModal from './StudentDetailModal';
import { generateRoomGroups, generateMockStudents } from '../services/geminiService';
import { fetchClassroomData, clearDatabase } from '../services/dbService';
import { StudentProfile, RoomGroup, AnimalType } from '../types';
import { ANIMAL_DETAILS } from '../constants';
import { Users, Wand2, CloudDownload, Trash2, AlertTriangle, CheckCircle2, LogOut, Clock, Ghost, BarChart3, Moon, Sun, Home, UserCheck, Sparkles } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [groups, setGroups] = useState<RoomGroup[]>([]);
  
  // Status states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'DESIGNATED' | 'STAY'>('ALL');

  // Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  // --- Statistics Logic (useMemo must be before return) ---
  const stats = useMemo(() => {
      const total = students.length || 1;
      const owls = students.filter(s => s.animalType === AnimalType.OWL).length;
      const larks = students.filter(s => s.animalType === AnimalType.LARK).length;
      
      // Safety checks for preferredRoommate using optional chaining
      const stayRequest = students.filter(s => s.preferredRoommate?.includes('續住') || s.preferredRoommate?.includes('不')).length;
      const designated = students.filter(s => s.preferredRoommate && !s.preferredRoommate.includes('隨緣') && !s.preferredRoommate.includes('續住')).length;
      
      const avgClean = Math.round(students.reduce((acc, s) => acc + (s.habits?.cleanliness || 5), 0) / total * 10) / 10;

      return { owls, larks, stayRequest, designated, avgClean };
  }, [students]);

  // --- Filtering Logic (useMemo must be before return) ---
  const filteredStudents = useMemo(() => {
      switch (filterTab) {
          case 'STAY': return students.filter(s => s.preferredRoommate?.includes('續住') || s.preferredRoommate?.includes('不'));
          case 'DESIGNATED': return students.filter(s => s.preferredRoommate && !s.preferredRoommate.includes('隨緣') && !s.preferredRoommate.includes('續住'));
          default: return students;
      }
  }, [students, filterTab]);

  // Sync data from Firebase
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError('');
    try {
        const cloudData = await fetchClassroomData();
        setStudents(cloudData);
        setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
        setSyncError('讀取失敗，請確認網路連線');
        console.error("Sync failed", e);
    } finally {
        setIsSyncing(false);
    }
  };

  // Generate Mock Data for Testing
  const handleGenerateMock = async () => {
    setIsSyncing(true);
    try {
      const mockData = await generateMockStudents(10); 
      setStudents(prev => [...prev, ...mockData]);
    } catch (e) {
      alert("生成失敗");
    } finally {
      setIsSyncing(false);
    }
  };

  // Run AI Grouping
  const handleAnalyze = async () => {
    if (students.length < 3) {
      alert("學生人數不足，無法分組");
      return;
    }
    setIsGrouping(true);
    try {
      const result = await generateRoomGroups(students);
      setGroups(result);
    } catch (e) {
      alert("分組分析失敗");
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

  // Auto-sync when logged in
  useEffect(() => {
    if (isLoggedIn) {
        handleSync();
    }
  }, [isLoggedIn]);

  // --- Early Return for Login ---
  // MOVED TO BOTTOM: This ensures all hooks above are called unconditionally
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

      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">教師管理後台</h1>
          <div className="flex items-center gap-4 mt-2">
             <div className="flex items-center gap-2 text-sm bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm text-gray-600">
                <div className={`w-2 h-2 rounded-full ${students.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span>目前人數: <b className="text-gray-900">{students.length}</b> 人</span>
             </div>
             {lastUpdated && (
                 <p className="text-gray-400 text-xs flex items-center gap-1">
                     <Clock size={12} /> 更新: {lastUpdated}
                 </p>
             )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSyncing ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"/> : <CloudDownload size={18} />}
            {isSyncing ? '同步中...' : '同步資料'}
          </button>
          
          <button 
            onClick={handleGenerateMock}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-bold flex items-center gap-2 transition-colors"
          >
            <Sparkles size={18} /> 模擬資料
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
             <LogOut size={18} /> 登出
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
                  {['ALL', 'DESIGNATED', 'STAY'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setFilterTab(tab as any)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filterTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                          {tab === 'ALL' ? '全部' : tab === 'DESIGNATED' ? '有指定' : '續住'}
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
                  <button 
                    key={s.id} 
                    onClick={() => setSelectedStudent(s)}
                    className="w-full text-left group flex items-center p-3 rounded-2xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 relative"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1 mr-3 shadow-sm ${ANIMAL_DETAILS[s.animalType]?.color.replace('text-', 'bg-').replace('100', '50')}`}>
                      {ANIMAL_DETAILS[s.animalType]?.svg}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                         <div className="font-bold text-gray-800 text-sm">{s.name}</div>
                         {s.preferredRoommate && s.preferredRoommate !== "無 (隨緣)" && (
                             <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s.preferredRoommate.includes('不') ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                 {s.preferredRoommate.includes('不') ? '續住' : '指定'}
                             </span>
                         )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium flex items-center gap-2">
                        <span className="bg-gray-100 px-1.5 rounded">{s.animalName}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Grouping Results (8 cols) */}
        <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 min-h-[70vh] flex flex-col relative overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center z-10 relative">
                    <h2 className="font-bold text-gray-700 text-lg flex items-center gap-2">
                        <Wand2 size={20} className="text-purple-400"/> 智慧分房結果
                    </h2>
                    <button 
                        onClick={handleAnalyze}
                        disabled={students.length === 0 || isGrouping}
                        className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none text-sm"
                    >
                        {isGrouping ? 'AI 正在運算最佳組合...' : '開始 AI 智能分組'}
                    </button>
                </div>

                <div className="p-6 bg-gray-50/30 flex-grow overflow-y-auto relative">
                    {groups.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <BarChart3 size={40} className="text-gray-300" />
                            </div>
                            <p className="font-medium">尚未進行分組</p>
                            <p className="text-sm mt-1 opacity-70 max-w-xs text-center">準備好學生名單後，點擊右上角按鈕，AI 將會分析睡眠習慣與性格進行最佳配對</p>
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
                                                <p className="text-[10px] text-orange-700 leading-relaxed font-bold">注意：{group.potentialConflicts}</p>
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