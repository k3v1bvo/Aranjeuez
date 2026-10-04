import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { ApiError, body, db, rateLimit, string, session } from './server';
import { catalog } from './api';
import { dateTime, User, Order, Store, Product } from './model';

export async function askJarvis(req: NextRequest) {
  rateLimit('jarvis:' + (req.headers.get('x-forwarded-for') || 'local'), 30);
  const data = await body(req);

  if (!Array.isArray(data.messages) || data.messages.length < 1 || data.messages.length > 25)
    throw new ApiError(400, 'Envía entre 1 y 25 mensajes.');

  const messages = data.messages.map((m: unknown) => {
    if (!m || typeof m !== 'object') throw new ApiError(400, 'Mensaje inválido.');
    const value = m as Record<string, unknown>;
    if (!['user', 'assistant'].includes(String(value.role)))
      throw new ApiError(400, 'Rol de mensaje inválido.');
    return {
      role: value.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: string(value.content, 'Mensaje', 1, 2500) }],
    };
  });

  if (messages.at(-1)?.role !== 'user')
    throw new ApiError(400, 'La conversación debe terminar con tu pregunta.');

  // Obtener sesión del usuario actual (si está logueado con cookie segura)
  const token = req.cookies.get('paseo_token')?.value;
  let currentUser: User | null = null;
  let userOrders: Order[] = [];
  try {
    currentUser = await session(token);
    if (currentUser) {
      const client = db();
      const { data: orders } = await client
        .from('paseo_orders')
        .select(
          'id,pickup_code,status,total,created_at,store:paseo_stores(id,name,floor,sector,local_num,schedule),items:paseo_order_items(product_name,quantity,unit_price)',
        )
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      userOrders = (orders || []) as unknown as Order[];
    }
  } catch (err) {
    console.error('Error fetching user context for Jarvis:', err);
  }

  const knowledge = await catalog();
  const query = messages
    .at(-1)!
    .parts[0].text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const words = query.split(/\W+/).filter((w) => w.length > 3);
  const ranked = knowledge.products
    .filter((p) => p.stock > 0)
    .map((p) => {
      const haystack = `${p.name} ${p.description} ${p.category}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return { p, score: words.filter((w) => haystack.includes(w)).length };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map(({ p }) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      store: p.store?.name,
      store_id: p.store?.id,
      location: `${p.store?.floor || ''}, ${p.store?.sector || ''}, ${p.store?.local_num || ''}`,
    }));

  const rewards = await db()
    .from('paseo_rewards')
    .select('id,name,description,points_cost')
    .eq('is_active', true)
    .neq('stock', 0)
    .order('points_cost', { ascending: true })
    .limit(20);

  // Perfil del usuario para que Jarvis lo atienda como asistente de compras y fidelidad
  const pts = currentUser?.points || 0;
  const nivelVip = pts >= 1000 ? 'Platino' : pts >= 500 ? 'Oro' : pts >= 200 ? 'Plata' : 'Bronce';
  const ptsParaSiguiente =
    pts < 200 ? 200 - pts : pts < 500 ? 500 - pts : pts < 1000 ? 1000 - pts : 0;
  const proxNivel = pts < 200 ? 'Plata' : pts < 500 ? 'Oro' : pts < 1000 ? 'Platino' : 'Máximo';

  const userContext = currentUser
    ? {
        autenticado: true,
        nombre: currentUser.name,
        correo: currentUser.email,
        puntos_actuales: pts,
        nivel_vip: nivelVip,
        puntos_para_siguiente_nivel:
          ptsParaSiguiente > 0
            ? `${ptsParaSiguiente} pts para nivel ${proxNivel}`
            : '¡Nivel VIP Platino alcanzado!',
        pedidos_recientes: userOrders.map((o) => ({
          codigo_retiro: o.pickup_code,
          tienda: o.store?.name,
          tienda_id: o.store?.id,
          ubicacion: `${o.store?.floor || ''} - ${o.store?.local_num || ''}`,
          estado: o.status,
          total_bs: o.total,
          fecha: o.created_at,
          items: (o.items || []).map((i) => `${i.product_name} (x${i.quantity})`),
        })),
      }
    : {
        autenticado: false,
        mensaje:
          'El usuario navega como visitante no autenticado. Puede consultar tiendas, pisos, restaurantes, estacionamiento y promociones. Si pregunta por sus compras personales, pedidos o saldo de puntos, invítalo amablemente a iniciar sesión en /auth/login para acceder a su perfil.',
      };

  const context = {
    fecha_actual: new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
    centro_comercial: 'Paseo Aranjuez (Cochabamba, Bolivia)',
    direccion: 'Avenida América E-0834, Queru Queru, Cochabamba',
    horarios: {
      locales_comerciales: 'Lunes a Domingo 10:00 - 21:00',
      mercado_gastronomico_piso_3: 'Lunes a Domingo 11:30 - 23:00',
      terrazas_el_cuarto_piso_4:
        'Lunes a Miércoles 16:00 - 00:00, Jueves a Sábado 16:00 - 02:00, Domingo 12:00 - 23:00',
      estacionamiento_subterraneo:
        'Abierto 24/7 (200+ plazas monitoreadas, tarifa preferencial por compras)',
      cajeros_y_farmacia:
        'Farmacorp en PB abierto horario extendido, cajeros automáticos 24h en ingreso América',
      wifi_gratuito: 'Red PaseoAranjuez_Gratis en todo el complejo sin contraseña',
    },
    guia_por_pisos: {
      planta_baja:
        'Tecnología (Samsung Store LYNX Local L9 entrada principal, Apple Land gadgets y accesorios iPhone, Facephone fundas y cargadores), Moda Urbana y Casual (Burbank Local #104 moda boliviana urbana, Gap indumentaria americana, Puma calzado deportivo oficial, BOLD Shoes & Accessories calzado formal y carteras, Marroquinería Amore / Carrasco Collection artículos de puro cuero), Salud y Belleza (Farmacorp + Amarket farmacia y micromercado, Ópticas Pauker boutique visual, Perfumería Cosbelle perfumes de diseñador), Cafetería (Cinnabon rollos de canela calientes y café), Cultura (La Galería muro central de arte y ferias de fin de semana).',
      piso_1:
        "Moda Femenina y Juvenil (Pinkie Local #103 moda juvenil, Lili Pink ropa íntima y autocuidado, Eye Lencería corsetería fina), Sastrería y Moda Masculina (Manhattan Local #114 camisas y trajes ejecutivos, Hermassi sastrería a medida y corbatas de alta gama), Megatienda Europea (EuroStyle con Springfield, Women'secret y Cortefiel), Accesorios (Ohanna Accesorios Local BELU lado ascensor sud joyas de acero), Denim (Kosi Jeans prendas y pantalones de mezclilla), Outdoor y Térmico (Sajama Store equipo de montaña y mochilas camping, Textilón medias y pijamas familiares), Belleza (Blush Beauty Station estación de maquillaje y skincare).",
      piso_2:
        'Accesorios y Viajes (Totto Local #203 mochilas escolares, universitarias y maletas), Abrigo y Moda (Top Collection Local #212 chamarras pesadas y abrigos), Calzado y Deporte (Gool Store zapatillas running y fútbol, Cat Lifestyle Bolivia botas de cuero y outdoor, Fair Play Kids ropa deportiva y tenis para niños), Hogar y Decoración (Hauscenter / Home Select vajillas finas y diseño para sala).',
      piso_3:
        'Mercado Gastronómico / Plaza de Comidas: DeliStanbul (shawarmas gigantes y comida turca), La Sanguchería Sede Patio (hamburguesas y sándwiches rápidos), El Guajojo (rellenos tradicionales de papa con pollo, res o mondongo), Hoy Hay (combos de hamburguesas con papas fritas), Chipotle / By Pass (alitas y snacks rápidos). Entretenimiento: Sky Games área techada con simuladores de carreras, mesas de hockey y tickets. Coworking: Cowork Estudiantil Aranjuez con mesas amplias, enchufes libres y wifi gratuito para estudiar o trabajar.',
      piso_4:
        'Terrazas Gourmet El Cuarto: terraza panorámica con 8 barras de cocina de autor, coctelería y vista a la cordillera. Restaurantes: Patanegra Taberna Española (tapas, jamón ibérico, paellas y cañas), Brocheta King (anticuchos al carbón, chorizos parrilleros y carnes), La Sanguchería Gourmet (hamburguesas artesanales en pan masa madre), Botánica Infusiones & Café (café de especialidad, tés finos calientes/helados y tortas saludables). Entretenimiento: Sky Games atracciones mecánicas infantiles.',
      torres_corporativas:
        'Pisos 5 al 11 (Torres A y B con ascensores inteligentes): Consultorios médicos y odontología especializada, despachos jurídicos y notaría corporativa, sedes centrales de agencias de marketing y empresas multinacionales.',
    },
    usuario: userContext,
    stores: knowledge.stores.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      floor: s.floor,
      sector: s.sector,
      local: s.local_num,
      reference: s.reference,
      schedule: s.schedule,
    })),
    products: ranked,
    promotions: knowledge.promotions.map((p) => ({
      title: p.title,
      description: p.description,
      start_date: p.start_date,
      end_date: p.end_date,
      store: p.store?.name,
    })),
    events: knowledge.events.map((e) => ({
      title: e.title,
      description: e.description,
      starts_at: dateTime(e.starts_at),
      ends_at: dateTime(e.ends_at),
      location: e.location,
    })),
    rewards: rewards.data || [],
  };

  const prompt = `Eres Jarvis, el concierge digital oficial e inteligente de Paseo Aranjuez en Cochabamba, Bolivia.
Tu misión es brindar atención VIP personalizada, rápida, empática y de máxima utilidad a los visitantes y compradores del mall.

CAPACIDADES Y CONOCIMIENTO:
1. INFORMACIÓN DE LA CUENTA DEL USUARIO:
   - Si el usuario está autenticado, salúdalo por su nombre (${currentUser?.name || ''}).
   - Si pregunta por sus compras, pedidos pendientes o dónde retirar: revisa su historial en 'usuario.pedidos_recientes'. Dale el nombre exacto de la tienda, el piso y local donde debe ir, el código de retiro (por ejemplo 'RET-8492') y su estado actual (si está listo para recoger o en preparación). Indícale que también puede mostrar su código QR desde la sección Mis Pedidos.
   - Si pregunta por sus puntos o fidelidad: indícale su saldo exacto (${pts} Paseo Points), su nivel VIP actual (${nivelVip}), cuántos puntos le faltan para el próximo nivel, y menciónale opciones concretas de recompensas activas que puede canjear según la lista de 'rewards'.
2. DIRECTORIO DE LAS 47 TIENDAS Y PISOS:
   - Conoces la ubicación exacta de cada local según la 'guia_por_pisos' y la lista de 'stores'.
   - Si buscan tecnología: recomienda Samsung Store oficial en Planta Baja (L09), Apple Land (PB-12) o Facephone (PB-10).
   - Si buscan comer o almorzar rápido: recomienda la Plaza de Comidas en Piso 3 (DeliStanbul, La Sanguchería, El Guajojo, Brocheta King).
   - Si buscan cena romántica, cócteles o reunión especial: recomienda las Terrazas Gourmet El Cuarto en Piso 4 (Patanegra para tapas, Botánica para coctelería con vista al Tunari).
   - Si buscan café o postre: Cinnabon en Planta Baja (PB-09).
   - Si buscan diversión familiar o con niños: Sky Games en Piso 3 y Piso 4, o Prime Cinemas.
3. SERVICIOS DEL MALL:
   - Estacionamiento subterráneo (más de 200 espacios, sensor de disponibilidad, acceso por Av. América).
   - WiFi gratis ('PaseoAranjuez_Gratis').
   - Farmacorp en PB y cajeros automáticos 24h en ingreso peatonal.
4. COMPRA Y CLICK & COLLECT (PASEO YA):
   - Explica que pueden comprar en línea en las tiendas del mall y retirar sin hacer filas con su código de recogida.
5. REGLAS DE SEGURIDAD Y FORMATO:
   - Responde siempre en español fluido, educado, elegante y conciso (máximo 220 palabras).
   - Estricto modo informativo/read-only: NO ejecutes modificaciones en la base de datos desde el chat. Si alguien pide cancelar un pedido o cambiar contraseña, oriéntalo a hacerlo desde su panel de ajustes o en caja.
   - Nunca reveles contraseñas, tokens de sesión ni datos de otros clientes.
   - Devuelve OBLIGATORIAMENTE un JSON con esta estructura exacta:
   {
     "reply": "Texto de la respuesta para el usuario con formato Markdown limpio (**negrita**, viñetas)",
     "productIds": ["id1", "id2"],
     "storeIds": ["id1", "id2"]
   }

DATOS EN TIEMPO REAL: ${JSON.stringify(context)}`;

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const requestBody = {
        systemInstruction: { parts: [{ text: prompt }] },
        contents: messages,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              reply: { type: 'STRING' },
              productIds: { type: 'ARRAY', items: { type: 'STRING' }, maxItems: 3 },
              storeIds: { type: 'ARRAY', items: { type: 'STRING' }, maxItems: 3 },
            },
            required: ['reply', 'productIds', 'storeIds'],
          },
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: AbortSignal.timeout(18000),
          body: JSON.stringify(requestBody),
        },
      );

      if (response.ok) {
        const result = await response.json();
        const raw = result.candidates?.[0]?.content?.parts
          ?.filter((p: { thought?: boolean }) => !p.thought)
          ?.map((p: { text?: string }) => p.text || '')
          .join('');

        if (raw) {
          const parsed = JSON.parse(raw);
          const products = knowledge.products
            .filter((p) => Array.isArray(parsed.productIds) && parsed.productIds.includes(p.id))
            .slice(0, 3);
          const stores = knowledge.stores
            .filter((s) => Array.isArray(parsed.storeIds) && parsed.storeIds.includes(s.id))
            .slice(0, 3);

          return NextResponse.json({
            reply: parsed.reply,
            products,
            stores,
            source: 'gemini',
            model,
          });
        }
      } else {
        console.warn('[Jarvis Gemini API warning]', response.status);
      }
    } catch (apiErr) {
      console.error('[Jarvis Gemini error, fallback to expert concierge]', apiErr);
    }
  }

  // Motor Experto Resiliente de Asistente si la API de IA externa tiene timeout o no está disponible
  let reply = '';
  let matchedStores: Store[] = [];
  const matchedProducts: Product[] = [];

  const lowerQuery = query;

  if (
    lowerQuery.includes('pedido') ||
    lowerQuery.includes('orden') ||
    lowerQuery.includes('codigo') ||
    lowerQuery.includes('retiro') ||
    lowerQuery.includes('compr')
  ) {
    if (currentUser && userOrders.length > 0) {
      const latest = userOrders[0];
      const itemsStr = (latest.items || [])
        .map((it) => `${it.product_name} (x${it.quantity})`)
        .join(', ');
      reply =
        `¡Hola ${currentUser.name}! Tienes un pedido registrado en **${latest.store?.name || 'la tienda'}** por un total de **Bs. ${latest.total}**.\n\n📍 **Ubicación de retiro:** ${latest.store?.floor || 'Piso asignado'} (${latest.store?.local_num || ''}).\n🔑 **Código de recogida:** ${latest.pickup_code}\n📋 **Estado:** ${latest.status === 'listo_para_recoger' ? '✅ ¡Listo para retirar en el local!' : '⏳ En preparación en la tienda.'}` +
        (itemsStr ? `\n🛍️ **Artículos:** ${itemsStr}` : '') +
        `\n\nPuedes mostrar este código o tu credencial QR en caja para recoger sin demoras.`;
      matchedStores = latest.store ? [latest.store] : [];
    } else if (currentUser) {
      reply = `Hola ${currentUser.name}, actualmente no tienes pedidos activos pendientes de retiro en Paseo Aranjuez. Puedes explorar el catálogo de PaseoYa para comprar y retirar con Click & Collect.`;
    } else {
      reply = `Para consultar tus pedidos activos, códigos de retiro y compras recientes, por favor inicia sesión con tu cuenta de cliente en Paseo Aranjuez.`;
    }
  } else if (
    lowerQuery.includes('punto') ||
    lowerQuery.includes('puntos') ||
    lowerQuery.includes('nivel') ||
    lowerQuery.includes('vip') ||
    lowerQuery.includes('canj')
  ) {
    if (currentUser) {
      const currentPts = currentUser.points || 0;
      const nivel =
        currentPts >= 1000
          ? 'Platino'
          : currentPts >= 500
            ? 'Oro'
            : currentPts >= 200
              ? 'Plata'
              : 'Bronce';
      const meta =
        currentPts < 200
          ? 200 - currentPts
          : currentPts < 500
            ? 500 - currentPts
            : currentPts < 1000
              ? 1000 - currentPts
              : 0;
      const siguienteNivel =
        currentPts < 200
          ? 'Plata'
          : currentPts < 500
            ? 'Oro'
            : currentPts < 1000
              ? 'Platino'
              : 'VIP Máximo';

      reply =
        `¡Hola ${currentUser.name}! Tienes un saldo actual de **${currentPts} Paseo Points** (Nivel **${nivel}**).` +
        (meta > 0
          ? `\nTe faltan solo **${meta} puntos** para subir al nivel **${siguienteNivel}** y desbloquear mayores beneficios.`
          : '\n¡Felicidades, tienes el máximo nivel VIP!') +
        `\n\n💡 **¿Cómo sumar más puntos?** Cada Bs. 1 gastado en PaseoYa te suma 1 punto. Puedes canjearlos por rollitos en Cinnabon, combos de cine o descuentos en las Terrazas El Cuarto.`;
    } else {
      reply = `En el programa de fidelidad de Paseo Aranjuez ganas 1 punto por cada Bs. 1 de consumo. Accedes a niveles Bronce, Plata, Oro y Platino con beneficios exclusivos en tiendas y terrazas. ¡Inicia sesión para ver tu puntaje acumulado!`;
    }
  } else if (
    lowerQuery.includes('cuarto') ||
    lowerQuery.includes('terraza') ||
    lowerQuery.includes('cena') ||
    lowerQuery.includes('bar') ||
    lowerQuery.includes('trago') ||
    lowerQuery.includes('vino')
  ) {
    reply = `**El Cuarto** está ubicado en el **Piso 4 (Terraza Gourmet)** de Paseo Aranjuez. Es un espacio de alta cocina y mixología con una vista panorámica impresionante a la Cordillera del Tunari.\n\nTe recomiendo:\n- **Patanegra (Local 402):** Especialistas en tapas españolas, jamón serrano y tablas ibéricas.\n- **Botánica Infusiones (Local 405):** Coctelería botánica y de autor para el atardecer.\nHorario: Miércoles a Sábados hasta las 02:00.`;
    matchedStores = knowledge.stores
      .filter(
        (s) =>
          s.floor?.toLowerCase().includes('4') ||
          s.name.toLowerCase().includes('cuarto') ||
          s.name.toLowerCase().includes('patanegra'),
      )
      .slice(0, 3);
  } else if (
    lowerQuery.includes('comer') ||
    lowerQuery.includes('comida') ||
    lowerQuery.includes('almuer') ||
    lowerQuery.includes('hambre') ||
    lowerQuery.includes('restaurante')
  ) {
    reply = `Para comer en Paseo Aranjuez tienes opciones fantásticas según tu plan:\n\n1. **Piso 3 (Plaza de Comidas / Mercado Gastronómico):**\n   - **DeliStanbul (Local 301):** Shawarma gigante y cocina turca.\n   - **La Sanguchería (Local 302):** Hamburguesas artesanales de primer nivel.\n   - **El Guajojo (Local 303):** Sabores tradicionales bolivianos (silpancho, pique).\n   - **Brocheta King (Local 304):** Brochetas y anticuchos a la brasa.\n2. **Piso 4 (Terrazas El Cuarto):** Para cenas especiales y cócteles.\n3. **Planta Baja:** Rolls de canela y café en **Cinnabon (PB-09)**.`;
    matchedStores = knowledge.stores.filter((s) => s.category === 'gastronomia').slice(0, 3);
  } else if (
    lowerQuery.includes('tecnolog') ||
    lowerQuery.includes('samsung') ||
    lowerQuery.includes('celular') ||
    lowerQuery.includes('iphone') ||
    lowerQuery.includes('apple') ||
    lowerQuery.includes('cargador')
  ) {
    reply = `En tecnología y telefonía encuentras todo en **Planta Baja**:\n- **Samsung Store oficial (LYNX) (Local L9):** Equipos Galaxy S, Z Fold/Flip, tablets y asesoría técnica oficial.\n- **Apple Land (Local PB-12):** Accesorios para iPhone, fundas MagSafe y cargadores certificados.\n- **Facephone (Local PB-10):** Protectores cerámicos, soportes y cables de carga rápida.\n- **Burbank (Local 104):** Estilo moderno y tecnología lifestyle.`;
    matchedStores = knowledge.stores.filter((s) => s.category === 'tecnologia').slice(0, 3);
  } else if (
    lowerQuery.includes('parqueo') ||
    lowerQuery.includes('estacion') ||
    lowerQuery.includes('auto') ||
    lowerQuery.includes('cochera')
  ) {
    reply = `Paseo Aranjuez cuenta con un **Estacionamiento Subterráneo Inteligente** con más de 200 plazas vigiladas.\n\n🚗 **Ingreso:** Por Avenida América y Calle Pantaleón Dalence.\n💡 **Sensores:** Luces LED verdes y rojas que te indican lugares libres en tiempo real.\n🎟️ **Beneficio:** Primera hora gratis presentando compras mayores a Bs. 50 en tiendas o restaurantes.`;
  } else if (
    lowerQuery.includes('horario') ||
    lowerQuery.includes('abierto') ||
    lowerQuery.includes('cierra') ||
    lowerQuery.includes('hora')
  ) {
    reply = `Los horarios de atención en Paseo Aranjuez son:\n- **Locales comerciales y tiendas:** Lunes a Domingo de 10:00 a 21:00.\n- **Mercado Gastronómico (Piso 3):** Lunes a Domingo de 11:30 a 23:00.\n- **Terrazas Gourmet El Cuarto (Piso 4):** Miércoles a Sábados de 16:00 a 02:00.\n- **Farmacorp y Cajeros (PB):** Acceso permanente en ingreso de Av. América.`;
  } else if (
    lowerQuery.includes('juego') ||
    lowerQuery.includes('niño') ||
    lowerQuery.includes('cine') ||
    lowerQuery.includes('pelicula') ||
    lowerQuery.includes('sky game')
  ) {
    reply = `¡Para entretenimiento tienes:\n- **Sky Games:** Simuladores arcade, pistas de air hockey y juegos infantiles en **Piso 3 (Local 306)** y atracciones mecánicas en **Piso 4**.\n- **Prime Cinemas:** Salas de cine modernas en Niveles 3 y 4 con dulcería y sonido Dolby Atmos.\n- **Fair Play Kids (Local 218):** Moda deportiva para los pequeños de la casa.`;
    matchedStores = knowledge.stores.filter((s) => s.category === 'entretenimiento').slice(0, 3);
  } else {
    reply = `¡Hola! Soy Jarvis, tu asistente virtual inteligente en Paseo Aranjuez.\n\nEstoy aquí para ayudarte en todo:\n- 📍 **Ubicar cualquiera de las 47 tiendas** y decirte su piso y número de local.\n- 📦 **Consultar tus pedidos activos** y entregarte tu código de retiro.\n- ⭐ **Revisar tu saldo de puntos** y beneficios de fidelidad.\n- 🍽️ **Recomendarte dónde comer** en la Plaza de Comidas (Piso 3) o Terrazas El Cuarto (Piso 4).\n- 🚗 **Horarios, estacionamiento y servicios del mall.**\n\n¿En qué te puedo colaborar hoy?`;
    matchedStores = knowledge.stores.slice(0, 3);
  }

  return NextResponse.json({
    reply,
    products: matchedProducts,
    stores: matchedStores,
    source: 'concierge',
    model: 'paseo-concierge',
  });
}
