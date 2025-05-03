// Import all handlers
import { 
  handleListClients,
  handleGetClientById,
  handleSearchClients,
  handleCreateClient,
  handleUpdateClient
} from './clients';

import {
  handleListShows,
  handleSearchShows,
  handleGetShowById
} from './shows';

import {
  handleListStaff,
  handleSearchStaff,
  handleGetStaffById,
  handleCreateStaff,
  handleUpdateStaff
} from './staff';

import {
  handleGetStaffAvailability,
  handleGetAvailableStaffForDate
} from './availability';

import {
  handleListBookings,
  handleSearchBookings,
  handleGetBookingById
} from './bookings';

// Main function handler that routes to the appropriate specialized handler
export async function executeFunction(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { functionCall } = req.body;

  if (!functionCall || !functionCall.name) {
    return res.status(400).json({ error: 'Function call information is required' });
  }

  try {
    const { name, arguments: args } = functionCall;

    // Call the appropriate function handler
    switch (name) {
      // Client handlers
      case 'listClients':
        return await handleListClients(res);
      case 'getClientById':
        return await handleGetClientById(res, args);
      case 'searchClients':
        return await handleSearchClients(res, args);  
      case 'createClient':
        return await handleCreateClient(res, args);
      case 'updateClient':
        return await handleUpdateClient(res, args);
      
      // Show handlers
      case 'listShows':
        return await handleListShows(res);
      case 'searchShows':
        return await handleSearchShows(res, args);
      case 'getShowById':
        return await handleGetShowById(res, args);
      
      // Staff handlers
      case 'listStaff':
        return await handleListStaff(res);
      case 'searchStaff':
        return await handleSearchStaff(res, args);
      case 'getStaffById':
        return await handleGetStaffById(res, args);
      case 'createStaff':
        return await handleCreateStaff(res, args);
      case 'updateStaff':
        return await handleUpdateStaff(res, args);
      
      // Availability handlers
      case 'getStaffAvailability':
        return await handleGetStaffAvailability(res, args);
      case 'getAvailableStaffForDate':
        return await handleGetAvailableStaffForDate(res, args);
      
      // Booking handlers
      case 'listBookings':
        return await handleListBookings(res);
      case 'searchBookings':
        return await handleSearchBookings(res, args);
      case 'getBookingById':
        return await handleGetBookingById(res, args);
      
      default:
        return res.status(400).json({ error: `Function ${name} not supported` });
    }
  } catch (error) {
    console.error(`Error executing function ${functionCall.name}:`, error);
    return res.status(500).json({
      error: 'Error executing function',
      details: error.message,
    });
  }
} 