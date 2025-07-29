// Firebase Service Usage Examples
// Import the enhanced Firebase service and helpers

import firebaseService from './firebaseService';
import db, { 
  getBookingStats, 
  getStaffStats, 
  quickSearch, 
  getBookingsWithDetails,
  createMultipleBookings 
} from './dataHelpers';

// ==================== BASIC CRUD OPERATIONS ====================

// 1. Get all records from a collection
const getAllBookings = async () => {
  try {
    const bookings = await firebaseService.getAll('bookings');
    console.log('All bookings:', bookings);
    return bookings;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 2. Get a single record by ID
const getBookingById = async (bookingId) => {
  try {
    const booking = await firebaseService.getById('bookings', bookingId);
    console.log('Booking:', booking);
    return booking;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 3. Create a new record
const createNewBooking = async () => {
  try {
    const newBooking = await firebaseService.create('bookings', {
      clientName: 'John Doe',
      showName: 'Summer Concert Series',
      assignedDate: '2024-07-15',
      status: 'pending',
      notes: 'VIP client, special handling required'
    });
    console.log('Created booking:', newBooking);
    return newBooking;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 4. Update an existing record
const updateBooking = async (bookingId) => {
  try {
    const updatedBooking = await firebaseService.update('bookings', bookingId, {
      status: 'confirmed',
      notes: 'Confirmed by client on phone'
    });
    console.log('Updated booking:', updatedBooking);
    return updatedBooking;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 5. Delete a record
const deleteBooking = async (bookingId) => {
  try {
    await firebaseService.delete('bookings', bookingId);
    console.log('Booking deleted successfully');
  } catch (error) {
    console.error('Error:', error);
  }
};

// ==================== ADVANCED QUERYING ====================

// 6. Query with filters
const getConfirmedBookings = async () => {
  try {
    const confirmedBookings = await firebaseService.query('bookings', [
      { field: 'status', operator: '==', value: 'confirmed' }
    ], 'assignedDate', 'asc');
    console.log('Confirmed bookings:', confirmedBookings);
    return confirmedBookings;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 7. Search functionality
const searchStaffByName = async (searchTerm) => {
  try {
    const results = await firebaseService.search('staff', 'name', searchTerm);
    console.log('Search results:', results);
    return results;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 8. Find by name (exact match)
const findStaffMember = async (name) => {
  try {
    const staff = await firebaseService.findByName('staff', name, true);
    console.log('Found staff member:', staff);
    return staff;
  } catch (error) {
    console.error('Error:', error);
  }
};

// ==================== COLLECTION-SPECIFIC QUERIES ====================

// 9. Get bookings by client
const getClientBookings = async (clientName) => {
  try {
    const bookings = await firebaseService.getBookingsByClient(clientName);
    console.log(`Bookings for ${clientName}:`, bookings);
    return bookings;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 10. Get staff by role
const getStaffByRole = async (role) => {
  try {
    const staff = await firebaseService.getStaffByRole(role);
    console.log(`${role} staff members:`, staff);
    return staff;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 11. Get upcoming shows
const getUpcomingShows = async () => {
  try {
    const shows = await firebaseService.getUpcomingShows();
    console.log('Upcoming shows:', shows);
    return shows;
  } catch (error) {
    console.error('Error:', error);
  }
};

// ==================== BATCH OPERATIONS ====================

// 12. Create multiple records at once
const createMultipleStaffMembers = async () => {
  try {
    const staffData = [
      {
        name: 'Alice Johnson',
        email: 'alice@smithagency.com',
        role: 'Production Manager',
        skills: ['event planning', 'logistics', 'team management']
      },
      {
        name: 'Bob Smith',
        email: 'bob@smithagency.com',
        role: 'Sound Engineer',
        skills: ['audio mixing', 'equipment setup', 'troubleshooting']
      },
      {
        name: 'Carol Davis',
        email: 'carol@smithagency.com',
        role: 'Lighting Technician',
        skills: ['lighting design', 'equipment operation', 'venue setup']
      }
    ];

    const createdStaff = await firebaseService.batchCreate('staff', staffData);
    console.log('Created staff members:', createdStaff);
    return createdStaff;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 13. Update multiple records
const updateMultipleBookings = async () => {
  try {
    const updates = [
      { id: 'booking1', data: { status: 'confirmed' } },
      { id: 'booking2', data: { status: 'completed' } },
      { id: 'booking3', data: { status: 'cancelled' } }
    ];

    await firebaseService.batchUpdate('bookings', updates);
    console.log('Multiple bookings updated successfully');
  } catch (error) {
    console.error('Error:', error);
  }
};

// ==================== REAL-TIME SUBSCRIPTIONS ====================

// 14. Subscribe to collection changes
const subscribeToBookings = () => {
  try {
    const unsubscribe = firebaseService.subscribeToCollection('bookings', (bookings) => {
      console.log('Real-time bookings update:', bookings);
      // Update your UI here
    });

    // Call unsubscribe() when you want to stop listening
    return unsubscribe;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 15. Subscribe to specific document changes
const subscribeToBooking = (bookingId) => {
  try {
    const unsubscribe = firebaseService.subscribeToDocument('bookings', bookingId, (booking) => {
      if (booking) {
        console.log('Booking updated:', booking);
      } else {
        console.log('Booking deleted');
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error:', error);
  }
};

// ==================== ARRAY OPERATIONS ====================

// 16. Add skill to staff member
const addSkillToStaff = async (staffId, skill) => {
  try {
    await firebaseService.addToArray('staff', staffId, 'skills', skill);
    console.log(`Added skill "${skill}" to staff member`);
  } catch (error) {
    console.error('Error:', error);
  }
};

// 17. Remove skill from staff member
const removeSkillFromStaff = async (staffId, skill) => {
  try {
    await firebaseService.removeFromArray('staff', staffId, 'skills', skill);
    console.log(`Removed skill "${skill}" from staff member`);
  } catch (error) {
    console.error('Error:', error);
  }
};

// ==================== HELPER FUNCTIONS USAGE ====================

// 18. Get comprehensive statistics
const getDashboardStats = async () => {
  try {
    const [bookingStats, staffStats] = await Promise.all([
      getBookingStats(),
      getStaffStats()
    ]);
    
    console.log('Dashboard stats:', { bookingStats, staffStats });
    return { bookingStats, staffStats };
  } catch (error) {
    console.error('Error:', error);
  }
};

// 19. Quick search across all collections
const performQuickSearch = async (searchTerm) => {
  try {
    const results = await quickSearch(searchTerm);
    console.log('Quick search results:', results);
    return results;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 20. Get enriched booking data
const getDetailedBookings = async () => {
  try {
    const bookingsWithDetails = await getBookingsWithDetails();
    console.log('Bookings with client and show details:', bookingsWithDetails);
    return bookingsWithDetails;
  } catch (error) {
    console.error('Error:', error);
  }
};

// ==================== USING THE CONVENIENCE DB OBJECT ====================

// 21. Using the convenience db object
const usingConvenienceAPI = async () => {
  try {
    // Get all data at once
    const allData = await db.getAllData();
    console.log('All data:', allData);

    // Get comprehensive stats
    const stats = await db.getStats();
    console.log('All stats:', stats);

    // Use collection-specific methods
    const upcomingShows = await db.shows.getUpcoming();
    const staffInProduction = await db.staff.getByRole('Production Manager');
    const clientBookings = await db.bookings.getByClient('John Doe');

    console.log('Upcoming shows:', upcomingShows);
    console.log('Production staff:', staffInProduction);
    console.log('Client bookings:', clientBookings);

    return { allData, stats, upcomingShows, staffInProduction, clientBookings };
  } catch (error) {
    console.error('Error:', error);
  }
};

// ==================== CACHE MANAGEMENT ====================

// 22. Cache management
const manageCacheExample = async () => {
  try {
    // Get cache stats
    const cacheStats = firebaseService.getCacheStats();
    console.log('Cache stats:', cacheStats);

    // Clear cache for specific collection
    firebaseService.clearCollectionCache('bookings');
    console.log('Cleared bookings cache');

    // Clear all cache
    firebaseService.clearAllCache();
    console.log('Cleared all cache');
  } catch (error) {
    console.error('Error:', error);
  }
};

// ==================== TRANSACTION EXAMPLE ====================

// 23. Transaction example - transfer booking between shows
const transferBooking = async (bookingId, newShowName) => {
  try {
    const result = await firebaseService.runTransaction(async (transaction) => {
      // Get the booking
      const bookingRef = firebaseService.getDocRef('bookings', bookingId);
      const bookingDoc = await transaction.get(bookingRef);
      
      if (!bookingDoc.exists()) {
        throw new Error('Booking not found');
      }

      const bookingData = bookingDoc.data();
      
      // Update the booking with new show
      transaction.update(bookingRef, {
        showName: newShowName,
        updatedAt: new Date(),
        transferHistory: [...(bookingData.transferHistory || []), {
          from: bookingData.showName,
          to: newShowName,
          date: new Date()
        }]
      });

      return { oldShow: bookingData.showName, newShow: newShowName };
    });

    console.log('Booking transferred:', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Export all examples for easy usage
export {
  // Basic CRUD
  getAllBookings,
  getBookingById,
  createNewBooking,
  updateBooking,
  deleteBooking,
  
  // Advanced queries
  getConfirmedBookings,
  searchStaffByName,
  findStaffMember,
  
  // Collection-specific
  getClientBookings,
  getStaffByRole,
  getUpcomingShows,
  
  // Batch operations
  createMultipleStaffMembers,
  updateMultipleBookings,
  
  // Real-time
  subscribeToBookings,
  subscribeToBooking,
  
  // Array operations
  addSkillToStaff,
  removeSkillFromStaff,
  
  // Helper functions
  getDashboardStats,
  performQuickSearch,
  getDetailedBookings,
  
  // Convenience API
  usingConvenienceAPI,
  
  // Cache management
  manageCacheExample,
  
  // Transactions
  transferBooking
};

// Usage in a React component example:
/*
import React, { useState, useEffect } from 'react';
import { getAllBookings, subscribeToBookings } from './firebase/examples';

const BookingsComponent = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    const loadBookings = async () => {
      try {
        const data = await getAllBookings();
        setBookings(data);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();

    // Set up real-time listener
    const unsubscribe = subscribeToBookings((updatedBookings) => {
      setBookings(updatedBookings);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Bookings ({bookings.length})</h2>
      {bookings.map(booking => (
        <div key={booking.id}>
          {booking.clientName} - {booking.showName} - {booking.status}
        </div>
      ))}
    </div>
  );
};
*/