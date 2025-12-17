
export type Language = 'cn' | 'en';

export const translations = {
  cn: {
    // Auth
    authTitle: "玄鹿AI",
    authSubtitle: "安全访问网关",
    identity: "用户身份",
    passcode: "访问密钥",
    loginBtn: "初始化会话",
    registerBtn: "注册新身份",
    createId: "创建新访问 ID",
    returnLogin: "返回登录",
    loginFailed: "认证失败",
    regSuccess: "注册成功，请登录",
    
    // Nav
    appTitle: "PZ 估值终端",
    navValuation: "估价",
    navUpdates: "更新",
    navContact: "联系",
    navDashboard: "仪表盘",
    logout: "登出",

    // Main
    systemReady: "系统就绪",
    systemReadyDesc: "请选择左侧属性开始估值。",
    visionTitle: "视觉中枢",
    visionDesc: "上传库存截图自动识别",
    visionProcessing: "DeepSeek 视觉分析中...",
    visionIdentified: (count: number) => `AI 已识别 ${count} 个属性`,
    uploadBtn: "上传图像",
    reUploadBtn: "重新上传",
    
    // Form
    reset: "重置",
    initiate: "启动估值",
    calculating: "计算中...",
    module: "模块",
    next: "下一步",
    aiSelected: "AI 自动选择",

    // Result
    tripleTrack: "三轨验证完成",
    estimatedValue: "市场估价",
    recyclingPrice: "建议回收价",
    liquidity: "流通性",
    safety: "安全指数",
    riskAlert: "高风险预警",
    riskDesc: "检测到潜在欺诈风险（死绑/脚本/找回），价格已做风控折抵。",
    copyScript: "复制话术",
    exportCert: "导出证书",
    assetProfile: "资产画像",
    rulePrice: "规则定价",
    aiPrice: "AI 学习定价",
    
    // Dashboard
    dailyStats: "今日数据概览",
    brainCore: "核心大脑",
    statusOnline: "在线",
    calibrate: "启动脑裂变",
    marketMovers: "市场风向标",
    topGainers: "领涨",
    topLosers: "领跌",
    sentiment: "市场情绪",
    knowledgeBase: "知识库",
    users: "用户权限",
    config: "参数配置",
    ruleEngine: "规则引擎",
    learning: "深度学习",
    
    // Footer/Misc
    contactUs: "联系我们",
    business: "商务合作",
    techSupport: "技术支持",
    systemUpdates: "系统更新",
    aboutTitle: "关于系统",
    aboutDesc: "由 SiliconFlow 提供算力支持 (DeepSeek V3.2 推理 + Qwen2-VL 视觉)。集成 OCR 视觉中枢、商业风控雷达及动态定价矩阵。"
  },
  en: {
    // Auth
    authTitle: "XUANLU AI",
    authSubtitle: "SECURE ACCESS GATEWAY",
    identity: "IDENTITY",
    passcode: "PASSCODE",
    loginBtn: "INITIALIZE SESSION",
    registerBtn: "REGISTER IDENTITY",
    createId: "Create New Access ID",
    returnLogin: "Return to Login",
    loginFailed: "Authentication Failed",
    regSuccess: "Registration Success",

    // Nav
    appTitle: "PZ TERMINAL",
    navValuation: "VALUATION",
    navUpdates: "UPDATES",
    navContact: "CONTACT",
    navDashboard: "DASHBOARD",
    logout: "LOGOUT",

    // Main
    systemReady: "SYSTEM READY",
    systemReadyDesc: "Select attributes to begin valuation.",
    visionTitle: "Vision Center",
    visionDesc: "Upload inventory screenshot for auto-fill.",
    visionProcessing: "DeepSeek Vision Processing...",
    visionIdentified: (count: number) => `AI Identified ${count} attributes`,
    uploadBtn: "UPLOAD IMAGE",
    reUploadBtn: "RE-UPLOAD",

    // Form
    reset: "RESET",
    initiate: "INITIATE",
    calculating: "CALCULATING...",
    module: "MODULE",
    next: "NEXT",
    aiSelected: "AI SELECTED",

    // Result
    tripleTrack: "TRIPLE-TRACK VERIFIED",
    estimatedValue: "Estimated Value",
    recyclingPrice: "Recycling Price",
    liquidity: "Liquidity",
    safety: "Safety Index",
    riskAlert: "RISK ALERT",
    riskDesc: "Potential fraud detected (Dead bind/Script). Price penalized.",
    copyScript: "COPY SCRIPT",
    exportCert: "EXPORT CERT",
    assetProfile: "Asset Profile",
    rulePrice: "Rule-Based Price",
    aiPrice: "AI Learned Price",

    // Dashboard
    dailyStats: "Daily Stats",
    brainCore: "BRAIN CORE",
    statusOnline: "ONLINE",
    calibrate: "CALIBRATE",
    marketMovers: "Market Movers",
    topGainers: "Top Gainers",
    topLosers: "Top Losers",
    sentiment: "Market Sentiment",
    knowledgeBase: "Knowledge Base",
    users: "Users",
    config: "Config",
    ruleEngine: "Rule Engine",
    learning: "Deep Learning",

    // Footer/Misc
    contactUs: "Contact Us",
    business: "Business",
    techSupport: "Tech Support",
    systemUpdates: "System Updates",
    aboutTitle: "About System",
    aboutDesc: "Powered by SiliconFlow (DeepSeek V3.2 Reasoning + Qwen2-VL Vision). Features OCR Vision, Risk Radar, and Dynamic Pricing Matrices."
  }
};