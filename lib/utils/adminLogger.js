// Admin Activity Logger
// Logs all admin actions to database with name, action, and timestamp

class AdminLogger {
  constructor() {
    this.adminName = null;
    this.initializeFromSession();
  }

  initializeFromSession() {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('tsa_admin_session');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          this.adminName = sessionData.adminName;
        } catch (e) {
          console.error('Error parsing admin session:', e);
        }
      }
    }
  }

  setAdminName(name) {
    this.adminName = name;
  }

  async logAction(action, details = {}) {
    if (!this.adminName) {
      this.initializeFromSession();
    }

    const logEntry = {
      adminName: this.adminName,
      action: action,
      details: details,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      ip: 'client-side', // Will be filled by server
    };

    try {
      // Send to API endpoint
      const response = await fetch('/api/admin-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Admin action logged:', action);
    } catch (error) {
      console.error('Failed to log admin action:', error);
      // Fallback to localStorage for critical actions
      this.fallbackLog(logEntry);
    }
  }

  fallbackLog(logEntry) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('admin_logs_fallback') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 100 logs to prevent localStorage overflow
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('admin_logs_fallback', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to write fallback log:', e);
    }
  }

  // Convenience methods for common actions
  async logLogin() {
    await this.logAction('LOGIN', { message: 'Admin logged into dashboard' });
  }

  async logLogout() {
    await this.logAction('LOGOUT', { message: 'Admin logged out of dashboard' });
  }

  async logCreate(resourceType, resourceId = null, data = {}) {
    await this.logAction('CREATE', {
      resourceType,
      resourceId,
      data,
      message: `Created new ${resourceType}${resourceId ? ` (ID: ${resourceId})` : ''}`
    });
  }

  async logUpdate(resourceType, resourceId, changes = {}) {
    await this.logAction('UPDATE', {
      resourceType,
      resourceId,
      changes,
      message: `Updated ${resourceType} (ID: ${resourceId})`
    });
  }

  async logDelete(resourceType, resourceId, data = {}) {
    await this.logAction('DELETE', {
      resourceType,
      resourceId,
      data,
      message: `Deleted ${resourceType} (ID: ${resourceId})`
    });
  }

  async logSearch(query, filters = {}) {
    await this.logAction('SEARCH', {
      query,
      filters,
      message: `Searched for: "${query}"`
    });
  }

  async logExport(dataType, count = null) {
    await this.logAction('EXPORT', {
      dataType,
      count,
      message: `Exported ${dataType}${count ? ` (${count} records)` : ''}`
    });
  }

  async logBulkAction(action, resourceType, count, ids = []) {
    await this.logAction('BULK_ACTION', {
      action,
      resourceType,
      count,
      ids,
      message: `Bulk ${action} on ${count} ${resourceType} records`
    });
  }

  async logCustomAction(actionName, description, data = {}) {
    await this.logAction('CUSTOM', {
      actionName,
      description,
      data,
      message: description
    });
  }

  // Get fallback logs (for debugging)
  getFallbackLogs() {
    try {
      return JSON.parse(localStorage.getItem('admin_logs_fallback') || '[]');
    } catch (e) {
      return [];
    }
  }

  // Clear fallback logs
  clearFallbackLogs() {
    localStorage.removeItem('admin_logs_fallback');
  }
}

// Create singleton instance
const adminLogger = new AdminLogger();

export default adminLogger;