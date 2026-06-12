import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint: AI generates artwork description and tags based on title/concept
app.post("/api/ai/suggest", async (req, res) => {
  try {
    const { title, category, ideaPrompt } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const prompt = `你是一位專業的藝術策展人與插畫評論家。請為以下作品生成一段精美、有藝術氣息和溫度的繁體中文作品描述與推薦標籤：
作品名稱：${title}
作品分類：${category || "未分類"}
創作者靈感/概念關鍵字：${ideaPrompt || "無"}

請嚴格遵循以下 JSON 輸出格式：
{
  "description": "富含詩意、字數約 100-200 字的作品簡介與藝術語彙描述，繁體中文。",
  "tags": ["標籤1", "標籤2", "標籤3", "標籤4", "標籤5"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "作品描述",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5個標籤",
            },
          },
          required: ["description", "tags"],
        },
      },
    });

    const bodyText = response.text || "{}";
    const result = JSON.parse(bodyText.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("AI suggestion error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate suggest" });
  }
});

// Endpoint: AI artwork critique (reviews color, composition, details)
app.post("/api/ai/critique", async (req, res) => {
  try {
    const { title, category, description, userQuestion } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const prompt = `你是一位資深的數位插畫導師。請針對創作者投稿的作品進行深入、溫暖、專業且充滿誠意的藝術點評。
作品名稱：${title}
作品類別：${category || "未指定"}
作品描述：${description || "無詳細描述"}
創作者特別詢問的問題：${userQuestion || "請給予我關於色彩、構圖與角色氛圍的建議。"}

你的點評必須以「繁體中文」撰寫，結構需包含：
1. 【整體印象與氛圍】(給予作品極具詩意的讚美與情感共鳴點撥)
2. 【專業構圖與色彩解析】(分析其視覺引導、明暗、冷暖搭配)
3. 【修飾與進階建議】(具體指出可提昇的細節，例如筆觸、邊緣處理或光影方向)
4. 【導師鼓勵】(一兩句激勵創作的話，傳遞畫室導師般的溫暖)

請嚴格遵循以下 JSON 輸出格式：
{
  "impression": "整體印象與氛圍內容",
  "composition": "專業構圖與色彩解析內容",
  "suggestions": "修飾與進階建議內容",
  "encouragement": "導師鼓勵內容"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            impression: { type: Type.STRING },
            composition: { type: Type.STRING },
            suggestions: { type: Type.STRING },
            encouragement: { type: Type.STRING },
          },
          required: ["impression", "composition", "suggestions", "encouragement"],
        },
      },
    });

    const bodyText = response.text || "{}";
    const result = JSON.parse(bodyText.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("AI critique error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate critique" });
  }
});

// Endpoint: AI composition ideas generator
app.post("/api/ai/compose-idea", async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme) {
      return res.status(400).json({ error: "Theme is required" });
    }

    const prompt = `你是一位頂尖的插畫視覺企劃與設計總監。請為以下的創作主題提出一個完整的畫面構圖企劃：
創作主題：${theme}

請以「繁體中文」規劃，並特別包含以下內容：
1. 【畫面元素與角色配置】：如何擺放主角、背景、前景，形成有深度的多層次遮擋關係
2. 【推薦色調與光影氛圍】：例如「暮色奶油風」，列出色彩方案、主色、輔助色與點綴色，並說明光源位置
3. 【分步起稿建議】：從草圖、鋪底色到細化調整的具體步驟
4. 【推薦的畫筆風格或技法】：例如顆粒質感、厚塗、賽璐珞等

請嚴格遵循以下 JSON 輸出格式：
{
  "layout": "畫面元素與角色配置內容",
  "colors": "推薦色調與光影氛圍內容說明",
  "palette": ["#Hex1", "#Hex2", "#Hex3", "#Hex4", "#Hex5"],
  "steps": ["步驟 1: ...", "步驟 2: ...", "步驟 3: ...", "步驟 4: ..."],
  "techniques": "推薦的畫筆風格與渲染技法"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            layout: { type: Type.STRING },
            colors: { type: Type.STRING },
            palette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5個代表該配色氛圍的十六進位顏色代碼，例如 ['#1E293B', '#F1F5F9', ...]"
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "起稿至完稿的 4-5 個關鍵步驟教學"
            },
            techniques: { type: Type.STRING },
          },
          required: ["layout", "colors", "palette", "steps", "techniques"],
        },
      },
    });

    const bodyText = response.text || "{}";
    const result = JSON.parse(bodyText.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("AI compose-idea error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate composition ideas" });
  }
});

// Configure Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Illustration Management app running natively on http://localhost:${PORT}`);
  });
}

startServer();
