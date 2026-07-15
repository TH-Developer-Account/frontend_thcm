import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  type Notification,
} from "../../context/Notification/useNotifications"; // adjust path to match your structure

// ─────────────────────────────────────────────────────────────────────────────
// NotificationBell.tsx
//
// Self-contained: owns only its own open/closed state and rendering. All
// data (list, unread count, SSE) comes from useNotifications() — this
// component has no fetch/EventSource logic of its own (SRP).
//
// Deliberately has zero dependency on UserProfile — placed as a sibling in
// Header.tsx, before <UserProfile />, so it can't collide with its styling.
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: (notification: Notification) => void;
}) {
  const appKey = notification.metadata?.appKey;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`w-full text-left flex gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50 ${
        !notification.isRead ? "bg-orange-50 hover:bg-orange-100/70" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        {appKey && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-500 mb-0.5">
            {appKey}
          </p>
        )}
        <p className="text-sm font-medium text-gray-900 leading-snug">
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
      )}
    </button>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full text-black hover:bg-black/10 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[22px] h-[22px]"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-semibold flex items-center justify-center border-[1.5px] border-[#1C1C2E]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-11 w-[360px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs font-medium text-orange-500 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                All caught up
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleItemClick}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
