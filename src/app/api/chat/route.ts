import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Helper to safely extract environment variables from multiple sources:
 * process.env, .env.local, .env
 */
function getEnv(key: string): string {
  if (process.env[key]) return process.env[key] as string;

  const envFiles = ['.env.local', '.env'];
  for (const filename of envFiles) {
    try {
      const envPath = path.join(/*turbopackIgnore: true*/ process.cwd(), filename);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
          const [k, ...v] = trimmed.split('=');
          if (k.trim() === key) {
            const val = v.join('=').trim().replace(/^["']|["']$/g, '');
            if (val) return val;
          }
        }
      }
    } catch {
      // Continue checking next file
    }
  }
  return '';
}

/**
 * Rich System Tactical Knowledge for Gemini AI & Reasoning Engine
 */
const SYSTEM_TACTICAL_KNOWLEDGE = `
ERES: "OPERADOR TÁCTICO KILO-9", el asistente de inteligencia artificial militar de Tienda Táctica Cochabamba (Bolivia).
TONO: Profesional militar, respetuoso, directo, resolutivo, empático y de alta precisión técnica. Trata al usuario como "Operador" o "Camarada". Hablas con terminología táctica pero completamente comprensible ("Afirmativo", "Operador", "Recibido", "Telemetría", "Coordenadas", "Precinto balístico numerado").
MONEDA: Siempre en Bolivianos (Bs.).

DATOS CLAVE DE OPERACIÓN Y LOGÍSTICA REAL (COCHABAMBA Y TODA BOLIVIA):
- Base Central de Operaciones: Av. Heroínas #560 entre San Martín y 25 de Mayo, Cochabamba, Bolivia.
- Horario de Almacén: Lunes a Sábado de 09:00 a 19:00 continuo (Recojo presencial: Gratis, Bs. 0).
- Delivery Local Cercado: Despacho motorizado exprés con precinto de seguridad en 45 a 90 minutos (Costo: Bs. 15).
- Zona Metropolitana / Conurbada: Quillacollo, Sacaba, Tiquipaya, Colcapirhua (Costo: Bs. 20 a Bs. 25, entrega en 2 a 3 horas).
- Valle Bajo: Vinto, Sipe Sipe, Suticollo, Capinota, Parotani (Costo: Bs. 20 a Bs. 30 por delivery o trufi interprovincial).
- VALLE ALTO DE COCHABAMBA (¡SÍ SE REALIZAN ENVÍOS!): Cliza, Punata, Tarata, Arani, Tolata, San Benito, Anzaldo, Villa Rivero. Se despacha mediante Trufis Interprovinciales / Encomiendas rápidas desde la Parada Valle Alto (Av. Barrientos / 6 de Agosto) o despacho directo. Llega el mismo día (2 a 4 horas). Flete: Bs. 20 a Bs. 30. Se envía con precinto militar numerado y se comparte foto de placa y guía por WhatsApp.
- TRÓPICO DE COCHABAMBA / CHAPARE (¡SÍ SE REALIZAN ENVÍOS!): Villa Tunari, Shinahota, Chimoré, Ivirgarzama, Entre Ríos, Bulo Bulo. Despacho por Surubíes / Trufis rápidos de la Parada Chapare (Av. Oquendo y 9 de Abril) o flota interdepartamental. Flete: Bs. 25 a Bs. 35. Llega en 4 a 6 horas o 24 horas.
- CONO SUR Y ZONA ANDINA: Aiquile, Mizque, Totora, Pasorapa, Independencia. Flota o expreso provincial (Bs. 25 a Bs. 35).
- ENVÍOS NACIONALES A TODA BOLIVIA (LOS 9 DEPARTAMENTOS): La Paz, El Alto, Santa Cruz (Montero, Warnes), Oruro, Potosí, Sucre (Chuquisaca), Tarija (Yacuiba, Bermejo), Beni (Trinidad, Riberalta), Pando (Cobija). Encomienda terrestre diaria desde la Terminal de Buses Cochabamba o Courier (Shalom / Expreso). Llega en 24 a 48 horas con precinto de seguridad numerado y guía de rastreo. Flete: Bs. 35 (Bs. 40-45 para zonas remotas).

MODALIDAD DE PAGOS Y SEGURIDAD ANTIFRAUDE (QR SIMPLE BOLIVIA):
1. Pago 100% por QR Simple: Bonificación automática de un PACK DE STICKERS TÁCTICOS EXCLUSIVOS o souvenir militar sorpresa en el paquete.
2. Modalidad 50/50 (Cero Riesgo): 50% de anticipo por QR para confirmar y precintar el paquete, y el 50% restante al recibir el producto en mano (en tu domicilio o al recoger de la flota/trufi).
3. Pago Contra Entrega en Efectivo: Al retirar personalmente en Base Heroínas #560.
4. Seguridad: Empresa legalmente constituida en Cochabamba, base física comprobable, precintos balísticos numerados únicos.

ARSENAL Y EQUIPAMIENTO DISPONIBLE (PRECIOS EN BS.):
1. Plate Carrier Táctico Nivel IV Multicam (ID: prod-01) - Bs. 340.00: Cordura 1000D, corte láser MOLLE, compatible con placas Stand-Alone NIJ IV (detiene 7.62x51mm AP y fusil).
2. Botas Tácticas Desert Storm Vibram (ID: prod-02) - Bs. 310.00: Suela Vibram antideslizante, membrana impermeable transpirable, caña 8", tallas 39 a 44.
3. Mira Holográfica EOTech XPS3 (ID: prod-03) - Bs. 380.00: Retícula 68 MOA con 1 MOA dot, visión nocturna NVG, sumergible 10m.
4. Mochila Asalto 45L MOLLE Assault Pack (ID: prod-04) - Bs. 220.00: Cordura 1000D, compartimento hidratación 3L, 4 compartimentos.
5. Guantes Tácticos con Nudillos de Carbono (ID: prod-05) - Bs. 120.00: Placas de fibra de carbono, palma antideslizante Kevlar, touch screen.
6. Cuchillo Táctico de Supervivencia KA-BAR (ID: prod-06) - Bs. 150.00: Hoja acero carbono 1095 Cro-Van 7", funda Kydex rígida.
7. Radio Táctico Baofeng UV-5R Militar (ID: prod-07) - Bs. 150.00: Dual band VHF/UHF, 128 canales, auricular acústico táctico.
8. Pantalón Cargo Táctico Ripstop (ID: prod-08) - Bs. 200.00: Tela antidesgarro ripstop, 10 bolsillos, tallas 30 a 38.
9. Polera Táctica Combat Shirt Ripstop (ID: prod-09) - Bs. 145.00: Torso transpirable para chaleco, mangas ripstop con bolsillos y velcro, S a XL.
10. Reloj Militar Digital G-Shock Impermeable 200M (ID: prod-10) - Bs. 180.00: Sumergible 20 BAR, cristal mineral, cronómetro, luz LED.
11. Lentes Balísticos Tácticos UV400 (ID: prod-11) - Bs. 115.00: Marco envolvente balístico con 3 micas intercambiables y estuche rígido.
12. Morral Táctico Bandolera Cruzado MOLLE (ID: prod-12) - Bs. 130.00: Pechera urbana EDC, ambidiestro, compartimento oculto de extracción rápida.
13. Casco Táctico FAST Militar con Rieles NVG (ID: prod-13) - Bs. 250.00: Rieles ARC, montura frontal NVG, dial occipital ajustable.
14. Kit de Rodilleras y Coderas de Impacto (ID: prod-14) - Bs. 105.00: TPU de alto impacto y espuma EVA absorbente.
15. Funda Táctica Portapistola Holster Universal (ID: prod-15) - Bs. 100.00: Retención con dedo índice, rotación 360°, para Glock, Bersa, Taurus, CZ.
16. Chaleco Táctico Ligero MOLLE Modular (ID: prod-16) - Bs. 190.00: Malla transpirable, triple pouch para cargadores.

WHATSAPP DE ATENCIÓN DIRECTA: +591 71234567.

REGLAS DE RESPUESTA:
- Responde DIRECTAMENTE a la pregunta del usuario. Si el usuario pregunta si se puede enviar a Cliza, Punata o a otro pueblo, confirma de inmediato que SÍ se puede, explica cómo se hace el envío, el costo y el tiempo. NO recites todo el catálogo de productos a menos que lo pidan explícitamente.
- Si el usuario pregunta sobre algo no relacionado a la tienda (ubicaciones en Bolivia, detalles balísticos, leyes, clima o temas generales), usa tus capacidades de búsqueda o conocimiento para resolver la duda amablemente con porte táctico.
- Mantén respuestas ágiles, estructuradas y con emojis tácticos.
`;

