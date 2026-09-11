// Client-side Push Notification and Service Worker Manager

export interface NotificationPreferences {
  events: boolean;
  roadmap: boolean;
  future_tech: boolean;
  market_reality: boolean;
  city: string;
}

const STORAGE_KEY = 'careerpilot_push_preferences';
const SUBSCRIPTION_STATUS_KEY = 'careerpilot_push_subscribed';
const PINNED_EVENTS_KEY = 'careerpilot_pinned_events';

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  events: true,
  roadmap: true,
  future_tech: true,
  market_reality: true,
  city: 'Lahore',
};

// Register Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (error) {
    console.warn('[CareerPilot SW] Service worker registration failed:', error);
    return null;
  }
}

// Request Notification Permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
      localStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'true');
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

// Get saved preferences
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

// Save preferences
export function saveNotificationPreferences(prefs: NotificationPreferences) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// Check if subscribed
export function isPushSubscribed(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted' && localStorage.getItem(SUBSCRIPTION_STATUS_KEY) === 'true';
}

// Trigger a native test notification
export async function sendLocalTestNotification(title: string, body: string, url: string = '/market') {
  if (typeof window === 'undefined') return false;

  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;
  }

  const registration = await registerServiceWorker();
  if (registration && registration.showNotification) {
    await registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url },
      tag: 'careerpilot-test',
    });
    return true;
  } else if ('Notification' in window) {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      data: { url },
    });
    return true;
  }
  return false;
}

// Pinned Flight Plan Events
export interface PinnedEvent {
  id: string;
  title: string;
  city: string;
  eventDate: string;
  eventType: string;
  organizer: string;
  eventUrl: string;
  addedAt: string;
}

export function getPinnedEvents(): PinnedEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PINNED_EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function togglePinEvent(event: Omit<PinnedEvent, 'addedAt'>): boolean {
  if (typeof window === 'undefined') return false;
  const current = getPinnedEvents();
  const exists = current.some((e) => e.id === event.id);

  if (exists) {
    const updated = current.filter((e) => e.id !== event.id);
    localStorage.setItem(PINNED_EVENTS_KEY, JSON.stringify(updated));
    return false; // unpinned
  } else {
    const updated = [
      ...current,
      {
        ...event,
        addedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(PINNED_EVENTS_KEY, JSON.stringify(updated));
    return true; // pinned
  }
}

export async function sendEventReminderNotification(
  event: Pick<PinnedEvent, "title" | "organizer" | "city" | "eventDate">,
  daysLeft?: number,
): Promise<boolean> {
  const timeText = daysLeft && daysLeft > 0 ? `in ${daysLeft} days` : "happening soon";
  const title = `Reminder: ${event.title}`;
  const body = `${event.title} in ${event.city} by ${event.organizer} is ${timeText}. Check requirements & prep!`;
  return await sendLocalTestNotification(title, body, "/events");
}

