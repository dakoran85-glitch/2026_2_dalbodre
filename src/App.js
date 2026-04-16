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
    else if (type === 'failSoft') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.6); }
    osc.start(); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + (type==='drumroll'?3:(type==='failSoft'?0.6:0.3))); osc.stop(ctx.currentTime + (type==='drumroll'?3:(type==='failSoft'?0.6:0.3)));
  } catch (e) {}
};

const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
};

const manitoSuccessMessages = [
  "보이지 않는 곳에서 끝까지 책임을 다해줘서 정말 고마워!", "네가 있어서 오늘 우리 반이 한결 더 따뜻했어!",
  "우리가 널 믿은 만큼, 멋지게 해내 줘서 자랑스러워!", "너의 헌신 덕분에 우리 모두가 기분 좋은 하루를 보냈어!",
  "작은 일도 솔선수범하는 네 모습이 진짜 멋졌어!", "너의 상냥한 태도가 교실을 밝게 빛냈어, 고마워!",
  "모두를 위해 규칙을 지켜준 너의 배려에 박수를 보내!", "어려운 미션인데도 긍정적인 마음으로 해내줘서 대단해!",
  "네가 뿌린 친절의 씨앗이 우리 반을 행복하게 만들었어!", "혼자서도 묵묵히 제 몫을 다한 네가 진정한 영웅이야!",
  "우리를 위해 애써준 너의 예쁜 마음에 깊이 감사해!", "너의 협동심 덕분에 오늘 우리 반이 더 끈끈해졌어!",
  "모범을 보여준 네 덕분에 나도 더 잘하고 싶어졌어!", "조용하지만 강하게 우리를 지켜준 널 진심으로 존중해!",
  "너의 너그러운 미소가 오늘 하루의 피로를 싹 잊게 해!", "언제나 믿음직스러운 너, 오늘 정말 최고였어!",
  "네가 보여준 책임감은 우리 모두에게 큰 귀감이 되었어.", "너의 따뜻한 배려심이 교실 구석구석을 채웠단다!",
  "친구들을 먼저 생각하는 너의 헌신적인 마음에 감동했어!", "미션을 완벽하게 해낸 너의 성실함에 큰 박수를 쳐!",
  "오늘 네가 만들어낸 긍정의 에너지가 정말 고마워!", "너의 상냥한 말 한마디가 누군가에겐 큰 힘이 됐을 거야.",
  "언제나처럼 우리 반의 든든한 버팀목이 되어줘서 고마워!", "너의 진심 어린 친절이 오늘 우리를 웃게 만들었어.",
  "스스로를 이겨내고 멋진 결과를 보여준 널 인정해!", "너의 존중받아 마땅한 행동들이 오늘 하루를 빛냈어!",
  "함께하는 기쁨을 알려준 너의 노력에 진심으로 감사해.", "누구보다 넓은 마음으로 미션을 해낸 네가 자랑스러워!",
  "우리를 하나로 만들어준 너의 협동심, 정말 멋지다!", "보이지 않는 영웅으로 활약해 준 너의 오늘을 영원히 기억할게!"
];

