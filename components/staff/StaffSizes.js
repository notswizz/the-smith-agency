import React from 'react';
import { IdentificationIcon } from '@heroicons/react/24/outline';

export default function StaffSizes({ staffMember }) {
  // Check if there are any sizes to display
  const hasSizes = staffMember.sizes && Object.keys(staffMember.sizes).some(k => staffMember.sizes[k]);
  
  if (!hasSizes) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-[0_8px_30px_rgb(219,39,119,0.2)] transition-shadow duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 py-3 sm:py-4 px-4 sm:px-6">
          <div className="flex items-center">
            <IdentificationIcon className="h-4 sm:h-5 w-4 sm:w-5 text-white mr-1.5 sm:mr-2" />
            <h3 className="font-semibold text-white text-sm sm:text-base">Sizes</h3>
          </div>
        </div>
        <div className="p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-secondary-500">No sizes information provided</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-[0_8px_30px_rgb(219,39,119,0.2)] transition-shadow duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 py-3 sm:py-4 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <IdentificationIcon className="h-4 sm:h-5 w-4 sm:w-5 text-white mr-1.5 sm:mr-2" />
            <h3 className="font-semibold text-white text-sm sm:text-base">Sizes</h3>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
          {staffMember.sizes?.height && (
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-2 sm:p-3 text-center shadow-sm hover:shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Height</div>
              <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.height}</div>
            </div>
          )}
          
          {staffMember.sizes?.waist && (
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-2 sm:p-3 text-center shadow-sm hover:shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Waist</div>
              <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.waist}</div>
            </div>
          )}
          
          {staffMember.sizes?.bust && (
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-2 sm:p-3 text-center shadow-sm hover:shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Bust</div>
              <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.bust}</div>
            </div>
          )}
          
          {staffMember.sizes?.chest && (
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-2 sm:p-3 text-center shadow-sm hover:shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Chest</div>
              <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.chest}</div>
            </div>
          )}
          
          {staffMember.sizes?.hips && (
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-2 sm:p-3 text-center shadow-sm hover:shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Hips</div>
              <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.hips}</div>
            </div>
          )}
          
          {staffMember.sizes?.inseam && (
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-2 sm:p-3 text-center shadow-sm hover:shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Inseam</div>
              <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.inseam}</div>
            </div>
          )}
          
          {staffMember.sizes?.dress && (
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-2 sm:p-3 text-center shadow-sm hover:shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Dress</div>
              <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.dress}</div>
            </div>
          )}
          
          {staffMember.sizes?.jacket && (
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-2 sm:p-3 text-center shadow-sm hover:shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Jacket</div>
              <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.jacket}</div>
            </div>
          )}
          
          {staffMember.sizes?.shoe && (
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-2 sm:p-3 text-center shadow-sm hover:shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Shoe</div>
              <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.shoe}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 