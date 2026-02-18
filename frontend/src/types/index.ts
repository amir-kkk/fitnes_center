// ═══ Типы, соответствующие DTO бэкенда ═══

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Membership {
  id: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  createdAt: string;
  options: string[];
}

export interface Training {
  id: number;
  description: string;
  startTime: string;
  maxParticipants: number;
  currentParticipants: number;
  categoryName: string;
  coachName: string;
  coachPhotoUrl: string | null;
  categoryId: number;
  coachId: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Coach {
  id: number;
  fullName: string;
  photoUrl: string | null;
  specialization: string | null;
}

export interface Purchase {
  id: number;
  userId: string;
  userEmail: string;
  membershipId: number;
  membershipName: string;
  priceAtPurchase: number;
  status: string;
  createdAt: string;
}

export interface Booking {
  id: number;
  trainingId: number;
  trainingDescription: string;
  trainingStartTime: string;
  coachName: string;
  userId: string;
  userEmail: string;
  status: string;
}

export interface ProgressTracker {
  id: number;
  title: string;
  goalValue: number;
  unit: string;
  createdAt: string;
  lastValue: number | null;
  changePercent: number | null;
}

export interface ProgressEntry {
  id: number;
  value: number;
  dateRecorded: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
