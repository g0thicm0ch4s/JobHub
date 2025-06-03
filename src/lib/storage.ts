import { User } from '../types/types';

// Simple storage service using localStorage
class StorageService {
  private getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  private setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Auth methods
  getUser(): User | null {
    return this.getItem<User>('user');
  }

  setUser(user: User): void {
    this.setItem('user', user);
  }

  clearUser(): void {
    localStorage.removeItem('user');
  }

  // Session management
  isAuthenticated(): boolean {
    return !!this.getUser();
  }
}

export const storage = new StorageService();