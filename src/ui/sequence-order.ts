/** One unique leading sort value lets DB windows avoid fetching whole timestamp ties.
 * Hex preserves SQLite BINARY's UTF-8 byte order. Terminators preserve prefixes;
 * descending components reverse both bytes and the prefix terminator.
 */
export function sequenceOrder(parts: readonly (readonly [string | number, 'asc' | 'desc'])[]): string {
  return parts.map(([value, direction]) => {
    if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) throw new Error('Invalid numeric sequence key');
    const text = typeof value === 'number' ? value.toString(16).padStart(14, '0') : value;
    const descending = direction === 'desc';
    return [...new TextEncoder().encode(text)].map(byte => (descending ? 255 - byte : byte).toString(16).padStart(2, '0')).join('') + (descending ? '~' : '!');
  }).join('');
}

/** Decode DB's exact boundary lookup into ordinary API filters. This is not an API cursor. */
export function sequenceParts(key: string, directions: readonly ('asc' | 'desc')[]): string[] {
  let offset = 0;
  const values = directions.map(direction => {
    const descending = direction === 'desc';
    const end = key.indexOf(descending ? '~' : '!', offset), hex = key.slice(offset, end);
    if (end < offset || hex.length % 2 || !/^[0-9a-f]*$/.test(hex)) throw new Error('Invalid sequence boundary');
    offset = end + 1;
    const bytes = Uint8Array.from(hex.match(/../g) ?? [], part => { const value = Number.parseInt(part, 16); return descending ? 255 - value : value; });
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  });
  if (offset !== key.length) throw new Error('Invalid sequence boundary');
  return values;
}
