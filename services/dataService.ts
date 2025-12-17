import { GameConfigMap, GameField, PriceRule, InternalReference, LearningLog, PricingMatrix, MarketReport, ItemTrend, RiskLevel, ValuationRequest, ValuationActionLog, User, TimeFrame, AILearningInsight } from "../types";

// 通用常量
const COMMON_OS_OPTIONS = ["安卓QQ", "苹果QQ", "安卓微信", "苹果微信"];
const COMMON_REAL_NAME = ["可二次实名", "不可二次实名"];

const STORAGE_KEYS = {
  CONFIGS: 'pz_app_configs',
  RULES: 'pz_app_rules',
  REFS: 'pz_app_refs', 
  LOGS: 'pz_app_learning_logs',
  ACTION_LOGS: 'pz_app_action_logs', 
  MATRIX: 'pz_app_pricing_matrix',
  REPORTS: 'pz_app_market_reports',
  INSIGHTS: 'pz_app_ai_insights'
};

// --- DELTA FORCE UPDATED CONSTANTS ---

// 🔥 HOT ITEMS DEFINITION
export const DELTA_HOT_ITEMS = [
    "蛊-能天使午夜邮差",
    "红狼-蚀金玫瑰",
    "露娜-黑天际线",
    "骇爪-水墨云图",
    "骇爪-维什戴尔",
    "近战武器-北极星",
    "近战武器-信条"
];

// 1. BASE NAMES (For UI Display)
export const DELTA_COLLECTION_WEAPONS_BASE = [
  "ASVal突击步枪-悬赏令",
  "M7战斗步枪-棱镜攻势S2",
  "腾龙突击步枪-气象感应",
  "K416突击步枪-命运",
  "AUG突击步枪-气象感应",
  "M4A1突击步枪-棱镜攻势",
  "SCAR-H战斗步枪-电玩高手",
  "Vector冲锋枪-美杜莎",
  "QBZ95-1突击步枪-王牌之剑"
];

// 2. QUALITIES (For Logic)
export const DELTA_QUALITIES = ["极品S", "极品A", "极品B", "极品C"];

// 3. UPDATED MELEE LIST - STRICT MATCH
const DELTA_MELEE = [
  "近战武器-北极星", 
  "近战武器-信条", 
  "近战武器-黑海", 
  "近战武器-影锋", 
  "近战武器-怜悯", 
  "近战武器-电锯惊魂", 
  "近战武器-赤枭", 
  "近战武器-黑鹰"
];

const DELTA_LEGENDARY_CHARMS = [
  "毁灭之源", "黑夜猎手", "肘击王", "余烬之影", "挂饰-蚀金玫瑰", "统统拿走", 
  "挂饰-维什戴尔", "挂饰-黑·天际线", "麦小鼠", "挂饰-北极星", "挂饰-水墨云图", "赤霄游龙", 
  "王国利刃", "白王后", "王国之杖", "慵懒魔女", "挂饰-赤枭", "挂饰-怜悯", "挂饰-影锋", 
  "挂饰-黄金坦克", "挂饰-黑暗力量", "挂饰-黑海", "骇客纪元", "低音艺术家", "黑暗摇滚"
];

const DELTA_OPERATORS = [
  "骇爪-维什戴尔", "蛊-能天使午夜邮差", "红狼-蚀金玫瑰", "露娜-黑天际线", "骇爪-水墨云图",
  "红狼-电锯惊魂", "露娜-金牌射手", "威龙-飞虎", "无名-夜鹰", "蜂医-送葬人无题密令", 
  "威龙-蛟龙特战队", "深蓝-不破誓约", "威龙-壮志凌云", "蜂医-黑鹰坠落", "红狼-黑鹰坠落", 
  "牧羊人-黑鹰坠落", "乌鲁鲁-黑鹰坠落", "蜂医-危险物质", "牧羊人-街头之王", "威龙-铁面判官"
];

const createDefaultMatrix = (gameName: string): PricingMatrix => {
    const base: PricingMatrix = {
        gameName,
        rates: {},
        realNameDiscount: 0.95,
        lastUpdated: new Date().toISOString()
    };
    if (gameName === "三角洲行动") {
        // Default base rates based on new 7-layer logic
        base.rates = { 
            "asset_total_m": 1.5, // Per 1M (Unit Base)
            "currency_havoc_w": 0.5, // Per 1W (Unit Base)
            "safe_box:S7顶级安全箱9(3x3)": 400,
            "infra_warehouse:仓库LV.10 (满级)": 150,
            "infra_range:靶场LV.7 (满级)": 80
        };
    }
    return base;
};