const manitoFailMessages = [
  "오늘 하루도 고생했어! 내일은 네가 진짜 주인공이야!", "실수해도 괜찮아, 우리는 언제나 한 팀이니까!",
  "마니또의 무게를 견디려 노력한 너의 하루를 응원해!", "완벽하지 않아도 돼, 열심히 하려 했던 네 마음을 알아!",
  "괜찮아! 너의 다음 도전을 우리가 온 마음으로 응원할게!", "오늘 배운 걸 바탕으로 내일 더 멋지게 성장할 널 믿어!",
  "결과보다 노력한 과정이 더 아름다운 법이야, 수고했어!", "혼자 부담 갖지 마, 우리는 널 언제나 돕고 지지해!",
  "아쉬움은 털어버리고, 너의 밝은 미소를 다시 보여줘!", "누구나 실수할 수 있어. 훌훌 털고 우리 함께 다시 시작하자!",
  "네가 우리 반이라는 사실만으로도 우린 이미 행복해!", "실패는 성공의 어머니! 너의 내일이 더욱 기대되는걸?",
  "오늘의 아쉬움이 널 더 단단하고 배려 깊게 만들 거야.", "네가 속상해하지 않도록 우리가 더 따뜻하게 안아줄게!",
  "비록 미션은 아쉬웠지만, 넌 항상 우리의 소중한 친구야.", "스스로를 자책하지 마. 넌 충분히 잘 해내고 있어!",
  "너의 솔직한 노력만으로도 우리는 큰 감동을 받았어.", "오늘 하루, 누구보다 마음 졸였을 너에게 수고의 박수를 쳐!",
  "다음에 다시 기회가 온다면 넌 분명 해낼 수 있을 거야!", "우리 같이 부족한 점을 채워나가자, 언제나 곁에 있을게.",
  "네가 포기하지 않고 끝까지 하루를 마친 것에 감사해.", "너의 짐을 우리가 나눠 질게, 우린 달보드레 반이니까!",
  "슬퍼하지 마! 네가 웃어야 교실이 다시 환해질 테니까.", "너의 좋은 의도와 상냥한 마음은 우리가 다 알고 있단다.",
  "우린 결과로 널 판단하지 않아. 넌 그 자체로 소중해.", "괜찮아, 툴툴 털고 내일은 함께 더 크게 웃어보자!",
  "너에게 너그러운 마음을 전할게. 넌 혼자가 아니야.", "오늘의 실수가 내일의 널 더 반짝이게 만들어 줄 거야.",
  "마음 무거웠지? 이제 다 내려놓고 편안하게 쉬어.", "우리가 널 믿는 마음은 변함없어. 기운 내, 파이팅!"
];

const defaultRoles = [
  { name: '학급문고 정리', manual: '' }, { name: '우유 배달', manual: '' }, { name: '다툼 중재자', manual: '' }, 
  { name: '생활태도 체크', manual: '' }, { name: '현령(칠/신/질)', manual: '' }, { name: '질서 관리', manual: '' }, 
  { name: '현령(문고/문/다)', manual: '' }, { name: '감찰사', manual: '' }, { name: '칠판 정리', manual: '' }, 
  { name: '생활 배출물 관리', manual: '' }, { name: '현령(과/태/복/부)', manual: '' }, { name: '복사물 가져오기', manual: '' }, 
  { name: '가습기 관리', manual: '' }, { name: '현령(가/우/배)', manual: '' }, { name: '과제 제출물 확인', manual: '' }, 
  { name: '신발장 관리', manual: '' }, { name: '부착물 관리', manual: '' }, { name: '문 닫기', manual: '' }, { name: '향리', manual: '' }
];

