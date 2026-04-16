/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Trophy, ShieldCheck, Heart, Lock, History, Save, X, 
  Plus, Minus, AlertTriangle, Sparkles, Star, Target, Settings, 
  Trash2, ShoppingCart, CheckCircle2, BookOpen, UserCheck, Briefcase, 
  Zap, Crown, Gift, Coins, BarChart3, Volume2
} from 'lucide-react';

// ==========================================
// 🚨 파이어베이스 주소 (선생님의 주소)
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/"; 
// ==========================================

const safeArray = (val) => (Array.isArray(val) ? val.filter(Boolean) : (typeof val === 'object' && val ? Object.values(val).filter(Boolean) : []));

// 🎵 효과음 엔진
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    
    if (type === 'good') { 
      osc.frequency.setValueAtTime(600, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); 
      osc.type = 'sine'; osc.start(); 
      gain.gain.setValueAtTime(0.1, ctx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3); 
      osc.stop(ctx.currentTime + 0.3); 
    } else if (type === 'bad') { 
      osc.frequency.setValueAtTime(300, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); 
      osc.type = 'sawtooth'; osc.start(); 
      gain.gain.setValueAtTime(0.1, ctx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3); 
      osc.stop(ctx.currentTime + 0.3); 
    } else if (type === 'gacha' || type === 'buy') { 
      osc.frequency.setValueAtTime(400, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3); 
      osc.type = 'square'; osc.start(); 
      gain.gain.setValueAtTime(0.1, ctx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3); 
      osc.stop(ctx.currentTime + 0.3); 
    } else if (type === 'jackpot') { 
      osc.type = 'triangle'; 
      osc.frequency.setValueAtTime(440, ctx.currentTime); 
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); 
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); 
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3); 
      osc.start(); 
      gain.gain.setValueAtTime(0.3, ctx.currentTime); 
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8); 
      osc.stop(ctx.currentTime + 0.8); 
    }
  } catch (e) {
    // Audio Context 에러 무시
  }
};

const defaultStudents = Array.from({ length: 26 }, (_, i) => ({ 
  id: i + 1, name: `학생${i + 1}`, role: '향리', group: Math.floor(i / 4) + 1, isLeader: false 
}));

const SEL_OPTIONS = [
  { id: 'sel1', short: '자기 인식', name: '1단계: 자기 인식 (Self-awareness)' },
  { id: 'sel2', short: '자기 관리', name: '2단계: 자기 관리 (Self-management)' },
  { id: 'sel3', short: '사회적 인식', name: '3단계: 사회적 인식 (Social awareness)' },
  { id: 'sel4', short: '관계 기술', name: '4단계: 관계 기술 (Relationship skills)' },
  { id: 'sel5', short: '책임있는 결정', name: '5단계: 책임 있는 의사결정 (Responsible decision-making)' }
];

const SEL_GUIDES = { 
  "1단계: 자기 인식 (Self-awareness)": "상황: 내 기분이 어땠는지 적어보세요.\n다짐: 내 안의 감정과 빛나는 강점을 어떻게 발견할지 다짐해보세요.", 
  "2단계: 자기 관리 (Self-management)": "상황: 화가 나거나 포기하고 싶었을 때를 적어보세요.\n다짐: 감정의 파도를 다스리고 목표를 향해 어떻게 나아갈지 다짐해보세요.", 
  "3단계: 사회적 인식 (Social awareness)": "상황: 친구와 생각이 다르거나 오해가 생겼을 때를 적어보세요.\n공감: 타인의 마음을 읽고 다름을 어떻게 인정할지 적어보세요.", 
  "4단계: 관계 기술 (Relationship skills)": "상황: 대화나 모둠 활동 중 배려가 필요했던 순간을 적어보세요.\n행동: 함께할 때 더 커지는 마법 같은 우정을 위해 어떻게 행동할지 적어보세요.", 
  "5단계: 책임 있는 의사결정 (Responsible decision-making)": "상황: 우리 반의 규칙이나 분위기를 위한 선택의 순간을 적어보세요.\n다짐: 더 나은 세상을 만드는 나의 선택을 어떻게 실천할지 적어보세요." 
};