const DEFAULT_GAME_CONFIGS: GameConfigMap = {
  "三角洲行动": [
    { key: "account_type", label: "登录方式 / Login", type: "select", options: ["QQ登录", "微信登录"], group: "基础信息" },
    { key: "real_name_status", label: "实名情况 / Real Name", type: "select", options: ["可二次实名", "不可二次实名"], group: "基础信息" },
    { key: "rank_level", label: "烽火地带段位 / Rank", type: "select", options: ["三角洲巅峰", "黑鹰", "钻石", "铂金", "黄金", "白银", "青铜"], group: "基础信息" },
    { key: "asset_total_m", label: "总资产 (M) / Total Assets", type: "number", placeholder: "填写数字 (10M为计算单位)", group: "基础信息" },
    { key: "currency_havoc_w", label: "哈夫币 (w) / Havoc Coin", type: "number", placeholder: "填写数字 (200w为计算单位)", group: "基础信息" },
    { key: "safe_box", label: "安全箱 / Safe Box", type: "select", options: ["S7顶级安全箱9(3x3)", "S7高级安全箱6(2x3)", "进阶安全箱4(2x2)", "高级安全箱", "体验卡/无"], group: "基础信息" },
    
    // 特勤处 (Infra)
    { key: "infra_warehouse", label: "仓库 / Warehouse", type: "select", options: ["仓库LV.10 (满级)", "仓库LV.9", "仓库LV.8", "仓库LV.7", "仓库LV.6", "仓库LV.5及以下"], group: "特勤处" },
    { key: "infra_range", label: "靶场 / Range", type: "select", options: ["靶场LV.7 (满级)", "靶场LV.6", "靶场LV.5", "靶场LV.4及以下"], group: "特勤处" },
    { key: "infra_training", label: "训练中心 / Training", type: "select", options: ["训练中心LV.7 (满级)", "训练中心LV.6", "训练中心LV.5", "训练中心LV.4及以下"], group: "特勤处" },
    { key: "infra_diving", label: "潜水中心 / Diving Center", type: "select", options: ["潜水中心LV.3 (满级)", "潜水中心LV.2", "潜水中心LV.1", "未解锁"], group: "特勤处" },
    { key: "infra_collection", label: "收藏室 / Collection", type: "select", options: ["收藏室LV.2 (满级)", "收藏室LV.1", "未解锁"], group: "特勤处" },

    // Collection Weapons - Base names only, UI handles S/A/B/C logic
    { key: "collection_weapon", label: "典藏武器 / Collection Wep", type: "multiselect", options: DELTA_COLLECTION_WEAPONS_BASE, group: "核心资产" },
    
    { key: "operator_skins", label: "干员皮肤 / Operator Skins", type: "multiselect", options: DELTA_OPERATORS, group: "核心资产" },
    { key: "melee_skins", label: "刀具 / Melee", type: "multiselect", options: DELTA_MELEE, group: "核心资产" },
    
    { key: "legendary_charms", label: "传说挂饰 / Leg. Charms", type: "multiselect", options: DELTA_LEGENDARY_CHARMS, group: "核心资产" },

    { key: "linked_games", label: "连体游戏 / Linked Accounts", type: "multiselect", options: ["LOL", "王者荣耀", "和平精英", "CF手游", "火影忍者", "DNF", "无畏契约"], group: "增值服务" }
  ],
  "和平精英": [
    { key: "account_type", label: "登录方式 / Login", type: "select", options: ["QQ", "微信"], group: "基础信息" },
    { key: "real_name_status", label: "实名情况 / Real Name", type: "select", options: COMMON_REAL_NAME, group: "基础信息" },
    { key: "os_type", label: "系统 / OS", type: "select", options: ["安卓", "iOS"], group: "基础信息" },
    { key: "rank_level", label: "历史最高段位 / Peak Rank", type: "select", options: ["无敌战神", "超级王牌", "皇冠", "星钻", "白金", "黄金"], group: "基础信息" },
    { key: "skin_count", label: "套装数量 / Skin Count", type: "number", group: "核心资产" },
    { key: "gun_skin_count", label: "枪械皮肤数量 / Gun Skins", type: "number", group: "核心资产" },
    { key: "car_skins", label: "载具皮肤 / Vehicle Skins", type: "multiselect", options: ["玛莎拉蒂", "特斯拉", "兰博基尼", "阿斯顿马丁", "迈凯伦"], group: "核心资产" }
  ],
  "王者荣耀": [
    { key: "account_type", label: "登录方式 / Login", type: "select", options: ["QQ", "微信"], group: "基础信息" },
    { key: "real_name_status", label: "实名情况 / Real Name", type: "select", options: COMMON_REAL_NAME, group: "基础信息" },
    { key: "os_type", label: "系统 / OS", type: "select", options: ["安卓", "iOS"], group: "基础信息" },
    { key: "hero_count", label: "英雄数量 / Hero Count", type: "number", group: "基础信息" },
    { key: "skin_count", label: "皮肤数量 / Skin Count", type: "number", group: "核心资产" },
    { key: "legendary_skin_count", label: "传说/典藏皮肤数量 / Legendary Skins", type: "number", group: "核心资产" },
    { key: "rare_skins", label: "稀有/限定皮肤 / Rare Skins", type: "text", group: "核心资产" }
  ],
  "无畏契约 (Valorant)": [
    { key: "server", label: "服务器 / Server", type: "select", options: ["国服", "国际服"], group: "基础信息" },
    { key: "rank", label: "段位 / Rank", type: "select", options: ["赋能战魂", "神话", "超凡入圣", "钻石", "铂金", "黄金", "白银", "青铜", "黑铁"], group: "基础信息" },
    { key: "skin_value", label: "皮肤总价值(估算) / Est. Skin Value", type: "number", group: "核心资产" },
    { key: "knife_skins", label: "近战武器皮肤 / Knife Skins", type: "text", group: "核心资产" },
    { key: "vandal_skins", label: "暴徒皮肤 / Vandal Skins", type: "text", group: "核心资产" },
    { key: "phantom_skins", label: "幻影皮肤 / Phantom Skins", type: "text", group: "核心资产" }
  ],
  "穿越火线 (CF)": [
    { key: "server", label: "大区 / Server", type: "text", group: "基础信息" },
    { key: "real_name_status", label: "实名情况 / Real Name", type: "select", options: COMMON_REAL_NAME, group: "基础信息" },
    { key: "v_weapon_count", label: "VVIP英雄级数量 / VVIP Count", type: "number", group: "核心资产" },
    { key: "king_weapon_count", label: "王者武器数量 / King Wep Count", type: "number", group: "核心资产" },
    { key: "rank", label: "军衔 / Rank", type: "text", group: "基础信息" },
    { key: "rare_characters", label: "稀有角色 / Rare Chars", type: "text", group: "核心资产" }
  ]
};