const defaultStudents = [
  { id: 1, name: '금채율', role: '학급문고 정리', group: 1, isLeader: true }, { id: 2, name: '김라희', role: '우유 배달', group: 1, isLeader: false },
  { id: 3, name: '김민지', role: '다툼 중재자', group: 1, isLeader: false }, { id: 4, name: '김수은', role: '생활태도 체크', group: 1, isLeader: false },
  { id: 5, name: '김시우', role: '현령(칠/신/질)', group: 2, isLeader: true }, { id: 6, name: '박서정', role: '질서 관리', group: 2, isLeader: false },
  { id: 7, name: '이하윤', role: '학급문고 정리', group: 2, isLeader: false }, { id: 8, name: '장세아', role: '현령(문고/문/다)', group: 2, isLeader: false },
  { id: 9, name: '최예나', role: '우유 배달', group: 3, isLeader: true }, { id: 10, name: '허수정', role: '감찰사', group: 3, isLeader: false },
  { id: 11, name: '황지인', role: '칠판 정리', group: 3, isLeader: false }, { id: 12, name: '김도운', role: '생활 배출물 관리', group: 3, isLeader: false },
  { id: 13, name: '김윤재', role: '현령(과/태/복/부)', group: 4, isLeader: true }, { id: 14, name: '김정현', role: '질서 관리', group: 4, isLeader: false },
  { id: 15, name: '김태영', role: '복사물 가져오기', group: 4, isLeader: false }, { id: 16, name: '김해준', role: '칠판 정리', group: 4, isLeader: false },
  { id: 17, name: '박동민', role: '과제 제출물 확인', group: 5, isLeader: true }, { id: 18, name: '서이환', role: '가습기 관리', group: 5, isLeader: false },
  { id: 19, name: '윤호영', role: '현령(가/우/배)', group: 5, isLeader: false }, { id: 20, name: '이서준', role: '과제 제출물 확인', group: 5, isLeader: false },
  { id: 21, name: '이승현', role: '신발장 관리', group: 6, isLeader: true }, { id: 22, name: '임유성', role: '질서 관리', group: 6, isLeader: false },
  { id: 23, name: '장세형', role: '다툼 중재자', group: 6, isLeader: false }, { id: 24, name: '조승원', role: '부착물 관리', group: 6, isLeader: false },
  { id: 25, name: '차민서', role: '신발장 관리', group: 6, isLeader: false }, { id: 26, name: '배지훈', role: '문 닫기', group: 6, isLeader: false }
];

