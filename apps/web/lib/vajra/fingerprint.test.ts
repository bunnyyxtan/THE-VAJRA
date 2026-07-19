import { describe, expect, it } from 'vitest';
import { normalizeVajraCode, vajraCodeFromRequestId, vajraCodeMatches } from './fingerprint';

describe('vajraCodeFromRequestId', () => {
  it('derives first 4 bytes as 8 uppercase hex chars grouped 4-4', () => {
    expect(vajraCodeFromRequestId('0xad0a4e98455338b98b36896c2d54aa4f5d76ff0c4ab5d057e2370511f653a3ee')).toBe(
      'AD0A-4E98',
    );
  });

  it('is deterministic', () => {
    const id = '0xaf57cc6f4940bd60cd9a5938e9578d4da6127cc35759668e9646986c6e77f4ba' as const;
    expect(vajraCodeFromRequestId(id)).toBe(vajraCodeFromRequestId(id));
  });

  it('normalizes user input for comparison', () => {
    expect(normalizeVajraCode('ad0a-4e98')).toBe('AD0A4E98');
    expect(normalizeVajraCode(' AD0A 4E98 ')).toBe('AD0A4E98');
    expect(normalizeVajraCode('AD0A4E9')).toBeNull();
    expect(normalizeVajraCode('AD0A4E98FF')).toBeNull();
    expect(normalizeVajraCode('GG0A-4E98')).toBeNull();
  });

  it('matches codes case- and separator-insensitively', () => {
    const id = '0xad0a4e98455338b98b36896c2d54aa4f5d76ff0c4ab5d057e2370511f653a3ee' as const;
    expect(vajraCodeMatches(id, 'AD0A-4E98')).toBe(true);
    expect(vajraCodeMatches(id, 'ad0a4e98')).toBe(true);
    expect(vajraCodeMatches(id, 'AD0A-4E99')).toBe(false);
  });
});
