'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt since it can only be used once
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      backgroundColor: 'red',
      padding: '1rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      zIndex: 50,
      maxWidth: '20rem',
    }}>
      <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Install our app for a better experience</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #e2e8f0',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Not Now
        </button>
        <button 
          onClick={handleInstallClick}
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: '#0d6efd',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
