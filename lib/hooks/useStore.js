import { create } from 'zustand';
import axios from 'axios';

const useStore = create((set, get) => ({
  // Data storage
  clients: [],
  staff: [],
  shows: [],
  bookings: [],
  availability: [],
  
  // Loading states
  isLoading: {
    clients: false,
    staff: false,
    shows: false,
    bookings: false,
    availability: false
  },
  
  // Error states
  errors: {
    clients: null,
    staff: null,
    shows: null,
    bookings: null,
    availability: null
  },
  
  // Initialize all data
  initializeData: async () => {
    await Promise.all([
      get().fetchClients(),
      get().fetchStaff(),
      get().fetchShows(),
      get().fetchBookings(),
      get().fetchAvailability()
    ]);
  },
  
  // Client actions
  fetchClients: async () => {
    set(state => ({
      isLoading: { ...state.isLoading, clients: true },
      errors: { ...state.errors, clients: null }
    }));
    
    try {
      const response = await axios.get('/api/clients');
      set({ clients: response.data, isLoading: { ...get().isLoading, clients: false } });
    } catch (error) {
      console.error('Error fetching clients:', error);
      set(state => ({
        isLoading: { ...state.isLoading, clients: false },
        errors: { ...state.errors, clients: error.message }
      }));
    }
  },
  
  addClient: async (clientData) => {
    try {
      const response = await axios.post('/api/clients', clientData);
      set(state => ({ clients: [...state.clients, response.data] }));
      return response.data;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  },
  
  updateClient: async (id, clientData) => {
    try {
      const response = await axios.put(`/api/clients/${id}`, clientData);
      set(state => ({
        clients: state.clients.map(client => 
          client.id === id ? { ...response.data } : client
        )
      }));
      return response.data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    try {
      await axios.delete(`/api/clients/${id}`);
      set(state => ({
        clients: state.clients.filter(client => client.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },
  
  getClientById: (id) => {
    return get().clients.find(client => client.id === id) || null;
  },
  
  // Staff actions
  fetchStaff: async () => {
    set(state => ({
      isLoading: { ...state.isLoading, staff: true },
      errors: { ...state.errors, staff: null }
    }));
    
    try {
      const response = await axios.get('/api/staff');
      set({ staff: response.data, isLoading: { ...get().isLoading, staff: false } });
    } catch (error) {
      console.error('Error fetching staff:', error);
      set(state => ({
        isLoading: { ...state.isLoading, staff: false },
        errors: { ...state.errors, staff: error.message }
      }));
    }
  },
  
  addStaff: async (staffData) => {
    try {
      const response = await axios.post('/api/staff', staffData);
      set(state => ({ staff: [...state.staff, response.data] }));
      return response.data;
    } catch (error) {
      console.error('Error adding staff member:', error);
      throw error;
    }
  },
  
  updateStaff: async (id, staffData) => {
    try {
      const response = await axios.put(`/api/staff/${id}`, staffData);
      set(state => ({
        staff: state.staff.map(staff => 
          staff.id === id ? { ...response.data } : staff
        )
      }));
      return response.data;
    } catch (error) {
      console.error('Error updating staff member:', error);
      throw error;
    }
  },
  
  deleteStaff: async (id) => {
    try {
      await axios.delete(`/api/staff/${id}`);
      set(state => ({
        staff: state.staff.filter(staff => staff.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting staff member:', error);
      throw error;
    }
  },
  
  getStaffById: (id) => {
    return get().staff.find(staff => staff.id === id) || null;
  },
  
  getBookingsForClient: (clientId) => {
    return get().bookings.filter(booking => booking.clientId === clientId) || [];
  },
  
  getBookingsForStaff: (staffId) => {
    return get().bookings.filter(booking => 
      booking.datesNeeded?.some(date => 
        Array.isArray(date.staffIds) && date.staffIds.includes(staffId)
      )
    ) || [];
  },
  
  // Show actions
  fetchShows: async () => {
    set(state => ({
      isLoading: { ...state.isLoading, shows: true },
      errors: { ...state.errors, shows: null }
    }));
    
    try {
      const response = await axios.get('/api/shows');
      set({ shows: response.data, isLoading: { ...get().isLoading, shows: false } });
    } catch (error) {
      console.error('Error fetching shows:', error);
      set(state => ({
        isLoading: { ...state.isLoading, shows: false },
        errors: { ...state.errors, shows: error.message }
      }));
    }
  },
  
  addShow: async (showData) => {
    try {
      const response = await axios.post('/api/shows', showData);
      set(state => ({ shows: [...state.shows, response.data] }));
      return response.data;
    } catch (error) {
      console.error('Error adding show:', error);
      throw error;
    }
  },
  
  updateShow: async (id, showData) => {
    try {
      const response = await axios.put(`/api/shows/${id}`, showData);
      set(state => ({
        shows: state.shows.map(show => 
          show.id === id ? { ...response.data } : show
        )
      }));
      return response.data;
    } catch (error) {
      console.error('Error updating show:', error);
      throw error;
    }
  },
  
  deleteShow: async (id) => {
    try {
      await axios.delete(`/api/shows/${id}`);
      set(state => ({
        shows: state.shows.filter(show => show.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting show:', error);
      throw error;
    }
  },
  
  getShowById: (id) => {
    return get().shows.find(show => show.id === id) || null;
  },
  
  // Booking actions
  fetchBookings: async () => {
    set(state => ({
      isLoading: { ...state.isLoading, bookings: true },
      errors: { ...state.errors, bookings: null }
    }));
    
    try {
      const response = await axios.get('/api/bookings');
      set({ bookings: response.data, isLoading: { ...get().isLoading, bookings: false } });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      set(state => ({
        isLoading: { ...state.isLoading, bookings: false },
        errors: { ...state.errors, bookings: error.message }
      }));
    }
  },
  
  addBooking: async (bookingData) => {
    try {
      const response = await axios.post('/api/bookings', bookingData);
      set(state => ({ bookings: [...state.bookings, response.data] }));
      return response.data;
    } catch (error) {
      console.error('Error adding booking:', error);
      throw error;
    }
  },
  
  updateBooking: async (id, bookingData) => {
    try {
      const response = await axios.put(`/api/bookings/${id}`, bookingData);
      set(state => ({
        bookings: state.bookings.map(booking => 
          booking.id === id ? { ...response.data } : booking
        )
      }));
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },
  
  deleteBooking: async (id) => {
    try {
      await axios.delete(`/api/bookings/${id}`);
      set(state => ({
        bookings: state.bookings.filter(booking => booking.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  },
  
  getBookingById: (id) => {
    return get().bookings.find(booking => booking.id === id) || null;
  },
  
  getBookingsForShow: (showId) => {
    return get().bookings.filter(booking => booking.showId === showId);
  },
  
  // Availability actions
  setAvailability: async (staffId, showId, availableDates, staffName) => {
    if (!staffId || !showId || !availableDates || !staffName) {
      throw new Error('Missing required fields for availability');
    }

    if (!Array.isArray(availableDates)) {
      throw new Error('availableDates must be an array');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!availableDates.every(date => dateRegex.test(date))) {
      throw new Error('Dates must be in YYYY-MM-DD format');
    }

    set(state => ({
      isLoading: { ...state.isLoading, availability: true },
      errors: { ...state.errors, availability: null }
    }));

    try {
      const response = await axios.post('/api/availability', {
        staffId,
        showId,
        availableDates,
        staffName,
        updatedAt: new Date().toISOString()
      });

      // Update availability in store
      set(state => {
        const existingIndex = state.availability.findIndex(
          a => a.staffId === staffId && a.showId === showId
        );

        if (existingIndex >= 0) {
          // Update existing availability
          const updatedAvailability = [...state.availability];
          updatedAvailability[existingIndex] = response.data;
          return {
            availability: updatedAvailability,
            isLoading: { ...state.isLoading, availability: false }
          };
        } else {
          // Add new availability
          return {
            availability: [...state.availability, response.data],
            isLoading: { ...state.isLoading, availability: false }
          };
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error saving availability:', error);
      set(state => ({
        isLoading: { ...state.isLoading, availability: false },
        errors: { ...state.errors, availability: error.message }
      }));
      throw error;
    }
  },
  
  fetchAvailability: async () => {
    set(state => ({
      isLoading: { ...state.isLoading, availability: true },
      errors: { ...state.errors, availability: null }
    }));

    try {
      const response = await axios.get('/api/availability');
      set(state => ({
        availability: response.data,
        isLoading: { ...state.isLoading, availability: false }
      }));
      return response.data;
    } catch (error) {
      console.error('Error fetching availability:', error);
      set(state => ({
        isLoading: { ...state.isLoading, availability: false },
        errors: { ...state.errors, availability: error.message }
      }));
      throw error;
    }
  },
  
  getAvailabilityForStaff: (staffId) => {
    if (!staffId) return [];
    return get().availability.filter(a => a.staffId === staffId);
  },
  
  getAvailabilityForShow: (showId) => {
    if (!showId) return [];
    return get().availability.filter(a => a.showId === showId);
  },
  
  getStaffAvailableForShow: (showId, date) => {
    if (!showId || !date) return [];
    const showAvailability = get().availability.filter(a => a.showId === showId);
    return showAvailability
      .filter(a => a.availableDates.includes(date))
      .map(a => ({
        staffId: a.staffId,
        staffName: a.staffName,
        updatedAt: a.updatedAt
      }));
  },
  
  deleteAvailability: async (staffId, showId) => {
    if (!staffId || !showId) {
      throw new Error('Both staffId and showId are required to delete availability');
    }

    set(state => ({
      isLoading: { ...state.isLoading, availability: true },
      errors: { ...state.errors, availability: null }
    }));

    try {
      await axios.delete(`/api/availability/${staffId}/${showId}`);
      set(state => ({
        availability: state.availability.filter(
          a => !(a.staffId === staffId && a.showId === showId)
        ),
        isLoading: { ...state.isLoading, availability: false }
      }));
    } catch (error) {
      console.error('Error deleting availability:', error);
      set(state => ({
        isLoading: { ...state.isLoading, availability: false },
        errors: { ...state.errors, availability: error.message }
      }));
      throw error;
    }
  },
  
  // Utility functions
  getPendingBookings: () => {
    return get().bookings.filter(booking => booking.status === 'pending');
  },
  
  getRecentActivity: () => {
    // Get the 5 most recent bookings
    return [...get().bookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }
}));

export default useStore; 