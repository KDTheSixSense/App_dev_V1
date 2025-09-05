'use client';

import { useNotification } from '@/app/contexts/NotificationContext';

const Notification = () => {
  const { notification, hideNotification } = useNotification();

  if (!notification) {
    return null;
  }

  const baseClasses = 'fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white';
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[notification.type]}`}>
      <span>{notification.message}</span>
      <button onClick={hideNotification} className="ml-4 font-bold">X</button>
    </div>
  );
};

export default Notification;
