import { describe, it, expect } from 'vitest';
import { encodeBbox, decodeBbox, type Bbox } from './bbox';

describe('bbox URL helpers', () => {
  const b: Bbox = { minLng: 66.5, minLat: 39.2, maxLng: 67.5, maxLat: 40.0 };

  it('round-trips encode/decode', () => {
    const enc = encodeBbox(b);
    expect(decodeBbox(enc)).toEqual(b);
  });

  it('encodes to "minLng,minLat,maxLng,maxLat"', () => {
    expect(encodeBbox(b)).toBe('66.5,39.2,67.5,40');
  });

  it('decodeBbox returns null on malformed input', () => {
    expect(decodeBbox(null)).toBeNull();
    expect(decodeBbox('')).toBeNull();
    expect(decodeBbox('1,2,3')).toBeNull();
    expect(decodeBbox('a,b,c,d')).toBeNull();
  });

  it('decodeBbox returns null when min >= max', () => {
    expect(decodeBbox('67,39,66,40')).toBeNull();
    expect(decodeBbox('66,40,67,39')).toBeNull();
  });
});
