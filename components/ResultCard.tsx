import React, { useRef, useState } from 'react';
import { StudentProfile, AnimalType } from '../types';
import { ANIMAL_DETAILS } from '../constants';
import { RefreshCcw, Camera, CloudCheck, HeartHandshake, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Props {
  profile: StudentProfile;
  onRestart: () => void;
}

// Simple logic to determine the best animal match for a roommate
const getBestMatch = (type: AnimalType): AnimalType => {
  switch (type) {
    case AnimalType.OWL: return AnimalType.KOALA; // Owls need someone quiet like Koala
    case AnimalType.LARK: return AnimalType.LARK; // Larks need other Larks (sync schedule)
    case AnimalType.KOALA: return AnimalType.CAT; // Koala gets along with independent Cats
    case AnimalType.PUPPY: return AnimalType.PEACOCK; // Puppy & Peacock = Fun House
    case AnimalType.CAT: return AnimalType.LARK; // Cat likes the quiet of a Lark
    case AnimalType.PEACOCK: return AnimalType.PUPPY; // Peacock needs audience
    case AnimalType.HAMSTER: return AnimalType.RABBIT; // Hamsters need other quiet homebodies
    case AnimalType.RABBIT: return AnimalType.CAT; // Rabbits like the quiet independence of Cats
    default: return AnimalType.KOALA;
  }
};

const ResultCard: React.FC<Props> = ({ profile, onRestart }) => {
  const details = ANIMAL_DETAILS[profile.animalType];
  const bestMatchType = getBestMatch(profile.animalType);
  const bestMatchDetails = ANIMAL_DETAILS[bestMatchType];
  
  const [isCapturing, setIsCapturing] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  // Normalize scores for display (1-10)
  const socialPercent = profile.habits.socialEnergy * 10;
  const cleanPercent = profile.habits.cleanliness * 10;

  const handleDownloadStory = async () => {
    if (!storyRef.current) return;
    setIsCapturing(true);

    // Short timeout to ensure assets are ready (fonts, svgs)
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const canvas = await html2canvas(storyRef.current, {
            scale: 1, 
            backgroundColor: null,
            useCORS: true,
            logging: false,
            width: 1080,
            height: 1920,
            windowWidth: 1080,
            windowHeight: 1920
        });
        
        const link = document.createElement('a');
        link.download = `AnimalPersona_${profile.name}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
    } catch (e) {
        console.error("Image generation failed", e);
        alert("圖片生成失敗，請稍後再試");
    } finally {
        setIsCapturing(false);
    }
  };

  // Helper component for the Spectrum Slider (Rainbow Gradient)
  const SpectrumSlider = ({ labelLeft, labelRight, percent, title }: { labelLeft: string, labelRight: string, percent: number, title: string }) => (
      <div className="mb-6">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 px-1">
              <span>{labelLeft}</span>
              <span className="text-gray-400 font-normal">{title}</span>
              <span>{labelRight}</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-visible">
              {/* Rainbow Gradient Background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-purple-200 to-rose-200 opacity-80"></div>
              
              {/* Simple Marker Dot */}
              <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-out z-10 flex items-center justify-center"
                  style={{ left: `calc(${percent}% - 8px)` }}
              >
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="max-w-md mx-auto relative">
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border-4 border-white relative z-10 ring-1 ring-gray-100">
        
        {/* Data Saved Badge */}
        <div className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold py-1.5 text-center flex items-center justify-center gap-1 uppercase tracking-widest">
            <CloudCheck size={12} /> 資料已自動儲存
        </div>

        {/* Header Section */}
        <div className={`${details.color.replace('text-', 'bg-').replace('100', '50')} pt-10 pb-6 text-center relative`}>
          <div className="w-40 h-40 mx-auto mb-4 drop-shadow-xl transform hover:scale-105 transition-transform duration-500">
            {details.svg}
          </div>
          <h2 className="text-3xl font-black mb-1 tracking-tight text-gray-800">{profile.animalName}</h2>
          <div className="flex justify-center gap-2 mb-2">
            {profile.traits.slice(0, 2).map((t, i) => (
                <span key={i} className="px-3 py-1 bg-white/60 rounded-full text-[10px] font-bold text-gray-600">
                    #{t}
                </span>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Personality Description */}
          <div className="text-gray-600 text-sm leading-6 text-justify font-medium px-2">
              {profile.description}
          </div>

          {/* New Stats Sliders */}
          <div className="bg-stone-50/50 p-5 rounded-3xl border border-stone-100">
             <SpectrumSlider 
                title="社交能量"
                labelLeft="安靜獨處"
                labelRight="熱鬧聚會"
                percent={socialPercent}
             />
             <SpectrumSlider 
                title="生活習慣"
                labelLeft="隨性自在"
                labelRight="一塵不染"
                percent={cleanPercent}
             />
          </div>

          {/* Best Match Section */}
          <div className="bg-gradient-to-br from-white to-pink-50 p-4 rounded-3xl border border-pink-100 flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100 rounded-full blur-2xl opacity-50 -mr-10 -mt-10"></div>
              <div className="pl-2 relative z-10">
                  <div className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Sparkles size={12}/> 最佳拍檔
                  </div>
                  <div className="font-bold text-gray-700 text-lg">
                      {bestMatchDetails.label}
                  </div>
                  <div className="text-[10px] text-gray-500">
                      靈魂最契合的動物朋友
                  </div>
              </div>
              <div className="w-16 h-16 bg-white rounded-full p-2 shadow-sm border-2 border-white relative z-10">
                  {bestMatchDetails.svg}
              </div>
          </div>

          {/* Roommate Preference (Subtle) */}
          {profile.preferredRoommate && profile.preferredRoommate !== "無 (隨緣)" && (
            <div className="text-center">
                 <span className="text-[10px] bg-indigo-50 text-indigo-400 px-3 py-1 rounded-full font-bold">
                    指定室友/狀態：{profile.preferredRoommate}
                 </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            <button
                onClick={handleDownloadStory}
                disabled={isCapturing}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all bg-gray-900 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
                {isCapturing ? <RefreshCcw className="animate-spin" size={20}/> : <Camera size={20} />}
                下載收藏
            </button>
          </div>
          
          <button onClick={onRestart} className="w-full text-gray-400 text-xs font-bold hover:text-gray-600 flex items-center justify-center gap-1 py-2">
              <RefreshCcw size={12} /> 重新測驗
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------------------- */}
      {/* Hidden IG Story Template (Off-screen rendering for glitch-free capture)            */}
      {/* ---------------------------------------------------------------------------------- */}
      <div 
        ref={storyRef}
        id="capture-target"
        className="fixed"
        style={{ 
            left: '-2000px', // Move off-screen
            top: 0,
            width: '1080px', 
            height: '1920px', 
            zIndex: -1,
            backgroundColor: '#fdfbf7',
            fontFamily: '"Zen Maru Gothic", sans-serif'
        }}
      >
         <div className="w-full h-full relative flex flex-col pt-[150px] px-12 items-center">
            
            {/* Background Decor */}
            <div className={`absolute top-0 left-0 w-full h-[850px] ${details.color.replace('text-', 'bg-').replace('100', '100')} rounded-b-[150px] z-0 opacity-40`}></div>
            
            {/* Title */}
            <div className="relative z-10 text-center mb-10">
                <span className="inline-block px-6 py-2 bg-white/50 rounded-full text-2xl font-bold text-gray-600 tracking-widest mb-4">校園動物系人格測驗</span>
                <h1 className="text-[90px] font-black text-gray-800 leading-none">MY PERSONA</h1>
            </div>

            {/* Main Character */}
            <div className="relative z-10 w-[550px] h-[550px] bg-white rounded-full p-12 shadow-[0_30px_80px_rgba(0,0,0,0.08)] mb-12 flex items-center justify-center">
                {details.svg}
            </div>

            {/* Info Card */}
            <div className="relative z-10 w-[900px] bg-white/90 backdrop-blur-md p-14 rounded-[80px] shadow-2xl border-4 border-white flex flex-col gap-10">
                
                {/* Name & Type */}
                <div className="text-center border-b-4 border-gray-100 pb-10">
                    <div className="text-4xl font-bold text-gray-400 mb-2 font-serif italic">{details.englishLabel}</div>
                    <h2 className="text-[100px] font-black mb-4" style={{color: details.themeColor ? details.themeColor.replace('100', '600') : '#333'}}>{profile.animalName}</h2>
                    <div className="flex justify-center gap-4">
                        {profile.traits.map((t, i) => (
                            <span key={i} className="px-8 py-3 bg-gray-100 text-gray-600 rounded-full text-3xl font-bold">#{t}</span>
                        ))}
                    </div>
                </div>

                {/* Analysis Stats (Rainbow Bars for Image) */}
                <div className="space-y-8 px-4">
                    <div>
                        <div className="flex justify-between text-3xl font-bold text-gray-500 mb-3">
                            <span>I (內向)</span>
                            <span>社交能量</span>
                            <span>E (外向)</span>
                        </div>
                        <div className="h-8 bg-gray-100 rounded-full overflow-visible relative">
                             <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-purple-200 to-rose-200 opacity-60"></div>
                             {/* Simple Dot Marker for Image */}
                             <div className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg" style={{ left: `${socialPercent}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-3xl font-bold text-gray-500 mb-3">
                            <span>隨性</span>
                            <span>整潔指數</span>
                            <span>潔癖</span>
                        </div>
                        <div className="h-8 bg-gray-100 rounded-full overflow-visible relative">
                             <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-purple-200 to-rose-200 opacity-60"></div>
                             {/* Simple Dot Marker for Image */}
                             <div className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg" style={{ left: `${cleanPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Best Match (Big Section) */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-[50px] p-8 flex items-center justify-between border-4 border-pink-100 mt-4">
                    <div className="pl-8">
                         <div className="text-3xl font-bold text-pink-400 mb-2">BEST PARTNER</div>
                         <div className="text-6xl font-black text-gray-700">{bestMatchDetails.label}</div>
                    </div>
                    <div className="w-40 h-40 bg-white rounded-full p-4 shadow-sm border-4 border-white">
                        {bestMatchDetails.svg}
                    </div>
                </div>

            </div>
            
            <div className="absolute bottom-20 text-gray-400 font-bold text-4xl tracking-widest opacity-50">
                #生活風格 #自我探索
                <div className="text-xl mt-2 font-normal opacity-70">ID: {profile.id.slice(0,8)}</div>
            </div>

         </div>
      </div>
    </div>
  );
};

export default ResultCard;