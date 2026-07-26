import { EventEmitter } from "node:events";

class StewardEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

const globalForEventBus = globalThis as unknown as {
  stewardEventBus: StewardEventBus | undefined;
};

export const stewardEventBus =
  globalForEventBus.stewardEventBus ?? new StewardEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEventBus.stewardEventBus = stewardEventBus;
}
