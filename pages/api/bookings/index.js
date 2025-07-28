import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (method) {
    case 'GET':
      try {
        console.log('Fetching bookings from Firestore...');
        
        if (!db) {
          console.error('Database connection not initialized');
          return res.status(500).json({ error: 'Database connection failed' });
        }

        const bookingsCollection = collection(db, 'bookings');
        console.log('Collection reference created');
        
        const snapshot = await getDocs(bookingsCollection);
        console.log(`Found ${snapshot.size} booking documents`);
        
        const bookings = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore timestamps to ISO strings
          const processedData = {};
          Object.keys(data).forEach(key => {
            if (data[key] && typeof data[key].toDate === 'function') {
              processedData[key] = data[key].toDate().toISOString();
            } else {
              processedData[key] = data[key];
            }
          });
          
          return {
            id: doc.id,
            ...processedData
          };
        });
        
        console.log('Successfully processed bookings data');
        res.status(200).json({
          type: "bookings",
          items: bookings
        });
      } catch (error) {
        console.error('Detailed error fetching bookings:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          details: error.details
        });
        res.status(500).json({ 
          error: 'An error occurred while fetching bookings',
          details: error.message
        });
      }
      break;
      
    case 'POST':
      try {
        const bookingsCollection = collection(db, 'bookings');
        
        // Format dates and ensure consistent data format
        const bookingData = {
          ...req.body,
          assignedDate: req.body.assignedDate || new Date().toISOString().split('T')[0],
          status: req.body.status || 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(bookingsCollection, bookingData);
        res.status(201).json({ 
          id: docRef.id,
          ...bookingData
        });
      } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 