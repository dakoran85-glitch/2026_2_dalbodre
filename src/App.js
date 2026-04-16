/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Trophy, RefreshCcw, ShieldCheck, 
  Volume2, Heart, Clock, Lock, BarChart3, History, Save, X, 
  Minus, Plus, MinusCircle, PlusCircle, AlertTriangle, Database, Gift, UserPlus, RotateCcw, Star, Loader2, Target, Settings, Trash2, ShoppingCart, SlidersHorizontal, Sparkles, Zap, Flame, Crown, Sword, Coins, BookOpen, Briefcase, LayoutDashboard, ClipboardCheck, User
} from 'lucide-react';

// ==========================================
// 🚨 파이어베이스 주소 (V2 전용 독립 공간)
const DATABASE_URL = "https://dalbodre-db-default-rtdb.asia-southeast1.firebasedatabase.app/"; 
// ==========================================

// 🎵 사운드 재생 함수
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); 
    const gain = ctx.createGain();
    osc.connect(gain); 
    gain.connect(ctx.destination);
    
    if (type === 'good') { osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); osc.type = 'sine'; }
    else if (type === 'bad') { osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); osc.type = 'sawtooth'; }
    else if (type === 'gacha' || type === 'buy') { osc.frequency.setValueAtTime(400, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3); osc.type = 'square'; }
    else if (type === 'jackpot') { osc.type = 'triangle'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3); }
    else if (type === 'drumroll') { osc.type = 'square'; osc.frequency.setValueAtTime(100, ctx.currentTime); osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 3); }
    else if (type === 'failSoft') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.6); }
    
    osc.start(); 
    gain.gain.setValueAtTime(0.1, ctx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + (type==='drumroll'?3:(type==='failSoft'?0.6:0.3))); 
    osc.stop(ctx.currentTime + (type==='drumroll'?3:(type==='failSoft'?0.6:0.3)));
  } catch (e) {
    console.error("Audio error", e);
  }
};

// 🛡️ 백지화(Crash) 방지용 데이터 정규화 함수
const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
};

// 🌟 마니또 외침 멘트 (60개)
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

// 🌟 초기 데이터 및 설정
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

const defaultGachaNormal = { cost: 30, t1: { name: '😭 앗! 꽝입니다.', prob: 50, reward: 0 }, t2: { name: '🪙 럭키! 페이백!', prob: 30, reward: 20 }, t3: { name: '🍬 와우! 간식 당첨!', prob: 15, reward: 20 }, t4: { name: '🎰 잭팟!!', prob: 5, reward: 100 } };
const defaultGachaSpecial = { cost: 30, t1: { name: '😭 앗! 꽝...', prob: 10, reward: 0 }, t2: { name: '🪙 럭키! 페이백!', prob: 20, reward: 20 }, t3: { name: '🍬 혜자 간식 당첨!', prob: 40, reward: 20 }, t4: { name: '✨ 동민신의 축복(잭팟)!!', prob: 30, reward: 150 } };

const fmt = (num) => { const n = parseFloat(num); return isNaN(n) ? 0 : parseFloat(n.toFixed(2)); };

const getRoleBonus = (role) => { 
  if (!role || typeof role !== 'string') return 1; 
  if (role.includes('감찰사')) return 2; 
  if (role.includes('현령')) return 1.5; 
  if (role.includes('향리')) return 1.2; 
  return 1; 
};

// ==========================================
// 아래부터 Part 2 코드가 이어집니다.
// ==========================================

