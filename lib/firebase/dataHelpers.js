import firebaseService from './firebaseService';

// Common data validation helpers
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Data transformation helpers
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Data aggregation helpers
export const getBookingStats = async () => {
  try {
    const bookings = await firebaseService.getAll('bookings');
    
    return {
      total: bookings.length,
      byStatus: bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {}),
      byMonth: bookings.reduce((acc, booking) => {
        const month = new Date(booking.assignedDate).toISOString().substring(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {}),
      upcoming: bookings.filter(b => new Date(b.assignedDate) > new Date()).length,
      overdue: bookings.filter(b => 
        new Date(b.assignedDate) < new Date() && 
        ['pending', 'confirmed'].includes(b.status)
      ).length
    };
  } catch (error) {
    console.error('Error getting booking stats:', error);
    throw error;
  }
};

export const getStaffStats = async () => {
  try {
    const staff = await firebaseService.getAll('staff');
    
    return {
      total: staff.length,
      byRole: staff.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
      }, {}),
      skillDistribution: staff.reduce((acc, member) => {
        if (member.skills && Array.isArray(member.skills)) {
          member.skills.forEach(skill => {
            acc[skill] = (acc[skill] || 0) + 1;
          });
        }
        return acc;
      }, {}),
      averageSkillsPerPerson: staff.reduce((sum, member) => {
        return sum + (member.skills ? member.skills.length : 0);
      }, 0) / staff.length
    };
  } catch (error) {
    console.error('Error getting staff stats:', error);
    throw error;
  }
};

