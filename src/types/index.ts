// ===========================
// PIX SWIPE — TypeScript Types
// All Firestore document interfaces
// ===========================

import { Timestamp } from 'firebase/firestore';

// --- User ---
export type UserRole = 'user' | 'admin';
export type PlanType = 'starter' | 'pro' | 'annual';
export type EntitlementStatus = 'active' | 'past_due' | 'canceled' | 'expired';

export interface UserOnboarding {
  niches: string[];
  level: 'iniciante' | 'ja_rodo_x1' | 'avancado';
  goal: 'comecar_do_zero' | 'escalar' | 'diversificar';
  completed: boolean;
}

export interface UserMetrics {
  offersViewed: number;
  lessonsDone: number;
  totalTimeMinutes: number;
  lastSeen: Timestamp;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: Timestamp;
  plan: PlanType;
  entitlementStatus: EntitlementStatus;
  currentPeriodEnd: Timestamp;
  paymentProviderCustomerId?: string;
  onboarding: UserOnboarding;
  metrics: UserMetrics;
  affiliateCode: string;
  affiliateReferredBy?: string | null;
}

// --- Subscription ---
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'expired';

export interface Subscription {
  id: string;
  uid: string;
  provider: 'cakto';
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  updatedAt: Timestamp;
}

// --- Offer ---
export type OfferStatus = 'draft' | 'published' | 'archived';
export type CreativeStorageType = 'firebase' | 'drive';
export type CreativeType = 'image' | 'video' | 'text';
export type FunnelStepLabel = 'qualificacao' | 'prova' | 'pitch' | 'fechamento';

export interface OfferSummary {
  promise: string;
  mechanism: string;
  audience: string;
  objections: string;
}

export interface Offer {
  id: string;
  title: string;
  niche: string;
  ticket: number;
  status: OfferStatus;
  summary: OfferSummary;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  availableOnPlans: PlanType[];
  featured: boolean;
  scalingBadge: boolean;
  referenceCpl?: number;
  referenceRoas?: number;
  referenceTicket?: number;
  views: number;
  saves: number;
  version: number;
  lastUpdatedNote?: string;
  creativeStorageType: CreativeStorageType;
  thumbnailUrl?: string;
}

export interface Creative {
  id: string;
  type: CreativeType;
  storagePath?: string;
  driveUrl?: string;
  caption?: string;
  script?: string;
  tags: string[];
}

export interface FunnelStep {
  id: string;
  order: number;
  text: string;
  delayMinutes: number;
  label: FunnelStepLabel;
}

// --- Comment (shared across offers and lessons) ---
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Timestamp;
  likes: number;
}

// --- Module ---
export type ModuleStatus = 'draft' | 'published';

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  status: ModuleStatus;
  coverUrl?: string;
}

// --- Lesson ---
export type LessonStatus = 'draft' | 'published';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number; // seconds
  order: number;
  moduleId: string;
  status: LessonStatus;
  availableOnPlans: PlanType[];
  createdAt: Timestamp;
}

// --- Save ---
export interface SavedOffer {
  offerId: string;
  savedAt: Timestamp;
  note?: string;
  personalTags: string[];
}

export interface SavedLesson {
  lessonId: string;
  savedAt: Timestamp;
}

// --- Progress ---
export interface LessonProgress {
  lessonId: string;
  watchedSeconds: number;
  completed: boolean;
  lastWatchedAt: Timestamp;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface OfferChecklist {
  items: ChecklistItem[];
}

// --- Notification ---
export type NotificationType = 'new_offer' | 'new_lesson' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Timestamp;
  link?: string;
}

// --- Affiliate ---
export interface AffiliateReferral {
  uid: string;
  plan: PlanType;
  date: Timestamp;
  amount: number;
  commission: number;
}

export interface Affiliate {
  uid: string;
  affiliateCode: string;
  totalClicks: number;
  totalSales: number;
  totalEarnings: number;
  paymentStatus: 'pending' | 'paid';
  referrals: AffiliateReferral[];
}

export interface AffiliateSale {
  id: string;
  affiliateUid: string;
  buyerUid: string;
  plan: PlanType;
  saleAmount: number;
  commission: number; // 30%
  caktoSaleId: string;
  status: string;
  createdAt: Timestamp;
}

// --- Payment ---
export interface Payment {
  id: string;
  uid: string;
  caktoSaleId: string;
  amount: number;
  plan: PlanType;
  status: string;
  createdAt: Timestamp;
}

// --- Webhook Log ---
export type WebhookLogStatus = 'ok' | 'failed' | 'retried' | 'processing';

export interface WebhookLog {
  id: string;
  event: string;
  payload: Record<string, unknown>;
  status: WebhookLogStatus;
  error?: string | null;
  receivedAt: Timestamp;
  processedAt?: Timestamp;
}

// --- Audit Log ---
export interface AuditLog {
  id: string;
  adminUid: string;
  action: string;
  target: string;
  timestamp: Timestamp;
}

// --- Support Ticket ---
export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  createdAt: Timestamp;
}
