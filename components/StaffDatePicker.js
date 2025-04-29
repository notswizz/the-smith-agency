import React from 'react';

/**
 * StaffDatePicker component
 * Props:
 *  - dateRange: array of YYYY-MM-DD strings (all valid dates for the show)
 *  - value: array of { date, staffCount }
 *  - onChange: function(newValue)
 */
export default function StaffDatePicker({ dateRange, value, onChange }) {
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

  return (
    <>
      <div className="bg-green-100 text-green-800 font-bold text-center p-2 rounded mb-4 border border-green-400">
        NEW STAFF DATE PICKER ACTIVE
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {dateRange.map(date => {
          const selected = valueMap[date] !== undefined;
          return (
            <div key={date} className={`p-3 border rounded-md ${selected ? 'border-primary-500 bg-blue-50' : 'border-secondary-200'}`}>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => handleToggleDate(date)}
                  className="h-4 w-4 border-secondary-300 rounded"
                />
                <span className="text-sm">{date}</span>
              </label>
              {selected && (
                <input
                  type="number"
                  min="1"
                  value={valueMap[date]}
                  onChange={e => handleStaffCountChange(date, parseInt(e.target.value) || 1)}
                  className="w-full mt-2 border rounded p-1 text-sm"
                  placeholder="Staff needed"
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