/**
 * Normalizes colloquial Bolivian slang, typos, and common chat misspellings
 */
function normalizeQuery(raw: string): string {
  let q = raw.toLowerCase().trim();
  q = q.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');
  // Common typos in Bolivian chat
  q = q.replace(/\btoro lado\b/g, 'otro lado');
  q = q.replace(/\btikipaya\b/g, 'tiquipaya');
  q = q.replace(/\bquillacocllo\b/g, 'quillacollo');
  q = q.replace(/\bkilla\b/g, 'quillacollo');
  q = q.replace(/\bpeude\b/g, 'puede');
  q = q.replace(/\bpeudo\b/g, 'puedo');
  q = q.replace(/\bdodn e\b/g, 'donde');
  q = q.replace(/\bdodn\b/g, 'donde');
  q = q.replace(/\bhaces\b/g, 'hacen');
  q = q.replace(/\bk hay\b/g, 'que hay');
  q = q.replace(/\bq hay\b/g, 'que hay');
  q = q.replace(/\bxfa\b/g, 'por favor');
  q = q.replace(/\bcuanto ta\b/g, 'cuanto esta');
  q = q.replace(/\bkamuflado\b/g, 'camuflado');
  return q;
}

/**
 * Call Google Gemini API with smart model cascade and search grounding tool
 */
