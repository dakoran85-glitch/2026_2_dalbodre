/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, ShieldCheck, Heart, Lock, History, Plus, Minus, AlertTriangle,
  Sparkles, Star, Target, Settings, Trash2, ShoppingCart, CheckCircle2,
  BookOpen, Briefcase, Zap, Crown, Coins, BarChart3, MessageSquare, Send,
  Gavel, Leaf, TreeDeciduous, Bird, Flame, Shield, Printer, Timer, Store, Eye,
  Play, Pause, RotateCcw, Coffee, Download, Copy, StickyNote, LogOut
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// 🔧 CONFIG
// ══════════════════════════════════════════════════════════════
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/";
const DB_PATH = "v10Data";
const POLL_INTERVAL_MS = 5000;
const AUTH_KEY = "dalbodre_auth_v10";
const ATTENDANCE_DEADLINE = { hour: 8, minute: 30 }; // 08:30 마감
const DEFAULT_BREAK_MS = 10 * 60 * 1000; // 쉬는시간 기본 10분

// ══════════════════════════════════════════════════════════════
// 🧰 UTILS
// ══════════════════════════════════════════════════════════════
const safeArray = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object' && val) return Object.values(val).filter(Boolean);
  return [];
};

const toInt = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const pad2 = (n) => String(n).padStart(2, '0');

// 📅 주(Week) 키 생성 (ISO 기준)
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
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, now + t0);
      
      gain.gain.setValueAtTime(volume, now + t0);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t0 + dur);
      
      osc.start(now + t0);
      osc.stop(now + t0 + dur);
    };

    switch (type) {
      case 'good':
        tone(600, 0.1);
        tone(1200, 0.2, 0.1);
        break;
      case 'bad':
        tone(300, 0.15, 0, 'sawtooth');
        tone(100, 0.2, 0.15, 'sawtooth');
        break;
      case 'buy':
        tone(500, 0.15, 0, 'square');
        tone(900, 0.15, 0.1, 'square');
        break;
      case 'jackpot':
        [440, 554.37, 659.25, 880].forEach((f, i) => tone(f, 0.2, i * 0.1, 'triangle', 0.2));
        break;
      case 'chime':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.6, i * 0.12, 'sine', 0.18));
        break;
      case 'softChime':
        [659.25, 830.61].forEach((f, i) => tone(f, 0.5, i * 0.18, 'sine', 0.15));
        break;
      case 'beep':
        tone(880, 0.12, 0, 'square', 0.2);
        tone(880, 0.12, 0.2, 'square', 0.2);
        tone(880, 0.12, 0.4, 'square', 0.2);
        break;
      case 'attend':
        tone(783.99, 0.1, 0, 'sine', 0.12);
        tone(1046.5, 0.2, 0.08, 'sine', 0.12);
        break;
      default:
        tone(600, 0.1);
    }
  } catch (_) {}
};

// ══════════════════════════════════════════════════════════════
// 🔐 AUTH (localStorage)
// ══════════════════════════════════════════════════════════════
const saveAuth = (role) => {
  const data = {
    role,
    issuedAt: Date.now(),
    expires: role === 'teacher' ? null : Date.now() + 24 * 60 * 60 * 1000
  };
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  } catch (_) {}
};

const loadAuth = (revokedAt) => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    
    const data = JSON.parse(raw);
    if (!data) return false;
    
    if (data.expires !== null && Date.now() > data.expires) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }
    
    if (revokedAt && data.issuedAt < revokedAt) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }
    
    return data.role;
  } catch (_) {
    return false;
  }
};

const clearAuth = () => {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (_) {}
};

// ══════════════════════════════════════════════════════════════
// 📚 STATIC DATA & GUIDES
// ══════════════════════════════════════════════════════════════
const ENNEAGRAM_DATA = {
  "1": { name: '1번(개혁가)', desc: '규칙과 책임을 잘 지켜요. 결과보다 과정의 꼼꼼함과 정직함을 알아주세요.' },
  "2": { name: '2번(조력자)', desc: '관계와 배려를 중시해요. "네 덕분에 고마워"라는 진심 어린 인사가 가장 큰 힘이 됩니다.' },
  "3": { name: '3번(성취자)', desc: '목표 지향적이에요. 구체적인 성과와 학급 기여를 명확히 인정해 주세요.' },
  "4": { name: '4번(예술가)', desc: '자신만의 개성과 감정을 중시해요. 독창적 아이디어를 존중해 주세요.' },
  "5": { name: '5번(사색가)', desc: '논리와 분석을 좋아해요. 혼자만의 시간과 지적 호기심을 칭찬해 주세요.' },
  "6": { name: '6번(충실가)', desc: '안전과 소속감을 중시해요. "우리가 함께한다"는 든든한 지지가 필요합니다.' },
  "7": { name: '7번(열정가)', desc: '재미와 자유를 추구해요. 긍정적 에너지와 호기심을 격려해 주세요.' },
  "8": { name: '8번(도전자)', desc: '강한 의지와 리더십. 스스로 결정할 기회와 신뢰를 부여해 주세요.' },
  "9": { name: '9번(평화주의자)', desc: '조화를 원해요. 다그치기보다 편안한 분위기에서 의견을 물어봐 주세요.' }
};

const DEFAULT_STUDENTS = [
  { id: 1, name: '금채율', role: '학급문고 정리', group: 1, isLeader: true, enneagram: '2' },
  { id: 2, name: '김라희', role: '우유 배달', group: 1, isLeader: false, enneagram: '9' },
  { id: 3, name: '김민지', role: '다툼 중재자', group: 1, isLeader: false, enneagram: '6' },
  { id: 4, name: '김수은', role: '생활태도 체크', group: 1, isLeader: false, enneagram: '1' },
  { id: 5, name: '김시우', role: '칠판 정리', group: 2, isLeader: true, enneagram: '3' },
  { id: 6, name: '박서정', role: '질서 관리', group: 2, isLeader: false, enneagram: '8' },
  { id: 7, name: '이하윤', role: '학급문고 정리', group: 2, isLeader: false, enneagram: '4' },
  { id: 8, name: '장세아', role: '문 닫기', group: 2, isLeader: false, enneagram: '7' },
  { id: 9, name: '최예나', role: '우유 배달', group: 3, isLeader: true, enneagram: '' },
  { id: 10, name: '허수정', role: '감찰사', group: 3, isLeader: false, enneagram: '' },
  { id: 11, name: '황지인', role: '칠판 정리', group: 3, isLeader: false, enneagram: '' },
  { id: 12, name: '김도운', role: '생활 배출물 관리', group: 3, isLeader: false, enneagram: '' },
  { id: 13, name: '김윤재', role: '과제 확인', group: 4, isLeader: true, enneagram: '' },
  { id: 14, name: '김정현', role: '질서 관리', group: 4, isLeader: false, enneagram: '' },
  { id: 15, name: '김태영', role: '복사물 관리', group: 4, isLeader: false, enneagram: '' },
  { id: 16, name: '김해준', role: '칠판 정리', group: 4, isLeader: false, enneagram: '' },
  { id: 17, name: '박동민', role: '과제 확인', group: 5, isLeader: true, enneagram: '' },
  { id: 18, name: '서이환', role: '가습기 관리', group: 5, isLeader: false, enneagram: '' },
  { id: 19, name: '윤호영', role: '우유 배달', group: 5, isLeader: false, enneagram: '' },
  { id: 20, name: '이서준', role: '과제 확인', group: 5, isLeader: false, enneagram: '' },
  { id: 21, name: '이승현', role: '신발장 관리', group: 6, isLeader: true, enneagram: '' },
  { id: 22, name: '임유성', role: '질서 관리', group: 6, isLeader: false, enneagram: '' },
  { id: 23, name: '장세형', role: '다툼 중재자', group: 6, isLeader: false, enneagram: '' },
  { id: 24, name: '조승원', role: '부착물 관리', group: 6, isLeader: false, enneagram: '' },
  { id: 25, name: '차민서', role: '신발장 관리', group: 6, isLeader: false, enneagram: '' },
  { id: 26, name: '배지훈', role: '문 닫기', group: 6, isLeader: false, enneagram: '' }
];

