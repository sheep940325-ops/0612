import React, { useState, useEffect } from "react";
import { X, Heart, MessageSquare, Trash2, Calendar, Sparkles, Send, Loader2, Award, Compass, HelpCircle } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, getFirestore } from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { Illustration, Comment, AICritique } from "../types";
import { db, safeAddDoc, safeDeleteDoc, safeGetDocs, handleFirestoreError, OperationType } from "../firebase";

interface IllustrationDetailProps {
  artwork: Illustration;
  user: FirebaseUser | null;
  onClose: () => void;
  onLikeToggle: (artwork: Illustration) => void;
  isLikedByUser: boolean;
  onDeleteArtwork: (artworkId: string) => Promise<void>;
}

export default function IllustrationDetail({
  artwork,
  user,
  onClose,
  onLikeToggle,
  isLikedByUser,
  onDeleteArtwork,
}: IllustrationDetailProps) {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeletingArt, setIsDeletingArt] = useState(false);

  // AI Critique States
  const [critiqueQuestion, setCritiqueQuestion] = useState("我想了解這幅作品的色彩搭配、構圖透視、以及情感氛圍，還有哪些可以精進修飾的細節？");
  const [aiCritique, setAiCritique] = useState<AICritique | null>(null);
  const [isRequestingCritique, setIsRequestingCritique] = useState(false);
  const [critiqueError, setCritiqueError] = useState<string | null>(null);

  const isOwner = user && user.uid === artwork.creatorId;

  // Real-time synchronization of comments from subcollection with security error handlers
  useEffect(() => {
    const commentsPathStr = `illustrations/${artwork.id}/comments`;
    const commentsColRef = collection(db, "illustrations", artwork.id, "comments");
    const q = query(commentsColRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Comment[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            illustrationId: artwork.id,
            userId: d.userId,
            userName: d.userName,
            userAvatar: d.userAvatar,
            content: d.content,
            createdAt: d.createdAt,
          });
        });
        setComments(list);
      },
      (error) => {
        // Critical Guideline Rule: Catch snapshot errors & invoke handleFirestoreError
        handleFirestoreError(error, OperationType.GET, commentsPathStr);
      }
    );

    return () => unsubscribe();
  }, [artwork.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    const commentsPathStr = `illustrations/${artwork.id}/comments`;
    const commentsColRef = collection(db, "illustrations", artwork.id, "comments");

    try {
      const commentPayload = {
        illustrationId: artwork.id,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "創作者",
        userAvatar: "",
        content: commentText.trim(),
        createdAt: new Date(),
      };

      await safeAddDoc(commentsColRef, commentPayload, commentsPathStr);
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const commentPathStr = `illustrations/${artwork.id}/comments/${commentId}`;
    const commentDocRef = doc(db, "illustrations", artwork.id, "comments", commentId);
    
    if (window.confirm("你確定要刪除這筆留言評論嗎？")) {
      try {
        await safeDeleteDoc(commentDocRef, commentPathStr);
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    }
  };

  const handleDeleteArtwork = async () => {
    if (window.confirm("你確定要下架刪除這幅插畫作品嗎？全網的作品記錄與討論留言都將同步抹除。")) {
      setIsDeletingArt(true);
      try {
        await onDeleteArtwork(artwork.id);
        onClose();
      } catch (err) {
        console.error("Failed to delete artwork:", err);
        alert("刪除失敗，請再試一次。");
      } finally {
        setIsDeletingArt(false);
      }
    }
  };

  // Trigger server-side AI evaluation pointing to Express
  const handleRequestAICritique = async () => {
    setIsRequestingCritique(true);
    setCritiqueError(null);
    setAiCritique(null);

    try {
      const res = await fetch("/api/ai/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: artwork.title,
          category: artwork.category,
          description: artwork.description,
          userQuestion: critiqueQuestion,
        }),
      });

      if (!res.ok) {
        throw new Error("伺服器點評解析忙碌中");
      }

      const data = await res.json();
      setAiCritique(data);
    } catch (err: any) {
      console.error("AI critique error:", err);
      setCritiqueError("AI 導師可能被其他創作者佔用了，或是作品描述太短。請稍後再試！");
    } finally {
      setIsRequestingCritique(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        id="illustration-detail-drawer"
        className="relative flex h-[90vh] w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden transition-all flex-col md:flex-row my-4"
      >
        {/* Left Column: Huge High-Res Image Showcase */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-4">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1200";
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 text-slate-100 hover:bg-black/60 md:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Right Column: Narrative details / Comments scroll bar */}
        <div className="w-full md:w-[420px] lg:w-[460px] border-l border-slate-150 flex flex-col bg-slate-50/50 overflow-hidden h-full">
          
          {/* Header metadata row */}
          <div className="bg-white border-b border-slate-150 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
            <div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                {artwork.category}
              </span>
              <h3 className="text-base font-bold text-slate-800 line-clamp-1 mt-1">
                {artwork.title}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  onClick={handleDeleteArtwork}
                  disabled={isDeletingArt}
                  className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 shrink-0"
                  title="刪除下架作品"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Primary scrollbox */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            
            {/* Creator profile snippet */}
            <div className="flex items-center justify-between rounded-xl bg-white p-3.5 border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-indigo-50 font-sans text-xs font-bold text-indigo-700 font-sans">
                  {artwork.creatorName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-700">{artwork.creatorName}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    已發布於畫廊
                  </p>
                </div>
              </div>

              {/* Like state toggle */}
              <button
                onClick={() => onLikeToggle(artwork)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition-all active:scale-95 ${
                  isLikedByUser
                    ? "bg-rose-500 text-white shadow-rose-100 hover:bg-rose-600"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Heart className={`h-4.5 w-4.5 ${isLikedByUser ? "fill-white text-white" : "text-slate-400"}`} />
                <span>{artwork.likesCount} 次讚</span>
              </button>
            </div>

            {/* Artwork detailed description */}
            <div className="space-y-2 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                作品創作故事
              </span>
              <p className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 p-4 rounded-2xl shadow-xs whitespace-pre-wrap">
                {artwork.description || "畫家很專注，暫時沒有為其撰寫故事描述。讓我們一同用眼睛去凝望、用靈魂去傾聽。"}
              </p>
            </div>

            {/* Displaying Tags */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="text-left space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  分類與推薦標籤
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {artwork.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* --- Premium Workspace: AI Tutor Critique Block --- */}
            <div className="rounded-2xl border-2 border-indigo-150 bg-indigo-950 p-5 text-white space-y-4 shadow-xl shadow-indigo-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-300">
                  <Award className="h-5 w-5 animate-pulse" />
                  <span className="text-sm font-bold">AI 藝術導師 專業畫評空間</span>
                </div>
                <span className="rounded-full bg-indigo-800 px-2.5 py-0.5 text-[9px] font-bold text-indigo-100">
                  智慧點評
                </span>
              </div>

              {!aiCritique ? (
                <div className="space-y-3.5 text-left">
                  <p className="text-xs leading-relaxed text-indigo-200">
                    不滿意畫作色彩？想修飾透視構圖？填寫你想向 AI 導師諮詢的問題，一鍵啟動藝術大腦給予詳盡、客製化的畫評反饋！
                  </p>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-indigo-300 flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      自訂諮詢事項 (或使用預設)
                    </label>
                    <textarea
                      rows={2}
                      value={critiqueQuestion}
                      onChange={(e) => setCritiqueQuestion(e.target.value)}
                      className="w-full rounded-xl bg-indigo-900/50 border border-indigo-800 p-2.5 text-xs text-white outline-none focus:border-indigo-400"
                      placeholder="例如：我該如何改進主體光影，让對比更耀眼？"
                    />
                  </div>

                  {critiqueError && (
                    <p className="text-[10px] text-red-300 font-semibold">{critiqueError}</p>
                  )}

                  <button
                    onClick={handleRequestAICritique}
                    disabled={isRequestingCritique}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-indigo-500 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {isRequestingCritique ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>AI 導師正審視作品結構與色調...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>呼叫 AI 導師完成大師級點評</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-left border-t border-indigo-900 pt-3 text-xs leading-relaxed">
                  
                  <div className="space-y-1.5">
                    <span className="font-bold text-indigo-300">💡 【整體印象與氛圍】</span>
                    <p className="text-indigo-100 bg-indigo-900/40 p-2.5 rounded-lg border border-indigo-900">
                      {aiCritique.impression}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold text-indigo-300">📐 【專業構圖與色彩解析】</span>
                    <p className="text-indigo-100 bg-indigo-900/40 p-2.5 rounded-lg border border-indigo-900">
                      {aiCritique.composition}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold text-indigo-300">🛠️ 【修飾與進階建議】</span>
                    <p className="text-indigo-100 bg-indigo-900/40 p-2.5 rounded-lg border border-indigo-900">
                      {aiCritique.suggestions}
                    </p>
                  </div>

                  <div className="space-y-1 bg-indigo-900/70 p-2.5 rounded-lg border border-indigo-800/40 italic text-indigo-200">
                    <span className="font-bold not-italic text-amber-300">🌟 導師鼓勵節語：</span>
                    "{aiCritique.encouragement}"
                  </div>

                  <button
                    onClick={() => setAiCritique(null)}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    ← 重新向導師提出新諮詢問題
                  </button>
                </div>
              )}
            </div>

            {/* Comments/Discussion Board */}
            <div className="space-y-4 pt-1 text-left border-t border-slate-150">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>社群評論交流區 ({comments.length} 條回應)</span>
              </span>

              {/* Write comment input */}
              {user ? (
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="寫下你的感想或鼓勵..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="flex items-center justify-center rounded-xl bg-indigo-600 px-3.5 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </form>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-400">
                  請先登入，即可在此留下你的評論見解。
                </div>
              )}

              {/* Show comments list */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4 italic">
                    沙發空空的，快來當第一個留下評論痕跡的知音吧！
                  </p>
                ) : (
                  comments.map((cmt) => (
                    <div
                      key={cmt.id}
                      className="group flex items-start gap-2.5 bg-white border border-slate-100 p-3 rounded-xl hover:shadow-xs transition-shadow"
                    >
                      <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 font-sans mt-0.5 shadow-xs">
                        {cmt.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-700">{cmt.userName}</span>
                          
                          {/* Trash indicator for owners */}
                          {user && (user.uid === cmt.userId || isOwner) && (
                            <button
                              onClick={() => handleDeleteComment(cmt.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                              title="刪除這筆留言"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-slate-600 leading-relaxed font-sans">{cmt.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
