import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from 'firebase/firestore';

// Get staff availability
export async function handleGetStaffAvailability(res, args) {
  try {
    const { staffId, staffName, showId } = args;
    
    // If neither staffId nor staffName is provided, return error
    if (!staffId && !staffName) {
      return res.status(400).json({ 
        error: 'Either staff ID or staff name is required',
        message: 'Please provide either a staff ID or staff name to check availability'
      });
    }
    
    // If staffName is provided but not staffId, we need to find the staff by name first
    let targetStaffId = staffId;
    let staffMember = null;
    
    if (!targetStaffId && staffName) {
      // Search for staff by name
      const staffCollection = collection(db, 'staff');
      const snapshot = await getDocs(staffCollection);
      
      const staffList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Find staff with matching name (case insensitive)
      const nameLower = staffName.toLowerCase();
      const matchingStaff = staffList.filter(person => 
        person.name?.toLowerCase().includes(nameLower) || 
        person.firstName?.toLowerCase().includes(nameLower) || 
        person.lastName?.toLowerCase().includes(nameLower)
      );
      
      if (matchingStaff.length === 0) {
        return res.status(404).json({ 
          error: 'Staff member not found',
          message: `No staff member found with name containing "${staffName}"`
        });
      }
      
      // Use the first matching staff
      staffMember = matchingStaff[0];
      targetStaffId = staffMember.id;
    }
    
    // Get availability records
    const availCollection = collection(db, 'availability');
    let q;
    
    if (showId) {
      // Get availability for specific staff and show
      q = query(
        availCollection,
        where('staffId', '==', targetStaffId),
        where('showId', '==', showId)
      );
    } else {
      // Get all availability records for this staff
      q = query(
        availCollection,
        where('staffId', '==', targetStaffId)
      );
    }
    
    const availSnapshot = await getDocs(q);
    
    if (availSnapshot.empty) {
      const staffDetails = staffMember?.name || targetStaffId;
      return res.status(200).json({ 
        data: [],
        message: `${staffDetails} has not submitted any availability${showId ? ` for the requested show (${showId})` : ''}. No dates are currently available.`
      });
    }
    
    // Get availability data
    const availabilityRecords = availSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }));
    
    const staffDetails = staffMember?.name || targetStaffId;
    let message = '';
    
    // Get all dates and organize them
    const allDates = availabilityRecords.flatMap(record => record.availableDates || []);
    
    if (allDates.length === 0) {
      message = `${staffDetails} has ${availabilityRecords.length} availability record(s), but no specific dates are recorded.`;
    } else {
      // Sort dates for a cleaner display
      const uniqueDates = [...new Set(allDates)].sort();
      
      // Get show names if available
      const showNames = availabilityRecords.map(record => 
        record.showName || `Show ${record.showId}`
      ).join(', ');
      
      message = `${staffDetails} is available on ${uniqueDates.length} day(s): ${uniqueDates.join(', ')}`;
      
      if (showId) {
        message += ` for the requested show.`;
      } else if (availabilityRecords.length > 1) {
        message += `. This availability is spread across the following shows: ${showNames}.`;
      } else {
        message += ` for ${showNames}.`;
      }
    }
    
    return res.status(200).json({ 
      data: availabilityRecords,
      message
    });
  } catch (error) {
    throw error;
  }
}

// Get available staff for a date
export async function handleGetAvailableStaffForDate(res, args) {
  try {
    const { showId, date } = args;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }
    
    const availCollection = collection(db, 'availability');
    let q;
    
    if (showId) {
      // Get availability for specific show
      q = query(availCollection, where('showId', '==', showId));
    } else {
      // Get all availability records
      q = availCollection;
    }
    
    const availSnapshot = await getDocs(q);
    
    if (availSnapshot.empty) {
      return res.status(200).json({ 
        data: [],
        message: showId 
          ? `No availability records found for show ${showId}.`
          : 'No availability records found.'
      });
    }
    
    // Filter for staff available on the specified date
    const availableStaff = [];
    
    for (const doc of availSnapshot.docs) {
      const record = { id: doc.id, ...doc.data() };
      
      if (record.availableDates && record.availableDates.includes(date)) {
        availableStaff.push({
          staffId: record.staffId,
          staffName: record.staffName,
          showId: record.showId,
          updatedAt: record.updatedAt?.toDate?.()?.toISOString() || null
        });
      }
    }
    
    let message;
    if (availableStaff.length === 0) {
      message = showId 
        ? `No staff members are available for show ${showId} on ${date}.`
        : `No staff members are available on ${date}.`;
    } else {
      const staffNames = availableStaff.map(staff => staff.staffName).join(', ');
      message = showId 
        ? `Found ${availableStaff.length} staff members available for show ${showId} on ${date}: ${staffNames}`
        : `Found ${availableStaff.length} staff members available on ${date}: ${staffNames}`;
    }
    
    return res.status(200).json({ 
      data: availableStaff,
      message
    });
  } catch (error) {
    throw error;
  }
} 