const App = () => {
  // --- 상태 관리 ---
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [helpSubTab, setHelpSubTab] = useState('inspector');
  const [adminSubTab, setAdminSubTab] = useState('report');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null);
  
  // 🔥 폼 관련 변수 완벽 분리 선언
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
  const [selectedReportStudent, setSelectedReportStudent] = useState("");

  // --- 통합 DB ---
  const [db, setDb] = useState({
    students: defaultStudents, 
    rolesList: ['학급문고 정리', '우유 배달', '다툼 중재자', '현령', '감찰사'],
    settings: { 
      title: "달보드레 마음성장 대시보드", 
      menuNames: ["명성 현황판", "성찰과 회복", "도움실", "통합 관리실"], 
      targetScore: 3000, forceShopOpen: false, 
      weeklyTheme: "4단계: 관계 기술 (Relationship skills)", 
      helpRoomPw: "1111", isGachaOpen: false, isBlackMarketOpen: false, showCumulativeStats: false 
    },
    gachaConfig: { 
      mode: 'normal', cost: 30, 
      t1: {name:'😭 꽝!', prob:50, reward:0}, t2: {name:'🪙 페이백!', prob:30, reward:30}, 
      t3: {name:'🍬 소소한 간식', prob:15, reward:50}, t4: {name:'🎰 잭팟!!', prob:5, reward:200} 
    },
    shopItems: [{ id: 'i1', name: '달보드레 연필', price: 30, creator: '선생님' }], 
    blackMarketItems: [{ id: 'b1', name: '선생님과 보드게임권', price: 200, creator: '선생님' }],
    roleExp: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {},
    pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [],
    funding: [{ id: 1, name: "체육 한 시간 더", target: 1000, current: 0 }, { id: 2, name: "금요일 팝콘 파티", target: 2000, current: 0 }],
    manualRepOffset: 0, shieldPoints: 100,
    allTime: { exp: {}, penalty: {}, donate: {}, fund: {} } 
  });

  // --- 파이어베이스 연동 ---
  useEffect(() => {
    const fetchLive = async () => {
      try { 
        const res = await fetch(`${DATABASE_URL}v64Data.json`); 
        const data = await res.json(); 
        if (data) {
          setDb(prev => ({
            ...prev, ...data,
            settings: { ...prev.settings, ...(data.settings || {}) },
            allTime: { ...prev.allTime, ...(data.allTime || {}) }
          })); 
        }
      } catch (e) { console.error(e); }
      setIsLoading(false);
    };
    fetchLive(); 
    const interval = setInterval(fetchLive, 3000); 
    return () => clearInterval(interval);
  }, []);

  const sync = async (updates) => {
    const nextDb = { ...db, ...updates }; 
    setDb(nextDb);
    try { await fetch(`${DATABASE_URL}v64Data.json`, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  // --- 연산 로직 ---
  const safeStudents = safeArray(db.students);

  const allStats = useMemo(() => {
    return safeStudents.map(s => {
      const exp = db.roleExp[s.id] || 0;
      const coins = Math.max(0, exp * 10 - (db.usedCoins[s.id] || 0));
      
      let mastery = { label: '🌱 인턴', color: 'text-emerald-600', bg: 'bg-emerald-50' };
      if (exp >= 20) mastery = { label: '👑 장인', color: 'text-amber-600', bg: 'bg-amber-50' };
      else if (exp >= 10) mastery = { label: '💎 전문가', color: 'text-blue-600', bg: 'bg-blue-50' };
      
      const atExp = db.allTime?.exp?.[s.id] || 0; 
      const atDonate = db.allTime?.donate?.[s.id] || 0;
      const atFund = db.allTime?.fund?.[s.id] || 0; 
      const atPen = db.allTime?.penalty?.[s.id] || 0;

      return { 
        ...s, exp, coins, mastery, 
        status: db.studentStatus[s.id] || 'normal', 
        atExp, atDonate, atFund, atPen 
      };
    });
  }, [safeStudents, db.roleExp, db.usedCoins, db.studentStatus, db.allTime]);

  const sortedDashboardStats = useMemo(() => {
    return [...allStats].sort((a, b) => { 
      const order = { crisis: 0, pending: 1, normal: 2 }; 
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]; 
      return a.id - b.id; 
    });
  }, [allStats]);

  const groupedByGroupStats = useMemo(() => {
    return [...allStats].sort((a, b) => a.group - b.group || a.id - b.id);
  }, [allStats]);
  
  const { classReputation, shieldPoints } = useMemo(() => {
    const rawReputation = allStats.reduce((sum, s) => sum + s.exp * 10 - (db.penaltyCount[s.id] || 0) * 20, 0) + safeArray(db.donations).reduce((sum, d) => sum + d.amount, 0) + (db.manualRepOffset || 0);
    
    let rep = rawReputation; let shield = db.shieldPoints || 0;
    if (rawReputation > db.settings.targetScore) { 
      rep = db.settings.targetScore; shield = rawReputation - db.settings.targetScore; 
    } else { rep = Math.max(0, rawReputation); }
    
    return { classReputation: rep, shieldPoints: shield };
  }, [allStats, db.penaltyCount, db.donations, db.settings.targetScore, db.manualRepOffset, db.shieldPoints]);

  const isShopOpen = useMemo(() => db.settings.forceShopOpen || new Date().getDay() === 4, [db.settings.forceShopOpen]);

  // --- 핸들러 함수 ---
  const handleExpAdjust = (id, delta) => {
    if(delta > 0) playSound('good');
    sync({ 
      roleExp: { ...db.roleExp, [id]: Math.max(0, (db.roleExp[id]||0) + delta) },
      allTime: { ...db.allTime, exp: { ...db.allTime.exp, [id]: Math.max(0, (db.allTime.exp?.[id]||0) + delta) } }
    });
  };

  const handleGivePenalty = (id) => {
    if (!isAuthenticated) return setShowModal('password');
    if (window.confirm("위기 상태(성찰 요망)로 지정하시겠습니까?")) {
      playSound('bad');
      sync({ 
        studentStatus: { ...db.studentStatus, [id]: 'crisis' }, 
        penaltyCount: { ...db.penaltyCount, [id]: (db.penaltyCount[id] || 0) + 1 },
        allTime: { ...db.allTime, penalty: { ...db.allTime.penalty, [id]: (db.allTime.penalty?.[id] || 0) + 1 } }
      });
    }
  };

  const handleDonate = (sId, amount) => {
    const user = allStats.find(s => s.id == sId);
    if (!user || user.coins < amount) return alert("코인이 부족합니다.");
    playSound('buy');
    sync({ 
      usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, 
      donations: [{ id: Date.now(), name: user.name, amount }, ...safeArray(db.donations)].slice(0, 15),
      allTime: { ...db.allTime, donate: { ...db.allTime.donate, [sId]: (db.allTime.donate?.[sId] || 0) + amount } }
    });
    alert("기부 완료! 명성이 올랐습니다.");
  };

  const handleFund = (fId, sId, amount) => {
    const user = allStats.find(s => s.id == sId);
    if (!user || user.coins < amount) return alert("코인이 부족합니다.");
    playSound('buy');
    sync({ 
      usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, 
      funding: safeArray(db.funding).map(f => f.id === fId ? { ...f, current: f.current + amount } : f),
      allTime: { ...db.allTime, fund: { ...db.allTime.fund, [sId]: (db.allTime.fund?.[sId] || 0) + amount } }
    });
    alert("투자 완료!");
  };

  const handleGacha = (sId) => {
    const user = allStats.find(s => s.id == sId); const conf = db.gachaConfig;
    if (!user || user.coins < conf.cost) return alert("코인이 부족합니다.");
    if(!window.confirm(`${conf.cost} 🪙를 소모하여 가챠를 돌릴까요?`)) return;

    const rand = Math.random() * 100; let msg = ""; let reward = 0; let prob = 0; let isJackpot = false;
    if (rand < (prob += conf.t1.prob)) { msg = conf.t1.name; reward = conf.t1.reward; }
    else if (rand < (prob += conf.t2.prob)) { msg = conf.t2.name; reward = conf.t2.reward; }
    else if (rand < (prob += conf.t3.prob)) { msg = conf.t3.name; reward = conf.t3.reward; }
    else { msg = conf.t4.name; reward = conf.t4.reward; isJackpot = true; }

    sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + conf.cost - reward } });
    if(isJackpot) { playSound('jackpot'); alert(`🎉 잭팟 터짐!! [ ${msg} ] (+${reward}🪙)`); }
    else { playSound('gacha'); alert(`결과: ${msg} (+${reward}🪙)`); }
  };

  const submitPraise = () => {
    if (!praiseTarget || !praiseTag || !praiseText) return alert("빈칸을 모두 채워주세요!");
    const nextList = [{ id: Date.now(), toId: praiseTarget, tag: praiseTag, text: praiseText, date: new Date().toLocaleDateString() }, ...safeArray(db.pendingPraises)];
    sync({ pendingPraises: nextList }); 
    setShowPraiseModal(false); setPraiseTarget(""); setPraiseText(""); setPraiseTag("");
    alert("온기 배달 완료! 승인을 기다립니다.");
  };

  const submitReflection = () => {
    if (!refTarget || !refTag || !refText) return alert("모든 항목을 입력해주세요.");
    const nextList = [{ id: Date.now(), sId: refTarget, tag: refTag, text: refText, date: new Date().toLocaleDateString() }, ...safeArray(db.pendingReflections)];
    sync({ pendingReflections: nextList, studentStatus: { ...db.studentStatus, [refTarget]: 'pending' } });
    setRefTarget(""); setRefText(""); setRefTag("");
    alert("공언 제출 완료!");
  };

  const handleLogin = () => {
    if (password === "6505") { setIsAuthenticated('teacher'); setActiveTab('admin'); setShowModal(null); setPassword(""); } 
    else if (password === db.settings.helpRoomPw) { setIsAuthenticated('inspector'); setActiveTab('helproom'); setShowModal(null); setPassword(""); } 
    else { alert("비밀번호 오류"); }
  };

  // 🔥 [핵심 수정] setStudents 제거 및 sync로만 완벽 제어
  const handleStudentFieldChange = (id, field, value) => {
    const nextStudents = safeStudents.map(st => st.id === id ? {...st, [field]: value} : st);
    sync({ students: nextStudents });
  };

  const handleEmergencyMission = (type) => {
    const points = type === 'all' ? 26 : 13;
    if(window.confirm(`긴급 미션 ${type === 'all' ? '전원 완수(+26p)' : '부분 완수(+13p)'}를 반영할까요?`)) {
      sync({ donations: [{ id: Date.now(), name: "📢 긴급 미션", amount: points }, ...safeArray(db.donations)].slice(0, 15) });
      alert("명성 보너스 반영!");
    }
  };

  const partialReset = (type) => {
    if(window.confirm(`정말 해당 데이터를 초기화할까요?`)) {
      if(type === 'donations') sync({ donations: [] });
      if(type === 'status') sync({ studentStatus: {}, penaltyCount: {} });
      if(type === 'exp') sync({ roleExp: {} });
      alert("초기화 완료!");
    }
  };

  const closeSemester = () => {
    if(window.prompt("1학기를 마감하시겠습니까? 누적(All-Time) 데이터를 제외한 점수와 코인이 리셋됩니다. '마감'을 입력하세요.") === "마감") {
      sync({ roleExp: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], donations: [] });
      alert("학기 마감 완료! 장기 데이터는 보존되었습니다.");
    }
  };

  const factoryReset = () => {
    if(window.prompt("초기화하시겠습니까? '초기화'를 입력하세요") === "초기화") {
      sync({ 
        roleExp: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, 
        pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [], 
        funding: [{ id: 1, name: "체육 한 시간 더", target: 1000, current: 0 }, { id: 2, name: "금요일 팝콘 파티", target: 2000, current: 0 }], 
        manualRepOffset: 0, shieldPoints: 100, 
        allTime: { exp: {}, penalty: {}, donate: {}, fund: {} } 
      });
      alert("전체 리셋 완료.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black text-2xl">데이터 동기화 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800 transition-all">
      
      {/* 1. 전광판 */}
      <header className="bg-slate-900 text-white p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-[100px] opacity-20"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="text-center md:text-left flex-1">
            <h1 className="text-blue-400 font-black text-sm uppercase tracking-[0.3em] mb-2">{db.settings.title}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="text-8xl font-black tracking-tighter">{classReputation}</span>
              <span className="text-3xl font-black text-blue-300 mt-6">p</span>
              <div className="w-6 h-6 rounded-full bg-blue-400 animate-breathe shadow-[0_0_30px_rgba(96,165,250,0.8)] mt-6"></div>
            </div>
            <div className="w-full md:w-[500px] h-5 bg-slate-800 rounded-full mt-6 overflow-hidden border border-slate-700 shadow-inner">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-1000" style={{ width: `${Math.min((classReputation/db.settings.targetScore)*100, 100)}%` }}></div>
            </div>
            <p className="text-xs font-bold text-blue-400 mt-2 text-right md:w-[500px]">목표: {db.settings.targetScore}p</p>
          </div>
          <div className="flex flex-col items-center bg-slate-800/50 p-6 rounded-[40px] border border-slate-700 backdrop-blur-md shadow-xl">
            <ShieldCheck className={`w-14 h-14 mb-2 ${shieldPoints > 0 ? 'text-green-400 animate-pulse drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]' : 'text-slate-600'}`} />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Reputation Shield</span>
            <span className={`text-5xl font-black mt-2 ${shieldPoints > 0 ? 'text-white' : 'text-slate-500'}`}>{shieldPoints}</span>
          </div>
        </div>
      </header>

      {/* 2. 마키 */}
      <div className="bg-indigo-600 text-white py-3 overflow-hidden shadow-lg border-y border-indigo-500 relative z-20">
        <div className="whitespace-nowrap animate-[shimmer_30s_linear_infinite] flex gap-20 text-sm font-black">
          <span className="flex gap-4 items-center"><Coins className="w-4 h-4 text-yellow-400"/> 기부 천사: {safeArray(db.donations).map(d => `${d.name}(${d.amount}p)`).join(' · ') || '내역이 없습니다.'}</span>
          <span className="flex gap-4 items-center text-pink-200"><Heart className="w-4 h-4 text-pink-400"/> 온기 소식: {safeArray(db.approvedPraises).map(p => `[${SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short||'칭찬'}] ${allStats.find(s=>s.id==p.toId)?.name||'나 자신'}: "${p.text}"`).join(' · ') || '따뜻한 소식을 기다립니다.'}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* 📄 PAGE 1 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-blue-100 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-50 rounded-full"></div>
                <h3 className="text-lg font-black text-blue-600 mb-2 flex items-center gap-2"><Zap className="w-5 h-5"/> 이번 주 마음성장 테마</h3>
                <p className="text-xl font-black text-slate-800 leading-snug">{db.settings.weeklyTheme}</p>
                <p className="text-xs font-bold text-slate-400 mt-4 leading-relaxed">테마에 맞는 온기 제보 시<br/>학급 명성 보너스가 부여됩니다.</p>
              </div>
              <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-amber-100 flex flex-col justify-between">
                <h3 className="text-lg font-black text-amber-600 mb-6 flex items-center gap-2"><Target className="w-5 h-5"/> 진행 중인 학급 크라우드 펀딩</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {safeArray(db.funding).map(f => (
                    <div key={f.id} className="space-y-2">
                      <div className="flex justify-between items-end font-black text-sm"><span>{f.name}</span><span className="text-amber-500">{Math.floor((f.current/f.target)*100)}%</span></div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 transition-all" style={{width:`${Math.min((f.current/f.target)*100,100)}%`}}></div></div>
                      <p className="text-[10px] font-bold text-slate-400 text-right">{f.current} / {f.target} 🪙</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(db.settings.isGachaOpen || db.settings.isBlackMarketOpen) && (
              <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl border-4 border-yellow-500 relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                <h2 className="text-2xl font-black text-yellow-400 mb-6 relative z-10 flex items-center gap-2"><Gift className="w-6 h-6"/> 특별 이벤트 존 오픈!</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  {db.settings.isGachaOpen && (
                    <div className="bg-black/50 p-6 rounded-3xl border border-yellow-400/50 flex justify-between items-center">
                      <div><h3 className="text-xl font-black text-white">{db.gachaConfig.mode === 'special' ? '✨ 동민신 가챠' : '🎁 일반 행운 가챠'}</h3><p className="text-xs text-yellow-200 mt-1">1회 {db.gachaConfig.cost} 🪙</p></div>
                      <select className="p-3 rounded-xl bg-yellow-400 text-yellow-900 font-black outline-none text-sm" onChange={(e)=>{if(e.target.value) handleGacha(e.target.value); e.target.value='';}}>
                        <option value="">도전할 사람?</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name}({s.coins}🪙)</option>)}
                      </select>
                    </div>
                  )}
                  {db.settings.isBlackMarketOpen && (
                    <div className="bg-purple-900/50 p-6 rounded-3xl border border-purple-400/50">
                      <h3 className="text-xl font-black text-white mb-4">🌙 달보드레 블랙 마켓</h3>
                      <div className="space-y-2">
                        {safeArray(db.blackMarketItems).map(b => (
                          <div key={b.id} className="flex justify-between items-center bg-black/30 p-2 rounded-xl"><span className="text-sm font-bold text-purple-200">{b.name}</span><button onClick={()=>{ alert("블랙마켓 상품은 선생님께 직접 결제를 요청하세요!"); }} className="bg-purple-500 text-white px-3 py-1 text-xs font-black rounded-lg hover:bg-purple-400">-{b.price}🪙 확인</button></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 border-b-2 border-slate-200 pb-4">
              <h2 className="text-2xl font-black flex items-center gap-2"><Users className="text-slate-700"/> 개인 상태 및 코인 현황</h2>
              <button onClick={() => setShowPraiseModal(true)} className="w-full sm:w-auto bg-pink-100 text-pink-600 px-6 py-3 rounded-full font-black text-sm hover:bg-pink-200 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"><Heart className="w-5 h-5"/> 온기 우체통</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedDashboardStats.map(s => (
                <div key={s.id} className={`p-6 rounded-[40px] border-2 shadow-sm transition-all relative flex flex-col ${s.status === 'crisis' ? 'bg-red-50 border-red-200 ring-4 ring-red-100' : (s.status === 'pending' ? 'bg-orange-50 border-orange-200 ring-4 ring-orange-100' : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-lg')}`}>
                  <div className="flex justify-between items-start mb-6">
                    <span className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xl">{s.id}</span>
                    <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">My Coins</p><p className="font-black text-blue-600 text-2xl">{s.coins} 🪙</p></div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs font-black text-slate-400 mb-1">{s.group}모둠 · {s.role}</p>
                    <h3 className="text-2xl font-black flex items-center gap-2 text-slate-800">{s.name} {s.isLeader && <Crown className="w-5 h-5 text-amber-400 fill-amber-400"/>}</h3>
                  </div>
                  <div className={`text-sm font-black px-4 py-2.5 rounded-xl inline-block shadow-sm border mb-4 ${s.mastery.bg} ${s.mastery.color} ${s.exp >= 20 ? 'border-amber-200' : 'border-transparent'}`}>
                    {s.mastery.label} <span className="text-[11px] opacity-70 ml-1">({s.exp}회)</span>
                  </div>

                  {db.settings.showCumulativeStats && (
                    <div className="bg-slate-800 p-3 rounded-2xl mb-4 text-[10px] font-bold text-slate-300 grid grid-cols-2 gap-y-1">
                       <span className="col-span-2 text-center text-blue-400 font-black mb-1 border-b border-slate-700 pb-1">누적 성장 데이터</span>
                       <span>✅완수: <span className="text-white">{s.atExp}회</span></span>
                       <span>💎기부: <span className="text-white">{s.atDonate}🪙</span></span>
                       <span>🚀펀딩: <span className="text-white">{s.atFund}🪙</span></span>
                       <span className="text-red-400">🚨위기: <span className="text-white">{s.atPen}회</span></span>
                    </div>
                  )}
                  
                  <div className="mt-auto border-t border-slate-100 pt-5">
                    {s.status === 'normal' && <button onClick={() => handleGivePenalty(s.id)} className="w-full py-4 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"><AlertTriangle className="w-5 h-5"/> 위기 지정</button>}
                    {s.status === 'crisis' && <p className="text-center font-black text-white bg-red-500 py-4 rounded-2xl animate-pulse shadow-md">🚨 성찰 요망</p>}
                    {s.status === 'pending' && <p className="text-center font-black text-white bg-orange-500 py-4 rounded-2xl shadow-md">⏳ 실천 검수 대기중</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📄 PAGE 2 */}
        {activeTab === 'reflection' && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="bg-white p-12 rounded-[50px] shadow-sm border border-slate-100 text-center">
                <BookOpen className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-4xl font-black mb-4 text-slate-800">성찰과 회복 센터</h2>
                <p className="text-slate-500 font-bold mb-10 text-lg">나의 선택을 돌아보고 공동체의 신뢰를 회복합니다.</p>
                <div className="text-left space-y-8 bg-slate-50 p-10 rounded-[40px] border border-slate-200 shadow-inner">
                  <div>
                    <label className="block text-sm font-black mb-3 text-slate-600">1. 이름을 선택하세요</label>
                    <select value={refTarget} onChange={e=>setRefTarget(e.target.value)} className="w-full p-5 rounded-3xl border-2 border-slate-200 font-black outline-none focus:border-green-400 bg-white text-lg">
                      <option value="">성찰 대상자 명단</option>
                      {allStats.filter(s => s.status === 'crisis').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black mb-3 text-slate-600">2. 어떤 마음성장 역량이 부족했나요?</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SEL_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setRefTag(opt.name)} className={`p-4 rounded-2xl border-2 font-black text-xs text-left transition-all ${refTag === opt.name ? 'bg-green-500 border-green-500 text-white shadow-lg scale-105' : 'bg-white border-slate-200 text-slate-500 hover:border-green-300 hover:bg-green-50'}`}>{opt.name}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black mb-3 text-slate-600">3. 공언하기 (성찰과 다짐)</label>
                    <textarea value={refText} onChange={e=>setRefText(e.target.value)} rows="5" className="w-full p-6 rounded-[30px] border-2 border-slate-200 font-black outline-none focus:border-green-400 bg-white resize-none text-lg leading-relaxed placeholder:text-slate-300 placeholder:font-bold" placeholder={refTag ? SEL_GUIDES[refTag] : "위에서 역량을 먼저 선택하면 구체적인 예시 가이드가 나타납니다."}></textarea>
                  </div>
                  <button onClick={submitReflection} className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black text-xl shadow-2xl hover:bg-slate-800 active:scale-95 transition-all flex justify-center items-center gap-2"><Send className="w-6 h-6"/> 성찰 내용 제출하기</button>
                </div>
             </div>
          </div>
        )}

        {/* 📄 PAGE 3 */}
        {activeTab === 'helproom' && (
          <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 flex flex-col lg:flex-row overflow-hidden min-h-[750px] animate-in slide-in-from-bottom duration-300">
            <aside className="w-full lg:w-72 bg-indigo-50 p-10 flex flex-col gap-4 shrink-0 border-r border-indigo-100">
              <div className="text-center mb-6"><UserCheck className="w-16 h-16 text-indigo-600 mx-auto mb-4" /><h3 className="text-3xl font-black text-indigo-900">학급 도움실</h3></div>
              <button onClick={() => setHelpSubTab('inspector')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${helpSubTab === 'inspector' ? 'bg-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><Briefcase className="w-6 h-6"/> 감찰사 관리</button>
              <button onClick={() => setHelpSubTab('magistrate')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${helpSubTab === 'magistrate' ? 'bg-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><BookOpen className="w-6 h-6"/> 현령 관리</button>
              <button onClick={() => setHelpSubTab('shop')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${helpSubTab === 'shop' ? 'bg-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><ShoppingCart className="w-6 h-6"/> 학급 상점</button>
              
              <div className="mt-auto p-6 bg-white rounded-3xl border border-indigo-100 shadow-sm">
                <h4 className="text-xs font-black text-indigo-400 uppercase mb-4 tracking-widest flex items-center gap-2"><Coins className="w-4 h-4"/>명예로운 기부처</h4>
                <select id="donate_who" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none mb-3">
                  <option value="">누가 기부하나요?</option>
                  {allStats.map(s => <option key={s.id} value={s.id}>{s.name}({s.coins}🪙)</option>)}
                </select>
                <input id="donate_amount" type="number" placeholder="기부 포인트" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none mb-4"/>
                <button onClick={() => {
                  const sid = document.getElementById('donate_who').value; const amt = parseInt(document.getElementById('donate_amount').value);
                  if(!sid || !amt) return alert("정보를 모두 입력하세요.");
                  handleDonate(parseInt(sid), amt);
                }} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm shadow-md hover:bg-indigo-700 transition-colors">기부하기 (명성 상승)</button>
              </div>
            </aside>

            <section className="flex-1 p-10 overflow-y-auto bg-slate-50/50">
              
              {helpSubTab === 'inspector' && (
                <div className="space-y-8 animate-in fade-in">
                   <h3 className="text-3xl font-black text-slate-800 mb-8 border-l-8 border-indigo-600 pl-6">감찰사: 부서 및 역할 배정</h3>
                   <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm mb-8">
                     <h4 className="text-xl font-black text-indigo-800 mb-4 flex items-center gap-2"><Briefcase/> 1인 1역 생성 및 삭제소</h4>
                     <div className="flex gap-4 mb-4">
                       <input type="text" placeholder="새로운 직업 이름" value={newRole} onChange={e=>setNewRole(e.target.value)} className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-indigo-400"/>
                       <button onClick={() => {
                         if(!newRole) return;
                         const next = [...safeArray(db.rolesList), newRole]; sync({ rolesList: next }); setNewRole('');
                       }} className="bg-indigo-600 text-white px-8 rounded-2xl font-black shadow-md hover:bg-indigo-700">생성</button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {safeArray(db.rolesList).map(r => (
                         <span key={r} className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
                           {r} <button onClick={()=>{ if(window.confirm('삭제하시겠습니까?')) sync({rolesList: db.rolesList.filter(x=>x!==r)}); }} className="text-indigo-300 hover:text-red-500"><X className="w-4 h-4"/></button>
                         </span>
                       ))}
                     </div>
                   </div>
                   <div className="bg-white border rounded-[40px] overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                          <tr><th className="p-6">학생명</th><th className="p-6">모둠 배치</th><th className="p-6 text-center">모둠장</th><th className="p-6">직업 배정</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allStats.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-6 font-black text-lg text-slate-700">{s.name}</td>
                              <td className="p-6"><select value={s.group} onChange={e=>handleStudentFieldChange(s.id, 'group', parseInt(e.target.value))} className="p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-indigo-400 shadow-sm">{[1,2,3,4,5,6].map(g=><option key={g} value={g}>{g}모둠</option>)}</select></td>
                              <td className="p-6 text-center"><button onClick={()=>handleStudentFieldChange(s.id, 'isLeader', !s.isLeader)} className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 mx-auto font-black text-xs transition-all border ${s.isLeader ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm' : 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50'}`}>{s.isLeader ? <><Crown className="w-4 h-4 fill-amber-400 text-amber-500"/> 모둠장</> : '모둠원'}</button></td>
                              <td className="p-6"><select value={s.role} onChange={e=>handleStudentFieldChange(s.id, 'role', e.target.value)} className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-indigo-400 shadow-sm"><option value="">직업 없음</option>{safeArray(db.rolesList).map(r=><option key={r} value={r}>{r}</option>)}</select></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              )}

              {helpSubTab === 'magistrate' && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-3xl font-black text-slate-800 mb-8 border-l-8 border-indigo-600 pl-6">현령: 향리 숙련도 관리</h3>
                  {[1,2,3,4,5,6].map(groupNum => {
                    const groupMembers = groupedByGroupStats.filter(s => s.group === groupNum);
                    if(groupMembers.length === 0) return null;
                    return (
                      <div key={groupNum} className="mb-8 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                        <h4 className="text-xl font-black text-indigo-800 mb-6 bg-indigo-50 inline-block px-6 py-2 rounded-full border border-indigo-100">{groupNum} 모둠 향리 명단</h4>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {groupMembers.map(s => (
                            <div key={s.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex items-center justify-between">
                              <div><p className="text-xs font-black text-slate-400 mb-1">{s.role}</p><p className="font-black text-xl text-slate-800">{s.name}</p></div>
                              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                                <button onClick={() => handleExpAdjust(s.id, -1)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Minus className="w-5 h-5"/></button>
                                <span className="w-16 text-center font-black text-indigo-600 text-2xl">{s.exp}<span className="text-sm ml-1 text-slate-400">회</span></span>
                                <button onClick={() => handleExpAdjust(s.id, 1)} className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><Plus className="w-5 h-5"/></button>
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
                  <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-black text-slate-800 border-l-8 border-amber-500 pl-6">학급 상점</h3><div className={`px-6 py-3 rounded-full font-black text-sm shadow-md ${isShopOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{isShopOpen ? "🔓 상점 영업 중" : "🔒 영업 종료 (목요일 개방)"}</div></div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {safeArray(db.shopItems).map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between">
                         <div>
                           <div className="flex justify-between items-start mb-6"><span className="text-xs font-black bg-slate-100 text-slate-500 px-4 py-2 rounded-full border">{item.creator} 제작</span><p className="text-3xl font-black text-amber-500">{item.price} 🪙</p></div>
                           <h4 className="text-2xl font-black text-slate-800 mb-10">{item.name}</h4>
                         </div>
                         <div className="flex gap-4">
                           <select id={`buyer_${item.id}`} className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none text-base focus:border-amber-400"><option value="">구매자 선택</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.coins}🪙)</option>)}</select>
                           <button onClick={() => {
                             if(!isShopOpen) return alert("오늘은 상점 운영일이 아닙니다!");
                             const sid = document.getElementById(`buyer_${item.id}`).value;
                             if(!sid) return alert("선택하세요.");
                             const user = allStats.find(u => u.id == sid);
                             if(user.coins < item.price) return alert("코인 부족.");
                             if(window.confirm(`${user.name}의 개인 코인을 차감하고 결제할까요?`)) { sync({ usedCoins: { ...db.usedCoins, [sid]: (db.usedCoins[sid] || 0) + item.price } }); alert("결제 승인 완료!"); playSound('buy'); }
                           }} className="bg-amber-500 text-white px-10 rounded-2xl font-black text-lg shadow-lg hover:bg-amber-600 active:scale-95 transition-all">구매 확정</button>
                         </div>
                      </div>
                    ))}
                    
                    {safeArray(db.funding).map(f => (
                      <div key={f.id} className="bg-gradient-to-br from-indigo-600 to-blue-800 p-8 rounded-[40px] shadow-xl text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                           <h4 className="text-2xl font-black mb-2 flex items-center gap-3"><Target className="w-6 h-6 text-blue-300"/> {f.name} (펀딩)</h4>
                           <p className="text-sm font-bold text-blue-200 mb-8">십시일반 투자하여 학급 목표를 달성하세요!</p>
                           <div className="flex justify-between items-end text-lg font-black mb-3"><span>현재: {f.current}p</span><span className="text-blue-300">목표: {f.target}p</span></div>
                           <div className="w-full h-5 bg-white/20 rounded-full mb-10 overflow-hidden border border-white/10"><div className="h-full bg-white transition-all shadow-[0_0_15px_white]" style={{width:`${(f.current/f.target)*100}%`}}></div></div>
                        </div>
                        <div className="flex gap-3 relative z-10">
                           <select id={`funder_${f.id}`} className="flex-1 p-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold outline-none text-sm"><option value="" className="text-black">투자자 선택</option>{allStats.map(s => <option key={s.id} value={s.id} className="text-black">{s.name} ({s.coins}🪙)</option>)}</select>
                           <input id={`f_amt_${f.id}`} type="number" placeholder="금액" className="w-24 p-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold outline-none text-sm placeholder:text-blue-300"/>
                           <button onClick={() => {
                             const sid = document.getElementById(`funder_${f.id}`).value; const amt = parseInt(document.getElementById(`f_amt_${f.id}`).value);
                             if(!sid || !amt) return alert("입력 오류");
                             handleFund(f.id, parseInt(sid), amt);
                           }} className="bg-white text-blue-800 px-8 rounded-2xl font-black text-lg shadow-lg hover:bg-blue-50 active:scale-95 transition-all">투자</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 📄 PAGE 4: 통합 관리실 */}
        {activeTab === 'admin' && isAuthenticated === 'teacher' && (
          <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 flex flex-col lg:flex-row overflow-hidden min-h-[750px] animate-in slide-in-from-right duration-300">
             <aside className="w-full lg:w-72 bg-slate-900 p-10 flex flex-col gap-4 shrink-0 border-r border-slate-800">
                <div className="text-center mb-8"><Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" /><h3 className="text-2xl font-black text-white">관리자 센터</h3><p className="text-slate-400 text-xs font-bold mt-2">최고 권한 모드</p></div>
                <button onClick={() => setAdminSubTab('report')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${adminSubTab === 'report' ? 'bg-blue-600 text-white shadow-xl translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><BarChart3 className="w-6 h-6"/> SEL 리포트</button>
                <button onClick={() => setAdminSubTab('mission')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${adminSubTab === 'mission' ? 'bg-blue-600 text-white shadow-xl translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Zap className="w-6 h-6"/> 결재 및 미션</button>
                <button onClick={() => setAdminSubTab('shopAdmin')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${adminSubTab === 'shopAdmin' ? 'bg-blue-600 text-white shadow-xl translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><ShoppingCart className="w-6 h-6"/> 상점 통제소</button>
                <button onClick={() => setAdminSubTab('settings')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${adminSubTab === 'settings' ? 'bg-blue-600 text-white shadow-xl translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Settings className="w-6 h-6"/> 환경 설정</button>
                <button onClick={() => setAdminSubTab('reset')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${adminSubTab === 'reset' ? 'bg-red-600 text-white shadow-xl translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Trash2 className="w-6 h-6"/> 초기화/마감</button>
                <button onClick={() => { setIsAuthenticated(false); setActiveTab('dashboard'); }} className="mt-auto p-5 bg-slate-800 text-slate-400 font-black rounded-3xl hover:bg-slate-700 transition-all">로그아웃</button>
             </aside>

             <section className="flex-1 p-10 overflow-y-auto bg-slate-50/50">
                {/* 리포트 탭 */}
                {adminSubTab === 'report' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">🌱 학생별 SEL 마음성장 리포트</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10">
                      <div className="w-full md:w-1/3">
                        <select value={selectedReportStudent} onChange={e=>setSelectedReportStudent(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none mb-6 focus:border-blue-400">
                          <option value="">학생을 선택하세요</option>
                          {allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
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
                              <h4 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><Star className="text-yellow-400 fill-yellow-400"/> {s.name} 학생의 강점 분석</h4>
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

                {/* 미션 탭 */}
                {adminSubTab === 'mission' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6">긴급 미션 및 최종 승인 결재함</h3>
                      <div className="bg-slate-100 p-2 rounded-2xl flex items-center gap-4 border border-slate-200">
                        <span className="text-sm font-black text-slate-500 pl-4">학급 평판 수동 조절:</span>
                        <button onClick={() => sync({ manualRepOffset: (db.manualRepOffset||0) - 1 })} className="p-2 bg-white text-red-500 rounded-xl hover:bg-red-50 shadow-sm"><Minus className="w-5 h-5"/></button>
                        <span className="w-12 text-center font-black text-xl text-blue-600">{db.manualRepOffset||0}</span>
                        <button onClick={() => sync({ manualRepOffset: (db.manualRepOffset||0) + 1 })} className="p-2 bg-white text-blue-500 rounded-xl hover:bg-blue-50 shadow-sm"><Plus className="w-5 h-5"/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                       <div className="bg-white p-10 rounded-[40px] shadow-sm border border-blue-100 flex flex-col items-center text-center">
                          <Zap className="w-20 h-20 text-blue-500 mb-6 animate-pulse" />
                          <h4 className="text-3xl font-black mb-4 text-slate-800">교사 긴급 미션 발동</h4>
                          <p className="text-slate-500 font-bold mb-10 text-sm leading-relaxed">수업 시간 집중, 과제 완수 등<br/>결정적인 순간에 학급 명성을 즉시 올립니다.</p>
                          <div className="flex gap-4 w-full">
                            <button onClick={() => handleEmergencyMission('all')} className="flex-1 bg-blue-600 text-white py-6 rounded-[30px] font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">전원 성공 (+26p)</button>
                            <button onClick={() => handleEmergencyMission('half')} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-[30px] font-black text-xl hover:bg-slate-200 active:scale-95 transition-all border border-slate-200">일부 성공 (+13p)</button>
                          </div>
                       </div>
                       <div className="bg-white p-10 rounded-[40px] shadow-sm border border-green-100 flex flex-col items-center text-center">
                          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                          <h4 className="text-3xl font-black mb-4 text-slate-800">성찰 및 온기 최종 승인</h4>
                          <div className="w-full space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {safeArray(db.pendingReflections).map(r => (
                              <div key={r.id} className="bg-red-50 p-5 rounded-2xl border border-red-200 text-left shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-black text-red-800 bg-red-100 px-3 py-1 rounded-lg text-xs">{allStats.find(s=>s.id==r.sId)?.name} (성찰)</span>
                                  <span className="text-[10px] font-bold text-red-400">{SEL_OPTIONS.find(opt=>opt.name===r.tag)?.short}</span>
                                </div>
                                <p className="text-sm text-slate-700 font-bold mb-4">"{r.text}"</p>
                                <div className="flex gap-2">
                                  <button onClick={() => {
                                    const next = db.pendingReflections.filter(pr => pr.id !== r.id);
                                    sync({ pendingReflections: next, studentStatus: { ...db.studentStatus, [r.sId]: 'normal' } });
                                    alert("위기 해제 승인 완료!"); playSound('good');
                                  }} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-sm hover:bg-red-600 shadow-md">위기 해제 승인</button>
                                  <button onClick={() => {
                                    const next = db.pendingReflections.filter(pr => pr.id !== r.id);
                                    sync({ pendingReflections: next, studentStatus: { ...db.studentStatus, [r.sId]: 'crisis' } });
                                    alert("반려되었습니다.");
                                  }} className="px-4 bg-white text-slate-400 font-black rounded-xl border border-slate-200">반려</button>
                                </div>
                              </div>
                            ))}
                            {safeArray(db.pendingPraises).map(p => (
                              <div key={p.id} className="bg-pink-50 p-5 rounded-2xl border border-pink-200 text-left shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-black text-pink-800 bg-pink-100 px-3 py-1 rounded-lg text-xs">To. {allStats.find(s=>s.id==p.toId)?.name||'나 자신'} (온기)</span>
                                  <span className="text-[10px] font-bold text-pink-400">{SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short}</span>
                                </div>
                                <p className="text-sm text-slate-700 font-bold mb-4">"{p.text}"</p>
                                <button onClick={() => {
                                  const next = db.pendingPraises.filter(pr => pr.id !== p.id);
                                  const app = [p, ...safeArray(db.approvedPraises)].slice(0,10);
                                  if(p.toId !== 'me') { 
                                    sync({ 
                                      pendingPraises: next, approvedPraises: app, 
                                      roleExp: { ...db.roleExp, [p.toId]: (db.roleExp[p.toId]||0) + 1 }, 
                                      allTime: { ...db.allTime, exp: { ...db.allTime.exp, [p.toId]: (db.allTime.exp?.[p.toId]||0)+1 } } 
                                    }); 
                                  } else { 
                                    sync({ pendingPraises: next, approvedPraises: app }); 
                                  }
                                  alert("온기 승인 완료! (+10p)"); playSound('good');
                                }} className="w-full bg-pink-500 text-white py-3 rounded-xl font-black text-sm hover:bg-pink-600 shadow-md">온기 사연 승인</button>
                              </div>
                            ))}
                            {safeArray(db.pendingReflections).length === 0 && safeArray(db.pendingPraises).length === 0 && <p className="text-slate-400 font-black py-10 border-2 border-dashed rounded-3xl">결재 대기열이 비어있습니다.</p>}
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* 상점 탭 */}
                {adminSubTab === 'shopAdmin' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">상점 및 이벤트 통제소</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                      <div className="flex flex-wrap gap-4">
                         <button onClick={() => sync({ settings: { ...db.settings, forceShopOpen: !db.settings.forceShopOpen } })} className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all ${db.settings.forceShopOpen ? 'bg-amber-500 text-white shadow-xl' : 'bg-slate-100 text-slate-500'}`}>정규 상점 개방: {db.settings.forceShopOpen ? 'ON' : 'OFF (목요일만)'}</button>
                         <button onClick={() => sync({ settings: { ...db.settings, isGachaOpen: !db.settings.isGachaOpen } })} className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all ${db.settings.isGachaOpen ? 'bg-yellow-400 text-yellow-900 shadow-xl' : 'bg-slate-100 text-slate-500'}`}>행운의 가챠 시스템: {db.settings.isGachaOpen ? 'ON' : 'OFF'}</button>
                         <button onClick={() => sync({ settings: { ...db.settings, isBlackMarketOpen: !db.settings.isBlackMarketOpen } })} className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all ${db.settings.isBlackMarketOpen ? 'bg-purple-900 text-white shadow-xl' : 'bg-slate-100 text-slate-500'}`}>블랙 마켓 오픈: {db.settings.isBlackMarketOpen ? 'ON' : 'OFF'}</button>
                      </div>

                      <div className="pt-8 border-t border-slate-200">
                        <h4 className="font-black text-lg text-slate-700 mb-4">상점 물품 관리 (정규 / 블랙마켓)</h4>
                        <div className="flex gap-4 mb-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                          <select value={newItemType} onChange={e=>setNewItemType(e.target.value)} className="p-4 rounded-xl border border-slate-300 font-bold outline-none bg-white">
                            <option value="shop">정규 상점</option><option value="black">블랙 마켓</option>
                          </select>
                          <input type="text" placeholder="물품 이름" value={newItemName} onChange={e=>setNewItemName(e.target.value)} className="flex-1 p-4 rounded-xl border border-slate-300 font-bold outline-none"/>
                          <input type="number" placeholder="가격" value={newItemPrice} onChange={e=>setNewItemPrice(e.target.value)} className="w-32 p-4 rounded-xl border border-slate-300 font-bold outline-none"/>
                          <button onClick={() => {
                            if(!newItemName || !newItemPrice) return alert("입력 오류");
                            if(newItemType === 'shop') sync({ shopItems: [...safeArray(db.shopItems), { id: Date.now(), name: newItemName, price: parseInt(newItemPrice), creator: '선생님' }] });
                            else sync({ blackMarketItems: [...safeArray(db.blackMarketItems), { id: Date.now(), name: newItemName, price: parseInt(newItemPrice), creator: '선생님' }] });
                            setNewItemName(""); setNewItemPrice("");
                          }} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700">추가</button>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h5 className="text-sm font-bold text-amber-600 mb-2">정규 상점 물품</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {safeArray(db.shopItems).map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex justify-between items-center shadow-sm">
                                  <div><span className="text-[10px] text-slate-400 font-black bg-slate-100 px-2 py-1 rounded-md">{item.creator}</span><h4 className="font-black text-slate-800 mt-2">{item.name}</h4><p className="text-amber-500 font-black">{item.price} 🪙</p></div>
                                  <button onClick={() => { if(window.confirm("삭제할까요?")) sync({ shopItems: db.shopItems.filter(i => i.id !== item.id) }); }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-5 h-5"/></button>
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
                                  <button onClick={() => { if(window.confirm("삭제할까요?")) sync({ blackMarketItems: db.blackMarketItems.filter(i => i.id !== item.id) }); }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-5 h-5"/></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-200 bg-yellow-50 p-8 rounded-3xl mt-8">
                        <h4 className="font-black text-lg text-yellow-800 mb-6 flex justify-between items-center">
                          가챠 확률 및 문구 세팅 
                          <button onClick={()=>sync({ gachaConfig: { ...db.gachaConfig, mode: db.gachaConfig.mode === 'special' ? 'normal' : 'special' } })} className={`px-4 py-2 rounded-xl text-sm ${db.gachaConfig.mode === 'special' ? 'bg-purple-600 text-white shadow-md' : 'bg-yellow-400 text-yellow-900 shadow-md'}`}>
                            {db.gachaConfig.mode === 'special' ? '✨ 동민신 모드' : '🎁 일반 모드'} 변경
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

                {/* 설정 탭 */}
                {adminSubTab === 'settings' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">시스템 텍스트 & 테마 커스텀</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-sm font-black text-slate-500 mb-3">대시보드 메인 타이틀</label>
                            <input type="text" value={db.settings.title} onChange={e=>sync({settings: {...db.settings, title: e.target.value}})} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none focus:border-blue-400"/>
                          </div>
                          <div>
                            <label className="block text-sm font-black text-slate-500 mb-3">이주의 마음성장(SEL) 테마</label>
                            <select value={db.settings.weeklyTheme} onChange={e=>sync({settings: {...db.settings, weeklyTheme: e.target.value}})} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none focus:border-blue-400">
                              {SEL_OPTIONS.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
                            </select>
                          </div>
                       </div>
                       <div className="pt-6 border-t border-slate-100">
                          <label className="block text-sm font-black text-slate-500 mb-4">하단 메뉴 이름 수정 (4개 순서대로)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {db.settings.menuNames.map((n, i) => (
                              <input key={i} type="text" value={n} onChange={e => { 
                                const next = [...db.settings.menuNames]; 
                                next[i] = e.target.value; 
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
                          <button onClick={() => sync({ settings: { ...db.settings, showCumulativeStats: !db.settings.showCumulativeStats } })} className={`px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-md ${db.settings.showCumulativeStats ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300 border border-slate-300'}`}>
                            1페이지 장기 누적 스탯 공개: {db.settings.showCumulativeStats ? 'ON' : 'OFF'}
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                {/* 리셋 탭 */}
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
                          <p className="text-red-600 font-bold mb-10 text-lg">초기화 시 <span className="underline">학생 명단/부서를 제외한</span> 모든 데이터가 '0'이 됩니다.<br/>학기 초나 테스트 종료 후 본격적으로 시작할 때 한 번만 사용하세요.</p>
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
                {SEL_OPTIONS.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
              </select>
              <textarea value={praiseText} onChange={(e)=>setPraiseText(e.target.value)} rows="4" placeholder="어떤 구체적인 행동을 했는지 적어주세요! (선생님 승인 시 전광판에 등록됩니다)" className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black outline-none focus:border-pink-400 focus:bg-white resize-none shadow-sm placeholder:font-bold"/>
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
          <div className="bg-white rounded-[60px] p-16 w-full max-w-lg text-center shadow-2xl animate-in zoom-in-95">
            <Lock className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h3 className="text-3xl font-black text-center mb-4">관리자 인증</h3>
            <p className="text-center text-slate-400 font-bold mb-10 text-sm">교사 권한(6505) 또는 감찰사 권한이 필요합니다.</p>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key === 'Enter' && handleLogin()} className="w-full text-center text-6xl tracking-[15px] font-black p-8 border-4 border-slate-100 rounded-[40px] outline-none mb-12 bg-slate-50 focus:border-blue-400 focus:bg-white shadow-inner" autoFocus />
            <div className="flex gap-4">
              <button onClick={()=>setShowModal(null)} className="flex-1 py-6 rounded-[30px] font-black text-slate-500 text-xl bg-slate-100 hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={handleLogin} className="flex-1 py-6 rounded-[30px] font-black bg-blue-600 text-white text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">접속하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 py-4 flex justify-around items-center z-[5000] shadow-[0_-15px_50px_rgba(0,0,0,0.06)] pb-8">
        {[
          { id: 'dashboard', icon: <Target className="w-7 h-7"/>, label: db.settings.menuNames[0] || "명성 현황판" }, 
          { id: 'reflection', icon: <BookOpen className="w-7 h-7"/>, label: db.settings.menuNames[1] || "성찰과 회복" }, 
          { id: 'helproom', icon: <Users className="w-7 h-7"/>, label: db.settings.menuNames[2] || "도움실" }, 
          { id: 'admin', icon: <Settings className="w-7 h-7"/>, label: db.settings.menuNames[3] || "통합 관리실" }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => item.id === 'admin' ? setShowModal('password') : setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${activeTab === item.id ? 'text-blue-600 scale-110 -translate-y-2 drop-shadow-md' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
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
        .slide-in-from-bottom { animation-name: slideInBottom; }
        .slide-in-from-right { animation-name: slideInRight; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInBottom { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
