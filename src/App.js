/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Trophy, RefreshCcw, ShieldCheck, 
  Volume2, Heart, Clock, Lock, BarChart3, History, Save, X, 
  Minus, Plus, MinusCircle, PlusCircle, AlertTriangle, Database, Gift, UserPlus, RotateCcw, Star, Loader2, Target, Settings, Trash2, ShoppingCart, SlidersHorizontal, Sparkles, Zap, Flame, Crown, Sword, Coins, BookOpen, Briefcase, LayoutDashboard, ClipboardCheck, User
} from 'lucide-react';

// ==========================================
// 🚨 선생님의 파이어베이스 주소 (V2 전용 독립 공간)
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/"; 
// ==========================================

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

// 🛡️ 데이터 안전 장치
const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
};

// 🌟 마니또 외침 멘트 (미리 지정된 감동적인 60개)
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

// 🌟 기본 역할 및 명단 설정
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
  
  // 🛡️ 역할 보너스 오류 방지
  const getRoleBonus = (role) => { 
    if (!role || typeof role !== 'string') return 1; 
    if (role.includes('감찰사')) return 2; 
    if (role.includes('현령')) return 1.5; 
    if (role.includes('향리')) return 1.2; 
    return 1; 
  };

  // --- 상태 관리 ---
  const [activeTab, setActiveTab] = useState('classroom'); // 'classroom' | 'hyunryeong' | 'shop' | 'info' | 'admin'
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

  // 🛡️ 데이터 포맷 안전화 (백지화 절대 방지)
  const safeRolesArray = useMemo(() => {
    return safeArray(rolesList).map(r => {
      if (typeof r === 'string') return { name: r, manual: '' };
      return { name: r?.name || '', manual: r?.manual || '' };
    });
  }, [rolesList]);

  const safeStudentsArray = useMemo(() => {
    const arr = safeArray(students).length > 0 ? safeArray(students) : defaultStudents;
    return arr.map(s => ({
      ...s,
      group: s.group || 1,
      isLeader: !!s.isLeader,
      role: s.role || ''
    }));
  }, [students]);

  // 📡 데이터 로딩 (classData_V2)
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
      if (scriptURL) {
        try {
          const res = await fetch(scriptURL);
          const data = await res.json();
          if (data.history) setHistory(safeArray(data.history));
        } catch (e) {}
      }
      setIsLoading(false);
    };
    fetchInitial();
  }, []);

  // 📡 실시간 수신기
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

  // 📡 백업 및 송신기
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

  // --- 계산 로직 ---
  const todaySeed = new Date().toDateString();
  const dailyBuffs = [
    { title: "오늘은 칭찬의 날!", desc: "모두에게 따뜻한 한마디를!" },
    { title: "청결 수호대!", desc: "청소 만점 달성을 위해!" },
    { title: "단합의 힘", desc: "모든 미션 통과시 특별 보상" },
    { title: "평화로운 하루", desc: "오늘 타임아웃 0명을 향해!" }
  ];
  const seedNum = todaySeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const todaysBuff = dailyBuffs[seedNum % dailyBuffs.length];
  
  const defaultRandomManitoId = safeStudentsArray.length > 0 ? safeStudentsArray[seedNum % safeStudentsArray.length].id : 1;
  const effectiveManitoId = manitoConfig?.targetId || defaultRandomManitoId;
  const effectiveManitoName = safeStudentsArray.find(s => s.id === effectiveManitoId)?.name || ''; 

  const dailyGoals = [
    { id: 'g1', title: '지적 받지 않음 (50p)', points: 50, icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'g2', title: '매번 박수 성공 (20p)', points: 20, icon: <Volume2 className="w-5 h-5" /> },
    { id: 'g4', title: '청소 만점 (10p)', points: 10, icon: <RefreshCcw className="w-5 h-5" /> },
    { id: 'g5', title: '전담 태도 우수 (20p)', points: 20, icon: <Clock className="w-5 h-5" /> },
  ];

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
      if (stats[s.id].used >= 300) stats[s.id].badges.push('💸'); 
    });
    return Object.values(stats);
  }, [validHistory, todayStudentStats, usedPoints, wipedPoints, safeStudentsArray]);

  const todayStats = useMemo(() => {
    const pos = todayStudentStats.reduce((s, c) => s + c.pos, 0) + dailyGoals.reduce((sum, g) => sum + (checkedGroupGoals[g.id] ? g.points : 0), 0) + (isWeeklyClaimed ? 100 : 0) + (bossBonusPoints > 0 ? bossBonusPoints : 0); 
    const neg = todayStudentStats.reduce((s, c) => s + c.neg, 0) + (bossBonusPoints < 0 ? Math.abs(bossBonusPoints) : 0);
    return { pos, neg, total: pos - neg };
  }, [todayStudentStats, checkedGroupGoals, isWeeklyClaimed, bossBonusPoints]);

  const cumulativeClassScore = useMemo(() => {
    const pastTotal = validHistory.reduce((sum, rec) => sum + ((parseFloat(rec.total) || 0) * ((rec.target === 300 || !rec.target) ? 10 : 1)), 0);
    return fmt(pastTotal + todayStats.total + manualTotalBonus);
  }, [validHistory, todayStats, manualTotalBonus]);

  const classGuardian = useMemo(() => {
    if (cumulativeClassScore < targetScore * 0.3) return { icon: '🥚', name: '우리 반 알', desc: '따뜻한 온기가 필요해요' };
    if (cumulativeClassScore < targetScore * 0.6) return { icon: '🐲', name: '깨어난 꼬마 용', desc: '우리 반을 지키기 시작했어요!' };
    if (cumulativeClassScore < targetScore * 0.9) return { icon: '✨🐉', name: '빛의 드래곤', desc: '우리 반은 천하무적!' };
    return { icon: '👑🐉', name: '전설의 수호신', desc: '기적이 일어나는 교실!' };
  }, [cumulativeClassScore, targetScore]);

  const top5Gainers = useMemo(() => [...todayStudentStats].sort((a,b) => b.pos - a.pos).slice(0, 5), [todayStudentStats]);
  const top3Losers = useMemo(() => [...todayStudentStats].sort((a,b) => b.neg - a.neg).filter(s => s.neg > 0).slice(0, 3), [todayStudentStats]);
  
  const filteredStudents = useMemo(() => {
    if (groupFilter === 'all') return allStats.sort((a,b)=>a.id-b.id);
    return allStats.filter(s => parseInt(s.group) === parseInt(groupFilter)).sort((a,b)=>a.id-b.id);
  }, [allStats, groupFilter]);

  // --- 이벤트 핸들러 ---
  const handleAdjust = (id, type, delta, e) => {
    if (delta > 0) playSound('good'); else playSound('bad');
    if (e && delta > 0) showParticle(e.clientX, e.clientY, "+");
    if (type === 'timeout') syncToFirebase({ timeoutChecks: { ...timeoutChecks, [id]: Math.max(0, fmt((timeoutChecks[id] || 0) + delta)) }});
    else if (type === 'subject') syncToFirebase({ subjectChecks: { ...subjectChecks, [id]: Math.max(0, fmt((subjectChecks[id] || 0) + delta)) }});
    else if (type === 'compliment') syncToFirebase({ teacherCompliments: { ...teacherCompliments, [id]: Math.max(0, fmt((teacherCompliments[id] || 0) + delta)) } });
  };

  const handleToggle = (id, type) => {
    playSound('good');
    const updates = {};
    if (type === 'role') updates.checkedStudents = { ...checkedStudents, [id]: !checkedStudents[id] };
    if (type === 'prep') updates.classPrep = { ...classPrep, [id]: !classPrep[id] };
    if (type === 'comp') updates.threeCompliments = { ...threeCompliments, [id]: !threeCompliments[id] };
    syncToFirebase(updates);
  };

  const handleGroupAllClear = (leaderId, groupNum, e) => {
    if(leaderBonuses[leaderId]) return alert("이미 오늘 리더십 보너스를 받았습니다! 내일 다시 시도하세요.");
    playSound('good'); if (e) showParticle(e.clientX, e.clientY, "👑");
    const newRoles = {...checkedStudents}; const newPreps = {...classPrep};
    safeStudentsArray.filter(s => parseInt(s.group) === parseInt(groupNum)).forEach(s => { newRoles[s.id] = true; newPreps[s.id] = true; });
    const newBonuses = {...leaderBonuses, [leaderId]: true};
    setCheckedStudents(newRoles); setClassPrep(newPreps); setLeaderBonuses(newBonuses);
    syncToFirebase({ checkedStudents: newRoles, classPrep: newPreps, leaderBonuses: newBonuses });
    alert(`${groupNum}모둠 전원 출격 완료! 모둠장에게 리더십 보너스 +${leaderConfig.allClearBonus || 20}점이 부여되었습니다!`);
  };

  const handlePurify = (id, e) => {
    const isPurified = bossAttacks[id];
    const newAttacks = { ...bossAttacks, [id]: !isPurified };
    if (!isPurified) { playSound('good'); if (e) showParticle(e.clientX, e.clientY, "✨"); } else { playSound('bad'); }
    setBossAttacks(newAttacks); syncToFirebase({ bossAttacks: newAttacks });
    if (!isPurified && Object.values(newAttacks).filter(Boolean).length >= safeStudentsArray.length) {
      setTimeout(() => {
        playSound('jackpot'); setShowModal('bossClear');
        const newBonus = bossBonusPoints + (activeBoss?.reward || 100);
        setBossBonusPoints(newBonus); setActiveBoss(null); setBossAttacks({});
        syncToFirebase({ bossBonusPoints: newBonus, activeBoss: null, bossAttacks: {} });
      }, 800);
    }
  };

  const currentBossHits = Object.values(bossAttacks || {}).filter(Boolean).length;
  const maxBossHits = safeStudentsArray.length;
  const bossProgress = Math.min((currentBossHits / maxBossHits) * 100, 100);
  let bossEmoji = '👿'; if (bossProgress >= 80) bossEmoji = '😇'; else if (bossProgress >= 40) bossEmoji = '🥺';  

  const isDongminGod = gachaConfig.mode === 'special';
  const currentGachaSettings = gachaConfig[gachaConfig.mode || 'normal'];

  const handleGacha = (id) => {
    const user = allStats.find(s => s.id === id);
    if (!user || user.net < currentGachaSettings.cost) return alert(`잔여 점수가 ${currentGachaSettings.cost}p 이상 필요합니다!`);
    if (!window.confirm(`[${user.name}] ${currentGachaSettings.cost}p를 소모하여 뽑기를 진행할까요?`)) return;
    const rand = Math.random() * 100; let resultMsg = ""; let reward = 0; let cumProb = 0; let isJackpot = false;
    if (rand < (cumProb += parseFloat(currentGachaSettings?.t1?.prob || 0))) { resultMsg = currentGachaSettings?.t1?.name; reward = parseFloat(currentGachaSettings?.t1?.reward || 0); }
    else if (rand < (cumProb += parseFloat(currentGachaSettings?.t2?.prob || 0))) { resultMsg = currentGachaSettings?.t2?.name; reward = parseFloat(currentGachaSettings?.t2?.reward || 0); }
    else if (rand < (cumProb += parseFloat(currentGachaSettings?.t3?.prob || 0))) { resultMsg = currentGachaSettings?.t3?.name; reward = parseFloat(currentGachaSettings?.t3?.reward || 0); }
    else { resultMsg = currentGachaSettings?.t4?.name; reward = parseFloat(currentGachaSettings?.t4?.reward || 0); isJackpot = true; }
    syncToFirebase({ usedPoints: { ...usedPoints, [id]: fmt((usedPoints[id] || 0) + parseFloat(currentGachaSettings.cost) - reward) } });
    setSelectedGachaStudent(""); 
    if (isJackpot) { playSound('jackpot'); setShowJackpot(true); setTimeout(() => setShowJackpot(false), 6000); } 
    else { playSound('gacha'); alert(`[가챠 결과] ${resultMsg}`); }
  };

  const handleStudentStoreBuy = (studentId, item) => {
    const user = allStats.find(s => s.id === studentId);
    if (!user || user.net < item.price) return alert("잔여 점수가 부족합니다!");
    if (!window.confirm(`[${user.name}] 학생, ${item.name}을(를) ${item.price}p에 정말 구매할까요?\n(선생님께 확인받고 누르세요!)`)) return;
    playSound('buy');
    syncToFirebase({ usedPoints: { ...usedPoints, [studentId]: fmt((usedPoints[studentId] || 0) + item.price) } });
    setSelectedStoreStudent(""); alert(`🎉 [${item.name}] 결제가 완료되었습니다! 선생님께 말씀해 주세요.`);
  };

  const handleMarketBuy = (studentId, item) => {
    const user = allStats.find(s => s.id === studentId);
    if (!user || user.net < item.price) return alert("점수가 부족합니다!");
    if (!window.confirm(`[${user.name}] 학생, ${item.name}을(를) ${item.price}p에 구매할까요?`)) return;
    playSound('buy');
    syncToFirebase({ usedPoints: { ...usedPoints, [studentId]: fmt((usedPoints[studentId] || 0) + item.price) } });
    setSelectedMarketStudent(""); alert("구매 완료/퀘스트 신청 완료!");
  };

  const handleMultiConsume = (amount, label) => {
    if (storeSelected.length === 0) return alert("학생을 먼저 선택해주세요.");
    if (!window.confirm(`선택한 ${storeSelected.length}명에게 [${label}] 항목으로 ${amount}점을 차감하시겠습니까?`)) return;
    const nextUsed = { ...usedPoints };
    storeSelected.forEach(id => { nextUsed[id] = fmt((nextUsed[id] || 0) + amount); });
    syncToFirebase({ usedPoints: nextUsed }); setStoreSelected([]); alert(`${label} 결제 완료!`);
  };

  const showParticle = (x, y, text) => { setParticle({ x, y, text, id: Date.now() }); setTimeout(() => setParticle(null), 800); };
  const handleEvolutionClick = (id, textsArray) => {
    const randomText = textsArray[Math.floor(Math.random() * textsArray.length)];
    setTooltipInfo({ id, text: randomText }); setTimeout(() => setTooltipInfo({ id: null, text: '' }), 2500); 
  };

  // 🔥 관리실 핸들러들
  const handleAddRole = () => {
    if (!newRoleName.trim()) return alert("직업 이름을 입력하세요.");
    const updatedRoles = [...safeRolesArray, { name: newRoleName.trim(), manual: '' }];
    setRolesList(updatedRoles); syncToFirebase({ rolesList: updatedRoles }); setNewRoleName('');
  };
  const handleDeleteRole = (roleToDelete) => {
    if(window.confirm(`'${roleToDelete}' 직업을 삭제할까요?`)) {
      const updatedRoles = safeRolesArray.filter(r => r.name !== roleToDelete);
      setRolesList(updatedRoles); syncToFirebase({ rolesList: updatedRoles });
    }
  };
  const handleStudentFieldChange = (studentId, field, value) => {
    const updatedStudents = safeStudentsArray.map(s => s.id === studentId ? { ...s, [field]: value } : s);
    setStudents(updatedStudents); syncToFirebase({ students: updatedStudents });
  };

  const handleAddShopItem = () => {
    if (!newItemName || !newItemPrice) return alert("입력 오류");
    const price = parseFloat(newItemPrice); if (isNaN(price)) return;
    const newItems = [...safeArray(shopItems), { id: `item_${Date.now()}`, name: newItemName, price: fmt(price) }];
    setShopItems(newItems); syncToFirebase({ shopItems: newItems }); setNewItemName(''); setNewItemPrice('');
  };
  const handleDeleteShopItem = (id) => { 
    if (window.confirm("삭제할까요?")) { const newItems = safeArray(shopItems).filter(item => item.id !== id); setShopItems(newItems); syncToFirebase({ shopItems: newItems }); }
  };

  const handleAddBoss = () => {
    if (!newBossName || !newBossDesc) return alert("입력 오류");
    const newBosses = [...safeArray(bossPresets), { id: `b_${Date.now()}`, name: newBossName, desc: newBossDesc, reward: parseFloat(newBossReward)||100, penalty: parseFloat(newBossPenalty)||100 }];
    setBossPresets(newBosses); syncToFirebase({ bossPresets: newBosses }); setNewBossName(''); setNewBossDesc(''); setNewBossReward(''); setNewBossPenalty('');
  };
  const handleDeleteBoss = (id) => { const newBosses = safeArray(bossPresets).filter(b => b.id !== id); setBossPresets(newBosses); syncToFirebase({ bossPresets: newBosses }); };

  const handleAddMarket = () => {
    if (!newMarketName || !newMarketDesc) return alert("입력 오류");
    const newMarkets = [...safeArray(marketPresets), { id: `m_${Date.now()}`, name: newMarketName, desc: newMarketDesc }];
    setMarketPresets(newMarkets); syncToFirebase({ marketPresets: newMarkets }); setNewMarketName(''); setNewMarketDesc('');
  };
  const handleDeleteMarket = (id) => { const newMarkets = safeArray(marketPresets).filter(m => m.id !== id); setMarketPresets(newMarkets); syncToFirebase({ marketPresets: newMarkets }); };

  const clearTodayChecks = () => {
    if (window.confirm('⚠️ 오늘 클릭한 모든 체크 내역을 초기화합니다.')) {
      syncToFirebase({ checkedStudents: {}, classPrep: {}, threeCompliments: {}, teacherCompliments: {}, checkedGroupGoals: {}, timeoutChecks: {}, subjectChecks: {}, leaderBonuses: {} });
    }
  };

  const resetGoalAllScores = () => {
    if (window.confirm('🚩 모든 학생의 잔여 점수를 0으로 만들고 새 목표를 시작할까요? (합산 점수 유지)')) {
      const newWiped = { ...wipedPoints }; allStats.forEach(user => { newWiped[user.id] = user.sum; });
      syncToFirebase({ wipedPoints: newWiped, usedPoints: {}, bossBonusPoints: 0, weeklyStreak: 0, isWeeklyClaimed: false, leaderBonuses: {}, manualTotalBonus: 0 });
      alert('새로운 목표 갱신 완료!');
    }
  };
  const resetGoalIndividualScore = (id) => {
    const user = allStats.find(s => s.id === id); if (!user) return;
    if (window.confirm(`${user.name} 잔여 점수를 0으로 초기화할까요?`)) syncToFirebase({ wipedPoints: { ...wipedPoints, [id]: user.sum }, usedPoints: { ...usedPoints, [id]: 0 } });
  };

  const factoryResetSystem = () => {
    if (!window.confirm('🚨 시스템 완전 공장 초기화. 모든 과거 데이터가 지워집니다.')) return;
    if (window.prompt('초기화 라고 입력하세요.') !== '초기화') return;
    setResetTimestamp(Date.now()); 
    syncToFirebase({ checkedStudents: {}, classPrep: {}, threeCompliments: {}, teacherCompliments: {}, checkedGroupGoals: {}, timeoutChecks: {}, subjectChecks: {}, usedPoints: {}, wipedPoints: {}, bossBonusPoints: 0, activeBoss: null, activeMarket: null, bossAttacks: {}, weeklyStreak: 0, isWeeklyClaimed: false, manualTotalBonus: 0, leaderBonuses: {} });
    alert('완전 초기화 완료!');
  };

  const handleRevealManito = () => {
    const isSuccess = (checkedStudents[effectiveManitoId] === true && classPrep[effectiveManitoId] === true && threeCompliments[effectiveManitoId] === true && !(timeoutChecks[effectiveManitoId] > 0) && !(subjectChecks[effectiveManitoId] > 0));
    playSound('drumroll'); setManitoRevealState('loading');
    setTimeout(() => {
      if (isSuccess) { playSound('jackpot'); setManitoRevealMsg(manitoSuccessMessages[Math.floor(Math.random() * manitoSuccessMessages.length)]); setManitoRevealState('success'); } 
      else { playSound('failSoft'); setManitoRevealMsg(manitoFailMessages[Math.floor(Math.random() * manitoFailMessages.length)]); setManitoRevealState('fail'); }
    }, 3000);
  };
  const closeManitoReveal = () => setManitoRevealState(null);

  const saveDailyRecord = async () => {
    if (!window.confirm("오늘 기록을 마감하시겠습니까?\n(마니또 공개를 학생 화면에서 먼저 진행해 주세요!)")) return;
    const isSuccess = (checkedStudents[effectiveManitoId] === true && classPrep[effectiveManitoId] === true && threeCompliments[effectiveManitoId] === true && !(timeoutChecks[effectiveManitoId] > 0) && !(subjectChecks[effectiveManitoId] > 0));
    let extraBonus = 0;
    if (isSuccess) { alert(`🎉 마니또 미션 최종 성공!\n학급 총점 보너스 +${manitoConfig.reward}점!`); extraBonus = parseFloat(manitoConfig.reward) || 50; }
    
    const mergedPer = { ...classPrep }; Object.keys(threeCompliments).forEach(id => { if(threeCompliments[id]) mergedPer[`${id}_3c`] = true; });
    const record = {
      id: Date.now(), date: new Date().toLocaleDateString('ko-KR'), time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
      positive: todayStats.pos, negative: todayStats.neg, total: todayStats.total + extraBonus, target: targetScore, penaltyConfig: { timeout: penaltyTimeout, subject: penaltySubject }, leaderBonusAmount: leaderConfig.allClearBonus || 20, 
      rawInd: JSON.stringify(checkedStudents), rawPer: JSON.stringify(mergedPer), rawTComp: JSON.stringify(teacherCompliments), rawTm: JSON.stringify(timeoutChecks), rawSb: JSON.stringify(subjectChecks), rawUsed: JSON.stringify(usedPoints), rawGroup: JSON.stringify(checkedGroupGoals), rawLB: JSON.stringify(leaderBonuses)
    };
    setHistory(prev => [record, ...prev]);
    syncToFirebase({ checkedStudents: {}, classPrep: {}, threeCompliments: {}, teacherCompliments: {}, checkedGroupGoals: {}, timeoutChecks: {}, subjectChecks: {}, activeBoss: null, activeMarket: null, bossBonusPoints: 0, bossAttacks: {}, isWeeklyClaimed: false, leaderBonuses: {} });
    if (scriptURL) await fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveRecord', ...record }) });
    setShowModal('success'); setTimeout(() => setShowModal(null), 2000);
  };

  const handleLogin = () => {
    if (password === "6505") { setIsAuthenticated('teacher'); setActiveTab('admin'); setTeacherTab('history'); setShowModal(null); setPassword(""); }
    else if (password === "1111") { setIsAuthenticated('inspector'); setActiveTab('admin'); setTeacherTab('full-stats'); setShowModal(null); setPassword(""); }
    else alert("비밀번호가 틀렸습니다.");
  };

  const getCardStyle = (id) => {
    const sky = [18, 2, 9, 12]; const yellow = [1, 7, 26, 3, 23]; const pink = [20, 17, 4, 15, 24]; const green = [16, 11, 25, 21, 22, 6, 14]; 
    if (sky.includes(id)) return 'bg-sky-50 border-sky-100 hover:border-sky-200';
    if (yellow.includes(id)) return 'bg-yellow-50 border-yellow-100 hover:border-yellow-200';
    if (pink.includes(id)) return 'bg-pink-50 border-pink-100 hover:border-pink-200';
    if (green.includes(id)) return 'bg-emerald-50 border-emerald-100 hover:border-emerald-200';
    return 'bg-white border-slate-100 hover:border-slate-200'; 
  };

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black text-2xl animate-pulse">달보드레 유니버스 로딩 중...</div>;

  return (
    <div className={`min-h-screen font-sans pb-24 transition-colors duration-700 ${activeBoss ? 'bg-red-950 text-red-50' : 'bg-slate-50 text-slate-900'}`}>
      {particle && (<div className="fixed pointer-events-none z-[999] animate-fly-up font-black text-2xl text-blue-500" style={{ left: particle.x, top: particle.y }}>{particle.text} <Sparkles className="inline w-5 h-5 text-yellow-400"/></div>)}

      {/* 통합 헤더 */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><Trophy className="w-6 h-6"/></div>
          <div><h1 className="font-black text-xl leading-none">달보드레 대시보드</h1><p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1"><Database className="w-3 h-3 text-green-500"/> Class V2 Live</p></div>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">학급 총점</p>
              <p className="text-2xl font-black text-blue-600">{cumulativeClassScore}p</p>
           </div>
           {!isAuthenticated && <button onClick={() => setShowModal('password')} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"><Lock className="w-5 h-5"/></button>}
           {isAuthenticated && <button onClick={() => { setIsAuthenticated(false); setActiveTab('classroom'); }} className="p-3 bg-red-100 rounded-full text-red-500 hover:bg-red-200 transition-colors font-black text-xs">종료</button>}
        </div>
      </header>

      {/* 보스 및 마니또 알림 바 */}
      {activeBoss && activeTab !== 'admin' && (
        <div className="max-w-7xl mx-auto px-6 my-6 animate-in slide-in-from-top duration-500">
          <div className="bg-black/50 border-4 border-red-500 p-6 rounded-[30px] flex items-center gap-6 backdrop-blur-md">
            <div className="text-5xl animate-bounce">{bossEmoji}</div>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2"><h2 className="text-2xl font-black text-white flex items-center gap-2"><Flame className="text-red-500"/> {activeBoss.name}</h2><p className="text-yellow-400 font-black text-sm">정화율 {currentBossHits}/{maxBossHits} 명</p></div>
              <p className="text-red-200 font-bold text-sm mb-3">{activeBoss.desc}</p>
              <div className="w-full bg-slate-900 h-6 rounded-full border-2 border-red-900 overflow-hidden relative shadow-inner"><div className="h-full bg-gradient-to-r from-yellow-300 via-yellow-100 to-white transition-all duration-500" style={{ width: `${bossProgress}%` }} /></div>
            </div>
          </div>
        </div>
      )}
      {!activeBoss && activeTab !== 'admin' && (
         <div className="max-w-7xl mx-auto px-6 my-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-[30px]"><div className="h-full bg-white p-4 px-6 rounded-[26px] flex justify-between items-center text-slate-800 shadow-inner"><div className="flex items-center gap-3"><Zap className="text-yellow-500 w-6 h-6 animate-pulse"/><span className="font-black text-lg">{todaysBuff.title}</span><span className="text-sm font-bold text-slate-500 hidden md:block">| {todaysBuff.desc}</span></div><div className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-xl font-black text-sm animate-pulse">마니또 가동 중 🤫</div></div></div>
            <button onClick={handleRevealManito} className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-4 md:py-0 rounded-[30px] shadow-lg active:scale-95 transition-all whitespace-nowrap flex items-center justify-center gap-2">마니또 정체 확인하기 🤫</button>
         </div>
      )}

      {/* 메인 뷰 라우팅 */}
      <main className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* 탭 1: 교실 (포커스 뷰) */}
        {activeTab === 'classroom' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-4">
              <button onClick={() => setGroupFilter('all')} className={`px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${groupFilter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-200 text-slate-400'}`}>전체 명단</button>
              {[1,2,3,4,5,6].map(g => (
                <button key={g} onClick={() => setGroupFilter(g)} className={`px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${groupFilter === g ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-400'}`}>{g}모둠 포커스</button>
              ))}
            </div>

            <div className={`grid gap-4 ${groupFilter === 'all' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredStudents.map(s => (
                <div key={s.id} className={`p-5 rounded-[32px] border-2 bg-white transition-all shadow-sm ${s.isLeader ? 'border-yellow-400 bg-yellow-50/30' : 'border-slate-100'} ${groupFilter !== 'all' ? 'transform scale-105 my-2' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <button onClick={() => { handleEvolutionClick(s.id, getEvolution(s.net).texts); playSound('good'); }} className="relative w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform">
                          {getEvolution(s.net).icon}
                          {tooltipInfo.id === s.id && <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap z-50">{tooltipInfo.text}</div>}
                       </button>
                       <div>
                          <p className="font-black text-lg flex items-center gap-1">{s.name} {s.isLeader && <Crown className="w-4 h-4 text-yellow-500 fill-current"/>}</p>
                          <p className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5 inline-block">{s.group}모둠 • 잔여: {s.net}p</p>
                       </div>
                    </div>
                    {s.isLeader && (
                       <button onClick={(e) => handleGroupAllClear(s.id, s.group, e)} className={`flex items-center gap-1 p-2 rounded-xl text-xs font-black transition-all active:scale-95 ${leaderBonuses[s.id] ? 'bg-slate-100 text-slate-300' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                          <Zap className="w-4 h-4 fill-current"/> {groupFilter !== 'all' && '올클리어'}
                       </button>
                    )}
                  </div>
                  
                  {activeBoss && (
                     <button onClick={(e) => handlePurify(s.id, e)} className={`w-full py-3 mb-3 rounded-xl font-black text-xs border-2 transition-all shadow-sm ${bossAttacks[s.id] ? 'bg-yellow-400 border-yellow-400 text-yellow-900' : 'bg-slate-800 border-yellow-400 text-yellow-400 hover:bg-yellow-500 hover:text-slate-900 animate-pulse'}`}>
                       {bossAttacks[s.id] ? '정화 완료' : '✨ 정화 마법 사용'}
                     </button>
                  )}

                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => handleToggle(s.id, 'role')} className={`py-3 rounded-xl font-black text-[11px] border-2 transition-all ${checkedStudents[s.id] ? 'bg-green-500 border-green-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>역할</button>
                    <button onClick={() => handleToggle(s.id, 'prep')} className={`py-3 rounded-xl font-black text-[11px] border-2 transition-all ${classPrep[s.id] ? 'bg-purple-500 border-purple-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>준비</button>
                    <button onClick={() => handleToggle(s.id, 'comp')} className={`py-3 rounded-xl font-black text-[11px] border-2 transition-all ${threeCompliments[s.id] ? 'bg-pink-500 border-pink-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>칭찬</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 탭 2: 현령 센터 */}
        {activeTab === 'hyunryeong' && (
          <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-6">
             <div className="bg-white rounded-[40px] p-8 md:p-10 border border-slate-200 shadow-sm">
                <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-indigo-700"><ClipboardCheck className="w-8 h-8"/> 현령 업무 센터</h2>
                
                <div className="mb-10">
                   <p className="text-sm font-bold text-slate-400 mb-4">1. 자신의 직업을 선택하세요.</p>
                   <div className="flex flex-wrap gap-3">
                      {safeRolesArray.map(role => (
                        <button key={role.name} onClick={() => setSelectedHyunRole(role)} className={`px-5 py-3 rounded-2xl font-black text-sm border-2 transition-all ${selectedHyunRole?.name === role.name ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                           {role.name}
                        </button>
                      ))}
                   </div>
                </div>

                {selectedHyunRole && (
                  <div className="animate-in fade-in zoom-in duration-300">
                     <div className="bg-indigo-50 border-2 border-indigo-100 p-8 rounded-3xl mb-10">
                        <h4 className="font-black text-indigo-800 flex items-center gap-2 mb-4 text-xl"><BookOpen className="w-6 h-6"/> 업무 수행 지침 (매뉴얼)</h4>
                        <p className="text-sm font-bold text-indigo-600 leading-relaxed whitespace-pre-wrap">{selectedHyunRole.manual || "등록된 구체적인 지침이 없습니다. 모범적으로 임무를 수행해 주세요!"}</p>
                     </div>
                     
                     <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                        <div className="flex justify-between items-end mb-6">
                           <h4 className="font-black text-slate-800 text-xl">반 전체 퀵 체크 리스트</h4>
                           <p className="text-xs font-bold text-slate-400">터치 시 '역할 완료'로 즉시 저장됩니다.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                           {allStats.sort((a,b)=>a.id-b.id).map(s => (
                             <button key={s.id} onClick={() => handleToggle(s.id, 'role')} className={`p-4 rounded-2xl font-black text-sm border-2 transition-all active:scale-95 ${checkedStudents[s.id] ? 'bg-green-500 border-green-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                                {s.name}
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* 탭 3: 가챠/상점 */}
        {activeTab === 'shop' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
             <section className={`p-8 rounded-[40px] shadow-sm border relative overflow-hidden ${isDongminGod ? 'bg-gradient-to-br from-purple-900 to-slate-900 border-yellow-400 shadow-[0_0_30px_rgba(168,85,247,0.5)]' : 'bg-yellow-50 border-yellow-200'}`}>
                {isDongminGod && <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-color-dodge pointer-events-none"></div>}
                <h2 className={`text-2xl font-black mb-6 flex items-center gap-2 relative z-10 ${isDongminGod ? 'text-yellow-300 drop-shadow-md' : 'text-yellow-700'}`}>
                   {isDongminGod ? <Sparkles className="w-8 h-8 text-yellow-300 animate-spin-slow"/> : <Gift className="w-8 h-8"/>}
                   {isDongminGod ? '✨ 동민신의 특별 가챠 ✨' : '행운의 가챠 상점'}
                </h2>
                
                <div className={`mb-6 p-5 rounded-2xl border relative z-10 ${isDongminGod ? 'bg-black/40 border-purple-500 backdrop-blur-md' : 'bg-white/60 border-yellow-200'}`}>
                   <p className={`text-sm font-black mb-4 flex items-center gap-1 ${isDongminGod ? 'text-purple-300' : 'text-yellow-800'}`}>
                      {isDongminGod ? "동민신이 미소 짓고 있습니다! 오늘 잭팟 확률 대폭 상승!!" : "오늘의 운세는? 잭팟의 주인공이 되어보세요!"}
                   </p>
                   <ul className={`text-sm font-bold space-y-2 ${isDongminGod ? 'text-slate-300' : 'text-yellow-700'}`}>
                     <li className="flex items-center gap-2"><span>😭</span> <span>{currentGachaSettings?.t1?.name}</span></li>
                     <li className="flex items-center gap-2"><span>🪙</span> <span>{currentGachaSettings?.t2?.name} <span className="text-xs opacity-70">(+{currentGachaSettings?.t2?.reward}p)</span></span></li>
                     <li className="flex items-center gap-2"><span>🍬</span> <span>{currentGachaSettings?.t3?.name}</span></li>
                     <li className={`flex items-center gap-2 font-black mt-3 pt-3 border-t animate-pulse ${isDongminGod ? 'text-yellow-400 border-purple-500/50 text-base' : 'text-red-600 border-yellow-300'}`}>
                        <span>🎰</span> <span>{currentGachaSettings?.t4?.name} (+{currentGachaSettings?.t4?.reward}p)</span>
                     </li>
                   </ul>
                </div>

                <div className={`p-6 rounded-3xl border shadow-sm relative z-10 ${isDongminGod ? 'bg-slate-900/80 border-purple-500' : 'bg-white border-yellow-100'}`}>
                   <select value={selectedGachaStudent} onChange={(e) => setSelectedGachaStudent(e.target.value)} className={`w-full p-4 rounded-2xl font-black mb-4 outline-none border-2 ${isDongminGod ? 'bg-black border-purple-500 text-yellow-300' : 'bg-slate-50 border-slate-100 focus:border-yellow-400'}`}>
                      <option value="">누가 뽑을까요?</option>
                      {allStats.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.net}p)</option>)}
                   </select>
                   <button onClick={() => { if(!selectedGachaStudent) return alert("학생을 먼저 선택하세요."); handleGacha(parseInt(selectedGachaStudent)); }} className={`w-full py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all ${isDongminGod ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 text-white shadow-purple-500/50' : 'bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 text-yellow-900'}`}>
                      🎰 뽑기 시작 ({currentGachaSettings?.cost || 30}p)
                   </button>
                </div>
             </section>

             <div className="space-y-6">
                <section className="p-8 rounded-[40px] bg-blue-50 border-2 border-blue-100 shadow-sm">
                   <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-blue-700"><ShoppingCart className="w-8 h-8"/> 포인트 상점</h2>
                   <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
                      <select value={selectedStoreStudent} onChange={(e) => setSelectedStoreStudent(e.target.value)} className="w-full p-4 rounded-2xl font-black mb-4 outline-none border-2 bg-slate-50 focus:border-blue-400">
                         <option value="">누가 구매하나요?</option>
                         {allStats.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.net}p)</option>)}
                      </select>
                      <div className="space-y-2">
                        {safeArray(shopItems).map(item => {
                          if (!item) return null;
                          return (
                            <button key={item.id || Math.random()} onClick={() => { if(!selectedStoreStudent) return alert("학생을 먼저 선택하세요."); handleStudentStoreBuy(parseInt(selectedStoreStudent), item); }} className="w-full p-4 rounded-2xl bg-blue-50 border-2 border-blue-100 flex justify-between items-center font-black hover:bg-blue-100 active:scale-95 transition-all text-blue-900">
                              <span>{item.name}</span><span className="text-blue-600">{item.price}p</span>
                            </button>
                          );
                        })}
                      </div>
                   </div>
                </section>

                {activeMarket && (
                  <section className="p-8 rounded-[40px] shadow-sm border bg-purple-900 border-purple-500 text-white animate-pulse">
                    <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><Coins className="text-yellow-400"/> {activeMarket.name}</h2>
                    <p className="text-sm font-bold text-purple-300 mb-6">{activeMarket.desc}</p>
                    <select value={selectedMarketStudent} onChange={(e) => setSelectedMarketStudent(e.target.value)} className="w-full p-4 rounded-2xl font-black mb-4 border-2 text-slate-800 bg-white">
                        <option value="">누가 구매(신청)하나요?</option>
                        {allStats.map(s => <option key={s.id} value={s.id}>{s.name} (잔여: {s.net}p)</option>)}
                    </select>
                    <div className="space-y-2">
                      {safeArray(marketItems).map(item => {
                        if(!item) return null;
                        return (
                          <button key={item.id || Math.random()} onClick={() => { if(!selectedMarketStudent) return alert("학생을 고르세요."); handleMarketBuy(parseInt(selectedMarketStudent), item); }} className="w-full bg-purple-800 hover:bg-purple-700 p-4 rounded-2xl flex justify-between items-center font-black transition-colors border border-purple-400 active:scale-95">
                            <span>{item.name}</span><span className="text-yellow-400">{item.price}p</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )}
             </div>
          </div>
        )}

        {/* 탭 4: 반 정보 (수호신, 랭킹, 진화 가이드) */}
        {activeTab === 'info' && (
          <div className="space-y-8 animate-in zoom-in duration-500">
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
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                   <h3 className="text-xl font-black text-green-500 mb-6 flex items-center gap-2"><Star/> 오늘의 영웅 (가점 Top 5)</h3>
                   <div className="space-y-3">
                      {top5Gainers.map((s, idx) => (
                        <div key={s.id} className="flex justify-between items-center p-5 bg-green-50 rounded-2xl border border-green-100 font-black">
                           <span className="text-slate-700">{idx+1}위. {s.name}</span><span className="text-green-600 text-lg">+{s.pos}p</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                   <h3 className="text-xl font-black text-amber-600 mb-6 flex items-center gap-2"><Trophy/> 우리 반 랭킹 (누적 Top 5)</h3>
                   <div className="space-y-3">
                      {allStats.sort((a,b)=>b.sum-a.sum).slice(0,5).map((s, idx) => (
                        <div key={s.id} className="flex justify-between items-center p-5 bg-amber-50 rounded-2xl border border-amber-100 font-black">
                           <span className="text-slate-700">{idx+1}위. {s.name}</span><span className="text-amber-600 text-lg">{s.sum}p</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm">
                 <h2 className="text-2xl font-black mb-8 flex items-center gap-2 text-slate-800"><BookOpen className="text-blue-500"/> 달보드레 유니버스 가이드북</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                     <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                        <h4 className="text-blue-600 font-black text-lg mb-4 flex items-center gap-2"><Crown/> 학급 수호신 (합산)</h4>
                        <p className="text-xs text-slate-500 mb-4 font-bold">우리 반 전체 점수가 오르면 진화해요!</p>
                        <ul className="text-sm font-bold text-slate-700 space-y-2">
                           <li className="flex justify-between"><span>🥚 달보드레 알</span><span>0p</span></li>
                           <li className="flex justify-between"><span>🐲 깨어난 용</span><span>{fmt(targetScore*0.3)}p</span></li>
                           <li className="flex justify-between"><span>✨🐉 빛의 드래곤</span><span>{fmt(targetScore*0.6)}p</span></li>
                           <li className="flex justify-between text-blue-600 font-black"><span>👑🐉 전설의 수호신</span><span>{fmt(targetScore*0.9)}p</span></li>
                        </ul>
                     </div>
                     <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                        <h4 className="text-green-600 font-black text-lg mb-4 flex items-center gap-2"><Users/> 개인 알 진화 (잔여)</h4>
                        <p className="text-xs text-slate-500 mb-4 font-bold">포인트를 모으면 캐릭터가 멋지게 변해요!</p>
                        <ul className="text-sm font-bold text-slate-700 space-y-2">
                           <li className="flex justify-between"><span>🥚 잠든 알</span><span>~ {evoThresholds.e1}p</span></li>
                           <li className="flex justify-between"><span>🐣 깨는 알</span><span>~ {evoThresholds.e2}p</span></li>
                           <li className="flex justify-between"><span>🐥 꼬마 병아리</span><span>~ {evoThresholds.e3}p</span></li>
                           <li className="flex justify-between"><span>🐤 발랄 병아리</span><span>~ {evoThresholds.e4}p</span></li>
                           <li className="flex justify-between"><span>🐔 늠름한 닭</span><span>~ {evoThresholds.e5}p</span></li>
                           <li className="flex justify-between"><span>🕊️ 자유로운 새</span><span>~ {evoThresholds.e6}p</span></li>
                           <li className="flex justify-between"><span>🦅 용맹 독수리</span><span>~ {evoThresholds.e7}p</span></li>
                           <li className="flex justify-between"><span>🦄 유니콘</span><span>~ {evoThresholds.e8}p</span></li>
                           <li className="flex justify-between"><span>🐲 꼬마 드래곤</span><span>~ {evoThresholds.e9}p</span></li>
                           <li className="flex justify-between text-green-600 font-black"><span>🐉 전설 드래곤</span><span>그 이상</span></li>
                        </ul>
                     </div>
                     <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100">
                        <h4 className="text-yellow-700 font-black text-lg mb-4 flex items-center gap-2"><Trophy/> 명예 칭호 (누적)</h4>
                        <p className="text-xs text-slate-500 mb-4 font-bold">포인트를 써도 사라지지 않는 칭호!</p>
                        <ul className="text-sm font-bold text-slate-700 space-y-2">
                           <li className="flex justify-between"><span>🤎 잠든 씨앗</span><span>~ {tierThresholds.t1}p</span></li>
                           <li className="flex justify-between"><span>🌱 새싹</span><span>~ {tierThresholds.t2}p</span></li>
                           <li className="flex justify-between"><span>🌿 줄기</span><span>~ {tierThresholds.t3}p</span></li>
                           <li className="flex justify-between"><span>☘️ 클로버</span><span>~ {tierThresholds.t4}p</span></li>
                           <li className="flex justify-between"><span>🌷 꽃봉오리</span><span>~ {tierThresholds.t5}p</span></li>
                           <li className="flex justify-between"><span>🌻 활짝 핀 꽃</span><span>~ {tierThresholds.t6}p</span></li>
                           <li className="flex justify-between"><span>🍎 탐스런 열매</span><span>~ {tierThresholds.t7}p</span></li>
                           <li className="flex justify-between"><span>🌳 든든한 나무</span><span>~ {tierThresholds.t8}p</span></li>
                           <li className="flex justify-between"><span>🌲 거대한 숲</span><span>~ {tierThresholds.t9}p</span></li>
                           <li className="flex justify-between text-yellow-600 font-black"><span>👑 생명의 세계수</span><span>그 이상</span></li>
                        </ul>
                     </div>
                 </div>
             </div>
          </div>
        )}

        {/* 탭 5: 관리실 */}
        {activeTab === 'admin' && isAuthenticated && (
          <div className="bg-white rounded-[40px] shadow-xl border border-slate-200 min-h-[750px] flex overflow-hidden animate-in slide-in-from-right duration-300">
             {/* 좌측 사이드바 */}
             <aside className="w-72 bg-slate-50 border-r border-slate-100 p-8 flex flex-col shrink-0">
                <div className="mb-10 text-center">
                   <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isAuthenticated === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {isAuthenticated === 'teacher' ? <Settings className="w-8 h-8"/> : <ShieldCheck className="w-8 h-8"/>}
                   </div>
                   <h3 className="font-black text-slate-800 text-lg">{isAuthenticated === 'teacher' ? '교사 통합 관리실' : '감찰사 자치 관리실'}</h3>
                </div>
                
                <div className="space-y-2 flex-1">
                  {isAuthenticated === 'teacher' && <button onClick={() => setTeacherTab('history')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${teacherTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}><History className="w-5 h-5"/> 마감 리포트</button>}
                  <button onClick={() => setTeacherTab('full-stats')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${teacherTab === 'full-stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}><Users className="w-5 h-5"/> 인사/역할 관리</button>
                  {isAuthenticated === 'teacher' && (
                    <>
                      <button onClick={() => setTeacherTab('store')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${teacherTab === 'store' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}><Gift className="w-5 h-5"/> 상점/가챠 세팅</button>
                      <button onClick={() => setTeacherTab('events')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${teacherTab === 'events' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}><Flame className="w-5 h-5"/> 이벤트 통제소</button>
                      <button onClick={() => setTeacherTab('settings')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${teacherTab === 'settings' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}><Settings className="w-5 h-5"/> 시스템 설정</button>
                    </>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-200 space-y-3 mt-4">
                   {isAuthenticated === 'teacher' && <button onClick={saveDailyRecord} className="w-full bg-green-500 hover:bg-green-600 text-white font-black p-4 rounded-2xl shadow-md active:scale-95 transition-all"><Save className="w-5 h-5 inline mr-2" /> 오늘 마감 저장</button>}
                </div>
             </aside>
             
             {/* 우측 콘텐츠 */}
             <section className="flex-1 p-10 overflow-y-auto bg-white custom-scrollbar relative">
                
                {/* 마감 리포트 */}
                {teacherTab === 'history' && isAuthenticated === 'teacher' && (
                  <div className="space-y-6">
                     <h3 className="text-3xl font-black text-slate-800 mb-8 px-2 border-l-8 border-blue-600 pl-6">날짜별 마감 리포트</h3>
                     {validHistory.length === 0 ? <div className="py-24 text-center text-slate-300 font-black border-4 border-dashed rounded-[40px]">기록이 없습니다.</div> : (
                       <div className="space-y-6">
                          {validHistory.map(rec => (
                            <div key={rec.id} className="bg-slate-50 p-8 rounded-[40px] flex justify-between items-center border border-slate-100 hover:border-blue-200 transition-all shadow-sm">
                               <div className="flex gap-10 items-center">
                                  <div className="text-center bg-white p-5 rounded-3xl shadow-sm border border-slate-100 min-w-[140px]"><p className="font-black text-slate-800 text-lg">{rec.date}</p><p className="text-[10px] text-slate-400 mt-1 uppercase">{rec.time}</p></div>
                                  <div><h4 className="text-4xl font-black text-slate-800 tracking-tight">{fmt(parseFloat(rec.total) || 0)}점</h4><p className="text-slate-500 font-bold text-sm mt-2 flex gap-6"><span className="text-green-600 font-black">가점: +{fmt(parseFloat(rec.positive) || 0)}</span><span className="text-red-500 font-black">감점: -{fmt(parseFloat(rec.negative) || 0)}</span></p></div>
                               </div>
                               <button onClick={() => { if(window.confirm("삭제할까요?")) setHistory(history.filter(h => h.id !== rec.id)) }} className="p-4 bg-white text-slate-300 hover:text-red-500 rounded-2xl shadow-sm border border-slate-100 transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                          ))}
                       </div>
                     )}
                  </div>
                )}

                {/* 인사/역할 관리 (공용) */}
                {teacherTab === 'full-stats' && (
                  <div className="space-y-8">
                     <h3 className="text-3xl font-black text-slate-800 mb-8 px-2 border-l-8 border-indigo-500 pl-6">학생 인사 및 역할 발령</h3>
                     
                     <div className="bg-white border border-slate-200 rounded-[30px] overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                              <tr>
                                 <th className="p-5">이름</th>
                                 <th className="p-5 text-center">모둠 편성</th>
                                 <th className="p-5 text-center">모둠장 임명</th>
                                 <th className="p-5">1인 1역(직업) 배정</th>
                                 {isAuthenticated === 'teacher' && <th className="p-5 text-center text-red-400">초기화</th>}
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {allStats.sort((a,b) => a.id - b.id).map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                   <td className="p-5 font-black text-slate-700 text-lg">{s.name}</td>
                                   <td className="p-5 text-center">
                                      <select value={s.group || 1} onChange={(e) => handleStudentFieldChange(s.id, 'group', parseInt(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-700 outline-none focus:border-indigo-400 shadow-sm cursor-pointer hover:bg-slate-50">
                                         {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}모둠</option>)}
                                      </select>
                                   </td>
                                   <td className="p-5 text-center">
                                      <button onClick={() => handleStudentFieldChange(s.id, 'isLeader', !s.isLeader)} className={`px-4 py-2 rounded-xl border-2 text-xs font-black transition-all active:scale-95 ${s.isLeader ? 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100'}`} title="클릭하여 토글">
                                         {s.isLeader ? '👑 모둠장' : '모둠원'}
                                      </button>
                                   </td>
                                   <td className="p-5">
                                      <select value={s.role} onChange={(e) => handleStudentFieldChange(s.id, 'role', e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black text-slate-700 outline-none focus:border-indigo-400 w-full shadow-sm cursor-pointer hover:bg-slate-50">
                                         <option value="">-- 역할 없음 --</option>
                                         {safeRolesArray.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                      </select>
                                   </td>
                                   {isAuthenticated === 'teacher' && (
                                     <td className="p-5 text-center"><button onClick={() => resetGoalIndividualScore(s.id)} className="text-[10px] font-black bg-red-50 text-red-500 border border-red-100 px-3 py-2 rounded-xl hover:bg-red-100">잔여 0p</button></td>
                                   )}
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     {/* 교사 전용 부가 기능 */}
                     {isAuthenticated === 'teacher' && (
                       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">
                          <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-200 shadow-sm flex flex-col justify-between">
                            <div>
                               <h4 className="text-xl font-black text-indigo-800 mb-6 flex items-center gap-2"><Briefcase className="w-6 h-6"/> 직업 생성소 및 매뉴얼 작성</h4>
                               <div className="flex gap-4 mb-6">
                                 <input type="text" placeholder="새 직업 추가 (예: 대법관)" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="flex-1 bg-white border-2 border-indigo-200 rounded-2xl px-5 py-3 font-bold outline-none focus:border-indigo-400"/>
                                 <button onClick={handleAddRole} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 shadow-md"><Plus className="w-5 h-5"/></button>
                               </div>
                               <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                 {safeRolesArray.map(role => (
                                    <div key={role.name} className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col gap-2">
                                       <div className="flex justify-between items-center">
                                          <span className="font-black text-indigo-700">{role.name}</span>
                                          <button onClick={()=>handleDeleteRole(role.name)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                       </div>
                                       <textarea placeholder="현령 센터에 표시될 업무 지침을 적어주세요." value={role.manual} onChange={(e) => { const newRoles = safeRolesArray.map(r => r.name === role.name ? {...r, manual: e.target.value} : r); setRolesList(newRoles); syncToFirebase({rolesList: newRoles}); }} className="w-full h-16 p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-300 resize-none"/>
                                    </div>
                                 ))}
                               </div>
                            </div>
                            <p className="text-[10px] font-black text-indigo-500 mt-4 bg-white p-3 rounded-xl border border-indigo-100">※ 이름에 '감찰사' 2배, '현령' 1.5배, '향리' 1.2배 자동 가점</p>
                          </div>

                          <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-200 shadow-sm flex flex-col justify-center items-center text-center">
                             <h4 className="text-2xl font-black text-blue-800 mb-4"><Target className="w-10 h-10 mx-auto mb-2 text-blue-500"/> 공동 목표 새출발</h4>
                             <p className="text-blue-600/80 mb-8 font-bold text-sm">학급 목표 달성 후 새로운 목표를 시작합니다. 모든 학생의 '잔여 점수'가 0으로 초기화됩니다. (누적 점수는 보존)</p>
                             <button onClick={resetGoalAllScores} className="bg-blue-600 text-white border border-blue-700 px-10 py-5 rounded-[30px] font-black text-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 w-full">새 공동목표 시작 (잔여 0p)</button>
                          </div>
                       </div>
                     )}
                  </div>
                )}

                {/* 3. 상점/가챠 세팅 */}
                {teacherTab === 'store' && isAuthenticated === 'teacher' && (
                  <div className="space-y-8">
                     <h3 className="text-3xl font-black text-slate-800 mb-8 px-2 border-l-8 border-amber-500 pl-6">상점 다중 결제 및 가챠 커스텀</h3>
                     
                     <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 mb-8">
                        <div className="flex justify-between items-end mb-6">
                           <h4 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="text-slate-400"/> 다중 결제 시스템</h4>
                           <p className="text-sm font-bold text-amber-600">선택됨: {storeSelected.length}명</p>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2 mb-8">
                           {allStats.map(s => (
                              <button key={s.id} onClick={() => toggleStoreSelect(s.id)} className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col justify-center items-center gap-1 ${storeSelected.includes(s.id) ? 'bg-amber-100 border-amber-400 shadow-md transform scale-105' : 'bg-white border-slate-200 hover:border-amber-200'}`}>
                                <span className={`font-black text-sm ${storeSelected.includes(s.id) ? 'text-amber-700' : 'text-slate-600'}`}>{s.name}</span>
                                <span className={`text-[10px] font-bold ${s.net >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{s.net}p</span>
                              </button>
                           ))}
                        </div>
                        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                           {safeArray(shopItems).map(item => {
                             if(!item) return null;
                             return (
                             <button key={item.id} onClick={() => handleMultiConsume(item.price, item.name)} className="flex-1 min-w-[150px] bg-white border border-blue-200 text-blue-600 p-4 rounded-2xl font-black text-sm shadow-sm hover:bg-blue-50 active:scale-95">
                                {item.name} (-{item.price}p)
                             </button>
                           )})}
                           <button onClick={() => setStoreSelected([])} className="px-6 bg-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-300 active:scale-95">선택해제</button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                          <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Settings className="text-slate-400"/> 일반 상점 아이템 등록</h4>
                          <div className="flex gap-3 mb-6">
                            <input type="text" placeholder="상품 이름" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-400"/>
                            <input type="number" placeholder="가격" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-400"/>
                            <button onClick={handleAddShopItem} className="bg-slate-800 text-white px-5 rounded-xl font-black hover:bg-slate-700 shadow-md"><Plus/></button>
                          </div>
                          <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {safeArray(shopItems).map(item => {
                              if(!item) return null;
                              return (
                              <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-700 text-sm">{item.name} <span className="text-blue-500 ml-2">{item.price}p</span></span>
                                <button onClick={() => handleDeleteShopItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                              </div>
                            )})}
                          </div>
                        </div>

                        <div className="bg-yellow-50 p-8 rounded-[40px] border border-yellow-200 shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                             <h4 className="text-xl font-black text-yellow-800 flex items-center gap-2"><Gift className="text-yellow-500"/> 가챠 조작기</h4>
                             <button onClick={() => { const newMode = gachaConfig.mode === 'special' ? 'normal' : 'special'; setGachaConfig({...gachaConfig, mode: newMode}); syncToFirebase({gachaConfig: {...gachaConfig, mode: newMode}}); }} className={`px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 ${gachaConfig.mode === 'special' ? 'bg-purple-600 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                               {gachaConfig.mode === 'special' ? '✨ 동민신 모드 ON' : '🎁 일반 행운 모드'}
                             </button>
                          </div>

                          <div className="flex mb-4 gap-2 border-b border-yellow-200/50 pb-2">
                             <button onClick={() => setGachaEditTab('normal')} className={`px-4 py-2 text-sm font-black rounded-xl transition-colors ${gachaEditTab === 'normal' ? 'bg-white text-yellow-800 shadow-sm border border-yellow-200' : 'text-yellow-600/50 hover:bg-yellow-100'}`}>일반 상점 세팅</button>
                             <button onClick={() => setGachaEditTab('special')} className={`px-4 py-2 text-sm font-black rounded-xl transition-colors ${gachaEditTab === 'special' ? 'bg-purple-600 text-white shadow-sm' : 'text-yellow-600/50 hover:bg-yellow-100'}`}>✨ 동민신 세팅</button>
                          </div>
                          
                          <div className={`p-6 rounded-2xl border ${gachaEditTab === 'special' ? 'bg-purple-50 border-purple-200' : 'bg-white border-yellow-200'}`}>
                             <div className="flex items-center gap-3 mb-5">
                                <span className={`font-black text-sm ${gachaEditTab === 'special' ? 'text-purple-800' : 'text-yellow-800'}`}>1회 뽑기 비용:</span>
                                <input type="number" value={gachaConfig[gachaEditTab]?.cost || 0} onChange={(e)=>{ const newConfig = {...gachaConfig, [gachaEditTab]: {...gachaConfig[gachaEditTab], cost: parseFloat(e.target.value)||0}}; setGachaConfig(newConfig); syncToFirebase({gachaConfig: newConfig}); }} className={`w-24 text-center border-2 rounded-xl py-2 font-black outline-none ${gachaEditTab === 'special' ? 'bg-purple-100 border-purple-300 text-purple-900' : 'bg-slate-50 border-yellow-200 text-yellow-900'}`}/>
                             </div>
                             <div className="space-y-2">
                                {['t1', 't2', 't3', 't4'].map((t, i) => (
                                  <div key={t} className={`flex gap-2 items-center p-3 rounded-xl border ${gachaEditTab === 'special' ? 'bg-white border-purple-100' : 'bg-slate-50 border-slate-100'}`}>
                                     <span className="font-black text-slate-300 w-4 text-xs">{i+1}</span>
                                     <input type="text" value={gachaConfig[gachaEditTab]?.[t]?.name || ''} onChange={(e)=>{ const newConfig = {...gachaConfig, [gachaEditTab]: {...gachaConfig[gachaEditTab], [t]: {...gachaConfig[gachaEditTab][t], name: e.target.value}}}; setGachaConfig(newConfig); syncToFirebase({gachaConfig: newConfig}); }} className="flex-1 bg-transparent text-xs font-bold outline-none" placeholder="당첨 메세지"/>
                                     <input type="number" value={gachaConfig[gachaEditTab]?.[t]?.prob || 0} onChange={(e)=>{ const newConfig = {...gachaConfig, [gachaEditTab]: {...gachaConfig[gachaEditTab], [t]: {...gachaConfig[gachaEditTab][t], prob: parseFloat(e.target.value)||0}}}; setGachaConfig(newConfig); syncToFirebase({gachaConfig: newConfig}); }} className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none text-center" placeholder="%"/>
                                     <span className="text-[10px] font-black text-slate-400">%</span>
                                     <input type="number" value={gachaConfig[gachaEditTab]?.[t]?.reward || 0} onChange={(e)=>{ const newConfig = {...gachaConfig, [gachaEditTab]: {...gachaConfig[gachaEditTab], [t]: {...gachaConfig[gachaEditTab][t], reward: parseFloat(e.target.value)||0}}}; setGachaConfig(newConfig); syncToFirebase({gachaConfig: newConfig}); }} className="w-14 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-2 py-1.5 text-xs font-black outline-none text-center" placeholder="보상"/>
                                     <span className="text-[10px] font-black text-amber-500">p</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* 4. 이벤트 탭 */}
                {teacherTab === 'events' && isAuthenticated === 'teacher' && (
                  <div className="space-y-8">
                     <h3 className="text-3xl font-black text-slate-800 mb-8 px-2 border-l-8 border-red-500 pl-6">스페셜 이벤트 통제소</h3>
                     
                     <div className="bg-yellow-50 p-8 rounded-[40px] border border-yellow-200 shadow-sm mb-8">
                        <h4 className="text-xl font-black text-yellow-800 mb-6 flex items-center gap-2"><Sparkles className="text-yellow-500"/> 마니또 (숨은 영웅) 통제소</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                           <div className="flex-1">
                              <label className="text-xs font-black text-yellow-600 block mb-2 ml-1">오늘의 마니또 몰래 지정</label>
                              <select value={manitoConfig?.targetId || ''} onChange={(e) => { const newConf = {...(manitoConfig||{}), targetId: e.target.value ? parseInt(e.target.value) : null}; setManitoConfig(newConf); syncToFirebase({manitoConfig: newConf}); }} className="w-full bg-white border-2 border-yellow-300 rounded-2xl px-5 py-3.5 font-black text-slate-700 outline-none focus:border-yellow-500 shadow-sm">
                                 <option value="">🎲 시스템 자동 추천 (현재: {secretManitoName})</option>
                                 {safeStudentsArray.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                           </div>
                           <div className="w-full sm:w-40">
                              <label className="text-xs font-black text-yellow-600 block mb-2 ml-1">성공 보상 (학급 총점)</label>
                              <div className="flex items-center bg-white border-2 border-yellow-300 rounded-2xl px-4 py-3.5 shadow-sm focus-within:border-yellow-500">
                                <input type="number" value={manitoConfig?.reward || 50} onChange={(e) => { const newConf = {...(manitoConfig||{}), reward: parseFloat(e.target.value) || 0}; setManitoConfig(newConf); syncToFirebase({manitoConfig: newConf}); }} className="w-full text-center font-black text-slate-700 outline-none" />
                                <span className="text-yellow-500 font-black text-sm ml-1">p</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="bg-red-50 p-8 rounded-[40px] border border-red-200 shadow-sm flex flex-col">
                           <div className="flex justify-between items-center mb-6">
                              <h4 className="text-xl font-black text-red-800 flex items-center gap-2"><Flame className="text-red-500"/> 보스 레이드 출격소</h4>
                              {activeBoss && <button onClick={() => { setActiveBoss(null); syncToFirebase({ activeBoss: null, bossAttacks: {} }); }} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md hover:bg-slate-700">레이드 강제 종료</button>}
                           </div>
                           
                           <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                              {safeArray(bossPresets).map(b => {
                                if(!b) return null;
                                return (
                                <div key={b.id} className={`p-5 rounded-2xl border-2 flex justify-between items-center transition-all ${activeBoss?.id === b.id ? 'bg-red-600 border-red-500 text-white shadow-lg scale-105 my-2' : 'bg-white border-red-100 hover:border-red-300'}`}>
                                   <div>
                                      <p className="font-black text-base mb-1">{b.name || '이름 없음'}</p>
                                      <p className={`text-[10px] font-bold mb-2 ${activeBoss?.id === b.id ? 'text-red-200' : 'text-slate-500'} truncate w-40`}>{b.desc}</p>
                                      <div className={`text-[10px] font-black inline-block px-2 py-1 rounded-md ${activeBoss?.id === b.id ? 'bg-red-800/50 text-white' : 'bg-slate-100 text-slate-600'}`}>성공 +{b.reward||0}p / 실패 -{b.penalty||0}p</div>
                                   </div>
                                   {activeBoss?.id !== b.id ? (
                                      <div className="flex flex-col gap-2">
                                        <button onClick={() => { setActiveBoss(b); setBossHp(100); syncToFirebase({ activeBoss: b, bossHp: 100, bossAttacks: {} }); }} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-200 shadow-sm">출격하기</button>
                                        <button onClick={() => handleDeleteBoss(b.id)} className="text-slate-300 hover:text-red-500 text-xs font-bold text-center">삭제</button>
                                      </div>
                                   ) : (
                                      <div className="flex flex-col gap-2">
                                        <button onClick={() => { if(window.confirm('승리(가점) 처리할까요?')) { const newBonus = bossBonusPoints + (activeBoss.reward||100); setBossBonusPoints(newBonus); setActiveBoss(null); syncToFirebase({ bossBonusPoints: newBonus, activeBoss: null, bossAttacks: {} }); alert('보상이 총점에 합산되었습니다!'); } }} className="bg-white text-green-600 px-4 py-1.5 rounded-xl text-xs font-black shadow-sm hover:bg-green-50">승리 (+)</button>
                                        <button onClick={() => { if(window.confirm('실패(감점) 처리할까요?')) { const newBonus = bossBonusPoints - (activeBoss.penalty||100); setBossBonusPoints(newBonus); setActiveBoss(null); syncToFirebase({ bossBonusPoints: newBonus, activeBoss: null, bossAttacks: {} }); alert('감점되었습니다.'); } }} className="bg-white text-red-600 px-4 py-1.5 rounded-xl text-xs font-black shadow-sm hover:bg-red-50">실패 (-)</button>
                                      </div>
                                   )}
                                </div>
                              )})}
                           </div>

                           <div className="mt-auto border-t border-red-200 pt-6">
                              <p className="text-sm font-black text-red-800 mb-3 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> 새로운 보스 만들기</p>
                              <div className="space-y-2 mb-3">
                                <input type="text" placeholder="보스 이름 (예: 대마왕의 분노)" value={newBossName} onChange={e=>setNewBossName(e.target.value)} className="w-full bg-white border border-red-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-red-300"/>
                                <input type="text" placeholder="보스 설명 (예: 26명의 힘을 모아주세요!)" value={newBossDesc} onChange={e=>setNewBossDesc(e.target.value)} className="w-full bg-white border border-red-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-red-300"/>
                              </div>
                              <div className="flex gap-2 mb-4">
                                <input type="number" placeholder="성공 보상(+p)" value={newBossReward} onChange={e=>setNewBossReward(e.target.value)} className="w-1/2 bg-white border border-red-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-red-300 text-center"/>
                                <input type="number" placeholder="실패 감점(-p)" value={newBossPenalty} onChange={e=>setNewBossPenalty(e.target.value)} className="w-1/2 bg-white border border-red-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-red-300 text-center"/>
                              </div>
                              <button onClick={handleAddBoss} className="w-full bg-red-700 text-white rounded-xl py-3 font-black hover:bg-red-800 transition-colors shadow-md">보스 생성</button>
                           </div>
                        </div>

                        <div className="bg-purple-50 p-8 rounded-[40px] border border-purple-200 shadow-sm flex flex-col">
                           <div className="flex justify-between items-center mb-6">
                              <h4 className="text-xl font-black text-purple-800 flex items-center gap-2"><Lock className="text-purple-500"/> 블랙마켓 관리소</h4>
                              {activeMarket && <button onClick={() => { setActiveMarket(null); syncToFirebase({ activeMarket: null }); }} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md hover:bg-slate-700">마켓 강제 닫기</button>}
                           </div>
                           
                           <div className="space-y-3 mb-6 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                              {safeArray(marketPresets).map(m => {
                                if(!m) return null;
                                return (
                                <div key={m.id} className={`p-5 rounded-2xl border-2 flex justify-between items-center transition-all ${activeMarket?.id === m.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-105 my-2' : 'bg-white border-purple-100 hover:border-purple-300'}`}>
                                   <div><p className="font-black text-base mb-1">{m.name}</p><p className={`text-[10px] font-bold ${activeMarket?.id === m.id ? 'text-purple-200' : 'text-slate-500'} truncate w-40`}>{m.desc}</p></div>
                                   {activeMarket?.id !== m.id ? (
                                      <div className="flex flex-col gap-2">
                                        <button onClick={() => { setActiveMarket(m); syncToFirebase({ activeMarket: m }); }} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-purple-200 shadow-sm">오픈하기</button>
                                        <button onClick={() => handleDeleteMarket(m.id)} className="text-slate-300 hover:text-red-500 text-xs font-bold text-center">삭제</button>
                                      </div>
                                   ) : <span className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-black animate-pulse text-white">영업 중!</span>}
                                </div>
                              )})}
                           </div>

                           <div className="bg-white p-5 rounded-2xl border border-purple-100 mb-6 shadow-sm">
                              <p className="font-black text-purple-800 mb-3 text-sm flex items-center gap-1"><ShoppingCart className="w-4 h-4"/> 마켓 판매 리스트</p>
                              <div className="max-h-[100px] overflow-y-auto custom-scrollbar space-y-1 pr-2">
                                {safeArray(marketItems).map(item => {
                                  if(!item) return null;
                                  return (
                                  <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-700">
                                     <span className="truncate w-3/4">{item.name}</span><span className="text-purple-600 shrink-0">{item.price}p</span>
                                  </div>
                                )})}
                              </div>
                           </div>

                           <div className="mt-auto border-t border-purple-200 pt-6">
                              <p className="text-sm font-black text-purple-800 mb-3 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> 새 마켓 테마 만들기</p>
                              <div className="space-y-2 mb-4">
                                <input type="text" placeholder="마켓 이름 (예: VIP 상점)" value={newMarketName} onChange={e=>setNewMarketName(e.target.value)} className="w-full bg-white border border-purple-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-purple-300"/>
                                <input type="text" placeholder="마켓 설명" value={newMarketDesc} onChange={e=>setNewMarketDesc(e.target.value)} className="w-full bg-white border border-purple-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-purple-300"/>
                              </div>
                              <button onClick={handleAddMarket} className="w-full bg-purple-700 text-white rounded-xl py-3 font-black hover:bg-purple-800 transition-colors shadow-md">마켓 테마 생성</button>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* 5. 시스템 설정 탭 */}
                {teacherTab === 'settings' && isAuthenticated === 'teacher' && (
                  <div className="space-y-8">
                     <h3 className="text-3xl font-black text-slate-800 mb-8 px-2 border-l-8 border-slate-700 pl-6">시스템 코어 설정</h3>
                     
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                        <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-200 shadow-sm flex flex-col justify-between">
                           <div>
                             <h4 className="text-xl font-black text-indigo-800 mb-2 flex items-center gap-2"><Crown className="w-6 h-6"/> 모둠장 올클리어 보너스</h4>
                             <p className="text-indigo-600/80 font-bold text-sm mb-6 leading-relaxed">모둠장이 자기 모둠원들의 역할을 전부 챙겨서 올클리어 스킬을 발동했을 때 즉시 지급되는 리더십 보너스입니다.</p>
                           </div>
                           <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-indigo-100 w-fit shadow-sm">
                              <input type="number" value={leaderConfig.allClearBonus || 0} onChange={(e)=>{ const val = parseFloat(e.target.value)||0; setLeaderConfig({...leaderConfig, allClearBonus: val}); syncToFirebase({leaderConfig: {...leaderConfig, allClearBonus: val}}); }} className="w-20 text-center font-black text-indigo-600 text-2xl p-2 rounded-xl bg-slate-50 outline-none focus:border-indigo-300 border border-transparent" />
                              <span className="font-black text-indigo-800">포인트 (p)</span>
                           </div>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between">
                           <div>
                             <h4 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2"><Settings className="w-6 h-6"/> 학급 총점 치트키</h4>
                             <p className="text-slate-500 font-bold text-sm mb-6 leading-relaxed">과거 마감 기록이 날아갔거나, 이벤트로 학급 전체 총점을 크게 보정해야 할 때 사용하는 수동 조절기입니다.</p>
                           </div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                             <div className="flex justify-between items-center">
                               <span className="font-black text-sm text-slate-400">현재 보정된 점수:</span>
                               <span className="text-2xl font-black text-blue-600">{manualTotalBonus > 0 ? '+' : ''}{manualTotalBonus}p</span>
                             </div>
                             <div className="flex gap-2">
                               <input type="number" value={manualAdjustAmount} onChange={e=>setManualAdjustAmount(e.target.value)} placeholder="점수 입력" className="flex-1 text-center font-black p-3 rounded-xl bg-slate-50 outline-none border border-transparent focus:border-blue-300"/>
                               <button onClick={() => { const val = manualTotalBonus + (parseFloat(manualAdjustAmount)||0); setManualTotalBonus(val); syncToFirebase({manualTotalBonus: val}); setManualAdjustAmount(''); }} className="bg-blue-600 text-white px-5 rounded-xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-md">적용</button>
                               <button onClick={() => { setManualTotalBonus(0); syncToFirebase({manualTotalBonus: 0}); }} className="bg-slate-200 text-slate-600 px-4 rounded-xl font-black hover:bg-slate-300 active:scale-95 transition-all">0점</button>
                             </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm mb-8">
                        <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><SlidersHorizontal className="w-6 h-6 text-blue-500"/> 진화 커트라인 설정 (10단계)</h4>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                           <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                              <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">🥚 잔여 점수 기준 진화</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 {[ { id: 'e1', label: '1. 잠든 알', icon: '🥚' }, { id: 'e2', label: '2. 깨는 알', icon: '🐣' }, { id: 'e3', label: '3. 병아리', icon: '🐥' }, { id: 'e4', label: '4. 발랄 병아리', icon: '🐤' }, { id: 'e5', label: '5. 닭', icon: '🐔' }, { id: 'e6', label: '6. 새', icon: '🕊️' }, { id: 'e7', label: '7. 독수리', icon: '🦅' }, { id: 'e8', label: '8. 유니콘', icon: '🦄' }, { id: 'e9', label: '9. 꼬마 드래곤', icon: '🐲' }].map(item => (
                                   <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                      <span className="font-bold text-sm text-slate-700 truncate mr-2 flex items-center gap-2">{item.icon} {item.label}</span>
                                      <div className="flex items-center gap-1 shrink-0"><span className="text-xs text-slate-400">~</span><input type="number" value={evoThresholds[item.id]} onChange={(e) => { const newTh = {...evoThresholds, [item.id]: parseInt(e.target.value)||0}; setEvoThresholds(newTh); syncToFirebase({evoThresholds: newTh}); }} className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 font-black text-xs outline-none focus:border-blue-400"/></div>
                                   </div>
                                 ))}
                              </div>
                           </div>

                           <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                              <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">🌲 누적 점수 기준 칭호</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 {[ { id: 't1', label: '1. 잠든 씨앗', icon: '🤎' }, { id: 't2', label: '2. 새싹', icon: '🌱' }, { id: 't3', label: '3. 줄기', icon: '🌿' }, { id: 't4', label: '4. 클로버', icon: '☘️' }, { id: 't5', label: '5. 꽃봉오리', icon: '🌷' }, { id: 't6', label: '6. 꽃', icon: '🌻' }, { id: 't7', label: '7. 열매', icon: '🍎' }, { id: 't8', label: '8. 나무', icon: '🌳' }, { id: 't9', label: '9. 숲', icon: '🌲' }].map(item => (
                                   <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                      <span className="font-bold text-sm text-slate-700 truncate mr-2 flex items-center gap-2">{item.icon} {item.label}</span>
                                      <div className="flex items-center gap-1 shrink-0"><span className="text-xs text-slate-400">~</span><input type="number" value={tierThresholds[item.id]} onChange={(e) => { const newTh = {...tierThresholds, [item.id]: parseInt(e.target.value)||0}; setTierThresholds(newTh); syncToFirebase({tierThresholds: newTh}); }} className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 font-black text-xs outline-none focus:border-green-400"/></div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-orange-50 p-8 rounded-[30px] border border-orange-200 shadow-sm flex flex-col justify-between">
                           <div><h4 className="text-xl font-black text-orange-800 mb-3">당일 체크 내역 리셋</h4><p className="text-orange-600/80 font-bold text-sm mb-6 leading-relaxed">마감 전, 오늘 하루 동안 학생들이 누른 모든 긍정/부정 버튼을 취소합니다.</p></div>
                           <button onClick={clearTodayChecks} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 rounded-2xl font-black shadow-md active:scale-95 transition-all text-lg">오늘 하루 리셋</button>
                        </div>
                        <div className="bg-red-50 p-8 rounded-[30px] border border-red-200 shadow-sm flex flex-col justify-between">
                           <div><h4 className="text-xl font-black text-red-800 mb-3 flex items-center gap-2"><AlertTriangle /> 데이터 공장 초기화</h4><p className="text-red-600/80 font-bold text-sm mb-6 leading-relaxed">과거 마감 기록과 모든 점수, 설정이 완전히 삭제됩니다. <b>되돌릴 수 없습니다.</b></p></div>
                           <button onClick={factoryResetSystem} className="bg-white text-red-600 border-2 border-red-300 w-full py-4 rounded-2xl font-black shadow-sm hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-95 transition-all text-lg">완전 초기화</button>
                        </div>
                     </div>
                  </div>
                )}
             </section>
          </div>
        )}
      </main>

      {/* 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-3 flex justify-around items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
         <button onClick={() => setActiveTab('classroom')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'classroom' ? 'text-blue-600 scale-110 -translate-y-2' : 'text-slate-400 hover:text-blue-400'}`}>
            <LayoutDashboard className="w-6 h-6"/>
            <span className="text-[11px] font-black">교실</span>
         </button>
         <button onClick={() => setActiveTab('hyunryeong')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'hyunryeong' ? 'text-indigo-600 scale-110 -translate-y-2' : 'text-slate-400 hover:text-indigo-400'}`}>
            <ClipboardCheck className="w-6 h-6"/>
            <span className="text-[11px] font-black">현령</span>
         </button>
         <button onClick={() => setActiveTab('shop')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'shop' ? 'text-yellow-600 scale-110 -translate-y-2' : 'text-slate-400 hover:text-yellow-400'}`}>
            <ShoppingCart className="w-6 h-6"/>
            <span className="text-[11px] font-black">상점</span>
         </button>
         <button onClick={() => setActiveTab('info')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'info' ? 'text-green-600 scale-110 -translate-y-2' : 'text-slate-400 hover:text-green-400'}`}>
            <User className="w-6 h-6"/>
            <span className="text-[11px] font-black">반 정보</span>
         </button>
         <button onClick={() => isAuthenticated ? setActiveTab('admin') : setShowModal('password')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'admin' ? 'text-slate-900 scale-110 -translate-y-2' : 'text-slate-400 hover:text-slate-700'}`}>
            <Lock className="w-6 h-6"/>
            <span className="text-[11px] font-black">관리</span>
         </button>
      </nav>

      {/* 모달 (비밀번호) */}
      {showModal === 'password' && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-[9999]">
          <div className="bg-white rounded-[50px] p-12 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="text-center mb-8">
               <div className="bg-slate-100 w-24 h-24 rounded-[30px] flex items-center justify-center mx-auto mb-6 text-slate-700 shadow-inner"><Lock className="w-10 h-10" /></div>
               <h3 className="text-2xl font-black text-slate-800 mb-2">관리자 접속</h3>
               <p className="text-xs font-bold text-slate-400">교사(6505) / 감찰사(1111)</p>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-4xl tracking-[20px] font-black p-6 border-4 border-slate-100 rounded-3xl outline-none mb-8 bg-slate-50 focus:border-indigo-400 transition-colors" autoFocus placeholder="••••" />
            <div className="flex gap-4">
              <button onClick={() => setShowModal(null)} className="flex-1 py-5 rounded-2xl font-black text-slate-500 text-lg bg-slate-100 hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={handleLogin} className="flex-1 py-5 rounded-2xl font-black bg-slate-800 text-white text-lg shadow-xl hover:bg-slate-900 transition-all active:scale-95">접속</button>
            </div>
          </div>
        </div>
      )}

      {/* 가챠 잭팟 모달 */}
      {showJackpot && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 p-20 rounded-[60px] shadow-[0_0_100px_rgba(253,224,71,0.8)] text-center animate-bounce">
            <div className="text-9xl mb-4">🎰🎉👑</div>
            <h2 className="text-7xl font-black text-red-600 mb-4 drop-shadow-lg">JACKPOT!!</h2>
            <p className="text-4xl font-black text-yellow-900">엄청난 행운이 터졌습니다!</p>
            <div className="mt-8 text-5xl font-black text-white bg-red-600 px-8 py-4 rounded-full inline-block border-8 border-yellow-200 animate-pulse">
              +{(gachaConfig[gachaConfig.mode || 'normal']?.t4?.reward) || 100}p 획득!
            </div>
          </div>
        </div>
      )}

      {/* 마니또 정체 공개 (두구두구) */}
      {manitoRevealState && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-slate-900/95 backdrop-blur-md px-6">
          {manitoRevealState === 'loading' ? (
            <div className="text-center animate-pulse">
              <div className="text-9xl mb-8">🥁</div>
              <h2 className="text-4xl md:text-6xl font-black text-yellow-400 tracking-widest">오늘의 마니또는 과연...?</h2>
            </div>
          ) : (
            <div className={`p-12 md:p-20 rounded-[50px] md:rounded-[60px] text-center animate-in zoom-in duration-500 max-w-4xl w-full shadow-2xl relative overflow-hidden ${manitoRevealState === 'success' ? 'bg-gradient-to-b from-blue-600 to-indigo-800 text-white border-8 border-blue-400' : 'bg-slate-800 text-slate-100 border-4 border-slate-600'}`}>
              {manitoRevealState === 'success' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>}
              <div className="relative z-10">
                <div className="text-7xl md:text-9xl mb-6 animate-bounce">{manitoRevealState === 'success' ? '👼✨' : '💛'}</div>
                <h2 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-lg">{effectiveManitoName}</h2>
                <p className="text-xl md:text-2xl font-bold mb-10 opacity-90">{manitoRevealState === 'success' ? '완벽한 수호자 미션 달성!' : '미션은 실패했지만 고생 많았어요!'}</p>
                <div className="bg-black/30 backdrop-blur-md p-8 md:p-10 rounded-[30px] border border-white/20 shadow-inner">
                   <p className="text-xs md:text-sm font-black uppercase tracking-widest mb-4 opacity-70">모두 함께 외쳐주세요!</p>
                   <p className="text-2xl md:text-4xl font-black leading-snug break-keep-all">"{manitoRevealMsg}"</p>
                </div>
                <button onClick={closeManitoReveal} className={`mt-10 font-black px-12 py-5 rounded-full text-xl hover:scale-105 transition-transform shadow-xl w-full md:w-auto ${manitoRevealState === 'success' ? 'bg-white text-blue-900' : 'bg-slate-600 text-white hover:bg-slate-500'}`}>확인 완료</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal === 'bossClear' && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-white/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-gradient-to-br from-yellow-100 to-yellow-300 border-[12px] border-yellow-400 p-20 rounded-[80px] shadow-2xl text-center transform hover:scale-105 transition-transform duration-500">
            <div className="text-9xl mb-6 animate-bounce">👼</div>
            <h2 className="text-6xl font-black text-yellow-600 mb-6 drop-shadow-md">보스 정화 완료!</h2>
            <p className="text-3xl font-black text-slate-700 mb-4">26명의 마음이 모여 기적이 일어났어요!</p>
            <p className="text-2xl font-black text-blue-600 bg-white/50 inline-block px-6 py-2 rounded-full mt-4">보너스 점수 획득!</p>
          </div>
        </div>
      )}

      {showModal === 'success' && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none animate-in fade-in duration-300">
          <div className="bg-white border-[12px] border-yellow-400 p-20 rounded-[80px] shadow-2xl animate-bounce text-center"><h2 className="text-7xl font-black text-blue-600 mb-6">🎉 마감 성공! 🎉</h2><p className="text-4xl font-black text-slate-500">기록이 저장되었습니다.</p></div>
        </div>
      )}

      <style>{`
        body { margin-bottom: env(safe-area-inset-bottom); }
        .pb-safe { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .animate-breathe { animation: breathe 2.5s infinite ease-in-out; }
        @keyframes fly-up { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-50px) scale(1.5); opacity: 0; } }
        .animate-fly-up { animation: fly-up 0.8s ease-out forwards; }
        @keyframes shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .animate-spin-slow { animation: spin 4s linear infinite; }
      `}</style>
    </div>
  );
};

export default App;
