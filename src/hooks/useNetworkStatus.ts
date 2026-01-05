import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isOfflineMode: boolean;
  connectionType: string;
  setOfflineMode: (enabled: boolean) => void;
  effectivelyOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection type if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      setConnectionType(connection.effectiveType || connection.type || 'unknown');
      
      const updateConnection = () => {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      };
      
      connection.addEventListener('change', updateConnection);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnection);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline mode preference from localStorage
  useEffect(() => {
    const savedOfflineMode = localStorage.getItem('joygrow_offline_mode');
    if (savedOfflineMode === 'true') {
      setIsOfflineMode(true);
    }
  }, []);

  const setOfflineMode = (enabled: boolean) => {
    setIsOfflineMode(enabled);
    localStorage.setItem('joygrow_offline_mode', enabled.toString());
  };

  const effectivelyOffline = !isOnline || isOfflineMode;

  return {
    isOnline,
    isOfflineMode,
    connectionType,
    setOfflineMode,
    effectivelyOffline
  };
}