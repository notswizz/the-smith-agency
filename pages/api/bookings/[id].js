import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  const bookingRef = doc(db, 'bookings', id);

  switch (method) {
    case 'GET':
      try {
        const bookingDoc = await getDoc(bookingRef);
        
        if (!bookingDoc.exists()) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.status(200).json({
          id: bookingDoc.id,
          ...bookingDoc.data()
        });
      } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
      }
      break;
      
    case 'PUT':
      try {
        const bookingDoc = await getDoc(bookingRef);
        
        if (!bookingDoc.exists()) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        const updatedBooking = {
          ...req.body,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(bookingRef, updatedBooking);
        
        res.status(200).json({
          id,
          ...updatedBooking
        });
      } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Failed to update booking' });
      }
      break;
      
    case 'DELETE':
      try {
        const bookingDoc = await getDoc(bookingRef);
        
        if (!bookingDoc.exists()) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        await deleteDoc(bookingRef);
        
        res.status(200).json({ message: 'Booking deleted successfully' });
      } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 