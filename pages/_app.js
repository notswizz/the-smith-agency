import "@/styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from "react";
import useStore from "@/lib/hooks/useStore";

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

  // Initialize data from API
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <main className={`${geistSans.variable} ${geistMono.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}
