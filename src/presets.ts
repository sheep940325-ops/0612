export interface PresetArtwork {
  name: string;
  url: string;
  category: string;
  tags: string[];
}

export const PRESET_ARTWORKS: PresetArtwork[] = [
  {
    name: "霓虹不夜城 (Neon Cyber City)",
    url: "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&q=80&w=1200",
    category: "二次元",
    tags: ["賽博朋克", "霓虹燈", "未來都市", "科幻"]
  },
  {
    name: "深海星辰之鯨 (Astral Whales of Abyss)",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1200",
    category: "奇幻",
    tags: ["深海", "星空", "巨鯨", "夢幻", "治癒系"]
  },
  {
    name: "森林深處的神社 (Whispering Forest Temple)",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
    category: "風景",
    tags: ["大自然", "神社", "綠意", "神聖", "晨曦"]
  },
  {
    name: "機械姬的黃昏 (Gynoid at Dusk)",
    url: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=1200",
    category: "角色設計",
    tags: ["人造人", "角色概念", "金屬感", "落日"]
  },
  {
    name: "靜物與貓 (Cozy Watercolor Cat)",
    url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200",
    category: "繪本風",
    tags: ["貓咪", "溫馨", "水彩質感", "繪本", "日常"]
  },
  {
    name: "極簡幾何流派 (Geometric Abstract Flow)",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200",
    category: "向量",
    tags: ["極簡主義", "幾何", "視覺引導", "抽象"]
  },
  {
    name: "蒸氣波心靈旅途 (Vaporwave Mind Journey)",
    url: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&q=80&w=1200",
    category: "奇幻",
    tags: ["蒸氣波", "超現實", "雕像", "夢幻紫"]
  },
  {
    name: "星夜冒險者 (The Starry Vagabond)",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1200",
    category: "角色設計",
    tags: ["奇幻冒險", "披風", "手繪風", "月光"]
  }
];

export const CATEGORIES = [
  "全部",
  "奇幻",
  "寫實",
  "向量",
  "角色設計",
  "風景",
  "二次元",
  "繪本風"
];

export const FORM_CATEGORIES = [
  "奇幻",
  "寫實",
  "向量",
  "角色設計",
  "風景",
  "二次元",
  "繪本風"
];