const App = () => {
  const scriptURL = "https://script.google.com/macros/s/AKfycbw3j6LxhdO0ewIXxkIGrh_pczxrfOJr3A_PTHTsJY1rKb6ES7bPxPQuxRKidd6IWK5_/exec"; 
  const fmt = (num) => { const n = parseFloat(num); return isNaN(n) ? 0 : parseFloat(n.toFixed(2)); };
  const getRoleBonus = (role) => { 
    if (!role || typeof role !== 'string') return 1; 
    if (role.includes('감찰사')) return 2; 
    if (role.includes('현령')) return 1.5; 
    if (role.includes('향리')) return 1.2; 
    return 1; 
  };

  const [activeTab, setActiveTab] = useState('classroom'); 
  const [groupFilter, setGroupFilter] = useState('all'); 
  const [students, setStudents] = useState([]);
  const [rolesList, setRolesList] = useState([]); 
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
  const [history, setHistory] = useState([]);
  const [resetTimestamp, setResetTimestamp] = useState(0); 
  const [targetScore, setTargetScore] = useState(3000);
  const [penaltyTimeout, setPenaltyTimeout] = useState(10.0);
  const [penaltySubject, setPenaltySubject] = useState(10.0);
  const [leaderConfig, setLeaderConfig] = useState({ allClearBonus: 20 });
  const [evoThresholds, setEvoThresholds] = useState({ e1: 50, e2: 100, e3: 200, e4: 300, e5: 400, e6: 500, e7: 700, e8: 1000, e9: 1500 });
  const [tierThresholds, setTierThresholds] = useState({ t1: 200, t2: 400, t3: 600, t4: 800, t5: 1000, t6: 1500, t7: 2000, t8: 3000, t9: 5000 });
  const [shopItems, setShopItems] = useState([{ id: 'item_1', name: '간식 결제', price: 20.0 }, { id: 'item_2', name: '모둠선택 결제', price: 100.0 }]);
  const defaultGachaNormal = { cost: 30, t1: { name: '😭 앗! 꽝입니다.', prob: 50, reward: 0 }, t2: { name: '🪙 럭키! 페이백!', prob: 30, reward: 20 }, t3: { name: '🍬 와우! 간식 당첨!', prob: 15, reward: 20 }, t4: { name: '🎰 잭팟!!', prob: 5, reward: 100 } };
  const defaultGachaSpecial = { cost: 30, t1: { name: '😭 앗! 꽝...', prob: 10, reward: 0 }, t2: { name: '🪙 럭키! 페이백!', prob: 20, reward: 20 }, t3: { name: '🍬 혜자 간식 당첨!', prob: 40, reward: 20 }, t4: { name: '✨ 동민신의 축복(잭팟)!!', prob: 30, reward: 150 } };
  const [gachaConfig, setGachaConfig] = useState({ mode: 'normal', normal: defaultGachaNormal, special: defaultGachaSpecial });
  const [gachaEditTab, setGachaEditTab] = useState('normal'); 
  const [bossPresets, setBossPresets] = useState([{ id: 'b1', name: '전담 선생님의 감시', desc: '아이들의 예쁜 마음을 모아 정화하세요!', reward: 100, penalty: 100 }, { id: 'b2', name: '교장 선생님의 순시', desc: '모두가 바른 태도를 보여주면 천사가 됩니다!', reward: 200, penalty: 200 }]);
  const [marketPresets, setMarketPresets] = useState([{ id: 'm1', name: '달보드레 블랙마켓 (일반)', desc: '희귀 아이템을 팔아보세요.' }, { id: 'm2', name: '🌙 속죄의 퀘스트 상점', desc: '감점을 지우고 싶은 자, 퀘스트를 수락하라!' }]);
  const [marketItems, setMarketItems] = useState([{ id: 'm_item_1', name: '마술 직관권', price: 50 }, { id: 'm_item_2', name: '1일 현령 체험권', price: 150 }, { id: 'm_item_3', name: '📜 [퀘스트] 그림자 수호대 (일주일 봉사)', price: 0 }, { id: 'm_item_4', name: '🎭 [퀘스트] 비밀의 무대 (1분 장기자랑)', price: 0 }]);
  const [manitoConfig, setManitoConfig] = useState({ targetId: null, reward: 50 });

  const [newRoleName, setNewRoleName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newBossName, setNewBossName] = useState('');
  const [newBossDesc, setNewBossDesc] = useState('');
  const [newBossReward, setNewBossReward] = useState(''); 
  const [newBossPenalty, setNewBossPenalty] = useState(''); 
  const [newMarketName, setNewMarketName] = useState('');
  const [newMarketDesc, setNewMarketDesc] = useState('');
  const [selectedGachaStudent, setSelectedGachaStudent] = useState("");
  const [selectedMarketStudent, setSelectedMarketStudent] = useState("");
  const [selectedStoreStudent, setSelectedStoreStudent] = useState(""); 
  const [manualAdjustAmount, setManualAdjustAmount] = useState(''); 

  const [isLoading, setIsLoading] = useState(true);
  const [teacherTab, setTeacherTab] = useState('history');
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null);
  const [showJackpot, setShowJackpot] = useState(false); 
  const [showGuide, setShowGuide] = useState(false); 
  const [storeSelected, setStoreSelected] = useState([]); 
  const [tooltipInfo, setTooltipInfo] = useState({ id: null, text: '' });
  const [particle, setParticle] = useState(null);
  const [manitoRevealState, setManitoRevealState] = useState(null); 
  const [manitoRevealMsg, setManitoRevealMsg] = useState("");
  const [selectedHyunRole, setSelectedHyunRole] = useState(null);

  const safeRolesArray = useMemo(() => {
    const arr = safeArray(rolesList);
    if (arr.length === 0) return defaultRoles;
    return arr.map(r => {
      if (typeof r === 'string') return { name: r, manual: '' };
      return { name: r?.name || '', manual: r?.manual || '' };
    });
  }, [rolesList]);

  const safeStudentsArray = useMemo(() => {
    const arr = safeArray(students);
    if (arr.length === 0) return defaultStudents;
    return arr.map(s => ({ ...s, group: s.group || 1, isLeader: !!s.isLeader, role: s.role || '' }));
  }, [students]);

  useEffect(() => {
    const fetchInitial = async () => {
      setHistory(JSON.parse(localStorage.getItem('dal_v30_history')) || []);
      if (!DATABASE_URL || DATABASE_URL.includes("복사한_주소")) { setIsLoading(false); return; }
      const dbUrl = `${DATABASE_URL.replace(/\/$/, '')}/classData_V2.json`;
      try {
        const response = await fetch(dbUrl);
        const data = await response.json();
        if (data) {
          if (data.students) setStudents(safeArray(data.students));
          if (data.rolesList) setRolesList(safeArray(data.rolesList));
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
          if (data.gachaConfig) setGachaConfig(data.gachaConfig.mode ? data.gachaConfig : { mode: 'normal', normal: data.gachaConfig, special: defaultGachaSpecial });
          setShopItems(safeArray(data.shopItems));
          setBossPresets(safeArray(data.bossPresets));
          setMarketPresets(safeArray(data.marketPresets));
          setMarketItems(safeArray(data.marketItems));
          if (data.manitoConfig) setManitoConfig(data.manitoConfig);
          if (data.evoThresholds) setEvoThresholds(data.evoThresholds);
          if (data.tierThresholds) setTierThresholds(data.tierThresholds);
        }
      } catch (e) {}
      if (scriptURL) { try { const res = await fetch(scriptURL); const data = await res.json(); if (data.history) setHistory(safeArray(data.history)); } catch (e) {} }
      setIsLoading(false);
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!DATABASE_URL || DATABASE_URL.includes("복사한_주소")) return;
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
          if (data.students) setStudents(safeArray(data.students));
          if (data.gachaConfig?.mode) setGachaConfig(prev => ({...prev, mode: data.gachaConfig.mode}));
        }
      } catch (e) {}
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('dal_v30_history', JSON.stringify(history));
    if (DATABASE_URL && !DATABASE_URL.includes("복사한_주소")) {
       const dbUrl = `${DATABASE_URL.replace(/\/$/, '')}/classData_V2.json`;
       const configUpdates = { shopItems, bossPresets, marketPresets, marketItems, gachaConfig, manitoConfig, evoThresholds, tierThresholds, targetScore, leaderConfig, rolesList };
       fetch(dbUrl, { method: 'PATCH', body: JSON.stringify(configUpdates) }).catch(e=>{});
    }
  }, [history, shopItems, bossPresets, marketPresets, marketItems, gachaConfig, manitoConfig, evoThresholds, tierThresholds, targetScore, leaderConfig, rolesList, isLoading]);

  const syncToFirebase = async (updates) => {
    if (!DATABASE_URL || DATABASE_URL.includes("복사한_주소")) {
      if(updates.checkedStudents) setCheckedStudents(updates.checkedStudents);
      if(updates.classPrep) setClassPrep(updates.classPrep);
      if(updates.threeCompliments) setThreeCompliments(updates.threeCompliments);
      if(updates.teacherCompliments) setTeacherCompliments(updates.teacherCompliments);
      if(updates.timeoutChecks) setTimeoutChecks(updates.timeoutChecks);
      if(updates.subjectChecks) setSubjectChecks(updates.subjectChecks);
      if(updates.usedPoints) setUsedPoints(updates.usedPoints);
      if(updates.wipedPoints) setWipedPoints(updates.wipedPoints);
      if(updates.leaderBonuses) setLeaderBonuses(updates.leaderBonuses);
      if(updates.activeBoss !== undefined) setActiveBoss(updates.activeBoss);
      if(updates.bossHp !== undefined) setBossHp(updates.bossHp);
      if(updates.bossAttacks !== undefined) setBossAttacks(updates.bossAttacks);
      if(updates.bossBonusPoints !== undefined) setBossBonusPoints(updates.bossBonusPoints);
      if(updates.manualTotalBonus !== undefined) setManualTotalBonus(updates.manualTotalBonus);
      if(updates.students) setStudents(updates.students);
      if(updates.rolesList) setRolesList(updates.rolesList);
      return;
    }
    const dbUrl = `${DATABASE_URL.replace(/\/$/, '')}/classData_V2.json`;
    try { await fetch(dbUrl, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  const todaySeed = new Date().toDateString();
  const dailyBuffs = [{ title: "오늘은 칭찬의 날!", desc: "모두에게 따뜻한 한마디를!" }, { title: "청결 수호대!", desc: "청소 만점 달성을 위해!" }, { title: "단합의 힘", desc: "모든 미션 통과시 특별 보상" }, { title: "평화로운 하루", desc: "오늘 타임아웃 0명을 향해!" }];
  const seedNum = todaySeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const todaysBuff = dailyBuffs[seedNum % dailyBuffs.length];
  const defaultRandomManitoId = safeStudentsArray.length > 0 ? safeStudentsArray[seedNum % safeStudentsArray.length].id : 1;
  const effectiveManitoId = manitoConfig?.targetId || defaultRandomManitoId;
  const effectiveManitoName = safeStudentsArray.find(s => s.id === effectiveManitoId)?.name || ''; 

  const dailyGoals = [{ id: 'g1', title: '지적 받지 않음 (50p)', points: 50, icon: <ShieldCheck className="w-5 h-5" /> }, { id: 'g2', title: '매번 박수 성공 (20p)', points: 20, icon: <Volume2 className="w-5 h-5" /> }, { id: 'g4', title: '청소 만점 (10p)', points: 10, icon: <RefreshCcw className="w-5 h-5" /> }, { id: 'g5', title: '전담 태도 우수 (20p)', points: 20, icon: <Clock className="w-5 h-5" /> }];

  const getEvolution = (score) => {
    if (score <= evoThresholds.e1) return { icon: '🥚', texts: ["아직은 졸려요...", "안에서 힘을 모으는 중!"] };
    if (score <= evoThresholds.e2) return { icon: '🐣', texts: ["껍질에 금이 갔어요!", "으쌰으쌰! 힘을 내요!"] };
    if (score <= evoThresholds.e3) return { icon: '🐥', texts: ["삐약삐약, 반가워요!", "쑥쑥 크고 있어요!"] };
    if (score <= evoThresholds.e4) return { icon: '🐤', texts: ["폴짝폴짝 뛰는 게 좋아요!", "날개가 조금 커졌어요!"] };
    if (score <= evoThresholds.e5) return { icon: '🐔', texts: ["이제 제법 어른 티가 나죠?", "위풍당당 걷기!"] };
    if (score <= evoThresholds.e6) return { icon: '🕊️', texts: ["더 넓은 세상을 보고 싶어요!", "하늘을 나는 기분!"] };
    if (score <= evoThresholds.e7) return { icon: '🦅', texts: ["하늘의 제왕이 될 테야!", "매서운 눈빛!"] };
    if (score <= evoThresholds.e8) return { icon: '🦄', texts: ["마법 같은 힘이 솟아나요!", "무지개 위를 달려볼까?"] };
    if (score <= evoThresholds.e9) return { icon: '🐲', texts: ["크아앙! 내 불꽃을 조심해!", "아직은 꼬마 드래곤!"] };
    return { icon: '🐉', texts: ["우주를 호령하는 전설의 등장!", "내가 바로 전설이다!"] };
  };

  const getLifetimeTier = (sum) => {
    if (sum < tierThresholds.t1) return { icon: '🤎', label: '1. 잠든 씨앗' };
    if (sum < tierThresholds.t2) return { icon: '🌱', label: '2. 자라나는 새싹' };
    if (sum < tierThresholds.t3) return { icon: '🌿', label: '3. 파릇한 줄기' };
    if (sum < tierThresholds.t4) return { icon: '☘️', label: '4. 행운의 네잎클로버' };
    if (sum < tierThresholds.t5) return { icon: '🌷', label: '5. 수줍은 꽃봉오리' };
    if (sum < tierThresholds.t6) return { icon: '🌻', label: '6. 활짝 핀 꽃' };
    if (sum < tierThresholds.t7) return { icon: '🍎', label: '7. 탐스러운 열매' };
    if (sum < tierThresholds.t8) return { icon: '🌳', label: '8. 든든한 나무' };
    if (sum < tierThresholds.t9) return { icon: '🌲', label: '9. 거대한 숲' };
    return { icon: '👑', label: '10. 생명의 세계수' };
  };

  const validHistory = useMemo(() => history.filter(h => h.id > resetTimestamp), [history, resetTimestamp]);

  const todayStudentStats = useMemo(() => {
    return safeStudentsArray.map(s => {
      const roleBonus = getRoleBonus(s.role);
      const leaderBonusPts = leaderBonuses[s.id] ? (leaderConfig.allClearBonus || 20) : 0;
      const pos = (checkedStudents[s.id] ? roleBonus : 0) + (classPrep[s.id] ? 1 : 0) + (threeCompliments[s.id] ? 1 : 0) + ((teacherCompliments[s.id] || 0) * 1) + leaderBonusPts;
      const neg = (timeoutChecks[s.id] || 0) * penaltyTimeout + (subjectChecks[s.id] || 0) * penaltySubject;
      return { ...s, pos, neg };
    });
  }, [checkedStudents, classPrep, threeCompliments, teacherCompliments, timeoutChecks, subjectChecks, penaltyTimeout, penaltySubject, safeStudentsArray, leaderBonuses, leaderConfig]);

  const allStats = useMemo(() => {
    const stats = {};
    safeStudentsArray.forEach(s => { stats[s.id] = { ...s, pos: 0, neg: 0, sum: 0, used: 0, wiped: 0, net: 0, badges: [] }; });
    validHistory.forEach(rec => {
      let pT = rec.penaltyConfig?.timeout || 10; let pS = rec.penaltyConfig?.subject || 10;
      try {
        const ind = JSON.parse(rec.rawInd || "{}"); const per = JSON.parse(rec.rawPer || "{}"); const tcomp = JSON.parse(rec.rawTComp || "{}");
        const tm = JSON.parse(rec.rawTm || "{}"); const sb = JSON.parse(rec.rawSb || "{}"); const lb = JSON.parse(rec.rawLB || "{}"); 
        Object.keys(ind).forEach(id => { if(ind[id] && stats[id]) stats[id].pos += getRoleBonus(stats[id].role); });
        Object.keys(per).forEach(key => { if(per[key]) { const id = parseInt(key.replace('_3c', '')); if(stats[id]) stats[id].pos += 1; }});
        Object.keys(tcomp).forEach(id => { if(tcomp[id] && stats[id]) stats[id].pos += (tcomp[id] * 1); });
        Object.keys(lb).forEach(id => { if(lb[id] && stats[id]) stats[id].pos += (rec.leaderBonusAmount || 20); });
        Object.keys(tm).forEach(id => { if(tm[id] && stats[id]) stats[id].neg += (tm[id] * pT); });
        Object.keys(sb).forEach(id => { if(sb[id] && stats[id]) stats[id].neg += (sb[id] * pS); });
      } catch (e) {}
    });
    safeStudentsArray.forEach(s => {
      const current = todayStudentStats.find(ts => ts.id === s.id);
      if(current) { stats[s.id].pos += current.pos; stats[s.id].neg += current.neg; }
      stats[s.id].sum = fmt(stats[s.id].pos - stats[s.id].neg); 
      stats[s.id].used = parseFloat(usedPoints[s.id] || 0);     
      stats[s.id].wiped = parseFloat(wipedPoints[s.id] || 0);   
      stats[s.id].net = fmt(stats[s.id].sum - stats[s.id].used - stats[s.id].wiped); 
      if (stats[s.id].pos >= 200) stats[s.id].badges.push('🏅'); 
      if (stats[s.id].pos >= 100 && stats[s.id].neg === 0) stats[s.id].badges.push('🛡️'); 
      if (stats[s.id].
