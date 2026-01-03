import { describe, it, expect, vi, afterEach } from 'vitest';
import { menuService } from '../../services/menuService';

describe('menuService export/restore helpers', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('exportData returns payload with meta and checksum', async () => {
    vi.spyOn(menuService, 'fetchItems').mockResolvedValue([{ id: 1, name: 'Item A' } as any]);
    vi.spyOn(menuService, 'fetchCategories').mockResolvedValue([{ id: 'c1', name: 'Cat' } as any]);
    vi.spyOn(menuService, 'fetchSections').mockResolvedValue([{ id: 's1', name: 'Section' } as any]);
    vi.spyOn(menuService, 'fetchProfiles').mockResolvedValue([{ id: 'p1', name: 'Profile' } as any]);
    vi.spyOn(menuService, 'fetchRoles').mockResolvedValue([{ id: 'r1', name: 'Role' } as any]);

    const payload = await menuService.exportData();
    expect(payload).toHaveProperty('meta');
    expect(payload.meta).toHaveProperty('createdAt');
    expect(typeof payload.meta.checksum).toBe('string');
    expect(payload.items).toHaveLength(1);
    expect(payload.categories).toHaveLength(1);
  });

  it('restoreFromExport rejects replace mode (handled by replaceFromExport)', async () => {
    await expect(menuService.restoreFromExport({ meta: { version: '1.0' } } as any, { mode: 'replace' } as any)).rejects.toThrow();
  });
});
