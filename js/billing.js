// Auto Doc - Yomal Car Audio - POS Billing & Invoicing Engine
// Handles cart state, item selection, multi-tier pricing, discount approval workflow, and invoice rendering

class BillingEngine {
  constructor() {
    this.cart = [];
    this.customer = {
      name: "",
      phone: "",
      vehicleNumber: "",
      vehicleModel: "",
      notes: ""
    };
    this.paymentMethod = "Cash";
    this.discountType = "percentage"; // 'percentage' or 'fixed'
    this.discountValue = 0;
    this.activeCategory = "all";
    this.searchQuery = "";
  }

  resetCart() {
    this.cart = [];
    this.customer = {
      name: "",
      phone: "",
      vehicleNumber: "",
      vehicleModel: "",
      notes: ""
    };
    this.paymentMethod = "Cash";
    this.discountType = "percentage";
    this.discountValue = 0;
    this.renderCart();
  }

  addItem(item, priceTier = "salePrice") {
    const existingIndex = this.cart.findIndex(i => i.id === item.id && i.priceTier === priceTier);
    let unitPrice = item[priceTier] || item.salePrice || item.basePrice || 0;

    // Check stock for physical products
    if (item.id && item.id.startsWith("prod-")) {
      const currentInCart = this.cart.filter(i => i.id === item.id).reduce((sum, i) => sum + i.qty, 0);
      if (currentInCart + 1 > item.stockQty) {
        UI.showToast(`Cannot add more. Only ${item.stockQty} units available in stock!`, "warning");
        return;
      }
    }

    if (existingIndex > -1) {
      this.cart[existingIndex].qty += 1;
      this.cart[existingIndex].total = this.cart[existingIndex].qty * this.cart[existingIndex].unitPrice;
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        category: item.category,
        priceTier: priceTier,
        unitPrice: unitPrice,
        originalSalePrice: item.salePrice || item.basePrice || unitPrice,
        unitCost: item.unitCost || 0,
        qty: 1,
        total: unitPrice,
        isService: item.id && item.id.startsWith("srv-")
      });
    }

    UI.playTone("success");
    this.renderCart();
    UI.showToast(`Added "${item.name}" to cart`, "info", 1500);
  }

  addCustomItem(name, unitPrice, isService = false) {
    if (!name || isNaN(unitPrice) || unitPrice <= 0) {
      UI.showToast("Please enter valid custom item details", "error");
      return;
    }

    this.cart.push({
      id: "custom-" + Date.now(),
      name: name,
      category: isService ? "Custom Labor / Service" : "Custom Parts",
      priceTier: "custom",
      unitPrice: Number(unitPrice),
      originalSalePrice: Number(unitPrice),
      unitCost: 0,
      qty: 1,
      total: Number(unitPrice),
      isService: isService
    });

    this.renderCart();
    UI.showToast(`Added custom item "${name}"`, "success");
  }

  updateItemQty(index, newQty) {
    if (index < 0 || index >= this.cart.length) return;
    const item = this.cart[index];

    if (newQty <= 0) {
      this.removeItem(index);
      return;
    }

    // Validate stock if product
    if (item.id && item.id.startsWith("prod-")) {
      const product = db.getProductById(item.id);
      if (product && newQty > product.stockQty) {
        UI.showToast(`Stock limit exceeded! Max available: ${product.stockQty}`, "warning");
        return;
      }
    }

    item.qty = newQty;
    item.total = item.qty * item.unitPrice;
    this.renderCart();
  }

  updateItemPriceTier(index, tier) {
    if (index < 0 || index >= this.cart.length) return;
    const item = this.cart[index];
    const product = db.getProductById(item.id);
    if (!product) return;

    item.priceTier = tier;
    if (tier === "salePrice") item.unitPrice = product.salePrice;
    else if (tier === "discountPrice") item.unitPrice = product.discountPrice || product.salePrice;
    else if (tier === "specialPrice") item.unitPrice = product.specialPrice || product.discountPrice || product.salePrice;

    item.total = item.qty * item.unitPrice;
    this.renderCart();
  }

  removeItem(index) {
    if (index >= 0 && index < this.cart.length) {
      const removed = this.cart.splice(index, 1)[0];
      this.renderCart();
      UI.showToast(`Removed "${removed.name}"`, "info", 1500);
    }
  }

  calculateTotals() {
    const subTotal = this.cart.reduce((sum, item) => sum + item.total, 0);
    let discountAmount = 0;

    if (this.discountValue > 0) {
      if (this.discountType === "percentage") {
        discountAmount = Math.round((subTotal * this.discountValue) / 100);
      } else {
        discountAmount = Math.min(subTotal, Number(this.discountValue));
      }
    }

    const totalAmount = Math.max(0, subTotal - discountAmount);

    return {
      subTotal,
      discountAmount,
      totalAmount
    };
  }

  renderPOSProductsGrid() {
    const container = document.getElementById("pos-products-grid");
    if (!container) return;

    const products = db.getProducts();
    const services = db.getServices();

    let allItems = [
      ...products.map(p => ({ ...p, type: "product" })),
      ...services.map(s => ({ ...s, type: "service", salePrice: s.basePrice, stockQty: 999 }))
    ];

    // Filter by Category
    if (this.activeCategory !== "all") {
      allItems = allItems.filter(item => item.category === this.activeCategory);
    }

    // Filter by Search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      allItems = allItems.filter(item => 
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
      );
    }

    if (allItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>No products or services found matching your search.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = allItems.map(item => {
      const isProduct = item.type === "product";
      const isLowStock = isProduct && item.stockQty <= (item.reorderLevel || 3);
      const isOutOfStock = isProduct && item.stockQty === 0;

      return `
        <div class="pos-item-card ${isOutOfStock ? 'out-of-stock' : ''}" data-id="${item.id}">
          <div class="pos-item-header">
            <span class="pos-item-badge ${isProduct ? 'badge-prod' : 'badge-srv'}">
              ${isProduct ? (item.isSampleItem ? '⭐ Sample Item' : '📦 Stock') : '🔧 Workshop Service'}
            </span>
            ${isProduct ? `
              <span class="pos-stock-badge ${isOutOfStock ? 'stock-out' : isLowStock ? 'stock-low' : 'stock-ok'}">
                ${isOutOfStock ? 'Out of Stock' : `${item.stockQty} in Stock`}
              </span>
            ` : '<span class="pos-duration-badge">⏱️ ' + (item.duration || 'Fast') + '</span>'}
          </div>

          <div class="pos-item-title">${item.name}</div>
          ${item.sku ? `<div class="pos-item-sku">${item.sku}</div>` : ''}

          <div class="pos-pricing-options">
            <div class="pos-price-tier active" onclick="posEngine.addItemFromCard('${item.id}', 'salePrice')">
              <span class="tier-name">Standard</span>
              <span class="tier-val">${UI.formatCurrency(item.salePrice || item.basePrice)}</span>
            </div>
            ${isProduct && item.discountPrice ? `
              <div class="pos-price-tier" onclick="posEngine.addItemFromCard('${item.id}', 'discountPrice')">
                <span class="tier-name">Disc. Tier</span>
                <span class="tier-val">${UI.formatCurrency(item.discountPrice)}</span>
              </div>
            ` : ''}
            ${isProduct && item.specialPrice ? `
              <div class="pos-price-tier tier-special" onclick="posEngine.addItemFromCard('${item.id}', 'specialPrice')">
                <span class="tier-name">Special</span>
                <span class="tier-val">${UI.formatCurrency(item.specialPrice)}</span>
              </div>
            ` : ''}
          </div>

          <button class="btn btn-pos-add" ${isOutOfStock ? 'disabled' : ''} onclick="posEngine.addItemFromCard('${item.id}', 'salePrice')">
            <span>+ Add to Cart</span>
          </button>
        </div>
      `;
    }).join("");
  }

  addItemFromCard(id, tier) {
    const product = db.getProductById(id);
    if (product) {
      this.addItem(product, tier);
      return;
    }
    const service = db.getServiceById(id);
    if (service) {
      this.addItem(service, "basePrice");
      return;
    }
  }

  renderCart() {
    const container = document.getElementById("pos-cart-items");
    const countBadge = document.getElementById("pos-cart-count");
    if (!container) return;

    if (countBadge) countBadge.textContent = this.cart.reduce((s, i) => s + i.qty, 0);

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <h4>Cart is Empty</h4>
          <p>Click on products or services from the catalog to start building customer invoice.</p>
        </div>
      `;
      this.updateSummaryUI(0, 0, 0);
      return;
    }

    container.innerHTML = this.cart.map((item, index) => {
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-sub">
              ${item.isService ? '<span class="tag-service">Service</span>' : '<span class="tag-product">Part</span>'}
              ${item.priceTier !== "custom" && !item.isService ? `
                <select class="cart-tier-select" onchange="posEngine.updateItemPriceTier(${index}, this.value)">
                  <option value="salePrice" ${item.priceTier === 'salePrice' ? 'selected' : ''}>Standard Price</option>
                  <option value="discountPrice" ${item.priceTier === 'discountPrice' ? 'selected' : ''}>Discount Price</option>
                  <option value="specialPrice" ${item.priceTier === 'specialPrice' ? 'selected' : ''}>Special Price</option>
                </select>
              ` : `<span class="cart-unit-price">${UI.formatCurrency(item.unitPrice)} each</span>`}
            </div>
          </div>

          <div class="cart-item-actions">
            <div class="qty-control">
              <button class="qty-btn" onclick="posEngine.updateItemQty(${index}, ${item.qty - 1})">-</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="posEngine.updateItemQty(${index}, ${item.qty + 1})">+</button>
            </div>
            <div class="cart-item-total">${UI.formatCurrency(item.total)}</div>
            <button class="cart-remove-btn" title="Remove item" onclick="posEngine.removeItem(${index})">&times;</button>
          </div>
        </div>
      `;
    }).join("");

    const totals = this.calculateTotals();
    this.updateSummaryUI(totals.subTotal, totals.discountAmount, totals.totalAmount);
  }

  updateSummaryUI(subTotal, discountAmount, totalAmount) {
    const subTotalEl = document.getElementById("pos-subtotal");
    const discountEl = document.getElementById("pos-discount-amt");
    const grandTotalEl = document.getElementById("pos-grandtotal");

    if (subTotalEl) subTotalEl.textContent = UI.formatCurrency(subTotal);
    if (discountEl) discountEl.textContent = "- " + UI.formatCurrency(discountAmount);
    if (grandTotalEl) grandTotalEl.textContent = UI.formatCurrency(totalAmount);
  }

  setDiscount(type, value) {
    this.discountType = type;
    this.discountValue = Number(value) || 0;
    this.renderCart();
  }

  // Handle Checkout & Discount Approval Logic
  checkout() {
    if (this.cart.length === 0) {
      UI.showToast("Cart is empty! Add products or services to create invoice.", "warning");
      return;
    }

    // Read customer input values
    const custName = (document.getElementById("pos-cust-name")?.value || "").trim() || "Walk-in Customer";
    const custPhone = (document.getElementById("pos-cust-phone")?.value || "").trim();
    const vehNumber = (document.getElementById("pos-veh-no")?.value || "").trim() || "General Vehicle";
    const vehModel = (document.getElementById("pos-veh-model")?.value || "").trim();
    const notes = (document.getElementById("pos-notes")?.value || "").trim();
    const paymentMethod = document.getElementById("pos-payment-method")?.value || "Cash";

    const totals = this.calculateTotals();
    const currentUser = auth.getCurrentUser();
    const hasAdditionalDiscount = totals.discountAmount > 0;
    const isAdmin = auth.isAdmin();

    // Critical Requirement: If additional invoice discount is given and user is NOT master admin,
    // it MUST route to Admin for Approval before completing!
    if (hasAdditionalDiscount && !isAdmin) {
      const pendingInvoice = db.createInvoice({
        customerName: custName,
        customerPhone: custPhone,
        vehicleNumber: vehNumber,
        vehicleModel: vehModel,
        items: JSON.parse(JSON.stringify(this.cart)),
        subTotal: totals.subTotal,
        discountType: this.discountType,
        discountValue: this.discountValue,
        discountAmount: totals.discountAmount,
        extraDiscountRequested: totals.discountAmount,
        discountStatus: "pending",
        approvedBy: null,
        totalAmount: totals.totalAmount,
        paymentMethod: paymentMethod,
        paymentStatus: "Pending Approval",
        status: "Pending Approval",
        notes: notes || "Discount approval requested by " + (currentUser ? currentUser.name : "Staff")
      }, currentUser);

      // Create Admin Approval item
      db.createApproval({
        type: "discount",
        title: `Invoice #${pendingInvoice.invoiceNumber} Discount Approval (${this.discountType === 'percentage' ? this.discountValue + '%' : UI.formatCurrency(totals.discountAmount)})`,
        targetId: pendingInvoice.id,
        targetRef: pendingInvoice.invoiceNumber,
        details: {
          customerName: custName,
          vehicle: `${vehModel ? vehModel + ' - ' : ''}${vehNumber}`,
          subTotal: totals.subTotal,
          discountType: this.discountType,
          discountValue: this.discountValue,
          discountAmount: totals.discountAmount,
          finalTotal: totals.totalAmount,
          reason: notes || "Customer requested discount on bundle package"
        }
      }, currentUser);

      UI.showToast(`Invoice #${pendingInvoice.invoiceNumber} submitted for Admin Discount Approval!`, "warning", 5000);
      this.resetCart();
      this.showInvoiceModal(pendingInvoice.id);
      return;
    }

    // Direct completion if no extra discount OR if creator is Master Admin
    const completedInvoice = db.createInvoice({
      customerName: custName,
      customerPhone: custPhone,
      vehicleNumber: vehNumber,
      vehicleModel: vehModel,
      items: JSON.parse(JSON.stringify(this.cart)),
      subTotal: totals.subTotal,
      discountType: this.discountType,
      discountValue: this.discountValue,
      discountAmount: totals.discountAmount,
      extraDiscountRequested: totals.discountAmount,
      discountStatus: hasAdditionalDiscount ? "approved" : "none",
      approvedBy: hasAdditionalDiscount ? currentUser.id : null,
      approvedAt: hasAdditionalDiscount ? new Date().toISOString() : null,
      totalAmount: totals.totalAmount,
      paymentMethod: paymentMethod,
      paymentStatus: "Paid",
      status: "Completed",
      notes: notes
    }, currentUser);

    UI.triggerCelebration();
    UI.showToast(`Invoice #${completedInvoice.invoiceNumber} completed successfully!`, "success", 4000);
    this.resetCart();
    this.showInvoiceModal(completedInvoice.id);
  }

  showInvoiceModal(invoiceId) {
    const invoice = db.getInvoiceById(invoiceId);
    if (!invoice) return;

    const modalBody = document.getElementById("invoice-view-content");
    if (!modalBody) return;

    const shop = db.state.shopInfo;
    const isPending = invoice.status === "Pending Approval";
    const isRejected = invoice.status === "Discount Rejected";

    modalBody.innerHTML = `
      <div class="invoice-printable" id="printable-invoice">
        <div class="inv-header">
          <div class="inv-brand">
            <img src="${shop.logo}" alt="Auto Doc Logo" class="inv-logo" onerror="this.src='Photos/YomalLOGO.jpg'" />
            <div class="inv-brand-text">
              <h2>${shop.name}</h2>
              <p class="inv-tagline">${shop.tagline}</p>
              <p class="inv-address">📍 ${shop.address}</p>
              <p class="inv-contact">📞 ${shop.phone} | ✉️ ${shop.email} | Reg: ${shop.regNo}</p>
            </div>
          </div>
          <div class="inv-meta">
            <div class="inv-badge ${isPending ? 'badge-pending' : isRejected ? 'badge-rejected' : 'badge-paid'}">
              ${isPending ? '⏳ PENDING APPROVAL' : isRejected ? '❌ DISCOUNT REJECTED' : '✅ OFFICIAL INVOICE / PAID'}
            </div>
            <div class="inv-number">INVOICE: ${invoice.invoiceNumber}</div>
            <div class="inv-date">Date: ${UI.formatDateTime(invoice.date)}</div>
            <div class="inv-cashier">Billed by: ${invoice.cashierName}</div>
          </div>
        </div>

        <div class="inv-customer-box">
          <div class="inv-cust-col">
            <span class="box-lbl">CUSTOMER DETAILS</span>
            <strong>${invoice.customerName}</strong>
            <span>📞 ${invoice.customerPhone || 'N/A'}</span>
          </div>
          <div class="inv-cust-col">
            <span class="box-lbl">VEHICLE DETAILS</span>
            <strong>🚗 ${invoice.vehicleNumber}</strong>
            <span>${invoice.vehicleModel || 'Standard Vehicle'}</span>
          </div>
          <div class="inv-cust-col">
            <span class="box-lbl">PAYMENT & STATUS</span>
            <strong>Method: ${invoice.paymentMethod}</strong>
            <span>Status: ${invoice.paymentStatus}</span>
          </div>
        </div>

        <table class="inv-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description & Spec</th>
              <th>Category</th>
              <th class="text-right">Price</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Total (LKR)</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>
                  <div class="inv-item-name">${item.name}</div>
                  <div class="inv-item-tier">${item.priceTier === 'specialPrice' ? 'Special Tier' : item.priceTier === 'discountPrice' ? 'Discount Tier' : 'Standard'}</div>
                </td>
                <td>${item.category || (item.isService ? 'Workshop Service' : 'Parts')}</td>
                <td class="text-right">${UI.formatCurrency(item.unitPrice)}</td>
                <td class="text-center">${item.qty}</td>
                <td class="text-right font-mono">${UI.formatCurrency(item.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="inv-totals-box">
          <div class="inv-qr-note">
            <div class="inv-qr-code">
              <div class="qr-mock">QR VALIDATED<br><b>${invoice.invoiceNumber}</b></div>
            </div>
            <div class="inv-notes-content">
              <strong>Notes & Warranty:</strong>
              <p>${invoice.notes || 'Genuine parts guaranteed. Retain invoice for warranty claims.'}</p>
              ${invoice.rejectReason ? `<p class="text-danger"><b>Admin Rejection Note:</b> ${invoice.rejectReason}</p>` : ''}
            </div>
          </div>

          <div class="inv-breakdown-card">
            <div class="breakdown-row">
              <span>Subtotal:</span>
              <span>${UI.formatCurrency(invoice.subTotal)}</span>
            </div>
            ${invoice.discountAmount > 0 ? `
              <div class="breakdown-row discount-row">
                <span>Discount (${invoice.discountType === 'percentage' ? invoice.discountValue + '%' : 'Fixed'}):</span>
                <span>- ${UI.formatCurrency(invoice.discountAmount)}</span>
              </div>
            ` : ''}
            <div class="breakdown-row grand-total-row">
              <span>Grand Total:</span>
              <span>${UI.formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div class="inv-footer">
          <p>Thank you for choosing Auto Doc Yomal Car Audio! Premium Sound & Craftsmanship Since 2018.</p>
          <div class="inv-signature-lines">
            <div>Customer Signature</div>
            <div>Authorized Officer</div>
          </div>
        </div>
      </div>

      <div class="invoice-modal-actions">
        <button class="btn btn-secondary" onclick="UI.closeModal('invoice-modal')">Close</button>
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print Invoice</button>
        <a href="${UI.generateWhatsAppInvoiceLink(invoice)}" target="_blank" class="btn btn-whatsapp">
          <span>💬 Send via WhatsApp</span>
        </a>
      </div>
    `;

    UI.openModal("invoice-modal");
  }

  renderInvoicesList() {
    const container = document.getElementById("invoices-table-body");
    if (!container) return;

    const invoices = db.getInvoices();
    if (invoices.length === 0) {
      container.innerHTML = `<tr><td colspan="8" class="text-center py-4">No invoices recorded yet.</td></tr>`;
      return;
    }

    container.innerHTML = invoices.map(inv => {
      const isPending = inv.status === "Pending Approval";
      const isRejected = inv.status === "Discount Rejected";

      return `
        <tr>
          <td><strong>${inv.invoiceNumber}</strong></td>
          <td>${UI.formatDateTime(inv.date)}</td>
          <td>
            <div class="cell-customer">${inv.customerName}</div>
            <small class="text-muted">${inv.customerPhone || 'No Phone'}</small>
          </td>
          <td>
            <span class="badge-vehicle">${inv.vehicleNumber}</span>
          </td>
          <td class="font-mono font-bold">${UI.formatCurrency(inv.totalAmount)}</td>
          <td>
            ${inv.discountAmount > 0 ? `
              <span class="badge-discount ${inv.discountStatus}">
                ${UI.formatCurrency(inv.discountAmount)} (${inv.discountStatus})
              </span>
            ` : '<span class="text-muted">None</span>'}
          </td>
          <td>
            <span class="status-pill ${isPending ? 'status-pending' : isRejected ? 'status-rejected' : 'status-completed'}">
              ${inv.status}
            </span>
          </td>
          <td>
            <div class="action-buttons-group">
              <button class="btn-icon" title="View & Print" onclick="posEngine.showInvoiceModal('${inv.id}')">👁️</button>
              <a href="${UI.generateWhatsAppInvoiceLink(inv)}" target="_blank" class="btn-icon btn-icon-wa" title="WhatsApp">💬</a>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }
}

const posEngine = new BillingEngine();
