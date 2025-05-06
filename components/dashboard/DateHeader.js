import React from 'react';

export default function DateHeader() {
  // Format date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="mb-5 sm:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-md border border-secondary-100 overflow-hidden">
      <div className="relative p-5 sm:p-8 bg-gradient-to-br from-white to-secondary-50">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-8 sm:-mt-12 -mr-8 sm:-mr-12 w-28 sm:w-40 h-28 sm:h-40 rounded-full bg-primary-100 opacity-40"></div>
        <div className="absolute bottom-0 left-0 -mb-6 sm:-mb-8 -ml-6 sm:-ml-8 w-16 sm:w-24 h-16 sm:h-24 rounded-full bg-secondary-200 opacity-50"></div>
        
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
           
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base md:text-lg text-secondary-600">
            {formattedDate}
          </p>
        </div>
      </div>
    </div>
  );
} 