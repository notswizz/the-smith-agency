import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Client ID is required' });
  }

  const clientRef = doc(db, 'clients', id);

  switch (method) {
    case 'GET':
      try {
        const clientDoc = await getDoc(clientRef);
        
        if (!clientDoc.exists()) {
          return res.status(404).json({ error: 'Client not found' });
        }
        
        res.status(200).json({
          id: clientDoc.id,
          ...clientDoc.data()
        });
      } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
      }
      break;
      
    case 'PUT':
      try {
        const clientDoc = await getDoc(clientRef);
        
        if (!clientDoc.exists()) {
          return res.status(404).json({ error: 'Client not found' });
        }
        
        const updatedClient = {
          ...req.body,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(clientRef, updatedClient);
        
        res.status(200).json({
          id,
          ...updatedClient
        });
      } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
      }
      break;
      
    case 'DELETE':
      try {
        const clientDoc = await getDoc(clientRef);
        
        if (!clientDoc.exists()) {
          return res.status(404).json({ error: 'Client not found' });
        }
        
        await deleteDoc(clientRef);
        
        res.status(200).json({ message: 'Client deleted successfully' });
      } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 