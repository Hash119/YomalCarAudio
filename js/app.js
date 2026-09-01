// Auto Doc - Yomal Car Audio - Master Application Controller & Router
// Integrates views, public quote calculator, booking modal, role switcher, and live subscriptions

class AppRouter {
  constructor() {
    this.currentView = "landing"; // 'landing', 'pos', 'invoices', 'inventory', 'approvals', 'dashboard', 'users', 'settings'
    this.selectedQuoteServices = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDataSubscriptions();
    this.renderNavbarUserStatus();
    this.navigateTo(this.currentView);
    this.initPublicLanding();
  }

  setupEventListeners() {
    // Navigation items
    document.querySelectorAll("[data-nav-target]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const target = btn.dataset.navTarget;
        this.navigateTo(target);
      });
    });

    // POS Search and Category filters
    const posSearchInput = document.getElementById("pos-search-input");
    if (posSearchInput) {
      posSearchInput.addEventListener("input", (e) => {
        posEngine.searchQuery = e.target.value;
        posEngine.renderPOSProductsGrid();
      });
    }

    document.querySelectorAll(".pos-cat-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".pos-cat-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        posEngine.activeCategory = pill.dataset.category;
        posEngine.renderPOSProductsGrid();
      });
    });

    // POS Discount Inputs
    const discTypeEl = document.getElementById("pos-discount-type");
    const discValEl = document.getElementById("pos-discount-val");
    if (discTypeEl && discValEl) {
      const updateDiscount = () => {
        posEngine.setDiscount(discTypeEl.value, discValEl.value);
      };
      discTypeEl.addEventListener("change", updateDiscount);
      discValEl.addEventListener("input", updateDiscount);
    }

    // Inventory Search & Category filters
    const invSearch = document.getElementById("inventory-search-input");
    if (invSearch) {
      invSearch.addEventListener("input", (e) => {
        inventoryManager.searchQuery = e.target.value;
        inventoryManager.renderInventoryTable();
      });
    }

    const invCatFilter = document.getElementById("inventory-category-filter");
    if (invCatFilter) {
      invCatFilter.addEventListener("change", (e) => {
        inventoryManager.selectedCategory = e.target.value;
        inventoryManager.renderInventoryTable();
      });
    }

    // Approvals Filter Buttons
    document.querySelectorAll(".approvals-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        approvalsCenter.setFilter(btn.dataset.filter);
      });
    });
  }

  setupDataSubscriptions() {
    db.subscribe(() => {
      this.refreshCurrentView();
      approvalsCenter.updateBadges();
    });

    auth.subscribe(() => {
      this.renderNavbarUserStatus();
      this.refreshCurrentView();
    });
  }

  navigateTo(viewId) {
    // Route Protection: All views other than 'landing' require authentication!
    if (viewId !== "landing" && !auth.isLoggedIn()) {
      this.pendingRedirectView = viewId;
      this.openLoginModal();
      UI.showToast("🔒 Staff Login Required: Please login to access the workshop system & dashboard.", "warning", 4000);
      return;
    }

    this.currentView = viewId;

    // Toggle main sections
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });

    const activeSec = document.getElementById(`view-${viewId}`);
    if (activeSec) {
      activeSec.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Update active nav links
    document.querySelectorAll("[data-nav-target]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.navTarget === viewId);
    });

    this.refreshCurrentView();
  }

  refreshCurrentView() {
    const isAdmin = auth.isAdmin();
    const isLoggedIn = auth.isLoggedIn();

    // Show/Hide Admin-only elements
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = isAdmin ? "" : "none";
    });

    // Show/Hide Staff-only elements
    document.querySelectorAll(".staff-only").forEach(el => {
      el.style.display = isLoggedIn ? "" : "none";
    });

    // Show/Hide Public-only elements
    document.querySelectorAll(".public-only").forEach(el => {
      el.style.display = isLoggedIn ? "none" : "";
    });

    switch (this.currentView) {
      case "landing":
        this.renderPublicLanding();
        break;
      case "pos":
        posEngine.renderPOSProductsGrid();
        posEngine.renderCart();
        break;
      case "invoices":
        posEngine.renderInvoicesList();
        break;
      case "inventory":
        inventoryManager.renderInventoryTable();
        break;
      case "approvals":
        approvalsCenter.renderApprovalsList();
        break;
      case "dashboard":
        dashboardAnalytics.renderDashboard();
        break;
      case "users":
        usersManager.renderUsersTable();
        break;
      case "settings":
        this.renderSettingsView();
        break;
    }
  }

  renderNavbarUserStatus() {
    const userContainer = document.getElementById("nav-user-profile");
    if (!userContainer) return;

    const user = auth.getCurrentUser();
    const isLoggedIn = auth.isLoggedIn();

    // Toggle public vs staff navigation links
    document.querySelectorAll(".staff-nav-item").forEach(el => {
      el.style.display = isLoggedIn ? "" : "none";
    });
    document.querySelectorAll(".public-nav-item").forEach(el => {
      el.style.display = isLoggedIn ? "none" : "";
    });

    if (!user) {
      userContainer.innerHTML = `
        <button class="btn btn-sm btn-gold" onclick="appRouter.openLoginModal()">
          <span>🔐 Staff / Admin Login</span>
        </button>
      `;
      return;
    }

    userContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div class="user-session-pill" onclick="appRouter.openUserSwitchModal()" title="Click to switch role or view profile">
          <span class="user-icon">${user.avatar || '👤'}</span>
          <div class="user-meta">
            <span class="user-name">${user.name}</span>
            <span class="user-role role-${user.role}">${user.roleTitle || user.role.toUpperCase()}</span>
          </div>
          <span class="switch-arrow">▼</span>
        </div>
        <button class="btn btn-sm btn-outline" onclick="appRouter.handleLogout()" title="Logout of Staff Session">
          <span>🚪 Logout</span>
        </button>
      </div>
    `;

    approvalsCenter.updateBadges();
  }

  openLoginModal() {
    UI.openModal("staff-login-modal");
  }

  handleStaffLoginSubmit(username, pin) {
    const res = auth.login(username, pin);
    if (res.success) {
      UI.triggerCelebration();
      UI.closeModal("staff-login-modal");
      UI.showToast(`Welcome back, ${res.user.name}! Access unlocked.`, "success");
      const target = this.pendingRedirectView || "dashboard";
      this.pendingRedirectView = null;
      this.navigateTo(target);
    } else {
      UI.showToast(res.message, "error");
    }
  }

  quickDemoLogin(username) {
    const user = db.getUserByUsername(username);
    if (user) {
      document.getElementById("login-username").value = user.username;
      document.getElementById("login-pin").value = user.pin || "1234";
      this.handleStaffLoginSubmit(user.username, user.pin || "1234");
    }
  }

  handleLogout() {
    auth.logout();
    UI.showToast("Logged out successfully. Returned to public showcase.", "info");
    this.navigateTo("landing");
  }

  openUserSwitchModal() {
    const listEl = document.getElementById("user-switch-list");
    if (!listEl) return;

    const users = db.getUsers();
    const current = auth.getCurrentUser();

    listEl.innerHTML = users.map(u => `
      <div class="user-switch-item ${current && current.id === u.id ? 'active' : ''}" onclick="usersManager.switchToUser('${u.id}'); UI.closeModal('user-switch-modal');">
        <div class="u-avatar">${u.avatar || '👤'}</div>
        <div class="u-info">
          <strong>${u.name}</strong>
          <small>${u.roleTitle || u.role} (@${u.username})</small>
        </div>
        ${current && current.id === u.id ? '<span class="badge-active-now">Current</span>' : '<span class="btn-select-u">Switch &rarr;</span>'}
      </div>
    `).join("");

    UI.openModal("user-switch-modal");
  }

  // Public Landing Page Features
  initPublicLanding() {
    this.renderPublicServices();
    this.renderPublicProducts();
    this.setupQuoteCalculator();
  }

  renderPublicLanding() {
    this.renderPublicServices();
    this.renderPublicProducts();
  }

  renderPublicServices() {
    const container = document.getElementById("public-services-grid");
    if (!container) return;

    const services = db.getServices();
    container.innerHTML = services.map(srv => `
      <div class="service-card">
        <div class="srv-icon-box">🔧</div>
        <div class="srv-header">
          <h4>${srv.name}</h4>
          <span class="srv-category">${srv.category}</span>
        </div>
        <p class="srv-desc">${srv.description}</p>
        <div class="srv-footer">
          <div class="srv-pricing">
            <span class="lbl">Starting From</span>
            <strong>${UI.formatCurrency(srv.basePrice)}</strong>
          </div>
          <button class="btn btn-sm btn-outline-gold" onclick="appRouter.openBookingModal('${srv.name}', ${srv.basePrice})">
            📅 Book Service
          </button>
        </div>
      </div>
    `).join("");
  }

  renderPublicProducts() {
    const container = document.getElementById("public-products-grid");
    if (!container) return;

    const products = db.getProducts().slice(0, 8);
    container.innerHTML = products.map(prod => `
      <div class="product-showcase-card">
        <div class="prod-img-wrapper">
          <img src="${prod.imageUrl || 'assets/hero_car_audio.jpg'}" alt="${prod.name}" class="prod-thumb" onerror="this.src='assets/hero_car_audio.jpg'" />
          ${prod.isSampleItem ? '<span class="badge-sample-tag">⭐ Featured Item</span>' : ''}
          <span class="badge-warranty-tag">🛡️ ${prod.warranty || '1 Year'}</span>
        </div>
        <div class="prod-details">
          <span class="prod-cat-pill">${prod.category}</span>
          <h4 class="prod-title">${prod.name}</h4>
          <p class="prod-brief">${prod.description}</p>
          <div class="prod-card-bottom">
            <div class="prod-pricing-block">
              <span class="price-val">${UI.formatCurrency(prod.salePrice)}</span>
              ${prod.discountPrice ? `<span class="price-disc font-mono">Special: ${UI.formatCurrency(prod.specialPrice || prod.discountPrice)}</span>` : ''}
            </div>
            <a href="https://wa.me/94771234567?text=${encodeURIComponent(`Hi Auto Doc Yomal Car Audio, I would like to inquire about ${prod.name} (Ref: ${prod.sku})`)}" target="_blank" class="btn-wa-inquire" title="Inquire on WhatsApp">
              <span>💬 Inquire</span>
            </a>
          </div>
        </div>
      </div>
    `).join("");
  }

  setupQuoteCalculator() {
    const container = document.getElementById("quote-services-selection");
    if (!container) return;

    const services = db.getServices();
    const products = db.getProducts().filter(p => p.isSampleItem || p.category.includes("Displays") || p.category.includes("Audio"));

    let items = [
      ...services.map(s => ({ id: s.id, name: s.name, price: s.basePrice, type: "Service" })),
      ...products.map(p => ({ id: p.id, name: p.name, price: p.salePrice, type: "Item" }))
    ];

    container.innerHTML = items.map(item => `
      <label class="quote-item-checkbox">
        <input type="checkbox" value="${item.id}" data-name="${item.name}" data-price="${item.price}" onchange="appRouter.recalculateQuote()" />
        <div class="quote-check-label">
          <span class="q-name">${item.name}</span>
          <span class="q-price">${UI.formatCurrency(item.price)}</span>
        </div>
      </label>
    `).join("");
  }

  recalculateQuote() {
    const checked = document.querySelectorAll("#quote-services-selection input:checked");
    let total = 0;
    let selectedNames = [];

    checked.forEach(cb => {
      total += Number(cb.dataset.price) || 0;
      selectedNames.push(cb.dataset.name);
    });

    const totalEl = document.getElementById("quote-estimated-total");
    const countEl = document.getElementById("quote-selected-count");
    const waBtn = document.getElementById("quote-whatsapp-btn");

    if (totalEl) totalEl.textContent = UI.formatCurrency(total);
    if (countEl) countEl.textContent = `${checked.length} Services / Items Selected`;

    if (waBtn) {
      const carModel = document.getElementById("quote-car-model")?.value || "My Car";
      let msg = `*Auto Doc Yomal Car Audio - Instant Estimate Request*\n`;
      msg += `🚗 Vehicle: ${carModel}\n`;
      msg += `📦 Selected Items/Services:\n`;
      selectedNames.forEach((n, i) => msg += `${i + 1}. ${n}\n`);
      msg += `\n*Estimated Total:* Rs. ${total.toLocaleString()}\n`;
      msg += `Please let me know available booking slots!`;

      waBtn.href = `https://wa.me/94771234567?text=${encodeURIComponent(msg)}`;
    }
  }

  openBookingModal(serviceName = "", price = 0) {
    const inputService = document.getElementById("booking-service-name");
    if (inputService) inputService.value = serviceName || "General Vehicle Customization";
    UI.openModal("service-booking-modal");
  }

  handleBookingSubmit() {
    const name = document.getElementById("booking-cust-name")?.value || "Customer";
    const phone = document.getElementById("booking-cust-phone")?.value || "";
    const vehicle = document.getElementById("booking-cust-vehicle")?.value || "";
    const service = document.getElementById("booking-service-name")?.value || "";
    const date = document.getElementById("booking-date")?.value || "Earliest Slot";

    let msg = `*Auto Doc - New Service Appointment Request*\n`;
    msg += `👤 Customer: ${name}\n`;
    msg += `📞 Phone: ${phone}\n`;
    msg += `🚗 Vehicle: ${vehicle}\n`;
    msg += `🔧 Service: ${service}\n`;
    msg += `📅 Preferred Date: ${date}\n`;

    UI.closeModal("service-booking-modal");
    window.open(`https://wa.me/94771234567?text=${encodeURIComponent(msg)}`, "_blank");
    UI.showToast("Opening WhatsApp with your booking details...", "success");
  }

  // Public Online Invoice Lookup
  lookupPublicInvoice() {
    const invInput = document.getElementById("public-invoice-search-input");
    if (!invInput) return;

    const invNum = invInput.value.trim();
    if (!invNum) {
      UI.showToast("Please enter an Invoice Number (e.g. YCA-1001)", "warning");
      return;
    }

    const invoice = db.getInvoiceById(invNum);
    if (invoice) {
      posEngine.showInvoiceModal(invoice.id);
    } else {
      UI.showToast(`Invoice "${invNum}" not found. Please verify the invoice number.`, "error");
    }
  }

  renderSettingsView() {
    const shop = db.state.shopInfo;
    const shopName = document.getElementById("set-shop-name");
    const shopPhone = document.getElementById("set-shop-phone");
    const shopAddress = document.getElementById("set-shop-address");
    const shopFb = document.getElementById("set-shop-fb");

    if (shopName) shopName.value = shop.name;
    if (shopPhone) shopPhone.value = shop.phone;
    if (shopAddress) shopAddress.value = shop.address;
    if (shopFb) shopFb.value = shop.facebook || "https://web.facebook.com/Yomalcaraudioo/";
  }

  saveSettings() {
    if (!auth.isAdmin()) {
      UI.showToast("Only Admin can update shop settings", "error");
      return;
    }

    const shopName = document.getElementById("set-shop-name")?.value || db.state.shopInfo.name;
    const shopPhone = document.getElementById("set-shop-phone")?.value || db.state.shopInfo.phone;
    const shopAddress = document.getElementById("set-shop-address")?.value || db.state.shopInfo.address;
    const shopFb = document.getElementById("set-shop-fb")?.value || db.state.shopInfo.facebook;

    db.state.shopInfo.name = shopName;
    db.state.shopInfo.phone = shopPhone;
    db.state.shopInfo.address = shopAddress;
    db.state.shopInfo.facebook = shopFb;
    db.saveState();

    UI.showToast("Shop settings updated successfully!", "success");
  }

  downloadDatabaseBackup() {
    const jsonStr = db.exportBackup();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Yomal_Car_Audio_Backup_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    UI.showToast("Backup exported successfully!", "success");
  }

  restoreDatabaseBackup(fileInput) {
    if (!fileInput.files || !fileInput.files[0]) return;
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = db.importBackup(e.target.result);
      if (res.success) {
        UI.showToast(res.message, "success");
        this.refreshCurrentView();
      } else {
        UI.showToast(res.message, "error");
      }
    };
    reader.readAsText(file);
  }

  resetDemoDatabase() {
    if (confirm("Reset all data back to original default demo state? Custom invoices and stock edits will be restored.")) {
      db.resetToDefault();
      UI.showToast("Database reset to factory default!", "success");
      this.refreshCurrentView();
    }
  }
}

// Global router instantiation on DOM loaded
let appRouter;
document.addEventListener("DOMContentLoaded", () => {
  appRouter = new AppRouter();
  window.appRouter = appRouter;
});
