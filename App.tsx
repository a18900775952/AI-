import React, { useState, useEffect, useMemo, useRef } from 'react';
import { evaluateGameAsset, parseMarketImage } from './services/geminiService.ts';
import { dataService, DELTA_HOT_ITEMS, DELTA_COLLECTION_WEAPONS_BASE, DELTA_QUALITIES } from './services/dataService.ts';
import { authService } from './services/authService.ts';
import { translations, Language } from './services/i18n.ts';
import { ValuationRequest, ValuationResponse, GameField, GameConfigMap, User } from './types.ts';
import AdminDashboard from './AdminDashboard.tsx';
import html2canvas from 'html2canvas';
import { 
  BoltIcon, SparklesIcon, ArrowPathIcon,
  CpuChipIcon, ScaleIcon, LinkIcon,
  TrashIcon, CameraIcon, ChevronDownIcon, CubeIcon, AdjustmentsHorizontalIcon,
  MegaphoneIcon, ChatBubbleLeftRightIcon, ChartBarSquareIcon,
  CommandLineIcon, PhotoIcon, ShieldExclamationIcon, QrCodeIcon, EyeIcon, ClockIcon, GlobeAltIcon, FireIcon,
  StarIcon, XCircleIcon
} from '@heroicons/react/24/outline';

const AppCountdown = () => {
   const [t, setT] = useState(0);
   useEffect(() => { const i = setInterval(() => setT(p => p+0.1), 100); return () => clearInterval(i); }, []);
   return <div className="font-mono text-primary text-xl font-bold tracking-widest mt-4">{t.toFixed(1)}s</div>
};

// --- SENSITIVE WORD FILTER ---
const checkSensitiveWords = (data: any): boolean => {
    const prohibited = ['政治', '博彩', '赌博', '色情', '代练', '外挂', '辅助', '脚本', '死绑', '毁号'];
    const text = JSON.stringify(data).toLowerCase();
    return prohibited.some(word => text.includes(word));
};

// --- SEO STRUCTURED DATA ---
const JSONLD = () => (
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Singularity Nebula Game Valuation",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "CNY" },
        "description": "Professional AI-powered game asset valuation system using DeepSeek V3 & SiliconFlow."
    })}} />
);

// --- CYBERPUNK LOADING LOGS ---
const LoadingLogs = () => {
    const [logIndex, setLogIndex] = useState(0);
    const logs = [
        "Initializing Neural Link...",
        "Connecting to SiliconFlow Cortex (DeepSeek V3.2)...",
        "Retrieving Pricing Matrix v3.2...",
        "Scanning Market Liquidity Pools...",
        "Analyzing 50,000+ Recent Transactions...",
        "Detecting Skin/Asset Patterns...",
        "Calibrating Volatility Index...",
        "Applying Risk Correction Factors...",
        "Finalizing Valuation Model...",
        "Optimizing Output..."
    ];

    useEffect(() => {
        if (logIndex < logs.length - 1) {
            const timeout = setTimeout(() => setLogIndex(prev => prev + 1), 800 + Math.random() * 500);
            return () => clearTimeout(timeout);
        }
    }, [logIndex]);

    return (
        <div className="w-full max-w-xs mt-6 font-mono text-[10px] text-primary/70 text-left space-y-1 h-24 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-void-900 via-transparent to-transparent z-10"></div>
            {logs.slice(Math.max(0, logIndex - 3), logIndex + 1).map((log, i) => (
                <div key={i} className="animate-fade-in-up flex items-center gap-2">
                    <span className="text-accent-gold">>></span> {log}
                </div>
            ))}
        </div>
    );
}

// --- UPDATES WITH PAGINATION ---
const SYSTEM_UPDATES = [
  { ver: 'V1.0', date: '2025-02-01', title: 'Official Release (Correct Ver)', desc: 'System stabilized and validated. Designated as the correct V1 version for production.\n系统核心功能验证完毕，版本号正式定为 V1 (正确版本)。', code: 'System.mark_stable(V1);' },
  { ver: 'v3.5.1', date: '2025-01-30', title: 'DeepSeek Vision (Janus)', desc: 'Switched Vision Center backend to DeepSeek Janus-Pro-7B. Enhanced OCR capabilities for game assets at zero cost.\n视觉中枢后端已切换至 DeepSeek Janus-Pro-7B，提供免费且高效的 OCR 识别能力。', code: 'use(DeepSeek_Janus_Pro);' },
  { ver: 'v3.5.0', date: '2025-01-30', title: 'Vision Core Precision', desc: 'Upgraded OCR matching algorithm. Now supports intelligent fuzzy matching for weapon skins and bundles from screenshots.\n视觉核心精度升级。新增智能模糊匹配算法，大幅提升截图识别武器皮肤与捆绑包的准确率。', code: 'match(OCR_Raw, Config_List);' },
  { ver: 'v3.4.0', date: '2025-01-29', title: 'DeepSeek V3.2 Upgrade', desc: 'Upgraded core logic to DeepSeek V3.2 via SiliconFlow for enhanced complex reasoning.\n核心逻辑升级至 DeepSeek V3.2 (SiliconFlow)，复杂推理能力大幅提升。', code: 'use(DeepSeek_V3_2);' },
  { ver: 'v3.3.0', date: '2025-01-29', title: 'DeepSeek V3 Core', desc: 'Migrated to DeepSeek V3 (via SiliconFlow) for superior reasoning and JSON output stability.\n核心迁移至 DeepSeek V3，大幅提升逻辑推理能力与估价精准度。', code: 'use(DeepSeek_V3);' },
];

