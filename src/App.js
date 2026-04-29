/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, ShieldCheck, Heart, Lock, History, Plus, Minus, AlertTriangle,
  Sparkles, Star, Target, Settings, Trash2, ShoppingCart, CheckCircle2,
  BookOpen, Briefcase, Zap, Crown, Coins, BarChart3, MessageSquare, Send,
  Gavel, Leaf, TreeDeciduous, Bird, Flame, Shield, Printer, Timer, Store, Eye,
  Play, Pause, RotateCcw, Coffee, Download, Copy, StickyNote, LogOut, Sun, Smile
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// 🔧 CONFIG
// ══════════════════════════════════════════════════════════════
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/";
const DB_PATH = "v10Data";
const POLL_INTERVAL_MS = 5000;
const AUTH_KEY = "dalbodre_auth_v10";
const ATTENDANCE_DEADLINE = { hour: 8, minute: 30 };
const DEFAULT_BREAK_MS = 10 * 60 * 1000;
const ATTEND_COIN_PER_DAY = 1;   
const ATTEND_REP_PER_DAY  = 1;   

// ══════════════════════════════════════════════════════════════
// 🧰 UTILS
// ══════════════════════════════════════════════════════════════
const safeArray = (val) => {
  if (Array.isArray(val)) return val.filter(v => v !== null && v !== undefined && v !== '');
  if (typeof val === 'object' && val) return Object.values(val).filter(v => v !== null && v !== undefined && v !== '');
  return [];
};

const toInt = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const pad2 = (n) => String(n).padStart(2, '0');

const getWeekKey = (d = new Date()) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${pad2(weekNo)}`;
};

const getTodayWeekdayIdx = () => {
  const d = new Date().getDay();
  if (d === 0 || d === 6) return -1;
  return d - 1;
};

const isAttendanceOpen = () => {
  const now = new Date();
  const cutoff = now.getHours() * 60 + now.getMinutes();
  return cutoff < (ATTENDANCE_DEADLINE.hour * 60 + ATTENDANCE_DEADLINE.minute);
};

const formatDate = (ts = Date.now()) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const formatMs = (ms) => {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
};

// ══════════════════════════════════════════════════════════════
// 🎵 SOUND ENGINE
// ══════════════════════════════════════════════════════════════
const playSound = (type) => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const tone = (freq, dur, t0 = 0, waveType = 'sine', volume = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, now + t0);
      gain.gain.setValueAtTime(volume, now + t0);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t0 + dur);
      osc.start(now + t0); osc.stop(now + t0 + dur);
    };
    switch (type) {
      case 'good':      tone(600,0.1); tone(1200,0.2,0.1); break;
      case 'bad':       tone(300,0.15,0,'sawtooth'); tone(100,0.2,0.15,'sawtooth'); break;
      case 'buy':       tone(500,0.15,0,'square'); tone(900,0.15,0.1,'square'); break;
      case 'jackpot':   [440,554.37,659.25,880].forEach((f,i)=>tone(f,0.2,i*0.1,'triangle',0.2)); break;
      case 'chime':     [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,0.6,i*0.12,'sine',0.18)); break;
      case 'softChime': [659.25,830.61].forEach((f,i)=>tone(f,0.5,i*0.18,'sine',0.15)); break;
      case 'beep':      tone(880,0.12,0,'square',0.2); tone(880,0.12,0.2,'square',0.2); tone(880,0.12,0.4,'square',0.2); break;
      case 'attend':    tone(783.99,0.1,0,'sine',0.12); tone(1046.5,0.2,0.08,'sine',0.12); break;
      default:          tone(600,0.1);
    }
  } catch (_) {}
};

// ══════════════════════════════════════════════════════════════
// 🔐 AUTH
// ══════════════════════════════════════════════════════════════
const saveAuth = (role) => {
  const data = { role, issuedAt: Date.now(), expires: role === 'teacher' ? null : Date.now() + 24*60*60*1000 };
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(data)); } catch(_) {}
};
const loadAuth = (revokedAt) => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data) return false;
    if (data.expires !== null && Date.now() > data.expires) { localStorage.removeItem(AUTH_KEY); return false; }
    if (revokedAt && data.issuedAt < revokedAt) { localStorage.removeItem(AUTH_KEY); return false; }
    return data.role;
  } catch(_) { return false; }
};
const clearAuth = () => { try { localStorage.removeItem(AUTH_KEY); } catch(_) {} };

// ══════════════════════════════════════════════════════════════
// 📚 STATIC DATA
// ══════════════════════════════════════════════════════════════
const MOOD_OPTIONS = [
  { emoji: '😊', name: '맑음', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', barColor: '#fde047', message: '오늘도 빛나는 너를 응원해!' },
  { emoji: '😌', name: '구름조금', color: 'bg-emerald-100 border-emerald-300 text-emerald-800', barColor: '#6ee7b7', message: '괜찮아, 천천히 가도 돼.' },
  { emoji: '😔', name: '흐림', color: 'bg-slate-100 border-slate-300 text-slate-800', barColor: '#cbd5e1', message: '누구나 힘든 날도 있는 거야.' },
  { emoji: '😢', name: '비', color: 'bg-blue-100 border-blue-300 text-blue-800', barColor: '#93c5fd', message: '울어도 괜찮아. 비 온 뒤 땅이 굳어.' },
  { emoji: '⚡', name: '폭풍', color: 'bg-red-100 border-red-300 text-red-800', barColor: '#fca5a5', message: '지금 당장 도움이 필요해.' }
];

const ENNEAGRAM_DATA = {
  "1": { name:'1번(개혁가)', desc:'규칙과 책임을 잘 지켜요. 결과보다 과정의 꼼꼼함과 정직함을 알아주세요.' },
  "2": { name:'2번(조력자)', desc:'관계와 배려를 중시해요. "네 덕분에 고마워"라는 진심 어린 인사가 가장 큰 힘이 됩니다.' },
  "3": { name:'3번(성취자)', desc:'목표 지향적이에요. 구체적인 성과와 학급 기여를 명확히 인정해 주세요.' },
  "4": { name:'4번(예술가)', desc:'자신만의 개성과 감정을 중시해요. 독창적 아이디어를 존중해 주세요.' },
  "5": { name:'5번(사색가)', desc:'논리와 분석을 좋아해요. 혼자만의 시간과 지적 호기심을 칭찬해 주세요.' },
  "6": { name:'6번(충실가)', desc:'안전과 소속감을 중시해요. "우리가 함께한다"는 든든한 지지가 필요합니다.' },
  "7": { name:'7번(열정가)', desc:'재미와 자유를 추구해요. 긍정적 에너지와 호기심을 격려해 주세요.' },
  "8": { name:'8번(도전자)', desc:'강한 의지와 리더십. 스스로 결정할 기회와 신뢰를 부여해 주세요.' },
  "9": { name:'9번(평화주의자)', desc:'조화를 원해요. 다그치기보다 편안한 분위기에서 의견을 물어봐 주세요.' }
};

const DEFAULT_STUDENTS = [
  { id:1,  name:'금채율', role:'학급문고 정리',   group:1, isLeader:true,  enneagram:'2' },
  { id:2,  name:'김라희', role:'우유 배달',       group:1, isLeader:false, enneagram:'9' },
  { id:3,  name:'김민지', role:'다툼 중재자',     group:1, isLeader:false, enneagram:'6' },
  { id:4,  name:'김수은', role:'생활태도 체크',   group:1, isLeader:false, enneagram:'1' },
  { id:5,  name:'김시우', role:'칠판 정리',       group:2, isLeader:true,  enneagram:'3' },
  { id:6,  name:'박서정', role:'질서 관리',       group:2, isLeader:false, enneagram:'8' },
  { id:7,  name:'이하윤', role:'학급문고 정리',   group:2, isLeader:false, enneagram:'4' },
  { id:8,  name:'장세아', role:'문 닫기',         group:2, isLeader:false, enneagram:'7' },
  { id:9,  name:'최예나', role:'우유 배달',       group:3, isLeader:true,  enneagram:'' },
  { id:10, name:'허수정', role:'감찰사',          group:3, isLeader:false, enneagram:'' },
  { id:11, name:'황지인', role:'칠판 정리',       group:3, isLeader:false, enneagram:'' },
  { id:12, name:'김도운', role:'생활 배출물 관리', group:3, isLeader:false, enneagram:'' },
  { id:13, name:'김윤재', role:'과제 확인',       group:4, isLeader:true,  enneagram:'' },
  { id:14, name:'김정현', role:'질서 관리',       group:4, isLeader:false, enneagram:'' },
  { id:15, name:'김태영', role:'복사물 관리',     group:4, isLeader:false, enneagram:'' },
  { id:16, name:'김해준', role:'칠판 정리',       group:4, isLeader:false, enneagram:'' },
  { id:17, name:'박동민', role:'마음 약사',       group:5, isLeader:true,  enneagram:'' },
  { id:18, name:'서이환', role:'가습기 관리',     group:5, isLeader:false, enneagram:'' },
  { id:19, name:'윤호영', role:'우유 배달',       group:5, isLeader:false, enneagram:'' },
  { id:20, name:'이서준', role:'과제 확인',       group:5, isLeader:false, enneagram:'' },
  { id:21, name:'이승현', role:'신발장 관리',     group:6, isLeader:true,  enneagram:'' },
  { id:22, name:'임유성', role:'질서 관리',       group:6, isLeader:false, enneagram:'' },
  { id:23, name:'장세형', role:'다툼 중재자',     group:6, isLeader:false, enneagram:'' },
  { id:24, name:'조승원', role:'부착물 관리',     group:6, isLeader:false, enneagram:'' },
  { id:25, name:'차민서', role:'신발장 관리',     group:6, isLeader:false, enneagram:'' },
  { id:26, name:'배지훈', role:'문 닫기',         group:6, isLeader:false, enneagram:'' }
];

const SEL_OPTIONS = [
  { id:'sel1', short:'자기 인식',    name:'1단계: 자기 인식 (Self-awareness)' },
  { id:'sel2', short:'자기 관리',    name:'2단계: 자기 관리 (Self-management)' },
  { id:'sel3', short:'사회적 인식',  name:'3단계: 사회적 인식 (Social awareness)' },
  { id:'sel4', short:'관계 기술',    name:'4단계: 관계 기술 (Relationship skills)' },
  { id:'sel5', short:'책임있는 결정',name:'5단계: 책임 있는 의사결정 (Responsible decision-making)' }
];

const SEL_GUIDES = {
  "1단계: 자기 인식 (Self-awareness)": "상황: 그때 내 몸과 마음에서 어떤 느낌이 들었나요?\n다짐: 내 진짜 감정의 원인은 무엇이었고, 나의 어떤 강점을 활용해 이 마음을 보듬어줄 수 있을까요?",
  "2단계: 자기 관리 (Self-management)": "상황: 화가 나거나 포기하고 싶었을 때 내 행동은 어땠나요?\n다짐: 감정의 파도를 다스리고, 다음에는 어떻게 다르게 행동할지 구체적으로 적어보세요.",
  "3단계: 사회적 인식 (Social awareness)": "상황: 친구의 표정이나 말투를 보았을 때 친구의 마음은 어땠을 것 같나요?\n공감: 내가 그 친구의 입장이었다면 어떤 따뜻한 말이나 도움이 필요했을지 상상해 보세요.",
  "4단계: 관계 기술 (Relationship skills)": "상황: 대화나 활동 중 서로 오해가 생기거나 배려가 부족했던 순간을 적어보세요.\n행동: 마법 같은 우정을 다시 이어가기 위해 내가 먼저 할 수 있는 행동은 무엇인가요?",
  "5단계: 책임 있는 의사결정 (Responsible decision-making)": "상황: 우리 반의 규칙이나 분위기를 흐릴 수 있었던 나의 선택은 무엇이었나요?\n다짐: 나뿐만 아니라 우리 모두를 위해 더 나은 세상을 만드는 바른 선택을 실천해보세요."
};

const PRAISE_GUIDES = {
  "1단계: 자기 인식 (Self-awareness)": "칭찬 예시: 스스로의 장점을 알고 자신감 있게 도전한 모습을 칭찬해요!",
  "2단계: 자기 관리 (Self-management)": "칭찬 예시: 감정을 잘 조절하고 끝까지 해낸 모습을 칭찬해요!",
  "3단계: 사회적 인식 (Social awareness)": "칭찬 예시: 친구의 마음을 먼저 알아채고 공감해 준 모습을 칭찬해요!",
  "4단계: 관계 기술 (Relationship skills)": "칭찬 예시: 친구의 말을 잘 경청하고 배려한 모습을 칭찬해요!",
  "5단계: 책임 있는 의사결정 (Responsible decision-making)": "칭찬 예시: 학급을 위해 솔선수범하여 바른 선택을 한 모습을 칭찬해요!"
};

const EVOLUTION_TITLES = [
  "🌱 희망의 씨앗이 움터요","🌿 어린 나무가 자라나요","🌸 우리만의 꽃이 피었어요",
  "🔥 열정의 기운이 가득해요","✨ 전설의 세계수로 자라나요","🌟 전설의 세계수 완성!"
];

const INITIAL_DB = {
  students: DEFAULT_STUDENTS,
  rolesList: ['학급문고 정리','우유 배달','다툼 중재자','현령','감찰사','마음 약사'],
  settings: {
    title:"달보드레 행복 교실 🌸",
    menuNames:["행복 현황판","성찰과 성장","도움실","관리실"],
    targetScore:5000, forceShopOpen:false,
    dailyTheme:"4단계: 관계 기술 (Relationship skills)",
    themeDate:"",
    masterPw:"6505", helpRoomPw:"1111",
    showCumulativeStats:false, defaultBreakMs:DEFAULT_BREAK_MS,
    pointConfig:{ praiseBasic:10, praiseTheme:15, praiseSend:2, rescueCost:50, penalty:20 },
    authRevokedAt:0
  },
  coopQuest:{ q1Name:"다 함께 바른 생활",q1:50, q2Name:"환대와 응원",q2:20, q3Name:"전담수업 태도 우수",q3:20, q5Name:"청소 만점",q5:10, q4Name:"사이좋은 일주일",q4:100, goodWeek:0 },
  timeAttack:{ isActive:false, title:"", rewardRep:100, endTime:null, cleared:[] },
  timer:{ mode:'idle', startedAt:null, endTime:null, duration:null, isRunning:false, pausedElapsed:null, pausedRemaining:null },
  shopItems:[], pendingShopItems:[], funding:[], purchaseHistory:[],
  roleExp:{}, bonusCoins:{}, usedCoins:{}, penaltyCount:{},
  studentStatus:{}, pendingReflections:[], pendingPraises:[], pointLogs:[],
  approvedPraises:[], donations:[], manualRepOffset:0,
  allTime:{ exp:{}, penalty:{}, donate:{}, fund:{} },
  attendance:{}, attendanceBonus:{}, streakWeeks:{}, notes:{}, extraAttendDays:0,
  attendCoinLog:{}, questLog:{}, moodLog: {}, mistakes: []
};

// ══════════════════════════════════════════════════════════════
// 🎨 VISUAL: 세계수 렌더링
// ══════════════════════════════════════════════════════════════
const renderEvolution = (level) => {
  const sizes = {
    leaf:    "w-[80px]  h-[80px]  md:w-[100px] md:h-[100px]",
    spark:   "w-[50px]  h-[50px]  md:w-[60px]  md:h-[60px]",
    tree1:   "w-[100px] h-[100px] md:w-[130px] md:h-[130px]",
    bird1:   "w-[60px]  h-[60px]  md:w-[80px]  md:h-[80px]",
    tree2:   "w-[120px] h-[120px] md:w-[160px] md:h-[160px]",
    bird2:   "w-[75px]  h-[75px]  md:w-[100px] md:h-[100px]",
    tree3:   "w-[150px] h-[150px] md:w-[200px] md:h-[200px]",
    flame:   "w-[90px]  h-[90px]  md:w-[125px] md:h-[125px]",
    tree4:   "w-[180px] h-[180px] md:w-[240px] md:h-[240px]",
    bird4:   "w-[110px] h-[110px] md:w-[155px] md:h-[155px]",
  };
  switch(level){
    case 0: return <div className="flex items-center gap-3 text-emerald-400 animate-pulse"><Leaf className={sizes.leaf}/><Sparkles className={`${sizes.spark} text-yellow-400`}/></div>;
    case 1: return <div className="flex items-center gap-3 text-emerald-500 animate-bounce"><TreeDeciduous className={sizes.tree1}/><Bird className={`${sizes.bird1} text-orange-400`}/></div>;
    case 2: return <div className="flex items-center gap-3 text-pink-400"><TreeDeciduous className={`${sizes.tree2} fill-pink-200`}/><Bird className={`${sizes.bird2} text-orange-500 animate-pulse`}/></div>;
    case 3: return <div className="flex items-center gap-4 text-yellow-500 drop-shadow-xl"><TreeDeciduous className={`${sizes.tree3} fill-yellow-200`}/><Flame className={`${sizes.flame} text-red-500 animate-bounce`}/></div>;
    case 4:
    case 5: return <div className="flex items-center gap-4 text-yellow-300 drop-shadow-[0_0_40px_rgba(250,204,21,0.8)]"><TreeDeciduous className={`${sizes.tree4} fill-yellow-100 animate-pulse`}/><Bird className={`${sizes.bird4} fill-red-500 text-red-600 animate-bounce`}/></div>;
    default: return null;
  }
};

// ══════════════════════════════════════════════════════════════
// 🧩 MAIN APP COMPONENT
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [helpSubTab, setHelpSubTab] = useState('inspector');
  const [adminSubTab, setAdminSubTab] = useState('mission');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null);
  
  const [showPraiseModal, setShowPraiseModal] = useState(false);
  const [showRollingPaper, setShowRollingPaper] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [showNotesInReport, setShowNotesInReport] = useState(false);
  const [timeLeftString, setTimeLeftString] = useState("");
  const [attendAnim, setAttendAnim] = useState(null);

  const [moodModalStudent, setMoodModalStudent] = useState(null);
  const [showMistakeModal, setShowMistakeModal] = useState(false);
  const [mistakeText, setMistakeText] = useState("");
  const [mistakeLesson, setMistakeLesson] = useState("");

  const [praiseTarget, setPraiseTarget] = useState("");
  const [praiseFrom, setPraiseFrom] = useState("");
  const [praiseTag, setPraiseTag] = useState("");
  const [praiseText, setPraiseText] = useState("");
  
  const [refTarget, setRefTarget] = useState("");
  const [refTag, setRefTag] = useState("");
  const [refText, setRefText] = useState("");
  
  const [artisanTarget, setArtisanTarget] = useState("");
  const [artisanItemName, setArtisanItemName] = useState("");
  const [artisanItemPrice, setArtisanItemPrice] = useState("");
  
  const [rescueTarget, setRescueTarget] = useState("");
  const [rescuer, setRescuer] = useState("");

  const [selectedReportStudent, setSelectedReportStudent] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGroup, setNewStudentGroup] = useState("1");
  const [newStudentEnneagram, setNewStudentEnneagram] = useState("");
  const [manualScoreInput, setManualScoreInput] = useState("");
  const [masterPwInput, setMasterPwInput] = useState("");
  const [helpPwInput, setHelpPwInput] = useState("");
  
  const [taTitle, setTaTitle] = useState("바닥 쓰레기 0개 만들기!");
  const [taMins, setTaMins] = useState("10");
  const [taReward, setTaReward] = useState("100");

  const [timerDisplay, setTimerDisplay] = useState("00:00");
  const [timerStatus, setTimerStatus] = useState('idle');
  const [breakInput, setBreakInput] = useState("10");
  const [breakWarningLevel, setBreakWarningLevel] = useState(0);

  // ─── [버그수정] 더블클릭 방어: 처리 중인 칭찬 ID 추적 ───
  const processingPraiseRef = useRef(new Set());

  const [db, setDb] = useState(INITIAL_DB);
  const isEditingRef = useRef(false);
  const lockEditing = () => { isEditingRef.current = true; };
  const unlockEditing = () => { isEditingRef.current = false; };
  const lastNotifiedRef = useRef({});
  const dbRef = useRef(INITIAL_DB);

  useEffect(() => {
    if (isLoading) return;
    const saved = loadAuth(db.settings?.authRevokedAt || 0);
    if (saved) setIsAuthenticated(saved); else setIsAuthenticated(false);
  }, [isLoading, db.settings?.authRevokedAt]);

  useEffect(() => {
    let alive = true;
    const fetchLive = async () => {
      if (isEditingRef.current) return;
      try {
        const res = await fetch(`${DATABASE_URL}${DB_PATH}.json`);
        const data = await res.json();
        if (alive && data) {
          setDb(prev => {
            const next = {
              ...prev, ...data,
              settings:   { ...prev.settings,   ...(data.settings   || {}) },
              allTime:    { ...prev.allTime,    ...(data.allTime    || {}) },
              coopQuest:  { ...prev.coopQuest,  ...(data.coopQuest  || {}) },
              timeAttack: { ...prev.timeAttack, ...(data.timeAttack || {}) },
              timer:      { ...prev.timer,      ...(data.timer      || {}) }
            };
            dbRef.current = next;
            return next;
          });
        }
      } catch (_) {}
      if (alive) setIsLoading(false);
    };
    fetchLive();
    const iv = setInterval(fetchLive, POLL_INTERVAL_MS);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const sync = async (updates) => {
    dbRef.current = { ...dbRef.current, ...updates };
    setDb(dbRef.current);
    
    const dbUpdates = {};
    for (const key in updates) {
      if (updates[key] !== null && typeof updates[key] === 'object' && Object.keys(updates[key]).length === 0 && !Array.isArray(updates[key])) {
        dbUpdates[key] = null; 
      } else {
        dbUpdates[key] = updates[key];
      }
    }
    const finalJson = JSON.stringify(dbUpdates, (k, v) => v === undefined ? null : v);
    try { await fetch(`${DATABASE_URL}${DB_PATH}.json`,{method:'PATCH',body:finalJson}); } catch(_) {}
  };

  const logPoint = (sid, amount, reason) => {
    const curDb = dbRef.current;
    const newLog = { id: Date.now() + Math.random(), sid, name: allStats.find(s=>s.id===sid)?.name, amount, reason, date: formatDate() };
    sync({ pointLogs: [newLog, ...safeArray(curDb.pointLogs)].slice(0, 50) });
  };

  useEffect(() => {
    if (isLoading) return;
    const cur = dbRef.current;
    const wk  = getWeekKey();
    const att = cur.attendance || {};
    const old = Object.keys(att).filter(k => k !== wk);
    if (!old.length) return;
    const newStreaks = { ...(cur.streakWeeks || {}) };
    safeArray(cur.students).forEach(s => {
      old.forEach(k => {
        const days = (safeArray((att[k]||{})[s.id])).length + (cur.extraAttendDays||0);
        if (days < 5) newStreaks[s.id] = 0;
      });
    });
    sync({ attendance: { [wk]: att[wk] || {} }, attendanceBonus: { [wk]: (cur.attendanceBonus||{})[wk] || {} }, attendCoinLog: {}, moodLog: {}, streakWeeks: newStreaks, extraAttendDays: 0 });
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const todayStr = formatDate();
    if (db.settings?.themeDate !== todayStr) {
      const randomOpt = SEL_OPTIONS[Math.floor(Math.random() * SEL_OPTIONS.length)];
      sync({ settings: { ...db.settings, dailyTheme: randomOpt.name, themeDate: todayStr } });
    }
  }, [isLoading, db.settings?.themeDate]);

  useEffect(() => {
    if (!db.timeAttack?.isActive || !db.timeAttack?.endTime) return;
    const tick = () => {
      const diff = Math.floor((db.timeAttack.endTime - Date.now()) / 1000);
      setTimeLeftString(diff <= 0 ? "00:00 (종료)" : `${pad2(Math.floor(diff/60))}:${pad2(diff%60)}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [db.timeAttack?.isActive, db.timeAttack?.endTime]);

  useEffect(() => {
    const tick = () => {
      const t    = db.timer || {};
      const mode = t.mode || 'idle';
      setTimerStatus(mode);
      if (mode === 'idle') { setTimerDisplay("00:00"); setBreakWarningLevel(0); return; }
      let ms = 0;
      if (mode === 'class_sw') ms = t.isRunning ? Date.now()-t.startedAt : (t.pausedElapsed||0);
      else if (mode==='class_cd'||mode==='break') {
        ms = t.isRunning ? (t.endTime-Date.now()) : (t.pausedRemaining||0);
        if (ms<0) ms=0;
      }
      setTimerDisplay(formatMs(ms));
      if (mode==='break' && t.isRunning) {
        const sec = Math.floor(ms/1000);
        const key = `${t.endTime}_${sec}`;
        const notify = (lv,sound) => { if(lastNotifiedRef.current[key+'_'+lv]) return; lastNotifiedRef.current[key+'_'+lv]=true; playSound(sound); setBreakWarningLevel(lv); };
        if      (sec===180)                                 notify(1,'softChime');
        else if (sec===60)                                  notify(2,'softChime');
        else if (sec<=30&&sec>0&&sec%5===0)                 notify(3,'beep');
        else if (sec>180)                                   setBreakWarningLevel(0);
        if (ms<=0) { playSound('chime'); setBreakWarningLevel(0); sync({ timer:{mode:'idle',startedAt:null,endTime:null,duration:null,isRunning:false,pausedElapsed:null,pausedRemaining:null} }); }
      } else if (mode==='class_cd'&&t.isRunning&&ms<=0) {
        playSound('chime');
        sync({ timer:{mode:'idle',startedAt:null,endTime:null,duration:null,isRunning:false,pausedElapsed:null,pausedRemaining:null} });
      }
    };
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [db.timer]);

  // ══════════════════════════════════════════════════════════
  // 🧮 파생 상태
  // ══════════════════════════════════════════════════════════
  const safeStudents = safeArray(db.students);

  const allStats = useMemo(() => safeStudents.map(s => {
    const exp    = db.roleExp[s.id] || 0;
    const bonus  = db.bonusCoins?.[s.id] || 0;
    const coins  = Math.max(0, (exp*10) + bonus - (db.usedCoins[s.id]||0));
    
    let mastery  = { label:'🌱 인턴', color:'text-emerald-700', bg:'bg-emerald-100 border-emerald-200' };
    if (exp>=20) mastery = { label:'👑 장인', color:'text-amber-700',  bg:'bg-gradient-to-r from-amber-100 to-yellow-200 border-amber-400' };
    else if (exp>=10) mastery = { label:'💎 전문가', color:'text-blue-700', bg:'bg-blue-100 border-blue-300' };

    const weekKey     = getWeekKey();
    const attendedDays = safeArray(db.attendance?.[weekKey]?.[s.id]);
    const weeklyCount  = Math.min(5, attendedDays.length + (db.extraAttendDays||0));
    const streak       = db.streakWeeks?.[s.id] || 0;
    const attendedToday= (getTodayWeekdayIdx() >= 0) && attendedDays.includes(getTodayWeekdayIdx());
    const todayMood    = db.moodLog?.[formatDate()]?.[s.id] || null;

    return {
      ...s, exp, coins, mastery, status: db.studentStatus[s.id]||'normal',
      atExp: db.allTime?.exp?.[s.id] || 0, atDonate: db.allTime?.donate?.[s.id] || 0,
      atFund: db.allTime?.fund?.[s.id] || 0, atPen: db.allTime?.penalty?.[s.id] || 0,
      weeklyCount, streak, attendedToday, todayMood, notes: safeArray(db.notes?.[s.id])
    };
  }), [safeStudents, db.roleExp, db.bonusCoins, db.usedCoins, db.studentStatus, db.allTime, db.attendance, db.streakWeeks, db.notes, db.extraAttendDays, db.moodLog]);

  const activeStudents = useMemo(()=>allStats.filter(s=>s.status!=='crisis'),[allStats]);
  const crisisStudents = useMemo(()=>allStats.filter(s=>s.status==='crisis'),[allStats]);

  const sortedDashboardStats = useMemo(() => {
    if (db.settings?.showCumulativeStats) return [...allStats].sort((a,b)=>a.id-b.id);
    const order={crisis:0,pending:1,normal:2};
    return [...allStats].sort((a,b)=>order[a.status]!==order[b.status]?order[a.status]-order[b.status]:a.id-b.id);
  },[allStats,db.settings?.showCumulativeStats]);

  const groupedByGroupStats = useMemo(()=>[...allStats].sort((a,b)=>a.group-b.group||a.id-b.id),[allStats]);
  const topExp    = useMemo(()=>[...allStats].sort((a,b)=>b.atExp-a.atExp).filter(s=>s.atExp>0).slice(0,5),[allStats]);
  const topDonate = useMemo(()=>[...allStats].sort((a,b)=>b.atDonate-a.atDonate).filter(s=>s.atDonate>0).slice(0,5),[allStats]);
  const topFund   = useMemo(()=>[...allStats].sort((a,b)=>b.atFund-a.atFund).filter(s=>s.atFund>0).slice(0,5),[allStats]);
  const isShopOpen= useMemo(()=>db.settings?.forceShopOpen||new Date().getDay()===4,[db.settings?.forceShopOpen]);
  const isAllAttendCompleted = useMemo(()=> db.questLog?.[formatDate()]?.allAttend === true, [db.questLog]);
  
  const { praiseFeed, topGivers, topReceivers, fireflyCount } = useMemo(() => {
    const feed = safeArray(db.approvedPraises).sort((a,b) => b.id - a.id);
    const givers = {}, receivers = {};
    let totalHearts = 0;
    feed.forEach(p => {
      if (p.fromId && p.fromId !== 'me') givers[p.fromId] = (givers[p.fromId] || 0) + 1;
      if (p.toId !== 'me') receivers[p.toId] = (receivers[p.toId] || 0) + 1;
      totalHearts += (p.thankCount || 0);
    });
    const getTop = (obj) => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,1).map(([id]) => allStats.find(s=>s.id==id)?.name);
    return { 
      praiseFeed: feed.slice(0, 10), 
      topGivers: getTop(givers), 
      topReceivers: getTop(receivers),
      fireflyCount: Math.min(totalHearts + safeArray(db.mistakes).length, 50) 
    };
  }, [db.approvedPraises, db.mistakes, allStats]);

