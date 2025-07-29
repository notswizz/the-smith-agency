import firebaseService from '@/lib/firebase/firebaseService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;

    let result;
    switch (action) {
      case 'update_staff_name':
        result = await firebaseService.update('staff', data.id, { name: data.newName });
        break;
      
      case 'update_client_name':
        result = await firebaseService.update('clients', data.id, { name: data.newName });
        break;
      
      case 'create_booking':
        result = await firebaseService.create('bookings', data);
        break;
      
      case 'update_booking_status':
        result = await firebaseService.update('bookings', data.id, { status: data.status });
        break;
      
      case 'delete_record':
        result = await firebaseService.delete(data.collection, data.id);
        break;
      
      case 'create_staff':
        result = await firebaseService.create('staff', data);
        break;
      
      case 'create_client':
        result = await firebaseService.create('clients', data);
        break;
      
      case 'create_show':
        result = await firebaseService.create('shows', data);
        break;
      
      case 'update_staff':
        const { id: staffId, ...staffData } = data;
        // Filter out null, undefined, and empty string values to avoid overwriting existing data
        const cleanStaffData = Object.fromEntries(
          Object.entries(staffData).filter(([key, value]) => 
            value !== null && value !== undefined && value !== ''
          )
        );
        result = await firebaseService.update('staff', staffId, cleanStaffData);
        break;
      
      case 'update_client':
        const { id: clientId, ...clientData } = data;
        // Filter out null, undefined, and empty string values to avoid overwriting existing data
        const cleanClientData = Object.fromEntries(
          Object.entries(clientData).filter(([key, value]) => 
            value !== null && value !== undefined && value !== ''
          )
        );
        result = await firebaseService.update('clients', clientId, cleanClientData);
        break;
      
      case 'update_show':
        const { id: showId, ...showData } = data;
        // Filter out null, undefined, and empty string values to avoid overwriting existing data
        const cleanShowData = Object.fromEntries(
          Object.entries(showData).filter(([key, value]) => 
            value !== null && value !== undefined && value !== ''
          )
        );
        result = await firebaseService.update('shows', showId, cleanShowData);
        break;
      
      case 'batch_create':
        result = await firebaseService.batchCreate(data.collection, data.records);
        break;
      
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.status(200).json({
      success: true,
      message: 'Action executed successfully',
      data: result
    });

  } catch (error) {
    console.error('Action execution error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}