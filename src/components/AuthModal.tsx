import React, { useState } from "react";
import { X, Mail, Lock, User, Sparkles, Loader2 } from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { doc } from "firebase/firestore";
import { auth, db, safeSetDoc } from "../firebase";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (displayName: string) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Authenticate Existing User
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const loggedUser = userCredential.user;
        onSuccess(loggedUser.displayName || loggedUser.email?.split("@")[0] || "創作者");
        onClose();
      } else {
        // Register New Web Account
        if (!displayName.trim()) {
          setError("請輸入創作者稱呼！");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("密碼長度必須大於 6 位數！");
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const registeredUser = userCredential.user;

        // Sync displayName to Firebase auth Profile
        await updateProfile(registeredUser, { displayName });

        // Save User Registration Document to Firestore
        const userDocRef = doc(db, "users", registeredUser.uid);
        const userProfile = {
          uid: registeredUser.uid,
          displayName: displayName,
          email: registeredUser.email || email,
          avatarUrl: "",
          bio: "這位熱情的插畫繪師暫時沒有填寫自傳喔。",
          createdAt: new Date(), // This will be server timestamp-compliant
        };

        await safeSetDoc(userDocRef, userProfile, `users/${registeredUser.uid}`);
        
        onSuccess(displayName);
        onClose();
      }
    } catch (err: any) {
      console.error("Auth process failed:", err);
      let localizedError = "操作失敗，請檢查輸入資訊。";
      if (err.code === "auth/email-already-in-use") {
        localizedError = "該 Email 信箱已有註冊紀錄！";
      } else if (err.code === "auth/invalid-email") {
        localizedError = "無效的 Email 電子信箱格式！";
      } else if (err.code === "auth/weak-password") {
        localizedError = "密碼強度不足，最少需 6 個字元！";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        localizedError = "帳號電子信箱或密碼錯誤，請重試！";
      } else {
        localizedError = err.message || localizedError;
      }
      setError(localizedError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        id="auth-modal"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-indigo-200 animate-pulse" />
            <h3 className="font-sans text-lg font-bold">
              {isLogin ? "歡迎回到 藝創畫苑" : "加入藝創畫苑"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-indigo-200 hover:bg-indigo-700 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`w-1/2 py-3 text-center text-sm font-semibold transition-colors ${
              isLogin
                ? "border-b-2 border-indigo-600 bg-white text-indigo-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            立即登入
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`w-1/2 py-3 text-center text-sm font-semibold transition-colors ${
              !isLogin
                ? "border-b-2 border-indigo-600 bg-white text-indigo-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            註冊新創作者
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                創作者暱稱 / 稱呼
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="例如: 夢境旅人"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              電子郵件 (Email)
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="painter@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              密碼
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="密碼需要至少 6 位元"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : isLogin ? (
              "登入平台"
            ) : (
              "註冊並建立我的畫廊"
            )}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            藝創畫苑致力於建構安全乾淨的創作社群平台。<br />
            所有留言與作品素材皆遵守《創作者誠信守則》。
          </p>
        </form>
      </div>
    </div>
  );
}
