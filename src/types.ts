export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: any; // Firestore Timestamp or Date representation
}

export interface Illustration {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  likesCount: number;
  createdAt: any; // Firestore Timestamp
}

export interface Comment {
  id: string;
  illustrationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: any; // Firestore Timestamp
}

export interface Like {
  userId: string;
  createdAt: any; // Firestore Timestamp
}

export interface AISuggestion {
  description: string;
  tags: string[];
}

export interface AICritique {
  impression: string;
  composition: string;
  suggestions: string;
  encouragement: string;
}

export interface AIComposeIdea {
  layout: string;
  colors: string;
  palette: string[];
  steps: string[];
  techniques: string;
}
