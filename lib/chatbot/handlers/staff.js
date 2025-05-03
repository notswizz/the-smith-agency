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

// Get all staff
export async function handleListStaff(res) {
  try {
    const staffCollection = collection(db, 'staff');
    const snapshot = await getDocs(staffCollection);
    const staff = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Create a more descriptive message with staff details
    let message = '';
    if (staff.length === 0) {
      message = 'There are no staff members in the database.';
    } else {
      // Get names and roles for staff
      const staffDetails = staff.map(person => {
        const name = person.name || 'Unnamed staff member';
        const role = person.role ? ` (${person.role})` : '';
        return `${name}${role}`;
      });
      
      message = `The agency employs ${staff.length} staff member${staff.length !== 1 ? 's' : ''}: ${staffDetails.join(', ')}.`;
    }
    
    return res.status(200).json({ 
      data: staff,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Search staff by criteria
export async function handleSearchStaff(res, args) {
  try {
    const { name, role, skill } = args;
    
    if (!name && !role && !skill) {
      return handleListStaff(res);
    }
    
    const staffCollection = collection(db, 'staff');
    
    // Get all staff first
    const snapshot = await getDocs(staffCollection);
    
    // Filter in memory
    let staff = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    if (name) {
      const nameLower = name.toLowerCase();
      staff = staff.filter(person => 
        person.name?.toLowerCase().includes(nameLower) || 
        // Keep backward compatibility with old records
        person.firstName?.toLowerCase().includes(nameLower) || 
        person.lastName?.toLowerCase().includes(nameLower)
      );
    }
    
    if (role) {
      const roleLower = role.toLowerCase();
      staff = staff.filter(person => 
        person.role?.toLowerCase().includes(roleLower)
      );
    }
    
    if (skill) {
      staff = staff.filter(person => 
        person.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
    }
    
    // Create a more descriptive message
    let message = '';
    if (staff.length === 0) {
      message = 'No staff members match your search criteria.';
    } else {
      const staffNames = staff.map(person => {
        // For backward compatibility
        const fullName = person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unnamed';
        const role = person.role ? ` (${person.role})` : '';
        return `${fullName}${role}`;
      }).join(', ');
      
      message = `Found ${staff.length} staff member${staff.length !== 1 ? 's' : ''}: ${staffNames}`;
      if (name) message += ` with name matching "${name}"`;
      if (role) message += ` in the role of "${role}"`;
      if (skill) message += ` with the skill "${skill}"`;
      message += '.';
    }
    
    return res.status(200).json({ 
      data: staff,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Get staff member by ID
export async function handleGetStaffById(res, args) {
  try {
    const { id } = args;
    
    if (!id) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }
    
    const staffDoc = doc(db, 'staff', id);
    const snapshot = await getDoc(staffDoc);
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        error: 'Staff member not found',
        message: `No staff member found with ID: ${id}`
      });
    }
    
    const staff = { id: snapshot.id, ...snapshot.data() };
    
    // For backward compatibility
    if (!staff.name && (staff.firstName || staff.lastName)) {
      staff.name = `${staff.firstName || ''} ${staff.lastName || ''}`.trim();
    }
    
    // Create a detailed message about the staff member
    const name = staff.name || 'Unnamed staff member';
    let message = `Found staff member: ${name}`;
    
    if (staff.role) {
      message += ` who works as a ${staff.role}`;
    }
    
    if (staff.skills && staff.skills.length > 0) {
      message += ` with skills in ${staff.skills.join(', ')}`;
    }
    
    if (staff.email || staff.phone) {
      message += `. Contact: `;
      if (staff.email) message += `${staff.email}`;
      if (staff.email && staff.phone) message += `, `;
      if (staff.phone) message += `${staff.phone}`;
    }
    
    return res.status(200).json({ 
      data: staff,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Create a new staff member
export async function handleCreateStaff(res, args) {
  try {
    const { name, firstName, lastName, email, phone, role, skills } = args;
    
    // Handle input with backward compatibility
    let staffName = name;
    
    // If no name but firstName/lastName are provided, create name
    if (!staffName && (firstName || lastName)) {
      staffName = `${firstName || ''} ${lastName || ''}`.trim();
    }
    
    // Ensure name field is provided
    if (!staffName) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Prepare the staff data - only using name field
    const staffData = {
      name: staffName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add optional fields
    if (email) staffData.email = email;
    if (phone) staffData.phone = phone;
    if (role) staffData.role = role;
    if (skills && Array.isArray(skills)) staffData.skills = skills;
    
    // Add to the staff collection
    const staffCollection = collection(db, 'staff');
    const newStaffRef = await addDoc(staffCollection, staffData);
    
    return res.status(201).json({ 
      data: { id: newStaffRef.id, ...staffData },
      message: `Created new staff member: ${staffName}${role ? ` (${role})` : ''}`
    });
  } catch (error) {
    throw error;
  }
}

// Update an existing staff member
export async function handleUpdateStaff(res, args) {
  try {
    const { id, name, firstName, lastName, email, phone, role, skills } = args;
    
    if (!id) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }
    
    // Check if staff exists
    const staffDoc = doc(db, 'staff', id);
    const snapshot = await getDoc(staffDoc);
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        error: 'Staff member not found',
        message: `No staff member found with ID: ${id}`
      });
    }
    
    // Prepare the update data
    const updateData = {
      updatedAt: serverTimestamp()
    };
    
    // Handle name with backward compatibility
    if (name !== undefined) {
      updateData.name = name;
    } else if (firstName !== undefined || lastName !== undefined) {
      // For backward compatibility
      const existingData = snapshot.data();
      updateData.name = `${firstName !== undefined ? firstName : existingData.firstName || ''} ${lastName !== undefined ? lastName : existingData.lastName || ''}`.trim();
    }
    
    // Add other fields that are provided
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (skills !== undefined && Array.isArray(skills)) updateData.skills = skills;
    
    // Update the document
    await updateDoc(staffDoc, updateData);
    
    // Get existing data for message
    const existingData = snapshot.data();
    const existingName = existingData.name || `${existingData.firstName || ''} ${existingData.lastName || ''}`.trim() || 'Unnamed';
    const displayName = updateData.name || existingName;
    
    return res.status(200).json({ 
      data: { id, ...updateData },
      message: `Updated staff member: ${displayName}${updateData.role || existingData.role ? ` (${updateData.role || existingData.role})` : ''}`
    });
  } catch (error) {
    throw error;
  }
} 