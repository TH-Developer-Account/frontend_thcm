import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useNotifications,
  type Notification,
} from "../../context/Notification/useNotifications";

const formatTimeAgo = (isoDate: string): string => {
  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) return "";

  const minutes = Math.floor((Date.now() - timestamp) / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
};

type NotificationItemProps = {
  notification: Notification;
  onClick: (notification: Notification) => void;
  onDownload: (notification: Notification) => void;
};

const NotificationItem = ({
  notification,
  onClick,
  onDownload,
}: NotificationItemProps) => {
  const appKey = notification.metadata?.appKey;
  const isDownloadable =
    notification.metadata?.downloadable === true &&
    Boolean(notification.metadata?.logId);

  return (
    <div
      className={[
        "flex w-full items-start gap-2 border-b border-gray-100",
        "px-3 py-2 last:border-b-0 transition-colors",
        notification.isRead
          ? "hover:bg-gray-50"
          : "bg-orange-50 hover:bg-orange-100/70",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onClick(notification)}
          className="block w-full min-w-0 text-left"
        >
          {appKey && (
            <span className="mb-0.5 block text-[0.625rem] font-semibold uppercase tracking-wide text-orange-500">
              {appKey}
            </span>
          )}

          <span className="block text-xs font-medium leading-snug text-gray-900">
            {notification.title}
          </span>

          <span className="mt-0.5 line-clamp-2 block text-[0.6875rem] text-gray-500">
            {notification.body}
          </span>

          <span className="mt-1 block text-[0.625rem] text-gray-400">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </button>

        {isDownloadable && (
          <button
            type="button"
            onClick={() => onDownload(notification)}
            className={[
              "mt-1.5 rounded border border-orange-200 px-2 py-1",
              "text-[0.6875rem] font-medium text-orange-600",
              "hover:bg-orange-50 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-orange-500",
            ].join(" ")}
          >
            Download
          </button>
        )}
      </div>

      {!notification.isRead && (
        <span
          aria-label="Unread"
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500"
        />
      )}
    </div>
  );
};

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    downloadExportFile,
    downloadErrorFile,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleItemClick = (notification: Notification) => {
    if (!notification.isRead) {
      void markAsRead(notification.id);
    }

    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDownload = (notification: Notification) => {
    const logId = notification.metadata?.logId;
    const isErrorFile = notification.metadata?.hasErrorFile;

    if (!logId) return;

    if (!notification.isRead) {
      void markAsRead(notification.id);
    }

    if (isErrorFile) {
      void downloadErrorFile(String(logId));
    } else {
      void downloadExportFile(String(logId));
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((current) => !current)}
        className={[
          "relative flex h-8 w-8 items-center justify-center rounded-full",
          "text-black transition-colors hover:bg-black/10",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-orange-500",
        ].join(" ")}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={[
              "absolute right-0 top-0 flex h-4 min-w-4",
              "items-center justify-center rounded-full px-1",
              "border border-white bg-orange-500",
              "text-[0.625rem] font-semibold leading-none text-white",
            ].join(" ")}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id={dialogId}
          role="dialog"
          aria-label="Notifications"
          className={[
            "absolute right-0 top-10 z-50 overflow-hidden",
            "w-[22rem] max-w-[calc(100vw-1rem)]",
            "rounded-lg border border-gray-200 bg-white shadow-lg",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <p className="text-xs font-semibold text-gray-900">Notifications</p>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="text-[0.6875rem] font-medium text-orange-500 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[21rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-gray-400">
                All caught up
              </p>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleItemClick}
                  onDownload={handleDownload}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
