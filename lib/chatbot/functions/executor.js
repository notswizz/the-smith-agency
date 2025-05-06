import * as bookingHandlers from '../handlers/bookings';
import * as clientHandlers from '../handlers/clients';
import * as staffHandlers from '../handlers/staff';
import * as showHandlers from '../handlers/shows';
import * as availabilityHandlers from '../handlers/availability';

/**
 * Execute a function call by name with given arguments
 */
export async function executeFunctionCall(functionName, args) {
  // Create a mock response object to collect data and messages
  const mockRes = {
    status: (code) => {
      mockRes.statusCode = code;
      return mockRes;
    },
    json: (data) => {
      mockRes.data = data.data;
      mockRes.message = data.message;
      return data;
    },
    statusCode: 200,
    data: null,
    message: null
  };

  try {
    // Map function name to the appropriate handler
    switch(functionName) {
      // Booking handlers
      case 'listBookings':
        await bookingHandlers.handleListBookings(mockRes);
        break;
      case 'searchBookings':
        await bookingHandlers.handleSearchBookings(mockRes, args);
        break;
      case 'getBookingById':
        await bookingHandlers.handleGetBookingById(mockRes, args);
        break;
      case 'createBooking':
        if (bookingHandlers.handleCreateBooking) {
          await bookingHandlers.handleCreateBooking(mockRes, args);
        } else {
          throw new Error('Create booking functionality not implemented');
        }
        break;
      case 'updateBooking':
        if (bookingHandlers.handleUpdateBooking) {
          await bookingHandlers.handleUpdateBooking(mockRes, args);
        } else {
          throw new Error('Update booking functionality not implemented');
        }
        break;
      case 'deleteBooking':
        if (bookingHandlers.handleDeleteBooking) {
          await bookingHandlers.handleDeleteBooking(mockRes, args);
        } else {
          throw new Error('Delete booking functionality not implemented');
        }
        break;
        
      // Client handlers
      case 'listClients':
        await clientHandlers.handleListClients(mockRes);
        break;
      case 'searchClients':
        await clientHandlers.handleSearchClients(mockRes, args);
        break;
      case 'getClientById':
        await clientHandlers.handleGetClientById(mockRes, args);
        break;
      case 'createClient':
        if (clientHandlers.handleCreateClient) {
          await clientHandlers.handleCreateClient(mockRes, args);
        } else {
          throw new Error('Create client functionality not implemented');
        }
        break;
      case 'updateClient':
        if (clientHandlers.handleUpdateClient) {
          await clientHandlers.handleUpdateClient(mockRes, args);
        } else {
          throw new Error('Update client functionality not implemented');
        }
        break;
      case 'deleteClient':
        if (clientHandlers.handleDeleteClient) {
          await clientHandlers.handleDeleteClient(mockRes, args);
        } else {
          throw new Error('Delete client functionality not implemented');
        }
        break;
        
      // Staff handlers
      case 'listStaff':
        await staffHandlers.handleListStaff(mockRes);
        break;
      case 'searchStaff':
        await staffHandlers.handleSearchStaff(mockRes, args);
        break;
      case 'getStaffById':
        await staffHandlers.handleGetStaffById(mockRes, args);
        break;
      case 'createStaff':
        if (staffHandlers.handleCreateStaff) {
          await staffHandlers.handleCreateStaff(mockRes, args);
        } else {
          throw new Error('Create staff functionality not implemented');
        }
        break;
      case 'updateStaff':
        if (staffHandlers.handleUpdateStaff) {
          await staffHandlers.handleUpdateStaff(mockRes, args);
        } else {
          throw new Error('Update staff functionality not implemented');
        }
        break;
      case 'deleteStaff':
        if (staffHandlers.handleDeleteStaff) {
          await staffHandlers.handleDeleteStaff(mockRes, args);
        } else {
          throw new Error('Delete staff functionality not implemented');
        }
        break;
      
      // Show handlers
      case 'listShows':
        await showHandlers.handleListShows(mockRes);
        break;
      case 'searchShows':
        await showHandlers.handleSearchShows(mockRes, args);
        break;
      case 'getShowById':
        await showHandlers.handleGetShowById(mockRes, args);
        break;
      case 'createShow':
        if (showHandlers.handleCreateShow) {
          await showHandlers.handleCreateShow(mockRes, args);
        } else {
          throw new Error('Create show functionality not implemented');
        }
        break;
      case 'updateShow':
        if (showHandlers.handleUpdateShow) {
          await showHandlers.handleUpdateShow(mockRes, args);
        } else {
          throw new Error('Update show functionality not implemented');
        }
        break;
      case 'deleteShow':
        if (showHandlers.handleDeleteShow) {
          await showHandlers.handleDeleteShow(mockRes, args);
        } else {
          throw new Error('Delete show functionality not implemented');
        }
        break;
      
      // Availability handlers
      case 'getStaffAvailability':
        if (availabilityHandlers.handleGetStaffAvailability) {
          await availabilityHandlers.handleGetStaffAvailability(mockRes, args);
        } else {
          throw new Error('Get staff availability functionality not implemented');
        }
        break;
      case 'getAvailableStaffForDate':
        if (availabilityHandlers.handleGetAvailableStaffForDate) {
          await availabilityHandlers.handleGetAvailableStaffForDate(mockRes, args);
        } else {
          throw new Error('Get available staff for date functionality not implemented');
        }
        break;
      
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    return {
      data: mockRes.data,
      message: mockRes.message,
      status: mockRes.statusCode
    };
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error);
    return {
      data: null,
      message: `I couldn't complete the ${functionName} operation: ${error.message}`,
      status: 500
    };
  }
} 