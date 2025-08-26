function isFirestoreTimestampObject(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.seconds === 'number' &&
    typeof obj.nanoseconds === 'number'
  );
}

function convertTimestampsDeep(value) {
  if (Array.isArray(value)) {
    return value.map(convertTimestampsDeep);
  }
  if (value && typeof value === 'object') {
    // Firestore Timestamp (object form with seconds/nanoseconds)
    if (isFirestoreTimestampObject(value)) {
      const ms = (value.seconds * 1000) + Math.floor(value.nanoseconds / 1e6);
      return new Date(ms).toISOString();
    }
    // Firestore Timestamp instance (has toDate)
    if (typeof value.toDate === 'function' && typeof value.seconds === 'number') {
      try {
        return value.toDate().toISOString();
      } catch (_) {}
    }
    // Native Date
    if (value instanceof Date) {
      try {
        return value.toISOString();
      } catch (_) {}
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = convertTimestampsDeep(v);
    }
    return out;
  }
  return value;
}

// Exported helper for server-side consumers that need timestamp normalization
export function normalizeTimestampsDeep(value) {
  return convertTimestampsDeep(value);
}

function removeIdKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(removeIdKeysDeep);
  }
  if (value && typeof value === 'object') {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      if (key === 'id') continue; // strip firebase doc id
      // Strip common foreign keys that refer to firebase docs
      if (['clientId', 'primaryContactId', 'primaryLocationId', 'showId', 'staffIds'].includes(key)) continue;
      result[key] = removeIdKeysDeep(val);
    }
    return result;
  }
  return value;
}

export function sanitizeForDisplay(data) {
  // First remove IDs, then normalize timestamps to ISO strings
  return convertTimestampsDeep(removeIdKeysDeep(data));
}