const InfoSectionUpdates = ({ t }: { t: any }) => {
  const [page, setPage] = useState(0);
  const PER_PAGE = 5; 
  const totalPages = Math.ceil(SYSTEM_UPDATES.length / PER_PAGE);
  const currentUpdates = SYSTEM_UPDATES.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto p-8 animate-fade-in pb-20">
      <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><MegaphoneIcon className="w-8 h-8 text-primary"/> {t('systemUpdates')}</h2>
      <div className="space-y-8 relative border-l border-white/10 ml-4 min-h-[400px]">
         {currentUpdates.map((u, i) => (
           <div key={i} className="pl-8 relative">
             <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-primary rounded-full shadow-neon"></div>
             <div className="text-xs text-primary font-mono mb-1">{u.date} <span className="text-gray-500 mx-2">|</span> {u.ver}</div>
             <h3 className="text-xl font-bold text-white mb-2">{u.title}</h3>
             <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line mb-3">{u.desc}</p>
             {u.code && <div className="bg-black/30 border border-white/5 p-3 rounded-lg font-mono text-[10px] text-emerald-400 overflow-x-auto"><pre>{u.code}</pre></div>}
           </div>
         ))}
      </div>
      <div className="flex justify-center gap-4 mt-8">
         <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="px-4 py-2 bg-white/5 rounded text-xs disabled:opacity-30">PREV</button>
         <span className="text-xs text-gray-500 pt-2">{page+1} / {totalPages}</span>
         <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)} className="px-4 py-2 bg-white/5 rounded text-xs disabled:opacity-30">NEXT</button>
      </div>
    </div>
  );
};

const InfoSectionAbout = ({ t }: { t: any }) => (
  <div className="max-w-3xl mx-auto p-8 animate-fade-in">
    <div className="bg-void-900/50 border border-white/5 rounded-2xl p-8 text-center">
       <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-black font-bold text-3xl shadow-neon">PZ</div>
       <h2 className="text-3xl font-bold text-white mb-2">玄鹿AI</h2>
       <p className="text-primary/60 text-sm font-bold tracking-widest mb-6">GAME ASSET VALUATION SYSTEM</p>
       <div className="grid grid-cols-1 gap-8 text-left mb-8">
          <div>
             <h4 className="text-white font-bold mb-2">{t('aboutTitle')}</h4>
             <p className="text-gray-400 text-xs leading-relaxed">
                {t('aboutDesc')}
             </p>
          </div>
       </div>
    </div>
  </div>
);

