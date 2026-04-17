// src/constants.js

// 1. 최초 1회 DB 생성용 명단 (이후에는 DB에서 직접 수정 가능)
export const initialStudents = [
  {id:1, n:"금채율"}, {id:2, n:"김라희"}, {id:3, n:"김민지"}, {id:4, n:"김수은"}, {id:5, n:"김시우"},
  {id:6, n:"박서정"}, {id:7, n:"이하윤"}, {id:8, n:"장세아"}, {id:9, n:"최예나"}, {id:10, n:"허수정"},
  {id:11, n:"황지인"}, {id:12, n:"김도운"}, {id:13, n:"김윤재"}, {id:14, n:"김정현"}, {id:15, n:"김태영"},
  {id:16, n:"김해준"}, {id:17, n:"박동민"}, {id:18, n:"서이환"}, {id:19, n:"윤호영"}, {id:20, n:"이서준"},
  {id:21, n:"이승현"}, {id:22, n:"임유성"}, {id:23, n:"장세형"}, {id:24, n:"조승원"}, {id:25, n:"차민서"}, {id:26, n:"배지훈"}
];

// 2. 통합 디자인 테마
export const THEME = {
  card: "bg-white/80 backdrop-blur-sm rounded-[24px] shadow-sm border border-amber-100 p-4 hover:shadow-md transition-all duration-300",
  button: "px-4 py-2 rounded-full font-bold transition-all active:scale-95 flex items-center gap-2",
  modal: "fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4",
  input: "w-full p-3 rounded-2xl border-2 border-amber-100 focus:border-amber-400 outline-none transition-all",
  container: "min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 md:p-8 font-sans text-slate-800"
};

// 3. SEL 가이드 및 효과음
export const SEL_GUIDES = {
  "1단계: 자기 인식": "내 감정과 강점을 발견하는 마법의 시간입니다.",
  "2단계: 자기 관리": "감정의 파도를 다스리는 힘을 기릅니다.",
  "3단계: 사회적 인식": "친구의 마음을 읽는 따뜻한 눈을 가집니다.",
  "4단계: 관계 기술": "서로를 돕는 마법 같은 대화를 나눕니다.",
  "5단계: 책임 있는 결정": "우리 모두를 위한 최고의 선택을 고민합니다."
};

export const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'good') { 
      osc.frequency.setValueAtTime(800, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); 
      osc.type = 'sine'; osc.start(); gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'bad') {
      osc.frequency.setValueAtTime(200, ctx.currentTime); 
      osc.type = 'sawtooth'; osc.start(); gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
};
