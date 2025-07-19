import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import useStore from '@/lib/hooks/useStore';
import { MagnifyingGlassIcon, XMarkIcon, UserGroupIcon, BuildingOffice2Icon, CalendarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { createPortal } from 'react-dom';

export default function DateHeader({ sidebar }) {
  const { staff, clients, bookings, shows } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Format date
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleDateString('en-US', { month: 'short' });
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
  const time = today.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  // Set mounted state for client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle clicks outside the search component to close results
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target) && 
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchRef, dropdownRef]);

  // Position dropdown correctly relative to the search input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen, searchTerm]);

  // Reset search dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, [router.asPath]);

  // Search across data sources when searchTerm changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const searchResults = [];
    
    // Search Staff
    staff.forEach(person => {
      const fullName = person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim();
      if (fullName.toLowerCase().includes(term) || 
          person.email?.toLowerCase().includes(term) ||
          person.phone?.includes(term)) {
        searchResults.push({
          id: person.id,
          type: 'staff',
          title: fullName,
          subtitle: person.email || 'No email',
          url: `/staff/${person.id}`
        });
      }
    });
    
    // Search Clients
    clients.forEach(client => {
      if (client.name.toLowerCase().includes(term) || 
          client.email?.toLowerCase().includes(term) ||
          client.phone?.includes(term) ||
          client.location?.toLowerCase().includes(term)) {
        searchResults.push({
          id: client.id,
          type: 'client',
          title: client.name,
          subtitle: client.location || 'No location',
          url: `/clients/${client.id}`
        });
      }
    });
    
    // Search Bookings
    bookings.forEach(booking => {
      const client = clients.find(c => c.id === booking.clientId);
      const show = shows.find(s => s.id === booking.showId);
      
      if (client?.name.toLowerCase().includes(term) || 
          show?.name.toLowerCase().includes(term) ||
          booking.notes?.toLowerCase().includes(term)) {
        searchResults.push({
          id: booking.id,
          type: 'booking',
          title: show ? show.name : 'Unknown Show',
          subtitle: client ? client.name : 'Unknown Client',
          url: `/bookings/${booking.id}`
        });
      }
    });
    
    // Limit results to top 8
    setResults(searchResults.slice(0, 8));
  }, [searchTerm, staff, clients, bookings, shows]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prevIndex => 
          prevIndex < results.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prevIndex => 
          prevIndex > 0 ? prevIndex - 1 : 0
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex].url);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  }, [isOpen, results, selectedIndex]);

  // Attach keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Reset selectedIndex when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'staff':
        return <UserGroupIcon className="h-4 w-4 text-primary-400" />;
      case 'client':
        return <BuildingOffice2Icon className="h-4 w-4 text-indigo-400" />;
      case 'booking':
        return <CalendarIcon className="h-4 w-4 text-emerald-400" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'staff':
        return <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">Staff</span>;
      case 'client':
        return <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">Client</span>;
      case 'booking':
        return <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">Booking</span>;
      default:
        return null;
    }
  };

  // Render search results in a portal
  const SearchResultsPortal = () => {
    if (!isMounted || !isOpen) return null;
    
    return createPortal(
      <div 
        ref={dropdownRef}
        className="search-results-dropdown bg-black-950 shadow-2xl rounded-xl border-2 border-primary-500 overflow-hidden"
        style={{
          position: 'absolute',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          maxHeight: '60vh',
          zIndex: 9999
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {results.length > 0 ? (
          <ul className="max-h-[60vh] overflow-y-auto py-2 divide-y divide-primary-500/20">
            {results.map((result, index) => (
              <li key={`${result.type}-${result.id}`}>
                <button 
                  onClick={() => handleResultClick(result.url)}
                  className={`block w-full text-left px-4 py-3 transition-colors ${
                    index === selectedIndex ? 'bg-primary-500/20' : 'hover:bg-primary-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getIconForType(result.type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-white line-clamp-1">{result.title}</div>
                        <div className="text-xs text-black-400 line-clamp-1">{result.subtitle}</div>
                      </div>
                    </div>
                    <div>
                      {getTypeLabel(result.type)}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          searchTerm && (
            <div className="py-4 px-4 text-center text-sm text-black-400">
              No results found
            </div>
          )
        )}
      </div>,
      document.body
    );
  };

  // Add click handler for search results
  const handleResultClick = (url) => {
    setTimeout(() => {
      router.push(url);
      setIsOpen(false);
      setSearchTerm('');
    }, 10);
  };

  if (sidebar) {
    return (
      <div className="w-full flex justify-center items-center py-1">
        <div className="w-full bg-white border border-black rounded-lg p-2 text-center shadow-md">
          <div className="flex flex-col items-center">
            <div className="flex items-end justify-center mb-0.5">
              <span className="text-lg font-serif font-semibold leading-none mr-1 text-black">{month}</span>
              <span className="text-2xl font-serif font-black leading-none text-black">{day}</span>
            </div>
            <div className="text-xs font-serif text-gray-500 opacity-90 font-medium">{weekday} • {time}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mb-10">
      {/* Title/Search and Calendar Row */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Column: Title and Search */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Agency Branding */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 bg-clip-text text-transparent drop-shadow-sm">
              The Smith Agency
            </h1>
            <p className="text-secondary-600 text-sm sm:text-base mt-2 font-medium">Premier Boutique Staffing</p>
          </div>

          {/* Enhanced Global Search */}
          <div className="relative group" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400 group-focus-within:text-primary-500 transition-colors duration-300" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                className="block w-full pl-14 pr-14 py-4 sm:py-5 border-2 border-primary-500 rounded-2xl bg-white text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 shadow-xl hover:shadow-2xl hover:border-primary-400 transition-all duration-300 text-base sm:text-lg font-medium"
                placeholder="Search staff, clients, or bookings..."
              />
              {searchTerm && (
                <button
                  onClick={handleClear}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-secondary-400 hover:text-secondary-600 transition-colors duration-200 hover:scale-110"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* Enhanced Search Results Dropdown */}
            {isMounted && isOpen && results.length > 0 && (
              <SearchResultsPortal />
            )}
          </div>
        </div>

        {/* Enhanced Date/Time Card */}
        <div className="w-full lg:w-auto bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 rounded-2xl p-5 sm:p-6 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1 relative overflow-hidden group">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-500"></div>
          
          <div className="flex flex-row items-center justify-between relative z-10">
            <div className="text-left">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black mb-2 drop-shadow-lg leading-none">{day}</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 drop-shadow-md tracking-wide">{month}</div>
              <div className="text-sm sm:text-base lg:text-lg opacity-90 drop-shadow-sm font-medium">{weekday} • {time}</div>
            </div>
            <div className="ml-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg group-hover:bg-white/25 transition-all duration-300">
                <CalendarIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-sm" />
              </div>
            </div>
          </div>
          
          {/* Subtle wave pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 Q25,40 50,50 T100,50 L100,100 L0,100 Z" fill="white"/>
              <path d="M0,60 Q25,70 50,60 T100,60 L100,100 L0,100 Z" fill="white"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 