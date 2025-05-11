import OpenAI from "openai";
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get booking by name
async function getBookingByName(bookingName) {
  try {
    // First try an exact match
    const bookingsCollection = collection(db, 'bookings');
    const q = query(bookingsCollection, where("show", "==", bookingName));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Return the first exact matching booking
      const doc = snapshot.docs[0];
      const bookingData = { id: doc.id, ...doc.data() };
      
      // Ensure proper data structure - datesNeeded might be a map in Firestore
      if (bookingData.datesNeeded && typeof bookingData.datesNeeded === 'object' && !Array.isArray(bookingData.datesNeeded)) {
        // Convert from map to array
        bookingData.datesNeeded = Object.keys(bookingData.datesNeeded).map(key => {
          const dateObj = bookingData.datesNeeded[key];
          
          // Handle staffIds which might also be a map
          if (dateObj.staffIds && typeof dateObj.staffIds === 'object' && !Array.isArray(dateObj.staffIds)) {
            dateObj.staffIds = Object.keys(dateObj.staffIds).map(id => dateObj.staffIds[id]);
          }
          
          return dateObj;
        });
      }
      
      // Ensure client information is properly included
      if (bookingData.clientId) {
        try {
          const clientDoc = await getDoc(doc(db, 'clients', bookingData.clientId));
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            // Client data is in the 'contacts' field
            bookingData.client = {
              id: clientDoc.id,
              name: clientData.contacts?.name || clientData.name || "Unknown Client",
              contactInfo: clientData.contacts?.email || clientData.contacts?.phone || clientData.contactInfo || "",
              location: clientData.contacts?.location || clientData.location || "",
              category: clientData.category || ""
            };
          } else {
            bookingData.client = { name: "Unknown Client" };
          }
        } catch (error) {
          console.error('Error fetching client details:', error);
          bookingData.client = { name: "Unknown Client" };
        }
      } else if (bookingData.client && typeof bookingData.client === 'object' && bookingData.client.id) {
        // Client reference exists in booking, but we should enhance it
        try {
          const clientDoc = await getDoc(doc(db, 'clients', bookingData.client.id));
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            bookingData.client = {
              ...bookingData.client,
              name: clientData.contacts?.name || clientData.name || bookingData.client.name || "Unknown Client",
              contactInfo: clientData.contacts?.email || clientData.contacts?.phone || bookingData.client.contactInfo || "",
              location: clientData.contacts?.location || clientData.location || bookingData.client.location || "",
              category: clientData.category || bookingData.client.category || ""
            };
          }
        } catch (error) {
          console.error('Error enhancing client details:', error);
        }
      }
      
      return bookingData;
    }
    
    // If no exact match, try fuzzy search
    const matches = await findBookingsByDescription(bookingName);
    
    if (matches.length > 0) {
      // Return the best match
      return matches[0];
    }
    
    // No matches found
    return null;
  } catch (error) {
    console.error('Error fetching booking by name:', error);
    throw error;
  }
}

// Enhanced function to support fuzzy show title search
async function findBookingsByDescription(description) {
  try {
    // Get all bookings
    const bookingsCollection = collection(db, 'bookings');
    const snapshot = await getDocs(bookingsCollection);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Clean and normalize the search terms
    const searchTerms = description.toLowerCase().trim().split(/\s+/);
    
    // Score each booking based on match quality
    const scoredBookings = snapshot.docs.map(doc => {
      const booking = { id: doc.id, ...doc.data() };
      const showTitle = booking.show ? booking.show.toLowerCase() : '';
      
      // Calculate match score based on how many search terms are found in the title
      let score = 0;
      for (const term of searchTerms) {
        // Increase score if the term appears in the show title
        if (term.length > 2 && showTitle.includes(term)) {
          score += 10;
          
          // Bonus points for exact word matches
          if (showTitle.split(/\s+/).includes(term)) {
            score += 5;
          }
        }
      }
      
      return { booking, score };
    });
    
    // Filter out bookings with no match and sort by score
    const matches = scoredBookings
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Return matches with enhanced details
    return Promise.all(matches.map(async item => {
      const booking = item.booking;
      
      // Ensure client information is included
      if (booking.clientId) {
        try {
          const clientDoc = await getDoc(doc(db, 'clients', booking.clientId));
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            booking.client = {
              id: clientDoc.id,
              // Look in the contacts field first, then fall back to direct properties
              name: clientData.contacts?.name || clientData.name || "Unknown Client",
              contactInfo: clientData.contacts?.email || clientData.contacts?.phone || clientData.contactInfo || "",
              location: clientData.contacts?.location || clientData.location || "",
              category: clientData.category || ""
            };
          } else {
            booking.client = { name: "Unknown Client" };
          }
        } catch (error) {
          console.error('Error fetching client details:', error);
          booking.client = { name: "Unknown Client" };
        }
      } else if (booking.client && typeof booking.client === 'object' && booking.client.id) {
        // Client reference exists in booking, but we should enhance it
        try {
          const clientDoc = await getDoc(doc(db, 'clients', booking.client.id));
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            booking.client = {
              ...booking.client,
              name: clientData.contacts?.name || clientData.name || booking.client.name || "Unknown Client",
              contactInfo: clientData.contacts?.email || clientData.contacts?.phone || booking.client.contactInfo || "",
              location: clientData.contacts?.location || clientData.location || booking.client.location || "",
              category: clientData.category || booking.client.category || ""
            };
          }
        } catch (error) {
          console.error('Error enhancing client details:', error);
        }
      } else if (!booking.client) {
        booking.client = { name: "Unknown Client" };
      }
      
      return booking;
    }));
  } catch (error) {
    console.error('Error finding bookings by description:', error);
    throw error;
  }
}

// Function to get client by name
async function getClientByName(clientName) {
  try {
    // First try an exact match
    const clientsCollection = collection(db, 'clients');
    const q = query(clientsCollection, where("name", "==", clientName));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Return the first exact matching client
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    // If no exact match, try fuzzy search
    const matches = await findClientsByDescription(clientName);
    
    if (matches.length > 0) {
      // Return the best match
      return matches[0];
    }
    
    // No matches found
    return null;
  } catch (error) {
    console.error('Error fetching client by name:', error);
    throw error;
  }
}

// Enhanced function to support fuzzy client name search
async function findClientsByDescription(description) {
  try {
    // Get all clients
    const clientsCollection = collection(db, 'clients');
    const snapshot = await getDocs(clientsCollection);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Clean and normalize the search terms
    const searchTerms = description.toLowerCase().trim().split(/\s+/);
    
    // Score each client based on match quality
    const scoredClients = snapshot.docs.map(doc => {
      const client = { id: doc.id, ...doc.data() };
      const clientName = client.name ? client.name.toLowerCase() : '';
      
      // Calculate match score based on how many search terms are found in the name
      let score = 0;
      for (const term of searchTerms) {
        // Increase score if the term appears in the client name
        if (term.length > 2 && clientName.includes(term)) {
          score += 10;
          
          // Bonus points for exact word matches
          if (clientName.split(/\s+/).includes(term)) {
            score += 5;
          }
        }
      }
      
      return { client, score };
    });
    
    // Filter out clients with no match and sort by score
    const matches = scoredClients
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Return matches
    return matches.map(item => item.client);
  } catch (error) {
    console.error('Error finding clients by description:', error);
    throw error;
  }
}

