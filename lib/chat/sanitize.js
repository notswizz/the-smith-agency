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
  return removeIdKeysDeep(data);
}


