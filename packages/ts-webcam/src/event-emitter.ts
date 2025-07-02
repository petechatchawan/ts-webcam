// Simple EventEmitter implementation
export class EventEmitter<TEvents extends Record<string, any>> {
  private listeners: { [K in keyof TEvents]?: Array<(payload: TEvents[K]) => void> } = {};

  on<K extends keyof TEvents>(event: K, listener: (payload: TEvents[K]) => void) {
    (this.listeners[event] ||= []).push(listener);
  }
  
  off<K extends keyof TEvents>(event: K, listener: (payload: TEvents[K]) => void) {
    this.listeners[event] = (this.listeners[event] || []).filter((l) => l !== listener);
  }
  
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]) {
    (this.listeners[event] || []).forEach((listener) => listener(payload));
  }
}