// Function to get staff by name
async function getStaffByName(staffName) {
  try {
    // First try an exact match
    const staffCollection = collection(db, 'staff');
    const q = query(staffCollection, where("name", "==", staffName));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Return the first exact matching staff
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    // Try with firstName/lastName combination if that fails
    const firstLastQuery = staffName.split(' ');
    if (firstLastQuery.length > 1) {
      const firstName = firstLastQuery[0];
      const lastName = firstLastQuery.slice(1).join(' ');
      
      const firstNameQuery = query(staffCollection, where("firstName", "==", firstName));
      const firstNameSnapshot = await getDocs(firstNameQuery);
      
      // Filter manually for lastName since we can't do a compound query
      const matches = firstNameSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.lastName && data.lastName.toLowerCase() === lastName.toLowerCase();
      });
      
      if (matches.length > 0) {
        const doc = matches[0];
        return { id: doc.id, ...doc.data() };
      }
    }
    
    // If no exact match, try fuzzy search
    const matches = await findStaffByDescription(staffName);
    
    if (matches.length > 0) {
      // Return the best match
      return matches[0];
    }
    
    // No matches found
    return null;
  } catch (error) {
    console.error('Error fetching staff by name:', error);
    throw error;
  }
}

// Enhanced function to support fuzzy staff name search
async function findStaffByDescription(description) {
  try {
    // Get all staff
    const staffCollection = collection(db, 'staff');
    const snapshot = await getDocs(staffCollection);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Clean and normalize the search terms
    const searchTerms = description.toLowerCase().trim().split(/\s+/);
    
    // Score each staff based on match quality
    const scoredStaff = snapshot.docs.map(doc => {
      const staff = { id: doc.id, ...doc.data() };
      
      // Support both name formats
      let staffName = '';
      if (staff.name) {
        staffName = staff.name.toLowerCase();
      } else if (staff.firstName || staff.lastName) {
        staffName = `${staff.firstName || ''} ${staff.lastName || ''}`.toLowerCase().trim();
      }
      
      // Calculate match score based on how many search terms are found in the name
      let score = 0;
      for (const term of searchTerms) {
        // Increase score if the term appears in the staff name
        if (term.length > 2 && staffName.includes(term)) {
          score += 10;
          
          // Bonus points for exact word matches
          if (staffName.split(/\s+/).includes(term)) {
            score += 5;
          }
        }
        
        // Also check role if available
        if (staff.role && staff.role.toLowerCase().includes(term)) {
          score += 5;
        }
      }
      
      return { staff, score };
    });
    
    // Filter out staff with no match and sort by score
    const matches = scoredStaff
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Return matches
    return matches.map(item => item.staff);
  } catch (error) {
    console.error('Error finding staff by description:', error);
    throw error;
  }
}

