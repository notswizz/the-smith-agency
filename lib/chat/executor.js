import firebaseService from '@/lib/firebase/firebaseService';
import { sanitizeForDisplay, normalizeTimestampsDeep } from '@/lib/chat/sanitize';

function normalizeStaffUpdates(currentDoc, proposed) {
  if (!proposed || typeof proposed !== 'object') return {};
  const allowedFields = new Set([
    'name', 'email', 'phone', 'role', 'skills', 'sizes', 'address', 'college', 'dressSize', 'shoeSize', 'badges', 'payRate', 'instagram', 'notes',
    'applicationFormData', 'applicationFormApproved', 'applicationFormApprovedDate', 'applicationFormCompleted', 'applicationFormCompletedDate', 'image',
    'interviewFormApproved', 'interviewFormCompleted', 'interviewFormApprovedDate', 'interviewFormCompletedDate'
  ]);

  const normalized = {};
  const existingKeys = new Set(Object.keys(currentDoc || {}));

  // Map common aliases to canonical fields
  const aliasMap = {
    payrate: 'payRate',
    'pay rate': 'payRate',
    wage: 'payRate',
    rate: 'payRate',
    'shoe size': 'shoeSize',
    shoesize: 'shoeSize',
    'dress size': 'dressSize',
    dresssize: 'dressSize',
  };

  // Special case: user encoded pay rate inside skills strings (e.g., ["Pay rate: 22"]). Extract and map to payRate.
  if (Array.isArray(proposed.skills)) {
    const joined = proposed.skills.filter(Boolean).join(' ');
    const m = joined.match(/pay\s*rate\s*[:=]?\s*\$?\s*(\d+(?:\.\d+)?)/i);
    if (m && existingKeys.has('payRate')) {
      const val = Number(m[1]);
      if (!Number.isNaN(val)) {
        normalized.payRate = val;
      }
    }
  }

  for (const [k, vRaw] of Object.entries(proposed)) {
    const lower = k.toLowerCase();
    const key = aliasMap[lower] || k;
    if (!allowedFields.has(key)) continue; // never add new fields
    if (!existingKeys.has(key)) continue; // never add fields that don't exist on the doc

    let v = vRaw;
    if (key === 'payRate') {
      // Extract number from strings like "22", "$22", "Pay rate: 22"
      if (typeof v === 'string') {
        const matched = v.match(/\d+(?:\.\d+)?/);
        v = matched ? Number(matched[0]) : v;
      }
      if (typeof v !== 'number' || Number.isNaN(v)) continue; // skip invalid
    }

    // Special handling to respect existing structure for size fields
    if ((key === 'shoeSize' || key === 'dressSize')) {
      if (!existingKeys.has(key) && existingKeys.has('applicationFormData')) {
        const afd = typeof currentDoc.applicationFormData === 'object' && currentDoc.applicationFormData ? currentDoc.applicationFormData : {};
        const currentVal = afd[key];
        try {
          const a = JSON.stringify(currentVal);
          const b = JSON.stringify(v);
          if (a === b) {
            continue;
          }
        } catch (_) {}
        normalized.applicationFormData = { ...afd, [key]: v };
        continue;
      }
    }

    // Avoid writing same value
    if (currentDoc && currentDoc[key] !== undefined) {
      try {
        const a = JSON.stringify(currentDoc[key]);
        const b = JSON.stringify(v);
        if (a === b) continue;
      } catch (_) {}
    }

    normalized[key] = v;
  }

  return normalized;
}

