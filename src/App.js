/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Trophy, ShieldCheck, Heart, Lock, History, Save, X, 
  Plus, Minus, AlertTriangle, Sparkles, Star, Target, Settings, 
  Trash2, ShoppingCart, CheckCircle2, BookOpen, UserCheck, Briefcase, 
  Zap, Crown, Gift, Coins, BarChart3, MessageSquare, Send, Gavel, 
  Leaf, TreeDeciduous, Bird, Flame, Shield
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

// 🔥 학생 명단
const defaultStudents = [
  { id: 1, name: '금채율', role: '학급문고 정리', group: 1, isLeader: true }, { id: 2, name: '김라희', role: '우유 배달', group: 1, isLeader: false },
  { id: 3, name: '김민지', role: '다툼 중재자', group: 1, isLeader: false }, { id: 4, name: '김수은', role: '생활태도 체크', group: 1, isLeader: false },
  { id: 5, name: '김시우', role: '칠판 정리', group: 2, isLeader: true }, { id: 6, name: '박서정', role: '질서 관리', group: 2, isLeader: false },
  { id: 7, name: '이하윤', role: '학급문고 정리', group: 2, isLeader: false }, { id: 8, name: '장세아', role: '문 닫기', group: 2, isLeader: false },
  { id: 9, name: '최예나', role: '우유 배달', group: 3, isLeader: true }, { id: 10, name: '허수정', role: '감찰사', group: 3, isLeader: false },
  { id: 11, name: '황지인', role: '칠판 정리', group: 3, isLeader: false }, { id: 12, name: '김도운', role: '생활 배출물 관리', group: 3, isLeader: false },
  { id: 13, name: '김윤재', role: '과제 확인', group: 4, isLeader: true }, { id: 14, name: '김정현', role: '질서 관리', group: 4, isLeader: false },
  { id: 15, name: '김태영', role: '복사물 관리', group: 4, isLeader: false }, { id: 16, name: '김해준', role: '칠판 정리', group: 4, isLeader: false },
  { id: 17, name: '박동민', role: '과제 확인', group: 5, isLeader: true }, { id: 18, name: '서이환', role: '가습기 관리', group: 5, isLeader: false },
  { id: 19, name: '윤호영', role: '우유 배달', group: 5, isLeader: false }, { id: 20, name: '이서준', role: '과제 확인', group: 5, isLeader: false },
  { id: 21, name: '이승현', role: '신발장 관리', group: 6, isLeader: true }, { id: 22, name: '임유성', role: '질서 관리', group: 6, isLeader: false },
  { id: 23, name: '장세형', role: '다툼 중재자', group: 6, isLeader: false }, { id: 24, name: '조승원', role: '부착물 관리', group: 6, isLeader: false },
  { id: 25, name: '차민서', role: '신발장 관리', group: 6, isLeader: false }, { id: 26, name: '배지훈', role: '문 닫기', group: 6, isLeader: false }
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
  "2단계: 자기 관리 (Self-management)": "칭찬 예시: 짜증 날 수 있는 상황에서도 감정을 잘 조절하고 끝까지 해낸 모습을 칭찬해요!",
  "3단계: 사회적 인식 (Social awareness)": "칭찬 예시: 도움이 필요한 친구의 마음을 먼저 알아채고 공감해 준 모습을 칭찬해요!",
  "4단계: 관계 기술 (Relationship skills)": "칭찬 예시: 친구의 말을 잘 경청하고, 배려하며 협동한 모습을 칭찬해요!",
  "5단계: 책임 있는 의사결정 (Responsible decision-making)": "칭찬 예시: 학급을 위해 솔선수범하여 바른 선택을 하고 실천한 모습을 칭찬해요!"
};

const THEME_DESCRIPTIONS = {
  "1단계: 자기 인식 (Self-awareness)": "나의 감정과 강점을 발견하고 이해하는 한 주를 보내요! 🌱",
  "2단계: 자기 관리 (Self-management)": "감정을 조절하고 목표를 향해 끝까지 노력하는 한 주를 보내요! ⛵",
  "3단계: 사회적 인식 (Social awareness)": "친구의 마음에 공감하고 다름을 존중하는 한 주를 보내요! 🤝",
  "4단계: 관계 기술 (Relationship skills)": "서로 소통하고 배려하며 마법 같은 우정을 쌓는 한 주를 보내요! ✨",
  "5단계: 책임 있는 의사결정 (Responsible decision-making)": "나와 공동체를 위해 책임감 있는 바른 선택을 하는 한 주를 보내요! ⚖️"
};

