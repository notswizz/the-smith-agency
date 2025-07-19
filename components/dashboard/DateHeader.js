import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import useStore from '@/lib/hooks/useStore';
import { MagnifyingGlassIcon, XMarkIcon, UserGroupIcon, BuildingOffice2Icon, CalendarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { createPortal } from 'react-dom';

export default function DateHeader() {
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
        return <span className="text-xs px-1.5 py-0.5 rounded bg-primary-50 text-primary-500">Staff</span>;
      case 'client':
        return <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-500">Client</span>;
      case 'booking':
        return <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-500">Booking</span>;
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
        className="search-results-dropdown bg-white shadow-2xl rounded-xl border border-secondary-200 overflow-hidden"
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
          <ul className="max-h-[60vh] overflow-y-auto py-2 divide-y divide-secondary-100">
            {results.map((result, index) => (
              <li key={`${result.type}-${result.id}`}>
                <button 
                  onClick={() => handleResultClick(result.url)}
                  className={`block w-full text-left px-4 py-3 transition-colors ${
                    index === selectedIndex ? 'bg-secondary-100' : 'hover:bg-secondary-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getIconForType(result.type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-secondary-900 line-clamp-1">{result.title}</div>
                        <div className="text-xs text-secondary-500 line-clamp-1">{result.subtitle}</div>
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
            <div className="py-4 px-4 text-center text-sm text-secondary-500">
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

  return (
    <div className="mb-6 sm:mb-8 overflow-visible">
      <div className="relative p-4 sm:p-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/70 transition-all duration-300 hover:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          {/* Date section */}
          <div className="flex items-center">
            {/* Elegant date badge */}
            <div className="flex-shrink-0 mr-4">
              <div className="relative">
                {/* Main date circle */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg flex items-center justify-center relative overflow-hidden">
                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  
                  {/* Date content */}
                  <div className="text-center relative z-10">
                    <div className="text-white text-xs font-semibold uppercase tracking-wider leading-none">
                      {month}
                    </div>
                    <div className="text-white text-2xl sm:text-3xl font-bold leading-none">
                      {day}
                    </div>
                  </div>
                </div>
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-full bg-primary-400/20 blur-xl scale-110"></div>
              </div>
            </div>
            
            {/* Clean date text */}
            <div>
              <p className="text-lg sm:text-xl font-semibold text-secondary-800 tracking-tight">
                {weekday}
              </p>
              <p className="text-sm text-secondary-500 mt-0.5 flex items-center">
                <span className="inline-block w-1.5 h-1.5 bg-secondary-400 rounded-full mr-2"></span>
                {time}
              </p>
            </div>
          </div>
          
          {/* Search section */}
          <div className="flex-1 lg:max-w-md xl:max-w-lg">
            <div className="relative w-full" ref={searchRef}>
              <div className="relative z-30 animated-search-border hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-500" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  className="block w-full bg-white pl-9 sm:pl-11 pr-9 sm:pr-11 py-2.5 sm:py-3.5 rounded-xl focus:outline-none text-sm sm:text-base shadow-lg placeholder-secondary-400 transition-all border border-transparent"
                  placeholder="Search staff, clients, or bookings..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  aria-label="Search across The Smith Agency"
                />
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={handleClear}
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-400 hover:text-secondary-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-primary-500/5 to-transparent rounded-tl-full"></div>
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-br-full"></div>
      </div>
      
      {/* Render search results in a portal */}
      <SearchResultsPortal />
      
      {/* Custom styles for animated search border */}
      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animated-search-border::before {
          content: "";
          position: absolute;
          inset: -2px;
          z-index: -1;
          border-radius: 16px;
          background: linear-gradient(
            -45deg, 
            #ff3366, 
            #ff9933, 
            #ffcc33, 
            #33ccff, 
            #9966ff
          );
          background-size: 400% 400%;
          animation: gradient 8s ease infinite;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .animated-search-border:focus-within::before {
          opacity: 1;
        }

        .search-results-dropdown {
          z-index: 9999 !important;
          position: absolute !important;
        }
      `}</style>
    </div>
  );
} 