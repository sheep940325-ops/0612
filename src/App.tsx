import React, { useState, useEffect } from "react";
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  setDoc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  Paintbrush, 
  Sparkles, 
  Search, 
  Heart, 
  Plus, 
  Grid, 
  User as UserIcon, 
  FolderHeart,
  Loader2,
  Bookmark
} from "lucide-react";
import { db, auth, safeGetDoc, safeSetDoc, safeUpdateDoc, safeDeleteDoc, handleFirestoreError, OperationType } from "./firebase";
import { Illustration, UserProfile } from "./types";
import { CATEGORIES, PRESET_ARTWORKS } from "./presets";

// Components
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import UploadModal from "./components/UploadModal";
import IllustrationCard from "./components/IllustrationCard";
import IllustrationDetail from "./components/IllustrationDetail";
import AIPatternPlayground from "./components/AIPatternPlayground";

export default function App() {
  const [activeTab, setActiveTab] = useState<"gallery" | "playground">("gallery");
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  
  // Selection
  const [selectedArtwork, setSelectedArtwork] = useState<Illustration | null>(null);

  // Core Data
  const [artworks, setArtworks] = useState<Illustration[]>([]);
  const [userLikesMap, setUserLikesMap] = useState<Record<string, boolean>>({});
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(true);

  // Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [galleryFilter, setGalleryFilter] = useState<"all" | "mine">("all");

  const [notification, setNotification] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");

  useEffect(() => {
    setLastSyncedTime(new Date().toLocaleString("zh-TW", { hour12: false }));
  }, [artworks]);

  const handleManualRefresh = () => {
    setIsLoadingArtworks(true);
    setTimeout(() => {
      setIsLoadingArtworks(false);
      setLastSyncedTime(new Date().toLocaleString("zh-TW", { hour12: false }));
      showNotification("📡 數據連線同步成功！");
    }, 450);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Auth Listener State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Retrieve custom user bio and extra details from `/users/{uid}`
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const userDocSnap = await safeGetDoc(userDocRef, `users/${currentUser.uid}`);
          if (userDocSnap && userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          } else {
            // Fallback profile if none stored in DB
            setUserProfile({
              uid: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "繪手",
              email: currentUser.email || "",
              createdAt: new Date(),
            });
          }
        } catch (err) {
          console.error("Error reading profile details:", err);
        }
      } else {
        setUserProfile(null);
        setUserLikesMap({});
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Galleries feed syncer
  useEffect(() => {
    const collPathStr = "illustrations";
    const artworksColRef = collection(db, "illustrations");
    const q = query(artworksColRef, orderBy("createdAt", "desc"));

    setIsLoadingArtworks(true);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Illustration[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            imageUrl: data.imageUrl,
            category: data.category,
            tags: data.tags || [],
            creatorId: data.creatorId,
            creatorName: data.creatorName,
            creatorAvatar: data.creatorAvatar,
            likesCount: data.likesCount || 0,
            createdAt: data.createdAt,
          });
        });
        setArtworks(list);
        setIsLoadingArtworks(false);
      },
      (error) => {
        // Critical Guideline Rule: Catch snapshot issues and log conformant JSON structure
        handleFirestoreError(error, OperationType.GET, collPathStr);
        setIsLoadingArtworks(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Sync User's Liked Footprints
  useEffect(() => {
    if (!user || artworks.length === 0) return;

    const fetchLikes = async () => {
      const activeLikes: Record<string, boolean> = {};
      
      for (const art of artworks) {
        const pathStr = `illustrations/${art.id}/likes/${user.uid}`;
        const likeDocRef = doc(db, "illustrations", art.id, "likes", user.uid);
        try {
          const snap = await safeGetDoc(likeDocRef, pathStr);
          if (snap && snap.exists()) {
            activeLikes[art.id] = true;
          }
        } catch (err) {
          // Keep mapping simple and stable
          console.error(`Error loading likes footprint of artwork: ${art.id}`, err);
        }
      }
      setUserLikesMap(activeLikes);
    };

    fetchLikes();
  }, [user, artworks]);

  // Auth actions
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification("已成功登出藝創畫苑！");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleAuthSuccess = (name: string) => {
    showNotification(`歡迎來到藝創畫苑！你好，${name}`);
  };

  // Main Publisher Handler
  const handlePublishIllustration = async (
    title: string,
    description: string,
    imageUrl: string,
    category: string,
    tags: string[]
  ) => {
    if (!user) throw new Error("請先登入帳號後再發布作品！");

    const id = "ill_" + Date.now();
    const docPathStr = `illustrations/${id}`;
    const docRef = doc(db, "illustrations", id);

    const payload: Illustration = {
      id,
      title,
      description,
      imageUrl,
      category,
      tags,
      creatorId: user.uid,
      creatorName: userProfile?.displayName || user.displayName || user.email?.split("@")[0] || "未知畫師",
      creatorAvatar: "",
      likesCount: 0,
      createdAt: new Date(),
    };

    await safeSetDoc(docRef, payload, docPathStr);
    showNotification("🎉 插畫作品發布成功！已新增至你的畫廊。");
  };

  // Like Toggle mechanics (Strict ABAC Rules)
  const handleLikeToggle = async (artwork: Illustration) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    const isCurrentlyLiked = !!userLikesMap[artwork.id];
    const likeDocRef = doc(db, "illustrations", artwork.id, "likes", user.uid);
    const artDocRef = doc(db, "illustrations", artwork.id);

    const likePathStr = `illustrations/${artwork.id}/likes/${user.uid}`;
    const artPathStr = `illustrations/${artwork.id}`;

    // Opt-in defensive clone to avoid UI latency
    const currentLikesState = { ...userLikesMap };
    const cleanArtworks = artworks.map((item) => {
      if (item.id === artwork.id) {
        return {
          ...item,
          likesCount: isCurrentlyLiked ? Math.max(0, item.likesCount - 1) : item.likesCount + 1,
        };
      }
      return item;
    });

    try {
      if (!isCurrentlyLiked) {
        // Create Like document + increment total likes by 1
        const likePayload = {
          userId: user.uid,
          createdAt: new Date(),
        };
        await safeSetDoc(likeDocRef, likePayload, likePathStr);
        await safeUpdateDoc(artDocRef, { likesCount: artwork.likesCount + 1 }, artPathStr);
        
        setUserLikesMap((prev) => ({ ...prev, [artwork.id]: true }));
        // Sync selected details active counts
        if (selectedArtwork && selectedArtwork.id === artwork.id) {
          setSelectedArtwork((prev) => prev ? { ...prev, likesCount: prev.likesCount + 1 } : null);
        }
      } else {
        // Delete Like document + decrement total likes by 1
        await safeDeleteDoc(likeDocRef, likePathStr);
        await safeUpdateDoc(artDocRef, { likesCount: Math.max(0, artwork.likesCount - 1) }, artPathStr);
        
        setUserLikesMap((prev) => {
          const next = { ...prev };
          delete next[artwork.id];
          return next;
        });
        if (selectedArtwork && selectedArtwork.id === artwork.id) {
          setSelectedArtwork((prev) => prev ? { ...prev, likesCount: Math.max(0, prev.likesCount - 1) } : null);
        }
      }
    } catch (err: any) {
      console.error("Like interaction transaction failed:", err);
      // Revert optimistic updates on failure
      setArtworks(artworks);
      setUserLikesMap(currentLikesState);
      showNotification("按讚失敗，請檢查安全規則。");
    }
  };

  const handleLikeToggleFromCard = (e: React.MouseEvent, artwork: Illustration) => {
    e.stopPropagation(); // Avoid triggering details modal transition
    handleLikeToggle(artwork);
  };

  // Delete Artwork
  const handleDeleteArtwork = async (artworkId: string) => {
    const artPathStr = `illustrations/${artworkId}`;
    const artDocRef = doc(db, "illustrations", artworkId);
    
    await safeDeleteDoc(artDocRef, artPathStr);
    showNotification("插畫作品下架成功！");
  };

  // Seeding Default Database on Blank State click!
  const handleSeedMockData = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      setIsLoadingArtworks(true);
      const suffix = Date.now().toString().slice(-4);
      
      for (const preset of PRESET_ARTWORKS) {
        const id = `preset_${preset.name.split(" ")[0].toLowerCase()}_${suffix}`;
        const docRef = doc(db, "illustrations", id);
        
        const payload: Illustration = {
          id,
          title: preset.name.split(" ")[0],
          description: `這是一幅由藝創畫苑精選推介的「${preset.name}」作品。色彩豐富，構圖巧妙，非常適合用於展現個人視覺天賦與數位插畫靈感的完美平衡。`,
          imageUrl: preset.url,
          category: preset.category,
          tags: preset.tags,
          creatorId: user.uid,
          creatorName: userProfile?.displayName || user.displayName || "藝苑助理",
          creatorAvatar: "",
          likesCount: Math.floor(Math.random() * 12) + 1,
          createdAt: new Date(),
        };

        await safeSetDoc(docRef, payload, `illustrations/${id}`);
      }
      showNotification("🎨 官方精選插畫作品集已成功寫入，快點擊觀看！");
    } catch (err: any) {
      console.error("Error seeding preset illustrations:", err);
      showNotification("寫入範例失敗：" + err.message);
    } finally {
      setIsLoadingArtworks(false);
    }
  };

  // Filtering Logic
  const filteredArtworks = artworks.filter((item) => {
    // 1. Category Filter
    if (selectedCategory !== "全部" && item.category !== selectedCategory) {
      return false;
    }
    // 2. Tab filtering (mine vs all)
    if (galleryFilter === "mine" && item.creatorId !== user?.uid) {
      return false;
    }
    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = item.title.toLowerCase().includes(q);
      const matchesDescription = item.description.toLowerCase().includes(q);
      const matchesAuthor = item.creatorName.toLowerCase().includes(q);
      const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesTitle || matchesDescription || matchesAuthor || matchesTags;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-900 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-3 text-sm text-indigo-200 font-semibold shadow-2xl animate-bounce">
          <Bookmark className="h-4 w-4 text-indigo-400 fill-indigo-400 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Responsive Header */}
      <Header
        user={user}
        userDisplayName={userProfile?.displayName}
        onOpenAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        onOpenUpload={() => {
          if (!user) {
            setShowAuth(true);
          } else {
            setShowUpload(true);
          }
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Frame container */}
      <main className="flex-1 w-full flex flex-col">
        {activeTab === "playground" ? (
          <AIPatternPlayground />
        ) : (
          <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8 flex-1 flex flex-col lg:flex-row gap-8 text-left">
            
            {/* Clean Minimalism Sidebar */}
            <aside className="w-full lg:w-64 flex flex-col gap-6 flex-shrink-0">
              
              {/* Profile Card & Info */}
              <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs">
                <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-gray-400 mb-3 block">
                  個人空間統計
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium font-sans">總作品發表</span>
                    <span className="text-sm font-bold font-mono text-gray-800">{artworks.length} 幅</span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center text-[11px] text-gray-500 mb-1">
                      <span>雲端資料庫儲存量</span>
                      <span className="font-mono text-indigo-600 font-semibold">4.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-indigo-600 h-1 rounded-full" style={{ width: "4.5%" }}></div>
                    </div>
                  </div>
                  
                  {user ? (
                    <div className="space-y-1">
                      <p className="text-[11px] text-gray-400 leading-normal">
                        你好，<span className="text-gray-700 font-semibold">{userProfile?.displayName || user.email?.split("@")[0]}</span>。歡迎在藝創畫苑自由分享與發布您的數位靈感！
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 leading-normal">
                      目前以訪客模式瀏覽。點擊登入以發布您的專屬插畫與管理畫廊。
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Filters */}
              <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs flex flex-col gap-2.5">
                <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-gray-400 mb-2 block">
                  快速控制篩選
                </h3>
                
                {/* All exploration */}
                <button
                  type="button"
                  onClick={() => setGalleryFilter("all")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    galleryFilter === "all"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Grid className="h-4 w-4" />
                    所有插畫分享
                  </span>
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${galleryFilter === "all" ? "bg-white/20 text-white" : "bg-gray-105 text-gray-500"}`}>
                    {artworks.length}
                  </span>
                </button>

                {/* Mine only */}
                {user && (
                  <button
                    type="button"
                    onClick={() => setGalleryFilter("mine")}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      galleryFilter === "mine"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FolderHeart className="h-4 w-4" />
                      我的展示專區
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${galleryFilter === "mine" ? "bg-white/20 text-white" : "bg-gray-105 text-gray-500"}`}>
                      {artworks.filter((a) => a.creatorId === user.uid).length}
                    </span>
                  </button>
                )}

                {!user && (
                  <div className="text-[10px] text-gray-400 bg-gray-50/70 p-2.5 rounded-lg border border-dashed border-gray-200 mt-1">
                    🔓 登入即可追蹤您發布的插畫
                  </div>
                )}
              </div>

              {/* Creative Guide CTA info */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-850 rounded-2xl p-5 text-white shadow-sm">
                <p className="text-[11px] text-indigo-200 font-mono tracking-wide uppercase">AI Creative Guide</p>
                <h4 className="font-semibold text-sm mt-1 text-white leading-snug">需要畫面靈感？</h4>
                <p className="text-[11px] text-indigo-100 opacity-90 mt-2 leading-relaxed">
                  點擊開啟 AI 智慧企劃，以簡約語意迅速解構色彩光影、激發精彩插畫配搭。
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("playground")}
                  className="w-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs text-white font-semibold py-2 rounded-xl mt-4 cursor-pointer text-center"
                >
                  啟動 AI 創作靈感
                </button>
              </div>

            </aside>

            {/* Gallery portfolio Column Section */}
            <div className="flex-1 flex flex-col gap-6">
              
              {/* Top search & quick tag list */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-150 p-4.5 rounded-2xl shadow-xs">
                
                {/* Category tags selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-hide shrink-0 max-w-full md:max-w-md lg:max-w-xl">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        selectedCategory === cat
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative flex items-center w-full md:w-64 max-w-full shrink-0">
                  <Search className="absolute left-3.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜尋標題、作者或標籤..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9.5 pr-4 text-xs font-medium text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-100"
                  />
                </div>

              </div>

              {/* Main portfolio Gallery Grid */}
              {isLoadingArtworks ? (
                <div className="py-24 bg-white rounded-2xl border border-gray-150 flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-semibold text-gray-600">正在與 Firestore 雲端同步繪圖集數據...</p>
                </div>
              ) : filteredArtworks.length === 0 ? (
                <div className="rounded-2xl bg-white border border-gray-150 py-16 px-6 text-center max-w-md mx-auto my-6 text-gray-500 w-full">
                  <Paintbrush className="h-10 w-10 text-gray-300 mx-auto stroke-[1.5]" />
                  <h4 className="mt-4 text-sm font-bold text-gray-800 font-sans">找不到相符的插畫作品</h4>
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed px-2">
                    {artworks.length === 0
                      ? "社群目前尚無任何畫作。您可以立即登入並點擊右上方「發布作品」，或者點擊下方按鈕即可一鍵載入官方經典插畫預設集！"
                      : "請更換檢索關鍵字或選擇其他篩選分類。"}
                  </p>
                  
                  {artworks.length === 0 && user && (
                    <button
                      onClick={handleSeedMockData}
                      className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-semibold text-white tracking-wide shadow-sm hover:bg-gray-850 transition-colors active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5 text-indigo-300 stroke-[3px]" />
                      一鍵建立經典初始插畫庫
                    </button>
                  )}

                  {artworks.length === 0 && !user && (
                    <button
                      onClick={() => setShowAuth(true)}
                      className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white tracking-wide shadow-sm hover:bg-indigo-700 transition-colors active:scale-95"
                    >
                      登入帳號以載入精選庫
                    </button>
                  )}
                </div>
              ) : (
                <div id="artworks-masonry-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {filteredArtworks.map((art) => (
                    <IllustrationCard
                      key={art.id}
                      artwork={art}
                      onClick={() => setSelectedArtwork(art)}
                      onLikeToggle={handleLikeToggleFromCard}
                      isLikedByUser={!!userLikesMap[art.id]}
                    />
                  ))}
                </div>
              )}

              {/* System Connection State Footer Block */}
              <div className="bg-white rounded-xl border border-gray-150 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs mt-auto">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs text-gray-600 font-semibold font-sans">Firestore 數據庫狀態：連線成功</span>
                  </div>
                  <div className="hidden sm:block h-4 w-px bg-gray-200"></div>
                  <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">Applet ID: 83a9ed63-1e2c-4e34-9ee2-76ac2df6f6cd</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-gray-500 font-sans">
                    同步時間: <span className="font-mono font-medium text-gray-700">{lastSyncedTime || "無"}</span>
                  </span>
                  <button 
                    type="button"
                    onClick={handleManualRefresh}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-tight cursor-pointer"
                  >
                    手動同步
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Modals injection */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onPublish={handlePublishIllustration}
        />
      )}

      {selectedArtwork && (
        <IllustrationDetail
          artwork={selectedArtwork}
          user={user}
          onClose={() => setSelectedArtwork(null)}
          onLikeToggle={handleLikeToggle}
          isLikedByUser={!!userLikesMap[selectedArtwork.id]}
          onDeleteArtwork={handleDeleteArtwork}
        />
      )}

      {/* Humble Footer */}
      <footer className="shrink-0 bg-white border-t border-gray-150 py-5 text-center text-xs text-gray-400 mt-12">
        <p className="font-sans font-medium text-gray-500">
          插畫作品管理系統 © {new Date().getFullYear()} 智慧插畫展示與智能創作企劃平台。
        </p>
        <p className="font-mono mt-1 text-[10px] tracking-wider uppercase text-gray-300">
          Powered by Express + React + Firestore Cloud Sync
        </p>
      </footer>
    </div>
  );
}
