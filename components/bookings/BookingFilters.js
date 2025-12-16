import React from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const BookingFilters = ({ 
  filters, 
  showOptions, 
  setFilters, 
  isShowsOpen, 
  setIsShowsOpen,
  filteredBookingsCount,
  handleSearchChange,
  handleFilterChange
}) => {
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-b from-secondary-50 to-secondary-50/80 backdrop-blur-sm px-4 sm:px-6 py-4 border-b border-secondary-200">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-secondary-900">Bookings</h1>
        <p className="text-xs text-secondary-500">{filteredBookingsCount} active bookings</p>
      </div>
      
      {/* Search and Filters Row */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by staff, client, show, or notes..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        
        {/* Shows Filter Button */}
        <button
          onClick={() => setIsShowsOpen(!isShowsOpen)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            isShowsOpen || filters.show !== 'all'
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'bg-white border-secondary-200 text-secondary-600 hover:border-secondary-300'
          }`}
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Shows</span>
          {filters.show !== 'all' && (
            <span className="w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full">
              1
            </span>
          )}
        </button>
      </div>

      {/* Shows horizontal scroll */}
      {isShowsOpen && (
        <div className="mt-3 pt-3 border-t border-secondary-200 overflow-x-auto pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => {
                setFilters({...filters, show: 'all'});
                setIsShowsOpen(false);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                ${filters.show === 'all' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-secondary-600 border border-secondary-200 hover:border-primary-300 hover:text-primary-600'}`}
            >
              All Shows
            </button>
            {showOptions.map(show => (
              <button
                key={show.id}
                onClick={() => {
                  setFilters({...filters, show: show.id});
                  setIsShowsOpen(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                  ${filters.show === show.id 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white text-secondary-600 border border-secondary-200 hover:border-primary-300 hover:text-primary-600'}`}
              >
                {show.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFilters; 