import "@/styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import useStore from "@/lib/hooks/useStore";
import SplashScreen from "@/components/SplashScreen";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AdminLogin from "@/components/AdminLogin";
import adminLogger from "@/lib/utils/adminLogger";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = () => {
      const SESSION_KEY = 'tsa_admin_session';
      const session = localStorage.getItem(SESSION_KEY);
      
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          const now = new Date().getTime();
          
          if (sessionData.expiry > now) {
            adminLogger.setAdminName(sessionData.adminName);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(SESSION_KEY);
            setIsAuthenticated(false);
          }
        } catch (e) {
          localStorage.removeItem(SESSION_KEY);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsCheckingAuth(false);
    };

    if (typeof window !== 'undefined') {
      checkAuth();
    }
  }, []);

  // Initialize data from API only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeData();
    }
  }, [initializeData, isAuthenticated]);

  const handleLogin = (adminName) => {
    setIsAuthenticated(true);
    adminLogger.setAdminName(adminName);
    adminLogger.logLogin();
  };

  const handleLogout = () => {
    adminLogger.logLogout();
    localStorage.removeItem('tsa_admin_session');
    setIsAuthenticated(false);
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <main className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500/20 via-indigo-400/10 to-purple-500/5">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </main>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <main className={`${geistSans.variable} ${geistMono.variable}`}>
        <AdminLogin onLogin={handleLogin} />
      </main>
    );
  }

  return (
    <main className={`${geistSans.variable} ${geistMono.variable}`}>
      {showSplash && <SplashScreen />}
      <Component {...pageProps} isPWA={isStandalone} onLogout={handleLogout} />
      <PWAInstallPrompt />
      <Analytics />
    </main>
  );
}
