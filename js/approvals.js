// Auto Doc - Yomal Car Audio - Admin Approvals Hub
// Centralized real-time approval center for Discounts, New Inventory items, and Price Changes

class ApprovalsCenter {
  constructor() {
    this.activeFilter = "pending"; // 'pending', 'all', 'discount', 'new_inventory', 'price_change'
  }

  updateBadges() {
    const pendingCount = db.getPendingApprovalsCount();
    const navBadge = document.getElementById("nav-approvals-badge");
    const tabBadge = document.getElementById("tab-approvals-badge");

    if (navBadge) {
      navBadge.textContent = pendingCount;
      navBadge.style.display = pendingCount > 0 ? "inline-flex" : "none";
    }

    if (tabBadge) {
      tabBadge.textContent = `${pendingCount} Pending`;
      tabBadge.className = `badge-pill ${pendingCount > 0 ? 'badge-warning' : 'badge-neutral'}`;
    }
  }

  renderApprovalsList() {
    this.updateBadges();
    const container = document.getElementById("approvals-list-container");
    if (!container) return;

    let approvals = db.getApprovals();

    if (this.activeFilter === "pending") {
      approvals = approvals.filter(a => a.status === "pending");
    } else if (this.activeFilter !== "all") {
      approvals = approvals.filter(a => a.type === this.activeFilter);
    }

    if (approvals.length === 0) {
      container.innerHTML = `
        <div class="empty-approvals-state">
          <div class="empty-icon">✨</div>
          <h3>All Caught Up!</h3>
          <p>No pending approvals in this category. All invoices, inventory additions, and price changes are in order.</p>
        </div>
      `;
      return;
    }

    const isAdmin = auth.isAdmin();

    container.innerHTML = approvals.map(appr => {
      const isPending = appr.status === "pending";
      const isApproved = appr.status === "approved";
      const isRejected = appr.status === "rejected";

      let typeBadge = "";
      let typeIcon = "";
      if (appr.type === "discount") {
        typeBadge = '<span class="appr-type-badge type-discount">💳 Discount Request</span>';
        typeIcon = "🏷️";
      } else if (appr.type === "new_inventory") {
        typeBadge = '<span class="appr-type-badge type-inventory">📦 New Inventory</span>';
        typeIcon = "✨";
      } else if (appr.type === "price_change") {
        typeBadge = '<span class="appr-type-badge type-price">💰 Price Update</span>';
        typeIcon = "📈";
      }

      return `
        <div class="approval-card status-${appr.status}">
          <div class="approval-card-header">
            <div class="header-left">
              <span class="card-icon">${typeIcon}</span>
              <div>
                <h4 class="approval-card-title">${appr.title}</h4>
                <div class="approval-meta">
                  <span>Requested by: <b>${appr.requesterName}</b></span>
                  <span>•</span>
                  <span>Time: <b>${UI.formatDateTime(appr.requestedAt)}</b> (${UI.formatTimeAgo(appr.requestedAt)})</span>
                  <span>•</span>
                  ${typeBadge}
                </div>
              </div>
            </div>
            <div class="header-right">
              <span class="status-tag tag-${appr.status}">${appr.status.toUpperCase()}</span>
            </div>
          </div>

          <div class="approval-card-body">
            ${this.renderApprovalDetailsContent(appr)}
          </div>

          ${isPending && isAdmin ? `
            <div class="approval-card-actions">
              <button class="btn btn-danger-outline" onclick="approvalsCenter.promptReject('${appr.id}')">
                ❌ Reject Request
              </button>
              <button class="btn btn-success" onclick="approvalsCenter.handleApprove('${appr.id}')">
                ✅ Approve & Apply
              </button>
            </div>
          ` : isPending && !isAdmin ? `
            <div class="approval-card-footer text-muted">
              🔒 Waiting for Master Admin review and authorization.
            </div>
          ` : `
            <div class="approval-card-footer resolved-footer">
              <span>Resolved by: <b>${appr.resolvedByName || 'Admin'}</b> at ${UI.formatDateTime(appr.resolvedAt)}</span>
              ${appr.resolutionReason ? `<p class="res-reason"><b>Note:</b> ${appr.resolutionReason}</p>` : ''}
            </div>
          `}
        </div>
      `;
    }).join("");
  }

