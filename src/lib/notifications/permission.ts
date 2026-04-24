// Thin wrapper over `Notification.requestPermission()`.
//
// - SSR-safe: returns `'default'` when `Notification` is undefined (server
//   or browsers without Notifications API support).
// - Short-circuits if the permission is already decided — the Notifications
//   spec says subsequent `requestPermission()` calls after a grant/deny are
//   no-ops that return the existing value, but short-circuiting here avoids
//   any flicker of the prompt on permission-already-denied browsers.

export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (typeof Notification === 'undefined') return 'default';
	if (Notification.permission === 'granted' || Notification.permission === 'denied') {
		return Notification.permission;
	}
	return await Notification.requestPermission();
}
