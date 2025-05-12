import React, { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-violet-600 flex flex-col items-center justify-center z-50"
      style={{
        transition: 'opacity 0.5s ease-in-out',
        opacity: show ? 1 : 0
      }}
    >
      <div className="text-white text-4xl font-bold mb-4">
        The Smith Agency
      </div>
      <div className="w-16 h-16 border-t-4 border-white rounded-full animate-spin"></div>
    </div>
  );
} 