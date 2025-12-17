
import { User, UserRole } from "../types";

const STORAGE_KEY_USERS = 'pz_users';
const STORAGE_KEY_SESSION = 'pz_current_user';

// 默认管理员账号: admin / 123456
const DEFAULT_ADMIN: User = {
  id: 'admin_001',
  username: 'admin',
  password: '123', 
  role: 'admin',
  createdAt: new Date().toISOString()
};

class AuthService {
  constructor() {
    this.init();
  }

  private init() {
    const users = this.getUsers();
    if (users.length === 0) {
      this.saveUsers([DEFAULT_ADMIN]);
    }
  }

  getUsers(): User[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    } catch { return []; }
  }

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  login(username: string, password: string): { success: boolean; user?: User; message?: string } {
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Create simplified session user (no password)
      const sessionUser = { ...user };
      delete sessionUser.password;
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionUser));
      
      // Update last login
      user.lastLogin = new Date().toISOString();
      this.saveUsers(users.map(u => u.id === user.id ? user : u));
      
      return { success: true, user: sessionUser };
    }
    return { success: false, message: '用户名或密码错误 / Invalid Credentials' };
  }

  logout() {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    // Removed window.location.reload() to prevent "File not found" errors in some environments.
    // The App component will handle the state transition to login screen.
  }

  register(username: string, password: string): { success: boolean; message?: string } {
    const users = this.getUsers();
    if (users.find(u => u.username === username)) {
      return { success: false, message: '用户名已存在 / Username taken' };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      password,
      role: 'user', // Default role is user
      createdAt: new Date().toISOString()
    };

    this.saveUsers([...users, newUser]);
    return { success: true };
  }

  // --- ADMIN METHODS ---

  adminCreateUser(username: string, password: string, role: UserRole): { success: boolean; message?: string } {
    const users = this.getUsers();
    if (users.find(u => u.username === username)) {
      return { success: false, message: '用户已存在 / User exists' };
    }
    const newUser: User = {
      id: `u_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      username,
      password,
      role,
      createdAt: new Date().toISOString()
    };
    this.saveUsers([...users, newUser]);
    return { success: true };
  }

  adminResetPassword(userId: string, newPass: string) {
    let users = this.getUsers();
    users = users.map(u => u.id === userId ? { ...u, password: newPass } : u);
    this.saveUsers(users);
  }

  getCurrentUser(): User | null {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_SESSION) || 'null');
    } catch { return null; }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  deleteUser(userId: string) {
    let users = this.getUsers();
    // Prevent deleting the last admin or self (optional, but good practice)
    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);
  }

  updateUserRole(userId: string, role: UserRole) {
    let users = this.getUsers();
    users = users.map(u => u.id === userId ? { ...u, role } : u);
    this.saveUsers(users);
  }
}

export const authService = new AuthService();
