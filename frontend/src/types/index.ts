// ═══ Типы, соответствующие DTO бэкенда ═══

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber: string | null;
  photoUrl: string | null;
  trainerRank: number | null;
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
  trainerName: string;
  trainerPhotoUrl: string | null;
  categoryId: number;
  trainerId: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Coach {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  photoUrl: string | null;
  trainerRank: number;
}

export interface Purchase {
  id: number;
  userId: string;
  userEmail: string;
  userFullName: string;
  userPhone: string | null;
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
  trainerName: string;
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

export interface TrainerListItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  photoUrl: string | null;
  trainerRank: number;
}

export interface PersonalWorkoutSlot {
  id: number;
  trainerId: string;
  trainerName: string;
  trainerPhone: string | null;
  clientId: string | null;
  clientName: string | null;
  clientPhone: string | null;
  dateTime: string;
  price: number;
  status: 'Available' | 'BookedUnpaid' | 'Paid' | 'Completed' | 'NotCompleted' | string;
  notCompletedReason: string | null;
}

export interface TrainerProgressUpdateItemPayload {
  trackerId?: number;
  title?: string;
  unit?: string;
  value: number;
}

export interface TrainerUpdateProgressPayload {
  clientId: string;
  updates: TrainerProgressUpdateItemPayload[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiTrainerStatus {
  hasActiveMembership: boolean;
  remainingMessages: number;
  canUseChat: boolean;
  membershipExpiresAt: string | null;
}

export interface AiTrainerChatResponse {
  reply: string;
  remainingMessages: number;
}

export interface AuditLogListItem {
  id: number;
  timestamp: string;
  userId: string | null;
  userDisplayName: string;
  entityName: string;
  action: 'Insert' | 'Update' | 'Delete' | string;
}

export interface AuditLogDetails extends AuditLogListItem {
  oldValues: string | null;
  newValues: string | null;
}

export interface AdminOverviewStats {
  clientsCount: number;
  trainersCount: number;
  managersCount: number;
  auditLogsLast24hCount: number;
}

export interface ClientListItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  membershipStatus: 'None' | 'Reserved' | 'Paid' | string;
  membershipName: string | null;
}
