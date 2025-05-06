import React from 'react';
import Button from '@/components/ui/Button';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const EmptyBookings = ({ resetFilters }) => {
  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-8 text-center bg-secondary-50 rounded-lg border border-secondary-200">
      <MagnifyingGlassIcon className="h-10 w-10 mx-auto text-secondary-400 mb-4" />
      <h3 className="text-base font-medium text-secondary-900 mb-1">No bookings found</h3>
      <p className="text-sm text-secondary-600 mb-4">Try adjusting your search or filter criteria</p>
      <Button variant="primary" size="sm" onClick={resetFilters}>
        Reset all filters
      </Button>
    </div>
  );
};

export default EmptyBookings; 