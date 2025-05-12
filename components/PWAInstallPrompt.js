import React, { useState, useEffect } from 'react';
import { isIOS, isPWA } from '@/lib/utils/isPWA';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  
  useEffect(() => {
    // Only show the prompt if not already in PWA mode
    const isPWAMode = isPWA();
    
    if (!isPWAMode) {
      // Determine if iOS and set state
      const iOS = isIOS();
      setIsIOSDevice(iOS);
      
      // Show prompt after a delay (better UX)
      const timer = setTimeout(() => {
        // Check if we've shown this before
        const hasShownPrompt = localStorage.getItem('pwa-prompt-shown');
        if (!hasShownPrompt) {
          setShowPrompt(true);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const dismissPrompt = () => {
    setShowPrompt(false);
    // Remember we've shown the prompt so we don't show it again
    localStorage.setItem('pwa-prompt-shown', 'true');
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 text-white p-4 shadow-lg z-40" style={{ backgroundColor: '#FF69B4' }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <ArrowDownTrayIcon className="h-8 w-8 mr-3" />
          <div>
            <p className="font-medium text-sm">
              {isIOSDevice 
                ? 'Add to Home Screen to install this app' 
                : 'Install this app on your device'}
            </p>
            <p className="text-xs mt-1 text-white/80">
              {isIOSDevice 
                ? 'Tap the share icon and then "Add to Home Screen"' 
                : 'Install for a better experience'}
            </p>
          </div>
        </div>
        <button 
          onClick={dismissPrompt}
          className="text-white p-1"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 