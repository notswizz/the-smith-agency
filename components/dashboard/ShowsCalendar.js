import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import Link from 'next/link';
import { CalendarIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
      'bg-violet-500', 'bg-rose-500', 'bg-cyan-500', 'bg-blue-500'
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
      <div className="calendar-shows-indicators flex flex-wrap justify-center items-center gap-0.5 pt-1">
        {datesShows.slice(0, 3).map((show, i) => (
          <div 
            key={i} 
            className={`${show.color} h-2 w-2 rounded-full shadow-sm flex-shrink-0 scale-100 hover:scale-125 transition-transform`} 
            title={show.name}
          />
        ))}
        {datesShows.length > 3 && (
          <div className="text-2xs text-secondary-600 font-medium px-1 py-0.5 rounded-full bg-secondary-100 shadow-inner">
            +{datesShows.length - 3}
          </div>
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
  
  // Custom navigation component
  const CustomNavigation = ({ onNext, onPrev, label }) => (
    <div className="flex items-center justify-between py-2 px-1 mb-3">
      <button 
        onClick={onPrev}
        className="p-1.5 rounded-lg hover:bg-primary-50 text-secondary-700 hover:text-primary-600 transition-colors flex items-center justify-center"
        title="Previous month"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <h3 className="text-base font-semibold text-secondary-800">{label}</h3>
      <button 
        onClick={onNext}
        className="p-1.5 rounded-lg hover:bg-primary-50 text-secondary-700 hover:text-primary-600 transition-colors flex items-center justify-center"
        title="Next month"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
  
  return (
    <div>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900">Shows Calendar</h3>
        </div>
        <Link href="/shows" className="text-sm text-blue-600 hover:text-blue-800 flex items-center group transition-colors">
          All shows
          <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
      
      <div className="calendar-container rounded-xl bg-white/90 backdrop-blur-sm p-6 border border-white/80 shadow-lg hover:shadow-xl transition-all duration-300">
        <style jsx global>{`
          /* Custom calendar styling */
          .calendar-container .react-calendar {
            border: none;
            width: 100%;
            background: transparent;
            font-family: inherit;
            box-shadow: none;
          }
          .calendar-container .react-calendar__tile {
            padding: 0.5em 0.25em;
            position: relative;
            height: 3.2em;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
            margin: 2px;
            font-size: 0.85rem;
            font-weight: 500;
          }
          .calendar-container .react-calendar__month-view__weekdays__weekday {
            text-transform: uppercase;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.75rem;
            color: #6b7280;
            padding-bottom: 1em;
            letter-spacing: 0.05em;
          }
          .calendar-container .react-calendar__month-view__weekdays__weekday abbr {
            text-decoration: none;
          }
          .calendar-container .react-calendar__tile--now {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            font-weight: bold;
            color: white;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          .calendar-container .react-calendar__tile--active {
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            color: #1e40af;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
          }
          .calendar-container .react-calendar__tile:enabled:hover,
          .calendar-container .react-calendar__tile:enabled:focus {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border-radius: 0.5rem;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(148, 163, 184, 0.15);
          }
          .calendar-container .react-calendar__navigation button:enabled:hover,
          .calendar-container .react-calendar__navigation button:enabled:focus {
            background-color: transparent;
          }
          .calendar-container .react-calendar__navigation {
            display: none;
          }
          .calendar-container .react-calendar__month-view__weekdays {
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 0.5rem;
          }
          .calendar-container .react-calendar__month-view__days {
            gap: 2px;
          }
          .calendar-container .react-calendar__tile--hasActive {
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          }
          .calendar-shows-indicators {
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            padding: 0 2px;
          }
        `}</style>
        
        {/* Custom navigation control */}
        <CustomNavigation 
          onNext={() => {
            const newDate = new Date(value);
            newDate.setMonth(newDate.getMonth() + 1);
            setValue(newDate);
          }}
          onPrev={() => {
            const newDate = new Date(value);
            newDate.setMonth(newDate.getMonth() - 1);
            setValue(newDate);
          }}
          label={value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        />
        
        <Calendar
          onChange={handleDayClick}
          value={value}
          tileContent={tileContent}
          className="w-full"
          prevLabel={null}
          nextLabel={null}
          prev2Label={null}
          next2Label={null}
          showNavigation={false}
        />
      </div>
      
      {/* Shows for selected date - now with enhanced styling */}
      {value && (
        <div className="mt-5 pt-4 border-t border-secondary-200">
          <div className="text-sm font-medium text-secondary-700 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1.5 text-primary-500" />
            {value.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="mt-3">
            {(() => {
              const dateKey = value.toISOString().split('T')[0];
              const datesShows = showDates[dateKey] || [];
              
              if (datesShows.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-4 px-3 rounded-xl bg-secondary-50 border border-secondary-100 text-center">
                    <CalendarIcon className="h-6 w-6 text-secondary-400 mb-2" />
                    <p className="text-sm text-secondary-500">No shows scheduled for this date</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-2.5">
                  {datesShows.map((show, i) => {
                    const client = getClientById(show.clientId);
                    return (
                      <Link 
                        key={i} 
                        href={`/shows/${show.id}`}
                        className="flex items-center py-2 px-3 hover:bg-secondary-50 rounded-xl transition-colors border border-transparent hover:border-secondary-100"
                      >
                        <div className={`${show.color} h-3 w-3 rounded-full mr-3 shadow-sm`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-secondary-900 truncate">{show.name}</div>
                          {client && (
                            <div className="text-xs text-secondary-500 truncate">{client.name}</div>
                          )}
                        </div>
                        <ArrowRightIcon className="h-3.5 w-3.5 text-secondary-400 flex-shrink-0 ml-2 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
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