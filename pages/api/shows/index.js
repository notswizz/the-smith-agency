import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const showsCollection = collection(db, 'shows');
        const snapshot = await getDocs(showsCollection);
        const shows = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        res.status(200).json(shows);
      } catch (error) {
        console.error('Error fetching shows:', error);
        res.status(500).json({ error: 'Failed to fetch shows' });
      }
      break;
      
    case 'POST':
      try {
        const showsCollection = collection(db, 'shows');
        
        // Format dates to ensure consistency
        const showData = {
          ...req.body,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(showsCollection, showData);
        res.status(201).json({ 
          id: docRef.id,
          ...showData
        });
      } catch (error) {
        console.error('Error creating show:', error);
        res.status(500).json({ error: 'Failed to create show' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 