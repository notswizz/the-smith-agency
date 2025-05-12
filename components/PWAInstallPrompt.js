import React, { useState, useEffect } from 'react';
import { isIOS, isPWA } from '@/lib/utils/isPWA';
import { XMarkIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline';

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
      <div className="flex flex-col max-w-md mx-auto">
        {/* Header with close button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {isIOSDevice ? <ShareIcon className="h-6 w-6 mr-3" /> : <ArrowDownTrayIcon className="h-6 w-6 mr-3" />}
            <div>
              <p className="font-medium text-base">
                {isIOSDevice 
                  ? 'Add to Home Screen' 
                  : 'Install App'}
              </p>
              <p className="text-xs text-white/90">
                {isIOSDevice 
                  ? 'For easy access, add this app to your iPhone home screen' 
                  : 'Install this app for a better experience'}
              </p>
            </div>
          </div>
          <button 
            onClick={dismissPrompt}
            className="text-white p-1"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* iOS Instructions - Simple and Clear */}
        {isIOSDevice && (
          <div className="mt-3 pl-10">
            <ol className="list-decimal text-sm space-y-1 ml-4">
              <li>Tap the <ShareIcon className="h-4 w-4 inline mx-0.5 mb-0.5" /> Share button</li>
              <li>Select "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
            </ol>
          </div>
        )}
        
        {/* Android/Other Instructions */}
        {!isIOSDevice && (
          <div className="mt-3 pl-10">
            <button 
              onClick={dismissPrompt} 
              className="bg-white text-pink-500 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Install Now
            </button>
          </div>
        )}
        
        <div className="mt-3 text-center">
          <button 
            onClick={dismissPrompt}
            className="text-white/80 text-xs underline"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
} 