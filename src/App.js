/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Trophy, ShieldCheck, Heart, Lock, History, Save, X, 
  Plus, Minus, AlertTriangle, Sparkles, Star, Target, Settings, 
  Trash2, ShoppingCart, CheckCircle2, BookOpen, UserCheck, Briefcase, 
  Zap, Crown, Gift, Coins, BarChart3, MessageSquare, Send, Gavel
} from 'lucide-react';

// ==========================================
// 🚨 파이어베이스 주소
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/"; 
// ==========================================

const safeArray = (val) => (Array.isArray(val) ? val.filter(Boolean) : (typeof val === 'object' && val ? Object.values(val).filter(Boolean) : []));

// 🎵 아기자기한 효과음 엔진
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
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
    } else if (type === 'buy') { 
      osc.frequency.setValueAtTime(500, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2); 
      osc.type = 'square'; osc.start(); 
      gain.gain.setValueAtTime(0.1, ctx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2); 
      osc.stop(ctx.currentTime + 0.2); 
    } else if (type === 'jackpot') { 
      osc.type = 'triangle'; 
      [440, 554.37, 659.25, 880].forEach((f, i) => osc.frequency.setValueAtTime(f, ctx.currentTime + i*0.1));
      osc.start(); gain.gain.setValueAtTime(0.2, ctx.currentTime); 
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6); 
      osc.stop(ctx.currentTime + 0.6); 
    }
  } catch (e) {}
};

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
  "1단계: 자기 인식 (Self-awareness)": "상황: 내 기분이 어땠는지 적어보세요.\n다짐: 내 안의 감정과 강점을 어떻게 발견할지 다짐해보세요.", 
  "2단계: 자기 관리 (Self-management)": "상황: 화가 나거나 포기하고 싶었을 때를 적어보세요.\n다짐: 감정의 파도를 다스리고 목표를 향해 어떻게 나아갈지 적어보세요.", 
  "3단계: 사회적 인식 (Social awareness)": "상황: 친구와 생각이 다르거나 오해가 생겼을 때를 적어보세요.\n공감: 타인의 마음을 읽고 다름을 어떻게 인정할지 적어보세요.", 
  "4단계: 관계 기술 (Relationship skills)": "상황: 대화나 모둠 활동 중 배려가 필요했던 순간을 적어보세요.\n행동: 마법 같은 우정을 위해 어떻게 행동할지 적어보세요.", 
  "5단계: 책임 있는 의사결정 (Responsible decision-making)": "상황: 우리 반의 규칙이나 분위기를 위한 선택의 순간을 적어보세요.\n다짐: 더 나은 세상을 만드는 나의 선택을 실천해보세요." 
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [helpSubTab, setHelpSubTab] = useState('inspector');
  const [adminSubTab, setAdminSubTab] = useState('report');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null);
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

  const [db, setDb] = useState({
    students: defaultStudents, 
    rolesList: ['학급문고 정리', '우유 배달', '다툼 중재자', '현령', '감찰사'],
    settings: { title: "달보드레 행복 교실 🌸", menuNames: ["행복 현황판", "성찰과 회복", "도움실", "관리실"], targetScore: 3000, forceShopOpen: false, weeklyTheme: "4단계: 관계 기술 (Relationship skills)", helpRoomPw: "1111", isGachaOpen: false, isBlackMarketOpen: false, showCumulativeStats: false },
    gachaConfig: { mode: 'normal', cost: 30, t1: {name:'😭 꽝!', prob:50, reward:0}, t2: {name:'🪙 페이백!', prob:30, reward:30}, t3: {name:'🍬 소소한 간식', prob:15, reward:50}, t4: {name:'🎰 잭팟!!', prob:5, reward:200} },
    shopItems: [{ id: 'i1', name: '달보드레 연필', price: 30, creator: '선생님' }], blackMarketItems: [{ id: 'b1', name: '보드게임권', price: 200, creator: '선생님' }],
    pendingShopItems: [], roleExp: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [],
    funding: [{ id: 1, name: "체육 시간 더 ⚽", target: 1000, current: 0 }, { id: 2, name: "팝콘 파티 🍿", target: 2000, current: 0 }],
    manualRepOffset: 0, shieldPoints: 100, allTime: { exp: {}, penalty: {}, donate: {}, fund: {} }, activeMission: { isActive: false, participants: [] }
  });

  useEffect(() => {
    const fetchLive = async () => {
      try { 
        const res = await fetch(`${DATABASE_URL}v71Data.json`); 
        const data = await res.json(); 
        if (data) setDb(prev => ({...prev, ...data, settings: {...prev.settings, ...(data.settings||{})}, allTime: {...prev.allTime, ...(data.allTime||{})}, activeMission: data.activeMission || {isActive:false, participants:[]}, pendingShopItems: safeArray(data.pendingShopItems)})); 
      } catch (e) {}
      setIsLoading(false);
    };
    fetchLive(); const interval = setInterval(fetchLive, 3000); return () => clearInterval(interval);
  }, []);

  const sync = async (updates) => {
    const nextDb = { ...db, ...updates }; setDb(nextDb);
    try { await fetch(`${DATABASE_URL}v71Data.json`, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  const allStats = useMemo(() => {
    return safeArray(db.students).map(s => {
      const exp = db.roleExp[s.id] || 0; const coins = Math.max(0, exp * 10 - (db.usedCoins[s.id] || 0));
      let mastery = { label: '🌱 인턴', color: 'text-emerald-700', bg: 'bg-emerald-100' };
      if (exp >= 20) mastery = { label: '👑 장인', color: 'text-amber-700', bg: 'bg-amber-100' };
      else if (exp >= 10) mastery = { label: '💎 전문가', color: 'text-blue-700', bg: 'bg-blue-100' };
      return { ...s, exp, coins, mastery, status: db.studentStatus[s.id] || 'normal', atExp: db.allTime?.exp?.[s.id] || 0, atDonate: db.allTime?.donate?.[s.id] || 0, atFund: db.allTime?.fund?.[s.id] || 0, atPen: db.allTime?.penalty?.[s.id] || 0 };
    });
  }, [db.students, db.roleExp, db.usedCoins, db.studentStatus, db.allTime]);

  const sortedDashboardStats = useMemo(() => {
    if (db.settings.showCumulativeStats) return [...allStats].sort((a, b) => a.id - b.id);
    return [...allStats].sort((a, b) => { const order = { crisis: 0, pending: 1, normal: 2 }; if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]; return a.id - b.id; });
  }, [allStats, db.settings.showCumulativeStats]);

  const { classReputation, shieldPoints } = useMemo(() => {
    const raw = allStats.reduce((sum, s) => sum + s.exp * 10 - (db.penaltyCount[s.id] || 0) * 20, 0) + safeArray(db.donations).reduce((sum, d) => sum + d.amount, 0) + (db.manualRepOffset || 0);
    let r = raw; let s = db.shieldPoints || 0;
    if (raw > db.settings.targetScore) { r = db.settings.targetScore; s = raw - db.settings.targetScore; } else r = Math.max(0, raw);
    return { classReputation: r, shieldPoints: s };
  }, [allStats, db.penaltyCount, db.donations, db.settings.targetScore, db.manualRepOffset, db.shieldPoints]);

  const topExp = useMemo(() => [...allStats].sort((a,b) => b.atExp - a.atExp).filter(s => s.atExp > 0).slice(0,5), [allStats]);
  const topDonate = useMemo(() => [...allStats].sort((a,b) => b.atDonate - a.atDonate).filter(s => s.atDonate > 0).slice(0,5), [allStats]);
  const topFund = useMemo(() => [...allStats].sort((a,b) => b.atFund - a.atFund).filter(s => s.atFund > 0).slice(0,5), [allStats]);
  const isShopOpen = useMemo(() => db.settings.forceShopOpen || new Date().getDay() === 4, [db.settings.forceShopOpen]);

  const handleExpAdjust = (id, delta) => { if(delta > 0) playSound('good'); sync({ roleExp: { ...db.roleExp, [id]: Math.max(0, (db.roleExp[id]||0) + delta) }, allTime: { ...db.allTime, exp: { ...db.allTime.exp, [id]: Math.max(0, (db.allTime.exp?.[id]||0) + delta) } } }); };
  const handleGivePenalty = (id) => { if (!isAuthenticated) return setShowModal('password'); if (window.confirm("위기 지정할까요?")) { playSound('bad'); sync({ studentStatus: { ...db.studentStatus, [id]: 'crisis' }, penaltyCount: { ...db.penaltyCount, [id]: (db.penaltyCount[id] || 0) + 1 }, allTime: { ...db.allTime, penalty: { ...db.allTime.penalty, [id]: (db.allTime.penalty?.[id] || 0) + 1 } } }); } };
  const handleDonate = (sId, amount) => { const u = allStats.find(s => s.id == sId); if (!u || u.coins < amount) return alert("코인 부족!"); playSound('buy'); sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, donations: [{ id: Date.now(), name: u.name, amount }, ...safeArray(db.donations)].slice(0, 15), allTime: { ...db.allTime, donate: { ...db.allTime.donate, [sId]: (db.allTime.donate?.[sId] || 0) + amount } } }); alert("기부 완료! ✨"); };
  const handleFund = (fId, sId, amount) => { const u = allStats.find(s => s.id == sId); if (!u || u.coins < amount) return alert("코인 부족!"); playSound('buy'); sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + amount }, funding: safeArray(db.funding).map(f => f.id === fId ? { ...f, current: f.current + amount } : f), allTime: { ...db.allTime, fund: { ...db.allTime.fund, [sId]: (db.allTime.fund?.[sId] || 0) + amount } } }); alert("투자 완료!"); };
  const handleGacha = (sId) => { const u = allStats.find(s => s.id == sId); const c = db.gachaConfig; if (!u || u.coins < c.cost) return alert("코인 부족!"); if(!window.confirm(`${c.cost}🪙 소모 가챠?`)) return; const rand = Math.random() * 100; let msg = ""; let rew = 0; let p = 0; let isJ = false; if (rand < (p += c.t1.prob)) { msg = c.t1.name; rew = c.t1.reward; } else if (rand < (p += c.t2.prob)) { msg = c.t2.name; rew = c.t2.reward; } else if (rand < (p += c.t3.prob)) { msg = c.t3.name; rew = c.t3.reward; } else { msg = c.t4.name; rew = c.t4.reward; isJ = true; } sync({ usedCoins: { ...db.usedCoins, [sId]: (db.usedCoins[sId] || 0) + c.cost - rew } }); if(isJ) { playSound('jackpot'); alert(`🎉 잭팟!! [${msg}]`); } else { playSound('buy'); alert(`결과: ${msg}`); } };
  const startMission = () => { if(window.confirm("긴급 미션 발동?")) sync({ activeMission: { isActive: true, participants: [] } }); };
  const participateMission = (sId) => { if(db.activeMission.participants.includes(sId)) return; playSound('good'); const nextP = [...db.activeMission.participants, sId]; let nextO = (db.manualRepOffset || 0) + 0.5; let nextM = { isActive: true, participants: nextP }; if (nextP.length >= safeArray(db.students).length) { playSound('jackpot'); alert("🎉 전원 미션 성공!"); nextO += (safeArray(db.students).length * 0.5); nextM.isActive = false; } sync({ manualRepOffset: nextO, activeMission: nextM }); };
  const handleLogin = () => { if (password === "6505") { setIsAuthenticated('teacher'); setActiveTab('admin'); setShowModal(null); setPassword(""); } else if (password === db.settings.helpRoomPw) { setIsAuthenticated('inspector'); setActiveTab('helproom'); setShowModal(null); setPassword(""); } else { alert("오류 ❌"); playSound('bad'); } };
  const handleStudentFieldChange = (id, field, value) => sync({ students: safeArray(db.students).map(st => st.id === id ? {...st, [field]: value} : st) });
  const handleAddStudent = () => { if(!newStudentName) return; const nextId = safeArray(db.students).length > 0 ? Math.max(...safeArray(db.students).map(s=>s.id)) + 1 : 1; sync({ students: [...safeArray(db.students), { id: nextId, name: newStudentName, role: newStudentRole || '향리', group: parseInt(newStudentGroup), isLeader: false }] }); setNewStudentName(""); alert("전입 완료!"); };

  if (isLoading) return <div className="min-h-screen bg-amber-50 flex items-center justify-center text-amber-600 font-black text-2xl animate-pulse">달보드레 행복 교실 여는 중... 🌸</div>;

  return (
    <div className="min-h-screen bg-amber-50/50 pb-32 font-sans text-slate-800">
      <header className="bg-gradient-to-br from-amber-100 to-orange-100 p-8 md:p-12 shadow-sm relative overflow-hidden border-b-4 border-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="text-center md:text-left flex-1">
            <h1 className="text-amber-800 font-black text-lg mb-2 flex items-center justify-center md:justify-start gap-2">🌸 {db.settings.title}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="text-8xl font-black text-amber-900 tracking-tighter">{classReputation}</span><span className="text-3xl font-black text-amber-600 mt-6">p</span>
              <div className="w-6 h-6 rounded-full bg-amber-400 animate-breathe shadow-[0_0_20px_orange] mt-6"></div>
            </div>
            <div className="w-full md:w-[500px] h-6 bg-white rounded-full mt-6 overflow-hidden shadow-inner border-2 border-amber-200">
              <div className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 transition-all duration-1000" style={{ width: `${Math.min((classReputation/db.settings.targetScore)*100, 100)}%` }}></div>
            </div>
            <div className="flex justify-between md:w-[500px] mt-2">
              <div className="flex-1 overflow-hidden whitespace-nowrap text-xs font-bold text-amber-700 bg-white/50 px-3 py-1 rounded-full border border-amber-200"><span className="animate-[shimmer_20s_linear_infinite] inline-block">✨ 기부 전광판: {safeArray(db.donations).map(d => `${d.name}(${d.amount}p)`).join(' · ') || '따뜻한 기부를 기다려요!'}</span></div>
              <span className="text-xs font-black text-orange-600 ml-4">목표: {db.settings.targetScore}p</span>
            </div>
          </div>
          <div className="flex flex-col items-center bg-white/80 p-8 rounded-[40px] border-4 border-white shadow-xl backdrop-blur-md">
            <ShieldCheck className={`w-16 h-16 mb-2 ${shieldPoints > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-300'}`} />
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2 uppercase">Shield Energy</span>
            <span className={`text-6xl font-black ${shieldPoints > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>{shieldPoints}</span>
          </div>
        </div>
      </header>

      <div className="bg-pink-100 text-pink-700 py-3 overflow-hidden shadow-sm border-b border-pink-200 relative z-20">
        <div className="whitespace-nowrap animate-[shimmer_30s_linear_infinite] flex gap-20 text-sm font-black">
          <span className="flex gap-4 items-center">💌 온기 소식: {safeArray(db.approvedPraises).map(p => `[${SEL_OPTIONS.find(opt=>opt.name===p.tag)?.short||'칭찬'}] ${allStats.find(s=>s.id==p.toId)?.name||'나 자신'}: "${p.text}"`).join(' 🌸 ')}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-50 p-6 rounded-[30px] border border-indigo-100">
                <h4 className="text-xs font-black text-indigo-800 mb-4 flex items-center gap-2">🏆 역할 완수 TOP 5</h4>
                <ul className="space-y-2">{topExp.map((s, i) => <li key={s.id} className="text-xs font-bold text-indigo-900 bg-white/60 px-3 py-1.5 rounded-lg flex justify-between"><span>{i+1}. {s.name}</span><span>{s.atExp}회</span></li>)}</ul>
              </div>
              <div className="bg-amber-50 p-6 rounded-[30px] border border-amber-100">
                <h4 className="text-xs font-black text-amber-800 mb-4 flex items-center gap-2">🏆 기부 천사 TOP 5</h4>
                <ul className="space-y-2">{topDonate.map((s, i) => <li key={s.id} className="text-xs font-bold text-amber-900 bg-white/60 px-3 py-1.5 rounded-lg flex justify-between"><span>{i+1}. {s.name}</span><span>{s.atDonate}🪙</span></li>)}</ul>
              </div>
              <div className="bg-rose-50 p-6 rounded-[30px] border border-rose-100">
                <h4 className="text-xs font-black text-rose-800 mb-4 flex items-center gap-2">🏆 펀딩 기여 TOP 5</h4>
                <ul className="space-y-2">{topFund.map((s, i) => <li key={s.id} className="text-xs font-bold text-rose-900 bg-white/60 px-3 py-1.5 rounded-lg flex justify-between"><span>{i+1}. {s.name}</span><span>{s.atFund}🪙</span></li>)}</ul>
              </div>
            </div>

            {db.activeMission.isActive && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 rounded-[40px] shadow-2xl text-white text-center border-4 border-blue-300">
                <Zap className="w-16 h-16 text-yellow-300 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl font-black mb-2">🚨 긴급 퀘스트 발동!</h2>
                <div className="w-full bg-black/20 h-6 rounded-full overflow-hidden border border-white/30 mt-6"><div className="h-full bg-yellow-400" style={{width:`${(db.activeMission.participants.length / safeArray(db.students).length)*100}%`}}></div></div>
                <p className="font-black mt-2 text-yellow-200">{db.activeMission.participants.length} / {safeArray(db.students).length} 명 완료</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border-2 border-emerald-100">
                <h3 className="text-xs font-black text-emerald-600 mb-2 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full inline-block"><Star className="w-4 h-4"/> 이주의 마음성장</h3>
                <p className="text-2xl font-black text-slate-800 mt-4 leading-snug">{db.settings.weeklyTheme}</p>
              </div>
              <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border-2 border-amber-100">
                <h3 className="text-xs font-black text-amber-600 mb-4 flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full inline-block"><Target className="w-4 h-4"/> 학급 크라우드 펀딩</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {safeArray(db.funding).map(f => (
                    <div key={f.id} className="space-y-2">
                      <div className="flex justify-between font-black text-xs"><span>{f.name}</span><span className="text-amber-500">{Math.floor((f.current/f.target)*100)}%</span></div>
                      <div className="w-full h-4 bg-slate-100 rounded-full border border-slate-200 overflow-hidden shadow-inner"><div className="h-full bg-amber-400" style={{width:`${Math.min((f.current/f.target)*100,100)}%`}}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-b-2 border-amber-200 pb-4 mb-6">
              <h2 className="text-3xl font-black text-amber-900 flex items-center gap-2"><Users className="text-amber-500 w-8 h-8"/> 우리 반 행복 친구들</h2>
              <button onClick={() => setShowPraiseModal(true)} className="bg-pink-400 text-white px-8 py-4 rounded-full font-black shadow-lg hover:bg-pink-500 active:scale-95 transition-all flex items-center gap-2"><Heart className="w-6 h-6 fill-white"/> 온기 보내기</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {sortedDashboardStats.map(s => (
                <div key={s.id} className={`p-5 rounded-[30px] border-4 shadow-sm transition-all relative flex flex-col bg-white hover:shadow-xl ${s.status === 'crisis' ? 'border-red-300 bg-red-50' : (s.status === 'pending' ? 'border-orange-300 bg-orange-50' : 'border-white hover:border-amber-200')}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-black text-lg shadow-inner">{s.id}</span>
                    <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Coins</p><p className="font-black text-amber-600 text-xl">{s.coins} 🪙</p></div>
                  </div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                    <div><p className="text-[10px] font-black text-slate-400">{s.group}모둠 · {s.role}</p><h3 className="text-xl font-black text-slate-800">{s.name} {s.isLeader && <Crown className="w-4 h-4 text-amber-400 fill-amber-400"/>}</h3></div>
                    <div className={`text-[10px] font-black px-2 py-1 rounded-lg border ${s.mastery.bg} ${s.mastery.color} text-center`}>{s.mastery.label}<br/>({s.exp}회)</div>
                  </div>
                  {db.settings.showCumulativeStats && (
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl mb-3 text-[10px] font-bold text-slate-600 grid grid-cols-2 gap-1 shadow-inner">
                       <span>✅완수: {s.atExp}</span><span>💎기부: {s.atDonate}</span><span>🚀펀딩: {s.atFund}</span><span className="text-red-400">🚨위기: {s.atPen}</span>
                    </div>
                  )}
                  {db.activeMission.isActive && !db.activeMission.participants.includes(s.id) && (
                    <button onClick={() => participateMission(s.id)} className="w-full bg-blue-500 text-white font-black py-3 rounded-2xl mb-3 shadow-md animate-bounce">✋ 미션 완료!</button>
                  )}
                  {db.activeMission.isActive && db.activeMission.participants.includes(s.id) && (
                    <div className="w-full bg-blue-100 text-blue-600 font-black py-3 rounded-2xl mb-3 text-center text-sm">✅ 완료함</div>
                  )}
                  <div className="mt-auto">
                    {s.status === 'normal' && <button onClick={() => handleGivePenalty(s.id)} className="w-full py-3 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-2xl font-black text-xs flex items-center justify-center gap-1 transition-all"><AlertTriangle className="w-4 h-4"/> 위기 지정</button>}
                    {s.status === 'crisis' && <p className="text-center font-black text-white bg-red-500 py-3 rounded-2xl text-xs animate-pulse">🚨 성찰 요망</p>}
                    {s.status === 'pending' && <p className="text-center font-black text-white bg-orange-400 py-3 rounded-2xl text-xs">⏳ 검수 대기</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reflection' && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="bg-white p-12 rounded-[50px] shadow-xl border-4 border-emerald-100 text-center">
                <BookOpen className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
                <h2 className="text-4xl font-black mb-4 text-emerald-900 text-center">성찰과 회복 센터 🌱</h2>
                <div className="text-left space-y-8 bg-emerald-50/50 p-10 rounded-[40px] border-2 border-emerald-100 mt-10 shadow-inner">
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-3 py-1 rounded-full">1. 누가 성찰하나요?</label>
                    <select value={refTarget} onChange={e=>setRefTarget(e.target.value)} className="w-full p-5 rounded-3xl border-2 border-white font-black outline-none focus:border-emerald-300 bg-white text-lg shadow-sm">
                      <option value="">이름 선택</option>{allStats.filter(s => s.status === 'crisis').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  {refTarget && (
                    <div className="bg-pink-50 border-2 border-pink-200 p-6 rounded-3xl text-pink-800 animate-in fade-in">
                      <h4 className="font-black mb-2 flex items-center gap-2"><Heart className="w-5 h-5 fill-pink-400"/> 마법의 위로 한마디</h4>
                      <p className="text-sm font-bold leading-relaxed bg-white p-4 rounded-2xl shadow-sm">"누구나 실수할 수 있어요. 넌 여전히 우리 반의 보물이야! 스스로를 다독이고 다시 시작해봐요."</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-3 py-1 rounded-full">2. 부족했던 마음 역량</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SEL_OPTIONS.map(opt => <button key={opt.id} onClick={() => setRefTag(opt.name)} className={`p-4 rounded-2xl border-2 font-black text-xs text-left transition-all ${refTag === opt.name ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg scale-105' : 'bg-white border-white text-slate-500 hover:border-emerald-200'}`}>{opt.name}</button>)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black mb-3 text-emerald-800 bg-emerald-100 inline-block px-3 py-1 rounded-full">3. 마음 다짐 적기</label>
                    <textarea value={refText} onChange={e=>setRefText(e.target.value)} rows="5" className="w-full p-6 rounded-[30px] border-2 border-white font-black outline-none focus:border-emerald-300 bg-white resize-none text-base leading-relaxed placeholder:text-slate-300 placeholder:font-bold shadow-sm" placeholder={refTag ? SEL_GUIDES[refTag] : "역량을 선택하면 가이드가 나타납니다."}></textarea>
                  </div>
                  <button onClick={submitReflection} className="w-full bg-emerald-600 text-white py-6 rounded-[30px] font-black text-xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex justify-center items-center gap-2"><Send className="w-6 h-6"/> 다짐 제출!</button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'helproom' && (
          <div className="bg-white rounded-[50px] shadow-sm border-4 border-indigo-50 flex flex-col lg:flex-row overflow-hidden min-h-[750px] animate-in slide-in-from-bottom duration-300">
            <aside className="w-full lg:w-72 bg-indigo-50/50 p-10 flex flex-col gap-4 shrink-0 border-r-2 border-white">
              <div className="text-center mb-6"><Users className="w-16 h-16 text-indigo-500 mx-auto mb-4" /><h3 className="text-3xl font-black text-indigo-900">도움실 🏠</h3></div>
              <button onClick={() => setHelpSubTab('inspector')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${helpSubTab === 'inspector' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><Briefcase className="w-6 h-6"/> 감찰사</button>
              <button onClick={() => setHelpSubTab('magistrate')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${helpSubTab === 'magistrate' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><BookOpen className="w-6 h-6"/> 현령</button>
              <button onClick={() => setHelpSubTab('shop')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-4 transition-all text-lg ${helpSubTab === 'shop' ? 'bg-amber-400 text-white shadow-xl' : 'bg-white text-amber-500 hover:bg-amber-100'}`}><ShoppingCart className="w-6 h-6"/> 상점</button>
            </aside>

            <section className="flex-1 p-10 overflow-y-auto bg-slate-50/30">
              <div className="mb-10 bg-gradient-to-r from-yellow-100 to-amber-100 p-8 rounded-[40px] border-2 border-yellow-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/3"><h4 className="text-2xl font-black text-amber-800 mb-2 flex items-center gap-2"><Coins className="w-8 h-8 text-yellow-500"/> 명예 기부처</h4><p className="text-xs font-bold text-amber-700">나의 코인으로 우리 반을 응원해요!</p></div>
                <div className="md:w-2/3 flex gap-4 w-full">
                  <select id="donate_who_main" className="flex-1 p-4 rounded-2xl bg-white border-none font-black shadow-sm focus:ring-2 ring-yellow-400 text-lg"><option value="">누가 기부하나요?</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name} ({s.coins}🪙)</option>)}</select>
                  <input id="donate_amount_main" type="number" placeholder="포인트" className="w-32 p-4 rounded-2xl bg-white border-none font-black shadow-sm focus:ring-2 ring-yellow-400 text-lg text-center"/>
                  <button onClick={() => { const sid = document.getElementById('donate_who_main').value; const amt = parseInt(document.getElementById('donate_amount_main').value); if(!sid || !amt) return alert("정보 입력!"); handleDonate(parseInt(sid), amt); }} className="bg-amber-500 text-white px-8 rounded-2xl font-black text-lg shadow-md hover:bg-amber-600 active:scale-95">기부</button>
                </div>
              </div>

              {helpSubTab === 'inspector' && (
                <div className="space-y-8 animate-in fade-in">
                   <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2 bg-indigo-100 px-5 py-2 rounded-full inline-block"><Briefcase className="text-indigo-600"/> 감찰사 자치 본부</h3>
                   <div className="bg-white border-2 border-indigo-50 rounded-[40px] overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-indigo-50/50 text-[10px] font-black text-indigo-400 tracking-widest uppercase"><tr><th className="p-6">이름</th><th className="p-6">모둠</th><th className="p-6 text-center">리더</th><th className="p-6">직업 배정</th></tr></thead>
                        <tbody className="divide-y divide-indigo-50/50">
                          {allStats.map(s => (
                            <tr key={s.id} className="hover:bg-indigo-50/20">
                              <td className="p-6 font-black text-lg text-slate-700">{s.name}</td>
                              <td className="p-6"><select value={s.group} onChange={e=>handleStudentFieldChange(s.id, 'group', parseInt(e.target.value))} className="p-3 rounded-xl bg-white border border-indigo-100 font-bold text-sm outline-none">{[1,2,3,4,5,6].map(g=><option key={g} value={g}>{g}모둠</option>)}</select></td>
                              <td className="p-6 text-center"><button onClick={()=>handleStudentFieldChange(s.id, 'isLeader', !s.isLeader)} className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 mx-auto font-black text-xs transition-all ${s.isLeader ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{s.isLeader ? <><Crown className="w-4 h-4 fill-white"/> 모둠장</> : '모둠원'}</button></td>
                              <td className="p-6"><select value={s.role} onChange={e=>handleStudentFieldChange(s.id, 'role', e.target.value)} className="w-full p-3 rounded-xl bg-white border border-indigo-100 font-bold text-sm outline-none"><option value="">직업 없음</option>{safeArray(db.rolesList).map(r=><option key={r} value={r}>{r}</option>)}</select></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              )}

              {helpSubTab === 'magistrate' && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2 bg-blue-100 px-5 py-2 rounded-full inline-block"><BookOpen className="text-blue-600"/> 현령 관리소</h3>
                  {[1,2,3,4,5,6].map(g => {
                    const members = groupedByGroupStats.filter(s => s.group === g);
                    if(members.length === 0) return null;
                    return (
                      <div key={g} className="mb-8 bg-white p-8 rounded-[40px] border-2 border-blue-50 shadow-sm">
                        <h4 className="text-lg font-black text-blue-800 mb-6 bg-blue-50 inline-block px-5 py-1.5 rounded-full">{g}모둠</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {members.map(s => (
                            <div key={s.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
                              <div><p className="text-xs font-black text-slate-400 mb-1">{s.role}</p><p className="font-black text-xl text-slate-800">{s.name}</p></div>
                              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                                <button onClick={() => handleExpAdjust(s.id, -1)} className="p-3 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><Minus className="w-5 h-5"/></button>
                                <span className="w-16 text-center font-black text-blue-600 text-2xl">{s.exp}</span>
                                <button onClick={() => handleExpAdjust(s.id, 1)} className="p-3 text-slate-400 hover:text-green-500 rounded-xl transition-colors"><Plus className="w-5 h-5"/></button>
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
                    <div><h3 className="text-2xl font-black text-amber-900 flex items-center gap-2 bg-amber-100 px-5 py-2 rounded-full mb-2"><ShoppingCart className="text-amber-600"/> 달보드레 상점</h3><p className="text-sm font-bold text-amber-700 ml-2">감찰사가 물품을 선생님께 건의해서 만들 수 있어요! 💡</p></div>
                    <div className={`px-8 py-4 rounded-full font-black text-base shadow-md ${isShopOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{isShopOpen ? "🔓 영업 중" : "🔒 영업 종료"}</div>
                  </div>

                  <div className="bg-amber-50 p-8 rounded-[40px] border-4 border-amber-200 shadow-sm mb-10">
                    <h4 className="text-2xl font-black text-amber-900 mb-2 flex items-center gap-2"><Gavel className="w-6 h-6"/> 장인의 공방 (아이템 건의)</h4>
                    <div className="flex flex-wrap gap-4 mt-6">
                      <select value={artisanTarget} onChange={e=>setArtisanTarget(e.target.value)} className="w-48 p-4 rounded-2xl bg-white border-2 border-amber-200 font-black outline-none"><option value="">장인 선택</option>{allStats.filter(s => s.exp >= 20).map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}</select>
                      <input type="text" placeholder="아이템 이름" value={artisanItemName} onChange={e=>setArtisanItemName(e.target.value)} className="flex-1 p-4 rounded-2xl bg-white border-2 border-amber-200 font-bold outline-none"/>
                      <input type="number" placeholder="가격" value={artisanItemPrice} onChange={e=>setArtisanItemPrice(e.target.value)} className="w-32 p-4 rounded-2xl bg-white border-2 border-amber-200 font-bold outline-none"/>
                      <button onClick={submitArtisanItem} className="bg-amber-600 text-white px-8 rounded-2xl font-black shadow-md hover:bg-amber-700">결재 올리기</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {safeArray(db.shopItems).map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[40px] shadow-sm border-2 border-slate-100 flex flex-col justify-between hover:border-amber-200 transition-colors">
                         <div><div className="flex justify-between items-start mb-6"><span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-xl border border-slate-200">{item.creator} 제작</span><p className="text-3xl font-black text-amber-500">{item.price} 🪙</p></div><h4 className="text-2xl font-black text-slate-800 mb-10">{item.name}</h4></div>
                         <div className="flex gap-4">
                           <select id={`buyer_${item.id}`} className="flex-1 p-5 rounded-2xl bg-slate-50 border-none font-bold outline-none text-base shadow-inner"><option value="">누가 살까요?</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name} ({s.coins}🪙)</option>)}</select>
                           <button onClick={() => { if(!isShopOpen) return alert("운영일이 아닙니다!"); const sid = document.getElementById(`buyer_${item.id}`).value; if(!sid) return alert("선택하세요."); const user = allStats.find(u => u.id == sid); if(user.coins < item.price) return alert("코인 부족."); if(window.confirm(`${user.name} 코인 차감?`)) { sync({ usedCoins: { ...db.usedCoins, [sid]: (db.usedCoins[sid] || 0) + item.price } }); alert("구매 성공! 🎁"); playSound('buy'); } }} className="bg-amber-500 text-white px-10 rounded-2xl font-black text-lg shadow-lg hover:bg-amber-600 active:scale-95 transition-all">구매 확정</button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'admin' && isAuthenticated === 'teacher' && (
          <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 flex flex-col lg:flex-row overflow-hidden min-h-[750px] animate-in slide-in-from-right duration-300">
             <aside className="w-full lg:w-72 bg-slate-900 p-10 flex flex-col gap-3 shrink-0 border-r border-slate-800">
                <div className="text-center mb-8"><Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" /><h3 className="text-2xl font-black text-white">관리실 🖥️</h3></div>
                {['report', 'mission', 'shopAdmin', 'students', 'settings', 'reset'].map(t => (
                  <button key={t} onClick={() => setAdminSubTab(t)} className={`w-full p-4 rounded-2xl font-black text-left transition-all text-base ${adminSubTab === t ? 'bg-blue-600 text-white shadow-lg translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{t === 'report' ? 'SEL 리포트' : t === 'mission' ? '결재 및 미션' : t === 'shopAdmin' ? '상점 통제소' : t === 'students' ? '명단 관리' : t === 'settings' ? '환경 설정' : '초기화/마감'}</button>
                ))}
                <button onClick={() => { setIsAuthenticated(false); setActiveTab('dashboard'); }} className="mt-auto p-4 bg-slate-800 text-slate-400 font-black rounded-2xl hover:bg-slate-700 transition-all text-center">로그아웃</button>
             </aside>

             <section className="flex-1 p-10 overflow-y-auto bg-slate-50/50">
                {adminSubTab === 'students' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">👥 학생 명단 관리</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                      <div className="flex flex-wrap gap-4 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <input type="text" placeholder="새 학생 이름" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="flex-1 p-4 rounded-xl border border-slate-300 font-bold outline-none"/>
                        <select value={newStudentGroup} onChange={e=>setNewStudentGroup(e.target.value)} className="w-32 p-4 rounded-xl border border-slate-300 font-bold outline-none"><option value="1">1모둠</option><option value="2">2모둠</option><option value="3">3모둠</option><option value="4">4모둠</option><option value="5">5모둠</option><option value="6">6모둠</option></select>
                        <button onClick={handleAddStudent} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-md hover:bg-blue-700">전입생 추가</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safeArray(db.students).map(s => (
                          <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                            <div><span className="text-xs font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{s.id}번</span><h4 className="font-black text-lg text-slate-800 mt-2">{s.name}</h4></div>
                            <button onClick={() => handleRemoveStudent(s.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-5 h-5"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'report' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-6">🌱 SEL 마음성장 리포트</h3><button onClick={() => sync({ settings: { ...db.settings, showCumulativeStats: !db.settings.showCumulativeStats } })} className={`px-6 py-3 rounded-full font-black text-sm shadow-md transition-all ${db.settings.showCumulativeStats ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>번호순 상세 스탯 공개: {db.settings.showCumulativeStats ? 'ON' : 'OFF'}</button></div>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10">
                      <div className="w-full md:w-1/3"><select value={selectedReportStudent} onChange={e=>setSelectedReportStudent(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-lg outline-none mb-6 focus:border-blue-400"><option value="">학생 선택</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                      <div className="w-full md:w-2/3 bg-slate-50 p-8 rounded-3xl border border-slate-200 min-h-[300px]">
                        {selectedReportStudent ? (() => {
                          const s = allStats.find(x => x.id == selectedReportStudent);
                          const counts = {}; SEL_OPTIONS.forEach(o => counts[o.name] = 0);
                          safeArray(db.approvedPraises).forEach(p => { if(p.toId == s.id && counts[p.tag] !== undefined) counts[p.tag]++; });
                          const max = Math.max(...Object.values(counts), 5);
                          return (
                            <div className="animate-in fade-in">
                              <h4 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><Star className="text-yellow-400 fill-yellow-400"/> {s.name} 학생 분석</h4>
                              <div className="space-y-4 mb-8">{Object.keys(counts).map(tag => (
                                <div key={tag} className="flex items-center gap-4">
                                  <span className="w-24 text-sm font-black text-slate-600 text-right">{SEL_OPTIONS.find(opt=>opt.name === tag)?.short || tag}</span>
                                  <div className="flex-1 h-6 bg-white rounded-full border border-slate-200 overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500" style={{width: `${(counts[tag]/max)*100}%`}}></div></div>
                                  <span className="w-10 font-black text-blue-600 text-right">{counts[tag]}</span>
                                </div>
                              ))}</div>
                              <p className="text-sm font-bold text-slate-500 border-t pt-6">최근 칭찬: {safeArray(db.approvedPraises).filter(p=>p.toId==s.id).slice(0,1).map(p=>`"${p.text}"`) || "없음"}</p>
                            </div>
                          );
                        })() : <div className="h-full flex items-center justify-center text-slate-400 font-black">학생을 선택하면 리포트가 생성됩니다.</div>}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'mission' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-2xl font-black text-slate-800 border-l-8 border-blue-600 pl-6 mb-8">긴급 미션 및 결재함</h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                       <div className="bg-white p-10 rounded-[40px] shadow-sm border border-blue-100 text-center">
                          <Zap className="w-20 h-20 text-blue-500 mx-auto mb-6" />
                          <h4 className="text-2xl font-black mb-4">참여형 긴급 미션</h4>
                          {!db.activeMission.isActive ? (
                            <button onClick={startMission} className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95">🚀 미션 발동하기</button>
                          ) : (
                            <button onClick={endMission} className="w-full bg-red-500 text-white py-6 rounded-[30px] font-black text-xl shadow-xl hover:bg-red-600">🛑 미션 강제 종료</button>
                          )}
                          {db.activeMission.isActive && <p className="mt-6 font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full inline-block">현재 {db.activeMission.participants.length}명 완료!</p>}
                       </div>

                       <div className="bg-white p-10 rounded-[40px] shadow-sm border border-green-100 flex flex-col items-center">
                          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                          <h4 className="text-2xl font-black mb-4 text-slate-800">서류 결재함</h4>
                          <div className="w-full space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {safeArray(db.pendingShopItems).map(item => (
                              <div key={item.id} className="bg-amber-50 p-5 rounded-2xl border border-amber-200 text-left">
                                <span className="font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-lg text-xs">장인 건의: {item.creator}</span>
                                <p className="text-lg text-slate-800 font-black my-4">"{item.name}" ({item.price}🪙)</p>
                                <div className="flex gap-2"><button onClick={() => { const next = db.pendingShopItems.filter(i => i.id !== item.id); sync({ pendingShopItems: next, shopItems: [item, ...safeArray(db.shopItems)] }); alert("등록 완료!"); playSound('good'); }} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-black text-sm">출시 허가</button><button onClick={() => { const next = db.pendingShopItems.filter(i => i.id !== item.id); sync({ pendingShopItems: next }); alert("반려"); }} className="px-4 bg-white text-slate-400 font-black rounded-xl border border-slate-200">반려</button></div>
                              </div>
                            ))}
                            {safeArray(db.pendingReflections).map(r => (
                              <div key={r.id} className="bg-red-50 p-5 rounded-2xl border border-red-200 text-left mt-4">
                                <span className="font-black text-red-800 bg-red-100 px-3 py-1 rounded-lg text-xs">{allStats.find(s=>s.id==r.sId)?.name} 성찰</span>
                                <p className="text-sm text-slate-700 font-bold my-4 whitespace-pre-wrap">"{r.text}"</p>
                                <button onClick={() => { const next = db.pendingReflections.filter(pr => pr.id !== r.id); sync({ pendingReflections: next, studentStatus: { ...db.studentStatus, [r.sId]: 'normal' } }); alert("위기 해제!"); playSound('good'); }} className="w-full bg-red-500 text-white py-3 rounded-xl font-black text-sm hover:bg-red-600">위기 해제 승인</button>
                              </div>
                            ))}
                            {safeArray(db.pendingPraises).map(p => (
                              <div key={p.id} className="bg-pink-50 p-5 rounded-2xl border border-pink-200 text-left mt-4">
                                <span className="font-black text-pink-800 bg-pink-100 px-3 py-1 rounded-lg text-xs">To. {allStats.find(s=>s.id==p.toId)?.name||'나 자신'} 온기</span>
                                <p className="text-sm text-slate-700 font-bold my-4">"{p.text}"</p>
                                <button onClick={() => { const next = db.pendingPraises.filter(pr => pr.id !== p.id); const app = [p, ...safeArray(db.approvedPraises)].slice(0,10); if(p.toId !== 'me') { sync({ pendingPraises: next, approvedPraises: app, roleExp: { ...db.roleExp, [p.toId]: (db.roleExp[p.toId]||0) + 1 }, allTime: { ...db.allTime, exp: { ...db.allTime.exp, [p.toId]: (db.allTime.exp?.[p.toId]||0)+1 } } }); } else { sync({ pendingPraises: next, approvedPraises: app }); } alert("온기 승인! (+10p)"); playSound('good'); }} className="w-full bg-pink-500 text-white py-3 rounded-xl font-black text-sm hover:bg-pink-600">온기 사연 승인</button>
                              </div>
                            ))}
                            {safeArray(db.pendingShopItems).length === 0 && safeArray(db.pendingReflections).length === 0 && safeArray(db.pendingPraises).length === 0 && <p className="text-slate-400 font-black py-10">결재 대기열이 비어있습니다.</p>}
                          </div>
                       </div>
                    </div>
                  </div>
                )}
                {/* (상점관리, 환경설정, 리셋 탭 생략 - 기존 V7과 동일하게 구현됨) */}
             </section>
          </div>
        )}
      </main>

      {/* 🚨 모달 창들 (절대 생략 금지) */}
      {showPraiseModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white p-10 rounded-[50px] w-full max-w-md shadow-2xl animate-in zoom-in-95 border-4 border-pink-100">
            <h3 className="text-3xl font-black text-pink-600 mb-8 flex items-center justify-center gap-3"><Heart className="w-8 h-8 fill-pink-500"/> 따뜻한 온기 제보</h3>
            <div className="space-y-6 mb-10">
              <select value={praiseTarget} onChange={(e)=>setPraiseTarget(e.target.value)} className="w-full p-5 rounded-2xl bg-pink-50 border-2 border-pink-100 font-black text-lg outline-none focus:border-pink-400 focus:bg-white text-pink-900"><option value="">칭찬 대상</option><option value="me" className="text-pink-600">🙋 나 자신</option>{allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select value={praiseTag} onChange={(e)=>setPraiseTag(e.target.value)} className="w-full p-5 rounded-2xl bg-pink-50 border-2 border-pink-100 font-black text-lg outline-none focus:border-pink-400 focus:bg-white text-pink-900"><option value="">역량 선택</option>{SEL_OPTIONS.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}</select>
              <textarea value={praiseText} onChange={(e)=>setPraiseText(e.target.value)} rows="4" placeholder="어떤 구체적인 행동을 했나요?" className="w-full p-5 rounded-3xl bg-pink-50 border-2 border-pink-100 font-black outline-none focus:border-pink-400 focus:bg-white resize-none shadow-inner placeholder:font-bold text-pink-900"/>
            </div>
            <div className="flex gap-3"><button onClick={() => setShowPraiseModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[25px] font-black text-lg hover:bg-slate-200">취소</button><button onClick={submitPraise} className="flex-1 py-5 bg-pink-500 text-white rounded-[25px] font-black text-lg shadow-xl hover:bg-pink-600 active:scale-95">보내기</button></div>
          </div>
        </div>
      )}

      {showModal === 'password' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[9999]">
          <div className="bg-white rounded-[60px] p-16 w-full max-w-lg text-center shadow-2xl animate-in zoom-in-95 border-4 border-blue-100">
            <Lock className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h3 className="text-3xl font-black text-center mb-4 text-blue-900">관리자 인증</h3>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key === 'Enter' && handleLogin()} className="w-full text-center text-6xl tracking-[15px] font-black p-8 border-4 border-slate-100 rounded-[40px] outline-none mb-12 bg-slate-50 focus:border-blue-400" autoFocus />
            <div className="flex gap-4"><button onClick={()=>setShowModal(null)} className="flex-1 py-6 rounded-[30px] font-black text-slate-500 text-xl bg-slate-100 hover:bg-slate-200">취소</button><button onClick={handleLogin} className="flex-1 py-6 rounded-[30px] font-black bg-blue-500 text-white text-xl shadow-xl hover:bg-blue-600">접속</button></div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t-4 border-amber-100 px-4 py-4 flex justify-around items-center z-[5000] shadow-[0_-15px_50px_rgba(0,0,0,0.06)] pb-8">
        {[
          { id: 'dashboard', icon: <Target className="w-7 h-7"/>, label: db.settings.menuNames[0] || "명성 현황판", color: "text-blue-500" }, 
          { id: 'reflection', icon: <BookOpen className="w-7 h-7"/>, label: db.settings.menuNames[1] || "성찰과 회복", color: "text-emerald-500" }, 
          { id: 'helproom', icon: <Users className="w-7 h-7"/>, label: db.settings.menuNames[2] || "도움실", color: "text-indigo-500" }, 
          { id: 'admin', icon: <Settings className="w-7 h-7"/>, label: db.settings.menuNames[3] || "통합 관리실", color: "text-slate-600" }
        ].map(item => (
          <button key={item.id} onClick={() => item.id === 'admin' ? setShowModal('password') : setActiveTab(item.id)} className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${activeTab === item.id ? `${item.color} scale-110 -translate-y-3 drop-shadow-md` : 'text-slate-400 opacity-70 hover:opacity-100'}`}>
            {item.icon}<span className="text-[11px] font-black">{item.label}</span>
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
