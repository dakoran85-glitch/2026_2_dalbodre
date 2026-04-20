/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Trophy, ShieldCheck, Heart, Lock, History, Save, X, 
  Plus, Minus, AlertTriangle, Sparkles, Star, Target, Settings, 
  Trash2, ShoppingCart, CheckCircle2, BookOpen, UserCheck, Briefcase, 
  Zap, Crown, Gift, Coins, BarChart3, MessageSquare, Send, Gavel, 
  Leaf, TreeDeciduous, Bird, Flame, Shield, Printer, Timer
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

// 🔥 에니어그램 데이터
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

const PRAISE_GUIDES = {
  "1단계: 자기 인식 (Self-awareness)": "칭찬 예시: 스스로의 장점을 알고 자신감 있게 도전한 모습을 칭찬해요!",
  "2단계: 자기 관리 (Self-management)": "칭찬 예시: 짜증 날 수 있는 상황에서도 감정을 잘 조절하고 끝까지 해낸 모습을 칭찬해요!",
  "3단계: 사회적 인식 (Social awareness)": "칭찬 예시: 도움이 필요한 친구의 마음을 먼저 알아채고 공감해 준 모습을 칭찬해요!",
  "4단계: 관계 기술 (Relationship skills)": "칭찬 예시: 친구의 말을 잘 경청하고, 배려하며 협동한 모습을 칭찬해요!",
  "5단계: 책임 있는 의사결정 (Responsible decision-making)": "칭찬 예시: 학급을 위해 솔선수범하여 바른 선택을 하고 실천한 모습을 칭찬해요!"
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
  
  const [masterPwInput, setMasterPwInput] = useState(""); const [helpPwInput, setHelpPwInput] = useState("");
  const [taTitle, setTaTitle] = useState("바닥 쓰레기 0개 만들기!"); const [taMins, setTaMins] = useState(10); const [taReward, setTaReward] = useState(100);

  const [showRollingPaper, setShowRollingPaper] = useState(null); 
  const [timeLeftString, setTimeLeftString] = useState(""); 

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
    coopQuest: { q1Name: "다 함께 바른 생활", q1: 50, q2Name: "환대와 응원", q2: 20, q3Name: "전담수업 태도 우수", q3: 20, q4Name: "사이좋은 일주일", q4: 100, goodWeek: 0 },
    // 🚨 주간 릴레이 완전 삭제
    timeAttack: { isActive: false, title: "바닥 쓰레기 0개 만들기!", rewardRep: 100, endTime: null, cleared: [] },
    shopItems: [], blackMarketItems: [], pendingShopItems: [], roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, 
    pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [], funding: [], manualRepOffset: 0, shieldPoints: 0, 
    allTime: { exp: {}, penalty: {}, donate: {}, fund: {} }, activeMission: { isActive: false, participants: [] }
  });

  // --- 실시간 DB 동기화 및 타임어택 타이머 ---
  useEffect(() => {
    const fetchLive = async () => {
      try { 
        const res = await fetch(`${DATABASE_URL}v78Data.json`); 
        const data = await res.json(); 
        if (data) setDb(prev => ({...prev, ...data, settings: {...prev.settings, ...(data.settings||{})}, allTime: {...prev.allTime, ...(data.allTime||{})}, coopQuest: {...prev.coopQuest, ...(data.coopQuest||{})}, timeAttack: {...prev.timeAttack, ...(data.timeAttack||{})}})); 
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
    try { await fetch(`${DATABASE_URL}v78Data.json`, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  // --- 데이터 정제 및 연산 로직 ---
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

  const activeStudents = useMemo(() => allStats.filter(s => s.status !== 'crisis'), [allStats]); // 위기 고립 명단

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
  const topDonate = useMemo(() => [...allStats].sort((a,b) => b.atDonate - a.atDonate).filter(s => s.atDonate > 0).slice(0,5), [allStats]);
  const topFund = useMemo(() => [...allStats].sort((a,b) => b.atFund - a.atFund).filter(s => s.atFund > 0).slice(0,5), [allStats]);
  const isShopOpen = useMemo(() => db.settings.forceShopOpen || new Date().getDay() === 4, [db.settings.forceShopOpen]);

  const selectedRefStudentPraises = useMemo(() => {
    if (!refTarget) return []; return safeArray(db.approvedPraises).filter(p => p.toId == refTarget);
  }, [refTarget, db.approvedPraises]);
  const randomPraise = selectedRefStudentPraises.length > 0 ? selectedRefStudentPraises[Math.floor(Math.random() * selectedRefStudentPraises.length)] : null;

  // --- 액션 핸들러 함수들 ---
  const handleExpAdjust = (id, delta) => { if(delta > 0) playSound('good'); sync({ roleExp: { ...db.roleExp, [id]: Math.max(0, (db.roleExp[id]||0) + delta) }, allTime: { ...db.allTime, exp: { ...db.allTime.exp, [id]: Math.max(0, (db.allTime.exp?.[id]||0) + delta) } } }); };
  const handleGivePenalty = (id) => { if (!isAuthenticated) return setShowModal('password'); if (window.confirm("위기 지정할까요?")) { playSound('bad'); sync({ studentStatus: { ...db.studentStatus, [id]: 'crisis' }, penaltyCount: { ...db.penaltyCount, [id]: (db.penaltyCount[id] || 0) + 1 }, allTime: { ...db.allTime, penalty: { ...db.allTime.penalty, [id]: (db.allTime.penalty?.[id] || 0) + 1 } } }); } };
  
  const handleDonate = (sId, amount) => { const u = allStats.find(s => s.id == sId); if (!u || u.coins < amount) return alert("코인 부족!"); playSound('buy'); sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, donations: [{ id: Date.now(), name: u.name, amount }, ...safeArray(db.donations)].slice(0, 15), allTime: { ...db.allTime, donate: { ...db.allTime.donate, [sId]: (db.allTime.donate?.[sId] || 0) + amount } } }); alert("기부 완료! ✨"); };
  const handleFund = (fId, sId, amount) => { const u = allStats.find(s => s.id == sId); if (!u || u.coins < amount) return alert("코인 부족!"); playSound('buy'); sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, funding: safeArray(db.funding).map(f => f.id === fId ? { ...f, current: f.current + amount } : f), allTime: { ...db.allTime, fund: { ...db.allTime.fund, [sId]: (db.allTime.fund?.[sId] || 0) + amount } } }); alert("투자 완료!"); };
  
  // 학급 공동 퀘스트 
  const addCoopScore = (points, title) => { playSound('jackpot'); sync({ manualRepOffset: (db.manualRepOffset || 0) + points }); alert(`🎉 [${title}] 달성! 평판 점수 +${points}점 획득!`); };
  const adjustGoodWeek = (delta) => { const next = Math.max(0, Math.min(5, (db.coopQuest.goodWeek || 0) + delta)); sync({ coopQuest: { ...db.coopQuest, goodWeek: next } }); if(delta > 0) playSound('good'); };
  const completeGoodWeek = () => { playSound('jackpot'); sync({ coopQuest: { ...db.coopQuest, goodWeek: 0 }, manualRepOffset: (db.manualRepOffset || 0) + (db.coopQuest.q4 || 100) }); alert(`🌟 사이 좋은 일주일 완성! +${db.coopQuest.q4 || 100}점!`); };

  // 타임어택 (발동 및 클리어 토글)
  const handleStartTimeAttack = () => { if(window.confirm("타임어택을 시작합니까?")) sync({ timeAttack: { isActive: true, title: taTitle, rewardRep: taReward, endTime: Date.now() + (taMins * 60 * 1000), cleared: [] } }); };
  const handleCompleteTimeAttack = () => { playSound('jackpot'); sync({ manualRepOffset: (db.manualRepOffset || 0) + (db.timeAttack.rewardRep || 0), timeAttack: { isActive: false, title: "", rewardRep: 0, endTime: null, cleared: [] } }); alert("🎉 타임어택 성공! 보상 지급 완료!"); };
  const handleFailTimeAttack = () => { sync({ timeAttack: { isActive: false, title: "", rewardRep: 0, endTime: null, cleared: [] } }); alert("타임어택 종료 (실패)"); };
  
  const toggleTimeAttackClear = (id) => {
    if (!db.timeAttack?.isActive) return;
    const clearedArray = safeArray(db.timeAttack.cleared);
    const isCleared = clearedArray.includes(id);
    const nextCleared = isCleared ? clearedArray.filter(cid => cid !== id) : [...clearedArray, id];
    sync({ timeAttack: { ...db.timeAttack, cleared: nextCleared } });
    if (!isCleared) playSound('good');
  };

  const submitPraise = () => { if (!praiseTarget || !praiseTag || !praiseText) return alert("빈칸 확인!"); sync({ pendingPraises: [{ id: Date.now(), toId: praiseTarget, tag: praiseTag, text: praiseText, date: new Date().toLocaleDateString() }, ...safeArray(db.pendingPraises)] }); setShowPraiseModal(false); setPraiseTarget(""); setPraiseText(""); setPraiseTag(""); alert("온기 배달 완료! 💌"); };
  const submitReflection = () => { if (!refTarget || !refTag || !refText) return alert("빈칸 확인!"); sync({ pendingReflections: [{ id: Date.now(), sId: refTarget, tag: refTag, text: refText, date: new Date().toLocaleDateString() }, ...safeArray(db.pendingReflections)], studentStatus: { ...db.studentStatus, [refTarget]: 'pending' } }); setRefTarget(""); setRefText(""); setRefTag(""); alert("다짐 제출 완료! 📝"); };
  
  const handleLogin = () => { 
    const isMaster = password === (db.settings.masterPw || "6505"); const isHelpRoom = password === (db.settings.helpRoomPw || "1111");
    if (isMaster) { setIsAuthenticated('teacher'); setActiveTab('admin'); setShowModal(null); setPassword(""); } 
    else if (isHelpRoom) { setIsAuthenticated('inspector'); setActiveTab('helproom'); setShowModal(null); setPassword(""); } 
    else { alert("비밀번호 오류 ❌"); playSound('bad'); } 
  };

  const handleStudentFieldChange = (id, field, value) => sync({ students: safeStudents.map(st => st.id === id ? {...st, [field]: value} : st) });
  const handleAddStudent = () => { if(!newStudentName) return; const nextId = safeStudents.length > 0 ? Math.max(...safeStudents.map(s=>s.id)) + 1 : 1; sync({ students: [...safeStudents, { id: nextId, name: newStudentName, role: newStudentRole || '향리', group: parseInt(newStudentGroup), isLeader: false, enneagram: newStudentEnneagram }] }); setNewStudentName(""); alert("전입 완료!"); };
  const handleRemoveStudent = (id) => { if(window.confirm("삭제할까요?")) sync({ students: safeStudents.filter(s => s.id !== id) }); };
  const partialReset = (type) => { if(window.confirm(`초기화할까요?`)) { if(type === 'donations') sync({ donations: [] }); if(type === 'status') sync({ studentStatus: {}, penaltyCount: {} }); if(type === 'exp') sync({ roleExp: {} }); alert("초기화 완료!"); } };
  const closeSemester = () => { if(window.prompt("마감하시겠습니까? '마감'을 입력하세요.") === "마감") { sync({ roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], donations: [] }); alert("학기 마감 완료! 🌱"); } };
  const factoryReset = () => { if(window.prompt("공장초기화하시겠습니까? '초기화'를 입력하세요") === "초기화") { sync({ roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [], pendingShopItems: [], funding: [], manualRepOffset: 0, shieldPoints: 0, allTime: { exp: {}, penalty: {}, donate: {}, fund: {} }, timeAttack: { isActive: false, title: "", rewardRep: 100, endTime: null, cleared: [] } }); alert("전체 리셋 완료."); } };

  // 진화 애니메이션 렌더링
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

// =========== [1부 코드의 끝] ===========
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
        
        {/* ========================================= */}
        {/* 📄 PAGE 1: 현황판                           */}
        {/* ========================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            
            {/* 🚨 상단 2분할: 학급 공동 퀘스트 / 타임어택 (수정 4: 주간 릴레이 삭제 완료) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 1. 학급 공동 퀘스트 (버튼 탑재) */}
              <div className="bg-white p-6 rounded-[30px] border-2 border-blue-100 shadow-sm flex flex-col justify-between">
                <h3 className="text-[13px] font-black text-blue-600 mb-4 flex items-center gap-2"><Zap className="w-4 h-4"/> 학급 공동 퀘스트 (터치하여 즉시 점수 획득!)</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                   <button onClick={()=>addCoopScore(db.coopQuest.q1 || 50, db.coopQuest.q1Name || "다 함께 바른 생활")} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 rounded-2xl font-black text-sm border border-indigo-200 transition-transform active:scale-95 shadow-sm truncate px-2">{db.coopQuest.q1Name || "바른 생활"} +{db.coopQuest.q1 || 50}</button>
                   <button onClick={()=>addCoopScore(db.coopQuest.q2 || 20, db.coopQuest.q2Name || "환대와 응원")} className="bg-pink-50 hover:bg-pink-100 text-pink-700 py-3 rounded-2xl font-black text-sm border border-pink-200 transition-transform active:scale-95 shadow-sm truncate px-2">{db.coopQuest.q2Name || "환대/응원"} +{db.coopQuest.q2 || 20}</button>
                   <button onClick={()=>addCoopScore(db.coopQuest.q3 || 20, db.coopQuest.q3Name || "전담수업 태도 우수")} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 rounded-2xl font-black text-sm border border-emerald-200 transition-transform active:scale-95 col-span-2 shadow-sm truncate px-2">{db.coopQuest.q3Name || "전담수업 우수"} +{db.coopQuest.q3 || 20}</button>
                </div>
                <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-2xl border border-yellow-200">
                   <span className="text-sm font-black text-yellow-800 truncate pr-2 flex-1">{db.coopQuest.q4Name || "사이좋은 일주일"}</span>
                   <div className="flex items-center gap-3 shrink-0">
                     <button onClick={()=>adjustGoodWeek(-1)} className="p-2 bg-white rounded-lg text-red-500 border border-red-100 shadow-sm hover:bg-red-50"><Minus className="w-4 h-4"/></button>
                     <span className="font-black text-lg text-yellow-600 w-10 text-center">{db.coopQuest.goodWeek || 0}/5</span>
                     <button onClick={()=>adjustGoodWeek(1)} className="p-2 bg-white rounded-lg text-green-500 border border-green-100 shadow-sm hover:bg-green-50"><Plus className="w-4 h-4"/></button>
                   </div>
                </div>
                {(db.coopQuest.goodWeek || 0) >= 5 && <button onClick={completeGoodWeek} className="mt-3 w-full bg-yellow-400 text-yellow-900 shadow-md font-black py-3 rounded-2xl text-sm animate-pulse hover:bg-yellow-500">최종 승인 및 +{db.coopQuest.q4||100}p 획득!</button>}
              </div>

              {/* 2. 작아진 타임어택 */}
              <div className={`p-6 rounded-[30px] border-2 flex flex-col items-center justify-center transition-colors min-h-[180px] ${db.timeAttack?.isActive ? 'bg-red-50 border-red-300 shadow-inner' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                {db.timeAttack?.isActive ? (
                  <>
                    <div className="flex items-center gap-2 mb-3"><Timer className="w-6 h-6 text-red-500 animate-pulse"/><h2 className="text-sm font-black text-red-600 tracking-wider">돌발 타임어택!</h2></div>
                    <p className="text-xl font-black text-slate-800 mb-4 text-center leading-tight">{db.timeAttack.title}</p>
                    <div className="bg-red-500 text-white px-8 py-3 rounded-2xl shadow-md"><span className="text-4xl font-black tracking-widest">{timeLeftString}</span></div>
                    <p className="text-xs font-bold text-red-400 mt-3">성공시 학급 명성 +{db.timeAttack.rewardRep}점</p>
                  </>
                ) : (
                  <>
                    <Timer className="w-10 h-10 mb-3 opacity-30 text-slate-400"/>
                    <p className="font-black text-sm text-slate-400 opacity-70">발동된 타임어택 없음</p>
                  </>
                )}
              </div>
            </div>

            {/* 🏆 명예의 전당 (상단 3분할) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-[40px] shadow-sm border border-blue-200">
                <h4 className="text-base font-black text-blue-800 mb-6 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> 🏆 역할 완수 TOP 5</h4>
                <ul className="space-y-3">{topExp.length > 0 ? topExp.map((s, i) => <li key={s.id} className="text-sm font-black text-blue-900 bg-white/70 px-4 py-2.5 rounded-2xl flex justify-between shadow-sm"><span>{i+1}. {s.name}</span><span className="text-blue-600">{s.atExp}회</span></li>) : <li className="text-sm font-bold text-blue-400 text-center py-4">데이터가 없습니다.</li>}</ul>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-8 rounded-[40px] shadow-sm border border-amber-200">
                <h4 className="text-base font-black text-amber-800 mb-6 flex items-center gap-2"><Coins className="w-5 h-5"/> 🏆 기부 천사 TOP 5</h4>
                <ul className="space-y-3">{topDonate.length > 0 ? topDonate.map((s, i) => <li key={s.id} className="text-sm font-black text-amber-900 bg-white/70 px-4 py-2.5 rounded-2xl flex justify-between shadow-sm"><span>{i+1}. {s.name}</span><span className="text-amber-600">{s.atDonate}🪙</span></li>) : <li className="text-sm font-bold text-amber-400 text-center py-4">데이터가 없습니다.</li>}</ul>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 p-8 rounded-[40px] shadow-sm border border-pink-200">
                <h4 className="text-base font-black text-pink-800 mb-6 flex items-center gap-2"><Target className="w-5 h-5"/> 🏆 펀딩 기여 TOP 5</h4>
                <ul className="space-y-3">{topFund.length > 0 ? topFund.map((s, i) => <li key={s.id} className="text-sm font-black text-pink-900 bg-white/70 px-4 py-2.5 rounded-2xl flex justify-between shadow-sm"><span>{i+1}. {s.name}</span><span className="text-pink-600">{s.atFund}🪙</span></li>) : <li className="text-sm font-bold text-pink-400 text-center py-4">데이터가 없습니다.</li>}</ul>
              </div>
            </div>

            {/* 테마 & 펀딩 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[50px] shadow-sm border-2 border-emerald-100 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl"></div>
                <h3 className="text-sm font-black text-emerald-600 mb-4 flex items-center gap-2 bg-emerald-50 px-5 py-2.5 rounded-full w-max relative z-10"><Star className="w-4 h-4"/> 이 주의 마음성장(SEL) 테마</h3>
                <p className="text-2xl font-black text-slate-800 mt-4 leading-snug relative z-10">{db.settings.weeklyTheme}</p>
                <p className="text-sm font-bold text-emerald-700 mt-6 bg-emerald-50/80 p-5 rounded-3xl border border-emerald-100 relative z-10">{THEME_DESCRIPTIONS[db.settings.weeklyTheme] || "이번 주도 마음 성장을 위해 함께 노력해봐요!"}</p>
              </div>
              <div className="lg:col-span-2 bg-white p-10 rounded-[50px] shadow-sm border-2 border-amber-100 flex flex-col justify-between">
                <h3 className="text-base font-black text-amber-700 mb-6 flex items-center gap-2 bg-amber-50 inline-block px-5 py-2.5 rounded-full w-max"><Target className="w-5 h-5"/> 다 함께 크라우드 펀딩</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                  {safeArray(db.funding).map(f => (
                    <div key={f.id} className="space-y-3">
                      {/* 수정 1 적용 (NaN 완벽 차단 f.target||1) */}
                      <div className="flex justify-between items-end font-black text-base text-slate-700"><span>{f.name}</span><span className="text-amber-500 text-xl">{Math.floor(((f.current||0)/(f.target||1))*100)}%</span></div>
                      <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                        <div className="h-full bg-gradient-to-r from-yellow-300 to-amber-500 transition-all duration-1000" style={{width:`${Math.min(((f.current||0)/(f.target||1))*100,100)}%`}}></div>
                      </div>
                      <p className="text-sm font-bold text-slate-400 text-right">{f.current} / {f.target} 🪙</p>
                    </div>
                  ))}
                  {safeArray(db.funding).length === 0 && <p className="col-span-2 text-center text-slate-400 font-bold py-8">현재 진행 중인 펀딩이 없습니다.</p>}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-6 border-b-4 border-amber-200/50 pb-6 mt-12">
              <div>
                <h2 className="text-4xl font-black text-amber-900 flex items-center gap-3"><Users className="text-amber-500 w-10 h-10"/> 우리 반 꼬마 시민들</h2>
                {db.settings.showCumulativeStats && <p className="text-blue-500 font-bold text-sm mt-3 bg-blue-50 px-4 py-1.5 rounded-full inline-block border border-blue-100">📊 교사 모드: 전체 번호순 정렬 및 상세 누적 스탯 공개 중</p>}
              </div>
              <button onClick={() => setShowPraiseModal(true)} className="w-full sm:w-auto bg-gradient-to-r from-pink-400 to-rose-500 text-white px-10 py-5 rounded-full font-black text-lg shadow-[0_10px_20px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_30px_rgba(244,63,94,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-pink-300">
                <Heart className="w-6 h-6 fill-white animate-pulse"/> 온기 우체통
              </button>
            </div>
            
            {/* 개인 카드 영역 (수정 3: 타임어택 클리어 토글 적용) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {sortedDashboardStats.map(s => {
                const isTaCleared = safeArray(db.timeAttack?.cleared).includes(s.id);
                return (
                <div key={s.id} className={`p-6 rounded-[35px] border-4 shadow-sm transition-all relative flex flex-col bg-white hover:shadow-xl ${s.status === 'crisis' ? 'border-slate-300 bg-slate-100 opacity-60 grayscale' : (s.status === 'pending' ? 'border-orange-300 bg-orange-50' : 'border-white hover:border-amber-300')}`}>
                  
                  {/* 타임어택 발동 시: 개인별 클리어 토글 버튼 (우측 상단) */}
                  {db.timeAttack?.isActive && s.status !== 'crisis' && (
                    <div className="absolute -top-4 -right-4 z-20">
                      <button onClick={() => toggleTimeAttackClear(s.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-black text-xs shadow-md border-2 transition-all ${isTaCleared ? 'bg-green-500 text-white border-green-600 scale-110' : 'bg-white text-slate-400 border-slate-200 hover:border-red-300 hover:text-red-500'}`}>
                        {isTaCleared ? <><CheckCircle2 className="w-4 h-4"/> 완료!</> : <><Timer className="w-4 h-4"/> 도전 중</>}
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-5 border-b-2 border-slate-100/50 pb-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner ${s.status === 'crisis' ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-800'}`}>{s.id}</span>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">My Coins</p>
                        <p className={`font-black text-2xl leading-none ${s.status === 'crisis' ? 'text-slate-500' : 'text-amber-600'}`}>{s.coins} <span className="text-sm">🪙</span></p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col mb-6 gap-3">
                    <p className="text-xs font-bold text-slate-400 tracking-wide truncate">{s.group}모둠 · {s.role}</p>
                    
                    <div className="flex justify-between items-end gap-2">
                      <h3 className={`text-xl font-black flex items-center gap-1 whitespace-nowrap tracking-tight truncate ${s.exp >= 20 && s.status !== 'crisis' ? 'text-amber-700 drop-shadow-sm' : 'text-slate-800'}`}>
                        {s.name} {s.isLeader && <Crown className={`w-4 h-4 mb-1 shrink-0 ${s.status === 'crisis' ? 'text-slate-400 fill-slate-400' : 'text-amber-400 fill-amber-400'}`}/>}
                      </h3>
                      <div className={`text-sm shrink-0 font-black px-3 py-1.5 rounded-2xl border-2 ${s.status === 'crisis' ? 'bg-slate-200 border-slate-300 text-slate-500' : `${s.mastery.bg} ${s.mastery.color}`} text-center leading-tight transition-all shadow-sm`}>
                        {s.mastery.label} <span className="text-base ml-0.5">({s.exp})</span>
                      </div>
                    </div>
                  </div>

                  {db.settings.showCumulativeStats && (
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl mb-4 text-[10px] font-bold text-slate-600 grid grid-cols-2 gap-2 shadow-inner">
                       <span>✅완수: <span className="text-blue-600">{s.atExp}</span></span><span>💎기부: <span className="text-amber-600">{s.atDonate}</span></span>
                       <span>🚀펀딩: <span className="text-pink-600">{s.atFund}</span></span><span className="text-red-400">🚨위기: <span className="text-red-600">{s.atPen}</span></span>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-2">
                    {s.status === 'normal' && <button onClick={() => handleGivePenalty(s.id)} className="w-full py-3.5 bg-slate-50 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all"><AlertTriangle className="w-4 h-4"/> 위기 지정</button>}
                    {s.status === 'crisis' && <p className="text-center font-black text-white bg-slate-600 border border-slate-700 py-3.5 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2">🚨 성찰과 회복 요망</p>}
                    {s.status === 'pending' && <p className="text-center font-black text-orange-800 bg-orange-200 border border-orange-300 py-3.5 rounded-2xl text-sm shadow-md">⏳ 교사 승인 대기중</p>}
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* 📄 PAGE 2: 성찰 센터                         */}
        {/* ========================================= */}
        {activeTab === 'reflection' && (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="bg-white p-12 md:p-16 rounded-[60px] shadow-xl border-4 border-emerald-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-60"></div>
                <BookOpen className="w-24 h-24 text-emerald-400 mx-auto mb-8 relative z-10" />
                <h2 className="text-4xl md:text-5xl font-black mb-6 text-emerald-900 relative z-10 tracking-tight">성찰과 회복 센터 🌱</h2>
                <p className="text-emerald-600 font-bold mb-12 text-lg relative z-10">내 마음을 돌아보고 더 단단한 나로 성장하는 공간입니다.</p>
                
                <div className="text-left space-y-10 bg-emerald-50/60 p-10 md:p-12 rounded-[40px] border-2 border-emerald-100 shadow-inner relative z-10">
                  <div>
                    <label className="block text-base font-black mb-4 text-emerald-800 bg-emerald-100 inline-block px-5 py-2 rounded-full">1. 누가 성찰하나요?</label>
                    <select value={refTarget} onChange={e=>setRefTarget(e.target.value)} className="w-full p-6 rounded-3xl border-2 border-white font-black outline-none focus:border-emerald-300 bg-white text-xl shadow-sm text-slate-700">
                      <option value="">이름을 선택하세요 (현재 성찰이 필요한 친구들만 보입니다)</option>
                      {allStats.filter(s => s.status === 'crisis').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  {refTarget && (
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 p-8 rounded-[30px] text-pink-800 animate-in fade-in slide-in-from-top-4 shadow-sm">
                      <h4 className="text-lg font-black mb-4 flex items-center gap-2"><Heart className="w-6 h-6 fill-pink-400"/> 누구나 실수할 수 있어요. 중요한 건 다시 일어서는 용기입니다.</h4>
                      {randomPraise ? (
                        <p className="text-base font-bold leading-relaxed bg-white p-6 rounded-2xl shadow-sm border border-pink-100">"예전에 친구가 <b>{SEL_OPTIONS.find(opt=>opt.name===randomPraise.tag)?.short}</b> 역량으로 널 칭찬했었어! 👉 <span className="text-pink-600">"{randomPraise.text}"</span> 넌 이미 훌륭한 시민이야."</p>
                      ) : (
                        <p className="text-base font-bold leading-relaxed bg-white p-6 rounded-2xl shadow-sm border border-pink-100">"넌 우리 반의 소중한 보물입니다. 천천히 스스로를 다독이고 다시 시작해봐요!"</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-base font-black mb-4 text-emerald-800 bg-emerald-100 inline-block px-5 py-2 rounded-full">2. 어떤 마음성장(SEL) 역량이 필요할까요?</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {SEL_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setRefTag(opt.name)} className={`p-5 rounded-2xl border-2 font-black text-sm text-left transition-all ${refTag === opt.name ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg scale-105' : 'bg-white border-white text-slate-500 hover:border-emerald-200 shadow-sm hover:-translate-y-1'}`}>{opt.name}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-black mb-4 text-emerald-800 bg-emerald-100 inline-block px-5 py-2 rounded-full">3. 마음의 다짐 적기</label>
                    <textarea value={refText} onChange={e=>setRefText(e.target.value)} rows="7" className="w-full p-8 rounded-[30px] border-2 border-white font-black outline-none focus:border-emerald-300 bg-white resize-none text-base leading-relaxed placeholder:text-slate-300 placeholder:font-bold shadow-sm" placeholder={refTag ? SEL_GUIDES[refTag] : "역량을 선택하면 선생님의 친절한 글쓰기 가이드가 나타납니다."}></textarea>
                  </div>
                  <button onClick={submitReflection} className="w-full bg-emerald-600 text-white py-6 rounded-[30px] font-black text-2xl shadow-xl hover:bg-emerald-700 hover:shadow-2xl active:scale-95 transition-all flex justify-center items-center gap-3 mt-4"><Send className="w-7 h-7"/> 다짐 제출하고 위기 탈출하기</button>
                </div>
             </div>
          </div>
        )}

        {/* ========================================= */}
        {/* 📄 PAGE 3: 학급 도움실                       */}
        {/* ========================================= */}
        {activeTab === 'helproom' && (
          <div className="bg-white rounded-[50px] shadow-sm border-4 border-indigo-50 flex flex-col lg:flex-row min-h-[800px] animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <aside className="w-full lg:w-80 bg-indigo-50/50 p-10 border-r-2 border-white flex flex-col gap-5 shrink-0">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-indigo-100"><Users className="w-12 h-12 text-indigo-500" /></div>
                <h3 className="text-3xl font-black text-indigo-900">학급 도움실</h3>
              </div>
              <button onClick={() => setHelpSubTab('inspector')} className={`w-full p-6 rounded-3xl font-black text-left flex items-center gap-4 text-lg transition-all ${helpSubTab === 'inspector' ? 'bg-indigo-500 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100 hover:translate-x-1'}`}><Briefcase className="w-6 h-6"/> 감찰사 본부</button>
              <button onClick={() => setHelpSubTab('magistrate')} className={`w-full p-6 rounded-3xl font-black text-left flex items-center gap-4 text-lg transition-all ${helpSubTab === 'magistrate' ? 'bg-indigo-500 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100 hover:translate-x-1'}`}><BookOpen className="w-6 h-6"/> 현령 관리소</button>
              <button onClick={() => setHelpSubTab('shop')} className={`w-full p-6 rounded-3xl font-black text-left flex items-center gap-4 text-lg transition-all ${helpSubTab === 'shop' ? 'bg-amber-400 text-white shadow-xl translate-x-2' : 'bg-white text-amber-500 hover:bg-amber-100 hover:translate-x-1'}`}><ShoppingCart className="w-6 h-6"/> 학급 상점</button>
            </aside>

            <section className="flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-50/30">
              
              <div className="mb-12 bg-gradient-to-r from-yellow-100 to-amber-100 p-8 rounded-[40px] shadow-sm flex flex-col md:flex-row gap-8 items-center border-2 border-yellow-200">
                <div className="md:w-1/3 text-center md:text-left">
                  <h4 className="text-2xl font-black text-amber-800 mb-2 flex items-center justify-center md:justify-start gap-2"><Coins className="w-8 h-8 text-yellow-500"/> 명예의 기부처</h4>
                  <p className="text-sm font-bold text-amber-700">나의 코인으로 우리 반의 명성을 높이세요!</p>
                </div>
                <div className="md:w-2/3 flex gap-4 w-full">
                  <select id="donate_who_main" className="flex-1 p-5 rounded-2xl bg-white border-2 border-white font-black outline-none shadow-sm focus:border-yellow-400 text-lg text-slate-700">
                    <option value="">누가 기부할까요?</option>
                    {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.coins}🪙)</option>)}
                  </select>
                  <input id="donate_amount_main" type="number" placeholder="금액" className="w-32 p-5 rounded-2xl bg-white border-2 border-white font-black outline-none text-center shadow-sm focus:border-yellow-400 text-lg"/>
                  <button onClick={() => {
                    const sid = document.getElementById('donate_who_main').value; const amt = parseInt(document.getElementById('donate_amount_main').value);
                    if(!sid || !amt) return alert("정보를 모두 입력하세요."); handleDonate(parseInt(sid), amt);
                  }} className="bg-amber-500 text-white px-8 rounded-2xl font-black text-xl hover:bg-amber-600 shadow-md active:scale-95 transition-transform">기부</button>
                </div>
              </div>

              {helpSubTab === 'inspector' && (
                <div className="space-y-10 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3 bg-indigo-100 inline-block px-6 py-3 rounded-full border border-indigo-200"><Briefcase className="text-indigo-600 w-8 h-8"/> 감찰사 자치 본부</h3>
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
                              <select value={s.group} onChange={e=>handleStudentFieldChange(s.id, 'group', parseInt(e.target.value))} className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-base outline-none focus:border-indigo-400 shadow-sm w-full max-w-[150px]">
                                {[1,2,3,4,5,6].map(g=><option key={g} value={g}>{g}모둠</option>)}
                              </select>
                            </td>
                            <td className="p-6 text-center">
                              <button onClick={()=>handleStudentFieldChange(s.id, 'isLeader', !s.isLeader)} className={`px-5 py-3 rounded-xl flex items-center justify-center gap-2 mx-auto font-black text-sm transition-all shadow-sm ${s.isLeader ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                                {s.isLeader ? <><Crown className="w-5 h-5 fill-white"/> 모둠장</> : '일반 모둠원'}
                              </button>
                            </td>
                            <td className="p-6">
                              <select value={s.role} onChange={e=>handleStudentFieldChange(s.id, 'role', e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-base outline-none focus:border-indigo-400 shadow-sm">
                                <option value="">직업 없음</option>{safeArray(db.rolesList).map(r=><option key={r} value={r}>{r}</option>)}
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
                <div className="space-y-8 animate-in fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3 bg-blue-100 inline-block px-6 py-3 rounded-full border border-blue-200"><BookOpen className="text-blue-600 w-8 h-8"/> 현령 직업 관리소</h3>
                    <p className="text-sm font-bold text-blue-600 bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 shadow-sm">💡 주의: 이곳에서 올리는 점수만 '장인' 승급 숙련도에 반영됩니다.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1,2,3,4,5,6].map(groupNum => {
                      const groupMembers = groupedByGroupStats.filter(s => s.group === groupNum);
                      if(groupMembers.length === 0) return null;
                      return (
                        <div key={groupNum} className="bg-white p-8 rounded-[40px] border-2 border-blue-50 shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="text-xl font-black text-blue-800 mb-6 bg-blue-50 inline-block px-6 py-2 rounded-full border border-blue-100">{groupNum} 모둠 명단</h4>
                          <div className="grid grid-cols-1 gap-4">
                            {groupMembers.map(s => (
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

              {helpSubTab === 'shop' && (
                <div className="space-y-10 animate-in fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-amber-200 pb-6">
                    <div>
                      <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3 bg-amber-100 inline-block px-6 py-3 rounded-full border border-amber-200 mb-3"><ShoppingCart className="text-amber-600 w-8 h-8"/> 달보드레 상점</h3>
                      <p className="text-base font-bold text-amber-700 ml-2">선생님과 감찰사가 만든 물품을 구매하고 펀딩에 참여해요!</p>
                    </div>
                    <div className={`px-10 py-5 rounded-full font-black text-xl shadow-lg border-4 ${isShopOpen ? 'bg-green-500 text-white border-green-300 animate-pulse' : 'bg-slate-500 text-white border-slate-400'}`}>{isShopOpen ? "🔓 상점 영업 중" : "🔒 영업 종료 (목요일 개방)"}</div>
                  </div>

                  {/* 장인의 공방 */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-10 rounded-[40px] border-4 border-amber-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200 rounded-full blur-[60px] opacity-40"></div>
                    <h4 className="text-3xl font-black text-amber-900 mb-3 relative z-10 flex items-center gap-2"><Gavel className="w-8 h-8"/> 장인의 공방 (특산품 기획소)</h4>
                    <p className="text-base font-bold text-amber-700 mb-8 relative z-10">숙련도 20회 이상인 '장인'은 자신의 직업과 관련된 기발한 아이템을 기획해 올릴 수 있습니다.</p>
                    <div className="flex flex-wrap gap-4 relative z-10">
                      <select value={artisanTarget} onChange={e=>setArtisanTarget(e.target.value)} className="w-56 p-5 rounded-2xl bg-white border-2 border-amber-200 font-black text-lg outline-none focus:border-amber-400 shadow-sm">
                        <option value="">장인 명단 확인</option>
                        {allStats.filter(s => s.exp >= 20).map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                      <input type="text" placeholder="기발한 아이템 이름" value={artisanItemName} onChange={e=>setArtisanItemName(e.target.value)} className="flex-1 p-5 rounded-2xl bg-white border-2 border-amber-200 font-bold text-lg outline-none focus:border-amber-400 shadow-sm"/>
                      <input type="number" placeholder="희망 가격" value={artisanItemPrice} onChange={e=>setArtisanItemPrice(e.target.value)} className="w-32 p-5 rounded-2xl bg-white border-2 border-amber-200 font-bold text-lg outline-none focus:border-amber-400 text-center shadow-sm"/>
                      <button onClick={submitArtisanItem} className="bg-amber-600 text-white px-10 rounded-2xl font-black text-lg shadow-lg hover:bg-amber-700 active:scale-95 transition-all">결재 올리기</button>
                    </div>
                  </div>

                  {/* 물품 구매 및 펀딩 (수정 1 반영: NaN 오류 완벽 차단) */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {safeArray(db.shopItems).map(item => (
                      <div key={item.id} className="bg-white p-10 rounded-[40px] shadow-sm border-2 border-slate-100 flex flex-col justify-between hover:border-amber-300 transition-colors">
                         <div>
                           <div className="flex justify-between items-start mb-6">
                             <span className="text-sm font-black bg-slate-100 text-slate-500 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">{item.creator} 제작</span>
                             <p className="text-4xl font-black text-amber-500">{item.price} 🪙</p>
                           </div>
                           <h4 className="text-3xl font-black text-slate-800 mb-10">{item.name}</h4>
                         </div>
                         <div className="flex gap-4">
                           <select id={`buyer_${item.id}`} className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none text-lg focus:border-amber-400 shadow-sm">
                             <option value="">누가 구매하나요?</option>
                             {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.coins}🪙)</option>)}
                           </select>
                           <button onClick={() => {
                             if(!isShopOpen) return alert("오늘은 상점 운영일이 아닙니다!");
                             const sid = document.getElementById(`buyer_${item.id}`).value;
                             if(!sid) return alert("구매할 사람을 선택하세요."); const user = activeStudents.find(u => u.id == sid);
                             if(user.coins < item.price) return alert("코인이 부족합니다.");
                             if(window.confirm(`${user.name}의 개인 코인을 차감할까요?`)) { sync({ usedCoins: { ...db.usedCoins, [sid]: (db.usedCoins[sid] || 0) + item.price } }); alert("결제 승인 완료!"); playSound('buy'); }
                           }} className="bg-amber-500 text-white px-10 rounded-2xl font-black text-xl shadow-lg hover:bg-amber-600 active:scale-95 transition-all">구매</button>
                         </div>
                      </div>
                    ))}
                    
                    {/* 크라우드 펀딩 카드 (수정 1: NaN 차단 f.target||1 적용) */}
                    {safeArray(db.funding).map(f => (
                      <div key={f.id} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-10 rounded-[40px] shadow-xl text-white flex flex-col justify-between relative overflow-hidden border-4 border-blue-400">
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                           <h4 className="text-3xl font-black mb-3 flex items-center gap-3"><Target className="w-8 h-8 text-yellow-300"/> {f.name}</h4>
                           <p className="text-base font-bold text-blue-100 mb-10">십시일반 투자하여 다 함께 목표를 이뤄요!</p>
                           <div className="flex justify-between items-end text-xl font-black mb-4"><span>현재: {f.current}p</span><span className="text-blue-200">목표: {f.target}p</span></div>
                           <div className="w-full h-6 bg-black/30 rounded-full mb-10 overflow-hidden border border-white/20 shadow-inner">
                             <div className="h-full bg-yellow-400 transition-all duration-1000 shadow-[0_0_15px_rgba(250,204,21,0.8)]" style={{width:`${Math.min(((f.current||0)/(f.target||1))*100, 100)}%`}}></div>
                           </div>
                        </div>
                        <div className="flex gap-4 relative z-10">
                           <select id={`funder_${f.id}`} className="flex-1 p-5 rounded-2xl bg-white/20 border-none text-white font-bold outline-none text-lg backdrop-blur-sm focus:bg-white/30">
                             <option value="" className="text-slate-800">누가 투자할까요?</option>
                             {activeStudents.map(s => <option key={s.id} value={s.id} className="text-slate-800">{s.name} ({s.coins}🪙)</option>)}
                           </select>
                           <input id={`f_amt_${f.id}`} type="number" placeholder="금액" className="w-28 p-5 rounded-2xl bg-white/20 border-none text-white font-bold outline-none text-lg placeholder:text-blue-200 backdrop-blur-sm focus:bg-white/30 text-center"/>
                           <button onClick={() => {
                             const sid = document.getElementById(`funder_${f.id}`).value; const amt = parseInt(document.getElementById(`f_amt_${f.id}`).value);
                             if(!sid || !amt) return alert("정확히 입력하세요."); handleFund(f.id, parseInt(sid), amt);
                           }} className="bg-yellow-400 text-yellow-900 px-10 rounded-2xl font-black text-xl shadow-lg hover:bg-yellow-300 active:scale-95 transition-all">투자</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================= */}
        {/* 📄 PAGE 4: 통합 관리실 (교사 전용)             */}
        {/* ========================================= */}
        {activeTab === 'admin' && isAuthenticated === 'teacher' && (
          <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 flex flex-col lg:flex-row min-h-[850px] animate-in slide-in-from-right duration-300 overflow-hidden">
             
             <aside className="w-full lg:w-80 bg-slate-900 p-10 flex flex-col gap-4 shrink-0 border-r border-slate-800">
                <div className="text-center mb-10">
                  <Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-black text-white">관리자 센터</h3>
                  <p className="text-slate-400 text-xs font-bold mt-2 tracking-widest">MASTER MODE</p>
                </div>
                <button onClick={() => setAdminSubTab('mission')} className={`w-full p-5 rounded-2xl font-black text-left flex items-center gap-4 text-lg transition-all ${adminSubTab === 'mission' ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:translate-x-1'}`}><Zap className="w-6 h-6"/> 결재 및 퀘스트</button>
                <button onClick={() => setAdminSubTab('report')} className={`w-full p-5 rounded-2xl font-black text-left flex items-center gap-4 text-lg transition-all ${adminSubTab === 'report' ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:translate-x-1'}`}><BarChart3 className="w-6 h-6"/> SEL 리포트</button>
                <button onClick={() => setAdminSubTab('students')} className={`w-full p-5 rounded-2xl font-black text-left flex items-center gap-4 text-lg transition-all ${adminSubTab === 'students' ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:translate-x-1'}`}><Users className="w-6 h-6"/> 명단 관리</button>
                <button onClick={() => setAdminSubTab('settings')} className={`w-full p-5 rounded-2xl font-black text-left flex items-center gap-4 text-lg transition-all ${adminSubTab === 'settings' ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:translate-x-1'}`}><Settings className="w-6 h-6"/> 환경 및 점수 세팅</button>
                <button onClick={() => setAdminSubTab('reset')} className={`w-full p-5 rounded-2xl font-black text-left flex items-center gap-4 text-lg transition-all ${adminSubTab === 'reset' ? 'bg-red-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:translate-x-1'}`}><History className="w-6 h-6"/> 초기화/마감</button>
                
                <button onClick={() => { setIsAuthenticated(false); setActiveTab('dashboard'); }} className="mt-auto p-5 bg-slate-800 text-slate-400 font-black rounded-2xl text-center hover:bg-slate-700 transition-colors">로그아웃</button>
             </aside>

             <section className="flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-50/50">
                
                {adminSubTab === 'mission' && (
                  <div className="space-y-10 animate-in fade-in">
                    
                    {/* 🎮 학급 공동 퀘스트 컨트롤러 */}
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                      <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-4 mb-4 flex items-center gap-2"><Settings className="text-blue-500 w-6 h-6"/> 학급 공동 퀘스트 이름 및 점수 세팅</h3>
                      <p className="text-sm font-bold text-slate-500 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">이곳에서 미션 이름과 보상 점수를 변경하세요. (실제 점수 획득 버튼은 [명성 현황판] 상단에 배치되어 있습니다.)</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                         <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3 shadow-sm">
                           <input type="text" value={db.coopQuest.q1Name || "다 함께 바른 생활"} onChange={e=>sync({coopQuest: {...db.coopQuest, q1Name: e.target.value}})} className="flex-1 p-3 rounded-xl text-sm font-bold border-none outline-none shadow-sm"/>
                           <input type="number" value={db.coopQuest.q1 || 50} onChange={e=>sync({coopQuest: {...db.coopQuest, q1: parseInt(e.target.value)}})} className="w-20 p-3 rounded-xl text-base font-black text-indigo-600 border-none outline-none text-center shadow-sm"/>
                         </div>
                         <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 flex gap-3 shadow-sm">
                           <input type="text" value={db.coopQuest.q2Name || "환대와 응원"} onChange={e=>sync({coopQuest: {...db.coopQuest, q2Name: e.target.value}})} className="flex-1 p-3 rounded-xl text-sm font-bold border-none outline-none shadow-sm"/>
                           <input type="number" value={db.coopQuest.q2 || 20} onChange={e=>sync({coopQuest: {...db.coopQuest, q2: parseInt(e.target.value)}})} className="w-20 p-3 rounded-xl text-base font-black text-pink-600 border-none outline-none text-center shadow-sm"/>
                         </div>
                         <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex gap-3 shadow-sm">
                           <input type="text" value={db.coopQuest.q3Name || "전담수업 태도 우수"} onChange={e=>sync({coopQuest: {...db.coopQuest, q3Name: e.target.value}})} className="flex-1 p-3 rounded-xl text-sm font-bold border-none outline-none shadow-sm"/>
                           <input type="number" value={db.coopQuest.q3 || 20} onChange={e=>sync({coopQuest: {...db.coopQuest, q3: parseInt(e.target.value)}})} className="w-20 p-3 rounded-xl text-base font-black text-emerald-600 border-none outline-none text-center shadow-sm"/>
                         </div>
                         <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex gap-3 shadow-sm">
                           <input type="text" value={db.coopQuest.q4Name || "사이좋은 일주일"} onChange={e=>sync({coopQuest: {...db.coopQuest, q4Name: e.target.value}})} className="flex-1 p-3 rounded-xl text-sm font-bold border-none outline-none shadow-sm"/>
                           <input type="number" value={db.coopQuest.q4 || 100} onChange={e=>sync({coopQuest: {...db.coopQuest, q4: parseInt(e.target.value)}})} className="w-20 p-3 rounded-xl text-base font-black text-yellow-600 border-none outline-none text-center shadow-sm"/>
                         </div>
                      </div>

                      <div className="border-t-2 border-slate-100 pt-8">
                         {/* 타임어택 세팅 (수정 2 반영: 모바일에서 버튼 분리되어 완벽히 표시됨) */}
                         <div className="bg-red-50 p-8 rounded-[30px] border-2 border-red-200">
                           <h4 className="text-xl font-black text-red-800 mb-6 flex items-center gap-2"><Timer className="w-6 h-6"/> 타임어택 발동기</h4>
                           {db.timeAttack?.isActive ? (
                             <div className="space-y-6">
                               <div className="bg-white p-4 rounded-2xl border border-red-100 text-center shadow-inner">
                                 <p className="text-3xl font-black text-red-600 tracking-widest">{timeLeftString}</p>
                               </div>
                               <div className="flex gap-3">
                                 <button onClick={handleCompleteTimeAttack} className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black shadow-md text-lg hover:bg-green-600 active:scale-95 transition-transform">미션 성공 (보상 지급)</button>
                                 <button onClick={handleFailTimeAttack} className="flex-1 bg-slate-400 text-white py-4 rounded-2xl font-black shadow-md text-lg hover:bg-slate-500 active:scale-95 transition-transform">실패 종료</button>
                               </div>
                             </div>
                           ) : (
                             <div className="space-y-4">
                               <input type="text" placeholder="미션 내용 (예: 바닥 쓰레기 0개)" value={taTitle} onChange={e=>setTaTitle(e.target.value)} className="w-full p-4 rounded-2xl border border-red-200 font-bold text-base outline-none focus:border-red-400 shadow-sm"/>
                               
                               <div className="flex flex-col sm:flex-row gap-3">
                                 <div className="flex gap-2 flex-1">
                                   <input type="number" placeholder="시간(분)" value={taMins} onChange={e=>setTaMins(e.target.value)} className="w-1/3 p-4 rounded-2xl border border-red-300 font-black text-base text-center outline-none shadow-sm focus:border-red-500" title="제한시간(분)"/>
                                   <input type="number" placeholder="보상 점수" value={taReward} onChange={e=>setTaReward(e.target.value)} className="w-2/3 p-4 rounded-2xl border border-red-300 font-black text-base outline-none shadow-sm focus:border-red-500" title="성공 시 보상 점수"/>
                                 </div>
                                 <button onClick={handleStartTimeAttack} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 shadow-lg text-lg active:scale-95 transition-transform whitespace-nowrap">🚀 발동하기</button>
                               </div>
                             </div>
                           )}
                         </div>
                      </div>
                    </div>

                    {/* 서류 결재함 */}
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-green-100">
                       <h4 className="text-3xl font-black mb-8 text-slate-800 border-l-8 border-green-500 pl-5">서류 결재함</h4>
                       <div className="w-full space-y-5 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                         
                         {/* 성찰 제출 서류 */}
                         {safeArray(db.pendingReflections).map(r => (
                           <div key={r.id} className="bg-red-50 p-6 rounded-[24px] border-2 border-red-200 text-left shadow-sm">
                             <div className="flex justify-between items-center mb-4 border-b border-red-200/50 pb-3">
                               <span className="font-black text-red-800 bg-red-100 px-4 py-1.5 rounded-xl text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {allStats.find(s=>s.id==r.sId)?.name} (성찰 제출)</span>
                               <span className="text-xs font-black text-red-400 bg-white px-3 py-1 rounded-full border border-red-100">{SEL_OPTIONS.find(opt=>opt.name===r.tag)?.short}</span>
                             </div>
                             <p className="text-base text-slate-700 font-bold mb-6 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-2xl border border-red-100 shadow-inner">"{r.text}"</p>
                             <div className="flex gap-3">
                               <button onClick={() => { const next = db.pendingReflections.filter(pr => pr.id !== r.id); sync({ pendingReflections: next, studentStatus: { ...db.studentStatus, [r.sId]: 'normal' } }); alert("위기 해제 승인 완료!"); playSound('good'); }} className="flex-1 bg-red-500 text-white py-4 rounded-xl font-black text-base hover:bg-red-600 shadow-md active:scale-95 transition-transform">위기 해제 및 복귀 승인</button>
                               <button onClick={() => { const next = db.pendingReflections.filter(pr => pr.id !== r.id); sync({ pendingReflections: next, studentStatus: { ...db.studentStatus, [r.sId]: 'crisis' } }); alert("반려되었습니다."); }} className="px-6 bg-white text-slate-500 font-black rounded-xl border-2 border-slate-200 hover:bg-slate-50">다시 성찰하기 (반려)</button>
                             </div>
                           </div>
                         ))}
                         
                         {/* 온기 우체통 서류 */}
                         {safeArray(db.pendingPraises).map(p => {
                           const isCrisis = allStats.find(u => u.id == p.toId)?.status === 'crisis';
                           return (
                           <div key={p.id} className="bg-pink-50 p-6 rounded-[24px] border-2 border-pink-200 text-left shadow-sm">
                             <div className="flex justify-between items-center mb-4 border-b border-pink-200/50 pb-3">
                               <div className="flex items-center gap-3">
                                 <span className="font-black text-pink-800 bg-pink-100 px-4 py-1.5 rounded-xl text-sm flex items-center gap-2"><Heart className="w-4 h-4 fill-pink-500"/> To. {allStats.find(s=>s.id==p.toId)?.name||'나 자신'}</span>
                                 {isCrisis && <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-black animate-pulse shadow-sm border border-red-600">🚨 현재 위기 상태</span>}
                               </div>
                               <span className="text-xs font-black text-pink-500 bg-white px-3 py-1 rounded-full border border-pink-100">{SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short}</span>
                             </div>
                             <p className="text-base text-slate-700 font-bold mb-6 bg-white p-4 rounded-2xl border border-pink-100 shadow-inner">"{p.text}"</p>
                             <div className="flex gap-3">
                               <button onClick={() => { 
                                 if (isCrisis) return alert("현재 위기 상태인 학생에게는 온기 코인을 지급할 수 없습니다. 성찰과 회복이 먼저입니다.");
                                 const next = db.pendingPraises.filter(pr => pr.id !== p.id); 
                                 const app = [p, ...safeArray(db.approvedPraises)].slice(0,20); 
                                 
                                 const isThemeMatch = p.tag === db.settings.weeklyTheme;
                                 const earnedCoins = isThemeMatch ? (db.settings.pointConfig?.praiseBonus || 15) : (db.settings.pointConfig?.praiseBasic || 10);
                                 
                                 let updates = { pendingPraises: next, approvedPraises: app };
                                 if(p.toId !== 'me') { 
                                   updates.bonusCoins = { ...db.bonusCoins, [p.toId]: (db.bonusCoins?.[p.toId] || 0) + earnedCoins };
                                   updates.allTime = { ...db.allTime, exp: { ...db.allTime.exp, [p.toId]: (db.allTime.exp?.[p.toId]||0) + 1 } };
                                 }

                                 sync(updates); 
                                 alert(`온기 승인 완료! (+${earnedCoins}🪙)`); playSound('good'); 
                               }} className={`flex-1 py-4 rounded-xl font-black text-base shadow-md transition-all ${isCrisis ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-400' : 'bg-pink-500 text-white hover:bg-pink-600 active:scale-95'}`}>온기 사연 승인</button>
                               <button onClick={() => { const next = db.pendingPraises.filter(pr => pr.id !== p.id); sync({ pendingPraises: next }); alert("반려되었습니다."); }} className="px-6 bg-white text-slate-500 font-black rounded-xl border-2 border-slate-200 hover:bg-slate-50">반려</button>
                             </div>
                           </div>
                         )})}
                         
                         {safeArray(db.pendingReflections).length === 0 && safeArray(db.pendingPraises).length === 0 && <div className="text-slate-400 font-black py-16 border-4 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center"><CheckCircle2 className="w-12 h-12 mb-4 opacity-50"/>결재 대기열이 깨끗합니다.</div>}
                       </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'report' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">🌱 학생별 SEL 마음성장 리포트</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10">
                      <div className="w-full md:w-1/3">
                        <select value={selectedReportStudent} onChange={e=>setSelectedReportStudent(e.target.value)} className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 font-black text-xl outline-none mb-6 focus:border-blue-400 shadow-sm">
                          <option value="">학생을 선택하세요</option>
                          {allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {selectedReportStudent && (
                          <button onClick={() => setShowRollingPaper(parseInt(selectedReportStudent))} className="w-full bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white p-5 rounded-3xl font-black text-lg shadow-lg flex items-center justify-center gap-3 mb-8 transition-transform hover:-translate-y-1"><Printer className="w-6 h-6"/> 온기 롤링페이퍼 인쇄</button>
                        )}
                        <p className="text-sm font-bold text-slate-500 leading-relaxed bg-slate-50 p-8 rounded-[30px] border border-slate-100">온기 우체통을 통해 받은 칭찬 데이터를 분석하고, 설정된 에니어그램 성향과 결합하여 선생님의 맞춤형 생활 지도를 돕습니다.</p>
                      </div>
                      
                      <div className="w-full md:w-2/3 bg-slate-50 p-10 rounded-[40px] border border-slate-200">
                        {selectedReportStudent ? (() => {
                          const s = allStats.find(x => x.id == selectedReportStudent);
                          const counts = {}; SEL_OPTIONS.forEach(o => counts[o.name] = 0);
                          safeArray(db.approvedPraises).forEach(p => { if(p.toId == s.id && counts[p.tag] !== undefined) counts[p.tag]++; });
                          const max = Math.max(...Object.values(counts), 5);
                          return (
                            <div className="animate-in fade-in zoom-in-95">
                              <div className="flex justify-between items-end mb-8 border-b-2 border-slate-200 pb-4">
                                <h4 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Star className="w-8 h-8 text-yellow-400 fill-yellow-400"/> {s.name} 학생 분석</h4>
                                <div className="text-right text-sm font-black text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">누적 위기 <span className="text-red-500">{s.atPen}회</span> | 기부 <span className="text-amber-500">{s.atDonate}🪙</span></div>
                              </div>
                              
                              {s.enneagram && ENNEAGRAM_DATA[s.enneagram] && (
                                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-200 mb-10 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>
                                  <h5 className="font-black text-indigo-900 mb-3 flex items-center gap-2 relative z-10"><Sparkles className="w-5 h-5 text-indigo-500"/> AI 교사 지원 힌트: {ENNEAGRAM_DATA[s.enneagram].name}</h5>
                                  <p className="text-base font-bold text-indigo-800 leading-relaxed relative z-10">{ENNEAGRAM_DATA[s.enneagram].desc}</p>
                                </div>
                              )}

                              <div className="space-y-5 mb-8">
                                {Object.keys(counts).map(tag => {
                                  const shortName = SEL_OPTIONS.find(opt=>opt.name === tag)?.short || tag;
                                  return (
                                  <div key={tag} className="flex items-center gap-5">
                                    <span className="w-28 text-sm font-black text-slate-600 text-right">{shortName}</span>
                                    <div className="flex-1 h-8 bg-white rounded-full overflow-hidden border border-slate-200 shadow-inner"><div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000" style={{width: `${(counts[tag]/max)*100}%`}}></div></div>
                                    <span className="w-12 font-black text-blue-600 text-right text-lg">{counts[tag]}회</span>
                                  </div>
                                )})}
                              </div>
                            </div>
                          );
                        })() : <div className="h-full flex flex-col items-center justify-center text-slate-400 font-black"><BarChart3 className="w-16 h-16 mb-4 opacity-30"/>학생을 선택하면 리포트가 생성됩니다.</div>}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'students' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">👥 학생 명단 및 에니어그램 관리</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                      
                      <div className="flex flex-wrap gap-4 mb-10 bg-slate-50 p-8 rounded-[30px] border border-slate-200 shadow-sm">
                        <input type="text" placeholder="새 학생 이름" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="flex-1 p-5 rounded-2xl border border-slate-300 font-bold outline-none text-lg focus:border-blue-400 shadow-sm"/>
                        <select value={newStudentGroup} onChange={e=>setNewStudentGroup(e.target.value)} className="w-36 p-5 rounded-2xl border border-slate-300 font-bold outline-none text-lg shadow-sm"><option value="1">1모둠</option><option value="2">2모둠</option><option value="3">3모둠</option><option value="4">4모둠</option><option value="5">5모둠</option><option value="6">6모둠</option></select>
                        <select value={newStudentEnneagram} onChange={e=>setNewStudentEnneagram(e.target.value)} className="w-40 p-5 rounded-2xl border border-slate-300 font-bold outline-none text-lg shadow-sm"><option value="">성향 없음</option>{Object.keys(ENNEAGRAM_DATA).map(k => <option key={k} value={k}>{k}번 유형</option>)}</select>
                        <button onClick={handleAddStudent} className="bg-blue-600 text-white px-10 rounded-2xl font-black text-lg shadow-md hover:bg-blue-700 active:scale-95 transition-transform">전입생 추가</button>
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
                            <button onClick={() => handleRemoveStudent(s.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-colors shadow-sm"><Trash2 className="w-5 h-5"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'settings' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">환경 및 보안 통제소</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
                       
                       <div className="bg-slate-50 p-10 rounded-[30px] border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div>
                            <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-lg"><Lock className="w-6 h-6"/> 관리실 (선생님) 비밀번호 변경</h4>
                            <div className="flex gap-3">
                              <input type="password" value={masterPwInput} onChange={e=>setMasterPwInput(e.target.value)} placeholder="새 비밀번호 입력" className="flex-1 p-4 rounded-2xl border border-slate-300 font-black outline-none focus:border-blue-400 shadow-sm text-lg"/>
                              <button onClick={()=>{ if(!masterPwInput) return alert('입력하세요.'); sync({settings: {...db.settings, masterPw: masterPwInput}}); alert('변경 완료!'); setMasterPwInput(''); }} className="bg-blue-600 text-white px-6 rounded-2xl font-black text-lg shadow-md hover:bg-blue-700">변경</button>
                            </div>
                            <p className="text-sm font-bold text-slate-400 mt-3 bg-white inline-block px-3 py-1 rounded-lg border border-slate-200">현재 설정됨: {db.settings.masterPw || "기본(6505)"}</p>
                          </div>
                          <div>
                            <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-lg"><Lock className="w-6 h-6 text-indigo-500"/> 도움실 (감찰사) 비밀번호 변경</h4>
                            <div className="flex gap-3">
                              <input type="password" value={helpPwInput} onChange={e=>setHelpPwInput(e.target.value)} placeholder="새 비밀번호 입력" className="flex-1 p-4 rounded-2xl border border-slate-300 font-black outline-none focus:border-indigo-400 shadow-sm text-lg"/>
                              <button onClick={()=>{ if(!helpPwInput) return alert('입력하세요.'); sync({settings: {...db.settings, helpRoomPw: helpPwInput}}); alert('변경 완료!'); setHelpPwInput(''); }} className="bg-indigo-500 text-white px-6 rounded-2xl font-black text-lg shadow-md hover:bg-indigo-600">변경</button>
                            </div>
                            <p className="text-sm font-bold text-slate-400 mt-3 bg-white inline-block px-3 py-1 rounded-lg border border-slate-200">현재 설정됨: {db.settings.helpRoomPw || "기본(1111)"}</p>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t-2 border-slate-100">
                          <div>
                            <label className="block text-base font-black text-slate-600 mb-4">대시보드 메인 타이틀</label>
                            <input type="text" value={db.settings.title} onChange={e=>sync({settings: {...db.settings, title: e.target.value}})} className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-200 font-black text-xl outline-none focus:border-blue-400 shadow-sm"/>
                          </div>
                          <div>
                            <label className="block text-base font-black text-slate-600 mb-4">이 주의 마음성장(SEL) 테마</label>
                            <select value={db.settings.weeklyTheme} onChange={e=>sync({settings: {...db.settings, weeklyTheme: e.target.value}})} className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-200 font-black text-xl outline-none focus:border-blue-400 shadow-sm">
                              {SEL_OPTIONS.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
                            </select>
                          </div>
                       </div>
                       
                       <div className="pt-8 border-t-2 border-slate-100 bg-indigo-50/50 p-10 rounded-[40px] border border-indigo-100">
                          <h4 className="font-black text-2xl text-indigo-900 mb-6 flex items-center gap-3"><Settings className="w-6 h-6"/> 만능 점수 밸런스 및 수동 세팅</h4>
                          
                          <div className="flex flex-col md:flex-row gap-4 mb-10 bg-white p-6 rounded-3xl shadow-sm border border-indigo-50">
                            <input type="number" value={manualScoreInput} onChange={e=>setManualScoreInput(e.target.value)} placeholder="명성 점수 강제 추가/차감 (예: +50 또는 -20)" className="flex-1 p-4 rounded-2xl border border-slate-200 font-black outline-none text-base focus:border-indigo-400"/>
                            <button onClick={() => { const val = parseInt(manualScoreInput); if(isNaN(val)) return; if(window.confirm(`${val}점 적용?`)) { sync({ manualRepOffset: (db.manualRepOffset||0) + val }); setManualScoreInput(""); } }} className="bg-indigo-600 text-white px-10 rounded-2xl font-black text-lg shadow-md hover:bg-indigo-700 active:scale-95 transition-transform">즉시 적용</button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-5 rounded-2xl shadow-sm"><label className="block text-sm font-black text-indigo-600 mb-3">최고 목표 명성</label><input type="number" value={db.settings.targetScore} onChange={e=>sync({settings: {...db.settings, targetScore: parseInt(e.target.value)}})} className="w-full p-4 rounded-xl border border-slate-200 font-black text-lg outline-none"/></div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm"><label className="block text-sm font-black text-indigo-600 mb-3">기본 온기 코인(🪙)</label><input type="number" value={db.settings.pointConfig?.praiseBasic||10} onChange={e=>sync({settings: {...db.settings, pointConfig: {...db.settings.pointConfig, praiseBasic: parseInt(e.target.value)}}})} className="w-full p-4 rounded-xl border border-slate-200 font-black text-lg outline-none"/></div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm"><label className="block text-sm font-black text-pink-500 mb-3">테마 일치 보너스(🪙)</label><input type="number" value={db.settings.pointConfig?.praiseBonus||15} onChange={e=>sync({settings: {...db.settings, pointConfig: {...db.settings.pointConfig, praiseBonus: parseInt(e.target.value)}}})} className="w-full p-4 rounded-xl border border-pink-200 font-black text-pink-600 text-lg outline-none"/></div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm"><label className="block text-sm font-black text-red-500 mb-3">위기 지정 차감(p)</label><input type="number" value={db.settings.pointConfig?.penalty||20} onChange={e=>sync({settings: {...db.settings, pointConfig: {...db.settings.pointConfig, penalty: parseInt(e.target.value)}}})} className="w-full p-4 rounded-xl border border-red-200 font-black text-red-600 text-lg outline-none"/></div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* 탭: 초기화/마감 */}
                {adminSubTab === 'reset' && (
                  <div className="animate-in fade-in space-y-8">
                     <h3 className="text-3xl font-black text-slate-800 border-l-8 border-red-500 pl-6 mb-8">데이터 초기화 및 1학기 마감</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="bg-blue-50 border-4 border-blue-200 p-12 rounded-[50px] text-center shadow-lg">
                          <History className="w-20 h-20 text-blue-500 mx-auto mb-6" />
                          <h3 className="text-4xl font-black mb-6 text-blue-800">1학기 최종 마감</h3>
                          <p className="font-bold text-blue-600 mb-10 text-lg">코인과 직업 숙련도를 리셋하고, 누적 데이터는 보존합니다.</p>
                          <button onClick={closeSemester} className="bg-blue-600 text-white px-12 py-6 rounded-[35px] font-black text-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">학기 마감 실행</button>
                       </div>
                       <div className="bg-red-50 border-4 border-red-200 p-12 rounded-[50px] text-center shadow-lg">
                          <Trash2 className="w-20 h-20 text-red-500 mx-auto mb-6" />
                          <h3 className="text-4xl font-black mb-6 text-red-800">시스템 공장 초기화</h3>
                          <p className="font-bold text-red-600 mb-10 text-lg">명단과 세팅을 제외한 모든 데이터를 영구적으로 삭제합니다.</p>
                          <button onClick={factoryReset} className="bg-red-600 text-white px-12 py-6 rounded-[35px] font-black text-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all">공장 초기화 실행</button>
                       </div>
                     </div>
                  </div>
                )}
             </section>
          </div>
        )}
      </main>

      {/* ========================================= */}
      {/* 💌 모달: 온기 우체통 작성폼                  */}
      {/* ========================================= */}
      {showPraiseModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white p-12 rounded-[50px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 border-4 border-pink-100">
            <h3 className="text-4xl font-black text-pink-600 mb-10 flex items-center justify-center gap-3"><Heart className="w-10 h-10 fill-pink-500"/> 따뜻한 온기 제보</h3>
            <div className="space-y-6 mb-12">
              <select value={praiseTarget} onChange={(e)=>setPraiseTarget(e.target.value)} className="w-full p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 font-black text-xl outline-none focus:border-pink-400 focus:bg-white shadow-sm">
                <option value="">누구를 칭찬할까요?</option>
                <option value="me" className="text-pink-600">🙋 나 자신 (스스로 대견할 때!)</option>
                {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={praiseTag} onChange={(e)=>setPraiseTag(e.target.value)} className="w-full p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 font-black text-xl outline-none focus:border-pink-400 focus:bg-white shadow-sm">
                <option value="">어떤 역량인가요?</option>
                {SEL_OPTIONS.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
              </select>
              <textarea value={praiseText} onChange={(e)=>setPraiseText(e.target.value)} rows="5" placeholder={praiseTag ? PRAISE_GUIDES[praiseTag] : "위에서 역량을 먼저 선택하면 친절한 칭찬 가이드가 나타납니다! 💌"} className="w-full p-6 rounded-[30px] bg-pink-50 border-2 border-pink-100 font-black text-lg outline-none focus:border-pink-400 focus:bg-white resize-none shadow-inner placeholder:font-bold placeholder:text-pink-400 text-pink-900 leading-relaxed"/>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowPraiseModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-3xl font-black text-xl hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={submitPraise} className="flex-1 py-6 bg-pink-500 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-pink-600 active:scale-95 transition-transform flex justify-center items-center gap-2"><Send className="w-6 h-6"/> 보내기</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 🔒 모달: 관리자/감찰사 비밀번호 입력폼         */}
      {/* ========================================= */}
      {showModal === 'password' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-[9999]">
          <div className="bg-white rounded-[60px] p-16 w-full max-w-xl text-center shadow-2xl animate-in zoom-in-95 border-4 border-blue-100">
            <Lock className="w-20 h-20 text-blue-500 mx-auto mb-8" />
            <h3 className="text-4xl font-black text-center mb-10 text-blue-900">비밀번호를 입력하세요</h3>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key === 'Enter' && handleLogin()} className="w-full text-center text-7xl tracking-[20px] font-black p-8 border-4 border-slate-100 rounded-[40px] outline-none mb-12 bg-slate-50 focus:border-blue-400 focus:bg-white shadow-inner" autoFocus />
            <div className="flex gap-4">
              <button onClick={()=>setShowModal(null)} className="flex-1 py-6 rounded-[30px] font-black text-slate-500 text-2xl bg-slate-100 hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={handleLogin} className="flex-1 py-6 rounded-[30px] font-black bg-blue-600 text-white text-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-transform">접속하기</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 🖨️ 모달: O2O 롤링페이퍼 인쇄 화면             */}
      {/* ========================================= */}
      {showRollingPaper && (() => {
        const s = allStats.find(x => x.id === showRollingPaper);
        const praises = safeArray(db.approvedPraises).filter(p => p.toId == s.id);
        return (
          <div className="fixed inset-0 bg-white z-[99999] overflow-auto flex flex-col items-center">
             <div className="w-full bg-slate-100 p-5 flex justify-between items-center print:hidden border-b-2 border-slate-200 shadow-sm sticky top-0 z-50">
               <h3 className="font-black text-slate-700 text-xl flex items-center gap-2"><Printer className="w-6 h-6"/> 인쇄 미리보기 모드</h3>
               <div className="flex gap-3">
                 <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-md flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-transform"><Printer className="w-5 h-5"/> 인쇄하기</button>
                 <button onClick={() => setShowRollingPaper(null)} className="bg-white text-slate-600 border-2 border-slate-300 px-8 py-3 rounded-2xl font-black hover:bg-slate-50">닫기</button>
               </div>
             </div>
             <div className="max-w-5xl w-full p-16 print:p-0">
                <div className="text-center mb-16 border-b-4 border-pink-200 pb-10">
                  <Heart className="w-20 h-20 text-pink-400 fill-pink-100 mx-auto mb-6"/>
                  <h1 className="text-5xl font-black text-slate-800 mb-4 tracking-tight">달보드레 온기 롤링페이퍼</h1>
                  <p className="text-3xl font-bold text-slate-500">소중한 우리 반 보물, <span className="text-pink-600 font-black bg-pink-50 px-4 py-1 rounded-2xl border border-pink-100">{s.name}</span>에게</p>
                </div>
                <div className="grid grid-cols-2 gap-8 print:grid-cols-2 print:gap-6">
                  {praises.map((p, idx) => (
                    <div key={p.id} className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 p-8 rounded-[40px] shadow-sm print:border print:border-pink-300 print:shadow-none break-inside-avoid">
                      <p className="text-sm font-black text-pink-600 mb-4 bg-white inline-block px-4 py-1.5 rounded-full border border-pink-100">{SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short}</p>
                      <p className="text-2xl font-bold text-slate-800 leading-relaxed">"{p.text}"</p>
                      <p className="text-right text-sm font-bold text-slate-400 mt-6">- {p.date} -</p>
                    </div>
                  ))}
                  {praises.length === 0 && <div className="col-span-2 text-center py-32 text-slate-300 font-black text-3xl">아직 받은 사연이 없습니다. 친구에게 먼저 온기를 건네볼까요?</div>}
                </div>
             </div>
          </div>
        )
      })()}

      {/* ========================================= */}
      {/* 🗺️ 하단 고정 네비게이션 바                    */}
      {/* ========================================= */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-4 border-amber-100 px-6 py-5 flex justify-around items-center z-[5000] shadow-[0_-15px_50px_rgba(0,0,0,0.08)] pb-8 print:hidden">
        {[
          { id: 'dashboard', icon: <Target className="w-8 h-8"/>, label: db.settings.menuNames[0] || "명성 현황판", color: "text-blue-500" }, 
          { id: 'reflection', icon: <BookOpen className="w-8 h-8"/>, label: db.settings.menuNames[1] || "성찰과 회복", color: "text-emerald-500" }, 
          { id: 'helproom', icon: <Users className="w-8 h-8"/>, label: db.settings.menuNames[2] || "도움실", color: "text-indigo-500" }, 
          { id: 'admin', icon: <Settings className="w-8 h-8"/>, label: db.settings.menuNames[3] || "통합 관리실", color: "text-slate-600" }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => item.id === 'admin' ? setShowModal('password') : setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-2 flex-1 transition-all duration-300 ${activeTab === item.id ? `${item.color} scale-110 -translate-y-4 drop-shadow-lg` : 'text-slate-400 opacity-60 hover:opacity-100 hover:-translate-y-2'}`}
          >
            {item.icon}
            <span className="text-xs font-black">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 전역 CSS 애니메이션 및 스크롤바 스타일 */}
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
        .fade-in { animation-name: fadeIn; }
        .zoom-in-95 { animation-name: zoomIn95; }
        .slide-in-from-top-4 { animation-name: slideInTop; }
        .animate-spin-slow { animation: spin 5s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInTop { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
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
