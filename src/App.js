/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Trophy, ShieldCheck, Heart, Lock, History, Save, X, 
  Plus, Minus, AlertTriangle, Sparkles, Star, Target, Settings, 
  Trash2, ShoppingCart, CheckCircle2, BookOpen, UserCheck, Briefcase, 
  Zap, Crown, Gift, Coins, BarChart3, MessageSquare, Send, Gavel, 
  Leaf, TreeDeciduous, Bird, Flame, Shield, Printer, Timer, Flag
} from 'lucide-react';

// ==========================================
// 🚨 파이어베이스 주소 (선생님의 주소로 유지하세요)
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/"; 
// ==========================================

const safeArray = (val) => (Array.isArray(val) ? val.filter(Boolean) : (typeof val === 'object' && val ? Object.values(val).filter(Boolean) : []));

// 🎵 효과음 엔진
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'good') { 
      osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); 
      osc.type = 'sine'; osc.start(); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3); osc.stop(ctx.currentTime + 0.3); 
    } else if (type === 'bad') { 
      osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); 
      osc.type = 'sawtooth'; osc.start(); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3); osc.stop(ctx.currentTime + 0.3); 
    } else if (type === 'buy' || type === 'gacha') { 
      osc.frequency.setValueAtTime(500, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2); 
      osc.type = 'square'; osc.start(); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2); osc.stop(ctx.currentTime + 0.2); 
    } else if (type === 'jackpot') { 
      osc.type = 'triangle'; [440, 554.37, 659.25, 880].forEach((f, i) => osc.frequency.setValueAtTime(f, ctx.currentTime + i*0.1));
      osc.start(); gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6); osc.stop(ctx.currentTime + 0.6); 
    }
  } catch (e) {}
};

// 🔥 에니어그램 데이터 (교사용 AI 힌트)
const ENNEAGRAM_DATA = {
  "1": { name: '1번(개혁가)', desc: '규칙과 책임을 잘 지켜요. 결과보다 과정의 꼼꼼함과 정직함을 알아주세요.' },
  "2": { name: '2번(조력자)', desc: '관계와 배려를 중시해요. "네 덕분에 고마워"라는 진심 어린 인사가 가장 큰 힘이 됩니다.' },
  "3": { name: '3번(성취자)', desc: '목표 지향적이에요. 구체적인 성과와 학급에 기여한 바를 명확히 인정해 주면 동기가 부여됩니다.' },
  "4": { name: '4번(예술가)', desc: '자신만의 개성과 감정을 중시해요. 독창적인 아이디어나 깊은 감수성을 존중하고 지지해 주세요.' },
  "5": { name: '5번(사색가)', desc: '논리와 분석을 좋아해요. 혼자만의 시간을 존중하고 지적인 호기심을 칭찬해 주세요.' },
  "6": { name: '6번(충실가)', desc: '안전과 소속감을 중요하게 생각해요. "우리가 함께한다"는 든든한 지지와 확신이 필요합니다.' },
  "7": { name: '7번(열정가)', desc: '재미와 자유를 추구해요. 긍정적인 에너지와 다양한 호기심을 제한하기보다 격려해 주세요.' },
  "8": { name: '8번(도전자)', desc: '강한 의지와 리더십이 있어요. 스스로 결정하고 이끌 수 있는 기회와 신뢰를 부여해 주세요.' },
  "9": { name: '9번(평화주의자)', desc: '조화와 갈등 없는 상태를 원해요. 다그치기보다 편안한 분위기에서 의견을 물어봐 주세요.' }
};

const defaultStudents = [
  { id: 1, name: '금채율', role: '학급문고 정리', group: 1, isLeader: true, enneagram: '2' }, { id: 2, name: '김라희', role: '우유 배달', group: 1, isLeader: false, enneagram: '9' },
  { id: 3, name: '김민지', role: '다툼 중재자', group: 1, isLeader: false, enneagram: '6' }, { id: 4, name: '김수은', role: '생활태도 체크', group: 1, isLeader: false, enneagram: '1' },
  { id: 5, name: '김시우', role: '칠판 정리', group: 2, isLeader: true, enneagram: '3' }, { id: 6, name: '박서정', role: '질서 관리', group: 2, isLeader: false, enneagram: '8' },
  { id: 7, name: '이하윤', role: '학급문고 정리', group: 2, isLeader: false, enneagram: '4' }, { id: 8, name: '장세아', role: '문 닫기', group: 2, isLeader: false, enneagram: '7' },
  { id: 9, name: '최예나', role: '우유 배달', group: 3, isLeader: true, enneagram: '' }, { id: 10, name: '허수정', role: '감찰사', group: 3, isLeader: false, enneagram: '' },
  { id: 11, name: '황지인', role: '칠판 정리', group: 3, isLeader: false, enneagram: '' }, { id: 12, name: '김도운', role: '생활 배출물 관리', group: 3, isLeader: false, enneagram: '' },
  { id: 13, name: '김윤재', role: '과제 확인', group: 4, isLeader: true, enneagram: '' }, { id: 14, name: '김정현', role: '질서 관리', group: 4, isLeader: false, enneagram: '' },
  { id: 15, name: '김태영', role: '복사물 관리', group: 4, isLeader: false, enneagram: '' }, { id: 16, name: '김해준', role: '칠판 정리', group: 4, isLeader: false, enneagram: '' },
  { id: 17, name: '박동민', role: '과제 확인', group: 5, isLeader: true, enneagram: '' }, { id: 18, name: '서이환', role: '가습기 관리', group: 5, isLeader: false, enneagram: '' },
  { id: 19, name: '윤호영', role: '우유 배달', group: 5, isLeader: false, enneagram: '' }, { id: 20, name: '이서준', role: '과제 확인', group: 5, isLeader: false, enneagram: '' },
  { id: 21, name: '이승현', role: '신발장 관리', group: 6, isLeader: true, enneagram: '' }, { id: 22, name: '임유성', role: '질서 관리', group: 6, isLeader: false, enneagram: '' },
  { id: 23, name: '장세형', role: '다툼 중재자', group: 6, isLeader: false, enneagram: '' }, { id: 24, name: '조승원', role: '부착물 관리', group: 6, isLeader: false, enneagram: '' },
  { id: 25, name: '차민서', role: '신발장 관리', group: 6, isLeader: false, enneagram: '' }, { id: 26, name: '배지훈', role: '문 닫기', group: 6, isLeader: false, enneagram: '' }
];

const SEL_OPTIONS = [
  { id: 'sel1', short: '자기 인식', name: '1단계: 자기 인식 (Self-awareness)' }, { id: 'sel2', short: '자기 관리', name: '2단계: 자기 관리 (Self-management)' },
  { id: 'sel3', short: '사회적 인식', name: '3단계: 사회적 인식 (Social awareness)' }, { id: 'sel4', short: '관계 기술', name: '4단계: 관계 기술 (Relationship skills)' },
  { id: 'sel5', short: '책임있는 결정', name: '5단계: 책임 있는 의사결정 (Responsible decision-making)' }
];
const SEL_GUIDES = { 
  "1단계: 자기 인식 (Self-awareness)": "상황: 그때 내 몸과 마음에서 어떤 느낌이 들었나요?\n다짐: 내 진짜 감정의 원인은 무엇이었고, 나의 어떤 강점을 활용해 이 마음을 보듬어줄 수 있을까요?", 
  "2단계: 자기 관리 (Self-management)": "상황: 화가 나거나 포기하고 싶었을 때 내 행동은 어땠나요?\n다짐: 감정의 파도를 다스리고, 다음에는 어떻게 다르게 행동할지 구체적으로 적어보세요.", 
  "3단계: 사회적 인식 (Social awareness)": "상황: 친구의 표정이나 말투를 보았을 때 친구의 마음은 어땠을 것 같나요?\n공감: 내가 그 친구의 입장이었다면 어떤 따뜻한 말이나 도움이 필요했을지 상상해 보세요.", 
  "4단계: 관계 기술 (Relationship skills)": "상황: 대화나 활동 중 서로 오해가 생기거나 배려가 부족했던 순간을 적어보세요.\n행동: 마법 같은 우정을 다시 이어가기 위해 내가 먼저 할 수 있는 행동은 무엇인가요?", 
  "5단계: 책임 있는 의사결정 (Responsible decision-making)": "상황: 우리 반의 규칙이나 분위기를 흐릴 수 있었던 나의 선택은 무엇이었나요?\n다짐: 나뿐만 아니라 우리 모두를 위해 더 나은 세상을 만드는 바른 선택을 실천해보세요." 
};
const THEME_DESCRIPTIONS = {
  "1단계: 자기 인식 (Self-awareness)": "나의 감정과 강점을 발견하고 이해하는 한 주를 보내요! 🌱", "2단계: 자기 관리 (Self-management)": "감정을 조절하고 목표를 향해 끝까지 노력하는 한 주를 보내요! ⛵",
  "3단계: 사회적 인식 (Social awareness)": "친구의 마음에 공감하고 다름을 존중하는 한 주를 보내요! 🤝", "4단계: 관계 기술 (Relationship skills)": "서로 소통하고 배려하며 마법 같은 우정을 쌓는 한 주를 보내요! ✨",
  "5단계: 책임 있는 의사결정 (Responsible decision-making)": "나와 공동체를 위해 책임감 있는 바른 선택을 하는 한 주를 보내요! ⚖️"
};

