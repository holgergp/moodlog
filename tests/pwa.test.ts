import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestPersistence } from '$lib/pwa/persist';

describe('pwa', () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	it('storage.persist called', async () => {
		// ENT-08 — requestPersistence invokes navigator.storage.persist()
		// when the origin is not already persistent.
		const persistMock = vi.fn().mockResolvedValue(true);
		const persistedMock = vi.fn().mockResolvedValue(false);
		vi.stubGlobal('navigator', {
			storage: {
				persist: persistMock,
				persisted: persistedMock
			}
		});

		const result = await requestPersistence();
		expect(persistedMock).toHaveBeenCalled();
		expect(persistMock).toHaveBeenCalled();
		expect(result).toBe(true);
	});

	it('returns true without calling persist when already persistent', async () => {
		const persistMock = vi.fn();
		const persistedMock = vi.fn().mockResolvedValue(true);
		vi.stubGlobal('navigator', {
			storage: { persist: persistMock, persisted: persistedMock }
		});

		const result = await requestPersistence();
		expect(result).toBe(true);
		expect(persistMock).not.toHaveBeenCalled();
	});

	it('returns false when storage API is unavailable', async () => {
		vi.stubGlobal('navigator', {});
		const result = await requestPersistence();
		expect(result).toBe(false);
	});
});
