/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Heart, Lock, History, Plus, Minus, AlertTriangle,
  Sparkles, Star, Target, Settings, Trash2, ShoppingCart, CheckCircle2,
  BookOpen, Briefcase, Zap, Crown, Coins, BarChart3, MessageSquare, Send,
  Gavel, Leaf, TreeDeciduous, Bird, Flame, Printer, Timer, Store, Eye,
  Play, Pause, RotateCcw, Coffee, Download, Copy, StickyNote, LogOut
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// 🔧 CONFIG
// ══════════════════════════════════════════════════════════════
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/";
const DB_PATH = "v10Data";
const POLL_INTERVAL_MS = 5000;
const AUTH_KEY = "dalbodre_auth_v10";
const ATTENDANCE_DEADLINE = { hour: 8, minute: 30 }; // 08:30
const DEFAULT_BREAK_MS = 10 * 60 * 1000; // 쉬는시간 기본 10분

// ══════════════════════════════════════════════════════════════
// 🧰 UTILS
// ══════════════════════════════════════════════════════════════
const safeArray = (val) =>
  Array.isArray(val) ? val.filter(Boolean)
  : (typeof val === 'object' && val ? Object.values(val).filter(Boolean) : []);

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
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
};

const formatMs = (ms) => {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${pad2(Math.floor(s/60))}:${pad2(s%60)}`;
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
      osc.start(now + t0);
      osc.stop(now + t0 + dur);
    };

    switch (type) {
      case 'good': tone(600, 0.1); tone(1200, 0.2, 0.1); break;
      case 'bad': tone(300, 0.15, 0, 'sawtooth'); tone(100, 0.2, 0.15, 'sawtooth'); break;
      case 'buy': tone(500, 0.15, 0, 'square'); tone(900, 0.15, 0.1, 'square'); break;
      case 'jackpot': [440, 554.37, 659.25, 880].forEach((f,i) => tone(f, 0.2, i*0.1, 'triangle', 0.2)); break;
      case 'chime': [523.25, 659.25, 783.99, 1046.5].forEach((f,i) => tone(f, 0.6, i*0.12, 'sine', 0.18)); break;
      case 'softChime': [659.25, 830.61].forEach((f,i) => tone(f, 0.5, i*0.18, 'sine', 0.15)); break;
      case 'beep': tone(880, 0.12, 0, 'square', 0.2); tone(880, 0.12, 0.2, 'square', 0.2); tone(880, 0.12, 0.4, 'square', 0.2); break;
      case 'attend': tone(783.99, 0.1, 0, 'sine', 0.12); tone(1046.5, 0.2, 0.08, 'sine', 0.12); break;
      default: tone(600, 0.1);
    }
  } catch (_) {}
};

// ══════════════════════════════════════════════════════════════
// 🔐 AUTH (localStorage)
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
    if (!data || (data.expires !== null && Date.now() > data.expires) || (revokedAt && data.issuedAt < revokedAt)) {
      localStorage.removeItem(AUTH_KEY); return false;
    }
    return data.role;
  } catch(_) { return false; }
};
const clearAuth = () => { try { localStorage.removeItem(AUTH_KEY); } catch(_) {} };

// ══════════════════════════════════════════════════════════════
// 📚 STATIC DATA
// ══════════════════════════════════════════════════════════════
const ENNEAGRAM_DATA = {
  "1": { name: '1번(개혁가)',     desc: '규칙과 책임을 잘 지켜요. 결과보다 과정의 꼼꼼함과 정직함을 알아주세요.' },
  "2": { name: '2번(조력자)',     desc: '관계와 배려를 중시해요. "네 덕분에 고마워"라는 진심 어린 인사가 가장 큰 힘이 됩니다.' },
  "3": { name: '3번(성취자)',     desc: '목표 지향적이에요. 구체적인 성과와 학급 기여를 명확히 인정해 주세요.' },
  "4": { name: '4번(예술가)',     desc: '자신만의 개성과 감정을 중시해요. 독창적 아이디어를 존중해 주세요.' },
  "5": { name: '5번(사색가)',     desc: '논리와 분석을 좋아해요. 혼자만의 시간과 지적 호기심을 칭찬해 주세요.' },
  "6": { name: '6번(충실가)',     desc: '안전과 소속감을 중시해요. "우리가 함께한다"는 든든한 지지가 필요합니다.' },
  "7": { name: '7번(열정가)',     desc: '재미와 자유를 추구해요. 긍정적 에너지와 호기심을 격려해 주세요.' },
  "8": { name: '8번(도전자)',     desc: '강한 의지와 리더십. 스스로 결정할 기회와 신뢰를 부여해 주세요.' },
  "9": { name: '9번(평화주의자)', desc: '조화를 원해요. 다그치기보다 편안한 분위기에서 의견을 물어봐 주세요.' }
};

const DEFAULT_STUDENTS = [
  { id: 1,  name: '금채율', role: '학급문고 정리', group: 1, isLeader: true,  enneagram: '2' },
  { id: 2,  name: '김라희', role: '우유 배달',     group: 1, isLeader: false, enneagram: '9' },
  { id: 3,  name: '김민지', role: '다툼 중재자',   group: 1, isLeader: false, enneagram: '6' },
  { id: 4,  name: '김수은', role: '생활태도 체크', group: 1, isLeader: false, enneagram: '1' },
  { id: 5,  name: '김시우', role: '칠판 정리',     group: 2, isLeader: true,  enneagram: '3' },
  { id: 6,  name: '박서정', role: '질서 관리',     group: 2, isLeader: false, enneagram: '8' },
  { id: 7,  name: '이하윤', role: '학급문고 정리', group: 2, isLeader: false, enneagram: '4' },
  { id: 8,  name: '장세아', role: '문 닫기',       group: 2, isLeader: false, enneagram: '7' },
  { id: 9,  name: '최예나', role: '우유 배달',     group: 3, isLeader: true,  enneagram: ''  },
  { id: 10, name: '허수정', role: '감찰사',        group: 3, isLeader: false, enneagram: ''  },
  { id: 11, name: '황지인', role: '칠판 정리',     group: 3, isLeader: false, enneagram: ''  },
  { id: 12, name: '김도운', role: '생활 배출물 관리', group: 3, isLeader: false, enneagram: '' },
  { id: 13, name: '김윤재', role: '과제 확인',     group: 4, isLeader: true,  enneagram: ''  },
  { id: 14, name: '김정현', role: '질서 관리',     group: 4, isLeader: false, enneagram: ''  },
  { id: 15, name: '김태영', role: '복사물 관리',   group: 4, isLeader: false, enneagram: ''  },
  { id: 16, name: '김해준', role: '칠판 정리',     group: 4, isLeader: false, enneagram: ''  },
  { id: 17, name: '박동민', role: '과제 확인',     group: 5, isLeader: true,  enneagram: ''  },
  { id: 18, name: '서이환', role: '가습기 관리',   group: 5, isLeader: false, enneagram: ''  },
  { id: 19, name: '윤호영', role: '우유 배달',     group: 5, isLeader: false, enneagram: ''  },
  { id: 20, name: '이서준', role: '과제 확인',     group: 5, isLeader: false, enneagram: ''  },
  { id: 21, name: '이승현', role: '신발장 관리',   group: 6, isLeader: true,  enneagram: ''  },
  { id: 22, name: '임유성', role: '질서 관리',     group: 6, isLeader: false, enneagram: ''  },
  { id: 23, name: '장세형', role: '다툼 중재자',   group: 6, isLeader: false, enneagram: ''  },
  { id: 24, name: '조승원', role: '부착물 관리',   group: 6, isLeader: false, enneagram: ''  },
  { id: 25, name: '차민서', role: '신발장 관리',   group: 6, isLeader: false, enneagram: ''  },
  { id: 26, name: '배지훈', role: '문 닫기',       group: 6, isLeader: false, enneagram: ''  }
];

const SEL_OPTIONS = [
  { id: 'sel1', short: '자기 인식',       name: '1단계: 자기 인식 (Self-awareness)' },
  { id: 'sel2', short: '자기 관리',       name: '2단계: 자기 관리 (Self-management)' },
  { id: 'sel3', short: '사회적 인식',     name: '3단계: 사회적 인식 (Social awareness)' },
  { id: 'sel4', short: '관계 기술',       name: '4단계: 관계 기술 (Relationship skills)' },
  { id: 'sel5', short: '책임있는 결정',   name: '5단계: 책임 있는 의사결정 (Responsible decision-making)' }
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

// 🔥 V10 진화 칭호 배열 (Level 0 ~ Level 5)
const EVOLUTION_TITLES = [
  "🌱 희망의 씨앗이 움터요",
  "🌿 어린 나무가 자라나요",
  "🌸 우리만의 꽃이 피었어요",
  "🔥 열정의 기운이 가득해요",
  "✨ 전설의 세계수로 자라나요",
  "🌟 전설의 세계수 완성!"
];

const INITIAL_DB = {
  students: DEFAULT_STUDENTS,
  rolesList: ['학급문고 정리', '우유 배달', '다툼 중재자', '현령', '감찰사'],
  settings: {
    title: "달보드레 행복 교실 🌸",
    menuNames: ["행복 현황판", "성찰과 회복", "도움실", "관리실"],
    targetScore: 5000, forceShopOpen: false,
    weeklyTheme: "4단계: 관계 기술 (Relationship skills)",
    masterPw: "6505", helpRoomPw: "1111",
    showCumulativeStats: false,
    defaultBreakMs: DEFAULT_BREAK_MS,
    pointConfig: { praiseBasic: 10, praiseBonus: 15, penalty: 20 },
    authRevokedAt: 0
  },
  coopQuest: { q1Name: "다 함께 바른 생활", q1: 50, q2Name: "환대와 응원", q2: 20, q3Name: "전담수업 태도 우수", q3: 20, q4Name: "사이좋은 일주일", q4: 100, goodWeek: 0 },
  timeAttack: { isActive: false, title: "", rewardRep: 100, endTime: null, cleared: [] },
  timer: { mode: 'idle', startedAt: null, endTime: null, duration: null, isRunning: false, pausedElapsed: null, pausedRemaining: null },
  shopItems: [], pendingShopItems: [], funding: [],
  roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {},
  pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [],
  manualRepOffset: 0, 
  allTime: { exp: {}, penalty: {}, donate: {}, fund: {} },
  attendance: {}, attendanceBonus: {}, streakWeeks: {}, notes: {}, extraAttendDays: 0      
};

// ══════════════════════════════════════════════════════════════
// 🎨 VISUAL HELPER (세계수 렌더링)
// ══════════════════════════════════════════════════════════════
const renderEvolution = (level) => {
  // 아이콘 크기를 대폭 상향하여 화면 중앙의 주인공으로 만듦
  switch (level) {
    case 0: return <div className="flex items-center justify-center gap-4 text-emerald-400 animate-pulse"><Leaf className="w-20 h-20"/> <Sparkles className="w-12 h-12 text-yellow-400"/></div>;
    case 1: return <div className="flex items-center justify-center gap-4 text-emerald-500 animate-bounce"><TreeDeciduous className="w-24 h-24"/> <Bird className="w-14 h-14 text-orange-400"/></div>;
    case 2: return <div className="flex items-center justify-center gap-4 text-pink-400"><TreeDeciduous className="w-28 h-28 fill-pink-200"/> <Bird className="w-16 h-16 text-orange-500 animate-pulse"/></div>;
    case 3: return <div className="flex items-center justify-center gap-6 text-yellow-500 drop-shadow-lg"><TreeDeciduous className="w-32 h-32 fill-yellow-200"/> <Flame className="w-20 h-20 text-red-500 animate-bounce"/></div>;
    case 4:
    case 5: return <div className="flex items-center justify-center gap-6 text-yellow-300 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]"><TreeDeciduous className="w-40 h-40 fill-yellow-100 animate-pulse"/> <Bird className="w-24 h-24 fill-red-500 text-red-600 animate-bounce"/> <Star className="w-16 h-16 fill-yellow-400 text-yellow-500 animate-spin-slow"/></div>;
    default: return null;
  }
};

// ══════════════════════════════════════════════════════════════
// 🧩 MAIN APP
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

  const [praiseTarget, setPraiseTarget] = useState("");
  const [praiseTag, setPraiseTag] = useState("");
  const [praiseText, setPraiseText] = useState("");
  const [refTarget, setRefTarget] = useState("");
  const [refTag, setRefTag] = useState("");
  const [refText, setRefText] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [artisanTarget, setArtisanTarget] = useState("");
  const [artisanItemName, setArtisanItemName] = useState("");
  const [artisanItemPrice, setArtisanItemPrice] = useState("");
  const [selectedReportStudent, setSelectedReportStudent] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGroup, setNewStudentGroup] = useState("1");
  const [newStudentEnneagram, setNewStudentEnneagram] = useState("");
  const [newFundName, setNewFundName] = useState("");
  const [newFundTarget, setNewFundTarget] = useState("");
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

  const [db, setDb] = useState(INITIAL_DB);
  const isEditingRef = useRef(false);
  const lockEditing = () => { isEditingRef.current = true; };
  const unlockEditing = () => { isEditingRef.current = false; };
  const lastNotifiedRef = useRef({});

  useEffect(() => {
    const saved = loadAuth(db.settings?.authRevokedAt || 0);
    if (saved) setIsAuthenticated(saved);
  }, [db.settings?.authRevokedAt]);

  useEffect(() => {
    let alive = true;
    const fetchLive = async () => {
      if (isEditingRef.current) return;
      try {
        const res = await fetch(`${DATABASE_URL}${DB_PATH}.json`);
        const data = await res.json();
        if (alive && data) {
          setDb(prev => ({
            ...prev, ...data,
            settings:   { ...prev.settings,   ...(data.settings   || {}) },
            allTime:    { ...prev.allTime,    ...(data.allTime    || {}) },
            coopQuest:  { ...prev.coopQuest,  ...(data.coopQuest  || {}) },
            timeAttack: { ...prev.timeAttack, ...(data.timeAttack || {}) },
            timer:      { ...prev.timer,      ...(data.timer      || {}) }
          }));
        }
      } catch (_) {}
      if (alive) setIsLoading(false);
    };
    fetchLive();
    const interval = setInterval(fetchLive, POLL_INTERVAL_MS);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const currentWeek = getWeekKey();
    const attendance = db.attendance || {};
    const bonus = db.attendanceBonus || {};
    const oldKeys = Object.keys(attendance).filter(k => k !== currentWeek);
    if (oldKeys.length === 0) return;

    const newStreaks = { ...(db.streakWeeks || {}) };
    oldKeys.forEach(k => {
      const weekData = attendance[k] || {};
      Object.keys(weekData).forEach(sId => {
        const totalDays = (weekData[sId] || []).length + (db.extraAttendDays || 0);
        if (totalDays < 5) newStreaks[sId] = 0;
      });
    });

    const cleanedAttendance = { [currentWeek]: attendance[currentWeek] || {} };
    const cleanedBonus = { [currentWeek]: bonus[currentWeek] || {} };
    sync({ attendance: cleanedAttendance, attendanceBonus: cleanedBonus, streakWeeks: newStreaks, extraAttendDays: 0 });
  }, [isLoading]); 

  useEffect(() => {
    if (!db.timeAttack?.isActive || !db.timeAttack?.endTime) return;
    const tick = () => {
      const diff = Math.floor((db.timeAttack.endTime - Date.now()) / 1000);
      if (diff <= 0) setTimeLeftString("00:00 (종료)");
      else setTimeLeftString(`${pad2(Math.floor(diff/60))}:${pad2(diff%60)}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [db.timeAttack?.isActive, db.timeAttack?.endTime]);

  useEffect(() => {
    const tick = () => {
      const t = db.timer || {};
      const mode = t.mode || 'idle';
      setTimerStatus(mode);
      if (mode === 'idle') { setTimerDisplay("00:00"); setBreakWarningLevel(0); return; }

      let ms = 0;
      if (mode === 'class_sw') { ms = t.isRunning ? Date.now() - t.startedAt : (t.pausedElapsed || 0); } 
      else if (mode === 'class_cd' || mode === 'break') {
        ms = t.isRunning ? (t.endTime - Date.now()) : (t.pausedRemaining || 0);
        if (ms < 0) ms = 0;
      }
      setTimerDisplay(formatMs(ms));

      if (mode === 'break' && t.isRunning) {
        const sec = Math.floor(ms / 1000);
        const key = `${t.endTime}_${sec}`;
        const notify = (level, sound) => {
          if (lastNotifiedRef.current[key + '_' + level]) return;
          lastNotifiedRef.current[key + '_' + level] = true;
          playSound(sound); setBreakWarningLevel(level);
        };
        if (sec === 180) notify(1, 'softChime');
        else if (sec === 60) notify(2, 'softChime');
        else if (sec <= 30 && sec > 0 && sec % 5 === 0) notify(3, 'beep');
        else if (sec > 180) setBreakWarningLevel(0);

        if (ms <= 0) {
          playSound('chime'); setBreakWarningLevel(0);
          sync({ timer: { mode: 'idle', startedAt: null, endTime: null, duration: null, isRunning: false, pausedElapsed: null, pausedRemaining: null } });
        }
      } else if (mode === 'class_cd' && t.isRunning && ms <= 0) {
        playSound('chime');
        sync({ timer: { mode: 'idle', startedAt: null, endTime: null, duration: null, isRunning: false, pausedElapsed: null, pausedRemaining: null } });
      }
    };
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [db.timer]);

  const sync = async (updates) => {
    setDb(prev => ({ ...prev, ...updates }));
    try { await fetch(`${DATABASE_URL}${DB_PATH}.json`, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (_) {}
  };

  const safeStudents = safeArray(db.students);

  const allStats = useMemo(() => safeStudents.map(s => {
    const exp = db.roleExp[s.id] || 0; const bonus = db.bonusCoins?.[s.id] || 0;
    const coins = Math.max(0, (exp * 10) + bonus - (db.usedCoins[s.id] || 0));
    let mastery = { label: '🌱 인턴', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200' };
    if (exp >= 20) mastery = { label: '👑 장인', color: 'text-amber-700', bg: 'bg-gradient-to-r from-amber-100 to-yellow-200 border-amber-400' };
    else if (exp >= 10) mastery = { label: '💎 전문가', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' };

    const weekKey = getWeekKey();
    const attendedDays = safeArray(db.attendance?.[weekKey]?.[s.id]);
    const weeklyCount = attendedDays.length;
    const streak = db.streakWeeks?.[s.id] || 0;
    const todayIdx = getTodayWeekdayIdx();
    const attendedToday = todayIdx >= 0 && attendedDays.includes(todayIdx);

    return {
      ...s, exp, coins, mastery, status: db.studentStatus[s.id] || 'normal',
      atExp: db.allTime?.exp?.[s.id] || 0, atDonate: db.allTime?.donate?.[s.id] || 0,
      atFund: db.allTime?.fund?.[s.id] || 0, atPen: db.allTime?.penalty?.[s.id] || 0,
      weeklyCount, streak, attendedToday, notes: safeArray(db.notes?.[s.id])
    };
  }), [safeStudents, db.roleExp, db.bonusCoins, db.usedCoins, db.studentStatus, db.allTime, db.attendance, db.streakWeeks, db.notes]);

  const activeStudents = useMemo(() => allStats.filter(s => s.status !== 'crisis'), [allStats]);

  // 🔥 V10 핵심: 5단계 가변형 진화 게이지 연산 (초월 보호막 완전 삭제)
  const { classReputation, evolutionLevel, progressPercent } = useMemo(() => {
    const target = db.settings?.targetScore || 5000;
    const penaltyUnit = db.settings?.pointConfig?.penalty || 20;
    const raw = allStats.reduce((sum, s) =>
      sum + (s.exp * 10) + (db.bonusCoins?.[s.id] || 0) - ((db.penaltyCount[s.id] || 0) * penaltyUnit), 0)
      + safeArray(db.donations).reduce((sum, d) => sum + (d.amount || 0), 0)
      + (db.manualRepOffset || 0);
    
    let r = Math.max(0, raw);
    if (r > target) r = target; // 최대 목표치까지만 제한
    
    const step = Math.max(1, target / 5); // 1구간당 점수
    const level = Math.min(Math.floor(r / step), 5); // 0 ~ 5 레벨
    const pct = level >= 5 ? 100 : ((r % step) / step) * 100; // 0 ~ 100%
    
    return { classReputation: r, evolutionLevel: level, progressPercent: pct };
  }, [allStats, db.penaltyCount, db.bonusCoins, db.donations, db.settings, db.manualRepOffset]);

  const sortedDashboardStats = useMemo(() => {
    if (db.settings?.showCumulativeStats) return [...allStats].sort((a,b) => a.id - b.id);
    const order = { crisis: 0, pending: 1, normal: 2 };
    return [...allStats].sort((a,b) => order[a.status] !== order[b.status] ? order[a.status] - order[b.status] : a.id - b.id);
  }, [allStats, db.settings?.showCumulativeStats]);

  const groupedByGroupStats = useMemo(() => [...allStats].sort((a,b) => a.group - b.group || a.id - b.id), [allStats]);
  const topExp = useMemo(() => [...allStats].sort((a,b)=>b.atExp-a.atExp).filter(s=>s.atExp>0).slice(0,5), [allStats]);
  const topDonate = useMemo(() => [...allStats].sort((a,b)=>b.atDonate-a.atDonate).filter(s=>s.atDonate>0).slice(0,5), [allStats]);
  const topFund = useMemo(() => [...allStats].sort((a,b)=>b.atFund-a.atFund).filter(s=>s.atFund>0).slice(0,5), [allStats]);
  const isShopOpen = useMemo(() => db.settings?.forceShopOpen || new Date().getDay() === 4, [db.settings?.forceShopOpen]);
  const selectedRefStudentPraises = useMemo(() => !refTarget ? [] : safeArray(db.approvedPraises).filter(p => p.toId == refTarget), [refTarget, db.approvedPraises]);
  const randomPraise = selectedRefStudentPraises.length ? selectedRefStudentPraises[Math.floor(Math.random() * selectedRefStudentPraises.length)] : null;

  // ── 핸들러 ───────────────────────────────────────────────
  const toggleAttendance = (sId) => {
    const todayIdx = getTodayWeekdayIdx();
    if (todayIdx < 0) return alert("주말에는 출석 체크를 할 수 없어요.");
    const weekKey = getWeekKey(); const weekData = db.attendance?.[weekKey] || {};
    const days = safeArray(weekData[sId]); const alreadyToday = days.includes(todayIdx);

    if (!alreadyToday && !isAttendanceOpen()) return alert("출석 시간이 지났어요. (08:30 마감)");

    const newDays = alreadyToday ? days.filter(d => d !== todayIdx) : [...days, todayIdx].sort();
    const newWeekData = { ...weekData, [sId]: newDays };
    const updates = { attendance: { ...db.attendance, [weekKey]: newWeekData } };

    if (!alreadyToday) {
      updates.manualRepOffset = (db.manualRepOffset || 0) + 1;
      playSound('attend'); setAttendAnim({ id: sId, ts: Date.now() }); setTimeout(() => setAttendAnim(null), 1400);

      const totalDays = newDays.length + (db.extraAttendDays || 0);
      const alreadyBonus = db.attendanceBonus?.[weekKey]?.[sId];
      if (totalDays >= 5 && !alreadyBonus) {
        updates.bonusCoins = { ...db.bonusCoins, [sId]: (db.bonusCoins?.[sId] || 0) + 3 };
        updates.attendanceBonus = { ...db.attendanceBonus, [weekKey]: { ...(db.attendanceBonus?.[weekKey] || {}), [sId]: true } };
        updates.streakWeeks = { ...db.streakWeeks, [sId]: (db.streakWeeks?.[sId] || 0) + 1 };
        setTimeout(() => playSound('jackpot'), 600); setTimeout(() => alert(`🎉 ${allStats.find(x=>x.id===sId)?.name} 개근 달성! 🪙3 보너스!`), 900);
      }
    } else { updates.manualRepOffset = (db.manualRepOffset || 0) - 1; }
    sync(updates);
  };

  const teacherAddHoliday = () => {
    if (!window.confirm("공휴일/재량휴업일로 간주하여 모든 학생의 이번 주 출석일수에 +1을 반영할까요?")) return;
    const next = (db.extraAttendDays || 0) + 1; const weekKey = getWeekKey();
    const updates = { extraAttendDays: next }; const weekData = db.attendance?.[weekKey] || {};
    let newBonus = { ...(db.attendanceBonus?.[weekKey] || {}) }; let newStreaks = { ...(db.streakWeeks || {}) }; let newCoins = { ...(db.bonusCoins || {}) }; let bonusCount = 0;
    safeStudents.forEach(s => {
      const days = safeArray(weekData[s.id]); const total = days.length + next;
      if (total >= 5 && !newBonus[s.id]) { newBonus[s.id] = true; newStreaks[s.id] = (newStreaks[s.id] || 0) + 1; newCoins[s.id] = (newCoins[s.id] || 0) + 3; bonusCount++; }
    });
    updates.attendanceBonus = { ...db.attendanceBonus, [weekKey]: newBonus }; updates.streakWeeks = newStreaks; updates.bonusCoins = newCoins; sync(updates);
    alert(`📅 전체 출석일수 +1 반영 완료 (현재 보정: +${next}일, 추가 개근 달성 ${bonusCount}명)`);
  };

  const openNoteModal = (sId) => { if (isAuthenticated !== 'teacher') return setShowModal('password'); setShowNoteModal(sId); setNoteText(""); };
  const submitNote = () => { if (!noteText.trim()) return alert("내용을 입력하세요."); const sId = showNoteModal; const note = { id: Date.now(), date: formatDate(), text: noteText.trim() }; sync({ notes: { ...db.notes, [sId]: [...safeArray(db.notes?.[sId]), note] } }); setShowNoteModal(null); setNoteText(""); alert("📝 누가기록 저장 완료!"); };
  const deleteNote = (sId, noteId) => { if (!window.confirm("삭제할까요?")) return; sync({ notes: { ...db.notes, [sId]: safeArray(db.notes?.[sId]).filter(n => n.id !== noteId) } }); };

  const buildStudentReport = (s) => {
    const praises = safeArray(db.approvedPraises).filter(p => p.toId == s.id); const reflections = safeArray(db.pendingReflections).filter(r => r.sId == s.id); const notes = safeArray(db.notes?.[s.id]);
    let md = `## ${s.name} (${s.group}모둠 · ${s.role}${s.isLeader ? ' · 모둠장' : ''})\n`;
    if (s.enneagram && ENNEAGRAM_DATA[s.enneagram]) md += `- 에니어그램: ${ENNEAGRAM_DATA[s.enneagram].name}\n`;
    md += `- 누적 완수: ${s.atExp}회 / 기부: ${s.atDonate}🪙 / 펀딩: ${s.atFund}🪙 / 위기: ${s.atPen}회\n- 이번 주 출석: ${s.weeklyCount}/5 · 누적 개근 주수: ${s.streak}주\n- 현재 숙련도: ${s.mastery.label} (누적 ${s.exp})\n\n### 받은 칭찬 (${praises.length}건)\n`;
    if (praises.length) praises.forEach(p => { md += `- [${p.date}] ${SEL_OPTIONS.find(o=>o.name===p.tag)?.short || '-'}: "${p.text}"\n`; }); else md += `- (없음)\n`;
    md += `\n### 제출한 성찰 (${reflections.length}건)\n`;
    if (reflections.length) reflections.forEach(r => { md += `- [${r.date}] ${SEL_OPTIONS.find(o=>o.name===r.tag)?.short || '-'}: "${r.text}"\n`; }); else md += `- (없음)\n`;
    md += `\n### 누가기록 (${notes.length}건)\n`;
    if (notes.length) notes.forEach(n => { md += `- [${n.date}] ${n.text}\n`; }); else md += `- (없음)\n`;
    return md;
  };
  const exportStudent = (sId) => { const s = allStats.find(x => x.id == sId); if (!s) return; downloadOrCopy(`# 달보드레 학생 리포트\n생성일: ${formatDate()}\n\n${buildStudentReport(s)}`, `report_${s.name}_${formatDate()}.md`); };
  const exportAll = () => { let md = `# 달보드레 학급 전체 리포트\n생성일: ${formatDate()}\n총 학생 수: ${allStats.length}명\n학급 명성: ${classReputation}p\n\n---\n\n`; allStats.forEach(s => { md += buildStudentReport(s) + "\n---\n\n"; }); downloadOrCopy(md, `class_report_${formatDate()}.md`); };
  const downloadOrCopy = (text, filename) => { try { navigator.clipboard.writeText(text); } catch(_) {} try { const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); alert(`📋 복사 및 다운로드 완료!`); } catch (e) { alert("다운로드 실패. 복사되었습니다."); } };

  const startStopwatch = () => sync({ timer: { mode: 'class_sw', startedAt: Date.now(), endTime: null, duration: null, isRunning: true, pausedElapsed: 0, pausedRemaining: null } });
  const startCountdown = (minutes) => { const ms = minutes * 60 * 1000; sync({ timer: { mode: 'class_cd', startedAt: null, endTime: Date.now() + ms, duration: ms, isRunning: true, pausedElapsed: null, pausedRemaining: ms } }); };
  const pauseTimer = () => { const t = db.timer || {}; if (!t.isRunning) return; if (t.mode === 'class_sw') sync({ timer: { ...t, isRunning: false, pausedElapsed: Date.now() - t.startedAt } }); else if (t.mode === 'class_cd' || t.mode === 'break') sync({ timer: { ...t, isRunning: false, pausedRemaining: Math.max(0, t.endTime - Date.now()) } }); };
  const resumeTimer = () => { const t = db.timer || {}; if (t.isRunning) return; if (t.mode === 'class_sw') sync({ timer: { ...t, isRunning: true, startedAt: Date.now() - (t.pausedElapsed || 0) } }); else if (t.mode === 'class_cd' || t.mode === 'break') sync({ timer: { ...t, isRunning: true, endTime: Date.now() + (t.pausedRemaining || 0) } }); };
  const resetTimer = () => sync({ timer: { mode: 'idle', startedAt: null, endTime: null, duration: null, isRunning: false, pausedElapsed: null, pausedRemaining: null } });
  const startBreak = (minutes) => { const ms = minutes * 60 * 1000; lastNotifiedRef.current = {}; sync({ timer: { mode: 'break', startedAt: null, endTime: Date.now() + ms, duration: ms, isRunning: true, pausedElapsed: null, pausedRemaining: ms } }); };

  const handleExpAdjust = (id, delta) => { if (delta > 0) playSound('good'); sync({ roleExp: { ...db.roleExp, [id]: Math.max(0, (db.roleExp[id]||0) + delta) }, allTime: { ...db.allTime, exp: { ...db.allTime.exp, [id]: Math.max(0, (db.allTime.exp?.[id]||0) + delta) } } }); };
  const handleGivePenalty = (id) => { if (!isAuthenticated) return setShowModal('password'); if (!window.confirm("위기 지정할까요?")) return; playSound('bad'); sync({ studentStatus: { ...db.studentStatus, [id]: 'crisis' }, penaltyCount: { ...db.penaltyCount, [id]: (db.penaltyCount[id] || 0) + 1 }, allTime: { ...db.allTime, penalty: { ...db.allTime.penalty, [id]: (db.allTime.penalty?.[id] || 0) + 1 } } }); };
  const handleDonate = (sId, amount) => { const u = allStats.find(s => s.id == sId); if (!u || u.coins < amount) return alert("코인 부족!"); playSound('buy'); sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, donations: [{ id: Date.now(), name: u.name, amount }, ...safeArray(db.donations)].slice(0, 15), allTime: { ...db.allTime, donate: { ...db.allTime.donate, [sId]: (db.allTime.donate?.[sId] || 0) + amount } } }); alert("기부 완료! ✨"); };
  const handleFund = (fId, sId, amount) => { const u = allStats.find(s => s.id == sId); if (!u || u.coins < amount) return alert("코인 부족!"); playSound('buy'); sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, funding: safeArray(db.funding).map(f => f.id === fId ? { ...f, current: (Number(f.current)||0) + amount } : f), allTime: { ...db.allTime, fund: { ...db.allTime.fund, [sId]: (db.allTime.fund?.[sId] || 0) + amount } } }); alert("투자 완료!"); };
  const addCoopScore = (points, title) => { playSound('jackpot'); sync({ manualRepOffset: (db.manualRepOffset || 0) + points }); alert(`🎉 [${title}] 달성! +${points}점!`); };
  const adjustGoodWeek = (delta) => { const next = Math.max(0, Math.min(5, (db.coopQuest?.goodWeek || 0) + delta)); sync({ coopQuest: { ...db.coopQuest, goodWeek: next } }); if (delta > 0) playSound('good'); };
  const completeGoodWeek = () => { playSound('jackpot'); const reward = db.coopQuest?.q4 || 100; sync({ coopQuest: { ...db.coopQuest, goodWeek: 0 }, manualRepOffset: (db.manualRepOffset || 0) + reward }); alert(`🌟 사이 좋은 일주일! +${reward}점!`); };
  const handleStartTimeAttack = () => { const mins = toInt(taMins, 10), reward = toInt(taReward, 100); const title = taTitle.trim() || "미션"; if (mins <= 0 || reward <= 0) return alert("값을 확인하세요."); if (!window.confirm(`${mins}분 / ${reward}p로 타임어택 시작?`)) return; sync({ timeAttack: { isActive: true, title, rewardRep: reward, endTime: Date.now() + mins*60*1000, cleared: [] } }); };
  const handleCompleteTimeAttack = () => { playSound('jackpot'); sync({ manualRepOffset: (db.manualRepOffset || 0) + (db.timeAttack?.rewardRep || 0), timeAttack: { isActive: false, title: "", rewardRep: 0, endTime: null, cleared: [] } }); alert("🎉 타임어택 성공!"); };
  const handleFailTimeAttack = () => { sync({ timeAttack: { isActive: false, title: "", rewardRep: 0, endTime: null, cleared: [] } }); };
  const toggleTimeAttackClear = (id) => { if (!db.timeAttack?.isActive) return; const cleared = safeArray(db.timeAttack.cleared).map(Number); const isDone = cleared.includes(Number(id)); const next = isDone ? cleared.filter(c => c !== Number(id)) : [...cleared, Number(id)]; sync({ timeAttack: { ...db.timeAttack, cleared: next } }); if (!isDone) playSound('good'); };
  const submitArtisanItem = () => { if (!artisanTarget || !artisanItemName || !artisanItemPrice) return alert("입력 오류"); const artisan = allStats.find(s => s.id == artisanTarget); if (!artisan || artisan.exp < 20) return alert("장인만 가능"); sync({ pendingShopItems: [{ id: Date.now(), name: artisanItemName, price: toInt(artisanItemPrice), creator: artisan.name }, ...safeArray(db.pendingShopItems)] }); setArtisanTarget(""); setArtisanItemName(""); setArtisanItemPrice(""); alert("결재 올림!"); };
  const submitPraise = () => { if (!praiseTarget || !praiseTag || !praiseText) return alert("빈칸 확인!"); sync({ pendingPraises: [{ id: Date.now(), toId: praiseTarget, tag: praiseTag, text: praiseText, date: formatDate() }, ...safeArray(db.pendingPraises)] }); setShowPraiseModal(false); setPraiseTarget(""); setPraiseText(""); setPraiseTag(""); alert("온기 배달 완료!"); };
  const submitReflection = () => { if (!refTarget || !refTag || !refText) return alert("빈칸 확인!"); sync({ pendingReflections: [{ id: Date.now(), sId: refTarget, tag: refTag, text: refText, date: formatDate() }, ...safeArray(db.pendingReflections)], studentStatus: { ...db.studentStatus, [refTarget]: 'pending' } }); setRefTarget(""); setRefText(""); setRefTag(""); alert("다짐 제출 완료!"); };
  const approvePraise = (p) => { const target = allStats.find(u => u.id == p.toId); if (target?.status === 'crisis') return alert("위기 학생에게는 지급 불가. 성찰이 먼저입니다."); const next = safeArray(db.pendingPraises).filter(pr => pr.id !== p.id); const app = [p, ...safeArray(db.approvedPraises)].slice(0, 20); const themeMatch = p.tag === db.settings?.weeklyTheme; const earned = themeMatch ? (db.settings?.pointConfig?.praiseBonus || 15) : (db.settings?.pointConfig?.praiseBasic || 10); const updates = { pendingPraises: next, approvedPraises: app }; if (p.toId !== 'me') { updates.bonusCoins = { ...db.bonusCoins, [p.toId]: (db.bonusCoins?.[p.toId] || 0) + earned }; updates.allTime = { ...db.allTime, exp: { ...db.allTime.exp, [p.toId]: (db.allTime.exp?.[p.toId] || 0) + 1 } }; } sync(updates); alert(`승인 완료! (+${earned}🪙)`); playSound('good'); };

  const handleLogin = () => { const isMaster = password === (db.settings?.masterPw || "6505"); const isHelp = password === (db.settings?.helpRoomPw || "1111"); if (isMaster) { setIsAuthenticated('teacher'); saveAuth('teacher'); setActiveTab('admin'); setShowModal(null); setPassword(""); } else if (isHelp) { setIsAuthenticated('inspector'); saveAuth('inspector'); setActiveTab('helproom'); setShowModal(null); setPassword(""); } else { alert("비밀번호 오류 ❌"); playSound('bad'); } };
  const handleLogout = () => { clearAuth(); setIsAuthenticated(false); setActiveTab('dashboard'); };
  const revokeAllSessions = () => { if (!window.confirm("모든 기기에서 강제 로그아웃합니다.")) return; sync({ settings: { ...db.settings, authRevokedAt: Date.now() } }); clearAuth(); setIsAuthenticated(false); setActiveTab('dashboard'); alert("모든 세션을 무효화했습니다."); };

  const handleStudentFieldChange = (id, field, value) => sync({ students: safeStudents.map(st => st.id === id ? { ...st, [field]: value } : st) });
  const handleAddStudent = () => { if (!newStudentName) return; const nextId = safeStudents.length ? Math.max(...safeStudents.map(s => s.id)) + 1 : 1; sync({ students: [...safeStudents, { id: nextId, name: newStudentName, role: '향리', group: toInt(newStudentGroup, 1), isLeader: false, enneagram: newStudentEnneagram }] }); setNewStudentName(""); alert("전입 완료!"); };
  const handleRemoveStudent = (id) => { if (window.confirm("삭제할까요?")) sync({ students: safeStudents.filter(s => s.id !== id) }); };
  const closeSemester = () => { if (window.prompt("'마감' 입력:") !== "마감") return; sync({ roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], donations: [], attendance: {}, attendanceBonus: {}, streakWeeks: {}, notes: {} }); alert("학기 마감 완료!"); };
  const factoryReset = () => { if (window.prompt("'초기화' 입력:") !== "초기화") return; sync({ roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [], pendingShopItems: [], shopItems: [], funding: [], manualRepOffset: 0, allTime: { exp: {}, penalty: {}, donate: {}, fund: {} }, timeAttack: { isActive: false, title: "", rewardRep: 100, endTime: null, cleared: [] }, attendance: {}, attendanceBonus: {}, streakWeeks: {}, notes: {}, extraAttendDays: 0 }); alert("전체 리셋 완료."); };
  const toggleCumulativeStats = () => sync({ settings: { ...db.settings, showCumulativeStats: !db.settings?.showCumulativeStats } });

