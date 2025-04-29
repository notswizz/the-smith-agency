// Filter staff by experience level
export const filterStaffByExperience = (staff, experience) => {
  if (!experience || experience === 'all') return staff;
  return staff.filter(s => s.experience === experience);
};

// Filter staff by availability for a specific show date
export const filterStaffByAvailability = (staff, availability, showId, date) => {
  if (!showId || !date) return staff;
  
  const availableStaffIds = availability
    .filter(a => a.showId === showId && a.dates.includes(date))
    .map(a => a.staffId);
  
  return staff.filter(s => availableStaffIds.includes(s.id));
};

// Filter shows by season
export const filterShowsBySeason = (shows, season) => {
  if (!season || season === 'all') return shows;
  return shows.filter(s => s.season === season);
};

// Filter shows by location
export const filterShowsByLocation = (shows, location) => {
  if (!location || location === 'all') return shows;
  return shows.filter(s => s.location === location);
};

// Filter clients by category
export const filterClientsByCategory = (clients, category) => {
  if (!category || category === 'all') return clients;
  return clients.filter(c => c.category === category);
};

// Filter clients by location
export const filterClientsByLocation = (clients, location) => {
  if (!location || location === 'all') return clients;
  return clients.filter(c => c.location === location);
};

// Filter bookings by status
export const filterBookingsByStatus = (bookings, status) => {
  if (!status || status === 'all') return bookings;
  return bookings.filter(b => b.status === status);
};

// Search function for staff
export const searchStaff = (staff, query) => {
  if (!query) return staff;
  
  const lowerQuery = query.toLowerCase();
  return staff.filter(s => 
    s.name.toLowerCase().includes(lowerQuery) ||
    s.email.toLowerCase().includes(lowerQuery) ||
    s.phone.includes(lowerQuery) ||
    (s.instagram && s.instagram.toLowerCase().includes(lowerQuery))
  );
};

// Search function for clients
export const searchClients = (clients, query) => {
  if (!query) return clients;
  
  const lowerQuery = query.toLowerCase();
  return clients.filter(c => {
    // Check company name and website
    if (c.name.toLowerCase().includes(lowerQuery) || 
        (c.website && c.website.toLowerCase().includes(lowerQuery))) {
      return true;
    }
    
    // Check contact information
    if (c.contacts && c.contacts.length > 0) {
      return c.contacts.some(contact => 
        contact.name.toLowerCase().includes(lowerQuery) ||
        contact.email.toLowerCase().includes(lowerQuery) ||
        (contact.phone && contact.phone.includes(lowerQuery))
      );
    }
    
    return false;
  });
};

// Search function for shows
export const searchShows = (shows, query) => {
  if (!query) return shows;
  
  const lowerQuery = query.toLowerCase();
  return shows.filter(s => 
    s.name.toLowerCase().includes(lowerQuery) ||
    s.location.toLowerCase().includes(lowerQuery) ||
    s.type.toLowerCase().includes(lowerQuery) ||
    s.season.toLowerCase().includes(lowerQuery)
  );
};

// Search function for bookings
export const searchBookings = (bookings, query, clients, shows) => {
  if (!query) return bookings;
  
  const lowerQuery = query.toLowerCase();
  return bookings.filter(b => {
    // Check notes
    if (b.notes && b.notes.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Check client name
    const client = clients.find(c => c.id === b.client);
    if (client && client.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Check show name
    const show = shows.find(s => s.id === b.show);
    if (show && show.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    return false;
  });
}; 