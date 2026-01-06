import { useState, useEffect } from 'react';
import { getOfflineModePref, setOfflineModePref } from '../utils/offline-pref-storage';

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

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

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

  // Load offline mode preference from IndexedDB
  useEffect(() => {
    let cancelled = false;

    getOfflineModePref()
      .then((saved) => {
        if (!cancelled && saved) {
          setIsOfflineMode(true);
        }
      })
      .catch(() => {
        // ignore errors, default stays false
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setOfflineMode = (enabled: boolean) => {
    setIsOfflineMode(enabled);
    // fire-and-forget write to IndexedDB
    setOfflineModePref(enabled).catch(() => {
      // ignore write errors; state is already updated
    });
  };

  const effectivelyOffline = !isOnline || isOfflineMode;

  return {
    isOnline,
    isOfflineMode,
    connectionType,
    setOfflineMode,
    effectivelyOffline,
  };
}
