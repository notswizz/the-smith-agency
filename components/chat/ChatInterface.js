import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, UserIcon, CalendarIcon, UsersIcon, ClipboardIcon, BuildingOfficeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Card components for displaying structured data
const BookingCard = ({ booking }) => {
  // Safety check for missing booking
  if (!booking || typeof booking !== 'object') {
    console.error("BookingCard received invalid booking data:", booking);
    return (
      <div className="bg-red-50 rounded-lg shadow-sm overflow-hidden min-w-[280px] max-w-[320px] border border-red-200 p-4">
        <p className="text-sm text-red-800 font-medium">Error: Invalid booking data</p>
      </div>
    );
  }
  
  // Helper to safely extract client name
  const getClientName = () => {
    try {
      // Debug client data structure but with safer property access
      console.log("Client data:", 
        booking.client ? JSON.stringify(booking.client).substring(0, 100) : "missing", 
        "ClientId:", booking.clientId || "missing");
      
      // First check for direct name property on client - this is the primary format
      if (booking.client && booking.client.name) {
        return booking.client.name;
      }
      
      // Then check nested contacts structure if it exists and is an object
      if (booking.client && booking.client.contacts) {
        // Handle contacts as object
        if (typeof booking.client.contacts === 'object' && !Array.isArray(booking.client.contacts) && booking.client.contacts.name) {
          return booking.client.contacts.name;
        }
        
        // Handle contacts as array with objects containing name
        if (Array.isArray(booking.client.contacts) && booking.client.contacts.length > 0) {
          const contact = booking.client.contacts.find(c => c && c.name);
          if (contact) return contact.name;
        }
      }
      
      // Other fallbacks
      if (booking.client) {
        if (typeof booking.client === 'string') return booking.client;
        if (booking.client.contactInfo) return booking.client.contactInfo;
      }
      
      // Check for client reference structure where client might be in a nested object
      if (booking.clientId) {
        // Try to find client from clientId with different formats
        if (typeof booking.clientId === 'object' && booking.clientId.name) {
          return booking.clientId.name;
        }
        if (typeof booking.clientId === 'string') {
          // Just return "Client" instead of showing the ID
          return "Client";
        }
      }
      
      // Check if the client object might be in a different format
      for (const key in booking) {
        if (key.toLowerCase().includes('client') && typeof booking[key] === 'object') {
          // Check for direct name property first
          if (booking[key].name) {
            return booking[key].name;
          }
          
          // Then try contacts if it exists
          if (booking[key].contacts) {
            // Handle contacts as object
            if (typeof booking[key].contacts === 'object' && !Array.isArray(booking[key].contacts) && booking[key].contacts.name) {
              return booking[key].contacts.name;
            }
            
            // Handle contacts as array
            if (Array.isArray(booking[key].contacts) && booking[key].contacts.length > 0) {
              const contact = booking[key].contacts.find(c => c && c.name);
              if (contact) return contact.name;
            }
          }
        }
      }
      
      // Default fallback
      return "Unknown Client";
    } catch (error) {
      console.error("Error getting client name:", error);
      return "Unknown Client";
    }
  };

  // Helper to get client location if available
  const getClientLocation = () => {
    try {
      // First check for direct location property
      if (booking.client && booking.client.location) {
        return booking.client.location;
      }
      
      // Then check contacts structure if available
      if (booking.client && booking.client.contacts) {
        // Handle contacts as object
        if (typeof booking.client.contacts === 'object' && !Array.isArray(booking.client.contacts) && booking.client.contacts.location) {
          return booking.client.contacts.location;
        }
        
        // Handle contacts as array
        if (Array.isArray(booking.client.contacts) && booking.client.contacts.length > 0) {
          const contact = booking.client.contacts.find(c => c && c.location);
          if (contact) return contact.location;
        }
      }
      
      // Check other potential client objects
      for (const key in booking) {
        if (key.toLowerCase().includes('client') && typeof booking[key] === 'object') {
          if (booking[key].location) {
            return booking[key].location;
          }
          
          if (booking[key].contacts) {
            // Handle contacts as object
            if (typeof booking[key].contacts === 'object' && !Array.isArray(booking[key].contacts) && booking[key].contacts.location) {
              return booking[key].contacts.location;
            }
            
            // Handle contacts as array
            if (Array.isArray(booking[key].contacts) && booking[key].contacts.length > 0) {
              const contact = booking[key].contacts.find(c => c && c.location);
              if (contact) return contact.location;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting client location:", error);
      return null;
    }
  };

  // Helper to get client contact info
  const getClientContact = () => {
    try {
      // First check for direct email/phone properties
      if (booking.client) {
        if (booking.client.email) return booking.client.email;
        if (booking.client.phone) return booking.client.phone;
        if (booking.client.contactInfo) return booking.client.contactInfo;
      }
      
      // Then check contacts structure if available
      if (booking.client && booking.client.contacts) {
        // Handle contacts as object
        if (typeof booking.client.contacts === 'object' && !Array.isArray(booking.client.contacts)) {
          if (booking.client.contacts.email) return booking.client.contacts.email;
          if (booking.client.contacts.phone) return booking.client.contacts.phone;
        }
        
        // Handle contacts as array
        if (Array.isArray(booking.client.contacts) && booking.client.contacts.length > 0) {
          const contactWithEmail = booking.client.contacts.find(c => c && c.email);
          if (contactWithEmail) return contactWithEmail.email;
          
          const contactWithPhone = booking.client.contacts.find(c => c && c.phone);
          if (contactWithPhone) return contactWithPhone.phone;
        }
      }
      
      // Check other potential client objects
      for (const key in booking) {
        if (key.toLowerCase().includes('client') && typeof booking[key] === 'object') {
          if (booking[key].email) return booking[key].email;
          if (booking[key].phone) return booking[key].phone;
          if (booking[key].contactInfo) return booking[key].contactInfo;
          
          if (booking[key].contacts) {
            // Handle contacts as object
            if (typeof booking[key].contacts === 'object' && !Array.isArray(booking[key].contacts)) {
              if (booking[key].contacts.email) return booking[key].contacts.email;
              if (booking[key].contacts.phone) return booking[key].contacts.phone;
            }
            
            // Handle contacts as array
            if (Array.isArray(booking[key].contacts) && booking[key].contacts.length > 0) {
              const contactWithEmail = booking[key].contacts.find(c => c && c.email);
              if (contactWithEmail) return contactWithEmail.email;
              
              const contactWithPhone = booking[key].contacts.find(c => c && c.phone);
              if (contactWithPhone) return contactWithPhone.phone;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting client contact:", error);
      return null;
    }
  };

  // Helper to get dates (handle both dates and datesNeeded fields)
  const getDates = () => {
    try {
      // Based on the screenshot, datesNeeded is an array with numbered keys (0, 1, etc.)
      // Each containing a date, staffCount, and staffIds array
      if (booking.datesNeeded && typeof booking.datesNeeded === 'object') {
        // If it's an array-like object with numeric keys or an actual array
        if (Array.isArray(booking.datesNeeded)) {
          // Filter out any invalid date objects
          return booking.datesNeeded.filter(date => date && typeof date === 'object');
        } else {
          // It's an object with numeric keys, convert to array
          const dateEntries = Object.entries(booking.datesNeeded);
          return dateEntries
            .map(([key, value]) => value)
            .filter(item => item && typeof item === 'object');
        }
      } else if (booking.dates && booking.dates.length > 0) {
        return booking.dates.filter(date => date && typeof date === 'object');
      }
      return [];
    } catch (error) {
      console.error("Error processing booking dates:", error);
      return [];
    }
  };

  // Get show display details (includes location, season, type)
  const getShowDisplayDetails = () => {
    const parts = [];
    
    if (booking.showDetails) {
      if (booking.showDetails.location) parts.push(booking.showDetails.location);
      if (booking.showDetails.season) parts.push(booking.showDetails.season);
      if (booking.showDetails.type) parts.push(booking.showDetails.type);
    }
    
    // Try to extract from show name if details aren't available
    if (parts.length === 0 && booking.show) {
      const words = booking.show.split(' ');
      if (words.length > 1) {
        // Try to find location (typically 2-3 letter code)
        const possibleLocation = words.find(word => word.length <= 3 && word === word.toUpperCase());
        if (possibleLocation) parts.push(possibleLocation);
        
        // Look for season and type
        const seasons = ['Summer', 'Fall', 'Winter', 'Spring'];
        const types = ['Bridal', 'Gift', 'Fashion'];
        
        seasons.forEach(season => {
          if (booking.show.includes(season)) parts.push(season);
        });
        
        types.forEach(type => {
          if (booking.show.includes(type)) parts.push(type);
        });
      }
    }
    
    return parts.join(' ');
  };

  // Calculate staff filled percentage
  const getStaffFilledPercentage = () => {
    try {
      // Check if we have staffIds within datesNeeded
      const dates = getDates();
      let totalStaffNeeded = 0;
      let totalStaffAssigned = 0;
      
      if (dates.length > 0) {
        // Calculate using datesNeeded data
        dates.forEach(date => {
          if (!date) return; // Skip invalid dates
          
          const staffCount = date.staffCount || 0;
          let staffAssigned = 0;
          
          if (date.staffIds) {
            if (Array.isArray(date.staffIds)) {
              staffAssigned = date.staffIds.length;
            } else if (typeof date.staffIds === 'object') {
              staffAssigned = Object.keys(date.staffIds).length;
            }
          }
          
          totalStaffNeeded += staffCount;
          totalStaffAssigned += staffAssigned;
        });
        
        if (totalStaffNeeded > 0) {
          return Math.min(100, Math.round((totalStaffAssigned / totalStaffNeeded) * 100));
        }
      }
      
      // Fallback to other booking data formats
      if (booking.staffNeeded && booking.staff && Array.isArray(booking.staff)) {
        return Math.min(100, Math.round((booking.staff.length / booking.staffNeeded) * 100));
      }
      
      if (booking.staffNeeded && booking.assignedStaff && Array.isArray(booking.assignedStaff)) {
        return Math.min(100, Math.round((booking.assignedStaff.length / booking.staffNeeded) * 100));
      }
      
      // If we can't calculate a real percentage, return 0 instead of mock data
      return 0;
    } catch (error) {
      console.error("Error calculating staff percentage:", error);
      return 0;
    }
  };

  // Format date range
  const formatDateRange = () => {
    try {
      const dates = getDates();
      if (!dates || dates.length === 0) return "";
      
      // Filter out dates that don't have a valid date property
      const validDates = dates.filter(d => d && d.date);
      if (validDates.length === 0) return "";
      
      // Sort dates chronologically
      const sortedDates = [...validDates].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      
      // Get first and last date
      let firstDate = sortedDates[0].date;
      let lastDate = sortedDates[sortedDates.length - 1].date;
      
      // Try to parse dates
      try {
        const firstDateObj = new Date(firstDate);
        const lastDateObj = new Date(lastDate);
        
        // If valid dates, format them
        if (!isNaN(firstDateObj) && !isNaN(lastDateObj)) {
          return `${firstDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${lastDateObj.toLocaleDateString('en-US', { day: 'numeric' })}, ${lastDateObj.getFullYear()}`;
        }
      } catch (e) {
        // Return raw dates if parsing fails
        return `${firstDate} - ${lastDate}`;
      }
      
      return `${firstDate} - ${lastDate}`;
    } catch (error) {
      console.error("Error formatting date range:", error);
      return "";
    }
  };

  // Get days count
  const getDaysCount = () => {
    const dates = getDates();
    if (dates.length > 0) {
      // Only count days where staffCount > 0
      const daysWithStaff = dates.filter(d => (d.staffCount || 0) > 0);
      return daysWithStaff.length;
    }
    return booking.daysNeeded || 0;
  };

  // Get staff needed count
  const getStaffNeeded = () => {
    // Check if we have staffCount in dates
    const dates = getDates();
    let totalStaffNeeded = 0;
    
    if (dates.length > 0) {
      // Sum up staffCount from all dates
      dates.forEach(date => {
        totalStaffNeeded += date.staffCount || 0;
      });
      
      if (totalStaffNeeded > 0) {
        return totalStaffNeeded;
      }
    }
    
    return booking.staffNeeded || 0;
  };

  // Get staff assigned count
  const getStaffAssigned = () => {
    // Check if we have staffIds within datesNeeded
    const dates = getDates();
    let totalStaffAssigned = 0;
    
    if (dates.length > 0) {
      // Sum up staffIds.length from all dates
      dates.forEach(date => {
        if (date.staffIds) {
          // Check if staffIds is an array or an object with numeric keys
          if (Array.isArray(date.staffIds)) {
            totalStaffAssigned += date.staffIds.length;
          } else if (typeof date.staffIds === 'object') {
            totalStaffAssigned += Object.keys(date.staffIds).length;
          }
        }
      });
      
      return totalStaffAssigned;
    }
    
    // Fallback to other booking data formats
    if (booking.staff && Array.isArray(booking.staff)) {
      return booking.staff.length;
    }
    if (booking.assignedStaff && Array.isArray(booking.assignedStaff)) {
      return booking.assignedStaff.length;
    }
    
    return 0;
  };

  // Get status
  const getStatus = () => {
    return booking.status || "pending";
  };

  // Get percentage color class
  const getPercentageColorClass = (percentage) => {
    if (percentage < 40) return "bg-red-400";
    if (percentage < 70) return "bg-orange-400";
    return "bg-green-400";
  };
  
  // Get booking ID or fallback
  const getBookingId = () => {
    try {
      return booking.id || '';
    } catch (error) {
      console.error("Error getting booking ID:", error);
      return '';
    }
  };

  const clientName = getClientName();
  const showDetails = getShowDisplayDetails();
  const dateRange = formatDateRange();
  const daysCount = getDaysCount();
  const staffNeeded = getStaffNeeded();
  const staffAssigned = getStaffAssigned();
  const status = getStatus();
  const staffPercentage = getStaffFilledPercentage();
  const percentageColorClass = getPercentageColorClass(staffPercentage);
  const bookingId = getBookingId();
  
  // Handle card click to navigate to booking page
  const handleCardClick = (e) => {
    try {
      // Prevent default if it's a link or button
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || 
          e.target.closest('a') || e.target.closest('button')) {
        return;
      }
      
      // Log for debugging
      console.log('Card clicked, navigating to:', `/bookings/${bookingId}`, bookingId);
      
      // Navigate to booking page if ID exists
      if (bookingId) {
        window.location.href = `/bookings/${bookingId}`;
      } else {
        console.warn('No booking ID available for navigation');
        // Don't navigate anywhere if there's no ID
      }
    } catch (error) {
      console.error("Error in card click handler:", error);
    }
  };

  // For debugging, dump booking data to console
  useEffect(() => {
    if (booking && booking.id) {
      console.debug("BookingCard data:", {
        id: booking.id,
        show: booking.show,
        clientId: booking.clientId,
        clientName: getClientName(),
        datesNeeded: getDates(),
        staffCount: getStaffNeeded(),
        staffAssigned: getStaffAssigned(),
        staffPercentage: getStaffFilledPercentage()
      });
    }
  }, [booking]);

  return (
    <div 
      className="bg-white rounded-lg shadow-sm overflow-hidden min-w-[280px] max-w-[320px] border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleCardClick}
    >
      {/* Status badge */}
      <div className="px-4 pt-4 pb-0 flex justify-between items-start">
        {status === "confirmed" && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="mr-1 h-3 w-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Confirmed
          </div>
        )}
        {status === "pending" && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </div>
        )}
        {status !== "confirmed" && status !== "pending" && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </div>
        )}
        
        {/* Edit icon */}
        <button 
          className="text-gray-400 hover:text-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            if (bookingId) {
              window.location.href = `/bookings/${bookingId}/edit`;
            }
          }}
        >
          <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
      
      {/* Client and show */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-md flex items-center justify-center">
            <svg className="h-6 w-6 text-red-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
              <path d="M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
              <path d="M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-base font-medium text-gray-900">{clientName}</h3>
            <p className="text-sm text-gray-600">{showDetails}</p>
          </div>
        </div>
      </div>
      
      {/* Date */}
      <div className="px-4 py-2 flex items-center text-sm text-gray-600">
        <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {dateRange}
      </div>
      
      {/* Days and Staff */}
      <div className="px-4 py-2 flex justify-between items-center text-sm">
        <div className="flex items-center">
          <span className="text-gray-800 font-medium">{daysCount} Days</span>
        </div>
        <div className="flex items-center">
          <svg className="mr-1 h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-gray-800 font-medium">{staffAssigned}/{staffNeeded} Staff</span>
        </div>
      </div>
      
      {/* Staff Progress Bar */}
      <div className="px-4 py-2">
        <div className="text-xs text-gray-700 flex justify-between mb-1">
          <span>Staff Filled</span>
          <span>{staffPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`${percentageColorClass} h-2 rounded-full`} style={{ width: `${staffPercentage}%` }}></div>
        </div>
      </div>
      
      {/* Calendar Indicators */}
      <div className="mt-2 flex justify-between border-t border-gray-100">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-yellow-400 h-2 flex-1"></div>
        ))}
        <div key="last" className="bg-yellow-400 h-2 flex-1"></div>
      </div>
      
      {/* View Details link - only show if there's a valid ID */}
      {bookingId ? (
        <div className="py-2 px-4 bg-gray-50 text-right">
          <a 
            href={`/bookings/${bookingId}`} 
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-end"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click handler from firing
            }}
          >
            View Details
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="py-2 px-4 bg-gray-50 text-right">
          <span className="text-sm text-gray-400">
            No details available
          </span>
        </div>
      )}
    </div>
  );
};

