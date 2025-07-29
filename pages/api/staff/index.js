import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const staffCollection = collection(db, 'staff');
        const snapshot = await getDocs(staffCollection);
        
        const staff = snapshot.docs.map(doc => {
          const data = doc.data();
          const staffRecord = {
            id: doc.id,
            ...data
          };
          
          
          return staffRecord;
        });
        
        res.status(200).json(staff);
      } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ error: 'Failed to fetch staff' });
      }
      break;
      
    case 'POST':
      try {
        const staffCollection = collection(db, 'staff');
        const newStaff = {
          ...req.body,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(staffCollection, newStaff);
        res.status(201).json({ 
          id: docRef.id,
          ...newStaff
        });
      } catch (error) {
        console.error('Error creating staff member:', error);
        res.status(500).json({ error: 'Failed to create staff member' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 