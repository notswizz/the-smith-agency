import { db } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';

class FirebaseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // BASIC CRUD OPERATIONS
  
  // Get all documents from a collection with caching
  async getAll(collectionName, useCache = true) {
    const cacheKey = `all_${collectionName}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (useCache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error(`Error fetching all ${collectionName}:`, error);
      throw error;
    }
  }

  // Get a single document by ID
  async getById(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Create a new document
  async create(collectionName, data) {
    try {
      const collectionRef = collection(db, collectionName);
      const newData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collectionRef, newData);
      
      // Clear cache for this collection
      this.clearCollectionCache(collectionName);
      
      return { id: docRef.id, ...newData };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Update a document by ID
  async update(collectionName, id, data) {
    try {
      const docRef = doc(db, collectionName, id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      // Clear cache for this collection
      this.clearCollectionCache(collectionName);
      
      return { id, ...updateData };
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete a document by ID
  async delete(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      
      // Clear cache for this collection
      this.clearCollectionCache(collectionName);
      
      return true;
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // ADVANCED QUERY OPERATIONS

  // Query documents with filters
  async query(collectionName, filters = [], orderField = null, orderDirection = 'asc', limitCount = null) {
    try {
      let q = collection(db, collectionName);

      // Apply filters
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      // Apply ordering
      if (orderField) {
        q = query(q, orderBy(orderField, orderDirection));
      }

      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw error;
    }
  }

  // Search documents by field value (case-insensitive partial match)
  async search(collectionName, field, searchTerm) {
    try {
      const allDocs = await this.getAll(collectionName);
      return allDocs.filter(doc => {
        const fieldValue = doc[field];
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    } catch (error) {
      console.error(`Error searching ${collectionName} by ${field}:`, error);
      throw error;
    }
  }

  // Find document by name (exact or partial match)
  async findByName(collectionName, name, exact = false) {
    try {
      const allDocs = await this.getAll(collectionName);
      const q = (name || '').toString().trim();
      const qLower = q.toLowerCase();

      if (exact) {
        // 1) Exact by display name
        let found = allDocs.find(doc => doc.name && doc.name.toLowerCase() === qLower);
        // 2) Exact by ID
        if (!found) {
          found = allDocs.find(doc => (doc.id || '').toString().toLowerCase() === qLower);
        }
        // 3) Fallback partial name/company/email
        if (!found) {
          found = allDocs.find(doc =>
            (doc.name && doc.name.toLowerCase().includes(qLower)) ||
            (doc.company && doc.company.toLowerCase().includes(qLower)) ||
            ((doc.email || '').toLowerCase() === qLower)
          );
        }
        return found || null;
      }

      // Non-exact: broader includes match across name/company/id/email
      return allDocs.filter(doc => {
        const idOk = (doc.id || '').toString().toLowerCase().includes(qLower);
        const nameOk = (doc.name || '').toString().toLowerCase().includes(qLower);
        const companyOk = (doc.company || '').toString().toLowerCase().includes(qLower);
        const emailOk = (doc.email || '').toString().toLowerCase().includes(qLower);
        return idOk || nameOk || companyOk || emailOk;
      });
    } catch (error) {
      console.error(`Error finding by name in ${collectionName}:`, error);
      throw error;
    }
  }

  // Get documents with pagination
  async getPaginated(collectionName, pageSize = 10, lastDoc = null, orderField = 'createdAt') {
    try {
      let q = query(
        collection(db, collectionName),
        orderBy(orderField),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        docs,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: docs.length === pageSize
      };
    } catch (error) {
      console.error(`Error getting paginated ${collectionName}:`, error);
      throw error;
    }
  }

  // BATCH OPERATIONS

  // Create multiple documents at once
  async batchCreate(collectionName, documents) {
    try {
      const batch = writeBatch(db);
      const results = [];

      documents.forEach(data => {
        const docRef = doc(collection(db, collectionName));
        const newData = {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        batch.set(docRef, newData);
        results.push({ id: docRef.id, ...newData });
      });

      await batch.commit();
      
      // Clear cache for this collection
      this.clearCollectionCache(collectionName);
      
      return results;
    } catch (error) {
      console.error(`Error batch creating in ${collectionName}:`, error);
      throw error;
    }
  }

  // Update multiple documents at once
  async batchUpdate(collectionName, updates) {
    try {
      const batch = writeBatch(db);

      updates.forEach(({ id, data }) => {
        const docRef = doc(db, collectionName, id);
        const updateData = {
          ...data,
          updatedAt: serverTimestamp()
        };
        batch.update(docRef, updateData);
      });

      await batch.commit();
      
      // Clear cache for this collection
      this.clearCollectionCache(collectionName);
      
      return true;
    } catch (error) {
      console.error(`Error batch updating in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete multiple documents at once
  async batchDelete(collectionName, ids) {
    try {
      const batch = writeBatch(db);

      ids.forEach(id => {
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
      });

      await batch.commit();
      
      // Clear cache for this collection
      this.clearCollectionCache(collectionName);
      
      return true;
    } catch (error) {
      console.error(`Error batch deleting from ${collectionName}:`, error);
      throw error;
    }
  }

  // TRANSACTION OPERATIONS

  // Run a transaction
  async runTransaction(transactionFn) {
    try {
      return await runTransaction(db, transactionFn);
    } catch (error) {
      console.error('Error running transaction:', error);
      throw error;
    }
  }

  // Transfer/move data between collections with transaction
  async transferDocument(fromCollection, toCollection, docId, transformFn = null) {
    try {
      return await runTransaction(db, async (transaction) => {
        const sourceRef = doc(db, fromCollection, docId);
        const sourceDoc = await transaction.get(sourceRef);

        if (!sourceDoc.exists()) {
          throw new Error(`Document ${docId} not found in ${fromCollection}`);
        }

        let data = sourceDoc.data();
        if (transformFn) {
          data = transformFn(data);
        }

        const targetRef = doc(collection(db, toCollection));
        transaction.set(targetRef, {
          ...data,
          transferredAt: serverTimestamp(),
          originalId: docId,
          originalCollection: fromCollection
        });
        
        transaction.delete(sourceRef);

        return { newId: targetRef.id, data };
      });
    } catch (error) {
      console.error('Error transferring document:', error);
      throw error;
    }
  }

  // REAL-TIME SUBSCRIPTIONS

  // Subscribe to collection changes
  subscribeToCollection(collectionName, callback, filters = []) {
    try {
      let q = collection(db, collectionName);

      // Apply filters
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(docs);
      });
    } catch (error) {
      console.error(`Error subscribing to ${collectionName}:`, error);
      throw error;
    }
  }

  // Subscribe to document changes
  subscribeToDocument(collectionName, docId, callback) {
    try {
      const docRef = doc(db, collectionName, docId);
      return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() });
        } else {
          callback(null);
        }
      });
    } catch (error) {
      console.error(`Error subscribing to document ${docId}:`, error);
      throw error;
    }
  }

  // ARRAY OPERATIONS

  // Add item to array field
  async addToArray(collectionName, docId, field, value) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        [field]: arrayUnion(value),
        updatedAt: serverTimestamp()
      });
      
      this.clearCollectionCache(collectionName);
      return true;
    } catch (error) {
      console.error(`Error adding to array in ${collectionName}:`, error);
      throw error;
    }
  }

  // Remove item from array field
  async removeFromArray(collectionName, docId, field, value) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        [field]: arrayRemove(value),
        updatedAt: serverTimestamp()
      });
      
      this.clearCollectionCache(collectionName);
      return true;
    } catch (error) {
      console.error(`Error removing from array in ${collectionName}:`, error);
      throw error;
    }
  }

  // INCREMENT/DECREMENT OPERATIONS

  // Increment a numeric field
  async incrementField(collectionName, docId, field, value = 1) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        [field]: increment(value),
        updatedAt: serverTimestamp()
      });
      
      this.clearCollectionCache(collectionName);
      return true;
    } catch (error) {
      console.error(`Error incrementing field in ${collectionName}:`, error);
      throw error;
    }
  }

  // UTILITY METHODS

  // Clear cache for a specific collection
  clearCollectionCache(collectionName) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(collectionName)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // COLLECTION-SPECIFIC HELPER METHODS

  // Bookings helpers
  async getBookingsByClient(clientName) {
    return await this.query('bookings', [
      { field: 'clientName', operator: '==', value: clientName }
    ]);
  }

  async getBookingsByShow(showName) {
    return await this.query('bookings', [
      { field: 'showName', operator: '==', value: showName }
    ]);
  }

  async getBookingsByStatus(status) {
    return await this.query('bookings', [
      { field: 'status', operator: '==', value: status }
    ]);
  }

  async getBookingsByDateRange(startDate, endDate) {
    return await this.query('bookings', [
      { field: 'assignedDate', operator: '>=', value: startDate },
      { field: 'assignedDate', operator: '<=', value: endDate }
    ]);
  }

  // Staff helpers
  async getStaffByRole(role) {
    return await this.query('staff', [
      { field: 'role', operator: '==', value: role }
    ]);
  }

  async getStaffBySkill(skill) {
    return await this.query('staff', [
      { field: 'skills', operator: 'array-contains', value: skill }
    ]);
  }

  // Shows helpers
  async getShowsByVenue(venue) {
    return await this.query('shows', [
      { field: 'venue', operator: '==', value: venue }
    ]);
  }

  async getShowsByStatus(status) {
    return await this.query('shows', [
      { field: 'status', operator: '==', value: status }
    ]);
  }

  async getUpcomingShows() {
    try {
      // Prefer computing in-memory to support both 'date' and 'startDate' schemas
      const today = new Date().toISOString().split('T')[0];
      const all = await this.getAll('shows');
      const inFuture = all.filter(show => {
        const single = show.date; // some docs use 'date'
        const start = show.startDate; // others use 'startDate'
        const candidate = typeof single === 'string' && single.length >= 10
          ? single.slice(0, 10)
          : (typeof start === 'string' && start.length >= 10 ? start.slice(0, 10) : null);
        return candidate && candidate >= today;
      });
      // Sort by earliest known date (date or startDate)
      inFuture.sort((a, b) => {
        const ad = (a.date || a.startDate || '').slice(0, 10);
        const bd = (b.date || b.startDate || '').slice(0, 10);
        return ad.localeCompare(bd);
      });
      return inFuture;
    } catch (e) {
      // Fallback to original query on 'date' if anything fails
      const today = new Date().toISOString().split('T')[0];
      return await this.query('shows', [
        { field: 'date', operator: '>=', value: today }
      ], 'date', 'asc');
    }
  }

  // Clients helpers
  async getClientsByCompany(company) {
    return await this.query('clients', [
      { field: 'company', operator: '==', value: company }
    ]);
  }
}

// Create and export a singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;

// Also export the class for direct instantiation if needed
export { FirebaseService };