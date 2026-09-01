// Auto Doc - Yomal Car Audio - Inventory Management Module
// Handles stock viewing, staff add-item approval workflow, price change approval requests, and stock adjustments

class InventoryManager {
  constructor() {
    this.searchQuery = "";
    this.selectedCategory = "all";
    this.stockFilter = "all"; // 'all', 'low', 'sample'
  }

  renderInventoryTable() {
    const tableBody = document.getElementById("inventory-table-body");
    if (!tableBody) return;

    let products = db.getProducts();

    // Filter by Category
    if (this.selectedCategory !== "all") {
      products = products.filter(p => p.category === this.selectedCategory);
    }

    // Filter by Stock Status
    if (this.stockFilter === "low") {
      products = products.filter(p => p.stockQty <= (p.reorderLevel || 3));
    } else if (this.stockFilter === "sample") {
      products = products.filter(p => p.isSampleItem);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (products.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4">No matching inventory items found.</td></tr>`;
      return;
    }

    const isAdmin = auth.isAdmin();

    tableBody.innerHTML = products.map(prod => {
      const isLowStock = prod.stockQty <= (prod.reorderLevel || 3);
      const isOutOfStock = prod.stockQty === 0;

      return `
        <tr>
          <td>
            <div class="prod-cell">
              ${prod.isSampleItem ? '<span class="badge-sample-star" title="From Handwritten Note">⭐</span>' : ''}
              <div>
                <strong class="prod-name">${prod.name}</strong>
                <div class="prod-sku font-mono">${prod.sku || 'N/A'}</div>
              </div>
            </div>
          </td>
          <td><span class="badge-category">${prod.category}</span></td>
          <td class="font-mono text-muted">${isAdmin ? UI.formatCurrency(prod.unitCost) : '🔒 Confidential'}</td>
          <td class="font-mono font-bold text-highlight">${UI.formatCurrency(prod.salePrice)}</td>
          <td class="font-mono">${prod.discountPrice ? UI.formatCurrency(prod.discountPrice) : '-'}</td>
          <td class="font-mono">${prod.specialPrice ? UI.formatCurrency(prod.specialPrice) : '-'}</td>
          <td>
            <div class="stock-cell">
              <span class="stock-pill ${isOutOfStock ? 'pill-out' : isLowStock ? 'pill-low' : 'pill-ok'}">
                ${prod.stockQty} Units
              </span>
              ${isLowStock ? '<span class="alert-icon" title="Reorder Alert">⚠️</span>' : ''}
            </div>
          </td>
          <td><span class="badge-warranty">${prod.warranty || '1 Year'}</span></td>
          <td>
            <div class="action-buttons-group">
              <button class="btn-sm btn-outline" title="Adjust Stock" onclick="inventoryManager.openStockAdjustModal('${prod.id}')">📦 Stock</button>
              <button class="btn-sm btn-gold" title="Request or Change Price" onclick="inventoryManager.openPriceChangeModal('${prod.id}')">💰 Price</button>
              ${isAdmin ? `
                <button class="btn-sm btn-danger-soft" title="Delete Product" onclick="inventoryManager.deleteProduct('${prod.id}')">🗑️</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Handle Adding New Product / Submitting for Approval
  handleAddItemSubmit(formData) {
    const currentUser = auth.getCurrentUser();
    const isAdmin = auth.isAdmin();

    const name = formData.name.trim();
    const sku = formData.sku.trim() || ("SKU-" + Math.floor(1000 + Math.random() * 9000));
    const category = formData.category;
    const description = formData.description.trim();
    const unitCost = Number(formData.unitCost) || 0;
    const salePrice = Number(formData.salePrice) || 0;
    const discountPrice = Number(formData.discountPrice) || salePrice;
    const specialPrice = Number(formData.specialPrice) || discountPrice;
    const stockQty = Number(formData.stockQty) || 0;
    const reorderLevel = Number(formData.reorderLevel) || 3;
    const warranty = formData.warranty.trim() || "1 Year";

    if (!name || salePrice <= 0) {
      UI.showToast("Please provide item name and selling price", "error");
      return;
    }

    // If non-admin user creates item, route to Admin Approval Queue!
    if (!isAdmin) {
      db.createApproval({
        type: "new_inventory",
        title: `New Inventory Request: ${name} (${sku})`,
        targetId: "temp-prod-" + Date.now(),
        targetRef: sku,
        details: {
          name,
          sku,
          category,
          description,
          unitCost,
          salePrice,
          discountPrice,
          specialPrice,
          initialStock: stockQty,
          reorderLevel,
          warranty
        }
      }, currentUser);

      UI.showToast(`New inventory request for "${name}" submitted to Admin for approval!`, "warning", 4500);
      UI.closeModal("add-product-modal");
      return;
    }

    // If Admin, directly add to inventory
    const newProd = db.addProduct({
      name,
      sku,
      category,
      description,
      unitCost,
      salePrice,
      discountPrice,
      specialPrice,
      stockQty,
      reorderLevel,
      warranty,
      isSampleItem: false
    }, currentUser);

    UI.triggerCelebration();
    UI.showToast(`Product "${newProd.name}" added to inventory!`, "success");
    UI.closeModal("add-product-modal");
    this.renderInventoryTable();
  }

  // Handle Price Change Request Modal
  openPriceChangeModal(productId) {
    const prod = db.getProductById(productId);
    if (!prod) return;

    const modalBody = document.getElementById("price-change-modal-content");
    if (!modalBody) return;

    const isAdmin = auth.isAdmin();

    modalBody.innerHTML = `
      <div class="modal-form-header">
        <h4>💰 Update Selling Prices for <b>${prod.name}</b></h4>
        <p class="text-muted">${isAdmin ? 'Direct Admin Price Update' : 'Staff Price Change Request (Requires Admin Approval)'}</p>
      </div>

      <div class="current-price-reference">
        <div class="ref-col">
          <span>Current Sale Price:</span>
          <strong>${UI.formatCurrency(prod.salePrice)}</strong>
        </div>
        <div class="ref-col">
          <span>Current Discount Price:</span>
          <strong>${prod.discountPrice ? UI.formatCurrency(prod.discountPrice) : 'N/A'}</strong>
        </div>
        <div class="ref-col">
          <span>Current Special Price:</span>
          <strong>${prod.specialPrice ? UI.formatCurrency(prod.specialPrice) : 'N/A'}</strong>
        </div>
      </div>

      <form id="price-change-form" onsubmit="event.preventDefault(); inventoryManager.handlePriceChangeSubmit('${prod.id}')">
        <div class="form-row">
          <div class="form-group">
            <label>New Standard Sale Price (LKR) *</label>
            <input type="number" id="new-sale-price" class="form-control" value="${prod.salePrice}" required min="1" />
          </div>
          <div class="form-group">
            <label>New Discount Price (LKR)</label>
            <input type="number" id="new-discount-price" class="form-control" value="${prod.discountPrice || prod.salePrice}" />
          </div>
          <div class="form-group">
            <label>New Special Price (LKR)</label>
            <input type="number" id="new-special-price" class="form-control" value="${prod.specialPrice || prod.discountPrice || prod.salePrice}" />
          </div>
        </div>

        <div class="form-group">
          <label>Reason for Price Adjustment</label>
          <textarea id="price-change-reason" class="form-control" rows="2" placeholder="e.g., Supplier rate adjustment, promo campaign, import duties..."></textarea>
        </div>

        <div class="modal-footer-actions">
          <button type="button" class="btn btn-secondary" onclick="UI.closeModal('price-change-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${isAdmin ? '💾 Save New Prices' : '📤 Submit Request to Admin'}
          </button>
        </div>
      </form>
    `;

    UI.openModal("price-change-modal");
  }

  handlePriceChangeSubmit(productId) {
    const prod = db.getProductById(productId);
    if (!prod) return;

    const newSalePrice = Number(document.getElementById("new-sale-price").value);
    const newDiscountPrice = Number(document.getElementById("new-discount-price").value);
    const newSpecialPrice = Number(document.getElementById("new-special-price").value);
    const reason = (document.getElementById("price-change-reason").value || "").trim();

    if (!newSalePrice || newSalePrice <= 0) {
      UI.showToast("Please enter a valid standard selling price", "error");
      return;
    }

    const currentUser = auth.getCurrentUser();
    const isAdmin = auth.isAdmin();

    if (!isAdmin) {
      db.createApproval({
        type: "price_change",
        title: `Price Change Request: ${prod.name} (${prod.sku})`,
        targetId: prod.id,
        targetRef: prod.sku,
        details: {
          productName: prod.name,
          currentPrices: {
            salePrice: prod.salePrice,
            discountPrice: prod.discountPrice,
            specialPrice: prod.specialPrice
          },
          proposedPrices: {
            salePrice: newSalePrice,
            discountPrice: newDiscountPrice,
            specialPrice: newSpecialPrice
          },
          reason: reason || "Market price adjustment requested by " + (currentUser ? currentUser.name : "Staff")
        }
      }, currentUser);

      UI.showToast(`Price change request for "${prod.name}" submitted to Admin for review!`, "warning", 4500);
      UI.closeModal("price-change-modal");
      return;
    }

    // Direct update if Admin
    db.updateProduct(prod.id, {
      salePrice: newSalePrice,
      discountPrice: newDiscountPrice,
      specialPrice: newSpecialPrice
    }, currentUser);

    UI.showToast(`Prices for "${prod.name}" updated successfully!`, "success");
    UI.closeModal("price-change-modal");
    this.renderInventoryTable();
  }

  // Handle Stock Adjustments (Restock / Damage / Return)
  openStockAdjustModal(productId) {
    const prod = db.getProductById(productId);
    if (!prod) return;

    const modalBody = document.getElementById("stock-adjust-modal-content");
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div class="modal-form-header">
        <h4>📦 Adjust Stock Level for <b>${prod.name}</b></h4>
        <p class="text-muted">Current Quantity on Hand: <b class="text-highlight">${prod.stockQty} Units</b></p>
      </div>

      <form id="stock-adjust-form" onsubmit="event.preventDefault(); inventoryManager.handleStockAdjustSubmit('${prod.id}')">
        <div class="form-row">
          <div class="form-group">
            <label>Adjustment Type</label>
            <select id="adjust-type" class="form-control">
              <option value="add">➕ Add Incoming Stock (Restock)</option>
              <option value="remove">➖ Deduct Stock (Damage / Scrap / Lost)</option>
              <option value="set">🔢 Set Absolute Stock Level</option>
            </select>
          </div>
          <div class="form-group">
            <label>Quantity</label>
            <input type="number" id="adjust-qty" class="form-control" min="1" required placeholder="Units count" />
          </div>
        </div>

        <div class="form-group">
          <label>Reason / Note</label>
          <input type="text" id="adjust-reason" class="form-control" placeholder="e.g., Supplier Batch #409, Warranty Replacement, Stock Take" required />
        </div>

        <div class="modal-footer-actions">
          <button type="button" class="btn btn-secondary" onclick="UI.closeModal('stock-adjust-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Adjustment</button>
        </div>
      </form>
    `;

    UI.openModal("stock-adjust-modal");
  }

  handleStockAdjustSubmit(productId) {
    const prod = db.getProductById(productId);
    if (!prod) return;

    const type = document.getElementById("adjust-type").value;
    const qty = Number(document.getElementById("adjust-qty").value) || 0;
    const reason = document.getElementById("adjust-reason").value.trim();

    if (qty <= 0) {
      UI.showToast("Please enter a valid quantity", "error");
      return;
    }

    const currentUser = auth.getCurrentUser();
    let change = 0;

    if (type === "add") change = qty;
    else if (type === "remove") change = -qty;
    else if (type === "set") change = qty - prod.stockQty;

    db.adjustStock(prod.id, change, reason, currentUser);
    UI.showToast(`Stock for "${prod.name}" adjusted successfully!`, "success");
    UI.closeModal("stock-adjust-modal");
    this.renderInventoryTable();
  }

  deleteProduct(productId) {
    const prod = db.getProductById(productId);
    if (!prod) return;

    if (confirm(`Are you sure you want to delete "${prod.name}" from inventory?`)) {
      db.deleteProduct(productId, auth.getCurrentUser());
      UI.showToast(`Deleted "${prod.name}"`, "info");
      this.renderInventoryTable();
    }
  }
}

const inventoryManager = new InventoryManager();
