export function generateProxy(trap: any, target: any, allowRead: object, allowWrite: object) {
  return new Proxy(target, {
    get(_, prop: string) {
      if (prop in allowWrite) {
        return target[prop];
      } else if (prop in allowRead) {
        return allowRead[prop];
      } else {
        return trap[prop];
      }
    },
    set(_, prop: string, value) {
      if (prop in allowWrite) {
        target[prop] = value;
      } else {
        trap[prop] = value;
      }
      return true;
    },
  });
}
