import { ValuationRequest, ValuationResponse, InternalReference, PriceRule, PricingMatrix, AILearningInsight } from "../types.ts";
import { dataService } from "./dataService.ts";
import { z } from "zod";

// --- CORE CONFIG ---
// ⚠️ Using provided key directly. 
// In a production build, move this to .env (VITE_API_KEY) and access via import.meta.env
const API_KEY = "sk-uoguaxddmllrlroufcadqmassrhpmvtgawhmmrcfbtvirmvi"; 
const BASE_URL = "https://api.siliconflow.cn/v1/chat/completions";

// --- MODEL SELECTION ---
// Logic/Text: DeepSeek V3 (The latest flagship, very cheap/free on SiliconFlow)
const MODEL_TEXT = "deepseek-ai/DeepSeek-V3";

// Vision: Qwen2-VL-72B-Instruct
// Status: Flagship Vision Model from Qwen team.
// Note: Switched from 7B to 72B to avoid "Model does not exist" (400) errors, 
// as 72B is the primary stable endpoint on SiliconFlow.
const MODEL_VISION = "Qwen/Qwen2-VL-72B-Instruct";

// --- ZOD SCHEMAS ---
const ValuationSchema = z.object({
    currency: z.string().default("CNY"),
    pricingModel: z.object({
        ruleBasedPrice: z.number(),
        learnedMarketPrice: z.number(),
        generalAiPrice: z.number().optional(),
        finalPriceLow: z.number(),
        finalPriceHigh: z.number(),
        componentBreakdown: z.any().optional(),
    }),
    recyclingPrice: z.number(),
    profitMargin: z.string().default("15-25%"),
    summary: z.string().default("No detailed summary provided."),
    liquidityScore: z.number(),
    safetyScore: z.number(),
    positiveFactors: z.array(z.string()).default([]),
    negativeFactors: z.array(z.string()).default([]),
    sellingTips: z.string().default("Check market trends."),
    agentScript: z.string().default(""),
    inputParams: z.any().optional(),
    matchedReferences: z.array(z.any()).optional(),
}).passthrough();

// --- UTILS ---

/**
 * Enhanced JSON Cleaner for LLM Outputs
 * Can extract JSON objects even if buried in conversational text.
 */
function cleanJsonString(text: string): string {
  if (!text) return "{}";
  
  // 1. Remove Markdown code blocks
  let clean = text.replace(/```json/gi, '').replace(/```/g, '');
  
  // 2. Find the first '{' and the last '}' to strip conversational intros/outros
  const firstOpen = clean.indexOf('{');
  const lastClose = clean.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    clean = clean.substring(firstOpen, lastClose + 1);
  }
  
  // 3. Remove common trailing comma errors which break JSON.parse
  clean = clean.replace(/,\s*}/g, '}');
  clean = clean.replace(/,\s*]/g, ']');

  return clean.trim();
}

function normalizeString(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
}

function removeAdminNoise(text: string): string {
    return text.replace(/QQ|微信|登录|实名|二次|身份证|找回|包赔|签署|协议|死绑|三无|单绑/gi, "");
}

// --- API CLIENT (OPENAI COMPATIBLE) ---

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

/**
 * Call SiliconFlow API via standard HTTP fetch
 */