const SEL_OPTIONS = [
  { id: 'sel1', short: '자기 인식', name: '1단계: 자기 인식 (Self-awareness)' },
  { id: 'sel2', short: '자기 관리', name: '2단계: 자기 관리 (Self-management)' },
  { id: 'sel3', short: '사회적 인식', name: '3단계: 사회적 인식 (Social awareness)' },
  { id: 'sel4', short: '관계 기술', name: '4단계: 관계 기술 (Relationship skills)' },
  { id: 'sel5', short: '책임있는 결정', name: '5단계: 책임 있는 의사결정 (Responsible decision-making)' }
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

// 🚨 초월보호막(shieldPoints) 제거 및 초기 데이터 세팅
const INITIAL_DB = {
  students: DEFAULT_STUDENTS,
  rolesList: ['학급문고 정리', '우유 배달', '다툼 중재자', '현령', '감찰사'],
  settings: {
    title: "달보드레 행복 교실 🌸",
    menuNames: ["행복 현황판", "성찰과 회복", "도움실", "관리실"],
    targetScore: 5000,
    forceShopOpen: false,
    weeklyTheme: "4단계: 관계 기술 (Relationship skills)",
    masterPw: "6505",
    helpRoomPw: "1111",
    showCumulativeStats: false,
    defaultBreakMs: DEFAULT_BREAK_MS,
    pointConfig: { praiseBasic: 10, praiseBonus: 15, penalty: 20 },
    authRevokedAt: 0
  },
  coopQuest: { 
    q1Name: "다 함께 바른 생활", q1: 50, 
    q2Name: "환대와 응원", q2: 20, 
    q3Name: "전담수업 태도 우수", q3: 20, 
    q4Name: "사이좋은 일주일", q4: 100, 
    goodWeek: 0 
  },
  timeAttack: { isActive: false, title: "", rewardRep: 100, endTime: null, cleared: [] },
  timer: { mode: 'idle', startedAt: null, endTime: null, duration: null, isRunning: false, pausedElapsed: null, pausedRemaining: null },
  shopItems: [],
  pendingShopItems: [],
  funding: [],
  roleExp: {},
  bonusCoins: {},
  usedCoins: {},
  penaltyCount: {},
  studentStatus: {},
  pendingReflections: [],
  pendingPraises: [],
  approvedPraises: [],
  donations: [],
  manualRepOffset: 0,
  allTime: { exp: {}, penalty: {}, donate: {}, fund: {} },
  attendance: {},
  attendanceBonus: {},
  streakWeeks: {},
  notes: {},
  extraAttendDays: 0
};
// ══════════════════════════════════════════════════════════════
// 🎨 VISUAL HELPER (세계수 렌더링 - 겹침 방지 절대 크기 적용)
// ══════════════════════════════════════════════════════════════
const renderEvolution = (level) => {
  switch (level) {
    case 0: 
      return <div className="flex items-center gap-4 text-emerald-400 animate-pulse"><Leaf className="w-[100px] h-[100px] md:w-[130px] md:h-[130px]"/> <Sparkles className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] text-yellow-400"/></div>;
    case 1: 
      return <div className="flex items-center gap-4 text-emerald-500 animate-bounce"><TreeDeciduous className="w-[130px] h-[130px] md:w-[170px] md:h-[170px]"/> <Bird className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] text-orange-400"/></div>;
    case 2: 
      return <div className="flex items-center gap-4 text-pink-400"><TreeDeciduous className="w-[160px] h-[160px] md:w-[210px] md:h-[210px] fill-pink-200"/> <Bird className="w-[100px] h-[100px] md:w-[130px] md:h-[130px] text-orange-500 animate-pulse"/></div>;
    case 3: 
      return <div className="flex items-center gap-5 text-yellow-500 drop-shadow-xl"><TreeDeciduous className="w-[190px] h-[190px] md:w-[250px] md:h-[250px] fill-yellow-200"/> <Flame className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] text-red-500 animate-bounce"/></div>;
    case 4:
    case 5: 
      return <div className="flex items-center gap-5 text-yellow-300 drop-shadow-[0_0_50px_rgba(250,204,21,0.8)]"><TreeDeciduous className="w-[220px] h-[220px] md:w-[300px] md:h-[300px] fill-yellow-100 animate-pulse"/> <Bird className="w-[140px] h-[140px] md:w-[190px] md:h-[190px] fill-red-500 text-red-600 animate-bounce"/></div>;
    default: 
      return null;
  }
};
// =========== [1부 코드의 끝] ===========
// ══════════════════════════════════════════════════════════════
// 🧩 MAIN APP COMPONENT
// ══════════════════════════════════════════════════════════════
export default function App() {
  // ── UI STATE ────────────────────────────────────────────────
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

  // ── FORM STATE ──────────────────────────────────────────────
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

  // ── TIMER STATE ─────────────────────────────────────────────
  const [timerDisplay, setTimerDisplay] = useState("00:00");
  const [timerStatus, setTimerStatus] = useState('idle');
  const [breakInput, setBreakInput] = useState("10");
  const [breakWarningLevel, setBreakWarningLevel] = useState(0);

  // ── DB STATE ────────────────────────────────────────────────
  const [db, setDb] = useState(INITIAL_DB);
  const isEditingRef = useRef(false);
  
  const lockEditing = () => { isEditingRef.current = true; };
  const unlockEditing = () => { isEditingRef.current = false; };
  
  const lastNotifiedRef = useRef({});
  const dbRef = useRef(INITIAL_DB);

  // ── 인증 복원 ──────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const saved = loadAuth(db.settings?.authRevokedAt || 0);
    if (saved) {
      setIsAuthenticated(saved);
    } else {
      setIsAuthenticated(false);
    }
  }, [isLoading, db.settings?.authRevokedAt]);

  // ── Firebase 실시간 동기화 ──────────────────────────────────
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
    const interval = setInterval(fetchLive, POLL_INTERVAL_MS);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  // ── 주간 출석 자동 정리 ─────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    
    const currentDb = dbRef.current;
    const currentWeek = getWeekKey();
    const attendance = currentDb.attendance || {};
    const oldKeys = Object.keys(attendance).filter(k => k !== currentWeek);
    
    if (oldKeys.length === 0) return;

    const newStreaks = { ...(currentDb.streakWeeks || {}) };
    const students = safeArray(currentDb.students);
    
    oldKeys.forEach(k => {
      const weekData = attendance[k] || {};
      students.forEach(s => {
        const totalDays = (safeArray(weekData[s.id])).length + (currentDb.extraAttendDays || 0);
        if (totalDays < 5) newStreaks[s.id] = 0;
      });
    });

    const cleanedAttendance = { [currentWeek]: attendance[currentWeek] || {} };
    const cleanedBonus = { [currentWeek]: (currentDb.attendanceBonus || {})[currentWeek] || {} };
    
    sync({ 
      attendance: cleanedAttendance, 
      attendanceBonus: cleanedBonus, 
      streakWeeks: newStreaks, 
      extraAttendDays: 0 
    });
  }, [isLoading]);

  // ── 타임어택 카운트다운 ───────────────────────────────────
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

  // ── 타이머 구동 로직 ──────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const t = db.timer || {};
      const mode = t.mode || 'idle';
      setTimerStatus(mode);
      
      if (mode === 'idle') { 
        setTimerDisplay("00:00"); 
        setBreakWarningLevel(0); 
        return; 
      }

      let ms = 0;
      if (mode === 'class_sw') {
        ms = t.isRunning ? Date.now() - t.startedAt : (t.pausedElapsed || 0);
      } else if (mode === 'class_cd' || mode === 'break') {
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
          playSound(sound); 
          setBreakWarningLevel(level);
        };
        
        if (sec === 180) notify(1, 'softChime');
        else if (sec === 60) notify(2, 'softChime');
        else if (sec <= 30 && sec > 0 && sec % 5 === 0) notify(3, 'beep');
        else if (sec > 180) setBreakWarningLevel(0);

        if (ms <= 0) {
          playSound('chime'); 
          setBreakWarningLevel(0);
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

  // ── 동기화 함수 (SYNC) ────────────────────────────────────
  const sync = async (updates) => {
    setDb(prev => {
      const next = { ...prev, ...updates };
      dbRef.current = next;
      return next;
    });
    try { 
      await fetch(`${DATABASE_URL}${DB_PATH}.json`, { 
        method: 'PATCH', 
        body: JSON.stringify(updates) 
      }); 
    } catch (_) {}
  };

  // ══════════════════════════════════════════════════════════
  // 🧮 파생 상태 (Derived State) 연산
  // ══════════════════════════════════════════════════════════
  const safeStudents = safeArray(db.students);

  const allStats = useMemo(() => safeStudents.map(s => {
    const exp = db.roleExp[s.id] || 0;
    const bonus = db.bonusCoins?.[s.id] || 0;
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
      ...s, exp, coins, mastery, 
      status: db.studentStatus[s.id] || 'normal',
      atExp: db.allTime?.exp?.[s.id] || 0, 
      atDonate: db.allTime?.donate?.[s.id] || 0,
      atFund: db.allTime?.fund?.[s.id] || 0, 
      atPen: db.allTime?.penalty?.[s.id] || 0,
      weeklyCount, streak, attendedToday, 
      notes: safeArray(db.notes?.[s.id])
    };
  }), [safeStudents, db.roleExp, db.bonusCoins, db.usedCoins, db.studentStatus, db.allTime, db.attendance, db.streakWeeks, db.notes]);

  const activeStudents = useMemo(() => allStats.filter(s => s.status !== 'crisis'), [allStats]);

  // 🔥 세계수 진화 연산 로직 (초월 보호막 영구 제거)
  const { classReputation, evolutionLevel, progressPercent } = useMemo(() => {
    const target = db.settings?.targetScore || 5000;
    const penaltyUnit = db.settings?.pointConfig?.penalty || 20;
    
    const raw = allStats.reduce((sum, s) =>
      sum + (s.exp * 10) + (db.bonusCoins?.[s.id] || 0) - ((db.penaltyCount[s.id] || 0) * penaltyUnit), 0)
      + safeArray(db.donations).reduce((sum, d) => sum + (d.amount || 0), 0)
      + (db.manualRepOffset || 0);
    
    let r = Math.max(0, raw);
    if (r > target) r = target; // 최대 목표 점수로 제한
    
    const step = Math.max(1, target / 5);
    const level = Math.min(Math.floor(r / step), 5);
    const pct = level >= 5 ? 100 : ((r % step) / step) * 100;
    
    return { classReputation: r, evolutionLevel: level, progressPercent: pct };
  }, [allStats, db.penaltyCount, db.bonusCoins, db.donations, db.settings, db.manualRepOffset]);

  const sortedDashboardStats = useMemo(() => {
    if (db.settings?.showCumulativeStats) return [...allStats].sort((a,b) => a.id - b.id);
    const order = { crisis: 0, pending: 1, normal: 2 };
    return [...allStats].sort((a,b) => order[a.status] !== order[b.status] ? order[a.status] - order[b.status] : a.id - b.id);
  }, [allStats, db.settings?.showCumulativeStats]);

  const groupedByGroupStats = useMemo(() => [...allStats].sort((a,b) => a.group - b.group || a.id - b.id), [allStats]);
  const topExp    = useMemo(() => [...allStats].sort((a,b)=>b.atExp-a.atExp).filter(s=>s.atExp>0).slice(0,5), [allStats]);
  const topDonate = useMemo(() => [...allStats].sort((a,b)=>b.atDonate-a.atDonate).filter(s=>s.atDonate>0).slice(0,5), [allStats]);
  const topFund   = useMemo(() => [...allStats].sort((a,b)=>b.atFund-a.atFund).filter(s=>s.atFund>0).slice(0,5), [allStats]);
  
  const isShopOpen = useMemo(() => db.settings?.forceShopOpen || new Date().getDay() === 4, [db.settings?.forceShopOpen]);
  const selectedRefStudentPraises = useMemo(() => !refTarget ? [] : safeArray(db.approvedPraises).filter(p => p.toId == refTarget), [refTarget, db.approvedPraises]);
  const randomPraise = selectedRefStudentPraises.length ? selectedRefStudentPraises[Math.floor(Math.random() * selectedRefStudentPraises.length)] : null;

  // ══════════════════════════════════════════════════════════════
  // 🎮 핸들러 (HANDLERS)
  // ══════════════════════════════════════════════════════════════

  const toggleAttendance = (sId) => {
    const todayIdx = getTodayWeekdayIdx();
    if (todayIdx < 0) return alert("주말에는 출석 체크를 할 수 없어요.");
    
    const weekKey = getWeekKey();
    const currentDb = dbRef.current;
    const weekData = currentDb.attendance?.[weekKey] || {};
    const days = safeArray(weekData[sId]);
    const alreadyToday = days.includes(todayIdx);

    if (!alreadyToday && !isAttendanceOpen()) return alert("출석 시간이 지났어요. (08:30 마감)");

    const newDays = alreadyToday ? days.filter(d => d !== todayIdx) : [...days, todayIdx].sort();
    const newWeekData = { ...weekData, [sId]: newDays };
    
    const updates = { 
      attendance: { ...currentDb.attendance, [weekKey]: newWeekData },
      manualRepOffset: (currentDb.manualRepOffset || 0) + (alreadyToday ? -1 : 1)
    };

    if (!alreadyToday) {
      playSound('attend');
      setAttendAnim({ id: sId, ts: Date.now() });
      setTimeout(() => setAttendAnim(null), 1400);
      
      const totalDays = newDays.length + (currentDb.extraAttendDays || 0);
      const alreadyBonus = currentDb.attendanceBonus?.[weekKey]?.[sId];
      
      if (totalDays >= 5 && !alreadyBonus) {
        updates.bonusCoins = { ...currentDb.bonusCoins, [sId]: (currentDb.bonusCoins?.[sId] || 0) + 3 };
        updates.attendanceBonus = { ...currentDb.attendanceBonus, [weekKey]: { ...(currentDb.attendanceBonus?.[weekKey] || {}), [sId]: true } };
        updates.streakWeeks = { ...currentDb.streakWeeks, [sId]: (currentDb.streakWeeks?.[sId] || 0) + 1 };
        setTimeout(() => playSound('jackpot'), 600);
        setTimeout(() => alert(`🎉 ${allStats.find(x=>x.id===sId)?.name} 개근 달성! 🪙3 보너스!`), 900);
      }
    }
    sync(updates);
  };

  const teacherAddHoliday = () => {
    if (!window.confirm("공휴일/재량휴업일로 간주하여 모든 학생의 이번 주 출석일수에 +1을 반영할까요?")) return;
    
    const currentDb = dbRef.current;
    const next = (currentDb.extraAttendDays || 0) + 1;
    const weekKey = getWeekKey();
    const updates = { extraAttendDays: next };
    const weekData = currentDb.attendance?.[weekKey] || {};
    
    let newBonus = { ...(currentDb.attendanceBonus?.[weekKey] || {}) };
    let newStreaks = { ...(currentDb.streakWeeks || {}) };
    let newCoins = { ...(currentDb.bonusCoins || {}) };
    let bonusCount = 0;
    
    safeArray(currentDb.students).forEach(s => {
      const days = safeArray(weekData[s.id]);
      const total = days.length + next;
      if (total >= 5 && !newBonus[s.id]) {
        newBonus[s.id] = true;
        newStreaks[s.id] = (newStreaks[s.id] || 0) + 1;
        newCoins[s.id] = (newCoins[s.id] || 0) + 3;
        bonusCount++;
      }
    });
    
    updates.attendanceBonus = { ...currentDb.attendanceBonus, [weekKey]: newBonus };
    updates.streakWeeks = newStreaks;
    updates.bonusCoins = newCoins;
    
    sync(updates);
    alert(`📅 전체 출석일수 +1 반영 완료 (현재 보정: +${next}일, 추가 개근 달성 ${bonusCount}명)`);
  };

  const openNoteModal = (sId) => {
    if (isAuthenticated !== 'teacher') return setShowModal('password');
    setShowNoteModal(sId);
    setNoteText("");
  };

  const submitNote = () => {
    if (!noteText.trim()) return alert("내용을 입력하세요.");
    const sId = showNoteModal;
    const note = { id: Date.now(), date: formatDate(), text: noteText.trim() };
    sync({ notes: { ...db.notes, [sId]: [...safeArray(db.notes?.[sId]), note] } });
    setShowNoteModal(null);
    setNoteText("");
    alert("📝 누가기록 저장 완료!");
  };

  const deleteNote = (sId, noteId) => {
    if (!window.confirm("삭제할까요?")) return;
    sync({ notes: { ...db.notes, [sId]: safeArray(db.notes?.[sId]).filter(n => n.id !== noteId) } });
  };

  const buildStudentReport = (s) => {
    const praises = safeArray(db.approvedPraises).filter(p => p.toId == s.id);
    const reflections = safeArray(db.pendingReflections).filter(r => r.sId == s.id);
    const notes = safeArray(db.notes?.[s.id]);
    
    let md = `## ${s.name} (${s.group}모둠 · ${s.role}${s.isLeader ? ' · 모둠장' : ''})\n`;
    if (s.enneagram && ENNEAGRAM_DATA[s.enneagram]) md += `- 에니어그램: ${ENNEAGRAM_DATA[s.enneagram].name}\n`;
    md += `- 누적 완수: ${s.atExp}회 / 기부: ${s.atDonate}🪙 / 펀딩: ${s.atFund}🪙 / 위기: ${s.atPen}회\n`;
    md += `- 이번 주 출석: ${s.weeklyCount}/5 · 누적 개근: ${s.streak}주\n`;
    md += `- 숙련도: ${s.mastery.label} (${s.exp})\n\n`;
    
    md += `### 받은 칭찬 (${praises.length}건)\n`;
    if (praises.length) praises.forEach(p => { md += `- [${p.date}] ${SEL_OPTIONS.find(o=>o.name===p.tag)?.short||'-'}: "${p.text}"\n`; });
    else md += `- (없음)\n`;
    
    md += `\n### 제출한 성찰 (${reflections.length}건)\n`;
    if (reflections.length) reflections.forEach(r => { md += `- [${r.date}] ${SEL_OPTIONS.find(o=>o.name===r.tag)?.short||'-'}: "${r.text}"\n`; });
    else md += `- (없음)\n`;
    
    md += `\n### 누가기록 (${notes.length}건)\n`;
    if (notes.length) notes.forEach(n => { md += `- [${n.date}] ${n.text}\n`; });
    else md += `- (없음)\n`;
    
    return md;
  };

  const exportStudent = (sId) => {
    const s = allStats.find(x => x.id == sId);
    if (!s) return;
    downloadOrCopy(`# 달보드레 학생 리포트\n생성일: ${formatDate()}\n\n${buildStudentReport(s)}`, `report_${s.name}_${formatDate()}.md`);
  };

  const exportAll = () => {
    let md = `# 달보드레 학급 전체 리포트\n생성일: ${formatDate()}\n총 ${allStats.length}명 · 명성: ${classReputation}p\n\n---\n\n`;
    allStats.forEach(s => { md += buildStudentReport(s) + "\n---\n\n"; });
    downloadOrCopy(md, `class_report_${formatDate()}.md`);
  };

  const downloadOrCopy = (text, filename) => {
    try { navigator.clipboard.writeText(text); } catch(_) {}
    try {
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      alert(`📋 텍스트가 복사되었고, 마크다운 파일로도 다운로드되었습니다!`);
    } catch (e) { alert("다운로드 실패. 클립보드에는 복사되었습니다."); }
  };

  const startStopwatch = () => sync({ timer: { mode: 'class_sw', startedAt: Date.now(), endTime: null, duration: null, isRunning: true, pausedElapsed: 0, pausedRemaining: null } });
  const startCountdown = (minutes) => { const ms = minutes * 60 * 1000; sync({ timer: { mode: 'class_cd', startedAt: null, endTime: Date.now() + ms, duration: ms, isRunning: true, pausedElapsed: null, pausedRemaining: ms } }); };
  
  const pauseTimer = () => {
    const t = db.timer || {}; if (!t.isRunning) return;
    if (t.mode === 'class_sw') sync({ timer: { ...t, isRunning: false, pausedElapsed: Date.now() - t.startedAt } });
    else if (t.mode === 'class_cd' || t.mode === 'break') sync({ timer: { ...t, isRunning: false, pausedRemaining: Math.max(0, t.endTime - Date.now()) } });
  };
  
  const resumeTimer = () => {
    const t = db.timer || {}; if (t.isRunning) return;
    if (t.mode === 'class_sw') sync({ timer: { ...t, isRunning: true, startedAt: Date.now() - (t.pausedElapsed || 0) } });
    else if (t.mode === 'class_cd' || t.mode === 'break') sync({ timer: { ...t, isRunning: true, endTime: Date.now() + (t.pausedRemaining || 0) } });
  };
  
  const resetTimer = () => sync({ timer: { mode: 'idle', startedAt: null, endTime: null, duration: null, isRunning: false, pausedElapsed: null, pausedRemaining: null } });
  
  const startBreak = (minutes) => {
    const ms = minutes * 60 * 1000;
    lastNotifiedRef.current = {};
    sync({ timer: { mode: 'break', startedAt: null, endTime: Date.now() + ms, duration: ms, isRunning: true, pausedElapsed: null, pausedRemaining: ms } });
  };

  const handleExpAdjust = (id, delta) => {
    if (delta > 0) playSound('good');
    sync({ 
      roleExp: { ...db.roleExp, [id]: Math.max(0, (db.roleExp[id]||0) + delta) }, 
      allTime: { ...db.allTime, exp: { ...db.allTime.exp, [id]: Math.max(0, (db.allTime.exp?.[id]||0) + delta) } } 
    });
  };

  const handleGivePenalty = (id) => {
    if (!isAuthenticated) return setShowModal('password');
    if (!window.confirm("위기 지정할까요?")) return;
    playSound('bad');
    sync({ 
      studentStatus: { ...db.studentStatus, [id]: 'crisis' }, 
      penaltyCount: { ...db.penaltyCount, [id]: (db.penaltyCount[id] || 0) + 1 }, 
      allTime: { ...db.allTime, penalty: { ...db.allTime.penalty, [id]: (db.allTime.penalty?.[id] || 0) + 1 } } 
    });
  };

  const handleDonate = (sId, amount) => {
    const u = allStats.find(s => s.id == sId);
    if (!u || u.coins < amount) return alert("코인 부족!");
    playSound('buy');
    sync({ 
      usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, 
      donations: [{ id: Date.now(), name: u.name, amount }, ...safeArray(db.donations)].slice(0, 15), 
      allTime: { ...db.allTime, donate: { ...db.allTime.donate, [sId]: (db.allTime.donate?.[sId] || 0) + amount } } 
    });
    alert("기부 완료! ✨");
  };

  const handleFund = (fId, sId, amount) => {
    const u = allStats.find(s => s.id == sId);
    if (!u || u.coins < amount) return alert("코인 부족!");
    playSound('buy');
    sync({ 
      usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, 
      funding: safeArray(db.funding).map(f => f.id === fId ? { ...f, current: (Number(f.current)||0) + amount } : f), 
      allTime: { ...db.allTime, fund: { ...db.allTime.fund, [sId]: (db.allTime.fund?.[sId] || 0) + amount } } 
    });
    alert("투자 완료!");
  };

  const addCoopScore = (points, title) => {
    playSound('jackpot');
    sync({ manualRepOffset: (db.manualRepOffset || 0) + points });
    alert(`🎉 [${title}] 달성! +${points}점!`);
  };

  const adjustGoodWeek = (delta) => {
    const next = Math.max(0, Math.min(5, (db.coopQuest?.goodWeek || 0) + delta));
    sync({ coopQuest: { ...db.coopQuest, goodWeek: next } });
    if (delta > 0) playSound('good');
  };

  const completeGoodWeek = () => {
    playSound('jackpot');
    const reward = db.coopQuest?.q4 || 100;
    sync({ coopQuest: { ...db.coopQuest, goodWeek: 0 }, manualRepOffset: (db.manualRepOffset || 0) + reward });
    alert(`🌟 사이 좋은 일주일! +${reward}점!`);
  };

  const handleStartTimeAttack = () => {
    const mins = toInt(taMins, 10);
    const reward = toInt(taReward, 100);
    const title = taTitle.trim() || "미션";
    if (mins <= 0 || reward <= 0) return alert("값을 확인하세요.");
    if (!window.confirm(`${mins}분 / ${reward}p로 타임어택을 시작할까요?`)) return;
    sync({ timeAttack: { isActive: true, title, rewardRep: reward, endTime: Date.now() + mins*60*1000, cleared: [] } });
  };

  const handleCompleteTimeAttack = () => {
    playSound('jackpot');
    sync({ 
      manualRepOffset: (db.manualRepOffset || 0) + (db.timeAttack?.rewardRep || 0), 
      timeAttack: { isActive: false, title: "", rewardRep: 0, endTime: null, cleared: [] } 
    });
    alert("🎉 타임어택 미션 성공!");
  };

  const handleFailTimeAttack = () => {
    sync({ timeAttack: { isActive: false, title: "", rewardRep: 0, endTime: null, cleared: [] } });
  };

  const toggleTimeAttackClear = (id) => {
    if (!db.timeAttack?.isActive) return;
    const cleared = safeArray(db.timeAttack.cleared).map(Number);
    const isDone = cleared.includes(Number(id));
    const next = isDone ? cleared.filter(c => c !== Number(id)) : [...cleared, Number(id)];
    sync({ timeAttack: { ...db.timeAttack, cleared: next } });
    if (!isDone) playSound('good');
  };

  // ⭐ V10.3 핵심: 장인 아이템 결재 시 creatorId 함께 저장
  const submitArtisanItem = () => {
    if (!artisanTarget || !artisanItemName || !artisanItemPrice) return alert("입력 오류");
    const artisan = allStats.find(s => s.id == artisanTarget);
    if (!artisan || artisan.exp < 20) return alert("장인만 가능");
    
    sync({ 
      pendingShopItems: [
        { 
          id: Date.now(), 
          name: artisanItemName, 
          price: toInt(artisanItemPrice), 
          creator: artisan.name, 
          creatorId: artisan.id // 로열티 지급을 위한 고유 ID 저장
        }, 
        ...safeArray(db.pendingShopItems)
      ] 
    });
    
    setArtisanTarget(""); 
    setArtisanItemName(""); 
    setArtisanItemPrice(""); 
    alert("결재를 올렸습니다!");
  };

  const submitPraise = () => {
    if (!praiseTarget || !praiseTag || !praiseText) return alert("빈칸 확인!");
    sync({ pendingPraises: [{ id: Date.now(), toId: praiseTarget, tag: praiseTag, text: praiseText, date: formatDate() }, ...safeArray(db.pendingPraises)] });
    setShowPraiseModal(false); setPraiseTarget(""); setPraiseText(""); setPraiseTag("");
    alert("온기 배달 완료!");
  };

  const submitReflection = () => {
    if (!refTarget || !refTag || !refText) return alert("빈칸 확인!");
    sync({ 
      pendingReflections: [{ id: Date.now(), sId: refTarget, tag: refTag, text: refText, date: formatDate() }, ...safeArray(db.pendingReflections)], 
      studentStatus: { ...db.studentStatus, [refTarget]: 'pending' } 
    });
    setRefTarget(""); setRefText(""); setRefTag("");
    alert("다짐 제출 완료!");
  };

  const approvePraise = (p) => {
    const target = allStats.find(u => u.id == p.toId);
    if (target?.status === 'crisis') return alert("위기 학생에게는 지급 불가. 성찰이 먼저입니다.");
    
    const next = safeArray(db.pendingPraises).filter(pr => pr.id !== p.id);
    const app = [p, ...safeArray(db.approvedPraises)].slice(0, 20);
    const themeMatch = p.tag === db.settings?.weeklyTheme;
    const earned = themeMatch ? (db.settings?.pointConfig?.praiseBonus || 15) : (db.settings?.pointConfig?.praiseBasic || 10);
    const updates = { pendingPraises: next, approvedPraises: app };
    
    if (p.toId !== 'me') {
      updates.bonusCoins = { ...db.bonusCoins, [p.toId]: (db.bonusCoins?.[p.toId] || 0) + earned };
      updates.allTime = { ...db.allTime, exp: { ...db.allTime.exp, [p.toId]: (db.allTime.exp?.[p.toId] || 0) + 1 } };
    }
    sync(updates);
    alert(`온기 승인 완료! (+${earned}🪙)`);
    playSound('good');
  };

  const handleLogin = () => {
    const isMaster = password === (db.settings?.masterPw || "6505");
    const isHelp = password === (db.settings?.helpRoomPw || "1111");
    if (isMaster) {
      setIsAuthenticated('teacher'); saveAuth('teacher');
      setActiveTab('admin'); setShowModal(null); setPassword("");
    } else if (isHelp) {
      setIsAuthenticated('inspector'); saveAuth('inspector');
      setActiveTab('helproom'); setShowModal(null); setPassword("");
    } else {
      alert("비밀번호 오류 ❌"); playSound('bad');
    }
  };

  const handleLogout = () => {
    clearAuth(); setIsAuthenticated(false); setActiveTab('dashboard');
  };

  const revokeAllSessions = () => {
    if (!window.confirm("모든 기기에서 강제 로그아웃합니다. 본 기기도 로그아웃됩니다.")) return;
    sync({ settings: { ...db.settings, authRevokedAt: Date.now() } });
    clearAuth(); setIsAuthenticated(false); setActiveTab('dashboard');
    alert("모든 세션을 무효화했습니다.");
  };

  const handleStudentFieldChange = (id, field, value) => {
    sync({ students: safeStudents.map(st => st.id === id ? { ...st, [field]: value } : st) });
  };

  const handleAddStudent = () => {
    if (!newStudentName) return;
    const nextId = safeStudents.length ? Math.max(...safeStudents.map(s => s.id)) + 1 : 1;
    sync({ 
      students: [...safeStudents, { id: nextId, name: newStudentName, role: '향리', group: toInt(newStudentGroup, 1), isLeader: false, enneagram: newStudentEnneagram }] 
    });
    setNewStudentName("");
    alert("전입생 추가 완료!");
  };

  const handleRemoveStudent = (id) => {
    if (window.confirm("학생을 삭제하시겠습니까?")) sync({ students: safeStudents.filter(s => s.id !== id) });
  };

  const closeSemester = () => {
    if (window.prompt("마감하시겠습니까? '마감'을 입력하세요.") !== "마감") return;
    sync({ 
      roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, 
      pendingReflections: [], pendingPraises: [], donations: [], attendance: {}, 
      attendanceBonus: {}, streakWeeks: {}, notes: {} 
    });
    alert("학기 마감이 완료되었습니다.");
  };

  const factoryReset = () => {
    if (window.prompt("공장 초기화를 진행하시겠습니까? '초기화'를 입력하세요.") !== "초기화") return;
    sync({
      roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {},
      pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [],
      pendingShopItems: [], shopItems: [], funding: [],
      manualRepOffset: 0, shieldPoints: 0,
      allTime: { exp: {}, penalty: {}, donate: {}, fund: {} },
      timeAttack: { isActive: false, title: "", rewardRep: 100, endTime: null, cleared: [] },
      attendance: {}, attendanceBonus: {}, streakWeeks: {}, notes: {}, extraAttendDays: 0
    });
    alert("전체 데이터가 초기화되었습니다.");
  };

  const toggleCumulativeStats = () => {
    sync({ settings: { ...db.settings, showCumulativeStats: !db.settings?.showCumulativeStats } });
  };

