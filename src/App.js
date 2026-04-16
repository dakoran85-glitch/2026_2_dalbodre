/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Trophy, RefreshCcw, ShieldCheck, 
  Volume2, Heart, Clock, Lock, BarChart3, History, Save, X, 
  Minus, Plus, MinusCircle, PlusCircle, AlertTriangle, Database, Gift, UserPlus, RotateCcw, Star, Loader2, Target, Settings, Trash2, ShoppingCart, SlidersHorizontal, Sparkles, Zap, Flame, Crown, Sword, Coins, BookOpen, Briefcase, LayoutDashboard, ClipboardCheck, User
} from 'lucide-react';

const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/"; 

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'good') { osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); osc.type = 'sine'; }
    else if (type === 'bad') { osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); osc.type = 'sawtooth'; }
    else if (type === 'gacha' || type === 'buy') { osc.frequency.setValueAtTime(400, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3); osc.type = 'square'; }
    else if (type === 'jackpot') { osc.type = 'triangle'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3); }
    else if (type === 'drumroll') { osc.type = 'square'; osc.frequency.setValueAtTime(100, ctx.currentTime); osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 3); }
    osc.start(); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3); osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
};

const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
};

const App = () => {
  const scriptURL = "https://script.google.com/macros/s/AKfycbw3j6LxhdO0ewIXxkIGrh_pczxrfOJr3A_PTHTsJY1rKb6ES7bPxPQuxRKidd6IWK5_/exec"; 
  const fmt = (num) => { const n = parseFloat(num); return isNaN(n) ? 0 : parseFloat(n.toFixed(2)); };
  const getRoleBonus = (role) => { if (!role) return 1; if (role.includes('감찰사')) return 2; if (role.includes('현령')) return 1.5; return 1; };

  // --- 상태 관리 ---
  const [activeTab, setActiveTab] = useState('classroom'); // 'classroom' | 'hyunryeong' | 'shop' | 'info' | 'admin'
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 1 | 2 | 3 | 4 | 5 | 6
  
  const [students, setStudents] = useState([]);
  const [rolesList, setRolesList] = useState([]); // [{ name: '우유 배달', manual: '...' }]
  const [checkedStudents, setCheckedStudents] = useState({});
  const [classPrep, setClassPrep] = useState({});
  const [threeCompliments, setThreeCompliments] = useState({});
  const [teacherCompliments, setTeacherCompliments] = useState({});
  const [timeoutChecks, setTimeoutChecks] = useState({});
  const [subjectChecks, setSubjectChecks] = useState({});
  const [usedPoints, setUsedPoints] = useState({});
  const [wipedPoints, setWipedPoints] = useState({});
  const [leaderBonuses, setLeaderBonuses] = useState({}); 
  const [weeklyStreak, setWeeklyStreak] = useState(0);            
  const [isWeeklyClaimed, setIsWeeklyClaimed] = useState(false);  
  const [activeBoss, setActiveBoss] = useState(null);
  const [bossHp, setBossHp] = useState(100);
  const [bossAttacks, setBossAttacks] = useState({}); 
  const [bossBonusPoints, setBossBonusPoints] = useState(0); 
  const [activeMarket, setActiveMarket] = useState(null);
  const [manualTotalBonus, setManualTotalBonus] = useState(0);
  const [targetScore, setTargetScore] = useState(3000);
  const [leaderConfig, setLeaderConfig] = useState({ allClearBonus: 20 });
  const [gachaConfig, setGachaConfig] = useState({ mode: 'normal', normal: {}, special: {} });
  const [shopItems, setShopItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [resetTimestamp, setResetTimestamp] = useState(0); 

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // false | 'teacher' | 'inspector'
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null);
  const [manitoRevealState, setManitoRevealState] = useState(null);
  const [selectedHyunRole, setSelectedHyunRole] = useState(null);

  // --- 데이터 로딩 및 동기화 ( classData_V2 로 데이터 분리 ) ---
  useEffect(() => {
    const fetchInitial = async () => {
      if (!DATABASE_URL || DATABASE_URL.includes("복사한_주소")) { setIsLoading(false); return; }
      const dbUrl = `${DATABASE_URL.replace(/\/$/, '')}/classData_V2.json`;
      try {
        const response = await fetch(dbUrl);
        const data = await response.json();
        if (data) {
          setStudents(safeArray(data.students).length ? data.students : defaultStudents);
          setRolesList(safeArray(data.rolesList));
          setCheckedStudents(data.checkedStudents || {});
          setClassPrep(data.classPrep || {});
          setThreeCompliments(data.threeCompliments || {});
          setTeacherCompliments(data.teacherCompliments || {});
          setTimeoutChecks(data.timeoutChecks || {});
          setSubjectChecks(data.subjectChecks || {});
          setUsedPoints(data.usedPoints || {});
          setWipedPoints(data.wipedPoints || {});
          setLeaderBonuses(data.leaderBonuses || {});
          setWeeklyStreak(data.weeklyStreak || 0);
          setIsWeeklyClaimed(data.isWeeklyClaimed || false);
          setActiveBoss(data.activeBoss || null);
          setBossHp(data.bossHp !== undefined ? data.bossHp : 100);
          setBossAttacks(data.bossAttacks || {});
          setBossBonusPoints(data.bossBonusPoints || 0);
          setActiveMarket(data.activeMarket || null);
          setManualTotalBonus(data.manualTotalBonus || 0);
          setTargetScore(data.targetScore || 3000);
          setLeaderConfig(data.leaderConfig || { allClearBonus: 20 });
          setGachaConfig(data.gachaConfig || { mode: 'normal', normal: defaultGachaNormal, special: defaultGachaSpecial });
          setShopItems(safeArray(data.shopItems));
        }
      } catch (e) {}
      setIsLoading(false);
    };
    fetchInitial();
  }, []);

  // 라이브 동기화 (점수 및 상태)
  useEffect(() => {
    const dbUrl = `${DATABASE_URL.replace(/\/$/, '')}/classData_V2.json`;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(dbUrl);
        const data = await response.json();
        if (data) {
          setCheckedStudents(data.checkedStudents || {});
          setClassPrep(data.classPrep || {});
          setThreeCompliments(data.threeCompliments || {});
          setTeacherCompliments(data.teacherCompliments || {});
          setTimeoutChecks(data.timeoutChecks || {});
          setSubjectChecks(data.subjectChecks || {});
          setUsedPoints(data.usedPoints || {});
          setWipedPoints(data.wipedPoints || {});
          setLeaderBonuses(data.leaderBonuses || {});
          setActiveBoss(data.activeBoss || null);
          setBossHp(data.bossHp !== undefined ? data.bossHp : 100);
          setBossAttacks(data.bossAttacks || {});
          setBossBonusPoints(data.bossBonusPoints || 0);
          setManualTotalBonus(data.manualTotalBonus || 0);
          setWeeklyStreak(data.weeklyStreak || 0);
          setIsWeeklyClaimed(data.isWeeklyClaimed || false);
          // 역할 및 명단도 실시간 반영
          if (data.students) setStudents(safeArray(data.students));
        }
      } catch (e) {}
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // 데이터 송신기
  const syncToFirebase = async (updates) => {
    const dbUrl = `${DATABASE_URL.replace(/\/$/, '')}/classData_V2.json`;
    try { await fetch(dbUrl, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  // --- 유틸리티 및 계산 ---
  const safeStudents = useMemo(() => students.length ? students : defaultStudents, [students]);
  const todayStats = useMemo(() => {
    const pos = safeStudents.reduce((sum, s) => {
      const roleBonus = getRoleBonus(s.role);
      const leaderBonus = leaderBonuses[s.id] ? (leaderConfig.allClearBonus || 20) : 0;
      return sum + (checkedStudents[s.id] ? roleBonus : 0) + (classPrep[s.id] ? 1 : 0) + (threeCompliments[s.id] ? 1 : 0) + ((teacherCompliments[s.id] || 0) * 1) + leaderBonus;
    }, 0) + (isWeeklyClaimed ? 100 : 0) + (bossBonusPoints > 0 ? bossBonusPoints : 0);
    const neg = safeStudents.reduce((sum, s) => sum + (timeoutChecks[s.id] || 0) * 10 + (subjectChecks[s.id] || 0) * 10, 0) + (bossBonusPoints < 0 ? Math.abs(bossBonusPoints) : 0);
    return { pos, neg, total: pos - neg };
  }, [safeStudents, checkedStudents, classPrep, threeCompliments, teacherCompliments, timeoutChecks, subjectChecks, leaderBonuses, bossBonusPoints, isWeeklyClaimed]);

  const cumulativeClassScore = useMemo(() => fmt(todayStats.total + manualTotalBonus), [todayStats, manualTotalBonus]);

  const allStats = useMemo(() => {
    return safeStudents.map(s => {
      const pos = (checkedStudents[s.id] ? getRoleBonus(s.role) : 0) + (classPrep[s.id] ? 1 : 0) + (threeCompliments[s.id] ? 1 : 0) + ((teacherCompliments[s.id] || 0) * 1) + (leaderBonuses[s.id] ? (leaderConfig.allClearBonus || 20) : 0);
      const neg = (timeoutChecks[s.id] || 0) * 10 + (subjectChecks[s.id] || 0) * 10;
      const sum = fmt(pos - neg);
      const net = fmt(sum - (usedPoints[s.id] || 0) - (wipedPoints[s.id] || 0));
      return { ...s, pos, neg, sum, net };
    });
  }, [safeStudents, checkedStudents, classPrep, threeCompliments, teacherCompliments, leaderBonuses, usedPoints, wipedPoints, timeoutChecks, subjectChecks]);

  // --- 이벤트 핸들러 ---
  const handleToggle = (id, type) => {
    playSound('good');
    const updates = {};
    if (type === 'role') updates.checkedStudents = { ...checkedStudents, [id]: !checkedStudents[id] };
    if (type === 'prep') updates.classPrep = { ...classPrep, [id]: !classPrep[id] };
    if (type === 'comp') updates.threeCompliments = { ...threeCompliments, [id]: !threeCompliments[id] };
    syncToFirebase(updates);
  };

  const handleLogin = () => {
    if (password === "6505") { setIsAuthenticated('teacher'); setActiveTab('admin'); setPassword(""); }
    else if (password === "1111") { setIsAuthenticated('inspector'); setActiveTab('admin'); setPassword(""); }
    else alert("비밀번호가 틀렸습니다.");
  };

  // --- 렌더링 헬퍼 ---
  const filteredStudents = useMemo(() => {
    if (groupFilter === 'all') return allStats;
    return allStats.filter(s => s.group === groupFilter);
  }, [allStats, groupFilter]);

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black text-2xl animate-pulse">달보드레 유니버스 로딩 중...</div>;

  return (
    <div className={`min-h-screen font-sans pb-24 transition-colors duration-700 ${activeBoss ? 'bg-red-950 text-red-50' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 상단 통합 헤더 */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><Trophy className="w-5 h-5"/></div>
          <div>
            <h1 className="font-black text-lg leading-none">달보드레 대시보드</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Class V2 Alpha</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[9px] font-black text-slate-400">학급 총점</p>
              <p className="text-xl font-black text-blue-600">{cumulativeClassScore}p</p>
           </div>
           {!isAuthenticated && (
             <button onClick={() => setShowModal('password')} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"><Lock className="w-5 h-5"/></button>
           )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        
        {/* 탭 1: 교실 명단 (학생 메인) */}
        {activeTab === 'classroom' && (
          <div className="animate-in fade-in duration-500">
            {/* 모둠 필터 바 */}
            <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-4">
              <button onClick={() => setGroupFilter('all')} className={`px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${groupFilter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-200 text-slate-400'}`}>전체 명단</button>
              {[1,2,3,4,5,6].map(g => (
                <button key={g} onClick={() => setGroupFilter(g)} className={`px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${groupFilter === g ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-400'}`}>{g}모둠 보기</button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map(s => (
                <div key={s.id} className={`p-5 rounded-[32px] border-2 bg-white transition-all shadow-sm ${s.isLeader ? 'border-yellow-400' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-xl">{getEvolution(s.net).icon}</div>
                       <div>
                          <p className="font-black text-base flex items-center gap-1">{s.name} {s.isLeader && <Crown className="w-3 h-3 text-yellow-500 fill-current"/>}</p>
                          <p className="text-[10px] font-bold text-slate-400">잔여: {s.net}p</p>
                       </div>
                    </div>
                    {s.isLeader && (
                       <button onClick={(e) => handleGroupAllClear(s.id, s.group, e)} className="bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-100 shadow-sm active:scale-90 transition-all">
                          <Zap className="w-4 h-4 fill-current"/>
                       </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => handleToggle(s.id, 'role')} className={`py-2.5 rounded-xl font-black text-[10px] border-2 transition-all ${checkedStudents[s.id] ? 'bg-green-500 border-green-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>역할</button>
                    <button onClick={() => handleToggle(s.id, 'prep')} className={`py-2.5 rounded-xl font-black text-[10px] border-2 transition-all ${classPrep[s.id] ? 'bg-purple-500 border-purple-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>준비</button>
                    <button onClick={() => handleToggle(s.id, 'comp')} className={`py-2.5 rounded-xl font-black text-[10px] border-2 transition-all ${threeCompliments[s.id] ? 'bg-pink-500 border-pink-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>칭찬</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 탭 2: 현령 센터 (업무 매뉴얼 및 퀵체크) */}
        {activeTab === 'hyunryeong' && (
          <div className="animate-in slide-in-from-bottom-5 duration-500">
             <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm mb-6">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><ClipboardCheck className="text-blue-600"/> 현령 센터</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                   {safeRolesArray.map(role => (
                     <button key={role.name} onClick={() => setSelectedHyunRole(role)} className={`p-4 rounded-2xl font-black text-sm border-2 transition-all ${selectedHyunRole?.name === role.name ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        {role.name}
                     </button>
                   ))}
                </div>

                {selectedHyunRole && (
                  <div className="animate-in fade-in zoom-in duration-300">
                     <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-3xl mb-8">
                        <h4 className="font-black text-blue-700 flex items-center gap-2 mb-2"><BookOpen className="w-5 h-5"/> {selectedHyunRole.name} 업무 매뉴얼</h4>
                        <p className="text-sm font-bold text-blue-600/80 leading-relaxed whitespace-pre-wrap">{selectedHyunRole.manual || "등록된 업무 지침이 없습니다. 선생님께 문의하세요!"}</p>
                     </div>
                     
                     <h4 className="font-black text-lg mb-4 ml-2">반 전체 퀵 체크</h4>
                     <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {allStats.map(s => (
                          <button key={s.id} onClick={() => handleToggle(s.id, 'role')} className={`p-3 rounded-xl font-black text-xs border-2 transition-all ${checkedStudents[s.id] ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                             {s.name}
                          </button>
                        ))}
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* 탭 3: 가챠/상점 */}
        {activeTab === 'shop' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
             {/* 가챠 상점 디자인 유지... (생략 및 최적화) */}
             <section className={`p-8 rounded-[40px] shadow-sm border relative overflow-hidden ${isDongminGod ? 'bg-indigo-900 text-white border-yellow-400' : 'bg-white border-slate-200'}`}>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Gift className="w-8 h-8 text-yellow-500"/> {isDongminGod ? '✨ 동민신의 가챠 ✨' : '행운의 가챠'}</h2>
                <div className="bg-slate-50 text-slate-800 p-6 rounded-3xl mb-6">
                   <select value={selectedGachaStudent} onChange={(e) => setSelectedGachaStudent(e.target.value)} className="w-full p-4 rounded-2xl font-black mb-4 border-2">
                      <option value="">누가 뽑을까요?</option>
                      {allStats.map(s => <option key={s.id} value={s.id}>{s.name} ({s.net}p)</option>)}
                   </select>
                   <button onClick={() => handleGacha(parseInt(selectedGachaStudent))} className="w-full py-4 rounded-2xl bg-yellow-400 text-yellow-900 font-black text-xl shadow-lg active:scale-95 transition-all">🎰 가챠 돌리기 ({currentGachaSettings.cost}p)</button>
                </div>
             </section>

             <section className="p-8 rounded-[40px] bg-blue-50 border-2 border-blue-100 shadow-sm">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><ShoppingCart className="w-8 h-8 text-blue-600"/> 포인트 상점</h2>
                <div className="bg-white p-6 rounded-3xl">
                   <select value={selectedStoreStudent} onChange={(e) => setSelectedStoreStudent(e.target.value)} className="w-full p-4 rounded-2xl font-black mb-4 border-2">
                      <option value="">누가 구매하나요?</option>
                      {allStats.map(s => <option key={s.id} value={s.id}>{s.name} ({s.net}p)</option>)}
                   </select>
                   <div className="space-y-2">
                      {safeArray(shopItems).map(item => (
                        <button key={item.id} onClick={() => handleStudentStoreBuy(parseInt(selectedStoreStudent), item)} className="w-full p-4 rounded-2xl bg-blue-50 border-2 border-blue-100 flex justify-between items-center font-black hover:bg-blue-100 transition-all">
                           <span>{item.name}</span><span className="text-blue-600">{item.price}p</span>
                        </button>
                      ))}
                   </div>
                </div>
             </section>
          </div>
        )}

        {/* 탭 4: 우리 반 정보/랭킹 */}
        {activeTab === 'info' && (
          <div className="space-y-6 animate-in zoom-in duration-500">
             <div className="bg-white rounded-[40px] p-10 border border-slate-200 text-center shadow-sm">
                <h2 className="text-xl font-black text-blue-600 mb-6 flex justify-center items-center gap-2"><Crown /> 우리 반 수호신</h2>
                <div className="text-[120px] mb-6 animate-breathe">{classGuardian.icon}</div>
                <h3 className="text-3xl font-black text-slate-800">{classGuardian.name}</h3>
                <p className="text-slate-500 font-bold text-lg mt-2">{classGuardian.desc}</p>
                <div className="w-full bg-slate-100 h-8 rounded-full mt-10 overflow-hidden relative border-4 border-white shadow-inner">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-1000" style={{ width: `${Math.min((parseFloat(cumulativeClassScore)/targetScore)*100, 100)}%` }} />
                </div>
                <p className="text-xs font-black text-slate-400 mt-3">{cumulativeClassScore} / {targetScore}p</p>
             </div>
             
             {/* 랭킹 Top 5 */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                   <h3 className="font-black text-green-500 mb-4 flex items-center gap-2"><Star/> 오늘의 영웅 (가점 Top 5)</h3>
                   <div className="space-y-2">
                      {top5Gainers.map((s, idx) => (
                        <div key={s.id} className="flex justify-between p-4 bg-green-50 rounded-2xl border border-green-100 font-black">
                           <span>{idx+1}위. {s.name}</span><span className="text-green-600">+{s.pos}p</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                   <h3 className="font-black text-amber-600 mb-4 flex items-center gap-2"><Trophy/> 우리 반 랭킹 (누적 Top 5)</h3>
                   <div className="space-y-2">
                      {allStats.sort((a,b)=>b.sum-a.sum).slice(0,5).map((s, idx) => (
                        <div key={s.id} className="flex justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100 font-black">
                           <span>{idx+1}위. {s.name}</span><span className="text-amber-600">{s.sum}p</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* 탭 5: 관리실 (비밀번호 검증 후 표시) */}
        {activeTab === 'admin' && isAuthenticated && (
          <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-xl animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center mb-8 border-b pb-6">
                <h2 className="text-3xl font-black flex items-center gap-3">
                   {isAuthenticated === 'teacher' ? <Settings className="text-slate-800"/> : <ShieldCheck className="text-indigo-600"/>}
                   {isAuthenticated === 'teacher' ? '교사 통합 관리실' : '감찰사 자치 관리실'}
                </h2>
                <button onClick={() => { setIsAuthenticated(false); setActiveTab('classroom'); }} className="text-slate-400 font-bold hover:text-red-500 transition-colors flex items-center gap-2">종료하기 <X/></button>
             </div>

             {/* 감찰사/교사 공통 권한: 인사 관리 */}
             <section className="mb-12">
                <h3 className="text-xl font-black mb-6 border-l-8 border-indigo-500 pl-4 flex items-center gap-2"><Users/> 명단 및 인사 발령</h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                         <tr><th className="p-4">이름</th><th className="p-4">모둠</th><th className="p-4">모둠장</th><th className="p-4">현재 직업</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {allStats.map(s => (
                           <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-black">{s.name}</td>
                              <td className="p-4">
                                 <select value={s.group} onChange={e => handleStudentFieldChange(s.id, 'group', parseInt(e.target.value))} className="bg-white border rounded-lg p-2 text-xs font-bold">
                                    {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}모둠</option>)}
                                 </select>
                              </td>
                              <td className="p-4">
                                 <button onClick={() => handleStudentFieldChange(s.id, 'isLeader', !s.isLeader)} className={`px-3 py-1.5 rounded-lg text-[11px] font-black ${s.isLeader ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-100 text-slate-400'}`}>
                                    {s.isLeader ? '👑 모둠장' : '모둠원'}
                                 </button>
                              </td>
                              <td className="p-4">
                                 <select value={s.role} onChange={e => handleStudentFieldChange(s.id, 'role', e.target.value)} className="bg-white border rounded-lg p-2 text-xs font-bold">
                                    <option value="">역할 없음</option>
                                    {safeRolesArray.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                 </select>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </section>

             {/* 교사 전용 권한 */}
             {isAuthenticated === 'teacher' && (
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  <section className="bg-indigo-50/50 p-8 rounded-[40px] border border-indigo-100">
                     <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-700"><Briefcase/> 직업 매뉴얼 생성소</h3>
                     <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="새 직업 이름" value={newRoleName} onChange={e=>setNewRoleName(e.target.value)} className="flex-1 p-3 rounded-xl border-2 border-indigo-100 outline-none focus:border-indigo-400 font-bold"/>
                        <button onClick={handleAddRole} className="bg-indigo-600 text-white px-5 rounded-xl font-black hover:bg-indigo-700 transition-all"><Plus/></button>
                     </div>
                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {safeRolesArray.map(role => (
                          <div key={role.name} className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                             <div className="flex justify-between items-center mb-2">
                                <span className="font-black text-indigo-700">{role.name}</span>
                                <button onClick={()=>handleDeleteRole(role.name)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                             </div>
                             <textarea 
                               placeholder="여기에 업무 지침(매뉴얼)을 작성하세요..." 
                               value={role.manual || ''}
                               onChange={(e) => {
                                  const newRoles = safeRolesArray.map(r => r.name === role.name ? {...r, manual: e.target.value} : r);
                                  setRolesList(newRoles); syncToFirebase({rolesList: newRoles});
                               }}
                               className="w-full h-20 p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-indigo-300 resize-none"
                             />
                          </div>
                        ))}
                     </div>
                  </section>

                  <section className="space-y-6">
                     <div className="bg-green-50 p-8 rounded-[40px] border border-green-100">
                        <h3 className="text-xl font-black mb-4 text-green-700">하루 마감 및 총점 조절</h3>
                        <div className="flex items-center gap-4 mb-6">
                           <input type="number" value={manualAdjustAmount} onChange={e=>setManualAdjustAmount(e.target.value)} placeholder="점수 입력" className="flex-1 p-3 rounded-xl border-2 border-green-200 outline-none font-black"/>
                           <button onClick={() => { const val = manualTotalBonus + (parseFloat(manualAdjustAmount)||0); setManualTotalBonus(val); syncToFirebase({manualTotalBonus: val}); setManualAdjustAmount(''); }} className="bg-green-600 text-white px-6 py-3 rounded-xl font-black hover:bg-green-700 shadow-md">적용</button>
                        </div>
                        <button onClick={saveDailyRecord} className="w-full bg-slate-800 text-white py-5 rounded-[28px] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl active:scale-95"><Save/> 오늘 기록 최종 마감하기</button>
                     </div>
                     <div className="bg-red-50 p-8 rounded-[40px] border border-red-100">
                        <h3 className="text-xl font-black mb-4 text-red-700">위험 구역</h3>
                        <button onClick={factoryResetSystem} className="w-full bg-white border-2 border-red-200 text-red-500 py-3 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all">공장 초기화 (모든 데이터 삭제)</button>
                     </div>
                  </section>
               </div>
             )}
          </div>
        )}
      </main>

      {/* 하단 고정 탭 바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-3 flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
         <button onClick={() => setActiveTab('classroom')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'classroom' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-6 h-6"/>
            <span className="text-[10px] font-black">교실</span>
         </button>
         <button onClick={() => setActiveTab('hyunryeong')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'hyunryeong' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <ClipboardCheck className="w-6 h-6"/>
            <span className="text-[10px] font-black">현령</span>
         </button>
         <button onClick={() => setActiveTab('shop')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'shop' ? 'text-yellow-600 scale-110' : 'text-slate-400'}`}>
            <Gift className="w-6 h-6"/>
            <span className="text-[10px] font-black">가챠/상점</span>
         </button>
         <button onClick={() => setActiveTab('info')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'info' ? 'text-green-600 scale-110' : 'text-slate-400'}`}>
            <User className="w-6 h-6"/>
            <span className="text-[10px] font-black">반 정보</span>
         </button>
         <button onClick={() => isAuthenticated ? setActiveTab('admin') : setShowModal('password')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'admin' ? 'text-slate-900 scale-110' : 'text-slate-400'}`}>
            <Lock className="w-6 h-6"/>
            <span className="text-[10px] font-black">관리</span>
         </button>
      </nav>

      {/* 모달 시스템 (비밀번호, 마니또 공개, 성공 등) */}
      {showModal === 'password' && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-[9999]">
          <div className="bg-white rounded-[60px] p-16 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-8">
               <div className="bg-purple-100 w-28 h-28 rounded-[40px] flex items-center justify-center mx-auto mb-6 text-purple-600"><Lock className="w-14 h-14" /></div>
               <h3 className="text-4xl font-black text-slate-800 mb-2">관리자 접속</h3>
               <p className="text-sm font-bold text-slate-400">교사: 6505 / 감찰사: 1111</p>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-6xl tracking-[25px] font-black p-10 border-4 border-slate-100 rounded-[40px] outline-none mb-12 bg-slate-50 focus:border-purple-300" autoFocus />
            <div className="flex gap-6"><button onClick={() => setShowModal(null)} className="flex-1 py-8 rounded-[35px] font-black text-slate-400 text-2xl bg-slate-100 hover:bg-slate-200">취소</button><button onClick={handleLogin} className="flex-1 py-8 rounded-[35px] font-black bg-purple-600 text-white text-2xl shadow-xl hover:bg-purple-700">접속하기</button></div>
          </div>
        </div>
      )}

      {/* 마니또 공개 모달 */}
      {manitoRevealState && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-slate-900/95 backdrop-blur-md">
          {manitoRevealState === 'loading' ? (
            <div className="text-center animate-pulse">
              <div className="text-9xl mb-8">🥁</div>
              <h2 className="text-6xl font-black text-yellow-400 tracking-widest">오늘의 마니또는 과연...?</h2>
            </div>
          ) : (
            <div className={`p-20 rounded-[60px] text-center animate-in zoom-in duration-500 max-w-4xl w-full mx-4 shadow-2xl ${manitoRevealState === 'success' ? 'bg-gradient-to-b from-blue-500 to-indigo-700 text-white' : 'bg-slate-800 text-slate-100 border-4 border-slate-700'}`}>
              <div className="text-9xl mb-6 animate-bounce">{manitoRevealState === 'success' ? '👼✨' : '💛'}</div>
              <h2 className="text-7xl font-black mb-6">{effectiveManitoName}</h2>
              <p className="text-2xl font-bold mb-12 opacity-80">{manitoRevealState === 'success' ? '완벽한 수호자 미션 성공!' : '비록 미션은 아쉬웠지만 고생 많았어요!'}</p>
              <div className="bg-black/20 backdrop-blur-md p-8 rounded-[40px] border border-white/10 shadow-inner">
                 <p className="text-sm font-black uppercase tracking-widest mb-3 opacity-60">친구에게 다 함께 외쳐주세요!</p>
                 <p className="text-4xl font-black leading-snug">"{manitoRevealMsg}"</p>
              </div>
              <button onClick={closeManitoReveal} className="mt-12 bg-white text-slate-900 font-black px-12 py-5 rounded-full text-2xl hover:scale-105 transition-transform shadow-xl">닫기</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .animate-breathe { animation: breathe 2.5s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;