export default function App() {
  // --- UI & 상태 변수 ---
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [helpSubTab, setHelpSubTab] = useState('inspector');
  const [adminSubTab, setAdminSubTab] = useState('mission');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null);
  
  // 폼 및 기능 상태
  const [showPraiseModal, setShowPraiseModal] = useState(false); 
  const [praiseTarget, setPraiseTarget] = useState(""); const [praiseTag, setPraiseTag] = useState(""); const [praiseText, setPraiseText] = useState("");
  const [refTarget, setRefTarget] = useState(""); const [refTag, setRefTag] = useState(""); const [refText, setRefText] = useState("");
  const [newRole, setNewRole] = useState(""); const [newItemName, setNewItemName] = useState(""); const [newItemPrice, setNewItemPrice] = useState(""); const [newItemType, setNewItemType] = useState("shop");
  const [artisanTarget, setArtisanTarget] = useState(""); const [artisanItemName, setArtisanItemName] = useState(""); const [artisanItemPrice, setArtisanItemPrice] = useState("");
  const [selectedReportStudent, setSelectedReportStudent] = useState("");
  const [newStudentName, setNewStudentName] = useState(""); const [newStudentGroup, setNewStudentGroup] = useState("1"); const [newStudentRole, setNewStudentRole] = useState(""); const [newStudentEnneagram, setNewStudentEnneagram] = useState("");
  const [newFundName, setNewFundName] = useState(""); const [newFundTarget, setNewFundTarget] = useState("");
  const [manualScoreInput, setManualScoreInput] = useState("");
  
  // 관리자 커스텀 비번, 타임어택, 릴레이 입력용 상태
  const [masterPwInput, setMasterPwInput] = useState(""); const [helpPwInput, setHelpPwInput] = useState("");
  const [taTitle, setTaTitle] = useState("바닥 쓰레기 0개 만들기!"); const [taMins, setTaMins] = useState(10); const [taReward, setTaReward] = useState(100);
  const [relayTitle, setRelayTitle] = useState("이번 주 온기 사연 30개 돌파!"); const [relayTarget, setRelayTarget] = useState(30); const [relayCoin, setRelayCoin] = useState(50); const [relayRep, setRelayRep] = useState(100);

  const [showRollingPaper, setShowRollingPaper] = useState(null); // 인쇄할 학생 ID
  const [timeLeftString, setTimeLeftString] = useState(""); // 타임어택 UI용

  // --- 통합 파이어베이스 DB State ---
  const [db, setDb] = useState({
    students: defaultStudents, 
    rolesList: ['학급문고 정리', '우유 배달', '다툼 중재자', '현령', '감찰사'],
    settings: { 
      title: "달보드레 행복 교실 🌸", menuNames: ["행복 현황판", "성찰과 회복", "도움실", "관리실"], 
      targetScore: 5000, forceShopOpen: false, weeklyTheme: "4단계: 관계 기술 (Relationship skills)", 
      masterPw: "6505", helpRoomPw: "1111", isGachaOpen: false, isBlackMarketOpen: false, showCumulativeStats: false,
      pointConfig: { praiseBasic: 10, praiseBonus: 15, penalty: 20 }
    },
    gachaConfig: { mode: 'normal', cost: 30, t1: {name:'😭 꽝!', prob:50, reward:0}, t2: {name:'🪙 페이백!', prob:30, reward:30}, t3: {name:'🍬 소소한 간식', prob:15, reward:50}, t4: {name:'🎰 잭팟!!', prob:5, reward:200} },
    coopQuest: { q1: 50, q2: 20, q3: 20, q4: 100, goodWeek: 0 },
    weeklyRelay: { isActive: true, title: "이번 주 온기 사연 30개 돌파!", target: 30, current: 0, rewardCoin: 50, rewardRep: 100, completed: false },
    timeAttack: { isActive: false, title: "바닥 쓰레기 0개 만들기!", rewardRep: 100, endTime: null },
    shopItems: [], blackMarketItems: [], pendingShopItems: [], roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, 
    pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [], funding: [], manualRepOffset: 0, shieldPoints: 0, 
    allTime: { exp: {}, penalty: {}, donate: {}, fund: {} }, activeMission: { isActive: false, participants: [] }
  });

  // --- 실시간 DB 동기화 및 타임어택 타이머 ---
  useEffect(() => {
    const fetchLive = async () => {
      try { 
        const res = await fetch(`${DATABASE_URL}v76Data.json`); 
        const data = await res.json(); 
        if (data) setDb(prev => ({...prev, ...data, settings: {...prev.settings, ...(data.settings||{})}, allTime: {...prev.allTime, ...(data.allTime||{})}, coopQuest: {...prev.coopQuest, ...(data.coopQuest||{})}, weeklyRelay: {...prev.weeklyRelay, ...(data.weeklyRelay||{})}, timeAttack: {...prev.timeAttack, ...(data.timeAttack||{})}})); 
      } catch (e) {}
      setIsLoading(false);
    };
    fetchLive(); const interval = setInterval(fetchLive, 3000); return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer;
    if (db.timeAttack?.isActive && db.timeAttack?.endTime) {
      timer = setInterval(() => {
        const diff = Math.floor((db.timeAttack.endTime - Date.now()) / 1000);
        if (diff <= 0) { setTimeLeftString("00:00 (종료/실패)"); clearInterval(timer); } 
        else { setTimeLeftString(`${Math.floor(diff/60).toString().padStart(2,'0')}:${(diff%60).toString().padStart(2,'0')}`); }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [db.timeAttack]);

  const sync = async (updates) => {
    const nextDb = { ...db, ...updates }; setDb(nextDb);
    try { await fetch(`${DATABASE_URL}v76Data.json`, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  // --- 연산 로직 ---
  const safeStudents = safeArray(db.students);

  const allStats = useMemo(() => {
    return safeStudents.map(s => {
      const exp = db.roleExp[s.id] || 0; const bonus = db.bonusCoins?.[s.id] || 0;
      const coins = Math.max(0, (exp * 10) + bonus - (db.usedCoins[s.id] || 0));
      let mastery = { label: '🌱 인턴', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200' };
      if (exp >= 20) mastery = { label: '👑 장인', color: 'text-amber-700', bg: 'bg-gradient-to-r from-amber-100 to-yellow-200 border-amber-400 drop-shadow-sm' };
      else if (exp >= 10) mastery = { label: '💎 전문가', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' };
      return { ...s, exp, coins, mastery, status: db.studentStatus[s.id] || 'normal', atExp: db.allTime?.exp?.[s.id] || 0, atDonate: db.allTime?.donate?.[s.id] || 0, atFund: db.allTime?.fund?.[s.id] || 0, atPen: db.allTime?.penalty?.[s.id] || 0 };
    });
  }, [safeStudents, db.roleExp, db.bonusCoins, db.usedCoins, db.studentStatus, db.allTime]);

  const activeStudents = useMemo(() => allStats.filter(s => s.status !== 'crisis'), [allStats]); // 🚨 위기 상태 고립용 필터 명단

  const sortedDashboardStats = useMemo(() => {
    if (db.settings.showCumulativeStats) return [...allStats].sort((a, b) => a.id - b.id);
    return [...allStats].sort((a, b) => { const order = { crisis: 0, pending: 1, normal: 2 }; if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]; return a.id - b.id; });
  }, [allStats, db.settings.showCumulativeStats]);

  const groupedByGroupStats = useMemo(() => [...allStats].sort((a, b) => a.group - b.group || a.id - b.id), [allStats]);
  
  const { classReputation, shieldPoints, evolutionLevel } = useMemo(() => {
    const raw = allStats.reduce((sum, s) => sum + (s.exp * 10) + (db.bonusCoins?.[s.id] || 0) - ((db.penaltyCount[s.id] || 0) * (db.settings.pointConfig?.penalty || 20)), 0) + safeArray(db.donations).reduce((sum, d) => sum + d.amount, 0) + (db.manualRepOffset || 0);
    let r = Math.max(0, raw); let s = db.shieldPoints || 0;
    if (raw > db.settings.targetScore) { r = db.settings.targetScore; s = raw - db.settings.targetScore; }
    const level = Math.min(Math.floor(r / 1000), 5);
    return { classReputation: r, shieldPoints: s, evolutionLevel: level };
  }, [allStats, db.penaltyCount, db.bonusCoins, db.donations, db.settings.targetScore, db.manualRepOffset, db.settings.pointConfig, db.shieldPoints]);

  const topExp = useMemo(() => [...allStats].sort((a,b) => b.atExp - a.atExp).filter(s => s.atExp > 0).slice(0,5), [allStats]);
  const isShopOpen = useMemo(() => db.settings.forceShopOpen || new Date().getDay() === 4, [db.settings.forceShopOpen]);

  // --- 액션 핸들러 ---
  const handleGivePenalty = (id) => { if (!isAuthenticated) return setShowModal('password'); if (window.confirm("위기 지정할까요?")) { playSound('bad'); sync({ studentStatus: { ...db.studentStatus, [id]: 'crisis' }, penaltyCount: { ...db.penaltyCount, [id]: (db.penaltyCount[id] || 0) + 1 }, allTime: { ...db.allTime, penalty: { ...db.allTime.penalty, [id]: (db.allTime.penalty?.[id] || 0) + 1 } } }); } };
  
  // 학급 공동 퀘스트 핸들러
  const addCoopScore = (points, title) => { playSound('jackpot'); sync({ manualRepOffset: (db.manualRepOffset || 0) + points }); alert(`🎉 [${title}] 달성! 평판 점수 +${points}점 획득!`); };
  const adjustGoodWeek = (delta) => { const next = Math.max(0, Math.min(5, (db.coopQuest.goodWeek || 0) + delta)); sync({ coopQuest: { ...db.coopQuest, goodWeek: next } }); if(delta > 0) playSound('good'); };
  const completeGoodWeek = () => { playSound('jackpot'); sync({ coopQuest: { ...db.coopQuest, goodWeek: 0 }, manualRepOffset: (db.manualRepOffset || 0) + (db.coopQuest.q4 || 100) }); alert(`🌟 사이 좋은 일주일 완성! +${db.coopQuest.q4 || 100}점!`); };

  // 타임어택 핸들러
  const handleStartTimeAttack = () => { if(window.confirm("타임어택을 시작합니까?")) sync({ timeAttack: { isActive: true, title: taTitle, rewardRep: taReward, endTime: Date.now() + (taMins * 60 * 1000) } }); };
  const handleCompleteTimeAttack = () => { playSound('jackpot'); sync({ manualRepOffset: (db.manualRepOffset || 0) + (db.timeAttack.rewardRep || 0), timeAttack: { isActive: false, title: "", rewardRep: 0, endTime: null } }); alert("🎉 타임어택 성공! 보상 지급 완료!"); };
  const handleFailTimeAttack = () => { sync({ timeAttack: { isActive: false, title: "", rewardRep: 0, endTime: null } }); alert("타임어택 종료 (실패)"); };

  // 릴레이 생성
  const handleCreateRelay = () => { if(window.confirm("새로운 릴레이 미션을 배포합니까?")) sync({ weeklyRelay: { isActive: true, title: relayTitle, target: relayTarget, current: 0, rewardCoin: relayCoin, rewardRep: relayRep, completed: false } }); };

  const submitPraise = () => { if (!praiseTarget || !praiseTag || !praiseText) return alert("빈칸 확인!"); sync({ pendingPraises: [{ id: Date.now(), toId: praiseTarget, tag: praiseTag, text: praiseText, date: new Date().toLocaleDateString() }, ...safeArray(db.pendingPraises)] }); setShowPraiseModal(false); setPraiseTarget(""); setPraiseText(""); setPraiseTag(""); alert("온기 배달 완료! 💌"); };
  
  const handleLogin = () => { 
    const isMaster = password === (db.settings.masterPw || "6505"); const isHelpRoom = password === (db.settings.helpRoomPw || "1111");
    if (isMaster) { setIsAuthenticated('teacher'); setActiveTab('admin'); setShowModal(null); setPassword(""); } 
    else if (isHelpRoom) { setIsAuthenticated('inspector'); setActiveTab('helproom'); setShowModal(null); setPassword(""); } 
    else { alert("비밀번호 오류 ❌"); playSound('bad'); } 
  };

  const renderEvolution = (level) => {
    switch(level) {
      case 0: return <div className="flex items-center gap-2 text-emerald-400 animate-pulse"><Leaf className="w-8 h-8"/> <Sparkles className="w-5 h-5 text-yellow-300"/></div>;
      case 1: return <div className="flex items-center gap-2 text-emerald-500 animate-bounce"><TreeDeciduous className="w-10 h-10"/> <Bird className="w-6 h-6 text-orange-300"/></div>;
      case 2: return <div className="flex items-center gap-2 text-pink-400"><TreeDeciduous className="w-12 h-12 fill-pink-200"/> <Bird className="w-8 h-8 text-orange-400 animate-pulse"/></div>;
      case 3: return <div className="flex items-center gap-2 text-yellow-500 drop-shadow-md"><TreeDeciduous className="w-14 h-14 fill-yellow-200"/> <Flame className="w-10 h-10 text-red-500 animate-bounce"/></div>;
      case 4: 
      case 5: return <div className="flex items-center gap-3 text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]"><TreeDeciduous className="w-16 h-16 fill-yellow-100 animate-pulse"/> <Bird className="w-12 h-12 fill-red-500 text-red-600 animate-bounce"/> <Shield className="w-8 h-8 text-blue-300 animate-spin-slow"/></div>;
      default: return null;
    }
  };

// === [1부 끝] === 
// 🚨 이 다음 줄부터 [2부] 코드를 그대로 이어서 붙여넣어 주시면 됩니다! 🚨
return (
    <div className="min-h-screen bg-amber-50/50 pb-32 font-sans text-slate-800 transition-all">
      
      {/* 1. 아기자기한 명성 전광판 (세계수와 불사조 애니메이션 탑재) */}
      <header className="bg-gradient-to-br from-amber-100 to-orange-100 p-8 md:p-12 shadow-sm relative overflow-hidden border-b-4 border-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[100px] opacity-60"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="text-center md:text-left flex-1">
            <h1 className="text-amber-800 font-black text-lg mb-2 flex items-center justify-center md:justify-start gap-2"><Sparkles className="text-amber-500 w-5 h-5"/> {db.settings.title}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="text-8xl font-black text-amber-900 drop-shadow-sm tracking-tighter">{classReputation}</span><span className="text-3xl font-black text-amber-600 mt-6">p</span>
              <div className="ml-6 mt-4">{renderEvolution(evolutionLevel)}</div>
            </div>
            
            <div className="w-full md:w-[600px] h-6 bg-white rounded-full mt-6 overflow-hidden shadow-inner border-2 border-amber-200">
              <div className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 transition-all duration-1000" style={{ width: `${Math.min((classReputation/db.settings.targetScore)*100, 100)}%` }}></div>
            </div>
            <div className="flex justify-between md:w-[600px] mt-2">
              <div className="flex-1 overflow-hidden whitespace-nowrap text-xs font-bold text-amber-700 bg-white/50 px-3 py-1 rounded-full border border-amber-200 inline-block mr-4">
                <span className="animate-[shimmer_20s_linear_infinite] inline-block">✨ 명예의 기부: {safeArray(db.donations).map(d => `${d.name}(${d.amount}p)`).join(' · ') || '따뜻한 기부를 기다려요!'}</span>
              </div>
              <span className="text-sm font-black text-orange-600 bg-white px-4 py-1 rounded-full shadow-sm border border-orange-200">목표: {db.settings.targetScore}p</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center bg-white/80 p-8 rounded-[40px] border-4 border-white shadow-xl backdrop-blur-md">
            <ShieldCheck className={`w-16 h-16 mb-2 ${shieldPoints > 0 ? 'text-blue-400 animate-pulse' : 'text-slate-300'}`} />
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-2">초월 보호막</span>
            <span className={`text-6xl font-black ${shieldPoints > 0 ? 'text-blue-500' : 'text-slate-300'}`}>{shieldPoints}</span>
          </div>
        </div>
      </header>

      {/* 온기 마키 */}
      <div className="bg-pink-100 text-pink-700 py-3 overflow-hidden shadow-sm border-b border-pink-200 relative z-20">
        <div className="whitespace-nowrap animate-[shimmer_30s_linear_infinite] flex gap-20 text-sm font-black">
          <span className="flex gap-4 items-center"><MessageSquare className="w-5 h-5 text-pink-500"/> 온기 우체통: {safeArray(db.approvedPraises).map(p => `[${SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short||'칭찬'}] ${allStats.find(s=>s.id==p.toId)?.name||'나 자신'}: "${p.text}"`).join(' 🌸 ') || '서로에게 따뜻한 마음을 전해볼까요?'}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* 📄 PAGE 1: 현황판 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            
            {/* 🚨 타임어택 & 주간 릴레이 & 공동 퀘스트 존 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 왼쪽: 주간 릴레이 & 공동 퀘스트 */}
              <div className="space-y-6">
                {db.weeklyRelay?.isActive && (
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-[30px] text-white shadow-lg border-2 border-purple-300">
                    <h3 className="text-sm font-black text-purple-200 mb-2 flex items-center gap-2"><Flag className="w-4 h-4"/> 🏃‍♂️ 주간 릴레이 미션</h3>
                    <p className="text-xl font-black mb-4">{db.weeklyRelay.title}</p>
                    <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden shadow-inner border border-white/20"><div className="h-full bg-yellow-400 transition-all" style={{width: `${Math.min((db.weeklyRelay.current / db.weeklyRelay.target)*100, 100)}%`}}></div></div>
                    <div className="flex justify-between items-center mt-2 font-bold text-sm">
                      <span className="text-purple-100">현재: {db.weeklyRelay.current} / 목표: {db.weeklyRelay.target}</span>
                      {db.weeklyRelay.completed ? <span className="text-yellow-300 animate-pulse">🎉 목표 달성! 보상 대기중</span> : <span className="text-purple-200">성공 시 전원 코인 배당!</span>}
                    </div>
                  </div>
                )}
                
                <div className="bg-white p-6 rounded-[30px] border-2 border-blue-100 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-blue-500 mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> 사이좋은 일주일</h3>
                    <p className="font-bold text-slate-600 text-xs mb-3">5개의 별이 모이면 학급 명성 +{db.coopQuest.q4 || 100}점!</p>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-8 h-8 ${star <= (db.coopQuest.goodWeek || 0) ? 'fill-yellow-400 text-yellow-500 animate-in zoom-in' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  {(db.coopQuest.goodWeek || 0) >= 5 && <div className="text-center font-black text-sm text-yellow-600 bg-yellow-100 px-4 py-2 rounded-xl animate-pulse">선생님 승인 대기중!</div>}
                </div>
              </div>

              {/* 오른쪽: 타임어택 (발동 시 렌더링) */}
              {db.timeAttack?.isActive ? (
                <div className="bg-red-500 text-white p-8 rounded-[30px] shadow-2xl border-4 border-red-300 relative overflow-hidden animate-pulse">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20"></div>
                  <div className="relative z-10 flex flex-col items-center text-center h-full justify-center">
                    <Timer className="w-12 h-12 text-yellow-300 mb-3 animate-bounce"/>
                    <h2 className="text-sm font-black text-red-200 mb-1">⏱️ 돌발 타임어택!</h2>
                    <p className="text-2xl font-black mb-4">{db.timeAttack.title}</p>
                    <div className="bg-black/30 px-6 py-3 rounded-2xl border border-white/20">
                      <span className="text-5xl font-black text-yellow-300 tracking-widest drop-shadow-md">{timeLeftString}</span>
                    </div>
                    <p className="mt-4 font-bold text-red-100 text-sm">성공 시 학급 평판 +{db.timeAttack.rewardRep}점!</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-8 rounded-[30px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <Timer className="w-10 h-10 mb-2 opacity-50"/>
                  <p className="font-bold text-sm">현재 발동된 타임어택이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 🏆 명예의 전당 (상단 3분할) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-[30px] shadow-sm border border-blue-200">
                <h4 className="text-sm font-black text-blue-800 mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> 🏆 역할 완수 TOP 5</h4>
                <ul className="space-y-2">{topExp.length > 0 ? topExp.map((s, i) => <li key={s.id} className="text-sm font-bold text-blue-900 bg-white/60 px-3 py-1.5 rounded-lg flex justify-between"><span>{i+1}. {s.name}</span><span className="text-blue-600">{s.atExp}회</span></li>) : <li className="text-xs text-blue-400">데이터가 없습니다.</li>}</ul>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-6 rounded-[30px] shadow-sm border border-amber-200">
                <h4 className="text-sm font-black text-amber-800 mb-4 flex items-center gap-2"><Coins className="w-4 h-4"/> 🏆 기부 천사 TOP 5</h4>
                <ul className="space-y-2">{topDonate.length > 0 ? topDonate.map((s, i) => <li key={s.id} className="text-sm font-bold text-amber-900 bg-white/60 px-3 py-1.5 rounded-lg flex justify-between"><span>{i+1}. {s.name}</span><span className="text-amber-600">{s.atDonate}🪙</span></li>) : <li className="text-xs text-amber-400">데이터가 없습니다.</li>}</ul>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 p-6 rounded-[30px] shadow-sm border border-pink-200">
                <h4 className="text-sm font-black text-pink-800 mb-4 flex items-center gap-2"><Target className="w-4 h-4"/> 🏆 펀딩 기여 TOP 5</h4>
                <ul className="space-y-2">{topFund.length > 0 ? topFund.map((s, i) => <li key={s.id} className="text-sm font-bold text-pink-900 bg-white/60 px-3 py-1.5 rounded-lg flex justify-between"><span>{i+1}. {s.name}</span><span className="text-pink-600">{s.atFund}🪙</span></li>) : <li className="text-xs text-pink-400">데이터가 없습니다.</li>}</ul>
              </div>
            </div>

            {/* 테마 & 펀딩 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border-2 border-emerald-100 flex flex-col justify-center">
                <h3 className="text-sm font-black text-emerald-600 mb-2 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full w-max"><Star className="w-4 h-4"/> 이 주의 마음성장(SEL) 테마</h3>
                <p className="text-2xl font-black text-slate-800 mt-4 leading-snug">{db.settings.weeklyTheme}</p>
                <p className="text-sm font-bold text-emerald-700 mt-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">{THEME_DESCRIPTIONS[db.settings.weeklyTheme] || "이번 주도 마음 성장을 위해 함께 노력해봐요!"}</p>
              </div>
              <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border-2 border-amber-100 flex flex-col justify-between">
                <h3 className="text-sm font-black text-amber-600 mb-4 flex items-center gap-2 bg-amber-50 inline-block px-4 py-2 rounded-full"><Target className="w-4 h-4"/> 다 함께 크라우드 펀딩</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {safeArray(db.funding).map(f => (
                    <div key={f.id} className="space-y-2">
                      <div className="flex justify-between items-end font-black text-sm text-slate-700"><span>{f.name}</span><span className="text-amber-500">{Math.floor((f.current/f.target)*100)}%</span></div>
                      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner"><div className="h-full bg-gradient-to-r from-yellow-300 to-amber-500 transition-all" style={{width:`${Math.min((f.current/f.target)*100,100)}%`}}></div></div>
                      <p className="text-xs font-bold text-slate-400 text-right">{f.current} / {f.target} 🪙</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 border-b-2 border-amber-200 pb-4 mt-8">
              <div>
                <h2 className="text-3xl font-black text-amber-900 flex items-center gap-2"><Users className="text-amber-500 w-8 h-8"/> 우리 반 꼬마 시민들</h2>
                {db.settings.showCumulativeStats && <p className="text-blue-500 font-bold text-sm mt-2">📊 교사 모드: 전체 번호순 정렬 및 상세 스탯 공개 중</p>}
              </div>
              <button onClick={() => setShowPraiseModal(true)} className="w-full sm:w-auto bg-pink-400 text-white px-8 py-4 rounded-full font-black shadow-lg hover:bg-pink-500 active:scale-95 transition-all flex items-center justify-center gap-2"><Heart className="w-6 h-6 fill-white"/> 온기 우체통</button>
            </div>
            
            {/* 개인 카드 영역 (시각적 무게중심 이동 완료) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {sortedDashboardStats.map(s => (
                <div key={s.id} className={`p-5 rounded-[30px] border-4 shadow-sm transition-all relative flex flex-col bg-white hover:shadow-xl ${s.status === 'crisis' ? 'border-red-300 bg-red-50 opacity-80 grayscale-[30%]' : (s.status === 'pending' ? 'border-orange-300 bg-orange-50' : 'border-white hover:border-amber-200')}`}>
                  
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-black text-lg shadow-inner">{s.id}</span>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase leading-tight">My Coins</p><p className="font-black text-amber-600 text-xl leading-tight">{s.coins} 🪙</p></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col mb-4 gap-2">
                    {/* 모둠과 역할은 작고 연하게 */}
                    <p className="text-[10px] font-bold text-slate-400">{s.group}모둠 · {s.role}</p>
                    {/* 이름과 뱃지는 크고 화려하게 */}
                    <div className="flex justify-between items-end">
                      <h3 className={`text-3xl font-black flex items-center gap-1 tracking-tight ${s.exp >= 20 ? 'text-amber-600 drop-shadow-sm' : 'text-slate-800'}`}>
                        {s.name} {s.isLeader && <Crown className="w-4 h-4 text-amber-400 fill-amber-400 mb-2"/>}
                      </h3>
                      <div className={`text-sm font-black px-3 py-2 rounded-xl border-2 ${s.mastery.bg} ${s.mastery.color} text-center leading-tight transition-all`}>
                        {s.mastery.label} <span className="text-lg ml-1">({s.exp}회)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    {s.status === 'normal' && <button onClick={() => handleGivePenalty(s.id)} className="w-full py-3 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-2xl font-black text-xs flex items-center justify-center gap-1 transition-all"><AlertTriangle className="w-4 h-4"/> 위기 지정</button>}
                    {s.status === 'crisis' && <p className="text-center font-black text-white bg-red-500 py-3 rounded-2xl text-xs animate-pulse shadow-md">🚨 성찰과 회복 요망</p>}
                    {s.status === 'pending' && <p className="text-center font-black text-white bg-orange-400 py-3 rounded-2xl text-xs shadow-md">⏳ 검수 대기중</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📄 PAGE 2: 성찰 센터 */}
        {activeTab === 'reflection' && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="bg-white p-12 rounded-[50px] shadow-xl border-4 border-emerald-100 text-center relative overflow-hidden">
                <BookOpen className="w-20 h-20 text-emerald-400 mx-auto mb-6 relative z-10" />
                <h2 className="text-4xl font-black mb-4 text-emerald-900 relative z-10">성찰과 회복 센터 🌱</h2>
                
                <div className="text-left space-y-8 bg-emerald-50/50 p-10 rounded-[40px] border-2 border-emerald-100 shadow-inner relative z-10">
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-3 py-1 rounded-full">1. 누가 성찰하나요?</label>
                    <select value={refTarget} onChange={e=>setRefTarget(e.target.value)} className="w-full p-5 rounded-3xl border-2 border-white font-black outline-none focus:border-emerald-300 bg-white text-lg shadow-sm">
                      <option value="">이름을 선택하세요</option>
                      {allStats.filter(s => s.status === 'crisis').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-3 py-1 rounded-full">2. 어떤 마음성장(SEL) 역량이 필요할까요?</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SEL_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setRefTag(opt.name)} className={`p-4 rounded-2xl border-2 font-black text-xs text-left transition-all ${refTag === opt.name ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg scale-105' : 'bg-white border-white text-slate-500 hover:border-emerald-200'}`}>{opt.name}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-3 py-1 rounded-full">3. 마음의 다짐 적기</label>
                    <textarea value={refText} onChange={e=>setRefText(e.target.value)} rows="6" className="w-full p-6 rounded-[30px] border-2 border-white font-black outline-none focus:border-emerald-300 bg-white resize-none text-sm leading-relaxed placeholder:text-slate-300" placeholder={refTag ? SEL_GUIDES[refTag] : "역량을 선택하면 친절한 글쓰기 가이드가 나타납니다."}></textarea>
                  </div>
                  <button onClick={submitReflection} className="w-full bg-emerald-600 text-white py-6 rounded-[30px] font-black text-xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all">다짐 제출하기</button>
                </div>
             </div>
          </div>
        )}

        {/* 📄 PAGE 3: 도움실 */}
        {activeTab === 'helproom' && (
          <div className="bg-white rounded-[50px] shadow-sm border-4 border-indigo-50 flex flex-col lg:flex-row min-h-[750px] animate-in slide-in-from-bottom">
            <aside className="w-full lg:w-72 bg-indigo-50/50 p-10 border-r-2 border-white flex flex-col gap-4">
              <div className="text-center mb-6"><Users className="w-16 h-16 text-indigo-500 mx-auto mb-4" /><h3 className="text-3xl font-black text-indigo-900">학급 도움실</h3></div>
              <button onClick={() => setHelpSubTab('inspector')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 ${helpSubTab === 'inspector' ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-400'}`}>감찰사 본부</button>
              <button onClick={() => setHelpSubTab('magistrate')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 ${helpSubTab === 'magistrate' ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-400'}`}>현령 관리소</button>
              <button onClick={() => setHelpSubTab('shop')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 ${helpSubTab === 'shop' ? 'bg-amber-400 text-white' : 'bg-white text-amber-500'}`}>학급 상점</button>
            </aside>

            <section className="flex-1 p-10 overflow-y-auto bg-slate-50/30">
              <div className="mb-10 bg-gradient-to-r from-yellow-100 to-amber-100 p-8 rounded-[40px] shadow-sm flex flex-col md:flex-row gap-8 items-center border-2 border-yellow-200">
                <div className="md:w-1/3 text-center md:text-left">
                  <h4 className="text-2xl font-black text-amber-800 mb-2">🪙 명예의 기부처</h4>
                  <p className="text-sm font-bold text-amber-700">나의 코인으로 명성을 높이세요!</p>
                </div>
                <div className="md:w-2/3 flex gap-4 w-full">
                  <select id="donate_who_main" className="flex-1 p-4 rounded-2xl bg-white font-black outline-none shadow-sm focus:border-yellow-400 text-lg">
                    <option value="">누가 기부할까요?</option>
                    {/* 🚨 위기 상태인 학생은 기부 불가 (activeStudents 사용) */}
                    {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.coins}🪙)</option>)}
                  </select>
                  <input id="donate_amount_main" type="number" placeholder="금액" className="w-32 p-4 rounded-2xl bg-white font-black outline-none text-center shadow-sm"/>
                  <button onClick={() => {
                    const sid = document.getElementById('donate_who_main').value; const amt = parseInt(document.getElementById('donate_amount_main').value);
                    if(!sid || !amt) return alert("정보를 입력하세요."); handleDonate(parseInt(sid), amt);
                  }} className="bg-amber-500 text-white px-8 rounded-2xl font-black text-lg hover:bg-amber-600">기부</button>
                </div>
              </div>

              {helpSubTab === 'inspector' && (
                <div className="bg-white border-2 border-indigo-50 rounded-[40px] overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-indigo-50/50 text-xs font-black text-indigo-400 uppercase border-b border-indigo-50"><tr><th className="p-6">이름</th><th className="p-6">모둠 배치</th><th className="p-6 text-center">모둠장</th><th className="p-6">직업 배정</th></tr></thead>
                    <tbody className="divide-y divide-indigo-50/50">
                      {allStats.map(s => (
                        <tr key={s.id} className="hover:bg-indigo-50/20">
                          <td className="p-6 font-black text-lg text-slate-700">{s.name}</td>
                          <td className="p-6"><select value={s.group} onChange={e=>handleStudentFieldChange(s.id, 'group', parseInt(e.target.value))} className="p-3 rounded-xl bg-white border border-indigo-100 font-bold text-sm outline-none">{[1,2,3,4,5,6].map(g=><option key={g} value={g}>{g}모둠</option>)}</select></td>
                          <td className="p-6 text-center"><button onClick={()=>handleStudentFieldChange(s.id, 'isLeader', !s.isLeader)} className={`px-4 py-2 rounded-xl text-xs font-black ${s.isLeader?'bg-amber-400 text-white':'bg-slate-100 text-slate-400'}`}>모둠장</button></td>
                          <td className="p-6"><select value={s.role} onChange={e=>handleStudentFieldChange(s.id, 'role', e.target.value)} className="w-full p-3 rounded-xl bg-white border border-indigo-100 font-bold text-sm outline-none"><option value="">직업 없음</option>{safeArray(db.rolesList).map(r=><option key={r} value={r}>{r}</option>)}</select></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {helpSubTab === 'magistrate' && (
                <div className="space-y-6 animate-in fade-in">
                  {[1,2,3,4,5,6].map(groupNum => {
                    const groupMembers = groupedByGroupStats.filter(s => s.group === groupNum);
                    if(groupMembers.length === 0) return null;
                    return (
                      <div key={groupNum} className="bg-white p-8 rounded-[40px] border-2 border-blue-50 shadow-sm">
                        <h4 className="text-xl font-black text-blue-800 mb-6 bg-blue-50 inline-block px-6 py-2 rounded-full border border-blue-100">{groupNum} 모둠 명단</h4>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                          {groupMembers.map(s => (
                            <div key={s.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
                              <div><p className="text-xs font-black text-slate-400 mb-1">{s.role}</p><p className="font-black text-xl text-slate-800">{s.name}</p></div>
                              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border shadow-sm">
                                <button onClick={() => handleExpAdjust(s.id, -1)} className="p-3 text-slate-400 hover:text-red-500 rounded-xl"><Minus className="w-5 h-5"/></button>
                                <span className="w-16 text-center font-black text-blue-600 text-2xl">{s.exp}</span>
                                <button onClick={() => handleExpAdjust(s.id, 1)} className="p-3 text-slate-400 hover:text-green-500 rounded-xl"><Plus className="w-5 h-5"/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {helpSubTab === 'shop' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {safeArray(db.shopItems).map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[40px] shadow-sm border-2 border-slate-100 flex flex-col justify-between">
                         <div>
                           <div className="flex justify-between items-start mb-6"><span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl border">{item.creator} 제작</span><p className="text-3xl font-black text-amber-500">{item.price} 🪙</p></div>
                           <h4 className="text-2xl font-black text-slate-800 mb-10">{item.name}</h4>
                         </div>
                         <div className="flex gap-4">
                           {/* 🚨 위기 상태 고립 (구매 불가) */}
                           <select id={`buyer_${item.id}`} className="flex-1 p-5 rounded-2xl bg-slate-50 border font-bold outline-none text-base"><option value="">누가 구매하나요?</option>{activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.coins}🪙)</option>)}</select>
                           <button onClick={() => {
                             if(!isShopOpen) return alert("오늘은 상점 운영일이 아닙니다!");
                             const sid = document.getElementById(`buyer_${item.id}`).value;
                             if(!sid) return alert("선택하세요."); const user = activeStudents.find(u => u.id == sid);
                             if(user.coins < item.price) return alert("코인 부족.");
                             if(window.confirm(`${user.name}의 개인 코인을 차감할까요?`)) { sync({ usedCoins: { ...db.usedCoins, [sid]: (db.usedCoins[sid] || 0) + item.price } }); alert("결제 승인 완료!"); playSound('buy'); }
                           }} className="bg-amber-500 text-white px-10 rounded-2xl font-black text-lg hover:bg-amber-600">구매</button>
                         </div>
                      </div>
                    ))}
                    
                    {safeArray(db.funding).map(f => (
                      <div key={f.id} className="bg-gradient-to-br from-blue-400 to-indigo-500 p-8 rounded-[40px] shadow-xl text-white flex flex-col justify-between">
                        <div>
                           <h4 className="text-2xl font-black mb-2 flex items-center gap-3"><Target className="w-6 h-6 text-yellow-300"/> {f.name}</h4>
                           <div className="flex justify-between items-end text-lg font-black mb-3 mt-6"><span>현재: {f.current}p</span><span className="text-blue-200">목표: {f.target}p</span></div>
                           <div className="w-full h-5 bg-black/20 rounded-full mb-10 overflow-hidden"><div className="h-full bg-yellow-400 transition-all" style={{width:`${(f.current/f.target)*100}%`}}></div></div>
                        </div>
                        <div className="flex gap-3">
                           {/* 🚨 위기 상태 고립 (펀딩 참여 불가) */}
                           <select id={`funder_${f.id}`} className="flex-1 p-4 rounded-2xl bg-white/20 border-none font-bold outline-none text-sm"><option value="" className="text-slate-800">누가 투자할까요?</option>{activeStudents.map(s => <option key={s.id} value={s.id} className="text-slate-800">{s.name} ({s.coins}🪙)</option>)}</select>
                           <input id={`f_amt_${f.id}`} type="number" placeholder="금액" className="w-24 p-4 rounded-2xl bg-white/20 border-none font-bold outline-none text-sm"/>
                           <button onClick={() => {
                             const sid = document.getElementById(`funder_${f.id}`).value; const amt = parseInt(document.getElementById(`f_amt_${f.id}`).value);
                             if(!sid || !amt) return alert("입력 오류"); handleFund(f.id, parseInt(sid), amt);
                           }} className="bg-yellow-400 text-yellow-900 px-8 rounded-2xl font-black text-lg hover:bg-yellow-300">투자</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 📄 PAGE 4: 통합 관리실 (교사 전용) */}
        {activeTab === 'admin' && isAuthenticated === 'teacher' && (
          <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 flex flex-col lg:flex-row overflow-hidden min-h-[750px] animate-in slide-in-from-right duration-300">
             <aside className="w-full lg:w-72 bg-slate-900 p-10 flex flex-col gap-4 shrink-0 border-r border-slate-800">
                <div className="text-center mb-8"><Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" /><h3 className="text-2xl font-black text-white">관리자 센터</h3></div>
                <button onClick={() => setAdminSubTab('mission')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 text-base ${adminSubTab === 'mission' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}><Zap className="w-5 h-5"/> 결재 및 퀘스트</button>
                <button onClick={() => setAdminSubTab('report')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 text-base ${adminSubTab === 'report' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}><BarChart3 className="w-5 h-5"/> SEL 리포트</button>
                <button onClick={() => setAdminSubTab('students')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 text-base ${adminSubTab === 'students' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}><Users className="w-5 h-5"/> 명단 관리</button>
                <button onClick={() => setAdminSubTab('settings')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 text-base ${adminSubTab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}><Settings className="w-5 h-5"/> 환경 및 점수 세팅</button>
                <button onClick={() => setAdminSubTab('reset')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 text-base ${adminSubTab === 'reset' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}><History className="w-5 h-5"/> 초기화/마감</button>
                <button onClick={() => { setIsAuthenticated(false); setActiveTab('dashboard'); }} className="mt-auto p-4 bg-slate-800 text-slate-400 font-black rounded-2xl text-center">로그아웃</button>
             </aside>

             <section className="flex-1 p-10 overflow-y-auto bg-slate-50/50">
                
                {adminSubTab === 'mission' && (
                  <div className="space-y-8 animate-in fade-in">
                    
                    {/* 🎮 학급 공동 퀘스트 및 이벤트 통제 센터 */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                      <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-4 mb-6">🎮 학급 공동 퀘스트 컨트롤러</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <button onClick={()=>addCoopScore(db.coopQuest.q1 || 50, "다 함께 바른 생활")} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-6 rounded-3xl font-black border border-indigo-200 flex flex-col items-center justify-center transition-all"><span className="text-sm">다 함께 바른 생활</span><span className="text-2xl mt-2">+{db.coopQuest.q1 || 50}p</span></button>
                        <button onClick={()=>addCoopScore(db.coopQuest.q2 || 20, "환대와 응원")} className="bg-pink-50 hover:bg-pink-100 text-pink-700 p-6 rounded-3xl font-black border border-pink-200 flex flex-col items-center justify-center transition-all"><span className="text-sm">환대와 응원</span><span className="text-2xl mt-2">+{db.coopQuest.q2 || 20}p</span></button>
                        <button onClick={()=>addCoopScore(db.coopQuest.q3 || 20, "전담수업 태도 우수")} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-6 rounded-3xl font-black border border-emerald-200 flex flex-col items-center justify-center transition-all"><span className="text-sm">전담수업 우수</span><span className="text-2xl mt-2">+{db.coopQuest.q3 || 20}p</span></button>
                        
                        {/* 🌟 사이좋은 일주일 관리 */}
                        <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-200 flex flex-col items-center justify-center relative">
                          <span className="text-sm font-black text-yellow-800 mb-2">사이좋은 일주일 (+{db.coopQuest.q4||100}p)</span>
                          <div className="flex items-center gap-3">
                            <button onClick={()=>adjustGoodWeek(-1)} className="bg-white p-2 rounded-full text-red-500 shadow-sm border border-red-100"><Minus className="w-4 h-4"/></button>
                            <span className="text-2xl font-black text-yellow-600">{db.coopQuest.goodWeek || 0} / 5</span>
                            <button onClick={()=>adjustGoodWeek(1)} className="bg-white p-2 rounded-full text-green-500 shadow-sm border border-green-100"><Plus className="w-4 h-4"/></button>
                          </div>
                          {(db.coopQuest.goodWeek || 0) >= 5 && <button onClick={completeGoodWeek} className="absolute inset-0 bg-yellow-400 text-white font-black rounded-3xl z-10 flex items-center justify-center text-lg animate-pulse shadow-lg">최종 승인 및 +{db.coopQuest.q4||100}점</button>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                         {/* 타임어택 */}
                         <div className="bg-red-50 p-6 rounded-3xl border border-red-200">
                           <h4 className="font-black text-red-800 mb-4 flex items-center gap-2"><Timer className="w-5 h-5"/> 타임어택 발동기</h4>
                           {db.timeAttack?.isActive ? (
                             <div className="space-y-4">
                               <p className="text-center text-xl font-black text-red-600">{timeLeftString}</p>
                               <div className="flex gap-2">
                                 <button onClick={handleCompleteTimeAttack} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-black shadow-md">미션 성공 (보상 지급)</button>
                                 <button onClick={handleFailTimeAttack} className="flex-1 bg-slate-300 text-slate-600 py-3 rounded-xl font-black shadow-md">실패 종료</button>
                               </div>
                             </div>
                           ) : (
                             <div className="space-y-3">
                               <input type="text" placeholder="미션 내용" value={taTitle} onChange={e=>setTaTitle(e.target.value)} className="w-full p-3 rounded-xl border border-red-200 font-bold text-sm outline-none focus:border-red-400"/>
                               <div className="flex gap-2">
                                 <input type="number" placeholder="분" value={taMins} onChange={e=>setTaMins(e.target.value)} className="w-20 p-3 rounded-xl border border-red-200 font-bold text-sm text-center outline-none"/>
                                 <input type="number" placeholder="성공 보상 명성점수" value={taReward} onChange={e=>setTaReward(e.target.value)} className="flex-1 p-3 rounded-xl border border-red-200 font-bold text-sm outline-none"/>
                                 <button onClick={handleStartTimeAttack} className="bg-red-500 text-white px-6 rounded-xl font-black hover:bg-red-600 shadow-md">시작</button>
                               </div>
                             </div>
                           )}
                         </div>

                         {/* 주간 릴레이 */}
                         <div className="bg-purple-50 p-6 rounded-3xl border border-purple-200">
                           <h4 className="font-black text-purple-800 mb-4 flex items-center gap-2"><Flag className="w-5 h-5"/> 주간 릴레이 미션 세팅</h4>
                           <div className="space-y-3">
                             <input type="text" placeholder="릴레이 미션 내용" value={relayTitle} onChange={e=>setRelayTitle(e.target.value)} className="w-full p-3 rounded-xl border border-purple-200 font-bold text-sm outline-none"/>
                             <div className="flex gap-2 text-xs font-bold text-slate-500">
                               <input type="number" placeholder="목표 횟수" value={relayTarget} onChange={e=>setRelayTarget(e.target.value)} className="w-20 p-3 rounded-xl border border-purple-200 outline-none text-center"/>
                               <input type="number" placeholder="성공시 전원 개인코인" value={relayCoin} onChange={e=>setRelayCoin(e.target.value)} className="flex-1 p-3 rounded-xl border border-purple-200 outline-none"/>
                               <input type="number" placeholder="학급 명성 보상" value={relayRep} onChange={e=>setRelayRep(e.target.value)} className="flex-1 p-3 rounded-xl border border-purple-200 outline-none"/>
                             </div>
                             <div className="flex gap-2">
                               <button onClick={handleCreateRelay} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-black shadow-md">새 릴레이 배포</button>
                               <button onClick={()=>{
                                 if(!db.weeklyRelay?.isActive) return;
                                 if(window.confirm(`전원 코인 +${db.weeklyRelay.rewardCoin}, 명성 +${db.weeklyRelay.rewardRep} 지급?`)) {
                                   let nextBonus = {...db.bonusCoins};
                                   activeStudents.forEach(s => { nextBonus[s.id] = (nextBonus[s.id]||0) + db.weeklyRelay.rewardCoin; });
                                   sync({ bonusCoins: nextBonus, manualRepOffset: (db.manualRepOffset||0) + db.weeklyRelay.rewardRep, weeklyRelay: {...db.weeklyRelay, isActive: false, completed: true} });
                                   playSound('jackpot'); alert("릴레이 보상 일괄 지급 완료!");
                                 }
                               }} className="flex-1 bg-yellow-500 text-white py-3 rounded-xl font-black shadow-md">목표 달성 일괄 보상 지급</button>
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-green-100 text-center">
                       <h4 className="text-2xl font-black mb-6 text-slate-800">서류 결재함</h4>
                       <div className="w-full space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {safeArray(db.pendingReflections).map(r => (
                           <div key={r.id} className="bg-red-50 p-5 rounded-2xl border border-red-200 text-left shadow-sm">
                             <div className="flex justify-between items-center mb-3">
                               <span className="font-black text-red-800 bg-red-100 px-3 py-1 rounded-lg text-xs">{allStats.find(s=>s.id==r.sId)?.name} (성찰)</span><span className="text-[10px] font-bold text-red-400">{SEL_OPTIONS.find(opt=>opt.name===r.tag)?.short}</span>
                             </div>
                             <p className="text-sm text-slate-700 font-bold mb-4 whitespace-pre-wrap">"{r.text}"</p>
                             <div className="flex gap-2">
                               <button onClick={() => { const next = db.pendingReflections.filter(pr => pr.id !== r.id); sync({ pendingReflections: next, studentStatus: { ...db.studentStatus, [r.sId]: 'normal' } }); alert("위기 해제 승인 완료!"); playSound('good'); }} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-sm hover:bg-red-600 shadow-md">위기 해제 승인</button>
                               <button onClick={() => { const next = db.pendingReflections.filter(pr => pr.id !== r.id); sync({ pendingReflections: next, studentStatus: { ...db.studentStatus, [r.sId]: 'crisis' } }); alert("반려되었습니다."); }} className="px-4 bg-white text-slate-400 font-black rounded-xl border border-slate-200">반려</button>
                             </div>
                           </div>
                         ))}
                         {safeArray(db.pendingPraises).map(p => {
                           const isCrisis = allStats.find(u => u.id == p.toId)?.status === 'crisis'; // 🚨 수신자가 현재 위기인지 확인
                           return (
                           <div key={p.id} className="bg-pink-50 p-5 rounded-2xl border border-pink-200 text-left shadow-sm">
                             <div className="flex justify-between items-center mb-3">
                               <div className="flex items-center gap-2">
                                 <span className="font-black text-pink-800 bg-pink-100 px-3 py-1 rounded-lg text-xs">To. {allStats.find(s=>s.id==p.toId)?.name||'나 자신'}</span>
                                 {isCrisis && <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-black animate-pulse">🚨 현재 위기 상태</span>}
                               </div>
                               <span className="text-[10px] font-bold text-pink-400">{SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short}</span>
                             </div>
                             <p className="text-sm text-slate-700 font-bold mb-4">"{p.text}"</p>
                             <div className="flex gap-2">
                               <button onClick={() => { 
                                 if (isCrisis) return alert("현재 위기 상태인 학생에게는 온기 코인을 지급할 수 없습니다. 성찰과 회복이 먼저입니다."); // 🚨 위기 시 결재 차단
                                 const next = db.pendingPraises.filter(pr => pr.id !== p.id); 
                                 const app = [p, ...safeArray(db.approvedPraises)].slice(0,15); 
                                 
                                 const isThemeMatch = p.tag === db.settings.weeklyTheme;
                                 const earnedCoins = isThemeMatch ? (db.settings.pointConfig?.praiseBonus || 15) : (db.settings.pointConfig?.praiseBasic || 10);
                                 
                                 let updates = { pendingPraises: next, approvedPraises: app };
                                 if(p.toId !== 'me') { 
                                   updates.bonusCoins = { ...db.bonusCoins, [p.toId]: (db.bonusCoins?.[p.toId] || 0) + earnedCoins };
                                   updates.allTime = { ...db.allTime, exp: { ...db.allTime.exp, [p.toId]: (db.allTime.exp?.[p.toId]||0) + 1 } };
                                 }
                                 
                                 // 주간 릴레이 연동
                                 if (db.weeklyRelay?.isActive && !db.weeklyRelay?.completed) {
                                    updates.weeklyRelay = { ...db.weeklyRelay, current: db.weeklyRelay.current + 1 };
                                    if (updates.weeklyRelay.current >= updates.weeklyRelay.target) updates.weeklyRelay.completed = true;
                                 }

                                 sync(updates); 
                                 alert(`온기 승인 완료! (+${earnedCoins}🪙)`); playSound('good'); 
                               }} className={`flex-1 py-3 rounded-xl font-black text-sm shadow-md ${isCrisis ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600'}`}>온기 승인</button>
                               <button onClick={() => { const next = db.pendingPraises.filter(pr => pr.id !== p.id); sync({ pendingPraises: next }); alert("반려되었습니다."); }} className="px-4 bg-white text-slate-400 font-black rounded-xl border border-slate-200">반려</button>
                             </div>
                           </div>
                         )})}
                         {safeArray(db.pendingReflections).length === 0 && safeArray(db.pendingPraises).length === 0 && <p className="text-slate-400 font-black py-10 border-2 border-dashed rounded-3xl">결재 대기열이 비어있습니다.</p>}
                       </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'report' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">🌱 학생별 SEL 마음성장 리포트</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10">
                      <div className="w-full md:w-1/3">
                        <select value={selectedReportStudent} onChange={e=>setSelectedReportStudent(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none mb-6 focus:border-blue-400"><option value="">학생을 선택하세요</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        {selectedReportStudent && (
                          <button onClick={() => setShowRollingPaper(parseInt(selectedReportStudent))} className="w-full bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-2xl font-black shadow-md flex items-center justify-center gap-2 mb-6"><Printer className="w-5 h-5"/> 롤링페이퍼 인쇄 (O2O)</button>
                        )}
                        <p className="text-sm font-bold text-slate-500 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100">온기 우체통을 통해 받은 칭찬 태그를 분석하고 에니어그램 성향과 결합하여 맞춤형 지도를 돕습니다.</p>
                      </div>
                      
                      <div className="w-full md:w-2/3 bg-slate-50 p-8 rounded-3xl border border-slate-200">
                        {selectedReportStudent ? (() => {
                          const s = allStats.find(x => x.id == selectedReportStudent);
                          const counts = {}; SEL_OPTIONS.forEach(o => counts[o.name] = 0);
                          safeArray(db.approvedPraises).forEach(p => { if(p.toId == s.id && counts[p.tag] !== undefined) counts[p.tag]++; });
                          const max = Math.max(...Object.values(counts), 5);
                          return (
                            <div className="animate-in fade-in zoom-in-95">
                              <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
                                <h4 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Star className="text-yellow-400 fill-yellow-400"/> {s.name} 학생 분석</h4>
                                <div className="text-right text-xs font-bold text-slate-500">누적: 위기 <span className="text-red-500">{s.atPen}회</span> | 기부 <span className="text-amber-500">{s.atDonate}🪙</span></div>
                              </div>
                              
                              {/* 🧠 에니어그램 AI 힌트 구역 */}
                              {s.enneagram && ENNEAGRAM_DATA[s.enneagram] && (
                                <div className="bg-indigo-100/50 p-5 rounded-2xl border border-indigo-200 mb-8 shadow-inner">
                                  <h5 className="font-black text-indigo-800 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500"/> AI 교사 지원 힌트: {ENNEAGRAM_DATA[s.enneagram].name}</h5>
                                  <p className="text-sm font-bold text-indigo-900/80 leading-relaxed">{ENNEAGRAM_DATA[s.enneagram].desc}</p>
                                </div>
                              )}

                              <div className="space-y-4 mb-8">
                                {Object.keys(counts).map(tag => {
                                  const shortName = SEL_OPTIONS.find(opt=>opt.name === tag)?.short || tag;
                                  return (
                                  <div key={tag} className="flex items-center gap-4">
                                    <span className="w-24 text-sm font-black text-slate-600 text-right">{shortName}</span>
                                    <div className="flex-1 h-6 bg-white rounded-full overflow-hidden border border-slate-200 shadow-inner"><div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000" style={{width: `${(counts[tag]/max)*100}%`}}></div></div>
                                    <span className="w-10 font-black text-blue-600 text-right">{counts[tag]}회</span>
                                  </div>
                                )})}
                              </div>
                            </div>
                          );
                        })() : <div className="h-full flex items-center justify-center text-slate-400 font-black">학생을 선택하면 리포트가 생성됩니다.</div>}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'students' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">👥 학생 명단 및 에니어그램 관리</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                      <div className="flex flex-wrap gap-4 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <input type="text" placeholder="새 학생 이름" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="flex-1 p-4 rounded-xl border border-slate-300 font-bold outline-none"/>
                        <select value={newStudentGroup} onChange={e=>setNewStudentGroup(e.target.value)} className="w-32 p-4 rounded-xl border border-slate-300 font-bold outline-none"><option value="1">1모둠</option><option value="2">2모둠</option><option value="3">3모둠</option><option value="4">4모둠</option><option value="5">5모둠</option><option value="6">6모둠</option></select>
                        <select value={newStudentEnneagram} onChange={e=>setNewStudentEnneagram(e.target.value)} className="w-32 p-4 rounded-xl border border-slate-300 font-bold outline-none"><option value="">에니어그램</option>{Object.keys(ENNEAGRAM_DATA).map(k => <option key={k} value={k}>{k}번</option>)}</select>
                        <button onClick={handleAddStudent} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700">전입생 추가</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safeStudents.map(s => (
                          <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                            <div>
                              <span className="text-xs font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{s.id}번 | {s.group}모둠</span>
                              <h4 className="font-black text-lg text-slate-800 mt-2 flex items-center gap-2">{s.name} {s.enneagram && <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-1 rounded-full">{s.enneagram}번</span>}</h4>
                            </div>
                            <button onClick={() => handleRemoveStudent(s.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-5 h-5"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'settings' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">환경 및 보안 세팅</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                       
                       {/* 🔒 비밀번호 변경 구역 */}
                       <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2"><Lock className="w-5 h-5"/> 마스터 권한 (관리실) 비번</h4>
                            <div className="flex gap-2">
                              <input type="password" value={masterPwInput} onChange={e=>setMasterPwInput(e.target.value)} placeholder="새 비밀번호 입력" className="flex-1 p-3 rounded-xl border border-slate-300 font-black outline-none"/>
                              <button onClick={()=>{ if(!masterPwInput) return alert('입력하세요.'); sync({settings: {...db.settings, masterPw: masterPwInput}}); alert('변경 완료!'); setMasterPwInput(''); }} className="bg-blue-600 text-white px-4 rounded-xl font-black">변경</button>
                            </div>
                            <p className="text-xs font-bold text-slate-400 mt-2">현재 비번: {db.settings.masterPw || "6505"}</p>
                          </div>
                          <div>
                            <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-indigo-400"/> 감찰사 권한 (도움실) 비번</h4>
                            <div className="flex gap-2">
                              <input type="password" value={helpPwInput} onChange={e=>setHelpPwInput(e.target.value)} placeholder="새 비밀번호 입력" className="flex-1 p-3 rounded-xl border border-slate-300 font-black outline-none"/>
                              <button onClick={()=>{ if(!helpPwInput) return alert('입력하세요.'); sync({settings: {...db.settings, helpRoomPw: helpPwInput}}); alert('변경 완료!'); setHelpPwInput(''); }} className="bg-indigo-500 text-white px-4 rounded-xl font-black">변경</button>
                            </div>
                            <p className="text-xs font-bold text-slate-400 mt-2">현재 비번: {db.settings.helpRoomPw || "1111"}</p>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                          <div>
                            <label className="block text-sm font-black text-slate-500 mb-3">대시보드 메인 타이틀</label>
                            <input type="text" value={db.settings.title} onChange={e=>sync({settings: {...db.settings, title: e.target.value}})} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none focus:border-blue-400"/>
                          </div>
                          <div>
                            <label className="block text-sm font-black text-slate-500 mb-3">이 주의 마음성장(SEL) 테마</label>
                            <select value={db.settings.weeklyTheme} onChange={e=>sync({settings: {...db.settings, weeklyTheme: e.target.value}})} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none focus:border-blue-400">
                              {SEL_OPTIONS.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
                            </select>
                          </div>
                       </div>
                       
                       <div className="pt-6 border-t border-slate-100 bg-indigo-50 p-8 rounded-3xl">
                          <h4 className="font-black text-lg text-indigo-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> 만능 점수 밸런스 및 수동 세팅</h4>
                          <div className="flex gap-2 mb-6">
                            <input type="number" value={manualScoreInput} onChange={e=>setManualScoreInput(e.target.value)} placeholder="명성 점수 강제 추가 (예: +50)" className="w-64 p-3 rounded-xl border border-white font-black outline-none text-sm shadow-sm"/>
                            <button onClick={() => { const val = parseInt(manualScoreInput); if(isNaN(val)) return; if(window.confirm(`${val}점 적용?`)) { sync({ manualRepOffset: (db.manualRepOffset||0) + val }); setManualScoreInput(""); } }} className="bg-indigo-600 text-white px-6 rounded-xl font-black text-sm shadow-md">즉시 적용</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div><label className="block text-xs font-black text-indigo-600 mb-2">최고 목표 명성</label><input type="number" value={db.settings.targetScore} onChange={e=>sync({settings: {...db.settings, targetScore: parseInt(e.target.value)}})} className="w-full p-3 rounded-xl shadow-sm"/></div>
                            <div><label className="block text-xs font-black text-indigo-600 mb-2">기본 온기(🪙)</label><input type="number" value={db.settings.pointConfig?.praiseBasic||10} onChange={e=>sync({settings: {...db.settings, pointConfig: {...db.settings.pointConfig, praiseBasic: parseInt(e.target.value)}}})} className="w-full p-3 rounded-xl shadow-sm"/></div>
                            <div><label className="block text-xs font-black text-indigo-600 mb-2">테마 일치 보상(🪙)</label><input type="number" value={db.settings.pointConfig?.praiseBonus||15} onChange={e=>sync({settings: {...db.settings, pointConfig: {...db.settings.pointConfig, praiseBonus: parseInt(e.target.value)}}})} className="w-full p-3 rounded-xl shadow-sm text-pink-500"/></div>
                            <div><label className="block text-xs font-black text-red-500 mb-2">위기 지정 차감</label><input type="number" value={db.settings.pointConfig?.penalty||20} onChange={e=>sync({settings: {...db.settings, pointConfig: {...db.settings.pointConfig, penalty: parseInt(e.target.value)}}})} className="w-full p-3 rounded-xl shadow-sm text-red-600"/></div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-indigo-200">
                            <div><label className="block text-xs font-black text-indigo-600 mb-2">바른생활 점수</label><input type="number" value={db.coopQuest?.q1||50} onChange={e=>sync({coopQuest: {...db.coopQuest, q1: parseInt(e.target.value)}})} className="w-full p-2 rounded-xl shadow-sm text-xs"/></div>
                            <div><label className="block text-xs font-black text-indigo-600 mb-2">환대응원 점수</label><input type="number" value={db.coopQuest?.q2||20} onChange={e=>sync({coopQuest: {...db.coopQuest, q2: parseInt(e.target.value)}})} className="w-full p-2 rounded-xl shadow-sm text-xs"/></div>
                            <div><label className="block text-xs font-black text-indigo-600 mb-2">전담수업 점수</label><input type="number" value={db.coopQuest?.q3||20} onChange={e=>sync({coopQuest: {...db.coopQuest, q3: parseInt(e.target.value)}})} className="w-full p-2 rounded-xl shadow-sm text-xs"/></div>
                            <div><label className="block text-xs font-black text-indigo-600 mb-2">일주일완성 점수</label><input type="number" value={db.coopQuest?.q4||100} onChange={e=>sync({coopQuest: {...db.coopQuest, q4: parseInt(e.target.value)}})} className="w-full p-2 rounded-xl shadow-sm text-xs"/></div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'reset' && (
                  <div className="animate-in fade-in space-y-8">
                     <h3 className="text-3xl font-black text-slate-800 border-l-8 border-red-500 pl-6 mb-8">데이터 초기화 및 1학기 마감</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-blue-50 border-4 border-blue-200 p-10 rounded-[40px] text-center shadow-lg">
                          <History className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                          <h3 className="text-3xl font-black mb-4 text-blue-800">1학기 최종 마감</h3>
                          <button onClick={closeSemester} className="bg-blue-600 text-white px-10 py-5 rounded-[30px] font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">학기 마감 실행</button>
                       </div>
                       <div className="bg-red-50 border-4 border-red-200 p-12 rounded-[50px] text-center shadow-lg">
                          <Trash2 className="w-20 h-20 text-red-500 mx-auto mb-6" />
                          <h3 className="text-4xl font-black mb-4 text-red-800">시스템 공장 초기화</h3>
                          <button onClick={factoryReset} className="bg-red-600 text-white px-16 py-6 rounded-[35px] font-black text-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all">공장 초기화 실행</button>
                       </div>
                     </div>
                  </div>
                )}
             </section>
          </div>
        )}
      </main>

      {/* 온기 우체통 모달 */}
      {showPraiseModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white p-10 rounded-[50px] w-full max-w-md shadow-2xl animate-in zoom-in-95 border-4 border-pink-100">
            <h3 className="text-3xl font-black text-pink-600 mb-8 flex items-center justify-center gap-3"><Heart className="w-8 h-8 fill-pink-500"/> 따뜻한 온기 제보</h3>
            <div className="space-y-6 mb-10">
              <select value={praiseTarget} onChange={(e)=>setPraiseTarget(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none focus:border-pink-400 focus:bg-white shadow-sm">
                <option value="">누구를 칭찬할까요?</option>
                <option value="me" className="text-pink-600">🙋 나 자신 (스스로 대견할 때!)</option>
                {/* 🚨 위기 상태 고립 (수신자 선택 불가) */}
                {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={praiseTag} onChange={(e)=>setPraiseTag(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none focus:border-pink-400 focus:bg-white shadow-sm">
                <option value="">어떤 역량인가요?</option>
                {SEL_OPTIONS.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
              </select>
              <textarea value={praiseText} onChange={(e)=>setPraiseText(e.target.value)} rows="4" placeholder={praiseTag ? PRAISE_GUIDES[praiseTag] : "위에서 역량을 먼저 선택하면 친절한 칭찬 가이드가 나타납니다! 💌"} className="w-full p-5 rounded-3xl bg-pink-50 border-2 border-pink-100 font-black outline-none focus:border-pink-400 focus:bg-white resize-none shadow-inner placeholder:font-bold placeholder:text-pink-400 text-pink-900"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPraiseModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[20px] font-black text-lg hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={submitPraise} className="flex-1 py-5 bg-pink-500 text-white rounded-[20px] font-black text-lg shadow-xl hover:bg-pink-600 active:scale-95 transition-all">보내기</button>
            </div>
          </div>
        </div>
      )}

      {/* 비번 모달 */}
      {showModal === 'password' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[9999]">
          <div className="bg-white rounded-[60px] p-16 w-full max-w-lg text-center shadow-2xl animate-in zoom-in-95 border-4 border-blue-100">
            <Lock className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h3 className="text-3xl font-black text-center mb-8 text-blue-900">비밀번호를 입력하세요</h3>
            {/* 🚨 하드코딩 힌트 삭제 완료 */}
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key === 'Enter' && handleLogin()} className="w-full text-center text-6xl tracking-[15px] font-black p-8 border-4 border-slate-100 rounded-[40px] outline-none mb-12 bg-slate-50 focus:border-blue-400 focus:bg-white shadow-inner" autoFocus />
            <div className="flex gap-4">
              <button onClick={()=>setShowModal(null)} className="flex-1 py-6 rounded-[30px] font-black text-slate-500 text-xl bg-slate-100 hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={handleLogin} className="flex-1 py-6 rounded-[30px] font-black bg-blue-600 text-white text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">접속하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 💌 O2O 롤링페이퍼 출력 모달 */}
      {showRollingPaper && (() => {
        const s = allStats.find(x => x.id === showRollingPaper);
        const praises = safeArray(db.approvedPraises).filter(p => p.toId == s.id);
        return (
          <div className="fixed inset-0 bg-white z-[99999] overflow-auto flex flex-col items-center">
             <div className="w-full bg-slate-100 p-4 flex justify-between items-center print:hidden border-b border-slate-300">
               <h3 className="font-black text-slate-700">인쇄 미리보기</h3>
               <div className="flex gap-2">
                 <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black shadow-md flex items-center gap-2 hover:bg-blue-700"><Printer className="w-4 h-4"/> 인쇄</button>
                 <button onClick={() => setShowRollingPaper(null)} className="bg-white text-slate-600 border border-slate-300 px-6 py-2 rounded-xl font-black hover:bg-slate-50">닫기</button>
               </div>
             </div>
             <div className="max-w-4xl w-full p-12 print:p-0">
                <div className="text-center mb-12">
                  <Heart className="w-16 h-16 text-pink-400 fill-pink-100 mx-auto mb-4"/>
                  <h1 className="text-4xl font-black text-slate-800 mb-2">달보드레 온기 롤링페이퍼</h1>
                  <p className="text-2xl font-bold text-slate-500">소중한 우리 반 보물, <span className="text-pink-600 font-black">{s.name}</span>에게</p>
                </div>
                <div className="grid grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                  {praises.map((p, idx) => (
                    <div key={p.id} className="bg-pink-50/50 border-2 border-pink-100 p-6 rounded-3xl print:border print:border-pink-200">
                      <p className="text-xs font-black text-pink-500 mb-3 bg-pink-100 inline-block px-3 py-1 rounded-full">{SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short}</p>
                      <p className="text-lg font-bold text-slate-800 leading-relaxed">"{p.text}"</p>
                      <p className="text-right text-xs font-bold text-slate-400 mt-4">- {p.date} -</p>
                    </div>
                  ))}
                  {praises.length === 0 && <div className="col-span-2 text-center py-20 text-slate-400 font-black text-xl">아직 받은 사연이 없습니다.</div>}
                </div>
             </div>
          </div>
        )
      })()}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-4 border-amber-100 px-4 py-4 flex justify-around items-center z-[5000] shadow-[0_-15px_50px_rgba(0,0,0,0.06)] pb-8 print:hidden">
        {[
          { id: 'dashboard', icon: <Target className="w-7 h-7"/>, label: db.settings.menuNames[0] || "명성 현황판", color: "text-blue-500" }, 
          { id: 'reflection', icon: <BookOpen className="w-7 h-7"/>, label: db.settings.menuNames[1] || "성찰과 회복", color: "text-emerald-500" }, 
          { id: 'helproom', icon: <Users className="w-7 h-7"/>, label: db.settings.menuNames[2] || "도움실", color: "text-indigo-500" }, 
          { id: 'admin', icon: <Settings className="w-7 h-7"/>, label: db.settings.menuNames[3] || "통합 관리실", color: "text-slate-600" }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => item.id === 'admin' ? setShowModal('password') : setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${activeTab === item.id ? `${item.color} scale-110 -translate-y-3 drop-shadow-md` : 'text-slate-400 opacity-70 hover:opacity-100 hover:-translate-y-1'}`}
          >
            {item.icon}
            <span className="text-[11px] font-black">{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
        .fade-in { animation-name: fadeIn; }
        .zoom-in-95 { animation-name: zoomIn95; }
        .slide-in-from-top-4 { animation-name: slideInTop; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInTop { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @media print { body { background: white; margin: 0; padding: 0; } }
      `}</style>
    </div>
  );
}
