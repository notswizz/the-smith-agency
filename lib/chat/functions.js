// Export the function definitions array used by OpenAI function calling
export const functionDefinitions = [
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
    name: "count_shows_worked_by_staff",
    description: "Return number of distinct shows a staff member has worked, by staff display name",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Staff display name (e.g., 'Jack Smith')" }
      },
      required: ["name"]
    }
  },
  {
    name: "clients_for_staff_shows",
    description: "List distinct client names for shows a staff member has worked (by staff display name)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Staff display name (e.g., 'Jack Smith')" }
      },
      required: ["name"]
    }
  },
  {
    name: "recommend_staff",
    description: "Recommend staff for a show/date based on availability, role, and skills",
    parameters: {
      type: "object",
      properties: {
        showName: { type: "string", description: "Show name (optional if showId or startDate/endDate provided)" },
        showId: { type: "string", description: "Show ID (optional; if present will be used)" },
        date: { type: "string", description: "Target date (YYYY-MM-DD). Optional if using startDate/endDate or show dates" },
        startDate: { type: "string", description: "Start date (YYYY-MM-DD) to search availability" },
        endDate: { type: "string", description: "End date (YYYY-MM-DD) to search availability" },
        role: { type: "string", description: "Preferred role to match" },
        requiredSkills: { type: "array", items: { type: "string" }, description: "Skills required" },
        limit: { type: "number", description: "Max number of recommendations" }
      },
      required: []
    }
  },
  {
    name: "update_booking_by_names",
    description: "Prepare to update a booking using client and show names (and optional date) rather than IDs",
    parameters: {
      type: "object",
      properties: {
        clientName: { type: "string", description: "Client display name" },
        showName: { type: "string", description: "Show display name" },
        date: { type: "string", description: "Optional date within booking (YYYY-MM-DD)" },
        updates: { type: "object", description: "Arbitrary key-value pairs to update on the booking" }
      },
      required: ["clientName", "showName", "updates"]
    }
  },
  {
    name: "query_collection",
    description: "Generic query over a collection with filters, projection, sort, limit, and optional expansions (names instead of IDs)",
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name (bookings, staff, clients, shows)" },
        filters: {
          type: "array",
          description: "Optional filters to apply in-memory",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              op: { type: "string", description: "==, !=, >, <, >=, <=, contains, in, array_contains" },
              value: {}
            },
            required: ["field", "op", "value"]
          }
        },
        dateRange: {
          type: "object",
          description: "Optional direct-field date range filter (YYYY-MM-DD)",
          properties: {
            field: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" }
          }
        },
        select: { type: "array", items: { type: "string" }, description: "Fields to include in the response" },
        orderBy: {
          type: "object",
          properties: {
            field: { type: "string" },
            direction: { type: "string", description: "asc or desc" }
          }
        },
        limit: { type: "number", description: "Max number of results" },
        expand: {
          type: "object",
          description: "Optional name expansions for bookings and availability",
          properties: {
            expandClientName: { type: "boolean" },
            expandShowName: { type: "boolean" },
            expandStaffNames: { type: "boolean" },
            expandStaffName: { type: "boolean", description: "For availability: add staffName from staffId if missing" },
            expandAvailabilityShowName: { type: "boolean", description: "For availability: add showName from showId if missing" }
          }
        }
      },
      required: ["collection"]
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
        clientId: { type: "string", description: "Client ID" },
        showId: { type: "string", description: "Show ID" },
        clientName: { type: "string", description: "Client display name (optional if clientId provided)" },
        showName: { type: "string", description: "Show display name (optional if showId provided)" },
        assignedDate: { type: "string", description: "Single assigned date (YYYY-MM-DD). Optional if using datesNeeded" },
        datesNeeded: {
          type: "array",
          description: "Dates and staffing requirements",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "YYYY-MM-DD" },
              staffCount: { type: "number", description: "Number of staff needed" },
              staffIds: { type: "array", items: { type: "string" }, description: "Pre-assigned staff IDs (optional)" },
              staffNames: { type: "array", items: { type: "string" }, description: "Pre-assigned staff display names (optional)" },
              role: { type: "string" },
              shift: { type: "string" }
            },
            required: ["date", "staffCount"]
          }
        },
        status: { type: "string", description: "Booking status (pending, confirmed, completed, cancelled)" },
        notes: { type: "string", description: "Additional notes" }
      },
      required: []
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
        updates: { type: "object", description: "Arbitrary key-value pairs to update on the booking" }
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
        newName: { type: "string", description: "New name to update to (alias for 'name')" },
        email: { type: "string", description: "New email address" },
        phone: { type: "string", description: "New phone number" },
        role: { type: "string", description: "New staff role/position" },
        skills: { type: "array", items: { type: "string" }, description: "New array of skills" },
        updates: { type: "object", description: "Arbitrary key-value pairs to update on the staff document" }
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
        notes: { type: "string", description: "New notes" },
        updates: { type: "object", description: "Arbitrary key-value pairs to update on the client document" }
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
        type: { type: "string", description: "Analytics type: 'summary', 'total_bookings', 'bookings_by_status', 'staff_by_role', 'upcoming_shows', 'top_staff_by_days', 'top_clients_by_bookings'" },
        startDate: { type: "string", description: "Optional filter: start date (YYYY-MM-DD) for date-bounded analytics" },
        endDate: { type: "string", description: "Optional filter: end date (YYYY-MM-DD) for date-bounded analytics" },
        limit: { type: "number", description: "Optional: number of top results to return for ranking analytics" }
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
    description: "Update a staff member mentioned with @ symbol - extracts current name from @ mention. Supports 'newName' alias and arbitrary 'updates'.",
    parameters: {
      type: "object",
      properties: {
        mentionedName: { type: "string", description: "The exact name that was mentioned with @ symbol (e.g., 'Jack Smith' from '@Jack Smith')" },
        newName: { type: "string", description: "New name to update to (alias for 'name')" },
        email: { type: "string", description: "New email address" },
        phone: { type: "string", description: "New phone number" },
        role: { type: "string", description: "New staff role/position" },
        skills: { type: "array", items: { type: "string" }, description: "New array of skills" },
        updates: { type: "object", description: "Arbitrary key-value pairs to update on the staff document" }
      },
      required: ["mentionedName"]
    }
  },
  {
    name: "update_mentioned_show",
    description: "Update a show mentioned with # symbol - extracts show name from # mention. Supports 'newName' alias and arbitrary 'updates'.",
    parameters: {
      type: "object",
      properties: {
        mentionedName: { type: "string", description: "The exact show name mentioned with # (e.g., 'Dallas Summer Apparel 2025' from '#Dallas Summer Apparel 2025')" },
        newName: { type: "string", description: "New show name (alias for 'name')" },
        date: { type: "string", description: "Show date in YYYY-MM-DD format" },
        venue: { type: "string", description: "Venue name" },
        description: { type: "string", description: "Show description" },
        status: { type: "string", description: "Show status (upcoming, ongoing, completed, cancelled)" },
        updates: { type: "object", description: "Arbitrary key-value pairs to update on the show document" }
      },
      required: ["mentionedName"]
    }
  },
  {
    name: "update_record",
    description: "Prepare to update any record by id (returns action button)",
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name (bookings, staff, clients, shows)" },
        id: { type: "string", description: "Document ID" },
        updates: { type: "object", description: "Arbitrary key-value pairs to update on the document" }
      },
      required: ["collection", "id", "updates"]
    }
  },
  {
    name: "update_record_by_name",
    description: "Prepare to update a staff or client by name (returns action button)",
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name (staff, clients)" },
        name: { type: "string", description: "Display name to find" },
        updates: { type: "object", description: "Arbitrary key-value pairs to update on the document" }
      },
      required: ["collection", "name", "updates"]
    }
  }
];


