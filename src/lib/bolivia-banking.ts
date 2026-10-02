/**
 * TIENDA TÁCTICA BOLIVIA — PARSER Y CLASIFICADOR DE BANCAS BOLIVIANAS
 * Detecta y clasifica notificaciones bancarias de la app NotofocacionS
 * con soporte para Yape Bolivia (com.bcp.bo.wallet), BMSC, BNB, Gmail y Cripto.
 */

export interface DetectedBankNotification {
  id: number;
  package_name: string;
  app_name: string;
  title: string;
  content: string;
  created_at: string;
  is_payment: boolean;
  extracted_amount: number | null;
  client_name: string | null;
  transaction_ref: string | null;
  bank_name: string;
  bank_color: string;
  is_promotional: boolean;
  is_crypto?: boolean;
  crypto_currency?: string | null;
}

export interface BankPackageConfig {
  packageName: string;
  bankName: string;
  shortName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  isBank: boolean;
  dbStatus: string;
  notes: string;
}

export const BOLIVIA_PACKAGE_REGISTRY: Record<string, BankPackageConfig> = {
  'com.bcp.bo.wallet': {
    packageName: 'com.bcp.bo.wallet',
    bankName: 'Yape Bolivia / BCP Soli',
    shortName: 'Yape BCP',
    color: '#002A8F', // BCP Navy
    badgeBg: 'bg-purple-500/20 border-purple-500/30',
    badgeText: 'text-purple-300',
    isBank: true,
    dbStatus: 'Activo (29+ registros)',
    notes: 'Pagos QR recibidos con monto y nombre del pagador. Parser extrae Bs. y remitente.',
  },
  'bo.com.bmsc.bancamovil': {
    packageName: 'bo.com.bmsc.bancamovil',
    bankName: 'Banco Mercantil Santa Cruz (BMSC)',
    shortName: 'BMSC',
    color: '#005A36', // Mercantil Green
    badgeBg: 'bg-emerald-500/20 border-emerald-500/30',
    badgeText: 'text-emerald-300',
    isBank: true,
    dbStatus: 'Activo (4 registros)',
    notes: 'Notificaciones promocionales / sorteos de saldo (filtradas automáticamente para evitar falsos pagos).',
  },
  'com.bnb.bancamovil': {
    packageName: 'com.bnb.bancamovil',
    bankName: 'Banco Nacional de Bolivia (BNB)',
    shortName: 'BNB',
    color: '#007A33', // BNB Green
    badgeBg: 'bg-green-500/20 border-green-500/30',
    badgeText: 'text-green-300',
    isBank: true,
    dbStatus: 'Sin registros aún (Monitoreando)',
    notes: 'No ha emitido notificaciones al teléfono con el servicio activo. Parser listo para Simple QR BNB.',
  },
  'bo.gob.bancounion.bancamovil': {
    packageName: 'bo.gob.bancounion.bancamovil',
    bankName: 'Banco Unión (Unión Móvil)',
    shortName: 'Banco Unión',
    color: '#003366', // Unión Blue
    badgeBg: 'bg-blue-500/20 border-blue-500/30',
    badgeText: 'text-blue-300',
    isBank: true,
    dbStatus: 'Configurado',
    notes: 'Banca pública de Bolivia. Parser para transferencias Simple QR y créditos en cuenta.',
  },
  'com.google.android.gm': {
    packageName: 'com.google.android.gm',
    bankName: 'Gmail (Comprobantes Bancarios)',
    shortName: 'Gmail Yape',
    color: '#EA4335', // Google Red
    badgeBg: 'bg-red-500/20 border-red-500/30',
    badgeText: 'text-red-300',
    isBank: false,
    dbStatus: 'Activo (Cientos de registros)',
    notes: 'Comprobantes oficiales de notificacionesyape con Nº de transacción y monto exacto.',
  },
  'com.binance.dev': {
    packageName: 'com.binance.dev',
    bankName: 'Binance Cripto',
    shortName: 'Binance',
    color: '#F0B90B',
    badgeBg: 'bg-amber-500/20 border-amber-500/30',
    badgeText: 'text-amber-300',
    isBank: false,
    dbStatus: 'Activo',
    notes: 'Notificaciones de retiros y depósitos cripto (USDT, AVAX, ETH).',
  },
  'com.tangem.wallet': {
    packageName: 'com.tangem.wallet',
    bankName: 'Tangem Crypto Cold Wallet',
    shortName: 'Tangem',
    color: '#212121',
    badgeBg: 'bg-neutral-500/20 border-neutral-500/30',
    badgeText: 'text-neutral-300',
    isBank: false,
    dbStatus: 'Activo',
    notes: 'Notificaciones de billetera fría Tangem Pay.',
  },
  'bo.com.bisa.bancamovil': {
    packageName: 'bo.com.bisa.bancamovil',
    bankName: 'Banco BISA',
    shortName: 'BISA',
    color: '#C8102E',
    badgeBg: 'bg-rose-500/20 border-rose-500/30',
    badgeText: 'text-rose-300',
    isBank: true,
    dbStatus: 'Configurado',
    notes: 'Transferencias y QR Simple Banco BISA.',
  },
  'com.bg.ganamovil': {
    packageName: 'com.bg.ganamovil',
    bankName: 'Banco Ganadero (GanaMóvil)',
    shortName: 'GanaMóvil',
    color: '#F37021',
    badgeBg: 'bg-orange-500/20 border-orange-500/30',
    badgeText: 'text-orange-300',
    isBank: true,
    dbStatus: 'Configurado',
    notes: 'GanaMóvil y pagos QR Simple Banco Ganadero.',
  },
};