// --- REUSED COMPONENTS ---
const QuantumPanel = ({ children, title, enTitle, icon: Icon, isOpen, onToggle, isCompleted }: any) => (
  <div className={`glass-panel rounded-xl transition-all duration-300 overflow-hidden ${isOpen ? 'border-primary/50 shadow-neon bg-void-900/60' : 'border-white/10 opacity-90 hover:opacity-100 hover:border-primary/30 hover:bg-void-900/40'}`}>
    <button type="button" onClick={onToggle} className={`w-full flex items-center justify-between p-5 text-left transition-all ${isOpen ? 'bg-gradient-to-r from-primary/10 to-transparent' : 'bg-transparent'}`}>
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isOpen || isCompleted ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,242,234,0.2)]' : 'bg-white/5 text-gray-500'}`}>{Icon && <Icon className="w-5 h-5" />}</div>
          <div>
             <h3 className={`font-sans font-bold text-lg tracking-wide flex items-center gap-3 ${isOpen ? 'text-white' : 'text-gray-300'}`}>{title} {isCompleted && !isOpen && <span className="text-[10px] bg-accent-green/20 text-accent-green px-2 py-0.5 rounded font-mono border border-accent-green/20">SET</span>}</h3>
             {enTitle && <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">{enTitle}</p>}
          </div>
       </div>
       <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${isOpen ? 'border-primary bg-primary text-black rotate-180' : 'border-white/10 text-gray-500'}`}><ChevronDownIcon className="w-4 h-4" /></div>
    </button>
    <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}><div className="p-6 pt-2 border-t border-white/5"><div className="pt-4">{children}</div></div></div>
  </div>
);

const ClearInput = ({ label, value, onChange, placeholder, type="text", isAutoFilled, aiLabel }: any) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="group relative mb-2">
      <label className={`block text-xs font-bold mb-2 transition-colors uppercase tracking-wider flex items-center gap-2 ${focused ? 'text-primary' : 'text-gray-400'}`}>
          {label}
          {isAutoFilled && <span className="text-[9px] bg-accent-gold/20 text-accent-gold px-1.5 py-0.5 rounded border border-accent-gold/30 flex items-center gap-1 shadow-neon"><EyeIcon className="w-3 h-3"/> {aiLabel}</span>}
      </label>
      <div className={`relative transition-all duration-300 ${isAutoFilled ? 'p-0.5 rounded-lg bg-gradient-to-r from-accent-gold/30 to-transparent' : ''}`}>
          <input type={type} value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder || "..."} className={`w-full input-crystal rounded-lg px-4 py-3 text-sm text-white font-mono placeholder-gray-600 outline-none ${isAutoFilled ? 'bg-accent-gold/5 border-accent-gold/30' : ''}`}/>
          <div className={`absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-300 ${focused ? 'w-full shadow-neon' : 'w-0'}`}></div>
      </div>
    </div>
  );
};
const ClearSelect = ({ label, value, onChange, options, isAutoFilled, aiLabel }: any) => (
  <div className="group relative mb-2">
    <label className="block text-xs font-bold mb-2 text-gray-400 uppercase tracking-wider flex items-center gap-2">
        {label}
        {isAutoFilled && <span className="text-[9px] bg-accent-gold/20 text-accent-gold px-1.5 py-0.5 rounded border border-accent-gold/30 flex items-center gap-1 shadow-neon"><EyeIcon className="w-3 h-3"/> {aiLabel}</span>}
    </label>
    <div className={`relative transition-all duration-300 ${isAutoFilled ? 'p-0.5 rounded-lg bg-gradient-to-r from-accent-gold/30 to-transparent' : ''}`}>
        <select value={value} onChange={onChange} className={`w-full input-crystal rounded-lg px-4 py-3 pr-10 text-sm text-white font-mono outline-none appearance-none cursor-pointer ${isAutoFilled ? 'bg-void-900 border-accent-gold/30 text-accent-gold' : 'bg-void-900'}`}>
            <option value="" className="bg-void-900 text-gray-500">SELECT...</option>{options.map((o:string)=><option key={o} value={o} className="bg-void-900">{o}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><ChevronDownIcon className="w-4 h-4" /></div>
    </div>
  </div>
);

// --- NEW TECH TAGS WITH POPUP SUPPORT ---
const TechTags = ({ options, value, onToggle, isAutoFilled, aiLabel }: any) => {
  const selected = value ? value.split(',') : [];
  const [activePopup, setActivePopup] = useState<string | null>(null);

  // Helper to check if item is a collection weapon that needs quality selection
  const isCollection = (opt: string) => DELTA_COLLECTION_WEAPONS_BASE.includes(opt);

  // Get selected qualities for a base item
  const getSelectedQualities = (baseItem: string) => {
      const qualities: string[] = [];
      selected.forEach((s: string) => {
          if (s.startsWith(baseItem + '(')) {
              // Extract Content between parens e.g. "K416...(极品S)" -> "极品S"
              const match = s.match(/\(([^)]+)\)/);
              if (match) qualities.push(match[1]);
          } else if (s === baseItem) {
              // Backward compatibility
              qualities.push('Base'); 
          }
      });
      return qualities;
  };

  const handleBaseClick = (opt: string) => {
      if (isCollection(opt)) {
          setActivePopup(activePopup === opt ? null : opt);
      } else {
          onToggle(opt);
      }
  };

  const handleQualityToggle = (baseItem: string, quality: string) => {
      const fullString = `${baseItem}(${quality})`;
      onToggle(fullString);
  };

  return (
    <div className="relative">
        {isAutoFilled && <div className="absolute -top-7 right-0 text-[9px] text-accent-gold flex items-center gap-1"><EyeIcon className="w-3 h-3"/> {aiLabel}</div>}
        <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => {
            const isSpecial = isCollection(opt);
            const myQualities = isSpecial ? getSelectedQualities(opt) : [];
            const isActive = isSpecial ? myQualities.length > 0 : selected.includes(opt);
            
            const isRare = opt.includes('S') || opt.includes('红') || opt.includes('极品');
            const isHot = DELTA_HOT_ITEMS.some(hot => opt.includes(hot)); 
            
            let btnClass = "bg-void-800 border-void-700 text-gray-400 hover:border-gray-500 hover:text-white";
            
            if (isActive) {
                if (isHot) btnClass = "bg-red-500/20 border-red-500 text-white shadow-neon-purple animate-pulse";
                else if (isRare || (myQualities.length > 0 && myQualities.some(q => q.includes('S')))) btnClass = "bg-secondary/20 border-secondary text-white shadow-neon-purple";
                else btnClass = "bg-primary/10 border-primary text-primary shadow-neon";
            } else if (isHot) {
                btnClass = "bg-void-800 border-red-900/50 text-red-400 hover:border-red-500 hover:text-white";
            }

            return (
                <div key={opt} className="relative group">
                    <button type="button" onClick={() => handleBaseClick(opt)} className={`text-[11px] font-bold px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${btnClass}`}>
                        {isActive && <div className={`w-1.5 h-1.5 rounded-full ${isRare || isHot ? 'bg-white' : 'bg-primary'}`}></div>}
                        {isHot && <FireIcon className="w-3 h-3 text-orange-500 animate-bounce" />}
                        {opt}
                        {myQualities.length > 0 && (
                            <span className="ml-1 text-[9px] bg-black/40 px-1 rounded border border-white/10 text-emerald-400">
                                {myQualities.map(q => q.replace('极品', '')).join(',')}
                            </span>
                        )}
                    </button>

                    {/* Quality Selection Popup */}
                    {activePopup === opt && (
                        <div className="absolute z-50 left-0 top-full mt-2 p-3 bg-void-900 border border-primary/30 rounded-xl shadow-2xl min-w-[200px] animate-scale-in">
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex justify-between items-center">
                                Select Quality
                                <button onClick={(e) => {e.stopPropagation(); setActivePopup(null);}}><XCircleIcon className="w-4 h-4 hover:text-white"/></button>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                {DELTA_QUALITIES.map(q => {
                                    const isQActive = myQualities.includes(q);
                                    const isS = q.includes('S');
                                    return (
                                        <button 
                                            key={q}
                                            type="button"
                                            onClick={() => handleQualityToggle(opt, q)}
                                            className={`text-xs text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${isQActive ? (isS ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-primary/20 text-primary border border-primary/30') : 'hover:bg-white/10 text-gray-400'}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isS && <StarIcon className="w-3 h-3 text-amber-400"/>}
                                                {q}
                                            </span>
                                            {isQActive && <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]"></div>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    {/* Backdrop to close */}
                    {activePopup === opt && (
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActivePopup(null)}></div>
                    )}
                </div>
            );
        })}
        </div>
    </div>
  );
};

