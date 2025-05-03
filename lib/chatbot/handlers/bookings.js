import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from 'firebase/firestore';

// Get all bookings
export async function handleListBookings(res) {
  try {
    const bookingsCollection = collection(db, 'bookings');
    const snapshot = await getDocs(bookingsCollection);
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Create a more descriptive message with booking details
    let message = '';
    if (bookings.length === 0) {
      message = 'There are no bookings in the database.';
    } else {
      // Get basic booking info
      const bookingInfo = bookings.map(booking => {
        const client = booking.clientName || 'Unknown client';
        const show = booking.showName || 'Unknown show';
        return `${client} for ${show}`;
      });
      
      // Count bookings by status
      const confirmed = bookings.filter(booking => booking.status === 'confirmed').length;
      const pending = bookings.filter(booking => booking.status === 'pending').length;
      
      message = `The agency has ${bookings.length} booking${bookings.length !== 1 ? 's' : ''}: ${bookingInfo.join(', ')}. `;
      
      if (confirmed > 0 || pending > 0) {
        const statusDetails = [];
        if (confirmed > 0) {
          statusDetails.push(`${confirmed} confirmed`);
        }
        if (pending > 0) {
          statusDetails.push(`${pending} pending`);
        }
        message += `Status breakdown: ${statusDetails.join(' and ')}.`;
      }
    }
    
    return res.status(200).json({ 
      data: bookings,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Search bookings by criteria
export async function handleSearchBookings(res, args) {
  try {
    const { clientId, showId, staffId, status, date } = args;
    
    if (!clientId && !showId && !staffId && !status && !date) {
      return handleListBookings(res);
    }
    
    const bookingsCollection = collection(db, 'bookings');
    
    // Get all bookings first
    const snapshot = await getDocs(bookingsCollection);
    
    // Filter in memory
    let bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    if (clientId) {
      bookings = bookings.filter(booking => booking.clientId === clientId);
    }
    
    if (showId) {
      bookings = bookings.filter(booking => booking.showId === showId);
    }
    
    if (staffId) {
      bookings = bookings.filter(booking => 
        booking.datesNeeded?.some(dateObj => 
          Array.isArray(dateObj.staffIds) && dateObj.staffIds.includes(staffId)
        )
      );
    }
    
    if (status) {
      const statusLower = status.toLowerCase();
      bookings = bookings.filter(booking => 
        booking.status?.toLowerCase() === statusLower
      );
    }
    
    if (date) {
      bookings = bookings.filter(booking => 
        booking.datesNeeded?.some(dateObj => dateObj.date === date)
      );
    }
    
    // Create a more descriptive response
    let message = '';
    if (bookings.length === 0) {
      message = 'No bookings match your search criteria.';
    } else {
      const bookingDetails = bookings.map(booking => {
        const client = booking.clientName || booking.clientId || 'Unknown client';
        const show = booking.showName || booking.showId || 'Unknown show';
        return `${client} for ${show}`;
      }).join(', ');
      
      message = `Found ${bookings.length} booking${bookings.length !== 1 ? 's' : ''}: ${bookingDetails}`;
      
      // Add search criteria to message
      const criteria = [];
      if (clientId) criteria.push(`client ID "${clientId}"`);
      if (showId) criteria.push(`show ID "${showId}"`);
      if (staffId) criteria.push(`staff ID "${staffId}"`);
      if (status) criteria.push(`status "${status}"`);
      if (date) criteria.push(`date "${date}"`);
      
      if (criteria.length > 0) {
        message += ` matching ${criteria.join(' and ')}`;
      }
      
      message += '.';
    }
    
    return res.status(200).json({ 
      data: bookings,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Get booking by ID
export async function handleGetBookingById(res, args) {
  try {
    const { id } = args;
    
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    const bookingDoc = doc(db, 'bookings', id);
    const snapshot = await getDoc(bookingDoc);
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        error: 'Booking not found',
        message: `No booking found with ID: ${id}`
      });
    }
    
    const booking = { id: snapshot.id, ...snapshot.data() };
    
    // Gather additional information for a comprehensive response
    let clientInfo = booking.clientName || booking.clientId || 'Unknown client';
    let showInfo = booking.showName || booking.showId || 'Unknown show';
    
    // Try to get additional client and show info if we have IDs
    if (booking.clientId && !booking.clientName) {
      try {
        const clientDoc = doc(db, 'clients', booking.clientId);
        const clientSnapshot = await getDoc(clientDoc);
        if (clientSnapshot.exists()) {
          const clientData = clientSnapshot.data();
          clientInfo = clientData.name || clientInfo;
        }
      } catch (error) {
        // Ignore errors in fetching extra info
      }
    }
    
    if (booking.showId && !booking.showName) {
      try {
        const showDoc = doc(db, 'shows', booking.showId);
        const showSnapshot = await getDoc(showDoc);
        if (showSnapshot.exists()) {
          const showData = showSnapshot.data();
          showInfo = showData.name || showInfo;
        }
      } catch (error) {
        // Ignore errors in fetching extra info
      }
    }
    
    // Create a detailed description
    let message = `Found booking for ${clientInfo} for the show "${showInfo}"`;
    
    if (booking.status) {
      message += ` (status: ${booking.status})`;
    }
    
    // Add date information if available
    if (booking.datesNeeded && booking.datesNeeded.length > 0) {
      const dates = booking.datesNeeded.map(d => d.date).filter(Boolean);
      if (dates.length > 0) {
        message += ` on the following dates: ${dates.join(', ')}`;
      }
    }
    
    return res.status(200).json({ 
      data: booking,
      message
    });
  } catch (error) {
    throw error;
  }
} 