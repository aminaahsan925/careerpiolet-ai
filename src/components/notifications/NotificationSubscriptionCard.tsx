import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  BellRing,
  Calendar,
  Check,
  Flame,
  Globe2,
  Lock,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermission,
  isPushSubscribed,
  sendLocalTestNotification,
  type NotificationPreferences,
} from '@/lib/push-notifications';
import { triggerInstantDailyIntelAlert } from '@/lib/daily-intel';
import { cn } from '@/lib/utils';

interface NotificationSubscriptionCardProps {
  userCity?: string;
  targetRole?: string;
  className?: string;
}

export function NotificationSubscriptionCard({
  userCity = 'Lahore',
  targetRole = 'Software Engineer',
  className,
}: NotificationSubscriptionCardProps) {
  const [enabled, setEnabled] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => {
    const p = getNotificationPreferences();
    return { ...p, city: userCity || p.city };
  });
  const [isTesting, setIsTesting] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
      setEnabled(isPushSubscribed());
    }
  }, []);

  const handleToggleMaster = async (checked: boolean) => {
    if (checked) {
      const permission = await requestNotificationPermission();
      setPermissionState(permission);
      if (permission === 'granted') {
        setEnabled(true);
        saveNotificationPreferences({ ...prefs, city: userCity });
        toast.success('Offline Background Alerts Enabled! You will receive daily intel even when closed.');
      } else if (permission === 'denied') {
        toast.error('Notification permission was blocked in your browser settings.');
        setEnabled(false);
      }
    } else {
      setEnabled(false);
      localStorage.setItem('careerpilot_push_subscribed', 'false');
      toast.info('Background push notifications paused.');
    }
  };

  const handlePrefChange = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveNotificationPreferences(updated);
    toast.success('Alert preferences updated.');
  };

  const handleSendTestNotification = async () => {
    setIsTesting(true);
    try {
      const ok = await triggerInstantDailyIntelAlert(userCity, targetRole);
      if (ok) {
        toast.success('Native alert dispatched! Check your desktop/OS notification center.');
      } else {
        toast.info('Please allow browser notifications to view the live native banner.');
      }
    } catch {
      toast.error('Could not dispatch test notification.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div
      className={cn(
        'card-surface relative overflow-hidden rounded-3xl border border-terracotta/20 bg-gradient-to-br from-card via-card to-terracotta/5 p-6 sm:p-8 shadow-xl',
        className
      )}
    >
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-terracotta/10 blur-3xl" />

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-terracotta/15 text-terracotta shadow-xs">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-terracotta/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-terracotta">
                4-in-1 Daily Intelligence
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                <Radio className="h-3 w-3 text-emerald-500 animate-pulse" /> Offline Web Push
              </span>
            </div>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
              Background Intelligence Alerts
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground max-w-md">
              Receive high-value career updates on your OS even when CareerPilot AI is completely closed.
            </p>
          </div>
        </div>

        {/* Master Switch */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3 sm:self-start">
          <div className="text-right">
            <p className="text-xs font-bold text-foreground">
              {enabled ? 'Alerts Active' : 'Offline Alerts'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {enabled ? 'Syncing to OS' : 'Disabled'}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggleMaster}
            className="data-[state=checked]:bg-terracotta"
          />
        </div>
      </div>

      {/* 4 Pillars Checklist */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {/* Pillar 1: Upcoming Events */}
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border p-4 transition-all',
            prefs.events
              ? 'border-terracotta/30 bg-terracotta/[0.03]'
              : 'border-border bg-card opacity-60'
          )}
        >
          <Switch
            checked={prefs.events}
            disabled={!enabled}
            onCheckedChange={(c) => handlePrefChange('events', c)}
            className="mt-0.5 data-[state=checked]:bg-terracotta"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-terracotta" />
              <p className="text-xs font-bold text-foreground">Hackathons & Tech Events</p>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Get notified when hackathons, meetups, and workshops open in {userCity}.
            </p>
          </div>
        </div>

        {/* Pillar 2: Daily Roadmap Milestones */}
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border p-4 transition-all',
            prefs.roadmap
              ? 'border-terracotta/30 bg-terracotta/[0.03]'
              : 'border-border bg-card opacity-60'
          )}
        >
          <Switch
            checked={prefs.roadmap}
            disabled={!enabled}
            onCheckedChange={(c) => handlePrefChange('roadmap', c)}
            className="mt-0.5 data-[state=checked]:bg-terracotta"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-terracotta" />
              <p className="text-xs font-bold text-foreground">Today's Roadmap Milestone</p>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Sprint milestone reminder and daily coding target for your active path.
            </p>
          </div>
        </div>

        {/* Pillar 3: Future Tech Signals */}
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border p-4 transition-all',
            prefs.future_tech
              ? 'border-terracotta/30 bg-terracotta/[0.03]'
              : 'border-border bg-card opacity-60'
          )}
        >
          <Switch
            checked={prefs.future_tech}
            disabled={!enabled}
            onCheckedChange={(c) => handlePrefChange('future_tech', c)}
            className="mt-0.5 data-[state=checked]:bg-terracotta"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-terracotta" />
              <p className="text-xs font-bold text-foreground">Future Tech & AI Shifts</p>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Emerging frameworks, LLM tooling, and disruptive skill warnings.
            </p>
          </div>
        </div>

        {/* Pillar 4: Market Reality Demand & Salaries */}
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border p-4 transition-all',
            prefs.market_reality
              ? 'border-terracotta/30 bg-terracotta/[0.03]'
              : 'border-border bg-card opacity-60'
          )}
        >
          <Switch
            checked={prefs.market_reality}
            disabled={!enabled}
            onCheckedChange={(c) => handlePrefChange('market_reality', c)}
            className="mt-0.5 data-[state=checked]:bg-terracotta"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-terracotta" />
              <p className="text-xs font-bold text-foreground">Market Demand & Salary Truth</p>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Entry-level hiring filters and compensation shifts for {targetRole}.
            </p>
          </div>
        </div>
      </div>

      {/* Footer controls & instant local test button */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>No spam. Single curated daily morning brief (9:00 AM PKT).</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={isTesting}
          onClick={handleSendTestNotification}
          className="rounded-xl border-terracotta/30 font-bold text-xs hover:bg-terracotta/10 hover:text-terracotta"
        >
          <Send className="mr-1.5 h-3.5 w-3.5 text-terracotta" />
          {isTesting ? 'Sending Preview...' : 'Send Test Native Alert'}
        </Button>
      </div>
    </div>
  );
}
