import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Show ID is required' });
  }

  const showRef = doc(db, 'shows', id);

  switch (method) {
    case 'GET':
      try {
        const showDoc = await getDoc(showRef);
        
        if (!showDoc.exists()) {
          return res.status(404).json({ error: 'Show not found' });
        }
        
        res.status(200).json({
          id: showDoc.id,
          ...showDoc.data()
        });
      } catch (error) {
        console.error('Error fetching show:', error);
        res.status(500).json({ error: 'Failed to fetch show' });
      }
      break;
      
    case 'PUT':
      try {
        const showDoc = await getDoc(showRef);
        
        if (!showDoc.exists()) {
          return res.status(404).json({ error: 'Show not found' });
        }
        
        const updatedShow = {
          ...req.body,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(showRef, updatedShow);
        
        res.status(200).json({
          id,
          ...updatedShow
        });
      } catch (error) {
        console.error('Error updating show:', error);
        res.status(500).json({ error: 'Failed to update show' });
      }
      break;
      
    case 'DELETE':
      try {
        const showDoc = await getDoc(showRef);
        
        if (!showDoc.exists()) {
          return res.status(404).json({ error: 'Show not found' });
        }
        
        await deleteDoc(showRef);
        
        res.status(200).json({ message: 'Show deleted successfully' });
      } catch (error) {
        console.error('Error deleting show:', error);
        res.status(500).json({ error: 'Failed to delete show' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 