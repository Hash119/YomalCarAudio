// Auto Doc - Yomal Car Audio - User Management Module
// Allows Admin to create, view, edit, and toggle users with role assignments

class UsersManager {
  renderUsersTable() {
    const container = document.getElementById("users-table-body");
    if (!container) return;

    const users = db.getUsers();
    const currentUser = auth.getCurrentUser();
    const isAdmin = auth.isAdmin();

    container.innerHTML = users.map(user => {
      const isCurrent = currentUser && currentUser.id === user.id;

      let roleBadge = "";
      if (user.role === "admin") {
        roleBadge = '<span class="role-badge badge-admin">👑 Master Admin</span>';
      } else if (user.role === "cashier") {
        roleBadge = '<span class="role-badge badge-cashier">💳 Billing Cashier</span>';
      } else {
        roleBadge = '<span class="role-badge badge-tech">🔧 Lead Technician</span>';
      }

      return `
        <tr>
          <td>
            <div class="user-cell">
              <span class="user-avatar">${user.avatar || '👤'}</span>
              <div>
                <strong>${user.name}</strong>
                <div class="user-uname font-mono">@${user.username} ${isCurrent ? '<span class="badge-current-you">(You)</span>' : ''}</div>
              </div>
            </div>
          </td>
          <td>${roleBadge}</td>
          <td>
            <div>${user.email || 'No email'}</div>
            <small class="text-muted">${user.phone || 'No phone'}</small>
          </td>
          <td>
            <div class="perms-tag-cloud">
              ${(user.permissions || []).map(p => `<span class="perm-tag">${p}</span>`).join("")}
            </div>
          </td>
          <td>
            <span class="status-pill ${user.active ? 'status-completed' : 'status-rejected'}">
              ${user.active ? 'Active' : 'Disabled'}
            </span>
          </td>
          <td>
            ${isAdmin ? `
              <div class="action-buttons-group">
                <button class="btn-sm btn-outline" title="Switch Session to this user" onclick="usersManager.switchToUser('${user.id}')">
                  🔄 Switch
                </button>
                ${!isCurrent && user.role !== "admin" ? `
                  <button class="btn-sm btn-danger-soft" title="Delete User" onclick="usersManager.deleteUser('${user.id}')">
                    🗑️
                  </button>
                ` : ''}
              </div>
            ` : '<span class="text-muted">Read Only</span>'}
          </td>
        </tr>
      `;
    }).join("");
  }

  openAddUserModal() {
    if (!auth.isAdmin()) {
      UI.showToast("Only Admin can add new staff accounts", "error");
      return;
    }
    UI.openModal("add-user-modal");
  }

  handleAddUserSubmit(formData) {
    const adminUser = auth.getCurrentUser();
    if (!auth.isAdmin()) {
      UI.showToast("Access Denied", "error");
      return;
    }

    const username = formData.username.trim();
    const name = formData.name.trim();
    const role = formData.role;
    const pin = formData.pin.trim() || "1234";
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (!username || !name) {
      UI.showToast("Please provide username and full name", "error");
      return;
    }

    const res = db.createUser({
      username,
      name,
      role,
      pin,
      email,
      phone
    }, adminUser);

    if (res.success) {
      UI.triggerCelebration();
      UI.showToast(`User account @${username} created successfully!`, "success");
      UI.closeModal("add-user-modal");
      this.renderUsersTable();
      if (window.appRouter) appRouter.renderNavbarUserStatus();
    } else {
      UI.showToast(res.message, "error");
    }
  }

  switchToUser(userId) {
    const res = auth.switchUser(userId);
    if (res.success) {
      UI.showToast(`Switched active session to ${res.user.name} (${res.user.role})`, "info");
      if (window.appRouter) appRouter.renderNavbarUserStatus();
      appRouter.refreshCurrentView();
    }
  }

  deleteUser(userId) {
    if (confirm("Are you sure you want to delete this user account?")) {
      const res = db.deleteUser(userId, auth.getCurrentUser());
      if (res.success) {
        UI.showToast("User account deleted", "info");
        this.renderUsersTable();
      } else {
        UI.showToast(res.message, "error");
      }
    }
  }
}

const usersManager = new UsersManager();
