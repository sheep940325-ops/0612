import React from "react";
import { Heart, MessageSquare } from "lucide-react";
import { Illustration } from "../types";

interface IllustrationCardProps {
  key?: any;
  artwork: Illustration;
  onClick: () => void;
  onLikeToggle: (e: React.MouseEvent, art: Illustration) => void;
  isLikedByUser: boolean;
}

export default function IllustrationCard({
  artwork,
  onClick,
  onLikeToggle,
  isLikedByUser,
}: IllustrationCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-150 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
    >
      {/* Aspect Image frame container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback for broken image urls
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1200";
          }}
        />

        {/* Hover glassmorphic quick pill */}
        <div className="absolute top-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-xs">
          {artwork.category}
        </div>

        {/* Likes Count on card */}
        <button
          onClick={(e) => onLikeToggle(e, artwork)}
          className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full shadow-md backdrop-blur-xs transition-all duration-200 active:scale-75 ${
            isLikedByUser
              ? "bg-rose-500 text-white"
              : "bg-white/90 text-slate-600 hover:bg-white hover:text-rose-500"
          }`}
          title={isLikedByUser ? "取消按讚" : "給予一個讚"}
        >
          <Heart className={`h-4 w-4 ${isLikedByUser ? "fill-white" : ""}`} />
        </button>
      </div>

      {/* Title & Author Info Section */}
      <div className="flex flex-col p-4 text-left">
        <h4 className="line-clamp-1 text-sm font-bold tracking-tight text-slate-800">
          {artwork.title}
        </h4>
        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
          {artwork.description || "創作者未寫入故事簡介"}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-slate-100 font-sans text-[10px] font-bold text-slate-600 ring-1 ring-slate-100">
              {artwork.creatorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {artwork.creatorName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <span className="font-mono text-xs font-semibold text-slate-600">
              {artwork.likesCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