// Function to edit booking
async function editBooking(bookingData) {
  try {
    let bookingId = bookingData.booking_id;
    let clientId = bookingData.client.client_id;
    
    // If booking_id is not an ID but a name, look it up
    if (bookingId && !bookingId.match(/^[a-zA-Z0-9]{20}$/)) {
      const booking = await getBookingByName(bookingId);
      if (!booking) {
        throw new Error(`Booking "${bookingId}" not found`);
      }
      bookingId = booking.id;
    }
    
    // If client_id is not an ID but a name, look it up
    if (clientId && !clientId.match(/^[a-zA-Z0-9]{20}$/)) {
      const client = await getClientByName(clientId);
      if (!client) {
        throw new Error(`Client "${clientId}" not found`);
      }
      clientId = client.id;
    }
    
    // Map staff names to IDs if needed
    const staffIds = [];
    for (const staffNameOrId of bookingData.staff) {
      if (staffNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
        staffIds.push(staffNameOrId);
      } else {
        const staff = await getStaffByName(staffNameOrId);
        if (!staff) {
          throw new Error(`Staff member "${staffNameOrId}" not found`);
        }
        staffIds.push(staff.id);
      }
    }
    
    // Check if booking exists
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }
    
    // Update booking with new data
    const updatedBooking = {
      client: {
        id: clientId,
        name: bookingData.client.name,
        contactInfo: bookingData.client.contact_info
      },
      show: bookingData.show,
      staff: staffIds,
      staffNeeded: bookingData.staff_needed,
      daysNeeded: bookingData.days_needed,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(bookingRef, updatedBooking);
    return { id: bookingId, ...updatedBooking };
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

// Function to create a new booking
async function createBooking(bookingData) {
  try {
    let clientId = bookingData.client.client_id;
    
    // If client_id is not an ID but a name, look it up
    if (clientId && !clientId.match(/^[a-zA-Z0-9]{20}$/)) {
      const client = await getClientByName(clientId);
      if (!client) {
        // Create new client if not found
        const newClient = await createClient({
          name: bookingData.client.name,
          contact_info: bookingData.client.contact_info
        });
        clientId = newClient.id;
      } else {
        clientId = client.id;
      }
    }
    
    // Map staff names to IDs if needed
    const staffIds = [];
    for (const staffNameOrId of bookingData.staff) {
      if (staffNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
        staffIds.push(staffNameOrId);
      } else {
        const staff = await getStaffByName(staffNameOrId);
        if (!staff) {
          throw new Error(`Staff member "${staffNameOrId}" not found`);
        }
        staffIds.push(staff.id);
      }
    }
    
    const bookingsCollection = collection(db, 'bookings');
    
    const newBooking = {
      client: {
        id: clientId,
        name: bookingData.client.name,
        contactInfo: bookingData.client.contact_info
      },
      show: bookingData.show,
      staff: staffIds,
      staffNeeded: bookingData.staff_needed,
      daysNeeded: bookingData.days_needed,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(bookingsCollection, newBooking);
    return { id: docRef.id, ...newBooking };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Function to delete a booking
async function deleteBooking(bookingNameOrId) {
  try {
    let bookingId = bookingNameOrId;
    
    // If bookingNameOrId is not an ID but a name, look it up
    if (!bookingNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      const booking = await getBookingByName(bookingNameOrId);
      if (!booking) {
        throw new Error(`Booking "${bookingNameOrId}" not found`);
      }
      bookingId = booking.id;
    }
    
    const bookingRef = doc(db, 'bookings', bookingId);
    await deleteDoc(bookingRef);
    return { success: true, message: `Booking deleted successfully` };
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
}

// Client functions (get, create, update, delete)
async function getClient(clientNameOrId) {
  try {
    // If clientNameOrId might be a name rather than an ID
    if (!clientNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      return getClientByName(clientNameOrId);
    }
    
    const clientRef = doc(db, 'clients', clientNameOrId);
    const clientSnap = await getDoc(clientRef);
    
    if (clientSnap.exists()) {
      return { id: clientSnap.id, ...clientSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
}

async function createClient(clientData) {
  try {
    const clientsCollection = collection(db, 'clients');
    
    const newClient = {
      name: clientData.name,
      contactInfo: clientData.contact_info,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(clientsCollection, newClient);
    return { id: docRef.id, ...newClient };
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

async function updateClient(clientData) {
  try {
    let clientId = clientData.client_id;
    
    // If client_id is not an ID but a name, look it up
    if (!clientId.match(/^[a-zA-Z0-9]{20}$/)) {
      const client = await getClientByName(clientId);
      if (!client) {
        throw new Error(`Client "${clientId}" not found`);
      }
      clientId = client.id;
    }
    
    const clientRef = doc(db, 'clients', clientId);
    
    const updatedClient = {
      name: clientData.name,
      contactInfo: clientData.contact_info,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(clientRef, updatedClient);
    return { id: clientId, ...updatedClient };
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
}

// Staff functions (get, create, update, delete)
async function getStaff(staffNameOrId) {
  try {
    // If staffNameOrId might be a name rather than an ID
    if (!staffNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      return getStaffByName(staffNameOrId);
    }
    
    const staffRef = doc(db, 'staff', staffNameOrId);
    const staffSnap = await getDoc(staffRef);
    
    if (staffSnap.exists()) {
      return { id: staffSnap.id, ...staffSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
}

async function createStaff(staffData) {
  try {
    const staffCollection = collection(db, 'staff');
    
    const newStaff = {
      name: staffData.name,
      role: staffData.role,
      contactInfo: staffData.contact_info,
      availability: staffData.availability || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(staffCollection, newStaff);
    return { id: docRef.id, ...newStaff };
  } catch (error) {
    console.error('Error creating staff member:', error);
    throw error;
  }
}

async function updateStaff(staffData) {
  try {
    let staffId = staffData.staff_id;
    
    // If staff_id is not an ID but a name, look it up
    if (!staffId.match(/^[a-zA-Z0-9]{20}$/)) {
      const staff = await getStaffByName(staffId);
      if (!staff) {
        throw new Error(`Staff member "${staffId}" not found`);
      }
      staffId = staff.id;
    }
    
    const staffRef = doc(db, 'staff', staffId);
    
    const updatedStaff = {
      name: staffData.name,
      role: staffData.role,
      contactInfo: staffData.contact_info,
      availability: staffData.availability || [],
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(staffRef, updatedStaff);
    return { id: staffId, ...updatedStaff };
  } catch (error) {
    console.error('Error updating staff member:', error);
    throw error;
  }
}

// Function to get booking by ID
async function getBooking(bookingNameOrId) {
  try {
    // If bookingNameOrId might be a name rather than an ID
    if (!bookingNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      return getBookingByName(bookingNameOrId);
    }
    
    const bookingRef = doc(db, 'bookings', bookingNameOrId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (bookingSnap.exists()) {
      const booking = { id: bookingSnap.id, ...bookingSnap.data() };
      console.log('Raw booking data from Firestore:', JSON.stringify(booking).substring(0, 500) + "...");
      
      // Ensure proper data structure - datesNeeded might be a map in Firestore
      if (booking.datesNeeded && typeof booking.datesNeeded === 'object' && !Array.isArray(booking.datesNeeded)) {
        console.log('Converting datesNeeded from map to array');
        // Convert from map to array
        booking.datesNeeded = Object.keys(booking.datesNeeded).map(key => {
          const dateObj = booking.datesNeeded[key];
          
          // Handle staffIds which might also be a map
          if (dateObj.staffIds && typeof dateObj.staffIds === 'object' && !Array.isArray(dateObj.staffIds)) {
            dateObj.staffIds = Object.keys(dateObj.staffIds).map(id => dateObj.staffIds[id]);
          }
          
          return dateObj;
        });
      }
      
      // Ensure client information is complete
      if (booking.clientId) {
        try {
          console.log('Looking up client details for clientId:', booking.clientId);
          const clientDoc = await getDoc(doc(db, 'clients', booking.clientId));
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            booking.client = {
              id: clientDoc.id,
              // Look in the contacts field first, then fall back to direct properties
              name: clientData.contacts?.name || clientData.name || "Unknown Client",
              contactInfo: clientData.contacts?.email || clientData.contacts?.phone || clientData.contactInfo || "",
              location: clientData.contacts?.location || clientData.location || "",
              category: clientData.category || ""
            };
          } else {
            console.log('Client document not found for ID:', booking.clientId);
            booking.client = { name: "Unknown Client" };
          }
        } catch (error) {
          console.error('Error fetching client details:', error);
          booking.client = { name: "Unknown Client" };
        }
      } else if (booking.client && typeof booking.client === 'object' && booking.client.id) {
        // Client reference exists in booking, but we should enhance it
        try {
          console.log('Enhancing existing client data from client ID:', booking.client.id);
          const clientDoc = await getDoc(doc(db, 'clients', booking.client.id));
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            booking.client = {
              ...booking.client,
              name: clientData.contacts?.name || clientData.name || booking.client.name || "Unknown Client",
              contactInfo: clientData.contacts?.email || clientData.contacts?.phone || booking.client.contactInfo || "",
              location: clientData.contacts?.location || clientData.location || booking.client.location || "",
              category: clientData.category || booking.client.category || ""
            };
          }
        } catch (error) {
          console.error('Error enhancing client details:', error);
        }
      } else if (!booking.client) {
        console.log('No client data found, adding placeholder');
        booking.client = { name: "Unknown Client" };
      }
      
      console.log('Processed booking data:', JSON.stringify(booking).substring(0, 500) + "...");
      return booking;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
}

// Function to get all bookings
async function getAllBookings() {
  try {
    const bookingsCollection = collection(db, 'bookings');
    const snapshot = await getDocs(bookingsCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    throw error;
  }
}

// Function to get all clients
async function getAllClients() {
  try {
    const clientsCollection = collection(db, 'clients');
    const snapshot = await getDocs(clientsCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching all clients:', error);
    throw error;
  }
}

// Function to get all staff
async function getAllStaff() {
  try {
    const staffCollection = collection(db, 'staff');
    const snapshot = await getDocs(staffCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching all staff:', error);
    throw error;
  }
}

// Function to get staff availability from the availability collection
async function getStaffAvailabilityFromCollection(date) {
  try {
    const availabilityCollection = collection(db, 'availability');
    
    // Query for staff with the given date in their availableDates array
    const q = query(availabilityCollection, where("availableDates", "array-contains", date));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Map to staff details
    const availableStaff = await Promise.all(snapshot.docs.map(async doc => {
      const availability = doc.data();
      let staffDetails = {
        id: availability.staffId || doc.id,
        availabilityId: doc.id,
        name: availability.staffName || "Unknown Staff",
        dates: availability.availableDates || [],
        show: availability.showId || null
      };
      
      // If we have a staffId reference, try to get more details from staff collection
      if (availability.staffId) {
        try {
          const staffDoc = await getDoc(doc(db, 'staff', availability.staffId));
          if (staffDoc.exists()) {
            const staffData = staffDoc.data();
            staffDetails = {
              ...staffDetails,
              role: staffData.role || "",
              contactInfo: staffData.contactInfo || "",
              availability: staffData.availability || []
            };
          }
        } catch (error) {
          console.error('Error fetching staff details:', error);
        }
      }
      
      return staffDetails;
    }));
    
    return availableStaff;
  } catch (error) {
    console.error('Error fetching staff availability from collection:', error);
    throw error;
  }
}

// Function to find staff available for a booking based on dates
async function findStaffForBookingDates(bookingNameOrId, requiredDates) {
  try {
    // Get booking details
    const booking = await getBooking(bookingNameOrId);
    if (!booking) {
      throw new Error(`Booking "${bookingNameOrId}" not found`);
    }
    
    // If no specific dates provided, use booking dates
    if (!requiredDates || !requiredDates.length) {
      const bookingDates = booking.datesNeeded || [];
      requiredDates = bookingDates.map(d => d.date);
    }
    
    if (!requiredDates.length) {
      throw new Error(`No dates found for booking "${booking.show}"`);
    }
    
    // Query availability collection for each date and find common staff
    let availableStaffByDate = {};
    let allStaffIds = new Set();
    
    // Get available staff for each date
    for (const date of requiredDates) {
      const staffForDate = await getStaffAvailabilityFromCollection(date);
      availableStaffByDate[date] = staffForDate;
      
      // Add all staff IDs to the set
      staffForDate.forEach(staff => {
        allStaffIds.add(staff.id);
      });
    }
    
    // Find staff available for all required dates
    const staffAvailableForAllDates = Array.from(allStaffIds).filter(staffId => {
      return requiredDates.every(date => {
        return availableStaffByDate[date].some(staff => staff.id === staffId);
      });
    });
    
    // Get full details for available staff
    const availableStaff = [];
    for (const staffId of staffAvailableForAllDates) {
      // Use staff from the first date's results as they all have the same ID
      const firstDate = requiredDates[0];
      const staffDetails = availableStaffByDate[firstDate].find(s => s.id === staffId);
      
      if (staffDetails) {
        availableStaff.push(staffDetails);
      }
    }
    
    return {
      booking: {
        id: booking.id,
        show: booking.show
      },
      requiredDates,
      availableStaff
    };
  } catch (error) {
    console.error('Error finding staff for booking dates:', error);
    throw error;
  }
}

// Function to check if staff is available on a specific date
async function isStaffAvailableOnDate(staffNameOrId, date) {
  try {
    // First get the staff ID if name was provided
    let staffId = staffNameOrId;
    if (!staffNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      const staff = await getStaffByName(staffNameOrId);
      if (!staff) {
        throw new Error(`Staff "${staffNameOrId}" not found`);
      }
      staffId = staff.id;
    }
    
    // Check in the availability collection
    const availabilityCollection = collection(db, 'availability');
    const q = query(
      availabilityCollection, 
      where("staffId", "==", staffId),
      where("availableDates", "array-contains", date)
    );
    
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if staff is available:', error);
    throw error;
  }
}

// Enhanced function to get staff available on a specific date
async function getAvailableStaffOnDate(date) {
  try {
    // First check the availability collection (new structure)
    const staffFromAvailability = await getStaffAvailabilityFromCollection(date);
    
    if (staffFromAvailability.length > 0) {
      return staffFromAvailability;
    }
    
    // Fall back to the old method - check availability array in staff documents
    const staffCollection = collection(db, 'staff');
    const snapshot = await getDocs(staffCollection);
    
    const availableStaff = [];
    
    for (const doc of snapshot.docs) {
      const staff = {
        id: doc.id,
        ...doc.data()
      };
      
      // Check if staff has availability array and if the date is in it
      if (staff.availability && Array.isArray(staff.availability) && 
          staff.availability.includes(date)) {
        availableStaff.push(staff);
      }
    }
    
    return availableStaff;
  } catch (error) {
    console.error('Error fetching staff availability for date:', error);
    throw error;
  }
}

// Enhanced function to check which staff members are available for a booking date
async function getAvailableStaffForBookingDate(bookingNameOrId, date) {
  try {
    // Get booking details
    const booking = await getBooking(bookingNameOrId);
    if (!booking) {
      throw new Error(`Booking "${bookingNameOrId}" not found`);
    }
    
    // Check if the date exists in the booking's datesNeeded
    const datesNeeded = booking.datesNeeded || [];
    const dateObj = datesNeeded.find(d => d.date === date);
    
    if (!dateObj) {
      throw new Error(`Date "${date}" not found in booking "${booking.show}"`);
    }
    
    // Find staff available for the date - check the availability collection first
    const availableStaff = await getAvailableStaffOnDate(date);
    
    // Calculate how many more staff are needed
    const staffNeeded = dateObj.staffCount || booking.staffNeeded || 0;
    const staffAssigned = (dateObj.staffIds || []).length;
    const staffNeededCount = Math.max(0, staffNeeded - staffAssigned);
    
    // Get currently assigned staff for this date
    const assignedStaffDetails = [];
    if (dateObj.staffIds && dateObj.staffIds.length > 0) {
      for (const staffId of dateObj.staffIds) {
        const staffDoc = await getDoc(doc(db, 'staff', staffId));
        if (staffDoc.exists()) {
          assignedStaffDetails.push({ id: staffDoc.id, ...staffDoc.data() });
        }
      }
    }
    
    return {
      booking,
      date: dateObj,
      staffNeeded,
      staffAssigned,
      staffNeededCount,
      assignedStaff: assignedStaffDetails,
      availableStaff
    };
  } catch (error) {
    console.error('Error checking staff availability for booking date:', error);
    throw error;
  }
}

// Enhanced function to get staff members who can work all booking dates
async function getStaffForAllBookingDates(bookingNameOrId) {
  try {
    // Get booking details
    const booking = await getBooking(bookingNameOrId);
    if (!booking) {
      throw new Error(`Booking "${bookingNameOrId}" not found`);
    }
    
    // Extract dates from the booking
    const datesNeeded = booking.datesNeeded || [];
    if (!datesNeeded.length) {
      throw new Error(`Booking "${booking.show}" doesn't have any dates specified`);
    }
    
    const dateStrings = datesNeeded.map(d => d.date);
    
    // Check availability collection first
    const resultFromAvailability = await findStaffForBookingDates(bookingNameOrId, dateStrings);
    
    if (resultFromAvailability.availableStaff.length > 0) {
      return resultFromAvailability;
    }
    
    // Fall back to the old method - checking availability array in staff documents
    const allStaff = await getAllStaff();
    const availableStaff = allStaff.filter(staff => {
      if (!staff.availability || !Array.isArray(staff.availability)) return false;
      
      // Check if staff is available for all required dates
      return dateStrings.every(dateStr => staff.availability.includes(dateStr));
    });
    
    // Get details about the booking dates
    const dateDetails = datesNeeded.map(dateObj => {
      return {
        date: dateObj.date, 
        staffCount: dateObj.staffCount,
        staffIds: dateObj.staffIds || []
      };
    });
    
    return {
      booking: {
        id: booking.id,
        show: booking.show
      },
      dates: dateDetails,
      availableStaff
    };
  } catch (error) {
    console.error('Error finding staff for all booking dates:', error);
    throw error;
  }
}

// Function to update a staff member's availability
async function updateStaffAvailability(staffNameOrId, dates, available = true) {
  try {
    // First get the staff ID if name was provided
    let staffId = staffNameOrId;
    let staffName = "";
    
    if (!staffNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      const staff = await getStaffByName(staffNameOrId);
      if (!staff) {
        throw new Error(`Staff "${staffNameOrId}" not found`);
      }
      staffId = staff.id;
      staffName = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim();
    } else {
      // Get staff name for the record
      const staffDoc = await getDoc(doc(db, 'staff', staffId));
      if (staffDoc.exists()) {
        const staffData = staffDoc.data();
        staffName = staffData.name || `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim();
      }
    }
    
    // For each date, handle availability
    const results = [];
    
    for (const date of dates) {
      // Check if staff already has availability record for this date
      const availabilityCollection = collection(db, 'availability');
      const q = query(
        availabilityCollection, 
        where("staffId", "==", staffId),
        where("availableDates", "array-contains", date)
      );
      
      const snapshot = await getDocs(q);
      
      if (available) {
        // Add availability
        if (snapshot.empty) {
          // Create new availability record
          const newAvailability = {
            staffId,
            staffName,
            availableDates: [date],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          const docRef = await addDoc(availabilityCollection, newAvailability);
          results.push({
            date,
            action: 'added',
            id: docRef.id
          });
        } else {
          // Record exists, verify date is in availableDates
          const existingDoc = snapshot.docs[0];
          const existingData = existingDoc.data();
          
          // Date is already in the array (from the query), so no update needed
          results.push({
            date,
            action: 'already_available',
            id: existingDoc.id
          });
        }
      } else {
        // Remove availability
        if (!snapshot.empty) {
          // Records exist, remove date from availableDates
          for (const doc of snapshot.docs) {
            const existingData = doc.data();
            const updatedDates = existingData.availableDates.filter(d => d !== date);
            
            if (updatedDates.length === 0) {
              // If no dates left, delete the document
              await deleteDoc(doc.ref);
              results.push({
                date,
                action: 'removed_document',
                id: doc.id
              });
            } else {
              // Update with remaining dates
              await updateDoc(doc.ref, {
                availableDates: updatedDates,
                updatedAt: serverTimestamp()
              });
              results.push({
                date,
                action: 'removed_date',
                id: doc.id
              });
            }
          }
        } else {
          // No records found for this date
          results.push({
            date,
            action: 'not_available_initially',
          });
        }
      }
    }
    
    return {
      staffId,
      staffName,
      results
    };
  } catch (error) {
    console.error('Error updating staff availability:', error);
    throw error;
  }
}

// Function to add staff to a booking date, checking availability
async function addStaffToBookingDate(bookingNameOrId, date, staffNameOrId) {
  try {
    // First get the booking ID if name was provided
    let bookingId = bookingNameOrId;
    if (!bookingNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      const booking = await getBookingByName(bookingNameOrId);
      if (!booking) {
        throw new Error(`Booking "${bookingNameOrId}" not found`);
      }
      bookingId = booking.id;
    }
    
    // Get the staff ID if name was provided
    let staffId = staffNameOrId;
    if (!staffNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      const staff = await getStaffByName(staffNameOrId);
      if (!staff) {
        throw new Error(`Staff "${staffNameOrId}" not found`);
      }
      staffId = staff.id;
    }
    
    // Check if staff is available on this date using availability collection
    const isAvailable = await isStaffAvailableOnDate(staffId, date);
    
    if (!isAvailable) {
      throw new Error(`Staff is not available on ${date}`);
    }
    
    // Get the booking document
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }
    
    const bookingData = bookingSnap.data();
    const datesNeeded = bookingData.datesNeeded || [];
    
    // Find the date in the booking
    const dateIndex = datesNeeded.findIndex(d => d.date === date);
    
    if (dateIndex === -1) {
      throw new Error(`Date "${date}" not found in booking`);
    }
    
    // Add staff to the date if not already added
    const dateStaffIds = datesNeeded[dateIndex].staffIds || [];
    
    if (dateStaffIds.includes(staffId)) {
      return { 
        message: `Staff already assigned to this date`,
        booking: { id: bookingId, ...bookingData },
        date,
        staffId
      };
    }
    
    // Add the staff ID to the date
    dateStaffIds.push(staffId);
    datesNeeded[dateIndex].staffIds = dateStaffIds;
    
    // Update the booking
    await updateDoc(bookingRef, {
      datesNeeded,
      updatedAt: serverTimestamp()
    });
    
    // Get updated booking data
    const updatedBookingSnap = await getDoc(bookingRef);
    const updatedBookingData = updatedBookingSnap.data();
    
    return {
      message: `Staff successfully added to booking on ${date}`,
      booking: {
        id: bookingId,
        ...updatedBookingData
      },
      date,
      staffId
    };
  } catch (error) {
    console.error('Error adding staff to booking date:', error);
    throw error;
  }
}

// Function to remove staff from a booking date
async function removeStaffFromBookingDate(bookingNameOrId, date, staffNameOrId) {
  try {
    // First get the booking ID if name was provided
    let bookingId = bookingNameOrId;
    if (!bookingNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      const booking = await getBookingByName(bookingNameOrId);
      if (!booking) {
        throw new Error(`Booking "${bookingNameOrId}" not found`);
      }
      bookingId = booking.id;
    }
    
    // Get the staff ID if name was provided
    let staffId = staffNameOrId;
    if (!staffNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      const staff = await getStaffByName(staffNameOrId);
      if (!staff) {
        throw new Error(`Staff "${staffNameOrId}" not found`);
      }
      staffId = staff.id;
    }
    
    // Get the booking document
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }
    
    const bookingData = bookingSnap.data();
    const datesNeeded = bookingData.datesNeeded || [];
    
    // Find the date in the booking
    const dateIndex = datesNeeded.findIndex(d => d.date === date);
    
    if (dateIndex === -1) {
      throw new Error(`Date "${date}" not found in booking`);
    }
    
    // Remove staff from the date if present
    const dateStaffIds = datesNeeded[dateIndex].staffIds || [];
    
    if (!dateStaffIds.includes(staffId)) {
      return { 
        message: `Staff not assigned to this date`,
        booking: { id: bookingId, ...bookingData },
        date,
        staffId
      };
    }
    
    // Remove the staff ID from the date
    datesNeeded[dateIndex].staffIds = dateStaffIds.filter(id => id !== staffId);
    
    // Update the booking
    await updateDoc(bookingRef, {
      datesNeeded,
      updatedAt: serverTimestamp()
    });
    
    // Get updated booking data
    const updatedBookingSnap = await getDoc(bookingRef);
    const updatedBookingData = updatedBookingSnap.data();
    
    return {
      message: `Staff successfully removed from booking on ${date}`,
      booking: {
        id: bookingId,
        ...updatedBookingData
      },
      date,
      staffId
    };
  } catch (error) {
    console.error('Error removing staff from booking date:', error);
    throw error;
  }
}

// Function to search across all entities (bookings, clients, staff) with one query
async function searchAllEntities(query) {
  try {
    if (!query || query.trim().length < 2) {
      return { bookings: [], clients: [], staff: [] };
    }

    // Get all data
    const [bookings, clients, staffMembers] = await Promise.all([
      getAllBookings(),
      getAllClients(),
      getAllStaff()
    ]);

    // Search terms
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    
    // Search bookings
    const scoredBookings = bookings.map(booking => {
      const showTitle = booking.show ? booking.show.toLowerCase() : '';
      let score = 0;
      
      for (const term of searchTerms) {
        if (term.length > 2 && showTitle.includes(term)) {
          score += 10;
          if (showTitle.split(/\s+/).includes(term)) {
            score += 5;
          }
        }
      }
      
      return { booking, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
    
    // Search clients
    const scoredClients = clients.map(client => {
      const clientName = client.name ? client.name.toLowerCase() : '';
      let score = 0;
      
      for (const term of searchTerms) {
        if (term.length > 2 && clientName.includes(term)) {
          score += 10;
          if (clientName.split(/\s+/).includes(term)) {
            score += 5;
          }
        }
      }
      
      return { client, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
    
    // Search staff
    const scoredStaff = staffMembers.map(staff => {
      // Support both name formats
      let staffName = '';
      if (staff.name) {
        staffName = staff.name.toLowerCase();
      } else if (staff.firstName || staff.lastName) {
        staffName = `${staff.firstName || ''} ${staff.lastName || ''}`.toLowerCase().trim();
      }
      
      let score = 0;
      
      for (const term of searchTerms) {
        if (term.length > 2 && staffName.includes(term)) {
          score += 10;
          if (staffName.split(/\s+/).includes(term)) {
            score += 5;
          }
        }
        
        // Also check role if available
        if (staff.role && staff.role.toLowerCase().includes(term)) {
          score += 5;
        }
      }
      
      return { staff, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
    
    return {
      bookings: scoredBookings.slice(0, 5).map(item => item.booking),
      clients: scoredClients.slice(0, 5).map(item => item.client),
      staff: scoredStaff.slice(0, 5).map(item => item.staff)
    };
  } catch (error) {
    console.error('Error searching all entities:', error);
    throw error;
  }
}

// Function to search shows by attributes (name, season, type, etc.)
async function searchShowsByAttributes(query) {
  try {
    // Get all shows
    const showsCollection = collection(db, 'shows');
    const snapshot = await getDocs(showsCollection);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Clean and normalize the search terms
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    
    // Score each show based on match quality
    const scoredShows = snapshot.docs.map(doc => {
      const show = { id: doc.id, ...doc.data() };
      const showName = show.name ? show.name.toLowerCase() : '';
      const showSeason = show.season ? show.season.toLowerCase() : '';
      const showType = show.type ? show.type.toLowerCase() : '';
      const showLocation = show.location ? show.location.toLowerCase() : '';
      
      // Calculate match score based on how many search terms are found
      let score = 0;
      for (const term of searchTerms) {
        if (term.length < 2) continue; // Skip very short terms
        
        // Check name with higher weight
        if (showName.includes(term)) {
          score += 15;
          // Bonus for exact word match
          if (showName.split(/\s+/).includes(term)) {
            score += 10;
          }
        }
        
        // Check season with medium weight
        if (showSeason.includes(term)) {
          score += 10;
          // Exact season match gets bonus
          if (showSeason === term) {
            score += 5;
          }
        }
        
        // Check type with medium weight
        if (showType.includes(term)) {
          score += 10;
          // Exact type match gets bonus
          if (showType === term) {
            score += 5;
          }
        }
        
        // Check location
        if (showLocation.includes(term)) {
          score += 8;
        }
      }
      
      return { show, score };
    });
    
    // Filter out shows with no match and sort by score
    const matches = scoredShows
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Return matches
    return matches.map(item => item.show);
  } catch (error) {
    console.error('Error searching shows by attributes:', error);
    throw error;
  }
}

// Function to find bookings by show attributes
async function findBookingsByShowAttributes(query) {
  try {
    // First, find shows matching the query
    const matchingShows = await searchShowsByAttributes(query);
    
    if (matchingShows.length === 0) {
      return [];
    }
    
    // Get all bookings
    const bookingsCollection = collection(db, 'bookings');
    const bookingsSnapshot = await getDocs(bookingsCollection);
    
    if (bookingsSnapshot.empty) {
      return [];
    }
    
    // Get bookings that reference these shows
    const allBookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter bookings by matching shows and enhance with show data
    const matchedBookings = [];
    
    for (const booking of allBookings) {
      // Check if this booking references any of our matching shows
      const matchedShow = matchingShows.find(show => {
        // Match by show name if the booking has a show field
        if (booking.show && show.name === booking.show) {
          return true;
        }
        
        // Match by showId if the booking has that field
        if (booking.showId && show.id === booking.showId) {
          return true;
        }
        
        return false;
      });
      
      if (matchedShow) {
        // Add the matched show data to the booking
        booking.showDetails = matchedShow;
        
        // Get client information if it exists
        if (booking.clientId) {
          try {
            const clientDoc = await getDoc(doc(db, 'clients', booking.clientId));
            if (clientDoc.exists()) {
              const clientData = clientDoc.data();
              booking.client = {
                id: clientDoc.id,
                // Look in contacts field first, then direct properties
                name: clientData.contacts?.name || clientData.name || "Unknown Client",
                contactInfo: clientData.contacts?.email || clientData.contacts?.phone || clientData.contactInfo || "",
                location: clientData.contacts?.location || clientData.location || "",
                category: clientData.category || ""
              };
            } else {
              booking.client = { name: "Unknown Client" };
            }
          } catch (error) {
            console.error('Error fetching client details:', error);
            booking.client = { name: "Unknown Client" };
          }
        } else if (booking.client && typeof booking.client === 'object' && booking.client.id) {
          // Client reference exists in booking, but we should enhance it
          try {
            const clientDoc = await getDoc(doc(db, 'clients', booking.client.id));
            if (clientDoc.exists()) {
              const clientData = clientDoc.data();
              booking.client = {
                ...booking.client,
                name: clientData.contacts?.name || clientData.name || booking.client.name || "Unknown Client",
                contactInfo: clientData.contacts?.email || clientData.contacts?.phone || booking.client.contactInfo || "",
                location: clientData.contacts?.location || clientData.location || booking.client.location || "",
                category: clientData.category || booking.client.category || ""
              };
            }
          } catch (error) {
            console.error('Error enhancing client details:', error);
          }
        } else if (!booking.client) {
          booking.client = { name: "Unknown Client" };
        }
        
        matchedBookings.push(booking);
      }
    }
    
    return matchedBookings;
  } catch (error) {
    console.error('Error finding bookings by show attributes:', error);
    throw error;
  }
}

// Function to get detailed booking information with resolved references
async function getDetailedBooking(bookingNameOrId) {
  try {
    // Get the basic booking
    const booking = await getBooking(bookingNameOrId);
    if (!booking) {
      throw new Error(`Booking "${bookingNameOrId}" not found`);
    }
    
    // Get client details if needed - client should already be enhanced by getBooking
    let client = booking.client || null;
    if (!client && booking.clientId) {
      const clientDoc = await getDoc(doc(db, 'clients', booking.clientId));
      if (clientDoc.exists()) {
        const clientData = clientDoc.data();
        client = { 
          id: clientDoc.id, 
          name: clientData.contacts?.name || clientData.name || "Unknown Client",
          contactInfo: clientData.contacts?.email || clientData.contacts?.phone || clientData.contactInfo || "",
          location: clientData.contacts?.location || clientData.location || "",
          category: clientData.category || ""
        };
      } else {
        client = { name: "Unknown Client" };
      }
    } else if (!client) {
      client = { name: "Unknown Client" };
    }
    
    // Get staff details
    const assignedStaff = [];
    if (booking.staff && Array.isArray(booking.staff)) {
      for (const staffId of booking.staff) {
        const staffDoc = await getDoc(doc(db, 'staff', staffId));
        if (staffDoc.exists()) {
          assignedStaff.push({ id: staffDoc.id, ...staffDoc.data() });
        }
      }
    }
    
    // Process dates and resolve staff IDs
    const detailedDates = [];
    if (booking.datesNeeded && Array.isArray(booking.datesNeeded)) {
      for (const dateInfo of booking.datesNeeded) {
        const staffForDate = [];
        
        if (dateInfo.staffIds && Array.isArray(dateInfo.staffIds)) {
          for (const staffId of dateInfo.staffIds) {
            const staffDoc = await getDoc(doc(db, 'staff', staffId));
            if (staffDoc.exists()) {
              staffForDate.push({ id: staffDoc.id, ...staffDoc.data() });
            }
          }
        }
        
        detailedDates.push({
          date: dateInfo.date,
          staffCount: dateInfo.staffCount,
          assignedStaff: staffForDate
        });
      }
    }
    
    return {
      id: booking.id,
      show: booking.show,
      client,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      status: booking.status,
      assignedStaff,
      dates: detailedDates
    };
  } catch (error) {
    console.error('Error getting detailed booking:', error);
    throw error;
  }
}

// Function to format booking data to ensure proper UI rendering
function formatBookingForUI(booking) {
  // Clone the booking to avoid modifying the original
  const formattedBooking = { ...booking };
  
  // Debug the current format
  console.log("Formatting booking for UI:", {
    id: formattedBooking.id || 'missing',
    clientInfo: formattedBooking.client ? 'present' : 'missing',
    clientId: formattedBooking.clientId || 'missing'
  });
  
  // Ensure client info is properly structured
  if (!formattedBooking.client && formattedBooking.clientId) {
    // If we have clientId but no client object, create a basic one
    if (typeof formattedBooking.clientId === 'string') {
      formattedBooking.client = { 
        id: formattedBooking.clientId,
        // Add contacts structure for consistency
        contacts: {
          name: `Client: ${formattedBooking.clientId.substring(0, 8)}...`
        }
      };
    } else if (typeof formattedBooking.clientId === 'object') {
      // clientId might actually be the client object
      formattedBooking.client = formattedBooking.clientId;
    }
  }
  
  // Ensure the client has a contacts structure with a name
  if (formattedBooking.client) {
    if (!formattedBooking.client.contacts) {
      formattedBooking.client.contacts = {};
    }
    
    // If name is directly on client object, move it to contacts
    if (formattedBooking.client.name && !formattedBooking.client.contacts.name) {
      formattedBooking.client.contacts.name = formattedBooking.client.name;
    }
    
    // Ensure contacts has a name
    if (!formattedBooking.client.contacts.name) {
      formattedBooking.client.contacts.name = "Unknown Client";
    }
  } else {
    // Create a default client structure
    formattedBooking.client = {
      contacts: {
        name: "Unknown Client"
      }
    };
  }
  
  // Make sure there's a type field for the UI to identify this as a booking
  return {
    type: "booking",
    item: formattedBooking
  };
}

// Function to format booking data to ensure proper UI rendering
function formatBookingsListForUI(bookings) {
  if (!Array.isArray(bookings)) {
    console.error('formatBookingsListForUI received non-array:', bookings);
    return {
      type: "bookings",
      items: []
    };
  }
  
  // Process each booking to ensure client info is available
  const processedBookings = bookings.map(booking => {
    const processedBooking = { ...booking };
    
    // Ensure client info is properly structured
    if (!processedBooking.client && processedBooking.clientId) {
      // If we have clientId but no client object, create a basic one
      if (typeof processedBooking.clientId === 'string') {
        processedBooking.client = { 
          id: processedBooking.clientId,
          name: `Client: ${processedBooking.clientId.substring(0, 8)}...`
        };
      } else if (typeof processedBooking.clientId === 'object') {
        // clientId might actually be the client object
        processedBooking.client = processedBooking.clientId;
      }
    }
    
    // Ensure the client has a name
    if (processedBooking.client && !processedBooking.client.name) {
      processedBooking.client.name = "Unknown Client";
    }
    
    return processedBooking;
  });
  
  return {
    type: "bookings",
    items: processedBookings
  };
}

// Function to get staff available for all dates of a specific show
async function getStaffAvailableForShow(showNameOrId) {
  try {
    console.log(`Finding staff available for show: ${showNameOrId}`);
    
    // Get show details first
    let show;
    if (showNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      // It's an ID
      const showDoc = await getDoc(doc(db, 'shows', showNameOrId));
      if (showDoc.exists()) {
        show = { id: showDoc.id, ...showDoc.data() };
      }
    } else {
      // Try to find by name
      const showsCollection = collection(db, 'shows');
      const q = query(showsCollection, where("name", "==", showNameOrId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        show = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      } else {
        // Try fuzzy search with show attributes
        const shows = await searchShowsByAttributes(showNameOrId);
        if (shows.length > 0) {
          show = shows[0];
        }
      }
    }
    
    if (!show) {
      throw new Error(`Show "${showNameOrId}" not found`);
    }
    
    console.log(`Found show: ${show.name}, dates: ${show.startDate} to ${show.endDate}`);
    
    // Generate array of dates between startDate and endDate
    const showDates = [];
    if (show.startDate && show.endDate) {
      const start = new Date(show.startDate);
      const end = new Date(show.endDate);
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        showDates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
      }
    }
    
    if (showDates.length === 0) {
      throw new Error(`No valid dates found for show "${show.name}"`);
    }
    
    console.log(`Show dates (${showDates.length}): ${showDates.join(', ')}`);
    
    // Get staff available for all of these dates
    const availabilityCollection = collection(db, 'availability');
    const snapshot = await getDocs(availabilityCollection);
    
    if (snapshot.empty) {
      return { show, dates: showDates, availableStaff: [] };
    }
    
    // Map staff to their availability
    const staffAvailability = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.staffId && data.availableDates) {
        const staffId = data.staffId;
        if (!staffAvailability[staffId]) {
          staffAvailability[staffId] = {
            staffId,
            staffName: data.staffName || "Unknown Staff",
            availableDates: [],
            matchingDates: []
          };
        }
        
        // Add available dates
        data.availableDates.forEach(date => {
          if (!staffAvailability[staffId].availableDates.includes(date)) {
            staffAvailability[staffId].availableDates.push(date);
          }
          
          // Check if this is a show date
          if (showDates.includes(date) && !staffAvailability[staffId].matchingDates.includes(date)) {
            staffAvailability[staffId].matchingDates.push(date);
          }
        });
      }
    });
    
    // Filter to staff available for all show dates
    const fullyAvailableStaff = Object.values(staffAvailability)
      .filter(staff => staff.matchingDates.length === showDates.length)
      .map(staff => ({
        staffId: staff.staffId,
        staffName: staff.staffName,
        availableDates: staff.availableDates
      }));
    
    // Staff available for some dates
    const partiallyAvailableStaff = Object.values(staffAvailability)
      .filter(staff => staff.matchingDates.length > 0 && staff.matchingDates.length < showDates.length)
      .map(staff => ({
        staffId: staff.staffId,
        staffName: staff.staffName,
        availableDates: staff.availableDates,
        matchingDates: staff.matchingDates,
        missingDates: showDates.filter(date => !staff.matchingDates.includes(date))
      }));
    
    return {
      show: {
        id: show.id,
        name: show.name,
        startDate: show.startDate,
        endDate: show.endDate,
        location: show.location,
        type: show.type
      },
      dates: showDates,
      fullyAvailableStaff,
      partiallyAvailableStaff
    };
  } catch (error) {
    console.error('Error finding staff available for show:', error);
    throw error;
  }
}

// Function to format show staff availability data for the UI
function formatShowStaffAvailabilityForUI(data) {
  return {
    type: "show_staff_availability",
    show: data.show,
    dates: data.dates,
    fullyAvailableStaff: data.fullyAvailableStaff || [],
    partiallyAvailableStaff: data.partiallyAvailableStaff || []
  };
}

// Add strict guidelines against hallucination to both system prompts
const baseSystemPrompt = "You are an assistant for the Smith Agency. Your job is to help manage bookings, staff, and clients.\n\n" +
  "DATABASE INTEGRITY AND ACCURACY RULES:\n" +
  "- CRITICAL: NEVER make up or hallucinate information about bookings, clients, staff, or shows\n" +
  "- ALWAYS use ONLY data returned from database function calls\n" +
  "- If you don't have specific data from a database query, say 'I don't have that information'\n" +
  "- NEVER make assumptions about dates, names, or availability that aren't in query results\n" +
  "- When unsure about any detail, call the appropriate database function to verify\n" +
  "- Be explicit when data is unavailable rather than guessing\n\n" +
  
  "FUNCTION CALLING RULES:\n" +
  "- CRITICAL: NEVER output strings like 'function_call: getAllBookings' - this is an error\n" +
  "- CRITICAL: Do not write or describe what function you will call - just call it through the function_call mechanism\n" +
  "- ALWAYS use function_call for data retrieval - DO NOT respond with text like 'Let me retrieve that' or describe what you're doing\n" +
  "- When asked to show all bookings, IMMEDIATELY use function_call to invoke getAllBookings without explanatory text\n" +
  "- When asked about availability, call the appropriate availability function directly\n" +
  "- For all data operations, use the appropriate function rather than explaining what you're about to do\n" +
  "- DO NOT include function names in text responses like (getAllBookings) or (get_all_bookings)\n\n" +
  
  "Database structure:\n" +
  "1. Bookings have fields: show (string), clientId (string reference to client), datesNeeded (array or map of date objects with numeric keys like 0, 1)\n" +
  "2. Each date object in datesNeeded has: date (YYYY-MM-DD), staffCount (number), staffIds (array or map of staff IDs assigned to this date)\n" +
  "3. Staff have fields: name, role, contactInfo, availability (array of dates in YYYY-MM-DD format)\n" +
  "4. Clients have fields: category (string), contacts (object with name, email, phone, location)\n" +
  "5. Shows have fields: name, startDate, endDate, location, season, type\n" +
  "6. Availability records have fields: staffId, staffName, availableDates (array of dates in YYYY-MM-DD format)\n\n" +
  
  "IMPORTANT DATABASE STRUCTURE DETAILS:\n" +
  "- In Firestore, datesNeeded is often stored as a map with numeric keys (0, 1, 2) rather than a pure array\n" +
  "- Similarly, staffIds within each date can be a map with numeric keys rather than an array\n" +
  "- Always ensure the data structure preserves these fields exactly as stored in Firestore\n" +
  "- When returning booking data, maintain the clientId reference exactly as stored, don't create new structures\n\n" +
  
  "QUERY UNDERSTANDING AND EXECUTION:\n" +
  "- When users ask about staff availability for a specific show, ALWAYS:\n" +
  "  1. First, get the show details to find out the show dates (startDate, endDate)\n" +
  "  2. Then, query the availability collection to find staff available on those specific dates\n" +
  "  3. Finally, return staff names and their availability information\n" +
  "- When users ask about staff recommendations for a show, consider:\n" +
  "  1. The dates of the show\n" +
  "  2. Staff availability on those dates\n" +
  "  3. Staff specialties or roles if relevant\n" +
  "  4. Previous assignments to similar shows\n" +
  "- For queries about conflicts, check if staff are already assigned to other bookings on the same dates\n\n" +
  
  "ADVANCED REASONING:\n" +
  "- Use multi-step reasoning to handle complex queries involving multiple entities (shows, staff, dates)\n" +
  "- Don't just return raw availability data - interpret it and provide helpful summaries\n" +
  "- For example, 'These 5 staff members are available for all dates of the DAL Winter Show'\n" +
  "- Or 'Jane is available for 3 out of 5 show dates, missing availability on Jan 12-13'\n\n" +
  
  "IMPORTANT: When users search for bookings, try to search both by booking information and by show attributes like season, type, and name. Users may refer to 'summer shows' or 'bridal shows' which should match shows with season='Summer' or type='Bridal'.\n\n" +
  
  "IMPORTANT: When users ask about staff availability, search in the availability collection which stores detailed staff availability records with staffId, staffName, and availableDates array.";

// Update both system prompts with the new content
const systemPromptObj = {
  role: "system",
  content: baseSystemPrompt
};

// And also update the secondSystemPrompt to match
const secondSystemPromptObj = {
  role: "system",
  content: baseSystemPrompt
};

// Function to handle the chat request
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        systemPromptObj,
        ...messages
      ]
    });

    // Handle function calling
    const responseMessage = response.choices[0].message;

    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);
      let functionResponse;

      // Execute the appropriate function based on the function call
      try {
        console.log(`Executing function: ${functionName} with args:`, functionArgs);
        
        switch (functionName) {
          case 'getBookingByName':
            functionResponse = await getBookingByName(functionArgs.bookingName);
            break;
          case 'getClientByName':
            functionResponse = await getClientByName(functionArgs.clientName);
            break;
          case 'getStaffByName':
            functionResponse = await getStaffByName(functionArgs.staffName);
            break;
          case 'get_all_bookings':
            functionResponse = await getAllBookings();
            break;
          case 'getAllBookings':
            functionResponse = await getAllBookings();
            break;
          case 'editBooking':
            functionResponse = await editBooking(functionArgs);
            break;
          case 'createBooking':
            functionResponse = await createBooking(functionArgs);
            break;
          case 'deleteBooking':
            functionResponse = await deleteBooking(functionArgs.bookingNameOrId);
            break;
          case 'getClient':
            functionResponse = await getClient(functionArgs.clientNameOrId);
            break;
          case 'createClient':
            functionResponse = await createClient(functionArgs);
            break;
          case 'updateClient':
            functionResponse = await updateClient(functionArgs);
            break;
          case 'getStaff':
            functionResponse = await getStaff(functionArgs.staffNameOrId);
            break;
          case 'createStaff':
            functionResponse = await createStaff(functionArgs);
            break;
          case 'updateStaff':
            functionResponse = await updateStaff(functionArgs);
            break;
          case 'getBooking':
            functionResponse = await getBooking(functionArgs.bookingNameOrId);
            break;
          case 'getAllClients':
            functionResponse = await getAllClients();
            break;
          case 'getAllStaff':
            functionResponse = await getAllStaff();
            break;
          case 'getStaffAvailabilityFromCollection':
            functionResponse = await getStaffAvailabilityFromCollection(functionArgs.date);
            break;
          case 'findStaffForBookingDates':
            functionResponse = await findStaffForBookingDates(functionArgs.bookingNameOrId, functionArgs.requiredDates);
            break;
          case 'isStaffAvailableOnDate':
            functionResponse = await isStaffAvailableOnDate(functionArgs.staffNameOrId, functionArgs.date);
            break;
          case 'getAvailableStaffOnDate':
            functionResponse = await getAvailableStaffOnDate(functionArgs.date);
            break;
          case 'getAvailableStaffForBookingDate':
            functionResponse = await getAvailableStaffForBookingDate(functionArgs.bookingNameOrId, functionArgs.date);
            break;
          case 'getStaffForAllBookingDates':
            functionResponse = await getStaffForAllBookingDates(functionArgs.bookingNameOrId);
            break;
          case 'updateStaffAvailability':
            functionResponse = await updateStaffAvailability(functionArgs.staffNameOrId, functionArgs.dates, functionArgs.available);
            break;
          case 'addStaffToBookingDate':
            functionResponse = await addStaffToBookingDate(functionArgs.bookingNameOrId, functionArgs.date, functionArgs.staffNameOrId);
            break;
          case 'removeStaffFromBookingDate':
            functionResponse = await removeStaffFromBookingDate(functionArgs.bookingNameOrId, functionArgs.date, functionArgs.staffNameOrId);
            break;
          case 'searchAllEntities':
            functionResponse = await searchAllEntities(functionArgs.query);
            break;
          case 'findBookingsByShowAttributes':
            functionResponse = await findBookingsByShowAttributes(functionArgs.query);
            break;
          case 'getDetailedBooking':
            functionResponse = await getDetailedBooking(functionArgs.bookingNameOrId);
            break;
          case 'formatBookingForUI':
            functionResponse = formatBookingForUI(functionArgs.booking);
            break;
          case 'formatBookingsListForUI':
            functionResponse = formatBookingsListForUI(functionArgs.bookings);
            break;
          case 'getStaffAvailableForShow':
            functionResponse = await getStaffAvailableForShow(functionArgs.showNameOrId);
            break;
          case 'formatShowStaffAvailabilityForUI':
            functionResponse = formatShowStaffAvailabilityForUI(functionArgs.data);
            break;
          default:
            throw new Error(`Unknown function: ${functionName}`);
        }

        console.log(`Function ${functionName} returned:`, 
          typeof functionResponse === 'object' ? 
            JSON.stringify(functionResponse).substring(0, 200) + "..." : 
            functionResponse
        );

        // Generate another response with the tool's result
        const secondResponse = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            secondSystemPromptObj,
            ...messages,
            responseMessage,
            {
              role: "function",
              name: functionName,
              content: JSON.stringify(functionResponse)
            }
          ],
          temperature: 0.7,
        });

        console.log(`Second response content (first 200 chars): ${secondResponse.choices[0].message.content.substring(0, 200)}...`);

        // For "show all bookings" queries, return the function response directly
        if (functionName === 'getAllBookings' || functionName === 'get_all_bookings') {
          console.log('Returning getAllBookings function response directly');
          return res.status(200).json({
            result: { 
              content: "Here are all the bookings:" 
            },
            functionCalled: functionName,
            functionArgs,
            functionResponse
          });
        } else {
          // For other function calls, return the formatted response
          return res.status(200).json({
            result: secondResponse.choices[0].message,
            functionCalled: functionName,
            functionArgs,
            functionResponse
          });
        }
      } catch (error) {
        console.error('Error executing function:', error);
        return res.status(500).json({ error: error.message || 'Something went wrong' });
      }
    }

    // If no function was called, just return the response
    const secondResponse = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        secondSystemPromptObj,
        ...messages,
        response.choices[0].message,
        {
          role: "function",
          name: "search_shows_by_attributes",
          content: JSON.stringify({ query: "summer shows" })
        }
      ],
      temperature: 0.7,
    });

    // Return the response
    return res.status(200).json({ 
      result: responseMessage
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
}