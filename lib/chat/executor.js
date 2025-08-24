import firebaseService from '@/lib/firebase/firebaseService';
import { sanitizeForDisplay } from '@/lib/chat/sanitize';

export async function executeChatFunction(name, args) {
  switch (name) {
    case 'get_bookings':
      if (args.clientName) return sanitizeForDisplay(await firebaseService.getBookingsByClient(args.clientName));
      if (args.showName) return sanitizeForDisplay(await firebaseService.getBookingsByShow(args.showName));
      if (args.status) return sanitizeForDisplay(await firebaseService.getBookingsByStatus(args.status));
      if (args.startDate && args.endDate) return sanitizeForDisplay(await firebaseService.getBookingsByDateRange(args.startDate, args.endDate));
      return sanitizeForDisplay(await firebaseService.getAll('bookings'));

    case 'get_staff':
      if (args.role) return sanitizeForDisplay(await firebaseService.getStaffByRole(args.role));
      if (args.skill) return sanitizeForDisplay(await firebaseService.getStaffBySkill(args.skill));
      return sanitizeForDisplay(await firebaseService.getAll('staff'));

    case 'get_clients':
      if (args.company) return sanitizeForDisplay(await firebaseService.getClientsByCompany(args.company));
      return sanitizeForDisplay(await firebaseService.getAll('clients'));

    case 'get_shows':
      if (args.venue) return sanitizeForDisplay(await firebaseService.getShowsByVenue(args.venue));
      if (args.status) return sanitizeForDisplay(await firebaseService.getShowsByStatus(args.status));
      if (args.upcoming) return sanitizeForDisplay(await firebaseService.getUpcomingShows());
      return sanitizeForDisplay(await firebaseService.getAll('shows'));

    case 'search_records':
      return sanitizeForDisplay(await firebaseService.search(args.collection, args.field, args.searchTerm));

    case 'query_collection': {
      const all = await firebaseService.getAll(args.collection);
      let rows = Array.isArray(all) ? [...all] : [];

      // Optional in-memory filters
      if (Array.isArray(args.filters)) {
        const ops = {
          '==': (a, b) => a === b,
          '!=': (a, b) => a !== b,
          '>': (a, b) => a > b,
          '<': (a, b) => a < b,
          '>=': (a, b) => a >= b,
          '<=': (a, b) => a <= b,
          'contains': (a, b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase().includes(b.toLowerCase()),
          'in': (a, b) => Array.isArray(b) && b.includes(a),
          'array_contains': (a, b) => Array.isArray(a) && a.includes(b)
        };
        rows = rows.filter(r => args.filters.every(f => {
          const val = r[f.field];
          const fn = ops[f.op];
          return fn ? fn(val, f.value) : true;
        }));
      }

      // Optional date range on a direct field
      if (args.dateRange && args.dateRange.field) {
        const { field, startDate, endDate } = args.dateRange;
        rows = rows.filter(r => {
          const v = r[field];
          if (!v) return false;
          const d = new Date(v).toISOString().split('T')[0];
          if (startDate && d < startDate) return false;
          if (endDate && d > endDate) return false;
          return true;
        });
      }

      // Optional ordering
      if (args.orderBy && args.orderBy.field) {
        const { field, direction } = args.orderBy;
        rows.sort((a, b) => {
          const av = a[field];
          const bv = b[field];
          if (av === bv) return 0;
          return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1);
        });
      }

      // Optional projection
      if (Array.isArray(args.select) && args.select.length > 0) {
        rows = rows.map(r => Object.fromEntries(args.select.filter(Boolean).map(k => [k, r[k]])));
      }

      // Optional expansion for bookings and availability
      if (args.expand) {
        if (args.collection === 'bookings') {
          const { expandClientName, expandShowName, expandStaffNames } = args.expand;
          const [clients, shows, staff] = await Promise.all([
            expandClientName ? firebaseService.getAll('clients') : Promise.resolve([]),
            expandShowName ? firebaseService.getAll('shows') : Promise.resolve([]),
            expandStaffNames ? firebaseService.getAll('staff') : Promise.resolve([])
          ]);
          const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
          const showMap = Object.fromEntries(shows.map(s => [s.id, s.name]));
          const staffMap = Object.fromEntries(staff.map(s => [s.id, s.name]));
          rows = rows.map(r => {
            const out = { ...r };
            if (expandClientName && r.clientId) out.clientName = clientMap[r.clientId] || out.clientName;
            if (expandShowName && r.showId) out.showName = showMap[r.showId] || out.showName;
            if (expandStaffNames && Array.isArray(r.datesNeeded)) {
              out.datesNeeded = r.datesNeeded.map(dn => ({
                ...dn,
                staffNames: Array.isArray(dn.staffIds) ? dn.staffIds.map(id => staffMap[id]).filter(Boolean) : []
              }));
            }
            return out;
          });
        } else if (args.collection === 'availability') {
          const { expandStaffName, expandAvailabilityShowName } = args.expand;
          const [staff, shows] = await Promise.all([
            expandStaffName ? firebaseService.getAll('staff') : Promise.resolve([]),
            expandAvailabilityShowName ? firebaseService.getAll('shows') : Promise.resolve([])
          ]);
          const staffMap = Object.fromEntries(staff.map(s => [s.id, s.name]));
          const showMap = Object.fromEntries(shows.map(s => [s.id, s.name]));
          rows = rows.map(r => {
            const out = { ...r };
            if (expandStaffName && r.staffId && !out.staffName) out.staffName = staffMap[r.staffId] || out.staffName;
            if (expandAvailabilityShowName && r.showId && !out.showName) out.showName = showMap[r.showId] || out.showName;
            return out;
          });
        }
      }

      // Optional limit
      if (typeof args.limit === 'number') {
        rows = rows.slice(0, args.limit);
      }

      return sanitizeForDisplay(rows);
    }

    case 'create_booking':
      return {
        __action: {
          id: `create_booking_${Date.now()}`,
          type: 'create_booking',
          label: `Create Booking for ${args.clientName}`,
          successMessage: `Successfully created booking for ${args.clientName}`,
          data: args
        },
        message: `Ready to create booking for ${args.clientName} on ${args.assignedDate}. Click the button below to confirm.`,
        preview: args
      };

    case 'create_staff':
      return {
        __action: {
          id: `create_staff_${Date.now()}`,
          type: 'create_staff',
          label: `Create Staff: ${args.name}`,
          successMessage: `Successfully created staff member ${args.name}`,
          data: args
        },
        message: `Ready to create staff member ${args.name}. Click the button below to confirm.`,
        preview: args
      };

    case 'create_client':
      return {
        __action: {
          id: `create_client_${Date.now()}`,
          type: 'create_client',
          label: `Create Client: ${args.name}`,
          successMessage: `Successfully created client ${args.name}`,
          data: args
        },
        message: `Ready to create client ${args.name}. Click the button below to confirm.`,
        preview: args
      };

    case 'create_show':
      return {
        __action: {
          id: `create_show_${Date.now()}`,
          type: 'create_show',
          label: `Create Show: ${args.name}`,
          successMessage: `Successfully created show ${args.name}`,
          data: args
        },
        message: `Ready to create show ${args.name} on ${args.date}. Click the button below to confirm.`,
        preview: args
      };

    case 'update_booking': {
      const { id: bookingIdUpdate, updates: bookingExtraUpdates, ...bookingExplicit } = args;
      const combinedBookingUpdates = { ...bookingExplicit, ...(bookingExtraUpdates || {}) };
      const cleanBookingUpdates = Object.fromEntries(
        Object.entries(combinedBookingUpdates).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );
      return {
        __action: {
          id: `update_booking_${Date.now()}`,
          type: 'update_booking',
          label: `Update booking ${bookingIdUpdate}`,
          successMessage: `Successfully updated booking ${bookingIdUpdate}`,
          data: { id: bookingIdUpdate, ...cleanBookingUpdates }
        },
        message: `Ready to update booking ${bookingIdUpdate}. Click the button below to confirm.`,
        preview: { updates: cleanBookingUpdates }
      };
    }

    case 'update_staff': {
      const { id: staffId, ...staffUpdateData } = args;
      return await firebaseService.update('staff', staffId, staffUpdateData);
    }

    case 'update_client': {
      const { id: clientId, ...clientUpdateData } = args;
      return await firebaseService.update('clients', clientId, clientUpdateData);
    }

    case 'update_show': {
      const { id: showId, ...showUpdateData } = args;
      return await firebaseService.update('shows', showId, showUpdateData);
    }

    case 'get_document_by_id':
      return sanitizeForDisplay(await firebaseService.getById(args.collection, args.id));

    case 'find_staff_by_name':
      return sanitizeForDisplay(await firebaseService.findByName('staff', args.name, true));

    case 'find_client_by_name':
      return sanitizeForDisplay(await firebaseService.findByName('clients', args.name, true));

    case 'update_staff_by_name': {
      const { name: staffName, ...staffUpdateByNameData } = args;
      const staffDoc = await firebaseService.findByName('staff', staffName, true);
      if (!staffDoc) {
        const similarStaff = await firebaseService.findByName('staff', staffName, false);
        const suggestions = similarStaff.slice(0, 3).map(s => s.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`Staff member "${staffName}" not found.${suggestionText} Please check the name and try again.`);
      }

      const { updates: extraUpdates, newName, ...explicitFields } = staffUpdateByNameData;
      const mergedUpdates = { ...explicitFields };
      if (newName) mergedUpdates.name = newName;
      const combined = { ...mergedUpdates, ...(extraUpdates || {}) };
      const cleanUpdateData = Object.fromEntries(
        Object.entries(combined).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );

      return {
        __action: {
          id: `update_staff_${Date.now()}`,
          type: 'update_staff',
          label: `Update ${staffDoc.name}`,
          successMessage: `Successfully updated ${staffDoc.name}`,
          data: { id: staffDoc.id, ...cleanUpdateData }
        },
        message: `Ready to update ${staffDoc.name}. Click the button below to confirm.`,
        preview: { current: staffDoc, updates: cleanUpdateData }
      };
    }

    case 'update_client_by_name': {
      const { name: clientName, ...clientUpdateByNameData } = args;
      const clientDoc = await firebaseService.findByName('clients', clientName, true);
      if (!clientDoc) {
        const similarClients = await firebaseService.findByName('clients', clientName, false);
        const suggestions = similarClients.slice(0, 3).map(c => c.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`Client "${clientName}" not found.${suggestionText} Please check the name and try again.`);
      }

      const { updates: extraClientUpdates, ...explicitClientFields } = clientUpdateByNameData;
      const combinedClient = { ...explicitClientFields, ...(extraClientUpdates || {}) };
      const cleanClientUpdateData = Object.fromEntries(
        Object.entries(combinedClient).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );

      return {
        __action: {
          id: `update_client_${Date.now()}`,
          type: 'update_client',
          label: `Update ${clientDoc.name}`,
          successMessage: `Successfully updated ${clientDoc.name}`,
          data: { id: clientDoc.id, ...cleanClientUpdateData }
        },
        message: `Ready to update ${clientDoc.name}. Click the button below to confirm.`,
        preview: { current: clientDoc, updates: cleanClientUpdateData }
      };
    }

    case 'batch_create':
      return sanitizeForDisplay(await firebaseService.batchCreate(args.collection, args.records));

    case 'get_analytics':
      return await getAnalytics(args.type, args);

    case 'delete_record':
      return await firebaseService.delete(args.collection, args.id);

    case 'list_names': {
      const allRecords = await firebaseService.getAll(args.collection);
      return sanitizeForDisplay(allRecords.map(record => ({ id: record.id, name: record.name })).filter(record => record.name));
    }

    case 'update_mentioned_staff': {
      const { mentionedName, ...updateData } = args;
      const mentionedStaffDoc = await firebaseService.findByName('staff', mentionedName, true);
      if (!mentionedStaffDoc) {
        const similarStaff = await firebaseService.findByName('staff', mentionedName, false);
        const suggestions = similarStaff.slice(0, 3).map(s => s.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`Staff member "${mentionedName}" not found.${suggestionText} Please check the name and try again.`);
      }

      const { updates: extraMentionUpdates, newName: mentionNewName, ...mentionExplicit } = updateData;
      const mergedMention = { ...mentionExplicit };
      if (mentionNewName) mergedMention.name = mentionNewName;
      const combinedMention = { ...mergedMention, ...(extraMentionUpdates || {}) };
      const cleanMentionUpdateData = Object.fromEntries(
        Object.entries(combinedMention).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );

      return {
        __action: {
          id: `update_mentioned_staff_${Date.now()}`,
          type: 'update_staff',
          label: `Update ${mentionedStaffDoc.name}`,
          successMessage: `Successfully updated ${mentionedStaffDoc.name}`,
          data: { id: mentionedStaffDoc.id, ...cleanMentionUpdateData }
        },
        message: `Ready to update ${mentionedStaffDoc.name}. Click the button below to confirm.`,
        preview: { current: mentionedStaffDoc, updates: cleanMentionUpdateData }
      };
    }

    case 'update_mentioned_show': {
      const { mentionedName, updates: extraShowUpdates, newName: newShowName, ...explicitShow } = args;
      // Find by exact show name
      const shows = await firebaseService.getAll('shows');
      let showDoc = shows.find(s => s.name && s.name.toLowerCase() === mentionedName.toLowerCase());
      if (!showDoc) {
        showDoc = shows.find(s => s.name && s.name.toLowerCase().includes(mentionedName.toLowerCase()));
      }
      if (!showDoc) {
        const suggestions = shows.filter(s => s.name).slice(0, 3).map(s => s.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`Show "${mentionedName}" not found.${suggestionText} Please check the name and try again.`);
      }

      const mergedShow = { ...explicitShow };
      if (newShowName) mergedShow.name = newShowName;
      const combinedShow = { ...mergedShow, ...(extraShowUpdates || {}) };
      const cleanShowUpdateData = Object.fromEntries(
        Object.entries(combinedShow).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );

      return {
        __action: {
          id: `update_show_${Date.now()}`,
          type: 'update_show',
          label: `Update ${showDoc.name}`,
          successMessage: `Successfully updated ${showDoc.name}`,
          data: { id: showDoc.id, ...cleanShowUpdateData }
        },
        message: `Ready to update ${showDoc.name}. Click the button below to confirm.`,
        preview: { current: showDoc, updates: cleanShowUpdateData }
      };
    }

    case 'update_record':
      return {
        __action: {
          id: `update_record_${Date.now()}`,
          type: 'update_record',
          label: `Update ${args.collection} ${args.id}`,
          successMessage: `Successfully updated ${args.collection} ${args.id}`,
          data: { collection: args.collection, id: args.id, updates: args.updates }
        },
        message: `Ready to update ${args.collection} ${args.id}. Click the button below to confirm.`,
        preview: { updates: args.updates }
      };

    case 'update_record_by_name': {
      if (!['staff', 'clients'].includes(args.collection)) {
        throw new Error(`update_record_by_name only supports 'staff' or 'clients' collections`);
      }
      const doc = await firebaseService.findByName(args.collection, args.name, true);
      if (!doc) {
        const similar = await firebaseService.findByName(args.collection, args.name, false);
        const suggestions = similar.slice(0, 3).map(s => s.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`${args.collection.slice(0, -1)} "${args.name}" not found.${suggestionText} Please check the name and try again.`);
      }
      return {
        __action: {
          id: `update_${args.collection}_${Date.now()}`,
          type: `update_${args.collection === 'staff' ? 'staff' : 'client'}`,
          label: `Update ${doc.name}`,
          successMessage: `Successfully updated ${doc.name}`,
          data: { id: doc.id, ...args.updates }
        },
        message: `Ready to update ${doc.name}. Click the button below to confirm.`,
        preview: { current: doc, updates: args.updates }
      };
    }

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

async function getAnalytics(type, options = {}) {
  switch (type) {
    case 'summary': {
      const [bookings, staff, clients, shows] = await Promise.all([
        firebaseService.getAll('bookings'),
        firebaseService.getAll('staff'),
        firebaseService.getAll('clients'),
        firebaseService.getAll('shows')
      ]);
      return {
        totalBookings: bookings.length,
        totalStaff: staff.length,
        totalClients: clients.length,
        totalShows: shows.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        upcomingShows: shows.filter(s => new Date(s.date) > new Date()).length
      };
    }
    case 'bookings_by_status': {
      const allBookings = await firebaseService.getAll('bookings');
      const statusCounts = {};
      allBookings.forEach(booking => {
        statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
      });
      return statusCounts;
    }
    case 'staff_by_role': {
      const allStaff = await firebaseService.getAll('staff');
      const roleCounts = {};
      allStaff.forEach(staff => {
        roleCounts[staff.role] = (roleCounts[staff.role] || 0) + 1;
      });
      return roleCounts;
    }
    case 'upcoming_shows':
      return await firebaseService.getUpcomingShows();
    case 'top_staff_by_days': {
      const staff = await firebaseService.getAll('staff');
      const bookings = await firebaseService.getAll('bookings');
      const { startDate, endDate, limit } = options || {};
      const inRange = (dateStr) => {
        if (!startDate && !endDate) return true;
        if (!dateStr) return false;
        const d = new Date(dateStr).toISOString().split('T')[0];
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      };

      const counts = {};
      bookings.forEach(booking => {
        if (Array.isArray(booking.datesNeeded)) {
          booking.datesNeeded.forEach(dn => {
            if (!inRange(dn.date)) return;
            const ids = Array.isArray(dn.staffIds) ? dn.staffIds.filter(Boolean) : [];
            ids.forEach(staffId => {
              counts[staffId] = (counts[staffId] || 0) + 1;
            });
          });
        }
      });

      const ranked = Object.entries(counts)
        .map(([staffId, days]) => {
          const s = staff.find(st => st.id === staffId) || {};
          return { staffId, staffName: s.name || 'Unknown', days };
        })
        .sort((a, b) => b.days - a.days);

      const top = typeof limit === 'number' ? ranked.slice(0, limit) : ranked;
      return top;
    }
    default:
      throw new Error(`Unknown analytics type: ${type}`);
  }
}


