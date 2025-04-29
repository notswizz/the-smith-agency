import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Staff ID is required' });
  }

  const staffRef = doc(db, 'staff', id);

  switch (method) {
    case 'GET':
      try {
        const staffDoc = await getDoc(staffRef);
        
        if (!staffDoc.exists()) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        
        res.status(200).json({
          id: staffDoc.id,
          ...staffDoc.data()
        });
      } catch (error) {
        console.error('Error fetching staff member:', error);
        res.status(500).json({ error: 'Failed to fetch staff member' });
      }
      break;
      
    case 'PUT':
      try {
        const staffDoc = await getDoc(staffRef);
        
        if (!staffDoc.exists()) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        
        const updatedStaff = {
          ...req.body,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(staffRef, updatedStaff);
        
        res.status(200).json({
          id,
          ...updatedStaff
        });
      } catch (error) {
        console.error('Error updating staff member:', error);
        res.status(500).json({ error: 'Failed to update staff member' });
      }
      break;
      
    case 'DELETE':
      try {
        const staffDoc = await getDoc(staffRef);
        
        if (!staffDoc.exists()) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        
        await deleteDoc(staffRef);
        
        res.status(200).json({ message: 'Staff member deleted successfully' });
      } catch (error) {
        console.error('Error deleting staff member:', error);
        res.status(500).json({ error: 'Failed to delete staff member' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 