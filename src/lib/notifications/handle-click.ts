// Pure, unit-testable `notificationclick` handler.
//
// The live service worker in `src/service-worker.ts` delegates to this
// function. Keeping it here (and not inside `service-worker.ts`) lets
// tests import it from a plain `$lib/...` path without tripping the
// service-worker module's `/// <reference lib="webworker" />` + top-level
// `self` references, which vitest's node environment can't resolve.
//
// Contract (ENT-07, D-21):
// - Dismiss the notification.
// - Open (or focus + navigate) the entry form at `/?date=today`.
// - Use `WindowClient.navigate` when an existing tab on our origin is
//   already open; otherwise open a new window.
// - Return the URL so tests can assert it without spying on `openWindow`.
//
// Security note (T-01-22): the URL is a hardcoded literal, never
// user-controlled. `clients.openWindow` accepts arbitrary strings; by
// forcing the literal here we eliminate the open-redirect path.

export interface NotificationClickEventLike {
	notification: { close: () => void };
	waitUntil: (p: Promise<unknown>) => void;
}

export interface WindowClientLike {
	url: string;
	focus: () => Promise<unknown>;
	navigate?: (u: string) => Promise<unknown>;
}

export interface ClientsLike {
	matchAll: (opts: {
		type: 'window';
		includeUncontrolled: boolean;
	}) => Promise<WindowClientLike[]>;
	openWindow: (u: string) => Promise<unknown>;
}

export async function handleNotificationClick(
	event: NotificationClickEventLike,
	clients: ClientsLike,
	origin: string
): Promise<string> {
	event.notification.close();
	const url = '/?date=today';
	const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
	const existing = list.find((c) => c.url.includes(origin));
	if (existing) {
		await existing.focus();
		if (existing.navigate) await existing.navigate(url);
	} else {
		await clients.openWindow(url);
	}
	return url;
}
