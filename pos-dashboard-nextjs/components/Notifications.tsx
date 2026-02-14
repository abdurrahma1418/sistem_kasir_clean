'use client';

import { useNotificationStore } from '@/hooks/useNotification';

export default function Notifications() {
  const { notifications, removeNotification } = useNotificationStore();

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      success: 'bi-check-circle-fill',
      danger: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill',
    };
    return icons[type] || icons.info;
  };

  return (
    <>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <i className={`bi ${getIcon(notification.type)}`}></i>
          <span>{notification.message}</span>
        </div>
      ))}
    </>
  );
}
