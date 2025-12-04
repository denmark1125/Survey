import React, { useRef, useState } from 'react';
import { StudentProfile } from '../types';
import { ANIMAL_DETAILS } from '../constants';
import { RefreshCcw, Camera, CloudCheck } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Props {
  profile: StudentProfile;
  onRestart: () => void;
}

const ResultCard: React.FC<Props> = ({ profile, onRestart }) => {
  const details = ANIMAL_DETAILS[profile.animalType];
  const [isCapturing, setIsCapturing] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  const handleDownloadStory = async () => {
    if (!storyRef.current) return;
    setIsCapturing(true);
    try {
        const canvas = await html2canvas(storyRef.current, {
            scale: 2, 
            backgroundColor: null,
            useCORS: true
        });
        
        const link = document.createElement('a');
        link.download = `RoomieMatch_${profile.name}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    } catch (e) {
        console.error("Image generation failed", e);
        alert("圖片生成失敗，請稍後再試");
    } finally {
        setIsCapturing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto relative">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-teal-100 relative z-10">
        
        {/* Data Saved Badge */}
        <div className="bg-teal-600 text-white text-xs font-bold py-1 text-center flex items-center justify-center gap-1">
            <CloudCheck size={14} /> 資料已自動上傳雲端
        </div>

        <div className={`${details.color} p-8 text-center relative`}>
          <div className="w-32 h-32 mx-auto mb-4 animate-bounce drop-shadow-md">
            {details.svg}
          </div>
          <h2 className="text-3xl font-bold mb-1 tracking-tight">{profile.animalName}</h2>
          <p className="opacity-80 font-medium tracking-widest uppercase text-sm">{profile.animalType}</p>
        </div>

        <div className="p-8 space-y-6">
          
          {/* Psychological Analysis Section */}
          <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
            <h3 className="text-orange-800 font-bold mb-2 flex items-center gap-2">
               ✨ 性格解析
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              {profile.description}
            </p>
          </div>

          {/* Roommate Preference Display */}
          {profile.preferredRoommate && profile.preferredRoommate !== "無 (隨緣)" && (
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                 <p className="text-xs text-blue-600 mb-1 font-bold">已登記指定室友</p>
                 <p className="font-bold text-blue-900">{profile.preferredRoommate}</p>
            </div>
          )}

          {/* Tags */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">關鍵特質</h3>
            <div className="flex flex-wrap gap-2">
              {profile.traits.map((t, i) => (
                <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-100 space-y-3">
            
            <button
                onClick={handleDownloadStory}
                disabled={isCapturing}
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg hover:shadow-orange-200 hover:scale-[1.02]"
            >
                {isCapturing ? <RefreshCcw className="animate-spin" size={20}/> : <Camera size={20} />}
                下載 IG 限動圖卡
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
               結果已自動傳給老師，只要下載圖片留念即可
            </p>
          </div>
          
          <button onClick={onRestart} className="w-full text-gray-400 text-sm hover:text-gray-600 flex items-center justify-center gap-1 py-2">
              <RefreshCcw size={14} /> 重測一次
          </button>
        </div>
      </div>

      {/* Hidden IG Story Template */}
      <div className="absolute top-0 left-0 w-full z-[-1] opacity-0 pointer-events-none overflow-hidden" style={{ width: '400px' }}>
         <div ref={storyRef} className="w-[400px] h-[711px] bg-[#F0FDF4] relative flex flex-col items-center pt-20 px-8 text-center" style={{ fontFamily: '"Noto Sans TC", sans-serif' }}>
            <div className={`absolute top-0 left-0 w-full h-[40%] ${details.color.split(' ')[0]} rounded-b-[60px] z-0`}></div>
            <div className="absolute bottom-10 right-10 text-9xl opacity-10">🏡</div>
            <div className="absolute top-10 left-10 text-6xl opacity-20">✨</div>

            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="w-48 h-48 bg-white rounded-full p-4 shadow-xl mb-8 flex items-center justify-center">
                    {details.svg}
                </div>
                
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg w-full border-2 border-white">
                    <p className="text-gray-500 font-bold tracking-widest text-sm mb-2">我是</p>
                    <h1 className="text-4xl font-black text-gray-800 mb-2">{profile.animalName}</h1>
                    <p className="text-teal-600 font-bold text-lg mb-6">{profile.animalType}</p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {profile.traits.map((t, i) => (
                            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">#{t}</span>
                        ))}
                    </div>

                    <div className="text-left bg-gray-50 p-4 rounded-xl text-gray-600 text-sm leading-relaxed mb-4">
                        {profile.description.substring(0, 65)}...
                    </div>
                </div>

                <div className="mt-12 text-gray-400 font-bold tracking-widest text-sm">
                    校園動物系人格測驗
                </div>
                <div className="mt-2 text-teal-600 font-bold">
                    #心理測驗 #找到你的靈魂室友
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ResultCard;