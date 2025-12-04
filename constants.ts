import React from 'react';
import { AnimalType, QuizQuestion } from "./types";

export const TEACHER_EMAIL = "carlchen723@gmail.com";

// Simplified SVG paths for cute animals
export const ANIMAL_DETAILS: Record<AnimalType, { svg: React.ReactNode; color: string; label: string; description: string }> = {
  [AnimalType.OWL]: { 
    svg: React.createElement("svg", { viewBox: "0 0 100 100", className: "w-full h-full" },
      React.createElement("circle", { cx: "50", cy: "50", r: "45", fill: "#DDD6FE" }),
      React.createElement("path", { d: "M30 40 Q50 60 70 40", stroke: "#5B21B6", strokeWidth: "4", fill: "none" }),
      React.createElement("circle", { cx: "35", cy: "45", r: "8", fill: "#5B21B6" }),
      React.createElement("circle", { cx: "65", cy: "45", r: "8", fill: "#5B21B6" }),
      React.createElement("path", { d: "M45 55 L50 65 L55 55", fill: "#5B21B6" }),
      React.createElement("path", { d: "M20 30 L30 20 M80 30 L70 20", stroke: "#5B21B6", strokeWidth: "4" })
    ), 
    color: 'bg-purple-100 text-purple-800', 
    label: '夜行貓頭鷹',
    description: '你擁有藝術家般的靈魂，夜晚是你靈感最豐富的時候。雖然在白天可能看起來懶洋洋的，但一到深夜，你的專注力與創造力會達到頂峰。你需要一個同樣尊重夜晚寧靜的室友。'
  },
  [AnimalType.LARK]: { 
    svg: React.createElement("svg", { viewBox: "0 0 100 100", className: "w-full h-full" },
        React.createElement("circle", { cx: "50", cy: "50", r: "45", fill: "#FEF3C7" }),
        React.createElement("circle", { cx: "35", cy: "40", r: "5", fill: "#92400E" }),
        React.createElement("circle", { cx: "65", cy: "40", r: "5", fill: "#92400E" }),
        React.createElement("path", { d: "M45 50 L55 50 L50 58 Z", fill: "#D97706" }),
        React.createElement("path", { d: "M10 50 Q30 20 50 10 Q70 20 90 50", fill: "none", stroke: "#D97706", strokeWidth: "3", strokeDasharray: "5,5" })
    ), 
    color: 'bg-yellow-100 text-yellow-800', 
    label: '晨型雲雀',
    description: '你是自律與效率的代名詞。當第一道陽光灑下時，你已經準備好迎接挑戰。你喜歡規律的生活節奏，能夠把每一天都安排得井井有條，充滿正能量。'
  },
  [AnimalType.KOALA]: { 
    svg: React.createElement("svg", { viewBox: "0 0 100 100", className: "w-full h-full" },
        React.createElement("circle", { cx: "50", cy: "50", r: "45", fill: "#E5E7EB" }),
        React.createElement("circle", { cx: "20", cy: "30", r: "15", fill: "#9CA3AF" }),
        React.createElement("circle", { cx: "80", cy: "30", r: "15", fill: "#9CA3AF" }),
        React.createElement("circle", { cx: "35", cy: "50", r: "5", fill: "#374151" }),
        React.createElement("circle", { cx: "65", cy: "50", r: "5", fill: "#374151" }),
        React.createElement("ellipse", { cx: "50", cy: "60", rx: "10", ry: "8", fill: "#1F2937" })
    ), 
    color: 'bg-gray-100 text-gray-800', 
    label: '佛系無尾熊',
    description: '你的性格溫和，像是大家的避風港。對生活沒有太多強求，隨遇而安是你的人生哲學。在宿舍裡，你最重視的是能夠好好睡一覺，不喜歡捲入無謂的紛爭。'
  },
  [AnimalType.PUPPY]: { 
    svg: React.createElement("svg", { viewBox: "0 0 100 100", className: "w-full h-full" },
        React.createElement("circle", { cx: "50", cy: "50", r: "45", fill: "#FFEDD5" }),
        React.createElement("path", { d: "M20 30 C20 30 10 60 30 60", fill: "#EA580C" }),
        React.createElement("path", { d: "M80 30 C80 30 90 60 70 60", fill: "#EA580C" }),
        React.createElement("circle", { cx: "35", cy: "45", r: "6", fill: "#7C2D12" }),
        React.createElement("circle", { cx: "65", cy: "45", r: "6", fill: "#7C2D12" }),
        React.createElement("circle", { cx: "50", cy: "55", r: "8", fill: "#431407" }),
        React.createElement("path", { d: "M50 65 Q50 75 40 75 M50 65 Q50 75 60 75", stroke: "#431407", strokeWidth: "2", fill: "none" })
    ), 
    color: 'bg-orange-100 text-orange-800', 
    label: '熱情小狗',
    description: '你天生就是團體中的開心果！害怕孤單，喜歡與人分享生活中的大小事。對你來說，宿舍不只是睡覺的地方，更是與朋友建立深厚感情的基地。'
  },
  [AnimalType.CAT]: { 
    svg: React.createElement("svg", { viewBox: "0 0 100 100", className: "w-full h-full" },
        React.createElement("circle", { cx: "50", cy: "50", r: "45", fill: "#DBEAFE" }),
        React.createElement("path", { d: "M20 20 L30 40 L40 25 Z", fill: "#2563EB" }),
        React.createElement("path", { d: "M80 20 L70 40 L60 25 Z", fill: "#2563EB" }),
        React.createElement("path", { d: "M35 50 Q50 60 65 50", stroke: "#1E40AF", strokeWidth: "2", fill: "none" }),
        React.createElement("circle", { cx: "40", cy: "45", r: "4", fill: "#1E40AF" }),
        React.createElement("circle", { cx: "60", cy: "45", r: "4", fill: "#1E40AF" }),
        React.createElement("path", { d: "M20 55 L5 50 M20 60 L5 65 M80 55 L95 50 M80 60 L95 65", stroke: "#1E40AF", strokeWidth: "2" })
    ), 
    color: 'bg-blue-100 text-blue-800', 
    label: '潔癖優雅貓',
    description: '你優雅而獨立，擁有自己的一套生活美學。你非常注重個人空間與隱私，對於環境的氣味與整潔有著不容妥協的堅持，雖然話不多，但心思非常細膩。'
  },
  [AnimalType.PEACOCK]: { 
    svg: React.createElement("svg", { viewBox: "0 0 100 100", className: "w-full h-full" },
        React.createElement("circle", { cx: "50", cy: "50", r: "45", fill: "#FCE7F3" }),
        React.createElement("path", { d: "M50 10 L60 25 L50 20 L40 25 Z", fill: "#BE185D" }),
        React.createElement("circle", { cx: "40", cy: "45", r: "5", fill: "#831843" }),
        React.createElement("circle", { cx: "60", cy: "45", r: "5", fill: "#831843" }),
        React.createElement("path", { d: "M50 55 L60 50 L50 65 L40 50 Z", fill: "#FBCFE8", stroke: "#BE185D", strokeWidth: "2" }),
        React.createElement("path", { d: "M30 70 Q50 80 70 70", stroke: "#831843", strokeWidth: "2", fill: "none" })
    ), 
    color: 'bg-pink-100 text-pink-800', 
    label: '派對孔雀',
    description: '你自信大方，不拘小節。房間亂一點對你來說是「亂中有序」的藝術表現。你喜歡嘗試新鮮事物，生活豐富多彩，不太會在意那些瑣碎的規矩。'
  },
  [AnimalType.HAMSTER]: { 
    svg: React.createElement("svg", { viewBox: "0 0 100 100", className: "w-full h-full" },
        React.createElement("circle", { cx: "50", cy: "50", r: "45", fill: "#FFE4E6" }),
        React.createElement("circle", { cx: "15", cy: "30", r: "12", fill: "#FDA4AF" }),
        React.createElement("circle", { cx: "85", cy: "30", r: "12", fill: "#FDA4AF" }),
        React.createElement("circle", { cx: "35", cy: "45", r: "6", fill: "#881337" }),
        React.createElement("circle", { cx: "65", cy: "45", r: "6", fill: "#881337" }),
        React.createElement("ellipse", { cx: "50", cy: "60", rx: "8", ry: "6", fill: "#FB7185" }),
        React.createElement("path", { d: "M40 60 L30 55 M60 60 L70 55", stroke: "#881337", strokeWidth: "2" }),
        React.createElement("path", { d: "M45 70 Q50 75 55 70", stroke: "#881337", strokeWidth: "2", fill: "none" })
    ), 
    color: 'bg-rose-100 text-rose-800', 
    label: '窩窩倉鼠',
    description: '你像小倉鼠一樣喜歡築巢，對於「溫暖」和「安全感」有極高的需求。你超級怕冷，喜歡把宿舍佈置得舒舒服服，囤積喜歡的零食。你是最愛待在宿舍的戀家一族！'
  },
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
      { value: 1, text: "無法忍受！一定要馬上丟掉或封好 (稍微潔癖)" },
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
    text: "關於「宿舍氣味」，你最無法忍受的是？",
    options: [
      { value: 1, text: "濃郁的食物味 (如鹹酥雞、泡麵)" },
      { value: 2, text: "潮濕的霉味或汗臭味" },
      { value: 3, text: "還好，我鼻子不太靈敏，噴點香水就好" },
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
    text: "你預計回家的頻率大概是？(這題很重要喔！)",
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
      { value: 3, text: "完全聽不到...通常是室友叫醒我的" },
    ]
  },
  {
    id: 8,
    text: "室友想跟你借洗髮精或是延長線，你的界線是？",
    options: [
      { value: 1, text: "不太喜歡，個人用品希望分開" },
      { value: 2, text: "問過我就好，偶爾借沒關係" },
      { value: 3, text: "拿去用啊！大家都是好朋友不計較" },
    ]
  },
  {
    id: 9,
    text: "關於冷氣溫度，你比較偏向？",
    options: [
      { value: 1, text: "超級怕冷！27 度還要蓋厚被子" },
      { value: 2, text: "一般體質，25-26 度最舒適" },
      { value: 3, text: "超怕熱！一定要 23-24 度以下不然會生氣" },
    ]
  },
  {
    id: 10,
    text: "若室友正在講電話，音量稍微大了一點，你會？",
    options: [
      { value: 1, text: "戴上降噪耳機，默默忍受" },
      { value: 2, text: "會稍微暗示或是傳訊息請他小聲點" },
      { value: 3, text: "直接加入話題！(或是直接叫他閉嘴)" },
    ]
  },
  {
    id: 11,
    text: "最後一題！你有想跟誰住嗎？",
    options: [
      { value: 1, text: "沒有 (隨緣/都可以)" },
      { value: 2, text: "有 (我有想住的人選)", hasInput: true },
    ]
  }
];