async function callGeminiAI(
  apiKey: string,
  userQuery: string,
  messages: any[],
  dynamicContext: string
): Promise<string | null> {
  // Build clean history
  const rawHistory = (messages || []).slice(-6);
  const conversationHistory: { role: string; parts: { text: string }[] }[] = [];
  for (const m of rawHistory) {
    const role = m.sender === 'user' || m.role === 'user' ? 'user' : 'model';
    const text = m.text || m.content || '';
    if (!text.trim()) continue;
    if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === role) continue;
    conversationHistory.push({ role, parts: [{ text }] });
  }

  // Model cascade: Try 3.5-flash (active 2026), 3.8-flash, 3.7-flash, gemini-flash-latest
  const modelsToTry = [
    {
      name: 'gemini-3.5-flash',
      useSearch: true,
    },
    {
      name: 'gemini-3.8-flash',
      useSearch: true,
    },
    {
      name: 'gemini-3.7-flash',
      useSearch: true,
    },
    {
      name: 'gemini-flash-latest',
      useSearch: true,
    },
    {
      name: 'gemini-3.1-flash-lite',
      useSearch: false,
    },
  ];

  for (const modelConfig of modelsToTry) {
    try {
      const bodyPayload: any = {
        systemInstruction: {
          parts: [
            {
              text:
                SYSTEM_TACTICAL_KNOWLEDGE +
                dynamicContext +
                '\n\nINSTRUCCIÓN CRÍTICA: Responde con terminología militar profesional y concisa. Responde EXACTAMENTE a lo que el operador está preguntando. Si pregunta por envíos a lugares específicos (Cliza, Punata, Chapare, La Paz, etc.), confirma inmediatamente la ruta, tiempo y costo. Si pregunta temas generales o de internet, usa Google Search para verificar y dar la respuesta exacta. NO repitas el catálogo completo a menos que te pidan "catálogo" o "qué productos tienen". Usa viñetas limpias con emojis.',
            },
          ],
        },
        contents: [
          ...conversationHistory,
          {
            role: 'user',
            parts: [{ text: userQuery }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.35,
        },
      };

      if (modelConfig.useSearch) {
        bodyPayload.tools = [{ googleSearch: {} }];
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.name}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data?.candidates?.[0];
        const textParts = candidate?.content?.parts;
        if (textParts && textParts.length > 0) {
          const generatedText = textParts.map((p: any) => p.text || '').join('\n').trim();
          if (generatedText) {
            return generatedText;
          }
        }
      } else {
        // If 400 with search tool, retry same model without tool
        if (modelConfig.useSearch && response.status === 400) {
          const fallbackBody = { ...bodyPayload };
          delete fallbackBody.tools;
          const retryRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.name}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fallbackBody),
            }
          );
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const cand = retryData?.candidates?.[0];
            const t = cand?.content?.parts?.map((p: any) => p.text || '').join('\n').trim();
            if (t) return t;
          }
        }
      }
    } catch (err) {
      // Continue to next model in cascade
    }
  }

  return null;
}

/**
 * Tactical Intelligence Engine 2.0 (High-precision local reasoning)
 * Operates when Gemini API is unavailable, offline, or as instant local brain.
 */