export async function executeChatFunction(name, args) {
  switch (name) {
    case 'get_bookings': {
      let bookings;
      if (args.clientName) bookings = await firebaseService.getBookingsByClient(args.clientName);
      else if (args.showName) bookings = await firebaseService.getBookingsByShow(args.showName);
      else if (args.status) bookings = await firebaseService.getBookingsByStatus(args.status);
      else if (args.startDate && args.endDate) bookings = await firebaseService.getBookingsByDateRange(args.startDate, args.endDate);
      else bookings = await firebaseService.getAll('bookings');

      // Enrich with client/show names if missing
      const [clients, shows] = await Promise.all([
        firebaseService.getAll('clients'),
        firebaseService.getAll('shows')
      ]);
      const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.name]));
      const showMap = Object.fromEntries((shows || []).map(s => [s.id, s.name]));
      const enriched = (bookings || []).map(b => ({
        ...b,
        clientName: b.clientName || clientMap[b.clientId],
        showName: b.showName || showMap[b.showId]
      }));

      return {
        __ui: { type: 'booking_list', items: enriched },
        data: sanitizeForDisplay(enriched)
      };
    }

    case 'get_staff': {
      // Return both a UI preview (raw for IDs/links) and a sanitized data fallback
      let staffRecords;
      if (args.role) staffRecords = await firebaseService.getStaffByRole(args.role);
      else if (args.skill) staffRecords = await firebaseService.getStaffBySkill(args.skill);
      else staffRecords = await firebaseService.getAll('staff');

      return {
        __ui: { type: 'staff_list', items: staffRecords },
        data: sanitizeForDisplay(staffRecords)
      };
    }

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
      // Normalize timestamps so date filters/sorts work even with Firestore maps
      let rows = Array.isArray(all) ? normalizeTimestampsDeep(all) : [];

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

      if (args.collection === 'bookings') {
        // Enrich with names
        const [clients, shows] = await Promise.all([
          firebaseService.getAll('clients'),
          firebaseService.getAll('shows')
        ]);
        const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.name]));
        const showMap = Object.fromEntries((shows || []).map(s => [s.id, s.name]));
        const enrichedRows = rows.map(r => ({
          ...r,
          clientName: r.clientName || clientMap[r.clientId],
          showName: r.showName || showMap[r.showId]
        }));
        return { __ui: { type: 'booking_list', items: enrichedRows }, data: sanitizeForDisplay(enrichedRows) };
      }
      return sanitizeForDisplay(rows);
    }

    case 'create_booking': {
      const { clientId, showId, clientName, showName, datesNeeded, assignedDate, status, notes } = args;
      let displayClient = clientName;
      let displayShow = showName;
      if (!displayClient && clientId) {
        try {
          const clientDoc = await firebaseService.getById('clients', clientId);
          displayClient = clientDoc?.name || clientId;
        } catch (_) {}
      }
      if (!displayShow && showId) {
        try {
          const showDoc = await firebaseService.getById('shows', showId);
          displayShow = showDoc?.name || showId;
        } catch (_) {}
      }

      // Resolve client/show by name if only names provided
      let resolvedClientId = clientId;
      let resolvedShowId = showId;
      if (!resolvedClientId && displayClient) {
        const foundClient = await firebaseService.findByName('clients', displayClient, true);
        if (!foundClient) {
          throw new Error(`Client "${displayClient}" not found.`);
        }
        resolvedClientId = foundClient.id;
        displayClient = foundClient.name || displayClient;
      }
      if (!resolvedShowId && displayShow) {
        const shows = await firebaseService.getAll('shows');
        const foundShow = shows.find(s => s.name && s.name.toLowerCase() === displayShow.toLowerCase()) ||
          shows.find(s => s.name && s.name.toLowerCase().includes(displayShow.toLowerCase()));
        if (!foundShow) {
          throw new Error(`Show "${displayShow}" not found.`);
        }
        resolvedShowId = foundShow.id;
        displayShow = foundShow.name || displayShow;
      }

      // Resolve staff names to IDs inside datesNeeded
      let normalizedDatesNeeded = Array.isArray(datesNeeded) ? [...datesNeeded] : undefined;
      if (Array.isArray(normalizedDatesNeeded) && normalizedDatesNeeded.some(d => Array.isArray(d.staffNames) && d.staffNames.length > 0)) {
        const staff = await firebaseService.getAll('staff');
        const nameToId = Object.fromEntries(staff.filter(s => s.name).map(s => [s.name.toLowerCase(), s.id]));
        normalizedDatesNeeded = normalizedDatesNeeded.map(d => {
          const staffIdsFromNames = Array.isArray(d.staffNames)
            ? d.staffNames.map(n => nameToId[(n || '').toLowerCase()]).filter(Boolean)
            : [];
          const mergedStaffIds = [
            ...(Array.isArray(d.staffIds) ? d.staffIds.filter(Boolean) : []),
            ...staffIdsFromNames
          ];
          return { ...d, staffIds: mergedStaffIds, staffNames: undefined };
        });
      }

      const payload = {
        ...(clientId ? { clientId } : {}),
        ...(showId ? { showId } : {}),
        ...(resolvedClientId ? { clientId: resolvedClientId } : {}),
        ...(resolvedShowId ? { showId: resolvedShowId } : {}),
        ...(displayClient ? { clientName: displayClient } : {}),
        ...(displayShow ? { showName: displayShow } : {}),
        ...(Array.isArray(normalizedDatesNeeded) && normalizedDatesNeeded.length > 0 ? { datesNeeded: normalizedDatesNeeded } : {}),
        ...(assignedDate ? { assignedDate } : {}),
        ...(status ? { status } : {}),
        ...(notes ? { notes } : {}),
      };

      // Basic validation: require either assignedDate or datesNeeded
      if (!payload.assignedDate && !payload.datesNeeded) {
        throw new Error('Please provide either assignedDate or datesNeeded.');
      }

      const firstDate = Array.isArray(payload.datesNeeded) && payload.datesNeeded[0]?.date ? payload.datesNeeded[0].date : payload.assignedDate;
      const labelClient = displayClient || 'client';
      const labelShow = displayShow || 'show';

      return {
        __action: {
          id: `create_booking_${Date.now()}`,
          type: 'create_booking',
          label: `Create booking for ${labelClient} at ${labelShow}`,
          successMessage: `Successfully created booking for ${labelClient} at ${labelShow}`,
          data: payload
        },
        message: `Ready to create booking for ${labelClient} at ${labelShow}${firstDate ? ` on ${firstDate}` : ''}. Click the button below to confirm.`,
        preview: payload
      };
    }

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

    case 'get_document_by_id': {
      const doc = await firebaseService.getById(args.collection, args.id);
      if (args.collection === 'bookings' && doc) {
        // Enrich names for single booking
        const [clients, shows] = await Promise.all([
          firebaseService.getAll('clients'),
          firebaseService.getAll('shows')
        ]);
        const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.name]));
        const showMap = Object.fromEntries((shows || []).map(s => [s.id, s.name]));
        const enriched = {
          ...doc,
          clientName: doc.clientName || clientMap[doc.clientId],
          showName: doc.showName || showMap[doc.showId]
        };
        return { __ui: { type: 'booking_card', item: enriched }, data: sanitizeForDisplay(enriched) };
      }
      return sanitizeForDisplay(doc);
    }

    case 'find_staff_by_name': {
      const doc = await firebaseService.findByName('staff', args.name, true);
      if (!doc) return null;
      return {
        __ui: { type: 'staff_card', item: doc },
        data: sanitizeForDisplay(doc)
      };
    }

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
      const cleanUpdateData = normalizeStaffUpdates(staffDoc, combined);

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

    case 'recommend_staff': {
      const { showName, showId: explicitShowId, date, startDate, endDate, role, requiredSkills = [], limit } = args;
      const [staff, availability, shows] = await Promise.all([
        firebaseService.getAll('staff'),
        firebaseService.getAll('availability'),
        firebaseService.getAll('shows')
      ]);
      let show = shows.find(s => explicitShowId ? s.id === explicitShowId : (s.name && s.name.toLowerCase() === (showName || '').toLowerCase()));
      const showId = explicitShowId || (show ? show.id : null);

      // Build target dates: explicit date or full show range from startDate/endDate or single date field
      const getDateRange = (start, end) => {
        const out = [];
        if (!start) return out;
        const startD = new Date(start);
        const endD = new Date(end || start);
        for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
          out.push(new Date(d).toISOString().split('T')[0]);
        }
        return out;
      };
      let targetDates = [];
      if (date) {
        targetDates = [date];
      } else if (startDate || endDate) {
        targetDates = getDateRange(startDate || endDate, endDate || startDate);
      } else if (show) {
        if (show.startDate || show.endDate) {
          targetDates = getDateRange(show.startDate || show.date, show.endDate || show.date);
        } else if (show.date) {
          targetDates = [show.date];
        }
      }

      // Map staff by id and by lowercased name for fallback
      const staffById = Object.fromEntries(staff.map(s => [s.id, s]));
      const staffByName = Object.fromEntries(staff.filter(s => s.name).map(s => [s.name.toLowerCase(), s]));

      // Collect availability coverage per staff doc id
      const coverage = new Map(); // staffDocId -> number of matching dates
      const preferShowMatchBonus = 0.5;
      availability.forEach(a => {
        const aDates = Array.isArray(a.availableDates) ? a.availableDates : [];
        if (targetDates.length === 0) return; // nothing to match
        const dateHits = targetDates.filter(td => aDates.includes(td)).length;
        if (dateHits === 0) return;
        // Resolve to staff document by id first, then by name
        let sDoc = staffById[a.staffId];
        if (!sDoc && a.staffName) sDoc = staffByName[(a.staffName || '').toLowerCase()];
        if (!sDoc) return;
        const prev = coverage.get(sDoc.id) || 0;
        let bonus = 0;
        if (showId && a.showId && a.showId === showId) bonus = preferShowMatchBonus;
        coverage.set(sDoc.id, prev + dateHits + bonus);
      });

      // If nothing matched (e.g., differing showIds), fall back to matching by any single target date ignoring showId
      if (coverage.size === 0 && targetDates.length > 0) {
        availability.forEach(a => {
          const aDates = Array.isArray(a.availableDates) ? a.availableDates : [];
          const anyHit = targetDates.some(td => aDates.includes(td));
          if (!anyHit) return;
          let sDoc = staffById[a.staffId];
          if (!sDoc && a.staffName) sDoc = staffByName[(a.staffName || '').toLowerCase()];
          if (!sDoc) return;
          const prev = coverage.get(sDoc.id) || 0;
          coverage.set(sDoc.id, prev + 1);
        });
      }

      // Build scored list
      const scored = Array.from(coverage.entries()).map(([staffId, cov]) => {
        const s = staffById[staffId];
        let score = cov;
        if (role && s?.role && s.role.toLowerCase() === role.toLowerCase()) score += 2;
        if (Array.isArray(requiredSkills) && requiredSkills.length > 0) {
          const skills = Array.isArray(s?.skills) ? s.skills.map(x => (x || '').toString().toLowerCase()) : [];
          const hits = requiredSkills.map(x => (x || '').toString().toLowerCase()).filter(rs => skills.includes(rs)).length;
          score += hits;
        }
        return { staffId, staffName: s?.name || 'Unknown', role: s?.role, skills: s?.skills || [], score };
      }).sort((a, b) => b.score - a.score || (a.staffName || '').localeCompare(b.staffName || ''));

      const chosen = typeof limit === 'number' ? scored.slice(0, limit) : scored;

      // Prepare UI: map to staff docs for card rendering
      const selectedStaffDocs = chosen.map(r => staffById[r.staffId]).filter(Boolean);
      return {
        __ui: { type: 'staff_list', items: selectedStaffDocs },
        data: sanitizeForDisplay({ showName, dates: targetDates, recommendations: chosen })
      };
    }

    case 'update_booking_by_names': {
      const { clientName, showName, date, updates } = args;
      const [bookings, clients, shows] = await Promise.all([
        firebaseService.getAll('bookings'),
        firebaseService.getAll('clients'),
        firebaseService.getAll('shows')
      ]);
      const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.name]));
      const showMap = Object.fromEntries((shows || []).map(s => [s.id, s.name]));

      // Normalize and enrich each booking with display names for robust matching
      const norm = (s) => (s || '').toString().trim().toLowerCase();
      const enriched = bookings.map(b => ({
        ...b,
        _clientName: norm(b.clientName || clientMap[b.clientId] || ''),
        _showName: norm(b.showName || showMap[b.showId] || '')
      }));

      const targetClient = norm(clientName);
      const targetShow = norm(showName);

      // Exact match first
      let booking = enriched.find(b => b._clientName === targetClient && b._showName === targetShow);
      // Fallback: partial contains either direction
      if (!booking) {
        booking = enriched.find(b =>
          (b._clientName && (b._clientName.includes(targetClient) || targetClient.includes(b._clientName))) &&
          (b._showName && (b._showName.includes(targetShow) || targetShow.includes(b._showName)))
        );
      }
      if (!booking) {
        // Offer suggestion list
        const similar = enriched
          .filter(b => b._showName.includes(targetShow) || b._clientName.includes(targetClient))
          .slice(0, 3)
          .map(b => `${clientMap[b.clientId] || b.clientName || 'Unknown'} @ ${showMap[b.showId] || b.showName || 'Unknown'}`)
          .join(', ');
        const suggestionText = similar ? ` Did you mean: ${similar}?` : '';
        throw new Error(`Booking for client "${clientName}" at show "${showName}" not found.${suggestionText}`);
      }

      // If a date is provided and updates target datesNeeded, attempt to patch the correct date row
      let finalUpdates = { ...(updates || {}) };
      if (date && Array.isArray(booking.datesNeeded) && updates && (updates.staffIds || updates.staffCount || updates.role || updates.shift)) {
        const idx = booking.datesNeeded.findIndex(dn => dn.date === date);
        const newDatesNeeded = [...booking.datesNeeded];
        if (idx >= 0) {
          const dn = { ...newDatesNeeded[idx] };
          if (updates.staffIds) dn.staffIds = updates.staffIds;
          if (typeof updates.staffCount === 'number') dn.staffCount = updates.staffCount;
          if (updates.role) dn.role = updates.role;
          if (updates.shift) dn.shift = updates.shift;
          newDatesNeeded[idx] = dn;
        } else {
          const dn = { date, staffCount: updates.staffCount || 0, staffIds: updates.staffIds || [], role: updates.role, shift: updates.shift };
          newDatesNeeded.push(dn);
        }
        finalUpdates = { ...finalUpdates, datesNeeded: newDatesNeeded };
      }

      const cleanUpdates = Object.fromEntries(
        Object.entries(finalUpdates).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );

      return {
        __action: {
          id: `update_booking_${Date.now()}`,
          type: 'update_record',
          label: `Update booking for ${(clientMap[booking.clientId] || booking.clientName || 'Client')} at ${(showMap[booking.showId] || booking.showName || 'Show')}`,
          successMessage: `Successfully updated booking for ${(clientMap[booking.clientId] || booking.clientName || 'Client')} at ${(showMap[booking.showId] || booking.showName || 'Show')}`,
          data: { collection: 'bookings', id: booking.id, updates: cleanUpdates }
        },
        message: `Ready to update booking for ${(clientMap[booking.clientId] || booking.clientName || 'Client')} at ${(showMap[booking.showId] || booking.showName || 'Show')}. Click the button below to confirm.`,
        preview: { current: booking, updates: cleanUpdates }
      };
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
      const cleanMentionUpdateData = normalizeStaffUpdates(mentionedStaffDoc, combinedMention);

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
      const sanitizedUpdates = args.collection === 'staff' ? normalizeStaffUpdates(doc, args.updates || {}) : (args.updates || {});
      if (!sanitizedUpdates || Object.keys(sanitizedUpdates).length === 0) {
        return {
          message: `No changes detected for ${doc.name}. I won't update anything.`,
          preview: { current: doc, updates: {} }
        };
      }
      return {
        __action: {
          id: `update_${args.collection}_${Date.now()}`,
          type: `update_${args.collection === 'staff' ? 'staff' : 'client'}`,
          label: `Update ${doc.name}`,
          successMessage: `Successfully updated ${doc.name}`,
          data: { id: doc.id, ...sanitizedUpdates }
        },
        message: `Ready to update ${doc.name}. Click the button below to confirm.`,
        preview: { current: doc, updates: sanitizedUpdates }
      };
    }

    case 'count_shows_worked_by_staff': {
      const { name } = args;
      const staffDoc = await firebaseService.findByName('staff', name, true);
      if (!staffDoc) {
        const similar = await firebaseService.findByName('staff', name, false);
        const suggestions = similar.slice(0, 3).map(s => s.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`Staff member "${name}" not found.${suggestionText} Please check the name and try again.`);
      }
      const bookings = await firebaseService.getAll('bookings');
      const showIds = new Set();
      bookings.forEach(b => {
        if (Array.isArray(b.datesNeeded)) {
          b.datesNeeded.forEach(dn => {
            const ids = Array.isArray(dn.staffIds) ? dn.staffIds.filter(Boolean) : [];
            if (ids.includes(staffDoc.id) && b.showId) {
              showIds.add(b.showId);
            }
          });
        }
      });
      return { name: staffDoc.name, showsWorked: showIds.size };
    }

    case 'clients_for_staff_shows': {
      const { name } = args;
      const staffDoc = await firebaseService.findByName('staff', name, true);
      if (!staffDoc) {
        const similar = await firebaseService.findByName('staff', name, false);
        const suggestions = similar.slice(0, 3).map(s => s.name).join(', ');
        const suggestionText = suggestions ? ` Did you mean: ${suggestions}?` : '';
        throw new Error(`Staff member "${name}" not found.${suggestionText} Please check the name and try again.`);
      }
      const [bookings, clients] = await Promise.all([
        firebaseService.getAll('bookings'),
        firebaseService.getAll('clients')
      ]);
      const clientIdToName = Object.fromEntries(clients.map(c => [c.id, c.name]));
      const clientNames = new Set();
      bookings.forEach(b => {
        if (!Array.isArray(b.datesNeeded)) return;
        const worked = b.datesNeeded.some(dn => Array.isArray(dn.staffIds) && dn.staffIds.filter(Boolean).includes(staffDoc.id));
        if (worked) {
          if (b.clientName) clientNames.add(b.clientName);
          else if (b.clientId && clientIdToName[b.clientId]) clientNames.add(clientIdToName[b.clientId]);
        }
      });
      return { name: staffDoc.name, clients: Array.from(clientNames).filter(Boolean) };
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
    case 'total_bookings': {
      const bookings = await firebaseService.getAll('bookings');
      return { totalBookings: bookings.length };
    }
    case 'bookings_by_status': {
      const allBookings = await firebaseService.getAll('bookings');
      const statusCounts = {};
      allBookings.forEach(booking => {
        statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
      });
      return statusCounts;
    }
    case 'top_clients_by_bookings': {
      const bookings = await firebaseService.getAll('bookings');
      const counts = {};
      bookings.forEach(b => {
        const key = b.clientName || b.clientId || 'Unknown';
        counts[key] = (counts[key] || 0) + 1;
      });
      // Prefer clientName; if only IDs are present, we keep the key as is
      const ranked = Object.entries(counts)
        .map(([client, count]) => ({ client, count }))
        .sort((a, b) => b.count - a.count);
      const limit = options.limit || 5;
      return ranked.slice(0, limit);
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


