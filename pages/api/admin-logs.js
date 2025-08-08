import firebaseService from '@/lib/firebase/firebaseService';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get client IP address
      const forwarded = req.headers['x-forwarded-for'];
      const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress || 'Unknown';

      // Prepare log entry
      const logEntry = {
        ...req.body,
        ip: ip,
        serverTimestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'] || 'Unknown',
      };

      // Validate required fields
      if (!logEntry.adminName || !logEntry.action) {
        return res.status(400).json({
          error: 'Missing required fields: adminName and action are required'
        });
      }

      // Save to Firebase
      const result = await firebaseService.create('adminLogs', logEntry);

      res.status(200).json({
        success: true,
        id: result.id,
        message: 'Admin action logged successfully'
      });

    } catch (error) {
      console.error('Error logging admin action:', error);
      res.status(500).json({
        error: 'Failed to log admin action',
        details: error.message
      });
    }
  } else if (req.method === 'GET') {
    try {
      // Get admin logs with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const adminName = req.query.adminName;
      const action = req.query.action;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      // Build filters
      const filters = [];
      if (adminName) {
        filters.push({ field: 'adminName', operator: '==', value: adminName });
      }
      if (action) {
        filters.push({ field: 'action', operator: '==', value: action });
      }
      if (startDate) {
        filters.push({ field: 'serverTimestamp', operator: '>=', value: startDate });
      }
      if (endDate) {
        filters.push({ field: 'serverTimestamp', operator: '<=', value: endDate });
      }

      // Get logs
      const logs = await firebaseService.query(
        'adminLogs',
        filters,
        'serverTimestamp',
        'desc',
        limit * page
      );

      // Paginate results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLogs = logs.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        logs: paginatedLogs,
        pagination: {
          page: page,
          limit: limit,
          total: logs.length,
          hasMore: endIndex < logs.length
        }
      });

    } catch (error) {
      console.error('Error fetching admin logs:', error);
      res.status(500).json({
        error: 'Failed to fetch admin logs',
        details: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}