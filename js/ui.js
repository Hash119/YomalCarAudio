// Auto Doc - Yomal Car Audio - UI Utilities, Toasts, Modals, Formatters & WhatsApp Link Builder

const UI = {
  // Format Currency in Sri Lankan Rupees
  formatCurrency(val, decimals = 0) {
    const num = Number(val) || 0;
    return "Rs. " + num.toLocaleString("en-LK", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  // Format Date and Time
  formatDateTime(isoStr) {
    if (!isoStr) return "-";
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }) + " " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  },

  formatTimeAgo(isoStr) {
    if (!isoStr) return "";
    const seconds = Math.floor((new Date() - new Date(isoStr)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },

  // Audio tone feedback for actions using Web Audio API
  playTone(type = "success") {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === "ping") {
        osc.frequency.setValueAtTime(700, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  },

  // Toast Notification System
  showToast(message, type = "info", duration = 4000) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;

    let icon = "🔔";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);
    this.playTone(type === "error" ? "error" : "success");

    setTimeout(() => {
      toast.classList.add("toast-fadeout");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Modal Dialog Controller
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
      this.playTone("ping");
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  },

  closeAllModals() {
    document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
    document.body.style.overflow = "";
  },

  // Confetti effect
  triggerCelebration() {
    if (typeof confetti === "function") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#d4af37", "#00e5ff", "#ff9100", "#10b981", "#ffffff"]
      });
    }
  },

  // Build WhatsApp invoice message
  generateWhatsAppInvoiceLink(invoice) {
    const shop = db.state.shopInfo;
    let text = `*AUTO DOC - YOMAL CAR AUDIO*\n`;
    text += `_Official Invoice & Warranty Document_\n\n`;
    text += `📋 *Invoice No:* ${invoice.invoiceNumber}\n`;
    text += `📅 *Date:* ${this.formatDateTime(invoice.date)}\n`;
    text += `👤 *Customer:* ${invoice.customerName}\n`;
    text += `🚗 *Vehicle:* ${invoice.vehicleNumber} (${invoice.vehicleModel || "N/A"})\n\n`;
    text += `*ITEMS & SERVICES:*\n`;

    invoice.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (x${item.qty}) - Rs. ${item.total.toLocaleString()}\n`;
    });

    text += `\n----------------------------\n`;
    text += `*Subtotal:* Rs. ${invoice.subTotal.toLocaleString()}\n`;
    if (invoice.discountAmount > 0) {
      text += `*Discount Applied:* -Rs. ${invoice.discountAmount.toLocaleString()} (${invoice.discountStatus})\n`;
    }
    text += `*GRAND TOTAL:* Rs. ${invoice.totalAmount.toLocaleString()}\n`;
    text += `*Payment:* ${invoice.paymentMethod} (${invoice.paymentStatus})\n`;
    text += `----------------------------\n`;
    text += `📍 *Branch:* ${shop.branch}\n`;
    text += `📞 *Hotline:* ${shop.phone}\n`;
    text += `✨ Thank you for choosing Auto Doc Yomal Car Audio!`;

    const encoded = encodeURIComponent(text);
    const targetPhone = invoice.customerPhone ? invoice.customerPhone.replace(/[^0-9]/g, "") : "";
    let cleanPhone = targetPhone;
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "94" + cleanPhone.substring(1);
    }

    return targetPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }
};