  renderApprovalDetailsContent(appr) {
    const details = appr.details || {};

    if (appr.type === "discount") {
      return `
        <div class="appr-grid-details">
          <div class="grid-item">
            <span class="lbl">Customer / Vehicle</span>
            <strong>${details.customerName}</strong>
            <small>${details.vehicle || 'Vehicle'}</small>
          </div>
          <div class="grid-item">
            <span class="lbl">Original Subtotal</span>
            <strong class="font-mono">${UI.formatCurrency(details.subTotal)}</strong>
          </div>
          <div class="grid-item">
            <span class="lbl">Requested Discount</span>
            <strong class="font-mono text-warning">- ${UI.formatCurrency(details.discountAmount)} (${details.discountType === 'percentage' ? details.discountValue + '%' : 'Fixed'})</strong>
          </div>
          <div class="grid-item">
            <span class="lbl">Final Payable Amount</span>
            <strong class="font-mono text-highlight">${UI.formatCurrency(details.finalTotal)}</strong>
          </div>
        </div>
        ${details.reason ? `<div class="appr-reason-box"><b>Staff Note:</b> ${details.reason}</div>` : ''}
      `;
    }

    if (appr.type === "new_inventory") {
      return `
        <div class="appr-grid-details">
          <div class="grid-item">
            <span class="lbl">Item Name</span>
            <strong>${details.name}</strong>
            <small>Category: ${details.category}</small>
          </div>
          <div class="grid-item">
            <span class="lbl">Unit Cost</span>
            <strong class="font-mono text-muted">${UI.formatCurrency(details.unitCost)}</strong>
          </div>
          <div class="grid-item">
            <span class="lbl">Proposed Sale Price</span>
            <strong class="font-mono text-highlight">${UI.formatCurrency(details.salePrice)}</strong>
          </div>
          <div class="grid-item">
            <span class="lbl">Initial Stock Qty</span>
            <strong class="font-mono">${details.initialStock} Units (Warranty: ${details.warranty || '1 Year'})</strong>
          </div>
        </div>
        ${details.description ? `<div class="appr-reason-box"><b>Description:</b> ${details.description}</div>` : ''}
      `;
    }

    if (appr.type === "price_change") {
      const cur = details.currentPrices || {};
      const prop = details.proposedPrices || {};

      return `
        <div class="appr-grid-details">
          <div class="grid-item">
            <span class="lbl">Product Target</span>
            <strong>${details.productName}</strong>
          </div>
          <div class="grid-item">
            <span class="lbl">Current Sale Price</span>
            <strong class="font-mono text-muted line-through">${UI.formatCurrency(cur.salePrice)}</strong>
          </div>
          <div class="grid-item">
            <span class="lbl">Proposed New Sale Price</span>
            <strong class="font-mono text-success font-bold">${UI.formatCurrency(prop.salePrice)}</strong>
          </div>
          <div class="grid-item">
            <span class="lbl">Discount / Special Tier</span>
            <strong class="font-mono">${UI.formatCurrency(prop.discountPrice)} / ${UI.formatCurrency(prop.specialPrice)}</strong>
          </div>
        </div>
        ${details.reason ? `<div class="appr-reason-box"><b>Reason:</b> ${details.reason}</div>` : ''}
      `;
    }

    return `<pre>${JSON.stringify(details, null, 2)}</pre>`;
  }

  handleApprove(approvalId) {
    const adminUser = auth.getCurrentUser();
    if (!auth.isAdmin()) {
      UI.showToast("Only Admin has permission to approve requests", "error");
      return;
    }

    const res = db.resolveApproval(approvalId, "approved", adminUser);
    if (res.success) {
      UI.triggerCelebration();
      UI.showToast("Request successfully APPROVED and applied to the system!", "success");
      this.renderApprovalsList();
    } else {
      UI.showToast(res.message, "error");
    }
  }

  promptReject(approvalId) {
    const reason = prompt("Enter reason for rejecting this request (Optional):", "Price discount / change not authorized by management.");
    if (reason === null) return; // Cancelled prompt

    const adminUser = auth.getCurrentUser();
    const res = db.resolveApproval(approvalId, "rejected", adminUser, reason);
    if (res.success) {
      UI.showToast("Request has been REJECTED", "warning");
      this.renderApprovalsList();
    } else {
      UI.showToast(res.message, "error");
    }
  }

  setFilter(filter) {
    this.activeFilter = filter;
    document.querySelectorAll(".approvals-filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    this.renderApprovalsList();
  }
}

const approvalsCenter = new ApprovalsCenter();
