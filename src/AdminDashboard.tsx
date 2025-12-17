
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameConfigMap, PriceRule, InternalReference, GameField, User, UserRole, PricingMatrix, MarketReport, RuleType, ValuationActionLog, TimeFrame, AILearningInsight } from './types';
import { dataService } from './services/dataService';
import { authService } from './services/authService';
import { bulkParseTradingData, processExcelData, generateLearningInsight } from './services/geminiService';
import * as XLSX from 'xlsx';
import { 
  XMarkIcon, PlusIcon, TrashIcon, CurrencyYenIcon, TableCellsIcon,
  Cog6ToothIcon, CheckCircleIcon, ExclamationTriangleIcon,
  ArrowPathIcon, RectangleStackIcon, AcademicCapIcon, 
  BoltIcon, HomeIcon, ChartBarIcon, PresentationChartLineIcon,
  UsersIcon, LockClosedIcon, ShieldCheckIcon, UserCircleIcon,
  BanknotesIcon, TagIcon, MagnifyingGlassIcon, CpuChipIcon, CalculatorIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, FireIcon, BeakerIcon,
  ClipboardDocumentCheckIcon, ChevronDownIcon, ChevronUpIcon,
  FaceSmileIcon, FaceFrownIcon, MinusCircleIcon, ScaleIcon,
  DocumentArrowUpIcon, FunnelIcon, ChartPieIcon, CalendarDaysIcon, ClockIcon, MapPinIcon,
  PencilIcon, CommandLineIcon, LightBulbIcon
} from '@heroicons/react/24/outline';

const TerminalConsole = ({ logs, progress, isRunning, total, current }: any) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [logs]);

    return (
        <div className="bg-black border border-white/20 rounded-xl overflow-hidden font-mono text-xs flex flex-col h-96 shadow-2xl relative">
            {/* Header */}
            <div className="bg-void-900 border-b border-white/10 px-4 py-2 flex justify-between items-center">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-primary font-bold tracking-widest text-[10px]">DEEP_LEARNING_PROTOCOL_V3.1</div>
            </div>
            
            {/* Logs */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-1 text-gray-300">
                {logs.map((log: string, i: number) => {
                    const isSystem = log.startsWith("[SYSTEM]");
                    const isSuccess = log.includes("Success") || log.includes("Saved");
                    const isError = log.includes("Error") || log.includes("Failed");
                    return (
                        <div key={i} className={`whitespace-pre-wrap ${isSystem ? 'text-primary' : isSuccess ? 'text-emerald-400' : isError ? 'text-red-400' : 'text-gray-400'}`}>
                            <span className="opacity-50 select-none mr-2">$</span>
                            {log}
                        </div>
                    );
                })}
                {isRunning && <div className="animate-pulse text-primary">_</div>}
            </div>

            {/* Progress Bar */}
            <div className="bg-void-900 border-t border-white/10 p-2">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1 uppercase font-bold">
                    <span>Batch Processing</span>
                    <span>{current} / {total}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300 shadow-neon" style={{width: `${progress}%`}}></div>
                </div>
            </div>
        </div>
    );
};

// --- MISSING COMPONENTS ---

const ToastContainer = ({ toasts }: { toasts: any[] }) => (
  <div className="fixed top-4 right-4 z-[110] flex flex-col gap-2">
    {toasts.map(t => (
      <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-xs font-bold flex items-center gap-2 animate-fade-in-right ${t.type === 'success' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
        {t.type === 'success' ? <CheckCircleIcon className="w-5 h-5"/> : <ExclamationTriangleIcon className="w-5 h-5"/>}
        {t.message}
      </div>
    ))}
  </div>
);

const UserModal = ({ isOpen, onClose, onSubmit, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-void-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-500 hover:text-white"/></button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded text-xs font-bold text-gray-400 hover:bg-white/5">CANCEL</button>
          <button onClick={onSubmit} className="px-6 py-2 bg-primary text-black rounded text-xs font-bold hover:bg-cyan-300">CONFIRM</button>
        </div>
      </div>
    </div>
  );
};

const DataEditorModal = ({ isOpen, onClose, onSave, desc, setDesc, price, setPrice }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-void-900 border border-white/10 rounded-xl w-full max-w-2xl p-6 shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><PencilIcon className="w-5 h-5 text-primary"/> Edit Record</h3>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-500 hover:text-white"/></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Price (CNY)</label>
            <input type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value))} className="w-full bg-void-950 border border-white/10 rounded p-3 text-emerald-400 font-mono font-bold text-lg outline-none focus:border-emerald-500/50"/>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full h-64 bg-void-950 border border-white/10 rounded p-3 text-gray-300 text-xs font-mono outline-none focus:border-primary/30 resize-none leading-relaxed"/>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/5">
           <button onClick={onClose} className="px-4 py-2 rounded text-xs font-bold text-gray-400 hover:bg-white/5">CANCEL</button>
           <button onClick={onSave} className="px-6 py-2 bg-emerald-500 text-black rounded text-xs font-bold hover:bg-emerald-400 flex items-center gap-2"><CheckCircleIcon className="w-4 h-4"/> SAVE CHANGES</button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, icon: Icon, colorClass }: any) => (
  <div className="bg-void-900 border border-white/5 p-6 rounded-xl relative overflow-hidden group hover:border-white/10 transition-all">
      <div className={`absolute top-4 right-4 p-2 rounded-lg bg-white/5 ${colorClass} opacity-50 group-hover:opacity-100 transition-opacity`}>
          <Icon className="w-6 h-6" />
      </div>
      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">{title}</div>
      <div className="text-3xl font-black text-white font-tech tracking-tight">{value}</div>
      <div className="text-[10px] text-gray-600 mt-1 font-mono">{sub}</div>
  </div>
);

