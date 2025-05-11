import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const bookingsCollection = collection(db, 'bookings');
        const snapshot = await getDocs(bookingsCollection);
        const bookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        res.status(200).json({
          type: "bookings",
          items: bookings
        });
      } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'An error occurred while fetching bookings' });
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