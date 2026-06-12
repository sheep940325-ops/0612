import React, { useState } from "react";
import { X, Sparkles, Image as ImageIcon, Check, Loader2, Tags, ArrowRight } from "lucide-react";
import { PRESET_ARTWORKS, FORM_CATEGORIES } from "../presets";

interface UploadModalProps {
  onClose: () => void;
  onPublish: (title: string, description: string, imageUrl: string, category: string, tags: string[]) => Promise<void>;
}

export default function UploadModal({ onClose, onPublish }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(FORM_CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  // Choose presets
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);

  // AI Generation States
  const [ideaPrompt, setIdeaPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = PRESET_ARTWORKS[index];
    setImageUrl(preset.url);
    if (!title) {
      setTitle(preset.name.split(" ")[0]);
    }
    setTags(preset.tags);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      if (tags.length >= 10) {
        setErrorMsg("標籤上限為 10 個！");
        return;
      }
      setTags([...tags, newTag.trim()]);
      setNewTag("");
      setErrorMsg(null);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // AI trigger calling Express backend
  const handleAIAssist = async () => {
    if (!title.trim()) {
      setErrorMsg("請先輸入作品標題，以便 AI 展開藝術想像！");
      return;
    }
    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          ideaPrompt,
        }),
      });

      if (!res.ok) {
        throw new Error("伺服器 AI 助理響應失敗");
      }

      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      }
      if (data.tags) {
        setTags(data.tags);
      }
    } catch (err: any) {
      console.error("AI generator error:", err);
      setErrorMsg("AI 助理忙碌中或連線異常，請稍後再試！");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("請輸入插畫作品標題！");
      return;
    }
    if (!imageUrl.trim()) {
      setErrorMsg("請挑選官方藝術模板，或設定自訂插畫圖片網址！");
      return;
    }

    setIsSubmitting(true);
    try {
      await onPublish(title, description, imageUrl, category, tags);
      onClose();
    } catch (err: any) {
      console.error("Failed to publish work:", err);
      setErrorMsg("發布作品出錯：" + (err.message || "請檢查安全規則。"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        id="upload-modal"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all my-8"
      >
        {/* Title bar */}
        <div className="flex items-center justify-between bg-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="h-5 w-5 text-indigo-200" />
            <h3 className="font-sans text-lg font-bold">發表你的插畫傑作</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-indigo-200 hover:bg-indigo-700 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-600 border border-red-100">
              {errorMsg}
            </div>
          )}

          {/* Grid Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Details form */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">作品標題 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 幻鏡微光"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">分類設定 *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {FORM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preset Art selection board */}
              <div className="space-y-15">
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>挑選官方繪製模板 (強烈推薦) *</span>
                  <span className="text-[11px] font-normal text-indigo-600 font-sans">
                    {selectedPresetIndex !== null ? "已選定模板" : "請從下方選取"}
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-15 border border-slate-100 p-2 rounded-xl bg-slate-50 max-h-32 overflow-y-auto">
                  {PRESET_ARTWORKS.map((art, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectPreset(index)}
                      className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                        selectedPresetIndex === index
                          ? "border-indigo-600 scale-95 ring-2 ring-indigo-100"
                          : "border-transparent hover:border-slate-300"
                      }`}
                      title={art.name}
                    >
                      <img
                        src={art.url}
                        alt={art.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      {selectedPresetIndex === index && (
                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/30">
                          <Check className="h-5 w-5 text-white stroke-[3px]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">或者輸入自訂插畫圖片網址 (URL)</label>
                <input
                  type="url"
                  placeholder="https://example.com/illustration.png"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setSelectedPresetIndex(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Right Column: Descriptions & AI helper */}
            <div className="space-y-4">
              
              {/* AI Creative Assistant Box */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-700">
                    <Sparkles className="h-4.5 w-4.5" />
                    <span className="text-xs font-bold">AI 智慧文案與標籤生成</span>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-semibold text-indigo-700">
                    伺服器後端
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-600">
                  輸入作品標題並於下方給予關鍵字（可留空），點擊按鈕，Server 端將呼叫 Gemini 智慧解析並自動填寫簡介與標籤！
                </p>
                <input
                  type="text"
                  placeholder="補充靈感描述（例如：溫暖的光影、手拿蠟燭的少女）"
                  value={ideaPrompt}
                  onChange={(e) => setIdeaPrompt(e.target.value)}
                  className="w-full rounded-lg border border-indigo-200/60 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                />
                <button
                  type="button"
                  onClick={handleAIAssist}
                  disabled={isGenerating}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>正在激發 AI 藝術細胞...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>一鍵生成藝術描述與標籤</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">作品故事描述與簡介 *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="寫下這幅畫背後的靈感來源、使用的數位工具、或是所想要傳達的故事吧！"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Tags panel */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Tags className="h-3.5 w-3.5" />
                  <span>篩選與搜尋標籤 ({tags.length}/10)</span>
                </label>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 border border-slate-100 rounded-xl bg-slate-50 max-h-20 overflow-y-auto">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500 text-indigo-300 font-bold ml-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="例如: 夢境 (按 Enter 新增)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const btn = document.getElementById("add-tag-trigger");
                        btn?.click();
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  <button
                    id="add-tag-trigger"
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    新增
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>正在發布大作...</span>
                </>
              ) : (
                <>
                  <span>發布至作品畫廊</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
