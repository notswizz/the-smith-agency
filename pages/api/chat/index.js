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
    const bookingsCollection = collection(db, 'bookings');
    const q = query(bookingsCollection, where("show", "==", bookingName));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    // Return the first matching booking
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error fetching booking by name:', error);
    throw error;
  }
}

// Function to get client by name
async function getClientByName(clientName) {
  try {
    const clientsCollection = collection(db, 'clients');
    const q = query(clientsCollection, where("name", "==", clientName));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    // Return the first matching client
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error fetching client by name:', error);
    throw error;
  }
}

// Function to get staff by name
async function getStaffByName(staffName) {
  try {
    const staffCollection = collection(db, 'staff');
    const q = query(staffCollection, where("name", "==", staffName));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    // Return the first matching staff member
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error fetching staff by name:', error);
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
      return { id: bookingSnap.id, ...bookingSnap.data() };
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

// Function to get staff availability for a specific date
async function getStaffAvailabilityForDate(date) {
  try {
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
    console.error('Error fetching staff availability:', error);
    throw error;
  }
}

// Function to check which staff members are available for a booking date
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
    
    // Find staff available for the date
    const allStaff = await getAllStaff();
    const availableStaff = allStaff.filter(staff => {
      if (!staff.availability || !Array.isArray(staff.availability)) return false;
      return staff.availability.includes(date);
    });
    
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

// Function to get detailed booking information with resolved references
async function getDetailedBooking(bookingNameOrId) {
  try {
    // Get the basic booking
    const booking = await getBooking(bookingNameOrId);
    if (!booking) {
      throw new Error(`Booking "${bookingNameOrId}" not found`);
    }
    
    // Get client details if needed
    let client = null;
    if (booking.client && booking.client.id) {
      const clientDoc = await getDoc(doc(db, 'clients', booking.client.id));
      if (clientDoc.exists()) {
        client = { id: clientDoc.id, ...clientDoc.data() };
      }
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

// Function to get staff members who can work all booking dates
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
    
    // Find staff available for all dates
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

// Function to get future bookings
async function getFutureBookings() {
  try {
    const bookingsCollection = collection(db, 'bookings');
    const snapshot = await getDocs(bookingsCollection);
    const allBookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Filter bookings that have dates in the future
    const futureBookings = allBookings.filter(booking => {
      if (!booking.datesNeeded || !Array.isArray(booking.datesNeeded)) return false;
      
      // Check if any date is today or in the future
      return booking.datesNeeded.some(dateObj => dateObj.date >= today);
    });
    
    return futureBookings;
  } catch (error) {
    console.error('Error fetching future bookings:', error);
    throw error;
  }
}

// Function to assign staff to a booking date
async function assignStaffToBookingDate(bookingNameOrId, date, staffNameOrIds) {
  try {
    let bookingId = bookingNameOrId;
    
    // If bookingNameOrId is a name rather than an ID, look it up
    if (!bookingNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
      const booking = await getBookingByName(bookingNameOrId);
      if (!booking) {
        throw new Error(`Booking "${bookingNameOrId}" not found`);
      }
      bookingId = booking.id;
    }
    
    // Get the current booking
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }
    
    const bookingData = bookingSnap.data();
    const datesNeeded = bookingData.datesNeeded || [];
    
    // Find the date index
    const dateIndex = datesNeeded.findIndex(d => d.date === date);
    if (dateIndex === -1) {
      throw new Error(`Date "${date}" not found in booking`);
    }
    
    // Convert staff names to IDs if needed
    const staffIds = [];
    for (const staffNameOrId of staffNameOrIds) {
      if (staffNameOrId.match(/^[a-zA-Z0-9]{20}$/)) {
        // Verify this ID exists
        const staffDoc = await getDoc(doc(db, 'staff', staffNameOrId));
        if (!staffDoc.exists()) {
          throw new Error(`Staff with ID "${staffNameOrId}" not found`);
        }
        staffIds.push(staffNameOrId);
      } else {
        const staff = await getStaffByName(staffNameOrId);
        if (!staff) {
          throw new Error(`Staff "${staffNameOrId}" not found`);
        }
        staffIds.push(staff.id);
      }
      
      // Check if this staff member is available on this date
      const staffObj = await getStaff(staffNameOrId);
      if (!staffObj.availability || !staffObj.availability.includes(date)) {
        throw new Error(`Staff "${staffObj.name}" is not available on ${date}`);
      }
    }
    
    // Update the date with the staff assignments
    datesNeeded[dateIndex].staffIds = staffIds;
    
    await updateDoc(bookingRef, {
      datesNeeded,
      updatedAt: serverTimestamp()
    });
    
    // Get the updated booking
    const updatedBookingSnap = await getDoc(bookingRef);
    return { id: bookingId, ...updatedBookingSnap.data() };
    
  } catch (error) {
    console.error('Error assigning staff to booking date:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are an assistant for the Smith Agency. Your job is to help manage bookings, staff, and clients.

Database structure:
1. Bookings have fields: show (string), client (object with id, name), datesNeeded (array of date objects), staff (array of IDs)
2. Each date object in datesNeeded has: date (YYYY-MM-DD), staffCount (number), staffIds (array of staff IDs assigned to this date)
3. Staff have fields: name, role, contactInfo, availability (array of dates in YYYY-MM-DD format)
4. Clients have fields: name, contactInfo

When displaying data, use the following JSON format inside markdown code blocks to create beautiful card displays:

For a single booking:
\`\`\`json
{
  "type": "booking",
  "item": {
    "show": "Show Name",
    "client": { "name": "Client Name" },
    "dates": [
      { "date": "YYYY-MM-DD", "staffCount": 3, "assignedStaff": [{"name": "Staff Name"}] }
    ],
    "status": "pending"
  }
}
\`\`\`

For multiple bookings:
\`\`\`json
{
  "type": "bookings",
  "items": [
    {
      "show": "Show Name 1",
      "client": { "name": "Client Name" },
      "dates": [{ "date": "YYYY-MM-DD", "staffCount": 3 }],
      "status": "pending"
    },
    {
      "show": "Show Name 2",
      "dates": [{ "date": "YYYY-MM-DD", "staffCount": 2 }]
    }
  ]
}
\`\`\`

For staff:
\`\`\`json
{
  "type": "staff",
  "item": {
    "name": "Staff Name",
    "role": "Photographer",
    "contactInfo": "email@example.com",
    "availability": ["2023-01-01", "2023-01-02"]
  }
}
\`\`\`

For multiple staff:
\`\`\`json
{
  "type": "staff",
  "items": [
    {
      "name": "Staff Name 1",
      "role": "Photographer",
      "availability": ["2023-01-01", "2023-01-02"]
    },
    {
      "name": "Staff Name 2",
      "role": "Makeup Artist",
      "availability": ["2023-01-03", "2023-01-04"]
    }
  ]
}
\`\`\`

For clients:
\`\`\`json
{
  "type": "client",
  "item": {
    "name": "Client Name",
    "contactInfo": "email@example.com"
  }
}
\`\`\`

Be concise in your text responses, but use these JSON formats when displaying data to create beautiful card displays.
Always use names rather than IDs when communicating with users.`
        },
        ...messages
      ],
      functions: [
        {
          name: "get_booking",
          description: "Get a booking by name or ID",
          parameters: {
            type: "object",
            required: ["booking_id"],
            properties: {
              booking_id: {
                type: "string",
                description: "Name or ID of the booking"
              }
            }
          }
        },
        {
          name: "edit_booking",
          description: "Edit an existing booking",
          parameters: {
            type: "object",
            required: ["booking_id", "client", "show", "staff", "staff_needed", "days_needed"],
            properties: {
              booking_id: {
                type: "string",
                description: "Name or ID of the booking"
              },
              client: {
                type: "object",
                properties: {
                  client_id: {
                    type: "string",
                    description: "Name or ID of the client"
                  },
                  name: {
                    type: "string",
                    description: "Name of the client"
                  },
                  contact_info: {
                    type: "string",
                    description: "Contact information for the client"
                  }
                },
                required: ["client_id", "name", "contact_info"]
              },
              show: {
                type: "string",
                description: "Show associated with the booking"
              },
              staff: {
                type: "array",
                description: "List of staff members assigned to the booking",
                items: {
                  type: "string",
                  description: "Name or ID of staff member"
                }
              },
              staff_needed: {
                type: "number",
                description: "Number of staff needed for each day of the booking"
              },
              days_needed: {
                type: "number",
                description: "Total number of days the booking is needed"
              }
            }
          }
        },
        {
          name: "create_booking",
          description: "Create a new booking",
          parameters: {
            type: "object",
            required: ["client", "show", "staff", "staff_needed", "days_needed"],
            properties: {
              client: {
                type: "object",
                properties: {
                  client_id: {
                    type: "string",
                    description: "Name or ID of the client"
                  },
                  name: {
                    type: "string",
                    description: "Name of the client"
                  },
                  contact_info: {
                    type: "string",
                    description: "Contact information for the client"
                  }
                },
                required: ["client_id", "name", "contact_info"]
              },
              show: {
                type: "string",
                description: "Show associated with the booking"
              },
              staff: {
                type: "array",
                description: "List of staff members assigned to the booking",
                items: {
                  type: "string",
                  description: "Name or ID of staff member"
                }
              },
              staff_needed: {
                type: "number",
                description: "Number of staff needed for each day of the booking"
              },
              days_needed: {
                type: "number",
                description: "Total number of days the booking is needed"
              }
            }
          }
        },
        {
          name: "delete_booking",
          description: "Delete a booking",
          parameters: {
            type: "object",
            required: ["booking_id"],
            properties: {
              booking_id: {
                type: "string",
                description: "Name or ID of the booking to delete"
              }
            }
          }
        },
        {
          name: "get_client",
          description: "Get client information by name or ID",
          parameters: {
            type: "object",
            required: ["client_id"],
            properties: {
              client_id: {
                type: "string",
                description: "Name or ID of the client"
              }
            }
          }
        },
        {
          name: "create_client",
          description: "Create a new client",
          parameters: {
            type: "object",
            required: ["name", "contact_info"],
            properties: {
              name: {
                type: "string",
                description: "Name of the client"
              },
              contact_info: {
                type: "string",
                description: "Contact information for the client"
              }
            }
          }
        },
        {
          name: "update_client",
          description: "Update a client's information",
          parameters: {
            type: "object",
            required: ["client_id", "name", "contact_info"],
            properties: {
              client_id: {
                type: "string",
                description: "Name or ID of the client"
              },
              name: {
                type: "string",
                description: "Name of the client"
              },
              contact_info: {
                type: "string",
                description: "Contact information for the client"
              }
            }
          }
        },
        {
          name: "get_staff",
          description: "Get staff information by name or ID",
          parameters: {
            type: "object",
            required: ["staff_id"],
            properties: {
              staff_id: {
                type: "string",
                description: "Name or ID of the staff member"
              }
            }
          }
        },
        {
          name: "create_staff",
          description: "Create a new staff member",
          parameters: {
            type: "object",
            required: ["name", "role", "contact_info"],
            properties: {
              name: {
                type: "string",
                description: "Name of the staff member"
              },
              role: {
                type: "string",
                description: "Role or position of the staff member"
              },
              contact_info: {
                type: "string",
                description: "Contact information for the staff member"
              },
              availability: {
                type: "array",
                description: "Days the staff member is available",
                items: {
                  type: "string",
                  description: "Date in YYYY-MM-DD format"
                }
              }
            }
          }
        },
        {
          name: "update_staff",
          description: "Update a staff member's information",
          parameters: {
            type: "object",
            required: ["staff_id", "name", "role", "contact_info"],
            properties: {
              staff_id: {
                type: "string",
                description: "Name or ID of the staff member"
              },
              name: {
                type: "string",
                description: "Name of the staff member"
              },
              role: {
                type: "string",
                description: "Role or position of the staff member"
              },
              contact_info: {
                type: "string",
                description: "Contact information for the staff member"
              },
              availability: {
                type: "array",
                description: "Days the staff member is available",
                items: {
                  type: "string",
                  description: "Date in YYYY-MM-DD format"
                }
              }
            }
          }
        },
        {
          name: "get_all_bookings",
          description: "Get a list of all bookings",
          parameters: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "get_all_clients",
          description: "Get a list of all clients",
          parameters: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "get_all_staff",
          description: "Get a list of all staff members",
          parameters: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "get_staff_availability_for_date",
          description: "Get all staff available on a specific date",
          parameters: {
            type: "object",
            required: ["date"],
            properties: {
              date: {
                type: "string",
                description: "Date in YYYY-MM-DD format"
              }
            }
          }
        },
        {
          name: "get_available_staff_for_booking_date",
          description: "Get staff members available for a specific date of a booking",
          parameters: {
            type: "object",
            required: ["booking_id", "date"],
            properties: {
              booking_id: {
                type: "string",
                description: "Name or ID of the booking"
              },
              date: {
                type: "string",
                description: "Date in YYYY-MM-DD format to check"
              }
            }
          }
        },
        {
          name: "get_staff_for_all_booking_dates",
          description: "Get staff members available for all dates of a booking",
          parameters: {
            type: "object",
            required: ["booking_id"],
            properties: {
              booking_id: {
                type: "string",
                description: "Name or ID of the booking"
              }
            }
          }
        },
        {
          name: "get_future_bookings",
          description: "Get all bookings with dates in the future",
          parameters: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "get_detailed_booking",
          description: "Get detailed information about a booking with all references resolved",
          parameters: {
            type: "object",
            required: ["booking_id"],
            properties: {
              booking_id: {
                type: "string",
                description: "Name or ID of the booking"
              }
            }
          }
        }
      ],
      function_call: "auto",
      temperature: 0.7,
    });

    // Handle function calling
    const responseMessage = response.choices[0].message;
    
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);
      let functionResponse;

      // Execute the appropriate function based on the function call
      switch (functionName) {
        case 'get_booking':
          functionResponse = await getBooking(functionArgs.booking_id);
          break;
        case 'edit_booking':
          functionResponse = await editBooking(functionArgs);
          break;
        case 'create_booking':
          functionResponse = await createBooking(functionArgs);
          break;
        case 'delete_booking':
          functionResponse = await deleteBooking(functionArgs.booking_id);
          break;
        case 'get_client':
          functionResponse = await getClient(functionArgs.client_id);
          break;
        case 'create_client':
          functionResponse = await createClient(functionArgs);
          break;
        case 'update_client':
          functionResponse = await updateClient(functionArgs);
          break;
        case 'get_staff':
          functionResponse = await getStaff(functionArgs.staff_id);
          break;
        case 'create_staff':
          functionResponse = await createStaff(functionArgs);
          break;
        case 'update_staff':
          functionResponse = await updateStaff(functionArgs);
          break;
        case 'get_all_bookings':
          functionResponse = await getAllBookings();
          break;
        case 'get_all_clients':
          functionResponse = await getAllClients();
          break;
        case 'get_all_staff':
          functionResponse = await getAllStaff();
          break;
        case 'get_staff_availability_for_date':
          functionResponse = await getStaffAvailabilityForDate(functionArgs.date);
          break;
        case 'get_available_staff_for_booking_date':
          functionResponse = await getAvailableStaffForBookingDate(
            functionArgs.booking_id, 
            functionArgs.date
          );
          break;
        case 'get_staff_for_all_booking_dates':
          functionResponse = await getStaffForAllBookingDates(functionArgs.booking_id);
          break;
        case 'get_future_bookings':
          functionResponse = await getFutureBookings();
          break;
        case 'get_detailed_booking':
          functionResponse = await getDetailedBooking(functionArgs.booking_id);
          break;
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }

      // Get a new response from OpenAI with the function result
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `You are an assistant for the Smith Agency. Your job is to help manage bookings, staff, and clients.

Database structure:
1. Bookings have fields: show (string), client (object with id, name), datesNeeded (array of date objects), staff (array of IDs)
2. Each date object in datesNeeded has: date (YYYY-MM-DD), staffCount (number), staffIds (array of staff IDs assigned to this date)
3. Staff have fields: name, role, contactInfo, availability (array of dates in YYYY-MM-DD format)
4. Clients have fields: name, contactInfo

When displaying data, use the following JSON format inside markdown code blocks to create beautiful card displays:

For a single booking:
\`\`\`json
{
  "type": "booking",
  "item": {
    "show": "Show Name",
    "client": { "name": "Client Name" },
    "dates": [
      { "date": "YYYY-MM-DD", "staffCount": 3, "assignedStaff": [{"name": "Staff Name"}] }
    ],
    "status": "pending"
  }
}
\`\`\`

For multiple bookings:
\`\`\`json
{
  "type": "bookings",
  "items": [
    {
      "show": "Show Name 1",
      "client": { "name": "Client Name" },
      "dates": [{ "date": "YYYY-MM-DD", "staffCount": 3 }],
      "status": "pending"
    },
    {
      "show": "Show Name 2",
      "dates": [{ "date": "YYYY-MM-DD", "staffCount": 2 }]
    }
  ]
}
\`\`\`

For staff:
\`\`\`json
{
  "type": "staff",
  "item": {
    "name": "Staff Name",
    "role": "Photographer",
    "contactInfo": "email@example.com",
    "availability": ["2023-01-01", "2023-01-02"]
  }
}
\`\`\`

For multiple staff:
\`\`\`json
{
  "type": "staff",
  "items": [
    {
      "name": "Staff Name 1",
      "role": "Photographer",
      "availability": ["2023-01-01", "2023-01-02"]
    },
    {
      "name": "Staff Name 2",
      "role": "Makeup Artist",
      "availability": ["2023-01-03", "2023-01-04"]
    }
  ]
}
\`\`\`

For clients:
\`\`\`json
{
  "type": "client",
  "item": {
    "name": "Client Name",
    "contactInfo": "email@example.com"
  }
}
\`\`\`

Be concise in your text responses, but use these JSON formats when displaying data to create beautiful card displays.
Always use names rather than IDs when communicating with users.`
          },
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

      return res.status(200).json({
        result: secondResponse.choices[0].message,
        functionCalled: functionName,
        functionArgs,
        functionResponse
      });
    }

    return res.status(200).json({ result: responseMessage });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
} 