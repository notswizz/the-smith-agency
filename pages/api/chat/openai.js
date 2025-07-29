import OpenAI from 'openai';
import firebaseService from '@/lib/firebase/firebaseService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function definitions for OpenAI
const functions = [
  {
    name: "get_bookings",
    description: "Get all bookings from the database or filter by specific criteria",
    parameters: {
      type: "object",
      properties: {
        clientName: { type: "string", description: "Filter by client name" },
        showName: { type: "string", description: "Filter by show name" },
        status: { type: "string", description: "Filter by booking status" },
        startDate: { type: "string", description: "Filter by start date (YYYY-MM-DD)" },
        endDate: { type: "string", description: "Filter by end date (YYYY-MM-DD)" }
      },
      required: []
    }
  },
  {
    name: "get_staff",
    description: "Get all staff members from the database or filter by specific criteria",
    parameters: {
      type: "object", 
      properties: {
        role: { type: "string", description: "Filter by staff role" },
        skill: { type: "string", description: "Filter by specific skill" }
      },
      required: []
    }
  },
  {
    name: "get_clients",
    description: "Get all clients from the database or filter by specific criteria",
    parameters: {
      type: "object",
      properties: {
        company: { type: "string", description: "Filter by company name" }
      },
      required: []
    }
  },
  {
    name: "get_shows",
    description: "Get all shows from the database or filter by specific criteria",
    parameters: {
      type: "object",
      properties: {
        venue: { type: "string", description: "Filter by venue name" },
        status: { type: "string", description: "Filter by show status" },
        upcoming: { type: "boolean", description: "Get only upcoming shows" }
      },
      required: []
    }
  },
  {
    name: "search_records",
    description: "Search across any collection by field and term",
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name (bookings, staff, clients, shows)" },
        field: { type: "string", description: "Field to search in (name, email, etc.)" },
        searchTerm: { type: "string", description: "Term to search for" }
      },
      required: ["collection", "field", "searchTerm"]
    }
  },
  {
    name: "create_booking",
    description: "Prepare to create a new booking (returns action button)",
    parameters: {
      type: "object",
      properties: {
        clientName: { type: "string", description: "Client name" },
        showName: { type: "string", description: "Show name" },
        assignedDate: { type: "string", description: "Date in YYYY-MM-DD format" },
        status: { type: "string", description: "Booking status (pending, confirmed, completed, cancelled)" },
        notes: { type: "string", description: "Additional notes" }
      },
      required: ["clientName", "showName", "assignedDate"]
    }
  },
  {
    name: "create_staff",
    description: "Prepare to create a new staff member (returns action button)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Staff member name" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        role: { type: "string", description: "Staff role/position" },
        skills: { type: "array", items: { type: "string" }, description: "Array of skills" }
      },
      required: ["name", "email"]
    }
  },
  {
    name: "create_client",
    description: "Prepare to create a new client (returns action button)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Client name" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        company: { type: "string", description: "Company name" },
        notes: { type: "string", description: "Additional notes" }
      },
      required: ["name"]
    }
  },
  {
    name: "create_show",
    description: "Prepare to create a new show (returns action button)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Show name" },
        date: { type: "string", description: "Show date in YYYY-MM-DD format" },
        venue: { type: "string", description: "Venue name" },
        description: { type: "string", description: "Show description" },
        status: { type: "string", description: "Show status (upcoming, ongoing, completed, cancelled)" }
      },
      required: ["name", "date"]
    }
  },
  {
    name: "update_booking",
    description: "Update an existing booking",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Booking ID" },
        clientName: { type: "string", description: "Client name" },
        showName: { type: "string", description: "Show name" },
        assignedDate: { type: "string", description: "Date in YYYY-MM-DD format" },
        status: { type: "string", description: "Booking status (pending, confirmed, completed, cancelled)" },
        notes: { type: "string", description: "Additional notes" }
      },
      required: ["id"]
    }
  },
  {
    name: "update_staff",
    description: "Update an existing staff member",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Staff member ID" },
        name: { type: "string", description: "Staff member name" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        role: { type: "string", description: "Staff role/position" },
        skills: { type: "array", items: { type: "string" }, description: "Array of skills" }
      },
      required: ["id"]
    }
  },
  {
    name: "update_client",
    description: "Update an existing client",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Client ID" },
        name: { type: "string", description: "Client name" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        company: { type: "string", description: "Company name" },
        notes: { type: "string", description: "Additional notes" }
      },
      required: ["id"]
    }
  },
  {
    name: "update_show",
    description: "Update an existing show",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Show ID" },
        name: { type: "string", description: "Show name" },
        date: { type: "string", description: "Show date in YYYY-MM-DD format" },
        venue: { type: "string", description: "Venue name" },
        description: { type: "string", description: "Show description" },
        status: { type: "string", description: "Show status (upcoming, ongoing, completed, cancelled)" }
      },
      required: ["id"]
    }
  },
  {
    name: "get_document_by_id",
    description: "Get a specific document by ID from any collection",
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name (bookings, staff, clients, shows)" },
        id: { type: "string", description: "Document ID" }
      },
      required: ["collection", "id"]
    }
  },
  {
    name: "find_staff_by_name",
    description: "Find a staff member by name (exact or partial match)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Staff member name to search for" }
      },
      required: ["name"]
    }
  },
  {
    name: "find_client_by_name", 
    description: "Find a client by name (exact or partial match)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Client name to search for" }
      },
      required: ["name"]
    }
  },
  {
    name: "update_staff_by_name",
    description: "Prepare to update a staff member by their name (returns action button)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Staff member name to find and update" },
        email: { type: "string", description: "New email address" },
        phone: { type: "string", description: "New phone number" },
        role: { type: "string", description: "New staff role/position" },
        skills: { type: "array", items: { type: "string" }, description: "New array of skills" }
      },
      required: ["name"]
    }
  },
  {
    name: "update_client_by_name",
    description: "Prepare to update a client by their name (returns action button)", 
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Client name to find and update" },
        email: { type: "string", description: "New email address" },
        phone: { type: "string", description: "New phone number" },
        company: { type: "string", description: "New company name" },
        notes: { type: "string", description: "New notes" }
      },
      required: ["name"]
    }
  },
  {
    name: "batch_create",
    description: "Create multiple records at once",
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name (bookings, staff, clients, shows)" },
        records: { 
          type: "array", 
          description: "Array of record objects to create",
          items: { type: "object" }
        }
      },
      required: ["collection", "records"]
    }
  },
  {
    name: "get_analytics",
    description: "Get analytics and statistics about the database",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Analytics type: 'summary', 'bookings_by_status', 'staff_by_role', 'upcoming_shows'" }
      },
      required: ["type"]
    }
  },
  {
    name: "delete_record",
    description: "Delete a record by ID", 
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name (bookings, staff, clients, shows)" },
        id: { type: "string", description: "Record ID to delete" }
      },
      required: ["collection", "id"]
    }
  },
  {
    name: "list_names",
    description: "Get list of all names from a collection to help with name matching",
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name (staff, clients)" }
      },
      required: ["collection"]
    }
  },
  {
    name: "update_mentioned_staff",
    description: "Update a staff member mentioned with @ symbol - extracts current name from @ mention",
    parameters: {
      type: "object",
      properties: {
        mentionedName: { type: "string", description: "The exact name that was mentioned with @ symbol (e.g., 'Jack Smith' from '@Jack Smith')" },
        newName: { type: "string", description: "New name to update to" },
        email: { type: "string", description: "New email address" },
        phone: { type: "string", description: "New phone number" },
        role: { type: "string", description: "New staff role/position" },
        skills: { type: "array", items: { type: "string" }, description: "New array of skills" }
      },
      required: ["mentionedName"]
    }
  }
];

