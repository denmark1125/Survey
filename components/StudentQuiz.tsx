import React, { useState, useEffect } from 'react';
import { QUIZ_QUESTIONS } from '../constants';
import { QuizAnswer } from '../types';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Plus, Trash2, Users } from 'lucide-react';

interface Props {
  onComplete: (name: string, answers: QuizAnswer[]) => void;
  isLoading: boolean;
}

const StudentQuiz: React.FC<Props> = ({ onComplete, isLoading }) => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 is Name input
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  
  // State for multiple roommate inputs
  const [roommateInputs, setRoommateInputs] = useState<string[]>(['']); 

  const handleStart = () => {
    if (name.trim()) setCurrentStep(0);
  };

  const handleOptionSelect = (val: number, text: string, hasInput?: boolean) => {
    const currentQId = QUIZ_QUESTIONS[currentStep].id;
    
    // Reset inputs if switching to "Yes" option for the first time or switching away
    if (!hasInput) {
        setRoommateInputs(['']); 
    }

    setAnswers(prev => {
      // Remove any existing answer for this question
      const filtered = prev.filter(a => a.questionId !== currentQId);
      return [...filtered, { 
          questionId: currentQId, 
          answerValue: val, 
          answerText: text,
          extraText: undefined // Will be populated by effect or next render cycle logic
      }];
    });
  };

  // Manage Dynamic Roommate Inputs
  const handleRoommateChange = (idx: number, val: string) => {
      const newInputs = [...roommateInputs];
      newInputs[idx] = val;
      setRoommateInputs(newInputs);
  };

  const addRoommateField = () => {
      if (roommateInputs.length < 3) {
          setRoommateInputs([...roommateInputs, '']);
      }
  };

  const removeRoommateField = (idx: number) => {
      const newInputs = roommateInputs.filter((_, i) => i !== idx);
      setRoommateInputs(newInputs.length ? newInputs : ['']); // Keep at least one
  };

  // Sync Roommate Inputs to Answers
  useEffect(() => {
    const currentQId = QUIZ_QUESTIONS[currentStep]?.id;
    if (currentQId === 11) { // Hardcoded check for Q11 logic
        const currentAns = answers.find(a => a.questionId === 11);
        if (currentAns?.answerValue === 2) { // "Yes" selected
            const validNames = roommateInputs.map(n => n.trim()).filter(n => n.length > 0);
            const extraText = validNames.join(','); // Store as comma separated string
            
            setAnswers(prev => prev.map(a => 
                a.questionId === 11 ? { ...a, extraText } : a
            ));
        }
    }
  }, [roommateInputs, currentStep, answers]);

  const handleNext = () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete
      const sortedAnswers = answers.sort((a, b) => a.questionId - b.questionId);
      onComplete(name, sortedAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getCurrentAnswer = () => {
    if (currentStep === -1) return null;
    const currentQId = QUIZ_QUESTIONS[currentStep].id;
    return answers.find(a => a.questionId === currentQId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center px-4">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin border-t-teal-500 mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-teal-600">AI</div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">正在分析你的靈魂...</h3>
        <p className="text-gray-400">系統正在將你的資料安全地上傳至雲端</p>
      </div>
    );
  }

  // Name Input Screen
  if (currentStep === -1) {
    return (
      <div className="max-w-xl mx-auto mt-12 px-4">
        <div className="bg-white/80 backdrop-blur-sm p-10 md:p-14 rounded-[40px] shadow-2xl border border-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-emerald-400"></div>
          
          <div className="inline-block p-5 rounded-full bg-teal-50 mb-8 shadow-inner">
            <span className="text-5xl">🎓</span>
          </div>
          <h2 className="text-4xl font-black text-gray-800 mb-3 tracking-tight">哈囉，同學！</h2>
          <p className="text-gray-500 mb-10 text-lg font-medium">輸入你的名字，開始探索你的宿舍人格</p>
          
          <div className="space-y-6">
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-8 py-6 text-2xl font-bold text-center text-gray-800 rounded-3xl border-4 border-gray-100 focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all outline-none placeholder-gray-300 bg-gray-50/50 group-hover:bg-white"
                placeholder="你的名字..."
              />
            </div>
            
            <button
              onClick={handleStart}
              disabled={!name.trim()}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold text-xl py-6 rounded-3xl transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none shadow-xl flex items-center justify-center gap-3"
            >
              開始測驗 <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;
  const currentSelection = getCurrentAnswer();
  const isLastQuestion = currentStep === QUIZ_QUESTIONS.length - 1;
  
  const selectedOption = question.options.find(o => o.value === currentSelection?.answerValue);
  
  // Custom Validation for Q11
  let canProceed = !!currentSelection;
  if (selectedOption?.hasInput) {
      // Must have at least one valid name entered
      const validInputs = roommateInputs.some(n => n.trim().length > 0);
      canProceed = validInputs;
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8 px-4">
        <div className="flex justify-between text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
          <span>第 {currentStep + 1} 題</span>
          <span>共 {QUIZ_QUESTIONS.length} 題</span>
        </div>
        <div className="w-full bg-white rounded-full h-4 p-1 shadow-sm">
          <div className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-6 md:p-10 rounded-[40px] shadow-xl border border-white min-h-[500px] flex flex-col relative">
        
        <div className="flex-grow">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-10 leading-snug">
            {question.text}
          </h3>

          <div className="space-y-4">
            {question.options.map((opt) => {
              const isSelected = currentSelection?.answerValue === opt.value;
              return (
                <div key={opt.value}>
                    <button
                    onClick={() => handleOptionSelect(opt.value, opt.text, opt.hasInput)}
                    className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 group relative ${
                        isSelected 
                        ? 'border-teal-500 bg-teal-50/50 shadow-md transform scale-[1.02]' 
                        : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}
                    >
                    <div className="flex items-center justify-between">
                        <span className={`font-bold text-lg ${isSelected ? 'text-teal-900' : 'text-gray-500'}`}>
                        {opt.text}
                        </span>
                        {isSelected && <CheckCircle2 className="text-teal-500 fill-teal-100" size={28} />}
                    </div>
                    </button>
                    
                    {/* Multiple Inputs UI for Q11 */}
                    {isSelected && opt.hasInput && (
                        <div className="mt-4 ml-2 mr-2 p-4 bg-white/60 rounded-2xl border border-teal-100 animate-in fade-in slide-in-from-top-2">
                             <div className="text-xs text-teal-600 font-bold mb-3 flex items-center gap-1">
                                <Users size={12}/> 請輸入想住的同學全名 (最多3位)
                             </div>
                             
                             <div className="space-y-3">
                                 {roommateInputs.map((inputVal, idx) => (
                                     <div key={idx} className="flex gap-2">
                                         <input 
                                            type="text"
                                            placeholder={`室友姓名 ${idx + 1}`}
                                            value={inputVal}
                                            onChange={(e) => handleRoommateChange(idx, e.target.value)}
                                            autoFocus={idx === roommateInputs.length - 1}
                                            className="flex-1 p-3 border-2 border-teal-200 rounded-xl focus:border-teal-500 outline-none text-gray-800 font-bold bg-white shadow-sm text-base"
                                         />
                                         {roommateInputs.length > 1 && (
                                            <button 
                                                onClick={() => removeRoommateField(idx)}
                                                className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                                                title="刪除"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                         )}
                                     </div>
                                 ))}
                             </div>

                             {roommateInputs.length < 3 && (
                                 <button 
                                    onClick={addRoommateField}
                                    className="mt-3 w-full py-2 border-2 border-dashed border-teal-300 text-teal-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors text-sm"
                                 >
                                    <Plus size={16} /> 新增一位
                                 </button>
                             )}
                             
                             <div className="text-[10px] text-orange-400 mt-2 font-medium">
                                 * 請務必輸入「全名」以利系統配對
                             </div>
                        </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="relative z-10 flex gap-4 mt-12 pt-8 border-t border-gray-100">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              currentStep === 0 ? 'opacity-0 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <ArrowLeft size={24} />
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg text-lg ${
              !canProceed 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLastQuestion ? '查看結果' : '下一題'} <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;