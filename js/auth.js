// Auto Doc - Yomal Car Audio - Authentication & Role Manager
// Supports switching between roles (Admin, Cashier, Tech, Customer) and PIN authentication

class AuthManager {
  constructor() {
    this.SESSION_KEY = "YOMAL_AUTH_SESSION_V1";
    this.currentUser = this.loadSession();
    this.listeners = [];
  }

  loadSession() {
    try {
      const saved = localStorage.getItem(this.SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify user still exists in DB
        const dbUser = db.getUserById(parsed.id);
        if (dbUser && dbUser.active) {
          return dbUser;
        }
      }
    } catch (e) {
      console.warn("Failed to load auth session:", e);
    }
    // Guest / Public Visitor by default
    return null;
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  saveSession(user) {
    this.currentUser = user;
    try {
      if (user) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.SESSION_KEY);
      }
    } catch (e) {
      console.error("Error saving auth session:", e);
    }
    this.notifyListeners();
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notifyListeners() {
    this.listeners.forEach(fn => fn(this.currentUser));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === "admin";
  }

  isCashier() {
    return this.currentUser && (this.currentUser.role === "cashier" || this.currentUser.role === "admin");
  }

  isTech() {
    return this.currentUser && (this.currentUser.role === "tech" || this.currentUser.role === "admin");
  }

  hasPermission(perm) {
    if (!this.currentUser) return false;
    if (this.currentUser.role === "admin") return true;
    return this.currentUser.permissions && this.currentUser.permissions.includes(perm);
  }

  login(username, pin) {
    const user = db.getUserByUsername(username);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (!user.active) {
      return { success: false, message: "Account is disabled. Contact Admin." };
    }
    if (user.pin && user.pin !== pin) {
      return { success: false, message: "Invalid PIN / Password" };
    }

    this.saveSession(user);
    db.logActivity("USER_LOGIN", `${user.name} logged into system`, user);
    return { success: true, user: user };
  }

  // Quick switch for demo testing
  switchUser(userId) {
    const user = db.getUserById(userId);
    if (user) {
      this.saveSession(user);
      db.logActivity("USER_SWITCHED", `Switched active session to ${user.name} (${user.role})`, user);
      return { success: true, user: user };
    }
    return { success: false, message: "User not found" };
  }

  logout() {
    const prevUser = this.currentUser;
    this.saveSession(null);
    if (prevUser) {
      db.logActivity("USER_LOGOUT", `${prevUser.name} logged out`, prevUser);
    }
  }
}

const auth = new AuthManager();
