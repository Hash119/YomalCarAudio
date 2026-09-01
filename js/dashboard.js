// Auto Doc - Yomal Car Audio - Analytics & Executive Dashboard
// Computes daily sales metrics, EOD settlement, top sellers, and renders Chart.js charts

class DashboardAnalytics {
  constructor() {
    this.salesChart = null;
    this.categoryChart = null;
  }

  renderDashboard() {
    const stats = db.getDailySalesStats();
    const products = db.getProducts();
    const lowStockCount = products.filter(p => p.stockQty <= (p.reorderLevel || 3)).length;
    const pendingApprCount = db.getPendingApprovalsCount();

    // Update KPI Elements
    this.updateKPI("kpi-today-sales", UI.formatCurrency(stats.netRevenue));
    this.updateKPI("kpi-gross-sales", UI.formatCurrency(stats.grossSales));
    this.updateKPI("kpi-discounts", "- " + UI.formatCurrency(stats.totalDiscounts));
    this.updateKPI("kpi-invoices-count", stats.completedInvoicesCount);
    this.updateKPI("kpi-pending-invoices", stats.pendingInvoicesCount);
    this.updateKPI("kpi-low-stock", lowStockCount);
    this.updateKPI("kpi-pending-approvals", pendingApprCount);

    // Render End-of-Day (EOD) Settlement Breakdown
    this.renderEODSettlement(stats);

    // Render Top Selling Items
    this.renderTopSellers();

    // Render Audit Activities
    this.renderActivityTrail();

    // Render / Update Charts
    this.renderCharts();
  }

  updateKPI(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = value;
  }

  renderEODSettlement(stats) {
    const container = document.getElementById("eod-settlement-breakdown");
    if (!container) return;

    const breakdown = stats.paymentBreakdown;

    container.innerHTML = `
      <div class="eod-card">
        <div class="eod-header">
          <div>
            <h3>📅 End-of-Day Register Settlement</h3>
            <p class="text-muted">Daily closure calculations for <b>${stats.date}</b></p>
          </div>
          <button class="btn btn-sm btn-gold" onclick="dashboardAnalytics.exportDailyReport()">
            📄 Export Daily PDF/Summary
          </button>
        </div>

        <div class="eod-grid">
          <div class="eod-stat-box">
            <span class="lbl">💵 Cash Collected</span>
            <strong class="font-mono">${UI.formatCurrency(breakdown.Cash || 0)}</strong>
          </div>
          <div class="eod-stat-box">
            <span class="lbl">💳 Card / POS Terminal</span>
            <strong class="font-mono">${UI.formatCurrency(breakdown.Card || 0)}</strong>
          </div>
          <div class="eod-stat-box">
            <span class="lbl">🏦 Bank Transfers</span>
            <strong class="font-mono">${UI.formatCurrency(breakdown["Bank Transfer"] || 0)}</strong>
          </div>
          <div class="eod-stat-box total-box">
            <span class="lbl">🏁 Net Inflow Today</span>
            <strong class="font-mono text-highlight">${UI.formatCurrency(stats.netRevenue)}</strong>
          </div>
        </div>
      </div>
    `;
  }

