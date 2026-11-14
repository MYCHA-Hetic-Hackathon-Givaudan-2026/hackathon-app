/** Navigation légère sans dépendance router (Landing | Explorer). */

export function navigate(to: string): void {
  const url = new URL(to, window.location.origin);
  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search
  ) {
    return;
  }
  window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function getLocationSnapshot(): { path: string; search: string } {
  return {
    path: window.location.pathname,
    search: window.location.search,
  };
}
