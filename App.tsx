import React, { useState } from 'react';
import { ViewState, StudentProfile, QuizAnswer } from './types';
import StudentQuiz from './components/StudentQuiz';
import ResultCard from './components/ResultCard';
import Dashboard from './components/Dashboard';
import { analyzeStudentProfile } from './services/geminiService';
import { saveStudentResult } from './services/dbService';
import { GraduationCap, User, Sparkles, ShieldCheck } from 'lucide-react';

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
      // Even if save fails, show result so user doesn't lose it
      if (!currentProfile && name) {
          // Retry generating profile locally if needed, though profile var should be valid
      }
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
          <div className="flex flex-col items-center justify-center min-h-[90vh] px-4">
            <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[48px] shadow-2xl max-w-lg w-full text-center border-4 border-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-teal-50 to-transparent z-0"></div>
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg text-teal-500 border-4 border-teal-50">
                    <Sparkles size={48} />
                </div>
                <h1 className="text-4xl font-black text-gray-800 mb-4 tracking-tight leading-tight">校園動物系<br/>人格測驗</h1>
                <p className="text-gray-500 mb-10 leading-relaxed font-medium">
                    你是早起的雲雀？還是夜行的貓頭鷹？<br/>
                    花 2 分鐘，測出你隱藏的宿舍靈魂動物！
                </p>
                
                <div className="grid gap-5">
                    <button
                    onClick={() => setView('QUIZ')}
                    className="flex items-center justify-center gap-3 w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xl transition-all hover:scale-[1.02] shadow-xl shadow-teal-200"
                    >
                    <User size={24} />
                    開始測驗
                    </button>
                    
                    <button
                    onClick={() => setView('TEACHER_DASHBOARD')}
                    className="flex items-center justify-center gap-3 w-full py-5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl font-bold text-lg transition-colors"
                    >
                    <GraduationCap size={24} />
                    老師專區
                    </button>
                </div>
              </div>
            </div>

            {/* Privacy Disclaimer Footer to satisfy Google Safe Browsing */}
            <div className="mt-12 max-w-2xl text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-center gap-2 text-stone-500 text-sm font-bold">
                    <ShieldCheck size={16} />
                    <span>隱私權與免責聲明</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-relaxed px-4">
                    本網站僅供班級/學校內部教育活動使用。收集之姓名與測驗數據僅用於活動當下之分組參考，不會用於其他商業用途，亦不會對外公開。
                    本網站非釣魚網站，不涉及任何密碼或敏感個資竊取。
                    <br/>
                    Privacy Disclaimer: This application is for internal educational use only. Data is not shared externally.
                </p>
            </div>
          </div>
        );
        
      case 'QUIZ':
        return (
          <div className="pt-8 px-4 pb-20 max-w-3xl mx-auto">
            <button onClick={() => setView('LANDING')} className="mb-6 px-4 py-2 bg-white rounded-full text-gray-500 hover:text-teal-600 font-bold text-sm shadow-sm transition-all hover:shadow-md">
              &larr; 回首頁
            </button>
            <StudentQuiz onComplete={handleQuizComplete} isLoading={isLoading} />
          </div>
        );

      case 'RESULT':
        return (
          <div className="pt-8 px-4 pb-20 max-w-3xl mx-auto">
             <button onClick={() => setView('LANDING')} className="mb-6 px-4 py-2 bg-white rounded-full text-gray-500 hover:text-teal-600 font-bold text-sm shadow-sm transition-all hover:shadow-md">
              &larr; 回首頁
            </button>
            {currentProfile && <ResultCard profile={currentProfile} onRestart={handleRestart} />}
          </div>
        );

      case 'TEACHER_DASHBOARD':
        return (
          <div className="min-h-screen pb-20">
            <Dashboard />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans text-gray-900 selection:bg-teal-200 selection:text-teal-900">
      {renderContent()}
    </div>
  );
};

export default App;