import React, { useState } from 'react';
import { generateRoomGroups, generateMockStudents } from '../services/geminiService';
import { fetchClassroomData, clearDatabase } from '../services/dbService';
import { StudentProfile, RoomGroup } from '../types';
import { ANIMAL_DETAILS } from '../constants';
import { Users, Wand2, CloudDownload, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [groups, setGroups] = useState<RoomGroup[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);

  // Sync data from Firebase
  const handleSync = async () => {
    setIsGenerating(true);
    try {
        const cloudData = await fetchClassroomData();
        setStudents(cloudData);
        if (cloudData.length === 0) {
            alert("雲端資料庫目前是空的。");
        }
    } catch (e) {
        alert("同步失敗，請檢查網路或 Firebase 設定。");
    } finally {
        setIsGenerating(false);
    }
  };

  // Generate Mock Data for Testing
  const handleGenerateMock = async () => {
    setIsGenerating(true);
    try {
      const mockData = await generateMockStudents(45); 
      setStudents(prev => [...prev, ...mockData]);
    } catch (e) {
      alert("生成失敗");
    } finally {
      setIsGenerating(false);
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
            setIsGenerating(true);
            try {
                await clearDatabase();
                setStudents([]);
                setGroups([]);
                alert("資料庫已清空");
            } catch(e) {
                alert("刪除失敗");
            } finally {
                setIsGenerating(false);
            }
        }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">教師後台管理</h1>
          <p className="text-gray-500">目前學生人數: {students.length} 位</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handleSync}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm"
          >
            {isGenerating ? <div className="animate-spin">⏳</div> : <CloudDownload size={18} />}
            從雲端同步資料
          </button>
          
          <button 
            onClick={handleGenerateMock}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2"
          >
            <Wand2 size={18} /> 生成模擬資料 (測試用)
          </button>
           
           <button 
            onClick={handleClearAll}
            className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2 border border-red-100"
          >
            <Trash2 size={18} /> 清空資料庫
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Col: Roster List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <Users size={20} /> 學生名單
              </h2>
            </div>
            <div className="overflow-y-auto p-2 flex-grow space-y-2">
              {students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <p>尚未載入學生資料</p>
                  <p className="text-sm mt-2">請點擊上方「從雲端同步資料」</p>
                </div>
              ) : (
                students.map((s) => (
                  <div key={s.id} className="flex items-center p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow bg-white">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center p-1 mr-3 ${ANIMAL_DETAILS[s.animalType]?.color.split(' ')[0]}`}>
                      {ANIMAL_DETAILS[s.animalType]?.svg}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center">
                         <div className="font-bold text-gray-800 truncate">{s.name}</div>
                         {s.preferredRoommate && s.preferredRoommate !== "無 (隨緣)" && (
                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">指定: {s.preferredRoommate}</span>
                         )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{s.animalName} • 睡覺: {s.habits.sleepTime}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Grouping Results */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">智慧分房結果</h2>
                    <button 
                        onClick={handleAnalyze}
                        disabled={students.length === 0 || isGrouping}
                        className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold shadow-lg shadow-teal-200 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        {isGrouping ? 'AI 正在運算最佳組合...' : '開始 AI 智能分組'}
                    </button>
                </div>

                <div className="p-4 bg-gray-50 flex-grow overflow-y-auto">
                    {groups.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Wand2 size={48} className="mb-4 opacity-20" />
                            <p>準備好學生名單後，點擊右上角按鈕進行分組</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {groups.map((group, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-gray-800">寢室 {group.roomId}</h3>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${group.compatibilityScore > 85 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            契合度 {group.compatibilityScore}%
                                        </span>
                                    </div>
                                    
                                    <div className="flex -space-x-2 mb-4 overflow-hidden py-1 pl-2">
                                        {group.students.map(s => (
                                            <div key={s.id} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center p-1 relative z-0 hover:z-10 hover:scale-110 transition-transform ${ANIMAL_DETAILS[s.animalType]?.color}`} title={s.name}>
                                                {ANIMAL_DETAILS[s.animalType]?.svg}
                                            </div>
                                        ))}
                                        <span className="ml-4 self-center text-sm text-gray-600">
                                            {group.students.map(s => s.name).join(', ')}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-gray-600 leading-snug">{group.reason}</p>
                                        </div>
                                        {group.potentialConflicts && (
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-orange-600 leading-snug">注意：{group.potentialConflicts}</p>
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