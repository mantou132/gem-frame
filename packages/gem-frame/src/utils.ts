export function generateProxy(trap: any, target: any, allowRead: object, allowWrite: object) {
  return new Proxy(target, {
    get(_, prop: string) {
      if (Object.getOwnPropertyDescriptor(allowWrite, prop) && allowWrite[prop] === true) {
        return target[prop];
      } else if (Object.getOwnPropertyDescriptor(allowRead, prop)) {
        return allowRead[prop];
      } else {
        return trap[prop];
      }
    },
    set(_, prop: string, value) {
      if (Object.getOwnPropertyDescriptor(allowWrite, prop)) {
        if (allowWrite[prop] === true) {
          target[prop] = value;
        } else {
          allowWrite[prop] = value;
        }
      } else {
        trap[prop] = value;
      }
      return true;
    },
  });
}

export function getAbsolutePath(path: string, basePath: string) {
  if (path.startsWith('/') || !path) {
    if (basePath) {
      return basePath + (path === '/' ? '' : path);
    }
    return path;
  } else {
    return new URL(path, window.location.href.endsWith('/') ? window.location.href : `${window.location.href}/`)
      .pathname;
  }
}

export function getRelativePath(absolutePath: string, basePath: string) {
  if (absolutePath === basePath) return '/';
  return absolutePath.replace(new RegExp(`^${basePath}/`), '/');
}
