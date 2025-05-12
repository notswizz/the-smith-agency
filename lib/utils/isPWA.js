/**
 * Utility function to detect if the application is running in PWA mode
 * @returns {boolean} True if running as a PWA
 */
export function isPWA() {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return (
    window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone || 
    document.referrer.includes('android-app://')
  );
}

/**
 * Utility function to detect if the device is iOS
 * @returns {boolean} True if running on iOS
 */
export function isIOS() {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    !window.MSStream
  );
}

/**
 * Get information about the PWA environment
 * @returns {Object} Information about the PWA environment
 */
export function getPWAInfo() {
  const pwaActive = isPWA();
  const iosDevice = isIOS();
  
  return {
    isPWA: pwaActive,
    isIOS: iosDevice,
    isStandalone: pwaActive,
    needsInstallPrompt: !pwaActive && 'BeforeInstallPromptEvent' in window
  };
} 