export default function App() {
  // --- UI & 상태 변수 ---
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [helpSubTab, setHelpSubTab] = useState('inspector');
  const [adminSubTab, setAdminSubTab] = useState('report');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null);
  
  // 폼 관련 상태
  const [showPraiseModal, setShowPraiseModal] = useState(false); 
  const [praiseTarget, setPraiseTarget] = useState(""); 
  const [praiseTag, setPraiseTag] = useState(""); 
  const [praiseText, setPraiseText] = useState("");
  const [refTarget, setRefTarget] = useState(""); 
  const [refTag, setRefTag] = useState(""); 
  const [refText, setRefText] = useState("");
  const [newRole, setNewRole] = useState(""); 
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemType, setNewItemType] = useState("shop");
  const [artisanTarget, setArtisanTarget] = useState("");
  const [artisanItemName, setArtisanItemName] = useState("");
  const [artisanItemPrice, setArtisanItemPrice] = useState("");
  const [selectedReportStudent, setSelectedReportStudent] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGroup, setNewStudentGroup] = useState("1");
  const [newStudentRole, setNewStudentRole] = useState("");
  
  // 펀딩 추가 폼 상태
  const [newFundName, setNewFundName] = useState("");
  const [newFundTarget, setNewFundTarget] = useState("");

  // 수동 점수 입력 상태
  const [manualScoreInput, setManualScoreInput] = useState("");

  // --- 통합 파이어베이스 DB State ---
  const [db, setDb] = useState({
    students: defaultStudents, 
    rolesList: ['학급문고 정리', '우유 배달', '다툼 중재자', '현령', '감찰사'],
    settings: { 
      title: "달보드레 행복 교실 🌸", menuNames: ["행복 현황판", "성찰과 회복", "도움실", "관리실"], 
      targetScore: 5000, forceShopOpen: false, weeklyTheme: "4단계: 관계 기술 (Relationship skills)", 
      helpRoomPw: "1111", isGachaOpen: false, isBlackMarketOpen: false, showCumulativeStats: false,
      pointConfig: { praiseBasic: 10, praiseBonus: 15, penalty: 20 }
    },
    gachaConfig: { mode: 'normal', cost: 30, t1: {name:'😭 꽝!', prob:50, reward:0}, t2: {name:'🪙 페이백!', prob:30, reward:30}, t3: {name:'🍬 소소한 간식', prob:15, reward:50}, t4: {name:'🎰 잭팟!!', prob:5, reward:200} },
    shopItems: [{ id: 'i1', name: '달보드레 연필', price: 30, creator: '선생님' }], blackMarketItems: [{ id: 'b1', name: '보드게임권', price: 200, creator: '선생님' }],
    pendingShopItems: [], roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [],
    funding: [{ id: 1, name: "체육 시간 더 ⚽", target: 1000, current: 0 }, { id: 2, name: "팝콘 파티 🍿", target: 2000, current: 0 }],
    manualRepOffset: 0, shieldPoints: 0, allTime: { exp: {}, penalty: {}, donate: {}, fund: {} }, activeMission: { isActive: false, participants: [] }
  });

  // --- 실시간 DB 동기화 ---
  useEffect(() => {
    const fetchLive = async () => {
      try { 
        const res = await fetch(`${DATABASE_URL}v74Data.json`); 
        const data = await res.json(); 
        if (data) setDb(prev => ({...prev, ...data, settings: {...prev.settings, ...(data.settings||{})}, allTime: {...prev.allTime, ...(data.allTime||{})}, activeMission: data.activeMission || {isActive:false, participants:[]}, pendingShopItems: safeArray(data.pendingShopItems)})); 
      } catch (e) {}
      setIsLoading(false);
    };
    fetchLive(); const interval = setInterval(fetchLive, 3000); return () => clearInterval(interval);
  }, []);

  const sync = async (updates) => {
    const nextDb = { ...db, ...updates }; setDb(nextDb);
    try { await fetch(`${DATABASE_URL}v74Data.json`, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  // --- 연산 로직 ---
  const safeStudents = safeArray(db.students);

  const allStats = useMemo(() => {
    return safeStudents.map(s => {
      const exp = db.roleExp[s.id] || 0; 
      const bonus = db.bonusCoins?.[s.id] || 0;
      // 코인은 (1인1역 숙련도*10) + (온기 보너스 코인) - 사용한 코인
      const coins = Math.max(0, (exp * 10) + bonus - (db.usedCoins[s.id] || 0));
      let mastery = { label: '🌱 인턴', color: 'text-emerald-700', bg: 'bg-emerald-100' };
      if (exp >= 20) mastery = { label: '👑 장인', color: 'text-amber-700', bg: 'bg-amber-100' };
      else if (exp >= 10) mastery = { label: '💎 전문가', color: 'text-blue-700', bg: 'bg-blue-100' };
      return { ...s, exp, coins, mastery, status: db.studentStatus[s.id] || 'normal', atExp: db.allTime?.exp?.[s.id] || 0, atDonate: db.allTime?.donate?.[s.id] || 0, atFund: db.allTime?.fund?.[s.id] || 0, atPen: db.allTime?.penalty?.[s.id] || 0 };
    });
  }, [safeStudents, db.roleExp, db.bonusCoins, db.usedCoins, db.studentStatus, db.allTime]);

  const sortedDashboardStats = useMemo(() => {
    if (db.settings.showCumulativeStats) return [...allStats].sort((a, b) => a.id - b.id);
    return [...allStats].sort((a, b) => { const order = { crisis: 0, pending: 1, normal: 2 }; if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]; return a.id - b.id; });
  }, [allStats, db.settings.showCumulativeStats]);

  const groupedByGroupStats = useMemo(() => [...allStats].sort((a, b) => a.group - b.group || a.id - b.id), [allStats]);
  
  // 평판 점수 및 5단계 진화 계산
  const { classReputation, shieldPoints, evolutionLevel } = useMemo(() => {
    const raw = allStats.reduce((sum, s) => sum + (s.exp * 10) + (db.bonusCoins?.[s.id] || 0) - ((db.penaltyCount[s.id] || 0) * (db.settings.pointConfig?.penalty || 20)), 0) + safeArray(db.donations).reduce((sum, d) => sum + d.amount, 0) + (db.manualRepOffset || 0);
    let r = Math.max(0, raw);
    let s = db.shieldPoints || 0;
    if (raw > db.settings.targetScore) { 
      r = db.settings.targetScore; 
      s = raw - db.settings.targetScore; 
    }
    const level = Math.min(Math.floor(r / 1000), 5); // 0~5단계
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

  // --- 함수 핸들러 ---
  const handleExpAdjust = (id, delta) => { if(delta > 0) playSound('good'); sync({ roleExp: { ...db.roleExp, [id]: Math.max(0, (db.roleExp[id]||0) + delta) }, allTime: { ...db.allTime, exp: { ...db.allTime.exp, [id]: Math.max(0, (db.allTime.exp?.[id]||0) + delta) } } }); };
  const handleGivePenalty = (id) => { if (!isAuthenticated) return setShowModal('password'); if (window.confirm("위기 지정할까요?")) { playSound('bad'); sync({ studentStatus: { ...db.studentStatus, [id]: 'crisis' }, penaltyCount: { ...db.penaltyCount, [id]: (db.penaltyCount[id] || 0) + 1 }, allTime: { ...db.allTime, penalty: { ...db.allTime.penalty, [id]: (db.allTime.penalty?.[id] || 0) + 1 } } }); } };
  const handleDonate = (sId, amount) => { const u = allStats.find(s => s.id == sId); if (!u || u.coins < amount) return alert("코인 부족!"); playSound('buy'); sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, donations: [{ id: Date.now(), name: u.name, amount }, ...safeArray(db.donations)].slice(0, 15), allTime: { ...db.allTime, donate: { ...db.allTime.donate, [sId]: (db.allTime.donate?.[sId] || 0) + amount } } }); alert("기부 완료! ✨"); };
  const handleFund = (fId, sId, amount) => { const u = allStats.find(s => s.id == sId); if (!u || u.coins < amount) return alert("코인 부족!"); playSound('buy'); sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, funding: safeArray(db.funding).map(f => f.id === fId ? { ...f, current: f.current + amount } : f), allTime: { ...db.allTime, fund: { ...db.allTime.fund, [sId]: (db.allTime.fund?.[sId] || 0) + amount } } }); alert("투자 완료!"); };
  const handleGacha = (sId) => { const u = allStats.find(s => s.id == sId); const c = db.gachaConfig; if (!u || u.coins < c.cost) return alert("코인 부족!"); if(!window.confirm(`${c.cost}🪙 소모 가챠?`)) return; const rand = Math.random() * 100; let msg = ""; let rew = 0; let p = 0; let isJ = false; if (rand < (p += c.t1.prob)) { msg = c.t1.name; rew = c.t1.reward; } else if (rand < (p += c.t2.prob)) { msg = c.t2.name; rew = c.t2.reward; } else if (rand < (p += c.t3.prob)) { msg = c.t3.name; rew = c.t3.reward; } else { msg = c.t4.name; rew = c.t4.reward; isJ = true; } sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + c.cost - rew } }); if(isJ) { playSound('jackpot'); alert(`🎉 잭팟!! [${msg}]`); } else { playSound('buy'); alert(`결과: ${msg}`); } };
  
  const startMission = () => { if(window.confirm("긴급 미션 발동?")) sync({ activeMission: { isActive: true, participants: [] } }); };
  const endMission = () => { if(window.confirm("미션 강제 종료?")) sync({ activeMission: { isActive: false, participants: [] } }); };
  const participateMission = (sId) => { 
    const currentP = safeArray(db.activeMission.participants);
    if(currentP.includes(sId)) return; 
    playSound('good'); 
    const nextP = [...currentP, sId]; 
    let nextO = (db.manualRepOffset || 0) + 0.5; 
    let nextM = { isActive: true, participants: nextP }; 
    if (nextP.length >= safeStudents.length) { 
      playSound('jackpot'); 
      alert("🎉 전원 미션 성공!"); 
      nextO += (safeStudents.length * 0.5); 
      nextM.isActive = false; 
    } 
    sync({ manualRepOffset: nextO, activeMission: nextM }); 
  };
  
  const submitArtisanItem = () => { if(!artisanTarget || !artisanItemName || !artisanItemPrice) return alert("입력 오류"); const artisan = allStats.find(s => s.id == artisanTarget); if(!artisan || artisan.exp < 20) return alert("장인만 가능"); sync({ pendingShopItems: [{ id: Date.now(), name: artisanItemName, price: parseInt(artisanItemPrice), creator: artisan.name }, ...safeArray(db.pendingShopItems)] }); setArtisanTarget(""); setArtisanItemName(""); setArtisanItemPrice(""); alert("공방 아이템 결재 올림! 🛠️"); };
  const submitPraise = () => { if (!praiseTarget || !praiseTag || !praiseText) return alert("빈칸 확인!"); sync({ pendingPraises: [{ id: Date.now(), toId: praiseTarget, tag: praiseTag, text: praiseText, date: new Date().toLocaleDateString() }, ...safeArray(db.pendingPraises)] }); setShowPraiseModal(false); setPraiseTarget(""); setPraiseText(""); setPraiseTag(""); alert("온기 배달 완료! 💌"); };
  const submitReflection = () => { if (!refTarget || !refTag || !refText) return alert("빈칸 확인!"); sync({ pendingReflections: [{ id: Date.now(), sId: refTarget, tag: refTag, text: refText, date: new Date().toLocaleDateString() }, ...safeArray(db.pendingReflections)], studentStatus: { ...db.studentStatus, [refTarget]: 'pending' } }); setRefTarget(""); setRefText(""); setRefTag(""); alert("다짐 제출 완료! 📝"); };
  const handleLogin = () => { if (password === "6505") { setIsAuthenticated('teacher'); setActiveTab('admin'); setShowModal(null); setPassword(""); } else if (password === db.settings.helpRoomPw) { setIsAuthenticated('inspector'); setActiveTab('helproom'); setShowModal(null); setPassword(""); } else { alert("비밀번호 오류 ❌"); playSound('bad'); } };
  const handleStudentFieldChange = (id, field, value) => sync({ students: safeStudents.map(st => st.id === id ? {...st, [field]: value} : st) });
  const handleAddStudent = () => { if(!newStudentName) return; const nextId = safeStudents.length > 0 ? Math.max(...safeStudents.map(s=>s.id)) + 1 : 1; sync({ students: [...safeStudents, { id: nextId, name: newStudentName, role: newStudentRole || '향리', group: parseInt(newStudentGroup), isLeader: false }] }); setNewStudentName(""); alert("전입 완료!"); };
  const handleRemoveStudent = (id) => { if(window.confirm("삭제할까요?")) sync({ students: safeStudents.filter(s => s.id !== id) }); };
  const partialReset = (type) => { if(window.confirm(`초기화할까요?`)) { if(type === 'donations') sync({ donations: [] }); if(type === 'status') sync({ studentStatus: {}, penaltyCount: {} }); if(type === 'exp') sync({ roleExp: {} }); alert("초기화 완료!"); } };
  const closeSemester = () => { if(window.prompt("마감하시겠습니까? '마감'을 입력하세요.") === "마감") { sync({ roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], donations: [] }); alert("학기 마감 완료! 🌱"); } };
  const factoryReset = () => { if(window.prompt("공장초기화하시겠습니까? '초기화'를 입력하세요") === "초기화") { sync({ roleExp: {}, bonusCoins: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [], pendingShopItems: [], funding: [{ id: 1, name: "체육 시간 추가", target: 1000, current: 0 }, { id: 2, name: "팝콘 파티", target: 2000, current: 0 }], manualRepOffset: 0, shieldPoints: 0, allTime: { exp: {}, penalty: {}, donate: {}, fund: {} } }); alert("전체 리셋 완료."); } };

  // 진화 애니메이션 렌더링 헬퍼
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

  const getMissionCompleteMsg = (id) => {
    const msgs = ["고마워!", "멋진 시민!", "역시 최고야!", "함께 해줘서 든든해!", "확인 완료!"];
    return msgs[id % msgs.length];
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
              {/* ✨ 5단계 진화 애니메이션 출력 영역 */}
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

      {/* 2. 온기 마키 */}
      <div className="bg-pink-100 text-pink-700 py-3 overflow-hidden shadow-sm border-b border-pink-200 relative z-20">
        <div className="whitespace-nowrap animate-[shimmer_30s_linear_infinite] flex gap-20 text-sm font-black">
          <span className="flex gap-4 items-center"><MessageSquare className="w-5 h-5 text-pink-500"/> 온기 우체통: {safeArray(db.approvedPraises).map(p => `[${SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short||'칭찬'}] ${allStats.find(s=>s.id==p.toId)?.name||'나 자신'}: "${p.text}"`).join(' 🌸 ') || '서로에게 따뜻한 마음을 전해볼까요?'}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* 📄 PAGE 1: 현황판 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            
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

            {/* 🎮 교사 발동 긴급 미션 배너 (UI 대폭 개편) */}
            {db.activeMission.isActive && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden animate-in zoom-in-95 border-4 border-blue-300">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="relative z-10 text-center mb-8">
                  <Zap className="w-16 h-16 text-yellow-300 mx-auto mb-4 animate-bounce" />
                  <h2 className="text-3xl font-black mb-2 text-yellow-100">🚨 긴급 퀘스트 발동! 🚨</h2>
                  <p className="text-lg font-bold mb-6">모두가 미션을 완수하고 아래 버튼을 누르세요!<br/>전원 성공 시 엄청난 보너스가 쏟아집니다!</p>
                  <div className="w-full max-w-2xl mx-auto bg-black/20 h-6 rounded-full overflow-hidden border border-white/30">
                    <div className="h-full bg-yellow-400 transition-all" style={{width:`${(safeArray(db.activeMission.participants).length / safeStudents.length)*100}%`}}></div>
                  </div>
                  <p className="font-black mt-2 text-yellow-200">진행률: {safeArray(db.activeMission.participants).length} / {safeStudents.length} 명 완료</p>
                </div>
                
                {/* 분리된 긴급 미션 참여 버튼 구역 */}
                <div className="relative z-10 max-w-4xl mx-auto bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/20">
                  <h3 className="text-xl font-black mb-4 text-center text-blue-100 border-b border-white/20 pb-4">👇 아직 완료하지 않은 시민들 👇</h3>
                  <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {safeStudents.filter(s => !safeArray(db.activeMission.participants).includes(s.id)).map(s => (
                      <button key={s.id} onClick={() => participateMission(s.id)} className="bg-white/80 hover:bg-yellow-300 text-blue-900 px-4 py-3 rounded-2xl font-black text-sm shadow-md transition-all active:scale-95">{s.name} 완료하기 ✋</button>
                    ))}
                    {safeStudents.filter(s => !safeArray(db.activeMission.participants).includes(s.id)).length === 0 && <p className="text-white font-bold opacity-70">모두 완료했습니다!</p>}
                  </div>

                  <h3 className="text-xl font-black mb-4 text-center text-emerald-200 border-b border-white/20 pb-4">✅ 미션 완수 시민 명단 ✅</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {safeStudents.filter(s => safeArray(db.activeMission.participants).includes(s.id)).map(s => (
                      <div key={s.id} className="bg-emerald-500 text-white px-4 py-3 rounded-2xl font-black text-sm shadow-inner border border-emerald-400 flex items-center gap-2 animate-in zoom-in"><CheckCircle2 className="w-4 h-4"/> {s.name} {getMissionCompleteMsg(s.id)}</div>
                    ))}
                    {safeArray(db.activeMission.participants).length === 0 && <p className="text-white font-bold opacity-70">아직 완료한 시민이 없습니다.</p>}
                  </div>
                </div>
              </div>
            )}

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

            {/* 교사 허용 이벤트 존 */}
            {(db.settings.isGachaOpen || db.settings.isBlackMarketOpen) && (
              <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl border-4 border-yellow-500 relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                <h2 className="text-2xl font-black text-yellow-400 mb-6 relative z-10 flex items-center gap-2"><Gift className="w-6 h-6"/> 특별 이벤트 존 오픈!</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  {db.settings.isGachaOpen && (
                    <div className="bg-black/50 p-6 rounded-3xl border border-yellow-400/50 flex justify-between items-center">
                      <div><h3 className="text-xl font-black text-white">{db.gachaConfig.mode === 'special' ? '✨ 선생님 찬스 가챠' : '🎁 일반 행운 가챠'}</h3><p className="text-xs text-yellow-200 mt-1">1회 {db.gachaConfig.cost} 🪙</p></div>
                      <select className="p-3 rounded-xl bg-yellow-400 text-yellow-900 font-black outline-none text-sm" onChange={(e)=>{if(e.target.value) handleGacha(e.target.value); e.target.value='';}}>
                        <option value="">도전할 사람?</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name}({s.coins}🪙)</option>)}
                      </select>
                    </div>
                  )}
                  {db.settings.isBlackMarketOpen && (
                    <div className="bg-purple-900/50 p-6 rounded-3xl border border-purple-400/50">
                      <h3 className="text-xl font-black text-white mb-4">🌙 달보드레 블랙 마켓</h3>
                      <div className="space-y-3">
                        {safeArray(db.blackMarketItems).map(b => (
                          <div key={b.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                            <span className="text-sm font-bold text-purple-200">{b.name}</span>
                            <div className="flex gap-2">
                              <select id={`bm_${b.id}`} className="bg-purple-800 text-white rounded-lg px-2 text-xs font-bold outline-none"><option value="">누가?</option>{allStats.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                              <button onClick={()=>{ 
                                const sid = document.getElementById(`bm_${b.id}`).value;
                                if(!sid) return alert('선택하세요'); const user = allStats.find(u=>u.id==sid);
                                if(user.coins < b.price) return alert('코인 부족');
                                if(window.confirm(`${user.name} 코인 차감할까요?`)) { sync({usedCoins: {...db.usedCoins, [sid]: (db.usedCoins[sid]||0) + b.price}}); alert('구매 완료! 선생님께 요청하세요.'); playSound('buy'); }
                              }} className="bg-purple-500 text-white px-3 py-1 text-xs font-black rounded-lg hover:bg-purple-400">-{b.price}🪙</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 border-b-2 border-amber-200 pb-4 mt-8">
              <div>
                <h2 className="text-3xl font-black text-amber-900 flex items-center gap-2"><Users className="text-amber-500 w-8 h-8"/> 우리 반 꼬마 시민들</h2>
                {db.settings.showCumulativeStats && <p className="text-blue-500 font-bold text-sm mt-2">📊 교사 모드: 전체 번호순 정렬 및 상세 스탯 공개 중</p>}
              </div>
              <button onClick={() => setShowPraiseModal(true)} className="w-full sm:w-auto bg-pink-400 text-white px-8 py-4 rounded-full font-black shadow-lg hover:bg-pink-500 active:scale-95 transition-all flex items-center justify-center gap-2"><Heart className="w-6 h-6 fill-white"/> 온기 우체통</button>
            </div>
            
            {/* 개인 카드 영역 (코인 및 1인1역 UI 강화) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {sortedDashboardStats.map(s => (
                <div key={s.id} className={`p-5 rounded-[30px] border-4 shadow-sm transition-all relative flex flex-col bg-white hover:shadow-xl ${s.status === 'crisis' ? 'border-red-300 bg-red-50' : (s.status === 'pending' ? 'border-orange-300 bg-orange-50' : 'border-white hover:border-amber-200')}`}>
                  
                  {/* 상단 번호 및 코인 배치 최적화 */}
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-black text-lg shadow-inner">{s.id}</span>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase leading-tight">My Coins</p><p className="font-black text-amber-600 text-xl leading-tight">{s.coins} 🪙</p></div>
                    </div>
                  </div>
                  
                  {/* 중앙 이름 및 1인1역 강조 */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-black text-blue-500 mb-1">{s.group}모둠 · <span className="text-blue-700 text-sm">{s.role}</span></p>
                      <h3 className={`text-2xl font-black flex items-center gap-1 ${s.exp >= 20 ? 'text-amber-600 drop-shadow-sm' : 'text-slate-800'}`}>
                        {s.name} {s.isLeader && <Crown className="w-5 h-5 text-amber-400 fill-amber-400"/>}
                        {s.exp >= 20 && <Sparkles className="w-5 h-5 text-yellow-400 animate-spin-slow"/>}
                      </h3>
                    </div>
                    <div className={`text-[10px] font-black px-2 py-1 rounded-lg border ${s.mastery.bg} ${s.mastery.color} ${s.exp >= 20 ? 'border-amber-300 shadow-sm scale-110' : 'border-transparent'} text-center leading-tight transition-all`}>
                      {s.mastery.label}<br/><span className="opacity-80">({s.exp}회)</span>
                    </div>
                  </div>

                  {db.settings.showCumulativeStats && (
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl mb-3 text-[10px] font-bold text-slate-600 grid grid-cols-2 gap-1 shadow-inner">
                       <span>✅완수: <span className="text-blue-600">{s.atExp}</span></span><span>💎기부: <span className="text-amber-600">{s.atDonate}</span></span>
                       <span>🚀펀딩: <span className="text-pink-600">{s.atFund}</span></span><span className="text-red-400">🚨위기: <span className="text-red-600">{s.atPen}</span></span>
                    </div>
                  )}
                  
                  <div className="mt-auto">
                    {s.status === 'normal' && <button onClick={() => handleGivePenalty(s.id)} className="w-full py-3 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-2xl font-black text-xs flex items-center justify-center gap-1 transition-all"><AlertTriangle className="w-4 h-4"/> 위기 지정</button>}
                    {s.status === 'crisis' && <p className="text-center font-black text-white bg-red-500 py-3 rounded-2xl text-xs animate-pulse shadow-md">🚨 성찰 요망</p>}
                    {s.status === 'pending' && <p className="text-center font-black text-white bg-orange-400 py-3 rounded-2xl text-xs shadow-md">⏳ 실천 검수 대기중</p>}
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
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full blur-3xl"></div>
                <BookOpen className="w-20 h-20 text-emerald-400 mx-auto mb-6 relative z-10" />
                <h2 className="text-4xl font-black mb-4 text-emerald-900 relative z-10">성찰과 회복 센터 🌱</h2>
                <p className="text-emerald-600 font-bold mb-10 text-lg relative z-10">나의 마음을 돌아보고 더 단단하게 성장하는 곳이에요.</p>
                
                <div className="text-left space-y-8 bg-emerald-50/50 p-10 rounded-[40px] border-2 border-emerald-100 shadow-inner relative z-10">
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-3 py-1 rounded-full">1. 누가 성찰하나요?</label>
                    <select value={refTarget} onChange={e=>setRefTarget(e.target.value)} className="w-full p-5 rounded-3xl border-2 border-white font-black outline-none focus:border-emerald-300 bg-white text-lg shadow-sm">
                      <option value="">이름을 선택하세요</option>
                      {allStats.filter(s => s.status === 'crisis').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  {refTarget && (
                    <div className="bg-pink-50 border-2 border-pink-200 p-6 rounded-3xl text-pink-800 animate-in fade-in slide-in-from-top-4">
                      <h4 className="font-black mb-2 flex items-center gap-2"><Heart className="w-5 h-5 fill-pink-400"/> 누구나 실수할 수 있어요.</h4>
                      {randomPraise ? (
                        <p className="text-sm font-bold leading-relaxed bg-white p-4 rounded-2xl shadow-sm">"예전에 친구가 <b>{SEL_OPTIONS.find(opt=>opt.name===randomPraise.tag)?.short}</b> 역량으로 널 칭찬했었어! 👉 <b>{randomPraise.text}</b> 넌 우리 반의 보물이야."</p>
                      ) : (
                        <p className="text-sm font-bold leading-relaxed bg-white p-4 rounded-2xl shadow-sm">"넌 여전히 우리 반의 소중한 보물입니다. 스스로를 다독이고 다시 시작해봐요!"</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-3 py-1 rounded-full">2. 어떤 마음성장(SEL) 역량이 필요할까요?</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SEL_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setRefTag(opt.name)} className={`p-4 rounded-2xl border-2 font-black text-xs text-left transition-all ${refTag === opt.name ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg scale-105' : 'bg-white border-white text-slate-500 hover:border-emerald-200 shadow-sm'}`}>{opt.name}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-3 py-1 rounded-full">3. 마음의 다짐 적기</label>
                    <textarea value={refText} onChange={e=>setRefText(e.target.value)} rows="6" className="w-full p-6 rounded-[30px] border-2 border-white font-black outline-none focus:border-emerald-300 bg-white resize-none text-sm leading-relaxed placeholder:text-slate-300 placeholder:font-bold shadow-sm" placeholder={refTag ? SEL_GUIDES[refTag] : "역량을 선택하면 친절한 글쓰기 가이드가 나타납니다."}></textarea>
                  </div>
                  <button onClick={submitReflection} className="w-full bg-emerald-600 text-white py-6 rounded-[30px] font-black text-xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex justify-center items-center gap-2"><Send className="w-6 h-6"/> 다짐 제출하기</button>
                </div>
             </div>
          </div>
        )}

        {/* 📄 PAGE 3: 도움실 */}
        {activeTab === 'helproom' && (
          <div className="bg-white rounded-[50px] shadow-sm border-4 border-indigo-50 flex flex-col lg:flex-row overflow-hidden min-h-[750px] animate-in slide-in-from-bottom duration-300">
            <aside className="w-full lg:w-72 bg-indigo-50/50 p-10 flex flex-col gap-4 shrink-0 border-r-2 border-white">
              <div className="text-center mb-6"><Users className="w-16 h-16 text-indigo-500 mx-auto mb-4" /><h3 className="text-3xl font-black text-indigo-900">학급 도움실</h3></div>
              <button onClick={() => setHelpSubTab('inspector')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${helpSubTab === 'inspector' ? 'bg-indigo-500 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><Briefcase className="w-6 h-6"/> 감찰사 본부</button>
              <button onClick={() => setHelpSubTab('magistrate')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${helpSubTab === 'magistrate' ? 'bg-indigo-500 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><BookOpen className="w-6 h-6"/> 현령 관리소</button>
              <button onClick={() => setHelpSubTab('shop')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${helpSubTab === 'shop' ? 'bg-amber-400 text-white shadow-xl translate-x-2' : 'bg-white text-amber-500 hover:bg-amber-100'}`}><ShoppingCart className="w-6 h-6"/> 학급 상점</button>
            </aside>

            <section className="flex-1 p-10 overflow-y-auto bg-slate-50/30">
              
              <div className="mb-10 bg-gradient-to-r from-yellow-100 to-amber-100 p-8 rounded-[40px] border-2 border-yellow-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/3 text-center md:text-left">
                  <h4 className="text-2xl font-black text-amber-800 mb-2 flex items-center justify-center md:justify-start gap-2"><Coins className="w-8 h-8 text-yellow-500"/> 명예의 기부처</h4>
                  <p className="text-sm font-bold text-amber-700">나의 코인으로 우리 반의 명성을 높이세요!</p>
                </div>
                <div className="md:w-2/3 flex gap-4 w-full">
                  <select id="donate_who_main" className="flex-1 p-4 rounded-2xl bg-white border-2 border-white font-black outline-none shadow-sm focus:border-yellow-400 text-lg"><option value="">누가 기부할까요?</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name} ({s.coins}🪙)</option>)}</select>
                  <input id="donate_amount_main" type="number" placeholder="포인트" className="w-32 p-4 rounded-2xl bg-white border-2 border-white font-black outline-none shadow-sm focus:border-yellow-400 text-lg text-center"/>
                  <button onClick={() => {
                    const sid = document.getElementById('donate_who_main').value; const amt = parseInt(document.getElementById('donate_amount_main').value);
                    if(!sid || !amt) return alert("정보를 입력하세요."); handleDonate(parseInt(sid), amt);
                  }} className="bg-amber-500 text-white px-8 rounded-2xl font-black text-lg shadow-md hover:bg-amber-600 active:scale-95">기부</button>
                </div>
              </div>

              {helpSubTab === 'inspector' && (
                <div className="space-y-8 animate-in fade-in">
                   <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2 bg-indigo-100 inline-block px-5 py-2 rounded-full"><Briefcase className="text-indigo-600"/> 감찰사 자치 본부</h3>
                   <div className="bg-white p-8 rounded-[40px] border-2 border-indigo-50 shadow-sm mb-8">
                     <h4 className="text-xl font-black text-indigo-800 mb-4">1인 1역 생성 및 삭제소</h4>
                     <div className="flex gap-4 mb-6">
                       <input type="text" placeholder="새로운 멋진 직업 이름" value={newRole} onChange={e=>setNewRole(e.target.value)} className="flex-1 p-4 rounded-2xl bg-indigo-50/50 border-none font-bold outline-none focus:ring-2 ring-indigo-200"/>
                       <button onClick={() => { if(!newRole) return; sync({ rolesList: [...safeArray(db.rolesList), newRole] }); setNewRole(''); }} className="bg-indigo-500 text-white px-10 rounded-2xl font-black shadow-md hover:bg-indigo-600">생성</button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {safeArray(db.rolesList).map(r => (
                         <span key={r} className="bg-indigo-50 text-indigo-800 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">{r} <button onClick={()=>{ if(window.confirm('삭제할까요?')) sync({rolesList: db.rolesList.filter(x=>x!==r)}); }} className="text-indigo-300 hover:text-red-500 bg-white rounded-full p-1"><X className="w-3 h-3"/></button></span>
                       ))}
                     </div>
                   </div>
                   <div className="bg-white border-2 border-indigo-50 rounded-[40px] overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-indigo-50/50 text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50"><tr><th className="p-6">이름</th><th className="p-6">모둠 배치</th><th className="p-6 text-center">모둠장</th><th className="p-6">직업 배정</th></tr></thead>
                        <tbody className="divide-y divide-indigo-50/50">
                          {allStats.map(s => (
                            <tr key={s.id} className="hover:bg-indigo-50/20 transition-colors">
                              <td className="p-6 font-black text-lg text-slate-700">{s.name}</td>
                              <td className="p-6"><select value={s.group} onChange={e=>handleStudentFieldChange(s.id, 'group', parseInt(e.target.value))} className="p-3 rounded-xl bg-white border border-indigo-100 font-bold text-sm outline-none focus:border-indigo-400 shadow-sm">{[1,2,3,4,5,6].map(g=><option key={g} value={g}>{g}모둠</option>)}</select></td>
                              <td className="p-6 text-center"><button onClick={()=>handleStudentFieldChange(s.id, 'isLeader', !s.isLeader)} className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 mx-auto font-black text-xs transition-all ${s.isLeader ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{s.isLeader ? <><Crown className="w-4 h-4 fill-white"/> 모둠장</> : '모둠원'}</button></td>
                              <td className="p-6"><select value={s.role} onChange={e=>handleStudentFieldChange(s.id, 'role', e.target.value)} className="w-full p-3 rounded-xl bg-white border border-indigo-100 font-bold text-sm outline-none focus:border-indigo-400 shadow-sm"><option value="">직업 없음</option>{safeArray(db.rolesList).map(r=><option key={r} value={r}>{r}</option>)}</select></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              )}

              {helpSubTab === 'magistrate' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2 bg-blue-100 inline-block px-5 py-2 rounded-full"><BookOpen className="text-blue-600"/> 현령 향리 관리소</h3>
                    <p className="text-sm font-bold text-blue-500 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">※ 이곳에서 올리는 점수만 '장인' 승급 숙련도에 반영됩니다.</p>
                  </div>
                  {[1,2,3,4,5,6].map(groupNum => {
                    const groupMembers = groupedByGroupStats.filter(s => s.group === groupNum);
                    if(groupMembers.length === 0) return null;
                    return (
                      <div key={groupNum} className="mb-8 bg-white p-8 rounded-[40px] border-2 border-blue-50 shadow-sm">
                        <h4 className="text-xl font-black text-blue-800 mb-6 bg-blue-50 inline-block px-6 py-2 rounded-full border border-blue-100">{groupNum} 모둠 명단</h4>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                          {groupMembers.map(s => (
                            <div key={s.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                              <div><p className="text-xs font-black text-slate-400 mb-1">{s.role}</p><p className="font-black text-xl text-slate-800">{s.name}</p></div>
                              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                                <button onClick={() => handleExpAdjust(s.id, -1)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Minus className="w-5 h-5"/></button>
                                <span className="w-16 text-center font-black text-blue-600 text-2xl">{s.exp}</span>
                                <button onClick={() => handleExpAdjust(s.id, 1)} className="p-3 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-colors"><Plus className="w-5 h-5"/></button>
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
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2 bg-amber-100 inline-block px-5 py-2 rounded-full mb-2"><ShoppingCart className="text-amber-600"/> 달보드레 상점</h3>
                      <p className="text-sm font-bold text-amber-700 ml-2">감찰사가 상점과 펀딩 물품을 선생님께 건의해서 만들 수 있어요! 💡</p>
                    </div>
                    <div className={`px-8 py-4 rounded-full font-black text-base shadow-md ${isShopOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{isShopOpen ? "🔓 상점 영업 중" : "🔒 영업 종료 (목요일 개방)"}</div>
                  </div>

                  <div className="bg-amber-50 p-8 rounded-[40px] border-4 border-amber-200 shadow-sm mb-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl opacity-50"></div>
                    <h4 className="text-2xl font-black text-amber-900 mb-2 relative z-10 flex items-center gap-2"><Gavel className="w-6 h-6"/> 장인의 공방 (특산품 기획소)</h4>
                    <p className="text-sm font-bold text-amber-700 mb-6 relative z-10">숙련도 20회 이상인 '장인'은 자신의 직업과 관련된 아이템을 기획해 올릴 수 있습니다.</p>
                    <div className="flex flex-wrap gap-4 relative z-10">
                      <select value={artisanTarget} onChange={e=>setArtisanTarget(e.target.value)} className="w-48 p-4 rounded-2xl bg-white border border-amber-200 font-black outline-none focus:border-amber-400">
                        <option value="">장인 선택</option>
                        {allStats.filter(s => s.exp >= 20).map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                      <input type="text" placeholder="기발한 아이템 이름" value={artisanItemName} onChange={e=>setArtisanItemName(e.target.value)} className="flex-1 p-4 rounded-2xl bg-white border border-amber-200 font-bold outline-none focus:border-amber-400"/>
                      <input type="number" placeholder="희망 가격" value={artisanItemPrice} onChange={e=>setArtisanItemPrice(e.target.value)} className="w-32 p-4 rounded-2xl bg-white border border-amber-200 font-bold outline-none focus:border-amber-400"/>
                      <button onClick={submitArtisanItem} className="bg-amber-600 text-white px-8 rounded-2xl font-black shadow-md hover:bg-amber-700 active:scale-95">결재 올리기</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {safeArray(db.shopItems).map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[40px] shadow-sm border-2 border-slate-100 flex flex-col justify-between hover:border-amber-200 transition-colors">
                         <div>
                           <div className="flex justify-between items-start mb-6"><span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">{item.creator} 제작</span><p className="text-3xl font-black text-amber-500">{item.price} 🪙</p></div>
                           <h4 className="text-2xl font-black text-slate-800 mb-10">{item.name}</h4>
                         </div>
                         <div className="flex gap-4">
                           <select id={`buyer_${item.id}`} className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none text-base focus:border-amber-400"><option value="">누가 구매하나요?</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.coins}🪙)</option>)}</select>
                           <button onClick={() => {
                             if(!isShopOpen) return alert("오늘은 상점 운영일이 아닙니다!");
                             const sid = document.getElementById(`buyer_${item.id}`).value;
                             if(!sid) return alert("선택하세요."); const user = allStats.find(u => u.id == sid);
                             if(user.coins < item.price) return alert("코인 부족.");
                             if(window.confirm(`${user.name}의 개인 코인을 차감할까요?`)) { sync({ usedCoins: { ...db.usedCoins, [sid]: (db.usedCoins[sid] || 0) + item.price } }); alert("결제 승인 완료!"); playSound('buy'); }
                           }} className="bg-amber-500 text-white px-10 rounded-2xl font-black text-lg shadow-lg hover:bg-amber-600 active:scale-95 transition-all">구매</button>
                         </div>
                      </div>
                    ))}
                    
                    {safeArray(db.funding).map(f => (
                      <div key={f.id} className="bg-gradient-to-br from-blue-400 to-indigo-500 p-8 rounded-[40px] shadow-xl text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                           <h4 className="text-2xl font-black mb-2 flex items-center gap-3"><Target className="w-6 h-6 text-yellow-300"/> {f.name}</h4>
                           <p className="text-sm font-bold text-blue-100 mb-8">십시일반 투자하여 다 함께 즐겨요!</p>
                           <div className="flex justify-between items-end text-lg font-black mb-3"><span>현재: {f.current}p</span><span className="text-blue-200">목표: {f.target}p</span></div>
                           <div className="w-full h-5 bg-black/20 rounded-full mb-10 overflow-hidden border border-white/20 shadow-inner"><div className="h-full bg-yellow-400 transition-all shadow-[0_0_15px_rgba(250,204,21,0.8)]" style={{width:`${(f.current/f.target)*100}%`}}></div></div>
                        </div>
                        <div className="flex gap-3 relative z-10">
                           <select id={`funder_${f.id}`} className="flex-1 p-4 rounded-2xl bg-white/20 border-none text-white font-bold outline-none text-sm backdrop-blur-sm"><option value="" className="text-slate-800">누가 투자할까요?</option>{allStats.map(s => <option key={s.id} value={s.id} className="text-slate-800">{s.name} ({s.coins}🪙)</option>)}</select>
                           <input id={`f_amt_${f.id}`} type="number" placeholder="금액" className="w-24 p-4 rounded-2xl bg-white/20 border-none text-white font-bold outline-none text-sm placeholder:text-blue-200 backdrop-blur-sm"/>
                           <button onClick={() => {
                             const sid = document.getElementById(`funder_${f.id}`).value; const amt = parseInt(document.getElementById(`f_amt_${f.id}`).value);
                             if(!sid || !amt) return alert("입력 오류"); handleFund(f.id, parseInt(sid), amt);
                           }} className="bg-yellow-400 text-yellow-900 px-8 rounded-2xl font-black text-lg shadow-lg hover:bg-yellow-300 active:scale-95 transition-all">투자</button>
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
                <div className="text-center mb-8"><Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" /><h3 className="text-2xl font-black text-white">관리자 센터</h3><p className="text-slate-400 text-xs font-bold mt-2">마스터 권한 모드</p></div>
                <button onClick={() => setAdminSubTab('report')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 transition-all text-base ${adminSubTab === 'report' ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><BarChart3 className="w-5 h-5"/> SEL 리포트</button>
                <button onClick={() => setAdminSubTab('mission')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 transition-all text-base ${adminSubTab === 'mission' ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Zap className="w-5 h-5"/> 결재 및 미션</button>
                <button onClick={() => setAdminSubTab('shopAdmin')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 transition-all text-base ${adminSubTab === 'shopAdmin' ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><ShoppingCart className="w-5 h-5"/> 상점 및 펀딩 통제소</button>
                <button onClick={() => setAdminSubTab('students')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 transition-all text-base ${adminSubTab === 'students' ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Users className="w-5 h-5"/> 명단 관리</button>
                <button onClick={() => setAdminSubTab('settings')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 transition-all text-base ${adminSubTab === 'settings' ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Settings className="w-5 h-5"/> 환경 및 점수 밸런스</button>
                <button onClick={() => setAdminSubTab('reset')} className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-4 transition-all text-base ${adminSubTab === 'reset' ? 'bg-red-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><History className="w-5 h-5"/> 초기화/마감</button>
                <button onClick={() => { setIsAuthenticated(false); setActiveTab('dashboard'); }} className="mt-auto p-4 bg-slate-800 text-slate-400 font-black rounded-2xl hover:bg-slate-700 transition-all text-center">로그아웃</button>
             </aside>

             <section className="flex-1 p-10 overflow-y-auto bg-slate-50/50">
                
                {adminSubTab === 'students' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">👥 학생 명단 관리 (전입/전출)</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                      <div className="flex flex-wrap gap-4 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <input type="text" placeholder="새 학생 이름" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="flex-1 p-4 rounded-xl border border-slate-300 font-bold outline-none"/>
                        <select value={newStudentGroup} onChange={e=>setNewStudentGroup(e.target.value)} className="w-32 p-4 rounded-xl border border-slate-300 font-bold outline-none"><option value="1">1모둠</option><option value="2">2모둠</option><option value="3">3모둠</option><option value="4">4모둠</option><option value="5">5모둠</option><option value="6">6모둠</option></select>
                        <select value={newStudentRole} onChange={e=>setNewStudentRole(e.target.value)} className="w-48 p-4 rounded-xl border border-slate-300 font-bold outline-none"><option value="">역할 없음</option>{safeArray(db.rolesList).map(r=><option key={r} value={r}>{r}</option>)}</select>
                        <button onClick={handleAddStudent} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700">전입생 추가</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safeStudents.map(s => (
                          <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                            <div><span className="text-xs font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{s.id}번 | {s.group}모둠</span><h4 className="font-black text-lg text-slate-800 mt-2">{s.name}</h4><p className="text-slate-400 text-xs font-bold">{s.role}</p></div>
                            <button onClick={() => handleRemoveStudent(s.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-5 h-5"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'report' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6">🌱 학생별 SEL 마음성장 리포트</h3>
                      <button onClick={() => sync({ settings: { ...db.settings, showCumulativeStats: !db.settings.showCumulativeStats } })} className={`px-6 py-3 rounded-full font-black text-sm shadow-md transition-all ${db.settings.showCumulativeStats ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1페이지 누적 스탯(번호순 정렬) 공개: {db.settings.showCumulativeStats ? 'ON' : 'OFF'}</button>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10">
                      <div className="w-full md:w-1/3">
                        <select value={selectedReportStudent} onChange={e=>setSelectedReportStudent(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none mb-6 focus:border-blue-400"><option value="">학생을 선택하세요</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        <p className="text-sm font-bold text-slate-500 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100">온기 우체통을 통해 받은 칭찬 태그를 분석하여, 학생이 어떤 사회정서적 강점을 지니고 있는지 파악합니다.</p>
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
                              <p className="text-sm font-bold text-slate-500 border-t border-slate-200 pt-6">최근 받은 온기 사연</p>
                              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                                {safeArray(db.approvedPraises).filter(p=>p.toId==s.id).slice(0,3).map(p=> (
                                  <li key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 font-bold"><span className="text-xs text-pink-500 bg-pink-50 px-2 py-1 rounded-md mr-2">[{SEL_OPTIONS.find(o=>o.name===p.tag)?.short}]</span>"{p.text}"</li>
                                ))}
                                {safeArray(db.approvedPraises).filter(p=>p.toId==s.id).length === 0 && <li className="text-slate-400 italic">아직 받은 사연이 없습니다.</li>}
                              </ul>
                            </div>
                          );
                        })() : <div className="h-full flex items-center justify-center text-slate-400 font-black">학생을 선택하면 리포트가 생성됩니다.</div>}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'mission' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6">긴급 미션 및 결재함</h3>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                       <div className="bg-white p-10 rounded-[40px] shadow-sm border border-blue-100 flex flex-col items-center text-center relative overflow-hidden">
                          {db.activeMission.isActive && <div className="absolute inset-0 bg-blue-50 animate-pulse -z-10"></div>}
                          <Zap className="w-20 h-20 text-blue-500 mb-6" />
                          <h4 className="text-3xl font-black mb-4 text-slate-800">교사 참여형 긴급 미션</h4>
                          <p className="text-slate-500 font-bold mb-8 text-sm leading-relaxed">미션을 발동하면 대시보드 중앙에 완료 버튼이 생깁니다.<br/>누를 때마다 즉시 0.5점씩 오르며, 전원 성공 시 보너스가 터집니다!</p>
                          <div className="flex gap-4 w-full">
                            {!db.activeMission.isActive ? (
                              <button onClick={startMission} className="flex-1 bg-blue-600 text-white py-6 rounded-[30px] font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">🚀 미션 발동하기</button>
                            ) : (
                              <button onClick={endMission} className="flex-1 bg-red-500 text-white py-6 rounded-[30px] font-black text-xl shadow-xl hover:bg-red-600 active:scale-95 transition-all">🛑 미션 강제 종료 (현재까지 인정)</button>
                            )}
                          </div>
                          {db.activeMission.isActive && <p className="mt-6 font-black text-blue-600 bg-white px-4 py-2 rounded-full border border-blue-200">현재 {safeArray(db.activeMission.participants).length}명 참여 완료!</p>}
                       </div>

                       <div className="bg-white p-10 rounded-[40px] shadow-sm border border-green-100 flex flex-col items-center text-center">
                          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                          <h4 className="text-3xl font-black mb-4 text-slate-800">서류 결재함</h4>
                          <div className="w-full space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {safeArray(db.pendingShopItems).map(item => (
                              <div key={item.id} className="bg-amber-50 p-5 rounded-2xl border border-amber-200 text-left shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-lg text-xs">장인 건의: {item.creator}</span><span className="text-sm font-black text-amber-600">{item.price}🪙</span>
                                </div>
                                <p className="text-lg text-slate-800 font-black mb-4">"{item.name}"</p>
                                <div className="flex gap-2">
                                  <button onClick={() => { const next = db.pendingShopItems.filter(i => i.id !== item.id); sync({ pendingShopItems: next, shopItems: [item, ...safeArray(db.shopItems)] }); alert("상점 등록 완료!"); playSound('good'); }} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-black text-sm hover:bg-amber-600 shadow-md">상점에 출시 허가</button>
                                  <button onClick={() => { const next = db.pendingShopItems.filter(i => i.id !== item.id); sync({ pendingShopItems: next }); alert("반려되었습니다."); }} className="px-4 bg-white text-slate-400 font-black rounded-xl border border-slate-200">반려</button>
                                </div>
                              </div>
                            ))}
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
                            {safeArray(db.pendingPraises).map(p => (
                              <div key={p.id} className="bg-pink-50 p-5 rounded-2xl border border-pink-200 text-left shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-black text-pink-800 bg-pink-100 px-3 py-1 rounded-lg text-xs">To. {allStats.find(s=>s.id==p.toId)?.name||'나 자신'} (온기)</span><span className="text-[10px] font-bold text-pink-400">{SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short}</span>
                                </div>
                                <p className="text-sm text-slate-700 font-bold mb-4">"{p.text}"</p>
                                <button onClick={() => { 
                                  const next = db.pendingPraises.filter(pr => pr.id !== p.id); 
                                  const app = [p, ...safeArray(db.approvedPraises)].slice(0,10); 
                                  
                                  // 테마 일치 여부 검사하여 보너스 코인 지급
                                  const isThemeMatch = p.tag === db.settings.weeklyTheme;
                                  const earnedCoins = isThemeMatch ? (db.settings.pointConfig?.praiseBonus || 15) : (db.settings.pointConfig?.praiseBasic || 10);

                                  if(p.toId !== 'me') { 
                                    sync({ 
                                      pendingPraises: next, approvedPraises: app, 
                                      // 🔥 1인1역 exp가 아니라 보너스 코인(bonusCoins)을 직접 올려줌!
                                      bonusCoins: { ...db.bonusCoins, [p.toId]: (db.bonusCoins?.[p.toId] || 0) + earnedCoins },
                                      allTime: { ...db.allTime, exp: { ...db.allTime.exp, [p.toId]: (db.allTime.exp?.[p.toId]||0) + 1 } } 
                                    }); 
                                  } else { 
                                    sync({ pendingPraises: next, approvedPraises: app }); 
                                  } 
                                  alert(`온기 승인 완료! (+${earnedCoins}🪙) ${isThemeMatch ? '🎉 테마 일치 보너스 적용!' : ''}`); 
                                  playSound('good'); 
                                }} className="w-full bg-pink-500 text-white py-3 rounded-xl font-black text-sm hover:bg-pink-600 shadow-md">온기 사연 승인</button>
                              </div>
                            ))}
                            {safeArray(db.pendingShopItems).length === 0 && safeArray(db.pendingReflections).length === 0 && safeArray(db.pendingPraises).length === 0 && <p className="text-slate-400 font-black py-10 border-2 border-dashed rounded-3xl">결재 대기열이 비어있습니다.</p>}
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'shopAdmin' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">상점 및 펀딩 통제소</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                      <div className="flex flex-wrap gap-4">
                         <button onClick={() => sync({ settings: { ...db.settings, forceShopOpen: !db.settings.forceShopOpen } })} className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all ${db.settings.forceShopOpen ? 'bg-amber-500 text-white shadow-xl' : 'bg-slate-100 text-slate-500'}`}>정규 상점 개방: {db.settings.forceShopOpen ? 'ON' : 'OFF (목요일만)'}</button>
                         <button onClick={() => sync({ settings: { ...db.settings, isGachaOpen: !db.settings.isGachaOpen } })} className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all ${db.settings.isGachaOpen ? 'bg-yellow-400 text-yellow-900 shadow-xl' : 'bg-slate-100 text-slate-500'}`}>행운의 가챠: {db.settings.isGachaOpen ? 'ON' : 'OFF'}</button>
                         <button onClick={() => sync({ settings: { ...db.settings, isBlackMarketOpen: !db.settings.isBlackMarketOpen } })} className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all ${db.settings.isBlackMarketOpen ? 'bg-purple-900 text-white shadow-xl' : 'bg-slate-100 text-slate-500'}`}>블랙 마켓 오픈: {db.settings.isBlackMarketOpen ? 'ON' : 'OFF'}</button>
                      </div>

                      <div className="pt-8 border-t border-slate-200">
                        <h4 className="font-black text-lg text-slate-700 mb-4">상점 물품 관리 (정규 / 블랙마켓)</h4>
                        <div className="flex gap-4 mb-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                          <select value={newItemType} onChange={e=>setNewItemType(e.target.value)} className="p-4 rounded-xl border border-slate-300 font-bold outline-none bg-white"><option value="shop">정규 상점</option><option value="black">블랙 마켓</option></select>
                          <input type="text" placeholder="새로운 물품 이름" value={newItemName} onChange={e=>setNewItemName(e.target.value)} className="flex-1 p-4 rounded-xl border border-slate-300 font-bold outline-none"/>
                          <input type="number" placeholder="가격" value={newItemPrice} onChange={e=>setNewItemPrice(e.target.value)} className="w-32 p-4 rounded-xl border border-slate-300 font-bold outline-none"/>
                          <button onClick={() => {
                            if(!newItemName || !newItemPrice) return alert("입력 오류");
                            if(newItemType === 'shop') { sync({ shopItems: [...safeArray(db.shopItems), { id: Date.now(), name: newItemName, price: parseInt(newItemPrice), creator: '선생님' }] }); } else { sync({ blackMarketItems: [...safeArray(db.blackMarketItems), { id: Date.now(), name: newItemName, price: parseInt(newItemPrice), creator: '선생님' }] }); }
                            setNewItemName(""); setNewItemPrice("");
                          }} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700">추가</button>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h5 className="text-sm font-bold text-amber-600 mb-2">정규 상점 물품</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {safeArray(db.shopItems).map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex justify-between items-center shadow-sm">
                                  <div><span className="text-[10px] text-slate-400 font-black bg-slate-100 px-2 py-1 rounded-md">{item.creator}</span><h4 className="font-black text-slate-800 mt-2">{item.name}</h4><p className="text-amber-500 font-black text-sm">{item.price} 🪙</p></div>
                                  <button onClick={() => { if(window.confirm("삭제할까요?")) sync({ shopItems: safeArray(db.shopItems).filter(i => i.id !== item.id) }); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-purple-600 mb-2">블랙 마켓 물품</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {safeArray(db.blackMarketItems).map(item => (
                                <div key={item.id} className="bg-purple-50 p-4 rounded-2xl border border-purple-200 flex justify-between items-center shadow-sm">
                                  <div><h4 className="font-black text-purple-900">{item.name}</h4><p className="text-purple-600 font-black text-sm">{item.price} 🪙</p></div>
                                  <button onClick={() => { if(window.confirm("삭제할까요?")) sync({ blackMarketItems: safeArray(db.blackMarketItems).filter(i => i.id !== item.id) }); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 🚀 크라우드 펀딩 관리 섹션 추가 */}
                      <div className="pt-8 border-t border-slate-200 bg-blue-50 p-8 rounded-3xl mt-8">
                        <h4 className="font-black text-lg text-blue-800 mb-4 flex items-center gap-2"><Target className="w-5 h-5"/> 크라우드 펀딩 항목 관리</h4>
                        <div className="flex gap-4 mb-6">
                          <input type="text" placeholder="새로운 펀딩 목표 (예: 피자 파티)" value={newFundName} onChange={e=>setNewFundName(e.target.value)} className="flex-1 p-4 rounded-xl border border-blue-200 font-bold outline-none focus:border-blue-400"/>
                          <input type="number" placeholder="목표 점수" value={newFundTarget} onChange={e=>setNewFundTarget(e.target.value)} className="w-32 p-4 rounded-xl border border-blue-200 font-bold outline-none focus:border-blue-400"/>
                          <button onClick={() => {
                            if(!newFundName || !newFundTarget) return alert("입력 오류");
                            sync({ funding: [...safeArray(db.funding), { id: Date.now(), name: newFundName, target: parseInt(newFundTarget), current: 0 }] });
                            setNewFundName(""); setNewFundTarget("");
                          }} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700">생성</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {safeArray(db.funding).map(f => (
                            <div key={f.id} className="bg-white p-4 rounded-2xl border border-blue-200 flex justify-between items-center shadow-sm">
                              <div><h4 className="font-black text-blue-900">{f.name}</h4><p className="text-blue-500 font-bold text-xs mt-1">현재: {f.current} / 목표: {f.target}p</p></div>
                              <button onClick={() => { if(window.confirm("이 펀딩을 삭제할까요?")) sync({ funding: safeArray(db.funding).filter(x => x.id !== f.id) }); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-200 bg-yellow-50 p-8 rounded-3xl mt-8">
                        <h4 className="font-black text-lg text-yellow-800 mb-6 flex justify-between items-center">
                          가챠 확률 및 문구 세팅 
                          <button onClick={()=>sync({ gachaConfig: { ...db.gachaConfig, mode: db.gachaConfig.mode === 'special' ? 'normal' : 'special' } })} className={`px-4 py-2 rounded-xl text-sm ${db.gachaConfig.mode === 'special' ? 'bg-purple-600 text-white shadow-md' : 'bg-yellow-400 text-yellow-900 shadow-md'}`}>
                            {db.gachaConfig.mode === 'special' ? '✨ 선생님 찬스 모드' : '🎁 일반 모드'} 변경
                          </button>
                        </h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           {['t1','t2','t3','t4'].map((t, i) => (
                             <div key={t} className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm space-y-2">
                               <p className="font-black text-slate-400 text-xs">{i+1}등 당첨</p>
                               <input type="text" value={db.gachaConfig[t].name} onChange={e=>sync({ gachaConfig: { ...db.gachaConfig, [t]: { ...db.gachaConfig[t], name: e.target.value } } })} className="w-full text-xs font-bold border-b outline-none pb-1 focus:border-yellow-400"/>
                               <div className="flex gap-2">
                                 <input type="number" value={db.gachaConfig[t].prob} onChange={e=>sync({ gachaConfig: { ...db.gachaConfig, [t]: { ...db.gachaConfig[t], prob: parseInt(e.target.value) } } })} className="w-1/2 text-xs font-bold border-b outline-none pb-1 placeholder:text-slate-300 focus:border-yellow-400" title="확률(%)"/>
                                 <input type="number" value={db.gachaConfig[t].reward} onChange={e=>sync({ gachaConfig: { ...db.gachaConfig, [t]: { ...db.gachaConfig[t], reward: parseInt(e.target.value) } } })} className="w-1/2 text-xs font-bold border-b outline-none pb-1 text-amber-500 focus:border-yellow-400" title="보상(코인)"/>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'settings' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6">환경 및 점수 밸런스 통제소</h3>
                      {/* 🛠️ 학급 평판 점수 수동 직접 입력 기능 */}
                      <div className="bg-slate-100 p-3 rounded-2xl flex items-center gap-3 border border-slate-200 shadow-inner">
                        <span className="text-sm font-black text-slate-500">명성 점수 강제 조정:</span>
                        <input type="number" value={manualScoreInput} onChange={e=>setManualScoreInput(e.target.value)} placeholder="+50 또는 -20" className="w-32 p-2 rounded-xl border border-white font-black outline-none text-center focus:ring-2 ring-blue-300"/>
                        <button onClick={() => {
                          const val = parseInt(manualScoreInput);
                          if(isNaN(val)) return alert("숫자를 입력하세요.");
                          if(window.confirm(`평판 점수에 ${val}점을 더할까요?`)) { sync({ manualRepOffset: (db.manualRepOffset||0) + val }); setManualScoreInput(""); }
                        }} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-blue-700 shadow-md">적용</button>
                      </div>
                    </div>

                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                       
                       {/* ⚖️ 만능 점수 밸런스 설정 구역 */}
                       <div className="pt-6 border-t border-slate-100 bg-indigo-50 p-8 rounded-3xl">
                          <h4 className="font-black text-lg text-indigo-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> 만능 점수 밸런스 설정</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                              <label className="block text-xs font-black text-indigo-600 mb-2" title="학급의 최종 목표 점수입니다. 5000점 초과 시 보호막으로 쌓입니다.">최고 목표 명성 점수</label>
                              <input type="number" value={db.settings.targetScore} onChange={e=>sync({settings: {...db.settings, targetScore: parseInt(e.target.value)}})} className="w-full p-3 rounded-xl border-none font-black outline-none shadow-sm"/>
                            </div>
                            <div>
                              <label className="block text-xs font-black text-indigo-600 mb-2">온기 우체통 기본 보상(🪙)</label>
                              <input type="number" value={db.settings.pointConfig?.praiseBasic || 10} onChange={e=>sync({settings: {...db.settings, pointConfig: {...db.settings.pointConfig, praiseBasic: parseInt(e.target.value)}}})} className="w-full p-3 rounded-xl border-none font-black outline-none shadow-sm"/>
                            </div>
                            <div>
                              <label className="block text-xs font-black text-indigo-600 mb-2">테마 일치 온기 보상(🪙)</label>
                              <input type="number" value={db.settings.pointConfig?.praiseBonus || 15} onChange={e=>sync({settings: {...db.settings, pointConfig: {...db.settings.pointConfig, praiseBonus: parseInt(e.target.value)}}})} className="w-full p-3 rounded-xl border-none font-black outline-none shadow-sm text-pink-500"/>
                            </div>
                            <div>
                              <label className="block text-xs font-black text-red-500 mb-2">위기 지정 시 차감 점수</label>
                              <input type="number" value={db.settings.pointConfig?.penalty || 20} onChange={e=>sync({settings: {...db.settings, pointConfig: {...db.settings.pointConfig, penalty: parseInt(e.target.value)}}})} className="w-full p-3 rounded-xl border-none font-black outline-none shadow-sm text-red-600"/>
                            </div>
                          </div>
                       </div>

                       <div className="pt-6 border-t border-slate-100">
                          <label className="block text-sm font-black text-slate-500 mb-4">하단 메뉴 이름 수정 (4개 순서대로)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {db.settings.menuNames.map((n, i) => (
                              <input key={i} type="text" value={n} onChange={e => { 
                                const next = [...db.settings.menuNames]; next[i] = e.target.value; 
                                sync({settings: {...db.settings, menuNames: next}}); 
                              }} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-black text-center outline-none text-sm focus:border-blue-400"/>
                            ))}
                          </div>
                       </div>
                       <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-8 items-end">
                          <div>
                            <label className="block text-sm font-black text-slate-500 mb-4">도움실(감찰사) 접속 비밀번호</label>
                            <input type="text" value={db.settings.helpRoomPw} onChange={e=>sync({settings: {...db.settings, helpRoomPw: e.target.value}})} className="w-48 p-4 rounded-xl bg-slate-50 border border-slate-200 font-black text-center outline-none text-lg focus:border-blue-400" placeholder="기본: 1111"/>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'reset' && (
                  <div className="animate-in fade-in space-y-8">
                     <h3 className="text-3xl font-black text-slate-800 border-l-8 border-red-500 pl-6 mb-8">데이터 초기화 및 1학기 마감</h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                       <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                         <Coins className="w-10 h-10 text-yellow-500 mx-auto mb-4"/>
                         <h4 className="font-black text-lg mb-2">기부 내역 초기화</h4>
                         <p className="text-xs text-slate-500 font-bold mb-6">명예로운 기부 전광판 내역만 삭제합니다. (명성 수치는 유지됨)</p>
                         <button onClick={() => partialReset('donations')} className="bg-slate-100 text-slate-600 w-full py-3 rounded-xl font-black hover:bg-yellow-100 hover:text-yellow-700 transition-colors">실행</button>
                       </div>
                       <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                         <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4"/>
                         <h4 className="font-black text-lg mb-2">위기 상태 초기화</h4>
                         <p className="text-xs text-slate-500 font-bold mb-6">현재 🚨위기 및 대기 상태인 학생들을 모두 일반 상태로 복구합니다.</p>
                         <button onClick={() => partialReset('status')} className="bg-slate-100 text-slate-600 w-full py-3 rounded-xl font-black hover:bg-red-100 hover:text-red-700 transition-colors">실행</button>
                       </div>
                       <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                         <Briefcase className="w-10 h-10 text-indigo-500 mx-auto mb-4"/>
                         <h4 className="font-black text-lg mb-2">숙련도 초기화</h4>
                         <p className="text-xs text-slate-500 font-bold mb-6">모든 학생의 1인 1역 숙련도(횟수)를 0으로 리셋합니다.</p>
                         <button onClick={() => partialReset('exp')} className="bg-slate-100 text-slate-600 w-full py-3 rounded-xl font-black hover:bg-indigo-100 hover:text-indigo-700 transition-colors">실행</button>
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-blue-50 border-4 border-blue-200 p-10 rounded-[40px] text-center shadow-lg">
                          <History className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                          <h3 className="text-3xl font-black mb-4 text-blue-800">1학기 최종 마감</h3>
                          <p className="text-blue-600 font-bold mb-8 text-sm">학생들의 단기 코인과 숙련도는 0이 되지만,<br/><b>1년 누적 장기 데이터는 그대로 보존</b>되어 2학기로 이어집니다.</p>
                          <button onClick={closeSemester} className="bg-blue-600 text-white px-10 py-5 rounded-[30px] font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">학기 마감 실행</button>
                       </div>

                       <div className="bg-red-50 border-4 border-red-200 p-12 rounded-[50px] text-center shadow-lg">
                          <Trash2 className="w-20 h-20 text-red-500 mx-auto mb-6" />
                          <h3 className="text-4xl font-black mb-4 text-red-800">시스템 공장 초기화</h3>
                          <p className="text-red-600 font-bold mb-10 text-lg">초기화 시 <span className="underline">학생 명단을 제외한</span> 모든 데이터가 '0'이 됩니다.<br/>학기 초나 테스트 종료 후 본격적으로 시작할 때 한 번만 사용하세요.</p>
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
                {safeStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
            <h3 className="text-3xl font-black text-center mb-4 text-blue-900">관리자 인증</h3>
            <p className="text-center text-slate-400 font-bold mb-10 text-sm">마스터 권한(6505) 또는 감찰사 권한이 필요합니다.</p>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key === 'Enter' && handleLogin()} className="w-full text-center text-6xl tracking-[15px] font-black p-8 border-4 border-slate-100 rounded-[40px] outline-none mb-12 bg-slate-50 focus:border-blue-400 focus:bg-white shadow-inner" autoFocus />
            <div className="flex gap-4">
              <button onClick={()=>setShowModal(null)} className="flex-1 py-6 rounded-[30px] font-black text-slate-500 text-xl bg-slate-100 hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={handleLogin} className="flex-1 py-6 rounded-[30px] font-black bg-blue-600 text-white text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">접속하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-4 border-amber-100 px-4 py-4 flex justify-around items-center z-[5000] shadow-[0_-15px_50px_rgba(0,0,0,0.06)] pb-8">
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
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.3); opacity: 1; } }
        .animate-breathe { animation: breathe 3s infinite ease-in-out; }
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
      `}</style>
    </div>
  );
}
