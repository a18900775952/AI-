
export interface ValuationRequest {
  gameName: string;
  platform: string;
  server: string;
  description: string;
  [key: string]: string; 
}

export interface ValuationResponse {
  currency: string;
  
  pricingModel: {
    ruleBasedPrice: number;     
    learnedMarketPrice: number; 
    generalAiPrice: number;     
    finalPriceLow: number;      
    finalPriceHigh: number;
    componentBreakdown?: {
        assetsValue: number;
        skinValue: number;
        infrastructureValue: number;
        extraValue: number;
        rawTotal: number;
        realNameDiscount: number;
    };
  };

  recyclingPrice: number;       
  profitMargin: string;         

  summary: string;
  
  liquidityScore: number; 
  safetyScore: number;    
  originalValueEstimate?: number; 
  
  valuationSplit?: {
    baseAccountValue: number; 
    skinPremiumValue: number; 
    rankPremiumValue?: number; 
  };

  avgTransactionDay?: number; 

  positiveFactors: string[];
  negativeFactors: string[];
  sellingTips: string;
  agentScript: string;
  
  inputParams?: Record<string, string>;

  matchedReferences?: {
    description: string;
    price: number;
    similarity: number; 
    source: string;
    date: string;
    type: 'listing' | 'sold'; 
  }[];
}

export interface PricingMatrix {
  gameName: string;
  rates: Record<string, number>; 
  realNameDiscount: number; 
  lastUpdated?: string;
}

// --- NEW BRAIN TYPES ---
export type TrendDirection = 'up' | 'down' | 'stable';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TimeFrame = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface ItemTrend {
  key: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  direction: TrendDirection;
  sampleSize: number;
}

export interface MarketReport {
  id: string;
  date: string;
  gameName: string;
  totalSamplesAnalyzed: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral'; // 市场情绪
  volatilityIndex: number; // 波动指数 (0-100)
  
  topGainers: ItemTrend[]; // 领涨
  topLosers: ItemTrend[];  // 领跌
  
  riskFactors: {
    item: string;
    reason: string;
    level: RiskLevel;
  }[];

  conclusion: string; // AI 总结建议
}

export interface AILearningInsight {
  id: string;
  date: string;
  gameName: string;
  batchSize: number;
  dataType: 'listing' | 'sold';
  insight: string; // AI's thought process/summary of the data
  keyPatterns: string[]; // e.g. ["M4A1 Price Up", "Havoc Coin Depreciated"]
}

export const OPERATING_SYSTEMS = ["Android", "iOS", "PC", "PS5/Xbox", "Switch"];
export const SERVERS = ["官方服务器", "渠道服", "微信区", "QQ区", "国际服"];

export type FieldType = 'text' | 'number' | 'select' | 'multiselect';

export interface GameField {
  key: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  options?: string[];
  group?: string;
}

export type RuleType = 'fixed' | 'add' | 'subtract' | 'multiply' | 'divide';

export interface PriceRule {
  id: string;
  gameName: string;
  fieldKey: string;     // CHANGED: Made mandatory
  matchValue?: string;  // Option name or '*' for numbers
  keyword: string;      // Description
  price: number;        // The value to add/sub/mul/div
  type: RuleType;  
  note?: string;   
}

export interface InternalReference {
  id: string;
  gameName: string;
  description: string; 
  price: number;       
  date: string;
  source?: string;
  type: 'listing' | 'sold'; 
}

export interface LearningLog {
  date: string;
  listingLearnCount: number; 
  soldLearnCount: number;
  valuationCount: number; 
}

// NEW: Detailed User Action Log
export interface ValuationActionLog {
  id: string;
  userId: string;
  username: string;
  role: string;
  gameName: string;
  location: string; // Simulated IP Location
  timestamp: string; // ISO String
  resultPrice: number;
}

export type GameConfigMap = Record<string, GameField[]>;

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string; 
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
}
