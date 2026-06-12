import React from "react";
import { User, LogIn, LogOut, Upload, Paintbrush, Sparkles } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface HeaderProps {
  user: FirebaseUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenUpload: () => void;
  activeTab: "gallery" | "playground";
  setActiveTab: (tab: "gallery" | "playground") => void;
  userDisplayName?: string | null;
}

export default function Header({
  user,
  onOpenAuth,
  onLogout,
  onOpenUpload,
  activeTab,
  setActiveTab,
  userDisplayName,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-250 bg-white/95 backdrop-blur-md">
      <div id="header-container" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Left branding */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5 font-sans">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-indigo-150">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div>
              <span className="font-sans text-base font-bold tracking-tight text-gray-900 block leading-tight">插畫管理系統</span>
              <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest block mt-0.5">YICHUANG GALLERY</span>
            </div>
          </div>
          
          {/* Main Navigation tabs inline */}
          <div className="hidden md:flex gap-6 text-sm font-medium h-16">
            <button
              onClick={() => setActiveTab("gallery")}
              className={`flex items-center h-16 px-1 border-b-2 font-semibold transition-all ${
                activeTab === "gallery"
                  ? "text-indigo-600 border-indigo-600"
                  : "text-gray-500 border-transparent hover:text-gray-900"
              }`}
            >
              作品儀表板
            </button>
            <button
              onClick={() => setActiveTab("playground")}
              className={`flex items-center h-16 px-1 border-b-2 font-semibold transition-all gap-1.5 ${
                activeTab === "playground"
                  ? "text-indigo-600 border-indigo-600"
                  : "text-gray-500 border-transparent hover:text-gray-900"
              }`}
            >
              <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
              AI 創作靈感
            </button>
          </div>
        </div>

        {/* Right buttons & meta */}
        <div className="flex items-center gap-4">
          {/* Mobile indicator for playground */}
          <button
            onClick={() => setActiveTab(activeTab === "gallery" ? "playground" : "gallery")}
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-50"
            title="切換頁面"
          >
            <Sparkles className={`h-5 w-5 ${activeTab === "playground" ? "text-indigo-600 animate-pulse" : "text-gray-400"}`} />
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>發布作品</span>
              </button>

              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {userDisplayName || user.email?.split("@")[0] || "創作者"}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{user.email}</p>
              </div>

              <div className="w-9 h-9 rounded-full bg-gray-150 flex items-center justify-center overflow-hidden border border-gray-200">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userDisplayName || user.email}`} 
                  alt="avatar" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                title="登出帳號"
              >
                登出
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 active:scale-95"
            >
              <LogIn className="h-4 w-4 text-gray-400" />
              登入 / 註冊
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
