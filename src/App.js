/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Trophy, ShieldCheck, Heart, Lock, History, Save, X, 
  Plus, AlertTriangle, Sparkles, Star, Target, Settings, Trash2, 
  ShoppingCart, Flame, Crown, BookOpen, Send
} from 'lucide-react';

// ==========================================
// 🚨 파이어베이스 주소
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/"; 
// ==========================================

const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
};

const defaultStudents = [
  { id: 1, name: '금채율', role: '학급문고 정리', group: 1 }, { id: 2, name: '김라희', role: '우유 배달', group: 1 },
  { id: 3, name: '김민지', role: '다툼 중재자', group: 1 }, { id: 4, name: '김수은', role: '생활태도 체크', group: 1 },
  { id: 5, name: '김시우', role: '칠판 정리', group: 2 }, { id: 6, name: '박서정', role: '질서 관리', group: 2 },
  { id: 7, name: '이하윤', role: '학급문고 정리', group: 2 }, { id: 8, name: '장세아', role: '문 닫기', group: 2 },
  { id: 9, name: '최예나', role: '우유 배달', group: 3 }, { id: 10, name: '허수정', role: '감찰사', group: 3 },
  { id: 11, name: '황지인', role: '칠판 정리', group: 3 }, { id: 12, name: '김도운', role: '생활 배출물 관리', group: 3 },
  { id: 13, name: '김윤재', role: '과제 확인', group: 4 }, { id: 14, name: '김정현', role: '질서 관리', group: 4 },
  { id: 15, name: '김태영', role: '복사물 관리', group: 4 }, { id: 16, name: '김해준', role: '칠판 정리', group: 4 },
  { id: 17, name: '박동민', role: '과제 확인', group: 5 }, { id: 18, name: '서이환', role: '가습기 관리', group: 5 },
  { id: 19, name: '윤호영', role: '우유 배달', group: 5 }, { id: 20, name: '이서준', role: '과제 확인', group: 5 },
  { id: 21, name: '이승현', role: '신발장 관리', group: 6 }, { id: 22, name: '임유성', role: '질서 관리', group: 6 },
  { id: 23, name: '장세형', role: '다툼 중재자', group: 6 }, { id: 24, name: '조승원', role: '부착물 관리', group: 6 },
  { id: 25, name: '차민서', role: '신발장 관리', group: 6 }, { id: 26, name: '배지훈', role: '문 닫기', group: 6 }
];

