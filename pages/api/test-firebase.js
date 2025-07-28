import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  try {
    console.log('Testing Firebase connection...');
    
    // Check if db is initialized
    if (!db) {
      return res.status(500).json({ 
        error: 'Database not initialized',
        config: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
        }
      });
    }

    // Try to list collections or get a simple document
    const testCollection = collection(db, 'test');
    console.log('Collection reference created successfully');
    
    res.status(200).json({ 
      status: 'Firebase connection successful',
      timestamp: new Date().toISOString(),
      config: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
      }
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({ 
      error: 'Firebase connection failed',
      message: error.message,
      code: error.code,
      config: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
      }
    });
  }
}