// =========== [1부 코드의 끝] ===========
return (
    <div className="min-h-screen bg-amber-50/50 pb-32 font-sans text-slate-800 transition-all">
      
      {/* 1. 명성 전광판 (초대형 스케일 및 3분할 레이아웃 적용) */}
      <header className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 md:p-10 shadow-sm relative overflow-hidden border-b-4 border-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[100px] opacity-60"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-amber-800 font-black text-lg mb-6 flex items-center gap-2">
            <Sparkles className="text-amber-500 w-5 h-5"/> {db.settings?.title}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* 좌측 (5/12): 현재 점수 + 게이지 */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-end gap-3 mt-4">
                <span id="score-target" className="text-7xl md:text-8xl font-black text-amber-900 drop-shadow-sm tracking-tighter">{classReputation}</span>
                <span className="text-2xl font-black text-amber-600 mb-3">p</span>
              </div>

              {/* 🔥 V10 진화 칭호가 들어간 대형 게이지 바 */}
              <div className="w-full h-10 bg-white/60 rounded-full overflow-hidden shadow-inner border-4 border-amber-200 relative mt-4">
                <div className={`h-full transition-all duration-1000 ${evolutionLevel >= 5 ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500 animate-pulse' : 'bg-gradient-to-r from-yellow-300 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} style={{ width: `${progressPercent}%` }}></div>
                <div className="absolute inset-0 flex items-center justify-center font-black text-amber-900 text-sm md:text-base tracking-widest drop-shadow-md">
                  {EVOLUTION_TITLES[evolutionLevel]} <span className="text-xs ml-2 opacity-80">({evolutionLevel}/5)</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <div className="flex-1 overflow-hidden whitespace-nowrap text-xs font-bold text-amber-700 bg-white/50 px-3 py-1.5 rounded-full border border-amber-200 mr-3">
                  <span className="animate-[shimmer_20s_linear_infinite] inline-block">
                    ✨ 명예의 기부: {safeArray(db.donations).map(d => `${String(d.name)}(${d.amount}p)`).join(' · ') || '따뜻한 기부를 기다려요!'}
                  </span>
                </div>
                <span className="text-xs font-black text-orange-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-orange-200 shrink-0">최종 목표: {db.settings?.targetScore || 5000}p</span>
              </div>
            </div>

            {/* 중앙 (3/12): 초대형 세계수 애니메이션 */}
            <div className="lg:col-span-3 flex items-center justify-center py-6">
              {/* 스케일을 대폭 키워 화면의 주인공으로 만듦 */}
              <div className="scale-125 transform-origin-center">
                {renderEvolution(evolutionLevel)}
              </div>
            </div>

            {/* 우측 (4/12): 대형 타임워치 위젯 */}
            <div className="lg:col-span-4">
              <TimerWidget 
                status={timerStatus} display={timerDisplay} timer={db.timer} warningLevel={breakWarningLevel}
                breakInput={breakInput} setBreakInput={setBreakInput} defaultBreakMin={Math.floor((db.settings?.defaultBreakMs || DEFAULT_BREAK_MS) / 60000)}
                onStopwatch={startStopwatch} onCountdown={startCountdown} onPause={pauseTimer} onResume={resumeTimer} onReset={resetTimer} onBreak={startBreak}
                lockEditing={lockEditing} unlockEditing={unlockEditing}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 온기 마키 */}
      <div className="bg-pink-100 text-pink-700 py-3 overflow-hidden shadow-sm border-b border-pink-200 relative z-20">
        <div className="whitespace-nowrap animate-[shimmer_30s_linear_infinite] flex gap-20 text-sm font-black">
          <span className="flex gap-4 items-center"><MessageSquare className="w-5 h-5 text-pink-500"/>
            온기 우체통: {safeArray(db.approvedPraises).map(p => 
              `[${SEL_OPTIONS.find(o=>o.name===p.tag)?.short||'칭찬'}] ${allStats.find(s=>s.id==p.toId)?.name||'나'}: "${p.text}"`
            ).join(' 🌸 ') || '따뜻한 마음을 전해볼까요?'}
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">

        {/* ═══ PAGE 1: 대시보드 ═══ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">

            {/* 공동퀘스트 + 타임어택 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[30px] border-2 border-blue-100 shadow-sm flex flex-col justify-between">
                <h3 className="text-base font-black text-blue-600 mb-4 flex items-center gap-2"><Zap className="w-5 h-5"/> 학급 공동 퀘스트</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => addCoopScore(db.coopQuest?.q1 || 50, db.coopQuest?.q1Name || "바른 생활")} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-4 rounded-2xl font-black text-sm border border-indigo-200 active:scale-95 truncate px-2">{db.coopQuest?.q1Name || "바른 생활"} +{db.coopQuest?.q1 || 50}</button>
                  <button onClick={() => addCoopScore(db.coopQuest?.q2 || 20, db.coopQuest?.q2Name || "환대")} className="bg-pink-50 hover:bg-pink-100 text-pink-700 py-4 rounded-2xl font-black text-sm border border-pink-200 active:scale-95 truncate px-2">{db.coopQuest?.q2Name || "환대"} +{db.coopQuest?.q2 || 20}</button>
                  <button onClick={() => addCoopScore(db.coopQuest?.q3 || 20, db.coopQuest?.q3Name || "전담 우수")} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-4 rounded-2xl font-black text-sm border border-emerald-200 active:scale-95 col-span-2 shadow-sm truncate px-2">{db.coopQuest?.q3Name || "전담 우수"} +{db.coopQuest?.q3 || 20}</button>
                </div>
                <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                  <span className="text-sm font-black text-yellow-800 truncate pr-2 flex-1">{db.coopQuest?.q4Name || "사이좋은 일주일"}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => adjustGoodWeek(-1)} className="p-2.5 bg-white rounded-xl text-red-500 border border-red-100 shadow-sm"><Minus className="w-4 h-4"/></button>
                    <span className="font-black text-xl text-yellow-600 w-12 text-center">{db.coopQuest?.goodWeek || 0}/5</span>
                    <button onClick={() => adjustGoodWeek(1)} className="p-2.5 bg-white rounded-xl text-green-500 border border-green-100 shadow-sm"><Plus className="w-4 h-4"/></button>
                  </div>
                </div>
                {(db.coopQuest?.goodWeek || 0) >= 5 && (
                  <button onClick={completeGoodWeek} className="mt-3 w-full bg-yellow-400 text-yellow-900 shadow-md font-black py-4 rounded-2xl text-base animate-pulse">최종 승인 및 점수 획득!</button>
                )}
              </div>

              <div className={`p-6 rounded-[30px] border-2 flex flex-col items-center justify-center min-h-[180px] ${db.timeAttack?.isActive ? 'bg-red-50 border-red-300 shadow-inner' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                {db.timeAttack?.isActive ? (
                  <>
                    <div className="flex items-center gap-2 mb-3"><Timer className="w-8 h-8 text-red-500 animate-pulse"/><h2 className="text-base font-black text-red-600 tracking-wider">돌발 타임어택!</h2></div>
                    <p className="text-2xl font-black text-slate-800 mb-4 text-center">{db.timeAttack.title}</p>
                    <div className="bg-red-500 text-white px-10 py-4 rounded-2xl shadow-md"><span className="text-5xl font-black tracking-widest">{timeLeftString}</span></div>
                    <p className="text-sm font-bold text-red-400 mt-4">성공시 학급 명성 +{db.timeAttack.rewardRep}점</p>
                  </>
                ) : (
                  <><Timer className="w-12 h-12 mb-4 opacity-30 text-slate-400"/><p className="font-black text-base text-slate-400 opacity-70">발동된 타임어택 없음</p></>
                )}
              </div>
            </div>

            {/* 명예의 전당 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: '🏆 역할 완수 TOP5', data: topExp, unit: '회', color: 'blue', icon: <CheckCircle2 className="w-6 h-6"/>, key: 'atExp' },
                { title: '🏆 기부 천사 TOP5', data: topDonate, unit: '🪙', color: 'amber', icon: <Coins className="w-6 h-6"/>, key: 'atDonate' },
                { title: '🏆 펀딩 기여 TOP5', data: topFund, unit: '🪙', color: 'pink', icon: <Target className="w-6 h-6"/>, key: 'atFund' }
              ].map(c => (
                <div key={c.title} className={`bg-gradient-to-br from-${c.color}-50 to-${c.color}-100 p-8 rounded-[32px] shadow-sm border border-${c.color}-200`}>
                  <h4 className={`text-lg font-black text-${c.color}-800 mb-6 flex items-center gap-2`}>{c.icon} {c.title}</h4>
                  <ul className="space-y-3">
                    {c.data.length ? c.data.map((s,i) => (
                      <li key={s.id} className={`text-base font-black text-${c.color}-900 bg-white/70 px-4 py-2.5 rounded-2xl flex justify-between shadow-sm`}>
                        <span>{i+1}. {s.name}</span><span className={`text-${c.color}-600`}>{s[c.key]}{c.unit}</span>
                      </li>
                    )) : <li className={`text-sm font-bold text-${c.color}-400 text-center py-5`}>데이터 없음</li>}
                  </ul>
                </div>
              ))}
            </div>

            {/* 학생 카드 헤더 */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-6 border-b-4 border-amber-200/50 pb-6 mt-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-amber-900 flex items-center gap-3"><Users className="text-amber-500 w-10 h-10"/> 우리 반 꼬마 시민들</h2>
                <p className="text-sm font-bold text-slate-500 mt-2">
                  {getTodayWeekdayIdx() < 0 ? '🔔 주말입니다.' : isAttendanceOpen() ? '🕗 출석 체크 가능 (08:30 마감)' : '⏰ 출석 시간이 마감되었습니다'}
                </p>
              </div>
              <button onClick={() => setShowPraiseModal(true)} className="w-full sm:w-auto bg-gradient-to-r from-pink-400 to-rose-500 text-white px-10 py-5 rounded-full font-black text-lg shadow-[0_10px_20px_rgba(244,63,94,0.3)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-2 border-pink-300">
                <Heart className="w-6 h-6 fill-white animate-pulse"/> 온기 우체통
              </button>
            </div>

            {/* 학생 카드 목록 (가독성을 위해 패딩/폰트 크기 상향) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedDashboardStats.map(s => {
                const isTaCleared = safeArray(db.timeAttack?.cleared).map(Number).includes(Number(s.id));
                const nameColor = s.attendedToday ? 'text-slate-800' : 'text-slate-400';
                const isAnim = attendAnim?.id === s.id;
                return (
                  <div key={s.id} className={`p-6 rounded-[35px] border-4 shadow-sm transition-all relative flex flex-col bg-white hover:shadow-xl ${s.status === 'crisis' ? 'border-slate-300 bg-slate-100 opacity-60 grayscale' : (s.status === 'pending' ? 'border-orange-300 bg-orange-50' : 'border-white hover:border-amber-300')}`}>
                    
                    {db.timeAttack?.isActive && s.status !== 'crisis' && (
                      <div className="absolute -top-4 -right-4 z-20">
                        <button onClick={() => toggleTimeAttackClear(s.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-black text-xs shadow-md border-2 ${isTaCleared ? 'bg-green-500 text-white border-green-600 scale-110' : 'bg-white text-slate-400 border-slate-200'}`}>
                          {isTaCleared ? <><CheckCircle2 className="w-4 h-4"/>완료</> : <><Timer className="w-4 h-4"/>도전 중</>}
                        </button>
                      </div>
                    )}

                    {/* 출석 +1 애니메이션 */}
                    {isAnim && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                        <span className="text-4xl font-black text-amber-500 drop-shadow-lg animate-flyToScore">+1</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-5 border-b-2 border-slate-100/50 pb-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner ${s.status === 'crisis' ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-800'}`}>{s.id}</span>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">My Coins</p>
                          <p className={`font-black text-2xl leading-none ${s.status === 'crisis' ? 'text-slate-500' : 'text-amber-600'}`}>{s.coins}🪙</p>
                        </div>
                      </div>
                      {isAuthenticated === 'teacher' && (
                        <button onClick={() => openNoteModal(s.id)} className="p-2.5 rounded-xl bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border border-yellow-200" title="누가기록">
                          <StickyNote className="w-5 h-5"/>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col mb-5 gap-3">
                      <p className="text-[12px] font-bold text-slate-400 tracking-wide truncate">{s.group}모둠 · {s.role}</p>

                      <button
                        onClick={() => toggleAttendance(s.id)}
                        disabled={s.status === 'crisis' || (getTodayWeekdayIdx() < 0)}
                        className={`text-left transition-all ${s.status === 'crisis' ? 'cursor-not-allowed' : 'hover:bg-amber-50 active:scale-95'} rounded-xl py-1`}
                        title={s.attendedToday ? "출석 취소" : "출석 체크"}
                      >
                        <h3 className={`text-2xl font-black flex items-center gap-1.5 whitespace-nowrap tracking-tight truncate ${s.exp >= 20 && s.status !== 'crisis' ? 'text-amber-700' : nameColor}`}>
                          {s.attendedToday && <span className="text-green-500 text-xl">✓</span>}
                          {s.name}
                          {s.isLeader && <Crown className="w-4 h-4 text-amber-400 fill-amber-400"/>}
                          <span className="text-xs font-bold text-slate-400 ml-1">{s.weeklyCount}/5 · ⭐{s.streak}</span>
                        </h3>
                      </button>

                      <div className={`text-sm font-black px-3 py-1.5 rounded-xl border-2 self-start ${s.status === 'crisis' ? 'bg-slate-200 border-slate-300 text-slate-500' : `${s.mastery.bg} ${s.mastery.color}`}`}>
                        {s.mastery.label} ({s.exp})
                      </div>
                    </div>

                    {db.settings?.showCumulativeStats && (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl mb-4 text-[11px] font-bold text-slate-600 grid grid-cols-2 gap-2 shadow-inner">
                         <span>✅완수: <span className="text-blue-600">{s.atExp}</span></span><span>💎기부: <span className="text-amber-600">{s.atDonate}</span></span>
                         <span>🚀펀딩: <span className="text-pink-600">{s.atFund}</span></span><span className="text-red-400">🚨위기: <span className="text-red-600">{s.atPen}</span></span>
                      </div>
                    )}

                    <div className="mt-auto pt-2">
                      {s.status === 'normal' && <button onClick={() => handleGivePenalty(s.id)} className="w-full py-4 bg-slate-50 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-all"><AlertTriangle className="w-4 h-4"/> 위기 지정</button>}
                      {s.status === 'crisis' && <p className="text-center font-black text-white bg-slate-600 py-4 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2">🚨 성찰과 회복 요망</p>}
                      {s.status === 'pending' && <p className="text-center font-black text-orange-800 bg-orange-200 py-4 rounded-2xl text-sm shadow-md">⏳ 교사 승인 대기중</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PAGE 2: 성찰 ═══ */}
        {activeTab === 'reflection' && (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95">
            <div className="bg-white p-10 md:p-14 rounded-[50px] shadow-xl border-4 border-emerald-100 text-center">
              <BookOpen className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-4xl font-black mb-4 text-emerald-900">성찰과 회복 센터 🌱</h2>
              <p className="text-emerald-600 font-bold mb-10 text-base">내 마음을 돌아보고 더 단단한 나로 성장하는 공간입니다.</p>
              <div className="text-left space-y-8 bg-emerald-50/60 p-8 md:p-10 rounded-[36px] border-2 border-emerald-100">
                <div>
                  <label className="block text-base font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-4 py-1.5 rounded-full">1. 누가 성찰하나요?</label>
                  <select value={refTarget} onChange={e=>setRefTarget(e.target.value)} className="w-full p-5 rounded-2xl border-2 border-white font-black bg-white text-lg outline-none focus:border-emerald-300">
                    <option value="">이름 선택 (위기 친구들만)</option>
                    {allStats.filter(s => s.status === 'crisis').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {refTarget && (
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 p-6 rounded-[26px] text-pink-800">
                    <h4 className="text-lg font-black mb-3 flex items-center gap-2"><Heart className="w-5 h-5 fill-pink-400"/> 응원합니다.</h4>
                    {randomPraise ? (
                      <p className="text-sm font-bold leading-relaxed bg-white p-5 rounded-2xl border border-pink-100">
                        "예전에 <b>{SEL_OPTIONS.find(o=>o.name===randomPraise.tag)?.short}</b>로 칭찬받았어! 👉 <span className="text-pink-600">"{randomPraise.text}"</span>"
                      </p>
                    ) : (
                      <p className="text-sm font-bold bg-white p-5 rounded-2xl border border-pink-100">"넌 소중한 보물이야. 다시 시작해봐요!"</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-base font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-4 py-1.5 rounded-full">2. 어떤 역량이 필요할까요?</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SEL_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => setRefTag(opt.name)} className={`p-4 rounded-2xl border-2 font-black text-sm text-left transition-all ${refTag === opt.name ? 'bg-emerald-500 border-emerald-500 text-white scale-105' : 'bg-white border-white text-slate-500 shadow-sm hover:-translate-y-1'}`}>{opt.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-base font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-4 py-1.5 rounded-full">3. 마음의 다짐</label>
                  <textarea value={refText} onChange={e=>setRefText(e.target.value)} rows="6" className="w-full p-6 rounded-[26px] border-2 border-white font-black bg-white resize-none text-base outline-none focus:border-emerald-300" placeholder={refTag ? SEL_GUIDES[refTag] : "역량을 먼저 선택해 주세요."}/>
                </div>
                <button onClick={submitReflection} className="w-full bg-emerald-600 text-white py-5 rounded-[26px] font-black text-xl shadow-xl hover:bg-emerald-700 active:scale-95 flex justify-center items-center gap-3"><Send className="w-6 h-6"/> 다짐 제출</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PAGE 3: 도움실 ═══ */}
        {activeTab === 'helproom' && (
          <div className="bg-white rounded-[40px] shadow-sm border-4 border-indigo-50 flex flex-col lg:flex-row min-h-[700px] animate-in fade-in overflow-hidden">
            <aside className="w-full lg:w-72 bg-indigo-50/50 p-8 border-r-2 border-white flex flex-col gap-4 shrink-0">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border-4 border-indigo-100"><Users className="w-10 h-10 text-indigo-500" /></div>
                <h3 className="text-2xl font-black text-indigo-900">학급 도움실</h3>
              </div>
              {[
                { key: 'inspector', icon: <Briefcase className="w-5 h-5"/>, label: '감찰사 본부', active: 'bg-indigo-500' },
                { key: 'magistrate', icon: <BookOpen className="w-5 h-5"/>, label: '현령 관리소', active: 'bg-indigo-500' },
                { key: 'shop', icon: <ShoppingCart className="w-5 h-5"/>, label: '학급 상점', active: 'bg-amber-400' }
              ].map(m => (
                <button key={m.key} onClick={() => setHelpSubTab(m.key)}
                        className={`w-full p-5 rounded-2xl font-black text-left flex items-center gap-3 text-base ${helpSubTab === m.key ? `${m.active} text-white shadow-xl` : 'bg-white text-indigo-400'}`}>
                  {m.icon} {m.label}
                </button>
              ))}
            </aside>

            <section className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50/30">
              {/* 기부처 */}
              <div className="mb-10 bg-gradient-to-r from-yellow-100 to-amber-100 p-6 rounded-[30px] shadow-sm flex flex-col md:flex-row gap-6 items-center border-2 border-yellow-200">
                <div className="md:w-1/3 text-center md:text-left">
                  <h4 className="text-xl font-black text-amber-800 mb-1 flex items-center justify-center md:justify-start gap-2"><Coins className="w-6 h-6 text-yellow-500"/> 명예의 기부처</h4>
                  <p className="text-sm font-bold text-amber-700">코인으로 명성을 높이세요!</p>
                </div>
                <div className="md:w-2/3 flex gap-3 w-full">
                  <select id="donate_who_main" className="flex-1 p-4 rounded-xl bg-white border-2 border-white font-black outline-none text-base text-slate-700">
                    <option value="">누가 기부할까요?</option>
                    {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.coins}🪙)</option>)}
                  </select>
                  <input id="donate_amount_main" type="number" placeholder="금액" className="w-28 p-4 rounded-xl bg-white border-2 border-white font-black outline-none text-center"/>
                  <button onClick={() => {
                    const sid = document.getElementById('donate_who_main').value; const amt = toInt(document.getElementById('donate_amount_main').value);
                    if (!sid || !amt) return alert("정보 확인"); handleDonate(toInt(sid), amt);
                  }} className="bg-amber-500 text-white px-6 rounded-xl font-black text-lg hover:bg-amber-600 active:scale-95">기부</button>
                </div>
              </div>

              {helpSubTab === 'inspector' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 bg-indigo-100 inline-block px-5 py-2 rounded-full"><Briefcase className="text-indigo-600 w-6 h-6"/> 감찰사 본부</h3>
                  <div className="bg-white border-2 border-indigo-50 rounded-[30px] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-indigo-50/50 text-sm font-black text-indigo-400 uppercase">
                        <tr><th className="p-4">이름</th><th className="p-4">모둠</th><th className="p-4 text-center">모둠장</th><th className="p-4">1인 1역</th></tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-50/50">
                        {allStats.map(s => (
                          <tr key={s.id} className="hover:bg-indigo-50/20">
                            <td className="p-4 font-black text-lg text-slate-700">{s.name}</td>
                            <td className="p-4">
                              <select value={s.group} onChange={e=>handleStudentFieldChange(s.id, 'group', toInt(e.target.value))} className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-bold outline-none w-full max-w-[120px]">
                                {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}모둠</option>)}
                              </select>
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => handleStudentFieldChange(s.id, 'isLeader', !s.isLeader)} className={`px-4 py-2 rounded-lg font-black text-sm ${s.isLeader ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {s.isLeader ? <><Crown className="w-4 h-4 inline fill-white"/> 모둠장</> : '일반'}
                              </button>
                            </td>
                            <td className="p-4">
                              <select value={s.role} onChange={e=>handleStudentFieldChange(s.id, 'role', e.target.value)} className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 font-bold outline-none">
                                <option value="">직업 없음</option>{safeArray(db.rolesList).map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {helpSubTab === 'magistrate' && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 bg-blue-100 inline-block px-5 py-2 rounded-full"><BookOpen className="text-blue-600 w-6 h-6"/> 현령 관리소</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1,2,3,4,5,6].map(gNum => {
                      const members = groupedByGroupStats.filter(s => s.group === gNum);
                      if (!members.length) return null;
                      return (
                        <div key={gNum} className="bg-white p-6 rounded-[30px] border-2 border-blue-50 shadow-sm">
                          <h4 className="text-lg font-black text-blue-800 mb-4 bg-blue-50 inline-block px-4 py-1.5 rounded-full">{gNum}모둠</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {members.map(s => (
                              <div key={s.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                                <div><p className="text-xs font-bold text-slate-400 mb-0.5">{s.role}</p><p className="font-black text-xl text-slate-800">{s.name}</p></div>
                                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border shadow-sm">
                                  <button onClick={() => handleExpAdjust(s.id, -1)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><Minus className="w-5 h-5"/></button>
                                  <span className="w-12 text-center font-black text-blue-600 text-2xl">{s.exp}</span>
                                  <button onClick={() => handleExpAdjust(s.id, 1)} className="p-2 text-slate-400 hover:text-green-500 rounded-lg"><Plus className="w-5 h-5"/></button>
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

              {helpSubTab === 'shop' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-amber-200 pb-5">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 bg-amber-100 px-5 py-2 rounded-full"><ShoppingCart className="text-amber-600 w-6 h-6"/> 달보드레 상점</h3>
                    <div className={`px-8 py-3 rounded-full font-black text-base shadow-lg border-4 ${isShopOpen ? 'bg-green-500 text-white border-green-300 animate-pulse' : 'bg-slate-500 text-white border-slate-400'}`}>
                      {isShopOpen ? "🔓 영업 중" : "🔒 목요일 개방"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-[30px] border-4 border-amber-200">
                    <h4 className="text-2xl font-black text-amber-900 mb-3 flex items-center gap-2"><Gavel className="w-6 h-6"/> 장인의 공방</h4>
                    <p className="text-sm font-bold text-amber-700 mb-6">숙련도 20+ 장인이 아이템 기획 제출</p>
                    <div className="flex flex-wrap gap-3">
                      <select value={artisanTarget} onChange={e=>setArtisanTarget(e.target.value)} className="w-48 p-4 rounded-xl bg-white border-2 border-amber-200 font-black outline-none">
                        <option value="">장인 선택</option>
                        {allStats.filter(s => s.exp >= 20).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <input type="text" placeholder="아이템명" value={artisanItemName} onChange={e=>setArtisanItemName(e.target.value)} className="flex-1 p-4 rounded-xl bg-white border-2 border-amber-200 font-bold outline-none"/>
                      <input type="number" placeholder="가격" value={artisanItemPrice} onChange={e=>setArtisanItemPrice(e.target.value)} className="w-28 p-4 rounded-xl bg-white border-2 border-amber-200 font-bold outline-none text-center"/>
                      <button onClick={submitArtisanItem} className="bg-amber-600 text-white px-8 rounded-xl font-black hover:bg-amber-700">결재 올리기</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {safeArray(db.shopItems).filter(i => i && i.name).map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[30px] shadow-sm border-2 border-slate-100 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg">{String(item.creator)} 제작</span>
                            <p className="text-3xl font-black text-amber-500">{toInt(item.price)}🪙</p>
                          </div>
                          <h4 className="text-2xl font-black text-slate-800 mb-6">{String(item.name)}</h4>
                        </div>
                        <div className="flex gap-3">
                          <select id={`buyer_${item.id}`} className="flex-1 p-4 rounded-xl bg-slate-50 border font-bold outline-none">
                            <option value="">구매자</option>
                            {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.coins}🪙)</option>)}
                          </select>
                          <button onClick={() => {
                            if (!isShopOpen) return alert("운영일 아님!");
                            const sid = document.getElementById(`buyer_${item.id}`).value;
                            if (!sid) return alert("선택!"); const user = activeStudents.find(u => u.id == sid);
                            if (user.coins < toInt(item.price)) return alert("코인 부족");
                            if (!window.confirm(`${user.name}에게 차감?`)) return;
                            sync({ usedCoins: { ...db.usedCoins, [sid]: (db.usedCoins[sid] || 0) + toInt(item.price) } });
                            alert("결제 완료!"); playSound('buy');
                          }} className="bg-amber-500 text-white px-8 rounded-xl font-black hover:bg-amber-600">구매</button>
                        </div>
                      </div>
                    ))}
                    
                    {safeArray(db.funding).filter(f => f && f.name).map(f => (
                      <div key={f.id} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-[30px] shadow-xl text-white border-4 border-blue-400">
                        <h4 className="text-2xl font-black mb-2 flex items-center gap-3"><Target className="w-6 h-6 text-yellow-300"/> {String(f.name)}</h4>
                        <p className="text-sm font-bold text-blue-100 mb-6">다 함께 목표를 이뤄요!</p>
                        <div className="flex justify-between text-base font-black mb-3"><span>{toInt(f.current)}p</span><span>목표 {toInt(f.target,1)}p</span></div>
                        <div className="w-full h-5 bg-black/30 rounded-full mb-6 overflow-hidden">
                          <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${Math.min((toInt(f.current)/toInt(f.target,1))*100, 100)}%` }}></div>
                        </div>
                        <div className="flex gap-3">
                          <select id={`funder_${f.id}`} className="flex-1 p-4 rounded-xl bg-white/20 text-white font-bold outline-none">
                            <option value="" className="text-slate-800">투자자</option>
                            {activeStudents.map(s => <option key={s.id} value={s.id} className="text-slate-800">{s.name}</option>)}
                          </select>
                          <input id={`f_amt_${f.id}`} type="number" placeholder="금액" className="w-24 p-4 rounded-xl bg-white/20 text-white font-bold outline-none text-center"/>
                          <button onClick={() => {
                            const sid = document.getElementById(`funder_${f.id}`).value; const amt = toInt(document.getElementById(`f_amt_${f.id}`).value);
                            if (!sid || !amt) return alert("입력!"); handleFund(f.id, toInt(sid), amt);
                          }} className="bg-yellow-400 text-yellow-900 px-8 rounded-xl font-black">투자</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ═══ PAGE 4: 관리실 ═══ */}
        {activeTab === 'admin' && isAuthenticated === 'teacher' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 flex flex-col lg:flex-row min-h-[800px] animate-in fade-in overflow-hidden">
            <aside className="w-full lg:w-72 bg-slate-900 p-8 flex flex-col gap-3 shrink-0">
              <div className="text-center mb-8">
                <Lock className="w-14 h-14 text-blue-500 mx-auto mb-3" />
                <h3 className="text-2xl font-black text-white">관리자 센터</h3>
              </div>
              {[
                { key: 'mission', icon: <Zap className="w-5 h-5"/>, label: '결재/퀘스트', color: 'bg-blue-600' },
                { key: 'shopAdmin', icon: <Store className="w-5 h-5"/>, label: '상점/펀딩', color: 'bg-blue-600' },
                { key: 'report', icon: <BarChart3 className="w-5 h-5"/>, label: 'SEL 리포트', color: 'bg-blue-600' },
                { key: 'students', icon: <Users className="w-5 h-5"/>, label: '명단 관리', color: 'bg-blue-600' },
                { key: 'attendAdmin', icon: <CheckCircle2 className="w-5 h-5"/>, label: '출석 관리', color: 'bg-blue-600' },
                { key: 'settings', icon: <Settings className="w-5 h-5"/>, label: '환경/점수', color: 'bg-blue-600' },
                { key: 'reset', icon: <History className="w-5 h-5"/>, label: '초기화/마감', color: 'bg-red-600' }
              ].map(m => (
                <button key={m.key} onClick={() => setAdminSubTab(m.key)}
                        className={`w-full p-4 rounded-xl font-black text-left flex items-center gap-3 text-base ${adminSubTab === m.key ? `${m.color} text-white shadow-lg translate-x-2` : 'bg-slate-800 text-slate-400'}`}>
                  {m.icon} {m.label}
                </button>
              ))}
              <button onClick={handleLogout} className="mt-auto p-4 bg-slate-800 text-slate-400 font-black rounded-xl text-center hover:bg-slate-700 flex items-center justify-center gap-2">
                <LogOut className="w-5 h-5"/> 로그아웃
              </button>
            </aside>

            <section className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50/50">

              {/* 결재/퀘스트/타임어택 */}
              {adminSubTab === 'mission' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-200">
                    <h3 className="text-xl font-black text-slate-800 border-l-8 border-blue-600 pl-4 mb-6 flex items-center gap-2"><Settings className="w-5 h-5"/> 공동 퀘스트 & 타임어택</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {[
                        { key: 'q1', color: 'indigo', defName: '다 함께 바른 생활', defVal: 50 },
                        { key: 'q2', color: 'pink', defName: '환대와 응원', defVal: 20 },
                        { key: 'q3', color: 'emerald', defName: '전담수업 태도', defVal: 20 },
                        { key: 'q4', color: 'yellow', defName: '사이좋은 일주일', defVal: 100 }
                      ].map(q => (
                        <div key={q.key} className={`bg-${q.color}-50 p-3 rounded-xl border border-${q.color}-100 flex gap-2`}>
                          <input type="text" value={db.coopQuest?.[`${q.key}Name`] || q.defName}
                                 onChange={e => sync({ coopQuest: { ...db.coopQuest, [`${q.key}Name`]: e.target.value } })}
                                 onFocus={lockEditing} onBlur={unlockEditing} className="flex-1 p-2.5 rounded-lg text-sm font-bold border-none outline-none"/>
                          <input type="number" value={db.coopQuest?.[q.key] ?? q.defVal}
                                 onChange={e => sync({ coopQuest: { ...db.coopQuest, [q.key]: toInt(e.target.value) } })}
                                 onFocus={lockEditing} onBlur={unlockEditing} className={`w-16 p-2.5 rounded-lg text-sm font-black text-${q.color}-600 border-none outline-none text-center`}/>
                        </div>
                      ))}
                    </div>

                    <div className="bg-red-50 p-6 rounded-[26px] border-2 border-red-200">
                      <h4 className="text-lg font-black text-red-800 mb-5 flex items-center gap-2"><Timer className="w-5 h-5"/> 타임어택 발동기</h4>
                      {db.timeAttack?.isActive ? (
                        <div className="space-y-4">
                          <div className="bg-white p-3 rounded-xl border border-red-100 text-center">
                            <p className="text-2xl font-black text-red-600 tracking-widest">{timeLeftString}</p>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={handleCompleteTimeAttack} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-black">성공 승인</button>
                            <button onClick={handleFailTimeAttack} className="flex-1 bg-slate-400 text-white py-3 rounded-xl font-black">실패 종료</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-white p-5 rounded-xl border border-red-200 space-y-4">
                            <input type="text" placeholder="미션 제목" value={taTitle} onChange={e=>setTaTitle(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="w-full p-3 rounded-lg border border-red-100 font-bold outline-none"/>
                            <div className="flex gap-3">
                              <input type="number" value={taMins} onChange={e=>setTaMins(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} placeholder="분" className="flex-1 p-3 rounded-lg border border-red-100 font-black text-center outline-none"/>
                              <input type="number" value={taReward} onChange={e=>setTaReward(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} placeholder="보상p" className="flex-1 p-3 rounded-lg border border-red-100 font-black text-center outline-none"/>
                            </div>
                          </div>
                          <button onClick={handleStartTimeAttack} className="w-full bg-red-600 text-white py-4 rounded-xl font-black hover:bg-red-700 text-lg">🚀 타임어택 발동</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[30px] shadow-sm border border-green-100">
                    <h4 className="text-2xl font-black mb-6 text-slate-800 border-l-8 border-green-500 pl-4">서류 결재함</h4>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                      {safeArray(db.pendingShopItems).filter(i => i && i.name).map(item => (
                        <div key={item.id} className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-200">
                          <div className="flex justify-between mb-2">
                            <span className="font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-lg text-xs">장인: {String(item.creator)}</span>
                            <span className="text-sm font-black text-amber-600">{toInt(item.price)}🪙</span>
                          </div>
                          <p className="text-base text-slate-800 font-black mb-3">"{String(item.name)}"</p>
                          <div className="flex gap-2">
                            <button onClick={() => { sync({ pendingShopItems: safeArray(db.pendingShopItems).filter(i => i.id !== item.id), shopItems: [item, ...safeArray(db.shopItems)] }); alert("등록!"); playSound('good'); }} className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg font-black text-sm">출시 허가</button>
                            <button onClick={() => { sync({ pendingShopItems: safeArray(db.pendingShopItems).filter(i => i.id !== item.id) }); }} className="px-4 bg-white text-slate-400 font-black rounded-lg border">반려</button>
                          </div>
                        </div>
                      ))}
                      {safeArray(db.pendingReflections).filter(r => r && r.sId).map(r => (
                        <div key={r.id} className="bg-red-50 p-5 rounded-2xl border-2 border-red-200">
                          <div className="flex justify-between items-center mb-3 border-b border-red-200/50 pb-2">
                            <span className="font-black text-red-800 bg-red-100 px-3 py-1 rounded-lg text-xs flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5"/> {allStats.find(s=>s.id==r.sId)?.name}</span>
                            <span className="text-[10px] font-black text-red-400 bg-white px-2 py-1 rounded-full">{SEL_OPTIONS.find(o=>o.name===r.tag)?.short}</span>
                          </div>
                          <p className="text-sm text-slate-700 font-bold mb-4 whitespace-pre-wrap bg-white p-3 rounded-xl border border-red-100">"{String(r.text)}"</p>
                          <div className="flex gap-2">
                            <button onClick={() => { sync({ pendingReflections: safeArray(db.pendingReflections).filter(pr => pr.id !== r.id), studentStatus: { ...db.studentStatus, [r.sId]: 'normal' } }); alert("해제!"); playSound('good'); }} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-black text-sm">해제 승인</button>
                            <button onClick={() => { sync({ pendingReflections: safeArray(db.pendingReflections).filter(pr => pr.id !== r.id), studentStatus: { ...db.studentStatus, [r.sId]: 'crisis' } }); }} className="px-4 bg-white text-slate-500 font-black rounded-lg border-2 text-sm">반려</button>
                          </div>
                        </div>
                      ))}
                      {safeArray(db.pendingPraises).filter(p => p && p.toId).map(p => {
                        const target = allStats.find(u => u.id == p.toId); const isCrisis = target?.status === 'crisis';
                        return (
                          <div key={p.id} className="bg-pink-50 p-5 rounded-2xl border-2 border-pink-200">
                            <div className="flex justify-between items-center mb-3 border-b border-pink-200/50 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-pink-800 bg-pink-100 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 fill-pink-500"/> To. {target?.name || '나'}</span>
                                {isCrisis && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">🚨</span>}
                              </div>
                              <span className="text-[10px] font-black text-pink-500 bg-white px-2 py-1 rounded-full">{SEL_OPTIONS.find(o=>o.name===p.tag)?.short}</span>
                            </div>
                            <p className="text-sm text-slate-700 font-bold mb-4 bg-white p-3 rounded-xl border border-pink-100">"{String(p.text)}"</p>
                            <div className="flex gap-2">
                              <button onClick={() => approvePraise(p)} className={`flex-1 py-3 rounded-lg font-black text-sm ${isCrisis ? 'bg-slate-300 text-slate-500' : 'bg-pink-500 text-white'}`}>승인</button>
                              <button onClick={() => { sync({ pendingPraises: safeArray(db.pendingPraises).filter(pr => pr.id !== p.id) }); }} className="px-4 bg-white text-slate-500 font-black rounded-lg border-2 text-sm">반려</button>
                            </div>
                          </div>
                        );
                      })}
                      {safeArray(db.pendingShopItems).length === 0 && safeArray(db.pendingReflections).length === 0 && safeArray(db.pendingPraises).length === 0 && (
                        <div className="text-slate-400 font-black py-12 border-4 border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                          <CheckCircle2 className="w-10 h-10 mb-3 opacity-50"/>결재 대기열 깨끗함
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 상점/펀딩 관리 */}
              {adminSubTab === 'shopAdmin' && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-5 mb-6">상점 및 펀딩 관리</h3>
                  <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-100 space-y-6">
                    <button onClick={() => sync({ settings: { ...db.settings, forceShopOpen: !db.settings?.forceShopOpen } })}
                            className={`w-full py-4 rounded-xl font-black text-lg ${db.settings?.forceShopOpen ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border-2 border-slate-300'}`}>
                      상점 개방: {db.settings?.forceShopOpen ? 'ON' : 'OFF(목요일만)'}
                    </button>
                    <div className="pt-5 border-t border-slate-200">
                      <h4 className="font-black text-lg text-slate-700 mb-4">상점 물품</h4>
                      <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="이름" value={newItemName} onChange={e=>setNewItemName(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="flex-1 p-3 rounded-lg border font-bold outline-none"/>
                        <input type="number" placeholder="가격" value={newItemPrice} onChange={e=>setNewItemPrice(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="w-28 p-3 rounded-lg border font-bold outline-none text-center"/>
                        <button onClick={() => {
                          if (!newItemName || !newItemPrice) return alert("입력!");
                          sync({ shopItems: [...safeArray(db.shopItems), { id: Date.now(), name: newItemName, price: toInt(newItemPrice), creator: '선생님' }] });
                          setNewItemName(""); setNewItemPrice("");
                        }} className="bg-blue-600 text-white px-6 rounded-lg font-black">추가</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {safeArray(db.shopItems).filter(i => i && i.name).map(item => (
                          <div key={item.id} className="bg-amber-50 p-3 rounded-xl border flex justify-between items-center">
                            <div><span className="text-[9px] text-slate-400 font-black bg-white px-2 py-0.5 rounded">{String(item.creator)}</span><h4 className="font-black text-slate-800 mt-1">{String(item.name)}</h4><p className="text-amber-600 font-black text-sm">{toInt(item.price)}🪙</p></div>
                            <button onClick={() => { if (window.confirm("삭제?")) sync({ shopItems: safeArray(db.shopItems).filter(i => i.id !== item.id) }); }} className="p-2.5 bg-white text-red-500 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-200">
                      <h4 className="font-black text-lg text-blue-800 mb-4">크라우드 펀딩</h4>
                      <div className="flex gap-2 mb-4 bg-blue-50 p-4 rounded-2xl">
                        <input type="text" placeholder="목표" value={newFundName} onChange={e=>setNewFundName(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="flex-1 p-3 rounded-lg border border-blue-200 font-bold outline-none"/>
                        <input type="number" placeholder="점수" value={newFundTarget} onChange={e=>setNewFundTarget(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="w-28 p-3 rounded-lg border border-blue-200 font-bold outline-none text-center"/>
                        <button onClick={() => {
                          if (!newFundName || !newFundTarget || toInt(newFundTarget)===0) return alert("입력!");
                          sync({ funding: [...safeArray(db.funding), { id: Date.now(), name: newFundName, target: toInt(newFundTarget), current: 0 }] });
                          setNewFundName(""); setNewFundTarget("");
                        }} className="bg-blue-600 text-white px-6 rounded-lg font-black">개설</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {safeArray(db.funding).filter(f => f && f.name).map(f => (
                          <div key={f.id} className="bg-white p-4 rounded-xl border border-blue-200 flex justify-between items-center">
                            <div><h4 className="font-black text-blue-900">{String(f.name)}</h4><p className="text-blue-500 font-bold text-xs">{toInt(f.current)}/{toInt(f.target)}p</p></div>
                            <button onClick={() => { if (window.confirm("삭제?")) sync({ funding: safeArray(db.funding).filter(x => x.id !== f.id) }); }} className="p-2.5 bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEL 리포트 + 누가기록 */}
              {adminSubTab === 'report' && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-5 mb-6">🌱 SEL 리포트 & 데이터 추출</h3>
                  <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 space-y-4">
                      <select value={selectedReportStudent} onChange={e=>setSelectedReportStudent(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-2 font-black text-lg outline-none">
                        <option value="">학생 선택</option>
                        {allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                        <h5 className="font-black text-indigo-700 text-sm flex items-center gap-2"><Download className="w-4 h-4"/> AI 리포트 추출</h5>
                        <button disabled={!selectedReportStudent} onClick={() => exportStudent(selectedReportStudent)}
                                className={`w-full p-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 ${selectedReportStudent ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                          <Copy className="w-4 h-4"/> 이 학생만 추출
                        </button>
                        <button onClick={exportAll} className="w-full p-3 rounded-xl font-black text-sm bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center gap-2">
                          <Download className="w-4 h-4"/> 전체 반 추출
                        </button>
                      </div>
                      {selectedReportStudent && (
                        <button onClick={() => setShowRollingPaper(toInt(selectedReportStudent))} className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white p-4 rounded-2xl font-black text-base flex items-center justify-center gap-2">
                          <Printer className="w-5 h-5"/> 롤링페이퍼 인쇄
                        </button>
                      )}
                    </div>
                    <div className="w-full md:w-2/3 bg-slate-50 p-6 rounded-[30px] border border-slate-200">
                      {selectedReportStudent ? (() => {
                        const s = allStats.find(x => x.id == selectedReportStudent);
                        if (!s) return <div className="h-full flex flex-col items-center justify-center text-slate-400 font-black">삭제된 학생 데이터.</div>;
                        const counts = {}; SEL_OPTIONS.forEach(o => counts[o.name] = 0);
                        safeArray(db.approvedPraises).forEach(p => { if (p.toId == s.id && counts[p.tag] !== undefined) counts[p.tag]++; });
                        const max = Math.max(...Object.values(counts), 5);
                        return (
                          <div className="animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-end mb-6 border-b-2 pb-3">
                              <h4 className="text-2xl font-black flex items-center gap-2"><Star className="w-6 h-6 text-yellow-400 fill-yellow-400"/> {s.name}</h4>
                              <div className="text-xs font-black text-slate-500">위기 <span className="text-red-500">{s.atPen}</span> | 기부 <span className="text-amber-500">{s.atDonate}🪙</span> | 출석 {s.weeklyCount}/5</div>
                            </div>
                            {s.enneagram && ENNEAGRAM_DATA[s.enneagram] && (
                              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 mb-6">
                                <h5 className="font-black text-indigo-900 mb-2 flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4"/> {ENNEAGRAM_DATA[s.enneagram].name}</h5>
                                <p className="text-sm font-bold text-indigo-800 leading-relaxed">{ENNEAGRAM_DATA[s.enneagram].desc}</p>
                              </div>
                            )}
                            <div className="space-y-3 mb-6">
                              {Object.keys(counts).map(tag => (
                                <div key={tag} className="flex items-center gap-3">
                                  <span className="w-24 text-xs font-black text-slate-600 text-right">{SEL_OPTIONS.find(o=>o.name===tag)?.short}</span>
                                  <div className="flex-1 h-6 bg-white rounded-full overflow-hidden border">
                                    <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500" style={{ width: `${(counts[tag]/max)*100}%` }}></div>
                                  </div>
                                  <span className="w-10 font-black text-blue-600 text-right">{counts[tag]}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t-2 border-slate-200 pt-5 mt-5">
                              <button onClick={() => setShowNotesInReport(!showNotesInReport)} className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-black p-3 rounded-xl flex items-center justify-between transition-colors">
                                <span className="flex items-center gap-2"><StickyNote className="w-5 h-5"/> 누가기록 ({s.notes.length}건)</span><span>{showNotesInReport ? '▲' : '▼'}</span>
                              </button>
                              {showNotesInReport && (
                                <div className="mt-3 space-y-2 animate-in fade-in">
                                  {s.notes.length === 0 && <p className="text-xs text-slate-400 font-bold text-center py-4">기록 없음</p>}
                                  {s.notes.map(n => (
                                    <div key={n.id} className="bg-white p-3 rounded-xl border border-yellow-200 flex justify-between items-start gap-3">
                                      <div><p className="text-[10px] font-black text-yellow-600">{n.date}</p><p className="text-sm font-bold text-slate-700 mt-1 whitespace-pre-wrap">{n.text}</p></div>
                                      <button onClick={() => deleteNote(s.id, n.id)} className="p-2 bg-red-50 text-red-500 rounded-lg shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>
                                  ))}
                                  <button onClick={() => openNoteModal(s.id)} className="w-full bg-yellow-500 text-white p-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-yellow-600"><Plus className="w-4 h-4"/> 새 기록 추가</button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })() : <div className="h-full flex flex-col items-center justify-center text-slate-400 font-black"><BarChart3 className="w-12 h-12 mb-3 opacity-30"/>학생을 선택하세요.</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* 명단 관리 */}
              {adminSubTab === 'students' && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-5 mb-6">👥 명단 관리</h3>
                  <div className="bg-white p-8 rounded-[30px] shadow-sm border">
                    <div className="flex flex-wrap gap-3 mb-8 bg-slate-50 p-6 rounded-[26px] border">
                      <input type="text" placeholder="이름" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="flex-1 p-4 rounded-xl border font-bold outline-none"/>
                      <select value={newStudentGroup} onChange={e=>setNewStudentGroup(e.target.value)} className="w-32 p-4 rounded-xl border font-bold">
                        {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}모둠</option>)}
                      </select>
                      <select value={newStudentEnneagram} onChange={e=>setNewStudentEnneagram(e.target.value)} className="w-36 p-4 rounded-xl border font-bold">
                        <option value="">에니어그램</option>
                        {Object.keys(ENNEAGRAM_DATA).map(k => <option key={k} value={k}>{k}번</option>)}
                      </select>
                      <button onClick={handleAddStudent} className="bg-blue-600 text-white px-8 rounded-xl font-black">추가</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {safeStudents.map(s => (
                        <div key={s.id} className="bg-white p-5 rounded-2xl border-2 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded">{s.id}번|{s.group}모둠</span>
                            <h4 className="font-black text-lg mt-2 flex items-center gap-2">{s.name} {s.enneagram && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full">{s.enneagram}번</span>}</h4>
                          </div>
                          <button onClick={() => handleRemoveStudent(s.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 출석 관리 */}
              {adminSubTab === 'attendAdmin' && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-5 mb-6">📅 출석 관리</h3>
                  <div className="bg-white p-8 rounded-[30px] shadow-sm border">
                    <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-200 mb-6">
                      <h4 className="font-black text-amber-800 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5"/> 공휴일/재량휴업일 보정</h4>
                      <p className="text-sm font-bold text-amber-700 mb-4">현재 이번 주 보정값: <span className="text-amber-900">+{db.extraAttendDays || 0}일</span></p>
                      <button onClick={teacherAddHoliday} className="w-full bg-amber-500 text-white py-4 rounded-xl font-black text-lg hover:bg-amber-600">전체 출석일수 +1 (공휴일 적용)</button>
                      <p className="text-[11px] font-bold text-amber-500 mt-3 leading-relaxed">💡 이 버튼을 누르면 모든 학생의 이번 주 출석일수에 +1이 더해지고, 그 결과 5일이 된 학생에게 자동으로 🪙3 개근 보너스가 지급됩니다.</p>
                    </div>
                    <h4 className="font-black text-slate-700 mb-4">이번 주 출석 현황 ({getWeekKey()})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allStats.map(s => {
                        const bonus = db.attendanceBonus?.[getWeekKey()]?.[s.id];
                        return (
                          <div key={s.id} className={`p-4 rounded-xl border-2 ${bonus ? 'bg-yellow-50 border-yellow-300' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-black">{s.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-600">{s.weeklyCount}/5</span>
                                <span className="text-xs font-bold text-slate-400">⭐{s.streak}</span>
                                {bonus && <span className="text-[10px] bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-black">개근!</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 환경/점수 세팅 */}
              {adminSubTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-5 mb-6">환경 및 점수 세팅</h3>
                  <div className="bg-white p-8 rounded-[30px] shadow-sm border space-y-8">
                    <div className="bg-slate-50 p-6 rounded-[26px] border grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { title: '관리자 비번', color: 'blue', val: masterPwInput, setter: setMasterPwInput, field: 'masterPw', current: db.settings?.masterPw },
                        { title: '도움실 비번', color: 'indigo', val: helpPwInput, setter: setHelpPwInput, field: 'helpRoomPw', current: db.settings?.helpRoomPw }
                      ].map(p => (
                        <div key={p.field}>
                          <h4 className="font-black text-slate-700 mb-3 flex items-center gap-2"><Lock className={`w-5 h-5 text-${p.color}-500`}/> {p.title}</h4>
                          <div className="flex gap-2">
                            <input type="password" value={p.val} onChange={e=>p.setter(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} placeholder="새 비번" className="flex-1 p-3 rounded-xl border font-black outline-none"/>
                            <button onClick={() => { if (!p.val) return alert('입력!'); sync({ settings: { ...db.settings, [p.field]: p.val } }); alert('변경!'); p.setter(''); }} className={`bg-${p.color}-${p.color==='blue'?'600':'500'} text-white px-5 rounded-xl font-black`}>변경</button>
                          </div>
                          <p className="text-xs font-bold text-slate-400 mt-2">현재: {String(p.current)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-red-50 p-5 rounded-2xl border-2 border-red-200">
                      <h4 className="font-black text-red-800 mb-3 flex items-center gap-2"><LogOut className="w-5 h-5"/> 보안: 모든 기기 강제 로그아웃</h4>
                      <button onClick={revokeAllSessions} className="w-full bg-red-600 text-white py-3 rounded-xl font-black">모든 세션 무효화</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t-2">
                      <div>
                        <label className="block text-sm font-black text-slate-600 mb-3">타이틀</label>
                        <input type="text" value={db.settings?.title || ""} onChange={e=>sync({ settings: { ...db.settings, title: e.target.value } })} onFocus={lockEditing} onBlur={unlockEditing} className="w-full p-5 rounded-2xl bg-slate-50 border font-black text-lg outline-none"/>
                      </div>
                      <div>
                        <label className="block text-sm font-black text-slate-600 mb-3">이 주의 SEL 테마</label>
                        <select value={db.settings?.weeklyTheme || ""} onChange={e=>sync({ settings: { ...db.settings, weeklyTheme: e.target.value } })} className="w-full p-5 rounded-2xl bg-slate-50 border font-black text-lg outline-none">
                          {SEL_OPTIONS.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-black text-slate-600 mb-3">쉬는시간 기본(분)</label>
                        <input type="number" value={Math.floor((db.settings?.defaultBreakMs || DEFAULT_BREAK_MS)/60000)} onChange={e => sync({ settings: { ...db.settings, defaultBreakMs: toInt(e.target.value, 10)*60000 } })} onFocus={lockEditing} onBlur={unlockEditing} className="w-full p-5 rounded-2xl bg-slate-50 border font-black text-lg outline-none"/>
                      </div>
                    </div>
                    <div className="pt-6 border-t-2">
                      <button onClick={toggleCumulativeStats} className={`w-full py-4 rounded-2xl font-black text-lg shadow-md flex items-center justify-center gap-3 ${db.settings?.showCumulativeStats ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border-2'}`}>
                        <Eye className="w-5 h-5"/> 누적 스탯 표시 (교사 모드): {db.settings?.showCumulativeStats ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="pt-6 border-t-2 bg-indigo-50/50 p-8 rounded-[30px] border">
                      <h4 className="font-black text-xl text-indigo-900 mb-5 flex items-center gap-2"><Settings className="w-5 h-5"/> 점수 밸런스</h4>
                      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-5 rounded-2xl">
                        <input type="number" value={manualScoreInput} onChange={e=>setManualScoreInput(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} placeholder="명성 +/- (예: -20)" className="flex-1 p-3 rounded-xl border font-black outline-none"/>
                        <button onClick={() => { const v = toInt(manualScoreInput); if (!v) return; if (window.confirm(`${v}점 적용?`)) { sync({ manualRepOffset: (db.manualRepOffset||0) + v }); setManualScoreInput(""); } }} className="bg-indigo-600 text-white px-8 rounded-xl font-black">적용</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: '최고 목표', key: 'targetScore', section: null, color: 'indigo', def: 5000 },
                          { label: '기본 코인', key: 'praiseBasic', section: 'pointConfig', color: 'indigo', def: 10 },
                          { label: '테마 보너스', key: 'praiseBonus', section: 'pointConfig', color: 'pink', def: 15 },
                          { label: '위기 차감', key: 'penalty', section: 'pointConfig', color: 'red', def: 20 }
                        ].map(f => (
                          <div key={f.key} className="bg-white p-4 rounded-xl shadow-sm">
                            <label className={`block text-xs font-black text-${f.color}-600 mb-2`}>{f.label}</label>
                            <input type="number" value={f.section ? (db.settings?.[f.section]?.[f.key] ?? f.def) : (db.settings?.[f.key] ?? f.def)}
                                   onChange={e => { const v = toInt(e.target.value, f.def); const next = f.section ? { ...db.settings, [f.section]: { ...db.settings[f.section], [f.key]: v } } : { ...db.settings, [f.key]: v }; sync({ settings: next }); }}
                                   onFocus={lockEditing} onBlur={unlockEditing} className={`w-full p-3 rounded-lg border border-${f.color}-200 font-black text-${f.color}-600 outline-none`}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 초기화 / 마감 */}
              {adminSubTab === 'reset' && (
                <div className="animate-in fade-in space-y-6">
                  <h3 className="text-2xl font-black text-slate-800 border-l-8 border-red-500 pl-5 mb-6">초기화 / 마감</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-blue-50 border-4 border-blue-200 p-10 rounded-[40px] text-center shadow-lg">
                      <History className="w-16 h-16 text-blue-500 mx-auto mb-5" />
                      <h3 className="text-3xl font-black mb-4 text-blue-800">1학기 마감</h3>
                      <p className="font-bold text-blue-600 mb-6 text-sm">코인/숙련도/출석 리셋, 누적 보존</p>
                      <button onClick={closeSemester} className="bg-blue-600 text-white px-10 py-5 rounded-[30px] font-black text-xl shadow-xl">학기 마감</button>
                    </div>
                    <div className="bg-red-50 border-4 border-red-200 p-10 rounded-[40px] text-center shadow-lg">
                      <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-5" />
                      <h3 className="text-3xl font-black mb-4 text-red-800">공장 초기화</h3>
                      <p className="font-bold text-red-600 mb-6 text-sm">명단/세팅 제외 전체 삭제</p>
                      <button onClick={factoryReset} className="bg-red-600 text-white px-10 py-5 rounded-[30px] font-black text-xl shadow-xl">초기화</button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ═══ 모달 영역 ═══ */}
      {/* 온기 우체통 모달 */}
      {showPraiseModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[5001] p-4">
          <div className="bg-white p-10 rounded-[40px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 border-4 border-pink-100">
            <h3 className="text-3xl font-black text-pink-600 mb-8 flex items-center justify-center gap-3"><Heart className="w-8 h-8 fill-pink-500"/> 온기 제보</h3>
            <div className="space-y-5 mb-8">
              <select value={praiseTarget} onChange={e=>setPraiseTarget(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border-2 font-black text-lg outline-none">
                <option value="">누구를?</option>
                <option value="me" className="text-pink-600">🙋 나 자신</option>
                {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={praiseTag} onChange={e=>setPraiseTag(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border-2 font-black text-lg outline-none">
                <option value="">어떤 역량?</option>
                {SEL_OPTIONS.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
              </select>
              <textarea value={praiseText} onChange={e=>setPraiseText(e.target.value)} rows="5" placeholder={praiseTag ? PRAISE_GUIDES[praiseTag] : "💌"} className="w-full p-5 rounded-[26px] bg-pink-50 border-2 border-pink-100 font-black text-base outline-none text-pink-900 shadow-inner"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPraiseModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black">취소</button>
              <button onClick={submitPraise} className="flex-1 py-5 bg-pink-500 text-white rounded-2xl font-black shadow-xl flex justify-center items-center gap-2"><Send className="w-5 h-5"/> 보내기</button>
            </div>
          </div>
        </div>
      )}

      {/* 누가기록 모달 */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[5002] p-4">
          <div className="bg-white p-10 rounded-[40px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 border-4 border-yellow-200">
            <h3 className="text-2xl font-black text-yellow-700 mb-3 flex items-center gap-3"><StickyNote className="w-7 h-7"/> 누가기록</h3>
            <p className="text-sm font-bold text-yellow-600 mb-6">{allStats.find(s => s.id === showNoteModal)?.name} · {formatDate()}</p>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows="6" placeholder="관찰·일화·지도사항을 기록하세요." autoFocus className="w-full p-5 rounded-[26px] bg-yellow-50 border-2 border-yellow-200 font-black text-base outline-none text-yellow-900 shadow-inner mb-6"/>
            <div className="flex gap-3">
              <button onClick={() => { setShowNoteModal(null); setNoteText(""); }} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black">취소</button>
              <button onClick={submitNote} className="flex-1 py-4 bg-yellow-500 text-white rounded-2xl font-black shadow-xl">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 모달 */}
      {showModal === 'password' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-[5003]">
          <div className="bg-white rounded-[50px] p-12 w-full max-w-lg text-center shadow-2xl animate-in zoom-in-95 border-4 border-blue-100">
            <Lock className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h3 className="text-3xl font-black mb-8 text-blue-900">비밀번호</h3>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleLogin()} className="w-full text-center text-5xl tracking-[15px] font-black p-6 border-4 rounded-[30px] outline-none mb-8 bg-slate-50" autoFocus/>
            <div className="flex gap-3">
              <button onClick={() => { setShowModal(null); setPassword(""); }} className="flex-1 py-5 rounded-[26px] font-black text-slate-500 text-xl bg-slate-100">취소</button>
              <button onClick={handleLogin} className="flex-1 py-5 rounded-[26px] font-black bg-blue-600 text-white text-xl shadow-xl">접속</button>
            </div>
          </div>
        </div>
      )}

      {/* 롤링페이퍼 모달 */}
      {showRollingPaper && (() => {
        const s = allStats.find(x => x.id === showRollingPaper);
        if (!s) return null;
        const praises = safeArray(db.approvedPraises).filter(p => p.toId == s.id);
        return (
          <div className="fixed inset-0 bg-white z-[5004] overflow-auto flex flex-col items-center">
            <div className="w-full bg-slate-100 p-4 flex justify-between items-center print:hidden sticky top-0 z-50 border-b-2">
              <h3 className="font-black text-slate-700 flex items-center gap-2"><Printer className="w-5 h-5"/> 인쇄 미리보기</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2"><Printer className="w-4 h-4"/> 인쇄</button>
                <button onClick={() => setShowRollingPaper(null)} className="bg-white text-slate-600 border-2 px-6 py-2.5 rounded-xl font-black">닫기</button>
              </div>
            </div>
            <div className="max-w-5xl w-full p-14 print:p-0">
              <div className="text-center mb-12 border-b-4 border-pink-200 pb-8">
                <Heart className="w-16 h-16 text-pink-400 fill-pink-100 mx-auto mb-5"/>
                <h1 className="text-4xl font-black mb-3">달보드레 온기 롤링페이퍼</h1>
                <p className="text-2xl font-bold text-slate-500"><span className="text-pink-600 font-black bg-pink-50 px-3 py-1 rounded-xl">{s.name}</span>에게</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {praises.map(p => (
                  <div key={p.id} className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 p-6 rounded-[30px] break-inside-avoid">
                    <p className="text-xs font-black text-pink-600 mb-3 bg-white inline-block px-3 py-1 rounded-full">{SEL_OPTIONS.find(o=>o.name===p.tag)?.short}</p>
                    <p className="text-xl font-bold text-slate-800 leading-relaxed">"{p.text}"</p>
                    <p className="text-right text-xs font-bold text-slate-400 mt-4">- {p.date} -</p>
                  </div>
                ))}
                {praises.length === 0 && <div className="col-span-2 text-center py-20 text-slate-300 font-black text-2xl">아직 받은 사연 없음</div>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ NAV BAR ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-4 border-amber-100 px-4 py-4 flex justify-around items-center z-[4000] shadow-[0_-15px_50px_rgba(0,0,0,0.08)] pb-6 print:hidden">
        {[
          { id: 'dashboard', icon: <Target className="w-8 h-8"/>, label: db.settings?.menuNames?.[0] || "현황판", color: "text-blue-500" },
          { id: 'reflection', icon: <BookOpen className="w-8 h-8"/>, label: db.settings?.menuNames?.[1] || "성찰과 회복", color: "text-emerald-500" },
          { id: 'helproom', icon: <Users className="w-8 h-8"/>, label: db.settings?.menuNames?.[2] || "도움실", color: "text-indigo-500" },
          { id: 'admin', icon: <Settings className="w-8 h-8"/>, label: db.settings?.menuNames?.[3] || "관리실", color: "text-slate-600" }
        ].map(item => (
          <button key={item.id}
                  onClick={() => {
                    if (item.id === 'admin') { isAuthenticated === 'teacher' ? setActiveTab('admin') : setShowModal('password'); } 
                    else if (item.id === 'helproom') { (isAuthenticated === 'inspector' || isAuthenticated === 'teacher') ? setActiveTab('helproom') : setShowModal('password'); } 
                    else setActiveTab(item.id);
                  }}
                  className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${activeTab === item.id ? `${item.color} scale-110 -translate-y-3 drop-shadow-lg` : 'text-slate-400 opacity-60 hover:opacity-100 hover:-translate-y-1'}`}>
            {item.icon}
            <span className="text-[11px] font-black">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ═══ GLOBAL STYLE ═══ */}
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes flyToScore {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 1; transform: translateY(-20px) scale(1.3); }
          100% { opacity: 0; transform: translate(-400px, -400px) scale(0.5); }
        }
        @keyframes redFlash {
          0%, 100% { background-color: rgb(254,226,226); }
          50% { background-color: rgb(239,68,68); color: white; }
        }
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
        .fade-in { animation-name: fadeIn; }
        .zoom-in-95 { animation-name: zoomIn95; }
        .animate-spin-slow { animation: spin 5s linear infinite; }
        .animate-flyToScore { animation: flyToScore 1.3s ease-out forwards; }
        .animate-redFlash { animation: redFlash 0.6s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @media print {
          body { background: white !important; margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ⏱ TIMER WIDGET (헤더 우측 절반을 가득 채우는 대형 위젯)
// ══════════════════════════════════════════════════════════════
function TimerWidget({ status, display, timer, warningLevel, breakInput, setBreakInput, defaultBreakMin, onStopwatch, onCountdown, onPause, onResume, onReset, onBreak, lockEditing, unlockEditing }) {
  const isBreak = status === 'break';
  const isRunning = timer?.isRunning;
  const flashClass = isBreak && warningLevel === 3 ? 'animate-redFlash' : '';
  const bgClass = isBreak
    ? (warningLevel >= 2 ? 'bg-red-100 border-red-300' : 'bg-emerald-100 border-emerald-300')
    : 'bg-white/70 border-white';

  return (
    <div className={`p-6 rounded-[36px] border-4 shadow-lg backdrop-blur-sm ${bgClass} ${flashClass} flex flex-col justify-center h-full`}>
      <div className="flex items-center gap-2 mb-4">
        {isBreak ? <Coffee className="w-6 h-6 text-emerald-600"/> : <Timer className="w-6 h-6 text-slate-600"/>}
        <span className="text-sm font-black uppercase tracking-wider text-slate-600">
          {isBreak ? '쉬는 시간' : (status === 'class_sw' ? '스톱워치' : status === 'class_cd' ? '카운트다운' : '현재 수업 중')}
        </span>
      </div>

      <div className={`text-center py-6 rounded-3xl mb-4 shadow-inner ${isBreak && warningLevel >= 2 ? 'bg-red-500 text-white' : 'bg-white border-2 border-slate-100'}`}>
        <span className="text-7xl md:text-8xl font-black tracking-widest tabular-nums">{display}</span>
      </div>

      {status === 'idle' && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[1, 3, 5, 10].map(m => (
              <button key={m} onClick={() => onCountdown(m)} className="py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm transition-colors">{m}분</button>
            ))}
          </div>
          <button onClick={onStopwatch} className="w-full py-3 bg-indigo-500 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors">
            <Play className="w-5 h-5"/> 스톱워치 시작
          </button>
          <div className="flex gap-2 pt-3 border-t border-slate-200">
            <input type="number" value={breakInput} onChange={e=>setBreakInput(e.target.value)} onFocus={lockEditing} onBlur={unlockEditing} className="w-20 p-3 rounded-xl border-2 font-black text-base text-center outline-none focus:border-emerald-400"/>
            <button onClick={() => onBreak(Math.max(1, toInt(breakInput, defaultBreakMin)))} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors">
              <Coffee className="w-5 h-5"/> 지정된 시간만큼 쉬기
            </button>
          </div>
        </div>
      )}

      {status !== 'idle' && (
        <div className="flex gap-3">
          {isRunning
            ? <button onClick={onPause} className="flex-1 py-4 bg-yellow-500 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 hover:bg-yellow-600 transition-colors"><Pause className="w-5 h-5"/> 일시정지</button>
            : <button onClick={onResume} className="flex-1 py-4 bg-green-500 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"><Play className="w-5 h-5"/> 계속</button>}
          <button onClick={onReset} className="flex-1 py-4 bg-slate-400 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 hover:bg-slate-500 transition-colors"><RotateCcw className="w-5 h-5"/> 리셋 (종료)</button>
        </div>
      )}
    </div>
  );
}
