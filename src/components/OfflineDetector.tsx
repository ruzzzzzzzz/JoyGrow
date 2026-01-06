import { useState, useEffect, ReactNode } from 'react';

interface OfflineDetectorProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function OfflineDetector({ children, fallback }: OfflineDetectorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline && fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      {showOfflineMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#f59e0b',
          color: 'white',
          padding: '12px',
          textAlign: 'center',
          zIndex: 9999,
          fontWeight: 500,
        }}>
          ⚠️ You're offline. Some features may not be available.
        </div>
      )}
      {children}
    </>
  );
}