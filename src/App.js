/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Trophy, ShieldCheck, Heart, Lock, History, Save, X, 
  Plus, Minus, AlertTriangle, Sparkles, Star, Target, Settings, 
  Trash2, ShoppingCart, CheckCircle2, BookOpen, UserCheck, Briefcase, 
  Zap, Gift, Send, Coins
} from 'lucide-react';

// ==========================================
// 🚨 파이어베이스 주소 (반드시 본인의 주소를 넣어주세요)
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/"; 
// ==========================================

const safeArray = (val) => (Array.isArray(val) ? val.filter(Boolean) : (typeof val === 'object' && val ? Object.values(val).filter(Boolean) : []));

const defaultStudents = Array.from({ length: 26 }, (_, i) => ({ id: i + 1, name: `학생${i + 1}`, role: '향리', group: Math.floor(i / 4) + 1, isLeader: false }));

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, reflection, helproom, admin
  const [helpSubTab, setHelpSubTab] = useState('magistrate'); // magistrate, inspector, shop
  const [adminSubTab, setAdminSubTab] = useState('settings'); // settings, mission, reset
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null);

  // --- 핵심 상태 (파이어베이스 동기화) ---
  const [students, setStudents] = useState(defaultStudents);
  const [settings, setSettings] = useState({
    title: "달보드레 마음성장 대시보드",
    menuNames: ["명성 현황판", "성찰과 회복", "도움실", "통합 관리실"],
    targetScore: 3000,
    forceShopOpen: false,
    weeklyTheme: "관계 기술 🤝",
    themeGuides: {
      "자기 인식": "상황: 내가 언제 화가 났는지... 부족: 내 감정을 몰랐어요... 다짐: 다음엔 멈춰서 감정을 읽을래요.",
      "자기 관리": "상황: 규칙을 깜빡했을 때... 부족: 조절력이 부족했어요... 다짐: 다음엔 메모해서 챙길게요.",
      "사회적 인식": "상황: 친구가 울고 있을 때... 행동: 다가가 위로했어요... 효과: 친구가 웃음을 되찾았어요.",
      "관계 기술": "상황: 모둠 활동 중에... 행동: 친구의 말을 끝까지 들었어요... 효과: 활동이 잘 마무리됐어요.",
      "책임 있는 의사결정": "상황: 바닥에 쓰레기를 봤을 때... 선택: 내 쓰레기는 아니지만 주웠어요... 결과: 교실이 깨끗해졌어요."
    }
  });

  const [roleExp, setRoleExp] = useState({}); 
  const [usedCoins, setUsedCoins] = useState({}); 
  const [penaltyCount, setPenaltyCount] = useState({}); 
  const [studentStatus, setStudentStatus] = useState({}); 
  const [pendingReflections, setPendingReflections] = useState([]); 
  const [pendingPraises, setPendingPraises] = useState([]); 
  const [approvedPraises, setApprovedPraises] = useState([]); 
  const [donations, setDonations] = useState([]);
  const [funding, setFunding] = useState([{ id: 1, name: "체육 한 시간 더", target: 1000, current: 0 }, { id: 2, name: "금요일 팝콘 파티", target: 2000, current: 0 }]);
  const [shopItems, setShopItems] = useState([{ id: 'i1', name: '달보드레 연필', price: 30, creator: '기본' }]);
  const [shieldPoints, setShieldPoints] = useState(100);

  // --- 실시간 동기화 ---
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch(`${DATABASE_URL}v43Data.json`);
        const data = await res.json();
        if (data) {
          if (data.students) setStudents(safeArray(data.students));
          if (data.settings) setSettings(prev => ({...prev, ...data.settings}));
          setRoleExp(data.roleExp || {});
          setUsedCoins(data.usedCoins || {});
          setPenaltyCount(data.penaltyCount || {});
          setStudentStatus(data.studentStatus || {});
          setPendingReflections(safeArray(data.pendingReflections));
          setPendingPraises(safeArray(data.pendingPraises));
          setApprovedPraises(safeArray(data.approvedPraises));
          setDonations(safeArray(data.donations));
          setFunding(safeArray(data.funding));
          setShopItems(safeArray(data.shopItems));
          setShieldPoints(data.shieldPoints ?? 100);
        }
      } catch (e) {}
      setIsLoading(false);
    };
    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, []);

  const sync = async (updates) => {
    try { await fetch(`${DATABASE_URL}v43Data.json`, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  // --- 계산 로직 ---
  const allStats = useMemo(() => {
    return students.map(s => {
      const exp = roleExp[s.id] || 0;
      const coins = Math.max(0, exp * 10 - (usedCoins[s.id] || 0));
      let mastery = { label: '🌱 인턴', color: 'text-green-600', bg: 'bg-green-50' };
      if (exp >= 20) mastery = { label: '👑 장인', color: 'text-amber-600', bg: 'bg-amber-50' };
      else if (exp >= 10) mastery = { label: '💎 전문가', color: 'text-blue-600', bg: 'bg-blue-50' };
      return { ...s, exp, coins, mastery, status: studentStatus[s.id] || 'normal' };
    });
  }, [students, roleExp, usedCoins, studentStatus]);

  // 🔥 [업데이트] 위기 학생 최상단 정렬 로직 추가
  const sortedDashboardStats = useMemo(() => {
    return [...allStats].sort((a, b) => {
      const statusOrder = { crisis: 0, pending: 1, normal: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.id - b.id; // 상태가 같으면 번호순 정렬
    });
  }, [allStats]);

  const classReputation = useMemo(() => {
    const baseRep = allStats.reduce((sum, s) => sum + s.exp * 10 - (penaltyCount[s.id] || 0) * 20, 0);
    const donationSum = donations.reduce((sum, d) => sum + d.amount, 0);
    return Math.max(0, baseRep + donationSum);
  }, [allStats, penaltyCount, donations]);

  const isShopOpen = useMemo(() => {
    const today = new Date().getDay(); // 4 = Thursday
    return settings.forceShopOpen || today === 4;
  }, [settings.forceShopOpen]);

  // --- 핸들러 ---
  const handleEmergencyMission = (type) => {
    const points = type === 'all' ? 26 : 13;
    if(window.confirm(`긴급 미션 ${type === 'all' ? '전원 완수(+26p)' : '부분 완수(+13p)'}를 반영할까요?`)) {
      const newDonations = [{ id: Date.now(), name: "📢 긴급 미션", amount: points }, ...donations].slice(0, 15);
      sync({ donations: newDonations });
      alert("학급 명성에 미션 보너스가 반영되었습니다!");
    }
  };

  const handleDonate = (sId, amount) => {
    const user = allStats.find(s => s.id === sId);
    if (!user || user.coins < amount) return alert("코인이 부족합니다.");
    const newDonations = [{ id: Date.now(), name: user.name, amount }, ...donations].slice(0, 15);
    sync({ 
      usedCoins: { ...usedCoins, [sId]: (usedCoins[sId] || 0) + amount },
      donations: newDonations
    });
    alert(`${user.name}님의 소중한 기부로 우리 반 명성이 올라갔습니다!`);
  };

  const handleFund = (fId, sId, amount) => {
    const user = allStats.find(s => s.id === sId);
    if (!user || user.coins < amount) return alert("코인이 부족합니다.");
    const newFunding = funding.map(f => f.id === fId ? { ...f, current: f.current + amount } : f);
    sync({ 
      usedCoins: { ...usedCoins, [sId]: (usedCoins[sId] || 0) + amount },
      funding: newFunding
    });
    alert("펀딩에 성공적으로 투자했습니다!");
  };

  const handleLogin = () => {
    if (password === "6505" || password === "1111") {
      setIsAuthenticated(password === "6505" ? 'teacher' : 'inspector');
      setActiveTab('admin'); setShowModal(null); setPassword("");
    } else alert("비밀번호 오류");
  };

  const factoryReset = () => {
    if(window.prompt("정말 초기화하시겠습니까? '초기화'를 입력하세요") === "초기화") {
      sync({ roleExp: {}, usedCoins: {}, penaltyCount: {}, studentStatus: {}, pendingReflections: [], pendingPraises: [], approvedPraises: [], donations: [], funding: [{ id: 1, name: "체육 한 시간 더", target: 1000, current: 0 }, { id: 2, name: "금요일 팝콘 파티", target: 2000, current: 0 }], shieldPoints: 100 });
      alert("모든 데이터가 리셋되었습니다.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black text-2xl">사회정서 학습장 로딩 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800 transition-all">
      {/* 1. 상단 전광판 (명성 & 쉴드) */}
      <header className="bg-slate-900 text-white p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-[100px] opacity-20"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="text-center md:text-left">
            <h1 className="text-blue-400 font-black text-sm uppercase tracking-[0.3em] mb-2">{settings.title}</h1>
            <div className="flex items-baseline gap-4">
              <span className="text-8xl font-black tracking-tighter">{classReputation}</span>
              <span className="text-3xl font-black text-blue-300">points</span>
            </div>
            <div className="w-full md:w-[500px] h-4 bg-slate-800 rounded-full mt-6 overflow-hidden border border-slate-700">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-1000" style={{ width: `${Math.min((classReputation/settings.targetScore)*100, 100)}%` }}></div>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-2">최종 목표: {settings.targetScore}p 도달하기</p>
          </div>
          
          <div className="flex flex-col items-center bg-slate-800/50 p-6 rounded-[40px] border border-slate-700 backdrop-blur-md">
            <ShieldCheck className="w-12 h-12 text-green-400 mb-2 animate-pulse" />
            <span className="text-xs font-black text-slate-400 uppercase">Reputation Shield</span>
            <span className="text-4xl font-black text-white">{shieldPoints}%</span>
            <div className="flex gap-1 mt-3">
              {Array.from({length: 5}).map((_, i) => <div key={i} className={`w-8 h-2 rounded-full ${shieldPoints > i*20 ? 'bg-green-500' : 'bg-slate-700'}`}></div>)}
            </div>
          </div>
        </div>
      </header>

      {/* 2. 흘러가는 공지사항 (기부 & 온기) */}
      <div className="bg-indigo-600 text-white py-3 overflow-hidden shadow-lg border-y border-indigo-500 relative z-20">
        <div className="whitespace-nowrap animate-[shimmer_30s_linear_infinite] flex gap-20 text-sm font-black">
          <span className="flex gap-4">💎 기부 천사: {donations.map(d => `${d.name}(${d.amount}p)`).join(' · ') || '기부 내역이 없습니다.'}</span>
          <span className="flex gap-4 text-pink-200">💌 온기 소식: {approvedPraises.map(p => `[${p.tag}] ${allStats.find(s=>s.id==p.toId)?.name}: "${p.text}"`).join(' · ') || '따뜻한 소식을 기다립니다.'}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* 📄 PAGE 1: 명성 현황판 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* 이주의 테마 & 펀딩 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-blue-100 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-50 rounded-full"></div>
                <h3 className="text-lg font-black text-blue-600 mb-2 flex items-center gap-2"><Zap className="w-5 h-5"/> 이번 주 마음성장 테마</h3>
                <p className="text-3xl font-black text-slate-800">{settings.weeklyTheme}</p>
                <p className="text-xs font-bold text-slate-400 mt-4 leading-relaxed">테마에 맞는 온기 제보 시<br/>학급 명성 보너스가 부여됩니다.</p>
              </div>
              
              <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-amber-100 flex flex-col justify-between">
                <h3 className="text-lg font-black text-amber-600 mb-6 flex items-center gap-2"><Target className="w-5 h-5"/> 진행 중인 학급 크라우드 펀딩</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {funding.map(f => (
                    <div key={f.id} className="space-y-2">
                      <div className="flex justify-between items-end font-black text-sm"><span>{f.name}</span><span className="text-amber-500">{Math.floor((f.current/f.target)*100)}%</span></div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100"><div className="h-full bg-amber-400 transition-all" style={{width:`${Math.min((f.current/f.target)*100,100)}%`}}></div></div>
                      <p className="text-[10px] font-bold text-slate-400 text-right">{f.current} / {f.target} 🪙</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
              <h2 className="text-2xl font-black flex items-center gap-2"><Users className="text-slate-700"/> 개인 상태 및 코인 현황</h2>
              <button onClick={() => setShowPraiseModal(true)} className="w-full sm:w-auto bg-pink-100 text-pink-600 px-6 py-3 rounded-full font-black text-sm hover:bg-pink-200 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"><Heart className="w-5 h-5"/> 온기 보내기</button>
            </div>
            
            {/* 🔥 정렬된 상태(sortedDashboardStats)로 출력 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedDashboardStats.map(s => (
                <div key={s.id} className={`p-6 rounded-[40px] border-2 shadow-sm transition-all relative ${s.status === 'crisis' ? 'bg-red-50 border-red-200 ring-4 ring-red-100' : (s.status === 'pending' ? 'bg-orange-50 border-orange-200 ring-4 ring-orange-100' : 'bg-white border-slate-100 hover:border-blue-300')}`}>
                  <div className="flex justify-between items-start mb-6">
                    <span className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xl">{s.id}</span>
                    <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">My Coins</p><p className="font-black text-blue-600 text-xl">{s.coins} 🪙</p></div>
                  </div>
                  <div className="mb-6">
                    <p className="text-xs font-black text-slate-400 mb-1">{s.group}모둠 · {s.role}</p>
                    <h3 className="text-2xl font-black flex items-center gap-2">{s.name} {s.isLeader && <Crown className="w-5 h-5 text-amber-400 fill-amber-400"/>}</h3>
                  </div>
                  <div className={`text-[11px] font-black px-4 py-2 rounded-xl inline-block shadow-sm ${s.mastery.bg} ${s.mastery.color}`}>숙련도: {s.mastery.label}</div>
                  
                  {s.status === 'crisis' && <div className="mt-6 p-4 bg-red-500 text-white rounded-2xl text-center font-black text-sm animate-pulse shadow-md">🚨 성찰 요망 (행동 수정 필요)</div>}
                  {s.status === 'pending' && <div className="mt-6 p-4 bg-orange-500 text-white rounded-2xl text-center font-black text-sm shadow-md">⏳ 실천 검수 대기중</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📄 PAGE 2: 성찰과 회복 */}
        {activeTab === 'reflection' && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="bg-white p-12 rounded-[50px] shadow-sm border border-slate-100 text-center">
                <BookOpen className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-black mb-2">성찰과 회복 센터</h2>
                <p className="text-slate-400 font-bold mb-10">나의 선택을 돌아보고 공동체의 신뢰를 회복합니다.</p>
                <div className="text-left space-y-8 bg-slate-50 p-10 rounded-[40px] border border-slate-200">
                  <div>
                    <label className="block text-sm font-black mb-3 text-slate-500">1. 이름을 선택하세요</label>
                    <select value={refTarget} onChange={e=>setRefTarget(e.target.value)} className="w-full p-5 rounded-3xl border-2 border-slate-200 font-black outline-none focus:border-green-400 bg-white">
                      <option value="">성찰 대상자 명단</option>
                      {allStats.filter(s => s.status === 'crisis').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black mb-3 text-slate-500">2. 어떤 마음성장 역량이 부족했나요?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(settings.themeGuides).map(t => (
                        <button key={t} onClick={() => setPraiseTag(t)} className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${praiseTag === t ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-green-200'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black mb-3 text-slate-500">3. 공언하기 (성찰과 다짐)</label>
                    <textarea value={refText} onChange={e=>setRefText(e.target.value)} rows="4" className="w-full p-6 rounded-[30px] border-2 border-slate-200 font-black outline-none focus:border-green-400 bg-white resize-none" placeholder={praiseTag ? settings.themeGuides[praiseTag] : "역량을 먼저 선택하면 예시 가이드가 나타납니다."}></textarea>
                  </div>
                  <button onClick={() => {
                    if(!refTarget || !praiseTag || !refText) return alert("모든 항목을 입력해주세요.");
                    const nextList = [{ id: Date.now(), sId: refTarget, tag: praiseTag, text: refText, date: new Date().toLocaleDateString() }, ...pendingReflections];
                    setPendingReflections(nextList);
                    sync({ pendingReflections: nextList, studentStatus: { ...studentStatus, [refTarget]: 'pending' } });
                    setRefTarget(""); setRefText(""); setPraiseTag("");
                    alert("공언이 제출되었습니다! 이제 실물 미션을 수행하고 확인받으세요.");
                  }} className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black text-xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all">📝 성찰 내용 제출하기</button>
                </div>
             </div>
          </div>
        )}

        {/* 📄 PAGE 3: 도움실 (현령, 감찰사, 상점) */}
        {activeTab === 'helproom' && (
          <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 flex flex-col lg:flex-row overflow-hidden min-h-[750px] animate-in slide-in-from-bottom duration-300">
            <aside className="w-full lg:w-72 bg-indigo-50/50 p-10 flex flex-col gap-3 shrink-0">
              <div className="text-center mb-6"><UserCheck className="w-14 h-14 text-indigo-600 mx-auto mb-4" /><h3 className="text-2xl font-black text-indigo-900">학급 도움실</h3></div>
              <button onClick={() => setHelpSubTab('magistrate')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-3 transition-all ${helpSubTab === 'magistrate' ? 'bg-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><BookOpen className="w-5 h-5"/> 현령 업무</button>
              <button onClick={() => setHelpSubTab('inspector')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-3 transition-all ${helpSubTab === 'inspector' ? 'bg-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><Briefcase className="w-5 h-5"/> 감찰사 업무</button>
              <button onClick={() => setHelpSubTab('shop')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-3 transition-all ${helpSubTab === 'shop' ? 'bg-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white text-indigo-400 hover:bg-indigo-100'}`}><ShoppingCart className="w-5 h-5"/> 학급 상점</button>
              
              <div className="mt-auto p-6 bg-white rounded-3xl border border-indigo-100 shadow-inner">
                <h4 className="text-[10px] font-black text-indigo-300 uppercase mb-4 tracking-widest">명예로운 기부처</h4>
                <select id="donate_who" className="w-full p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none mb-2">
                  <option value="">누가 기부하나요?</option>
                  {allStats.map(s => <option key={s.id} value={s.id}>{s.name}({s.coins}🪙)</option>)}
                </select>
                <input id="donate_amount" type="number" placeholder="기부할 포인트" className="w-full p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none mb-3"/>
                <button onClick={() => {
                  const sid = document.getElementById('donate_who').value;
                  const amt = parseInt(document.getElementById('donate_amount').value);
                  if(!sid || !amt) return alert("정보를 모두 입력하세요.");
                  handleDonate(parseInt(sid), amt);
                }} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-xs shadow-md hover:bg-indigo-700">기부하기 (명성 상승)</button>
              </div>
            </aside>

            <section className="flex-1 p-10 overflow-y-auto bg-slate-50/30">
              {helpSubTab === 'magistrate' && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-slate-800 mb-8 border-l-8 border-indigo-600 pl-6">현령: 1인 1역 숙련도 관리</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allStats.map(s => (
                      <div key={s.id} className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
                        <div><p className="text-[10px] font-black text-slate-400 mb-1">{s.role}</p><p className="font-black text-lg">{s.name}</p></div>
                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border">
                          <button onClick={() => {
                             sync({ roleExp: { ...roleExp, [s.id]: Math.max(0, (roleExp[s.id]||0) - 1) } });
                          }} className="p-3 text-slate-400 hover:text-red-500"><Minus className="w-4 h-4"/></button>
                          <span className="w-14 text-center font-black text-indigo-600 text-xl">{s.exp}회</span>
                          <button onClick={() => {
                             sync({ roleExp: { ...roleExp, [s.id]: (roleExp[s.id]||0) + 1 } });
                          }} className="p-3 text-slate-400 hover:text-blue-500"><Plus className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {helpSubTab === 'inspector' && (
                <div className="space-y-6">
                   <h3 className="text-3xl font-black text-slate-800 mb-8 border-l-8 border-indigo-600 pl-6">감찰사: 인사 배정 관리</h3>
                   <div className="bg-white border rounded-[40px] overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-indigo-50 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          <tr><th className="p-6">학생명</th><th className="p-6">모둠</th><th className="p-6 text-center">리더</th><th className="p-6">직업 배정</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {allStats.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-6 font-black">{s.name}</td>
                              <td className="p-6"><select value={s.group} onChange={e=>{
                                const next = students.map(st => st.id === s.id ? {...st, group: parseInt(e.target.value)} : st);
                                setStudents(next); sync({students: next});
                              }} className="p-2 rounded-lg bg-slate-100 border-none font-bold text-xs outline-none">{[1,2,3,4,5,6].map(g=><option key={g} value={g}>{g}모둠</option>)}</select></td>
                              <td className="p-6 text-center"><button onClick={()=>{
                                const next = students.map(st => st.id === s.id ? {...st, isLeader: !st.isLeader} : st);
                                setStudents(next); sync({students: next});
                              }} className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all ${s.isLeader ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-300'}`}><Crown className="w-5 h-5"/></button></td>
                              <td className="p-6"><select value={s.role} onChange={e=>{
                                const next = students.map(st => st.id === s.id ? {...st, role: e.target.value} : st);
                                setStudents(next); sync({students: next});
                              }} className="w-full p-2 rounded-lg bg-slate-100 border-none font-bold text-xs outline-none"><option value="">직업 없음</option><option value="현령">현령</option><option value="감찰사">감찰사</option><option value="향리">향리</option></select></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              )}

              {helpSubTab === 'shop' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-amber-500 pl-6">학급 상점</h3>
                    <div className={`px-6 py-2 rounded-full font-black text-sm shadow-md ${isShopOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{isShopOpen ? "🔓 상점 영업 중" : "🔒 영업 종료 (목요일만)"}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {shopItems.map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between">
                         <div>
                            <div className="flex justify-between items-start mb-4"><span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full">{item.creator} 제작</span><p className="text-2xl font-black text-amber-500">{item.price} 🪙</p></div>
                            <h4 className="text-xl font-black text-slate-700 mb-8">{item.name}</h4>
                         </div>
                         <div className="flex gap-2">
                           <select id={`buyer_${item.id}`} className="flex-1 p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none text-sm">
                             <option value="">구매자 선택</option>
                             {allStats.map(s => <option key={s.id} value={s.id}>{s.name}({s.coins}🪙)</option>)}
                           </select>
                           <button onClick={() => {
                             if(!isShopOpen) return alert("오늘은 목요일이 아닙니다!");
                             const sid = document.getElementById(`buyer_${item.id}`).value;
                             if(!sid) return alert("학생을 선택하세요.");
                             const user = allStats.find(u => u.id == sid);
                             if(user.coins < item.price) return alert("코인이 부족합니다.");
                             if(window.confirm(`${user.name}님의 코인을 차감할까요?`)) {
                               sync({ usedCoins: { ...usedCoins, [sid]: (usedCoins[sid] || 0) + item.price } });
                               alert("결제 완료!");
                             }
                           }} className="bg-amber-500 text-white px-8 rounded-2xl font-black shadow-lg hover:bg-amber-600 active:scale-95 transition-all">구매</button>
                         </div>
                      </div>
                    ))}
                    {/* 펀딩 프로젝트 */}
                    {funding.map(f => (
                      <div key={f.id} className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[40px] shadow-xl text-white">
                        <h4 className="text-xl font-black mb-2 flex items-center gap-2"><Target className="w-5 h-5 text-blue-300"/> {f.name} (펀딩)</h4>
                        <p className="text-xs text-blue-200 mb-6">십시일반 코인을 모아주세요!</p>
                        <div className="flex justify-between items-end text-sm font-black mb-2"><span>진행도: {f.current}p</span><span>목표: {f.target}p</span></div>
                        <div className="w-full h-4 bg-white/20 rounded-full mb-8 overflow-hidden"><div className="h-full bg-white transition-all shadow-[0_0_10px_white]" style={{width:`${(f.current/f.target)*100}%`}}></div></div>
                        <div className="flex gap-2">
                           <select id={`funder_${f.id}`} className="flex-1 p-3 rounded-xl bg-white/10 border-none text-white font-bold outline-none text-xs">
                             <option value="" className="text-black">투자자 선택</option>
                             {allStats.map(s => <option key={s.id} value={s.id} className="text-black">{s.name}({s.coins}🪙)</option>)}
                           </select>
                           <input id={`f_amt_${f.id}`} type="number" placeholder="금액" className="w-20 p-3 rounded-xl bg-white/10 border-none text-white font-bold outline-none text-xs placeholder:text-blue-300"/>
                           <button onClick={() => {
                             const sid = document.getElementById(`funder_${f.id}`).value;
                             const amt = parseInt(document.getElementById(`f_amt_${f.id}`).value);
                             if(!sid || !amt) return alert("입력 오류");
                             handleFund(f.id, parseInt(sid), amt);
                           }} className="bg-white text-blue-600 px-5 rounded-xl font-black shadow-lg hover:bg-blue-50 transition-all text-xs">투자</button>
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
        {activeTab === 'admin' && isAuthenticated && (
          <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 flex flex-col lg:flex-row overflow-hidden min-h-[750px] animate-in slide-in-from-right duration-300">
             <aside className="w-full lg:w-72 bg-slate-900 p-10 flex flex-col gap-3 shrink-0">
                <div className="text-center mb-8"><Lock className="w-14 h-14 text-blue-500 mx-auto mb-4" /><h3 className="text-2xl font-black text-white">관리자 센터</h3></div>
                <button onClick={() => setAdminSubTab('mission')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-3 transition-all ${adminSubTab === 'mission' ? 'bg-blue-600 text-white shadow-xl translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Zap className="w-5 h-5"/> 긴급 & 승인</button>
                <button onClick={() => setAdminSubTab('settings')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-3 transition-all ${adminSubTab === 'settings' ? 'bg-blue-600 text-white shadow-xl translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Settings className="w-5 h-5"/> 시스템 설정</button>
                <button onClick={() => setAdminSubTab('reset')} className={`w-full p-5 rounded-3xl font-black text-left flex items-center gap-3 transition-all ${adminSubTab === 'reset' ? 'bg-red-600 text-white shadow-xl translate-x-2' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Trash2 className="w-5 h-5"/> 데이터 리셋</button>
                <button onClick={() => { setIsAuthenticated(false); setActiveTab('dashboard'); }} className="mt-auto p-5 bg-slate-800 text-slate-400 font-black rounded-3xl hover:bg-slate-700 transition-all">관리자 로그아웃</button>
             </aside>

             <section className="flex-1 p-10 overflow-y-auto bg-slate-50/50">
                {adminSubTab === 'mission' && (
                  <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6">긴급 미션 및 최종 승인</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white p-10 rounded-[50px] shadow-sm border border-blue-100 flex flex-col items-center text-center">
                          <Zap className="w-16 h-16 text-blue-500 mb-6 animate-bounce" />
                          <h4 className="text-2xl font-black mb-4">전원 과제 완수 미션</h4>
                          <p className="text-slate-400 font-bold mb-8 italic">수업 시간 중 결정적인 집중이 필요할 때!<br/>성공 시 학급 명성이 오릅니다.</p>
                          <div className="flex gap-4 w-full">
                            <button onClick={() => handleEmergencyMission('all')} className="flex-1 bg-blue-600 text-white py-5 rounded-[30px] font-black shadow-xl hover:bg-blue-700">전원 성공 (+26p)</button>
                            <button onClick={() => handleEmergencyMission('half')} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-[30px] font-black hover:bg-slate-200">일부 성공 (+13p)</button>
                          </div>
                       </div>
                       
                       <div className="bg-white p-10 rounded-[50px] shadow-sm border border-green-100 flex flex-col items-center text-center">
                          <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
                          <h4 className="text-2xl font-black mb-4">성찰 및 회복 최종 승인</h4>
                          <p className="text-slate-400 font-bold mb-8 italic">위기 상태의 학생이 실천을 완료했나요?<br/>승인 시 해당 학생의 위기가 해제됩니다.</p>
                          <div className="w-full space-y-4">
                            {pendingReflections.length === 0 ? <p className="text-slate-300 font-black py-4">대기 중인 성찰문이 없습니다.</p> : pendingReflections.map(r => (
                              <div key={r.id} className="bg-slate-50 p-6 rounded-3xl border text-left">
                                <div className="flex justify-between font-black mb-2 text-sm"><span>{allStats.find(s=>s.id==r.sId)?.name}</span><span className="text-green-600">{r.tag}</span></div>
                                <p className="text-xs text-slate-500 font-bold mb-4">"{r.text}"</p>
                                <div className="flex gap-2">
                                  <button onClick={() => {
                                    const next = pendingReflections.filter(pr => pr.id !== r.id);
                                    setPendingReflections(next);
                                    sync({ pendingReflections: next, studentStatus: { ...studentStatus, [r.sId]: 'normal' } });
                                    alert("위기 해제 완료!");
                                  }} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-black">승인</button>
                                  <button onClick={() => {
                                    const next = pendingReflections.filter(pr => pr.id !== r.id);
                                    setPendingReflections(next);
                                    sync({ pendingReflections: next, studentStatus: { ...studentStatus, [r.sId]: 'crisis' } });
                                    alert("반려됨.");
                                  }} className="px-4 bg-slate-200 text-slate-500 py-2 rounded-xl text-xs font-black">반려</button>
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
                    <h3 className="text-3xl font-black text-slate-800 border-l-8 border-blue-600 pl-6">시스템 텍스트 & 테마 커스텀</h3>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div><label className="block text-sm font-black text-slate-400 mb-3">대시보드 메인 타이틀</label><input type="text" value={settings.title} onChange={e=>setSettings({...settings, title: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-black outline-none focus:ring-4 ring-blue-50"/></div>
                          <div><label className="block text-sm font-black text-slate-400 mb-3">이주의 마음성장 테마</label><input type="text" value={settings.weeklyTheme} onChange={e=>setSettings({...settings, weeklyTheme: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-black outline-none focus:ring-4 ring-blue-50"/></div>
                       </div>
                       <div className="pt-6 border-t">
                          <label className="block text-sm font-black text-slate-400 mb-3">하단 메뉴 이름 수정 (4개 순서대로)</label>
                          <div className="grid grid-cols-4 gap-4">
                            {settings.menuNames.map((n, i) => (
                              <input key={i} type="text" value={n} onChange={e => {
                                const next = [...settings.menuNames]; next[i] = e.target.value;
                                setSettings({...settings, menuNames: next});
                              }} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-black text-center outline-none text-xs"/>
                            ))}
                          </div>
                       </div>
                       <div className="flex gap-4 pt-8">
                         <button onClick={() => sync({ settings })} className="flex-1 bg-blue-600 text-white py-5 rounded-[30px] font-black shadow-xl hover:bg-blue-700 transition-all">설정 내용 일괄 저장</button>
                         <button onClick={() => sync({ settings: { ...settings, forceShopOpen: !settings.forceShopOpen } })} className={`px-10 py-5 rounded-[30px] font-black transition-all ${settings.forceShopOpen ? 'bg-amber-500 text-white shadow-xl' : 'bg-slate-200 text-slate-500'}`}>상점 강제 개방: {settings.forceShopOpen ? 'ON' : 'OFF'}</button>
                       </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'reset' && (
                  <div className="text-center py-20">
                     <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                     <h3 className="text-4xl font-black mb-4 text-slate-800">시스템 완전 초기화</h3>
                     <p className="text-slate-400 font-bold mb-12">초기화 시 모든 데이터가 '0'이 됩니다.<br/>테스트 종료 후 학기 초에 한 번만 사용하세요.</p>
                     <button onClick={factoryReset} className="bg-red-600 text-white px-16 py-6 rounded-[35px] font-black text-2xl shadow-2xl hover:bg-red-700 active:scale-95 transition-all">공장 초기화 실행</button>
                  </div>
                )}
             </section>
          </div>
        )}
      </main>

      {/* 온기 우체통 모달 */}
      {showPraiseModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white p-8 rounded-[40px] w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-pink-600 mb-6 flex items-center gap-2"><Heart/> 따뜻한 온기 제보</h3>
            <div className="space-y-4 mb-8">
              <select value={praiseTarget} onChange={(e)=>setPraiseTarget(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-pink-300">
                <option value="">누구를 칭찬할까요?</option>
                <option value="me" className="text-pink-600">🙋 나 자신 (스스로 칭찬하기)</option>
                {allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={praiseTag} onChange={(e)=>setPraiseTag(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-pink-300">
                <option value="">어떤 역량인가요?</option>
                {Object.keys(settings.themeGuides).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea value={praiseText} onChange={(e)=>setPraiseText(e.target.value)} rows="3" placeholder="어떤 구체적인 행동을 했는지 적어주세요!" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-pink-300 resize-none"/>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPraiseModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200">취소</button>
              <button onClick={submitPraise} className="flex-1 py-4 bg-pink-500 text-white rounded-2xl font-black shadow-lg hover:bg-pink-600">보내기</button>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 로그인 모달 */}
      {showModal === 'password' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[9999]">
          <div className="bg-white rounded-[50px] p-12 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <Lock className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-800 mb-8">관리자 접속</h3>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-4xl tracking-[15px] font-black p-6 border-4 border-slate-100 rounded-3xl outline-none mb-8 bg-slate-50 focus:border-blue-400" autoFocus />
            <div className="flex gap-4"><button onClick={() => setShowModal(null)} className="flex-1 py-5 rounded-2xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button><button onClick={handleLogin} className="flex-1 py-5 rounded-2xl font-black bg-slate-800 text-white shadow-lg hover:bg-slate-900">접속</button></div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t-2 border-slate-200 px-4 py-4 flex justify-around items-center z-[5000] shadow-[0_-15px_50px_rgba(0,0,0,0.08)] pb-10">
        {[
          { id: 'dashboard', icon: <Target className="w-6 h-6"/>, label: settings.menuNames[0] || "현황판" }, 
          { id: 'reflection', icon: <BookOpen className="w-6 h-6"/>, label: settings.menuNames[1] || "성찰과 회복" }, 
          { id: 'helproom', icon: <Users className="w-6 h-6"/>, label: settings.menuNames[2] || "도움실" }, 
          { id: 'admin', icon: <Settings className="w-6 h-6"/>, label: settings.menuNames[3] || "통합 관리실" }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => item.id === 'admin' && !isAuthenticated ? setShowModal('password') : setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${activeTab === item.id ? 'text-blue-600 scale-110 -translate-y-2' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
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
        .slide-in-from-bottom { animation-name: slideInBottom; }
        .slide-in-from-right { animation-name: slideInRight; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInBottom { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default App;