function runTacticalIntelligenceEngine(query: string, normalized: string): {
  reply: string;
  quickActions: string[];
  suggestedProductIds: string[];
} {
  let reply = '';
  let quickActions: string[] = [];
  const suggestedProductIds: string[] = [];

  // ================= 1. VALLE ALTO (CLIZA, PUNATA, TARATA, ARANI, ETC.) =================
  const isValleAlto =
    normalized.includes('cliza') ||
    normalized.includes('punata') ||
    normalized.includes('tarata') ||
    normalized.includes('arani') ||
    normalized.includes('tolata') ||
    normalized.includes('san benito') ||
    normalized.includes('anzaldo') ||
    normalized.includes('valle alto') ||
    normalized.includes('arbieto') ||
    normalized.includes('angostura');

  if (isValleAlto) {
    let specificTown = 'Cliza y todo el Valle Alto';
    if (normalized.includes('cliza')) specificTown = 'Cliza';
    else if (normalized.includes('punata')) specificTown = 'Punata';
    else if (normalized.includes('tarata')) specificTown = 'Tarata';
    else if (normalized.includes('arani')) specificTown = 'Arani';
    else if (normalized.includes('tolata')) specificTown = 'Tolata';

    reply = `🚚 AFIRMATIVO, OPERADOR — DESPACHO DIRECTO A ${specificTown.toUpperCase()}

¡Totalmente confirmado! Sí realizamos envíos seguros y constantes a ${specificTown} y todas las localidades del Valle Alto de Cochabamba.

📋 LOGÍSTICA DE ENVÍO A ${specificTown.toUpperCase()}:
▪ Modalidad de Despacho: Se envía mediante **Trufis Interprovinciales / Encomienda Rápida** desde la Parada Valle Alto (Av. Barrientos y 6 de Agosto) o despacho directo motorizado según el volumen.
▪ Tiempo de Entrega: Llega el **mismo día** (aproximadamente 2 a 4 horas desde la confirmación).
▪ Inversión del Flete: **Bs. 20 a Bs. 30** (flete económico interprovincial).
▪ Protocolo de Seguridad: Tu paquete va sellado con **precinto balístico numerado**. Te enviamos foto del paquete, número de placa del vehículo y contacto del chofer por WhatsApp para que lo recibas con total tranquilidad.

💳 MODALIDAD 50/50: Puedes abonar el 50% de anticipo por QR Simple para precintar tu orden y el saldo lo cancelas al recibir.`;

    quickActions = [
      `🚚 Coordinar Envío a ${specificTown}`,
      '🛡️ Ver Chalecos Nivel IV',
      '💳 Pago 50/50 con QR',
      '📱 Hablar con Despacho',
    ];
    return { reply, quickActions, suggestedProductIds };
  }

  // ================= 2. TRÓPICO DE COCHABAMBA / CHAPARE =================
  const isChapare =
    normalized.includes('chapare') ||
    normalized.includes('villa tunari') ||
    normalized.includes('shinahota') ||
    normalized.includes('chimore') ||
    normalized.includes('ivirgarzama') ||
    normalized.includes('entre rios') ||
    normalized.includes('bulo bulo') ||
    normalized.includes('tropico');

  if (isChapare) {
    reply = `🌴 AFIRMATIVO, OPERADOR — COBERTURA EN EL TRÓPICO / CHAPARE

¡Positivo! Despachamos regularmente a Villa Tunari, Shinahota, Chimoré, Ivirgarzama y todo el Trópico de Cochabamba.

📋 PROTOCOLO DE DESPACHO AL TRÓPICO:
▪ Modalidad: Surubí / Trufi rápido de la Parada Chapare (Av. Oquendo y 9 de Abril) o flota interdepartamental directa.
▪ Tiempo de Entrega: En el día (4 a 6 horas) o máximo en 24 horas.
▪ Flete de Encomienda: **Bs. 25 a Bs. 35** según volumen y destino.
▪ Embalaje Militar: Protección hermética antihumedad y precinto numerado de seguridad.`;

    quickActions = ['🚚 Coordinar Envío al Trópico', '🥾 Ver Botas Impermeables', '🎒 Ver Mochila 45L', '📱 Hablar por WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  // ================= 3. VALLE BAJO (VINTO, SIPE SIPE, SUTICOLLO, CAPINOTA) =================
  const isValleBajo =
    normalized.includes('vinto') ||
    normalized.includes('sipe sipe') ||
    normalized.includes('suticollo') ||
    normalized.includes('capinota') ||
    normalized.includes('parotani') ||
    normalized.includes('valle bajo');

  if (isValleBajo) {
    reply = `🛵 POSITIVO, OPERADOR — DESPACHO A VALLE BAJO

Confirmado, realizamos entregas a Vinto, Sipe Sipe, Suticollo y Capinota.
▪ Modalidad: Envío motorizado express o trufi interprovincial de línea directa.
▪ Tiempo: 2 a 4 horas en el mismo día.
▪ Costo de envío: **Bs. 20 a Bs. 28**.
▪ Seguridad: Paquete sellado con precinto de seguridad e informe de ruta en tiempo real.`;

    quickActions = ['🚚 Coordinar Envío Valle Bajo', '🛡️ Ver Productos', '💳 Pago 50/50 QR', '📱 WhatsApp Despacho'];
    return { reply, quickActions, suggestedProductIds };
  }

  // ================= 4. CONSULTA DE OTROS LUGARES / PROVINCIAS / "A TORO LADO" =================
  const isOtherLocationQuery =
    normalized.includes('otro lado') ||
    normalized.includes('que no sea') ||
    normalized.includes('otra parte') ||
    normalized.includes('provincias') ||
    normalized.includes('a donde mas') ||
    normalized.includes('donde mas') ||
    normalized.includes('mas lugares') ||
    normalized.includes('hacen envios');

  if (isOtherLocationQuery) {
    reply = `📍 COBERTURA TÁCTICA TOTAL — COCHABAMBA PROVINCIAS Y TODA BOLIVIA

Afirmativo, operador. Nuestra base central está en Cochabamba (Av. Heroínas #560), pero realizamos despachos tácticos a **TODAS LAS ZONAS Y PROVINCIAS**:

1. **Cochabamba Cercado (Urbano)**: Delivery motorizado en 45 a 90 min (Bs. 15).
2. **Zona Conurbada**: Quillacollo, Sacaba, Tiquipaya, Colcapirhua (Bs. 20 - Bs. 25).
3. **Valle Alto**: Cliza, Punata, Tarata, Arani, Tolata (Bs. 20 - Bs. 30 por trufi express en 2-4 hrs).
4. **Trópico / Chapare**: Villa Tunari, Shinahota, Chimoré, Ivirgarzama (Bs. 25 - Bs. 35 por surubí / bus).
5. **Valle Bajo**: Vinto, Sipe Sipe, Suticollo, Capinota (Bs. 20 - Bs. 28).
6. **Cono Sur & Zona Andina**: Aiquile, Mizque, Totora, Independencia (Bs. 25 - Bs. 35).
7. **Nacional (9 Departamentos)**: La Paz, Santa Cruz, Oruro, Potosí, Sucre, Tarija, Beni, Pando (Bs. 35 por flota o Shalom con guía de rastreo).

¿A qué localidad específica o provincia deseas que despachemos tu paquete?`;

    quickActions = [
      '🚚 Envío a Cliza / Valle Alto',
      '🌴 Envío al Chapare / Trópico',
      '🇧🇴 Envío a Otra Ciudad (Flota)',
      '📱 Hablar con Despacho WhatsApp',
    ];
    return { reply, quickActions, suggestedProductIds };
  }

  // ================= 5. NACIONAL (LA PAZ, SANTA CRUZ, ORURO, SUCRE, TARIJA, POTOSI, BENI, PANDO) =================
  const isNational =
    normalized.includes('la paz') ||
    normalized.includes('el alto') ||
    normalized.includes('santa cruz') ||
    normalized.includes('montero') ||
    normalized.includes('oruro') ||
    normalized.includes('potosi') ||
    normalized.includes('sucre') ||
    normalized.includes('chuquisaca') ||
    normalized.includes('tarija') ||
    normalized.includes('yacuiba') ||
    normalized.includes('bermejo') ||
    normalized.includes('beni') ||
    normalized.includes('trinidad') ||
    normalized.includes('riberalta') ||
    normalized.includes('pando') ||
    normalized.includes('cobija');

  if (isNational) {
    reply = `🇧🇴 DESPACHO NACIONAL TÁCTICO A TODO EL PAÍS

Afirmativo, operador. Despachamos diariamente desde Cochabamba a todos los departamentos del Estado Plurinacional de Bolivia.

📋 DETALLES DEL ENVÍO NACIONAL:
▪ Transporte: Encomienda terrestre por Flotas de Primera Línea (Terminal Central Cbba) o Courier Shalom / Expreso.
▪ Tiempo de Llegada: 24 a 48 horas según el departamento.
▪ Tarifa Plana Oficial: **Bs. 35.00** (incluye guía de rastreo y precinto numerado de seguridad).
▪ Modalidad 50/50: Puedes abonar el 50% de anticipo por QR para precintar tu paquete y el 50% restante al retirar el bulto.
▪ Bonificación: Si abonas el 100% por QR, recibes de obsequio un **Pack de Stickers Tácticos** dentro del paquete.`;

    quickActions = ['🇧🇴 Cotizar Envío Nacional', '🛡️ Ver Chalecos Nivel IV', '💳 Pago 50/50 QR', '📱 WhatsApp Despacho'];
    return { reply, quickActions, suggestedProductIds };
  }

  // ================= 6. PRODUCT SEARCH & BALLISTIC DETAILS =================
  if (normalized.includes('chaleco') || normalized.includes('plate') || normalized.includes('balist') || normalized.includes('placa') || normalized.includes('nivel 4') || normalized.includes('nivel iv')) {
    suggestedProductIds.push('prod-01', 'prod-16');
    reply = `🛡️ REPORTE BALÍSTICO — PLATE CARRIER TÁCTICO NIVEL IV MULTICAM

▪ Certificación Balística: Compatible con placas Stand-Alone NIJ 0101.06 Nivel IV (resiste impactos de munición perforante militar 7.62x51mm OTAN y fusil .30-06 AP).
▪ Material y Construcción: Cordura 1000D balística, corte láser integral, sistema MOLLE completo y hebillas de zafado rápido.
▪ Inversión Oficial: **Bs. 340.00**.
▪ Disponibilidad: En almacén central Cochabamba (Base Heroínas #560).
▪ Despacho: Entrega motorizada en Cochabamba o envíos a Cliza, Valle Alto y toda Bolivia.`;
    quickActions = ['🛒 Añadir al Carrito', '¿Cómo es el envío a mi zona?', '💳 Pagar 50/50 QR', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('bota') || normalized.includes('calzado') || normalized.includes('vibram') || normalized.includes('gore') || normalized.includes('desert storm')) {
    suggestedProductIds.push('prod-02');
    reply = `🥾 FICHA TÁCTICA — BOTAS MILITARES DESERT STORM VIBRAM

▪ Suela: Compuesto tipo Vibram militar con tracción agresiva antideslizante en barro, roca y asfalto.
▪ Impermeabilidad: Membrana transpirable que bloquea el agua y expulsa la humedad interna.
▪ Altura: Caña de 8 pulgadas con sujeción anatómica de tobillo y cremallera lateral táctica.
▪ Inversión Oficial: **Bs. 310.00**.
▪ Tallas Disponibles: 39, 40, 41, 42, 43, 44 (con cambio garantizado de talla).`;
    quickActions = ['🛒 Añadir al Carrito', '📏 Consultar Tallas Disponibles', '🚚 Pedir Delivery', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('mira') || normalized.includes('eotech') || normalized.includes('optica') || normalized.includes('punto rojo') || normalized.includes('xps3')) {
    suggestedProductIds.push('prod-03');
    reply = `🎯 SISTEMA ÓPTICO — MIRA HOLOGRÁFICA EOTECH XPS3

▪ Retícula Táctica: Círculo de 68 MOA con punto central de 1 MOA de alta precisión.
▪ Visión Nocturna: Compatible con dispositivos NVG (fósforo verde/blanco).
▪ Blindaje: Aluminio aeroespacial 7075-T6, sumergible hasta 10 metros en agua.
▪ Inversión Oficial: **Bs. 380.00**.`;
    quickActions = ['🛒 Añadir al Carrito', 'Ver en Catálogo', '📱 Hablar por WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('mochila') || normalized.includes('assault') || normalized.includes('45l')) {
    suggestedProductIds.push('prod-04');
    reply = `🎒 MOCHILA ASALTO 45L MOLLE ASSAULT PACK

▪ Capacidad: 45 Litros con sistema de compresión perimetral.
▪ Material: Cordura 1000D repelente al agua y abrasión.
▪ Hidratación: Compartimento posterior para bolsa de agua de 3L.
▪ Inversión Oficial: **Bs. 220.00**.`;
    quickActions = ['🛒 Añadir al Carrito', '🚚 Cotizar Envío', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('guante') || normalized.includes('nudillo') || normalized.includes('carbono')) {
    suggestedProductIds.push('prod-05');
    reply = `🧤 GUANTES TÁCTICOS CON NUDILLOS DE CARBONO

▪ Protección: Placa anatómica de fibra de carbono real sobre nudillos.
▪ Agarre: Palma antideslizante Kevlar con terminales táctiles para celular y GPS.
▪ Inversión Oficial: **Bs. 120.00** (Tallas M, L, XL).`;
    quickActions = ['🛒 Añadir al Carrito', 'Consultar Tallas', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('cuchillo') || normalized.includes('kabar') || normalized.includes('supervivencia')) {
    suggestedProductIds.push('prod-06');
    reply = `⚔️ CUCHILLO MILITAR KA-BAR 1095 CRO-VAN

▪ Hoja: Acero al carbono 1095 enterizo de 7 pulgadas con recubrimiento epoxi negro mate.
▪ Funda: Kydex rígida militar con bloqueo de seguridad y acople MOLLE.
▪ Inversión Oficial: **Bs. 150.00**.`;
    quickActions = ['🛒 Añadir al Carrito', '🚚 Coordinar Despacho', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('radio') || normalized.includes('baofeng') || normalized.includes('comunicador') || normalized.includes('walkie')) {
    suggestedProductIds.push('prod-07');
    reply = `📻 RADIO TÁCTICO MILITAR BAOFENG UV-5R DUAL BAND

▪ Frecuencia: Doble banda VHF/UHF de alta potencia y alcance extendido en serranía y campo abierto.
▪ Memoria: 128 canales, radio FM comercial y linterna LED táctica.
▪ Accesorios: Batería Li-ion, base de carga rápida, clip táctico y auricular con tubo acústico.
▪ Inversión Oficial: **Bs. 150.00**.`;
    quickActions = ['🛒 Añadir al Carrito', 'Ver Catálogo', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('pantalon') || normalized.includes('cargo') || normalized.includes('ripstop')) {
    suggestedProductIds.push('prod-08');
    reply = `👖 PANTALÓN CARGO TÁCTICO MILITAR RIPSTOP

▪ Tela: Ripstop antidesgarro con recubrimiento repelente a manchas y llovizna.
▪ Capacidad: 10 bolsillos reforzados para cargadores, navajas y linternas.
▪ Inversión Oficial: **Bs. 200.00** (Tallas 30, 32, 34, 36, 38).`;
    quickActions = ['🛒 Añadir al Carrito', 'Consultar mi Talla', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('polera') || normalized.includes('combat shirt') || normalized.includes('camisa')) {
    suggestedProductIds.push('prod-09');
    reply = `👕 POLERA DE COMBATE (COMBAT SHIRT) RIPSTOP

▪ Torso: Algodón táctico transpirable y elástico (evita acumulación de calor bajo chaleco).
▪ Mangas: Ripstop antidesgarro con bolsillos de hombro y paneles de velcro para parches.
▪ Inversión Oficial: **Bs. 145.00** (Tallas S, M, L, XL).`;
    quickActions = ['🛒 Añadir al Carrito', 'Ver Polera', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('reloj') || normalized.includes('g-shock') || normalized.includes('casio')) {
    suggestedProductIds.push('prod-10');
    reply = `⌚ RELOJ TÁCTICO DIGITAL MILITAR G-SHOCK

▪ Resistencia Extrema: Sumergible 200M (20 BAR), blindaje contra impactos y vibraciones severas.
▪ Funciones: Cronómetro táctico 1/100s, luz electroluminiscente verde militar, calendario y alarma.
▪ Inversión Oficial: **Bs. 180.00**.`;
    quickActions = ['🛒 Añadir al Carrito', 'Ver Reloj', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('lente') || normalized.includes('gafas') || normalized.includes('uv400')) {
    suggestedProductIds.push('prod-11');
    reply = `🕶️ LENTES BALÍSTICOS TÁCTICOS UV400 (KIT 3 MICAS)

▪ Protección Balística: Policarbonato militar resistente a fragmentos y balines.
▪ Incluye: 3 micas intercambiables (polarizada, amarilla nocturna y transparente) con estuche rígido.
▪ Inversión Oficial: **Bs. 115.00**.`;
    quickActions = ['🛒 Añadir al Carrito', 'Ver Lentes', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('morral') || normalized.includes('pechera') || normalized.includes('bandolera')) {
    suggestedProductIds.push('prod-12');
    reply = `🎒 MORRAL TÁCTICO BANDOLERA CRUZADO MOLLE (PECHERA EDC)

▪ Porte Táctico: Ambidiestro con correa acolchada y desenganche rápido.
▪ Seguridad: Bolsillo posterior oculto para celular o arma corta.
▪ Inversión Oficial: **Bs. 130.00**.`;
    quickActions = ['🛒 Añadir al Carrito', 'Ver Morral', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('casco') || normalized.includes('fast')) {
    suggestedProductIds.push('prod-13');
    reply = `🪖 CASCO TÁCTICO FAST MILITAR CON RIELES ARC Y NVG

▪ Monturas: Rieles laterales ARC para linternas/cámaras y montura frontal para visor nocturno.
▪ Ajuste: Dial occipital ergonómico de nuca tipo BOA con almohadillas internas viscoelásticas.
▪ Inversión Oficial: **Bs. 250.00**.`;
    quickActions = ['🛒 Añadir al Carrito', 'Ver Casco', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  if (normalized.includes('portapistola') || normalized.includes('holster') || normalized.includes('funda')) {
    suggestedProductIds.push('prod-15');
    reply = `🔫 FUNDA TÁCTICA PORTAPISTOLA UNIVERSAL (HOLSTER)

▪ Retención Activa: Bloqueo de gatillo con desenfunde instantáneo por dedo índice (0.3s).
▪ Compatibilidad: Glock 17/19/22, Bersa Thunder, Taurus G2C/G3C, CZ, Beretta. Rotación 360°.
▪ Inversión Oficial: **Bs. 100.00**.`;
    quickActions = ['🛒 Añadir al Carrito', 'Ver Holster', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  // ================= 7. PAGOS, QR SIMPLE, 50/50, SEGURIDAD =================
  if (normalized.includes('pago') || normalized.includes('qr') || normalized.includes('transferencia') || normalized.includes('50') || normalized.includes('yape') || normalized.includes('estafa') || normalized.includes('confiable')) {
    reply = `💳 MODALIDADES DE PAGO SEGURAS EN BOLIVIA

En Tienda Táctica Cochabamba operamos con total transparencia y seguridad militar:

1. **Modalidad Dividida 50/50 (Cero Riesgo)**:
   ▪ Pagas solo el 50% de anticipo por QR Simple (Yape / BCP / cualquier banco boliviano).
   ▪ Con eso precintamos tu paquete en almacén con sello numerado y te mandamos foto de la guía.
   ▪ El 50% restante lo cancelas al recibir el producto en mano (en tu puerta o al recoger de la flota/trufi).

2. **Pago 100% por QR Simple**:
   ▪ Desbloquea automáticamente de obsequio un **Pack de Stickers Tácticos Exclusivos** dentro de tu paquete.

3. **Contra Entrega en Efectivo**:
   ▪ Válido para retiro en persona en nuestro almacén: Av. Heroínas #560 entre San Martín y 25 de Mayo (Lun-Sáb 09:00 a 19:00).`;
    quickActions = ['💳 Pagar 50/50 con QR', '🎁 Ver Regalo Stickers', '📍 Ubicación de la Tienda', '📱 WhatsApp'];
    return { reply, quickActions, suggestedProductIds };
  }

  // ================= 8. DIRECCIÓN, TIENDA FÍSICA, HORARIOS =================
  if (normalized.includes('donde') || normalized.includes('ubicacion') || normalized.includes('direccion') || normalized.includes('horario') || normalized.includes('tienda') || normalized.includes('almacen')) {
    reply = `📍 BASE CENTRAL HEROÍNAS #560 — COCHABAMBA

▪ Coordenadas: Av. Heroínas #560 entre San Martín y 25 de Mayo (Acera norte, zona céntrica comercial de Cochabamba).
▪ Horario de Operación: Lunes a Sábado de 09:00 a 19:00 en horario continuo.
▪ Recojo Presencial: Totalmente gratis (Bs. 0). Puedes ver, probar tallas y retirar tu equipamiento al instante.
▪ ¿No estás en el centro?: Te lo despachamos en 45 min por motorizado en Cercado, o por trufi/flota a provincias y el resto de Bolivia.`;
    quickActions = ['🚚 Coordinar Envío a Domicilio', '🛡️ Ver Productos', '📱 WhatsApp Ubicación'];
    return { reply, quickActions, suggestedProductIds };
  }

  // ================= 9. CATÁLOGO COMPLETO / QUÉ VENDEN =================
  if (normalized.includes('catalogo') || normalized.includes('que tienen') || normalized.includes('que hay') || normalized.includes('productos') || normalized.includes('menu') || normalized.includes('todo lo que')) {
    suggestedProductIds.push('prod-01', 'prod-02', 'prod-04', 'prod-07');
    reply = `📋 ARSENAL DISPONIBLE — TIENDA TÁCTICA COCHABAMBA

Operador, contamos con stock inmediato en almacén central:
▪ **Blindaje**: Plate Carrier Nivel IV (Bs. 340) y Casco FAST (Bs. 250).
▪ **Calzado**: Botas Desert Storm Vibram impermeables (Bs. 310, Tallas 39-44).
▪ **Óptica**: Mira Holográfica EOTech XPS3 (Bs. 380) y Lentes UV400 (Bs. 115).
▪ **Mochilas & Carga**: Mochila Asalto 45L (Bs. 220) y Pechera MOLLE (Bs. 130).
▪ **Indumentaria**: Pantalón Cargo Ripstop (Bs. 200) y Combat Shirt (Bs. 145).
▪ **Accesorios**: Guantes Carbono (Bs. 120), Cuchillo KA-BAR (Bs. 150), Radio Baofeng (Bs. 150), Reloj G-Shock 200M (Bs. 180), Holster Universal (Bs. 100).

Entregas inmediatas en Base Heroínas #560, delivery en Cercado, o envíos al Valle Alto (Cliza, Punata) y toda Bolivia.`;
    quickActions = ['🛡️ Ver Chalecos Nivel IV', '🥾 Ver Botas Vibram', '🚚 Envíos a Mi Zona', '💳 Pagar 50/50 QR'];
    return { reply, quickActions, suggestedProductIds };
  }

  // ================= 10. SMART DYNAMIC RESOLUTION (CONVERSATIONAL FALLBACK) =================
  // If the query is an open conversational question, respond adaptively without dumping the static list
  reply = `Afirmativo, operador. He recibido tu mensaje: "${query}".

Como asistente táctico de Tienda Táctica Cochabamba, puedo ayudarte inmediatamente con:
▪ **Rutas y Envíos**: Despachamos a Cercado (Bs. 15), Sacaba/Quillacollo/Tiquipaya (Bs. 25), Valle Alto como Cliza y Punata (Bs. 20-30), Chapare y toda Bolivia (Bs. 35).
▪ **Asesoría de Equipamiento**: Chalecos balísticos Nivel IV, botas tácticas Vibram, ópticas, mochilas 45L y vestimenta de combate.
▪ **Modalidad de Pago 50/50**: Solo pagas el 50% de anticipo por QR para precintar el paquete y el saldo al tenerlo en tus manos.

¿Sobre qué equipo, zona de envío o requerimiento específico deseas coordinar hoy?`;

  quickActions = [
    '🚚 Envíos a Provincias (Cliza, etc.)',
    '🛡️ Chaleco Nivel IV (Bs. 340)',
    '🥾 Botas Vibram (Bs. 310)',
    '📱 WhatsApp Directo',
  ];

  return { reply, quickActions, suggestedProductIds };
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { messages, userQuery, userContext, inventory } = body;
    const rawQuery = (userQuery || (messages && messages[messages.length - 1]?.content) || '').trim();
    const normalized = normalizeQuery(rawQuery);
    const geminiKey = getEnv('GEMINI_API_KEY');

    let reply = '';
    let quickActions: string[] = [];
    let suggestedProductIds: string[] = [];
    let isTracking = false;

    // Detect tracking queries
    const orderMatch = rawQuery.match(/ord-[a-z0-9]+/i);
    if (orderMatch || normalized.includes('rastrear') || normalized.includes('mi orden') || normalized.includes('donde esta mi pedido')) {
      isTracking = true;
      const orderCode = orderMatch ? orderMatch[0].toUpperCase() : 'ORD-LOCAL';

      // Try to find the order in user context
      let orderDetail = '';
      if (userContext?.orders && Array.isArray(userContext.orders)) {
        const found = userContext.orders.find((o: any) => o.id?.toUpperCase() === orderCode);
        if (found) {
          const statusMap: Record<string, string> = {
            pending: '⏳ Pendiente de pago',
            paid: '✅ Pagado — En espera de preparación',
            preparing: '📦 En preparación en almacén',
            ready: '🟢 Preparado y listo para despacho',
            assigned: '🛵 Repartidor asignado',
            picked_up: '📬 Recogido por motorizado',
            in_transit: '🚀 EN CAMINO a tu ubicación',
            delivered: '✅ ENTREGADO con éxito',
            cancelled: '❌ Cancelado',
          };
          orderDetail = `\nEstado: ${statusMap[found.status] || found.status}\nTotal: Bs. ${found.total}\nModalidad: ${found.payment_mode}`;
        }
      }

      reply = `📡 TELEMETRÍA DE SEGUIMIENTO EN VIVO — ${orderCode}
${orderDetail || '\nEstado Actual: 🟢 PREPARADO Y PRECINTADO\nUbicación: Centro Logístico Cochabamba (Base Heroínas #560).\nAsignación: Unidad motorizada lista para despacho con precinto de seguridad.'}

Para coordinar entrega inmediata a tu domicilio o número de guía de flota/trufi, contacta a la central de despacho.`;
      quickActions = ['Ver en Mis Órdenes', 'Hablar por WhatsApp', 'Ver Catálogo'];

      return NextResponse.json({
        reply,
        quickActions,
        suggestedProductIds: [],
        source: 'order_telemetry',
      });
    }

    // Build dynamic context
    let dynamicContext = '';
    if (userContext) {
      dynamicContext += `\n\nUSUARIO ACTUAL EN SESIÓN:\n- Nombre: ${userContext.name}\n- Correo: ${userContext.email}\n- Rol: ${userContext.role}\n- Total de pedidos: ${userContext.totalOrders}`;
      if (userContext.orders && userContext.orders.length > 0) {
        dynamicContext += '\n- Sus pedidos recientes:';
        for (const o of userContext.orders.slice(0, 5)) {
          dynamicContext += `\n  • ${o.id} — Estado: ${o.status} — Total: Bs. ${o.total} — Fecha: ${o.date}`;
        }
      }
    }
    if (inventory && Array.isArray(inventory) && inventory.length > 0) {
      dynamicContext += '\n\nINVENTARIO REAL EN VIVO:';
      for (const p of inventory) {
        dynamicContext += `\n- ${p.name} (ID: ${p.id}) — Bs. ${p.price} — Stock: ${p.stock} unidades`;
      }
    }

    // Attempt AI processing if Gemini API key exists
    let geminiSucceeded = false;
    if (geminiKey && geminiKey.trim().length > 15) {
      try {
        const aiResponse = await callGeminiAI(geminiKey, rawQuery, messages, dynamicContext);
        if (aiResponse && aiResponse.trim().length > 0) {
          reply = aiResponse;
          geminiSucceeded = true;
        }
      } catch (geminiError) {
        console.warn('Gemini AI call failed, engaging Tactical Intelligence Engine 2.0:', geminiError);
      }
    }

    // If Gemini was not used or failed, run Tactical Intelligence Engine 2.0
    if (!reply) {
      const localResult = runTacticalIntelligenceEngine(rawQuery, normalized);
      reply = localResult.reply;
      quickActions = localResult.quickActions;
      suggestedProductIds = localResult.suggestedProductIds;
    } else {
      // Determine suggested product IDs and contextual quick actions based on AI reply content
      const lowerReply = `${normalized} ${reply.toLowerCase()}`;
      if (lowerReply.includes('chaleco') || lowerReply.includes('plate') || lowerReply.includes('balist')) {
        if (!suggestedProductIds.includes('prod-01')) suggestedProductIds.push('prod-01');
      }
      if (lowerReply.includes('bota') || lowerReply.includes('vibram')) {
        if (!suggestedProductIds.includes('prod-02')) suggestedProductIds.push('prod-02');
      }
      if (lowerReply.includes('mira') || lowerReply.includes('eotech') || lowerReply.includes('optica')) {
        if (!suggestedProductIds.includes('prod-03')) suggestedProductIds.push('prod-03');
      }
      if (lowerReply.includes('mochila') || lowerReply.includes('assault')) {
        if (!suggestedProductIds.includes('prod-04')) suggestedProductIds.push('prod-04');
      }
      if (lowerReply.includes('cliza') || lowerReply.includes('valle alto') || lowerReply.includes('punata')) {
        quickActions = ['🚚 Coordinar Envío a Valle Alto', '🛡️ Ver Chalecos Nivel IV', '💳 Pago 50/50 con QR', '📱 WhatsApp Despacho'];
      } else if (lowerReply.includes('envio') || lowerReply.includes('delivery')) {
        quickActions = ['🚚 Envíos Valle Alto / Cliza', '🛵 Delivery Cercado (Bs. 15)', '🇧🇴 Toda Bolivia (Bs. 35)', '📱 WhatsApp'];
      } else if (lowerReply.includes('pago') || lowerReply.includes('qr')) {
        quickActions = ['💳 Pagar 50/50 QR', '🎁 Ver Regalo Stickers', '🛒 Ir al Carrito', '📱 WhatsApp'];
      } else {
        quickActions = ['🛡️ Ver Chalecos', '🥾 Ver Botas', '🚚 Consultar Envíos', '📱 Hablar por WhatsApp'];
      }
    }

    return NextResponse.json({
      reply,
      quickActions: quickActions.length > 0 ? quickActions : ['Ver Catálogo', 'Consultar Envíos', 'Hablar por WhatsApp'],
      suggestedProductIds,
      source: geminiSucceeded ? 'gemini_ai_grounded' : 'tactical_intelligence_2.0',
    });
  } catch (error: any) {
    console.error('Error in tactical chat API:', error);
    return NextResponse.json({
      reply:
        'Afirmativo, operador. En Tienda Táctica Cochabamba estamos operativos en Base Heroínas #560. ¿Deseas cotizar envíos (Cercado, Cliza, Valle Alto, Toda Bolivia) o consultar equipamiento balístico?',
      quickActions: ['🚚 Envíos a Provincias', '🛡️ Chalecos Balísticos', '💳 Pago 50/50 QR', '📱 WhatsApp Despacho'],
      suggestedProductIds: ['prod-01', 'prod-02'],
      source: 'safe_fallback',
    });
  }
}