/**
 * Obtiene la configuración de una app bancaria según su nombre de paquete,
 * soportando coincidencias exactas y prefijos (ej. com.bnb...).
 */
export function getPackageConfig(packageName: string): BankPackageConfig {
  const pkg = (packageName || '').toLowerCase().trim();

  // 1. Coincidencia exacta
  if (BOLIVIA_PACKAGE_REGISTRY[pkg]) {
    return BOLIVIA_PACKAGE_REGISTRY[pkg];
  }

  // 2. Coincidencia por prefijo / comodín BNB (com.bnb.bancamovil, com.bnb.movil, etc.)
  if (pkg.startsWith('com.bnb.') || pkg.includes('bnb.')) {
    return {
      packageName: pkg,
      bankName: 'Banco Nacional de Bolivia (BNB)',
      shortName: 'BNB',
      color: '#007A33',
      badgeBg: 'bg-green-500/20 border-green-500/30',
      badgeText: 'text-green-300',
      isBank: true,
      dbStatus: 'Sin registros aún (Monitoreando)',
      notes: 'Variante de paquete BNB detectada. Parser listo para Simple QR.',
    };
  }

  // 3. Banco Unión
  if (pkg.includes('bancounion') || pkg.includes('unionmovil')) {
    return BOLIVIA_PACKAGE_REGISTRY['bo.gob.bancounion.bancamovil'];
  }

  // 4. BMSC
  if (pkg.includes('bmsc')) {
    return BOLIVIA_PACKAGE_REGISTRY['bo.com.bmsc.bancamovil'];
  }

  // 5. Binance / Tangem / Cripto
  if (pkg.includes('binance')) {
    return BOLIVIA_PACKAGE_REGISTRY['com.binance.dev'];
  }
  if (pkg.includes('tangem')) {
    return BOLIVIA_PACKAGE_REGISTRY['com.tangem.wallet'];
  }

  // 6. Genérico no identificado
  return {
    packageName: pkg,
    bankName: pkg,
    shortName: pkg,
    color: '#666666',
    badgeBg: 'bg-neutral-500/20 border-neutral-500/30',
    badgeText: 'text-neutral-300',
    isBank: false,
    dbStatus: 'Detectado en móvil',
    notes: 'Aplicación general sin clasificador bancario dedicado.',
  };
}

