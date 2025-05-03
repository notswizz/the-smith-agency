import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from 'firebase/firestore';

// Get all shows
export async function handleListShows(res) {
  try {
    const showsCollection = collection(db, 'shows');
    const snapshot = await getDocs(showsCollection);
    const shows = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Create a more descriptive message with show details
    let message = '';
    if (shows.length === 0) {
      message = 'There are no shows in the database.';
    } else {
      // Get show names and statuses
      const showDetails = shows.map(show => {
        const statusTag = show.status ? ` (${show.status})` : '';
        return show.name ? `${show.name}${statusTag}` : 'Unnamed show';
      });
      
      // Count active shows
      const activeShows = shows.filter(show => show.status === 'active').length;
      
      message = `The agency is managing ${shows.length} show${shows.length !== 1 ? 's' : ''}: ${showDetails.join(', ')}. `;
      if (activeShows > 0) {
        message += `${activeShows} of these shows ${activeShows === 1 ? 'is' : 'are'} currently active.`;
      }
    }
    
    return res.status(200).json({ 
      data: shows,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Search shows by criteria
export async function handleSearchShows(res, args) {
  try {
    const { name, clientId, status } = args;
    
    if (!name && !clientId && !status) {
      return handleListShows(res);
    }
    
    const showsCollection = collection(db, 'shows');
    
    // Get all shows first
    const snapshot = await getDocs(showsCollection);
    
    // Filter in memory
    let shows = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    if (name) {
      const nameLower = name.toLowerCase();
      shows = shows.filter(show => 
        show.name?.toLowerCase().includes(nameLower)
      );
    }
    
    if (clientId) {
      shows = shows.filter(show => show.clientId === clientId);
    }
    
    if (status) {
      const statusLower = status.toLowerCase();
      shows = shows.filter(show => 
        show.status?.toLowerCase() === statusLower
      );
    }
    
    let message = `Found ${shows.length} shows`;
    if (name) message += ` with name containing "${name}"`;
    if (clientId) message += ` for client ID "${clientId}"`;
    if (status) message += ` with status "${status}"`;
    message += ".";
    
    return res.status(200).json({ 
      data: shows,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Get show by ID
export async function handleGetShowById(res, args) {
  try {
    const { id } = args;
    
    if (!id) {
      return res.status(400).json({ error: 'Show ID is required' });
    }
    
    const showDoc = doc(db, 'shows', id);
    const snapshot = await getDoc(showDoc);
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        error: 'Show not found',
        message: `No show found with ID: ${id}`
      });
    }
    
    const show = { id: snapshot.id, ...snapshot.data() };
    
    // Create a more detailed message
    let message = `Found show: ${show.name || 'Unnamed show'}`;
    if (show.status) {
      message += ` (${show.status})`;
    }
    
    if (show.clientId) {
      try {
        const clientDoc = doc(db, 'clients', show.clientId);
        const clientSnapshot = await getDoc(clientDoc);
        if (clientSnapshot.exists()) {
          const clientData = clientSnapshot.data();
          message += ` for client ${clientData.name || show.clientId}`;
        }
      } catch (error) {
        // If we can't get client info, just continue
      }
    }
    
    if (show.startDate && show.endDate) {
      message += ` running from ${show.startDate} to ${show.endDate}`;
    } else if (show.startDate) {
      message += ` starting on ${show.startDate}`;
    } else if (show.endDate) {
      message += ` ending on ${show.endDate}`;
    }
    
    return res.status(200).json({ 
      data: show,
      message 
    });
  } catch (error) {
    throw error;
  }
} 