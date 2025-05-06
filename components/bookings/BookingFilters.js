import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
    <div className="sticky top-0 z-10 bg-secondary-50 px-3 sm:px-4 py-3 sm:py-4 border-b border-secondary-200">
      {/* Search and filters */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-3 sm:p-4">
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search by staff, client, show, or notes..."
                className="pl-8 sm:pl-10 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs sm:text-sm h-9 sm:h-auto"
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsShowsOpen(!isShowsOpen);
                }}
                className="flex items-center justify-center text-xs sm:text-sm h-9 sm:h-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                Shows
                {filters.show !== 'all' && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-2xs sm:text-xs font-medium bg-primary-100 text-primary-800">
                    1
                  </span>
                )}
              </Button>
              <p className="text-xs text-secondary-600 font-medium flex items-center bg-secondary-100 px-2 py-1 rounded-md">
                {filteredBookingsCount}
              </p>
              <Link href="/bookings/new">
                <Button variant="primary" size="sm" className="flex items-center text-xs sm:text-sm h-9 sm:h-auto">
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> <span className="hidden xs:inline">New</span> Booking
                </Button>
              </Link>
            </div>
          </div>

          {/* Shows horizontal scroll */}
          {isShowsOpen && (
            <div className="mt-3 pt-3 border-t border-secondary-200 overflow-x-auto pb-1">
              <div className="flex space-x-2 min-w-max">
                <button
                  onClick={() => {
                    setFilters({...filters, show: 'all'});
                    setIsShowsOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                    ${filters.show === 'all' 
                      ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                      : 'bg-secondary-50 text-secondary-700 border border-secondary-200 hover:bg-secondary-100'}`}
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
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                      ${filters.show === show.id 
                        ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                        : 'bg-secondary-50 text-secondary-700 border border-secondary-200 hover:bg-secondary-100'}`}
                  >
                    {show.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFilters; 