// 🧠 [Part 2: 핵심 로직 훅 (두뇌 엔진)]
const useDalbodreSystem = () => {
  const scriptURL = "https://script.google.com/macros/s/AKfycbw3j6LxhdO0ewIXxkIGrh_pczxrfOJr3A_PTHTsJY1rKb6ES7bPxPQuxRKidd6IWK5_/exec"; 
  
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
  const [gachaConfig, setGachaConfig] = useState({ mode: 'normal', normal: defaultGachaNormal, special: defaultGachaSpecial });
  const [gachaEditTab, setGachaEditTab] = useState('normal'); 
  const [bossPresets, setBossPresets] = useState([{ id: 'b1', name: '전담 선생님의 감시', desc: '아이들의 예쁜 마음을 모아 정화하세요!', reward: 100, penalty: 100 }, { id: 'b2', name: '교장 선생님의 순시', desc: '모두가 바른 태도를 보여주면 천사가 됩니다!', reward: 200, penalty: 200 }]);
  const [marketPresets, setMarketPresets] = useState([{ id: 'm1', name: '달보드레 블랙마켓 (일반)', desc: '희귀 아이템을 팔아보세요.' }, { id: 'm2', name: '🌙 속죄의 퀘스트 상점', desc: '감점을 지우고 싶은 자, 퀘스트를 수락하라!' }]);
  const [marketItems, setMarketItems] = useState([{ id: 'm_item_1', name: '마술 직관권', price: 50 }, { id: 'm_item_2', name: '1일 현령 체험권', price: 150 }, { id: 'm_item_3', name: '📜 [퀘스트] 그림자 수호대 (일주일 봉사)', price: 0 }, { id: 'm_item_4', name: '🎭 [퀘스트] 비밀의 무대 (1분 장기자랑)', price: 0 }]);
  const [manitoConfig, setManitoConfig] = useState({ targetId: null, reward: 50 });
  const [checkedGroupGoals, setCheckedGroupGoals] = useState({});

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
    return arr.length === 0 ? defaultRoles : arr.map(r => (typeof r === 'string' ? { name: r, manual: '' } : { name: r?.name || '', manual: r?.manual || '' }));
  }, [rolesList]);

  const safeStudentsArray = useMemo(() => {
    const arr = safeArray(students);
    return arr.length === 0 ? defaultStudents : arr.map(s => ({ ...s, group: s.group || 1, isLeader: !!s.isLeader, role: s.role || '' }));
  }, [students]);

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

  useEffect(() => {
    const fetchInitial = async () => {
      setHistory(JSON.parse(localStorage.getItem('dal_v32_history')) || []);
      if (!DATABASE_URL || DATABASE_URL.includes("복사한_주소")) { setIsLoading(false); return; }
      try {
        const response = await fetch(`${DATABASE_URL.replace(/\/$/, '')}/classData_V3.json`);
        const data = await response.json();
        if (data) {
          if (data.students) setStudents(safeArray(data.students));
          if (data.rolesList) setRolesList(safeArray(data.rolesList));
          setCheckedStudents(data.checkedStudents || {}); setClassPrep(data.classPrep || {});
          setThreeCompliments(data.threeCompliments || {}); setTeacherCompliments(data.teacherCompliments || {});
          setTimeoutChecks(data.timeoutChecks || {}); setSubjectChecks(data.subjectChecks || {});
          setUsedPoints(data.usedPoints || {}); setWipedPoints(data.wipedPoints || {});
          setLeaderBonuses(data.leaderBonuses || {}); setActiveBoss(data.activeBoss || null);
          setBossBonusPoints(data.bossBonusPoints || 0); setCheckedGroupGoals(data.checkedGroupGoals || {});
          setTargetScore(data.targetScore || 3000); setManualTotalBonus(data.manualTotalBonus || 0);
          if (data.gachaConfig) setGachaConfig(data.gachaConfig);
          if (data.evoThresholds) setEvoThresholds(data.evoThresholds);
          if (data.tierThresholds) setTierThresholds(data.tierThresholds);
        }
      } catch (e) {}
      setIsLoading(false);
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!DATABASE_URL || DATABASE_URL.includes("복사한_주소")) return;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${DATABASE_URL.replace(/\/$/, '')}/classData_V3.json`);
        const data = await response.json();
        if (data) {
          setCheckedStudents(data.checkedStudents || {}); setClassPrep(data.classPrep || {});
          setThreeCompliments(data.threeCompliments || {}); setTimeoutChecks(data.timeoutChecks || {});
          setSubjectChecks(data.subjectChecks || {}); setUsedPoints(data.usedPoints || {});
          setWipedPoints(data.wipedPoints || {}); setLeaderBonuses(data.leaderBonuses || {});
          setActiveBoss(data.activeBoss || null); setBossBonusPoints(data.bossBonusPoints || 0);
          setManualTotalBonus(data.manualTotalBonus || 0); setCheckedGroupGoals(data.checkedGroupGoals || {});
        }
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const syncToFirebase = async (updates) => {
    if (!DATABASE_URL || DATABASE_URL.includes("복사한_주소")) return;
    try { await fetch(`${DATABASE_URL.replace(/\/$/, '')}/classData_V3.json`, { method: 'PATCH', body: JSON.stringify(updates) }); } catch (e) {}
  };

  const todaySeed = new Date().toDateString();
  const seedNum = todaySeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const defaultRandomManitoId = safeStudentsArray.length > 0 ? safeStudentsArray[seedNum % safeStudentsArray.length].id : 1;
  const effectiveManitoId = manitoConfig?.targetId || defaultRandomManitoId;
  const effectiveManitoName = safeStudentsArray.find(s => s.id === effectiveManitoId)?.name || ''; 

  const validHistory = useMemo(() => history.filter(h => h.id > resetTimestamp), [history, resetTimestamp]);

  const todayStudentStats = useMemo(() => {
    return safeStudentsArray.map(s => {
      const pos = (checkedStudents[s.id] ? getRoleBonus(s.role) : 0) + (classPrep[s.id] ? 1 : 0) + (threeCompliments[s.id] ? 1 : 0) + ((teacherCompliments[s.id] || 0) * 1) + (leaderBonuses[s.id] ? (leaderConfig.allClearBonus || 20) : 0);
      const neg = (timeoutChecks[s.id] || 0) * penaltyTimeout + (subjectChecks[s.id] || 0) * penaltySubject;
      return { ...s, pos, neg };
    });
  }, [checkedStudents, classPrep, threeCompliments, teacherCompliments, timeoutChecks, subjectChecks, safeStudentsArray, leaderBonuses]);

  const allStats = useMemo(() => {
    const stats = {};
    safeStudentsArray.forEach(s => { stats[s.id] = { ...s, pos: 0, neg: 0, sum: 0, used: 0, wiped: 0, net: 0 }; });
    validHistory.forEach(rec => {
      try {
        const ind = JSON.parse(rec.rawInd || "{}"); const per = JSON.parse(rec.rawPer || "{}");
        const tm = JSON.parse(rec.rawTm || "{}"); const sb = JSON.parse(rec.rawSb || "{}");
        Object.keys(ind).forEach(id => { if(ind[id] && stats[id]) stats[id].pos += getRoleBonus(stats[id].role); });
        Object.keys(tm).forEach(id => { if(tm[id] && stats[id]) stats[id].neg += (tm[id] * 10); });
      } catch (e) {}
    });
    safeStudentsArray.forEach(s => {
      const cur = todayStudentStats.find(ts => ts.id === s.id);
      if(cur) { stats[s.id].pos += cur.pos; stats[s.id].neg += cur.neg; }
      stats[s.id].sum = fmt(stats[s.id].pos - stats[s.id].neg); 
      stats[s.id].used = parseFloat(usedPoints[s.id] || 0);     
      stats[s.id].wiped = parseFloat(wipedPoints[s.id] || 0);   
      stats[s.id].net = fmt(stats[s.id].sum - stats[s.id].used - stats[s.id].wiped); 
    });
    return Object.values(stats);
  }, [validHistory, todayStudentStats, usedPoints, wipedPoints, safeStudentsArray]);

  const cumulativeClassScore = useMemo(() => {
    const todayTotal = todayStudentStats.reduce((s, c) => s + (c.pos - c.neg), 0) + (bossBonusPoints || 0);
    const pastTotal = validHistory.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
    return fmt(pastTotal + todayTotal + manualTotalBonus);
  }, [validHistory, todayStudentStats, bossBonusPoints, manualTotalBonus]);

  return {
    state: {
      isLoading, activeTab, teacherTab, isAuthenticated, password, showModal, showJackpot, particle, tooltipInfo,
      groupFilter, safeStudentsArray, safeRolesArray, allStats, todayStats: { total: 0 }, cumulativeClassScore,
      checkedStudents, classPrep, threeCompliments, teacherCompliments, timeoutChecks, subjectChecks, checkedGroupGoals,
      activeBoss, bossHp, bossAttacks, bossBonusPoints, activeMarket, marketItems, marketPresets, bossPresets,
      gachaConfig, shopItems, leaderConfig, manitoConfig, manualTotalBonus, targetScore, evoThresholds, tierThresholds,
      storeSelected, newRoleName, newItemName, newItemPrice, newBossName, newBossDesc, newBossReward, newBossPenalty,
      newMarketName, newMarketDesc, selectedGachaStudent, selectedStoreStudent, selectedMarketStudent, manualAdjustAmount,
      manitoRevealState, manitoRevealMsg, effectiveManitoName, effectiveManitoId, selectedHyunRole, leaderBonuses, history, rolesList, students
    },
    actions: {
      setActiveTab, setTeacherTab, setIsAuthenticated, setPassword, setShowModal, setShowJackpot, setGroupFilter, setHistory, setRolesList, setStudents,
      handleAdjust: (id, type, delta, e) => {
        if (delta > 0) playSound('good'); else playSound('bad');
        if (e && delta > 0) setParticle({ x: e.clientX, y: e.clientY, text: "+", id: Date.now() });
        if (type === 'timeout') syncToFirebase({ timeoutChecks: { ...timeoutChecks, [id]: Math.max(0, fmt((timeoutChecks[id] || 0) + delta)) }});
        else if (type === 'subject') syncToFirebase({ subjectChecks: { ...subjectChecks, [id]: Math.max(0, fmt((subjectChecks[id] || 0) + delta)) }});
      },
      handleToggle: (id, type) => {
        const updates = {};
        if (type === 'role') updates.checkedStudents = { ...checkedStudents, [id]: !checkedStudents[id] };
        if (type === 'prep') updates.classPrep = { ...classPrep, [id]: !classPrep[id] };
        if (type === 'comp') updates.threeCompliments = { ...threeCompliments, [id]: !threeCompliments[id] };
        syncToFirebase(updates); playSound('good');
      },
      handleGroupAllClear: (leaderId, groupNum, e) => {
        const newRoles = {...checkedStudents}; const newPreps = {...classPrep};
        safeStudentsArray.filter(s => s.group === groupNum).forEach(s => { newRoles[s.id] = true; newPreps[s.id] = true; });
        syncToFirebase({ checkedStudents: newRoles, classPrep: newPreps, leaderBonuses: {...leaderBonuses, [leaderId]: true} });
      },
      handlePurify: (id, e) => {
        const nextAttacks = { ...bossAttacks, [id]: !bossAttacks[id] };
        syncToFirebase({ bossAttacks: nextAttacks });
        if (Object.values(nextAttacks).filter(Boolean).length >= safeStudentsArray.length) {
          setShowModal('bossClear'); syncToFirebase({ activeBoss: null, bossBonusPoints: bossBonusPoints + 100 });
        }
      },
      handleRevealManito: () => { setManitoRevealState('success'); setManitoRevealMsg("최고의 수호천사!"); },
      closeManitoReveal: () => setManitoRevealState(null),
      handleLogin: () => { if (password === "6505") setIsAuthenticated('teacher'); else if (password === "1111") setIsAuthenticated('inspector'); setActiveTab('admin'); },
      toggleStoreSelect: (id) => setStoreSelected(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id]),
      handleStudentStoreBuy: (id, item) => syncToFirebase({ usedPoints: { ...usedPoints, [id]: (usedPoints[id]||0) + item.price } }),
      handleGacha: (id) => { syncToFirebase({ usedPoints: { ...usedPoints, [id]: (usedPoints[id]||0) + 30 } }); alert("꽝!"); },
      handleEvolutionClick: (id, texts) => { setTooltipInfo({ id, text: texts[0] }); setTimeout(()=>setTooltipInfo({id:null}), 2000); }
    },
    utils: { getEvolution, getLifetimeTier, currentBossHits: Object.values(bossAttacks || {}).filter(Boolean).length, maxBossHits: safeStudentsArray.length }
  };
};

// 🎨 [Part 3: 화면 UI 렌더링 컴포넌트]
const App = () => {
  const { state, actions, utils } = useDalbodreSystem();
  const { isLoading, activeTab, teacherTab, isAuthenticated, password, showModal, showJackpot, particle, tooltipInfo, groupFilter, allStats, cumulativeClassScore, checkedStudents, classPrep, threeCompliments, timeoutChecks, subjectChecks, activeBoss, bossAttacks, safeRolesArray, selectedHyunRole, leaderBonuses, manitoRevealState, manitoRevealMsg, effectiveManitoName, shopItems, storeSelected, rolesList, targetScore, evoThresholds, tierThresholds } = state;
  const { setActiveTab, setTeacherTab, setIsAuthenticated, setPassword, setShowModal, setGroupFilter, handleAdjust, handleToggle, handleGroupAllClear, handlePurify, handleRevealManito, closeManitoReveal, handleLogin, toggleStoreSelect, handleStudentStoreBuy, handleGacha, handleEvolutionClick, setSelectedHyunRole } = actions;
  const { getEvolution, currentBossHits, maxBossHits } = utils;

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black text-2xl animate-pulse">달보드레 유니버스 로딩 중...</div>;

  return (
    <div className={`min-h-screen font-sans pb-24 transition-colors duration-700 ${activeBoss ? 'bg-red-950' : 'bg-slate-50'}`}>
      {particle && <div className="fixed z-[999] animate-fly-up font-black text-blue-500" style={{ left: particle.x, top: particle.y }}>{particle.text}</div>}
      
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2"><Trophy className="text-blue-600"/><h1 className="font-black text-lg">달보드레 V2</h1></div>
        <div className="text-right"><p className="text-[10px] font-black text-slate-400">학급 총점</p><p className="text-xl font-black text-blue-600">{cumulativeClassScore}p</p></div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {activeTab === 'classroom' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">{['all', 1, 2, 3, 4, 5, 6].map(g => <button key={g} onClick={()=>setGroupFilter(g)} className={`px-4 py-2 rounded-xl font-black text-xs ${groupFilter === g ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{g==='all'?'전체':`${g}모둠`}</button>)}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allStats.filter(s => groupFilter === 'all' || s.group === groupFilter).map(s => (
                <div key={s.id} className="p-5 rounded-[32px] bg-white border-2 border-slate-100 shadow-sm relative">
                  <div className="flex justify-between items-start mb-4">
                    <button onClick={()=>handleEvolutionClick(s.id, getEvolution(s.net).texts)} className="w-12 h-12 bg-slate-50 rounded-2xl text-2xl flex items-center justify-center relative">
                      {getEvolution(s.net).icon}
                      {tooltipInfo?.id === s.id && <div className="absolute -top-10 bg-black text-white text-[10px] p-2 rounded-lg whitespace-nowrap">{tooltipInfo.text}</div>}
                    </button>
                    <div className="flex-1 ml-3"><p className="font-black text-lg">{s.name}</p><p className="text-[10px] font-bold text-slate-400">잔여: {s.net}p</p></div>
                    {s.isLeader && <button onClick={(e)=>handleGroupAllClear(s.id, s.group, e)} className={`p-2 rounded-xl ${leaderBonuses[s.id]?'bg-slate-100 text-slate-300':'bg-blue-100 text-blue-600'}`}><Zap className="w-4 h-4"/></button>}
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-3">
                    <button onClick={()=>handleToggle(s.id, 'role')} className={`py-2 rounded-xl text-[10px] font-black border-2 ${checkedStudents[s.id]?'bg-green-500 border-green-500 text-white':'bg-slate-50 text-slate-400'}`}>역할</button>
                    <button onClick={()=>handleToggle(s.id, 'prep')} className={`py-2 rounded-xl text-[10px] font-black border-2 ${classPrep[s.id]?'bg-purple-500 border-purple-500 text-white':'bg-slate-50 text-slate-400'}`}>준비</button>
                    <button onClick={()=>handleToggle(s.id, 'comp')} className={`py-2 rounded-xl text-[10px] font-black border-2 ${threeCompliments[s.id]?'bg-pink-500 border-pink-500 text-white':'bg-slate-50 text-slate-400'}`}>칭찬</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button onClick={(e)=>handleAdjust(s.id, 'timeout', 1, e)} className="py-1.5 rounded-lg bg-red-50 text-red-500 text-[9px] font-black">타임아웃 {timeoutChecks[s.id]>0 && `(${timeoutChecks[s.id]})`}</button>
                    <button onClick={(e)=>handleAdjust(s.id, 'subject', 1, e)} className="py-1.5 rounded-lg bg-orange-50 text-orange-500 text-[9px] font-black">전담지적 {subjectChecks[s.id]>0 && `(${subjectChecks[s.id]})`}</button>
                  </div>
                  {activeBoss && <button onClick={(e)=>handlePurify(s.id, e)} className={`w-full mt-2 py-2 rounded-xl font-black text-xs border-2 ${bossAttacks[s.id]?'bg-yellow-400 text-yellow-900 border-yellow-400':'bg-slate-800 text-yellow-400 border-yellow-400'}`}>{bossAttacks[s.id]?'정화완료':'✨보스정화'}</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'hyunryeong' && (
          <div className="bg-white rounded-[40px] p-8 shadow-sm">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-indigo-600"><ClipboardCheck/> 현령 센터</h2>
            <div className="flex flex-wrap gap-2 mb-8">
              {safeRolesArray.map(r => <button key={r.name} onClick={()=>setSelectedHyunRole(r)} className={`px-4 py-2 rounded-xl font-black text-sm border-2 ${selectedHyunRole?.name === r.name ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500'}`}>{r.name}</button>)}
            </div>
            {selectedHyunRole && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="bg-indigo-50 p-6 rounded-3xl mb-6"><h4 className="font-black text-indigo-800 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4"/> 업무 매뉴얼</h4><p className="text-sm font-bold text-indigo-600 whitespace-pre-wrap">{selectedHyunRole.manual || "지침 없음"}</p></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {allStats.map(s => <button key={s.id} onClick={()=>handleToggle(s.id, 'role')} className={`p-3 rounded-xl font-black text-xs border-2 ${checkedStudents[s.id]?'bg-green-500 text-white border-green-500':'bg-white text-slate-400'}`}>{s.name}</button>)}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="p-8 rounded-[40px] bg-yellow-50 border-2 border-yellow-200">
              <h2 className="text-2xl font-black mb-6 text-yellow-700">🎰 행운의 가챠</h2>
              <select className="w-full p-4 rounded-2xl font-black mb-4 border-2"><option value="">누가 뽑을까요?</option>{allStats.map(s=><option key={s.id} value={s.id}>{s.name} ({s.net}p)</option>)}</select>
              <button onClick={()=>handleGacha()} className="w-full py-4 rounded-2xl bg-yellow-400 text-yellow-900 font-black text-xl shadow-lg">가챠 돌리기 (30p)</button>
            </section>
            <section className="p-8 rounded-[40px] bg-blue-50 border-2 border-blue-100">
              <h2 className="text-2xl font-black mb-6 text-blue-700">🛒 포인트 상점</h2>
              <div className="space-y-2">
                {shopItems.map(item => <button key={item.id} className="w-full p-4 rounded-2xl bg-white border-2 border-blue-100 flex justify-between items-center font-black hover:bg-blue-50 transition-all"><span>{item.name}</span><span className="text-blue-600">{item.price}p</span></button>)}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'admin' && isAuthenticated && (
          <div className="bg-white rounded-[40px] shadow-sm border p-8 flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 space-y-2 shrink-0">
               {['history', 'full-stats', 'store', 'events', 'settings'].map(t => <button key={t} onClick={()=>setTeacherTab(t)} className={`w-full text-left p-4 rounded-2xl font-black transition-all ${teacherTab===t?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-100'}`}>{t.toUpperCase()}</button>)}
            </aside>
            <section className="flex-1">
               {teacherTab === 'full-stats' && (
                 <div className="space-y-4">
                    <h3 className="text-xl font-black">학생 및 역할 관리</h3>
                    <div className="overflow-x-auto border rounded-2xl"><table className="w-full text-left"><thead className="bg-slate-50 text-[10px] font-black text-slate-400"><tr><th className="p-4">이름</th><th className="p-4">모둠</th><th className="p-4">역할</th></tr></thead><tbody className="divide-y">{allStats.map(s => <tr key={s.id}><td className="p-4 font-black">{s.name}</td><td className="p-4">{s.group}모둠</td><td className="p-4">{s.role || '없음'}</td></tr>)}</tbody></table></div>
                 </div>
               )}
            </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t px-2 py-3 flex justify-around items-center z-50 shadow-lg">
         {[{id:'classroom', icon:<LayoutDashboard/>, label:'교실'}, {id:'hyunryeong', icon:<ClipboardCheck/>, label:'현령'}, {id:'shop', icon:<ShoppingCart/>, label:'상점'}, {id:'info', icon:<User/>, label:'정보'}, {id:'admin', icon:<Lock/>, label:'관리'}].map(item => (
           <button key={item.id} onClick={()=>item.id==='admin'&&!isAuthenticated?setShowModal('password'):setActiveTab(item.id)} className={`flex flex-col items-center gap-1 flex-1 ${activeTab===item.id?'text-blue-600':'text-slate-400'}`}>{item.icon}<span className="text-[10px] font-black">{item.label}</span></button>
         ))}
      </nav>

      {showModal === 'password' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-sm text-center animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-6">관리자 비밀번호</h3>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleLogin()} className="w-full p-4 border-4 rounded-2xl text-center text-2xl font-black mb-6 outline-none focus:border-blue-400" autoFocus />
            <div className="flex gap-2"><button onClick={()=>setShowModal(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-500">취소</button><button onClick={handleLogin} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">확인</button></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fly-up { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-50px); opacity: 0; } }
        .animate-fly-up { animation: fly-up 0.8s ease-out forwards; }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .animate-breathe { animation: breathe 2.5s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;