class DataService {
  getGameConfigs(): GameConfigMap {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...parsed, "三角洲行动": DEFAULT_GAME_CONFIGS["三角洲行动"] };
      }
    } catch (e) {
      console.error("Config load error", e);
    }
    return DEFAULT_GAME_CONFIGS;
  }

  isHotItem(name: string): boolean {
      return DELTA_HOT_ITEMS.some(hot => name.includes(hot) || hot.includes(name));
  }

  saveGameConfigs(configs: GameConfigMap) {
    localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs));
  }

  getPricingMatrix(gameName: string): PricingMatrix {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MATRIX);
      if (stored) {
        const matrixMap = JSON.parse(stored) as Record<string, PricingMatrix>;
        if (matrixMap[gameName]) return matrixMap[gameName];
      }
    } catch (e) {}
    return createDefaultMatrix(gameName);
  }

  savePricingMatrix(matrix: PricingMatrix) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.MATRIX);
        const matrixMap = stored ? JSON.parse(stored) : {};
        matrixMap[matrix.gameName] = matrix;
        localStorage.setItem(STORAGE_KEYS.MATRIX, JSON.stringify(matrixMap));
    } catch (e) { console.error("Save matrix failed", e); }
  }

  getLatestReport(gameName: string): MarketReport | null {
      try {
          const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
          if(!stored) return null;
          const reports = JSON.parse(stored) as MarketReport[];
          const gameReports = reports.filter(r => r.gameName === gameName).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return gameReports[0] || null;
      } catch { return null; }
  }

  saveReport(report: MarketReport) {
      try {
          const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
          const reports = stored ? JSON.parse(stored) : [];
          const otherGameReports = reports.filter((r: MarketReport) => r.gameName !== report.gameName);
          const thisGameReports = reports.filter((r: MarketReport) => r.gameName === report.gameName);
          const newHistory = [report, ...thisGameReports].slice(0, 10);
          localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([...otherGameReports, ...newHistory]));
      } catch (e) {}
  }

  getAIInsights(gameName: string): AILearningInsight[] {
      try {
          const stored = localStorage.getItem(STORAGE_KEYS.INSIGHTS);
          if (!stored) return [];
          const insights = JSON.parse(stored) as AILearningInsight[];
          return insights.filter(i => i.gameName === gameName).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch { return []; }
  }

  saveAIInsight(insight: AILearningInsight) {
      try {
          const stored = localStorage.getItem(STORAGE_KEYS.INSIGHTS);
          const insights = stored ? JSON.parse(stored) : [];
          const updated = [insight, ...insights].slice(0, 50); 
          localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(updated));
      } catch (e) { console.error("Save insight failed", e); }
  }

  calculateRuleBasedPrice(request: ValuationRequest): number {
    const rules = this.getPriceRules(request.gameName);
    if (rules.length === 0) {
       this.initRulesFromMatrix(request.gameName);
       return this.calculateRuleBasedPrice(request); 
    }
    let baseSum = 0;
    let globalMultiplier = 1;
    const config = this.getGameConfigs()[request.gameName] || [];
    config.forEach(field => {
       const rawVal = request[field.key];
       if (!rawVal) return;
       const valStr = String(rawVal);
       if (field.type === 'number') {
          const numVal = parseFloat(valStr);
          if (isNaN(numVal)) return;
          const fieldRules = rules.filter(r => r.fieldKey === field.key);
          fieldRules.forEach(rule => {
             if (rule.type === 'add') baseSum += numVal * rule.price;
             else if (rule.type === 'subtract') baseSum -= numVal * rule.price;
             else if (rule.type === 'multiply') globalMultiplier *= (1 + (numVal * rule.price)); 
          });
       }
       else {
          const selections = valStr.split(',').map(s => s.trim());
          selections.forEach(sel => {
             // For collection weapons with qualities, match the full string e.g. "K416...(极品S)"
             const rule = rules.find(r => r.fieldKey === field.key && r.matchValue === sel);
             if (rule) {
                if (rule.type === 'add') baseSum += rule.price;
                else if (rule.type === 'subtract') baseSum -= rule.price;
                else if (rule.type === 'multiply') globalMultiplier *= rule.price;
                else if (rule.type === 'divide' && rule.price !== 0) globalMultiplier /= rule.price;
             }
          });
       }
    });
    return Math.round(baseSum * globalMultiplier);
  }

  initRulesFromMatrix(gameName: string) {
     const matrix = this.getPricingMatrix(gameName);
     const config = this.getGameConfigs()[gameName] || [];
     const rules: PriceRule[] = [];
     config.forEach(field => {
        if (field.type === 'number') {
           if (matrix.rates[field.key]) {
              rules.push({
                 id: `rule_${Date.now()}_${Math.random()}`,
                 gameName,
                 fieldKey: field.key,
                 matchValue: '*', 
                 keyword: `${field.label} (Unit Price)`,
                 price: matrix.rates[field.key],
                 type: 'add'
              });
           }
        } else if (field.options) {
           field.options.forEach(opt => {
              // Special check for Collection Weapons to include variants
              if (field.key === 'collection_weapon') {
                  DELTA_QUALITIES.forEach(q => {
                      const variant = `${opt}(${q})`;
                      const rateKey = `${field.key}:${variant}`;
                      if (matrix.rates[rateKey]) {
                          rules.push({
                             id: `rule_${Date.now()}_${Math.random()}`,
                             gameName,
                             fieldKey: field.key,
                             matchValue: variant,
                             keyword: variant,
                             price: matrix.rates[rateKey],
                             type: 'add'
                          });
                      }
                  });
              } else {
                  const rateKey = `${field.key}:${opt}`;
                  if (matrix.rates[rateKey]) {
                      rules.push({
                         id: `rule_${Date.now()}_${Math.random()}`,
                         gameName,
                         fieldKey: field.key,
                         matchValue: opt,
                         keyword: opt,
                         price: matrix.rates[rateKey],
                         type: 'add'
                      });
                  }
              }
           });
        }
     });
     if (matrix.realNameDiscount && matrix.realNameDiscount !== 1) {
        rules.push({
            id: `rule_realname_${Date.now()}`,
            gameName,
            fieldKey: 'real_name_status',
            matchValue: '不可二次实名',
            keyword: '不可二次实名折扣',
            price: matrix.realNameDiscount,
            type: 'multiply'
        });
     }
     this.savePriceRules([...this.getPriceRules().filter(r => r.gameName !== gameName), ...rules]);
  }

  // --- BRAIN CORE: 7-LAYER WEIGHTING SYSTEM ---
  autoCalibrateMatrix(gameName: string): PricingMatrix {
    const soldRefs = this.getInternalReferences(gameName, 'sold');
    const listingRefs = this.getInternalReferences(gameName, 'listing');
    const currentMatrix = this.getPricingMatrix(gameName);
    const gameConfig = this.getGameConfigs()[gameName] || [];
    
    // Weighted Data: Sold items count more (1.0) than Listings (0.85)
    const allData = [
        ...soldRefs.map(r => ({ ...r, weight: 1.0, descNorm: this.normalizeForMatch(r.description) })),
        ...listingRefs.map(r => ({ ...r, price: r.price * 0.85, weight: 0.85, descNorm: this.normalizeForMatch(r.description) }))
    ].filter(r => r.price > 0 && r.description && r.description.length > 2);
    
    if (allData.length === 0) return currentMatrix;
    
    const oldRates = { ...currentMatrix.rates };
    const newRates = { ...currentMatrix.rates };
    const rateAccumulator: Record<string, { totalValue: number, count: number }> = {};
    
    const addToAccumulator = (key: string, unitValue: number) => {
        if (!rateAccumulator[key]) rateAccumulator[key] = { totalValue: 0, count: 0 };
        rateAccumulator[key].totalValue += unitValue;
        rateAccumulator[key].count += 1;
    };

    allData.forEach(item => {
        const content = this.parseRecordContent(item.description, gameConfig);
        
        // --- 7-LAYER WEIGHT CALCULATION ---
        
        // 1. Operator Skins (Highest Priority)
        let w1_Ops = 0;
        content.ops.forEach(k => {
            const isHot = DELTA_HOT_ITEMS.some(h => k.includes(h));
            w1_Ops += isHot ? 15 : 6; 
        });

        // 2. Collection Weapons (Variable Quality Priority)
        let w2_Coll = 0;
        content.collections.forEach(k => {
            if (k.includes('极品S')) w2_Coll += 30; // Very High
            else if (k.includes('极品A')) w2_Coll += 15;
            else if (k.includes('极品B')) w2_Coll += 8;
            else if (k.includes('极品C')) w2_Coll += 4;
            else w2_Coll += 5; 
        });
        
        // 3. Melee (High)
        let w3_Melee = 0;
        content.melee.forEach(k => {
            const isHot = DELTA_HOT_ITEMS.some(h => k.includes(h));
            w3_Melee += isHot ? 12 : 5; 
        });

        // 4. Assets (Split Logic: 10M / 200W)
        let w4_Assets = 0;
        if (content.assetsM > 0) {
            // 10M chunk
            w4_Assets += Math.max(1, content.assetsM / 10) * 1.5; 
        }
        if (content.assetsW > 0) {
             // 200W chunk
             w4_Assets += Math.max(1, content.assetsW / 200) * 0.8;
        }
        
        // 5. Safe Box (Premium Priority)
        let w5_SafeBox = 0;
        content.safeBox.forEach(k => {
            if (k.includes('3x3') || k.includes('S7顶级')) w5_SafeBox += 20; // High value anchor
            else if (k.includes('2x3')) w5_SafeBox += 8;
            else w5_SafeBox += 2;
        });

        // 6. Infrastructure (Low/Medium)
        let w6_Infra = 0;
        content.infra.forEach(k => {
            if (k.includes('满级') || k.includes('Lv.10')) w6_Infra += 3;
            else w6_Infra += 1;
        });

        // 7. Legendary Charms (New, Low/Medium)
        let w7_Charms = 0;
        content.charms.forEach(k => {
            w7_Charms += 3;
        });
        
        const totalWeight = w1_Ops + w2_Coll + w3_Melee + w4_Assets + w5_SafeBox + w6_Infra + w7_Charms;
        if (totalWeight === 0) return; 
        
        const baseUnitValue = item.price / totalWeight;
        
        // --- DISTRIBUTION PHASE ---
        
        // 1. Ops
        if (content.ops.length > 0) {
            content.ops.forEach(key => {
                const isHot = DELTA_HOT_ITEMS.some(h => key.includes(h));
                const rate = baseUnitValue * (isHot ? 15 : 6);
                addToAccumulator(key, rate);
            });
        }
        // 2. Collection
        if (content.collections.length > 0) {
             content.collections.forEach(key => {
                let m = 5;
                if (key.includes('极品S')) m = 30;
                else if (key.includes('极品A')) m = 15;
                else if (key.includes('极品B')) m = 8;
                else if (key.includes('极品C')) m = 4;
                addToAccumulator(key, baseUnitValue * m);
             });
        }
        // 3. Melee
        if (content.melee.length > 0) {
            content.melee.forEach(key => {
                const isHot = DELTA_HOT_ITEMS.some(h => key.includes(h));
                addToAccumulator(key, baseUnitValue * (isHot ? 12 : 5));
            });
        }
        // 4. Assets
        if (content.assetsM > 0) {
             // Price per 1M based on 10M chunk weight
             const weightChunk = Math.max(1, content.assetsM / 10) * 1.5;
             const totalAssetVal = baseUnitValue * weightChunk;
             const pricePer1M = totalAssetVal / content.assetsM;
             if (pricePer1M > 0.1 && pricePer1M < 10) addToAccumulator('asset_total_m', pricePer1M);
        }
        if (content.assetsW > 0) {
             const weightChunk = Math.max(1, content.assetsW / 200) * 0.8;
             const totalAssetVal = baseUnitValue * weightChunk;
             const pricePer1W = totalAssetVal / content.assetsW;
             if (pricePer1W > 0.001 && pricePer1W < 5) addToAccumulator('currency_havoc_w', pricePer1W);
        }
        // 5. Safe Box
        if (content.safeBox.length > 0) {
            content.safeBox.forEach(key => {
                let m = 2;
                if (key.includes('3x3')) m = 20;
                else if (key.includes('2x3')) m = 8;
                addToAccumulator(key, baseUnitValue * m);
            });
        }
        // 6. Infra
        if (content.infra.length > 0) {
            content.infra.forEach(key => {
                let m = 1;
                if (key.includes('满级') || key.includes('Lv.10')) m = 3;
                addToAccumulator(key, baseUnitValue * m);
            });
        }
        // 7. Charms
        if (content.charms.length > 0) {
            content.charms.forEach(key => {
                addToAccumulator(key, baseUnitValue * 3);
            });
        }
    });

    const trends: ItemTrend[] = [];
    const risks: { item: string, reason: string, level: RiskLevel }[] = [];
    
    Object.keys(rateAccumulator).forEach(key => {
        const { totalValue, count } = rateAccumulator[key];
        const avgValue = totalValue / count;
        let finalPrice = 0;
        
        if (key === 'asset_total_m' || key === 'currency_havoc_w') {
            finalPrice = parseFloat(avgValue.toFixed(3));
        } else {
            finalPrice = Math.round(avgValue);
        }
        
        newRates[key] = finalPrice;
        
        const oldPrice = oldRates[key] || 0;
        const name = key.includes(':') ? key.split(':')[1] : key;
        if (oldPrice > 0 && Math.abs(finalPrice - oldPrice) > (oldPrice * 0.05)) {
             const changePercent = ((finalPrice - oldPrice) / oldPrice) * 100;
             trends.push({ key, name, oldPrice, newPrice: finalPrice, changePercent, direction: changePercent > 0 ? 'up' : 'down', sampleSize: count });
             if (changePercent < -20 && count > 5) {
                 risks.push({ item: name, reason: `权重占比下降，市场估值回调 (${changePercent.toFixed(0)}%)`, level: 'high' });
             }
        }
    });
    
    trends.sort((a,b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    const upCount = trends.filter(t => t.direction === 'up').length;
    const downCount = trends.filter(t => t.direction === 'down').length;
    let sentiment: MarketReport['marketSentiment'] = 'neutral';
    if (upCount > downCount * 1.2) sentiment = 'bullish';
    if (downCount > upCount * 1.2) sentiment = 'bearish';
    
    let conclusion = `本次脑裂变周期启用【7层动态资产权重】算法，共分析 ${allData.length} 条样本。`;
    if (sentiment === 'bullish') conclusion += " 稀缺资产（S级典藏/红狼）溢价能力坚挺，市场处于上升通道。";
    else if (sentiment === 'bearish') conclusion += " 受大额资产账号影响，皮肤类资产溢价空间被压缩，价格回归理性。";
    else conclusion += " 市场权重分配趋于平衡，硬通货与稀缺品价格相对稳定。";
    
    const report: MarketReport = {
        id: `R_${Date.now()}`,
        date: new Date().toISOString(),
        gameName,
        totalSamplesAnalyzed: allData.length,
        marketSentiment: sentiment,
        volatilityIndex: Math.min(100, trends.length * 2),
        topGainers: trends.filter(t => t.direction === 'up').slice(0, 3),
        topLosers: trends.filter(t => t.direction === 'down').slice(0, 3),
        riskFactors: risks,
        conclusion
    };
    
    this.saveReport(report);
    return { ...currentMatrix, rates: newRates, lastUpdated: new Date().toISOString() };
  }

  private parseRecordContent(desc: string, gameConfig: GameField[]) {
      const result = {
          ops: [] as string[],
          collections: [] as string[],
          melee: [] as string[],
          assetsM: 0,
          assetsW: 0,
          safeBox: [] as string[],
          infra: [] as string[],
          charms: [] as string[]
      };
      const descNorm = this.normalizeForMatch(desc);
      result.assetsM = this.extractNumericValue(desc, 'asset_total_m');
      result.assetsW = this.extractNumericValue(desc, 'currency_havoc_w');
      
      gameConfig.forEach(field => {
          if (!field.options) return;
          field.options.forEach(opt => {
              if (field.key === 'collection_weapon') {
                  // Special check for base weapon match + quality
                  DELTA_COLLECTION_WEAPONS_BASE.forEach(baseWep => {
                      if (this.isSimilar(descNorm, this.normalizeForMatch(baseWep))) {
                          let foundQ = false;
                          DELTA_QUALITIES.forEach(q => {
                              if (descNorm.includes(this.normalizeForMatch(q))) {
                                  result.collections.push(`${field.key}:${baseWep}(${q})`);
                                  foundQ = true;
                              }
                          });
                          if (!foundQ && opt === baseWep) { 
                              result.collections.push(`${field.key}:${baseWep}(极品C)`); 
                          }
                      }
                  });
              } else {
                  // Standard matching
                  const searchTerms = this.getSearchTerms(opt, field.key);
                  if (searchTerms.some(t => descNorm.includes(t))) {
                      const rateKey = `${field.key}:${opt}`;
                      if (field.key === 'operator_skins' || field.key.includes('god_suit')) {
                          result.ops.push(rateKey);
                      } else if (field.key === 'melee_skins' || field.key.includes('knife')) {
                          result.melee.push(rateKey);
                      } else if (field.key === 'safe_box') {
                          result.safeBox.push(rateKey);
                      } else if (field.group === '特勤处' || field.key.includes('infra')) {
                          result.infra.push(rateKey);
                      } else if (field.key === 'legendary_charms') {
                          result.charms.push(rateKey);
                      } else if (field.key.includes('bundle')) {
                          result.collections.push(rateKey); // Bundles fall into collections for general weight
                      }
                  }
              }
          });
      });
      return result;
  }

  private isSimilar(source: string, target: string) {
      return source.includes(target) || target.includes(source);
  }

  private getSearchTerms(option: string, key: string): string[] {
      const norm = this.normalizeForMatch(option);
      const terms = [norm];
      if (option.includes('-')) {
          const parts = option.split('-');
          if (parts.length > 1) terms.push(this.normalizeForMatch(parts[parts.length-1]));
      }
      const prefixes = ['近战', '典藏', '外观', '皮肤', '红狼', '骇爪', '露娜', '威龙', '蜂医', '牧羊人', '乌鲁鲁', '挂饰', '突击步枪', '战斗步枪', '冲锋枪'];
      let noPrefix = option;
      prefixes.forEach(p => noPrefix = noPrefix.replace(p, ''));
      const cleanName = this.normalizeForMatch(noPrefix);
      if (cleanName.length >= 2) terms.push(cleanName);
      return terms; 
  }

  private normalizeForMatch(str: string): string {
      if(!str) return "";
      return str.toLowerCase().replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
  }

  private extractNumericValue(desc: string, key: string): number {
      const isM = key.includes('_m') || key.includes('asset');
      const isW = key.includes('_w') || key.includes('coin') || key.includes('ticket');
      if (isM) {
          const m = desc.match(/(\d+(\.\d+)?)[\s]*(m|M|亿)/i);
          if (m) return parseFloat(m[1]) * (m[3] === '亿' ? 100 : 1);
      } else if (isW) {
           const m = desc.match(/(\d+(\.\d+)?)[\s]*(w|W|万)/i);
           if (m) return parseFloat(m[1]);
      } else if (key === 'v_weapon_count') {
          const m = desc.match(/(\d+)[\s]*(V|英雄)/i);
          if (m) return parseFloat(m[1]);
      } else if (key === 'skin_count') {
          const m = desc.match(/(\d+)[\s]*(皮|skin)/i);
          if (m) return parseFloat(m[1]);
      }
      return 0;
  }
  
  getPriceRules(gameName?: string): PriceRule[] {
    try { const stored = localStorage.getItem(STORAGE_KEYS.RULES); let rules: PriceRule[] = stored ? JSON.parse(stored) : []; if (gameName) { return rules.filter(r => r.gameName === gameName); } return rules; } catch (e) { return []; }
  }
  savePriceRules(rules: PriceRule[]) { localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules)); }
  getInternalReferences(gameName?: string, type?: 'listing' | 'sold'): InternalReference[] {
    try { const stored = localStorage.getItem(STORAGE_KEYS.REFS); let refs: InternalReference[] = stored ? JSON.parse(stored) : []; if (gameName) refs = refs.filter(r => r.gameName === gameName); if (type) refs = refs.filter(r => (r.type || 'listing') === type); return refs; } catch (e) { return []; }
  }
  saveInternalReferences(refs: InternalReference[]) { localStorage.setItem(STORAGE_KEYS.REFS, JSON.stringify(refs)); }
  getLearningLogs(): LearningLog[] {
    try { const stored = localStorage.getItem(STORAGE_KEYS.LOGS); return stored ? JSON.parse(stored) : []; } catch { return []; }
  }
  getTodayStats(): { listing: number, sold: number, valuation: number } {
    const today = new Date().toISOString().split('T')[0];
    const logs = this.getLearningLogs();
    const entry = logs.find(l => l.date === today);
    return { listing: entry?.listingLearnCount || 0, sold: entry?.soldLearnCount || 0, valuation: entry?.valuationCount || 0 };
  }
  incrementLearningCount(amount: number, type: 'listing' | 'sold') {
    const today = new Date().toISOString().split('T')[0];
    let logs = this.getLearningLogs();
    const idx = logs.findIndex(l => l.date === today);
    if (idx >= 0) { if (type === 'listing') logs[idx].listingLearnCount = (logs[idx].listingLearnCount || 0) + amount; else logs[idx].soldLearnCount = (logs[idx].soldLearnCount || 0) + amount; } else { logs.push({ date: today, listingLearnCount: type === 'listing' ? amount : 0, soldLearnCount: type === 'sold' ? amount : 0, valuationCount: 0 }); }
    this.saveLogs(logs);
  }
  incrementValuationCount() {
    const today = new Date().toISOString().split('T')[0];
    let logs = this.getLearningLogs();
    const idx = logs.findIndex(l => l.date === today);
    if (idx >= 0) { logs[idx].valuationCount = (logs[idx].valuationCount || 0) + 1; } else { logs.push({ date: today, listingLearnCount: 0, soldLearnCount: 0, valuationCount: 1 }); }
    this.saveLogs(logs);
  }
  
  logValuationAction(user: User | null, gameName: string, resultPrice: number) {
      const logs = this.getActionLogs();
      const randomLocs = ["北京", "上海", "广州", "深圳", "成都", "杭州", "武汉", "海外"];
      const loc = randomLocs[Math.floor(Math.random() * randomLocs.length)];
      
      const newLog: ValuationActionLog = {
          id: `log_${Date.now()}_${Math.random()}`,
          userId: user?.id || 'guest',
          username: user?.username || 'Guest',
          role: user?.role || 'guest',
          gameName,
          location: loc,
          timestamp: new Date().toISOString(),
          resultPrice
      };
      
      const updatedLogs = [newLog, ...logs].slice(0, 2000);
      localStorage.setItem(STORAGE_KEYS.ACTION_LOGS, JSON.stringify(updatedLogs));
  }

  getActionLogs(): ValuationActionLog[] {
      try { const stored = localStorage.getItem(STORAGE_KEYS.ACTION_LOGS); return stored ? JSON.parse(stored) : []; } catch { return []; }
  }

  getRefsByTimeFrame(gameName: string, timeFrame: TimeFrame, type: 'sold'|'listing'): InternalReference[] {
      const refs = this.getInternalReferences(gameName, type);
      const now = new Date();
      return refs.filter(r => {
          const d = new Date(r.date);
          const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
          if (timeFrame === 'day') return diffDays < 1;
          if (timeFrame === 'week') return diffDays < 7;
          if (timeFrame === 'month') return diffDays < 30;
          if (timeFrame === 'quarter') return diffDays < 90;
          if (timeFrame === 'year') return diffDays < 365;
          return true;
      });
  }

  private saveLogs(logs: LearningLog[]) { if (logs.length > 30) logs = logs.slice(logs.length - 30); localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs)); }
  resetDefaults() { localStorage.removeItem(STORAGE_KEYS.CONFIGS); localStorage.removeItem(STORAGE_KEYS.MATRIX); localStorage.removeItem(STORAGE_KEYS.REPORTS); localStorage.removeItem(STORAGE_KEYS.INSIGHTS); }
}

export const dataService = new DataService();