import { describe, it, expect } from 'vitest';
import * as menuService from '../../services/menuService';
import * as dbService from '../../services/db';

describe('smoke: services exist', () => {
  it('menuService exports functions', () => {
    expect(typeof menuService.subscribeToItems).toBe('function');
    expect(typeof menuService.fetchItems).toBe('function');
  });

  it('dbService exports functions', () => {
    expect(typeof dbService.getAllImages).toBe('function');
    expect(typeof dbService.saveImage).toBe('function');
    expect(typeof dbService.updateImage).toBe('function');
  });
});
