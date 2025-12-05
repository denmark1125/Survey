import React from 'react';
import { AnimalType, QuizQuestion } from "./types";

export const TEACHER_EMAIL = "carlchen723@gmail.com";

// Artistic SVG Illustrations (Premium Picture Book Style)
export const ANIMAL_DETAILS: Record<AnimalType, { svg: React.ReactNode; color: string; label: string; description: string; englishLabel: string; themeColor: string }> = {
  [AnimalType.OWL]: { 
    svg: React.createElement("svg", { viewBox: "0 0 200 200", className: "w-full h-full" },
      React.createElement("circle", { cx: "100", cy: "100", r: "90", fill: "#E9D5FF" }), // Lavender Base
      React.createElement("path", { d: "M50 70 Q100 20 150 70", fill: "#8B5CF6", opacity: "0.2" }), // Ears Back
      React.createElement("circle", { cx: "70", cy: "90", r: "25", fill: "#fff" }), // Left Eye White
      React.createElement("circle", { cx: "130", cy: "90", r: "25", fill: "#fff" }), // Right Eye White
      React.createElement("circle", { cx: "70", cy: "90", r: "10", fill: "#4C1D95" }), // Left Pupil
      React.createElement("circle", { cx: "130", cy: "90", r: "10", fill: "#4C1D95" }), // Right Pupil
      React.createElement("path", { d: "M90 110 L100 125 L110 110 Z", fill: "#F59E0B" }), // Beak
      React.createElement("path", { d: "M40 140 Q100 180 160 140", stroke: "#8B5CF6", strokeWidth: "5", fill: "none", opacity: "0.5" }), // Wings hint
      React.createElement("path", { d: "M100 20 V40", stroke: "#6D28D9", strokeWidth: "3" }), // Moon thread
      React.createElement("circle", { cx: "100", cy: "50", r: "8", fill: "#FEF3C7" }) // Moon/Star charm
    ), 
    color: 'bg-purple-100 text-purple-800', 
    label: '夜行貓頭鷹',
    englishLabel: 'The Night Owl',
    themeColor: '#E9D5FF',
    description: '你擁有藝術家般的靈魂，深夜往往是你精神最好的時刻。這代表你的生理時鐘比較晚，若環境允許，你會希望保留一點深夜的個人時光，安靜地做自己的事。'
  },
  [AnimalType.LARK]: { 
    svg: React.createElement("svg", { viewBox: "0 0 200 200", className: "w-full h-full" },
        React.createElement("circle", { cx: "100", cy: "100", r: "90", fill: "#FEF3C7" }), // Yellow Base
        React.createElement("path", { d: "M100 30 L120 60 L80 60 Z", fill: "#D97706" }), // Crest
        React.createElement("circle", { cx: "70", cy: "80", r: "10", fill: "#92400E" }),
        React.createElement("circle", { cx: "130", cy: "80", r: "10", fill: "#92400E" }),
        React.createElement("path", { d: "M90 100 L110 100 L100 115 Z", fill: "#F59E0B" }), // Beak
        React.createElement("path", { d: "M60 130 Q100 160 140 130", stroke: "#D97706", strokeWidth: "5", fill: "none" }), // Smile/Chest
        React.createElement("path", { d: "M20 100 Q50 50 80 100", fill: "none", stroke: "#FBBF24", strokeWidth: "8", opacity: "0.5" }), // Wing L
        React.createElement("path", { d: "M180 100 Q150 50 120 100", fill: "none", stroke: "#FBBF24", strokeWidth: "8", opacity: "0.5" })  // Wing R
    ), 
    color: 'bg-yellow-100 text-yellow-800', 
    label: '晨型雲雀',
    englishLabel: 'The Early Lark',
    themeColor: '#FEF3C7',
    description: '你是自律的代名詞。當陽光灑下，你已準備好迎接挑戰。規律的生活讓你充滿正能量，對你來說，良好的睡眠品質與早晨的清新空氣是你維持活力的來源。'
  },
  [AnimalType.KOALA]: { 
    svg: React.createElement("svg", { viewBox: "0 0 200 200", className: "w-full h-full" },
        React.createElement("circle", { cx: "100", cy: "100", r: "90", fill: "#E5E7EB" }), // Gray Base
        React.createElement("circle", { cx: "40", cy: "60", r: "25", fill: "#9CA3AF" }), // Ear L
        React.createElement("circle", { cx: "160", cy: "60", r: "25", fill: "#9CA3AF" }), // Ear R
        React.createElement("circle", { cx: "75", cy: "90", r: "8", fill: "#374151" }), // Eye
        React.createElement("circle", { cx: "125", cy: "90", r: "8", fill: "#374151" }), // Eye
        React.createElement("ellipse", { cx: "100", cy: "110", rx: "20", ry: "25", fill: "#1F2937" }), // Big Nose
        React.createElement("path", { d: "M50 150 Q100 170 150 150", stroke: "#9CA3AF", strokeWidth: "15", strokeLinecap: "round" }) // Arms holding something
    ), 
    color: 'bg-gray-100 text-gray-800', 
    label: '佛系無尾熊',
    englishLabel: 'The Zen Koala',
    themeColor: '#E5E7EB',
    description: '你的性格溫和，隨遇而安是你的人生哲學。在團體生活中，你通常是最好相處的那一位，只要彼此尊重，你在任何環境都能找到讓自己舒適的角落。'
  },
  [AnimalType.PUPPY]: { 
    svg: React.createElement("svg", { viewBox: "0 0 200 200", className: "w-full h-full" },
        React.createElement("circle", { cx: "100", cy: "100", r: "90", fill: "#FFEDD5" }), // Orange Base
        React.createElement("path", { d: "M30 60 C30 60 10 120 50 120", fill: "#EA580C" }), // Ear L Floppy
        React.createElement("path", { d: "M170 60 C170 60 190 120 150 120", fill: "#EA580C" }), // Ear R Floppy
        React.createElement("circle", { cx: "70", cy: "90", r: "12", fill: "#7C2D12" }), // Eye
        React.createElement("circle", { cx: "130", cy: "90", r: "12", fill: "#7C2D12" }), // Eye
        React.createElement("ellipse", { cx: "100", cy: "110", rx: "15", ry: "10", fill: "#431407" }), // Nose
        React.createElement("path", { d: "M100 120 L100 140 M80 140 Q100 160 120 140", stroke: "#431407", strokeWidth: "4", fill: "none" }), // Mouth
        React.createElement("path", { d: "M85 155 Q100 170 115 155", fill: "#FECACA" }) // Tongue
    ), 
    color: 'bg-orange-100 text-orange-800', 
    label: '熱情小狗',
    englishLabel: 'The Friendly Puppy',
    themeColor: '#FFEDD5',
    description: '你是團體中的開心果！喜歡與人互動，分享生活中的大小事。你帶有溫暖的特質，喜歡熱鬧的氛圍，通常能快速適應團體生活，是凝聚室友感情的重要角色。'
  },
  [AnimalType.CAT]: { 
    svg: React.createElement("svg", { viewBox: "0 0 200 200", className: "w-full h-full" },
        React.createElement("circle", { cx: "100", cy: "100", r: "90", fill: "#DBEAFE" }), // Blue Base
        React.createElement("path", { d: "M40 40 L60 90 L80 50 Z", fill: "#2563EB" }), // Ear L
        React.createElement("path", { d: "M160 40 L140 90 L120 50 Z", fill: "#2563EB" }), // Ear R
        React.createElement("path", { d: "M70 100 Q100 120 130 100", stroke: "#1E40AF", strokeWidth: "3", fill: "none" }), // Eyes closed curve
        React.createElement("circle", { cx: "100", cy: "110", r: "5", fill: "#1E40AF" }), // Nose
        React.createElement("path", { d: "M100 115 L90 130 M100 115 L110 130", stroke: "#1E40AF", strokeWidth: "2" }), // Mouth
        React.createElement("path", { d: "M40 110 L10 100 M40 120 L10 130 M160 110 L190 100 M160 120 L190 130", stroke: "#1E40AF", strokeWidth: "2" }) // Whiskers
    ), 
    color: 'bg-blue-100 text-blue-800', 
    label: '潔癖優雅貓',
    englishLabel: 'The Elegant Cat',
    themeColor: '#DBEAFE',
    description: '你優雅而獨立，擁有自己的生活美學。你比較注重個人空間與隱私，對於環境的氣味與整潔有一套自己的標準。雖然話不多，但心思細膩，懂得尊重他人的界線。'
  },
  [AnimalType.PEACOCK]: { 
    svg: React.createElement("svg", { viewBox: "0 0 200 200", className: "w-full h-full" },
        React.createElement("circle", { cx: "100", cy: "100", r: "90", fill: "#FCE7F3" }), // Pink Base
        React.createElement("path", { d: "M100 20 L120 50 L100 40 L80 50 Z", fill: "#BE185D" }), // Crown
        React.createElement("circle", { cx: "80", cy: "80", r: "10", fill: "#831843" }),
        React.createElement("circle", { cx: "120", cy: "80", r: "10", fill: "#831843" }),
        React.createElement("path", { d: "M100 90 L110 105 L90 105 Z", fill: "#FBCFE8", stroke: "#BE185D", strokeWidth: "2" }), // Beak
        React.createElement("path", { d: "M60 140 Q100 170 140 140", stroke: "#831843", strokeWidth: "3", fill: "none" }), // Smile
        React.createElement("circle", { cx: "30", cy: "60", r: "15", fill: "#F472B6", opacity: "0.8" }), // Feather decoration
        React.createElement("circle", { cx: "170", cy: "60", r: "15", fill: "#F472B6", opacity: "0.8" })
    ), 
    color: 'bg-pink-100 text-pink-800', 
    label: '派對孔雀',
    englishLabel: 'The Social Peacock',
    themeColor: '#FCE7F3',
    description: '你自信大方，不拘小節。「亂中有序」是你的特色。你喜歡嘗試新鮮事物，生活豐富多彩，不太會去計較瑣碎的小細節，這樣的性格常讓周圍的氣氛變得輕鬆。'
  },
  [AnimalType.HAMSTER]: { 
    svg: React.createElement("svg", { viewBox: "0 0 200 200", className: "w-full h-full" },
        React.createElement("circle", { cx: "100", cy: "100", r: "90", fill: "#FFE4E6" }), // Rose Base
        React.createElement("circle", { cx: "40", cy: "60", r: "20", fill: "#FDA4AF" }), // Ear L
        React.createElement("circle", { cx: "160", cy: "60", r: "20", fill: "#FDA4AF" }), // Ear R
        React.createElement("circle", { cx: "70", cy: "90", r: "10", fill: "#881337" }), // Eye
        React.createElement("circle", { cx: "130", cy: "90", r: "10", fill: "#881337" }), // Eye
        React.createElement("ellipse", { cx: "100", cy: "105", rx: "12", ry: "8", fill: "#FB7185" }), // Nose
        React.createElement("path", { d: "M90 120 L80 130 M110 120 L120 130", stroke: "#881337", strokeWidth: "3" }), // Little hands
        React.createElement("ellipse", { cx: "50", cy: "110", rx: "15", ry: "10", fill: "#FECDD3", opacity: "0.6" }), // Cheek Blush
        React.createElement("ellipse", { cx: "150", cy: "110", rx: "15", ry: "10", fill: "#FECDD3", opacity: "0.6" })  // Cheek Blush
    ), 
    color: 'bg-rose-100 text-rose-800', 
    label: '窩窩倉鼠',
    englishLabel: 'The Cozy Hamster',
    themeColor: '#FFE4E6',
    description: '你像小倉鼠一樣喜歡溫馨的角落，對於「舒適度」和「安全感」比較重視。你可能比較怕冷，或者喜歡把座位佈置得暖暖的。對你來說，宿舍不僅是睡覺的地方，更是充電的小窩。'
  },
  [AnimalType.RABBIT]: { 
    svg: React.createElement("svg", { viewBox: "0 0 200 200", className: "w-full h-full" },
        React.createElement("circle", { cx: "100", cy: "100", r: "90", fill: "#CCFBF1" }), // Teal-100 Base
        React.createElement("path", { d: "M60 20 Q40 80 50 90", fill: "#99F6E4" }), // Ear L Long
        React.createElement("path", { d: "M140 20 Q160 80 150 90", fill: "#99F6E4" }), // Ear R Long
        React.createElement("circle", { cx: "75", cy: "90", r: "8", fill: "#115E59" }), // Eye
        React.createElement("circle", { cx: "125", cy: "90", r: "8", fill: "#115E59" }), // Eye
        React.createElement("path", { d: "M100 100 L95 110 L105 110 Z", fill: "#FB7185" }), // Nose
        React.createElement("path", { d: "M100 110 L100 125 M90 125 Q100 135 110 125", stroke: "#115E59", strokeWidth: "2", fill: "none" }), // Mouth
        React.createElement("ellipse", { cx: "50", cy: "110", rx: "10", ry: "8", fill: "#FDA4AF", opacity: "0.5" }), // Blush
        React.createElement("ellipse", { cx: "150", cy: "110", rx: "10", ry: "8", fill: "#FDA4AF", opacity: "0.5" })  // Blush
    ), 
    color: 'bg-teal-100 text-teal-800', 
    label: '害羞小兔',
    englishLabel: 'The Shy Rabbit',
    themeColor: '#CCFBF1',
    description: '你心思細膩，像小白兔一樣對聲音與環境的變化比較敏感。你喜歡擁有自己的安靜角落，雖然慢熟，但對熟悉的朋友非常貼心。在宿舍中，你需要一個能讓你完全放鬆、不受打擾的安全空間。'
  }
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: "當這世界安靜下來（晚上 11 點後），你的狀態通常是？",
    options: [
      { value: 1, text: "早已進入夢鄉或準備睡覺 (早睡派)" },
      { value: 2, text: "正在滑手機放鬆，準備洗洗睡" },
      { value: 3, text: "精神正好！開始追劇、打遊戲或趕作業 (熬夜派)" },
    ]
  },
  {
    id: 2,
    text: "看到桌上有一袋沒吃完的零食或垃圾，你會？",
    options: [
      { value: 3, text: "先放著，晚點再說，反正不會跑掉" },
      { value: 2, text: "看心情，如果有空就會順手收一下" },
      { value: 1, text: "會比較在意，希望能盡快丟掉或封好" },
    ]
  },
  {
    id: 3,
    text: "終於等到週末假日了！你理想的早晨是？",
    options: [
      { value: 1, text: "照常起床，利用假日早晨做點事" },
      { value: 2, text: "睡到自然醒，大概 10-11 點" },
      { value: 3, text: "直接睡到下午，彌補平日的疲勞" },
    ]
  },
  {
    id: 4,
    text: "關於「宿舍氣味」，你自己的感受是？",
    options: [
      { value: 1, text: "比較敏感，不喜歡太重的食物味" },
      { value: 2, text: "不喜歡霉味或汗臭味" },
      { value: 3, text: "還好，我鼻子不太靈敏，通風就好" },
    ]
  },
  {
    id: 5,
    text: "如果在宿舍有一段完全空閒的時間，你會選擇？",
    options: [
      { value: 1, text: "戴上耳機，沉浸在自己的世界 (睡覺/看書)" },
      { value: 2, text: "打給朋友聊天，或是找室友抬槓" },
      { value: 3, text: "待不住，想出門晃晃" },
    ]
  },
  {
    id: 6,
    text: "你預計回家的頻率大概是？", 
    options: [
      { value: 1, text: "每週都回家，宿舍只是週間旅館" },
      { value: 2, text: "偶爾回家，大概一個月 1-2 次" },
      { value: 3, text: "很少回家，假日幾乎都待在宿舍" },
    ]
  },
  {
    id: 7,
    text: "鬧鐘響了！這時候你的反應通常是？",
    options: [
      { value: 1, text: "一響秒醒，立刻關掉避免吵到人" },
      { value: 2, text: "賴床一下，需要響個幾次才甘願" },
      { value: 3, text: "容易睡很熟...有時候會聽不到" },
    ]
  },
  {
    id: 8,
    text: "室友想跟你借洗髮精或是延長線，你的界線是？",
    options: [
      { value: 1, text: "比較希望個人用品分開使用" },
      { value: 2, text: "問過我就好，偶爾借沒關係" },
      { value: 3, text: "拿去用啊！大家互相幫忙沒問題" },
    ]
  },
  {
    id: 9,
    text: "關於冷氣溫度，你比較偏向？",
    options: [
      { value: 1, text: "比較怕冷，喜歡溫暖一點或蓋厚被子" },
      { value: 2, text: "一般體質，25-26 度最舒適" },
      { value: 3, text: "比較怕熱，喜歡 23-24 度以下的涼爽環境" },
    ]
  },
  {
    id: 10,
    text: "若室友正在講電話，音量稍微大了一點，你會？",
    options: [
      { value: 1, text: "比較需要安靜，可能會戴上降噪耳機" },
      { value: 2, text: "如果太久可能會稍微暗示或溝通" },
      { value: 3, text: "沒關係，我也喜歡熱鬧一點的聲音" },
    ]
  },
  {
    id: 11,
    text: "最後一題！關於下學期的住宿安排，你有什麼想法嗎？(僅供老師參考)",
    options: [
      { value: 1, text: "沒有特別想法 (隨緣/由老師安排)" },
      { value: 2, text: "有 (我有想住的人選)", hasInput: true },
      { value: 3, text: "不想換宿舍 (我想續住/維持現狀)" },
    ]
  }
];