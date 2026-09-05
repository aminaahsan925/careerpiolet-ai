import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, CircleAlert, CircleCheck, Info, Sparkles } from "lucide-react";
import { useState } from "react";

import {
  useAllNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUnreadNotificationCount,
  type RoadmapNotification,
} from "@/data/roadmap-v2";
import { cn } from "@/lib/utils";

function notificationIcon(type: RoadmapNotification["type"]) {
  if (type === "mcq_ready") return CircleCheck;
  if (type === "streak_warning") return CircleAlert;
  if (type === "level_up") return Sparkles;
  return Info;
}

function notificationTime(value: string) {
  const timestamp = new Date(value).getTime();
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: count = 0 } = useUnreadNotificationCount();
  const { data: notifications = [], isLoading } = useAllNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-xl border border-border bg-card p-2.5 shadow-card transition-transform hover:-translate-y-0.5"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[9px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-[13px] font-bold">Notifications</p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                Roadmap progress, assessments, and career nudges
              </p>
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-terracotta hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="space-y-2 p-2">
                <div className="h-14 animate-pulse rounded-xl bg-secondary" />
                <div className="h-14 animate-pulse rounded-xl bg-secondary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto h-6 w-6 text-muted-foreground/50" />
                <p className="mt-2 text-[12px] font-semibold">You&apos;re all caught up</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  New roadmap activity will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcon(notification.type);
                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) markRead.mutate({ notificationId: notification.id });
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/50",
                      !notification.read && "bg-terracotta/[0.05]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        notification.read
                          ? "bg-secondary text-muted-foreground"
                          : "bg-terracotta/10 text-terracotta",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[11.5px] font-bold text-foreground">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                        )}
                      </span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted-foreground/70">
                        {notificationTime(notification.created_at)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5">
            <Link
              to="/roadmap"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-terracotta hover:underline"
            >
              Open roadmap activity →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
