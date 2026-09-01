// Auto Doc - Yomal Car Audio - Initial Data Seed
// Contains sample handwritten inventory items, vehicle services, demo users, and starter transactions

const INITIAL_DATA = {
  shopInfo: {
    name: "Auto Doc - Yomal Car Audio",
    tagline: "Premier Vehicle Audio, Security & Modification Specialists",
    phone: "+94 76 935 0735",
    whatsapp: "+94771564131",
    email: "info@yomalcaraudio.lk",
    address: "77/A moris road milidduwa , Galle, Sri Lanka",
    logo: "Photos/YomalLOGO.jpg",
    facebook: "https://web.facebook.com/Yomalcaraudioo/",
    currency: "Rs.",
    vatRate: 0,
    regNo: "PV-98214-LK",
    branch: "Galle Flagship Studio"
  },

  users: [
    {
      id: "usr-admin-01",
      username: "admin",
      pin: "1234",
      name: "Yomal Bandara",
      role: "admin",
      roleTitle: "Master Admin & Owner",
      email: "admin@yomalcaraudio.lk",
      phone: "0771234567",
      avatar: "👑",
      createdAt: "2026-01-10T08:00:00.000Z",
      active: true,
      permissions: ["billing", "inventory_manage", "approve_all", "users_manage", "view_reports", "price_override"]
    },
    {
      id: "usr-cash-01",
      username: "cashier",
      pin: "1234",
      name: "Kasun Perera",
      role: "cashier",
      roleTitle: "Senior Billing Officer",
      email: "kasun@yomalcaraudio.lk",
      phone: "0719876543",
      avatar: "💳",
      createdAt: "2026-02-01T09:30:00.000Z",
      active: true,
      permissions: ["billing", "inventory_request", "price_request", "view_own_sales"]
    },
    {
      id: "usr-tech-01",
      username: "tech",
      pin: "1234",
      name: "Roshan Silva",
      role: "tech",
      roleTitle: "Lead Audio & Security Installer",
      email: "roshan@yomalcaraudio.lk",
      phone: "0754321987",
      avatar: "🔧",
      createdAt: "2026-02-15T10:00:00.000Z",
      active: true,
      permissions: ["view_inventory", "inventory_request", "service_jobs"]
    }
  ],

  // Products seeded with exact handwritten items from Photos/sample item.jpeg + full car audio catalogue
  products: [
    {
      id: "prod-001",
      sku: "CAM-TW25",
      name: "TW25 DVR Camera",
      category: "Cameras & DVR",
      description: "High sensitivity night-vision dual lens DVR camera with parking monitor sensor.",
      unitCost: 5200,
      salePrice: 8900,
      discountPrice: 8000,
      specialPrice: 7500,
      stockQty: 18,
      reorderLevel: 5,
      warranty: "1 Year",
      isSampleItem: true,
      imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-002",
      sku: "CAM-LEN-360",
      name: "Lenovo 360° - 9003 Panoramic Camera Kit",
      category: "Cameras & DVR",
      description: "360-degree ultra-wide seamless bird-view camera system with dynamic guiding lines.",
      unitCost: 15800,
      salePrice: 21500,
      discountPrice: 19000,
      specialPrice: 18000,
      stockQty: 12,
      reorderLevel: 3,
      warranty: "1.5 Years",
      isSampleItem: true,
      imageUrl: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-003",
      sku: "SEAL-BUD-01",
      name: "Bud Seal Acoustic Weather Stripping",
      category: "Sound Proofing",
      description: "Heavy-duty soundproofing door rubber seal kit for noise reduction and wind cancellation.",
      unitCost: 18900,
      salePrice: 23500,
      discountPrice: 22000,
      specialPrice: 20000,
      stockQty: 25,
      reorderLevel: 6,
      warranty: "6 Months",
      isSampleItem: true,
      imageUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-004",
      sku: "ACC-HON-VEZ",
      name: "Honda Vezel Custom Upgrade Kit",
      category: "Vehicle Modification",
      description: "Complete styling and electronic upgrade package tailored specifically for Honda Vezel.",
      unitCost: 21500,
      salePrice: 19000,
      discountPrice: 18000,
      specialPrice: 17000,
      stockQty: 8,
      reorderLevel: 2,
      warranty: "1 Year",
      isSampleItem: true,
      imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-005",
      sku: "ORN-SHIP-01",
      name: "Luxury Ship Ornaments & Dashboard Accents",
      category: "Accessories",
      description: "Premium gold-trimmed mechanical solar rotating ship dashboard showpiece and diffuser.",
      unitCost: 1800,
      salePrice: 4800,
      discountPrice: 4500,
      specialPrice: 2000,
      stockQty: 40,
      reorderLevel: 10,
      warranty: "Checking Warranty",
      isSampleItem: true,
      imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-006",
      sku: "WIR-RC-5M",
      name: "5MT RC Pure Copper Audio Wire",
      category: "Wiring & Harness",
      description: "5-Meter high grade oxygen-free copper RCA shielded audio cable with gold plated pins.",
      unitCost: 1850,
      salePrice: 4500,
      discountPrice: 4300,
      specialPrice: 4100,
      stockQty: 55,
      reorderLevel: 15,
      warranty: "1 Year",
      isSampleItem: true,
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-007",
      sku: "WIR-RC-10M",
      name: "10MT RC Heavy Duty Audio Wire",
      category: "Wiring & Harness",
      description: "10-Meter reinforced low-loss RCA multi-channel sound cabling for amplifiers & subs.",
      unitCost: 2100,
      salePrice: 4900,
      discountPrice: 4500,
      specialPrice: 4200,
      stockQty: 34,
      reorderLevel: 10,
      warranty: "1 Year",
      isSampleItem: true,
      imageUrl: "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-008",
      sku: "ACC-TOY-RIB111",
      name: "Toyota Ribbon 111 Spiral Cable Airbag Clock Spring",
      category: "Modification Parts",
      description: "OEM fit steering wheel clock spring ribbon cable for Toyota models (111 series).",
      unitCost: 8800,
      salePrice: 12500,
      discountPrice: 12000,
      specialPrice: 11200,
      stockQty: 14,
      reorderLevel: 4,
      warranty: "1 Year",
      isSampleItem: true,
      imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-009",
      sku: "AUD-ANDR-9IN",
      name: "9-Inch IPS DSP Android 14 Player (4GB+64GB)",
      category: "Android Displays",
      description: "Wireless Apple CarPlay, Android Auto, 32-Band DSP Equalizer, 1080P Full HD touch display.",
      unitCost: 26000,
      salePrice: 38500,
      discountPrice: 35000,
      specialPrice: 33000,
      stockQty: 16,
      reorderLevel: 4,
      warranty: "2 Years",
      isSampleItem: false,
      imageUrl: "assets/hero_car_audio.jpg"
    },
    {
      id: "prod-010",
      sku: "AUD-ANDR-10IN",
      name: "10.1-Inch QLED Ultra Octa-Core Multimedia System",
      category: "Android Displays",
      description: "Split screen multitasking, 4G SIM support, 360 camera integration, Hi-Res audio output.",
      unitCost: 38000,
      salePrice: 54000,
      discountPrice: 50000,
      specialPrice: 48000,
      stockQty: 9,
      reorderLevel: 3,
      warranty: "2 Years",
      isSampleItem: false,
      imageUrl: "assets/hero_car_audio.jpg"
    },
    {
      id: "prod-011",
      sku: "AUD-SUB-ACT10",
      name: "Alpine 10\" Active Underseat Slim Subwoofer (1000W)",
      category: "Audio & Subwoofers",
      description: "Deep punchy bass with built-in amplifier, compact design fits beneath driver/passenger seat.",
      unitCost: 32000,
      salePrice: 47500,
      discountPrice: 44000,
      specialPrice: 42000,
      stockQty: 11,
      reorderLevel: 3,
      warranty: "1 Year",
      isSampleItem: false,
      imageUrl: "assets/custom_subwoofer.jpg"
    },
    {
      id: "prod-012",
      sku: "AUD-SPK-JBL65",
      name: "JBL Stage3 6.5\" 2-Way Component Speaker System",
      category: "Audio & Subwoofers",
      description: "Crisp highs and clean mids with external crossover network and edge-driven dome tweeters.",
      unitCost: 19500,
      salePrice: 28900,
      discountPrice: 26500,
      specialPrice: 25000,
      stockQty: 20,
      reorderLevel: 5,
      warranty: "1 Year",
      isSampleItem: false,
      imageUrl: "assets/custom_subwoofer.jpg"
    },
    {
      id: "prod-013",
      sku: "PROT-NANO-TINT",
      name: "Nano Ceramic Heat Shield Solar Film (Roll)",
      category: "Tint & Heat Protection",
      description: "99% UV rejection, 90% Infrared heat cut, crystal clear nighttime clarity with zero signal interference.",
      unitCost: 45000,
      salePrice: 68000,
      discountPrice: 62000,
      specialPrice: 59000,
      stockQty: 7,
      reorderLevel: 2,
      warranty: "5 Years",
      isSampleItem: false,
      imageUrl: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-014",
      sku: "PROT-RAT-GUARD",
      name: "Stainless Steel Heavy Gauge Rat Guard Shield",
      category: "Rat Guard Protection",
      description: "Custom laser-cut stainless steel mesh protection against rodent damage for engine bays & AC vents.",
      unitCost: 4800,
      salePrice: 9500,
      discountPrice: 8500,
      specialPrice: 7900,
      stockQty: 30,
      reorderLevel: 8,
      warranty: "3 Years",
      isSampleItem: false,
      imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-015",
      sku: "INT-3M-CARPET",
      name: "3M Custom Anti-Skid Coil Floor Carpet Set",
      category: "3M Carpets & Mats",
      description: "Waterproof, dust-trapping 18mm high-density cushioned coil mats customized for any vehicle model.",
      unitCost: 12500,
      salePrice: 19500,
      discountPrice: 18000,
      specialPrice: 16500,
      stockQty: 22,
      reorderLevel: 5,
      warranty: "2 Years",
      isSampleItem: false,
      imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-016",
      sku: "INT-SEAT-LEATH",
      name: "Full Vehicle Custom Leather Seat Cover Set",
      category: "Seat Covers",
      description: "Premium breathable microfiber leather with diamond double-stitching and ergonomic lumbar padding.",
      unitCost: 34000,
      salePrice: 52000,
      discountPrice: 48000,
      specialPrice: 45000,
      stockQty: 10,
      reorderLevel: 3,
      warranty: "2 Years",
      isSampleItem: false,
      imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-017",
      sku: "SEC-GPS-ALARM",
      name: "Smart 2-Way Security Alarm & Realtime GPS Tracker",
      category: "Security Systems",
      description: "Remote engine immobilizer, smartphone real-time geofencing, siren alert, shock & tilt sensors.",
      unitCost: 14000,
      salePrice: 24500,
      discountPrice: 22000,
      specialPrice: 20500,
      stockQty: 15,
      reorderLevel: 4,
      warranty: "2 Years",
      isSampleItem: false,
      imageUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: "prod-018",
      sku: "PROT-UNDER-COAT",
      name: "Underbody Rubberized Anti-Rust & Stone Guard",
      category: "Plastic & Body Protection",
      description: "Corrosion inhibitor chassis spray with sound dampening and gravel stone protection layer.",
      unitCost: 6500,
      salePrice: 13500,
      discountPrice: 12000,
      specialPrice: 11000,
      stockQty: 28,
      reorderLevel: 6,
      warranty: "3 Years",
      isSampleItem: false,
      imageUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=60"
    }
  ],

  // Auto Doc Workshop Services
  services: [
    {
      id: "srv-001",
      name: "Android Display Full Installation & Canbus Harnessing",
      category: "Installation",
      basePrice: 4500,
      duration: "1.5 Hours",
      description: "Professional dashboard dismounting, steering wheel controls pairing, reverse cam hookup and clean concealment."
    },
    {
      id: "srv-002",
      name: "360° Panoramic Camera 4-Way Calibration Service",
      category: "Calibration",
      basePrice: 6500,
      duration: "2.5 Hours",
      description: "Front, rear, and mirror camera fitting followed by high-precision optical mat calibration."
    },
    {
      id: "srv-003",
      name: "Sound System Staging, Amp Wiring & Bass Tuning",
      category: "Audio Tuning",
      basePrice: 5500,
      duration: "2 Hours",
      description: "Gain setting with oscilloscope, cross-over frequency tuning, and premium copper cable routing."
    },
    {
      id: "srv-004",
      name: "Full Vehicle Nano Ceramic Tint Application",
      category: "Tinting",
      basePrice: 8500,
      duration: "3 Hours",
      description: "Dust-free booth window tint installation with computer-cut precision for all side and rear glasses."
    },
    {
      id: "srv-005",
      name: "Engine Bay & AC Duct Rat Guard Custom Fitting",
      category: "Protection",
      basePrice: 3500,
      duration: "1 Hour",
      description: "Custom bracket molding and stainless steel wire mesh attachment to prevent rodent intrusions."
    },
    {
      id: "srv-006",
      name: "Complete Leather Seat Upholstery Fitment",
      category: "Interior",
      basePrice: 6000,
      duration: "3 Hours",
      description: "Tight-contour tensioning, wrinkle removal, and seat heater/airbag compatibility testing."
    },
    {
      id: "srv-007",
      name: "3M Custom Coil Carpet Cutting & Edge Binding",
      category: "Interior",
      basePrice: 2500,
      duration: "45 Mins",
      description: "Exact floor pan measurement, anti-skid grommet fixation, and custom driver heel-pad attachment."
    },
    {
      id: "srv-008",
      name: "Smart Security Alarm & GPS Tracker Concealed Fitting",
      category: "Security",
      basePrice: 4500,
      duration: "2 Hours",
      description: "Hidden anti-tamper wiring, engine cutoff relay integration, and mobile app configuration."
    },
    {
      id: "srv-009",
      name: "Chassis Underbody Anti-Corrosion Spray Service",
      category: "Protection",
      basePrice: 7500,
      duration: "2 Hours",
      description: "High-pressure underwash, rust neutralization, and thick rubberized underseal coating application."
    },
    {
      id: "srv-010",
      name: "Auto Doc Complete Vehicle Electronics & Modification Check",
      category: "Inspection",
      basePrice: 2000,
      duration: "30 Mins",
      description: "Complete health diagnostic on battery, alternator load, audio channels, camera feeds, and wiring fuses."
    }
  ],

  // Sample historical invoices
  invoices: [
    {
      id: "INV-2026-1001",
      invoiceNumber: "YCA-1001",
      date: "2026-09-01T14:35:00.000Z",
      customerName: "Saman Jayawardena",
      customerPhone: "0778899112",
      vehicleNumber: "WP CAB-4921",
      vehicleModel: "Toyota Premio 260",
      cashierId: "usr-cash-01",
      cashierName: "Kasun Perera",
      items: [
        {
          id: "prod-009",
          name: "9-Inch IPS DSP Android 14 Player (4GB+64GB)",
          priceTier: "discountPrice",
          unitPrice: 35000,
          qty: 1,
          total: 35000
        },
        {
          id: "prod-001",
          name: "TW25 DVR Camera",
          priceTier: "salePrice",
          unitPrice: 8900,
          qty: 1,
          total: 8900
        },
        {
          id: "srv-001",
          name: "Android Display Full Installation & Canbus Harnessing",
          priceTier: "basePrice",
          unitPrice: 4500,
          qty: 1,
          total: 4500
        }
      ],
      subTotal: 48400,
      discountType: "percentage",
      discountValue: 0,
      discountAmount: 0,
      extraDiscountRequested: 0,
      discountStatus: "none", // none | pending | approved | rejected
      approvedBy: null,
      totalAmount: 48400,
      paymentMethod: "Card",
      paymentStatus: "Paid",
      status: "Completed",
      notes: "Installed with reverse camera and steering controls programmed."
    },
    {
      id: "INV-2026-1002",
      invoiceNumber: "YCA-1002",
      date: "2026-09-01T16:15:00.000Z",
      customerName: "Dhammika Bandara",
      customerPhone: "0714455667",
      vehicleNumber: "SP KX-8812",
      vehicleModel: "Honda Vezel RU3",
      cashierId: "usr-cash-01",
      cashierName: "Kasun Perera",
      items: [
        {
          id: "prod-004",
          name: "Honda Vezel Custom Upgrade Kit",
          priceTier: "discountPrice",
          unitPrice: 18000,
          qty: 1,
          total: 18000
        },
        {
          id: "prod-014",
          name: "Stainless Steel Heavy Gauge Rat Guard Shield",
          priceTier: "discountPrice",
          unitPrice: 8500,
          qty: 1,
          total: 8500
        },
        {
          id: "prod-015",
          name: "3M Custom Anti-Skid Coil Floor Carpet Set",
          priceTier: "salePrice",
          unitPrice: 19500,
          qty: 1,
          total: 19500
        },
        {
          id: "srv-005",
          name: "Engine Bay & AC Duct Rat Guard Custom Fitting",
          priceTier: "basePrice",
          unitPrice: 3500,
          qty: 1,
          total: 3500
        }
      ],
      subTotal: 49500,
      discountType: "fixed",
      discountValue: 2500,
      discountAmount: 2500,
      extraDiscountRequested: 2500,
      discountStatus: "approved",
      approvedBy: "usr-admin-01",
      approvedAt: "2026-09-01T16:18:22.000Z",
      totalAmount: 47000,
      paymentMethod: "Cash",
      paymentStatus: "Paid",
      status: "Completed",
      notes: "Regular customer discount approved by Admin."
    },
    {
      id: "INV-2026-1003",
      invoiceNumber: "YCA-1003",
      date: "2026-09-01T18:40:00.000Z",
      customerName: "Niroshan Perera",
      customerPhone: "0751122334",
      vehicleNumber: "WP CAD-7719",
      vehicleModel: "Toyota Land Cruiser Prado",
      cashierId: "usr-cash-01",
      cashierName: "Kasun Perera",
      items: [
        {
          id: "prod-011",
          name: "Alpine 10\" Active Underseat Slim Subwoofer (1000W)",
          priceTier: "salePrice",
          unitPrice: 47500,
          qty: 1,
          total: 47500
        },
        {
          id: "prod-007",
          name: "10MT RC Heavy Duty Audio Wire",
          priceTier: "salePrice",
          unitPrice: 4900,
          qty: 1,
          total: 4900
        },
        {
          id: "srv-003",
          name: "Sound System Staging, Amp Wiring & Bass Tuning",
          priceTier: "basePrice",
          unitPrice: 5500,
          qty: 1,
          total: 5500
        }
      ],
      subTotal: 57900,
      discountType: "percentage",
      discountValue: 10,
      discountAmount: 5790,
      extraDiscountRequested: 5790,
      discountStatus: "pending",
      approvedBy: null,
      totalAmount: 52110,
      paymentMethod: "Card",
      paymentStatus: "Pending Approval",
      status: "Pending Approval",
      notes: "Customer requested 10% bundle discount on subwoofer setup."
    }
  ],

  // Approvals queue: discount approvals, new inventory approvals, price change approvals
  approvals: [
    {
      id: "appr-disc-1003",
      type: "discount",
      title: "Invoice #YCA-1003 Discount Request (10% / Rs. 5,790)",
      targetId: "INV-2026-1003",
      targetRef: "YCA-1003",
      requesterId: "usr-cash-01",
      requesterName: "Kasun Perera (Cashier)",
      requestedAt: "2026-09-01T18:40:10.000Z",
      status: "pending", // pending | approved | rejected
      details: {
        customerName: "Niroshan Perera",
        vehicle: "Toyota Prado (CAD-7719)",
        subTotal: 57900,
        discountType: "percentage",
        discountValue: 10,
        discountAmount: 5790,
        finalTotal: 52110,
        reason: "Customer doing full subwoofer upgrade + cabling package."
      },
      actionLog: []
    },
    {
      id: "appr-inv-001",
      type: "new_inventory",
      title: "New Item Addition: Pioneer TS-WX120A Underseat Subwoofer",
      targetId: "temp-prod-101",
      targetRef: "SKU-PIO-SUB120",
      requesterId: "usr-tech-01",
      requesterName: "Roshan Silva (Lead Tech)",
      requestedAt: "2026-09-01T17:20:00.000Z",
      status: "pending",
      details: {
        name: "Pioneer TS-WX120A Underseat Compact Subwoofer",
        category: "Audio & Subwoofers",
        description: "150W maximum output with built-in class D amplifier and wired bass remote.",
        unitCost: 28500,
        salePrice: 42000,
        discountPrice: 39000,
        specialPrice: 37500,
        initialStock: 6,
        reorderLevel: 2,
        warranty: "1 Year"
      },
      actionLog: []
    },
    {
      id: "appr-price-001",
      type: "price_change",
      title: "Price Update Request: TW25 DVR Camera (CAM-TW25)",
      targetId: "prod-001",
      targetRef: "CAM-TW25",
      requesterId: "usr-cash-01",
      requesterName: "Kasun Perera (Cashier)",
      requestedAt: "2026-09-01T15:10:00.000Z",
      status: "pending",
      details: {
        productName: "TW25 DVR Camera",
        currentPrices: {
          salePrice: 8900,
          discountPrice: 8000,
          specialPrice: 7500
        },
        proposedPrices: {
          salePrice: 9500,
          discountPrice: 8500,
          specialPrice: 7900
        },
        reason: "Import exchange rate increased on new shipment batch."
      },
      actionLog: []
    }
  ],

  // Audit activities log
  activityLog: [
    {
      id: "act-001",
      timestamp: "2026-09-01T14:35:05.000Z",
      userId: "usr-cash-01",
      userName: "Kasun Perera",
      action: "INVOICE_CREATED",
      description: "Generated Invoice #YCA-1001 for Saman Jayawardena (Rs. 48,400)"
    },
    {
      id: "act-002",
      timestamp: "2026-09-01T16:18:22.000Z",
      userId: "usr-admin-01",
      userName: "Yomal Bandara",
      action: "DISCOUNT_APPROVED",
      description: "Approved Rs. 2,500 discount for Invoice #YCA-1002"
    },
    {
      id: "act-003",
      timestamp: "2026-09-01T18:40:10.000Z",
      userId: "usr-cash-01",
      userName: "Kasun Perera",
      action: "DISCOUNT_REQUESTED",
      description: "Requested 10% (Rs. 5,790) discount for Invoice #YCA-1003 - Waiting for Admin"
    }
  ]
};
