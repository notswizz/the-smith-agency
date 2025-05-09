import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import Link from 'next/link';
import { CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import useStore from '@/lib/hooks/useStore';
import 'react-calendar/dist/Calendar.css';

export default function ShowsCalendar() {
  const [value, setValue] = useState(new Date());
  const [showDates, setShowDates] = useState({});
  const { shows, getClientById } = useStore();
  
  useEffect(() => {
    // Create mapping of dates with shows
    const dateMap = {};
    
    shows.forEach(show => {
      if (show.startDate && show.endDate) {
        const startDate = new Date(show.startDate);
        const endDate = new Date(show.endDate);
        
        // Add all days between start and end dates
        const curDate = new Date(startDate);
        while (curDate <= endDate) {
          const dateKey = curDate.toISOString().split('T')[0];
          
          if (!dateMap[dateKey]) {
            dateMap[dateKey] = [];
          }
          
          dateMap[dateKey].push({
            id: show.id,
            name: show.name,
            clientId: show.client,
            color: getShowColor(show.id)
          });
          
          curDate.setDate(curDate.getDate() + 1);
        }
      }
    });
    
    setShowDates(dateMap);
  }, [shows]);
  
  // Generate a consistent color based on show id
  const getShowColor = (id) => {
    // Generate a hash from the string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate colors based on modulo
    const colors = [
      'bg-primary-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 
      'bg-violet-500', 'bg-rose-500', 'bg-cyan-500', 'bg-orange-500'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Custom tile content to show show indicators
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const dateKey = date.toISOString().split('T')[0];
    const datesShows = showDates[dateKey] || [];
    
    if (datesShows.length === 0) return null;
    
    return (
      <div className="calendar-shows-indicators">
        {datesShows.slice(0, 3).map((show, i) => (
          <div 
            key={i} 
            className={`${show.color} h-1.5 w-1.5 rounded-full mx-0.5 inline-block`} 
            title={show.name}
          />
        ))}
        {datesShows.length > 3 && (
          <div className="text-xs text-secondary-600 mt-0.5 font-medium">+{datesShows.length - 3}</div>
        )}
      </div>
    );
  };
  
  // Handle clicking on a date with shows
  const handleDayClick = (value) => {
    setValue(value);
    
    // We could add functionality to show a modal with shows for this date
    // or navigate to a filtered list of shows for this date
  };
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-primary-600" />
          <h3 className="text-base font-medium text-secondary-900">Shows Calendar</h3>
        </div>
        <Link href="/shows" className="text-sm text-primary-600 hover:text-primary-800 flex items-center">
          All shows
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      <div className="calendar-container">
        <style jsx global>{`
          /* Custom calendar styling */
          .calendar-container .react-calendar {
            border: none;
            width: 100%;
            background: transparent;
            font-family: inherit;
          }
          .calendar-container .react-calendar__tile {
            padding: 0.6em 0.5em;
            position: relative;
            height: 2.8em;
          }
          .calendar-container .react-calendar__month-view__weekdays__weekday {
            text-transform: capitalize;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.8rem;
            color: #6b7280;
            padding-bottom: 0.5em;
          }
          .calendar-container .react-calendar__month-view__weekdays__weekday abbr {
            text-decoration: none;
          }
          .calendar-container .react-calendar__tile--now {
            background: #f0f9ff;
          }
          .calendar-container .react-calendar__tile--active {
            background: #dbeafe;
            color: #1e40af;
          }
          .calendar-container .react-calendar__tile:enabled:hover,
          .calendar-container .react-calendar__tile:enabled:focus {
            background-color: #e0f2fe;
          }
          .calendar-container .react-calendar__navigation button:enabled:hover,
          .calendar-container .react-calendar__navigation button:enabled:focus {
            background-color: #e0f2fe;
          }
          .calendar-container .react-calendar__navigation {
            margin-bottom: 0.5em;
          }
          .calendar-shows-indicators {
            position: absolute;
            bottom: 2px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
          }
        `}</style>
        <Calendar
          onChange={handleDayClick}
          value={value}
          tileContent={tileContent}
          className="shadow-none border-none"
          prevLabel="‹"
          nextLabel="›"
          prev2Label={null}
          next2Label={null}
        />
      </div>
      
      {/* Shows for selected date */}
      {value && (
        <div className="mt-4 pt-4 border-t border-secondary-200">
          <div className="text-sm font-medium text-secondary-700">
            {value.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="mt-2">
            {(() => {
              const dateKey = value.toISOString().split('T')[0];
              const datesShows = showDates[dateKey] || [];
              
              if (datesShows.length === 0) {
                return <p className="text-xs text-secondary-500">No shows on this date</p>;
              }
              
              return (
                <div className="space-y-2">
                  {datesShows.map((show, i) => {
                    const client = getClientById(show.clientId);
                    return (
                      <Link 
                        key={i} 
                        href={`/shows/${show.id}`}
                        className="block py-1.5 px-2 hover:bg-secondary-50 rounded-md transition-colors"
                      >
                        <div className="flex items-center">
                          <div className={`${show.color} h-2.5 w-2.5 rounded-full mr-2`}></div>
                          <div>
                            <div className="text-sm font-medium text-secondary-800">{show.name}</div>
                            {client && (
                              <div className="text-xs text-secondary-500">{client.name}</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
} 