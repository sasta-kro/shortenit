export const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`Application path must start with '/': ${path}`);
  }

  if (
    APP_BASE_PATH &&
    (path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`))
  ) {
    return path;
  }

  if (path === "/") {
    return APP_BASE_PATH ? `${APP_BASE_PATH}/` : "/";
  }

  return `${APP_BASE_PATH}${path}`;
}

export function withoutBasePath(pathname: string): string {
  if (!APP_BASE_PATH) {
    return pathname;
  }

  if (pathname === APP_BASE_PATH) {
    return "/";
  }

  if (pathname.startsWith(`${APP_BASE_PATH}/`)) {
    return pathname.slice(APP_BASE_PATH.length) || "/";
  }

  return pathname;
}

export function buildShortUrl(origin: string, shortCode: string): string {
  return `${origin.replace(/\/$/, "")}${withBasePath(`/s/${shortCode}`)}`;
}