const MatrixGrid = ({ options, value, onChange, autoFilledFields, labelParser }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {options.map((field: GameField) => {
       const val = value[field.key] || ''; 
       const isMax = val.includes('满级') || val.includes('Lv.10') || val.includes('全');
       const isAuto = autoFilledFields?.includes(field.key);
       const parsedLabel = labelParser(field.label).split('/')[0];
       return (
           <div key={field.key} className={`relative p-3 rounded-lg border transition-all duration-200 cursor-pointer group hover:border-primary/40 hover:bg-white/5 ${isMax ? 'bg-primary/10 border-primary/60 shadow-[0_0_10px_rgba(0,242,234,0.15)]' : 'bg-void-800 border-void-700'} ${isAuto ? 'ring-1 ring-accent-gold shadow-[0_0_10px_rgba(255,214,10,0.15)]' : ''}`}>
               <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 truncate group-hover:text-white transition-colors flex items-center justify-between">
                   {parsedLabel}
                   {isAuto && <SparklesIcon className="w-3 h-3 text-accent-gold animate-pulse"/>}
               </div>
               <select value={val} onChange={(e) => onChange(field.key, e.target.value)} className={`w-full bg-transparent text-xs font-mono font-bold outline-none appearance-none cursor-pointer ${isMax ? 'text-primary' : 'text-gray-300'}`}><option value="" className="bg-void-900">-</option>{field.options?.map(o => <option key={o} value={o} className="bg-void-900">{o}</option>)}</select>
               {isMax && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_5px_#00F2EA]"></div>}
           </div>
       )
    })}
  </div>
);

const InfoSectionContact = ({ t }: { t: any }) => (
  <div className="max-w-4xl mx-auto p-8 animate-fade-in text-center">
    <h2 className="text-3xl font-bold text-white mb-8 flex items-center justify-center gap-3"><ChatBubbleLeftRightIcon className="w-8 h-8 text-secondary"/> {t('contactUs')}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="bg-void-900 border border-white/5 p-8 rounded-2xl hover:border-primary/30 transition-all">
          <div className="text-gray-400 text-sm mb-2">{t('business')}</div>
          <div className="text-2xl font-bold text-white">business@pz-nebula.com</div>
       </div>
       <div className="bg-void-900 border border-white/5 p-8 rounded-2xl hover:border-secondary/30 transition-all">
          <div className="text-gray-400 text-sm mb-2">{t('techSupport')}</div>
          <div className="text-2xl font-bold text-white">dev@pz-nebula.com</div>
       </div>
    </div>
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'app' | 'updates' | 'contact' | 'about'>('login');
  
  // Login State
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [uName, setUName] = useState('');
  const [uPass, setUPass] = useState('');
  const [authMsg, setAuthMsg] = useState('');

  // App State
  const [loading, setLoading] = useState(false);
  const [scanningImage, setScanningImage] = useState(false);
  const [result, setResult] = useState<ValuationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Data State
  const [allGameConfigs, setAllGameConfigs] = useState<GameConfigMap>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [baseData, setBaseData] = useState({ gameName: "三角洲行动", platform: "PC", server: "官方服务器", description: '' });
  const [dynamicData, setDynamicData] = useState<Record<string, string>>({});
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const certificateRef = useRef<HTMLDivElement>(null);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- I18N STATE ---
  const [lang, setLang] = useState<Language>('cn');
  
  // Helper to get translated string
  const t = (key: keyof typeof translations['cn']) => {
    return (translations[lang] as any)[key] || key;
  };

  // Helper to split "CN / EN" strings from database
  const getLabel = (str: string) => {
    if (!str) return "";
    const parts = str.split('/');
    if (lang === 'cn') return parts[0].trim();
    // Return second part if exists, else first part
    return (parts.length > 1 ? parts[1] : parts[0]).trim();
  };

  const toggleLang = () => {
    setLang(prev => prev === 'cn' ? 'en' : 'cn');
  };

  useEffect(() => { 
    setAllGameConfigs(dataService.getGameConfigs());
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setView('app');
    }
  }, []);

  const availableGames = useMemo(() => Object.keys(allGameConfigs), [allGameConfigs]);
  
  useEffect(() => {
    if (availableGames.length > 0 && !availableGames.includes(baseData.gameName)) setBaseData(prev => ({ ...prev, gameName: availableGames[0] }));
  }, [availableGames]);
  useEffect(() => {
    setDynamicData({}); setResult(null); setAutoFilledFields([]); setPreviewImage(null);
    const firstGroup = allGameConfigs[baseData.gameName]?.[0]?.group || '基础信息';
    setActiveGroup(firstGroup);
  }, [baseData.gameName, allGameConfigs]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'login') {
      const res = authService.login(uName, uPass);
      if (res.success && res.user) {
        setUser(res.user);
        setView('app');
        setAuthMsg('');
      } else {
        setAuthMsg(t('loginFailed'));
      }
    } else {
      const res = authService.register(uName, uPass);
      if (res.success) {
        setLoginMode('login');
        setAuthMsg(t('regSuccess'));
      } else {
        setAuthMsg(res.message || 'Registration failed');
      }
    }
  };

  const handleLogout = () => { authService.logout(); setUser(null); setView('login'); };
  const handleSoftReset = () => { setDynamicData({}); setResult(null); setError(null); setAutoFilledFields([]); setPreviewImage(null); const firstGroup = allGameConfigs[baseData.gameName]?.[0]?.group || '基础信息'; setActiveGroup(firstGroup); };
  const handleSystemRefresh = () => { setAllGameConfigs(dataService.getGameConfigs()); setBaseData(prev => ({...prev})); };
  const handleDynamicChange = (key: string, val: string) => setDynamicData(prev => ({ ...prev, [key]: val }));
  const toggleMultiSelect = (key: string, option: string) => { setDynamicData(prev => { const currentList = prev[key] ? prev[key].split(',') : []; let newList = currentList.includes(option) ? currentList.filter(i => i !== option) : [...currentList, option]; return { ...prev, [key]: newList.join(',') }; }); };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (checkSensitiveWords(dynamicData)) {
        setError("SECURITY_ALERT: Input contains restricted keywords. Request blocked.");
        return;
    }
    setLoading(true); setError(null); setResult(null); setActiveGroup(null);
    try {
      const data = await evaluateGameAsset({ ...baseData, ...dynamicData });
      setResult(data);
      dataService.incrementValuationCount();
      dataService.logValuationAction(user, baseData.gameName, data.pricingModel.finalPriceLow);
    } catch (err: any) { 
        console.error(err);
        if (err.message && (err.message.includes("API_QUOTA_EXCEEDED") || err.message.includes("429"))) {
            setError("SERVER_BUSY: API Quota Exceeded (429). Please wait 30s and try again.");
        } else {
            setError("UPLINK_FAILED: Neural net connection unstable (SiliconFlow). Retrying recommended."); 
        }
    } finally { setLoading(false); }
  };

  // --- INTELLIGENT MATCHING LOGIC ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      setScanningImage(true);
      setAutoFilledFields([]); 
      
      reader.onloadend = async () => {
          const base64 = reader.result as string;
          setPreviewImage(base64);
          try {
              const extracted: any = await parseMarketImage(base64);
              if (extracted) {
                  const newData = { ...dynamicData };
                  const newAutoFilled: string[] = [];
                  
                  // 1. Direct Field Mapping (Exact Matches)
                  if (extracted.rank_level) { newData['rank_level'] = extracted.rank_level; newAutoFilled.push('rank_level'); }
                  if (extracted.asset_total_m) { newData['asset_total_m'] = extracted.asset_total_m.toString(); newAutoFilled.push('asset_total_m'); }
                  if (extracted.currency_havoc_w) { newData['currency_havoc_w'] = extracted.currency_havoc_w.toString(); newAutoFilled.push('currency_havoc_w'); }
                  if (extracted.safe_box) { newData['safe_box'] = extracted.safe_box; newAutoFilled.push('safe_box'); }

                  // 2. Fuzzy Matching for Multi-Selects using Raw Content
                  const gameFields = allGameConfigs[baseData.gameName] || [];
                  const rawLower = (extracted.raw_content || "").toLowerCase();

                  gameFields.forEach(field => {
                      if (field.type === 'multiselect' && field.options) {
                          const matched: string[] = [];
                          field.options.forEach(opt => {
                              const cleanOpt = opt.replace(/[（(].*?[)）]/g, '').trim();
                              const parts = cleanOpt.split(/[-–]/);
                              let keywords: string[] = [];
                              
                              if (parts.length > 1) {
                                  const skinPart = parts[parts.length - 1];
                                  const skinBase = skinPart.replace(/s\d+/i, '').trim();
                                  if (skinBase.length >= 2) keywords.push(skinBase);
                                  const weaponPart = parts[0].replace(/突击步枪|冲锋枪|战斗步枪|近战武器|挂饰|skin/g, '').trim();
                                  if (weaponPart.length >= 2) keywords.push(weaponPart);
                              } else {
                                  const base = cleanOpt.replace(/捆绑包|突击步枪|冲锋枪|战斗步枪|近战武器|挂饰|skin/g, '').trim();
                                  if (base.length >= 2) keywords.push(base);
                              }
                              
                              if (keywords.length > 0) {
                                  const distinctKeywords = keywords.filter(k => k.length >= 2);
                                  if (distinctKeywords.length > 0) {
                                      if (parts.length > 1) {
                                          const skinKey = keywords[0].toLowerCase();
                                          if (rawLower.includes(skinKey)) matched.push(opt);
                                      } else {
                                          if (rawLower.includes(distinctKeywords[0].toLowerCase())) matched.push(opt);
                                      }
                                  }
                              }
                          });

                          if (matched.length > 0) {
                              const existing = newData[field.key] ? newData[field.key].split(',') : [];
                              const merged = Array.from(new Set([...existing, ...matched]));
                              newData[field.key] = merged.join(',');
                              if (!newAutoFilled.includes(field.key)) newAutoFilled.push(field.key);
                          }
                      }
                  });

                  setDynamicData(newData);
                  setAutoFilledFields(newAutoFilled);
                  if (newAutoFilled.length > 0) setActiveGroup("核心资产");
              }
          } catch(err: any) {
              console.error(err);
              if (err.message && (err.message.includes("API_QUOTA_EXCEEDED") || err.message.includes("429"))) {
                  setError("Vision Analysis Failed: Server Busy (429). Please wait.");
              } else {
                  setError("Vision Analysis Failed. Please upload a clearer image.");
              }
          } finally {
              setScanningImage(false);
          }
      };
      reader.readAsDataURL(file);
  };

  const handleDownloadPoster = async () => {
      if (!certificateRef.current) return;
      setGeneratingPoster(true);
      try {
        const canvas = await html2canvas(certificateRef.current, { backgroundColor: '#0B0C15', scale: 2, width: 750, windowWidth: 750 });
        const link = document.createElement('a');
        link.download = `NEBULA_VALUATION_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } finally { setGeneratingPoster(false); }
  };

  const fields = allGameConfigs[baseData.gameName] || [];
  const groupedFields = useMemo(() => {
    return fields.reduce((acc, field) => {
      const groupName = field.group || '通用参数';
      let group = acc.find(g => g.name === groupName);
      if (!group) { group = { name: groupName, fields: [] }; acc.push(group); }
      group.fields.push(field); return acc;
    }, [] as { name: string, fields: GameField[] }[]);
  }, [fields]);
  const isGroupCompleted = (groupFields: GameField[]) => groupFields.some(f => !!dynamicData[f.key]);

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <JSONLD />
        <div className="absolute inset-0 bg-nebula-gradient"></div>
        {/* Lang Toggle for Login */}
        <div className="absolute top-6 right-6 z-20">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:border-primary/50 transition-all">
                 <GlobeAltIcon className="w-4 h-4" />
                 {lang === 'cn' ? 'English' : '中文'}
             </button>
        </div>
        <div className="relative z-10 w-full max-w-md p-8">
           <div className="glass-panel p-10 rounded-2xl border-primary/20 shadow-neon">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-xl mx-auto flex items-center justify-center text-black font-bold text-2xl shadow-neon mb-4">PZ</div>
                 <h1 className="text-2xl font-bold text-white tracking-widest">{t('authTitle')}</h1>
                 <p className="text-gray-400 text-xs mt-2 font-mono">{t('authSubtitle')}</p>
              </div>
              <form onSubmit={handleAuth} className="space-y-6">
                 <div><label className="block text-xs font-bold text-primary mb-2 uppercase">{t('identity')}</label><input type="text" value={uName} onChange={e=>setUName(e.target.value)} className="w-full bg-void-900 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-primary transition-all" placeholder="Username"/></div>
                 <div><label className="block text-xs font-bold text-primary mb-2 uppercase">{t('passcode')}</label><input type="password" value={uPass} onChange={e=>setUPass(e.target.value)} className="w-full bg-void-900 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-primary transition-all" placeholder="••••••••"/></div>
                 {authMsg && <div className="text-red-400 text-xs font-bold text-center">{authMsg}</div>}
                 <button type="submit" className="w-full py-4 bg-primary text-black font-bold rounded-lg hover:bg-cyan-300 transition-all shadow-neon mt-4">{loginMode === 'login' ? t('loginBtn') : t('registerBtn')}</button>
              </form>
              <div className="mt-6 text-center"><button onClick={()=>{setLoginMode(loginMode==='login'?'register':'login');setAuthMsg('')}} className="text-gray-500 text-xs hover:text-white transition-colors underline">{loginMode === 'login' ? t('createId') : t('returnLogin')}</button><div className="mt-4 text-[10px] text-gray-600">Default Admin: admin / 123</div></div>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-40">
      <JSONLD />
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0B0C15]/80 backdrop-blur-xl">
         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('app')}>
               <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-black flex items-center justify-center font-bold font-tech text-xl shadow-neon">PZ</div>
               <div><h1 className="text-white font-sans font-bold text-lg">{t('appTitle')}</h1><p className="text-[10px] text-primary font-mono tracking-widest">Triple-Track Engine</p></div>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-400">
               <button onClick={()=>setView('app')} className={`hover:text-white transition-colors ${view==='app'?'text-white':''}`}>{t('navValuation')}</button>
               <button onClick={()=>setView('updates')} className={`hover:text-white transition-colors ${view==='updates'?'text-white':''}`}>{t('navUpdates')}</button>
               <button onClick={()=>setView('contact')} className={`hover:text-white transition-colors ${view==='contact'?'text-white':''}`}>{t('navContact')}</button>
            </div>

            <div className="flex items-center gap-4">
               {/* Language Toggle */}
               <button onClick={toggleLang} className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 hover:text-white hover:border-primary/50 transition-all">
                  <GlobeAltIcon className="w-3 h-3" />
                  {lang === 'cn' ? 'CN' : 'EN'}
               </button>

               <button onClick={() => setShowAdmin(true)} className="flex items-center gap-2 p-2 text-primary bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20">
                   <ChartBarSquareIcon className="w-5 h-5"/>
                   <span className="text-xs font-bold hidden md:inline">{t('navDashboard')}</span>
               </button>
               <div className="text-xs text-right mr-2 hidden md:block">
                   <div className="text-white font-bold">{user?.username}</div>
                   <div className="text-gray-500 uppercase text-[10px]">{user?.role}</div>
               </div>
               <button onClick={handleLogout} className="text-xs text-red-500 font-bold border border-red-900/50 px-3 py-1.5 rounded hover:bg-red-900/20">{t('logout')}</button>
            </div>
         </div>
      </nav>

      {showAdmin && <AdminDashboard user={user} onClose={() => setShowAdmin(false)} onUpdate={handleSystemRefresh} lang={lang} t={t} />}

      <main className="pt-28">
         {view === 'updates' && <InfoSectionUpdates t={t} />}
         {view === 'contact' && <InfoSectionContact t={t} />}
         {view === 'about' && <InfoSectionAbout t={t} />}
         
         {view === 'app' && (
           <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
             <div className="lg:col-span-7 space-y-8 animate-fade-in">
                <div className="glass-panel p-2 rounded-xl flex flex-wrap gap-2">
                   {availableGames.map(game => (
                      <button key={game} onClick={() => setBaseData(prev => ({ ...prev, gameName: game }))} className={`relative px-6 py-3 rounded-lg font-bold text-sm flex-1 ${baseData.gameName === game ? 'bg-gradient-to-r from-primary to-cyan-300 text-black shadow-neon' : 'text-gray-400 hover:bg-white/5'}`}>{game}</button>
                   ))}
                </div>

                <div className="glass-panel p-6 rounded-xl border-dashed border-primary/30 bg-primary/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {previewImage ? (
                            <div className="w-16 h-16 rounded-lg border border-white/20 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <img src={previewImage} alt="Upload" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowPathIcon className="w-5 h-5 text-white"/>
                                </div>
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <PhotoIcon className="w-8 h-8 text-white/20"/>
                            </div>
                        )}
                        <div>
                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                {scanningImage && <ArrowPathIcon className="w-4 h-4 animate-spin text-primary"/>}
                                {t('visionTitle')}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                {scanningImage ? t('visionProcessing') : autoFilledFields.length > 0 ? (t('visionIdentified') as any)(autoFilledFields.length) : t('visionDesc')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={scanningImage} className={`px-4 py-2 text-xs font-bold rounded-lg shadow-neon flex items-center gap-2 transition-all ${scanningImage ? 'bg-void-800 text-gray-500' : 'bg-primary text-black hover:bg-cyan-300'}`}>
                            <CameraIcon className="w-4 h-4"/>
                            {previewImage ? t('reUploadBtn') : t('uploadBtn')}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                   {error && <div className={`p-4 rounded-lg text-xs font-bold animate-fade-in flex items-center gap-2 ${error.includes("429") ? "bg-amber-900/20 border border-amber-500/50 text-amber-400" : "bg-red-900/20 border border-red-500/50 text-red-400"}`}>
                       {error.includes("429") ? <ClockIcon className="w-5 h-5"/> : <ShieldExclamationIcon className="w-5 h-5"/>} 
                       {error}
                   </div>}
                   {groupedFields.map((group, idx) => (
                      <QuantumPanel key={group.name} title={group.name} enTitle={t('module')} icon={CubeIcon} isOpen={activeGroup === group.name} onToggle={() => setActiveGroup(activeGroup === group.name ? null : group.name)} isCompleted={isGroupCompleted(group.fields)}>
                         {group.name.includes('特勤') && group.fields.length >= 5 ? <MatrixGrid options={group.fields} value={dynamicData} onChange={handleDynamicChange} autoFilledFields={autoFilledFields} labelParser={getLabel} /> : 
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {group.fields.map(field => {
                                const isAuto = autoFilledFields.includes(field.key);
                                const label = getLabel(field.label);
                                return field.type === 'multiselect' ? 
                                    <div key={field.key} className="col-span-full"><label className="text-xs font-bold text-gray-400 mb-3 block">{label}</label><TechTags options={field.options} value={dynamicData[field.key]} onToggle={(opt: string) => toggleMultiSelect(field.key, opt)} isAutoFilled={isAuto} aiLabel={t('aiSelected')} /></div> : 
                                field.type === 'select' ? 
                                    <ClearSelect key={field.key} label={label} value={dynamicData[field.key] || ''} onChange={(e: any) => handleDynamicChange(field.key, e.target.value)} options={field.options} isAutoFilled={isAuto} aiLabel={t('aiSelected')} /> : 
                                    <ClearInput key={field.key} label={label} value={dynamicData[field.key] || ''} onChange={(e: any) => handleDynamicChange(field.key, e.target.value)} placeholder={field.placeholder} type={field.type} isAutoFilled={isAuto} aiLabel={t('aiSelected')} />
                            })}
                         </div>}
                         <div className="mt-8 flex justify-end"><button type="button" onClick={() => setActiveGroup(idx + 1 < groupedFields.length ? groupedFields[idx + 1].name : null)} className="text-xs font-bold text-primary border border-primary/30 px-5 py-2.5 rounded-lg hover:shadow-neon">{t('next')} <ChevronDownIcon className="w-3 h-3 inline" /></button></div>
                      </QuantumPanel>
                   ))}
                   <div className="flex items-center justify-between pt-8 pb-12">
                      <button type="button" onClick={handleSoftReset} className="text-xs font-bold text-gray-500 hover:text-red-400 px-4 py-2 flex items-center gap-2"><TrashIcon className="w-4 h-4" /> {t('reset')}</button>
                      <button type="submit" disabled={loading} className="relative px-12 py-5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-black text-lg shadow-neon hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">{loading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <BoltIcon className="w-6 h-6" />}{loading ? t('calculating') : t('initiate')}</button>
                   </div>
                </form>
             </div>
             
             <div className="lg:col-span-5 relative">
                <div className="sticky top-28">
                   {loading && (
                      <div className="glass-panel h-[500px] rounded-2xl flex flex-col items-center justify-center relative bg-void-900/80 backdrop-blur-xl border border-primary/20 shadow-neon p-6">
                         <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                            <CpuChipIcon className="w-16 h-16 text-primary animate-pulse" />
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                         </div>
                         <h2 className="text-2xl font-bold text-white tracking-widest font-tech animate-pulse">NEURAL PROCESSING</h2>
                         <p className="text-xs text-primary/60 font-mono tracking-wider mt-1 mb-4">{t('calculating')}</p>
                         <LoadingLogs />
                         <AppCountdown />
                      </div>
                   )}

                   {!result && !loading && (
                      <div className="glass-panel h-[500px] rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-void-900/50">
                         <CubeIcon className="w-20 h-20 text-gray-600 mb-6 animate-float" />
                         <h2 className="text-2xl font-bold text-white mb-2">{t('systemReady')}</h2>
                         <p className="text-gray-500 text-sm">{t('systemReadyDesc')}</p>
                      </div>
                   )}

                   {result && (
                      <div className="glass-panel rounded-2xl overflow-hidden border-primary/40 shadow-card animate-fade-in bg-[#13141F]">
                         <div className="p-8 text-center bg-gradient-to-b from-primary/10 to-transparent relative">
                            <div className="inline-flex gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold mb-4 shadow-neon"><SparklesIcon className="w-3 h-3" /> {t('tripleTrack')}</div>
                            
                            {result.safetyScore < 50 && (
                                <div className="mb-4 bg-red-900/30 border border-red-500/50 rounded-lg p-3 flex items-start gap-3 animate-pulse">
                                    <ShieldExclamationIcon className="w-6 h-6 text-red-500 shrink-0"/>
                                    <div className="text-left">
                                        <div className="text-red-400 font-bold text-xs uppercase">{t('riskAlert')}</div>
                                        <div className="text-[10px] text-gray-400">{t('riskDesc')}</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center justify-center my-2">
                                <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">{t('estimatedValue')}</div>
                                <div className="flex items-start justify-center gap-1 mt-2">
                                  <span className="text-2xl text-gray-500 font-bold mt-2">¥</span>
                                  <span className="text-7xl font-black text-white font-tech tracking-tighter drop-shadow-lg">{result.pricingModel.finalPriceLow}</span>
                               </div>
                               
                               {/* 6. Value Anchor / 价值锚点 Visualization */}
                               <div className="w-full h-1.5 bg-void-950 rounded-full mt-2 mb-1 relative overflow-hidden">
                                   <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-transparent via-primary to-transparent w-full opacity-30"></div>
                                   <div className="absolute top-0 bottom-0 bg-primary h-full rounded-full shadow-neon" style={{ left: '20%', right: '20%' }}></div>
                               </div>
                               <div className="flex justify-between w-full px-8 text-[10px] text-gray-500 font-mono mb-4">
                                   <span>LOW: ¥{result.pricingModel.finalPriceLow}</span>
                                   <span>HIGH: ¥{result.pricingModel.finalPriceHigh}</span>
                               </div>
                            </div>

                            <div className="bg-void-950/80 border border-accent-gold/30 rounded-xl p-4 mb-6 shadow-lg relative overflow-hidden group">
                               <div className="absolute inset-0 bg-accent-gold/5 group-hover:bg-accent-gold/10 transition-colors"></div>
                               <div className="relative z-10">
                                  <div className="text-accent-gold text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                                     <ScaleIcon className="w-3 h-3"/> {t('recyclingPrice')}
                                  </div>
                                  <div className="text-3xl font-black text-white font-mono">¥{result.recyclingPrice}</div>
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-2 border-t border-white/10 divide-x divide-white/10 bg-black/20">
                                <div className="p-4 text-center"><div className="text-[10px] text-gray-500 uppercase">{t('liquidity')}</div><div className="text-2xl font-bold font-tech text-white">{result.liquidityScore}/10</div></div>
                                <div className="p-4 text-center"><div className="text-[10px] text-gray-500 uppercase">{t('safety')}</div><div className={`text-2xl font-bold font-tech ${result.safetyScore < 60 ? 'text-red-500' : 'text-white'}`}>{result.safetyScore}/100</div></div>
                             </div>

                             <div className="p-6 bg-black/40 border-t border-white/10 flex gap-4">
                                <button onClick={() => navigator.clipboard.writeText(result.agentScript)} className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10">{t('copyScript')}</button>
                                <button onClick={handleDownloadPoster} disabled={generatingPoster} className="flex-1 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary border border-primary/30 flex items-center justify-center gap-2"><CameraIcon className="w-4 h-4"/> {t('exportCert')}</button>
                             </div>
                         </div>
                      </div>
                   )}
                </div>
             </div>
           </div>
         )}
      </main>
      
      {result && (
         <div ref={certificateRef} className="fixed top-0 left-[-9999px] w-[750px] min-h-[1334px] bg-[#0B0C15] text-white p-16 flex flex-col font-sans border-[40px] border-[#13141F]">
            <div className="absolute inset-0 bg-mesh opacity-30"></div>
            <div className="relative z-10 flex justify-between items-center mb-16 border-b border-white/10 pb-8">
               <div><h1 className="text-6xl font-tech font-bold tracking-wider">NEBULA</h1><p className="text-primary font-mono text-xl mt-4 tracking-[0.4em] uppercase">Triple-Track Valuation</p></div>
               <div className="w-24 h-24 border-2 border-primary/50 rounded-2xl flex items-center justify-center shadow-neon bg-primary/10 rotate-45"><span className="text-4xl font-bold text-primary -rotate-45">S+</span></div>
            </div>
            <div className="relative z-10 flex-1">
               <div className="text-center py-12 bg-[#13141F] border border-white/10 rounded-2xl mb-12 shadow-card">
                  <div className="text-gray-400 font-bold text-xl uppercase tracking-widest mb-4">Final Market Estimate</div>
                  <div className="flex items-center justify-center gap-4"><span className="text-5xl text-gray-600 font-bold">¥</span><span className="text-[120px] leading-none font-tech font-bold text-white">{result.pricingModel.finalPriceLow}</span></div>
               </div>

               <div className="grid grid-cols-2 gap-8 mb-12">
                   <div className="bg-void-950 border border-accent-gold rounded-xl p-8 shadow-lg">
                      <div className="text-accent-gold text-xl font-bold uppercase mb-1">{t('recyclingPrice')}</div>
                      <div className="text-5xl font-mono font-bold text-white">¥{result.recyclingPrice}</div>
                   </div>
                   <div className="bg-void-950 border border-white/10 rounded-xl p-8 shadow-lg flex items-center justify-center flex-col">
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://pz-nebula.com/verify/${Date.now()}`} className="w-24 h-24 opacity-80 rounded" alt="Anti-Counterfeit QR"/>
                       <div className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">Scan to Verify</div>
                   </div>
               </div>
               
               {result.inputParams && (
                 <div className="mb-8 p-4 bg-void-900 border border-white/10 rounded-xl">
                    <div className="text-gray-500 text-sm uppercase font-bold mb-3">{t('assetProfile')}</div>
                    <div className="flex flex-wrap gap-3">
                       {Object.entries(result.inputParams)
                           .filter(([k,v]) => v && !['gameName','platform','server','description'].includes(k))
                           .slice(0, 8)
                           .map(([k,v]) => (
                              <span key={k} className="text-sm px-3 py-1 bg-white/5 rounded text-gray-300 border border-white/5">{v}</span>
                       ))}
                    </div>
                 </div>
               )}

               <div className="space-y-4 mb-12">
                  <div className="flex justify-between items-center p-6 bg-void-900 rounded-xl border-l-4 border-secondary"><span className="text-xl text-gray-400 font-bold">{t('rulePrice')}</span><span className="text-3xl font-mono text-white">¥{result.pricingModel.ruleBasedPrice}</span></div>
                  <div className="flex justify-between items-center p-6 bg-void-900 rounded-xl border-l-4 border-emerald-500"><span className="text-xl text-gray-400 font-bold">{t('aiPrice')}</span><span className="text-3xl font-mono text-emerald-400">¥{result.pricingModel.learnedMarketPrice}</span></div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}