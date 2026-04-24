// In-app reminder scheduler — honest Phase 1 scope (RESEARCH §Pitfall 2).
//
// Fires at most one notification per local_date when the wall-clock minute
// matches `settings.reminder_time` AND `Notification.permission === 'granted'`
// AND the app is in the foreground (or backgrounded with the tab still alive —
// browsers keep setInterval running when the tab is hidden, though throttled).
//
// Explicitly NOT a push server: Phase 1 has no VAPID, no server-side
// scheduling. If the tab is fully closed at reminder time, the user does
// not get pinged. The D-18 install banner + onboarding explainer surface
// this as the reason to install to Home Screen.
//
// Each tick reads `reminder_time` fresh from Dexie (cheap — single primary-key
// lookup) so a future Settings screen that toggles the time is reflected on
// the next minute boundary without restarting the scheduler.

import { db } from '$lib/db/local';
import { localDate } from '$lib/db/mutations';

// Module-scoped — prevents re-firing the same reminder within a single
// local_date even if the minute matches twice (e.g. clock drift at boundary).
// Reset via `__resetLastFiredForTests` from unit tests only.
let lastFired: string | null = null;

async function tick(): Promise<void> {
	if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
	const setting = await db.settings.get('reminder_time');
	const targetHHMM = setting?.value ?? '21:00';
	const now = new Date();
	const hh = String(now.getHours()).padStart(2, '0');
	const mm = String(now.getMinutes()).padStart(2, '0');
	if (`${hh}:${mm}` !== targetHHMM) return;

	const today = localDate();
	if (lastFired === today) return;
	lastFired = today;

	try {
		// Prefer the SW registration path so `notificationclick` routes through
		// our service worker (ENT-07 deep-link). Fall back to the tab-scoped
		// `new Notification(...)` when no SW is registered — the user still
		// sees the reminder, but tapping it only focuses the tab.
		const reg = typeof navigator !== 'undefined' ? await navigator.serviceWorker?.ready : null;
		if (reg && 'showNotification' in reg) {
			await reg.showNotification('MoodLog', {
				body: 'Log today — how was it?',
				tag: `moodlog-reminder-${today}`,
				data: { date: 'today' }
			});
		} else {
			new Notification('MoodLog', { body: 'Log today — how was it?' });
		}
	} catch {
		// Silent by design — RESEARCH §T-01-26: in-app scheduler is explicitly
		// best-effort while open; errors inside showNotification should not
		// crash the layout. PITFALLS #12: no payload logging.
	}
}

export function startReminderScheduler(): { stop: () => void } {
	// SSR no-op — the layout calls this from onMount, but callers in test
	// harnesses may be outside a browser context.
	if (typeof window === 'undefined') return { stop: () => {} };
	// First tick runs immediately so "open app exactly at 21:00" is covered
	// without waiting up to 60s for the first interval.
	void tick();
	const id = window.setInterval(tick, 60_000);
	return { stop: () => window.clearInterval(id) };
}

export function stopReminderScheduler(handle: { stop: () => void }): void {
	handle.stop();
}

// Test-only helper. Unit tests that exercise the fire-once-per-day guard
// need to reset this between cases.
export function __resetLastFiredForTests(): void {
	lastFired = null;
}
