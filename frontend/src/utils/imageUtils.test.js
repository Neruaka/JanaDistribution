import { describe, expect, it } from 'vitest';
import {
  getFilenameFromUrl,
  getImageUrl,
  getImageUrlOrDefault,
  isLocalImage
} from './imageUtils';

describe('imageUtils', () => {
  it('keeps absolute URLs unchanged', () => {
    const imageUrl = 'https://cdn.example.com/image.jpg';
    expect(getImageUrl(imageUrl)).toBe(imageUrl);
  });

  it('prefixes local upload paths with backend origin', () => {
    expect(getImageUrl('/uploads/products/test.jpg')).toBe(
      'http://localhost:3000/uploads/products/test.jpg'
    );
  });

  it('returns default placeholder when image is missing', () => {
    expect(getImageUrlOrDefault(null)).toBe('/placeholder-product.jpg');
  });

  it('detects local product images', () => {
    expect(isLocalImage('/uploads/products/a.jpg')).toBe(true);
    expect(isLocalImage('https://cdn.example.com/a.jpg')).toBe(false);
  });

  it('extracts filename from URL', () => {
    expect(getFilenameFromUrl('/uploads/products/abc.png')).toBe('abc.png');
  });
});
