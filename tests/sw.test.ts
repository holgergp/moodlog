import { describe, it, expect, vi } from 'vitest';
import { handleNotificationClick } from '$lib/notifications/handle-click';

describe('service worker', () => {
	it('notificationclick deep link', async () => {
		// ENT-07 — notificationclick routes to /?date=today.
		// Existing same-origin client is focused and navigated; `openWindow`
		// is NOT called when a suitable client exists (T-01-22 open-redirect
		// guard — URL is a hardcoded literal in the helper).
		const close = vi.fn();
		const waitUntil = vi.fn((p: Promise<unknown>) => p);
		const focus = vi.fn().mockResolvedValue(undefined);
		const navigate = vi.fn().mockResolvedValue(undefined);
		const openWindow = vi.fn().mockResolvedValue({});

		const event = { notification: { close }, waitUntil };
		const origin = 'http://localhost:5173';
		const clients = {
			matchAll: vi.fn().mockResolvedValue([
				{ url: `${origin}/some-other-path`, focus, navigate }
			]),
			openWindow
		};

		const url = await handleNotificationClick(event, clients, origin);

		expect(close).toHaveBeenCalled();
		expect(url).toBe('/?date=today');
		expect(focus).toHaveBeenCalled();
		expect(navigate).toHaveBeenCalledWith('/?date=today');
		expect(openWindow).not.toHaveBeenCalled();
	});

	it('notificationclick opens new window when no client is open', async () => {
		const event = { notification: { close: vi.fn() }, waitUntil: vi.fn() };
		const openWindow = vi.fn().mockResolvedValue({});
		const clients = {
			matchAll: vi.fn().mockResolvedValue([]),
			openWindow
		};

		const url = await handleNotificationClick(event, clients, 'http://localhost:5173');
		expect(url).toBe('/?date=today');
		expect(openWindow).toHaveBeenCalledWith('/?date=today');
	});
});