/**
 * Parsea una notificación cruda capturada por Android y extrae datos bancarios
 */
export function parseBankNotification(raw: {
  id: number;
  package_name: string;
  app_name?: string;
  title?: string;
  content?: string;
  created_at?: string;
}): DetectedBankNotification {
  const pkg = (raw.package_name || '').toLowerCase().trim();
  const title = raw.title || '';
  const content = raw.content || '';
  const text = `${title} ${content}`;

  const config = getPackageConfig(pkg);

  let isPayment = false;
  let isPromotional = false;
  let isCrypto = false;
  let cryptoCurrency: string | null = null;
  let extractedAmount: number | null = null;
  let clientName: string | null = null;
  let transactionRef: string | null = null;

  // =========================================================================
  // 1. Yape Bolivia (com.bcp.bo.wallet)
  // =========================================================================
  if (pkg === 'com.bcp.bo.wallet') {
    // Caso de éxito real: "Recibiste un yapeo" / "QR DE JONATHAN RAMIREZ SAN te envió Bs. 100.00"
    if (
      title.toLowerCase().includes('yapeo') ||
      content.toLowerCase().includes('te envió bs') ||
      content.toLowerCase().includes('te envio bs') ||
      content.toLowerCase().includes('recibiste')
    ) {
      isPayment = true;

      // Extraer monto: "te envió Bs. 100.00" o "Bs. 45.00" o "Bs 50"
      const amountMatch = content.match(/(?:bs\.?|bol)\s*([\d,.]+)/i);
      if (amountMatch && amountMatch[1]) {
        const cleanNumber = amountMatch[1].replace(/,/g, '');
        const parsed = parseFloat(cleanNumber);
        if (!isNaN(parsed) && parsed > 0) extractedAmount = parsed;
      }

      // Extraer remitente: "QR DE JHAN MARC te envió" o "QR DE JAIME CESAR SANTOS NARVAIS te envió"
      const nameMatch = content.match(/QR\s+DE\s+([^,]+?)\s+te\s+envi[oó]/i);
      if (nameMatch && nameMatch[1]) {
        clientName = nameMatch[1].trim();
      }
    }
    // Caso promocional BCP/Yape: "Tu Yapa te espera", "gana Bs 5", "sorteo"
    else if (
      title.toLowerCase().includes('yapa') ||
      content.toLowerCase().includes('gana bs') ||
      content.toLowerCase().includes('sorteo') ||
      content.toLowerCase().includes('promoc') ||
      content.toLowerCase().includes('recibir tu yapa')
    ) {
      isPromotional = true;
    }
  }

  // =========================================================================
  // 2. Gmail con Comprobantes Oficiales de Yape / BCP (com.google.android.gm)
  // =========================================================================
  else if (pkg === 'com.google.android.gm') {
    // Notificación oficial de email bancario
    if (
      text.toLowerCase().includes('notificacionesyape') ||
      text.toLowerCase().includes('transferencia qr - yape') ||
      (text.toLowerCase().includes('transferencia qr') && text.toLowerCase().includes('monto transferido'))
    ) {
      isPayment = true;

      // Monto transferido: BOL 90 o BOL 700 o Bs. 90.00
      const amountMatch = content.match(/Monto\s+transferido:\s*(?:BOL|Bs\.?)\s*([\d,.]+)/i);
      if (amountMatch && amountMatch[1]) {
        const cleanNumber = amountMatch[1].replace(/,/g, '');
        const parsed = parseFloat(cleanNumber);
        if (!isNaN(parsed) && parsed > 0) extractedAmount = parsed;
      }

      // Nº Transacción: 971669553 o N° Transacción:\n946143724
      const refMatch = content.match(/N[oº°]?\s*Transacci[oó]n:\s*(\d+)/i);
      if (refMatch && refMatch[1]) {
        transactionRef = refMatch[1].trim();
      }

      // Beneficiario o Titular destino
      const benMatch = content.match(/Beneficiario:\s*([^\n\r|]+)/i);
      if (benMatch && benMatch[1]) {
        clientName = benMatch[1].trim();
      }
    }
  }

  // =========================================================================
  // 3. Banco Mercantil Santa Cruz (bo.com.bmsc.bancamovil)
  // =========================================================================
  else if (pkg === 'bo.com.bmsc.bancamovil' || pkg.includes('bmsc')) {
    // En BMSC, el teléfono recibe notificaciones de marketing como "Bs 10.000", "Expocruz", "LaMakro"
    const isPromoText =
      text.toLowerCase().includes('sorteo') ||
      text.toLowerCase().includes('aniversario') ||
      text.toLowerCase().includes('millón') ||
      text.toLowerCase().includes('millon') ||
      text.toLowerCase().includes('ganadores') ||
      text.toLowerCase().includes('cupón') ||
      text.toLowerCase().includes('cupon') ||
      text.toLowerCase().includes('makro') ||
      text.toLowerCase().includes('expocruz') ||
      text.toLowerCase().includes('opciones del viernes');

    if (isPromoText) {
      isPromotional = true;
    } else if (
      text.toLowerCase().includes('transferencia recibida') ||
      text.toLowerCase().includes('abono en cuenta') ||
      text.toLowerCase().includes('te transfirieron') ||
      text.toLowerCase().includes('pago simple qr recibido')
    ) {
      isPayment = true;
      const amountMatch = content.match(/(?:bs\.?|bol)\s*([\d,.]+)/i);
      if (amountMatch && amountMatch[1]) {
        const parsed = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (!isNaN(parsed) && parsed > 0) extractedAmount = parsed;
      }
      const clientMatch = content.match(/(?:de|desde)\s+([^,.\n]+)/i);
      if (clientMatch && clientMatch[1]) {
        clientName = clientMatch[1].trim();
      }
    }
  }

  // =========================================================================
  // 4. BNB (Banco Nacional de Bolivia) - com.bnb.bancamovil / com.bnb...
  // =========================================================================
  else if (pkg.startsWith('com.bnb.') || pkg.includes('bnb.')) {
    if (
      text.toLowerCase().includes('transferencia') ||
      text.toLowerCase().includes('abono') ||
      text.toLowerCase().includes('recibiste') ||
      text.toLowerCase().includes('simple qr') ||
      text.toLowerCase().includes('pago simple') ||
      text.toLowerCase().includes('has recibido')
    ) {
      isPayment = true;
      const amountMatch = content.match(/(?:bs\.?|bol|\$)\s*([\d,.]+)/i);
      if (amountMatch && amountMatch[1]) {
        const parsed = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (!isNaN(parsed) && parsed > 0) extractedAmount = parsed;
      }

      const clientMatch = content.match(/(?:de|remitente:?)\s+([A-Za-z\s]+)/i);
      if (clientMatch && clientMatch[1]) {
        clientName = clientMatch[1].trim();
      }
    } else if (
      text.toLowerCase().includes('promoc') ||
      text.toLowerCase().includes('sorteo') ||
      text.toLowerCase().includes('campaña')
    ) {
      isPromotional = true;
    }
  }

  // =========================================================================
  // 5. Cripto / Billeteras (Binance / Tangem)
  // =========================================================================
  else if (pkg === 'com.binance.dev' || pkg === 'com.tangem.wallet') {
    isCrypto = true;

    // Detectar criptomoneda (USDT, AVAX, ETH, BTC, BNB)
    const cryptoMatch = text.match(/\b(USDT|AVAX|ETH|BTC|BNB|SOL|USDC)\b/i);
    if (cryptoMatch && cryptoMatch[1]) {
      cryptoCurrency = cryptoMatch[1].toUpperCase();
    }

    // Extraer monto cripto si dice ej: "0.66533 AVAX" o "150 USDT"
    const amountCryptoMatch = content.match(/([\d.]+)\s*(?:USDT|AVAX|ETH|BTC|BNB|SOL|USDC)/i);
    if (amountCryptoMatch && amountCryptoMatch[1]) {
      const parsed = parseFloat(amountCryptoMatch[1]);
      if (!isNaN(parsed) && parsed > 0) extractedAmount = parsed;
    }

    if (
      text.toLowerCase().includes('depósito exitoso') ||
      text.toLowerCase().includes('pago recibido') ||
      text.toLowerCase().includes('deposito exitoso')
    ) {
      isPayment = true;
    }
  }

  // =========================================================================
  // 6. Otros Bancos Bolivianos (Banco Unión, BISA, Ganadero)
  // =========================================================================
  else if (
    pkg.includes('bancounion') ||
    pkg.includes('bisa') ||
    pkg.includes('ganamovil') ||
    pkg.includes('banco')
  ) {
    if (
      text.toLowerCase().includes('transferencia') ||
      text.toLowerCase().includes('abono') ||
      text.toLowerCase().includes('recibiste') ||
      text.toLowerCase().includes('simple qr') ||
      text.toLowerCase().includes('pago recibido')
    ) {
      isPayment = true;
      const amountMatch = content.match(/(?:bs\.?|bol|\$)\s*([\d,.]+)/i);
      if (amountMatch && amountMatch[1]) {
        const parsed = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (!isNaN(parsed) && parsed > 0) extractedAmount = parsed;
      }
    }
  }

  return {
    id: raw.id,
    package_name: raw.package_name,
    app_name: raw.app_name || config.bankName,
    title,
    content,
    created_at: raw.created_at || new Date().toISOString(),
    is_payment: isPayment,
    extracted_amount: extractedAmount,
    client_name: clientName,
    transaction_ref: transactionRef,
    bank_name: config.bankName,
    bank_color: config.color,
    is_promotional: isPromotional,
    is_crypto: isCrypto,
    crypto_currency: cryptoCurrency,
  };
}