async function callSiliconFlowAPI(messages: ChatMessage[], model: string, jsonMode: boolean = true): Promise<string> {
    if (!API_KEY) {
        console.error("Missing API_KEY.");
        throw new Error("API_KEY_MISSING");
    }

    const headers = {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
    };

    const body: any = {
        model: model,
        messages: messages,
        temperature: 0.1, // Low temperature for precise analytical results
        max_tokens: 4096,
        stream: false
    };

    // DeepSeek V3 supports JSON mode
    // Qwen2-VL generally follows instructions well, disabling forced json_object for safety
    if (jsonMode && model.includes("DeepSeek")) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("SiliconFlow API Error:", response.status, errorText);
        
        // Handle Rate Limits specifically
        if (response.status === 429) {
            throw new Error("API_QUOTA_EXCEEDED");
        }
        if (response.status === 401) {
            throw new Error("API_KEY_INVALID");
        }
        // Pass through specific error code if possible
        throw new Error(`API Request Failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

/**
 * Robust retry mechanism with exponential backoff
 */
async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 4000
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        const errStr = JSON.stringify(error);
        const isRateLimit = 
            error?.message?.includes("429") || 
            error?.message?.includes("QUOTA") ||
            errStr.includes("429") || 
            errStr.includes("API_QUOTA_EXCEEDED");
        
        const isAuthError = error?.message?.includes("401") || error?.message?.includes("INVALID");
        
        // 400 Errors (Model not found, etc) should not be retried as they are permanent config errors
        const isBadRequest = error?.message?.includes("400") || errStr.includes("Model does not exist");

        if (isAuthError || isBadRequest) {
             console.error("Critical API Error (Auth or Config). No retry.", error);
             throw error; 
        }
        
        if (retries <= 0) {
            if (isRateLimit) {
                console.error("SiliconFlow Quota Exceeded:", error);
                throw new Error("API_QUOTA_EXCEEDED");
            }
            throw error;
        }

        // Wait longer if it's a rate limit error
        const waitTime = isRateLimit ? Math.max(delay, 8000) : delay;
        console.warn(`AI Op failed (${isRateLimit ? 'QUOTA' : 'ERR'}), retrying in ${waitTime}ms...`, error);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return retryWithBackoff(operation, retries - 1, delay * 1.5);
    }
}

// --- VALUATION ENGINES ---

function calculateComponentValue(request: ValuationRequest, matrix: PricingMatrix) {
    let assetsValue = 0;
    let skinValue = 0;
    let infrastructureValue = 0;
    let extraValue = 0;

    const getRate = (key: string, option: string): number => {
        const exactKey = `${key}:${option}`;
        if (matrix.rates[exactKey] !== undefined) return matrix.rates[exactKey];
        const normOpt = normalizeString(option);
        let bestMatch = Object.keys(matrix.rates).find(rateKey => {
            if (!rateKey.startsWith(key + ':')) return false;
            const rateOpt = rateKey.split(':')[1];
            return normalizeString(rateOpt) === normOpt;
        });
        if (!bestMatch) {
             const parts = option.split('-');
             const suffix = parts.length > 1 ? parts[parts.length-1] : option;
             const normSuffix = normalizeString(suffix);
             bestMatch = Object.keys(matrix.rates).find(rateKey => {
                if (!rateKey.startsWith(key + ':')) return false;
                const rateOpt = rateKey.split(':')[1];
                const rateNorm = normalizeString(rateOpt);
                return rateNorm.includes(normSuffix) || normSuffix.includes(rateNorm);
             });
        }
        return bestMatch ? matrix.rates[bestMatch] : 0;
    };

    Object.keys(request).forEach(key => {
        const value = request[key];
        if (!value) return;
        if (matrix.rates[key] !== undefined && !isNaN(parseFloat(value))) {
            let numericVal = parseFloat(value);
            assetsValue += numericVal * matrix.rates[key];
        } 
        else if (typeof value === 'string') {
            const options = value.split(',').map(s => s.trim()).filter(Boolean);
            options.forEach(opt => {
                const price = getRate(key, opt);
                if (price > 0) {
                    if (key.includes('skin') || key.includes('suit') || key.includes('god') || key.includes('collection') || key.includes('charm')) skinValue += price;
                    else if (key.includes('infra') || key.includes('safe_box')) infrastructureValue += price;
                    else extraValue += price;
                } else {
                    if ((key.includes('skin') || key.includes('suit')) && !key.includes('count')) {
                         skinValue += 10; 
                    }
                }
            });
        }
    });

    let rawTotal = assetsValue + skinValue + infrastructureValue + extraValue;
    let discount = 1;
    if (request.real_name_status && request.real_name_status.includes('不可')) {
        discount = matrix.realNameDiscount;
    }

    return {
        assetsValue,
        skinValue,
        infrastructureValue,
        extraValue,
        rawTotal,
        realNameDiscount: discount,
        finalCalculated: rawTotal * discount
    };
}

function calculateSimilarity(request: ValuationRequest, refDescription: string): number {
  const cleanRef = removeAdminNoise(refDescription);
  const descNorm = normalizeString(cleanRef); 
  const descRaw = cleanRef.toLowerCase();
  let scoreSum = 0;
  let weightSum = 0;
  Object.keys(request).forEach(k => {
      const val = request[k];
      if (!val || k === 'gameName' || k === 'platform' || k === 'description') return;
      if (k.includes('skin') || k.includes('suit') || k.includes('collection') || k.includes('bundle')) {
          const w = 30; weightSum += w;
          const list = val.split(',');
          let hits = 0;
          list.forEach((item: string) => { 
              if (descNorm.includes(normalizeString(item))) hits += 1.2; 
          });
          if (list.length > 0) scoreSum += Math.min(1, hits / list.length) * w;
      }
      else if (k.includes('asset') || k.includes('balance') || k.includes('ticket')) {
          const w = 15; weightSum += w;
          if (descRaw.match(/\d/)) scoreSum += w * 0.5;
      }
  });
  if (weightSum === 0) return 0;
  return scoreSum / weightSum;
}

export async function evaluateGameAsset(request: ValuationRequest): Promise<ValuationResponse> {
  const soldRefs = dataService.getInternalReferences(request.gameName, 'sold');
  const matrix = dataService.getPricingMatrix(request.gameName);
  const marketCalc = calculateComponentValue(request, matrix);
  const learnedMarketPrice = Math.round(marketCalc.finalCalculated);
  const ruleBasedPrice = dataService.calculateRuleBasedPrice(request);
  const soldMatches = soldRefs.map(r => ({ ref: r, score: calculateSimilarity(request, r.description) }))
                              .filter(m => m.score >= 0.35) 
                              .sort((a, b) => b.score - a.score);
  
  let anchorPrice = 0;
  let anchorRef: any = null;
  if (soldMatches.length > 0) {
      anchorRef = soldMatches[0].ref;
      anchorPrice = anchorRef.price;
  }

  // DEEPSEEK SYSTEM PROMPT
  const systemPrompt = `Role: Senior Game Asset Auditor & Risk Analyst.
Task: Validate price for '${request.gameName}' and detect fraud risks.

【Hard Data】
- Rule Price: ¥${ruleBasedPrice}
- AI Matrix Price: ¥${learnedMarketPrice}
- User Desc: ${JSON.stringify(request)}

【Market Comp】
- Best Match: ¥${anchorPrice} (Sim: ${soldMatches[0]?.score.toFixed(2) || 0})

【Instructions】
1. Base Price: Use Rule Price (¥${ruleBasedPrice}) as baseline.
2. Risk Check: Scan for keywords: '死绑' (Dead Bind), '脚本' (Script), '毁号' (Destroyed), '找回' (Recovered).
   - If found: Risk=High, SafetyScore < 40, Final Price = Final Price * 0.6.
   - If '可二次实名': SafetyScore +20.
3. Output ONLY standard JSON format with the following structure:
{
  "currency": "CNY",
  "pricingModel": {
    "ruleBasedPrice": number,
    "learnedMarketPrice": number,
    "generalAiPrice": number,
    "finalPriceLow": number,
    "finalPriceHigh": number
  },
  "recyclingPrice": number,
  "profitMargin": "15-25%",
  "summary": "Short analysis summary...",
  "liquidityScore": number (1-10),
  "safetyScore": number (1-100),
  "positiveFactors": ["factor1", "factor2"],
  "negativeFactors": ["factor1", "factor2"],
  "sellingTips": "Tips for selling...",
  "agentScript": "Script for agent..."
}`;

  return retryWithBackoff(async () => {
      const messages: ChatMessage[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze and return JSON." }
      ];

      const content = await callSiliconFlowAPI(messages, MODEL_TEXT, true);
      const rawJson = JSON.parse(cleanJsonString(content || "{}"));
      
      // Safety checks for partial JSON
      if (!rawJson.pricingModel) rawJson.pricingModel = { finalPriceLow: 0, finalPriceHigh: 0, ruleBasedPrice: 0, learnedMarketPrice: 0 };
      if (!rawJson.recyclingPrice) rawJson.recyclingPrice = 0;
      if (!rawJson.liquidityScore) rawJson.liquidityScore = 5;
      if (!rawJson.safetyScore) rawJson.safetyScore = 80;

      // Ensure defaults for required fields in ValuationResponse
      rawJson.currency = rawJson.currency || "CNY";
      rawJson.profitMargin = rawJson.profitMargin || "15-25%";
      rawJson.summary = rawJson.summary || "AI Analysis Completed.";
      rawJson.positiveFactors = Array.isArray(rawJson.positiveFactors) ? rawJson.positiveFactors : [];
      rawJson.negativeFactors = Array.isArray(rawJson.negativeFactors) ? rawJson.negativeFactors : [];
      rawJson.sellingTips = rawJson.sellingTips || "No specific selling tips.";
      rawJson.agentScript = rawJson.agentScript || "";

      // ZOD VALIDATION
      const resJson = ValuationSchema.parse(rawJson);
      
      resJson.pricingModel.ruleBasedPrice = ruleBasedPrice;
      resJson.pricingModel.learnedMarketPrice = learnedMarketPrice;
      resJson.pricingModel.componentBreakdown = marketCalc; 
      
      let effectivePrice = resJson.pricingModel.generalAiPrice || ruleBasedPrice;
      if (anchorPrice > 0 && soldMatches[0]?.score > 0.8) {
         effectivePrice = (ruleBasedPrice * 0.4) + (anchorPrice * 0.6);
      } else {
         effectivePrice = (ruleBasedPrice * 0.7) + (learnedMarketPrice * 0.3);
      }
      
      // Risk Penalty
      if (resJson.safetyScore < 50) {
          effectivePrice = effectivePrice * 0.7;
      }

      effectivePrice = Math.round(effectivePrice);
      resJson.pricingModel.finalPriceLow = effectivePrice;
      resJson.pricingModel.finalPriceHigh = Math.round(effectivePrice * 1.15);
      resJson.recyclingPrice = Math.floor(effectivePrice * 0.75);
      
      if (resJson.liquidityScore === 0 || !resJson.liquidityScore) {
          resJson.liquidityScore = Math.min(10, soldMatches.length > 0 ? 8 : 4);
      }
      
      resJson.inputParams = request;
      resJson.matchedReferences = anchorRef ? [{ ...anchorRef, similarity: soldMatches[0]?.score || 0, type: 'sold' }] : [];
      
      return resJson as ValuationResponse;
  });
}

// --- INTELLIGENT EXCEL PROCESSING ---
export async function processExcelData(rawRows: any[], gameName: string, dataType: 'listing' | 'sold'): Promise<InternalReference[]> {
  // 1. Schema Matching using AI
  // We send a sample of the data (first row) to the LLM to identify which fields map to 'price' and 'description'.
  const sample = rawRows[0];
  const schemaPrompt = `
    You are a Data Mapper.
    Analyze this JSON object representing a row from an Excel file for the game "${gameName}":
    ${JSON.stringify(sample)}

    Your goal is to identify:
    1. The key that contains the PRICE (look for "price", "amount", "价格", "金额", "money").
    2. The key(s) that contain item attributes/description (look for "title", "name", "desc", "skin", "rank", "标题", "描述", "区服").

    Return valid JSON ONLY:
    {
      "priceKey": "exact_key_name_from_input_or_null",
      "descKeys": ["key1", "key2"]
    }
  `;
  
  try {
    const messages: ChatMessage[] = [{ role: "user", content: schemaPrompt }];
    // Using DeepSeek V3 for logic
    const content = await retryWithBackoff(() => callSiliconFlowAPI(messages, MODEL_TEXT, true));
    
    const map = JSON.parse(cleanJsonString(content || "{}"));
    const priceKey = map.priceKey;
    const descKeys = map.descKeys || [];

    const refs = rawRows.map(row => {
         let price = 0;
         if (priceKey && row[priceKey]) {
            // Clean currency symbols and commas
            price = parseFloat(String(row[priceKey]).replace(/[^\d.]/g,''));
         }

         // Construct description from identified keys, or fallback to all values
         let descriptionParts: string[] = [];
         if (descKeys.length > 0) {
             descKeys.forEach((k: string) => {
                 if (row[k]) descriptionParts.push(String(row[k]));
             });
         } else {
             // Fallback: Use all columns except price
             descriptionParts = Object.entries(row)
                .filter(([k, v]) => k !== priceKey)
                .map(([, v]) => String(v));
         }

         const description = descriptionParts
             .map(val => String(val).trim())
             .filter(val => val.length > 0 && !val.includes('http')) // Basic filter
             .join(' ; ');

         if (!price) return null;

         return {
             id: `X_${Date.now()}_${Math.random().toString(36).substr(2,6)}`, 
             gameName, 
             description: description.substring(0, 500), 
             price,
             date: new Date().toISOString().split('T')[0], 
             source: "ExcelImport", 
             type: dataType 
         };
    }).filter(Boolean) as InternalReference[];
    
    // Trigger matrix update asynchronously to learn from this new data
    setTimeout(() => {
        const newMatrix = dataService.autoCalibrateMatrix(gameName);
        dataService.savePricingMatrix(newMatrix);
    }, 1000);

    return refs;
  } catch (e) { 
      console.error("Excel processing failed", e);
      return []; 
  }
}

export async function bulkParseTradingData(rawText: string, gameName: string, dataType: 'listing' | 'sold'): Promise<InternalReference[]> {
    if (!rawText || rawText.length < 5) return [];

    // Reduce chunk size to avoid output token limits
    const CHUNK_SIZE = 1500;
    const textChunks = [];
    for (let i = 0; i < rawText.length; i += CHUNK_SIZE) {
        textChunks.push(rawText.substring(i, i + CHUNK_SIZE));
    }

    let allParsedItems: InternalReference[] = [];

    // UPDATED PROMPT: Request an object wrapper to satisfy JSON mode constraints
    const promptBase = `
      You are a specialized Data Extraction Engine for Game Assets.
      Task: Parse the provided RAW TEXT containing multiple item listings into a structured JSON object.
      
      Input Format:
      The text contains multiple listings. 
      Each listing usually ends with a price starting with '￥' (e.g., ￥4888).
      Example Input:
      "Item A... \n Key: Value \n ￥100 \n\n Item B... ￥200"

      Output Format (JSON Object):
      {
        "items": [
          { "d": "full description string with all attributes joined by semicolon", "p": numeric_price },
          ...
        ]
      }

      Rules:
      1. Identify distinct listings based on the price tag '￥'.
      2. Extract the numeric price into 'p'.
      3. Combine all other text belonging to that listing into 'd'.
      4. Ignore empty lines.
      5. Return valid JSON object with an "items" array.
    `;

    for (const chunk of textChunks) {
        try {
            const messages: ChatMessage[] = [
                { role: "system", content: promptBase },
                { role: "user", content: `\n--- DATA START ---\n${chunk}\n--- DATA END ---` }
            ];
            
            // Using DeepSeek V3 for bulk extraction
            const content = await retryWithBackoff(() => callSiliconFlowAPI(messages, MODEL_TEXT, true));
            const rawParsed = JSON.parse(cleanJsonString(content || "{}"));
            
            // Handle both { items: [...] } (expected) and [...] (fallback)
            let parsedArray: any[] = [];
            if (rawParsed) {
                if (Array.isArray(rawParsed)) {
                    parsedArray = rawParsed;
                } else if (Array.isArray(rawParsed.items)) {
                    parsedArray = rawParsed.items;
                } else if (Array.isArray(rawParsed.listings)) {
                    parsedArray = rawParsed.listings;
                }
            }

            const items = parsedArray.map((p:any) => ({
                id: `P_${Date.now()}_${Math.random().toString(36).substr(2,6)}`, 
                gameName, 
                description: p.d ? p.d.replace(/\n/g, ' ; ').trim() : "Unknown Item", 
                price: typeof p.p === 'number' ? p.p : 0, 
                date: new Date().toISOString().split('T')[0], 
                type: dataType
            })).filter((i: InternalReference) => i.description.length > 5 && i.price > 0);
            
            allParsedItems = [...allParsedItems, ...items];

        } catch (e) {
            console.error("Chunk parse error", e);
        }
    }
    
    return allParsedItems;
}

/**
 * 👁️ Vision Center Integration
 * Analyzes uploaded screenshot to extract game asset data.
 * Switched to Qwen2-VL-72B-Instruct per user request.
 */
export async function parseMarketImage(imageBase64: string): Promise<Partial<ValuationRequest>> {
  // Qwen VL Prompt
  const prompt = `
Role: Data Entry Clerk.
Task: Read the game screenshot and list the inventory.

REQUIRED OUTPUT FORMAT (JSON ONLY):
{
  "asset_total_m": "Number (e.g. 150)",
  "currency_havoc_w": "Number (e.g. 200)",
  "rank_level": "Rank Name",
  "safe_box": "Safe Box Name",
  "raw_content": "String containing all other item names, weapon skins, and text found in the image"
}

RULES:
1. Do not use Markdown.
2. Do not write conversational text.
3. If a value is missing, use "0" or "".
4. Put ALL miscellaneous text into "raw_content".
`;

  return retryWithBackoff(async () => {
    // Construct message with image for Qwen VL (Standard OpenAI Vision format)
    const messages: ChatMessage[] = [
        {
            role: "user",
            content: [
                { type: "text", text: prompt },
                { 
                  type: "image_url", 
                  image_url: { 
                    url: imageBase64 
                  } 
                }
            ]
        }
    ];

    // Force Vision model
    const content = await callSiliconFlowAPI(messages, MODEL_VISION, false); 
    
    console.debug("Vision Raw Output:", content); 

    try {
        const cleaned = cleanJsonString(content || "{}");
        const parsed = JSON.parse(cleaned);
        return parsed;
    } catch (e) {
        console.warn("Vision JSON Parse Failed. Falling back to Raw Content Strategy.", e);
        return {
            raw_content: content, 
            asset_total_m: "0",
            currency_havoc_w: "0"
        };
    }
  });
}

// --- NEW: Generate Learning Insight ---
export async function generateLearningInsight(newItems: InternalReference[], gameName: string, type: 'listing' | 'sold'): Promise<AILearningInsight> {
    const sampleItems = newItems.slice(0, 10).map(i => `${i.description} (¥${i.price})`).join('\n');
    const prompt = `
        Analyze this batch of new ${type} data for ${gameName}.
        Identify 3-5 key pricing trends or patterns.
        Sample Data:
        ${sampleItems}
        
        Return JSON:
        {
            "insight": "Brief summary of market changes (e.g. 'M4A1 prices rising due to scarcity').",
            "keyPatterns": ["Pattern 1", "Pattern 2"]
        }
    `;
    
    try {
        const messages: ChatMessage[] = [{ role: "user", content: prompt }];
        const content = await callSiliconFlowAPI(messages, MODEL_TEXT, true);
        const json = JSON.parse(cleanJsonString(content || "{}"));
        return {
            id: `INSIGHT_${Date.now()}`,
            date: new Date().toISOString(),
            gameName,
            batchSize: newItems.length,
            dataType: type,
            insight: json.insight || "No insight generated.",
            keyPatterns: json.keyPatterns || []
        };
    } catch (e) {
        return {
            id: `ERR_${Date.now()}`,
            date: new Date().toISOString(),
            gameName,
            batchSize: newItems.length,
            dataType: type,
            insight: "Analysis failed due to API error.",
            keyPatterns: []
        };
    }
}