const ClientCard = ({ client }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden min-w-[220px] max-w-[280px] h-full flex flex-col">
      <div className="bg-emerald-600 text-white px-3 py-1.5 flex items-center">
        <BuildingOfficeIcon className="h-4 w-4 mr-1.5" />
        <h3 className="font-medium text-sm truncate">{client.name}</h3>
      </div>
      <div className="p-3 space-y-2 flex-1">
        {client.contactInfo && (
          <div className="flex items-start">
            <UserIcon className="h-4 w-4 text-gray-500 mr-1.5 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Contact</p>
              <p className="text-xs truncate">{client.contactInfo}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StaffCard = ({ staff }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden min-w-[220px] max-w-[280px] h-full flex flex-col border border-purple-200 hover:shadow-md transition-shadow">
      <div className="bg-purple-600 text-white px-3 py-2 flex items-center">
        <UserIcon className="h-4 w-4 mr-1.5" />
        <h3 className="font-medium text-sm truncate">{staff.name}</h3>
      </div>
      <div className="p-4 space-y-3 flex-1 border-t border-purple-100">
        {staff.role && (
          <div className="flex items-start">
            <ClipboardIcon className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5 font-medium">Role</p>
              <p className="text-sm truncate text-gray-700">{staff.role}</p>
            </div>
          </div>
        )}
        
        {staff.contactInfo && (
          <div className="flex items-start">
            <UserIcon className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5 font-medium">Contact</p>
              <p className="text-sm truncate text-gray-700">{staff.contactInfo}</p>
            </div>
          </div>
        )}
        
        {staff.availability && staff.availability.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Available dates</p>
            <div className="flex flex-wrap gap-1.5">
              {staff.availability.slice(0, 3).map((date, idx) => (
                <span key={idx} className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full truncate border border-purple-200">
                  {date}
                </span>
              ))}
              {staff.availability.length > 3 && (
                <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded-full border border-gray-200">
                  +{staff.availability.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CardList = ({ items, type }) => {
  if (!items || items.length === 0) return null;
  
  // Use horizontal scrolling for multiple items
  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-2 -mx-3 px-3">
        <div className="flex space-x-3">
          {items.map((item, index) => {
            try {
              if (type === 'booking') {
                // Simple validation to ensure item is usable
                if (!item || typeof item !== 'object') {
                  console.error("Invalid booking item:", item);
                  return (
                    <div key={index} className="bg-red-50 rounded-lg p-3 border border-red-200 min-w-[250px]">
                      <p className="text-sm text-red-800">Invalid booking data</p>
                    </div>
                  );
                }
                return <BookingCard key={index} booking={item} />;
              } else if (type === 'client') {
                if (!item || typeof item !== 'object') {
                  return (
                    <div key={index} className="bg-red-50 rounded-lg p-3 border border-red-200 min-w-[250px]">
                      <p className="text-sm text-red-800">Invalid client data</p>
                    </div>
                  );
                }
                return <ClientCard key={index} client={item} />;
              } else if (type === 'staff') {
                if (!item || typeof item !== 'object') {
                  return (
                    <div key={index} className="bg-red-50 rounded-lg p-3 border border-red-200 min-w-[250px]">
                      <p className="text-sm text-red-800">Invalid staff data</p>
                    </div>
                  );
                }
                return <StaffCard key={index} staff={item} />;
              } else if (type === 'availability') {
                if (!item || typeof item !== 'object') {
                  return (
                    <div key={index} className="bg-red-50 rounded-lg p-3 border border-red-200 min-w-[250px]">
                      <p className="text-sm text-red-800">Invalid availability data</p>
                    </div>
                  );
                }
                return <StaffAvailabilityCard key={index} staff={item} />;
              }
              return null;
            } catch (error) {
              console.error(`Error rendering ${type} item at index ${index}:`, error);
              return (
                <div key={index} className="bg-red-50 rounded-lg p-3 border border-red-200 min-w-[250px]">
                  <p className="text-sm text-red-800">Error displaying {type}</p>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};

// Function to detect and parse JSON in messages
const parseMessageContent = (content) => {
  // Check if content is valid
  if (!content || typeof content !== 'string') {
    console.error("Invalid content passed to parseMessageContent:", content);
    return { 
      text: "Error: Invalid content", 
      jsonData: [{
        type: "error",
        message: "Invalid content provided",
        rawContent: String(content).substring(0, 100)
      }] 
    };
  }
  
  console.log("Parsing message content:", content.substring(0, 100) + (content.length > 100 ? "..." : ""));
  
  // Check if content is a raw JSON array by itself (without code blocks)
  if (content.trim().startsWith('[') && content.trim().endsWith(']')) {
    try {
      console.log("Content appears to be a raw JSON array, attempting to parse directly");
      const jsonArray = JSON.parse(content);
      
      if (Array.isArray(jsonArray)) {
        // Check if it's an array of booking objects with type field
        if (jsonArray.length > 0 && jsonArray[0].type === 'booking') {
          const bookingsData = {
            type: "bookings",
            items: jsonArray.map(bookingObj => bookingObj.item)
          };
          console.log("Successfully parsed raw JSON array of bookings:", 
                    `Found ${bookingsData.items.length} booking items`);
          return { 
            text: "[JSON_DATA_0]", 
            jsonData: [bookingsData] 
          };
        }
        
        // If it's just objects with booking data without type
        if (jsonArray.length > 0 && (jsonArray[0].show || jsonArray[0].showId)) {
          const bookingsData = {
            type: "bookings",
            items: jsonArray
          };
          console.log("Successfully parsed raw JSON array of booking-like objects:", 
                    `Found ${bookingsData.items.length} items`);
          return { 
            text: "[JSON_DATA_0]", 
            jsonData: [bookingsData] 
          };
        }
      }
    } catch (e) {
      console.error("Error parsing raw JSON array:", e);
      // Continue with normal parsing since direct parsing failed
    }
  }
  
  // Check if content is a raw JSON object by itself that might be availability data
  if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      console.log("Content appears to be a raw JSON object, attempting to parse directly");
      const jsonObj = JSON.parse(content);
      
      // Check if it's availability data
      if (jsonObj.type === 'availability' && Array.isArray(jsonObj.item)) {
        console.log("Successfully parsed raw availability data:", 
                  `Found ${jsonObj.item.length} staff availability items`);
        return { 
          text: "[JSON_DATA_0]", 
          jsonData: [jsonObj] 
        };
      }
    } catch (e) {
      console.error("Error parsing raw JSON object:", e);
      // Continue with normal parsing since direct parsing failed
    }
  }
  
  // Normal code block parsing
  const jsonRegex = /```json\n([\s\S]*?)\n```/g;
  let match;
  let processedContent = content;
  const jsonData = [];

  while ((match = jsonRegex.exec(content)) !== null) {
    try {
      // Extract the JSON string and clean it up
      let jsonStr = match[1];
      console.log("Found JSON block:", jsonStr.substring(0, 200) + (jsonStr.length > 200 ? "..." : ""));
      
      // Clean up any potential backticks or formatting issues
      jsonStr = jsonStr.trim();
      
      // Remove backticks that might be at the start or end
      if (jsonStr.startsWith('`')) {
        jsonStr = jsonStr.replace(/^`+/, '');
      }
      if (jsonStr.endsWith('`')) {
        jsonStr = jsonStr.replace(/`+$/, '');
      }
      
      // Check if string might still start with ```json or json
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.substring(7).trim();
      } else if (jsonStr.startsWith('json')) {
        jsonStr = jsonStr.substring(4).trim();
      }
      
      // Make sure the string starts with { or [
      jsonStr = jsonStr.trim();
      if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
        // Try to find the first { or [
        const objectStart = jsonStr.indexOf('{');
        const arrayStart = jsonStr.indexOf('[');
        
        if (objectStart >= 0 && (arrayStart < 0 || objectStart < arrayStart)) {
          jsonStr = jsonStr.substring(objectStart);
        } else if (arrayStart >= 0) {
          jsonStr = jsonStr.substring(arrayStart);
        } else {
          throw new Error("Could not find valid JSON object or array start");
        }
      }
      
      // Make sure the string ends with } or ]
      if (!jsonStr.endsWith('}') && !jsonStr.endsWith(']')) {
        // Try to find the last } or ]
        const objectEnd = jsonStr.lastIndexOf('}');
        const arrayEnd = jsonStr.lastIndexOf(']');
        
        if (objectEnd >= 0 && (arrayEnd < 0 || objectEnd > arrayEnd)) {
          jsonStr = jsonStr.substring(0, objectEnd + 1);
        } else if (arrayEnd >= 0) {
          jsonStr = jsonStr.substring(0, arrayEnd + 1);
        } else {
          throw new Error("Could not find valid JSON object or array end");
        }
      }
      
      // Log the cleaned JSON string
      console.debug("Cleaned JSON string:", jsonStr.substring(0, 100) + (jsonStr.length > 100 ? "..." : ""));
      
      // Attempt to parse the cleaned string
      let data;
      try {
        data = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Initial JSON parsing failed, trying to clean up further:", parseError);
        
        try {
          // Additional cleanup for common issues
          // Replace escaped quotes that might be causing problems
          jsonStr = jsonStr.replace(/\\"/g, '"');
          // Handle potential trailing commas in objects or arrays
          jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
          
          // Try parsing again
          data = JSON.parse(jsonStr);
        } catch (secondError) {
          console.error("Second parsing attempt failed:", secondError);
          console.error("Problematic JSON string:", jsonStr);
          
          // Instead of throwing, provide a fallback data structure
          data = {
            type: "error",
            message: "Failed to parse JSON data",
            rawContent: jsonStr.substring(0, 100) + (jsonStr.length > 100 ? "..." : "")
          };
        }
      }
      
      // Validate booking data format if it exists
      if (data && (data.type === 'booking' || data.type === 'bookings')) {
        const items = data.type === 'booking' ? [data.item] : data.items || [];
        items.forEach((booking, idx) => {
          console.debug(`Booking ${idx} data format:`, {
            id: booking?.id || 'missing',
            show: booking?.show || 'missing',
            clientInfo: booking?.client ? 'present' : 'missing',
            clientId: booking?.clientId || 'missing',
            datesNeeded: booking?.datesNeeded ? 
              `array: ${Array.isArray(booking.datesNeeded)}, length: ${Array.isArray(booking.datesNeeded) ? 
                booking.datesNeeded.length : 
                Object.keys(booking.datesNeeded).length}` : 
              'missing'
          });
        });
      } else if (data && data.id && data.show) {
        // This might be a raw booking without proper type wrapping
        console.log("Found unwrapped booking data, wrapping it");
        data = {
          type: "booking",
          item: data
        };
      } else if (data && Array.isArray(data) && data.length > 0 && data[0]?.show) {
        // This might be an array of bookings without proper type wrapping
        console.log("Found unwrapped bookings array, wrapping it");
        data = {
          type: "bookings",
          items: data
        };
      }
      
      jsonData.push(data);
      
      // Replace the JSON with a placeholder
      processedContent = processedContent.replace(match[0], `[JSON_DATA_${jsonData.length - 1}]`);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      console.error("JSON string that failed:", match[1].substring(0, 500));
      // Continue without replacing this JSON block
    }
  }

  console.log(`Parsed ${jsonData.length} JSON blocks from message`);
  return { text: processedContent, jsonData };
};

// Render message component with rich formatting
const MessageContent = ({ content, onBookingsLoaded }) => {
  try {
    console.log("MessageContent rendering with content length:", content.length);
    
    // Detect literal function call text and transform it
    if (content.includes("function_call:") || content.includes("getAllBookings") || content.trim().startsWith("function_call")) {
      console.log("Detected literal function call text, transforming it");
      
      // Handle the case where the AI is just reporting function calls instead of making them
      if (content.includes("getAllBookings") || content.includes("get_all_bookings")) {
        const fetchAllBookings = async () => {
          try {
            const response = await fetch('/api/bookings', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch bookings');
            }
            
            const data = await response.json();
            console.log("Fetched bookings directly:", data);
            
            // Call the callback to update messages state
            if (onBookingsLoaded) {
              onBookingsLoaded(data);
            }
          } catch (error) {
            console.error('Error fetching bookings:', error);
            alert('Failed to fetch bookings. Please try again.');
          }
        };
        
        // Immediately call fetchAllBookings instead of just showing the button
        fetchAllBookings();
        
        return (
          <div className="space-y-3">
            <p className="text-sm whitespace-pre-wrap">Loading bookings...</p>
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        );
      }
    }
    
    // Check if content contains booking data but not in proper format
    if (content.includes("Retrieving all bookings") || content.includes("booking") || content.includes("show")) {
      // Check if we might have booking JSON mixed with text
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
          // Extract and parse the JSON part
          const jsonStr = content.substring(jsonStart, jsonEnd + 1);
          const data = JSON.parse(jsonStr);
          
          // Check if it's booking data
          if (data.type === 'bookings' || (Array.isArray(data) && data.length > 0 && data[0].show)) {
            console.log("Found embedded booking JSON, processing it");
            
            let formattedData;
            if (data.type === 'bookings') {
              formattedData = data;
            } else if (Array.isArray(data)) {
              formattedData = {
                type: "bookings", 
                items: data
              };
            }
            
            // Format as JSON block
            content = content.substring(0, jsonStart) + 
                     "```json\n" + JSON.stringify(formattedData, null, 2) + "\n```" + 
                     content.substring(jsonEnd + 1);
          }
        } catch (e) {
          console.error("Error processing potential JSON in text:", e);
        }
      }
    }
    
    // Check for common formatting issues
    if (content.includes("```json") && !content.includes("```")) {
      console.error("Malformed JSON block: Missing closing code fence");
      content = content.replace(/```json\n([\s\S]*)$/, "```json\n$1\n```");
    }
    
    // Check for incorrect spacing in code fences
    content = content.replace(/``` json/g, "```json");
    content = content.replace(/```\s+/g, "```\n");
    
    // Check if the content might be just a raw JSON array of booking objects
    if (content.trim().startsWith('[') && content.trim().endsWith(']')) {
      try {
        const jsonArray = JSON.parse(content);
        if (Array.isArray(jsonArray)) {
          // If it looks like an array of bookings (has show property)
          if (jsonArray.length > 0 && (jsonArray[0].show || jsonArray[0].id)) {
            console.log("Found raw JSON array of possible booking objects, wrapping properly");
            content = "```json\n" + JSON.stringify({
              type: "bookings",
              items: jsonArray
            }, null, 2) + "\n```";
          }
        }
      } catch (e) {
        console.error("Error parsing potential raw JSON array:", e);
      }
    }
    
    // Handle object literal format
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      try {
        const jsonObj = JSON.parse(content);
        // If it's a raw function response with booking data
        if (jsonObj.length > 0 && jsonObj[0] && (jsonObj[0].show || jsonObj[0].id)) {
          console.log("Found raw booking objects in function response");
          content = "```json\n" + JSON.stringify({
            type: "bookings",
            items: jsonObj
          }, null, 2) + "\n```";
        }
      } catch (e) {
        console.error("Error parsing potential JSON object:", e);
      }
    }
    
    // Safely parse the message content with a try-catch block
    let parsedContent;
    try {
      parsedContent = parseMessageContent(content);
    } catch (parseError) {
      console.error("Fatal error in parseMessageContent:", parseError);
      return (
        <div className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> Could not parse message content. This might be due to malformed JSON.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    
    const { text, jsonData } = parsedContent;
    
    // If no structured data was found, but the message mentions bookings
    // and is after a "show all bookings" request, show a loading or error message
    if (jsonData.length === 0 && 
        (text.includes("retrieving") || text.includes("loading") || 
         text.includes("bookings") || text.includes("show all"))) {
      
      const fetchBookingsNow = async () => {
        try {
          const response = await fetch('/api/bookings', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch bookings');
          }
          
          const data = await response.json();
          console.log("Fetched bookings directly from retry:", data);
          
          // Call the callback to update messages state
          if (onBookingsLoaded) {
            onBookingsLoaded(data);
          }
        } catch (error) {
          console.error('Error fetching bookings:', error);
          alert('Failed to fetch bookings. Please try again.');
        }
      };
      
      return (
        <div className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{text}</p>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> I'm still retrieving the booking data. Please wait a moment or try again.
            </p>
            <button
              onClick={fetchBookingsNow}
              className="mt-2 text-sm bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-md hover:bg-yellow-200"
            >
              Retry Fetching Bookings
            </button>
          </div>
        </div>
      );
    }
    
    // Split text by JSON placeholders
    const parts = text.split(/\[JSON_DATA_(\d+)\]/);
    
    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          // If it's an even index, it's text
          if (index % 2 === 0) {
            return part ? <p key={index} className="text-sm whitespace-pre-wrap">{part}</p> : null;
          } else {
            // It's a JSON reference, so render the appropriate component
            try {
              const dataIndex = parseInt(part, 10);
              const data = jsonData[dataIndex];
              
              if (!data) {
                console.error(`No data found for JSON_DATA_${dataIndex}`);
                return (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> Data parsing error. Please try again.
                    </p>
                  </div>
                );
              }
              
              console.log(`Rendering data type: ${data.type}`, data);
              
              // Rest of the existing component logic...
              try {
                if (data.type === 'bookings') {
                  // Debug booking format
                  console.debug("Rendering bookings list:", {
                    count: data.items?.length || 0,
                    firstItem: data.items?.[0] ? {
                      id: data.items[0].id || 'missing',
                      show: data.items[0].show,
                      hasClient: !!data.items[0].client,
                      hasDatesNeeded: !!data.items[0].datesNeeded
                    } : 'none'
                  });
                  
                  // Make sure we have valid items
                  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
                    return (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">No bookings found matching your query.</p>
                      </div>
                    );
                  }
                  
                  // Render bookings with error handling
                  try {
                    return <CardList key={index} items={data.items} type="booking" />;
                  } catch (renderError) {
                    console.error("Error rendering booking cards:", renderError);
                    return (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> Could not render booking data. The format may be incorrect.
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-2 text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200"
                        >
                          Reload page
                        </button>
                      </div>
                    );
                  }
                } else if (data.type === 'clients') {
                  return <CardList key={index} items={data.items} type="client" />;
                } else if (data.type === 'staff') {
                  return <CardList key={index} items={data.items} type="staff" />;
                } else if (data.type === 'booking') {
                  // Debug booking format
                  console.debug("Rendering single booking:", {
                    id: data.item?.id || 'missing',
                    show: data.item?.show,
                    hasClient: !!data.item?.client,
                    hasDatesNeeded: !!data.item?.datesNeeded
                  });
                  
                  // Make sure we have a valid item
                  if (!data.item || typeof data.item !== 'object') {
                    return (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">Booking data is not in the expected format.</p>
                      </div>
                    );
                  }
                  
                  return <BookingCard key={index} booking={data.item} />;
                } else if (data.type === 'client') {
                  return <ClientCard key={index} client={data.item} />;
                } else if (data.type === 'staff') {
                  return <StaffCard key={index} staff={data.item} />;
                } else if (data.type === 'search_results') {
                  // Handle search results with multiple entity types
                  return (
                    <div key={index} className="space-y-4">
                      {data.bookings && data.bookings.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Shows/Bookings</h3>
                          <CardList items={data.bookings} type="booking" />
                        </div>
                      )}
                      {data.clients && data.clients.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Clients</h3>
                          <CardList items={data.clients} type="client" />
                        </div>
                      )}
                      {data.staff && data.staff.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Staff</h3>
                          <CardList items={data.staff} type="staff" />
                        </div>
                      )}
                    </div>
                  );
                } else if (data.error && data.suggestedMatches) {
                  // Handle error with suggested matches for bookings
                  return (
                    <div key={index} className="space-y-4">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 mb-2">
                          <strong>Note:</strong> {data.error}
                        </p>
                        {data.suggestedMatches.length > 0 && (
                          <div>
                            <p className="text-sm text-yellow-800 mb-2">Did you mean one of these?</p>
                            <CardList items={data.suggestedMatches} type="booking" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else if (data.type === 'availability') {
                  console.debug("Rendering availability data:", {
                    itemCount: data.item?.length || 0,
                    firstItem: data.item?.[0] ? {
                      staffId: data.item[0].staffId || 'missing',
                      staffName: data.item[0].staffName || 'missing',
                      hasAvailableDates: !!data.item[0].availableDates
                    } : 'none'
                  });
                  
                  // Make sure we have valid items
                  if (!data.item || !Array.isArray(data.item) || data.item.length === 0) {
                    return (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">No staff availability data found.</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={index}>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Staff Availability</h3>
                      <CardList items={data.item} type="availability" />
                    </div>
                  );
                } else if (data.type === 'show_staff_availability') {
                  console.debug("Rendering show staff availability data:", {
                    show: data.show?.name || 'missing',
                    availableStaff: data.fullyAvailableStaff?.length || 0,
                    partiallyAvailableStaff: data.partiallyAvailableStaff?.length || 0,
                  });
                  
                  return <ShowStaffAvailability key={index} data={data} />;
                } else if (data.type === 'error') {
                  console.warn("Rendering error data:", data.message);
                  return (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Error:</strong> {data.message || "Failed to parse data"}
                      </p>
                      <details className="mt-2">
                        <summary className="text-xs text-red-700 cursor-pointer">Show details</summary>
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                          {data.rawContent || "No content available"}
                        </pre>
                      </details>
                    </div>
                  );
                } else {
                  console.warn(`Unknown data type: ${data.type}`, data);
                  return (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Unknown data type: {data.type}
                      </p>
                    </div>
                  );
                }
              } catch (componentError) {
                console.error("Error in component rendering:", componentError);
                return (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Rendering Error:</strong> {componentError.message}
                    </p>
                  </div>
                );
              }
            } catch (error) {
              console.error("Error processing JSON data reference:", error);
              return (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> Failed to parse data reference. Please try again.
                  </p>
                </div>
              );
            }
          }
        })}
      </div>
    );
  } catch (error) {
    console.error("Fatal error in MessageContent:", error);
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          <strong>Error:</strong> Failed to render message. Please try again or reload the page.
        </p>
        <details className="mt-2 text-xs text-red-700">
          <summary>Technical details</summary>
          {error.message}
        </details>
      </div>
    );
  }
};

// Card for displaying staff availability
const StaffAvailabilityCard = ({ staff }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden min-w-[220px] max-w-[280px] h-full flex flex-col border border-indigo-200 hover:shadow-md transition-shadow">
      <div className="bg-indigo-600 text-white px-3 py-2 flex items-center">
        <UserIcon className="h-4 w-4 mr-1.5" />
        <h3 className="font-medium text-sm truncate">{staff.staffName}</h3>
      </div>
      <div className="p-4 space-y-2 flex-1 border-t border-indigo-100">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1.5 font-medium">Available dates</p>
          <div className="flex flex-wrap gap-1.5">
            {staff.availableDates && staff.availableDates.slice(0, 5).map((date, idx) => (
              <span key={idx} className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full truncate border border-indigo-200">
                {date}
              </span>
            ))}
            {staff.availableDates && staff.availableDates.length > 5 && (
              <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded-full border border-gray-200">
                +{staff.availableDates.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for showing staff availability for a show
const ShowStaffAvailability = ({ data }) => {
  if (!data || !data.show) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">No show availability data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Show details header */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-indigo-200">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">{data.show.name}</h3>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>{data.show.startDate} to {data.show.endDate}</p>
          <p className="mt-1">{data.show.location} • {data.show.type}</p>
        </div>
      </div>

      {/* Staff fully available */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 px-4 py-2 text-white font-medium">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <h3>Staff Available for All Dates ({data.fullyAvailableStaff.length})</h3>
          </div>
        </div>
        
        {data.fullyAvailableStaff.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">
            No staff members are available for all dates of this show.
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.fullyAvailableStaff.map((staff, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg p-3 bg-green-50">
                  <p className="font-medium text-green-800">{staff.staffName}</p>
                  <p className="text-xs text-green-600 mt-1">Available for all {data.dates.length} days</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Staff partially available */}
      {data.partiallyAvailableStaff && data.partiallyAvailableStaff.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-yellow-500 px-4 py-2 text-white font-medium">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              <h3>Staff Available for Some Dates ({data.partiallyAvailableStaff.length})</h3>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.partiallyAvailableStaff.map((staff, idx) => (
                <div key={idx} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                  <p className="font-medium text-yellow-800">{staff.staffName}</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Available for {staff.matchingDates.length} of {data.dates.length} days
                  </p>
                  {staff.missingDates && staff.missingDates.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-yellow-800">Missing dates:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {staff.missingDates.map((date, i) => (
                          <span key={i} className="bg-yellow-200 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full">
                            {date}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Example prompts for complex queries
  const examplePrompts = [
    "Show all bookings",
    "Who's available to work on January 10th?",
    "Show bookings for Fashion Week show",
    "Which staff can work all dates for the Paris Show?",
    "Assign Jane Smith to the Fashion Week booking on January 11th",
    "Add January 15th to the Paris Show booking",
    "Give me details about the Fashion Week booking"
  ];

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Callback for when bookings are loaded directly
  const handleBookingsLoaded = (bookingsData) => {
    try {
      // Make sure we have a properly formatted JSON string
      let formattedJson;
      
      try {
        // First check if the data is already in the right format
        if (bookingsData && bookingsData.type === "bookings" && Array.isArray(bookingsData.items)) {
          // Already properly formatted - use as is
          formattedJson = JSON.stringify(bookingsData, null, 2);
        } else if (bookingsData && Array.isArray(bookingsData)) {
          // Array of booking objects - wrap it
          formattedJson = JSON.stringify({
            type: "bookings",
            items: bookingsData
          }, null, 2);
        } else {
          // Unknown format - just stringify what we have
          console.warn("Unexpected bookings data format:", bookingsData);
          formattedJson = JSON.stringify({
            type: "bookings",
            items: Array.isArray(bookingsData) ? bookingsData : [bookingsData]
          }, null, 2);
        }
      } catch (error) {
        console.error("Error formatting bookings data:", error);
        // Fallback to a simpler format if there are circular references
        formattedJson = JSON.stringify({
          type: "bookings",
          items: Array.isArray(bookingsData.items) ? 
            bookingsData.items.map(item => ({
              id: item.id,
              show: item.show,
              client: item.client || { name: "Unknown Client" }
            })) : 
            []
        }, null, 2);
      }
      
      console.log("Formatted bookings JSON for chat:", formattedJson.substring(0, 100) + "...");
      
      // Update the messages state
      setMessages(prev => {
        // Check if the last message was a loading message
        const lastMessage = prev[prev.length - 1];
        const isLastMessageLoading = lastMessage && 
          lastMessage.role === 'assistant' && 
          (lastMessage.content.includes('retrieving') || 
           lastMessage.content.includes('loading'));
        
        if (isLastMessageLoading) {
          // Replace the loading message
          return [
            ...prev.slice(0, -1),
            {
              role: 'assistant',
              content: "```json\n" + formattedJson + "\n```"
            }
          ];
        } else {
          // Add a new message
          return [
            ...prev,
            {
              role: 'assistant',
              content: "```json\n" + formattedJson + "\n```"
            }
          ];
        }
      });
    } catch (error) {
      console.error("Error handling bookings data:", error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Failed to load bookings data. Please try again."
        }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log("Received API response:", data);
      
      // Process the assistant's response to ensure proper formatting
      // Handle different response formats
      let assistantContent = '';
      
      if (data.result && data.result.content) {
        // Standard format with content
        assistantContent = data.result.content;
      } else if (data.functionResponse) {
        // Function call response format
        console.log("Detected function response:", data.functionCalled);
        
        // Determine which function was called and format accordingly
        if (data.functionCalled === 'getAllBookings' || data.functionCalled === 'get_all_bookings') {
          // Format bookings data for UI
          assistantContent = "```json\n" + JSON.stringify({
            type: "bookings",
            items: data.functionResponse
          }, null, 2) + "\n```";
        } else if (data.functionResponse && typeof data.functionResponse === 'object') {
          // General function response format
          assistantContent = "```json\n" + JSON.stringify(data.functionResponse, null, 2) + "\n```";
        } else {
          // Fallback for text response
          assistantContent = data.functionResponse || 'No data returned from function call';
        }
      } else if (data.response) {
        // Legacy format
        assistantContent = data.response;
      } else if (typeof data === 'string') {
        // Direct string response
        assistantContent = data;
      } else {
        // Fallback - try to extract content from any structure
        assistantContent = JSON.stringify(data);
      }
      
      // Check for incomplete JSON blocks and fix them
      if (assistantContent.includes("```json") && !assistantContent.match(/```json[\s\S]*?```/)) {
        console.warn("Detected incomplete JSON block in response");
        // Try to fix by adding closing backticks
        assistantContent = assistantContent + "\n```";
      }
      
      // Add assistant's response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantContent,
      }]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for example prompt click
  const handleExampleClick = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-[600px] rounded-xl overflow-hidden bg-white shadow-lg border border-gray-100">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-5">
        <h2 className="text-xl font-semibold">Smith Agency Assistant</h2>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-6 bg-white rounded-xl shadow-sm max-w-sm">
              <p className="text-gray-600 mb-4">Ask me about bookings, clients, staff, or availability</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {examplePrompts.map((prompt, index) => (
                  <button 
                    key={index}
                    onClick={() => handleExampleClick(prompt)}
                    className="bg-gray-100 hover:bg-gray-200 text-left px-3 py-2 rounded-lg transition-colors text-gray-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white shadow-sm rounded-bl-none'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <MessageContent content={message.content} onBookingsLoaded={handleBookingsLoaded} />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-2xl bg-white shadow-sm rounded-bl-none">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-100 p-3 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 py-2.5 px-4 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 