// Function execution handler
async function executeFunction(name, args) {
  switch (name) {
    case 'get_bookings':
      if (args.clientName) {
        return await firebaseService.getBookingsByClient(args.clientName);
      } else if (args.showName) {
        return await firebaseService.getBookingsByShow(args.showName);
      } else if (args.status) {
        return await firebaseService.getBookingsByStatus(args.status);
      } else if (args.startDate && args.endDate) {
        return await firebaseService.getBookingsByDateRange(args.startDate, args.endDate);
      } else {
        return await firebaseService.getAll('bookings');
      }
    
    case 'get_staff':
      if (args.role) {
        return await firebaseService.getStaffByRole(args.role);
      } else if (args.skill) {
        return await firebaseService.getStaffBySkill(args.skill);
      } else {
        return await firebaseService.getAll('staff');
      }
    
    case 'get_clients':
      if (args.company) {
        return await firebaseService.getClientsByCompany(args.company);
      } else {
        return await firebaseService.getAll('clients');
      }
    
    case 'get_shows':
      if (args.venue) {
        return await firebaseService.getShowsByVenue(args.venue);
      } else if (args.status) {
        return await firebaseService.getShowsByStatus(args.status);
      } else if (args.upcoming) {
        return await firebaseService.getUpcomingShows();
      } else {
        return await firebaseService.getAll('shows');
      }
    
    case 'search_records':
      return await firebaseService.search(args.collection, args.field, args.searchTerm);
    
    case 'create_booking':
      return {
        __action: {
          id: `create_booking_${Date.now()}`,
          type: 'create_booking',
          label: `Create Booking for ${args.clientName}`,
          successMessage: `Successfully created booking for ${args.clientName}`,
          data: args
        },
        message: `Ready to create booking for ${args.clientName} on ${args.assignedDate}. Click the button below to confirm.`,
        preview: args
      };
    
    case 'create_staff':
      return {
        __action: {
          id: `create_staff_${Date.now()}`,
          type: 'create_staff',
          label: `Create Staff: ${args.name}`,
          successMessage: `Successfully created staff member ${args.name}`,
          data: args
        },
        message: `Ready to create staff member ${args.name}. Click the button below to confirm.`,
        preview: args
      };
    
    case 'create_client':
      return {
        __action: {
          id: `create_client_${Date.now()}`,
          type: 'create_client',
          label: `Create Client: ${args.name}`,
          successMessage: `Successfully created client ${args.name}`,
          data: args
        },
        message: `Ready to create client ${args.name}. Click the button below to confirm.`,
        preview: args
      };
    
    case 'create_show':
      return {
        __action: {
          id: `create_show_${Date.now()}`,
          type: 'create_show',
          label: `Create Show: ${args.name}`,
          successMessage: `Successfully created show ${args.name}`,
          data: args
        },
        message: `Ready to create show ${args.name} on ${args.date}. Click the button below to confirm.`,
        preview: args
      };
    
    case 'update_booking':
      const { id, ...bookingUpdateData } = args;
      return await firebaseService.update('bookings', id, bookingUpdateData);
    
    case 'update_staff':
      const { id: staffId, ...staffUpdateData } = args;
      return await firebaseService.update('staff', staffId, staffUpdateData);
    
    case 'update_client':
      const { id: clientId, ...clientUpdateData } = args;
      return await firebaseService.update('clients', clientId, clientUpdateData);
    
    case 'update_show':
      const { id: showId, ...showUpdateData } = args;
      return await firebaseService.update('shows', showId, showUpdateData);
    
    case 'get_document_by_id':
      return await firebaseService.getById(args.collection, args.id);
    
    case 'find_staff_by_name':
      return await firebaseService.findByName('staff', args.name, true);
    
    case 'find_client_by_name':
      return await firebaseService.findByName('clients', args.name, true);
    
    case 'update_staff_by_name':
      const { name: staffName, ...staffUpdateByNameData } = args;
      const staffDoc = await firebaseService.findByName('staff', staffName, true);
      if (!staffDoc) {
        // Try to find similar names to suggest
        const similarStaff = await firebaseService.findByName('staff', staffName, false);
        const suggestions = similarStaff.slice(0, 3).map(s => s.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`Staff member "${staffName}" not found.${suggestionText} Please check the name and try again.`);
      }
      
      // Return action instead of executing - only include non-empty update data
      const cleanUpdateData = Object.fromEntries(
        Object.entries(staffUpdateByNameData).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
      
      return {
        __action: {
          id: `update_staff_${Date.now()}`,
          type: 'update_staff',
          label: `Update ${staffDoc.name}`,
          successMessage: `Successfully updated ${staffDoc.name}`,
          data: { id: staffDoc.id, ...cleanUpdateData }
        },
        message: `Ready to update ${staffDoc.name}. Click the button below to confirm.`,
        preview: { 
          current: staffDoc,
          updates: cleanUpdateData
        }
      };
    
    case 'update_client_by_name':
      const { name: clientName, ...clientUpdateByNameData } = args;
      const clientDoc = await firebaseService.findByName('clients', clientName, true);
      if (!clientDoc) {
        // Try to find similar names to suggest
        const similarClients = await firebaseService.findByName('clients', clientName, false);
        const suggestions = similarClients.slice(0, 3).map(c => c.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`Client "${clientName}" not found.${suggestionText} Please check the name and try again.`);
      }
      
      // Return action instead of executing - only include non-empty update data
      const cleanClientUpdateData = Object.fromEntries(
        Object.entries(clientUpdateByNameData).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
      
      return {
        __action: {
          id: `update_client_${Date.now()}`,
          type: 'update_client',
          label: `Update ${clientDoc.name}`,
          successMessage: `Successfully updated ${clientDoc.name}`,
          data: { id: clientDoc.id, ...cleanClientUpdateData }
        },
        message: `Ready to update ${clientDoc.name}. Click the button below to confirm.`,
        preview: { 
          current: clientDoc,
          updates: cleanClientUpdateData
        }
      };
    
    case 'batch_create':
      return await firebaseService.batchCreate(args.collection, args.records);
    
    case 'get_analytics':
      return await getAnalytics(args.type);
    
    case 'delete_record':
      return await firebaseService.delete(args.collection, args.id);
    
    case 'list_names':
      const allRecords = await firebaseService.getAll(args.collection);
      return allRecords.map(record => ({
        id: record.id,
        name: record.name
      })).filter(record => record.name);
    
    case 'update_mentioned_staff':
      const { mentionedName, ...updateData } = args;
      const mentionedStaffDoc = await firebaseService.findByName('staff', mentionedName, true);
      
      if (!mentionedStaffDoc) {
        // Try to find similar names to suggest
        const similarStaff = await firebaseService.findByName('staff', mentionedName, false);
        const suggestions = similarStaff.slice(0, 3).map(s => s.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`Staff member "${mentionedName}" not found.${suggestionText} Please check the name and try again.`);
      }
      
      // Filter out empty update data
      const cleanMentionUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
      
      return {
        __action: {
          id: `update_mentioned_staff_${Date.now()}`,
          type: 'update_staff',
          label: `Update ${mentionedStaffDoc.name}`,
          successMessage: `Successfully updated ${mentionedStaffDoc.name}`,
          data: { id: mentionedStaffDoc.id, ...cleanMentionUpdateData }
        },
        message: `Ready to update ${mentionedStaffDoc.name}. Click the button below to confirm.`,
        preview: { 
          current: mentionedStaffDoc,
          updates: cleanMentionUpdateData
        }
      };
    
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

// Analytics helper function
async function getAnalytics(type) {
  switch (type) {
    case 'summary':
      const [bookings, staff, clients, shows] = await Promise.all([
        firebaseService.getAll('bookings'),
        firebaseService.getAll('staff'),
        firebaseService.getAll('clients'),
        firebaseService.getAll('shows')
      ]);
      
      return {
        totalBookings: bookings.length,
        totalStaff: staff.length,
        totalClients: clients.length,
        totalShows: shows.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        upcomingShows: shows.filter(s => new Date(s.date) > new Date()).length
      };
    
    case 'bookings_by_status':
      const allBookings = await firebaseService.getAll('bookings');
      const statusCounts = {};
      allBookings.forEach(booking => {
        statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
      });
      return statusCounts;
    
    case 'staff_by_role':
      const allStaff = await firebaseService.getAll('staff');
      const roleCounts = {};
      allStaff.forEach(staff => {
        roleCounts[staff.role] = (roleCounts[staff.role] || 0) + 1;
      });
      return roleCounts;
    
    case 'upcoming_shows':
      return await firebaseService.getUpcomingShows();
    
    default:
      throw new Error(`Unknown analytics type: ${type}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const systemMessage = {
      role: "system",
      content: `You are an AI assistant for The Smith Agency, a talent management and booking agency. You help manage bookings, staff, clients, and shows through a conversational interface.

Key guidelines:
- Always be helpful and professional
- When users ask about data, use the appropriate function to fetch current information
- When users want to create or update records, IMMEDIATELY use the appropriate function to show an action button - DO NOT ask for confirmation first
- Provide clear, concise responses
- If you need to show data, format it in a readable way
- Always use the most up-to-date information from the database

IMPORTANT: For any create, update, or delete operations:
- Use update functions (like update_staff_by_name) IMMEDIATELY when requested
- DO NOT ask "would you like me to..." or "should I..." questions
- The functions will return action buttons for the user to click
- Present the action button directly without additional confirmation requests

@ MENTION HANDLING:
- When users mention staff with @ (e.g., "@Jack Smith"), treat this as a precise staff reference
- ALWAYS use the update_mentioned_staff function for @ mentions, NOT update_staff_by_name
- Extract the name after @ symbol for the "mentionedName" parameter
- Example: "change @Jack Smith name to jack swizz" → use update_mentioned_staff with mentionedName="Jack Smith", newName="jack swizz"
- @ mentions indicate the user has selected a specific staff member from autocomplete
- Process @ mentions immediately without asking for clarification

FUNCTION SELECTION:
- Text contains "@Name" → use update_mentioned_staff function
- Text has "update [name] by name" without @ → use update_staff_by_name function

You have access to the following data:
- Bookings: client bookings for shows with dates, status, and notes
- Staff: team members with contact info, roles, and skills
- Clients: client information including contact details and companies
- Shows: events/shows with dates, venues, and descriptions

Always fetch current data when answering questions about existing records.`
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [systemMessage, ...messages],
      functions: functions,
      function_call: "auto",
    });

    const message = completion.choices[0].message;

    // Handle function calls
    if (message.function_call) {
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments);

      try {
        const functionResult = await executeFunction(functionName, functionArgs);
        
        // Check if result contains an action
        if (functionResult && functionResult.__action) {
          return res.status(200).json({
            message: functionResult.message,
            actions: [functionResult.__action]
          });
        }
        
        // Send function result back to OpenAI
        const followUpCompletion = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            systemMessage,
            ...messages,
            message,
            {
              role: "function",
              name: functionName,
              content: JSON.stringify(functionResult)
            }
          ]
        });

        return res.status(200).json({
          message: followUpCompletion.choices[0].message.content
        });
      } catch (error) {
        console.error('Function execution error:', error);
        return res.status(200).json({
          message: `I encountered an error while ${functionName.replace('_', ' ')}: ${error.message}. Please try again.`
        });
      }
    }

    // Return regular response
    return res.status(200).json({
      message: message.content
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({
      error: 'Failed to process your request. Please try again.'
    });
  }
}