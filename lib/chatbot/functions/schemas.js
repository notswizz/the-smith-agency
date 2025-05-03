// Function schemas for OpenAI function calling
const functionSchemas = [
  {
    name: 'listClients',
    description: 'Get a list of all clients',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'getClientById',
    description: 'Get a client by their ID',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the client',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'searchClients',
    description: 'Search for clients by name, industry, or location',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Client name to search for (partial match)',
        },
        industry: {
          type: 'string',
          description: 'Industry to filter by',
        },
        location: {
          type: 'string',
          description: 'Location to filter by',
        },
      },
      required: [],
    },
  },
  {
    name: 'createClient',
    description: 'Create a new client',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the client',
        },
        email: {
          type: 'string',
          description: 'The email of the client',
        },
        phone: {
          type: 'string',
          description: 'The phone number of the client',
        },
        industry: {
          type: 'string',
          description: 'The industry of the client',
        },
        location: {
          type: 'string',
          description: 'The location of the client',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'updateClient',
    description: 'Update an existing client',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the client to update',
        },
        name: {
          type: 'string',
          description: 'The name of the client',
        },
        email: {
          type: 'string',
          description: 'The email of the client',
        },
        phone: {
          type: 'string',
          description: 'The phone number of the client',
        },
        industry: {
          type: 'string',
          description: 'The industry of the client',
        },
        location: {
          type: 'string',
          description: 'The location of the client',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'listShows',
    description: 'Get a list of all shows',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'searchShows',
    description: 'Search for shows by name, client, or status',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Show name to search for (partial match)',
        },
        clientId: {
          type: 'string',
          description: 'Filter shows for a specific client',
        },
        status: {
          type: 'string',
          description: 'Filter by show status (active, completed, pending)',
        },
      },
      required: [],
    },
  },
  {
    name: 'getShowById',
    description: 'Get a show by its ID',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the show',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'listStaff',
    description: 'Get a list of all staff',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'searchStaff',
    description: 'Search for staff by name, role, or skill',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Staff name to search for (partial match)',
        },
        role: {
          type: 'string',
          description: 'Role to filter by',
        },
        skill: {
          type: 'string',
          description: 'Skill to filter by',
        },
      },
      required: [],
    },
  },
  {
    name: 'getStaffById',
    description: 'Get a staff member by their ID',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the staff member',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'createStaff',
    description: 'Create a new staff member who works for the agency',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The full name of the staff member',
        },
        email: {
          type: 'string',
          description: 'The email of the staff member',
        },
        phone: {
          type: 'string',
          description: 'The phone number of the staff member',
        },
        role: {
          type: 'string',
          description: 'The role/position of the staff member in the agency',
        },
        skills: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'List of skills the staff member possesses',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'updateStaff',
    description: 'Update an existing staff member\'s information',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the staff member to update',
        },
        name: {
          type: 'string',
          description: 'The full name of the staff member',
        },
        email: {
          type: 'string',
          description: 'The email of the staff member',
        },
        phone: {
          type: 'string',
          description: 'The phone number of the staff member',
        },
        role: {
          type: 'string',
          description: 'The role/position of the staff member in the agency',
        },
        skills: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'List of skills the staff member possesses',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'getStaffAvailability',
    description: 'Get the availability for a specific staff member across all shows or for a specific show',
    parameters: {
      type: 'object',
      properties: {
        staffId: {
          type: 'string',
          description: 'The ID of the staff member',
        },
        staffName: {
          type: 'string',
          description: 'The name of the staff member (used for search when ID is not known)',
        },
        showId: {
          type: 'string',
          description: 'The ID of the show (optional - to get availability for a specific show)',
        },
      },
      required: [],
    },
  },
  {
    name: 'getAvailableStaffForDate',
    description: 'Get a list of staff members available on a specific date for a show',
    parameters: {
      type: 'object',
      properties: {
        showId: {
          type: 'string',
          description: 'The ID of the show',
        },
        date: {
          type: 'string',
          description: 'The date to check availability for (YYYY-MM-DD format)',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'listBookings',
    description: 'Get a list of all bookings',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'searchBookings',
    description: 'Search for bookings by various criteria',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Filter bookings for a specific client',
        },
        showId: {
          type: 'string',
          description: 'Filter bookings for a specific show',
        },
        staffId: {
          type: 'string',
          description: 'Filter bookings that include a specific staff member',
        },
        status: {
          type: 'string',
          description: 'Filter by booking status (confirmed, pending, canceled)',
        },
        date: {
          type: 'string',
          description: 'Filter bookings for a specific date (YYYY-MM-DD format)',
        },
      },
      required: [],
    },
  },
  {
    name: 'getBookingById',
    description: 'Get a booking by its ID',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the booking',
        },
      },
      required: ['id'],
    },
  },
];

export default functionSchemas; 