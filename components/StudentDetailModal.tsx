import React, { useMemo } from 'react';
import { StudentProfile } from '../types';
import { ANIMAL_DETAILS, QUIZ_QUESTIONS } from '../constants';
import { findBestMatches } from '../services/matchingService';
import { X, Heart, AlertOctagon } from 'lucide-react';

interface Props {
  student: StudentProfile;
  allStudents: StudentProfile[];
  onClose: () => void;
}

const StudentDetailModal: React.FC<Props> = ({ student, allStudents, onClose }) => {
  const matches = useMemo(() => findBestMatches(student, allStudents), [student, allStudents]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-gray-200 z-50">
          <X size={20} />
        </button>

        {/* Left Side: Student Info */}
        <div className={`md:w-1/3 p-8 ${ANIMAL_DETAILS[student.animalType].color.replace('text-', 'bg-').replace('100', '50')} border-r border-gray-100 overflow-y-auto`}>
           <div className="w-32 h-32 mx-auto mb-6">
             {ANIMAL_DETAILS[student.animalType].svg}
           </div>
           <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">{student.name}</h2>
           <div className="text-center mb-6">
             <span className="bg-white/80 px-3 py-1 rounded-full text-sm font-bold text-gray-600 border border-gray-200">
               {student.animalName}
             </span>
           </div>

           <div className="space-y-4">
             <div className="bg-white/60 p-4 rounded-xl">
               <h4 className="font-bold text-gray-700 mb-2 text-sm">指定室友</h4>
               <div className="flex flex-wrap gap-1">
                   {student.preferredRoommates?.map((n, i) => (
                       <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                           {n}
                       </span>
                   ))}
               </div>
             </div>
             
             <div className="bg-white/60 p-4 rounded-xl">
                <h4 className="font-bold text-gray-700 mb-2 text-sm">生活雷達圖</h4>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span>整潔度</span> <span className="font-bold">{student.habits.cleanliness}/10</span></div>
                    <div className="flex justify-between"><span>社交能量</span> <span className="font-bold">{student.habits.socialEnergy}/10</span></div>
                    <div className="flex justify-between"><span>噪音耐受</span> <span className="font-bold">{student.habits.noiseTolerance}/10</span></div>
                </div>
             </div>
           </div>
        </div>

        {/* Right Side: Analysis & Answers */}
        <div className="md:w-2/3 p-8 overflow-y-auto bg-white">
            
            {/* Recommendations */}
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Heart className="text-pink-500" size={20} /> 系統推薦室友
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {matches.best.map((m, i) => (
                    <div key={m.student.id} className="border border-green-100 bg-green-50/50 p-4 rounded-xl text-center hover:shadow-md transition-shadow">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{m.score}%</div>
                        <div className="font-bold text-gray-700">{m.student.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{m.student.animalName}</div>
                    </div>
                ))}
            </div>

            {matches.worst && matches.worst.score < 50 && (
                <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
                    <AlertOctagon className="text-red-500 flex-shrink-0" />
                    <div>
                        <div className="font-bold text-red-800 mb-1">注意：潛在衝突</div>
                        <p className="text-sm text-red-600">與 <span className="font-bold">{matches.worst.student.name}</span> 的契合度僅 {matches.worst.score}%，生活習慣差異大。</p>
                    </div>
                </div>
            )}

            {/* Raw Answers */}
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-t border-gray-100 pt-6">原始問卷紀錄</h3>
            <div className="space-y-3">
                {QUIZ_QUESTIONS.map(q => {
                    const ans = student.rawAnswers?.find(a => a.questionId === q.id);
                    return (
                        <div key={q.id} className="text-sm border-b border-gray-50 pb-2">
                            <p className="text-gray-400 mb-1">Q{q.id}. {q.text}</p>
                            <p className="font-bold text-gray-700">
                                {ans?.answerText}
                                {ans?.extraText && <span className="text-blue-500 ml-2">({ans.extraText})</span>}
                            </p>
                        </div>
                    );
                })}
            </div>

        </div>

      </div>
    </div>
  );
};

export default StudentDetailModal;