// 1. 반딧불이 애니메이션 상태를 독립적으로 밖으로 뺍니다.
  const fireflies = useMemo(() => {
    return Array.from({ length: fireflyCount }).map(() => ({
      width: Math.random() * 4 + 3,
      height: Math.random() * 4 + 3,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
    }));
  }, [fireflyCount]);

  // 2. 명성치 계산 (중복 없이 한 번만!)
  const { classReputation, evolutionLevel, progressPercent } = useMemo(() => {
    const target = db.settings?.targetScore || 5000;
    const penaltyUnit = db.settings?.pointConfig?.penalty || 20;
    const raw = allStats.reduce((sum,s)=> sum + (s.exp*10) + (db.bonusCoins?.[s.id]||0) - ((db.penaltyCount[s.id]||0)*penaltyUnit), 0)
      + safeArray(db.donations).reduce((sum,d)=>sum+(d.amount||0),0) + (db.manualRepOffset||0);
    let r = Math.max(0, Math.min(raw, target));
    const step = Math.max(1, target/5);
    const level= Math.min(Math.floor(r/step), 5);
    const pct = level>=5 ? 100 : ((r%step)/step)*100;
    return { classReputation:r, evolutionLevel:level, progressPercent:pct };
  }, [allStats, db.donations, db.settings, db.manualRepOffset]);
  
  // (이 아래로 기존의 const moodChartData = useMemo(...) 가 이어지면 됩니다.)

  const moodChartData = useMemo(() => {
    const todayStr = formatDate();
    const todayLogs = db.moodLog?.[todayStr] || {};
    const totalCount = Object.keys(todayLogs).length;
    if (totalCount === 0) return { total: 0, segments: [] };

    let segments = MOOD_OPTIONS.map(opt => ({ ...opt, count: 0, students: [] }));
    Object.entries(todayLogs).forEach(([sid, emoji]) => {
      const seg = segments.find(s => s.emoji === emoji);
      if (seg) {
        seg.count++;
        seg.students.push(allStats.find(st => st.id == sid)?.name || '알 수 없음');
      }
    });

    segments = segments.map(seg => ({ ...seg, widthPct: (seg.count / totalCount) * 100 })).filter(seg => seg.count > 0);
    return { total: totalCount, segments };
  }, [db.moodLog, allStats]);

  // ══════════════════════════════════════════════════════════
  // 🎬 핸들러
  // ══════════════════════════════════════════════════════════
  const handleLogin = () => { 
    const curDb = dbRef.current;
    const masterPw = curDb.settings?.masterPw||"6505"; const helpPw = curDb.settings?.helpRoomPw||"1111"; 
    if (password===masterPw) { saveAuth('teacher'); setIsAuthenticated('teacher'); setShowModal(null); setPassword(""); setActiveTab('admin'); } 
    else if (password===helpPw) { saveAuth('inspector'); setIsAuthenticated('inspector'); setShowModal(null); setPassword(""); setActiveTab('helproom'); } 
    else { alert("비밀번호가 틀렸습니다."); setPassword(""); } 
  };
  
  const handleLogout = () => { clearAuth(); setIsAuthenticated(false); setActiveTab('dashboard'); };
  
  const revokeAllSessions = () => { 
    const curDb = dbRef.current;
    if(!window.confirm("모든 세션을 종료할까요?")) return; 
    sync({ settings:{...curDb.settings,authRevokedAt:Date.now()} }); 
    clearAuth(); setIsAuthenticated(false); setActiveTab('dashboard'); 
  };
  
  const startStopwatch = () => sync({ timer:{mode:'class_sw',startedAt:Date.now(),endTime:null,duration:null,isRunning:true,pausedElapsed:null,pausedRemaining:null} });
  const startCountdown = (min) => { const ms=min*60000; sync({ timer:{mode:'class_cd',startedAt:Date.now(),endTime:Date.now()+ms,duration:ms,isRunning:true,pausedElapsed:null,pausedRemaining:null} }); };
  const startBreak     = (min) => { const ms=min*60000; sync({ timer:{mode:'break',startedAt:Date.now(),endTime:Date.now()+ms,duration:ms,isRunning:true,pausedElapsed:null,pausedRemaining:null} }); playSound('chime'); };
  const pauseTimer = () => { const curDb = dbRef.current; const t=curDb.timer; if(!t||!t.isRunning) return; if(t.mode==='class_sw') sync({ timer:{...t,isRunning:false,pausedElapsed:Date.now()-t.startedAt+(t.pausedElapsed||0)} }); else sync({ timer:{...t,isRunning:false,pausedRemaining:Math.max(0,t.endTime-Date.now())} }); };
  const resumeTimer = () => { const curDb = dbRef.current; const t=curDb.timer; if(!t||t.isRunning) return; if(t.mode==='class_sw') sync({ timer:{...t,isRunning:true,startedAt:Date.now()-(t.pausedElapsed||0),pausedElapsed:null} }); else sync({ timer:{...t,isRunning:true,endTime:Date.now()+(t.pausedRemaining||0),pausedRemaining:null} }); };
  const resetTimer = () => sync({ timer:{mode:'idle',startedAt:null,endTime:null,duration:null,isRunning:false,pausedElapsed:null,pausedRemaining:null} });

  const handleAttendanceStep1 = (sid) => {
    const s = allStats.find(x => x.id === sid);
    if (s.attendedToday) { 
      if (window.confirm("출석을 취소하시겠습니까?")) toggleAttendance(sid, null); 
    } else { 
      setMoodModalStudent(sid); 
    }
  };

  const toggleAttendance = (sid, moodEmoji) => {
  if (attendLockRef.current.has(sid)) return;
  attendLockRef.current.add(sid);
  
  const curDb = dbRef.current;
  const todayIdx = getTodayWeekdayIdx(); 
  if (todayIdx < 0) { attendLockRef.current.delete(sid); return; }
  
  const weekKey = getWeekKey();
  const todayStr = formatDate();
  const currentAtt = safeArray(curDb.attendance?.[weekKey]?.[sid]); 
  const isCancel = moodEmoji === null;
  const alreadyIn = currentAtt.includes(todayIdx);

  let updates = {};
  if (isCancel) {
    if (!alreadyIn) { attendLockRef.current.delete(sid); return; }
    // 취소 시: 배열에서 오늘 요일 제거
    updates.attendance = { ...curDb.attendance, [weekKey]: { ...curDb.attendance[weekKey], [sid]: currentAtt.filter(d => d !== todayIdx) } };
    updates.bonusCoins = { ...curDb.bonusCoins, [sid]: Math.max(0, (curDb.bonusCoins[sid] || 0) - ATTEND_COIN_PER_DAY) };
    updates.moodLog = { ...curDb.moodLog, [todayStr]: { ...(curDb.moodLog?.[todayStr] || {}), [sid]: null } };
    // 명성치 환원 (수동 보정값에서 차감)
    updates.manualRepOffset = (curDb.manualRepOffset || 0) - ATTEND_REP_PER_DAY;
  } else {
    if (alreadyIn) { setMoodModalStudent(null); attendLockRef.current.delete(sid); return; }
    playSound('attend'); setAttendAnim({ id: sid }); setTimeout(() => setAttendAnim(null), 1500);
    
    const newDays = [...currentAtt, todayIdx];
    updates.attendance = { ...curDb.attendance, [weekKey]: { ...(curDb.attendance[weekKey] || {}), [sid]: newDays } };
    updates.moodLog = { ...curDb.moodLog, [todayStr]: { ...(curDb.moodLog[todayStr] || {}), [sid]: moodEmoji } };
    updates.manualRepOffset = (curDb.manualRepOffset || 0) + ATTEND_REP_PER_DAY;
    
    let bonusToAdd = ATTEND_COIN_PER_DAY;
    updates.bonusCoins = { ...curDb.bonusCoins, [sid]: (curDb.bonusCoins[sid] || 0) + bonusToAdd };

    // 🏆 [미션] 8시 28분 59초까지 전원 출석 체크
    const now = new Date();
    const isMissionTime = (now.getHours() < 8) || (now.getHours() === 8 && now.getMinutes() < 29);
    const allActiveIds = activeStudents.map(st => st.id);
    const curAttendedIds = activeStudents.filter(st => st.attendedToday || st.id === sid).map(st => st.id);

    if (curAttendedIds.length === allActiveIds.length && isMissionTime && !curDb.questLog?.[todayStr]?.allAttend) {
      updates.questLog = { ...curDb.questLog, [todayStr]: { ...(curDb.questLog?.[todayStr] || {}), allAttend: true } };
      allActiveIds.forEach(id => { updates.bonusCoins[id] = (updates.bonusCoins[id] || 0) + 10; });
      setTimeout(() => { setShowAllAttendCelebration(true); playSound('jackpot'); }, 500);
    }
  }
  sync(updates); setMoodModalStudent(null);
  setTimeout(() => attendLockRef.current.delete(sid), 2000);
};

  const teacherAddHoliday = () => { 
    const curDb = dbRef.current;
    const wk=getWeekKey(); const newExtra=(curDb.extraAttendDays||0)+1; 
    let b={...curDb.bonusCoins}; let a={...curDb.attendanceBonus}; 
    allStats.forEach(s=>{ const d=safeArray(curDb.attendance?.[wk]?.[s.id]).length; const t=Math.min(5,d+newExtra); if(t>=5&&!curDb.attendanceBonus?.[wk]?.[s.id]){ b[s.id]=(b[s.id]||0)+3; if(!a[wk]) a[wk]={}; a[wk][s.id]=true; }}); 
    sync({ extraAttendDays:newExtra, bonusCoins:b, attendanceBonus:a }); alert(`공휴일 보정 +${newExtra}일 적용 완료!`); 
  };
  
  const handleGivePenalty = (sid) => { 
    const curDb = dbRef.current;
    if(!window.confirm("위기 상태로 지정할까요?")) return; 
    sync({ studentStatus:{...curDb.studentStatus,[sid]:'crisis'}, penaltyCount:{...curDb.penaltyCount,[sid]:(curDb.penaltyCount[sid]||0)+1}, allTime:{...curDb.allTime,penalty:{...(curDb.allTime?.penalty||{}),[sid]:(curDb.allTime?.penalty?.[sid]||0)+1}} }); 
    playSound('bad'); 
  };
  
  const handleExpAdjust = (sid, d) => { 
    const curDb = dbRef.current;
    const n=Math.max(0,(curDb.roleExp[sid]||0)+d); let u={roleExp:{...curDb.roleExp,[sid]:n}}; if(d>0) u.allTime={...curDb.allTime,exp:{...(curDb.allTime?.exp||{}),[sid]:(curDb.allTime?.exp?.[sid]||0)+d}}; sync(u); if(d>0) playSound('good'); 
  };
  
  const handleDonate = (sid, amt) => { 
    const curDb = dbRef.current;
    const u=allStats.find(s=>s.id===sid); 
    const currentCoins = Math.max(0, ((curDb.roleExp[sid]||0)*10) + (curDb.bonusCoins?.[sid]||0) - (curDb.usedCoins?.[sid]||0));
    if(!u||currentCoins<amt) return alert("잔액 부족"); 
    if(!window.confirm(`기부할까요?`)) return; 
    sync({ usedCoins:{...curDb.usedCoins,[sid]:(curDb.usedCoins[sid]||0)+amt}, donations:[...safeArray(curDb.donations),{id:Date.now(),name:u.name,amount:amt,date:formatDate()}], allTime:{...curDb.allTime,donate:{...(curDb.allTime?.donate||{}),[sid]:(curDb.allTime?.donate?.[sid]||0)+amt}} }); 
    logPoint(sid, -amt, `명예의 기부처`);
    playSound('jackpot'); alert("기부 완료!"); 
  };
  
  const handleFund = (fId, sid, amt) => { 
    const curDb = dbRef.current;
    const u=allStats.find(s=>s.id===sid); 
    const currentCoins = Math.max(0, ((curDb.roleExp[sid]||0)*10) + (curDb.bonusCoins?.[sid]||0) - (curDb.usedCoins?.[sid]||0));
    if(!u||currentCoins<amt) return alert("잔액 부족"); 
    const f=safeArray(curDb.funding).find(x=>x.id===fId); 
    if(!f||!window.confirm(`투자할까요?`)) return; 
    sync({ funding:safeArray(curDb.funding).map(x=>x.id===fId?{...x,current:toInt(x.current)+amt}:x), usedCoins:{...curDb.usedCoins,[sid]:(curDb.usedCoins[sid]||0)+amt}, allTime:{...curDb.allTime,fund:{...(curDb.allTime?.fund||{}),[sid]:(curDb.allTime?.fund?.[sid]||0)+amt}} }); 
    logPoint(sid, -amt, `펀딩 투자(${f.name})`);
    playSound('buy'); alert("투자 완료!"); 
  };

  const executeRescue = () => {
    const curDb = dbRef.current;
    if (!rescuer || !rescueTarget) return alert("학생을 모두 선택해 주세요.");
    if (rescuer === rescueTarget) return alert("자기 자신을 구제할 수는 없습니다.");
    
    const cost = curDb.settings?.pointConfig?.rescueCost || 50;
    const rUser = allStats.find(s=>s.id == rescuer);
    const tUser = allStats.find(s=>s.id == rescueTarget);
    const currentCoins = Math.max(0, ((curDb.roleExp[rUser.id]||0)*10) + (curDb.bonusCoins?.[rUser.id]||0) - (curDb.usedCoins?.[rUser.id]||0));
    
    if (currentCoins < cost) return alert(`${rUser.name} 학생의 코인이 부족합니다. (${cost}🪙 필요)`);
    if (tUser.status !== 'crisis') return alert(`${tUser.name} 학생은 현재 위기 상태가 아닙니다.`);
    if (!window.confirm(`${rUser.name}의 코인 ${cost}🪙을 사용하여 ${tUser.name} 학생을 구제할까요?`)) return;

    sync({
      usedCoins: { ...curDb.usedCoins, [rescuer]: (curDb.usedCoins[rescuer]||0) + cost },
      studentStatus: { ...curDb.studentStatus, [rescueTarget]: 'normal' }
    });
    logPoint(rescuer, -cost, `내 친구 보호막(${tUser.name} 구제)`);
    playSound('jackpot');
    alert(`🎉 ${rUser.name} 학생의 따뜻한 마음으로 ${tUser.name} 학생이 위기에서 벗어났습니다!`);
    setRescuer(""); setRescueTarget("");
  };
  
  const submitArtisanItem = () => { 
    const curDb = dbRef.current;
    if(!artisanTarget||!artisanItemName.trim()||!artisanItemPrice) return alert("입력 필요"); const a=allStats.find(s=>s.id==artisanTarget); if(!a) return; 
    sync({ pendingShopItems:[...safeArray(curDb.pendingShopItems),{id:Date.now(),name:artisanItemName.trim(),price:toInt(artisanItemPrice),creator:a.name,creatorId:a.id}] }); alert("결재 요청 완료!"); setArtisanTarget(""); setArtisanItemName(""); setArtisanItemPrice(""); 
  };
  
  const addCoopScore = (amt, qKey) => { const curDb = dbRef.current; const td=formatDate(); if(curDb.questLog?.[td]?.[qKey]) return alert("오늘은 이미 이 퀘스트를 달성했습니다!"); sync({ manualRepOffset:(curDb.manualRepOffset||0)+amt, questLog:{...curDb.questLog,[td]:{...(curDb.questLog?.[td]||{}),[qKey]:true}} }); playSound('good'); };
  const adjustGoodWeek = (d) => { const curDb = dbRef.current; sync({ coopQuest:{...curDb.coopQuest,goodWeek:Math.max(0,Math.min(5,(curDb.coopQuest?.goodWeek||0)+d))} }); };
  const completeGoodWeek = () => { const curDb = dbRef.current; if((curDb.coopQuest?.goodWeek||0) < 5) return; const r=curDb.coopQuest?.q4||100; sync({ manualRepOffset:(curDb.manualRepOffset||0)+r, coopQuest:{...curDb.coopQuest,goodWeek:0} }); playSound('jackpot'); alert(`명성 +${r}p!`); };
  
  const handleStartTimeAttack = () => { const curDb = dbRef.current; if(!taTitle.trim()) return alert("제목 입력"); sync({ timeAttack:{isActive:true,title:taTitle,rewardRep:toInt(taReward,100),endTime:Date.now()+toInt(taMins,10)*60000,cleared:[]} }); playSound('chime'); };
  
  const handleCompleteTimeAttack = () => { 
    const curDb = dbRef.current; if(!curDb.timeAttack?.isActive) return; 
    const r = curDb.timeAttack?.rewardRep || 100; 
    const clearedIds = safeArray(curDb.timeAttack?.cleared).map(Number);
    const clearedCount = clearedIds.length;
    const totalRep = r * clearedCount;
    
    let newBonusCoins = { ...curDb.bonusCoins };
    let newLogs = [...safeArray(curDb.pointLogs)];
    
    clearedIds.forEach(sid => {
      newBonusCoins[sid] = (newBonusCoins[sid] || 0) + r;
      const stu = safeArray(curDb.students).find(s => s.id === sid);
      newLogs.unshift({ id: Date.now() + Math.random(), sid, name: stu?.name, amount: r, reason: '타임어택 성공', date: formatDate() });
    });
    
    sync({ 
      timeAttack:{isActive:false,title:"",rewardRep:100,endTime:null,cleared:[]}, 
      manualRepOffset:(curDb.manualRepOffset||0)+totalRep,
      bonusCoins: newBonusCoins,
      pointLogs: newLogs.slice(0, 50)
    }); 
    playSound('jackpot'); alert(`🎉 타임어택 성공! 개인별 +${r}🪙, 학급 명성 총 +${totalRep}p 반영! (달성: ${clearedCount}명)`); 
  };

  const handleFailTimeAttack = () => { 
    const curDb = dbRef.current; if(!curDb.timeAttack?.isActive) return; 
    const r = curDb.timeAttack?.rewardRep || 100; 
    const halfR = Math.round(r / 2);
    const clearedIds = safeArray(curDb.timeAttack?.cleared).map(Number);
    const clearedCount = clearedIds.length;
    const totalRep = halfR * clearedCount;
    
    let newBonusCoins = { ...curDb.bonusCoins };
    let newLogs = [...safeArray(curDb.pointLogs)];
    
    clearedIds.forEach(sid => {
      newBonusCoins[sid] = (newBonusCoins[sid] || 0) + halfR;
      const stu = safeArray(curDb.students).find(s => s.id === sid);
      newLogs.unshift({ id: Date.now() + Math.random(), sid, name: stu?.name, amount: halfR, reason: '타임어택 실패(절반보상)', date: formatDate() });
    });

    sync({ 
      timeAttack:{isActive:false,title:"",rewardRep:100,endTime:null,cleared:[]},
      manualRepOffset:(curDb.manualRepOffset||0)+totalRep,
      bonusCoins: newBonusCoins,
      pointLogs: newLogs.slice(0, 50)
    }); 
    playSound('bad'); alert(`💦 타임어택 실패! 하지만 성공한 ${clearedCount}명에게 절반 보상(개인 +${halfR}🪙, 명성 총 +${totalRep}p)이 지급됩니다.`); 
  };

  const toggleTimeAttackClear = (sid) => { const curDb = dbRef.current; const c=safeArray(curDb.timeAttack?.cleared).map(Number); sync({ timeAttack:{...curDb.timeAttack,cleared:c.includes(Number(sid))?c.filter(id=>id!==Number(sid)):[...c,Number(sid)]} }); };
  
  const handleAddStudent = () => { const curDb = dbRef.current; if(!newStudentName.trim()) return alert("이름 입력"); const mId=safeStudents.reduce((m,s)=>Math.max(m,s.id),0); sync({ students:[...safeStudents,{id:mId+1,name:newStudentName.trim(),role:'',group:toInt(newStudentGroup,1),isLeader:false,enneagram:newStudentEnneagram}] }); setNewStudentName(""); setNewStudentGroup("1"); setNewStudentEnneagram(""); };
  const handleRemoveStudent = (sid) => { const s=safeStudents.find(x=>x.id===sid); if(!s||!window.confirm(`삭제할까요?`)) return; sync({ students:safeStudents.filter(x=>x.id!==sid) }); };
  const handleStudentFieldChange = (sid,f,v) => sync({ students:safeStudents.map(s=>s.id===sid?{...s,[f]:v}:s) });
  
  const openNoteModal = (sid) => { setShowNoteModal(sid); setNoteText(""); };
  const submitNote = () => { const curDb = dbRef.current; if(!noteText.trim()||!showNoteModal) return; sync({ notes:{...curDb.notes,[showNoteModal]:[...safeArray(curDb.notes?.[showNoteModal]),{id:Date.now(),text:noteText.trim(),date:formatDate()}]} }); setShowNoteModal(null); setNoteText(""); };
  const deleteNote = (sid,nId) => { const curDb = dbRef.current; if(!window.confirm("삭제할까요?")) return; sync({ notes:{...curDb.notes,[sid]:safeArray(curDb.notes?.[sid]).filter(n=>n.id!==nId)} }); };
  
  const toggleCumulativeStats = () => { const curDb = dbRef.current; sync({ settings:{...curDb.settings,showCumulativeStats:!curDb.settings?.showCumulativeStats} }); };
  
  const exportStudent = (sid) => { const curDb = dbRef.current; const s=allStats.find(x=>x.id==sid); if(!s) return; const p=safeArray(curDb.approvedPraises).filter(x=>x.toId==s.id); const r=safeArray(curDb.pendingReflections).filter(x=>x.studentId==s.id); const txt=[`=== ${s.name} SEL 리포트 ===`,`에니어그램:${s.enneagram} | 완수:${s.exp} | 코인:${s.coins} | 출석:${s.weeklyCount}/5`,`[칭찬]`,...p.map(x=>`- ${x.text}`),`[성찰]`,...r.map(x=>`- ${x.text}`),`[누가기록]`,...s.notes.map(x=>`- ${x.text}`)].join('\n'); navigator.clipboard?.writeText(txt).then(()=>alert("복사 완료")); };
  const exportAll = () => { const curDb = dbRef.current; const txt=allStats.map(s=>`\n=== ${s.name} ===\n완수:${s.exp} | 코인:${s.coins}\n칭찬: ${safeArray(curDb.approvedPraises).filter(p=>p.toId==s.id).map(p=>p.text).join(', ')}`).join('\n'); navigator.clipboard?.writeText(txt).then(()=>alert("전체 복사 완료")); };
  const closeSemester = () => { const curDb = dbRef.current; if(window.prompt("1학기 마감: '마감' 입력")!=="마감") return; sync({ roleExp:{},bonusCoins:{},usedCoins:{},penaltyCount:{},studentStatus:{},pendingReflections:[],pendingPraises:[],shopItems:[],pendingShopItems:[],funding:[],purchaseHistory:[],donations:[],manualRepOffset:0,attendance:{},attendanceBonus:{},attendCoinLog:{},questLog:{},moodLog:{},mistakes:[],pointLogs:[],coopQuest:{...curDb.coopQuest,goodWeek:0},timeAttack:{isActive:false,title:"",rewardRep:100,endTime:null,cleared:[]},timer:{mode:'idle',startedAt:null,endTime:null,duration:null,isRunning:false,pausedElapsed:null,pausedRemaining:null},extraAttendDays:0 }); alert("마감 완료."); };
  const factoryReset = () => { if(window.prompt("공장 초기화: '전체초기화' 입력")!=="전체초기화") return; sync({ roleExp:{},bonusCoins:{},usedCoins:{},penaltyCount:{},studentStatus:{},pendingReflections:[],pendingPraises:[],approvedPraises:[],shopItems:[],pendingShopItems:[],funding:[],purchaseHistory:[],donations:[],manualRepOffset:0,allTime:{exp:{},penalty:{},donate:{},fund:{}},attendance:{},attendanceBonus:{},attendCoinLog:{},streakWeeks:{},notes:{},questLog:{},moodLog:{},mistakes:[],pointLogs:[],coopQuest:{q1Name:"다 함께 바른 생활",q1:50,q2Name:"환대와 응원",q2:20,q3Name:"전담수업 태도 우수",q3:20,q5Name:"청소 만점",q5:10,q4Name:"사이좋은 일주일",q4:100,goodWeek:0},timeAttack:{isActive:false,title:"",rewardRep:100,endTime:null,cleared:[]},timer:{mode:'idle',startedAt:null,endTime:null,duration:null,isRunning:false,pausedElapsed:null,pausedRemaining:null},extraAttendDays:0 }); alert("초기화 완료."); };

  const submitPraise = () => {
    const curDb = dbRef.current;
    if (!praiseTarget || !praiseFrom || !praiseTag || !praiseText.trim()) { alert("항목을 모두 입력해 주세요."); return; }
    
    // 🔥 자기 자신에게 보내는 것 차단
    if (praiseTarget === praiseFrom) { alert("자기 자신에게는 보낼 수 없습니다."); return; }

    const finalToId = toInt(praiseTarget); 
    const finalFromId = toInt(praiseFrom);
    
    sync({ pendingPraises: [...safeArray(curDb.pendingPraises), { id: generateId(), toId: finalToId, fromId: finalFromId, tag: praiseTag, text: praiseText.trim(), date: formatDate(), status: 'pending' }] });
    playSound('good'); alert("감찰사의 승인 후 칭찬이 전달되고 코인이 지급됩니다! 🕊️");
    setShowPraiseModal(false); setPraiseTarget(""); setPraiseFrom(""); setPraiseTag(""); setPraiseText("");
  };

  // ─── [버그수정] 더블클릭 방어 적용된 approvePraise ───
  const approvePraise = (pId, isApprove) => {
    if (processingPraiseRef.current.has(pId)) return;
    processingPraiseRef.current.add(pId);

    const curDb = dbRef.current;
    const p = safeArray(curDb.pendingPraises).find(x => x.id === pId);
    
    // 🔥 [수정 1] 이미 다른 태블릿에서 승인/반려하여 데이터가 사라졌는지 체크 (중복 결재 방어)
    if (!p) {
      alert("이미 다른 기기에서 승인 또는 처리가 완료된 건입니다! 🕊️");
      processingPraiseRef.current.delete(pId);
      return;
    }
    
    if (isApprove) {
      const isTheme = p.tag === curDb.settings?.dailyTheme;
      const receiveBasic = curDb.settings?.pointConfig?.praiseBasic || 10;
      const receiveTheme = curDb.settings?.pointConfig?.praiseTheme || 15;
      const sendReward   = curDb.settings?.pointConfig?.praiseSend || 2;
      
      const receiverCoins = isTheme ? receiveTheme : receiveBasic;
      
      let updates = {
        approvedPraises: [...safeArray(curDb.approvedPraises), { ...p, status: 'approved', coins: receiverCoins, thankCount: 0 }],
        pendingPraises: safeArray(curDb.pendingPraises).filter(x => x.id !== pId),
        bonusCoins: { ...curDb.bonusCoins }
      };
      
      // 🔥 [수정 2] 로그를 개별 저장하지 않고 하나의 배열로 모아서 한 번에 DB에 덮어씀 (로그 꼬임 방지)
      let newLogs = [...safeArray(curDb.pointLogs)];
      
      if (p.toId !== 'me') {
        updates.bonusCoins[p.toId] = (updates.bonusCoins[p.toId]||0) + receiverCoins;
        newLogs.unshift({ id: Date.now() + Math.random(), sid: p.toId, name: allStats.find(s=>s.id==p.toId)?.name, amount: receiverCoins, reason: `칭찬 수신(${SEL_OPTIONS.find(o=>o.name===p.tag)?.short || p.tag})`, date: formatDate() });
      }
      
      if (p.fromId && p.fromId !== 'me') {
        updates.bonusCoins[p.fromId] = (updates.bonusCoins[p.fromId]||0) + sendReward;
        newLogs.unshift({ id: Date.now() + Math.random(), sid: p.fromId, name: allStats.find(s=>s.id==p.fromId)?.name, amount: sendReward, reason: `칭찬 발신(${SEL_OPTIONS.find(o=>o.name===p.tag)?.short || p.tag})`, date: formatDate() });
      }
      
      updates.pointLogs = newLogs.slice(0, 50); // 최신 50개만 유지
      sync(updates); // 한 번에 서버로 전송
      
      playSound('jackpot');
      alert("칭찬이 승인되어 피드에 등록되었습니다!");
    } else {
      sync({ pendingPraises: safeArray(curDb.pendingPraises).filter(x => x.id !== pId) });
      playSound('bad');
      alert("칭찬이 반려되었습니다.");
    }

    setTimeout(() => processingPraiseRef.current.delete(pId), 2000);
  };

  const handleLikePraise = (pId) => {
    const curDb = dbRef.current;
    const updated = safeArray(curDb.approvedPraises).map(p => p.id === pId ? { ...p, thankCount: (p.thankCount||0) + 1 } : p);
    sync({ approvedPraises: updated }); playSound('good');
  };

  const submitReflection = () => {
    const curDb = dbRef.current;
    if (!refTarget||!refTag||!refText.trim()) { alert("대상, 역량, 다짐을 모두 입력해 주세요."); return; }
    const newR = { id:Date.now(), studentId:toInt(refTarget), tag:refTag, text:refText.trim(), date:formatDate() };
    sync({ studentStatus:{...curDb.studentStatus,[refTarget]:'pending'}, pendingReflections:[...safeArray(curDb.pendingReflections),newR] });
    playSound('good'); alert("성찰 다짐이 제출되었습니다!"); setRefTarget(""); setRefTag(""); setRefText("");
  };

  const submitMistake = () => {
    const curDb = dbRef.current;
    if (!mistakeText || !mistakeLesson) return alert("실수 내용과 배운 점을 모두 적어주세요!");
    const newM = { id:Date.now(), text:mistakeText, lesson:mistakeLesson, date:formatDate(), likes:0 };
    sync({ mistakes: [newM, ...safeArray(curDb.mistakes)].slice(0, 30) });
    alert("멋진 실패입니다! 이 실수가 당신을 더 빛나게 할 거예요. ✨");
    setShowMistakeModal(false); setMistakeText(""); setMistakeLesson("");
  };

  // ══════════════════════════════════════════════════════════════
  // 🖼️ RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-amber-50/50 pb-32 font-sans text-slate-800 transition-all">

      <header className="bg-[#FFF5E1] px-6 pt-6 pb-8 md:px-12 md:pt-10 md:pb-12 relative overflow-hidden border-b-4 border-white flex flex-col gap-8">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] opacity-70 pointer-events-none"/>
        <div className="max-w-[1400px] w-full mx-auto relative z-10 flex items-center justify-between">
          <h1 className="text-amber-800 font-black text-2xl flex items-center gap-3">
            <Sparkles className="text-amber-500 w-8 h-8"/> {db.settings?.title}
          </h1>
        </div>
        <div className="max-w-[1400px] w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-8 w-full justify-center">
            <div className="flex flex-row items-center gap-8 pl-2">
              <div className="flex items-baseline">
                <span className="text-[130px] md:text-[160px] font-black text-[#6B4423] drop-shadow-md tracking-tighter leading-none">{classReputation}</span>
                <span className="text-5xl md:text-6xl font-black text-amber-500 ml-2">p</span>
              </div>
              <div className="drop-shadow-2xl relative pb-4">
                <div className="absolute inset-0 bg-yellow-200 blur-3xl opacity-30 rounded-full"/>
                {renderEvolution(evolutionLevel)}
                {fireflies.map((f, i) => (
                  <div key={i} className="absolute rounded-full bg-pink-400 opacity-80 mix-blend-screen shadow-[0_0_8px_rgba(244,114,182,0.8)]"
                    style={{ width: `${f.width}px`, height: `${f.height}px`, top: `${f.top}%`, left: `${f.left}%`, animation: `flyToScore ${f.duration}s infinite alternate ease-in-out`, animationDelay: `${f.delay}s` }}
                  />
                ))}
              </div>
            </div>
            <div className="w-full space-y-4">
              <div className="w-full h-14 bg-white/70 rounded-full overflow-hidden shadow-inner border-4 border-amber-200 relative">
                <div className={`h-full transition-all duration-1000 ${evolutionLevel>=5?'bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500 animate-pulse':'bg-gradient-to-r from-yellow-300 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]'}`} style={{ width:`${progressPercent}%` }}/>
                <div className="absolute inset-0 flex items-center justify-center font-black text-amber-900 text-lg tracking-widest drop-shadow-md">{EVOLUTION_TITLES[evolutionLevel]} <span className="text-sm ml-2 opacity-70">({evolutionLevel}/5)</span></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden text-xs font-bold text-amber-700 bg-white/60 px-5 py-3 rounded-full border border-amber-200 shadow-sm relative">
                  <div className="animate-[shimmer_25s_linear_infinite] whitespace-nowrap inline-flex items-center w-max">
                    <Sparkles className="w-4 h-4 text-amber-500 mr-2 shrink-0"/>
                    기부 명예 전당: {safeArray(db.donations).map(d=>`${d.name}(${d.amount}p)`).join(' 🌸 ')||'따뜻한 마음을 기다려요!'}
                  </div>
                </div>
                <span className="text-xs font-black text-orange-600 bg-white px-5 py-3 rounded-full shadow-sm border border-orange-200 shrink-0">최종 목표: {db.settings?.targetScore||5000}p</span>
              </div>
            </div>
          </div>
          <div className="w-full h-full">
            <TimerWidget status={timerStatus} display={timerDisplay} timer={db.timer} warningLevel={breakWarningLevel} breakInput={breakInput} setBreakInput={setBreakInput} defaultBreakMin={Math.floor((db.settings?.defaultBreakMs||DEFAULT_BREAK_MS)/60000)} onStopwatch={startStopwatch} onCountdown={startCountdown} onPause={pauseTimer} onResume={resumeTimer} onReset={resetTimer} onBreak={startBreak} lockEditing={lockEditing} unlockEditing={unlockEditing} />
          </div>
        </div>
      </header>

      <div className="bg-pink-100 text-pink-700 py-3 overflow-hidden shadow-sm border-b-2 border-pink-200 relative z-20">
        <div className="whitespace-nowrap animate-[shimmer_35s_linear_infinite] flex gap-20 text-sm font-black">
          <span className="flex gap-4 items-center">
            <MessageSquare className="w-5 h-5 text-pink-500"/>
            온기 우체통: {safeArray(db.approvedPraises).map(p=>`[${SEL_OPTIONS.find(o=>o.name===p.tag)?.short||'칭찬'}] ${p.fromId==='me'?'비밀천사':(allStats.find(s=>s.id==p.fromId)?.name||'알 수 없음')} 👉 ${p.toId==='me'?'나 자신':(allStats.find(s=>s.id==p.toId)?.name||'알 수 없음')}: "${p.text}"`).join(' 💌 ')||'따뜻한 마음을 전해볼까요?'}
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab==='dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[40px] border-2 border-blue-100 shadow-sm flex flex-col justify-between">
                <h3 className="text-lg font-black text-blue-600 mb-5 flex items-center gap-2"><Zap className="w-6 h-6"/> 학급 공동 퀘스트</h3>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <button disabled={db.questLog?.[formatDate()]?.q1} onClick={()=>addCoopScore(db.coopQuest?.q1||50, 'q1')} className={`py-4 rounded-2xl font-black text-base border active:scale-95 truncate px-3 ${db.questLog?.[formatDate()]?.q1 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'}`}>{db.coopQuest?.q1Name||"바른 생활"} {db.questLog?.[formatDate()]?.q1 ? '(완료)' : `+${db.coopQuest?.q1||50}`}</button>
                  <button disabled={db.questLog?.[formatDate()]?.q2} onClick={()=>addCoopScore(db.coopQuest?.q2||20, 'q2')} className={`py-4 rounded-2xl font-black text-base border active:scale-95 truncate px-3 ${db.questLog?.[formatDate()]?.q2 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200'}`}>{db.coopQuest?.q2Name||"환대"} {db.questLog?.[formatDate()]?.q2 ? '(완료)' : `+${db.coopQuest?.q2||20}`}</button>
                  <button disabled={db.questLog?.[formatDate()]?.q3} onClick={()=>addCoopScore(db.coopQuest?.q3||20, 'q3')} className={`py-4 rounded-2xl font-black text-base border active:scale-95 truncate px-3 ${db.questLog?.[formatDate()]?.q3 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}>{db.coopQuest?.q3Name||"전담 우수"} {db.questLog?.[formatDate()]?.q3 ? '(완료)' : `+${db.coopQuest?.q3||20}`}</button>
                  <button disabled={db.questLog?.[formatDate()]?.q5} onClick={()=>addCoopScore(db.coopQuest?.q5||10, 'q5')} className={`py-4 rounded-2xl font-black text-base border active:scale-95 truncate px-3 ${db.questLog?.[formatDate()]?.q5 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'}`}>{db.coopQuest?.q5Name||"청소 만점"} {db.questLog?.[formatDate()]?.q5 ? '(완료)' : `+${db.coopQuest?.q5||10}`}</button>
                </div>
                <div className="flex items-center justify-between bg-yellow-50 p-5 rounded-2xl border border-yellow-200">
                  <div className="flex flex-col gap-2 flex-1 pr-4">
                    <span className="text-base font-black text-yellow-800 truncate">{db.coopQuest?.q4Name||"사이좋은 일주일"}</span>
                    <div className="flex gap-1.5 max-w-[150px]">{[1,2,3,4,5].map(step=>( <div key={step} className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${step<=(db.coopQuest?.goodWeek||0)?'bg-yellow-400':'bg-yellow-200/50'}`}/> ))}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={()=>adjustGoodWeek(-1)} className="p-3 bg-white rounded-xl text-red-500 border border-red-100 shadow-sm hover:bg-red-50"><Minus className="w-5 h-5"/></button>
                    <span className="font-black text-2xl text-yellow-600 w-8 text-center">{db.coopQuest?.goodWeek||0}</span>
                    <button onClick={()=>adjustGoodWeek(1)} className="p-3 bg-white rounded-xl text-green-500 border border-green-100 shadow-sm hover:bg-green-50"><Plus className="w-5 h-5"/></button>
                  </div>
                </div>
                {(db.coopQuest?.goodWeek||0)>=5 && <button onClick={completeGoodWeek} className="mt-4 w-full bg-yellow-400 text-yellow-900 font-black py-5 rounded-2xl text-lg animate-pulse hover:bg-yellow-500">🌟 최종 승인 및 명성 획득!</button>}
              </div>

              <div className={`p-8 rounded-[40px] border-2 flex flex-col items-center justify-center min-h-[200px] ${db.timeAttack?.isActive?'bg-red-50 border-red-300':'bg-slate-50 border-dashed border-slate-200'}`}>
                {db.timeAttack?.isActive ? (
                  <><div className="flex items-center gap-3 mb-4"><Timer className="w-8 h-8 text-red-500 animate-pulse"/><h2 className="text-lg font-black text-red-600">돌발 타임어택 진행 중!</h2></div><p className="text-3xl font-black text-slate-800 mb-6 text-center">{db.timeAttack.title}</p><div className="bg-red-500 text-white px-12 py-5 rounded-[24px] shadow-lg"><span className="text-6xl font-black tracking-widest">{timeLeftString}</span></div><p className="text-sm font-bold text-red-400 mt-5">성공 시 학급 명성 +{db.timeAttack.rewardRep}점</p></>
                ) : (
                  <><Timer className="w-16 h-16 mb-5 opacity-30 text-slate-400"/><p className="font-black text-lg text-slate-400 opacity-70">현재 발동된 타임어택이 없습니다</p></>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-white p-8 rounded-[40px] shadow-sm border-2 border-blue-100 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3"><Target className="w-7 h-7 text-blue-500"/> 크라우드 펀딩 현황</h3>
                {safeArray(db.funding).filter(f => f && f.name).length > 0 ? (
                  <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
                    {safeArray(db.funding).filter(f => f && f.name).map(f => {
                      const percent = Math.min((toInt(f.current) / toInt(f.target, 1)) * 100, 100);
                      return (
                        <div
                          key={f.id}
                          className="h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full border border-blue-200 shadow-sm relative overflow-hidden flex items-center px-6"
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-blue-100/70 transition-all duration-1000"
                            style={{ width: `${percent}%` }}
                          />

                          <div className="relative z-10 w-full flex items-center justify-between gap-3">
                            <h4 className="text-lg font-black text-blue-900 break-keep leading-none translate-y-[-1px]">
                              {String(f.name)}
                            </h4>

                            <span className="h-7 min-w-12 px-3 flex items-center justify-center text-sm font-black leading-none text-blue-600 bg-white rounded-full border border-blue-200 shadow-sm shrink-0 translate-y-[-1px]">
                              {Math.floor(percent)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : ( <p className="text-slate-400 font-bold text-center py-10">진행 중인 펀딩이 없습니다.</p> )}
              </div>

              <div className="lg:col-span-7 bg-pink-50 p-8 rounded-[40px] shadow-sm border-2 border-pink-200 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-pink-800 flex items-center gap-3"><Heart className="w-7 h-7 text-pink-500 fill-pink-500"/> 우리 반 온기 피드</h3>
                  <div className="flex gap-4">
                    <span className="text-xs font-black text-pink-600 bg-white px-3 py-1.5 rounded-xl border border-pink-200 shadow-sm">👑 베풂왕: {topGivers.join(', ')||'없음'}</span>
                    <span className="text-xs font-black text-pink-600 bg-white px-3 py-1.5 rounded-xl border border-pink-200 shadow-sm">👑 사랑왕: {topReceivers.join(', ')||'없음'}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4 max-h-[300px]">
                  {praiseFeed.length > 0 ? praiseFeed.map(p => {
                    const fromName = p.fromId === 'me' ? '비밀천사' : (allStats.find(s=>s.id==p.fromId)?.name || '알 수 없음');
                    const toName = p.toId === 'me' ? '나 자신' : (allStats.find(s=>s.id==p.toId)?.name || '알 수 없음');
                    const selShort = SEL_OPTIONS.find(o=>o.name===p.tag)?.short || p.tag;
                    return (
                      <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border border-pink-100 animate-in fade-in">
                        <div className="flex justify-between items-start mb-2"><p className="text-sm font-black text-slate-700"><span className="text-pink-500">{fromName}</span> 👉 <span className="text-pink-500">{toName}</span></p><span className="text-[10px] font-black text-pink-600 bg-pink-100 px-2 py-1 rounded-md">{selShort}</span></div>
                        <p className="text-base font-bold text-slate-600 mb-4">"{p.text}"</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-slate-400 font-bold">{p.date}</span>
                          <button onClick={() => handleLikePraise(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-full text-xs font-black transition-colors border border-pink-200 active:scale-95"><Heart className="w-3.5 h-3.5 fill-pink-500"/> 공감 {p.thankCount || 0}</button>
                        </div>
                      </div>
                    );
                  }) : ( <p className="text-pink-400/70 font-bold text-center py-10 mt-10">우체통에 첫 메시지를 남겨보세요!</p> )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title:'🏆 역할 완수 TOP 5', data:topExp,    unit:'회',  key:'atExp',    icon:<CheckCircle2 className="w-7 h-7"/>, bg:'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200', titleColor:'text-blue-800', textColor:'text-blue-900', valColor:'text-blue-600', emptyColor:'text-blue-400' },
                  { title:'🏆 기부 천사 TOP 5', data:topDonate, unit:'🪙',  key:'atDonate', icon:<Coins className="w-7 h-7"/>,        bg:'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200', titleColor:'text-amber-800', textColor:'text-amber-900', valColor:'text-amber-600', emptyColor:'text-amber-400' },
                  { title:'🏆 펀딩 기여 TOP 5', data:topFund,   unit:'🪙',  key:'atFund',   icon:<Target className="w-7 h-7"/>,       bg:'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200', titleColor:'text-pink-800', textColor:'text-pink-900', valColor:'text-pink-600', emptyColor:'text-pink-400' }
                ].map(c=>(
                  <div key={c.title} className={`${c.bg} p-8 rounded-[40px] shadow-sm border`}>
                    <h4 className={`${c.titleColor} text-xl font-black mb-6 flex items-center gap-3`}>{c.icon} {c.title}</h4>
                    <ul className="space-y-4">
                      {c.data.length ? c.data.map((s,i)=>(
                        <li key={s.id} className={`${c.textColor} text-lg font-black bg-white/70 px-5 py-3 rounded-[20px] flex justify-between shadow-sm`}><span>{i+1}. {s.name}</span><span className={c.valColor}>{s[c.key]}{c.unit}</span></li>
                      )) : <li className={`${c.emptyColor} text-base font-bold text-center py-6`}>데이터가 없습니다.</li>}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-b-4 border-amber-200/50 pb-8 mt-8">
              <div>
                <p className={`text-base font-bold mt-3 inline-block px-4 py-1.5 rounded-full border shadow-sm ${isAllAttendCompleted ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-600 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {isAllAttendCompleted 
                    ? '🎉 우리 반 출석 미션 대성공! (전원 10🪙 획득)' 
                    : getTodayWeekdayIdx() < 0 
                      ? '🔔 주말입니다.' 
                      : isAttendanceOpen() 
                        ? '🕗 출석 체크 가능 (08:30 마감)' 
                        : '⏰ 출석 시간이 마감되었습니다'}
                </p>
              </div>
              <button onClick={()=>setShowPraiseModal(true)} className="w-full sm:w-auto bg-gradient-to-r from-pink-400 to-rose-500 text-white px-10 py-5 rounded-full font-black text-xl shadow-[0_10px_20px_rgba(244,63,94,0.3)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-2 border-pink-300">
                <Heart className="w-7 h-7 fill-white animate-pulse"/> 온기 우체통 쓰기
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {sortedDashboardStats.map(s => {
                const isTaCleared = safeArray(db.timeAttack?.cleared).map(Number).includes(Number(s.id));
                const isAnim      = attendAnim?.id===s.id;
                return (
                  <div key={s.id} className={`p-6 rounded-[40px] border-4 shadow-sm transition-all relative flex flex-col bg-white hover:shadow-xl hover:-translate-y-1 ${s.status==='crisis'?'border-slate-300 bg-slate-100 opacity-60 grayscale':s.status==='pending'?'border-orange-300 bg-orange-50':'border-white hover:border-amber-300'}`}>
                    {db.timeAttack?.isActive && s.status!=='crisis' && (
                      <div className="absolute -top-4 -right-4 z-20"><button onClick={()=>toggleTimeAttackClear(s.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs shadow-md border-2 ${isTaCleared?'bg-green-500 text-white border-green-600':'bg-white text-slate-400 border-slate-200 hover:text-red-500'}`}>{isTaCleared?<><CheckCircle2 className="w-3 h-3"/>완료</>:<><Timer className="w-3 h-3"/>도전 중</>}</button></div>
                    )}
                    {isAnim && <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"><span className="text-4xl font-black text-amber-500 drop-shadow-xl animate-flyToScore">+1</span></div>}
                    <div className="flex justify-between items-center mb-5 border-b-2 border-slate-100/50 pb-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner ${s.status==='crisis'?'bg-slate-200 text-slate-500':'bg-amber-100 text-amber-800'}`}>{s.id}</span>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">My Coins</p><p className={`font-black text-2xl leading-none ${s.status==='crisis'?'text-slate-500':'text-amber-600'}`}>{s.coins}<span className="text-base ml-1">🪙</span></p></div>
                      </div>
                      {isAuthenticated==='teacher' && <button onClick={()=>openNoteModal(s.id)} className="p-3 rounded-2xl bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border border-yellow-200 shadow-sm"><StickyNote className="w-5 h-5"/></button>}
                    </div>
                    <div className="flex flex-col mb-5 gap-3">
                      <p className="text-[12px] font-bold text-slate-400 tracking-wide truncate bg-slate-50 w-max px-3 py-1 rounded-md">{s.group}모둠 · {s.role}</p>
                      <button onClick={()=>handleAttendanceStep1(s.id)} disabled={s.status==='crisis' || getTodayWeekdayIdx()<0 || (!isAttendanceOpen() && !s.attendedToday)} className={`text-left transition-all ${(s.status==='crisis' || (!isAttendanceOpen() && !s.attendedToday)) ? 'cursor-not-allowed opacity-50' : 'hover:bg-amber-50 active:scale-95'} rounded-xl py-1 px-1 w-full relative`} title={!isAttendanceOpen() && !s.attendedToday ? "출석 마감" : s.attendedToday ? "출석 취소" : "출석 체크 (마음 날씨 선택)"}>
                        <div className="flex items-center gap-2 w-full min-w-0">
                          {s.attendedToday && <span className="text-xl shrink-0" title="오늘의 마음 날씨">{s.todayMood ? s.todayMood : '✓'}</span>}
                          <span className={`font-black text-2xl tracking-tight truncate ${s.exp>=20&&s.status!=='crisis'?'text-amber-700':s.attendedToday?'text-slate-800':'text-slate-400'}`}>{s.name}</span>
                          {s.isLeader && <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 mb-0.5"/>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 ml-1">
                          <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md whitespace-nowrap">{s.weeklyCount}/5</span>
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md whitespace-nowrap">⭐{s.streak}</span>
                          {s.weeklyCount>=5 && <span className="text-xs font-black text-yellow-700 bg-yellow-100 border border-yellow-300 px-2 py-0.5 rounded-md whitespace-nowrap">개근!</span>}
                        </div>
                      </button>
                      <div className={`text-sm font-black px-3 py-1.5 rounded-2xl border-2 self-start shadow-sm ${s.status==='crisis'?'bg-slate-200 border-slate-300 text-slate-500':`${s.mastery.bg} ${s.mastery.color}`}`}>{s.mastery.label} <span className="opacity-70">({s.exp})</span></div>
                    </div>
                    {db.settings?.showCumulativeStats && (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl mb-4 text-xs font-bold text-slate-600 grid grid-cols-2 gap-2 shadow-inner">
                        <span>✅완수: <span className="text-blue-600">{s.atExp}</span></span><span>💎기부: <span className="text-amber-600">{s.atDonate}</span></span>
                        <span>🚀펀딩: <span className="text-pink-600">{s.atFund}</span></span><span>🚨위기: <span className="text-red-600">{s.atPen}</span></span>
                      </div>
                    )}
                    <div className="mt-auto pt-2">
                      {s.status==='normal' && <button onClick={()=>handleGivePenalty(s.id)} className="w-full py-3 bg-slate-50 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-[18px] font-black text-sm flex items-center justify-center gap-2 transition-all"><AlertTriangle className="w-4 h-4"/> 위기 상태로 지정</button>}
                      {s.status==='crisis' && <p className="text-center font-black text-white bg-slate-600 py-3 rounded-[18px] text-sm flex items-center justify-center gap-2">🚨 성찰과 회복 요망</p>}
                      {s.status==='pending'&& <p className="text-center font-black text-orange-800 bg-orange-200 py-3 rounded-[18px] text-sm flex items-center justify-center gap-2">⏳ 교사 승인 대기중</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PAGE 2: 성찰과 성장 ═══ */}
        {activeTab==='reflection' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 md:p-12 rounded-[60px] shadow-xl border-4 border-emerald-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"/>
                <BookOpen className="w-20 h-20 text-emerald-400 mx-auto mb-6 relative z-10"/>
                <h2 className="text-3xl md:text-4xl font-black mb-4 text-emerald-900 relative z-10">성찰과 회복 센터 🌱</h2>
                <p className="text-emerald-600 font-bold mb-8 text-base relative z-10">내 마음을 돌아보고 더 단단한 나로 성장해요.</p>
                <div className="text-left space-y-8 bg-emerald-50/60 p-8 rounded-[40px] border-2 border-emerald-100 shadow-inner relative z-10">
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-4 py-1.5 rounded-full">1. 누가 성찰하나요?</label>
                    <select value={refTarget} onChange={e=>setRefTarget(e.target.value)} className="w-full p-5 rounded-3xl border-2 border-white font-black bg-white text-lg outline-none focus:border-emerald-300 shadow-sm">
                      <option value="">이름을 선택하세요 (위기 친구만)</option>
                      {crisisStudents.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  {refTarget && (
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 p-6 rounded-[24px] text-pink-800 shadow-sm animate-in fade-in">
                      <h4 className="text-base font-black mb-3 flex items-center gap-2"><Heart className="w-5 h-5 fill-pink-400"/> 다시 일어서는 용기!</h4>
                      <p className="text-sm font-bold bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">넌 우리 반의 보물이야. 스스로 다독이고 다시 시작해봐!</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-4 py-1.5 rounded-full">2. 필요한 역량은?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {SEL_OPTIONS.map(opt=>(
                        <button key={opt.id} onClick={()=>setRefTag(opt.name)} className={`p-4 rounded-2xl border-2 font-black text-xs text-left transition-all shadow-sm ${refTag===opt.name?'bg-emerald-500 border-emerald-500 text-white':'bg-white border-white text-slate-500 hover:-translate-y-1'}`}>{opt.short}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-4 py-1.5 rounded-full">3. 마음 다짐 적기</label>
                    <textarea value={refText} onChange={e=>setRefText(e.target.value)} rows="5" className="w-full p-6 rounded-[24px] border-2 border-white font-black bg-white resize-none text-base outline-none focus:border-emerald-300 shadow-sm" placeholder="무엇을 느꼈고, 어떻게 다르게 행동할까요?"/>
                  </div>
                  <button onClick={submitReflection} className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black text-xl shadow-xl hover:bg-emerald-700 active:scale-95 flex justify-center items-center gap-3">
                    <Send className="w-6 h-6"/> 제출하고 위기 탈출
                  </button>
                </div>
              </div>

              <div className="bg-white p-10 md:p-12 rounded-[60px] shadow-xl border-4 border-yellow-100 text-center relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full blur-3xl opacity-60 pointer-events-none"/>
                <Sparkles className="w-20 h-20 text-yellow-400 mx-auto mb-6 relative z-10"/>
                <h2 className="text-3xl md:text-4xl font-black mb-4 text-yellow-900 relative z-10">빛나는 실수 게시판 ✨</h2>
                <p className="text-yellow-600 font-bold mb-8 text-base relative z-10">실패는 성장의 증거! 멋진 실패를 칭찬해 주세요.</p>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4 text-left relative z-10 max-h-[500px]">
                  {safeArray(db.mistakes).length > 0 ? safeArray(db.mistakes).map(m => (
                    <div key={m.id} className="bg-yellow-50 p-6 rounded-[30px] border border-yellow-200 shadow-sm relative">
                      <p className="text-sm font-black text-yellow-700 mb-2">오늘 나의 실수는...</p>
                      <p className="text-base font-bold text-slate-700 mb-4 bg-white p-4 rounded-2xl">"{m.text}"</p>
                      <p className="text-sm font-black text-emerald-600 mb-2">이걸 통해 배운 점은!</p>
                      <p className="text-base font-bold text-slate-700 mb-4 bg-white p-4 rounded-2xl">"{m.lesson}"</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-400 font-bold">{m.date}</span>
                        <button onClick={() => { const updated = safeArray(db.mistakes).map(x => x.id === m.id ? { ...x, likes: (x.likes||0)+1 } : x); sync({ mistakes: updated }); playSound('good'); }} className="flex items-center gap-1.5 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full text-xs font-black transition-colors shadow-sm active:scale-95">👏 멋진 실패야! {m.likes || 0}</button>
                      </div>
                    </div>
                  )) : ( <p className="text-yellow-500/70 font-bold text-center py-20">아직 등록된 실수가 없습니다.<br/>오늘의 멋진 도전을 들려주세요!</p> )}
                </div>
                <button onClick={() => setShowMistakeModal(true)} className="w-full bg-yellow-400 text-yellow-900 py-5 rounded-[24px] font-black text-xl shadow-xl hover:bg-yellow-500 active:scale-95 flex justify-center items-center gap-3 mt-6 relative z-10">
                  <Plus className="w-6 h-6"/> 나의 실수 자랑하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PAGE 3: 도움실 ═══ */}
        {activeTab==='helproom' && (
          <div className="bg-white rounded-[50px] shadow-sm border-4 border-indigo-50 flex flex-col lg:flex-row min-h-[800px] animate-in fade-in overflow-hidden">
            <aside className="w-full lg:w-80 bg-indigo-50/50 p-10 border-r-2 border-white flex flex-col gap-5 shrink-0">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-indigo-100"><Users className="w-12 h-12 text-indigo-500"/></div>
                <h3 className="text-3xl font-black text-indigo-900">학급 도움실</h3>
              </div>
              {[
                { key:'inspector',  icon:<Briefcase className="w-6 h-6"/>,   label:'감찰사 본부',  active:'bg-indigo-500' },
                { key:'rescue',     icon:<Shield className="w-6 h-6"/>,      label:'내 친구 보호막',active:'bg-rose-500' },
                { key:'magistrate', icon:<BookOpen className="w-6 h-6"/>,    label:'현령 관리소',  active:'bg-indigo-500' },
                { key:'roster',     icon:<Users className="w-6 h-6"/>,       label:'명단 및 직업', active:'bg-blue-500'   },
                { key:'shop',       icon:<ShoppingCart className="w-6 h-6"/>,label:'학급 상점',    active:'bg-amber-400'  }
              ].map(m=>(
                <button key={m.key} onClick={()=>setHelpSubTab(m.key)} className={`w-full p-6 rounded-3xl font-black text-left flex items-center gap-4 text-lg transition-all ${helpSubTab===m.key?`${m.active} text-white shadow-xl translate-x-2`:'bg-white text-indigo-400 hover:translate-x-1'}`}>{m.icon} {m.label}</button>
              ))}
            </aside>

            <section className="flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-50/30">
              <div className="mb-10 bg-gradient-to-r from-yellow-100 to-amber-100 p-8 rounded-[40px] shadow-sm flex flex-col md:flex-row gap-8 items-center border-2 border-yellow-200">
                <div className="md:w-1/3 text-center md:text-left">
                  <h4 className="text-2xl font-black text-amber-800 mb-2 flex items-center justify-center md:justify-start gap-2"><Coins className="w-8 h-8 text-yellow-500"/> 명예의 기부처</h4>
                  <p className="text-sm font-bold text-amber-700">나의 코인으로 우리 반 명성을 높이세요!</p>
                </div>
                <div className="md:w-2/3 flex gap-4 w-full">
                  <select id="donate_who_main" className="flex-1 p-5 rounded-2xl bg-white border-2 border-white font-black outline-none text-lg text-slate-700 shadow-sm">
                    <option value="">누가 기부할까요?</option>
                    {activeStudents.map(s=><option key={s.id} value={s.id}>{s.name} (잔여: {s.coins}🪙)</option>)}
                  </select>
                  <input id="donate_amount_main" type="number" placeholder="금액" className="w-32 p-5 rounded-2xl bg-white border-2 border-white font-black outline-none text-center text-lg shadow-sm"/>
                  <button onClick={()=>{ const sid=document.getElementById('donate_who_main').value; const amt=toInt(document.getElementById('donate_amount_main').value); if(!sid||!amt) return alert("정보를 모두 입력하세요."); handleDonate(toInt(sid),amt); }} className="bg-amber-500 text-white px-8 rounded-2xl font-black text-xl hover:bg-amber-600 active:scale-95 shadow-md">기부</button>
                </div>
              </div>

              {helpSubTab==='inspector' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="bg-white p-10 rounded-[40px] border-2 border-indigo-100 shadow-sm">
                    <h3 className="text-2xl font-black text-indigo-800 mb-6 flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-indigo-500"/> 온기 우체통 승인 센터</h3>
                    <div className="space-y-4">
                      {safeArray(db.pendingPraises).length > 0 ? safeArray(db.pendingPraises).map(p => {
                        const fromName = p.fromId === 'me' ? '비밀천사' : (allStats.find(s=>s.id==p.fromId)?.name || '알 수 없음');
                        const toName = p.toId === 'me' ? '나 자신' : (allStats.find(s=>s.id==p.toId)?.name || '알 수 없음');
                        const selShort = SEL_OPTIONS.find(o=>o.name===p.tag)?.short || p.tag;
                        const isProcessing = processingPraiseRef.current.has(p.id);
                        return (
                          <div key={p.id} className="bg-indigo-50 p-6 rounded-3xl border border-indigo-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                              <p className="text-sm font-black text-indigo-600 mb-2 bg-white inline-block px-3 py-1 rounded-lg shadow-sm border border-indigo-100">{fromName} 👉 {toName} ({selShort})</p>
                              <p className="text-lg font-bold text-slate-700 bg-white p-4 rounded-2xl">"{p.text}"</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {/* [버그수정] disabled 속성으로 처리 중 재클릭 방어 */}
                              <button
                                disabled={isProcessing}
                                onClick={() => approvePraise(p.id, true)}
                                className={`px-6 py-4 rounded-2xl font-black shadow-md transition-transform ${isProcessing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'}`}
                              >승인</button>
                              <button
                                disabled={isProcessing}
                                onClick={() => approvePraise(p.id, false)}
                                className={`px-6 py-4 rounded-2xl font-black shadow-md transition-transform ${isProcessing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-red-400 text-white hover:bg-red-500 active:scale-95'}`}
                              >반려</button>
                            </div>
                          </div>
                        )
                      }) : <p className="text-center py-10 text-slate-400 font-bold bg-slate-50 rounded-3xl border-dashed border-2 border-slate-200">승인 대기 중인 칭찬이 없습니다.</p>}
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[40px] border-2 border-slate-100 shadow-sm">
                    <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><History className="w-7 h-7 text-slate-500"/> 점수 변동 기록장 <span className="text-sm font-bold text-slate-400">(최근 50건)</span></h3>
                    <div className="overflow-x-auto bg-slate-50 rounded-3xl border border-slate-200">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-sm font-black text-slate-500 uppercase tracking-widest">
                          <tr><th className="p-5 rounded-tl-3xl">일시</th><th className="p-5">학생 이름</th><th className="p-5">변동 코인</th><th className="p-5 rounded-tr-3xl">사유</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {safeArray(db.pointLogs).length > 0 ? safeArray(db.pointLogs).map(l => (
                            <tr key={l.id} className="hover:bg-white transition-colors text-base font-bold text-slate-700">
                              <td className="p-5 text-sm text-slate-400">{l.date}</td>
                              <td className="p-5">{l.name}</td>
                              <td className={`p-5 font-black ${l.amount > 0 ? 'text-blue-500' : 'text-red-500'}`}>{l.amount > 0 ? `+${l.amount}🪙` : `${l.amount}🪙`}</td>
                              <td className="p-5">{l.reason}</td>
                            </tr>
                          )) : <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold">기록된 내역이 없습니다.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {helpSubTab === 'rescue' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="bg-white p-10 rounded-[40px] border-2 border-rose-100 shadow-sm">
                    <h3 className="text-2xl font-black text-rose-800 mb-4 flex items-center gap-3"><Shield className="w-7 h-7 text-rose-500"/> 내 친구 보호막</h3>
                    <p className="text-slate-600 font-bold mb-8 bg-rose-50 p-4 rounded-2xl border border-rose-100">나의 코인을 사용하여 위기(🚨)에 빠진 친구를 구출합니다. (구제 비용: <span className="text-rose-600 font-black">{db.settings?.pointConfig?.rescueCost || 50}🪙</span>)</p>
                    <div className="flex flex-col md:flex-row gap-4">
                      <select value={rescuer} onChange={e=>setRescuer(e.target.value)} className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none focus:border-rose-400 shadow-sm">
                        <option value="">누가 구출하나요? (나의 이름)</option>
                        {activeStudents.map(s=><option key={s.id} value={s.id}>{s.name} (보유: {s.coins}🪙)</option>)}
                      </select>
                      <select value={rescueTarget} onChange={e=>setRescueTarget(e.target.value)} className="flex-1 p-5 rounded-2xl bg-rose-50 border border-rose-200 font-black text-lg outline-none focus:border-rose-400 shadow-sm text-rose-900">
                        <option value="">누구를 구출할까요? (위기 학생)</option>
                        {allStats.filter(s=>s.status==='crisis').map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button onClick={executeRescue} className="bg-rose-500 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-md hover:bg-rose-600 active:scale-95 transition-transform flex items-center gap-2"><Sparkles className="w-5 h-5"/> 구출하기</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── [기능추가] 현령 관리소: 상단에 코인 강제 조정 패널 추가 ─── */}
              {helpSubTab==='magistrate' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="bg-amber-50/50 p-10 rounded-[40px] border border-amber-100 shadow-sm">
                    <h4 className="font-black text-2xl text-amber-900 mb-6 flex items-center gap-3"><Coins className="w-7 h-7 text-amber-500"/> 개별 학생 코인 강제 조정</h4>
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-3xl shadow-sm border border-amber-200">
                      <select id="coin_adjust_student" className="flex-1 p-4 rounded-2xl border border-slate-200 font-black outline-none text-lg focus:border-amber-400">
                        <option value="">코인을 조절할 학생 선택</option>
                        {allStats.map((s, idx)=><option key={`coin_adj_${s.id}_${idx}`} value={s.id}>{s.name} {s.status==='crisis' ? '(🚨위기)' : s.status==='pending' ? '(⏳대기)' : ''} (현재: {s.coins}🪙)</option>)}
                      </select>
                      <input id="coin_adjust_amount" type="number" placeholder="증감할 코인량 (예: 10 또는 -5)" className="w-64 p-4 rounded-2xl border border-slate-200 font-black outline-none text-base focus:border-amber-400 text-center"/>
                      <button onClick={()=>{ const sid=document.getElementById('coin_adjust_student').value; const amt=toInt(document.getElementById('coin_adjust_amount').value); if(!sid||!amt) return alert("학생과 금액을 모두 입력하세요."); const user=allStats.find(u=>u.id==sid); if(user && window.confirm(`[${user.name}] 학생에게 ${amt>0?'+'+amt:amt} 코인을 적용할까요?`)){ sync({ bonusCoins:{...db.bonusCoins,[sid]:(db.bonusCoins?.[sid]||0)+amt} }); document.getElementById('coin_adjust_amount').value=""; logPoint(sid, amt, '교사 강제 코인 조정'); playSound('good'); } }} className="bg-amber-500 text-white px-10 rounded-2xl font-black text-lg shadow-md hover:bg-amber-600 active:scale-95 transition-transform">강제 적용</button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3 bg-blue-100 inline-block px-6 py-3 rounded-full border border-blue-200"><BookOpen className="text-blue-600 w-8 h-8"/> 현령 직업 관리소</h3>
                    <p className="text-sm font-bold text-blue-600 bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 shadow-sm">💡 이곳에서 올리는 점수만 '장인' 승급에 반영됩니다.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1,2,3,4,5,6].map((gNum, gIdx)=>{
                      const members=groupedByGroupStats.filter(s=>s.group===gNum);
                      if(!members.length) return null;
                      return (
                        <div key={`mag_grp_${gNum}_${gIdx}`} className="bg-white p-8 rounded-[40px] border-2 border-blue-50 shadow-sm">
                          <h4 className="text-xl font-black text-blue-800 mb-6 bg-blue-50 inline-block px-6 py-2 rounded-full border border-blue-100">{gNum}모둠</h4>
                          <div className="grid grid-cols-1 gap-4">
                            {members.map((s, sIdx)=>(
                              <div key={`mag_mem_${s.id}_${sIdx}`} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div><p className="text-sm font-bold text-slate-400 mb-1">{s.role}</p><p className="font-black text-2xl text-slate-800">{s.name}</p></div>
                                  {/* 👇 상태 강제 초기화 기능 추가 */}
                                  {(s.status === 'pending' || s.status === 'crisis') && (
                                    <button 
                                      onClick={() => { if(window.confirm(`${s.name} 학생의 대기/위기 상태를 해제하고 '보통'으로 변경할까요?`)) sync({ studentStatus: { ...db.studentStatus, [s.id]: 'normal' } }); }}
                                      className="p-2 bg-white text-blue-500 rounded-xl shadow-sm border border-blue-100 hover:bg-blue-100 transition-colors"
                                      title="상태 강제 해제"
                                    >
                                      <RotateCcw className="w-5 h-5"/>
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 bg-white p-2 rounded-[18px] border border-slate-200 shadow-sm">
                                  <button onClick={()=>handleExpAdjust(s.id,-1)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Minus className="w-6 h-6"/></button>
                                  <span className="w-14 text-center font-black text-blue-600 text-2xl">{s.exp}</span>
                                  <button onClick={()=>handleExpAdjust(s.id,1)} className="p-3 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-colors"><Plus className="w-6 h-6"/></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* ─── [기능추가] 명단 및 직업: 학생 카드에서 직접 수정 ─── */}
              {helpSubTab==='roster' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-500 pl-6 mb-6">👥 명단 및 직업 관리</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                    <h4 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><Briefcase className="w-6 h-6 text-indigo-500"/> 학급 직업(1인 1역) 목록 관리</h4>
                    <div className="flex gap-3 mb-6 bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                      <input id="new_role_input_hr" type="text" placeholder="새로운 직업 이름 입력" className="flex-1 p-4 rounded-xl border border-indigo-200 font-bold outline-none text-lg focus:border-indigo-400 shadow-sm"/>
                      <button onClick={()=>{ const val=document.getElementById('new_role_input_hr').value.trim(); if(!val) return alert("입력하세요."); if(safeArray(db.rolesList).includes(val)) return alert("이미 존재하는 직업입니다."); sync({ rolesList:[...safeArray(db.rolesList),val] }); document.getElementById('new_role_input_hr').value=""; }} className="bg-indigo-600 text-white px-8 rounded-xl font-black text-lg shadow-md hover:bg-indigo-700 active:scale-95 transition-transform">목록에 추가</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {safeArray(db.rolesList).map((r,idx)=>(
                        // 🔥 고유성을 위해 문자열 자체(r)와 index를 결합하여 안전한 key 생성
                        <div key={`role_${r}_${idx}`} className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-2 border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors">
                          <span className="font-black text-indigo-900 text-lg">{r}</span>
                          <button onClick={()=>{ if(window.confirm(`'${r}' 직업을 삭제하시겠습니까?`)) sync({ rolesList:safeArray(db.rolesList).filter(role=>role!==r) }); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                    <h4 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><Users className="w-6 h-6 text-blue-500"/> 학생 전입 및 삭제</h4>
                    <div className="flex flex-wrap gap-4 mb-10 bg-slate-50 p-8 rounded-[30px] border border-slate-200 shadow-sm">
                      <input type="text" placeholder="새 학생 이름" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="flex-1 p-5 rounded-2xl border border-slate-300 font-bold outline-none text-lg focus:border-blue-400 shadow-sm"/>
                      <select value={newStudentGroup} onChange={e=>setNewStudentGroup(e.target.value)} className="w-36 p-5 rounded-2xl border border-slate-300 font-bold outline-none text-lg shadow-sm">{[1,2,3,4,5,6].map(g=><option key={g} value={g}>{g}모둠</option>)}</select>
                      <select value={newStudentEnneagram} onChange={e=>setNewStudentEnneagram(e.target.value)} className="w-40 p-5 rounded-2xl border border-slate-300 font-bold outline-none text-lg shadow-sm"><option value="">성향 없음</option>{Object.keys(ENNEAGRAM_DATA).map(k=><option key={k} value={k}>{k}번 유형</option>)}</select>
                      <button onClick={handleAddStudent} className="bg-blue-600 text-white px-10 rounded-2xl font-black text-lg shadow-md hover:bg-blue-700 active:scale-95 transition-transform">전입생 추가</button>
                    </div>
                    {/* [기능추가] 학생 카드에서 모둠/직업/이름 직접 수정 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {safeStudents.map(s=>(
                        <div key={s.id} className="bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-blue-300 transition-colors shadow-sm flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg">{s.id}번</span>
                            <button onClick={()=>handleRemoveStudent(s.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors shadow-sm"><Trash2 className="w-4 h-4"/></button>
                          </div>
                          {/* 이름 수정 */}
                          <input
                            type="text"
                            defaultValue={s.name}
                            onFocus={lockEditing}
                            onBlur={e => { unlockEditing(); const v = e.target.value.trim(); if(v && v !== s.name) handleStudentFieldChange(s.id, 'name', v); }}
                            className="w-full font-black text-xl text-slate-800 px-3 py-2 rounded-xl border-2 border-transparent hover:border-blue-200 focus:border-blue-400 bg-slate-50 outline-none transition-colors"
                            placeholder="이름"
                          />
                          {/* 모둠 수정 */}
                          <select
                            value={s.group}
                            onChange={e => handleStudentFieldChange(s.id, 'group', toInt(e.target.value))}
                            className="w-full p-3 rounded-xl border-2 border-slate-100 font-bold text-base outline-none focus:border-blue-400 bg-slate-50 text-slate-700"
                          >
                            {[1,2,3,4,5,6].map(g=><option key={g} value={g}>{g}모둠</option>)}
                          </select>
                          {/* 직업 수정 */}
                          <select
                            value={s.role}
                            onChange={e => handleStudentFieldChange(s.id, 'role', e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-slate-100 font-bold text-base outline-none focus:border-indigo-400 bg-slate-50 text-indigo-700"
                          >
                            <option value="">직업 없음</option>
                            {safeArray(db.rolesList).map((r,i)=><option key={i} value={r}>{r}</option>)}
                          </select>
                          {/* 에니어그램 표시 */}
                          {s.enneagram && (
                            <span className="self-start bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs px-3 py-1 rounded-full shadow-sm">{s.enneagram}번 유형</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {helpSubTab==='shop' && (
                <div className="space-y-10 animate-in fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-amber-200 pb-6">
                    <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3 bg-amber-100 inline-block px-6 py-3 rounded-full border border-amber-200"><ShoppingCart className="text-amber-600 w-8 h-8"/> 달보드레 상점</h3>
                    <div className={`px-10 py-5 rounded-full font-black text-xl shadow-lg border-4 ${isShopOpen?'bg-green-500 text-white border-green-300 animate-pulse':'bg-slate-500 text-white border-slate-400'}`}>{isShopOpen?"🔓 상점 영업 중":"🔒 목요일에 개방됩니다"}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-10 rounded-[40px] border-4 border-amber-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200 rounded-full blur-[60px] opacity-40"/>
                    <h4 className="text-3xl font-black text-amber-900 mb-3 relative z-10 flex items-center gap-2"><Gavel className="w-8 h-8"/> 장인의 공방</h4>
                    <p className="text-base font-bold text-amber-700 mb-8 relative z-10">숙련도 20회 이상 '장인'의 기발한 아이템을 기획해 결재를 올립니다. (판매 시 로열티 5% 지급)</p>
                    <div className="flex flex-wrap gap-4 relative z-10">
                      <select value={artisanTarget} onChange={e=>setArtisanTarget(e.target.value)} className="w-56 p-5 rounded-2xl bg-white border-2 border-amber-200 font-black text-lg outline-none shadow-sm focus:border-amber-400">
                        <option value="">장인 명단 확인</option>
                        {allStats.filter(s=>s.exp>=20).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <input type="text" placeholder="기발한 아이템 이름" value={artisanItemName} onChange={e=>setArtisanItemName(e.target.value)} className="flex-1 p-5 rounded-2xl bg-white border-2 border-amber-200 font-bold text-lg outline-none shadow-sm focus:border-amber-400"/>
                      <input type="number" placeholder="희망 가격" value={artisanItemPrice} onChange={e=>setArtisanItemPrice(e.target.value)} className="w-32 p-5 rounded-2xl bg-white border-2 border-amber-200 font-bold text-lg outline-none text-center shadow-sm focus:border-amber-400"/>
                      <button onClick={submitArtisanItem} className="bg-amber-600 text-white px-10 rounded-2xl font-black text-lg shadow-lg hover:bg-amber-700 active:scale-95 transition-transform">결재 올리기</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {safeArray(db.shopItems).filter(i=>i&&i.name).map(item=>(
                      <div key={item.id} className="bg-white p-10 rounded-[40px] shadow-sm border-2 border-slate-100 flex flex-col justify-between hover:border-amber-300 transition-colors">
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <span className="text-sm font-black bg-slate-100 text-slate-500 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">{String(item.creator)} 제작</span>
                            <p className="text-4xl font-black text-amber-500">{toInt(item.price)} 🪙</p>
                          </div>
                          <h4 className="text-3xl font-black text-slate-800 mb-10">{String(item.name)}</h4>
                        </div>
                        <div className="flex gap-4">
                          <select id={`buyer_${item.id}`} className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none text-lg shadow-sm">
                            <option value="">누가 구매하나요?</option>
                            {activeStudents.map(s=><option key={s.id} value={s.id}>{s.name} (잔여: {s.coins}🪙)</option>)}
                          </select>
                          <button onClick={()=>{
                            if(!isShopOpen) return alert("오늘은 상점 운영일이 아닙니다!");
                            const sid=document.getElementById(`buyer_${item.id}`).value;
                            if(!sid) return alert("구매할 사람을 선택하세요.");
                            const user=activeStudents.find(u=>u.id==sid);
                            const price=toInt(item.price);
                            if(user.coins<price) return alert("코인이 부족합니다.");
                            if(!window.confirm(`${user.name}의 코인 ${price}🪙을 차감할까요?`)) return;
                            const repBonus=Math.ceil(price*0.10);
                            const coinBonus=Math.ceil(price*0.05);
                            const newHistory={ id:Date.now(),date:formatDate(),itemName:String(item.name),buyerName:user.name,price };
                            let updates={ usedCoins:{...db.usedCoins,[sid]:(db.usedCoins[sid]||0)+price}, purchaseHistory:[newHistory,...safeArray(db.purchaseHistory)].slice(0,50) };
                            let alertMsg="결제 승인 완료!";
                            if(item.creatorId){ updates.bonusCoins={...db.bonusCoins,[item.creatorId]:(db.bonusCoins?.[item.creatorId]||0)+coinBonus}; updates.manualRepOffset=(db.manualRepOffset||0)+repBonus; alertMsg=`결제 완료! 💸 장인(${item.creator}) 로열티 +${coinBonus}🪙, 학급 명성 +${repBonus}p!`; }
                            sync(updates); alert(alertMsg); playSound('buy');
                          }} className="bg-amber-500 text-white px-10 rounded-2xl font-black text-xl shadow-lg hover:bg-amber-600 active:scale-95 transition-transform">구매</button>
                        </div>
                      </div>
                    ))}
                    {safeArray(db.funding).filter(f=>f&&f.name).map(f=>(
                      <div key={f.id} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-10 rounded-[40px] shadow-xl text-white flex flex-col justify-between relative overflow-hidden border-4 border-blue-400">
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"/>
                        <div className="relative z-10">
                          <h4 className="text-3xl font-black mb-3 flex items-center gap-3"><Target className="w-8 h-8 text-yellow-300"/> {String(f.name)}</h4>
                          <p className="text-base font-bold text-blue-100 mb-10">십시일반 투자하여 다 함께 목표를 이뤄요!</p>
                          <div className="flex justify-between items-end text-xl font-black mb-4"><span>현재: {toInt(f.current)}p</span><span className="text-blue-200">목표: {toInt(f.target,1)}p</span></div>
                          <div className="w-full h-6 bg-black/30 rounded-full mb-10 overflow-hidden border border-white/20"><div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width:`${Math.min((toInt(f.current)/toInt(f.target,1))*100,100)}%` }}/></div>
                        </div>
                        <div className="flex gap-4 relative z-10">
                          <select id={`funder_${f.id}`} className="flex-1 p-5 rounded-2xl bg-white/20 border-none text-white font-bold outline-none text-lg backdrop-blur-sm"><option value="" className="text-slate-800">누가 투자할까요?</option>{activeStudents.map(s=><option key={s.id} value={s.id} className="text-slate-800">{s.name} ({s.coins}🪙)</option>)}</select>
                          <input id={`f_amt_${f.id}`} type="number" placeholder="금액" className="w-28 p-5 rounded-2xl bg-white/20 border-none text-white font-bold outline-none text-lg text-center placeholder:text-blue-200 backdrop-blur-sm"/>
                          <button onClick={()=>{ const sid=document.getElementById(`funder_${f.id}`).value; const amt=toInt(document.getElementById(`f_amt_${f.id}`).value); if(!sid||!amt) return alert("정확히 입력하세요."); handleFund(f.id,toInt(sid),amt); }} className="bg-yellow-400 text-yellow-900 px-10 rounded-2xl font-black text-xl shadow-lg hover:bg-yellow-300 active:scale-95 transition-transform">투자</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-10 bg-white p-8 rounded-[40px] shadow-sm border-2 border-slate-100">
                    <h4 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><History className="w-6 h-6 text-slate-400"/> 상점 이용 기록 (최근 50건)</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                      {safeArray(db.purchaseHistory).length===0 ? ( <p className="text-center py-10 text-slate-400 font-bold">아직 상점 구매 기록이 없습니다.</p> ) : safeArray(db.purchaseHistory).map(h=>(
                        <div key={h.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-4 flex-wrap"><span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-lg shadow-sm border">{h.date}</span><span className="font-black text-slate-700 text-lg">{h.buyerName}</span><span className="text-sm font-bold text-slate-500">친구가</span><span className="font-black text-amber-600 text-lg">"{h.itemName}"</span><span className="text-sm font-bold text-slate-500">물품을 구매했습니다.</span></div>
                          <span className="font-black text-amber-500 text-lg shrink-0">-{h.price}🪙</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ═══ PAGE 4: 관리실 ═══ */}
        {activeTab==='admin' && isAuthenticated==='teacher' && (
          <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 flex flex-col lg:flex-row min-h-[850px] animate-in fade-in overflow-hidden">
            <aside className="w-full lg:w-80 bg-slate-900 p-10 flex flex-col gap-4 shrink-0 border-r border-slate-800">
              <div className="text-center mb-10"><Lock className="w-16 h-16 text-blue-500 mx-auto mb-4"/><h3 className="text-3xl font-black text-white">관리자 센터</h3><p className="text-slate-400 text-xs font-bold mt-2 tracking-widest">MASTER MODE</p></div>
              {[
                { key:'mission',    icon:<Zap className="w-6 h-6"/>,        label:'결재 및 퀘스트', danger:false },
                { key:'shopAdmin',  icon:<Store className="w-6 h-6"/>,      label:'상점/펀딩 관리',  danger:false },
                { key:'report',     icon:<BarChart3 className="w-6 h-6"/>,  label:'SEL 리포트',   danger:false },
                { key:'attendAdmin',icon:<CheckCircle2 className="w-6 h-6"/>,label:'출석 보정',    danger:false },
                { key:'settings',   icon:<Settings className="w-6 h-6"/>,   label:'환경 및 점수',  danger:false },
                { key:'reset',      icon:<History className="w-6 h-6"/>,    label:'초기화/마감',  danger:true  }
              ].map(m=>(
                <button key={m.key} onClick={()=>setAdminSubTab(m.key)} className={`w-full p-5 rounded-2xl font-black text-left flex items-center gap-4 text-lg transition-all ${adminSubTab===m.key?(m.danger?'bg-red-600 text-white shadow-lg translate-x-2':'bg-blue-600 text-white shadow-lg translate-x-2'):'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:translate-x-1'}`}>{m.icon} {m.label}</button>
              ))}
              <button onClick={handleLogout} className="mt-auto p-5 bg-slate-800 text-slate-400 font-black rounded-2xl text-center hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"><LogOut className="w-5 h-5"/> 로그아웃</button>
            </aside>

            <section className="flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-50/50">
              {adminSubTab==='mission' && (
                <div className="space-y-10 animate-in fade-in">
                  {safeArray(db.pendingReflections).length>0 && (
                    <div className="bg-emerald-50 p-8 rounded-[40px] border-2 border-emerald-200 shadow-sm">
                      <h3 className="text-2xl font-black text-emerald-800 mb-6 flex items-center gap-2"><CheckCircle2 className="w-7 h-7"/> 성찰 다짐 승인 대기 ({safeArray(db.pendingReflections).length}건)</h3>
                      <div className="space-y-4">
                        {safeArray(db.pendingReflections).map(r=>{
                          const s=allStats.find(x=>x.id===r.studentId);
                          return (
                            <div key={r.id} className="bg-white p-6 rounded-3xl border border-emerald-100 flex justify-between items-start gap-4 shadow-sm">
                              <div><p className="text-sm font-black text-emerald-600 mb-1">{s?.name} · {SEL_OPTIONS.find(o=>o.name===r.tag)?.short} · {r.date}</p><p className="font-bold text-slate-700 whitespace-pre-wrap">{r.text}</p></div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={()=>{ sync({ studentStatus:{...db.studentStatus,[r.studentId]:'normal'}, pendingReflections:safeArray(db.pendingReflections).filter(x=>x.id!==r.id) }); playSound('good'); alert(`${s?.name} 학생 성찰 승인! 🌱`); }} className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-emerald-600 shadow-md">승인</button>
                                {/* 👇 이 반려 버튼 로직이 수정되었습니다! */}
                                <button onClick={()=>{ 
                                  sync({ 
                                    studentStatus: { ...db.studentStatus, [r.studentId]: 'crisis' }, 
                                    pendingReflections: safeArray(db.pendingReflections).filter(x=>x.id!==r.id) 
                                  }); 
                                  playSound('bad'); 
                                  alert(`${s?.name} 학생의 성찰 다짐을 반려했습니다.`); 
                                }} className="bg-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-slate-300">반려</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {safeArray(db.pendingShopItems).length>0 && (
                    <div className="bg-amber-50 p-8 rounded-[40px] border-2 border-amber-200 shadow-sm">
                      <h3 className="text-2xl font-black text-amber-800 mb-6 flex items-center gap-2"><Gavel className="w-7 h-7"/> 장인 아이템 결재 대기 ({safeArray(db.pendingShopItems).length}건)</h3>
                      <div className="space-y-4">
                        {safeArray(db.pendingShopItems).map(item=>(
                          <div key={item.id} className="bg-white p-6 rounded-3xl border border-amber-100 flex justify-between items-center gap-4 shadow-sm">
                            <div><p className="text-sm font-black text-amber-600 mb-1">{item.creator} 장인 제작</p><p className="font-black text-xl text-slate-800">{item.name} <span className="text-amber-500">{item.price}🪙</span></p></div>
                            <div className="flex gap-2 shrink-0"><button onClick={()=>{ sync({ shopItems:[...safeArray(db.shopItems),item], pendingShopItems:safeArray(db.pendingShopItems).filter(x=>x.id!==item.id) }); alert(`"${item.name}" 상점 등록 완료!`); playSound('good'); }} className="bg-amber-500 text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-amber-600 shadow-md">승인</button><button onClick={()=>sync({ pendingShopItems:safeArray(db.pendingShopItems).filter(x=>x.id!==item.id) })} className="bg-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-slate-300">반려</button></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                    <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-4 mb-6 flex items-center gap-2"><Settings className="w-6 h-6 text-blue-500"/> 공동 퀘스트 & 타임어택</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                      {[ { key:'q1',bgClass:'bg-indigo-50 border-indigo-100',textClass:'text-indigo-600',defName:'다 함께 바른 생활',defVal:50 }, { key:'q2',bgClass:'bg-pink-50 border-pink-100',    textClass:'text-pink-600',  defName:'환대와 응원',      defVal:20 }, { key:'q3',bgClass:'bg-emerald-50 border-emerald-100',textClass:'text-emerald-600',defName:'전담수업 태도', defVal:20 }, { key:'q5',bgClass:'bg-amber-50 border-amber-100',textClass:'text-amber-600',defName:'청소 만점', defVal:10 }, { key:'q4',bgClass:'bg-yellow-50 border-yellow-100',textClass:'text-yellow-600',defName:'사이좋은 일주일', defVal:100 } ].map(q=>(
                        <div key={q.key} className={`${q.bgClass} p-4 rounded-2xl border flex gap-3 shadow-sm`}><input type="text" value={db.coopQuest?.[`${q.key}Name`]||q.defName} onChange={e=>sync({ coopQuest:{...db.coopQuest,[`${q.key}Name`]:e.target.value} })} onFocus={lockEditing} onBlur={unlockEditing} className="flex-1 p-3 rounded-xl text-sm font-bold border-none outline-none shadow-sm"/><input type="number" value={db.coopQuest?.[q.key]??q.defVal} onChange={e=>sync({ coopQuest:{...db.coopQuest,[q.key]:toInt(e.target.value)} })} onFocus={lockEditing} onBlur={unlockEditing} className={`w-20 p-3 rounded-xl text-base font-black ${q.textClass} border-none outline-none text-center shadow-sm`}/></div>
                      ))}
                    </div>
                    <div className="bg-red-50 p-8 rounded-[30px] border-2 border-red-200 shadow-inner">
                      <h4 className="text-xl font-black text-red-800 mb-6 flex items-center gap-2"><Timer className="w-6 h-6"/> 타임어택 발동기</h4>
                      {db.timeAttack?.isActive ? (
                        <div className="space-y-6">
                          <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-inner flex flex-col items-center">
                            <p className="text-4xl font-black text-red-600 tracking-widest mb-5">{timeLeftString}</p>
                            <div className="flex items-center justify-center gap-3 w-full bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <button onClick={() => sync({ timeAttack: { ...db.timeAttack, endTime: db.timeAttack.endTime - 60000 } })} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg font-black text-sm active:scale-95 shadow-sm">-1분</button>
                              <button onClick={() => sync({ timeAttack: { ...db.timeAttack, endTime: db.timeAttack.endTime + 60000 } })} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg font-black text-sm active:scale-95 shadow-sm">+1분</button>
                              <div className="h-6 w-px bg-slate-300 mx-1"></div>
                              <span className="text-sm font-bold text-slate-500">1인 보상:</span>
                              <input type="number" value={db.timeAttack.rewardRep} onChange={(e) => sync({ timeAttack: { ...db.timeAttack, rewardRep: toInt(e.target.value) } })} onFocus={lockEditing} onBlur={unlockEditing} className="w-16 text-center p-2 rounded-lg border border-red-200 font-black text-red-600 outline-none focus:border-red-400 bg-white"/>
                            </div>
                          </div>
                          <div className="flex gap-3"><button onClick={handleCompleteTimeAttack} className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black text-lg shadow-md hover:bg-green-600 active:scale-95 transition-transform">미션 성공 승인</button><button onClick={handleFailTimeAttack} className="flex-1 bg-slate-400 text-white py-4 rounded-2xl font-black text-lg shadow-md hover:bg-slate-500 active:scale-95 transition-transform">실패 종료</button></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-white p-6 rounded-2xl border border-red-200 space-y-5 shadow-sm">
                            <div><label className="block text-[11px] font-black text-red-400 mb-1 ml-1">미션 제목</label><input type="text" placeholder="예: 바닥 쓰레기 0개!" value={taTitle} onChange={e=>setTaTitle(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="w-full p-4 rounded-xl border border-red-100 font-bold outline-none focus:border-red-400"/></div>
                            <div className="flex gap-4"><div className="flex-1"><label className="block text-[11px] font-black text-red-400 mb-1 ml-1">제한 시간(분)</label><input type="number" value={taMins} onChange={e=>setTaMins(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="w-full p-4 rounded-xl border border-red-100 font-black text-center outline-none focus:border-red-400"/></div><div className="flex-1"><label className="block text-[11px] font-black text-red-400 mb-1 ml-1">성공 보상(p)</label><input type="number" value={taReward} onChange={e=>setTaReward(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="w-full p-4 rounded-xl border border-red-100 font-black text-center outline-none focus:border-red-400"/></div></div>
                          </div>
                          <button onClick={handleStartTimeAttack} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black hover:bg-red-700 shadow-lg text-xl active:scale-95 transition-all">🚀 타임어택 발동!</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {adminSubTab==='shopAdmin' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">상점 및 펀딩 관리</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm"><button onClick={()=>sync({ settings:{...db.settings,forceShopOpen:!db.settings?.forceShopOpen} })} className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-md ${db.settings?.forceShopOpen?'bg-amber-500 text-white':'bg-white text-slate-500 border-2 border-slate-300'}`}>정규 상점 개방: {db.settings?.forceShopOpen?'ON (강제 개방 중)':'OFF (목요일에만 열림)'}</button></div>
                    <div className="pt-6">
                      <h4 className="font-black text-xl text-slate-700 mb-6 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-amber-500"/> 상점 물품 관리</h4>
                      <div className="flex gap-3 mb-6"><input id="new_item_name_input" type="text" placeholder="새로운 물품 이름" className="flex-1 p-4 rounded-xl border border-slate-300 font-bold outline-none"/><input id="new_item_price_input" type="number" placeholder="가격" className="w-32 p-4 rounded-xl border border-slate-300 font-bold outline-none text-center"/><button onClick={()=>{ const n=document.getElementById('new_item_name_input').value; const p=document.getElementById('new_item_price_input').value; if(!n||!p) return alert("입력 오류"); sync({ shopItems:[...safeArray(db.shopItems),{ id:Date.now(),name:n,price:toInt(p),creator:'선생님' }] }); document.getElementById('new_item_name_input').value=""; document.getElementById('new_item_price_input').value=""; }} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700">물품 추가</button></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safeArray(db.shopItems).filter(i=>i&&i.name).map(item=>( <div key={item.id} className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex justify-between items-center shadow-sm"><div><span className="text-[10px] text-slate-400 font-black bg-white px-2 py-1 rounded-md">{String(item.creator)}</span><h4 className="font-black text-slate-800 mt-2">{String(item.name)}</h4><p className="text-amber-600 font-black text-sm">{toInt(item.price)}🪙</p></div><button onClick={()=>{ if(window.confirm("삭제할까요?")) sync({ shopItems:safeArray(db.shopItems).filter(i=>i.id!==item.id) }); }} className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-50 shadow-sm"><Trash2 className="w-5 h-5"/></button></div> ))}
                      </div>
                    </div>
                    <div className="pt-8 border-t border-slate-200 mt-8">
                      <h4 className="font-black text-xl text-blue-800 mb-6 flex items-center gap-2"><Target className="w-5 h-5"/> 크라우드 펀딩 관리</h4>
                      <div className="flex gap-3 mb-6 bg-blue-50 p-6 rounded-3xl border border-blue-100"><input id="new_fund_name_input" type="text" placeholder="새로운 펀딩 목표" className="flex-1 p-4 rounded-xl border border-blue-200 font-bold outline-none focus:border-blue-400"/><input id="new_fund_target_input" type="number" placeholder="목표 점수" className="w-32 p-4 rounded-xl border border-blue-200 font-bold outline-none focus:border-blue-400 text-center"/><button onClick={()=>{ const n=document.getElementById('new_fund_name_input').value; const t=document.getElementById('new_fund_target_input').value; if(!n||!t||toInt(t)===0) return alert("올바른 값을 입력하세요."); sync({ funding:[...safeArray(db.funding),{ id:Date.now(),name:n,target:toInt(t),current:0 }] }); document.getElementById('new_fund_name_input').value=""; document.getElementById('new_fund_target_input').value=""; }} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700">펀딩 개설</button></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {safeArray(db.funding).filter(f=>f&&f.name).map(f=>( 
                          <div key={f.id} className="bg-white p-5 rounded-2xl border border-blue-200 flex justify-between items-center shadow-sm">
                            <div>
                              <h4 className="font-black text-blue-900 text-lg">{String(f.name)}</h4>
                              <div className="text-blue-500 font-bold text-sm mt-1 flex items-center gap-2">
                                현재: {toInt(f.current)} / 목표: {toInt(f.target)}p
                                <button onClick={() => {
                                  const newTarget = window.prompt(`"${f.name}"의 새로운 목표 점수를 입력하세요:`, f.target);
                                  if (newTarget && !isNaN(newTarget) && toInt(newTarget) > 0) {
                                    sync({ funding: safeArray(db.funding).map(x => x.id === f.id ? { ...x, target: toInt(newTarget) } : x) });
                                  }
                                }} className="text-[11px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 shadow-sm transition-colors">목표 수정</button>
                              </div>
                            </div>
                            <button onClick={()=>{ if(window.confirm("이 펀딩을 삭제할까요?")) sync({ funding:safeArray(db.funding).filter(x=>x.id!==f.id) }); }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 shadow-sm"><Trash2 className="w-5 h-5"/></button>
                          </div> 
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {adminSubTab==='report' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">🌱 SEL 리포트 & 데이터 추출</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10">
                    <div className="w-full md:w-1/3 space-y-4">
                      <select value={selectedReportStudent} onChange={e=>setSelectedReportStudent(e.target.value)} className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 font-black text-xl outline-none mb-6 focus:border-blue-400 shadow-sm"><option value="">학생을 선택하세요</option>{allStats.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-3 shadow-sm">
                        <h5 className="font-black text-indigo-700 text-sm flex items-center gap-2"><Download className="w-4 h-4"/> AI 리포트 추출</h5>
                        <button disabled={!selectedReportStudent} onClick={()=>exportStudent(selectedReportStudent)} className={`w-full p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 ${selectedReportStudent?'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md':'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Copy className="w-4 h-4"/> 이 학생만 추출</button>
                        <button onClick={exportAll} className="w-full p-4 rounded-xl font-black text-sm bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center gap-2 shadow-md"><Download className="w-4 h-4"/> 전체 반 추출</button>
                      </div>
                      {selectedReportStudent && <button onClick={()=>setShowRollingPaper(toInt(selectedReportStudent))} className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white p-5 rounded-3xl font-black text-lg shadow-lg flex items-center justify-center gap-3 mt-6 transition-transform hover:-translate-y-1"><Printer className="w-6 h-6"/> 온기 롤링페이퍼 인쇄</button>}
                    </div>
                    <div className="w-full md:w-2/3 bg-slate-50 p-10 rounded-[40px] border border-slate-200">
                      {selectedReportStudent ? (() => {
                        const s=allStats.find(x=>x.id==selectedReportStudent);
                        if(!s) return <div className="h-full flex flex-col items-center justify-center text-slate-400 font-black"><AlertTriangle className="w-16 h-16 mb-4 opacity-30 text-red-500"/>삭제된 학생 데이터입니다.</div>;
                        const counts={}; SEL_OPTIONS.forEach(o=>counts[o.name]=0); safeArray(db.approvedPraises).forEach(p=>{ if(p.toId==s.id&&counts[p.tag]!==undefined) counts[p.tag]++; }); const max=Math.max(...Object.values(counts),5);
                        return (
                          <div className="animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-end mb-8 border-b-2 border-slate-200 pb-4"><h4 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Star className="w-8 h-8 text-yellow-400 fill-yellow-400"/> {s.name} 학생 분석</h4><div className="text-right text-sm font-black text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">위기 <span className="text-red-500">{s.atPen}회</span> | 기부 <span className="text-amber-500">{s.atDonate}🪙</span> | 출석 {s.weeklyCount}/5</div></div>
                            {s.enneagram&&ENNEAGRAM_DATA[s.enneagram]&&(<div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-200 mb-10 shadow-sm relative overflow-hidden"><h5 className="font-black text-indigo-900 mb-3 flex items-center gap-2 relative z-10"><Sparkles className="w-5 h-5 text-indigo-500"/> AI 교사 지원 힌트: {ENNEAGRAM_DATA[s.enneagram].name}</h5><p className="text-base font-bold text-indigo-800 leading-relaxed relative z-10">{ENNEAGRAM_DATA[s.enneagram].desc}</p></div>)}
                            <div className="space-y-5 mb-8">
                              {Object.keys(counts).map(tag=>( <div key={tag} className="flex items-center gap-5"><span className="w-28 text-sm font-black text-slate-600 text-right">{SEL_OPTIONS.find(o=>o.name===tag)?.short||tag}</span><div className="flex-1 h-8 bg-white rounded-full overflow-hidden border border-slate-200 shadow-inner"><div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000" style={{ width:`${(counts[tag]/max)*100}%` }}/></div><span className="w-12 font-black text-blue-600 text-right text-lg">{counts[tag]}회</span></div> ))}
                            </div>
                            <div className="border-t-2 border-slate-200 pt-8 mt-8">
                              <button onClick={()=>setShowNotesInReport(!showNotesInReport)} className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-black p-4 rounded-xl flex items-center justify-between transition-colors shadow-sm"><span className="flex items-center gap-3"><StickyNote className="w-6 h-6"/> 누가기록 확인 ({s.notes.length}건)</span><span>{showNotesInReport?'▲ 접기':'▼ 펼치기'}</span></button>
                              {showNotesInReport&&(<div className="mt-4 space-y-3 animate-in fade-in">{s.notes.length===0&&<p className="text-sm text-slate-400 font-bold text-center py-6">작성된 기록이 없습니다.</p>} {s.notes.map(n=>( <div key={n.id} className="bg-white p-4 rounded-2xl border border-yellow-200 flex justify-between items-start gap-4 shadow-sm"><div><p className="text-[11px] font-black text-yellow-600 mb-1">{n.date}</p><p className="text-base font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">{n.text}</p></div><button onClick={()=>deleteNote(s.id,n.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl shrink-0 hover:bg-red-100"><Trash2 className="w-4 h-4"/></button></div> ))} <button onClick={()=>openNoteModal(s.id)} className="w-full bg-yellow-500 text-white p-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-yellow-600 shadow-md mt-4"><Plus className="w-5 h-5"/> 이 학생의 새 기록 추가</button></div>)}
                            </div>
                          </div>
                        );
                      })() : <div className="h-full flex flex-col items-center justify-center text-slate-400 font-black"><BarChart3 className="w-16 h-16 mb-4 opacity-30"/>학생을 선택하면 리포트가 생성됩니다.</div>}
                    </div>
                  </div>
                </div>
              )}
              {adminSubTab==='attendAdmin' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">📅 출석 보정 관리</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                    <div className="mb-12 border-b-2 border-slate-100 pb-10">
                      <h4 className="font-black text-xl text-slate-700 mb-6 flex items-center gap-2"><Sun className="w-6 h-6 text-orange-500"/> 오늘 우리 반 마음 온도</h4>
                      {moodChartData.total === 0 ? (
                        <p className="text-center text-slate-400 font-bold py-6 bg-slate-50 rounded-2xl">아직 마음 날씨를 체크한 학생이 없습니다.</p>
                      ) : (
                        <div className="w-full h-16 rounded-full overflow-hidden flex shadow-inner border-2 border-slate-200">
                          {moodChartData.segments.map((seg, idx) => (
                            <div key={idx} className="h-full flex items-center justify-center relative group cursor-pointer transition-all duration-300 hover:brightness-90" style={{ width: `${seg.widthPct}%`, backgroundColor: seg.barColor }}>
                              {seg.widthPct > 15 && <span className="font-black text-slate-800 drop-shadow-sm text-lg">{seg.emoji} {seg.count}명</span>}
                              <div className="absolute bottom-full mb-3 hidden group-hover:block w-max max-w-[200px] bg-slate-800 text-white text-xs font-bold p-4 rounded-2xl shadow-xl z-50">
                                <p className="text-amber-300 mb-2 text-sm border-b border-slate-600 pb-2">{seg.name} ({seg.count}명)</p>
                                <p className="whitespace-normal leading-relaxed">{seg.students.join(', ')}</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="bg-amber-50 p-8 rounded-3xl border-2 border-amber-200 mb-10 shadow-sm"><h4 className="font-black text-amber-800 mb-4 flex items-center gap-2 text-xl"><Sparkles className="w-6 h-6"/> 공휴일 / 재량휴업일 일괄 보정</h4><p className="text-base font-bold text-amber-700 mb-6">현재 이번 주 보정값: <span className="text-amber-900 bg-white px-3 py-1 rounded-lg border border-amber-200">+{db.extraAttendDays||0}일</span></p><button onClick={teacherAddHoliday} className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black text-xl hover:bg-amber-600 shadow-md transition-transform active:scale-95">전체 학생의 출석일수 +1일 반영하기</button></div>
                    <h4 className="font-black text-xl text-slate-700 mb-6 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> 이번 주 출석 달성 현황 ({getWeekKey()})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allStats.map(s=>{ const bonus=db.attendanceBonus?.[getWeekKey()]?.[s.id]; return ( <div key={s.id} className={`p-5 rounded-2xl border-2 shadow-sm ${bonus?'bg-yellow-50 border-yellow-300':'bg-slate-50 border-slate-200'}`}><div className="flex justify-between items-center"><span className="font-black text-lg">{s.name}</span><div className="flex items-center gap-3"><span className="text-base font-black text-slate-600 bg-white px-3 py-1 rounded-lg border">{s.weeklyCount}/5</span><span className="text-sm font-bold text-slate-400">⭐{s.streak}주</span>{bonus&&<span className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-black shadow-sm animate-pulse">개근!</span>}</div></div></div> ); })}
                    </div>
                  </div>
                </div>
              )}
              {adminSubTab==='settings' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">환경 및 보안 통제소</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
                    <div className="bg-slate-50 p-10 rounded-[30px] border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-10">
                      {[ { title:'관리자 비번 변경',color:'blue', val:masterPwInput,setter:setMasterPwInput,field:'masterPw', current:db.settings?.masterPw }, { title:'도움실 비번 변경',color:'indigo',val:helpPwInput, setter:setHelpPwInput, field:'helpRoomPw', current:db.settings?.helpRoomPw } ].map(p=>(
                        <div key={p.field}><h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-lg"><Lock className={`w-6 h-6 text-${p.color}-500`}/> {p.title}</h4><div className="flex gap-3"><input type="password" value={p.val} onChange={e=>p.setter(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} placeholder="새 비밀번호 입력" className="flex-1 p-4 rounded-2xl border border-slate-300 font-black outline-none focus:border-blue-400 shadow-sm text-lg"/><button onClick={()=>{ if(!p.val) return alert('입력하세요.'); sync({ settings:{...db.settings,[p.field]:p.val} }); alert('변경 완료!'); p.setter(''); }} className="bg-blue-600 text-white px-6 rounded-2xl font-black text-lg shadow-md">변경</button></div><p className="text-sm font-bold text-slate-400 mt-3 bg-white inline-block px-3 py-1 rounded-lg border border-slate-200">현재: {String(p.current)}</p></div>
                      ))}
                    </div>
                    <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-200"><h4 className="font-black text-red-800 mb-3 flex items-center gap-2 text-lg"><LogOut className="w-6 h-6"/> 보안: 모든 기기 강제 로그아웃</h4><button onClick={revokeAllSessions} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-md hover:bg-red-700 transition-colors">모든 세션 즉시 무효화</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t-2 border-slate-100">
                      <div><label className="block text-base font-black text-slate-600 mb-4">대시보드 메인 타이틀</label><input type="text" value={db.settings?.title||""} onChange={e=>sync({ settings:{...db.settings,title:e.target.value} })} onFocus={lockEditing} onBlur={unlockEditing} className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-200 font-black text-xl outline-none focus:border-blue-400 shadow-sm"/></div>
                      <div><label className="block text-base font-black text-slate-600 mb-4">이 주의 마음성장(SEL) 테마</label><select value={db.settings?.dailyTheme||""} onChange={e=>sync({ settings:{...db.settings, dailyTheme:e.target.value, themeDate: formatDate()} })} className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-200 font-black text-xl outline-none focus:border-blue-400 shadow-sm">{SEL_OPTIONS.map(opt=><option key={opt.id} value={opt.name}>{opt.name}</option>)}</select></div>
                      <div><label className="block text-base font-black text-slate-600 mb-4">쉬는 시간 기본 세팅(분)</label><input type="number" value={Math.floor((db.settings?.defaultBreakMs||DEFAULT_BREAK_MS)/60000)} onChange={e=>sync({ settings:{...db.settings,defaultBreakMs:toInt(e.target.value,10)*60000} })} onFocus={lockEditing} onBlur={unlockEditing} className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-200 font-black text-xl outline-none focus:border-blue-400 shadow-sm"/></div>
                    </div>
                    <div className="pt-8 border-t-2 border-slate-100"><button onClick={toggleCumulativeStats} className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-md flex items-center justify-center gap-3 ${db.settings?.showCumulativeStats?'bg-blue-600 text-white':'bg-white text-slate-500 border-2 border-slate-300 hover:border-blue-300'}`}><Eye className="w-6 h-6"/> 누적 스탯 표시: {db.settings?.showCumulativeStats?'ON (공개 중)':'OFF (비공개)'}</button></div>
                    {/* [메뉴 이동] 코인 강제 조정은 현령 관리소로 이동됨. 관리실에는 명성 강제 조정과 점수 밸런스만 유지 */}
                    <div className="pt-8 border-t-2 border-slate-100 bg-indigo-50/50 p-10 rounded-[40px] border border-indigo-100 mt-8"><h4 className="font-black text-2xl text-indigo-900 mb-6 flex items-center gap-3"><Settings className="w-7 h-7 text-indigo-500"/> 학급 명성 강제 조정 및 점수 밸런스</h4><div className="flex flex-col md:flex-row gap-4 mb-10 bg-white p-6 rounded-3xl shadow-sm border border-indigo-200"><input type="number" value={manualScoreInput} onChange={e=>setManualScoreInput(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} placeholder="강제 추가/차감 (예: 50 또는 -20)" className="flex-1 p-4 rounded-2xl border border-slate-200 font-black outline-none text-lg focus:border-indigo-400"/><button onClick={()=>{ const v=toInt(manualScoreInput); if(!v) return; if(window.confirm(`${v>0?'+'+v:v}점의 명성을 즉시 적용할까요?`)){ sync({ manualRepOffset:(db.manualRepOffset||0)+v }); setManualScoreInput(""); playSound('good'); } }} className="bg-indigo-600 text-white px-10 rounded-2xl font-black text-lg shadow-md hover:bg-indigo-700 active:scale-95 transition-transform">명성 적용</button></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                      {[
                        { label:'최고 목표 명성',      key:'targetScore', section:null,          color:'indigo', def:5000 },
                        { label:'수신 기본(🪙)',       key:'praiseBasic', section:'pointConfig', color:'blue', def:10   },
                        { label:'수신 테마(🪙)',       key:'praiseTheme', section:'pointConfig', color:'pink',   def:15   },
                        { label:'발신 보상(🪙)',       key:'praiseSend',  section:'pointConfig', color:'emerald',def:2    },
                        { label:'친구 구제비용(🪙)',    key:'rescueCost',  section:'pointConfig', color:'rose',   def:50   },
                        { label:'위기 차감(p)',        key:'penalty',     section:'pointConfig', color:'red',    def:20   }
                      ].map(f=>( 
                        <div key={f.key} className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between items-center text-center">
                          <label className={`block text-[13px] font-black text-${f.color}-600 mb-3 break-keep leading-tight`}>{f.label}</label>
                          <input type="number" value={f.section?(db.settings?.[f.section]?.[f.key]??f.def):(db.settings?.[f.key]??f.def)} onChange={e=>{ const v=toInt(e.target.value,f.def); const next=f.section?{ ...db.settings,[f.section]:{ ...db.settings[f.section],[f.key]:v } }:{ ...db.settings,[f.key]:v }; sync({ settings:next }); }} onFocus={lockEditing} onBlur={unlockEditing} className={`w-full max-w-[80px] p-2 rounded-xl border border-${f.color}-200 font-black text-lg text-${f.color}-600 outline-none focus:border-${f.color}-400 text-center`}/>
                        </div> 
                      ))}
                    </div></div>
                  </div>
                </div>
              )}
              {adminSubTab==='reset' && (
                <div className="animate-in fade-in space-y-8">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-red-500 pl-6 mb-8">데이터 초기화 및 1학기 마감</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-blue-50 border-4 border-blue-200 p-10 rounded-[40px] text-center shadow-lg flex flex-col justify-between"><div><History className="w-16 h-16 text-blue-500 mx-auto mb-5"/><h3 className="text-3xl font-black mb-4 text-blue-800">1학기 최종 마감</h3><p className="font-bold text-blue-600 mb-8 text-base">코인, 직업 점수, 출석, 성찰 등을 리셋하지만, 평생 기록(누적 데이터)은 보존합니다.</p></div><button onClick={closeSemester} className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">학기 마감 실행</button></div>
                    <div className="bg-emerald-50 border-4 border-emerald-200 p-10 rounded-[40px] text-center shadow-lg flex flex-col justify-between"><div><Briefcase className="w-16 h-16 text-emerald-500 mx-auto mb-5"/><h3 className="text-3xl font-black mb-4 text-emerald-800">직업 점수만 초기화</h3><p className="font-bold text-emerald-600 mb-8 text-base">이 주의 직업 활동이 끝났을 때, 학생들의 '현재 직업 숙련도 점수'만 0으로 리셋합니다.</p></div><button onClick={()=>{ if(window.prompt("직업 숙련도를 0으로 초기화하려면 '직업초기화'를 입력하세요.")==="직업초기화"){ sync({ roleExp:{} }); alert("직업 점수 초기화 완료."); } }} className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black text-xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all">직업 초기화 실행</button></div>
                    <div className="bg-red-50 border-4 border-red-200 p-10 rounded-[40px] text-center shadow-lg flex flex-col justify-between"><div><Trash2 className="w-16 h-16 text-red-500 mx-auto mb-5"/><h3 className="text-3xl font-black mb-4 text-red-800">시스템 공장 초기화</h3><p className="font-bold text-red-600 mb-8 text-base">명단과 세팅을 제외한 '모든 데이터(누적 포함)'를 영구적으로 완전 삭제합니다.</p></div><button onClick={factoryReset} className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black text-xl shadow-xl hover:bg-red-700 active:scale-95 transition-all">공장 초기화 실행</button></div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ═══ 모달 영역 ═══ */}
      {moodModalStudent && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[5005] p-4">
          <div className="bg-white p-10 rounded-[50px] w-full max-w-3xl shadow-2xl animate-in zoom-in-95 border-4 border-emerald-100 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"/>
            <h3 className="text-4xl font-black text-emerald-800 mb-2 relative z-10 flex items-center justify-center gap-3"><Sun className="w-10 h-10 text-emerald-500"/> 오늘의 마음 날씨는 어떤가요?</h3>
            <p className="text-emerald-600 font-bold mb-10 relative z-10 text-lg">날씨를 선택하면 출석이 완료되고 코인이 지급됩니다.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
              {MOOD_OPTIONS.map(m => (
                <button key={m.name} onClick={() => toggleAttendance(moodModalStudent, m.emoji)} className={`flex flex-col items-center justify-center p-6 rounded-[30px] border-4 transition-all shadow-sm hover:scale-105 hover:-translate-y-2 active:scale-95 bg-white ${m.color} hover:shadow-xl`}>
                  <div className="text-5xl mb-4 drop-shadow-md">{m.emoji}</div><div className="font-black text-xl">{m.name}</div><div className="text-[11px] font-bold mt-3 opacity-80 leading-snug">{m.message}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setMoodModalStudent(null)} className="mt-10 px-10 py-4 bg-slate-100 text-slate-500 rounded-full font-black text-lg hover:bg-slate-200 transition-colors relative z-10">다음에 선택하기 (취소)</button>
          </div>
        </div>
      )}

      {showMistakeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[5006] p-4">
          <div className="bg-gradient-to-b from-yellow-50 to-white p-12 rounded-[50px] w-full max-w-xl shadow-2xl animate-in zoom-in-95 border-4 border-yellow-300">
            <h3 className="text-4xl font-black text-yellow-800 mb-3 flex items-center justify-center gap-3"><Sparkles className="w-10 h-10 text-yellow-500"/> 나의 빛나는 실수 자랑하기</h3>
            <p className="text-yellow-600 font-bold mb-8 text-center text-sm bg-white py-2 px-4 rounded-full shadow-sm border border-yellow-200">실패는 성공을 위한 연습일 뿐! 당당하게 자랑해봐요.</p>
            <div className="space-y-6 mb-8">
              <div><label className="block text-sm font-black mb-2 text-yellow-800 ml-2">1. 오늘 어떤 실수를 했나요?</label><textarea value={mistakeText} onChange={e=>setMistakeText(e.target.value)} rows="3" placeholder="수학 시간에 문제를 틀렸어..." className="w-full p-5 rounded-[24px] border-2 border-yellow-200 font-bold text-lg outline-none focus:border-yellow-400 shadow-inner resize-none"/></div>
              <div><label className="block text-sm font-black mb-2 text-emerald-700 ml-2">2. 이 실수를 통해 무엇을 배웠나요?</label><textarea value={mistakeLesson} onChange={e=>setMistakeLesson(e.target.value)} rows="3" placeholder="하지만 포기하지 않고 다시 풀었더니 이해가 됐어!" className="w-full p-5 rounded-[24px] border-2 border-emerald-200 font-bold text-lg outline-none focus:border-emerald-400 shadow-inner resize-none"/></div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowMistakeModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black text-xl hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={submitMistake} className="flex-1 py-5 bg-yellow-400 text-yellow-900 rounded-[24px] font-black text-xl shadow-xl hover:bg-yellow-500 active:scale-95 transition-transform">당당하게 올리기</button>
            </div>
          </div>
        </div>
      )}

      {showPraiseModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[5001] p-4">
          <div className="bg-white p-12 rounded-[50px] w-full max-w-xl shadow-2xl animate-in zoom-in-95 border-4 border-pink-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-100 rounded-full blur-3xl opacity-50 pointer-events-none"/>
            <h3 className="text-4xl font-black text-pink-600 mb-3 flex items-center justify-center gap-3 relative z-10"><Heart className="w-10 h-10 fill-pink-500"/> 따뜻한 온기 제보</h3>
            <div className="bg-pink-50 border border-pink-200 p-4 rounded-2xl mb-8 text-center relative z-10 shadow-sm">
              <p className="text-sm font-bold text-pink-700"><Sparkles className="w-4 h-4 inline-block mb-1 text-pink-500"/> 이 주의 집중 SEL 테마: <span className="font-black bg-white px-2 py-1 rounded-md text-pink-900">{db.settings?.dailyTheme||"없음"}</span></p>
              <p className="text-xs font-bold text-pink-500 mt-2">이 테마의 역량으로 칭찬을 보내면 보너스 코인이 지급됩니다!</p>
            </div>
            <div className="space-y-6 mb-10 relative z-10">
              <div className="flex gap-4">
                <select value={praiseFrom} onChange={e=>{setPraiseFrom(e.target.value); if(praiseTarget===e.target.value) setPraiseTarget("");}} className="flex-1 p-5 rounded-3xl bg-pink-50 border border-pink-200 font-black text-lg outline-none focus:border-pink-400 shadow-sm text-pink-900">
                  <option value="">누가 보내나요?</option>
                  {activeStudents.map(s=><option key={`praiseFrom_${s.id}`} value={s.id}>{s.name}</option>)}
                </select>
                <select value={praiseTarget} onChange={e=>setPraiseTarget(e.target.value)} className="flex-1 p-5 rounded-3xl bg-white border-2 border-slate-200 font-black text-lg outline-none focus:border-pink-400 shadow-sm">
                  <option value="">누구에게 보낼까요?</option>
                  {/* 🔥 보내는 사람(praiseFrom)으로 선택된 사람은 목록에서 제외 */}
                  {activeStudents.filter(s => String(s.id) !== String(praiseFrom)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <select value={praiseTag} onChange={e=>setPraiseTag(e.target.value)} className="w-full p-5 rounded-3xl bg-white border-2 border-slate-200 font-black text-xl outline-none focus:border-pink-400 shadow-sm"><option value="">어떤 역량인가요?</option>{SEL_OPTIONS.map(opt=><option key={opt.name} value={opt.name}>{opt.name}</option>)}</select>
              <textarea value={praiseText} onChange={e=>setPraiseText(e.target.value)} rows="4" placeholder={praiseTag?PRAISE_GUIDES[praiseTag]:"위에서 역량을 먼저 선택해 주세요! 💌"} className="w-full p-6 rounded-[30px] bg-pink-50/50 border-2 border-pink-200 font-black text-lg outline-none focus:border-pink-400 text-pink-900 shadow-inner resize-none placeholder:text-pink-300"/>
            </div>
            <div className="flex gap-4 relative z-10">
              <button onClick={()=>setShowPraiseModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[30px] font-black text-xl hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={submitPraise} className="flex-1 py-6 bg-pink-500 text-white rounded-[30px] font-black text-xl shadow-xl hover:bg-pink-600 active:scale-95 transition-transform flex justify-center items-center gap-2"><Send className="w-6 h-6"/> 보내기</button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[5002] p-4">
          <div className="bg-white p-12 rounded-[50px] w-full max-w-xl shadow-2xl animate-in zoom-in-95 border-4 border-yellow-200">
            <h3 className="text-3xl font-black text-yellow-700 mb-4 flex items-center gap-3"><StickyNote className="w-8 h-8"/> 누가기록 작성</h3>
            <p className="text-base font-bold text-yellow-600 mb-8 bg-yellow-50 px-4 py-2 rounded-xl inline-block border border-yellow-100">{allStats.find(s=>s.id===showNoteModal)?.name} 학생 · {formatDate()}</p>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows="6" placeholder="오늘의 관찰내용, 일화, 특별한 지도사항을 자유롭게 기록하세요." autoFocus className="w-full p-6 rounded-[30px] bg-yellow-50 border-2 border-yellow-200 font-black text-lg outline-none focus:border-yellow-400 text-yellow-900 shadow-inner mb-8 resize-none placeholder:text-yellow-400/60"/>
            <div className="flex gap-4">
              <button onClick={()=>{ setShowNoteModal(null); setNoteText(""); }} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[30px] font-black text-xl hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={submitNote} className="flex-1 py-6 bg-yellow-500 text-white rounded-[30px] font-black text-xl shadow-xl hover:bg-yellow-600 active:scale-95 transition-transform">저장하기</button>
            </div>
          </div>
        </div>
      )}

      {showModal==='password' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-[5003]">
          <div className="bg-white rounded-[60px] p-16 w-full max-w-2xl text-center shadow-2xl animate-in zoom-in-95 border-4 border-blue-100">
            <Lock className="w-24 h-24 text-blue-500 mx-auto mb-8"/><h3 className="text-4xl font-black mb-10 text-blue-900">비밀번호를 입력하세요</h3>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} className="w-full text-center text-7xl tracking-[20px] font-black p-8 border-4 rounded-[40px] outline-none mb-12 bg-slate-50 focus:border-blue-400 shadow-inner" autoFocus/>
            <div className="flex gap-4">
              <button onClick={()=>{ setShowModal(null); setPassword(""); }} className="flex-1 py-6 rounded-[30px] font-black text-slate-500 text-2xl bg-slate-100 hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={handleLogin} className="flex-1 py-6 rounded-[30px] font-black bg-blue-600 text-white text-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-transform">접속하기</button>
            </div>
          </div>
        </div>
      )}

      {showRollingPaper && (() => {
        const s=allStats.find(x=>x.id===showRollingPaper); if(!s) return null;
        const praises=safeArray(db.approvedPraises).filter(p=>p.toId==s.id);
        return (
          <div className="fixed inset-0 bg-white z-[5004] overflow-auto flex flex-col items-center">
            <div className="w-full bg-slate-100 p-5 flex justify-between items-center print:hidden sticky top-0 z-50 border-b-2 shadow-sm">
              <h3 className="font-black text-slate-700 text-xl flex items-center gap-2"><Printer className="w-6 h-6"/> 인쇄 미리보기 모드</h3>
              <div className="flex gap-3"><button onClick={()=>window.print()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-md hover:bg-blue-700 active:scale-95 transition-transform"><Printer className="w-5 h-5"/> 인쇄하기</button><button onClick={()=>setShowRollingPaper(null)} className="bg-white text-slate-600 border-2 border-slate-300 px-8 py-3 rounded-2xl font-black hover:bg-slate-50">닫기</button></div>
            </div>
            <div className="max-w-5xl w-full p-16 print:p-0">
              <div className="text-center mb-16 border-b-4 border-pink-200 pb-10">
                <Heart className="w-20 h-20 text-pink-400 fill-pink-100 mx-auto mb-6"/><h1 className="text-5xl font-black mb-4 text-slate-800 tracking-tight">달보드레 온기 롤링페이퍼</h1><p className="text-3xl font-bold text-slate-500">소중한 우리 반 보물, <span className="text-pink-600 font-black bg-pink-50 px-4 py-1.5 rounded-2xl border border-pink-100">{s.name}</span>에게</p>
              </div>
              <div className="grid grid-cols-2 gap-8 print:grid-cols-2 print:gap-6">
                {praises.map(p=>( <div key={p.id} className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 p-8 rounded-[40px] shadow-sm print:border print:shadow-none break-inside-avoid"><p className="text-sm font-black text-pink-600 mb-4 bg-white inline-block px-4 py-1.5 rounded-full border border-pink-100">{SEL_OPTIONS.find(o=>o.name===p.tag)?.short}</p><p className="text-2xl font-bold text-slate-800 leading-relaxed">"{p.text}"</p><p className="text-right text-sm font-bold text-slate-400 mt-6">- {p.date} -</p></div> ))}
                {praises.length===0&&<div className="col-span-2 text-center py-32 text-slate-300 font-black text-3xl">아직 받은 사연이 없습니다.</div>}
              </div>
            </div>
          </div>
        );
      })()}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-4 border-amber-100 px-6 py-4 flex justify-around items-center z-[4000] shadow-[0_-15px_50px_rgba(0,0,0,0.08)] pb-8 print:hidden">
        {[
          { id:'dashboard',  icon:<Target className="w-8 h-8 md:w-10 md:h-10"/>,   label:db.settings?.menuNames?.[0]||"현황판",      color:"text-blue-500" },
          { id:'reflection', icon:<BookOpen className="w-8 h-8 md:w-10 md:h-10"/>,  label:db.settings?.menuNames?.[1]||"성찰과 성장", color:"text-emerald-500" },
          { id:'helproom',   icon:<Users className="w-8 h-8 md:w-10 md:h-10"/>,     label:db.settings?.menuNames?.[2]||"도움실",      color:"text-indigo-500" },
          { id:'admin',      icon:<Settings className="w-8 h-8 md:w-10 md:h-10"/>,  label:db.settings?.menuNames?.[3]||"관리실",      color:"text-slate-600" }
        ].map(item=>(
          <button key={item.id} onClick={()=>{ if(item.id==='admin') isAuthenticated==='teacher'?setActiveTab('admin'):setShowModal('password'); else if(item.id==='helproom') (isAuthenticated==='inspector'||isAuthenticated==='teacher')?setActiveTab('helproom'):setShowModal('password'); else setActiveTab(item.id); }} className={`flex flex-col items-center gap-2 flex-1 transition-all duration-300 ${activeTab===item.id?`${item.color} scale-110 -translate-y-3 drop-shadow-lg`:'text-slate-400 opacity-60 hover:opacity-100 hover:-translate-y-1'}`}>
            {item.icon}<span className="text-xs md:text-sm font-black">{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes zoomIn95{ from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes flyToScore { 0%  { opacity:0; transform:translateY(0) scale(0.5); } 20% { opacity:1; transform:translateY(-30px) scale(1.5); } 100%{ opacity:0; transform:translate(-500px,-500px) scale(0.3); } }
        @keyframes redFlash { 0%,100%{ background-color:rgb(254,226,226); } 50%    { background-color:rgb(239,68,68); color:white; } }
        .animate-in { animation-duration:0.5s; animation-fill-mode:both; }
        .fade-in    { animation-name:fadeIn; }
        .zoom-in-95 { animation-name:zoomIn95; }
        .animate-flyToScore { animation:flyToScore 1.4s ease-in-out forwards; }
        .animate-redFlash   { animation:redFlash 0.6s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width:10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background:#f8fafc; border-radius:12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:12px; border:2px solid #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background:#94a3b8; }
        @media print { body { background:white !important; margin:0; padding:0; } * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; } }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ⏱ 타이머 위젯 컴포넌트
// ══════════════════════════════════════════════════════════════
function TimerWidget({ status, display, timer, warningLevel, breakInput, setBreakInput, defaultBreakMin, onStopwatch, onCountdown, onPause, onResume, onReset, onBreak, lockEditing, unlockEditing }) {
  const isBreak  = status==='break';
  const isRunning= timer?.isRunning;
  const flashClass = isBreak&&warningLevel===3 ? 'animate-redFlash' : '';
  const bgClass    = isBreak ? (warningLevel>=2 ? 'bg-red-100 border-red-300' : 'bg-emerald-100 border-emerald-300') : 'bg-white/80 border-white';
  return (
    <div className={`p-6 md:p-8 rounded-[40px] border-4 shadow-2xl backdrop-blur-md ${bgClass} ${flashClass} flex flex-col h-full min-h-[300px]`}>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 border-b border-black/5 pb-4">
        <div className="flex items-center gap-2">
          {isBreak?<Coffee className="w-6 h-6 text-emerald-600"/>:<Timer className="w-6 h-6 text-slate-600"/>}
          <span className="text-lg font-black uppercase tracking-widest text-slate-700">{isBreak?'쉬는 시간':status==='class_sw'?'스톱워치':status==='class_cd'?'카운트다운':'현재 수업 중'}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {status==='idle' ? (
            <>
              <div className="flex bg-slate-200/50 p-1 rounded-lg">{[1,3,5,10].map(m=>( <button key={m} onClick={()=>onCountdown(m)} className="px-2.5 py-1.5 bg-white hover:bg-slate-100 rounded text-xs font-black shadow-sm mx-0.5 transition-colors">{m}</button> ))}</div>
              <button onClick={onStopwatch} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-sm transition-colors"><Play className="w-3 h-3 fill-white"/> 스톱워치</button>
              <div className="flex gap-1 ml-1 bg-emerald-50 p-1 rounded-lg border border-emerald-100"><input type="number" value={breakInput} onChange={e=>setBreakInput(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="w-10 px-1 py-1 text-xs font-black text-center text-emerald-900 bg-white rounded border border-emerald-200 outline-none focus:border-emerald-500"/><button onClick={()=>onBreak(Math.max(1,toInt(breakInput,defaultBreakMin)))} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-black flex items-center gap-1 shadow-sm transition-colors"><Coffee className="w-3 h-3"/> 쉬는시간</button></div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {isRunning ? <button onClick={onPause} className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-black flex items-center gap-1 shadow-sm hover:bg-yellow-600 transition-colors"><Pause className="w-4 h-4 fill-white"/> 일시정지</button> : <button onClick={onResume} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-black flex items-center gap-1 shadow-sm hover:bg-green-600 transition-colors"><Play className="w-4 h-4 fill-white"/> 계속</button>}
              <button onClick={onReset} className="px-4 py-2 bg-slate-400 text-white rounded-lg text-sm font-black flex items-center gap-1 shadow-sm hover:bg-slate-500 transition-colors"><RotateCcw className="w-4 h-4"/> 종료</button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center py-4"><span className="text-[110px] md:text-[150px] lg:text-[170px] font-black tracking-tighter tabular-nums leading-none text-slate-800 drop-shadow-md">{display}</span></div>
    </div>
  );
}
