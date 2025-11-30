import { GoogleGenAI } from "@google/genai";
import { MRTStation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeWalkableArea(stations: MRTStation[], minutes: number): Promise<{ summary: string; places: string[] }> {
  try {
    const names = stations.map(s => s.name).join('、');
    const prompt = `
      我正在分析台北捷運 "${names}" ${stations.length > 1 ? '這幾個捷運站' : '站'}周邊的可步行範圍。
      
      請想像以${stations.length > 1 ? '這些站點' : '該站'}為中心，步行 ${minutes} 分鐘 (大約 ${minutes * 80} 公尺) 的範圍。
      
      請以繁體中文 (Traditional Chinese) 提供以下資訊：
      1. 一個簡短的段落，描述${stations.length > 1 ? '這些區域的綜合' : '這個範圍內的'}生活氛圍、特色或適合的族群 (最多 100 字)。
      2. 列出 3 到 5 個具體的推薦地點類別或地標 (例如：著名的咖啡廳區域、特定公園、夜市、或文化景點)，並附帶一句簡短說明。
      
      請以 JSON 格式回傳，格式如下：
      {
        "summary": "...",
        "places": ["地標/類別 1: 說明", "地標/類別 2: 說明", "地標/類別 3: 說明"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from Gemini");

    // Clean up potential markdown code blocks if present (safeguard)
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      summary: "暫時無法分析此區域，請稍後再試。",
      places: ["請檢查網路連線", "或 API 金鑰設定"]
    };
  }
}