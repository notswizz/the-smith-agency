import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

// Get all clients
export async function handleListClients(res) {
  try {
    const clientsCollection = collection(db, 'clients');
    const snapshot = await getDocs(clientsCollection);
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Create a more descriptive message with client details
    let message = '';
    if (clients.length === 0) {
      message = 'There are no clients in the database.';
    } else {
      const clientNames = clients.map(client => client.name).filter(Boolean);
      if (clientNames.length > 0) {
        const formattedNames = clientNames.join(', ');
        message = `The agency has ${clients.length} client${clients.length !== 1 ? 's' : ''}: ${formattedNames}.`;
      } else {
        message = `The agency has ${clients.length} client${clients.length !== 1 ? 's' : ''}.`;
      }
    }
    
    return res.status(200).json({ 
      data: clients,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Search clients by criteria
export async function handleSearchClients(res, args) {
  try {
    const { name, industry, location } = args;
    
    if (!name && !industry && !location) {
      return handleListClients(res);
    }
    
    const clientsCollection = collection(db, 'clients');
    
    // Get all clients first (since Firebase doesn't support complex queries well)
    const snapshot = await getDocs(clientsCollection);
    
    // Filter in memory
    let clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    if (name) {
      const nameLower = name.toLowerCase();
      clients = clients.filter(client => 
        client.name?.toLowerCase().includes(nameLower)
      );
    }
    
    if (industry) {
      const industryLower = industry.toLowerCase();
      clients = clients.filter(client => 
        client.industry?.toLowerCase().includes(industryLower)
      );
    }
    
    if (location) {
      const locationLower = location.toLowerCase();
      clients = clients.filter(client => 
        client.location?.toLowerCase().includes(locationLower)
      );
    }
    
    // Generate a more detailed and useful response message
    let message = '';
    if (clients.length === 0) {
      if (name) {
        message = `I couldn't find any clients with name containing "${name}"`;
        if (industry) message += ` in the ${industry} industry`;
        if (location) message += ` located in ${location}`;
        message += '.';
      } else {
        message = 'No clients match your search criteria.';
      }
    } else if (clients.length === 1) {
      const client = clients[0];
      message = `I found 1 client with the name "${client.name}"`;
      if (industry) message += ` in the ${industry} industry`;
      if (location) message += ` located in ${location}`;
      
      // Add more client details when available
      if (client.industry && !industry) {
        message += `, operating in the ${client.industry} industry`;
      }
      if (client.location && !location) {
        message += `, based in ${client.location}`;
      }
      if (client.email) {
        message += `. Contact email: ${client.email}`;
      }
      if (client.phone) {
        message += client.email ? `, phone: ${client.phone}` : `. Contact phone: ${client.phone}`;
      }
      message += '.';
    } else {
      const clientNames = clients.map(c => c.name).filter(Boolean);
      const searchTerms = [];
      if (name) searchTerms.push(`name containing "${name}"`);
      if (industry) searchTerms.push(`in the ${industry} industry`);
      if (location) searchTerms.push(`located in ${location}`);
      
      message = `I found ${clients.length} clients`;
      if (searchTerms.length > 0) {
        message += ` with ${searchTerms.join(' and ')}`;
      }
      message += `: ${clientNames.join(', ')}`;
      
      // Add additional summarized information
      const industries = [...new Set(clients.map(c => c.industry).filter(Boolean))];
      if (industries.length > 0 && !industry) {
        message += `. Industries include: ${industries.join(', ')}`;
      }
      
      const locations = [...new Set(clients.map(c => c.location).filter(Boolean))];
      if (locations.length > 0 && !location) {
        message += `. Locations include: ${locations.join(', ')}`;
      }
      
      message += '.';
    }
    
    return res.status(200).json({ 
      data: clients,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Get client by ID
export async function handleGetClientById(res, args) {
  try {
    const { id } = args;
    
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const clientDoc = doc(db, 'clients', id);
    const snapshot = await getDoc(clientDoc);
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        error: 'Client not found',
        message: `No client found with ID: ${id}`
      });
    }
    
    const client = { id: snapshot.id, ...snapshot.data() };
    
    return res.status(200).json({ 
      data: client,
      message: `Found client: ${client.name}` 
    });
  } catch (error) {
    throw error;
  }
}

// Create a new client
export async function handleCreateClient(res, args) {
  try {
    const { name, email, phone, industry, location } = args;
    
    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }
    
    const clientData = {
      name,
      email: email || null,
      phone: phone || null,
      industry: industry || null,
      location: location || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const clientsCollection = collection(db, 'clients');
    const newClientRef = await addDoc(clientsCollection, clientData);
    
    return res.status(201).json({ 
      data: { id: newClientRef.id, ...clientData },
      message: `Created new client: ${name}`
    });
  } catch (error) {
    throw error;
  }
}

// Update an existing client
export async function handleUpdateClient(res, args) {
  try {
    const { id, name, email, phone, industry, location } = args;
    
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const clientDoc = doc(db, 'clients', id);
    const snapshot = await getDoc(clientDoc);
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        error: 'Client not found',
        message: `No client found with ID: ${id}`
      });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (industry !== undefined) updateData.industry = industry;
    if (location !== undefined) updateData.location = location;
    updateData.updatedAt = serverTimestamp();
    
    await updateDoc(clientDoc, updateData);
    
    return res.status(200).json({ 
      data: { id, ...updateData },
      message: `Updated client: ${name || snapshot.data().name}`
    });
  } catch (error) {
    throw error;
  }
} 