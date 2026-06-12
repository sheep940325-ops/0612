import React, { useState } from "react";
import { Sparkles, Palette, Layers, HelpCircle, Footprints, PenTool, Loader2 } from "lucide-react";
import { AIComposeIdea } from "../types";

export default function AIPatternPlayground() {
  const [themeInput, setThemeInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideaResult, setIdeaResult] = useState<AIComposeIdea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeInput.trim()) return;

    setIsGenerating(true);
    setError(null);
    setIdeaResult(null);

    try {
      const res = await fetch("/api/ai/compose-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeInput.trim() }),
      });

      if (!res.ok) {
        throw new Error("伺服器發散思緒超載中");
      }

      const data = await res.json();
      setIdeaResult(data);
    } catch (err: any) {
      console.error("Failed to generate compose ideas:", err);
      setError("AI 藝術總監思路受阻，請換一個主題試試看！");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopySuccess(hex);
    setTimeout(() => {
      setCopySuccess(null);
    }, 1500);
  };

  return (
    <div id="ai-playground-workspace" className="mx-auto max-w-4xl px-4 py-8 text-left space-y-6">
      {/* Intro Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            創作企劃輔助工具
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">AI 創意靈感生成器</h2>
          <p className="text-xs md:text-sm text-indigo-200 leading-relaxed">
            卡關沒靈感？只要輸入你想畫的粗略概念（如：「林深見鹿」或「賽博朋克麵攤」），我們的 AI 視覺設計總監將為你生成結構擺放方案、冷暖配色卡、分步起稿與筆觸風格建議！
          </p>
        </div>
        <div className="flex h-20 w-20 shrink-0 select-none items-center justify-center rounded-3xl bg-indigo-600/30 font-sans text-5xl opacity-40">
          🎨
        </div>
      </div>

      {/* Control Input */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-center">
            <Palette className="absolute left-3.5 h-5 w-5 text-indigo-500" />
            <input
              type="text"
              required
              placeholder="輸入你想畫的任何主題，例如：一個在宇宙邊緣讀書的宇航員..."
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !themeInput.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>總監正在構思畫布...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-indigo-200" />
                <span>生成企劃藍圖</span>
              </>
            )}
          </button>
        </form>
        {error && (
          <p className="mt-3 text-xs text-red-500 font-semibold">{error}</p>
        )}
      </div>

      {/* Results output */}
      {isGenerating && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-400 space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">正在調配調色盤、繪製透視基準線...</p>
          <p className="text-xs text-slate-400">大約需要 5-8 秒，請給藝術腦一些發想時間。</p>
        </div>
      )}

      {ideaResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Main composition, Palette and Techniques (Left side: spans 2 columns) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Elements layout */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-2">
                <Layers className="h-4.5 w-4.5 text-indigo-600" />
                【畫面元素與角色配置】
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {ideaResult.layout}
              </p>
            </div>

            {/* Step-by-step start tutorial */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-2">
                <Footprints className="h-4.5 w-4.5 text-indigo-600" />
                【推薦分步起稿建議流程】
              </h3>
              <div className="space-y-3">
                {ideaResult.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-sans text-xs font-bold text-indigo-600">
                      {idx + 1}
                    </span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side panel: Mood Colors, Hex cards and design styles (Right side: spans 1 column) */}
          <div className="space-y-6">
            
            {/* Color palette block */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs text-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Palette className="h-4.5 w-4.5 text-indigo-500" />
                【推薦色相調色卡】
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {ideaResult.colors}
              </p>

              {/* Graphical Palette row */}
              <div className="flex h-12 w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner">
                {ideaResult.palette.map((color) => (
                  <div
                    key={color}
                    onClick={() => handleCopyColor(color)}
                    style={{ backgroundColor: color }}
                    className="h-full flex-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    title={`點擊複製色碼: ${color}`}
                  />
                ))}
              </div>

              {/* copy success message */}
              {copySuccess && (
                <p className="text-center text-[10px] text-green-600 font-bold">
                  已複製色碼：{copySuccess} ！
                </p>
              )}

              {/* Hex list details to let user inspect */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                {ideaResult.palette.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleCopyColor(color)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 hover:bg-slate-100 text-left"
                  >
                    <span
                      style={{ backgroundColor: color }}
                      className="inline-block h-3 w-3 rounded-md ring-1 ring-black/10"
                    />
                    <span>{color}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Techniques and styles */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-2">
                <PenTool className="h-4.5 w-4.5 text-indigo-600" />
                【畫筆風格與渲染技法】
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {ideaResult.techniques}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Placeholder when no search has run */}
      {!ideaResult && !isGenerating && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400 max-w-md mx-auto">
          <HelpCircle className="h-10 w-10 text-slate-300 mx-auto stroke-[1.5]" />
          <h4 className="mt-3 text-sm font-bold text-slate-600">靈感池尚無企劃案</h4>
          <p className="mt-1 text-xs text-slate-400">請在上方輸入任何天馬行空的構思，開啟奇妙創作藍圖！</p>
        </div>
      )}
    </div>
  );
}
