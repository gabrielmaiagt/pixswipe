// ===========================
// Firestore Collection References — Typed helpers
// ===========================

import {
    collection,
    doc,
    CollectionReference,
    DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
    User,
    Subscription,
    Offer,
    Creative,
    FunnelStep,
    Comment,
    Module,
    Lesson,
    SavedOffer,
    SavedLesson,
    LessonProgress,
    OfferChecklist,
    Notification,
    Affiliate,
    AffiliateSale,
    Payment,
    WebhookLog,
    AuditLog,
    SupportTicket,
} from '@/types';

// --- Typed collection helper ---
function typedCollection<T>(path: string): CollectionReference<T> {
    return collection(db, path) as CollectionReference<T>;
}

function typedDoc<T>(path: string, id: string): DocumentReference<T> {
    return doc(db, path, id) as DocumentReference<T>;
}

// --- Top-level collections ---
export const usersCol = () => typedCollection<User>('users');
export const userDoc = (uid: string) => typedDoc<User>('users', uid);

export const subscriptionsCol = () => typedCollection<Subscription>('subscriptions');
export const subscriptionDoc = (id: string) => typedDoc<Subscription>('subscriptions', id);

export const offersCol = () => typedCollection<Offer>('offers');
export const offerDoc = (id: string) => typedDoc<Offer>('offers', id);

export const modulesCol = () => typedCollection<Module>('modules');
export const moduleDoc = (id: string) => typedDoc<Module>('modules', id);

export const lessonsCol = () => typedCollection<Lesson>('lessons');
export const lessonDoc = (id: string) => typedDoc<Lesson>('lessons', id);

export const affiliatesCol = () => typedCollection<Affiliate>('affiliates');
export const affiliateDoc = (uid: string) => typedDoc<Affiliate>('affiliates', uid);

export const affiliateSalesCol = () => typedCollection<AffiliateSale>('affiliateSales');
export const paymentsCol = () => typedCollection<Payment>('payments');
export const webhookLogsCol = () => typedCollection<WebhookLog>('webhookLogs');
export const auditLogsCol = () => typedCollection<AuditLog>('auditLogs');
export const supportTicketsCol = () => typedCollection<SupportTicket>('supportTickets');

// --- Subcollections ---
export const offerCreativesCol = (offerId: string) =>
    typedCollection<Creative>(`offers/${offerId}/creatives`);

export const offerFunnelStepsCol = (offerId: string) =>
    typedCollection<FunnelStep>(`offers/${offerId}/funnelSteps`);

export const offerCommentsCol = (offerId: string) =>
    typedCollection<Comment>(`offers/${offerId}/comments`);

export const lessonCommentsCol = (lessonId: string) =>
    typedCollection<Comment>(`lessons/${lessonId}/comments`);

export const savedOffersCol = (uid: string) =>
    typedCollection<SavedOffer>(`saves/${uid}/offers`);

export const savedLessonsCol = (uid: string) =>
    typedCollection<SavedLesson>(`saves/${uid}/lessons`);

export const lessonProgressDoc = (uid: string, lessonId: string) =>
    typedDoc<LessonProgress>(`progress/${uid}/lessons`, lessonId);

export const offerChecklistDoc = (uid: string, offerId: string) =>
    typedDoc<OfferChecklist>(`progress/${uid}/offers`, offerId);

export const notificationsCol = (uid: string) =>
    typedCollection<Notification>(`notifications/${uid}/items`);