const defaultRoles = ['학급문고 정리', '우유 배달', '다툼 중재자', '생활태도 체크', '질서 관리', '감찰사', '칠판 정리', '생활 배출물 관리', '복사물 관리', '가습기 관리', '과제 확인', '신발장 관리', '부착물 관리', '문 닫기'];

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('page1'); // page1(현황판), page2(성찰센터), page3(관리실)
  const [teacherTab, setTeacherTab] = useState('approvals');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null);

  // --- 코어 데이터 ---
  const [students, setStudents] = useState(defaultStudents);
  const [rolesList, setRolesList] = useState(defaultRoles);
  const [shopItems, setShopItems] = useState([{ id: 'i1', name: '달보드레 연필', price: 30 }, { id: 'i2', name: '자리선택 구매권', price: 100 }]);
  
  // --- V4 변경된 상태 (명성, 코인, SEL) ---
  const [roleExp, setRoleExp] = useState({}); // 1인1역 숙련도 (경험치)
  const [usedCoins, setUsedCoins] = useState({}); // 사용한 코인
  const [penaltyCount, setPenaltyCount] = useState({}); // 감점(명성 깎임) 횟수
  
  // 상태 관리: 'normal', 'crisis' (지적받음), 'pending' (회복 승인 대기)
  const [studentStatus, setStudentStatus] = useState({}); 
  const [pendingReflections, setPendingReflections] = useState([]); // 공언하기 대기열
  
  const [pendingPraises, setPendingPraises] = useState([]); // 온기 우체통 대기열
  const [approvedPraises, setApprovedPraises] = useState([]); // 승인된 온기 사연

  // --- 폼 상태 ---
  const [refTarget, setRefTarget] = useState("");
  const [refText, setRefText] = useState("");
  const [refAction, setRefAction] = useState("");
  
  const [praiseTarget, setPraiseTarget] = useState("");
  const [praiseTag, setPraiseTag] = useState("");
  const [praiseText, setPraiseText] = useState("");
  const [showPraiseModal, setShowPraiseModal] = useState(false);

  useEffect(() => {
    if (!DATABASE_URL || DATABASE_URL.includes("복사한_주소")) { setIsLoading(false); return; }
    const dbUrl = `${DATABASE_URL.replace(/\/$/, '')}/v4Data.json`;
    
    const fetchLive = async () => {
      try {
        const res = await fetch(dbUrl);
        const data = await res.json();
        if (data) {
          if (data.students) setStudents(safeArray(data.students));
          if (data.rolesList) setRolesList(safeArray(data.rolesList));
          if (data.shopItems) setShopItems(safeArray(data.shopItems));
          setRoleExp(data.roleExp || {});
          setUsedCoins(data.usedCoins || {});
          setPenaltyCount(data.penaltyCount || {});
          setStudentStatus(data.studentStatus || {});
          setPendingReflections(safeArray(data.pendingReflections));
          setPendingPraises(safeArray(data.pendingPraises));
          setApprovedPraises(safeArray(data.approvedPraises));
        }
      } catch (e) {}
      setIsLoading(false);
    };
    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => clearInterval(interval);
  }, []);

  const sync = async (updates) => {
    if (!DATABASE_URL || DATABASE_URL.includes("복사한_주소")) {
      if(updates.roleExp) setRoleExp(updates.roleExp);
      if(updates.usedCoins) setUsedCoins(updates.usedCoins);
      if(updates.penaltyCount) setPenaltyCount(updates.penaltyCount);
      if(updates.studentStatus) setStudentStatus(updates.studentStatus);
      if(updates.pendingReflections) setPendingReflections(updates.pendingReflections);
      if(updates.pendingPraises) setPendingPraises(updates.pendingPraises);
      if(updates.approvedPraises) setApprovedPraises(updates.approvedPraises);
      return;
    }
    try { await fetch(`${DATABASE_URL.replace(/\/$/, '')}/v4Data.json`, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  // --- 핵심 로직: 명성 & 코인 ---
  const allStats = useMemo(() => {
    return safeArray(students).map(s => {
      const exp = roleExp[s.id] || 0;
      const pos = exp * 10; // 1인1역 1번당 10포인트(명성&코인)
      const neg = (penaltyCount[s.id] || 0) * 20; // 지적 1번당 명성 20 하락
      const used = usedCoins[s.id] || 0;
      
      const reputation = Math.max(0, pos - neg); // 학급 명성에 기여하는 개인 명성 (코인 사용 무관)
      const coins = Math.max(0, pos - neg - used); // 상점에서 쓸 수 있는 개인 지갑
      
      // 숙련도 계산
      let mastery = { label: '🌱 인턴', color: 'text-green-600', bg: 'bg-green-50' };
      if (exp >= 20) mastery = { label: '👑 장인 (자치권)', color: 'text-amber-600', bg: 'bg-amber-50' };
      else if (exp >= 10) mastery = { label: '💎 전문가', color: 'text-blue-600', bg: 'bg-blue-50' };
      else if (exp >= 5) mastery = { label: '🌿 사원', color: 'text-emerald-600', bg: 'bg-emerald-50' };

      return { ...s, exp, reputation, coins, mastery, status: studentStatus[s.id] || 'normal' };
    });
  }, [students, roleExp, penaltyCount, usedCoins, studentStatus]);

  const classReputation = useMemo(() => allStats.reduce((sum, s) => sum + s.reputation, 0), [allStats]);

  const getClassTier = (rep) => {
    if (rep < 200) return { label: '평범한 학급', icon: '🏫' };
    if (rep < 500) return { label: '성장하는 학급', icon: '🌟' };
    if (rep < 1000) return { label: '명문 학급', icon: '🏆' };
    return { label: '전설의 달보드레', icon: '👑' };
  };

  // --- 액션 핸들러 ---
  const handleRoleComplete = (id) => {
    if (studentStatus[id] === 'crisis' || studentStatus[id] === 'pending') return alert("위기 상태에서는 임무를 완수할 수 없습니다. 성찰 센터로 가주세요!");
    sync({ roleExp: { ...roleExp, [id]: (roleExp[id] || 0) + 1 } });
  };

  const handleGivePenalty = (id) => {
    if (window.confirm("이 학생에게 위기 상태(명성 하락)를 부여하시겠습니까?")) {
      sync({ 
        studentStatus: { ...studentStatus, [id]: 'crisis' },
        penaltyCount: { ...penaltyCount, [id]: (penaltyCount[id] || 0) + 1 }
      });
    }
  };

  const submitPraise = () => {
    if (!praiseTarget || !praiseTag || !praiseText) return alert("빈칸을 모두 채워주세요!");
    const newPraise = { id: Date.now(), toId: praiseTarget, tag: praiseTag, text: praiseText, date: new Date().toLocaleDateString() };
    const nextList = [newPraise, ...pendingPraises];
    setPendingPraises(nextList); sync({ pendingPraises: nextList });
    setShowPraiseModal(false); setPraiseTarget(""); setPraiseText(""); setPraiseTag("");
    alert("따뜻한 온기 배달 완료! 선생님의 승인을 기다립니다.");
  };

  const submitReflection = () => {
    if (!refTarget || !refText || !refAction) return alert("입력칸과 행동을 모두 선택해주세요.");
    const newRef = { id: Date.now(), sId: refTarget, text: refText, action: refAction, date: new Date().toLocaleDateString() };
    const nextList = [newRef, ...pendingReflections];
    setPendingReflections(nextList);
    sync({ 
      pendingReflections: nextList,
      studentStatus: { ...studentStatus, [refTarget]: 'pending' } // 상태를 승인 대기로 변경
    });
    setRefTarget(""); setRefText(""); setRefAction("");
    alert("공언이 제출되었습니다! 약속한 행동을 실천하고 선생님께 확인받으세요.");
  };

  const handleLogin = () => {
    if (password === "6505" || password === "1111") { 
      setIsAuthenticated(password === "6505" ? 'teacher' : 'inspector'); 
      setActiveTab('page3'); setShowModal(null); setPassword(""); 
    } else alert("비밀번호 오류");
  };

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black text-2xl">서버 동기화 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800">
      
      {/* 고정 헤더 */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3"><Trophy className="text-blue-600 w-8 h-8"/><h1 className="font-black text-xl tracking-tight">달보드레 SEL 대시보드</h1></div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase">Class Reputation</p>
          <p className="text-2xl font-black text-blue-600 flex items-center gap-2">{getClassTier(classReputation).icon} {classReputation}p</p>
        </div>
      </header>

      {/* 온기 우체통 마키 (흐르는 텍스트) */}
      {approvedPraises.length > 0 && activeTab === 'page1' && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 overflow-hidden shadow-md">
          <div className="whitespace-nowrap animate-[shimmer_20s_linear_infinite] flex gap-10 text-sm font-bold">
            {approvedPraises.map((p, idx) => (
              <span key={idx}>💌 [{p.tag}] {allStats.find(s=>s.id==p.toId)?.name}에게: "{p.text}"</span>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-6 mt-4">
        
        {/* 📄 PAGE 1: 명성 현황판 */}
        {activeTab === 'page1' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-2xl font-black flex items-center gap-2"><Users className="text-blue-600"/> 학급 명성 및 1인1역 현황</h2>
              <button onClick={() => setShowPraiseModal(true)} className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full font-black text-sm hover:bg-pink-200 flex items-center gap-2"><Heart className="w-4 h-4"/> 온기 보내기</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allStats.map(s => (
                <div key={s.id} className={`p-5 rounded-[30px] border-2 shadow-sm transition-all relative overflow-hidden ${s.status === 'crisis' ? 'bg-red-50 border-red-300' : (s.status === 'pending' ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-100 hover:border-blue-200')}`}>
                  {/* 위기 상태 오버레이 */}
                  {s.status === 'crisis' && <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-md animate-pulse">위기 상태 (성찰 필요)</div>}
                  {s.status === 'pending' && <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-md">실천 검수 대기중</div>}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">{s.role}</p>
                      <h3 className={`text-xl font-black ${s.status === 'crisis' ? 'text-red-700' : 'text-slate-800'}`}>{s.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">개인 코인</p>
                      <p className="font-black text-blue-600 text-lg">{s.coins} 🪙</p>
                    </div>
                  </div>

                  <div className={`text-[11px] font-black px-3 py-1.5 rounded-lg mb-4 inline-block ${s.mastery.bg} ${s.mastery.color}`}>
                    숙련도: {s.mastery.label} (수행 {s.exp}회)
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleRoleComplete(s.id)} className={`flex-1 py-3 rounded-xl font-black text-sm transition-colors ${s.status === 'normal' ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                      ✅ 역할 완수
                    </button>
                    {isAuthenticated && s.status === 'normal' && (
                      <button onClick={() => handleGivePenalty(s.id)} className="px-3 bg-red-100 text-red-600 rounded-xl font-black hover:bg-red-200" title="지적/명성 깎기"><AlertTriangle className="w-5 h-5"/></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📄 PAGE 2: 성찰과 회복 센터 */}
        {activeTab === 'page2' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
              <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-slate-800 mb-4">성찰과 회복 센터</h2>
              <p className="text-slate-500 font-bold mb-8">나의 행동을 돌아보고, 공동체의 명성을 스스로 회복하는 공간입니다.</p>
              
              <div className="text-left space-y-6 bg-slate-50 p-8 rounded-[30px] border border-slate-200">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">1. 누가 공언하나요?</label>
                  <select value={refTarget} onChange={(e)=>setRefTarget(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-300 font-bold outline-none focus:border-blue-500 bg-white">
                    <option value="">이름을 선택하세요 (위기 상태 학생만 보입니다)</option>
                    {allStats.filter(s => s.status === 'crisis').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">2. 나의 성찰 한마디 (공언하기)</label>
                  <p className="text-xs text-blue-600 font-bold mb-2">💡 [상황] + [부족했던 점] + [앞으로의 다짐]을 적어보세요.</p>
                  <textarea 
                    value={refText} onChange={(e)=>setRefText(e.target.value)} rows="3"
                    className="w-full p-4 rounded-2xl border border-slate-300 font-bold outline-none focus:border-blue-500 bg-white resize-none"
                    placeholder="예시: 오늘 화가 나서 친구에게 큰 소리를 냈습니다. [자기 관리]가 부족했습니다. 다음부터는 화가 날 때 심호흡을 3번 하고 차분하게 내 감정을 말하겠습니다."
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">3. 책임 실천 행동 선택</label>
                  <select value={refAction} onChange={(e)=>setRefAction(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-300 font-bold outline-none focus:border-blue-500 bg-white">
                    <option value="">어떤 행동으로 책임을 질까요?</option>
                    <option value="사과 편지 쓰기">💌 진심을 담은 사과 편지 쓰기 (관계 회복)</option>
                    <option value="교실 바닥 청소">🧹 교실 바닥 쓰레기 10개 줍기 (환경 기여)</option>
                    <option value="수업 준비 돕기">책 선생님의 수업 준비 돕기 (학습 지원)</option>
                    <option value="보건실 동행">🤕 다친 친구 보건실 데려다주기 (나눔)</option>
                  </select>
                </div>

                <button onClick={submitReflection} className="w-full bg-slate-800 text-white font-black py-5 rounded-2xl text-lg hover:bg-slate-700 active:scale-95 transition-all shadow-lg">
                  📝 공언하고 실천하러 가기
                </button>
                <p className="text-center text-xs text-slate-400 font-bold mt-4">※ 버튼을 누른 후 행동을 실천하고, 선생님께 검수를 받아야 명성이 회복됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* 📄 PAGE 3: 통합 관리실 (교사/감찰사) */}
        {activeTab === 'page3' && isAuthenticated && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 flex flex-col lg:flex-row overflow-hidden min-h-[600px] animate-in slide-in-from-right duration-300">
            <aside className="w-full lg:w-64 bg-slate-50 border-r border-slate-200 p-8 shrink-0">
              <div className="text-center mb-8"><Lock className="w-12 h-12 text-slate-800 mx-auto mb-2"/><h3 className="font-black text-slate-800">통합 관리실</h3><p className="text-xs font-bold text-slate-400">{isAuthenticated === 'teacher' ? '담임교사 모드' : '감찰사 모드'}</p></div>
              <div className="space-y-2">
                <button onClick={() => setTeacherTab('approvals')} className={`w-full text-left p-4 rounded-2xl font-black transition-all ${teacherTab === 'approvals' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>✅ 결재함 (승인)</button>
                {isAuthenticated === 'teacher' && <button onClick={() => setTeacherTab('shop')} className={`w-full text-left p-4 rounded-2xl font-black transition-all ${teacherTab === 'shop' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>🛍️ 경제/상점</button>}
                {isAuthenticated === 'teacher' && <button onClick={() => setTeacherTab('settings')} className={`w-full text-left p-4 rounded-2xl font-black transition-all ${teacherTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>⚙️ 시스템 설정</button>}
              </div>
            </aside>
            <section className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
              
              {teacherTab === 'approvals' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-6 border-l-8 border-blue-600 pl-4">실천 검수 대기열 (명성 회복)</h3>
                    <div className="space-y-4">
                      {pendingReflections.length === 0 ? <p className="text-slate-400 font-bold p-10 text-center border-2 border-dashed rounded-3xl">대기 중인 사연이 없습니다.</p> : pendingReflections.map(ref => (
                        <div key={ref.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <span className="font-black text-lg">{allStats.find(s=>s.id == ref.sId)?.name}</span><span className="text-xs text-slate-400 font-bold">{ref.date}</span>
                          </div>
                          <p className="text-slate-600 font-bold bg-slate-50 p-4 rounded-xl mb-4 italic">"{ref.text}"</p>
                          <p className="text-sm font-black text-blue-600 mb-6">실천 행동: {ref.action}</p>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              const newPending = pendingReflections.filter(r => r.id !== ref.id);
                              setPendingReflections(newPending);
                              sync({ pendingReflections: newPending, studentStatus: { ...studentStatus, [ref.sId]: 'normal' } });
                              alert("승인 완료! 학생의 명성이 회복되었습니다.");
                            }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black shadow-md hover:bg-blue-700">행동 확인 및 승인</button>
                            <button onClick={() => {
                              const newPending = pendingReflections.filter(r => r.id !== ref.id);
                              setPendingReflections(newPending);
                              sync({ pendingReflections: newPending, studentStatus: { ...studentStatus, [ref.sId]: 'crisis' } });
                              alert("반려되었습니다. 학생은 다시 제출해야 합니다.");
                            }} className="px-6 bg-slate-100 text-slate-500 font-black rounded-xl hover:bg-slate-200">반려</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-6 border-l-8 border-pink-500 pl-4">온기 우체통 (SEL 제보 승인)</h3>
                    <div className="space-y-4">
                      {pendingPraises.length === 0 ? <p className="text-slate-400 font-bold p-10 text-center border-2 border-dashed rounded-3xl">새로운 온기 사연이 없습니다.</p> : pendingPraises.map(praise => (
                        <div key={praise.id} className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                          <p className="text-sm font-black text-pink-600 mb-2">[{praise.tag}] 대상: {allStats.find(s=>s.id == praise.toId)?.name}</p>
                          <p className="text-slate-700 font-bold mb-6">"{praise.text}"</p>
                          <button onClick={() => {
                            const newPending = pendingPraises.filter(p => p.id !== praise.id);
                            const newApproved = [praise, ...approvedPraises].slice(0, 10); // 최근 10개만 보관
                            setPendingPraises(newPending); setApprovedPraises(newApproved);
                            sync({ pendingPraises: newPending, approvedPraises: newApproved, roleExp: { ...roleExp, [praise.toId]: (roleExp[praise.toId]||0) + 1 } });
                            alert("승인 완료! 메인 화면에 텍스트가 흐릅니다. (+10 코인 지급)");
                          }} className="w-full bg-pink-500 text-white py-3 rounded-xl font-black shadow-md hover:bg-pink-600">사연 승인하기</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {teacherTab === 'shop' && isAuthenticated === 'teacher' && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 mb-6 border-l-8 border-amber-500 pl-4">상점 결제 (개인 코인 사용)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {safeArray(shopItems).map(item => (
                      <div key={item.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between">
                        <div className="mb-6"><h4 className="font-black text-lg">{item.name}</h4><p className="text-amber-600 font-black text-xl">{item.price} 🪙</p></div>
                        <select id={`buy_${item.id}`} className="w-full p-3 rounded-xl border border-slate-200 font-bold outline-none mb-3 bg-slate-50">
                          <option value="">구매자 선택</option>
                          {allStats.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.coins})</option>)}
                        </select>
                        <button onClick={() => {
                          const sid = document.getElementById(`buy_${item.id}`).value;
                          if(!sid) return alert("학생을 선택하세요.");
                          const user = allStats.find(s => s.id == sid);
                          if(user.coins < item.price) return alert("코인이 부족합니다.");
                          if(window.confirm(`${user.name}의 코인을 차감하고 결제할까요? (학급 명성은 깎이지 않습니다)`)) {
                            sync({ usedCoins: { ...usedCoins, [sid]: (usedCoins[sid]||0) + item.price }});
                            document.getElementById(`buy_${item.id}`).value = '';
                            alert("결제 완료!");
                          }
                        }} className="w-full bg-amber-500 text-white py-3 rounded-xl font-black shadow-md hover:bg-amber-600">결제 승인</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* 온기 우체통 작성 모달 */}
      {showPraiseModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white p-8 rounded-[40px] w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-pink-600 mb-6 flex items-center gap-2"><Heart/> 따뜻한 온기 제보</h3>
            <div className="space-y-4 mb-8">
              <select value={praiseTarget} onChange={(e)=>setPraiseTarget(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none">
                <option value="">누구를 칭찬할까요?</option>
                {allStats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={praiseTag} onChange={(e)=>setPraiseTag(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none">
                <option value="">어떤 역량인가요?</option>
                <option value="사회적 인식">사회적 인식 (친구의 마음을 알아준 행동)</option>
                <option value="관계 기술">관계 기술 (서로 돕고 협력한 행동)</option>
                <option value="책임 있는 의사결정">책임 있는 의사결정 (공동체를 위한 바른 선택)</option>
              </select>
              <textarea value={praiseText} onChange={(e)=>setPraiseText(e.target.value)} rows="3" placeholder="예: 무거운 짐을 들고 갈 때 문을 열어주고 도와줬어요!" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none resize-none"/>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPraiseModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black">취소</button>
              <button onClick={submitPraise} className="flex-1 py-4 bg-pink-500 text-white rounded-2xl font-black shadow-lg">보내기</button>
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
            <div className="flex gap-4"><button onClick={() => setShowModal(null)} className="flex-1 py-5 rounded-2xl font-black text-slate-500 bg-slate-100">취소</button><button onClick={handleLogin} className="flex-1 py-5 rounded-2xl font-black bg-slate-800 text-white shadow-lg">접속</button></div>
          </div>
        </div>
      )}

      {/* 하단 3페이지 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 px-2 py-4 flex justify-around items-center z-[5000] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-6">
        {[
          { id: 'page1', icon: <Target className="w-6 h-6"/>, label: '명성 현황판' }, 
          { id: 'page2', icon: <BookOpen className="w-6 h-6"/>, label: '성찰과 회복' }, 
          { id: 'page3', icon: <Settings className="w-6 h-6"/>, label: '통합 관리실' }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => item.id === 'page3' && !isAuthenticated ? setShowModal('password') : setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${activeTab === item.id ? 'text-blue-600 scale-110 -translate-y-2' : 'text-slate-400 opacity-60'}`}
          >
            {item.icon}
            <span className="text-[11px] font-black">{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(50%); } 100% { transform: translateX(-100%); } }
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
        .fade-in { animation-name: fadeIn; }
        .zoom-in-95 { animation-name: zoomIn95; }
        .slide-in-from-bottom-4 { animation-name: slideInBottom; }
        .slide-in-from-right { animation-name: slideInRight; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInBottom { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default App;
