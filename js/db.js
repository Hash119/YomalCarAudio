// Auto Doc - Yomal Car Audio - LocalStorage ORM & Reactive Store
// Manages products, invoices, approvals, users, and audit logs with event emitter

class DataStore {
  constructor() {
    this.STORAGE_KEY = "YOMAL_CAR_AUDIO_DB_V1";
    this.listeners = [];
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // One-time migration for old contact info
        if (parsed.shopInfo) {
            const oldAddr = parsed.shopInfo.address || "";
            const oldPhone = parsed.shopInfo.phone || "";
            if (oldAddr.includes("Kurunegala") || oldPhone.includes("123")) {
                parsed.shopInfo.phone = "+94 76 935 0735";
                parsed.shopInfo.whatsapp = "+94771564131";
                parsed.shopInfo.address = "77/A moris road milidduwa , Galle, Sri Lanka";
                parsed.shopInfo.branch = "Galle Flagship Studio";
                parsed.shopInfo.regNo = "BR-YCA-10294";
                parsed.shopInfo.facebook = "https://web.facebook.com/Yomalcaraudioo/";
                
                // Save it back to local storage immediately so it persists
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
            }
        }

        // Ensure all required collections exist
        return {
          shopInfo: { ...INITIAL_DATA.shopInfo, ...(parsed.shopInfo || {}) },
          users: parsed.users || INITIAL_DATA.users,
          products: parsed.products || INITIAL_DATA.products,
          services: parsed.services || INITIAL_DATA.services,
          invoices: parsed.invoices || INITIAL_DATA.invoices,
          approvals: parsed.approvals || INITIAL_DATA.approvals,
          activityLog: parsed.activityLog || INITIAL_DATA.activityLog
        };
      }
    } catch (e) {
      console.warn("Failed to load state from localStorage, initializing fresh data:", e);
    }
    // Initialize with clone of INITIAL_DATA
    const fresh = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveStateDirect(fresh);
    return fresh;
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      this.notifyListeners();
    } catch (e) {
      console.error("Error saving state to localStorage:", e);
    }
  }

  saveStateDirect(stateObj) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateObj));
    } catch (e) {
      console.error("Error saving state directly:", e);
    }
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (err) {
        console.error("Error in state subscriber:", err);
      }
    });
  }

  // Activity Logger
  logActivity(action, description, user) {
    const entry = {
      id: "act-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      userId: user ? user.id : "system",
      userName: user ? user.name : "System Auto",
      action: action,
      description: description
    };
    this.state.activityLog.unshift(entry);
    if (this.state.activityLog.length > 200) {
      this.state.activityLog.pop();
    }
    this.saveState();
  }

  // Product Operations
  getProducts() {
    return [...this.state.products];
  }

  getProductById(id) {
    return this.state.products.find(p => p.id === id);
  }

  addProduct(productData, creatorUser) {
    const newProd = {
      ...productData,
      id: "prod-" + Date.now(),
      createdAt: new Date().toISOString()
    };
    this.state.products.push(newProd);
    this.logActivity("PRODUCT_ADDED", `Added product: ${newProd.name} (${newProd.sku})`, creatorUser);
    this.saveState();
    return newProd;
  }

  updateProduct(id, updates, updaterUser) {
    const idx = this.state.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      const oldProd = this.state.products[idx];
      this.state.products[idx] = { ...oldProd, ...updates, updatedAt: new Date().toISOString() };
      this.logActivity("PRODUCT_UPDATED", `Updated product: ${oldProd.name} (${oldProd.sku})`, updaterUser);
      this.saveState();
      return this.state.products[idx];
    }
    return null;
  }

  deleteProduct(id, user) {
    const prod = this.getProductById(id);
    if (prod) {
      this.state.products = this.state.products.filter(p => p.id !== id);
      this.logActivity("PRODUCT_DELETED", `Deleted product: ${prod.name} (${prod.sku})`, user);
      this.saveState();
      return true;
    }
    return false;
  }

  adjustStock(productId, qtyChange, reason, user) {
    const prod = this.getProductById(productId);
    if (prod) {
      const oldQty = prod.stockQty;
      prod.stockQty = Math.max(0, prod.stockQty + qtyChange);
      this.logActivity("STOCK_ADJUSTED", `Stock for ${prod.name} adjusted from ${oldQty} to ${prod.stockQty} (${reason})`, user);
      this.saveState();
      return prod;
    }
    return null;
  }

  // Services Operations
  getServices() {
    return [...this.state.services];
  }

  getServiceById(id) {
    return this.state.services.find(s => s.id === id);
  }

  // Invoice & POS Operations
  getInvoices() {
    return [...this.state.invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  getInvoiceById(id) {
    return this.state.invoices.find(inv => inv.id === id || inv.invoiceNumber === id);
  }

  getNextInvoiceNumber() {
    const prefix = "YCA-";
    const existingNums = this.state.invoices
      .map(inv => {
        const num = parseInt(inv.invoiceNumber.replace(prefix, ""), 10);
        return isNaN(num) ? 1000 : num;
      });
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 1000;
    return `${prefix}${maxNum + 1}`;
  }

  createInvoice(invoiceData, creatorUser) {
    const invoiceNumber = invoiceData.invoiceNumber || this.getNextInvoiceNumber();
    const newInvoice = {
      ...invoiceData,
      id: "INV-" + Date.now(),
      invoiceNumber: invoiceNumber,
      date: invoiceData.date || new Date().toISOString(),
      cashierId: creatorUser ? creatorUser.id : "usr-cash-01",
      cashierName: creatorUser ? creatorUser.name : "Staff"
    };

    // If invoice is completed (no pending discount), deduct inventory stock
    if (newInvoice.status === "Completed") {
      this.deductInventoryForInvoice(newInvoice, creatorUser);
    }

    this.state.invoices.unshift(newInvoice);
    this.logActivity(
      "INVOICE_CREATED",
      `Created Invoice #${newInvoice.invoiceNumber} for ${newInvoice.customerName} (Rs. ${newInvoice.totalAmount.toLocaleString()}) [${newInvoice.status}]`,
      creatorUser
    );
    this.saveState();
    return newInvoice;
  }

  deductInventoryForInvoice(invoice, user) {
    invoice.items.forEach(item => {
      if (item.id && item.id.startsWith("prod-")) {
        const product = this.getProductById(item.id);
        if (product) {
          product.stockQty = Math.max(0, product.stockQty - item.qty);
          this.logActivity(
            "STOCK_DEDUCTED",
            `Deducted ${item.qty} units of ${product.name} for Invoice #${invoice.invoiceNumber}`,
            user
          );
        }
      }
    });
  }

  updateInvoice(id, updates, user) {
    const idx = this.state.invoices.findIndex(inv => inv.id === id);
    if (idx !== -1) {
      const old = this.state.invoices[idx];
      const updated = { ...old, ...updates };
      
      // If transitioned from pending to completed, deduct stock
      if (old.status !== "Completed" && updated.status === "Completed") {
        this.deductInventoryForInvoice(updated, user);
      }

      this.state.invoices[idx] = updated;
      this.saveState();
      return updated;
    }
    return null;
  }

  // Approvals Operations
  getApprovals(status = null, type = null) {
    let list = [...this.state.approvals];
    if (status) {
      list = list.filter(a => a.status === status);
    }
    if (type) {
      list = list.filter(a => a.type === type);
    }
    return list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  }

  getApprovalById(id) {
    return this.state.approvals.find(a => a.id === id);
  }

  getPendingApprovalsCount() {
    return this.state.approvals.filter(a => a.status === "pending").length;
  }

  createApproval(approvalData, creatorUser) {
    const newApproval = {
      ...approvalData,
      id: "appr-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      requesterId: creatorUser ? creatorUser.id : "usr-cash-01",
      requesterName: creatorUser ? creatorUser.name : "Staff",
      requestedAt: new Date().toISOString(),
      status: "pending",
      actionLog: []
    };
    this.state.approvals.unshift(newApproval);
    this.logActivity(
      "APPROVAL_REQUESTED",
      `Submitted approval request: ${newApproval.title} (${newApproval.type})`,
      creatorUser
    );
    this.saveState();
    return newApproval;
  }

  resolveApproval(approvalId, decision, adminUser, reason = "") {
    const approval = this.getApprovalById(approvalId);
    if (!approval) return { success: false, message: "Approval request not found" };

    if (approval.status !== "pending") {
      return { success: false, message: "This request has already been resolved" };
    }

    approval.status = decision; // 'approved' or 'rejected'
    approval.resolvedAt = new Date().toISOString();
    approval.resolvedBy = adminUser ? adminUser.id : "admin";
    approval.resolvedByName = adminUser ? adminUser.name : "Admin";
    approval.resolutionReason = reason;
    approval.actionLog.push({
      action: decision,
      by: adminUser ? adminUser.name : "Admin",
      at: new Date().toISOString(),
      reason: reason
    });

    // Handle Type-Specific Side Effects
    if (approval.type === "discount") {
      const invoice = this.state.invoices.find(inv => inv.id === approval.targetId || inv.invoiceNumber === approval.targetRef);
      if (invoice) {
        if (decision === "approved") {
          invoice.discountStatus = "approved";
          invoice.status = "Completed";
          invoice.paymentStatus = "Paid";
          invoice.approvedBy = adminUser.id;
          invoice.approvedAt = new Date().toISOString();
          this.deductInventoryForInvoice(invoice, adminUser);
          this.logActivity("DISCOUNT_APPROVED", `Admin approved discount for Invoice #${invoice.invoiceNumber}`, adminUser);
        } else {
          invoice.discountStatus = "rejected";
          invoice.status = "Discount Rejected";
          invoice.paymentStatus = "Action Required";
          invoice.rejectReason = reason;
          this.logActivity("DISCOUNT_REJECTED", `Admin rejected discount for Invoice #${invoice.invoiceNumber}. Reason: ${reason}`, adminUser);
        }
      }
    } else if (approval.type === "new_inventory") {
      if (decision === "approved") {
        const itemDetails = approval.details;
        const newProduct = {
          id: "prod-" + Date.now(),
          sku: approval.targetRef || "SKU-" + Math.floor(1000 + Math.random() * 9000),
          name: itemDetails.name,
          category: itemDetails.category || "Audio & Subwoofers",
          description: itemDetails.description || "Added via staff approval request",
          unitCost: Number(itemDetails.unitCost) || 0,
          salePrice: Number(itemDetails.salePrice) || 0,
          discountPrice: Number(itemDetails.discountPrice) || Number(itemDetails.salePrice),
          specialPrice: Number(itemDetails.specialPrice) || Number(itemDetails.discountPrice),
          stockQty: Number(itemDetails.initialStock) || 0,
          reorderLevel: Number(itemDetails.reorderLevel) || 3,
          warranty: itemDetails.warranty || "1 Year",
          isSampleItem: false,
          imageUrl: itemDetails.imageUrl || "assets/custom_subwoofer.jpg",
          createdAt: new Date().toISOString()
        };
        this.state.products.push(newProduct);
        this.logActivity("INVENTORY_APPROVED", `Admin approved new item addition: ${newProduct.name}`, adminUser);
      } else {
        this.logActivity("INVENTORY_REJECTED", `Admin rejected new item request: ${approval.title}. Reason: ${reason}`, adminUser);
      }
    } else if (approval.type === "price_change") {
      const product = this.getProductById(approval.targetId);
      if (product && decision === "approved") {
        const proposed = approval.details.proposedPrices;
        product.salePrice = Number(proposed.salePrice) || product.salePrice;
        if (proposed.discountPrice !== undefined) product.discountPrice = Number(proposed.discountPrice);
        if (proposed.specialPrice !== undefined) product.specialPrice = Number(proposed.specialPrice);
        product.updatedAt = new Date().toISOString();
        this.logActivity("PRICE_APPROVED", `Admin approved price change for ${product.name} (New Sale: Rs. ${product.salePrice.toLocaleString()})`, adminUser);
      } else if (product && decision === "rejected") {
        this.logActivity("PRICE_REJECTED", `Admin rejected price change for ${product.name}. Reason: ${reason}`, adminUser);
      }
    }

    this.saveState();
    return { success: true, message: `Request successfully ${decision}` };
  }

  // User Management Operations
  getUsers() {
    return [...this.state.users];
  }

  getUserById(id) {
    return this.state.users.find(u => u.id === id);
  }

  getUserByUsername(username) {
    return this.state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  createUser(userData, adminUser) {
    const exists = this.getUserByUsername(userData.username);
    if (exists) {
      return { success: false, message: "Username already exists" };
    }

    const newUser = {
      id: "usr-" + Date.now(),
      username: userData.username.trim(),
      pin: userData.pin || "1234",
      name: userData.name.trim(),
      role: userData.role || "cashier",
      roleTitle: userData.roleTitle || (userData.role === "admin" ? "Administrator" : userData.role === "cashier" ? "Billing Officer" : "Technician"),
      email: userData.email || "",
      phone: userData.phone || "",
      avatar: userData.avatar || (userData.role === "admin" ? "👑" : userData.role === "cashier" ? "💳" : "🔧"),
      createdAt: new Date().toISOString(),
      active: true,
      permissions: userData.role === "admin" 
        ? ["billing", "inventory_manage", "approve_all", "users_manage", "view_reports", "price_override"]
        : userData.role === "cashier"
        ? ["billing", "inventory_request", "price_request", "view_own_sales"]
        : ["view_inventory", "inventory_request", "service_jobs"]
    };

    this.state.users.push(newUser);
    this.logActivity("USER_CREATED", `Admin created new user account: ${newUser.name} (@${newUser.username}) [${newUser.role}]`, adminUser);
    this.saveState();
    return { success: true, user: newUser };
  }

  updateUser(id, updates, adminUser) {
    const idx = this.state.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      const old = this.state.users[idx];
      this.state.users[idx] = { ...old, ...updates };
      this.logActivity("USER_UPDATED", `Updated user: ${old.name} (@${old.username})`, adminUser);
      this.saveState();
      return { success: true, user: this.state.users[idx] };
    }
    return { success: false, message: "User not found" };
  }

  deleteUser(id, adminUser) {
    const user = this.getUserById(id);
    if (!user) return { success: false, message: "User not found" };
    if (user.role === "admin" && this.state.users.filter(u => u.role === "admin").length <= 1) {
      return { success: false, message: "Cannot delete the only master admin account" };
    }
    this.state.users = this.state.users.filter(u => u.id !== id);
    this.logActivity("USER_DELETED", `Deleted user account: ${user.name} (@${user.username})`, adminUser);
    this.saveState();
    return { success: true, message: "User deleted" };
  }

  // Analytics & End-Of-Day (EOD) Calculations
  getDailySalesStats(targetDate = new Date()) {
    const dateStr = typeof targetDate === "string" ? targetDate.substring(0, 10) : targetDate.toISOString().substring(0, 10);
    const dayInvoices = this.state.invoices.filter(inv => {
      return inv.date && inv.date.startsWith(dateStr) && inv.status === "Completed";
    });

    const pendingInvoices = this.state.invoices.filter(inv => {
      return inv.date && inv.date.startsWith(dateStr) && inv.status === "Pending Approval";
    });

    const grossSales = dayInvoices.reduce((sum, inv) => sum + (inv.subTotal || 0), 0);
    const totalDiscounts = dayInvoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);
    const netRevenue = dayInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const paymentBreakdown = {
      Cash: 0,
      Card: 0,
      "Bank Transfer": 0,
      Other: 0
    };

    dayInvoices.forEach(inv => {
      const method = inv.paymentMethod || "Cash";
      if (paymentBreakdown[method] !== undefined) {
        paymentBreakdown[method] += inv.totalAmount;
      } else {
        paymentBreakdown.Other += inv.totalAmount;
      }
    });

    return {
      date: dateStr,
      completedInvoicesCount: dayInvoices.length,
      pendingInvoicesCount: pendingInvoices.length,
      grossSales,
      totalDiscounts,
      netRevenue,
      paymentBreakdown,
      invoices: dayInvoices
    };
  }

  getTopSellingItems(limit = 6) {
    const itemMap = {};

    this.state.invoices
      .filter(inv => inv.status === "Completed")
      .forEach(inv => {
        inv.items.forEach(item => {
          const key = item.id || item.name;
          if (!itemMap[key]) {
            itemMap[key] = {
              id: item.id,
              name: item.name,
              qtySold: 0,
              totalRevenue: 0,
              isService: item.id && item.id.startsWith("srv-")
            };
          }
          itemMap[key].qtySold += item.qty || 1;
          itemMap[key].totalRevenue += item.total || 0;
        });
      });

    return Object.values(itemMap)
      .sort((a, b) => b.qtySold - a.qtySold || b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  // Backup & Reset Utilities
  exportBackup() {
    return JSON.stringify(this.state, null, 2);
  }

  importBackup(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.products && parsed.invoices && parsed.users) {
        this.state = parsed;
        this.saveState();
        return { success: true, message: "Backup successfully restored!" };
      }
      return { success: false, message: "Invalid backup format" };
    } catch (e) {
      return { success: false, message: "JSON parsing error: " + e.message };
    }
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveState();
    return { success: true, message: "Database reset to initial demo state" };
  }
}

// Global Singleton Instance
const db = new DataStore();
