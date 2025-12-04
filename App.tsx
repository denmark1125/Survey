import React, { useState } from 'react';
import { ViewState, StudentProfile, QuizAnswer } from './types';
import StudentQuiz from './components/StudentQuiz';
import ResultCard from './components/ResultCard';
import Dashboard from './components/Dashboard';
import { analyzeStudentProfile } from './services/geminiService';
import { saveStudentResult } from './services/dbService';
import { GraduationCap, User, PawPrint } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [currentProfile, setCurrentProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuizComplete = async (name: string, answers: QuizAnswer[]) => {
    setIsLoading(true);
    try {
      // 1. Calculate Animal Persona (Local)
      const profile = await analyzeStudentProfile(name, answers);
      
      // 2. Save to Firebase Cloud (Auto)
      await saveStudentResult(profile);
      
      // 3. Show Result
      setCurrentProfile(profile);
      setView('RESULT');
    } catch (error) {
      console.error(error);
      alert("儲存資料時發生錯誤，請確認網路連線正常。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setCurrentProfile(null);
    setView('QUIZ');
  };

  const renderContent = () => {
    switch (view) {
      case 'LANDING':
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center border-b-4 border-teal-500">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-600">
                <PawPrint size={40} />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">校園動物系人格測驗</h1>
              <p className="text-gray-500 mb-8">
                這是一個有趣的心理測驗！透過回答生活習慣問題，找出你的「靈魂動物」，看看你在群體中是哪種角色！
              </p>
              
              <div className="grid gap-4">
                <button
                  onClick={() => setView('QUIZ')}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] shadow-lg shadow-teal-200"
                >
                  <User size={24} />
                  開始測驗
                </button>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">老師專區</span></div>
                </div>
                <button
                  onClick={() => setView('TEACHER_DASHBOARD')}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white border-2 border-gray-200 hover:border-gray-800 text-gray-800 rounded-xl font-bold text-lg transition-colors"
                >
                  <GraduationCap size={24} />
                  管理後台
                </button>
              </div>
            </div>
            <p className="mt-8 text-sm text-gray-400">Powered by Google Gemini AI</p>
          </div>
        );
        
      case 'QUIZ':
        return (
          <div className="pt-10 px-4 pb-20">
            <button onClick={() => setView('LANDING')} className="mb-4 text-gray-500 hover:text-teal-600 font-medium text-sm">
              &larr; 回首頁
            </button>
            <StudentQuiz onComplete={handleQuizComplete} isLoading={isLoading} />
          </div>
        );

      case 'RESULT':
        return (
          <div className="pt-10 px-4 pb-20">
             <button onClick={() => setView('LANDING')} className="mb-4 text-gray-500 hover:text-teal-600 font-medium text-sm">
              &larr; 回首頁
            </button>
            {currentProfile && <ResultCard profile={currentProfile} onRestart={handleRestart} />}
          </div>
        );

      case 'TEACHER_DASHBOARD':
        return (
          <div className="min-h-screen">
            <div className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-50">
                <span className="font-bold text-xl text-teal-700">管理後台</span>
                <button onClick={() => setView('LANDING')} className="text-sm text-gray-500 hover:text-gray-900">
                    登出
                </button>
            </div>
            <Dashboard />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] font-sans text-gray-900">
      {renderContent()}
    </div>
  );
};

export default App;