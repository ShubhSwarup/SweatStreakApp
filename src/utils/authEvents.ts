// One-way bridge: client.ts calls triggerLogout() → authStore resets state.
// This avoids client → authStore → api/auth → client circular imports.

type LogoutCallback = () => void;
let _onLogout: LogoutCallback | null = null;

export function registerLogoutCallback(cb: LogoutCallback): void {
  _onLogout = cb;
}

export function triggerLogout(): void {
  _onLogout?.();
}
