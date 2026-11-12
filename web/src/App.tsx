import { useEffect, useState } from 'react';
import { getLocationSnapshot } from './lib/navigate';
import { ExplorerPage } from './pages/ExplorerPage';
import { LandingPage } from './pages/LandingPage';

export function App() {
  const [{ path, search }, setLocation] = useState(getLocationSnapshot);

  useEffect(() => {
    const sync = () => setLocation(getLocationSnapshot());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  if (path === '/explorer') {
    const params = new URLSearchParams(search);
    const focusAssistant = params.get('assistant') === '1';
    return <ExplorerPage focusAssistant={focusAssistant} />;
  }

  return <LandingPage />;
}
