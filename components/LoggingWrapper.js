import { useEffect } from 'react';
import { useRouter } from 'next/router';
import adminLogger from '@/lib/utils/adminLogger';

// Higher-order component to automatically log page views and common actions
export function withLogging(Component, pageName) {
  return function LoggedComponent(props) {
    useEffect(() => {
      if (pageName) {
        adminLogger.logPageView(pageName);
      }
    }, []);

    return <Component {...props} />;
  };
}

// Hook for logging actions within components
export function useAdminLogger() {
  const router = useRouter();

  const logAction = async (action, details = {}) => {
    await adminLogger.logAction(action, {
      ...details,
      page: router.pathname,
      route: router.asPath
    });
  };

  const logCreate = async (resourceType, resourceId = null, data = {}) => {
    await adminLogger.logCreate(resourceType, resourceId, {
      ...data,
      page: router.pathname
    });
  };

  const logUpdate = async (resourceType, resourceId, changes = {}) => {
    await adminLogger.logUpdate(resourceType, resourceId, {
      ...changes,
      page: router.pathname
    });
  };

  const logDelete = async (resourceType, resourceId, data = {}) => {
    await adminLogger.logDelete(resourceType, resourceId, {
      ...data,
      page: router.pathname
    });
  };

  const logSearch = async (query, filters = {}) => {
    await adminLogger.logSearch(query, {
      ...filters,
      page: router.pathname
    });
  };

  const logExport = async (dataType, count = null) => {
    await adminLogger.logExport(dataType, count);
  };

  const logBulkAction = async (action, resourceType, count, ids = []) => {
    await adminLogger.logBulkAction(action, resourceType, count, ids);
  };

  const logCustomAction = async (actionName, description, data = {}) => {
    await adminLogger.logCustomAction(actionName, description, {
      ...data,
      page: router.pathname
    });
  };

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logSearch,
    logExport,
    logBulkAction,
    logCustomAction
  };
}

// Component to automatically log page views
export function PageLogger({ pageName, children }) {
  useEffect(() => {
    if (pageName) {
      adminLogger.logPageView(pageName);
    }
  }, [pageName]);

  return children || null;
}