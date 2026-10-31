
import React from 'react';

export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type AppLanguage = 'DE' | 'RU' | 'EN';

export type NotificationThreshold = 'event_day' | '1_day' | '3_days' | '5_days';

export interface GCalendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface AppleAccount {
  id: string;
  email: string;
  identityToken: string;
}

export interface CalendarAccount {
  id: string;
  email: string;
  accessToken: string;
  expiresAt: number; // Timestamp
  active: boolean;
  selectedCalendars: string[]; // IDs of calendars to sync with
}

export interface AppSettings {
  model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
  language: AppLanguage;
  calendars: CalendarAccount[];
  appleAccount?: AppleAccount;
  notificationsEnabled: boolean;
  notificationThresholds: NotificationThreshold[];
}

export interface CategorizedItems {
  dishes: string[];
  drinks: string[];
  service: string[];
}

export type SyncStatus = 'dirty' | 'syncing' | 'synced' | 'error';

export interface Order {
  id: string;
  clientName: string;
  orderDate: string; // ISO Date string
  deliveryDateTime: string; // ISO Date string for event/delivery
  guestsCount: number;
  tableNumber?: string;
  amount?: number;
  menuType: string;
  language: 'DE' | 'RU' | 'EN';
  items: CategorizedItems;
  totalItems: number;
  status: OrderStatus;
  originalImage?: string; // Base64 (Managed separately in IndexedDB for persistence)
  transcription: string;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  discounts?: string;
  orderNumber?: string;
  
  // Offline Sync & Revision Metadata
  isSynced?: boolean; // Legacy flag, kept for backward compatibility
  lastModified?: number; // Timestamp
  syncStatus?: SyncStatus;
  revision: number;
  lastSyncedAt?: number | null;
  syncError?: string | null;
  conflict?: boolean;
  conflictInfo?: string | null;
  calendarEventIds?: Record<string, string>;
  calendarSyncedAt?: number | null;
  calendarSyncError?: string | null;
}

export type ReviewStatus = 'PENDING' | 'DUPLICATE' | 'LOW_CONFIDENCE' | 'APPROVED' | 'SKIPPED' | 'UPDATE';

export interface ReviewOrder extends Order {
  reviewStatus: ReviewStatus;
  duplicateOfId?: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalGuests: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}
