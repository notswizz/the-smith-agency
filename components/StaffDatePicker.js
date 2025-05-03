import React, { useState } from 'react';
import { CheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

/**
 * StaffDatePicker component
 * Props:
 *  - dateRange: array of YYYY-MM-DD strings (all valid dates for the show)
 *  - value: array of { date, staffCount }
 *  - onChange: function(newValue)
 */
export default function StaffDatePicker({ dateRange, value, onChange }) {
  // State for bulk staff count 
  const [bulkStaffCount, setBulkStaffCount] = useState(1);

  // Convert value to a lookup for quick access
  const valueMap = React.useMemo(() => {
    const map = {};
    value.forEach(({ date, staffCount }) => {
      map[date] = staffCount;
    });
    return map;
  }, [value]);

  const handleToggleDate = (date) => {
    if (valueMap[date]) {
      // Remove date
      onChange(value.filter(d => d.date !== date));
    } else {
      // Add date with default staffCount 1
      onChange([...value, { date, staffCount: 1 }]);
    }
  };

  const handleStaffCountChange = (date, count) => {
    onChange(value.map(d =>
      d.date === date ? { ...d, staffCount: count } : d
    ));
  };

  // Select all dates with specified staff count
  const selectAllWithStaffCount = () => {
    const count = parseInt(bulkStaffCount) || 1;
    const allDates = dateRange.map(date => ({
      date,
      staffCount: count
    }));
    onChange(allDates);
  };

  // Group dates by month for better organization
  const groupedDates = React.useMemo(() => {
    const groups = {};
    
    dateRange.forEach(date => {
      const [year, month, day] = date.split('-');
      const monthKey = `${year}-${month}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          label: new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
          dates: []
        };
      }
      
      groups[monthKey].dates.push(date);
    });
    
    return Object.values(groups).sort((a, b) => 
      a.dates[0].localeCompare(b.dates[0])
    );
  }, [dateRange]);

  if (dateRange.length === 0) {
    return (
      <div className="p-4 text-secondary-500 text-center">
        No dates available for selection
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Select all with staff count */}
      <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg border border-secondary-200 mb-4">
        <div className="flex items-center">
          <span className="text-sm font-medium text-secondary-700 mr-2">Staff per date:</span>
          <input
            type="number"
            min="1"
            value={bulkStaffCount}
            onChange={e => setBulkStaffCount(e.target.value)}
            className="w-16 border rounded p-1 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <button
          type="button"
          onClick={selectAllWithStaffCount}
          className="ml-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors text-xs font-medium flex items-center"
        >
          <CheckIcon className="h-3.5 w-3.5 mr-1.5" />
          Select All Dates
        </button>
      </div>

      {groupedDates.map(group => (
        <div key={group.label} className="space-y-3">
          <h4 className="text-sm font-medium text-secondary-700">{group.label}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {group.dates.map(date => {
              const selected = valueMap[date] !== undefined;
              const [_, __, day] = date.split('-');
              const dayOfWeek = new Date(date).getDay();
              const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
              
              return (
                <div 
                  key={date} 
                  onClick={() => handleToggleDate(date)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-all duration-150
                    ${selected 
                      ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-l-4 border-primary-500 shadow-sm' 
                      : 'bg-white border border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        selected ? 'bg-primary-500 text-white' : 'bg-secondary-100'
                      }`}>
                        {selected ? <CheckIcon className="h-3 w-3" /> : <span className="text-xs">{parseInt(day)}</span>}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{date}</span>
                        <span className="text-xs ml-1 text-secondary-500">({dayNames[dayOfWeek]})</span>
                      </div>
                    </div>
                  </div>
                  
                  {selected && (
                    <div className="mt-3 flex items-center border-t border-primary-100 pt-2">
                      <UserGroupIcon className="h-4 w-4 text-primary-500 mr-2" />
                      <input
                        type="number"
                        min="1"
                        value={valueMap[date]}
                        onChange={e => handleStaffCountChange(date, parseInt(e.target.value) || 1)}
                        className="w-16 border rounded p-1 text-sm focus:border-primary-500 focus:ring-primary-500"
                        onClick={e => e.stopPropagation()}
                        placeholder="Staff"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