/**
 * Resultado de cruce de datos entre Notificación Bancaria y Órdenes de la Tienda
 */
export interface ReconciliationMatch {
  orderId: string;
  orderTotal: number;
  customerName: string;
  customerPhone?: string;
  score: number; // 0 a 100
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  matchedAmount: number;
  isPartialDeposit: boolean;
}

/**
 * Normaliza cadenas de texto para comparación fonética/lexical en Bolivia
 * (remueve tildes, signos y pasa a mayúsculas)
 */
function cleanTextForMatching(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .trim();
}

/**
 * Algoritmo Táctico de Cruce Bancario:
 * Cruza Monto (100% o 50%), Nombre del Cliente, Glosa/Nº de Orden, Teléfono y Ventana Horaria.
 */
export function matchNotificationWithOrders(
  notif: DetectedBankNotification,
  orders: Array<{
    id: string;
    total: number;
    status: string;
    customer_name?: string;
    customer_phone?: string;
    payment_mode?: string;
    created_at: string;
  }>
): ReconciliationMatch | null {
  if (!notif.is_payment || !notif.extracted_amount || notif.extracted_amount <= 0) {
    return null;
  }

  const notifAmount = notif.extracted_amount;
  const notifTime = new Date(notif.created_at).getTime();
  const notifTextClean = cleanTextForMatching(`${notif.title} ${notif.content} ${notif.client_name || ''}`);
  const notifClientClean = cleanTextForMatching(notif.client_name || '');

  // Palabras significativas del depositante en banco (más de 2 letras y no artículos comunes)
  const stopWords = new Set(['DE', 'DEL', 'LA', 'LOS', 'LAS', 'SAN', 'SANTO', 'QR', 'YAPE', 'BANCO']);
  const notifClientWords = notifClientClean
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  let bestMatch: ReconciliationMatch | null = null;
  let highestScore = 0;

  // Filtrar solo órdenes pendientes o no verificadas
  const pendingOrders = orders.filter(
    o => o.status === 'pending' || (o as any).status === 'unverified'
  );

  for (const order of pendingOrders) {
    let score = 0;
    const reasons: string[] = [];
    let isPartial = false;
    let matchedAmount = order.total;

    // 1. Verificación de Monto (Total o 50% anticipo)
    const exactTotalMatch = Math.abs(order.total - notifAmount) < 0.15;
    const halfTotal = order.total * 0.5;
    const exactHalfMatch = Math.abs(halfTotal - notifAmount) < 0.15;

    if (exactTotalMatch) {
      score += 45;
      matchedAmount = order.total;
      reasons.push(`Monto exacto del 100% (Bs. ${order.total.toFixed(2)})`);
    } else if (exactHalfMatch || order.payment_mode === 'partial_payment') {
      if (exactHalfMatch) {
        score += 45;
        isPartial = true;
        matchedAmount = halfTotal;
        reasons.push(`Anticipo exacto del 50% (Bs. ${halfTotal.toFixed(2)})`);
      }
    } else {
      // Si el monto no coincide en nada, la probabilidad es casi nula
      continue;
    }

    // 2. Coincidencia de Nombre (Fuzzy Word Match)
    if (order.customer_name && notifClientWords.length > 0) {
      const orderCustomerClean = cleanTextForMatching(order.customer_name);
      const orderWords = orderCustomerClean
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

      let matchedWords = 0;
      for (const w of orderWords) {
        if (notifClientWords.some(nw => nw === w || nw.includes(w) || w.includes(nw))) {
          matchedWords++;
        }
      }

      if (matchedWords >= 2) {
        score += 35;
        reasons.push(`Nombre y apellido coinciden (${matchedWords} palabras: ${order.customer_name})`);
      } else if (matchedWords === 1) {
        score += 20;
        reasons.push(`Coincidencia de nombre/apellido parcial: ${order.customer_name}`);
      }
    }

    // 3. ID de Orden en la Glosa / Descripción de la notificación
    const cleanOrderId = order.id.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const shortOrderId = cleanOrderId.length > 5 ? cleanOrderId.slice(-5) : cleanOrderId;
    if (notifTextClean.includes(cleanOrderId) || (shortOrderId.length >= 4 && notifTextClean.includes(shortOrderId))) {
      score += 35;
      reasons.push(`Código de orden #${order.id.toUpperCase()} presente en la glosa bancaria`);
    }

    // 4. Coincidencia de Teléfono Celular (últimos 6-8 dígitos)
    if (order.customer_phone) {
      const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
      const lastDigits = cleanPhone.slice(-6);
      if (lastDigits.length >= 6 && notif.content.includes(lastDigits)) {
        score += 20;
        reasons.push(`Teléfono del cliente (${lastDigits}) presente en notificación`);
      }
    }

    // 5. Ventana de Tiempo (Cercanía horaria entre la orden y el abono)
    const orderTime = new Date(order.created_at).getTime();
    if (!isNaN(orderTime) && !isNaN(notifTime)) {
      const diffHours = Math.abs(notifTime - orderTime) / (1000 * 60 * 60);
      if (diffHours <= 2) {
        score += 15;
        reasons.push('Notificación bancaria recibida en la misma ventana horaria (< 2 horas)');
      } else if (diffHours <= 24) {
        score += 8;
        reasons.push('Pago realizado el mismo día de la orden');
      }
    }

    // Determinar nivel de confianza
    const confidence: 'high' | 'medium' | 'low' =
      score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        orderId: order.id,
        orderTotal: order.total,
        customerName: order.customer_name || 'Cliente',
        customerPhone: order.customer_phone,
        score: Math.min(score, 100),
        confidence,
        reasons,
        matchedAmount,
        isPartialDeposit: isPartial,
      };
    }
  }

  return bestMatch;
}