export const getClientStats = async () => {
  try {
    const clients = await firebaseService.getAll('clients');
    const bookings = await firebaseService.getAll('bookings');
    
    return {
      total: clients.length,
      byCompany: clients.reduce((acc, client) => {
        const company = client.company || 'Individual';
        acc[company] = (acc[company] || 0) + 1;
        return acc;
      }, {}),
      activeClients: [...new Set(bookings.map(b => b.clientName))].length,
      clientBookingCounts: bookings.reduce((acc, booking) => {
        acc[booking.clientName] = (acc[booking.clientName] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting client stats:', error);
    throw error;
  }
};

export const getShowStats = async () => {
  try {
    const shows = await firebaseService.getAll('shows');
    const bookings = await firebaseService.getAll('bookings');
    
    return {
      total: shows.length,
      byStatus: shows.reduce((acc, show) => {
        acc[show.status] = (acc[show.status] || 0) + 1;
        return acc;
      }, {}),
      byVenue: shows.reduce((acc, show) => {
        acc[show.venue] = (acc[show.venue] || 0) + 1;
        return acc;
      }, {}),
      upcoming: shows.filter(s => new Date(s.date) > new Date()).length,
      showBookingCounts: bookings.reduce((acc, booking) => {
        acc[booking.showName] = (acc[booking.showName] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting show stats:', error);
    throw error;
  }
};

// Quick search helpers
export const quickSearch = async (searchTerm) => {
  try {
    const [staffResults, clientResults, showResults, bookingResults] = await Promise.all([
      firebaseService.search('staff', 'name', searchTerm),
      firebaseService.search('clients', 'name', searchTerm),
      firebaseService.search('shows', 'name', searchTerm),
      firebaseService.search('bookings', 'clientName', searchTerm)
    ]);

    return {
      staff: staffResults,
      clients: clientResults,
      shows: showResults,
      bookings: bookingResults,
      totalResults: staffResults.length + clientResults.length + showResults.length + bookingResults.length
    };
  } catch (error) {
    console.error('Error in quick search:', error);
    throw error;
  }
};

// Data relationship helpers
export const getBookingsWithDetails = async () => {
  try {
    const [bookings, clients, shows] = await Promise.all([
      firebaseService.getAll('bookings'),
      firebaseService.getAll('clients'),
      firebaseService.getAll('shows')
    ]);

    // Create lookup maps
    const clientMap = clients.reduce((acc, client) => {
      acc[client.name] = client;
      return acc;
    }, {});

    const showMap = shows.reduce((acc, show) => {
      acc[show.name] = show;
      return acc;
    }, {});

    // Enrich bookings with client and show details
    return bookings.map(booking => ({
      ...booking,
      clientDetails: clientMap[booking.clientName] || null,
      showDetails: showMap[booking.showName] || null
    }));
  } catch (error) {
    console.error('Error getting bookings with details:', error);
    throw error;
  }
};

export const getStaffAvailability = async (date) => {
  try {
    const [staff, bookings] = await Promise.all([
      firebaseService.getAll('staff'),
      firebaseService.getBookingsByDateRange(date, date)
    ]);

    const bookedStaff = bookings
      .filter(b => b.status === 'confirmed')
      .map(b => b.assignedStaff)
      .filter(Boolean)
      .flat();

    return staff.map(member => ({
      ...member,
      isAvailable: !bookedStaff.includes(member.name),
      bookingsOnDate: bookings.filter(b => 
        b.assignedStaff && b.assignedStaff.includes(member.name)
      )
    }));
  } catch (error) {
    console.error('Error getting staff availability:', error);
    throw error;
  }
};

// Bulk operation helpers
export const createMultipleBookings = async (bookingsData) => {
  try {
    // Validate all bookings first
    for (const booking of bookingsData) {
      if (!booking.clientName || !booking.showName || !booking.assignedDate) {
        throw new Error('Each booking must have clientName, showName, and assignedDate');
      }
      if (!validateDate(booking.assignedDate)) {
        throw new Error(`Invalid date: ${booking.assignedDate}`);
      }
    }

    // Add default values
    const processedBookings = bookingsData.map(booking => ({
      status: 'pending',
      notes: '',
      ...booking
    }));

    return await firebaseService.batchCreate('bookings', processedBookings);
  } catch (error) {
    console.error('Error creating multiple bookings:', error);
    throw error;
  }
};

export const updateBookingStatuses = async (updates) => {
  try {
    // Validate updates
    for (const update of updates) {
      if (!update.id || !update.status) {
        throw new Error('Each update must have id and status');
      }
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(update.status)) {
        throw new Error(`Invalid status: ${update.status}`);
      }
    }

    return await firebaseService.batchUpdate('bookings', updates.map(update => ({
      id: update.id,
      data: { status: update.status }
    })));
  } catch (error) {
    console.error('Error updating booking statuses:', error);
    throw error;
  }
};

// Export convenience functions
export const db = {
  // Direct access to service methods
  ...firebaseService,
  
  // Convenience methods
  getAllData: async () => {
    const [bookings, staff, clients, shows] = await Promise.all([
      firebaseService.getAll('bookings'),
      firebaseService.getAll('staff'),
      firebaseService.getAll('clients'),
      firebaseService.getAll('shows')
    ]);
    return { bookings, staff, clients, shows };
  },
  
  getStats: async () => {
    const [bookingStats, staffStats, clientStats, showStats] = await Promise.all([
      getBookingStats(),
      getStaffStats(),
      getClientStats(),
      getShowStats()
    ]);
    return { bookings: bookingStats, staff: staffStats, clients: clientStats, shows: showStats };
  },

  search: quickSearch,
  
  // Collection-specific helpers
  bookings: {
    getAll: () => firebaseService.getAll('bookings'),
    getByClient: (clientName) => firebaseService.getBookingsByClient(clientName),
    getByShow: (showName) => firebaseService.getBookingsByShow(showName),
    getByStatus: (status) => firebaseService.getBookingsByStatus(status),
    getByDateRange: (start, end) => firebaseService.getBookingsByDateRange(start, end),
    getWithDetails: getBookingsWithDetails,
    create: (data) => firebaseService.create('bookings', data),
    createMultiple: createMultipleBookings,
    update: (id, data) => firebaseService.update('bookings', id, data),
    updateMultiple: updateBookingStatuses,
    delete: (id) => firebaseService.delete('bookings', id)
  },
  
  staff: {
    getAll: () => firebaseService.getAll('staff'),
    getByRole: (role) => firebaseService.getStaffByRole(role),
    getBySkill: (skill) => firebaseService.getStaffBySkill(skill),
    getAvailability: getStaffAvailability,
    create: (data) => firebaseService.create('staff', data),
    update: (id, data) => firebaseService.update('staff', id, data),
    delete: (id) => firebaseService.delete('staff', id)
  },
  
  clients: {
    getAll: () => firebaseService.getAll('clients'),
    getByCompany: (company) => firebaseService.getClientsByCompany(company),
    create: (data) => firebaseService.create('clients', data),
    update: (id, data) => firebaseService.update('clients', id, data),
    delete: (id) => firebaseService.delete('clients', id)
  },
  
  shows: {
    getAll: () => firebaseService.getAll('shows'),
    getByVenue: (venue) => firebaseService.getShowsByVenue(venue),
    getByStatus: (status) => firebaseService.getShowsByStatus(status),
    getUpcoming: () => firebaseService.getUpcomingShows(),
    create: (data) => firebaseService.create('shows', data),
    update: (id, data) => firebaseService.update('shows', id, data),
    delete: (id) => firebaseService.delete('shows', id)
  }
};

export default db;