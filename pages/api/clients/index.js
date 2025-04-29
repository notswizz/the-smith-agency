import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const clientsCollection = collection(db, 'clients');
        const snapshot = await getDocs(clientsCollection);
        const clients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        res.status(200).json(clients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
      }
      break;
      
    case 'POST':
      try {
        const clientsCollection = collection(db, 'clients');
        const newClient = {
          ...req.body,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(clientsCollection, newClient);
        res.status(201).json({ 
          id: docRef.id,
          ...newClient
        });
      } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 