  renderTopSellers() {
    const container = document.getElementById("top-sellers-list");
    if (!container) return;

    const topItems = db.getTopSellingItems(6);
    if (topItems.length === 0) {
      container.innerHTML = `<p class="text-muted text-center py-3">No completed sales recorded yet.</p>`;
      return;
    }

    const maxSold = topItems[0].qtySold || 1;

    container.innerHTML = topItems.map((item, idx) => {
      const pct = Math.min(100, Math.round((item.qtySold / maxSold) * 100));
      return `
        <div class="top-seller-row">
          <div class="seller-rank">#${idx + 1}</div>
          <div class="seller-info">
            <div class="seller-name-row">
              <span class="seller-name">${item.name}</span>
              <span class="seller-sold font-mono"><b>${item.qtySold}</b> Sold (${UI.formatCurrency(item.totalRevenue)})</span>
            </div>
            <div class="seller-progress-bg">
              <div class="seller-progress-bar" style="width: ${pct}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderActivityTrail() {
    const container = document.getElementById("dashboard-activity-list");
    if (!container) return;

    const activities = db.state.activityLog.slice(0, 8);
    if (activities.length === 0) {
      container.innerHTML = `<p class="text-muted text-center">No recent activities.</p>`;
      return;
    }

    container.innerHTML = activities.map(act => {
      return `
        <div class="activity-item">
          <div class="activity-dot"></div>
          <div class="activity-content">
            <div class="activity-desc">${act.description}</div>
            <div class="activity-time">${UI.formatTimeAgo(act.timestamp)} by <b>${act.userName}</b></div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderCharts() {
    if (typeof Chart === "undefined") return;

    // 1. Sales Trend Chart
    const salesCanvas = document.getElementById("dashboard-sales-chart");
    if (salesCanvas) {
      const ctx = salesCanvas.getContext("2d");

      // Compute last 7 days sales
      const labels = [];
      const dataPoints = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().substring(0, 10);
        labels.push(d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }));
        const stats = db.getDailySalesStats(dStr);
        dataPoints.push(stats.netRevenue);
      }

      if (this.salesChart) {
        this.salesChart.destroy();
      }

      this.salesChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Daily Revenue (LKR)",
            data: dataPoints,
            borderColor: "#d4af37",
            backgroundColor: "rgba(212, 175, 55, 0.15)",
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: "#ff9100",
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "rgba(255, 255, 255, 0.06)" },
              ticks: { color: "#9ca3af" }
            },
            x: {
              grid: { color: "rgba(255, 255, 255, 0.04)" },
              ticks: { color: "#9ca3af" }
            }
          }
        }
      });
    }

    // 2. Category Share Chart
    const categoryCanvas = document.getElementById("dashboard-category-chart");
    if (categoryCanvas) {
      const ctx2 = categoryCanvas.getContext("2d");

      const catMap = {};
      db.state.invoices.filter(i => i.status === "Completed").forEach(inv => {
        inv.items.forEach(item => {
          const cat = item.category || "Other";
          catMap[cat] = (catMap[cat] || 0) + item.total;
        });
      });

      const catLabels = Object.keys(catMap).slice(0, 6);
      const catData = catLabels.map(k => catMap[k]);

      if (this.categoryChart) {
        this.categoryChart.destroy();
      }

      this.categoryChart = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: catLabels.length ? catLabels : ["Audio & Displays", "Cameras", "Accessories"],
          datasets: [{
            data: catData.length ? catData : [65000, 32000, 18000],
            backgroundColor: [
              "#d4af37",
              "#00e5ff",
              "#ff9100",
              "#10b981",
              "#8b5cf6",
              "#ec4899"
            ],
            borderWidth: 2,
            borderColor: "#0f131a"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#d1d5db", boxWidth: 12 }
            }
          }
        }
      });
    }
  }

  exportDailyReport() {
    const stats = db.getDailySalesStats();
    const shop = db.state.shopInfo;

    let summaryText = `=====================================\n`;
    summaryText += `AUTO DOC - YOMAL CAR AUDIO\n`;
    summaryText += `DAILY SALES & REVENUE REPORT\n`;
    summaryText += `Date: ${stats.date}\n`;
    summaryText += `Branch: ${shop.branch}\n`;
    summaryText += `=====================================\n\n`;
    summaryText += `Completed Invoices: ${stats.completedInvoicesCount}\n`;
    summaryText += `Gross Sales: Rs. ${stats.grossSales.toLocaleString()}\n`;
    summaryText += `Discounts Given: Rs. ${stats.totalDiscounts.toLocaleString()}\n`;
    summaryText += `NET REVENUE: Rs. ${stats.netRevenue.toLocaleString()}\n\n`;
    summaryText += `PAYMENT BREAKDOWN:\n`;
    summaryText += `- Cash: Rs. ${(stats.paymentBreakdown.Cash || 0).toLocaleString()}\n`;
    summaryText += `- Card POS: Rs. ${(stats.paymentBreakdown.Card || 0).toLocaleString()}\n`;
    summaryText += `- Bank Transfer: Rs. ${(stats.paymentBreakdown["Bank Transfer"] || 0).toLocaleString()}\n\n`;
    summaryText += `INVOICE REGISTER:\n`;
    stats.invoices.forEach(inv => {
      summaryText += `#${inv.invoiceNumber} | ${inv.customerName} | ${inv.vehicleNumber} | Rs. ${inv.totalAmount.toLocaleString()} [${inv.paymentMethod}]\n`;
    });
    summaryText += `\n=====================================\nGenerated by Auto Doc System`;

    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Yomal_Daily_Report_${stats.date}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    UI.showToast("Daily Sales Report downloaded successfully!", "success");
  }
}

const dashboardAnalytics = new DashboardAnalytics();
