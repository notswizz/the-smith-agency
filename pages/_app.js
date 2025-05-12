import "@/styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import useStore from "@/lib/hooks/useStore";
import SplashScreen from "@/components/SplashScreen";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function App({ Component, pageProps }) {
  const initializeData = useStore((state) => state.initializeData);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  // Check if app is in standalone mode (PWA)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if running as PWA
      const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                                  window.navigator.standalone || 
                                  document.referrer.includes('android-app://');
      
      setIsStandalone(isRunningStandalone);
      setShowSplash(isRunningStandalone);
    }
  }, []);

  // Initialize data from API
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <main className={`${geistSans.variable} ${geistMono.variable}`}>
      {showSplash && <SplashScreen />}
      <Component {...pageProps} isPWA={isStandalone} />
      <PWAInstallPrompt />
    </main>
  );
}
