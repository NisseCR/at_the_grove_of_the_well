export class LruCache<K, V> {
  private readonly map = new Map<K, V>();

  constructor(private readonly maxSize: number) {}

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;

    this.promoteToRecent(key);
    return this.map.get(key);
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else {
      this.evictIfFull();
    }
    this.map.set(key, value);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  private promoteToRecent(key: K): void {
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
  }

  private evictIfFull(): void {
    if (this.map.size < this.maxSize) return;
    const leastRecentlyUsed = this.map.keys().next().value!;
    this.map.delete(leastRecentlyUsed);
  }
}