const LiquidityHeatmap = ({ logs }: { logs: any[] }) => {
    // Simple mock visualization of activity over 24h
    const hours = Array(24).fill(0);
    logs.forEach(l => {
        const h = new Date(l.timestamp).getHours();
        hours[h]++;
    });
    const max = Math.max(...hours, 1);
    
    return (
        <div className="bg-void-900 border border-white/10 rounded-xl p-6 overflow-x-auto">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><FireIcon className="w-4 h-4 text-orange-500"/> 24H Liquidity Heatmap</h4>
            <div className="flex items-end gap-1 h-24 min-w-[600px]">
                {hours.map((count, h) => (
                    <div key={h} className="flex-1 flex flex-col items-center gap-1 group">
                        <div 
                            className="w-full bg-orange-500/20 hover:bg-orange-500 rounded-sm transition-all relative"
                            style={{ height: `${Math.max(10, (count/max)*100)}%` }}
                        >
                             <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                                {h}:00 - {count} reqs
                             </div>
                        </div>
                        <span className="text-[9px] text-gray-600">{h}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CollapsiblePanel = ({ title, children, isOpen, onToggle, icon: Icon }: any) => (
    <div className={`bg-void-900 border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/30 shadow-neon-blue' : 'border-white/5'}`}>
        <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`font-bold text-sm ${isOpen ? 'text-white' : 'text-gray-400'}`}>{title}</span>
            </div>
            {isOpen ? <ChevronUpIcon className="w-4 h-4 text-primary" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
        </button>
        {isOpen && <div className="p-4 border-t border-white/5 animate-fade-in-down">{children}</div>}
    </div>
);

const VirtualTable = ({ items, onEdit, onDelete }: any) => {
    // Simplified list rendering for performance (limiting to last 200 for viewing)
    const displayItems = items.slice(0, 200); 
    
    return (
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {displayItems.map((item: any) => (
                <div key={item.id} className="flex items-center px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors group text-xs text-gray-300">
                    <div className="w-24 font-mono text-gray-500">{item.date?.split('T')[0]}</div>
                    <div className="w-24 font-mono text-emerald-400 font-bold">¥{item.price}</div>
                    <div className="flex-1 truncate pr-4" title={item.description}>{item.description}</div>
                    <div className="w-20 text-right opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                        <button onClick={() => onEdit(item)} className="p-1 text-primary hover:bg-primary/10 rounded"><PencilIcon className="w-4 h-4"/></button>
                        <button onClick={() => onDelete(item.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                </div>
            ))}
            {items.length > 200 && (
                <div className="p-4 text-center text-xs text-gray-500 italic">
                    Showing first 200 of {items.length} records. Filter to see specific items.
                </div>
            )}
        </div>
    );
};

// --- MAIN DASHBOARD ---

export default function AdminDashboard({ onClose, onUpdate, user }: any) {
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'home' | 'config' | 'matrix' | 'rules' | 'learning' | 'users'>('home');
  const [selectedGame, setSelectedGame] = useState<string>('三角洲行动');
  const [toasts, setToasts] = useState<any[]>([]);
  
  // Data State
  const [configs, setConfigs] = useState<GameConfigMap>({});
  const [matrix, setMatrix] = useState<PricingMatrix | null>(null);
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [latestReport, setLatestReport] = useState<MarketReport | null>(null);
  const [listingRefs, setListingRefs] = useState<InternalReference[]>([]);
  const [soldRefs, setSoldRefs] = useState<InternalReference[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [actionLogs, setActionLogs] = useState<ValuationActionLog[]>([]);
  const [insights, setInsights] = useState<AILearningInsight[]>([]);
  
  // Metrics & Analysis State
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
  const [trendData, setTrendData] = useState<{label: string, value: number, count: number}[]>([]);
  const [todayValuationCount, setTodayValuationCount] = useState(0);

  // Learning State (Consolidated)
  const [learnType, setLearnType] = useState<'listing' | 'sold'>('listing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawPaste, setRawPaste] = useState('');
  const [excelInputRef] = useState(useRef<HTMLInputElement>(null));
  
  // Terminal State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [processProgress, setProcessProgress] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [newlyLearnedItems, setNewlyLearnedItems] = useState<InternalReference[]>([]); // Temp store for insights

  // Data Editing State
  const [editingItem, setEditingItem] = useState<InternalReference | null>(null);
  const [editFormDesc, setEditFormDesc] = useState('');
  const [editFormPrice, setEditFormPrice] = useState<number>(0);
  
  // Config & Rule State
  const [hasUnsavedRules, setHasUnsavedRules] = useState(false);
  const [matrixExpanded, setMatrixExpanded] = useState<Record<string, boolean>>({
      'assets': true,
      'appearance': false,
      'infra': false
  });
  
  // User Management UI
  const [showAddUser, setShowAddUser] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('user');

  useEffect(() => { refreshData(); }, [selectedGame]);

  // TREND ANALYSIS EFFECT
  useEffect(() => {
     if (!soldRefs.length) return;
     const now = new Date();
     const oneDay = 24 * 60 * 60 * 1000;
     let buckets: Record<string, { total: number, count: number }> = {};
     let daysToLook = 7;
     let format = (d: Date) => `${d.getMonth()+1}/${d.getDate()}`;

     if (timeFrame === 'day') { daysToLook = 1; format = (d) => `${d.getHours()}:00`; }
     if (timeFrame === 'month') { daysToLook = 30; }
     if (timeFrame === 'year') { daysToLook = 365; format = (d) => `${d.getFullYear()}/${d.getMonth()+1}`; }

     for (let i = daysToLook - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * oneDay);
        buckets[format(d)] = { total: 0, count: 0 };
     }

     const targetRefs = dataService.getRefsByTimeFrame(selectedGame, timeFrame, 'sold');
     targetRefs.forEach(ref => {
         const d = new Date(ref.date);
         const key = format(d);
         if (buckets[key]) {
             buckets[key].total += ref.price;
             buckets[key].count += 1;
         }
     });

     setTrendData(Object.entries(buckets).map(([k,v]) => ({
         label: k,
         value: v.count > 0 ? Math.round(v.total / v.count) : 0,
         count: v.count
     })));
  }, [timeFrame, soldRefs, selectedGame]);

  const refreshData = () => {
    setConfigs(dataService.getGameConfigs());
    setMatrix(dataService.getPricingMatrix(selectedGame));
    setRules(dataService.getPriceRules(selectedGame));
    setLatestReport(dataService.getLatestReport(selectedGame));
    setListingRefs(dataService.getInternalReferences(undefined, 'listing'));
    setSoldRefs(dataService.getInternalReferences(undefined, 'sold'));
    setUsers(authService.getUsers());
    setActionLogs(dataService.getActionLogs());
    setInsights(dataService.getAIInsights(selectedGame));
    
    const logs = dataService.getActionLogs();
    const today = new Date().toISOString().split('T')[0];
    const todaysLogs = logs.filter(l => l.timestamp.startsWith(today));
    setTodayValuationCount(todaysLogs.length);

    setHasUnsavedRules(false);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      setTerminalLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // --- HANDLERS ---
  const handleSaveAndReboot = () => {
     if (onUpdate) onUpdate();
     if (matrix) dataService.savePricingMatrix(matrix);
     if (rules.length > 0) {
       const allRules = dataService.getPriceRules().filter(r => r.gameName !== selectedGame);
       dataService.savePriceRules([...allRules, ...rules]);
     }
     showToast("System Config Updated / 系统配置已更新", "success");
     setTimeout(() => onClose(), 800);
  };

  // --- NEW BATCH PROCESSING LOGIC ---
  const handleStartLearning = async () => {
      if (!rawPaste.trim()) return;
      
      setIsProcessing(true);
      setTerminalLogs([]);
      setNewlyLearnedItems([]); // Reset for this session
      addLog("[SYSTEM] Initializing Batch Processing Protocol...");
      addLog(`[SYSTEM] Target: ${selectedGame} | Type: ${learnType.toUpperCase()}`);

      const lines = rawPaste.split('\n').filter(l => l.trim().length > 0);
      // Heuristic: roughly 8 lines per item, but let's send chunks of text
      const BATCH_LINE_COUNT = 50; 
      const batches = [];
      for (let i = 0; i < lines.length; i += BATCH_LINE_COUNT) {
          batches.push(lines.slice(i, i + BATCH_LINE_COUNT).join('\n'));
      }

      setTotalBatches(batches.length);
      setCurrentBatch(0);
      setProcessProgress(0);

      let allNewItems: InternalReference[] = [];

      for (let i = 0; i < batches.length; i++) {
          setCurrentBatch(i + 1);
          const batchText = batches[i];
          addLog(`Processing Batch ${i+1}/${batches.length} (${batchText.length} chars)...`);
          
          try {
              const items = await bulkParseTradingData(batchText, selectedGame, learnType);
              if (items.length > 0) {
                  // Instant Save
                  const targetRefs = learnType === 'listing' ? dataService.getInternalReferences(undefined, 'listing') : dataService.getInternalReferences(undefined, 'sold');
                  const updatedRefs = [...items, ...targetRefs];
                  dataService.saveInternalReferences(updatedRefs);
                  dataService.incrementLearningCount(items.length, learnType);
                  
                  // Log Details
                  items.forEach(item => {
                      addLog(`  > Extracted: ¥${item.price} - ${item.description.substring(0, 30)}...`);
                  });
                  addLog(`  ✔ Saved ${items.length} items to database.`);
                  allNewItems = [...allNewItems, ...items];
                  
                  // Update UI references immediately
                  if (learnType === 'listing') setListingRefs(updatedRefs); 
                  else setSoldRefs(updatedRefs);
              } else {
                  addLog(`  ⚠ Warning: No valid items found in batch ${i+1}.`);
              }
          } catch (e) {
              addLog(`  ❌ Error processing batch ${i+1}: ${e}`);
          }

          setProcessProgress(((i + 1) / batches.length) * 100);
          // Artificial delay for UI smoothness and rate limit protection
          await new Promise(r => setTimeout(r, 800)); 
      }

      setNewlyLearnedItems(allNewItems);
      addLog("[SYSTEM] Data ingestion complete.");
      
      // Generate AI Insight
      if (allNewItems.length > 0) {
          addLog("[AI] Generating Post-Learning Insights...");
          const insight = await generateLearningInsight(allNewItems, selectedGame, learnType);
          dataService.saveAIInsight(insight);
          setInsights(prev => [insight, ...prev]);
          addLog(`[AI] Insight Generated: ${insight.insight.substring(0, 50)}...`);
          addLog("[AI] Saved to Knowledge Base.");
      }

      addLog("[SYSTEM] Process Finished. Ready.");
      setIsProcessing(false);
      setRawPaste('');
  };
  
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setTerminalLogs([]);
    addLog(`[SYSTEM] Reading Excel File: ${file.name}...`);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        addLog(`[SYSTEM] Found ${data.length} rows. Mapping columns...`);
        
        const items = await processExcelData(data, selectedGame, learnType); 
        
        if (items.length > 0) {
           const targetRefs = learnType === 'listing' ? listingRefs : soldRefs;
           const newRefs = [...items, ...targetRefs];
           if (learnType === 'listing') setListingRefs(newRefs); else setSoldRefs(newRefs);
           dataService.saveInternalReferences(newRefs);
           dataService.incrementLearningCount(items.length, learnType);
           
           items.forEach(item => {
               addLog(`  > Mapped: ¥${item.price} - ${item.description.substring(0, 30)}...`);
           });
           
           addLog(`[SYSTEM] Successfully imported ${items.length} items.`);
           
           // Generate Insight for Excel too
           addLog("[AI] Analyzing Excel Data Patterns...");
           const insight = await generateLearningInsight(items, selectedGame, learnType);
           dataService.saveAIInsight(insight);
           setInsights(prev => [insight, ...prev]);
           addLog(`[AI] Insight Saved.`);
        } else {
            addLog(`[SYSTEM] Failed to map any valid data.`);
        }
      } catch (err) { 
          addLog(`[ERROR] Excel Processing Failed: ${err}`); 
      } 
      finally { 
          setIsProcessing(false); 
          if (excelInputRef.current) excelInputRef.current.value = ''; 
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCalibrateMatrix = async () => {
      // setIsCalibrating(true); // Using terminal logic or toast? keeping toast for this quick action
      showToast('Initiating Brain Fission...', 'success');
      await new Promise(r => setTimeout(r, 500));
      try {
          const newMatrix = dataService.autoCalibrateMatrix(selectedGame);
          setMatrix(newMatrix);
          dataService.savePricingMatrix(newMatrix);
          setLatestReport(dataService.getLatestReport(selectedGame)); 
          showToast(`Neural Network Updated`, 'success');
      } catch (e) { showToast('Calibration failed', 'error'); } 
  }

  // --- CRUD HELPERS ---
  const updateMatrixRate = (key: string, val: number) => { if(matrix) setMatrix({ ...matrix, rates: { ...matrix.rates, [key]: val } }); }
  const currentFields = configs[selectedGame] || [];
  const fieldGroups = ["基础信息", "特勤处", "核心资产", "增值服务"];
  const groupedFields = fieldGroups.map(g => ({ name: g, fields: currentFields.filter(f => f.group === g || (!fieldGroups.includes(f.group || '') && g === "基础信息")) }));
  
  const addField = (group: string) => { const next = [...currentFields, { key: `f_${Date.now()}`, label: 'New Field', type: 'text', group } as GameField]; setConfigs({...configs, [selectedGame]: next}); dataService.saveGameConfigs({...configs, [selectedGame]: next}); };
  const updateField = (key: string, updates: Partial<GameField>) => { 
      const next = currentFields.map(f => f.key === key ? {...f, ...updates} : f); 
      setConfigs({...configs, [selectedGame]: next}); 
      dataService.saveGameConfigs({...configs, [selectedGame]: next}); 
  };
  const removeField = (key: string) => { 
      const next = currentFields.filter(f => f.key !== key); 
      setConfigs({...configs, [selectedGame]: next}); 
      dataService.saveGameConfigs({...configs, [selectedGame]: next}); 
  };
  
  const addRule = (field: GameField) => { setRules([...rules, { id: `r_${Date.now()}`, gameName: selectedGame, fieldKey: field.key, matchValue: field.type === 'number' ? '*' : (field.options?.[0] || ''), keyword: 'New Rule', price: 0, type: 'add' }]); setHasUnsavedRules(true); };
  const updateRule = (id: string, updates: Partial<PriceRule>) => { setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r)); setHasUnsavedRules(true); };
  const deleteRule = (id: string) => { setRules(rules.filter(r => r.id !== id)); setHasUnsavedRules(true); };
  const handleSaveRules = () => { dataService.savePriceRules([...dataService.getPriceRules().filter(r => r.gameName !== selectedGame), ...rules]); setHasUnsavedRules(false); showToast("Rules Saved", "success"); };

  const openAddUser = () => { setFormUsername(''); setFormPassword(''); setFormRole('user'); setShowAddUser(true); };
  const openChangePwd = (u: User) => { setTargetUser(u); setFormPassword(''); setShowChangePwd(true); };
  const submitAddUser = () => { if (!formUsername || !formPassword) return showToast("Required", "error"); const res = authService.adminCreateUser(formUsername, formPassword, formRole); if (res.success) { showToast("Success", "success"); setShowAddUser(false); refreshData(); } else showToast(res.message||"Error", "error"); };
  const submitChangePwd = () => { if (!targetUser || !formPassword) return; authService.adminResetPassword(targetUser.id, formPassword); showToast("Updated", "success"); setShowChangePwd(false); };
  const handleToggleAdmin = (u: User) => { if (u.username === 'admin') return; const newRole = u.role === 'admin' ? 'user' : 'admin'; authService.updateUserRole(u.id, newRole); showToast("Role Updated", "success"); refreshData(); };
  const handleDeleteUser = (id: string) => { if (confirm("Delete?")) { authService.deleteUser(id); refreshData(); } };

  const handleEditItem = (item: InternalReference) => {
      setEditingItem(item);
      setEditFormDesc(item.description);
      setEditFormPrice(item.price);
  };

  const handleSaveItem = () => {
      if (!editingItem) return;
      const targetRefs = learnType === 'listing' ? listingRefs : soldRefs;
      const updated = targetRefs.map(r => r.id === editingItem.id ? { ...r, description: editFormDesc, price: editFormPrice } : r);
      if (learnType === 'listing') setListingRefs(updated); else setSoldRefs(updated);
      const otherTypeRefs = learnType === 'listing' ? soldRefs : listingRefs;
      dataService.saveInternalReferences([...updated, ...otherTypeRefs]);
      setEditingItem(null);
      showToast('Record Updated', 'success');
  };

  const handleDeleteItem = (id: string) => {
      if(!confirm("Are you sure you want to delete this record?")) return;
      const targetRefs = learnType === 'listing' ? listingRefs : soldRefs;
      const updated = targetRefs.filter(r => r.id !== id);
      if (learnType === 'listing') setListingRefs(updated); else setSoldRefs(updated);
      const otherTypeRefs = learnType === 'listing' ? soldRefs : listingRefs;
      dataService.saveInternalReferences([...updated, ...otherTypeRefs]);
      showToast('Record Deleted', 'success');
  };

  const getSentimentIcon = (sentiment: string = 'neutral') => { if (sentiment === 'bullish') return <FaceSmileIcon className="w-12 h-12 text-emerald-400" />; if (sentiment === 'bearish') return <FaceFrownIcon className="w-12 h-12 text-red-400" />; return <MinusCircleIcon className="w-12 h-12 text-gray-400" />; };
  const getSentimentColor = (sentiment: string = 'neutral') => { if (sentiment === 'bullish') return 'text-emerald-400'; if (sentiment === 'bearish') return 'text-red-400'; return 'text-gray-300'; };
  const getSentimentLabel = (sentiment: string = 'neutral') => { if (sentiment === 'bullish') return '看涨 / BULLISH'; if (sentiment === 'bearish') return '看跌 / BEARISH'; return '平稳 / NEUTRAL'; };

  const renderMatrixGrid = (filterFn: (f: GameField) => boolean, type: 'numeric' | 'options') => {
      const targetFields = currentFields.filter(filterFn);
      if(targetFields.length === 0) return <div className="text-gray-500 text-xs italic p-4">暂无数据 / No Data</div>;
      return (
        <div className={`grid gap-4 ${type === 'numeric' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {targetFields.map(field => {
                if (type === 'numeric') {
                    return (
                        <div key={field.key} className="bg-void-800 p-4 rounded-lg border border-white/5">
                            <label className="text-[10px] text-gray-400 uppercase font-bold block mb-2">{field.label}</label>
                            <div className="flex items-center gap-2"><span className="text-sm font-bold text-white">¥</span><input type="number" step="0.01" value={matrix?.rates[field.key] || 0} onChange={e => updateMatrixRate(field.key, parseFloat(e.target.value))} className="bg-transparent text-lg font-mono text-emerald-400 outline-none w-24 border-b border-white/10 focus:border-emerald-500" /><span className="text-xs text-gray-500">/ Unit</span></div>
                        </div>
                    );
                } else {
                    return (
                        <div key={field.key} className="mb-4">
                            <h5 className="text-xs text-gray-300 font-bold mb-2">{field.label}</h5>
                            <div className="space-y-1 pl-1 border-l border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                {(field.options || []).map(opt => {
                                    const rateKey = `${field.key}:${opt}`;
                                    return ( <div key={opt} className="flex justify-between items-center text-xs border-b border-white/5 pb-1"><span className="text-gray-400 truncate w-32" title={opt}>{opt}</span><div className="flex items-center"><span className="text-gray-600 mr-1">¥</span><input type="number" value={matrix?.rates[rateKey] || 0} onChange={e => updateMatrixRate(rateKey, parseFloat(e.target.value))} className="w-14 bg-transparent text-right font-mono text-white outline-none focus:text-primary" /></div></div> );
                                })}
                            </div>
                        </div>
                    )
                }
            })}
        </div>
      );
  };

  const filteredLogs = isAdmin ? actionLogs : actionLogs.filter(l => l.userId === user?.id);
  const todaysLogs = filteredLogs.filter(l => l.timestamp.startsWith(new Date().toISOString().split('T')[0]));
  const currentRefs = learnType === 'listing' ? listingRefs : soldRefs;
  const currentGameRefs = currentRefs.filter(r => r.gameName === selectedGame);

  return (
    <div className="fixed inset-0 z-[100] bg-void-950/95 backdrop-blur-xl flex flex-col animate-fade-in text-slate-200 font-sans">
      <ToastContainer toasts={toasts} />
      <UserModal isOpen={showAddUser} onClose={()=>setShowAddUser(false)} onSubmit={submitAddUser} title="新增用户 / Add User"><div className="space-y-4"><div><label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Username</label><input value={formUsername} onChange={e=>setFormUsername(e.target.value)} className="w-full bg-void-800 border border-white/10 rounded p-2 outline-none text-white"/></div><div><label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Password</label><input type="password" value={formPassword} onChange={e=>setFormPassword(e.target.value)} className="w-full bg-void-800 border border-white/10 rounded p-2 outline-none text-white"/></div><div><label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Role</label><select value={formRole} onChange={(e:any)=>setFormRole(e.target.value)} className="w-full bg-void-800 border border-white/10 rounded p-2 outline-none text-white"><option value="user">User</option><option value="admin">Admin</option></select></div></div></UserModal>
      <UserModal isOpen={showChangePwd} onClose={()=>setShowChangePwd(false)} onSubmit={submitChangePwd} title={`重置密码: ${targetUser?.username}`}><div><label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">New Password</label><input type="password" value={formPassword} onChange={e=>setFormPassword(e.target.value)} className="w-full bg-void-800 border border-white/10 rounded p-2 outline-none text-white"/></div></UserModal>
      
      <DataEditorModal isOpen={!!editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveItem} desc={editFormDesc} setDesc={setEditFormDesc} price={editFormPrice} setPrice={setEditFormPrice} />

      {/* HEADER */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-void-900 shadow-glass">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center text-black shadow-neon"><Cog6ToothIcon className="w-5 h-5 animate-spin-slow" /></div>
          <div><h2 className="text-lg font-bold text-white tracking-widest font-tech">SINGULARITY CMS</h2><div className="flex items-center gap-2 text-[10px] text-primary font-mono opacity-80">v3.1.0 <span className="text-gray-500">|</span> {isAdmin ? 'ADMIN ACCESS' : 'USER ACCESS'}</div></div>
        </div>
        <div className="flex items-center gap-4">
           {isAdmin && <button onClick={handleSaveAndReboot} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg border border-white/10 flex items-center gap-2"><ArrowPathIcon className="w-4 h-4" /> SAVE & REBOOT</button>}
           <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full text-slate-500"><XMarkIcon className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-72 border-r border-white/5 bg-void-900/50 p-6 flex flex-col gap-8">
           <div>
             <label className="text-[10px] text-primary font-bold uppercase tracking-widest mb-3 block">目标系统 (Target System)</label>
             <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)} className="w-full bg-void-800 border border-white/10 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-primary/50">
               {Object.keys(configs).map(g => <option key={g} value={g}>{g}</option>)}
             </select>
           </div>
           <div className="flex flex-col gap-2">
              <button onClick={() => setActiveTab('home')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${activeTab === 'home' ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:bg-white/5'}`}><HomeIcon className="w-5 h-5" /> 概览 / Overview</button>
              <button onClick={() => setActiveTab('matrix')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${activeTab === 'matrix' ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' : 'text-slate-500 hover:bg-white/5'}`}><CpuChipIcon className="w-5 h-5" /> 核心大脑 / Brain Core</button>
              
              {isAdmin && (
                  <>
                      <button onClick={() => setActiveTab('rules')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${activeTab === 'rules' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'text-slate-500 hover:bg-white/5'}`}><BeakerIcon className="w-5 h-5" /> 规则引擎 / Rule Engine</button>
                      <button onClick={() => setActiveTab('learning')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${activeTab === 'learning' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-500 hover:bg-white/5'}`}><AcademicCapIcon className="w-5 h-5" /> 深度学习 / Learning</button>
                      <button onClick={() => setActiveTab('config')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${activeTab === 'config' ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:bg-white/5'}`}><RectangleStackIcon className="w-5 h-5" /> 参数 / Config</button>
                      <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${activeTab === 'users' ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:bg-white/5'}`}><UsersIcon className="w-5 h-5" /> 账户 / Users</button>
                  </>
              )}
           </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto bg-void-950 p-10 scroll-smooth relative">
           
           {/* HOME - DASHBOARD (Available to All) */}
           {activeTab === 'home' && (
              <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                 <div className="flex justify-between items-center">
                     <h3 className="text-2xl font-bold text-white flex items-center gap-2"><ChartBarIcon className="w-8 h-8 text-primary"/> 今日数据概览 / Daily Stats</h3>
                     <div className="text-xs text-gray-500 font-mono">SERVER TIME: {new Date().toLocaleTimeString()}</div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="My Valuations (Today)" value={todayValuationCount} sub="REQUESTS" icon={PresentationChartLineIcon} colorClass="text-primary" />
                    {isAdmin && (
                        <>
                            <StatCard title="System Listings" value={listingRefs.length} sub="IMPORTED" icon={TagIcon} colorClass="text-gray-400" />
                            <StatCard title="System Sold" value={soldRefs.length} sub="IMPORTED" icon={BanknotesIcon} colorClass="text-emerald-400" />
                            <StatCard title="Total Users" value={users.length} sub="ACCOUNTS" icon={UsersIcon} colorClass="text-secondary" />
                        </>
                    )}
                 </div>

                 {/* New Liquidity Heatmap */}
                 {isAdmin && <LiquidityHeatmap logs={actionLogs} />}

                 <div className="bg-void-900 border border-white/5 rounded-xl overflow-hidden shadow-card">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2"><ClockIcon className="w-4 h-4"/> 今日活跃记录 / Activity Log ({todaysLogs.length})</h4>
                    </div>
                    <table className="w-full text-left text-xs text-gray-400">
                        <thead className="bg-black/30 text-white font-bold uppercase">
                            <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">User</th>
                                <th className="p-3">Game</th>
                                <th className="p-3">Result</th>
                                <th className="p-3">Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaysLogs.slice(0, 50).map((log, i) => (
                                <tr key={log.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-mono">{log.timestamp.split('T')[1].substring(0,8)}</td>
                                    <td className="p-3 flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${log.role === 'admin' ? 'bg-secondary' : 'bg-primary'}`}></div>{log.username}</td>
                                    <td className="p-3 text-white">{log.gameName}</td>
                                    <td className="p-3 font-mono text-emerald-400 font-bold">¥{log.resultPrice}</td>
                                    <td className="p-3 flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {log.location}</td>
                                </tr>
                            ))}
                            {todaysLogs.length === 0 && <tr><td colSpan={5} className="p-8 text-center italic">No activity recorded today.</td></tr>}
                        </tbody>
                    </table>
                 </div>
              </div>
           )}

           {/* BRAIN CORE */}
           {activeTab === 'matrix' && matrix && (
               <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
                   {/* Header & Controls */}
                   <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 gap-4">
                       <div>
                           <h3 className="text-3xl font-bold text-white flex items-center gap-3"><CpuChipIcon className="w-8 h-8 text-accent-gold animate-pulse"/> 核心大脑 / BRAIN CORE</h3>
                           <p className="text-gray-400 text-sm mt-1">Status: <span className="text-emerald-400 font-bold">ONLINE</span> | 动态市场分析模块</p>
                       </div>
                       
                       <div className="flex items-center gap-2 bg-void-900 rounded-lg p-1 border border-white/10">
                           {(['day', 'week', 'month', 'year'] as TimeFrame[]).map(tf => (
                               <button key={tf} onClick={() => setTimeFrame(tf)} className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${timeFrame === tf ? 'bg-white text-black shadow-neon' : 'text-gray-500 hover:text-white'}`}>
                                   {tf}
                               </button>
                           ))}
                       </div>

                       {isAdmin && (
                           <button onClick={handleCalibrateMatrix} className="px-6 py-3 bg-accent-gold text-black rounded-xl text-sm font-bold flex items-center gap-2 shadow-neon transition-all hover:scale-105">
                               <BoltIcon className="w-5 h-5"/> 启动脑裂变 (CALIBRATE)
                           </button>
                       )}
                   </div>
                   
                   {/* Trend Analysis Chart */}
                   <div className="bg-void-900 border border-white/10 rounded-2xl p-6 shadow-lg">
                       <h4 className="text-sm font-bold text-white uppercase mb-6 flex items-center gap-2"><ChartBarIcon className="w-4 h-4 text-primary"/> 成交均价趋势 / Average Sold Price Trend ({timeFrame.toUpperCase()})</h4>
                       <div className="h-64 flex items-end gap-2">
                           {trendData.length > 0 ? trendData.map((d, i) => (
                               <div key={i} className="flex-1 flex flex-col items-center group relative">
                                   <div className="w-full bg-primary/20 hover:bg-primary/50 transition-all rounded-t-sm relative group-hover:shadow-[0_0_15px_rgba(0,242,234,0.3)]" style={{ height: `${Math.max(5, (d.value / (Math.max(...trendData.map(t=>t.value)) || 1)) * 100)}%` }}>
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-white/20">
                                            ¥{d.value} ({d.count})
                                        </div>
                                   </div>
                                   <span className="text-[10px] text-gray-500 mt-2 rotate-0 truncate w-full text-center">{d.label}</span>
                               </div>
                           )) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-600 italic">No sold data in this period.</div>
                           )}
                       </div>
                   </div>

                   {/* Analysis Report Block */}
                   {latestReport && (
                     <div className="grid grid-cols-12 gap-6">
                        {/* Sentiment */}
                        <div className="col-span-12 md:col-span-4 bg-void-900 border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden flex flex-col justify-center">
                            <div className="mb-2 flex justify-center">{getSentimentIcon(latestReport.marketSentiment)}</div>
                            <div className={`text-4xl font-black font-tech ${getSentimentColor(latestReport.marketSentiment)}`}>{getSentimentLabel(latestReport.marketSentiment).split('/')[0]}</div>
                            <div className="text-xs text-gray-500 mt-2 px-4">{latestReport.conclusion.substring(0, 100)}...</div>
                        </div>

                        {/* Top Movers */}
                        <div className="col-span-12 md:col-span-8 bg-void-900 border border-white/10 rounded-2xl p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Market Movers / 市场风向标</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] text-emerald-500 font-bold mb-2 flex items-center gap-1"><ArrowTrendingUpIcon className="w-3 h-3"/> 领涨 / Top Gainers</div>
                                    {latestReport.topGainers.slice(0,3).map((g,i)=>(
                                        <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5">
                                            <span className="text-gray-300 truncate w-32">{g.name}</span>
                                            <span className="text-emerald-400 font-bold">+{g.changePercent.toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="text-[10px] text-red-500 font-bold mb-2 flex items-center gap-1"><ArrowTrendingDownIcon className="w-3 h-3"/> 领跌 / Top Losers</div>
                                    {latestReport.topLosers.slice(0,3).map((g,i)=>(
                                        <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5">
                                            <span className="text-gray-300 truncate w-32">{g.name}</span>
                                            <span className="text-red-400 font-bold">{g.changePercent.toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                     </div>
                   )}

                   {/* Admin Only: Detailed Matrix Edit */}
                   {isAdmin && (
                       <div className="pt-8 border-t border-white/10">
                           <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CalculatorIcon className="w-5 h-5 text-gray-400"/> 矩阵参数明细 / Matrix Parameters</h3>
                           <CollapsiblePanel 
                              title="Assets & Currencies / 资产与货币" 
                              isOpen={matrixExpanded['assets']} 
                              onToggle={() => setMatrixExpanded(p => ({...p, assets: !p.assets}))}
                              icon={BanknotesIcon}
                           >
                              {renderMatrixGrid(f => (f.group === '基础信息' || f.group === '核心资产') && f.type === 'number', 'numeric')}
                           </CollapsiblePanel>
                           <CollapsiblePanel 
                              title="Appearance & Quality / 外观与品质" 
                              isOpen={matrixExpanded['appearance']} 
                              onToggle={() => setMatrixExpanded(p => ({...p, appearance: !p.appearance}))}
                              icon={TagIcon}
                           >
                              {renderMatrixGrid(f => f.group === '核心资产' && (f.type === 'multiselect' || f.type === 'select'), 'options')}
                           </CollapsiblePanel>
                       </div>
                   )}
               </div>
           )}

           {/* ADMIN CONFIG MODULE */}
           {activeTab === 'config' && isAdmin && (
                <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
                    <div className="border-b border-white/10 pb-6 flex justify-between items-end">
                       <h3 className="text-3xl font-bold text-white flex items-center gap-3"><RectangleStackIcon className="w-8 h-8 text-white"/> 参数配置 / CONFIG</h3>
                       <p className="text-gray-400 text-sm">Define form fields and structure.</p>
                    </div>
                    {groupedFields.map(group => (
                        <div key={group.name} className="bg-void-900 border border-white/5 rounded-xl p-6 shadow-card">
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                <h4 className="text-white font-bold text-sm uppercase tracking-widest">{group.name}</h4>
                                <button onClick={() => addField(group.name)} className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white font-bold flex items-center gap-2">+ Field</button>
                            </div>
                            <div className="space-y-3">
                                {group.fields.map(field => (
                                    <div key={field.key} className="bg-void-800 p-3 rounded border border-white/5 flex gap-4 items-center">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">Label</label>
                                            <input value={field.label} onChange={e => updateField(field.key, {label: e.target.value})} className="w-full bg-void-950 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"/>
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">Type</label>
                                            <select value={field.type} onChange={e => updateField(field.key, {type: e.target.value as any})} className="w-full bg-void-950 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none">
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="select">Select</option>
                                                <option value="multiselect">Multi-Select</option>
                                            </select>
                                        </div>
                                        <div className="w-10 flex justify-center pt-4">
                                            <button onClick={() => removeField(field.key)} className="text-red-500 hover:bg-red-500/10 p-1 rounded"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
           )}

           {/* ADMIN RULES MODULE */}
           {activeTab === 'rules' && isAdmin && (
             <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-fade-in relative">
                <div className="border-b border-white/10 pb-6 flex justify-between items-end">
                   <h3 className="text-3xl font-bold text-white flex items-center gap-3"><BeakerIcon className="w-8 h-8 text-secondary"/> 规则引擎 / RULE ENGINE</h3>
                   {hasUnsavedRules && <div className="text-amber-400 font-bold animate-pulse text-sm border border-amber-400/50 bg-amber-400/10 px-3 py-1 rounded">● Unsaved Changes</div>}
                </div>
                {groupedFields.map(group => (
                  <div key={group.name} className="bg-void-900 border border-white/5 rounded-xl p-6 shadow-card">
                      <h4 className="text-primary font-bold text-sm uppercase mb-4 tracking-widest border-b border-white/5 pb-2 flex items-center justify-between">{group.name}</h4>
                      <div className="space-y-4">
                        {group.fields.map(field => {
                           const fieldRules = rules.filter(r => r.fieldKey === field.key);
                           return (
                              <div key={field.key} className="bg-void-800 rounded-lg border border-white/5 p-4">
                                  <div className="flex justify-between items-center mb-3">
                                      <div className="flex items-center gap-2"><span className="text-sm font-bold text-white">{field.label}</span><span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400">{field.type}</span></div>
                                      <button onClick={() => addRule(field)} className="text-[10px] bg-secondary/10 text-secondary hover:bg-secondary/20 px-2 py-1 rounded font-bold border border-secondary/30">+ Add Rule</button>
                                  </div>
                                  <div className="grid gap-2">
                                      {fieldRules.map(rule => (
                                        <div key={rule.id} className="grid grid-cols-12 gap-2 items-center bg-void-900 p-2 rounded border border-white/5 text-xs">
                                           {field.type === 'number' ? <div className="col-span-3 text-gray-400 font-mono pl-2">Per Unit Input</div> : <select value={rule.matchValue} onChange={e => updateRule(rule.id, {matchValue: e.target.value})} className="col-span-3 bg-void-950 text-white p-1 rounded border border-white/10 outline-none"><option value="">Select Option...</option>{field.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>}
                                           <select value={rule.type} onChange={e => updateRule(rule.id, {type: e.target.value as any})} className="col-span-2 bg-void-950 text-accent-gold p-1 rounded border border-white/10 outline-none font-bold text-center"><option value="add">+ ADD</option><option value="subtract">- SUB</option><option value="multiply">* MUL</option><option value="divide">/ DIV</option></select>
                                           <div className="col-span-3 relative"><input type="number" value={rule.price} onChange={e => updateRule(rule.id, {price: parseFloat(e.target.value)})} className="w-full bg-void-950 text-white p-1 pl-4 rounded border border-white/10 outline-none font-mono"/><span className="absolute left-1 top-1 text-gray-600">¥</span></div>
                                           <input type="text" placeholder="Note (Optional)" value={rule.keyword} onChange={e => updateRule(rule.id, {keyword: e.target.value})} className="col-span-3 bg-void-950 text-gray-500 p-1 rounded border border-white/10 outline-none"/>
                                           <button onClick={() => deleteRule(rule.id)} className="col-span-1 text-red-500 hover:bg-red-900/20 p-1 rounded flex justify-center"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                      ))}
                                  </div>
                              </div>
                           )
                        })}
                      </div>
                  </div>
                ))}
                <div className={`fixed bottom-0 left-72 right-0 p-6 bg-void-950/90 backdrop-blur-md border-t border-white/10 flex justify-between items-center transition-all transform ${hasUnsavedRules ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                   <div className="flex items-center gap-3"><ExclamationTriangleIcon className="w-5 h-5 text-amber-400" /><span className="text-gray-300 text-sm">You have unsaved rule changes.</span></div>
                   <button onClick={handleSaveRules} className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-lg shadow-neon flex items-center gap-2 hover:bg-emerald-400 transition-colors"><ClipboardDocumentCheckIcon className="w-5 h-5" /> SAVE CHANGES</button>
                </div>
             </div>
           )}

           {activeTab === 'learning' && isAdmin && (
             <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
                <div className="border-b border-white/10 pb-6">
                    <h3 className="text-3xl font-bold text-white flex items-center gap-3"><AcademicCapIcon className="w-8 h-8 text-primary"/> 深度学习中心 / LEARNING CENTER</h3>
                    <p className="text-gray-400 text-sm mt-2">Continuous Learning Protocol: Feed raw market data to calibrate the Valuation Matrix.</p>
                </div>
                
                {/* Control Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                    {/* Left: Input & Controls */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="bg-void-900 border border-white/10 rounded-xl p-4 shadow-lg flex-1 flex flex-col">
                            <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-lg">
                                <button onClick={() => setLearnType('listing')} disabled={isProcessing} className={`flex-1 py-2 rounded text-xs font-bold transition-all ${learnType === 'listing' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}>LISTINGS (挂牌)</button>
                                <button onClick={() => setLearnType('sold')} disabled={isProcessing} className={`flex-1 py-2 rounded text-xs font-bold transition-all ${learnType === 'sold' ? 'bg-emerald-500 text-black' : 'text-gray-500 hover:text-white'}`}>SOLD (成交)</button>
                            </div>
                            
                            <textarea 
                                value={rawPaste} 
                                onChange={e => setRawPaste(e.target.value)} 
                                disabled={isProcessing}
                                placeholder={learnType === 'listing' ? "Paste Listings...\n[Item Name] [Specs]\n￥Price" : "Paste Sold Records..."} 
                                className="flex-1 bg-void-950/50 border border-white/5 rounded-lg p-3 text-xs font-mono text-gray-300 outline-none focus:border-primary/30 resize-none mb-4"
                            />
                            
                            <div className="flex flex-col gap-2">
                                <div className="relative overflow-hidden group w-full">
                                    <button disabled={isProcessing} className="w-full px-4 py-3 bg-void-800 border border-white/10 rounded text-xs text-gray-400 group-hover:text-white group-hover:border-white/30 flex items-center justify-center gap-2 transition-all">
                                        <DocumentArrowUpIcon className="w-4 h-4"/> Import Excel (.xlsx)
                                    </button>
                                    <input type="file" accept=".xlsx, .xls" ref={excelInputRef} onChange={handleExcelUpload} disabled={isProcessing} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"/>
                                </div>
                                <button 
                                    onClick={handleStartLearning} 
                                    disabled={isProcessing || !rawPaste} 
                                    className={`w-full px-4 py-3 text-black text-xs font-bold rounded flex items-center justify-center gap-2 border border-transparent shadow-neon transition-all ${isProcessing ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-white hover:bg-gray-200'}`}
                                >
                                    {isProcessing ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <BoltIcon className="w-4 h-4"/>} 
                                    {isProcessing ? 'PROCESSING STREAM...' : 'INITIATE LEARNING'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Terminal Console */}
                    <div className="lg:col-span-2">
                        <TerminalConsole 
                            logs={terminalLogs} 
                            progress={processProgress} 
                            isRunning={isProcessing} 
                            total={totalBatches} 
                            current={currentBatch} 
                        />
                    </div>
                </div>

                {/* AI Insights Gallery */}
                <div className="mt-8">
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><LightBulbIcon className="w-5 h-5 text-yellow-400"/> AI Learning Insights / 学习心得 ({insights.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {insights.length === 0 && <div className="col-span-3 text-center p-8 border border-dashed border-white/10 rounded-xl text-gray-500 text-xs">No learning insights recorded yet. Process data to generate insights.</div>}
                        {insights.map(insight => (
                            <div key={insight.id} className="bg-void-900 border border-white/10 p-4 rounded-xl hover:border-primary/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400">{insight.date.split('T')[0]}</span>
                                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${insight.dataType === 'sold' ? 'text-emerald-400 bg-emerald-400/10' : 'text-primary bg-primary/10'}`}>{insight.dataType}</span>
                                </div>
                                <p className="text-xs text-gray-300 mb-3 leading-relaxed">"{insight.insight}"</p>
                                <div className="flex flex-wrap gap-1">
                                    {insight.keyPatterns.map((p,i) => <span key={i} className="text-[9px] bg-black/40 text-gray-500 px-1.5 py-0.5 rounded border border-white/5">{p}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Data Management Table */}
                <div className="bg-void-900 border border-white/10 rounded-xl overflow-hidden shadow-lg mt-8">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2"><TableCellsIcon className="w-4 h-4"/> Knowledge Base / 知识库 ({currentGameRefs.length})</h4>
                    </div>
                    {/* Header */}
                    <div className="flex px-4 py-3 bg-black/30 text-white font-bold uppercase text-xs border-b border-white/5">
                        <div className="w-24">Date</div>
                        <div className="w-24">Price</div>
                        <div className="flex-1">Description</div>
                        <div className="w-20 text-right">Actions</div>
                    </div>
                    {/* Virtual Body */}
                    {currentGameRefs.length > 0 ? (
                        <VirtualTable 
                            items={currentGameRefs} 
                            onEdit={handleEditItem} 
                            onDelete={handleDeleteItem} 
                        />
                    ) : (
                        <div className="p-8 text-center text-xs text-gray-500 italic">No records found.</div>
                    )}
                </div>
             </div>
           )}

           {activeTab === 'users' && isAdmin && (
               <div className="max-w-5xl mx-auto space-y-6">
                   <div className="flex justify-between items-center pb-4 border-b border-white/10"><h3 className="text-xl font-bold text-white flex items-center gap-2"><UsersIcon className="w-6 h-6"/> 用户权限 / Users</h3><button onClick={openAddUser} className="px-4 py-2 bg-primary text-black rounded text-xs font-bold shadow-neon hover:bg-cyan-300 flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Add User</button></div>
                   <div className="bg-void-900 border border-white/5 rounded-xl overflow-hidden shadow-card"><table className="w-full text-left text-sm text-gray-400"><thead className="bg-void-950 text-white font-bold"><tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Created</th><th className="p-4">Actions</th></tr></thead><tbody>{users.map(u => (<tr key={u.id} className="border-b border-white/5"><td className="p-4 flex items-center gap-2"><UserCircleIcon className="w-5 h-5"/>{u.username}</td><td className="p-4">{u.role}</td><td className="p-4">{new Date(u.createdAt).toLocaleDateString()}</td><td className="p-4 flex gap-3"><button onClick={() => openChangePwd(u)} className="text-gray-400 hover:text-white" title="Change Password"><LockClosedIcon className="w-5 h-5"/></button>{u.username !== 'admin' && (<><button onClick={() => handleToggleAdmin(u)} className="text-primary hover:text-cyan-200" title="Toggle Role"><ShieldCheckIcon className="w-5 h-5"/></button><button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-400" title="Delete"><TrashIcon className="w-5 h-5"/></button></>)}</td></tr>))}</tbody></table></div>
               </div>
           )}
        </div>
      </div>
    </div>
  );
}
