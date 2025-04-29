import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'POST': {
      try {
        // Save or update staff availability for a show
        const { staffId, showId, availableDates, staffName } = req.body;
        
        // Validate required fields
        if (!staffId) {
          return res.status(400).json({ error: 'Staff ID is required' });
        }
        if (!showId) {
          return res.status(400).json({ error: 'Show ID is required' });
        }
        if (!Array.isArray(availableDates)) {
          return res.status(400).json({ error: 'Available dates must be an array' });
        }
        if (!staffName) {
          return res.status(400).json({ error: 'Staff name is required' });
        }

        // Validate date format
        for (const date of availableDates) {
          if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
          }
        }

        const availCollection = collection(db, 'availability');
        
        // Check if an entry already exists for this staff/show
        const q = query(
          availCollection, 
          where('staffId', '==', staffId), 
          where('showId', '==', showId)
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          // Update existing document
          const docRef = doc(db, 'availability', snapshot.docs[0].id);
          const updateData = {
            availableDates,
            staffName,
            updatedAt: serverTimestamp()
          };
          
          await updateDoc(docRef, updateData);
          
          return res.status(200).json({
            id: docRef.id,
            staffId,
            showId,
            ...updateData,
            updatedAt: new Date().toISOString()
          });
        } else {
          // Create new document
          const newDocData = {
            staffId,
            showId,
            availableDates,
            staffName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          const newDoc = await addDoc(availCollection, newDocData);
          
          return res.status(201).json({
            id: newDoc.id,
            ...newDocData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error saving availability:', error);
        return res.status(500).json({ 
          error: 'Failed to save availability',
          details: error.message 
        });
      }
    }

    case 'GET': {
      try {
        const availCollection = collection(db, 'availability');
        const snapshot = await getDocs(availCollection);
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: docData.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: docData.updatedAt?.toDate?.()?.toISOString() || null
          };
        });
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error fetching availability:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch availability',
          details: error.message 
        });
      }
    }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