// =========== [2부 코드의 끝] ===========
// ══════════════════════════════════════════════════════════════
// 🖼️ 화면 렌더링 (JSX RETURN)
// ══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-amber-50/50 pb-32 font-sans text-slate-800 transition-all">

{/* ═══ HEADER: 완벽한 5:5 2분할 레이아웃 ═══ */}
      <header className="bg-[#FFF5E1] p-6 md:p-12 relative overflow-hidden border-b-4 border-white flex flex-col gap-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] opacity-70 pointer-events-none"></div>
        
        {/* 상단 타이틀 (목표 달성 글씨 완전 삭제) */}
        <div className="max-w-[1400px] w-full mx-auto relative z-10 flex items-center">
          <h1 className="text-amber-800 font-black text-2xl flex items-center gap-3">
            <Sparkles className="text-amber-500 w-8 h-8"/> {db.settings?.title}
          </h1>
        </div>

        {/* 5:5 메인 분할 (좌: 점수/세계수/게이지 | 우: 타임워치) */}
        <div className="max-w-[1400px] w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* 📍 좌측 영역 (화면의 딱 50% 차지) */}
          <div className="flex flex-col justify-center gap-10 w-full">
            
            {/* 1층: 초대형 점수 & 세계수 (gap-12로 겹침 원천 차단) */}
            <div className="flex flex-row items-center justify-center lg:justify-start gap-12 pl-2">
              <div className="flex items-baseline">
                <span className="text-[130px] md:text-[180px] font-black text-[#6B4423] drop-shadow-md tracking-tighter leading-none">
                  {classReputation}
                </span>
                <span className="text-6xl md:text-7xl font-black text-amber-500 ml-2">p</span>
              </div>
              
              {/* 확대경(scale) 속성을 빼서 주변을 밀어내게 만듦 */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-yellow-200 blur-3xl opacity-40 rounded-full"></div>
                <div className="relative z-10 drop-shadow-2xl">
                  {renderEvolution(evolutionLevel)}
                </div>
              </div>
            </div>

            {/* 2층: 게이지 & 기부바 (좌측 50% 박스 안에 예쁘게 갇힘) */}
            <div className="w-full space-y-4 px-2">
              <div className="w-full h-16 bg-white/80 rounded-full overflow-hidden shadow-inner border-4 border-amber-200 relative">
                <div 
                  className={`h-full transition-all duration-1000 ${evolutionLevel >= 5 ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500 animate-pulse' : 'bg-gradient-to-r from-yellow-300 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]'}`} 
                  style={{ width: `${progressPercent}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center font-black text-amber-900 text-xl tracking-widest drop-shadow-md">
                  {EVOLUTION_TITLES[evolutionLevel]} <span className="text-base ml-3 opacity-70">({evolutionLevel}/5)</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 overflow-hidden whitespace-nowrap text-base font-bold text-amber-700 bg-white/60 px-6 py-4 rounded-full border border-amber-200 flex items-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-500 mr-2 shrink-0"/>
                  <span className="animate-[shimmer_25s_linear_infinite] inline-block w-full">
                     기부 명예의 전당: {safeArray(db.donations).map(d => `${String(d.name)}(${d.amount}p)`).join(' 🌸 ') || '따뜻한 마음을 기다려요!'}
                  </span>
                </div>
                <span className="text-sm font-black text-orange-600 bg-white px-6 py-4 rounded-full shadow-sm border border-orange-200 shrink-0">
                  최종 목표: {db.settings?.targetScore || 5000}p
                </span>
              </div>
            </div>
          </div>

          {/* 📍 우측 영역 (화면의 딱 50% 차지): 선생님이 만드신 타임워치 위젯 */}
          <div className="w-full h-full">
            <TimerWidget 
              status={timerStatus} 
              display={timerDisplay} 
              timer={db.timer} 
              warningLevel={breakWarningLevel}
              breakInput={breakInput} 
              setBreakInput={setBreakInput} 
              defaultBreakMin={Math.floor((db.settings?.defaultBreakMs || DEFAULT_BREAK_MS) / 60000)}
              onStopwatch={startStopwatch} 
              onCountdown={startCountdown} 
              onPause={pauseTimer} 
              onResume={resumeTimer} 
              onReset={resetTimer} 
              onBreak={startBreak}
              lockEditing={lockEditing} 
              unlockEditing={unlockEditing}
            />
          </div>

        </div>
      </header>

      {/* 온기 우체통 마키 */}
      <div className="bg-pink-100 text-pink-700 py-3.5 overflow-hidden shadow-sm border-b-2 border-pink-200 relative z-20">
        <div className="whitespace-nowrap animate-[shimmer_35s_linear_infinite] flex gap-20 text-sm font-black">
          <span className="flex gap-4 items-center"><MessageSquare className="w-5 h-5 text-pink-500"/>
            온기 우체통: {safeArray(db.approvedPraises).map(p => 
              `[${SEL_OPTIONS.find(o=>o.name===p.tag)?.short||'칭찬'}] ${allStats.find(s=>s.id==p.toId)?.name||'나'}: "${p.text}"`
            ).join(' 💌 ') || '따뜻한 마음을 전해볼까요?'}
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">

        {/* ═══ PAGE 1: 대시보드 ═══ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">

            {/* 공동퀘스트 + 타임어택 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[40px] border-2 border-blue-100 shadow-sm flex flex-col justify-between">
                <h3 className="text-lg font-black text-blue-600 mb-5 flex items-center gap-2"><Zap className="w-6 h-6"/> 학급 공동 퀘스트</h3>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <button onClick={() => addCoopScore(db.coopQuest?.q1 || 50, db.coopQuest?.q1Name || "바른 생활")} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-4 rounded-2xl font-black text-base border border-indigo-200 active:scale-95 truncate px-3">{db.coopQuest?.q1Name || "바른 생활"} +{db.coopQuest?.q1 || 50}</button>
                  <button onClick={() => addCoopScore(db.coopQuest?.q2 || 20, db.coopQuest?.q2Name || "환대")} className="bg-pink-50 hover:bg-pink-100 text-pink-700 py-4 rounded-2xl font-black text-base border border-pink-200 active:scale-95 truncate px-3">{db.coopQuest?.q2Name || "환대"} +{db.coopQuest?.q2 || 20}</button>
                  <button onClick={() => addCoopScore(db.coopQuest?.q3 || 20, db.coopQuest?.q3Name || "전담 우수")} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-4 rounded-2xl font-black text-base border border-emerald-200 active:scale-95 col-span-2 shadow-sm truncate px-3">{db.coopQuest?.q3Name || "전담 우수"} +{db.coopQuest?.q3 || 20}</button>
                </div>
                <div className="flex items-center justify-between bg-yellow-50 p-5 rounded-2xl border border-yellow-200">
                  <span className="text-base font-black text-yellow-800 truncate pr-2 flex-1">{db.coopQuest?.q4Name || "사이좋은 일주일"}</span>
                  <div className="flex items-center gap-4 shrink-0">
                    <button onClick={() => adjustGoodWeek(-1)} className="p-3 bg-white rounded-xl text-red-500 border border-red-100 shadow-sm hover:bg-red-50"><Minus className="w-5 h-5"/></button>
                    <span className="font-black text-2xl text-yellow-600 w-14 text-center">{db.coopQuest?.goodWeek || 0}/5</span>
                    <button onClick={() => adjustGoodWeek(1)} className="p-3 bg-white rounded-xl text-green-500 border border-green-100 shadow-sm hover:bg-green-50"><Plus className="w-5 h-5"/></button>
                  </div>
                </div>
                {(db.coopQuest?.goodWeek || 0) >= 5 && (
                  <button onClick={completeGoodWeek} className="mt-4 w-full bg-yellow-400 text-yellow-900 shadow-md font-black py-5 rounded-2xl text-lg animate-pulse hover:bg-yellow-500">🌟 최종 승인 및 명성 획득!</button>
                )}
              </div>

              <div className={`p-8 rounded-[40px] border-2 flex flex-col items-center justify-center min-h-[220px] ${db.timeAttack?.isActive ? 'bg-red-50 border-red-300 shadow-inner' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                {db.timeAttack?.isActive ? (
                  <>
                    <div className="flex items-center gap-3 mb-4"><Timer className="w-8 h-8 text-red-500 animate-pulse"/><h2 className="text-lg font-black text-red-600 tracking-wider">돌발 타임어택 진행 중!</h2></div>
                    <p className="text-3xl font-black text-slate-800 mb-6 text-center">{db.timeAttack.title}</p>
                    <div className="bg-red-500 text-white px-12 py-5 rounded-[24px] shadow-lg"><span className="text-6xl font-black tracking-widest">{timeLeftString}</span></div>
                    <p className="text-sm font-bold text-red-400 mt-5">성공시 학급 명성 +{db.timeAttack.rewardRep}점 추가</p>
                  </>
                ) : (
                  <><Timer className="w-16 h-16 mb-5 opacity-30 text-slate-400"/><p className="font-black text-lg text-slate-400 opacity-70">현재 발동된 타임어택이 없습니다</p></>
                )}
              </div>
            </div>

            {/* 명예의 전당 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: '🏆 역할 완수 TOP 5', data: topExp, unit: '회', color: 'blue', icon: <CheckCircle2 className="w-7 h-7"/>, key: 'atExp' },
                { title: '🏆 기부 천사 TOP 5', data: topDonate, unit: '🪙', color: 'amber', icon: <Coins className="w-7 h-7"/>, key: 'atDonate' },
                { title: '🏆 펀딩 기여 TOP 5', data: topFund, unit: '🪙', color: 'pink', icon: <Target className="w-7 h-7"/>, key: 'atFund' }
              ].map(c => (
                <div key={c.title} className={`bg-gradient-to-br from-${c.color}-50 to-${c.color}-100 p-8 rounded-[40px] shadow-sm border border-${c.color}-200`}>
                  <h4 className={`text-xl font-black text-${c.color}-800 mb-6 flex items-center gap-3`}>{c.icon} {c.title}</h4>
                  <ul className="space-y-4">
                    {c.data.length ? c.data.map((s,i) => (
                      <li key={s.id} className={`text-lg font-black text-${c.color}-900 bg-white/70 px-5 py-3 rounded-[20px] flex justify-between shadow-sm`}>
                        <span>{i+1}. {s.name}</span><span className={`text-${c.color}-600`}>{s[c.key]}{c.unit}</span>
                      </li>
                    )) : <li className={`text-base font-bold text-${c.color}-400 text-center py-6`}>데이터가 없습니다.</li>}
                  </ul>
                </div>
              ))}
            </div>

            {/* 학생 카드 헤더 */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8 border-b-4 border-amber-200/50 pb-8 mt-16">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-amber-900 flex items-center gap-4"><Users className="text-amber-500 w-12 h-12"/> 우리 반 꼬마 시민들</h2>
                <p className="text-base font-bold text-slate-500 mt-3 bg-slate-50 inline-block px-4 py-1.5 rounded-full border border-slate-200">
                  {getTodayWeekdayIdx() < 0 ? '🔔 주말입니다.' : isAttendanceOpen() ? '🕗 출석 체크 가능 (08:30 마감)' : '⏰ 출석 시간이 마감되었습니다'}
                </p>
              </div>
              <button onClick={() => setShowPraiseModal(true)} className="w-full sm:w-auto bg-gradient-to-r from-pink-400 to-rose-500 text-white px-12 py-6 rounded-full font-black text-xl shadow-[0_10px_20px_rgba(244,63,94,0.3)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-2 border-pink-300">
                <Heart className="w-7 h-7 fill-white animate-pulse"/> 온기 우체통 쓰기
              </button>
            </div>

            {/* 학생 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {sortedDashboardStats.map(s => {
                const isTaCleared = safeArray(db.timeAttack?.cleared).map(Number).includes(Number(s.id));
                const nameColor = s.attendedToday ? 'text-slate-800' : 'text-slate-400';
                const isAnim = attendAnim?.id === s.id;
                
                return (
                  <div key={s.id} className={`p-8 rounded-[40px] border-4 shadow-sm transition-all relative flex flex-col bg-white hover:shadow-xl hover:-translate-y-1 ${s.status === 'crisis' ? 'border-slate-300 bg-slate-100 opacity-60 grayscale' : (s.status === 'pending' ? 'border-orange-300 bg-orange-50' : 'border-white hover:border-amber-300')}`}>
                    
                    {/* 타임어택 뱃지 */}
                    {db.timeAttack?.isActive && s.status !== 'crisis' && (
                      <div className="absolute -top-5 -right-5 z-20">
                        <button onClick={() => toggleTimeAttackClear(s.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-sm shadow-md border-2 ${isTaCleared ? 'bg-green-500 text-white border-green-600 scale-110' : 'bg-white text-slate-400 border-slate-200 hover:text-red-500'}`}>
                          {isTaCleared ? <><CheckCircle2 className="w-4 h-4"/>완료</> : <><Timer className="w-4 h-4"/>도전 중</>}
                        </button>
                      </div>
                    )}

                    {/* 출석 애니메이션 */}
                    {isAnim && (
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                        <span className="text-5xl font-black text-amber-500 drop-shadow-xl animate-flyToScore">+1</span>
                      </div>
                    )}

                    {/* 카드 상단: 번호 및 코인 */}
                    <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100/50 pb-5">
                      <div className="flex items-center gap-4">
                        <span className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-inner ${s.status === 'crisis' ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-800'}`}>{s.id}</span>
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">My Coins</p>
                          <p className={`font-black text-3xl leading-none ${s.status === 'crisis' ? 'text-slate-500' : 'text-amber-600'}`}>{s.coins}<span className="text-lg ml-1">🪙</span></p>
                        </div>
                      </div>
                      {isAuthenticated === 'teacher' && (
                        <button onClick={() => openNoteModal(s.id)} className="p-3.5 rounded-2xl bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border border-yellow-200 shadow-sm" title="누가기록 작성">
                          <StickyNote className="w-6 h-6"/>
                        </button>
                      )}
                    </div>

                    {/* 카드 중단: 이름 및 역할 */}
                    <div className="flex flex-col mb-6 gap-4">
                      <p className="text-[13px] font-bold text-slate-400 tracking-wide truncate bg-slate-50 inline-block w-max px-3 py-1 rounded-md">
                        {s.group}모둠 · {s.role}
                      </p>

                      <button
                        onClick={() => toggleAttendance(s.id)}
                        disabled={s.status === 'crisis' || (getTodayWeekdayIdx() < 0)}
                        className={`text-left transition-all ${s.status === 'crisis' ? 'cursor-not-allowed' : 'hover:bg-amber-50 active:scale-95'} rounded-2xl py-2 px-1`}
                        title={s.attendedToday ? "출석 취소" : "출석 체크하기"}
                      >
                        <h3 className={`text-3xl font-black flex items-center gap-2 tracking-tight truncate ${s.exp >= 20 && s.status !== 'crisis' ? 'text-amber-700' : nameColor}`}>
                          {s.attendedToday && <span className="text-green-500 text-2xl">✓</span>}
                          {s.name}
                          {s.isLeader && <Crown className="w-5 h-5 text-amber-400 fill-amber-400 mb-1"/>}
                          <span className="text-sm font-bold text-slate-400 ml-2 bg-white px-2 py-0.5 rounded-md border">
                            {s.weeklyCount}/5 · ⭐{s.streak}
                          </span>
                        </h3>
                      </button>

                      <div className={`text-base font-black px-4 py-2 rounded-2xl border-2 self-start shadow-sm mt-1 ${s.status === 'crisis' ? 'bg-slate-200 border-slate-300 text-slate-500' : `${s.mastery.bg} ${s.mastery.color}`}`}>
                        {s.mastery.label} <span className="opacity-70 ml-1">({s.exp})</span>
                      </div>
                    </div>

                    {/* 누적 스탯 (교사 모드 시) */}
                    {db.settings?.showCumulativeStats && (
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-5 text-xs font-bold text-slate-600 grid grid-cols-2 gap-3 shadow-inner">
                         <span>✅완수: <span className="text-blue-600">{s.atExp}</span></span>
                         <span>💎기부: <span className="text-amber-600">{s.atDonate}</span></span>
                         <span>🚀펀딩: <span className="text-pink-600">{s.atFund}</span></span>
                         <span className="text-red-400">🚨위기: <span className="text-red-600">{s.atPen}</span></span>
                      </div>
                    )}

                    {/* 카드 하단: 위기 관리 버튼 */}
                    <div className="mt-auto pt-3">
                      {s.status === 'normal' && (
                        <button onClick={() => handleGivePenalty(s.id)} className="w-full py-4 bg-slate-50 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-[20px] font-black text-sm flex items-center justify-center gap-2 transition-all">
                          <AlertTriangle className="w-5 h-5"/> 위기 상태로 지정
                        </button>
                      )}
                      {s.status === 'crisis' && (
                        <p className="text-center font-black text-white bg-slate-600 py-4 rounded-[20px] text-base shadow-md flex items-center justify-center gap-2">
                          🚨 성찰과 회복 요망
                        </p>
                      )}
                      {s.status === 'pending' && (
                        <p className="text-center font-black text-orange-800 bg-orange-200 py-4 rounded-[20px] text-base shadow-md flex items-center justify-center gap-2">
                          ⏳ 교사 승인 대기중
                        </p>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PAGE 2: 성찰 센터 ═══ */}
        {activeTab === 'reflection' && (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95">
            <div className="bg-white p-12 md:p-16 rounded-[60px] shadow-xl border-4 border-emerald-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
              <BookOpen className="w-24 h-24 text-emerald-400 mx-auto mb-8 relative z-10" />
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-emerald-900 relative z-10 tracking-tight">성찰과 회복 센터 🌱</h2>
              <p className="text-emerald-600 font-bold mb-12 text-lg relative z-10">내 마음을 돌아보고 더 단단한 나로 성장하는 공간입니다.</p>
              
              <div className="text-left space-y-10 bg-emerald-50/60 p-10 md:p-12 rounded-[40px] border-2 border-emerald-100 shadow-inner relative z-10">
                <div>
                  <label className="block text-base font-black mb-4 text-emerald-800 bg-emerald-100 inline-block px-5 py-2 rounded-full">1. 누가 성찰하나요?</label>
                  <select value={refTarget} onChange={e=>setRefTarget(e.target.value)} className="w-full p-6 rounded-3xl border-2 border-white font-black bg-white text-xl outline-none focus:border-emerald-300 shadow-sm">
                    <option value="">이름을 선택하세요 (위기 친구들만 보입니다)</option>
                    {allStats.filter(s => s.status === 'crisis').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                {refTarget && (
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 p-8 rounded-[30px] text-pink-800 shadow-sm animate-in fade-in">
                    <h4 className="text-lg font-black mb-4 flex items-center gap-2"><Heart className="w-6 h-6 fill-pink-400"/> 다시 일어서는 용기를 응원합니다.</h4>
                    {randomPraise ? (
                      <p className="text-base font-bold leading-relaxed bg-white p-6 rounded-2xl border border-pink-100 shadow-sm">
                        "예전에 친구가 <b>{SEL_OPTIONS.find(o=>o.name===randomPraise.tag)?.short}</b> 역량으로 널 칭찬했었어! 👉 <span className="text-pink-600">"{randomPraise.text}"</span>"
                      </p>
                    ) : (
                      <p className="text-base font-bold bg-white p-6 rounded-2xl border border-pink-100 shadow-sm">"넌 우리 반의 소중한 보물이야. 천천히 스스로를 다독이고 다시 시작해봐요!"</p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-base font-black mb-4 text-emerald-800 bg-emerald-100 inline-block px-5 py-2 rounded-full">2. 어떤 역량이 필요할까요?</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SEL_OPTIONS.map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => setRefTag(opt.name)} 
                        className={`p-5 rounded-2xl border-2 font-black text-sm text-left transition-all shadow-sm ${refTag === opt.name ? 'bg-emerald-500 border-emerald-500 text-white scale-105' : 'bg-white border-white text-slate-500 hover:-translate-y-1'}`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-base font-black mb-4 text-emerald-800 bg-emerald-100 inline-block px-5 py-2 rounded-full">3. 마음의 다짐 적기</label>
                  <textarea value={refText} onChange={e=>setRefText(e.target.value)} rows="7" className="w-full p-8 rounded-[30px] border-2 border-white font-black bg-white resize-none text-base outline-none focus:border-emerald-300 shadow-sm" placeholder={refTag ? SEL_GUIDES[refTag] : "위에서 역량을 먼저 선택해 주세요."}/>
                </div>
                
                <button onClick={submitReflection} className="w-full bg-emerald-600 text-white py-6 rounded-[30px] font-black text-2xl shadow-xl hover:bg-emerald-700 active:scale-95 flex justify-center items-center gap-3 mt-4">
                  <Send className="w-7 h-7"/> 다짐 제출하고 위기 탈출하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PAGE 3: 도움실 ═══ */}
        {activeTab === 'helproom' && (
          <div className="bg-white rounded-[50px] shadow-sm border-4 border-indigo-50 flex flex-col lg:flex-row min-h-[800px] animate-in fade-in overflow-hidden">
            
            <aside className="w-full lg:w-80 bg-indigo-50/50 p-10 border-r-2 border-white flex flex-col gap-5 shrink-0">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-indigo-100">
                  <Users className="w-12 h-12 text-indigo-500" />
                </div>
                <h3 className="text-3xl font-black text-indigo-900">학급 도움실</h3>
              </div>
              {[
                { key: 'inspector', icon: <Briefcase className="w-6 h-6"/>, label: '감찰사 본부', active: 'bg-indigo-500' },
                { key: 'magistrate', icon: <BookOpen className="w-6 h-6"/>, label: '현령 관리소', active: 'bg-indigo-500' },
                { key: 'shop', icon: <ShoppingCart className="w-6 h-6"/>, label: '학급 상점', active: 'bg-amber-400' }
              ].map(m => (
                <button 
                  key={m.key} 
                  onClick={() => setHelpSubTab(m.key)}
                  className={`w-full p-6 rounded-3xl font-black text-left flex items-center gap-4 text-lg transition-all ${helpSubTab === m.key ? `${m.active} text-white shadow-xl translate-x-2` : 'bg-white text-indigo-400 hover:translate-x-1'}`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </aside>

            <section className="flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-50/30">
              
              {/* 공통 상단: 기부처 */}
              <div className="mb-12 bg-gradient-to-r from-yellow-100 to-amber-100 p-8 rounded-[40px] shadow-sm flex flex-col md:flex-row gap-8 items-center border-2 border-yellow-200">
                <div className="md:w-1/3 text-center md:text-left">
                  <h4 className="text-2xl font-black text-amber-800 mb-2 flex items-center justify-center md:justify-start gap-2">
                    <Coins className="w-8 h-8 text-yellow-500"/> 명예의 기부처
                  </h4>
                  <p className="text-sm font-bold text-amber-700">나의 코인으로 우리 반 명성을 높이세요!</p>
                </div>
                <div className="md:w-2/3 flex gap-4 w-full">
                  <select id="donate_who_main" className="flex-1 p-5 rounded-2xl bg-white border-2 border-white font-black outline-none text-lg text-slate-700 shadow-sm">
                    <option value="">누가 기부할까요?</option>
                    {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.coins}🪙)</option>)}
                  </select>
                  <input id="donate_amount_main" type="number" placeholder="금액" className="w-32 p-5 rounded-2xl bg-white border-2 border-white font-black outline-none text-center text-lg shadow-sm"/>
                  <button onClick={() => {
                    const sid = document.getElementById('donate_who_main').value; 
                    const amt = toInt(document.getElementById('donate_amount_main').value);
                    if (!sid || !amt) return alert("정보를 모두 입력하세요."); 
                    handleDonate(toInt(sid), amt);
                  }} className="bg-amber-500 text-white px-8 rounded-2xl font-black text-xl hover:bg-amber-600 active:scale-95 shadow-md">
                    기부
                  </button>
                </div>
              </div>

              {/* 3-1: 감찰사 본부 */}
              {helpSubTab === 'inspector' && (
                <div className="space-y-10 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3 bg-indigo-100 inline-block px-6 py-3 rounded-full border border-indigo-200">
                    <Briefcase className="text-indigo-600 w-8 h-8"/> 감찰사 자치 본부
                  </h3>
                  <div className="bg-white border-2 border-indigo-50 rounded-[40px] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-indigo-50/50 text-sm font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-100">
                        <tr><th className="p-6">학생 이름</th><th className="p-6">모둠 배치</th><th className="p-6 text-center">모둠장 여부</th><th className="p-6">1인 1역 직업 배정</th></tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-50/50">
                        {allStats.map(s => (
                          <tr key={s.id} className="hover:bg-indigo-50/20 transition-colors">
                            <td className="p-6 font-black text-xl text-slate-700">{s.name}</td>
                            <td className="p-6">
                              <select value={s.group} onChange={e=>handleStudentFieldChange(s.id, 'group', toInt(e.target.value))} className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none shadow-sm w-full max-w-[150px] text-base">
                                {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}모둠</option>)}
                              </select>
                            </td>
                            <td className="p-6 text-center">
                              <button onClick={() => handleStudentFieldChange(s.id, 'isLeader', !s.isLeader)} className={`px-5 py-3 rounded-xl font-black text-sm shadow-sm transition-colors ${s.isLeader ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                                {s.isLeader ? <><Crown className="w-5 h-5 inline fill-white mr-1"/> 모둠장</> : '일반 모둠원'}
                              </button>
                            </td>
                            <td className="p-6">
                              <select value={s.role} onChange={e=>handleStudentFieldChange(s.id, 'role', e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none shadow-sm text-base">
                                <option value="">직업 없음</option>
                                {safeArray(db.rolesList).map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3-2: 현령 관리소 */}
              {helpSubTab === 'magistrate' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3 bg-blue-100 inline-block px-6 py-3 rounded-full border border-blue-200">
                      <BookOpen className="text-blue-600 w-8 h-8"/> 현령 직업 관리소
                    </h3>
                    <p className="text-sm font-bold text-blue-600 bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 shadow-sm">
                      💡 이곳에서 올리는 점수만 '장인' 승급에 반영됩니다.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1,2,3,4,5,6].map(gNum => {
                      const members = groupedByGroupStats.filter(s => s.group === gNum);
                      if (!members.length) return null;
                      return (
                        <div key={gNum} className="bg-white p-8 rounded-[40px] border-2 border-blue-50 shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="text-xl font-black text-blue-800 mb-6 bg-blue-50 inline-block px-6 py-2 rounded-full border border-blue-100">{gNum}모둠 명단</h4>
                          <div className="grid grid-cols-1 gap-4">
                            {members.map(s => (
                              <div key={s.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-slate-400 mb-1">{s.role}</p>
                                  <p className="font-black text-2xl text-slate-800">{s.name}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-white p-2.5 rounded-[20px] border border-slate-200 shadow-sm">
                                  <button onClick={() => handleExpAdjust(s.id, -1)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Minus className="w-6 h-6"/></button>
                                  <span className="w-16 text-center font-black text-blue-600 text-3xl">{s.exp}</span>
                                  <button onClick={() => handleExpAdjust(s.id, 1)} className="p-3 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-colors"><Plus className="w-6 h-6"/></button>
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

              {/* 3-3: 달보드레 상점 */}
              {helpSubTab === 'shop' && (
                <div className="space-y-10 animate-in fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-amber-200 pb-6">
                    <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3 bg-amber-100 inline-block px-6 py-3 rounded-full border border-amber-200 mb-3">
                      <ShoppingCart className="text-amber-600 w-8 h-8"/> 달보드레 상점
                    </h3>
                    <div className={`px-10 py-5 rounded-full font-black text-xl shadow-lg border-4 ${isShopOpen ? 'bg-green-500 text-white border-green-300 animate-pulse' : 'bg-slate-500 text-white border-slate-400'}`}>
                      {isShopOpen ? "🔓 상점 영업 중" : "🔒 목요일에 개방됩니다"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-10 rounded-[40px] border-4 border-amber-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200 rounded-full blur-[60px] opacity-40"></div>
                    <h4 className="text-3xl font-black text-amber-900 mb-3 relative z-10 flex items-center gap-2"><Gavel className="w-8 h-8"/> 장인의 공방</h4>
                    <p className="text-base font-bold text-amber-700 mb-8 relative z-10">숙련도 20회 이상 '장인'의 기발한 아이템을 기획해 결재를 올립니다. (판매 시 로열티 5% 지급)</p>
                    
                    <div className="flex flex-wrap gap-4 relative z-10">
                      <select value={artisanTarget} onChange={e=>setArtisanTarget(e.target.value)} className="w-56 p-5 rounded-2xl bg-white border-2 border-amber-200 font-black text-lg outline-none shadow-sm focus:border-amber-400">
                        <option value="">장인 명단 확인</option>
                        {allStats.filter(s => s.exp >= 20).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <input type="text" placeholder="기발한 아이템 이름" value={artisanItemName} onChange={e=>setArtisanItemName(e.target.value)} className="flex-1 p-5 rounded-2xl bg-white border-2 border-amber-200 font-bold text-lg outline-none shadow-sm focus:border-amber-400"/>
                      <input type="number" placeholder="희망 가격" value={artisanItemPrice} onChange={e=>setArtisanItemPrice(e.target.value)} className="w-32 p-5 rounded-2xl bg-white border-2 border-amber-200 font-bold text-lg outline-none text-center shadow-sm focus:border-amber-400"/>
                      <button onClick={submitArtisanItem} className="bg-amber-600 text-white px-10 rounded-2xl font-black text-lg shadow-lg hover:bg-amber-700 active:scale-95 transition-transform">
                        결재 올리기
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* 상점 물품 렌더링 영역 */}
                    {safeArray(db.shopItems).filter(i => i && i.name).map(item => (
                      <div key={item.id} className="bg-white p-10 rounded-[40px] shadow-sm border-2 border-slate-100 flex flex-col justify-between hover:border-amber-300 transition-colors">
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <span className="text-sm font-black bg-slate-100 text-slate-500 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                              {String(item.creator)} 제작
                            </span>
                            <p className="text-4xl font-black text-amber-500">{toInt(item.price)} 🪙</p>
                          </div>
                          <h4 className="text-3xl font-black text-slate-800 mb-10">{String(item.name)}</h4>
                        </div>
                        
                        <div className="flex gap-4">
                          <select id={`buyer_${item.id}`} className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none text-lg shadow-sm focus:border-amber-400">
                            <option value="">누가 구매하나요?</option>
                            {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.coins}🪙)</option>)}
                          </select>
                          
                          {/* ⭐ V10.3 구매 및 로열티 지급 로직 */}
                          <button onClick={() => {
                            if (!isShopOpen) return alert("오늘은 상점 운영일이 아닙니다!");
                            
                            const sid = document.getElementById(`buyer_${item.id}`).value;
                            if (!sid) return alert("구매할 사람을 선택하세요."); 
                            
                            const user = activeStudents.find(u => u.id == sid);
                            const price = toInt(item.price);
                            if (user.coins < price) return alert("코인이 부족합니다.");
                            
                            if (!window.confirm(`${user.name}의 코인 ${price}🪙을 차감할까요?`)) return;
                            
                            const repBonus = Math.ceil(price * 0.10); // 10% 명성
                            const coinBonus = Math.ceil(price * 0.05); // 5% 장인 로열티
                            
                            let updates = { usedCoins: { ...db.usedCoins, [sid]: (db.usedCoins[sid] || 0) + price } };
                            let alertMsg = "결제 승인 완료!";

                            if (item.creatorId) {
                              updates.bonusCoins = { ...db.bonusCoins, [item.creatorId]: (db.bonusCoins?.[item.creatorId] || 0) + coinBonus };
                              updates.manualRepOffset = (db.manualRepOffset || 0) + repBonus;
                              alertMsg = `결제가 완료되었습니다! 💸\n\n아이템을 제작한 장인(${item.creator})에게 로열티 +${coinBonus}🪙가 지급되고,\n학급 전체 명성이 +${repBonus}p 상승했습니다!`;
                            }
                            
                            sync(updates);
                            alert(alertMsg); 
                            playSound('buy');
                          }} className="bg-amber-500 text-white px-10 rounded-2xl font-black text-xl shadow-lg hover:bg-amber-600 active:scale-95 transition-transform">
                            구매
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* 크라우드 펀딩 렌더링 영역 */}
                    {safeArray(db.funding).filter(f => f && f.name).map(f => (
                      <div key={f.id} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-10 rounded-[40px] shadow-xl text-white flex flex-col justify-between relative overflow-hidden border-4 border-blue-400">
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10">
                          <h4 className="text-3xl font-black mb-3 flex items-center gap-3"><Target className="w-8 h-8 text-yellow-300"/> {String(f.name)}</h4>
                          <p className="text-base font-bold text-blue-100 mb-10">십시일반 투자하여 다 함께 목표를 이뤄요!</p>
                          <div className="flex justify-between items-end text-xl font-black mb-4">
                            <span>현재: {toInt(f.current)}p</span>
                            <span className="text-blue-200">목표: {toInt(f.target,1)}p</span>
                          </div>
                          <div className="w-full h-6 bg-black/30 rounded-full mb-10 overflow-hidden border border-white/20 shadow-inner">
                            <div className="h-full bg-yellow-400 transition-all duration-1000 shadow-[0_0_15px_rgba(250,204,21,0.8)]" style={{ width: `${Math.min((toInt(f.current)/toInt(f.target,1))*100, 100)}%` }}></div>
                          </div>
                        </div>
                        <div className="flex gap-4 relative z-10">
                          <select id={`funder_${f.id}`} className="flex-1 p-5 rounded-2xl bg-white/20 border-none text-white font-bold outline-none text-lg backdrop-blur-sm">
                            <option value="" className="text-slate-800">누가 투자할까요?</option>
                            {activeStudents.map(s => <option key={s.id} value={s.id} className="text-slate-800">{s.name} ({s.coins}🪙)</option>)}
                          </select>
                          <input id={`f_amt_${f.id}`} type="number" placeholder="금액" className="w-28 p-5 rounded-2xl bg-white/20 border-none text-white font-bold outline-none text-lg text-center placeholder:text-blue-200 backdrop-blur-sm"/>
                          <button onClick={() => {
                            const sid = document.getElementById(`funder_${f.id}`).value; 
                            const amt = toInt(document.getElementById(`f_amt_${f.id}`).value);
                            if (!sid || !amt) return alert("정확히 입력하세요."); 
                            handleFund(f.id, toInt(sid), amt);
                          }} className="bg-yellow-400 text-yellow-900 px-10 rounded-2xl font-black text-xl shadow-lg hover:bg-yellow-300 active:scale-95 transition-transform">
                            투자
                          </button>
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
          <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 flex flex-col lg:flex-row min-h-[850px] animate-in fade-in overflow-hidden">
            
            <aside className="w-full lg:w-80 bg-slate-900 p-10 flex flex-col gap-4 shrink-0 border-r border-slate-800">
              <div className="text-center mb-10">
                <Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-3xl font-black text-white">관리자 센터</h3>
                <p className="text-slate-400 text-xs font-bold mt-2 tracking-widest">MASTER MODE</p>
              </div>
              
              {[
                { key: 'mission',    icon: <Zap className="w-6 h-6"/>,          label: '결재 및 퀘스트', danger: false },
                { key: 'shopAdmin',  icon: <Store className="w-6 h-6"/>,         label: '상점/펀딩 관리',   danger: false },
                { key: 'report',     icon: <BarChart3 className="w-6 h-6"/>,     label: 'SEL 리포트',  danger: false },
                { key: 'students',   icon: <Users className="w-6 h-6"/>,          label: '명단 및 성향',   danger: false },
                { key: 'attendAdmin',icon: <CheckCircle2 className="w-6 h-6"/>,  label: '출석 보정',   danger: false },
                { key: 'settings',   icon: <Settings className="w-6 h-6"/>,      label: '환경 및 점수',   danger: false },
                { key: 'reset',      icon: <History className="w-6 h-6"/>,       label: '초기화/마감', danger: true  }
              ].map(m => (
                <button 
                  key={m.key} 
                  onClick={() => setAdminSubTab(m.key)}
                  className={`w-full p-5 rounded-2xl font-black text-left flex items-center gap-4 text-lg transition-all ${adminSubTab === m.key ? (m.danger ? 'bg-red-600 text-white shadow-lg translate-x-2' : 'bg-blue-600 text-white shadow-lg translate-x-2') : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:translate-x-1'}`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
              
              <button 
                onClick={handleLogout} 
                className="mt-auto p-5 bg-slate-800 text-slate-400 font-black rounded-2xl text-center hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-5 h-5"/> 로그아웃
              </button>
            </aside>

            <section className="flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-50/50">

              {/* 4-1: 결재/퀘스트/타임어택 */}
              {adminSubTab === 'mission' && (
                <div className="space-y-10 animate-in fade-in">
                  
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                    <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-4 mb-6 flex items-center gap-2">
                      <Settings className="w-6 h-6 text-blue-500"/> 공동 퀘스트 & 타임어택
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      이곳에서 미션 이름과 보상 점수를 변경하세요.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                      {[
                        { key: 'q1', bgClass: 'bg-indigo-50 border-indigo-100', textClass: 'text-indigo-600', defName: '다 함께 바른 생활', defVal: 50 },
                        { key: 'q2', bgClass: 'bg-pink-50 border-pink-100',     textClass: 'text-pink-600',   defName: '환대와 응원',       defVal: 20 },
                        { key: 'q3', bgClass: 'bg-emerald-50 border-emerald-100',textClass:'text-emerald-600',defName: '전담수업 태도',      defVal: 20 },
                        { key: 'q4', bgClass: 'bg-yellow-50 border-yellow-100', textClass: 'text-yellow-600', defName: '사이좋은 일주일',   defVal: 100 }
                      ].map(q => (
                        <div key={q.key} className={`${q.bgClass} p-4 rounded-2xl border flex gap-3 shadow-sm`}>
                          <input 
                            type="text" 
                            value={db.coopQuest?.[`${q.key}Name`] || q.defName}
                            onChange={e => sync({ coopQuest: { ...db.coopQuest, [`${q.key}Name`]: e.target.value } })}
                            onFocus={lockEditing} 
                            onBlur={unlockEditing} 
                            className="flex-1 p-3 rounded-xl text-sm font-bold border-none outline-none shadow-sm"
                          />
                          <input 
                            type="number" 
                            value={db.coopQuest?.[q.key] ?? q.defVal}
                            onChange={e => sync({ coopQuest: { ...db.coopQuest, [q.key]: toInt(e.target.value) } })}
                            onFocus={lockEditing} 
                            onBlur={unlockEditing} 
                            className={`w-20 p-3 rounded-xl text-base font-black ${q.textClass} border-none outline-none text-center shadow-sm`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-red-50 p-8 rounded-[30px] border-2 border-red-200 shadow-inner">
                      <h4 className="text-xl font-black text-red-800 mb-6 flex items-center gap-2">
                        <Timer className="w-6 h-6"/> 타임어택 발동기
                      </h4>
                      {db.timeAttack?.isActive ? (
                        <div className="space-y-6">
                          <div className="bg-white p-4 rounded-2xl border border-red-100 text-center shadow-inner">
                            <p className="text-4xl font-black text-red-600 tracking-widest">{timeLeftString}</p>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={handleCompleteTimeAttack} className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black text-lg shadow-md hover:bg-green-600 active:scale-95 transition-transform">
                              미션 성공 승인
                            </button>
                            <button onClick={handleFailTimeAttack} className="flex-1 bg-slate-400 text-white py-4 rounded-2xl font-black text-lg shadow-md hover:bg-slate-500 active:scale-95 transition-transform">
                              실패 종료
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-white p-6 rounded-2xl border border-red-200 space-y-5 shadow-sm">
                            <div>
                              <label className="block text-[11px] font-black text-red-400 mb-1 ml-1">미션 제목</label>
                              <input 
                                type="text" 
                                placeholder="예: 바닥 쓰레기 0개!" 
                                value={taTitle} 
                                onChange={e=>setTaTitle(e.target.value)} 
                                onFocus={lockEditing} 
                                onBlur={unlockEditing} 
                                className="w-full p-4 rounded-xl border border-red-100 font-bold outline-none focus:border-red-400"
                              />
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-[11px] font-black text-red-400 mb-1 ml-1">제한 시간(분)</label>
                                <input 
                                  type="number" 
                                  value={taMins} 
                                  onChange={e=>setTaMins(e.target.value)} 
                                  onFocus={lockEditing} 
                                  onBlur={unlockEditing} 
                                  className="w-full p-4 rounded-xl border border-red-100 font-black text-center outline-none focus:border-red-400"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[11px] font-black text-red-400 mb-1 ml-1">성공 보상(p)</label>
                                <input 
                                  type="number" 
                                  value={taReward} 
                                  onChange={e=>setTaReward(e.target.value)} 
                                  onFocus={lockEditing} 
                                  onBlur={unlockEditing} 
                                  className="w-full p-4 rounded-xl border border-red-100 font-black text-center outline-none focus:border-red-400"
                                />
                              </div>
                            </div>
                          </div>
                          <button onClick={handleStartTimeAttack} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black hover:bg-red-700 shadow-lg text-xl active:scale-95 transition-all">
                            🚀 타임어택 발동!
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 결재함 */}
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-green-100">
                    <h4 className="text-3xl font-black mb-8 text-slate-800 border-l-8 border-green-500 pl-5">서류 결재함</h4>
                    <div className="w-full space-y-5 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      
                      {/* 장인 아이템 결재 */}
                      {safeArray(db.pendingShopItems).filter(i => i && i.name).map(item => (
                        <div key={item.id} className="bg-amber-50 p-6 rounded-[24px] border-2 border-amber-200 text-left shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-lg text-xs">장인 건의: {item.creator}</span>
                            <span className="text-sm font-black text-amber-600">{item.price}🪙</span>
                          </div>
                          <p className="text-lg text-slate-800 font-black mb-4">"{item.name}"</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { 
                                sync({ 
                                  pendingShopItems: safeArray(db.pendingShopItems).filter(i => i.id !== item.id), 
                                  shopItems: [item, ...safeArray(db.shopItems)] // creatorId 보존됨
                                }); 
                                alert("상점 등록 완료!"); 
                                playSound('good'); 
                              }} 
                              className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-black text-sm hover:bg-amber-600 shadow-md"
                            >
                              상점에 출시 허가
                            </button>
                            <button 
                              onClick={() => { sync({ pendingShopItems: safeArray(db.pendingShopItems).filter(i => i.id !== item.id) }); alert("반려"); }} 
                              className="px-4 bg-white text-slate-400 font-black rounded-xl border border-slate-200"
                            >
                              반려
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* 위기 학생 성찰 결재 */}
                      {safeArray(db.pendingReflections).filter(r => r && r.sId).map(r => (
                        <div key={r.id} className="bg-red-50 p-6 rounded-[24px] border-2 border-red-200 text-left shadow-sm">
                          <div className="flex justify-between items-center mb-4 border-b border-red-200/50 pb-3">
                            <span className="font-black text-red-800 bg-red-100 px-4 py-1.5 rounded-xl text-sm flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4"/> {allStats.find(s=>s.id==r.sId)?.name} (성찰 제출)
                            </span>
                            <span className="text-xs font-black text-red-400 bg-white px-3 py-1 rounded-full border border-red-100">
                              {SEL_OPTIONS.find(o=>o.name===r.tag)?.short}
                            </span>
                          </div>
                          <p className="text-base text-slate-700 font-bold mb-6 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-2xl border border-red-100 shadow-inner">
                            "{r.text}"
                          </p>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => { 
                                sync({ 
                                  pendingReflections: safeArray(db.pendingReflections).filter(pr => pr.id !== r.id), 
                                  studentStatus: { ...db.studentStatus, [r.sId]: 'normal' } 
                                }); 
                                alert("위기 해제 승인 완료!"); 
                                playSound('good'); 
                              }} 
                              className="flex-1 bg-red-500 text-white py-4 rounded-xl font-black text-base hover:bg-red-600 shadow-md active:scale-95 transition-transform"
                            >
                              위기 해제 및 복귀 승인
                            </button>
                            <button 
                              onClick={() => { 
                                sync({ 
                                  pendingReflections: safeArray(db.pendingReflections).filter(pr => pr.id !== r.id), 
                                  studentStatus: { ...db.studentStatus, [r.sId]: 'crisis' } 
                                }); 
                                alert("반려"); 
                              }} 
                              className="px-6 bg-white text-slate-500 font-black rounded-xl border-2 border-slate-200 hover:bg-slate-50"
                            >
                              다시 성찰하기 (반려)
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* 온기 칭찬 결재 */}
                      {safeArray(db.pendingPraises).filter(p => p && p.toId).map(p => {
                        const target = allStats.find(u => u.id == p.toId); 
                        const isCrisis = target?.status === 'crisis';
                        return (
                          <div key={p.id} className="bg-pink-50 p-6 rounded-[24px] border-2 border-pink-200 text-left shadow-sm">
                            <div className="flex justify-between items-center mb-4 border-b border-pink-200/50 pb-3">
                              <div className="flex items-center gap-3">
                                <span className="font-black text-pink-800 bg-pink-100 px-4 py-1.5 rounded-xl text-sm flex items-center gap-2">
                                  <Heart className="w-4 h-4 fill-pink-500"/> To. {target?.name || '나 자신'}
                                </span>
                                {isCrisis && (
                                  <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-black animate-pulse shadow-sm border border-red-600">
                                    🚨 현재 위기 상태
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-black text-pink-500 bg-white px-3 py-1 rounded-full border border-pink-100">
                                {SEL_OPTIONS.find(o=>o.name===p.tag)?.short}
                              </span>
                            </div>
                            <p className="text-base text-slate-700 font-bold mb-6 bg-white p-4 rounded-2xl border border-pink-100 shadow-inner">
                              "{p.text}"
                            </p>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => approvePraise(p)} 
                                className={`flex-1 py-4 rounded-xl font-black text-base shadow-md transition-all ${isCrisis ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600 active:scale-95'}`}
                              >
                                온기 사연 승인
                              </button>
                              <button 
                                onClick={() => { 
                                  sync({ pendingPraises: safeArray(db.pendingPraises).filter(pr => pr.id !== p.id) }); 
                                  alert("반려되었습니다."); 
                                }} 
                                className="px-6 bg-white text-slate-500 font-black rounded-xl border-2 border-slate-200 hover:bg-slate-50"
                              >
                                반려
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {safeArray(db.pendingShopItems).length === 0 && safeArray(db.pendingReflections).length === 0 && safeArray(db.pendingPraises).length === 0 && (
                        <div className="text-slate-400 font-black py-16 border-4 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center">
                          <CheckCircle2 className="w-12 h-12 mb-4 opacity-50"/>
                          결재 대기열이 깨끗합니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4-2: 상점/펀딩 관리 */}
              {adminSubTab === 'shopAdmin' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">상점 및 펀딩 관리</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                    
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
                      <button 
                        onClick={() => sync({ settings: { ...db.settings, forceShopOpen: !db.settings?.forceShopOpen } })}
                        className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-md ${db.settings?.forceShopOpen ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border-2 border-slate-300'}`}
                      >
                        정규 상점 개방: {db.settings?.forceShopOpen ? 'ON (강제 개방 중)' : 'OFF (목요일에만 열림)'}
                      </button>
                    </div>
                    
                    <div className="pt-6">
                      <h4 className="font-black text-xl text-slate-700 mb-6 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-amber-500"/> 상점 물품 관리
                      </h4>
                      <div className="flex gap-3 mb-6">
                        <input 
                          type="text" 
                          placeholder="새로운 물품 이름" 
                          value={newItemName} 
                          onChange={e=>setNewItemName(e.target.value)} 
                          onFocus={lockEditing} 
                          onBlur={unlockEditing} 
                          className="flex-1 p-4 rounded-xl border border-slate-300 font-bold outline-none"
                        />
                        <input 
                          type="number" 
                          placeholder="가격" 
                          value={newItemPrice} 
                          onChange={e=>setNewItemPrice(e.target.value)} 
                          onFocus={lockEditing} 
                          onBlur={unlockEditing} 
                          className="w-32 p-4 rounded-xl border border-slate-300 font-bold outline-none text-center"
                        />
                        <button 
                          onClick={() => {
                            if (!newItemName || !newItemPrice) return alert("입력 오류");
                            sync({ shopItems: [...safeArray(db.shopItems), { id: Date.now(), name: newItemName, price: toInt(newItemPrice), creator: '선생님' }] });
                            setNewItemName(""); setNewItemPrice("");
                          }} 
                          className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700"
                        >
                          물품 추가
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safeArray(db.shopItems).filter(i => i && i.name).map(item => (
                          <div key={item.id} className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex justify-between items-center shadow-sm">
                            <div>
                              <span className="text-[10px] text-slate-400 font-black bg-white px-2 py-1 rounded-md">{String(item.creator)}</span>
                              <h4 className="font-black text-slate-800 mt-2">{String(item.name)}</h4>
                              <p className="text-amber-600 font-black text-sm">{toInt(item.price)}🪙</p>
                            </div>
                            <button 
                              onClick={() => { if (window.confirm("삭제할까요?")) sync({ shopItems: safeArray(db.shopItems).filter(i => i.id !== item.id) }); }} 
                              className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-50 shadow-sm"
                            >
                              <Trash2 className="w-5 h-5"/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-200 mt-8">
                      <h4 className="font-black text-xl text-blue-800 mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5"/> 크라우드 펀딩 관리
                      </h4>
                      <div className="flex gap-3 mb-6 bg-blue-50 p-6 rounded-3xl border border-blue-100">
                        <input 
                          type="text" 
                          placeholder="새로운 펀딩 목표 (예: 피자 파티)" 
                          value={newFundName} 
                          onChange={e=>setNewFundName(e.target.value)} 
                          onFocus={lockEditing} 
                          onBlur={unlockEditing} 
                          className="flex-1 p-4 rounded-xl border border-blue-200 font-bold outline-none focus:border-blue-400"
                        />
                        <input 
                          type="number" 
                          placeholder="목표 점수" 
                          value={newFundTarget} 
                          onChange={e=>setNewFundTarget(e.target.value)} 
                          onFocus={lockEditing} 
                          onBlur={unlockEditing} 
                          className="w-32 p-4 rounded-xl border border-blue-200 font-bold outline-none focus:border-blue-400 text-center"
                        />
                        <button 
                          onClick={() => {
                            if (!newFundName || !newFundTarget || toInt(newFundTarget)===0) return alert("올바른 값을 입력하세요.");
                            sync({ funding: [...safeArray(db.funding), { id: Date.now(), name: newFundName, target: toInt(newFundTarget), current: 0 }] });
                            setNewFundName(""); setNewFundTarget("");
                          }} 
                          className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700"
                        >
                          펀딩 개설
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {safeArray(db.funding).filter(f => f && f.name).map(f => (
                          <div key={f.id} className="bg-white p-5 rounded-2xl border border-blue-200 flex justify-between items-center shadow-sm">
                            <div>
                              <h4 className="font-black text-blue-900 text-lg">{String(f.name)}</h4>
                              <p className="text-blue-500 font-bold text-sm mt-1">현재: {toInt(f.current)} / 목표: {toInt(f.target)}p</p>
                            </div>
                            <button 
                              onClick={() => { if (window.confirm("이 펀딩을 삭제할까요?")) sync({ funding: safeArray(db.funding).filter(x => x.id !== f.id) }); }} 
                              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 shadow-sm"
                            >
                              <Trash2 className="w-5 h-5"/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4-3: 리포트 */}
              {adminSubTab === 'report' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">🌱 SEL 리포트 & 데이터 추출</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10">
                    <div className="w-full md:w-1/3 space-y-4">
                      <select 
                        value={selectedReportStudent} 
                        onChange={e=>setSelectedReportStudent(e.target.value)} 
                        className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 font-black text-xl outline-none mb-6 focus:border-blue-400 shadow-sm"
                      >
                        <option value="">학생을 선택하세요</option>
                        {allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      
                      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-3 shadow-sm">
                        <h5 className="font-black text-indigo-700 text-sm flex items-center gap-2"><Download className="w-4 h-4"/> AI 리포트 추출</h5>
                        <button 
                          disabled={!selectedReportStudent} 
                          onClick={() => exportStudent(selectedReportStudent)}
                          className={`w-full p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 ${selectedReportStudent ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          <Copy className="w-4 h-4"/> 이 학생만 추출
                        </button>
                        <button 
                          onClick={exportAll} 
                          className="w-full p-4 rounded-xl font-black text-sm bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center gap-2 shadow-md"
                        >
                          <Download className="w-4 h-4"/> 전체 반 추출
                        </button>
                        <p className="text-[11px] font-bold text-indigo-400 leading-relaxed mt-2">
                          클립보드에 자동 복사되며 파일로도 다운로드됩니다. ChatGPT/Claude에 그대로 붙여넣으세요.
                        </p>
                      </div>
                      
                      {selectedReportStudent && (
                        <button 
                          onClick={() => setShowRollingPaper(toInt(selectedReportStudent))} 
                          className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white p-5 rounded-3xl font-black text-lg shadow-lg flex items-center justify-center gap-3 mt-6 transition-transform hover:-translate-y-1"
                        >
                          <Printer className="w-6 h-6"/> 온기 롤링페이퍼 인쇄
                        </button>
                      )}
                    </div>
                    
                    <div className="w-full md:w-2/3 bg-slate-50 p-10 rounded-[40px] border border-slate-200">
                      {selectedReportStudent ? (() => {
                        const s = allStats.find(x => x.id == selectedReportStudent);
                        if (!s) return <div className="h-full flex flex-col items-center justify-center text-slate-400 font-black"><AlertTriangle className="w-16 h-16 mb-4 opacity-30 text-red-500"/>삭제된 학생 데이터입니다.</div>;
                        
                        const counts = {}; 
                        SEL_OPTIONS.forEach(o => counts[o.name] = 0);
                        safeArray(db.approvedPraises).forEach(p => { if (p.toId == s.id && counts[p.tag] !== undefined) counts[p.tag]++; });
                        const max = Math.max(...Object.values(counts), 5);
                        
                        return (
                          <div className="animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-end mb-8 border-b-2 border-slate-200 pb-4">
                              <h4 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Star className="w-8 h-8 text-yellow-400 fill-yellow-400"/> {s.name} 학생 분석</h4>
                              <div className="text-right text-sm font-black text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                                위기 <span className="text-red-500">{s.atPen}회</span> | 기부 <span className="text-amber-500">{s.atDonate}🪙</span> | 출석 {s.weeklyCount}/5
                              </div>
                            </div>
                            
                            {s.enneagram && ENNEAGRAM_DATA[s.enneagram] && (
                              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-200 mb-10 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>
                                <h5 className="font-black text-indigo-900 mb-3 flex items-center gap-2 relative z-10"><Sparkles className="w-5 h-5 text-indigo-500"/> AI 교사 지원 힌트: {ENNEAGRAM_DATA[s.enneagram].name}</h5>
                                <p className="text-base font-bold text-indigo-800 leading-relaxed relative z-10">{ENNEAGRAM_DATA[s.enneagram].desc}</p>
                              </div>
                            )}
                            
                            <div className="space-y-5 mb-8">
                              {Object.keys(counts).map(tag => (
                                <div key={tag} className="flex items-center gap-5">
                                  <span className="w-28 text-sm font-black text-slate-600 text-right">{SEL_OPTIONS.find(o=>o.name === tag)?.short || tag}</span>
                                  <div className="flex-1 h-8 bg-white rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000" style={{ width: `${(counts[tag]/max)*100}%` }}></div>
                                  </div>
                                  <span className="w-12 font-black text-blue-600 text-right text-lg">{counts[tag]}회</span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="border-t-2 border-slate-200 pt-8 mt-8">
                              <button 
                                onClick={() => setShowNotesInReport(!showNotesInReport)} 
                                className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-black p-4 rounded-xl flex items-center justify-between transition-colors shadow-sm"
                              >
                                <span className="flex items-center gap-3"><StickyNote className="w-6 h-6"/> 누가기록 확인 ({s.notes.length}건)</span>
                                <span>{showNotesInReport ? '▲ 접기' : '▼ 펼치기'}</span>
                              </button>
                              
                              {showNotesInReport && (
                                <div className="mt-4 space-y-3 animate-in fade-in">
                                  {s.notes.length === 0 && <p className="text-sm text-slate-400 font-bold text-center py-6">작성된 기록이 없습니다.</p>}
                                  {s.notes.map(n => (
                                    <div key={n.id} className="bg-white p-4 rounded-2xl border border-yellow-200 flex justify-between items-start gap-4 shadow-sm">
                                      <div>
                                        <p className="text-[11px] font-black text-yellow-600 mb-1">{n.date}</p>
                                        <p className="text-base font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">{n.text}</p>
                                      </div>
                                      <button 
                                        onClick={() => deleteNote(s.id, n.id)} 
                                        className="p-2.5 bg-red-50 text-red-500 rounded-xl shrink-0 hover:bg-red-100"
                                      >
                                        <Trash2 className="w-4 h-4"/>
                                      </button>
                                    </div>
                                  ))}
                                  <button 
                                    onClick={() => openNoteModal(s.id)} 
                                    className="w-full bg-yellow-500 text-white p-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-yellow-600 shadow-md mt-4"
                                  >
                                    <Plus className="w-5 h-5"/> 이 학생의 새 기록 추가
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })() : <div className="h-full flex flex-col items-center justify-center text-slate-400 font-black"><BarChart3 className="w-16 h-16 mb-4 opacity-30"/>학생을 선택하면 리포트가 생성됩니다.</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* 4-4: 명단 관리 */}
              {adminSubTab === 'students' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">👥 학생 명단 및 성향 관리</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                    <div className="flex flex-wrap gap-4 mb-10 bg-slate-50 p-8 rounded-[30px] border border-slate-200 shadow-sm">
                      <input 
                        type="text" 
                        placeholder="새 학생 이름" 
                        value={newStudentName} 
                        onChange={e=>setNewStudentName(e.target.value)} 
                        onFocus={lockEditing} 
                        onBlur={unlockEditing} 
                        className="flex-1 p-5 rounded-2xl border border-slate-300 font-bold outline-none text-lg focus:border-blue-400 shadow-sm"
                      />
                      <select 
                        value={newStudentGroup} 
                        onChange={e=>setNewStudentGroup(e.target.value)} 
                        className="w-36 p-5 rounded-2xl border border-slate-300 font-bold outline-none text-lg shadow-sm"
                      >
                        {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}모둠</option>)}
                      </select>
                      <select 
                        value={newStudentEnneagram} 
                        onChange={e=>setNewStudentEnneagram(e.target.value)} 
                        className="w-40 p-5 rounded-2xl border border-slate-300 font-bold outline-none text-lg shadow-sm"
                      >
                        <option value="">성향 없음</option>
                        {Object.keys(ENNEAGRAM_DATA).map(k => <option key={k} value={k}>{k}번 유형</option>)}
                      </select>
                      <button 
                        onClick={handleAddStudent} 
                        className="bg-blue-600 text-white px-10 rounded-2xl font-black text-lg shadow-md hover:bg-blue-700 active:scale-95 transition-transform"
                      >
                        전입생 추가
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {safeStudents.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-3xl border-2 border-slate-100 flex justify-between items-center hover:border-blue-300 transition-colors shadow-sm">
                          <div>
                            <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg">{s.id}번 | {s.group}모둠</span>
                            <h4 className="font-black text-xl text-slate-800 mt-3 flex items-center gap-2">
                              {s.name} 
                              {s.enneagram && <span className="bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs px-3 py-1 rounded-full shadow-sm">{s.enneagram}번</span>}
                            </h4>
                          </div>
                          <button 
                            onClick={() => handleRemoveStudent(s.id)} 
                            className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                          >
                            <Trash2 className="w-5 h-5"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4-5: 출석 보정 */}
              {adminSubTab === 'attendAdmin' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">📅 출석 보정 관리</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                    <div className="bg-amber-50 p-8 rounded-3xl border-2 border-amber-200 mb-10 shadow-sm">
                      <h4 className="font-black text-amber-800 mb-4 flex items-center gap-2 text-xl"><Sparkles className="w-6 h-6"/> 공휴일 / 재량휴업일 일괄 보정</h4>
                      <p className="text-base font-bold text-amber-700 mb-6">현재 이번 주 보정값: <span className="text-amber-900 bg-white px-3 py-1 rounded-lg border border-amber-200">+{db.extraAttendDays || 0}일</span></p>
                      <button 
                        onClick={teacherAddHoliday} 
                        className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black text-xl hover:bg-amber-600 shadow-md transition-transform active:scale-95"
                      >
                        전체 학생의 출석일수 +1일 반영하기
                      </button>
                      <p className="text-xs font-bold text-amber-500 mt-4 leading-relaxed bg-white/50 p-4 rounded-xl border border-amber-100">
                        💡 이 버튼을 누르면 모든 학생의 이번 주 출석일수에 +1이 더해집니다. 보정 결과로 이번 주 5일을 채우게 된 학생들에게는 즉시 🪙3 코인의 개근 보너스가 자동으로 지급됩니다.
                      </p>
                    </div>
                    
                    <h4 className="font-black text-xl text-slate-700 mb-6 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> 이번 주 출석 달성 현황 ({getWeekKey()})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allStats.map(s => {
                        const bonus = db.attendanceBonus?.[getWeekKey()]?.[s.id];
                        return (
                          <div key={s.id} className={`p-5 rounded-2xl border-2 shadow-sm ${bonus ? 'bg-yellow-50 border-yellow-300' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-black text-lg">{s.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-base font-black text-slate-600 bg-white px-3 py-1 rounded-lg border">{s.weeklyCount}/5</span>
                                <span className="text-sm font-bold text-slate-400">⭐{s.streak}주</span>
                                {bonus && <span className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-black shadow-sm animate-pulse">개근 달성!</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 4-6: 환경/점수 세팅 */}
              {adminSubTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">환경 및 보안 통제소</h3>
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-10">

                    <div className="bg-slate-50 p-10 rounded-[30px] border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-10">
                      {[
                        { title: '관리자 비번 변경', color: 'blue', val: masterPwInput, setter: setMasterPwInput, field: 'masterPw', current: db.settings?.masterPw },
                        { title: '도움실 비번 변경', color: 'indigo', val: helpPwInput, setter: setHelpPwInput, field: 'helpRoomPw', current: db.settings?.helpRoomPw }
                      ].map(p => (
                        <div key={p.field}>
                          <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-lg"><Lock className={`w-6 h-6 text-${p.color}-500`}/> {p.title}</h4>
                          <div className="flex gap-3">
                            <input 
                              type="password" 
                              value={p.val} 
                              onChange={e=>p.setter(e.target.value)} 
                              onFocus={lockEditing} 
                              onBlur={unlockEditing} 
                              placeholder="새 비밀번호 입력" 
                              className="flex-1 p-4 rounded-2xl border border-slate-300 font-black outline-none focus:border-blue-400 shadow-sm text-lg"
                            />
                            <button 
                              onClick={() => { 
                                if (!p.val) return alert('입력하세요.'); 
                                sync({ settings: { ...db.settings, [p.field]: p.val } }); 
                                alert('변경 완료!'); 
                                p.setter(''); 
                              }} 
                              className={`bg-${p.color}-${p.color==='blue'?'600':'500'} text-white px-6 rounded-2xl font-black text-lg shadow-md`}
                            >
                              변경
                            </button>
                          </div>
                          <p className="text-sm font-bold text-slate-400 mt-3 bg-white inline-block px-3 py-1 rounded-lg border border-slate-200">현재 설정됨: {String(p.current)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-200">
                      <h4 className="font-black text-red-800 mb-3 flex items-center gap-2 text-lg"><LogOut className="w-6 h-6"/> 보안: 모든 기기 강제 로그아웃</h4>
                      <p className="text-sm font-bold text-red-600 mb-4">비밀번호가 유출되었을 때 누르세요. 선생님 본인을 포함해 접속 중인 모든 화면이 대시보드로 튕겨나갑니다.</p>
                      <button onClick={revokeAllSessions} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-md hover:bg-red-700 transition-colors">
                        모든 세션 즉시 무효화
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t-2 border-slate-100">
                      <div>
                        <label className="block text-base font-black text-slate-600 mb-4">대시보드 메인 타이틀</label>
                        <input 
                          type="text" 
                          value={db.settings?.title || ""} 
                          onChange={e=>sync({ settings: { ...db.settings, title: e.target.value } })} 
                          onFocus={lockEditing} 
                          onBlur={unlockEditing} 
                          className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-200 font-black text-xl outline-none focus:border-blue-400 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-base font-black text-slate-600 mb-4">이 주의 마음성장(SEL) 테마</label>
                        <select 
                          value={db.settings?.weeklyTheme || ""} 
                          onChange={e=>sync({ settings: { ...db.settings, weeklyTheme: e.target.value } })} 
                          className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-200 font-black text-xl outline-none focus:border-blue-400 shadow-sm"
                        >
                          {SEL_OPTIONS.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-base font-black text-slate-600 mb-4">쉬는 시간 기본 세팅(분)</label>
                        <input 
                          type="number" 
                          value={Math.floor((db.settings?.defaultBreakMs || DEFAULT_BREAK_MS)/60000)} 
                          onChange={e => sync({ settings: { ...db.settings, defaultBreakMs: toInt(e.target.value, 10)*60000 } })} 
                          onFocus={lockEditing} 
                          onBlur={unlockEditing} 
                          className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-200 font-black text-xl outline-none focus:border-blue-400 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t-2 border-slate-100">
                      <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-lg"><Eye className="w-6 h-6 text-blue-500"/> 학생 카드 정보 노출 옵션</h4>
                      <button 
                        onClick={toggleCumulativeStats} 
                        className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-md flex items-center justify-center gap-3 ${db.settings?.showCumulativeStats ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border-2 border-slate-300 hover:border-blue-300'}`}
                      >
                        <Eye className="w-6 h-6"/> 누적 스탯 표시 (교사 모드): {db.settings?.showCumulativeStats ? 'ON (현재 공개 중)' : 'OFF (비공개)'}
                      </button>
                      <p className="text-sm font-bold text-slate-400 mt-3 text-center">ON으로 설정 시, 학생 카드에 누적 완수/기부/펀딩/위기 횟수가 표시됩니다.</p>
                    </div>

                    <div className="pt-8 border-t-2 border-slate-100 bg-indigo-50/50 p-10 rounded-[40px] border border-indigo-100">
                      <h4 className="font-black text-2xl text-indigo-900 mb-6 flex items-center gap-3"><Settings className="w-6 h-6"/> 만능 점수 밸런스 및 수동 세팅</h4>
                      <div className="flex flex-col md:flex-row gap-4 mb-10 bg-white p-6 rounded-3xl shadow-sm border border-indigo-50">
                        <input 
                          type="number" 
                          value={manualScoreInput} 
                          onChange={e=>setManualScoreInput(e.target.value)} 
                          onFocus={lockEditing} 
                          onBlur={unlockEditing} 
                          placeholder="명성 점수 강제 추가/차감 (예: +50 또는 -20)" 
                          className="flex-1 p-4 rounded-2xl border border-slate-200 font-black outline-none text-base focus:border-indigo-400"
                        />
                        <button 
                          onClick={() => { 
                            const v = toInt(manualScoreInput); 
                            if (!v) return; 
                            if (window.confirm(`${v}점 적용?`)) { 
                              sync({ manualRepOffset: (db.manualRepOffset||0) + v }); 
                              setManualScoreInput(""); 
                            } 
                          }} 
                          className="bg-indigo-600 text-white px-10 rounded-2xl font-black text-lg shadow-md hover:bg-indigo-700 active:scale-95 transition-transform"
                        >
                          즉시 적용
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { label: '최고 목표 명성', key: 'targetScore', section: null, color: 'indigo', def: 5000 },
                          { label: '기본 온기 코인(🪙)', key: 'praiseBasic', section: 'pointConfig', color: 'indigo', def: 10 },
                          { label: '테마 일치 보너스(🪙)', key: 'praiseBonus', section: 'pointConfig', color: 'pink', def: 15 },
                          { label: '위기 지정 차감(p)', key: 'penalty', section: 'pointConfig', color: 'red', def: 20 }
                        ].map(f => (
                          <div key={f.key} className="bg-white p-5 rounded-2xl shadow-sm">
                            <label className={`block text-sm font-black text-${f.color}-600 mb-3`}>{f.label}</label>
                            <input 
                              type="number" 
                              value={f.section ? (db.settings?.[f.section]?.[f.key] ?? f.def) : (db.settings?.[f.key] ?? f.def)}
                              onChange={e => { 
                                const v = toInt(e.target.value, f.def); 
                                const next = f.section 
                                  ? { ...db.settings, [f.section]: { ...db.settings[f.section], [f.key]: v } } 
                                  : { ...db.settings, [f.key]: v }; 
                                sync({ settings: next }); 
                              }}
                              onFocus={lockEditing} 
                              onBlur={unlockEditing} 
                              className={`w-full p-4 rounded-xl border border-${f.color}-200 font-black text-lg text-${f.color}-600 outline-none focus:border-${f.color}-400`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4-7: 리셋/마감 */}
              {adminSubTab === 'reset' && (
                <div className="animate-in fade-in space-y-8">
                  <h3 className="text-3xl font-black text-slate-800 border-l-8 border-red-500 pl-6 mb-8">데이터 초기화 및 1학기 마감</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-blue-50 border-4 border-blue-200 p-12 rounded-[50px] text-center shadow-lg">
                      <History className="w-20 h-20 text-blue-500 mx-auto mb-6" />
                      <h3 className="text-4xl font-black mb-6 text-blue-800">1학기 최종 마감</h3>
                      <p className="font-bold text-blue-600 mb-10 text-lg">코인과 직업 숙련도를 리셋하고, 누적 데이터는 보존합니다.</p>
                      <button 
                        onClick={closeSemester} 
                        className="bg-blue-600 text-white px-12 py-6 rounded-[35px] font-black text-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        학기 마감 실행
                      </button>
                    </div>
                    <div className="bg-red-50 border-4 border-red-200 p-12 rounded-[50px] text-center shadow-lg">
                      <Trash2 className="w-20 h-20 text-red-500 mx-auto mb-6" />
                      <h3 className="text-4xl font-black mb-6 text-red-800">시스템 공장 초기화</h3>
                      <p className="font-bold text-red-600 mb-10 text-lg">명단과 세팅을 제외한 모든 데이터를 영구적으로 삭제합니다.</p>
                      <button 
                        onClick={factoryReset} 
                        className="bg-red-600 text-white px-12 py-6 rounded-[35px] font-black text-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all"
                      >
                        공장 초기화 실행
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ═══ 모달 영역 ═══ */}
      
      {/* 1. 온기 우체통 팝업 */}
      {showPraiseModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[5001] p-4">
          <div className="bg-white p-12 rounded-[50px] w-full max-w-xl shadow-2xl animate-in zoom-in-95 border-4 border-pink-100">
            <h3 className="text-4xl font-black text-pink-600 mb-10 flex items-center justify-center gap-3">
              <Heart className="w-10 h-10 fill-pink-500"/> 따뜻한 온기 제보
            </h3>
            <div className="space-y-6 mb-10">
              <select 
                value={praiseTarget} 
                onChange={e=>setPraiseTarget(e.target.value)} 
                className="w-full p-6 rounded-3xl bg-slate-50 border-2 font-black text-xl outline-none focus:border-pink-400 shadow-sm"
              >
                <option value="">누구를 칭찬할까요?</option>
                <option value="me" className="text-pink-600">🙋 나 자신 (스스로 대견할 때!)</option>
                {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select 
                value={praiseTag} 
                onChange={e=>setPraiseTag(e.target.value)} 
                className="w-full p-6 rounded-3xl bg-slate-50 border-2 font-black text-xl outline-none focus:border-pink-400 shadow-sm"
              >
                <option value="">어떤 역량인가요?</option>
                {SEL_OPTIONS.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
              </select>
              <textarea 
                value={praiseText} 
                onChange={e=>setPraiseText(e.target.value)} 
                rows="5" 
                placeholder={praiseTag ? PRAISE_GUIDES[praiseTag] : "위에서 역량을 먼저 선택해 주세요! 💌"} 
                className="w-full p-6 rounded-[30px] bg-pink-50 border-2 border-pink-100 font-black text-lg outline-none focus:border-pink-400 text-pink-900 shadow-inner resize-none placeholder:text-pink-300"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowPraiseModal(false)} 
                className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[30px] font-black text-xl hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={submitPraise} 
                className="flex-1 py-6 bg-pink-500 text-white rounded-[30px] font-black text-xl shadow-xl hover:bg-pink-600 active:scale-95 transition-transform flex justify-center items-center gap-2"
              >
                <Send className="w-6 h-6"/> 보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 누가기록 팝업 */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[5002] p-4">
          <div className="bg-white p-12 rounded-[50px] w-full max-w-xl shadow-2xl animate-in zoom-in-95 border-4 border-yellow-200">
            <h3 className="text-3xl font-black text-yellow-700 mb-4 flex items-center gap-3">
              <StickyNote className="w-8 h-8"/> 누가기록 작성
            </h3>
            <p className="text-base font-bold text-yellow-600 mb-8 bg-yellow-50 px-4 py-2 rounded-xl inline-block border border-yellow-100">
              {allStats.find(s => s.id === showNoteModal)?.name} 학생 · {formatDate()}
            </p>
            <textarea 
              value={noteText} 
              onChange={e=>setNoteText(e.target.value)} 
              rows="6" 
              placeholder="오늘의 관찰내용, 일화, 특별한 지도사항을 자유롭게 기록하세요." 
              autoFocus 
              className="w-full p-6 rounded-[30px] bg-yellow-50 border-2 border-yellow-200 font-black text-lg outline-none focus:border-yellow-400 text-yellow-900 shadow-inner mb-8 resize-none placeholder:text-yellow-400/60"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => { setShowNoteModal(null); setNoteText(""); }} 
                className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[30px] font-black text-xl hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={submitNote} 
                className="flex-1 py-6 bg-yellow-500 text-white rounded-[30px] font-black text-xl shadow-xl hover:bg-yellow-600 active:scale-95 transition-transform"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 비밀번호 팝업 */}
      {showModal === 'password' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-[5003]">
          <div className="bg-white rounded-[60px] p-16 w-full max-w-2xl text-center shadow-2xl animate-in zoom-in-95 border-4 border-blue-100">
            <Lock className="w-24 h-24 text-blue-500 mx-auto mb-8" />
            <h3 className="text-4xl font-black mb-10 text-blue-900">비밀번호를 입력하세요</h3>
            <input 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              onKeyDown={e=>e.key==='Enter' && handleLogin()} 
              className="w-full text-center text-7xl tracking-[20px] font-black p-8 border-4 rounded-[40px] outline-none mb-12 bg-slate-50 focus:border-blue-400 shadow-inner" 
              autoFocus
            />
            <div className="flex gap-4">
              <button 
                onClick={() => { setShowModal(null); setPassword(""); }} 
                className="flex-1 py-6 rounded-[30px] font-black text-slate-500 text-2xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleLogin} 
                className="flex-1 py-6 rounded-[30px] font-black bg-blue-600 text-white text-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-transform"
              >
                접속하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 롤링페이퍼 팝업 */}
      {showRollingPaper && (() => {
        const s = allStats.find(x => x.id === showRollingPaper);
        if (!s) return null;
        const praises = safeArray(db.approvedPraises).filter(p => p.toId == s.id);
        
        return (
          <div className="fixed inset-0 bg-white z-[5004] overflow-auto flex flex-col items-center">
            <div className="w-full bg-slate-100 p-5 flex justify-between items-center print:hidden sticky top-0 z-50 border-b-2 shadow-sm">
              <h3 className="font-black text-slate-700 text-xl flex items-center gap-2">
                <Printer className="w-6 h-6"/> 인쇄 미리보기 모드
              </h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.print()} 
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-md hover:bg-blue-700 active:scale-95 transition-transform"
                >
                  <Printer className="w-5 h-5"/> 인쇄하기
                </button>
                <button 
                  onClick={() => setShowRollingPaper(null)} 
                  className="bg-white text-slate-600 border-2 border-slate-300 px-8 py-3 rounded-2xl font-black hover:bg-slate-50"
                >
                  닫기
                </button>
              </div>
            </div>
            
            <div className="max-w-5xl w-full p-16 print:p-0">
              <div className="text-center mb-16 border-b-4 border-pink-200 pb-10">
                <Heart className="w-20 h-20 text-pink-400 fill-pink-100 mx-auto mb-6"/>
                <h1 className="text-5xl font-black mb-4 text-slate-800 tracking-tight">달보드레 온기 롤링페이퍼</h1>
                <p className="text-3xl font-bold text-slate-500">소중한 우리 반 보물, <span className="text-pink-600 font-black bg-pink-50 px-4 py-1.5 rounded-2xl border border-pink-100">{s.name}</span>에게</p>
              </div>
              <div className="grid grid-cols-2 gap-8 print:grid-cols-2 print:gap-6">
                {praises.map(p => (
                  <div key={p.id} className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 p-8 rounded-[40px] shadow-sm print:border print:shadow-none break-inside-avoid">
                    <p className="text-sm font-black text-pink-600 mb-4 bg-white inline-block px-4 py-1.5 rounded-full border border-pink-100">
                      {SEL_OPTIONS.find(o=>o.name===p.tag)?.short}
                    </p>
                    <p className="text-2xl font-bold text-slate-800 leading-relaxed">"{p.text}"</p>
                    <p className="text-right text-sm font-bold text-slate-400 mt-6">- {p.date} -</p>
                  </div>
                ))}
                {praises.length === 0 && (
                  <div className="col-span-2 text-center py-32 text-slate-300 font-black text-3xl">
                    아직 받은 사연이 없습니다. 친구에게 먼저 온기를 건네볼까요?
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ NAVIGATION BAR ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-4 border-amber-100 px-6 py-4 flex justify-around items-center z-[4000] shadow-[0_-15px_50px_rgba(0,0,0,0.08)] pb-8 print:hidden">
        {[
          { id: 'dashboard',  icon: <Target className="w-8 h-8 md:w-10 md:h-10"/>,   label: db.settings?.menuNames?.[0] || "현황판",      color: "text-blue-500" },
          { id: 'reflection', icon: <BookOpen className="w-8 h-8 md:w-10 md:h-10"/>,  label: db.settings?.menuNames?.[1] || "성찰과 회복", color: "text-emerald-500" },
          { id: 'helproom',   icon: <Users className="w-8 h-8 md:w-10 md:h-10"/>,     label: db.settings?.menuNames?.[2] || "도움실",      color: "text-indigo-500" },
          { id: 'admin',      icon: <Settings className="w-8 h-8 md:w-10 md:h-10"/>,  label: db.settings?.menuNames?.[3] || "관리실",      color: "text-slate-600" }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => {
              if (item.id === 'admin') { 
                isAuthenticated === 'teacher' ? setActiveTab('admin') : setShowModal('password'); 
              } else if (item.id === 'helproom') { 
                (isAuthenticated === 'inspector' || isAuthenticated === 'teacher') ? setActiveTab('helproom') : setShowModal('password'); 
              } else {
                setActiveTab(item.id);
              }
            }}
            className={`flex flex-col items-center gap-2 flex-1 transition-all duration-300 ${activeTab === item.id ? `${item.color} scale-110 -translate-y-3 drop-shadow-lg` : 'text-slate-400 opacity-60 hover:opacity-100 hover:-translate-y-1'}`}
          >
            {item.icon}
            <span className="text-xs md:text-sm font-black">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ═══ GLOBAL STYLES ═══ */}
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes flyToScore {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 1; transform: translateY(-30px) scale(1.5); }
          100% { opacity: 0; transform: translate(-500px, -500px) scale(0.3); }
        }
        @keyframes redFlash {
          0%, 100% { background-color: rgb(254,226,226); }
          50% { background-color: rgb(239,68,68); color: white; }
        }
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
        .fade-in { animation-name: fadeIn; }
        .zoom-in-95 { animation-name: zoomIn95; }
        .animate-spin-slow { animation: spin 6s linear infinite; }
        .animate-flyToScore { animation: flyToScore 1.4s ease-in-out forwards; }
        .animate-redFlash { animation: redFlash 0.6s ease-in-out infinite; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 12px; border: 2px solid #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        @media print {
          body { background: white !important; margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ⏱ 초대형 타이머 위젯 컴포넌트
// ══════════════════════════════════════════════════════════════
function TimerWidget({ 
  status, display, timer, warningLevel, breakInput, setBreakInput, 
  defaultBreakMin, onStopwatch, onCountdown, onPause, onResume, onReset, 
  onBreak, lockEditing, unlockEditing 
}) {
  const isBreak = status === 'break';
  const isRunning = timer?.isRunning;
  const flashClass = isBreak && warningLevel === 3 ? 'animate-redFlash' : '';
  const bgClass = isBreak 
    ? (warningLevel >= 2 ? 'bg-red-100 border-red-300' : 'bg-emerald-100 border-emerald-300') 
    : 'bg-white/80 border-white';

  return (
    <div className={`p-6 md:p-8 rounded-[40px] border-4 shadow-2xl backdrop-blur-md ${bgClass} ${flashClass} flex flex-col h-full min-h-[340px]`}>
      
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 border-b border-black/5 pb-4">
        
        <div className="flex items-center gap-2">
          {isBreak ? <Coffee className="w-6 h-6 text-emerald-600"/> : <Timer className="w-6 h-6 text-slate-600"/>}
          <span className="text-lg font-black uppercase tracking-widest text-slate-700">
            {isBreak ? '쉬는 시간' : (status === 'class_sw' ? '스톱워치' : status === 'class_cd' ? '카운트다운' : '현재 수업 중')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === 'idle' ? (
            <>
              <div className="flex bg-slate-200/50 p-1 rounded-lg">
                {[1, 3, 5, 10].map(m => (
                  <button 
                    key={m} 
                    onClick={() => onCountdown(m)} 
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 rounded text-xs font-black shadow-sm mx-0.5 transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button 
                onClick={onStopwatch} 
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-sm transition-colors"
              >
                <Play className="w-3 h-3 fill-white"/> 스톱워치
              </button>
              
              <div className="flex gap-1 ml-1 bg-emerald-50 p-1 rounded-lg border border-emerald-100">
                <input 
                  type="number" 
                  value={breakInput} 
                  onChange={e => setBreakInput(e.target.value)} 
                  onFocus={lockEditing} 
                  onBlur={unlockEditing} 
                  className="w-10 px-1 py-1 text-xs font-black text-center text-emerald-900 bg-white rounded border border-emerald-200 outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={() => onBreak(Math.max(1, toInt(breakInput, defaultBreakMin)))} 
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-black flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Coffee className="w-3 h-3"/> 쉬는시간
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {isRunning ? (
                <button onClick={onPause} className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-black flex items-center gap-1 shadow-sm hover:bg-yellow-600 transition-colors">
                  <Pause className="w-4 h-4 fill-white"/> 일시정지
                </button>
              ) : (
                <button onClick={onResume} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-black flex items-center gap-1 shadow-sm hover:bg-green-600 transition-colors">
                  <Play className="w-4 h-4 fill-white"/> 계속
                </button>
              )}
              <button onClick={onReset} className="px-4 py-2 bg-slate-400 text-white rounded-lg text-sm font-black flex items-center gap-1 shadow-sm hover:bg-slate-500 transition-colors">
                <RotateCcw className="w-4 h-4"/> 종료
              </button>
            </div>
          )}
        </div>

      </div>

      <div className="flex-1 flex items-center justify-center py-4">
        <span className="text-[120px] md:text-[160px] lg:text-[180px] font-black tracking-tighter tabular-nums leading-none text-slate-800 drop-shadow-md">
          {display}
        </span>
      </div>
      
    </div>
  );
}
