// 4-in-1 Daily Intelligence Alert Dispatcher & Synthesizer

import { INITIAL_TECH_EVENTS } from '@/data/tech-events';
import { sendLocalTestNotification, getNotificationPreferences } from '@/lib/push-notifications';

export interface DailyIntelPayload {
  title: string;
  summary: string;
  eventHighlight?: string;
  roadmapHighlight?: string;
  futureTechHighlight?: string;
  marketTruthHighlight?: string;
  targetUrl: string;
}

export function synthesizeDailyIntel(city: string = 'Lahore', targetRole: string = 'Software Engineer'): DailyIntelPayload {
  const prefs = getNotificationPreferences();

  // 1. Event in their city
  const cityEvents = INITIAL_TECH_EVENTS.filter(
    (e) => e.city.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(e.city.toLowerCase())
  );
  const nextEvent = cityEvents[0] || INITIAL_TECH_EVENTS[0];

  // 2. Roadmap Milestone
  const roadmapTask = `Sprint Day 3: Build & deploy authenticated JWT and database migrations`;

  // 3. Future Tech Alert
  const futureTech = `AI Agentic Tool Calling & LangGraph architectures surging in 2026 hiring demand`;

  // 4. Market Reality Shift
  const marketTruth = `${targetRole} entry-level filter: 78% of generic applications rejected without public proof`;

  // Synthesize concise notification
  const parts: string[] = [];
  if (prefs.events && nextEvent) {
    parts.push(`🔥 ${nextEvent.title} (${nextEvent.city})`);
  }
  if (prefs.roadmap) {
    parts.push(`🎯 Today's Milestone: ${roadmapTask}`);
  }
  if (prefs.future_tech) {
    parts.push(`⚡ Emerging: ${futureTech}`);
  }
  if (prefs.market_reality) {
    parts.push(`📊 Market Truth: ${marketTruth}`);
  }

  const title = `CareerPilot: Daily Intelligence for ${city}`;
  const summary = parts.slice(0, 2).join(' | ');

  return {
    title,
    summary: summary || 'Your daily career roadmap milestones and market realities are updated.',
    ...(nextEvent ? { eventHighlight: `${nextEvent.title} (${nextEvent.eventDate})` } : {}),
    roadmapHighlight: roadmapTask,
    futureTechHighlight: futureTech,
    marketTruthHighlight: marketTruth,
    targetUrl: '/market',
  };
}

export async function triggerInstantDailyIntelAlert(city?: string, role?: string): Promise<boolean> {
  const intel = synthesizeDailyIntel(city, role);
  return await sendLocalTestNotification(intel.title, intel.summary, intel.targetUrl);
}
