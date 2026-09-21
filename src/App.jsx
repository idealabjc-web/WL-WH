import { useEffect } from 'react';
import AdminApp from './AdminApp.jsx';
import { syncOfflineQueue } from './api/speakersApi';

export default function App() {
  useEffect(() => {
    const handleOnline = () => {
      console.log("Back online, syncing queue...");
      syncOfflineQueue();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return <AdminApp />;
}
