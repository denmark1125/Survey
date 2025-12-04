import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../constants';
import { QuizAnswer } from '../types';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface Props {
  onComplete: (name: string, answers: QuizAnswer[]) => void;
  isLoading: boolean;
}

const StudentQuiz: React.FC<Props> = ({ onComplete, isLoading }) => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 is Name input
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [extraInput, setExtraInput] = useState(''); // Text input for Q11

  const handleStart = () => {
    if (name.trim()) setCurrentStep(0);
  };

  const handleOptionSelect = (val: number, text: string, hasInput?: boolean) => {
    const currentQId = QUIZ_QUESTIONS[currentStep].id;
    
    // Clear extra input if switching options
    if (!hasInput) setExtraInput('');

    setAnswers(prev => {
      // Remove any existing answer for this question
      const filtered = prev.filter(a => a.questionId !== currentQId);
      return [...filtered, { 
          questionId: currentQId, 
          answerValue: val, 
          answerText: text,
          extraText: hasInput ? extraInput : undefined 
      }];
    });
  };

  const handleExtraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setExtraInput(val);
      
      const currentQId = QUIZ_QUESTIONS[currentStep].id;
      setAnswers(prev => {
          return prev.map(a => {
              if (a.questionId === currentQId) {
                  return { ...a, extraText: val };
              }
              return a;
          });
      });
  };

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
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Loader2 className="w-16 h-16 text-teal-600 animate-spin mb-6" />
        <h3 className="text-2xl font-bold text-gray-800">正在雲端儲存資料...</h3>
        <p className="text-gray-500 mt-2">AI 正在分析你的生活習慣</p>
      </div>
    );
  }

  // Name Input Screen
  if (currentStep === -1) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border-2 border-teal-100 text-center">
          <div className="inline-block p-4 rounded-full bg-teal-50 mb-6">
            <span className="text-4xl">👋</span>
          </div>
          <h2 className="text-3xl font-extrabold text-teal-900 mb-2">校園動物系人格測驗</h2>
          <p className="text-gray-500 mb-8">輸入你的名字，測出你的靈魂動物！</p>
          
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-left text-sm font-bold text-teal-700 mb-2 ml-1">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-5 text-xl font-bold text-gray-900 rounded-2xl border-4 border-teal-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all outline-none placeholder-gray-300 bg-white"
                placeholder="例：王小明"
              />
            </div>
            
            <button
              onClick={handleStart}
              disabled={!name.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xl py-5 px-6 rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-teal-200 flex items-center justify-center gap-3"
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

  // Validation: If selected option requires input, input must not be empty
  const selectedOption = question.options.find(o => o.value === currentSelection?.answerValue);
  const isInputRequired = selectedOption?.hasInput;
  const isInputValid = !isInputRequired || (currentSelection?.extraText && currentSelection.extraText.trim().length > 0);
  const canProceed = currentSelection && isInputValid;

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress Bar */}
      <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 px-1">
        <span>進度</span>
        <span>{currentStep + 1} / {QUIZ_QUESTIONS.length}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
        <div className="bg-teal-500 h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-teal-50 min-h-[500px] flex flex-col relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-teal-50 rounded-full opacity-50 z-0"></div>

        <div className="relative z-10 flex-grow">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 leading-snug">
            <span className="text-teal-500 mr-2 text-3xl align-bottom">Q{currentStep + 1}.</span>
            {question.text}
          </h3>

          <div className="space-y-4">
            {question.options.map((opt) => {
              const isSelected = currentSelection?.answerValue === opt.value;
              return (
                <div key={opt.value}>
                    <button
                    onClick={() => handleOptionSelect(opt.value, opt.text, opt.hasInput)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 group relative ${
                        isSelected 
                        ? 'border-teal-500 bg-teal-50 shadow-md' 
                        : 'border-gray-100 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                    >
                    <div className="flex items-center justify-between">
                        <span className={`font-medium text-lg ${isSelected ? 'text-teal-900' : 'text-gray-600'}`}>
                        {opt.text}
                        </span>
                        {isSelected && <CheckCircle2 className="text-teal-500" size={24} />}
                    </div>
                    </button>
                    
                    {/* Inline Text Input for Option */}
                    {isSelected && opt.hasInput && (
                        <div className="mt-2 ml-2 animate-in fade-in slide-in-from-top-2">
                             <input 
                                type="text"
                                placeholder="請輸入對方的名字..."
                                value={extraInput}
                                onChange={handleExtraInputChange}
                                autoFocus
                                className="w-full p-3 border-2 border-teal-200 rounded-xl focus:border-teal-500 outline-none text-gray-700 bg-white"
                             />
                        </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="relative z-10 flex gap-4 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex-1 py-4 rounded-xl font-bold text-gray-600 flex items-center justify-center gap-2 transition-colors ${
              currentStep === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft size={20} /> 上一題
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex-[2] py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
              !canProceed 
                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200 hover:scale-[1.02]'
            }`}
          >
            {isLastQuestion ? '提交並查看結果' : '下一題'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;