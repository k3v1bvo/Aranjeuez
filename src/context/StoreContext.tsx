'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type {
  Category,
  Product,
  SystemAlert,
  Order,
  ShippingZone,
  DriverEarning,
  OrderStatus,
  DeliveryType,
  PaymentMode,
  CashSettlement,
  CashSettlementMethod,
  FixedAmountQR,
  PaymentGatewaySettings,
} from '@/lib/types';
import {
  demoCategories,
  demoProducts,
  demoAlerts,
  demoOrders,
  demoShippingZones,
  demoDriverEarnings,
  demoVendor,
  defaultStoreSettings,
  defaultPaymentGatewaySettings,
  demoFixedAmountQRs,
} from '@/lib/demo-data';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface StoreSettings {
  storeName: string;
  currency: string;
  currencySymbol: string;
  pickupAddress: string;
  pickupSchedule: string;
  pickupInstructions: string;
  freeGiftName: string;
  freeGiftValue: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string; // WhatsApp
  customer_email?: string;
  customer_address?: string;
  delivery_notes?: string;
  delivery_type: DeliveryType; // 'pickup' | 'delivery' | 'national_shipping'
  shipping_zone_id?: string;
  pickup_time?: string;
  destination_department?: string;
  payment_mode: PaymentMode; // 'full_payment' | 'partial_payment' | 'cash_on_delivery'
  payment_method: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
  subtotal: number;
}

interface StoreContextType {
  categories: Category[];
  products: Product[];
  alerts: SystemAlert[];
  orders: Order[];
  shippingZones: ShippingZone[];
  driverEarnings: DriverEarning[];
  isDriverAvailable: boolean;
  storeSettings: StoreSettings;
  cashSettlements: CashSettlement[];
  paymentGatewaySettings: PaymentGatewaySettings;

  // Store Settings (Admin)
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;
  updatePaymentGatewaySettings: (settings: Partial<PaymentGatewaySettings>) => void;

  // Category CRUD
  addCategory: (cat: { name: string; description?: string }) => Category;
  updateCategory: (id: string, cat: { name?: string; description?: string }) => void;
  deleteCategory: (id: string) => boolean;

  // Product CRUD
  addProduct: (prod: {
    name: string;
    description: string;
    price: number;
    cost_price?: number;
    stock: number;
    low_stock_threshold: number;
    category_id: string;
    image?: string;
    images?: string[];
  }) => Product;
  updateProduct: (
    id: string,
    prod: Partial<{
      name: string;
      description: string;
      price: number;
      cost_price: number;
      stock: number;
      low_stock_threshold: number;
      category_id: string;
      image: string;
      images: string[];
      is_active: boolean;
    }>
  ) => void;
  deleteProduct: (id: string) => void;
  updateStock: (id: string, newStock: number) => void;

  // Shipping Zones CRUD (Admin)
  addShippingZone: (zone: {
    name: string;
    department?: string;
    city?: string;
    shipping_cost: number;
    driver_commission: number;
    estimated_hours: number;
  }) => ShippingZone;
  updateShippingZone: (id: string, data: Partial<ShippingZone>) => void;
  deleteShippingZone: (id: string) => boolean;
  resetShippingZonesToDefaults: () => void;

  // Order Lifecycle & Logistics
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  adminSetOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => void;
  adminAssignDriver: (orderId: string, driverId: string) => void;
  driverAcceptOrder: (orderId: string, driverId?: string) => boolean;
  driverPickupOrder: (orderId: string) => void;
  driverInTransit: (orderId: string) => void;
  driverDeliverOrder: (orderId: string) => void;
  rateDriver: (orderId: string, rating: number, review: string) => void;
  cancelOrder: (orderId: string, reason?: string) => boolean;

  // Driver & Earnings
  toggleDriverAvailability: () => void;
  settleDriverEarnings: (earningId: string) => void;

  // Cash Settlement (driver returns collected cash)
  getDriverCashOwed: (driverId: string) => number;
  submitCashSettlement: (driverId: string, driverName: string, amount: number, method: CashSettlementMethod, orderIds: string[], proofUrl?: string, notes?: string) => void;
  reviewCashSettlement: (settlementId: string, approved: boolean, reviewerName?: string) => void;

  // Matriz de QRs Estáticos (ImgBB & Supabase)
  fixedAmountQRs: FixedAmountQR[];
  addFixedAmountQR: (qr: Omit<FixedAmountQR, 'id' | 'created_at'>) => Promise<FixedAmountQR>;
  updateFixedAmountQR: (id: string, data: Partial<FixedAmountQR>) => Promise<void>;
  deleteFixedAmountQR: (id: string) => Promise<boolean>;
  toggleFixedAmountQRStatus: (id: string) => Promise<void>;
  getQRForAmount: (amount: number) => { qr: FixedAmountQR | null; isExactMatch: boolean; isDefault: boolean };

  // Alerts & Maintenance
  resolveAlert: (id: string) => void;
  resetToDefaults: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function mapSupabaseOrder(o: any, items: any[] = []): Order {
  return {
    id: o.id,
    user_id: o.customer_id || 'anon',
    vendor_id: o.vendor_id || null,
    driver_id: o.driver_id || null,
    shipping_zone_id: o.shipping_zone_id || null,
    shipping_cost: parseFloat(o.shipping_cost) || 0,
    driver_commission: parseFloat(o.driver_commission) || 0,
    status: o.status || 'pending',
    total: parseFloat(o.total) || 0,
    paid_amount: parseFloat(o.paid_amount) || 0,
    pending_amount: parseFloat(o.pending_amount) || 0,
    payment_method: o.payment_method || 'qr_simple',
    payment_mode: o.payment_mode || 'full_payment',
    delivery_type: o.delivery_type || 'delivery',
    free_gift: o.free_gift || null,
    pickup_time: o.pickup_time || null,
    pickup_location: o.pickup_location || null,
    destination_department: o.destination_department || null,
    qr_code_data: o.qr_code_data || null,
    created_at: o.created_at || new Date().toISOString(),
    paid_at: o.paid_at || null,
    delivered_at: o.delivered_at || null,
    cancelled_at: o.cancelled_at || null,
    cancellation_reason: o.cancellation_reason || null,
    internal_notes: o.internal_notes || null,
    customer_name: o.customer_name || 'Cliente Táctico',
    customer_phone: o.customer_phone || '',
    customer_email: o.customer_email || 'cliente@tacticos.bo',
    customer_address: o.customer_address || '',
    delivery_notes: o.delivery_notes || null,
    customer_rating: o.customer_rating || null,
    customer_review: o.customer_review || null,
    items: (items && items.length > 0)
      ? items.map((i: any) => ({
          id: i.id,
          order_id: i.order_id,
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: parseFloat(i.unit_price) || 0,
          subtotal: parseFloat(i.total_price || i.subtotal) || 0,
        }))
      : [],
    customer: {
      name: o.customer_name || 'Cliente Táctico',
      phone: o.customer_phone || '',
      email: o.customer_email || 'cliente@tacticos.bo',
      address: o.customer_address || '',
    },
  };
}

function mapSupabaseSettlement(s: any): CashSettlement {
  return {
    id: s.id,
    driver_id: s.driver_id,
    driver_name: s.driver_name,
    amount: parseFloat(s.amount) || 0,
    method: s.method,
    proof_image_url: s.proof_image_url || null,
    notes: s.notes || null,
    status: s.status,
    order_ids: Array.isArray(s.order_ids) ? s.order_ids : [],
    reviewed_by: s.reviewed_by || null,
    reviewed_at: s.reviewed_at || null,
    created_at: s.created_at || new Date().toISOString(),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [alerts, setAlerts] = useState<SystemAlert[]>(demoAlerts);
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>(demoShippingZones);
  const [driverEarnings, setDriverEarnings] = useState<DriverEarning[]>(demoDriverEarnings);
  const [isDriverAvailable, setIsDriverAvailable] = useState<boolean>(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [cashSettlements, setCashSettlements] = useState<CashSettlement[]>([]);
  const [fixedAmountQRs, setFixedAmountQRs] = useState<FixedAmountQR[]>(demoFixedAmountQRs);
  const [paymentGatewaySettings, setPaymentGatewaySettings] = useState<PaymentGatewaySettings>(defaultPaymentGatewaySettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const CURRENT_CATALOG_VERSION = 'v3_tactical_complete_bolivia';
      const savedVersion = localStorage.getItem('tacticos_catalog_version');

      const savedCats = localStorage.getItem('tacticos_store_categories');
      if (savedCats && savedVersion === CURRENT_CATALOG_VERSION) {
        setCategories(JSON.parse(savedCats));
      } else {
        setCategories(demoCategories);
        localStorage.setItem('tacticos_store_categories', JSON.stringify(demoCategories));
      }

      const savedProds = localStorage.getItem('tacticos_store_products');
      if (savedProds && savedVersion === CURRENT_CATALOG_VERSION) {
        setProducts(JSON.parse(savedProds));
      } else {
        setProducts(demoProducts);
        localStorage.setItem('tacticos_store_products', JSON.stringify(demoProducts));
        localStorage.setItem('tacticos_catalog_version', CURRENT_CATALOG_VERSION);
      }

      const savedAlerts = localStorage.getItem('tacticos_store_alerts');
      if (savedAlerts && savedVersion === CURRENT_CATALOG_VERSION) {
        setAlerts(JSON.parse(savedAlerts));
      } else {
        setAlerts(demoAlerts);
        localStorage.setItem('tacticos_store_alerts', JSON.stringify(demoAlerts));
      }

      const savedOrders = localStorage.getItem('tacticos_store_orders');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        const hasLegacyAddresses = parsedOrders.some(
          (o: any) =>
            (o.customer_address && (o.customer_address.includes('Lima') || o.customer_address.includes('Miraflores') || o.customer_address.includes('San Isidro'))) ||
            (o.customer_phone && o.customer_phone.includes('+51'))
        );
        if (hasLegacyAddresses) {
          setOrders(demoOrders);
          localStorage.setItem('tacticos_store_orders', JSON.stringify(demoOrders));
        } else {
          setOrders(parsedOrders);
        }
      }

      const savedZones = localStorage.getItem('tacticos_store_shipping_zones');
      if (savedZones) {
        const parsedZones = JSON.parse(savedZones);
        const isLegacyOrNotCbba =
          !Array.isArray(parsedZones) ||
          parsedZones.length === 0 ||
          !parsedZones.some((z: any) => z.name && z.name.toLowerCase().includes('cochabamba'));

        if (isLegacyOrNotCbba) {
          setShippingZones(demoShippingZones);
          localStorage.setItem('tacticos_store_shipping_zones', JSON.stringify(demoShippingZones));
        } else {
          setShippingZones(parsedZones);
        }
      }

      const savedEarnings = localStorage.getItem('tacticos_store_driver_earnings');
      if (savedEarnings) setDriverEarnings(JSON.parse(savedEarnings));

      const savedAvailability = localStorage.getItem('tacticos_driver_available');
      if (savedAvailability !== null) setIsDriverAvailable(JSON.parse(savedAvailability));

      const savedSettings = localStorage.getItem('tacticos_store_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        const isLegacySettings =
          !parsedSettings.pickupAddress ||
          !parsedSettings.pickupAddress.toLowerCase().includes('cochabamba');

        if (isLegacySettings) {
          setStoreSettings(defaultStoreSettings);
          localStorage.setItem('tacticos_store_settings', JSON.stringify(defaultStoreSettings));
        } else {
          setStoreSettings(parsedSettings);
        }
      }

      const savedSettlements = localStorage.getItem('tacticos_cash_settlements');
      if (savedSettlements) setCashSettlements(JSON.parse(savedSettlements));

      const savedQRs = localStorage.getItem('tacticos_fixed_amount_qrs');
      if (savedQRs) {
        try {
          setFixedAmountQRs(JSON.parse(savedQRs));
        } catch {
          setFixedAmountQRs(demoFixedAmountQRs);
        }
      } else {
        setFixedAmountQRs(demoFixedAmountQRs);
        localStorage.setItem('tacticos_fixed_amount_qrs', JSON.stringify(demoFixedAmountQRs));
      }

      const savedGateway = localStorage.getItem('tacticos_payment_gateway_settings');
      if (savedGateway) {
        try {
          setPaymentGatewaySettings(JSON.parse(savedGateway));
        } catch {
          setPaymentGatewaySettings(defaultPaymentGatewaySettings);
        }
      } else {
        setPaymentGatewaySettings(defaultPaymentGatewaySettings);
        localStorage.setItem('tacticos_payment_gateway_settings', JSON.stringify(defaultPaymentGatewaySettings));
      }

      // Live Supabase sync
      const client = supabase;
      if (client) {
        // 1. Categories
        client.from('categories').select('*').order('position', { ascending: true }).then(({ data }) => {
          if (data && data.length > 0) setCategories(data);
        });

        // 2. Products
        client.from('products').select('*').eq('is_active', true).then(({ data }) => {
          if (data && data.length > 0) {
            const mappedProducts: Product[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              description: p.description || '',
              price: parseFloat(p.price) || 0,
              cost_price: p.cost_price ? parseFloat(p.cost_price) : undefined,
              category_id: p.category_id,
              images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80'],
              stock: p.stock ?? 0,
              low_stock_threshold: p.low_stock_threshold ?? 5,
              sku: p.sku || '',
              is_active: p.is_active ?? true,
              vendor_id: p.vendor_id || null,
              created_at: p.created_at || new Date().toISOString(),
              updated_at: p.updated_at || new Date().toISOString(),
              deleted_at: null,
            }));
            setProducts(mappedProducts);
          }
        });

        // 3. Shipping Zones
        client.from('shipping_zones').select('*').eq('is_active', true).then(({ data }) => {
          if (data && data.length > 0) {
            setShippingZones(data.map((z: any) => ({
              ...z,
              shipping_cost: parseFloat(z.shipping_cost) || 0,
              driver_commission: parseFloat(z.driver_commission) || 0,
              store_profit: parseFloat(z.store_profit) || 0,
            })));
          }
        });

        // 4. Store Settings
        client.from('store_settings').select('*').eq('id', 'main').single().then(({ data }) => {
          if (data) {
            setStoreSettings({
              storeName: data.store_name || defaultStoreSettings.storeName,
              currency: data.currency || defaultStoreSettings.currency,
              currencySymbol: data.currency_symbol || defaultStoreSettings.currencySymbol,
              pickupAddress: data.pickup_address || defaultStoreSettings.pickupAddress,
              pickupSchedule: data.pickup_schedule || defaultStoreSettings.pickupSchedule,
              pickupInstructions: data.pickup_instructions || defaultStoreSettings.pickupInstructions,
              freeGiftName: data.free_gift_name || defaultStoreSettings.freeGiftName,
              freeGiftValue: parseFloat(data.free_gift_min_amount) || defaultStoreSettings.freeGiftValue,
            });
          }
        });

        // 5. Órdenes y Productos de Órdenes desde Supabase
        client
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              const mapped = data.map((row: any) => mapSupabaseOrder(row, row.order_items || []));
              setOrders(mapped);
              try {
                localStorage.setItem('tacticos_store_orders', JSON.stringify(mapped));
              } catch (e) {
                console.warn('Error saving orders to localStorage:', e);
              }
            }
          });

        // 6. Rendición de Efectivo (Cuadre de Caja) desde Supabase
        client
          .from('cash_settlements')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              const mapped = data.map(mapSupabaseSettlement);
              setCashSettlements(mapped);
              try {
                localStorage.setItem('tacticos_cash_settlements', JSON.stringify(mapped));
              } catch (e) {
                console.warn('Error saving settlements to localStorage:', e);
              }
            }
          });

        // 7. Matriz de QRs Estáticos (ImgBB & Supabase)
        client
          .from('fixed_amount_qrs')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              const mappedQRs: FixedAmountQR[] = data.map((d: any) => ({
                id: d.id,
                amount: d.amount !== null && d.amount !== undefined ? parseFloat(d.amount) : null,
                qr_image_url: d.qr_image_url,
                bank_name: d.bank_name || 'Simple QR Bolivia',
                account_name: d.account_name || null,
                is_active: d.is_active !== undefined ? d.is_active : true,
                is_default: d.is_default !== undefined ? d.is_default : false,
                expiration_years: d.expiration_years || '3 años',
                expiration_date: d.expiration_date || null,
                notes: d.notes || null,
                created_at: d.created_at || new Date().toISOString(),
                updated_at: d.updated_at || new Date().toISOString(),
              }));
              setFixedAmountQRs(mappedQRs);
              try {
                localStorage.setItem('tacticos_fixed_amount_qrs', JSON.stringify(mappedQRs));
              } catch (e) {
                console.warn('Error saving QRs to localStorage:', e);
              }
            }
          });
      }
    } catch (e) {
      console.warn('Error reading from storage or Supabase:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // WebSockets — Supabase Realtime live sync para Órdenes y Rendiciones de Efectivo
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel('tactical_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          console.log('⚡ [Realtime WebSockets] Order event:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            const newOrder = mapSupabaseOrder(payload.new);
            setOrders(prev => {
              if (prev.some(o => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
            toast.info(`🔔 ¡Nueva orden táctica recibida! #${(payload.new.id || '').toUpperCase()}`, {
              description: `Total: Bs. ${Number(payload.new.total || 0).toFixed(2)} • ${payload.new.customer_name || 'Cliente'}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new;
            setOrders(prev =>
              prev.map(o => {
                if (o.id === updatedRow.id) {
                  return {
                    ...o,
                    ...mapSupabaseOrder(updatedRow, o.items),
                    items: o.items, // conservar items ya cargados
                  };
                }
                return o;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_settlements' },
        (payload: any) => {
          console.log('⚡ [Realtime WebSockets] Cash settlement event:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            const newSettlement = mapSupabaseSettlement(payload.new);
            setCashSettlements(prev => {
              if (prev.some(s => s.id === newSettlement.id)) return prev;
              return [newSettlement, ...prev];
            });
            toast.info(`💰 Nueva Rendición de Caja: ${newSettlement.driver_name}`, {
              description: `Monto: Bs. ${newSettlement.amount.toFixed(2)} (${newSettlement.method === 'qr_transfer' ? 'QR Simple' : 'Entrega física en Base'})`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseSettlement(payload.new);
            setCashSettlements(prev => prev.map(s => s.id === updated.id ? updated : s));
            if (updated.status === 'approved') {
              toast.success(`✅ Rendición de Bs. ${updated.amount.toFixed(2)} aprobada por administración`);
            } else if (updated.status === 'rejected') {
              toast.error(`❌ Rendición de Bs. ${updated.amount.toFixed(2)} rechazada`);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixed_amount_qrs' },
        (payload: any) => {
          console.log('⚡ [Realtime WebSockets] Fixed amount QR event:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            const newQR: FixedAmountQR = {
              id: row.id,
              amount: row.amount !== null && row.amount !== undefined ? parseFloat(row.amount) : null,
              qr_image_url: row.qr_image_url,
              bank_name: row.bank_name || 'Simple QR Bolivia',
              account_name: row.account_name || null,
              is_active: row.is_active !== undefined ? row.is_active : true,
              is_default: row.is_default !== undefined ? row.is_default : false,
              expiration_years: row.expiration_years || '3 años',
              expiration_date: row.expiration_date || null,
              notes: row.notes || null,
              created_at: row.created_at || new Date().toISOString(),
              updated_at: row.updated_at || new Date().toISOString(),
            };
            setFixedAmountQRs(prev => {
              if (prev.some(q => q.id === newQR.id)) return prev;
              return [newQR, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new;
            setFixedAmountQRs(prev =>
              prev.map(q => {
                if (q.id === row.id) {
                  return {
                    ...q,
                    amount: row.amount !== null && row.amount !== undefined ? parseFloat(row.amount) : null,
                    qr_image_url: row.qr_image_url || q.qr_image_url,
                    bank_name: row.bank_name || q.bank_name,
                    account_name: row.account_name !== undefined ? row.account_name : q.account_name,
                    is_active: row.is_active !== undefined ? row.is_active : q.is_active,
                    is_default: row.is_default !== undefined ? row.is_default : q.is_default,
                    expiration_years: row.expiration_years || q.expiration_years,
                    expiration_date: row.expiration_date !== undefined ? row.expiration_date : q.expiration_date,
                    notes: row.notes !== undefined ? row.notes : q.notes,
                    updated_at: row.updated_at || new Date().toISOString(),
                  };
                }
                return q;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            setFixedAmountQRs(prev => prev.filter(q => q.id !== payload.old.id));
          }
        }
      )
      .subscribe((status: string) => {
        console.log('⚡ [Realtime WebSockets Status]:', status);
      });

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_store_categories', JSON.stringify(categories));
    } catch (e) {
      console.warn('Error saving categories:', e);
    }
  }, [categories, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_store_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Error saving products:', e);
    }
  }, [products, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_store_alerts', JSON.stringify(alerts));
    } catch (e) {
      console.warn('Error saving alerts:', e);
    }
  }, [alerts, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_store_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Error saving orders:', e);
    }
  }, [orders, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_store_shipping_zones', JSON.stringify(shippingZones));
    } catch (e) {
      console.warn('Error saving shipping zones:', e);
    }
  }, [shippingZones, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_store_driver_earnings', JSON.stringify(driverEarnings));
    } catch (e) {
      console.warn('Error saving driver earnings:', e);
    }
  }, [driverEarnings, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_driver_available', JSON.stringify(isDriverAvailable));
    } catch (e) {
      console.warn('Error saving driver availability:', e);
    }
  }, [isDriverAvailable, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_store_settings', JSON.stringify(storeSettings));
    } catch (e) {
      console.warn('Error saving store settings:', e);
    }
  }, [storeSettings, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_cash_settlements', JSON.stringify(cashSettlements));
    } catch (e) {
      console.warn('Error saving cash settlements:', e);
    }
  }, [cashSettlements, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('tacticos_fixed_amount_qrs', JSON.stringify(fixedAmountQRs));
    } catch (e) {
      console.warn('Error saving fixed amount QRs:', e);
    }
  }, [fixedAmountQRs, isInitialized]);

  // SETTINGS ACTIONS
  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    setStoreSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
    toast.success('Configuración y horarios actualizados con éxito');
  };

  // CATEGORY ACTIONS
  const addCategory = ({ name, description }: { name: string; description?: string }): Category => {
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const newCategory: Category = {
      id: `cat-${Date.now().toString(36)}`,
      name: name.trim(),
      slug,
      description: description || '',
      parent_id: null,
      position: categories.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setCategories(prev => [...prev, newCategory]);

    const client = supabase;
    if (client) {
      client.from('categories').insert({
        id: newCategory.id,
        name: newCategory.name,
        slug: newCategory.slug,
        description: newCategory.description,
        is_active: true,
      }).then(({ error }) => {
        if (error) console.warn('Supabase category insert error:', error.message);
      });
    }

    toast.success(`Categoría "${name}" creada con éxito`);
    return newCategory;
  };

  const updateCategory = (id: string, data: { name?: string; description?: string }) => {
    let updatedName: string | undefined;
    let updatedSlug: string | undefined;

    setCategories(prev =>
      prev.map(c => {
        if (c.id === id) {
          updatedName = data.name ? data.name.trim() : c.name;
          updatedSlug = data.name ? updatedName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : c.slug;
          return {
            ...c,
            name: updatedName,
            slug: updatedSlug,
            description: data.description !== undefined ? data.description : c.description,
          };
        }
        return c;
      })
    );

    const client = supabase;
    if (client) {
      client.from('categories').update({
        ...(data.name && { name: data.name.trim(), slug: data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') }),
        ...(data.description !== undefined && { description: data.description }),
        updated_at: new Date().toISOString(),
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase category update error:', error.message);
      });
    }

    toast.success('Categoría actualizada con éxito');
  };

  const deleteCategory = (id: string): boolean => {
    const hasProducts = products.some(p => p.category_id === id);
    if (hasProducts) {
      toast.error('No se puede eliminar: existen productos asociados a esta categoría. Reasigna o elimina los productos primero.');
      return false;
    }

    setCategories(prev => prev.filter(c => c.id !== id));

    const client = supabase;
    if (client) {
      client.from('categories').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase category delete error:', error.message);
      });
    }

    toast.info('Categoría eliminada');
    return true;
  };

  // PRODUCT ACTIONS
  const addProduct = (prod: {
    name: string;
    description: string;
    price: number;
    cost_price?: number;
    stock: number;
    low_stock_threshold: number;
    category_id: string;
    image?: string;
    images?: string[];
  }): Product => {
    const categoryObj = categories.find(c => c.id === prod.category_id);
    const finalImages = (prod.images && prod.images.length > 0)
      ? prod.images
      : (prod.image ? [prod.image] : ['https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80']);

    const newProduct: Product = {
      id: `prod-${Date.now().toString(36)}`,
      name: prod.name.trim(),
      slug: prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: prod.description,
      price: Number(prod.price),
      cost_price: prod.cost_price !== undefined ? Number(prod.cost_price) : undefined,
      stock: Number(prod.stock),
      low_stock_threshold: Number(prod.low_stock_threshold),
      category_id: prod.category_id,
      category: categoryObj,
      images: finalImages,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProducts(prev => [newProduct, ...prev]);

    if (newProduct.stock <= newProduct.low_stock_threshold) {
      const newAlert: SystemAlert = {
        id: `alt-${Date.now().toString(36)}`,
        type: 'stock',
        severity: newProduct.stock === 0 ? 'critical' : 'warning',
        message: `Nuevo producto "${newProduct.name}" registrado con stock crítico (${newProduct.stock} uds).`,
        resolved: false,
        resolved_by: null,
        created_at: new Date().toISOString(),
        resolved_at: null,
      };
      setAlerts(prev => [newAlert, ...prev]);
    }

    const client = supabase;
    if (client) {
      client.from('products').insert({
        id: newProduct.id,
        name: newProduct.name,
        slug: newProduct.slug,
        description: newProduct.description,
        price: newProduct.price,
        cost_price: newProduct.cost_price ?? 0,
        category_id: newProduct.category_id,
        images: newProduct.images,
        stock: newProduct.stock,
        low_stock_threshold: newProduct.low_stock_threshold,
        is_active: true,
      }).then(({ error }) => {
        if (error) console.error('Error inserting product in Supabase:', error);
      });
    }

    toast.success(`Producto "${prod.name}" añadido al catálogo`);
    return newProduct;
  };

  const updateProduct = (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      cost_price: number;
      stock: number;
      low_stock_threshold: number;
      category_id: string;
      image: string;
      images: string[];
      is_active: boolean;
    }>
  ) => {
    let finalUpdatedImages: string[] | undefined;

    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const categoryObj = data.category_id
            ? categories.find(c => c.id === data.category_id)
            : p.category;

          const updatedStock = data.stock !== undefined ? Number(data.stock) : p.stock;
          const updatedThreshold = data.low_stock_threshold !== undefined ? Number(data.low_stock_threshold) : p.low_stock_threshold;

          if (updatedStock <= updatedThreshold && p.stock > updatedThreshold) {
            const newAlert: SystemAlert = {
              id: `alt-${Date.now().toString(36)}`,
              type: 'stock',
              severity: updatedStock === 0 ? 'critical' : 'warning',
              message: `El producto "${p.name}" ha caído a ${updatedStock} unidades (umbral: ${updatedThreshold}).`,
              resolved: false,
              resolved_by: null,
              created_at: new Date().toISOString(),
              resolved_at: null,
            };
            setAlerts(a => [newAlert, ...a]);
          }

          const imagesToSet = data.images !== undefined
            ? data.images
            : (data.image ? [data.image] : p.images);

          finalUpdatedImages = imagesToSet;

          return {
            ...p,
            name: data.name !== undefined ? data.name : p.name,
            description: data.description !== undefined ? data.description : p.description,
            price: data.price !== undefined ? Number(data.price) : p.price,
            cost_price: data.cost_price !== undefined ? Number(data.cost_price) : p.cost_price,
            stock: updatedStock,
            low_stock_threshold: updatedThreshold,
            category_id: data.category_id !== undefined ? data.category_id : p.category_id,
            category: categoryObj,
            images: imagesToSet,
            is_active: data.is_active !== undefined ? data.is_active : p.is_active,
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    const client = supabase;
    if (client) {
      client.from('products').update({
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.cost_price !== undefined && { cost_price: data.cost_price }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.low_stock_threshold !== undefined && { low_stock_threshold: data.low_stock_threshold }),
        ...(data.category_id && { category_id: data.category_id }),
        ...(finalUpdatedImages && { images: finalUpdatedImages }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      }).eq('id', id).then(({ error }) => {
        if (error) console.error('Error updating product in Supabase:', error);
      });
    }

    toast.success('Producto actualizado');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    const client = supabase;
    if (client) {
      client.from('products').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Error deleting product in Supabase:', error);
      });
    }
    toast.error('Producto eliminado del catálogo');
  };

  const updateStock = (id: string, newStock: number) => {
    updateProduct(id, { stock: newStock });
  };

  // SHIPPING ZONES (ADMIN)
  const addShippingZone = (zoneData: {
    name: string;
    department?: string;
    city?: string;
    shipping_cost: number;
    driver_commission: number;
    estimated_hours: number;
  }): ShippingZone => {
    const storeProfit = Number(zoneData.shipping_cost) - Number(zoneData.driver_commission);
    const newZone: ShippingZone = {
      id: `zone-${Date.now().toString(36)}`,
      name: zoneData.name.trim(),
      department: zoneData.department || null,
      city: zoneData.city || null,
      shipping_cost: Number(zoneData.shipping_cost),
      driver_commission: Number(zoneData.driver_commission),
      store_profit: storeProfit,
      estimated_hours: Number(zoneData.estimated_hours),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setShippingZones(prev => [...prev, newZone]);
    toast.success(`Zona "${zoneData.name}" configurada con éxito`);
    return newZone;
  };

  const updateShippingZone = (id: string, data: Partial<ShippingZone>) => {
    setShippingZones(prev =>
      prev.map(z => {
        if (z.id === id) {
          const shipping_cost = data.shipping_cost !== undefined ? Number(data.shipping_cost) : z.shipping_cost;
          const driver_commission = data.driver_commission !== undefined ? Number(data.driver_commission) : z.driver_commission;
          return {
            ...z,
            ...data,
            shipping_cost,
            driver_commission,
            store_profit: shipping_cost - driver_commission,
          };
        }
        return z;
      })
    );
    toast.success('Zona de envío actualizada');
  };

  const deleteShippingZone = (id: string): boolean => {
    setShippingZones(prev => prev.filter(z => z.id !== id));
    toast.info('Zona de envío eliminada');
    return true;
  };

  const resetShippingZonesToDefaults = () => {
    setShippingZones(demoShippingZones);
    localStorage.setItem('tacticos_store_shipping_zones', JSON.stringify(demoShippingZones));
    toast.success('Zonas de Cochabamba y Nacionales restablecidas a valores oficiales');
  };

  // ORDER CREATION & LOGISTICS (BOLIVIA - 3 DELIVERY TYPES + 50/50 + REGALO TÁCTICO)
  const createOrder = async (input: CreateOrderInput): Promise<Order> => {
    let shippingCost = 0;
    let driverCommission = 0;
    let selectedZone: ShippingZone | undefined = undefined;

    if (input.delivery_type === 'pickup') {
      shippingCost = 0;
      driverCommission = 0;
    } else if (input.delivery_type === 'delivery') {
      selectedZone = shippingZones.find(z => z.id === input.shipping_zone_id);
      shippingCost = selectedZone ? selectedZone.shipping_cost : 15;
      driverCommission = selectedZone ? selectedZone.driver_commission : 10;
    } else if (input.delivery_type === 'national_shipping') {
      selectedZone = shippingZones.find(z => z.id === input.shipping_zone_id) || shippingZones.find(z => z.id === 'zone-06');
      shippingCost = selectedZone ? selectedZone.shipping_cost : 35;
      driverCommission = selectedZone ? selectedZone.driver_commission : 25;
    }

    const total = input.subtotal + shippingCost;
    const orderId = `ord-${Date.now().toString(36)}`;

    // Payment amounts and gift calculation
    let paid_amount = 0;
    let pending_amount = total;
    let free_gift: string | null = null;

    if (input.payment_mode === 'full_payment') {
      paid_amount = total;
      pending_amount = 0;
      free_gift = storeSettings.freeGiftName; // 🎉 100% pago obtiene souvenir de regalo
    } else if (input.payment_mode === 'partial_payment') {
      paid_amount = Math.round((total / 2) * 100) / 100; // 50% anticipo por QR
      pending_amount = Math.round((total - paid_amount) * 100) / 100; // 50% al recibir
      free_gift = null;
    } else {
      // cash_on_delivery: 0 anticipo, 100% al recibir
      paid_amount = 0;
      pending_amount = total;
      free_gift = null;
    }

    // Orders are considered 'paid' (confirmed) if advance was paid or if confirmed by client
    const initialStatus: OrderStatus = 'paid';

    // Obtener el UUID real del usuario autenticado en Supabase
    let realUserId: string | null = null;
    try {
      const client = supabase;
      if (client) {
        const { data: { user } } = await client.auth.getUser();
        realUserId = user?.id ?? null;
      }
    } catch {
      // Sin sesión activa — orden anónima, customer_id será null
    }

    const newOrder: Order = {
      id: orderId,
      user_id: realUserId || 'guest',
      vendor_id: null,
      driver_id: null,
      shipping_zone_id: input.shipping_zone_id || null,
      shipping_cost: shippingCost,
      driver_commission: driverCommission,
      status: initialStatus,
      total,
      paid_amount,
      pending_amount,
      payment_method: input.payment_method,
      payment_mode: input.payment_mode,
      delivery_type: input.delivery_type,
      free_gift,
      pickup_time: input.pickup_time || (input.delivery_type === 'pickup' ? storeSettings.pickupSchedule : null),
      pickup_location: input.delivery_type === 'pickup' ? storeSettings.pickupAddress : null,
      destination_department: input.destination_department || null,
      qr_code_data: input.payment_mode !== 'cash_on_delivery' ? `QR-${orderId.toUpperCase()}` : null,
      created_at: new Date().toISOString(),
      paid_at: paid_amount > 0 ? new Date().toISOString() : null,
      delivered_at: null,
      cancelled_at: null,
      cancellation_reason: null,
      internal_notes: input.delivery_notes || null,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      customer_email: input.customer_email || 'cliente@tacticos.bo',
      customer_address: input.customer_address || (input.delivery_type === 'pickup' ? storeSettings.pickupAddress : ''),
      delivery_notes: input.delivery_notes || null,
      customer_rating: null,
      customer_review: null,
      items: input.items.map((item, idx) => ({
        id: `oi-${orderId}-${idx}`,
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
      shipping_zone: selectedZone,
      customer: {
        name: input.customer_name,
        phone: input.customer_phone,
        email: input.customer_email || 'cliente@tacticos.bo',
        address: input.customer_address || storeSettings.pickupAddress,
      },
    };

    setOrders(prev => [newOrder, ...prev]);

    // Live Supabase sync for order
    const client = supabase;
    if (client) {
      client
        .from('orders')
        .insert({
          id: newOrder.id,
          customer_id: realUserId || undefined,  // UUID real de Supabase Auth (null si anónimo)
          status: newOrder.status,
          subtotal: Number(input.subtotal),
          total: Number(newOrder.total),
          delivery_type: newOrder.delivery_type,
          pickup_time: newOrder.pickup_time,
          pickup_location: newOrder.pickup_location,
          destination_department: newOrder.destination_department,
          shipping_zone_id: newOrder.shipping_zone_id,
          shipping_cost: Number(newOrder.shipping_cost),
          payment_mode: newOrder.payment_mode,
          payment_method: newOrder.payment_method,
          paid_amount: Number(newOrder.paid_amount),
          pending_amount: Number(newOrder.pending_amount),
          free_gift: newOrder.free_gift,
          driver_commission: Number(newOrder.driver_commission),
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          customer_email: newOrder.customer_email,
          customer_address: newOrder.customer_address,
          delivery_notes: newOrder.delivery_notes,
        })
        .then(({ error }) => {
          if (error) console.error('Error inserting order in Supabase:', error);
        });

      if (newOrder.items && newOrder.items.length > 0) {
        client
          .from('order_items')
          .insert(
            newOrder.items.map(item => ({
              id: item.id,
              order_id: newOrder.id,
              product_id: item.product_id,
              product_name: products.find(p => p.id === item.product_id)?.name || 'Producto Táctico',
              quantity: item.quantity,
              unit_price: Number(item.unit_price),
              total_price: Number(item.subtotal),
            }))
          )
          .then(({ error }) => {
            if (error) console.error('Error inserting order items in Supabase:', error);
          });
      }
    }

    // Subtract stock
    input.items.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        updateStock(prod.id, newStock);
      }
    });

    // Notify about gift if unlocked
    if (free_gift) {
      toast.success('🎁 ¡REGALO TÁCTICO SORPRESA ADJUDICADO!', {
        description: '¡Por pagar el 100% con QR, un Souvenir Táctico Sorpresa exclusivo viaja dentro de tu paquete!',
      });
    }

    if (input.customer_email) {
      toast.success('¡Cuenta generada automáticamente!', {
        description: `Se enviaron tus credenciales y tracking por correo SMTP a ${input.customer_email}`,
      });
    }

    toast.success(`¡Orden ${orderId.toUpperCase()} creada con éxito!`);
    return newOrder;
  };

  // ADMIN ACTIONS
  const adminSetOrderStatus = (orderId: string, status: OrderStatus, notes?: string) => {
    let targetEmail: string | undefined;
    let customerName: string | undefined;
    let orderTotal: number | undefined;

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          targetEmail = o.customer_email || o.customer?.email;
          customerName = o.customer_name || o.customer?.name;
          orderTotal = o.total;

          return {
            ...o,
            status,
            internal_notes: notes ? `${o.internal_notes || ''} [Admin: ${notes}]` : o.internal_notes,
            delivered_at: status === 'delivered' ? (o.delivered_at || new Date().toISOString()) : o.delivered_at,
            paid_at: status === 'paid' ? (o.paid_at || new Date().toISOString()) : o.paid_at,
          };
        }
        return o;
      })
    );

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client.from('orders').update({
        status,
        ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
        ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Error updating order in Supabase:', error);
      });
    }

    // Send email notification on major status transitions
    if (targetEmail && targetEmail.includes('@')) {
      const statusLabels: Record<string, { title: string; message: string }> = {
        preparing: {
          title: `ORDEN EN PREPARACIÓN #${orderId}`,
          message: `Estimado(a) ${customerName || 'Operador'}, tu pedido táctico está siendo alistado y empacado con precintos de seguridad en nuestra base central en Cochabamba.`,
        },
        ready: {
          title: `ORDEN LISTA #${orderId}`,
          message: `Estimado(a) ${customerName || 'Operador'}, tu equipo táctico ya está 100% verificado y listo para recojo en tienda (Av. Heroínas #560) o para entrega inmediata.`,
        },
        in_transit: {
          title: `PAQUETE EN RUTA #${orderId}`,
          message: `Estimado(a) ${customerName || 'Operador'}, tu paquete va en camino. El repartidor motorizado o la flota nacional interdepartamental está en tránsito hacia tu ubicación.`,
        },
        delivered: {
          title: `ORDEN ENTREGADA CON ÉXITO #${orderId}`,
          message: `Estimado(a) ${customerName || 'Operador'}, tu equipo ha sido entregado en destino. ¡Misión cumplida! Gracias por confiar en Tienda Táctica Bolivia.`,
        },
        cancelled: {
          title: `ORDEN CANCELADA #${orderId}`,
          message: `Estimado(a) ${customerName || 'Operador'}, tu orden ha sido cancelada. Si necesitas asistencia, contáctanos por WhatsApp al +591 71234567.`,
        },
      };

      const meta = statusLabels[status];
      if (meta) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetEmail,
            subject: `${meta.title} — Tienda Táctica Bolivia`,
            title: meta.title,
            message: meta.message,
            orderId,
            total: orderTotal,
          }),
        }).catch(e => console.warn('Could not send status update notification:', e));
      }
    }

    toast.success(`Orden ${orderId.toUpperCase()} actualizada a "${status}"`);
  };

  const adminAssignDriver = (orderId: string, driverId: string) => {
    let targetOrder: Order | undefined;

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          targetOrder = o;
          return {
            ...o,
            driver_id: driverId,
            status: o.status === 'ready' ? 'assigned' : o.status,
            driver: demoVendor,
          };
        }
        return o;
      })
    );

    if (targetOrder) {
      const o = targetOrder;
      // 1. Notify Driver (demoVendor.email / driver1@tacticos.bo)
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: demoVendor.email,
          subject: `🛵 NUEVA RUTA ASIGNADA #${orderId} — Comisión: Bs. ${Number(o.driver_commission).toFixed(2)}`,
          title: `DESPACHO ASIGNADO #${orderId}`,
          message: `Camarada conductor, tienes una nueva orden asignada:
• Destino: ${o.customer_address}
• Cliente: ${o.customer_name}
• Celular / WhatsApp: ${o.customer_phone}
• Modalidad Cobro: ${o.payment_mode === 'full_payment' ? 'PAGADO 100% (Solo entregar)' : `COBRAR SALDO: Bs. ${Number(o.pending_amount).toFixed(2)}`}
• Tu Comisión Ganada: +Bs. ${Number(o.driver_commission).toFixed(2)}`,
          orderId,
          total: o.total,
          actionUrl: '/vendor',
          actionLabel: 'VER HOJA DE RUTA',
          role: 'driver',
        }),
      }).catch(e => console.warn('Could not notify driver:', e));

      // 2. Notify Client
      if (o.customer_email && o.customer_email.includes('@')) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: o.customer_email,
            subject: `🛵 Repartidor Asignado a tu Orden #${orderId} — Tienda Táctica Bolivia`,
            title: `MOTORIZADO EN CAMINO #${orderId}`,
            message: `Estimado(a) ${o.customer_name}, tu paquete táctico ha sido asignado a nuestro conductor oficial:
• Conductor: Carlos Chofer (Motorizado Mil-Spec)
• Teléfono Chofer: +591 76543210
• Modalidad: ${o.payment_mode === 'full_payment' ? 'Pagado 100%' : `Saldo a pagar al chofer: Bs. ${Number(o.pending_amount).toFixed(2)}`}`,
            orderId,
            total: o.total,
            actionUrl: '/pedidos',
            actionLabel: 'VER ESTADO DE MI ORDEN',
            role: 'client',
          }),
        }).catch(e => console.warn('Could not notify client of driver assignment:', e));
      }
    }

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('orders')
        .update({
          driver_id: driverId,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Error updating driver assignment in Supabase:', error);
        });
    }

    toast.success(`Repartidor asignado a la orden ${orderId.toUpperCase()}`);
  };

  // DRIVER LOGISTICS
  const driverAcceptOrder = (orderId: string, driverId: string = 'vendor-01'): boolean => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) {
      toast.error('Orden no encontrada');
      return false;
    }

    if (targetOrder.status !== 'ready') {
      toast.error('Esta orden ya fue aceptada por otro conductor o aún no está lista');
      return false;
    }

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            driver_id: driverId,
            status: 'assigned',
            driver: demoVendor,
          };
        }
        return o;
      })
    );

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('orders')
        .update({
          driver_id: driverId,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Error updating driverAcceptOrder in Supabase:', error);
        });
    }

    toast.success(`¡Has aceptado la orden ${orderId.toUpperCase()}! Asignada a tu ruta.`);
    return true;
  };

  const driverPickupOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'picked_up',
            internal_notes: `${o.internal_notes || ''} [Recogido en punto de origen]`,
          };
        }
        return o;
      })
    );

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('orders')
        .update({
          status: 'picked_up',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Error updating driverPickupOrder in Supabase:', error);
        });
    }

    toast.success(`Orden ${orderId.toUpperCase()} marcada como RECOGIDA.`);
  };

  const driverInTransit = (orderId: string) => {
    let targetOrder: Order | undefined;

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          targetOrder = o;
          return {
            ...o,
            status: 'in_transit',
            internal_notes: `${o.internal_notes || ''} [Repartidor en camino al destino]`,
          };
        }
        return o;
      })
    );

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('orders')
        .update({
          status: 'in_transit',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Error updating driverInTransit in Supabase:', error);
        });
    }

    // Notify Client that driver is in transit
    if (targetOrder) {
      const o = targetOrder;
      if (o.customer_email && o.customer_email.includes('@')) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: o.customer_email,
            subject: `🛵 ¡Tu Paquete Táctico va en Camino! #${orderId} — Tienda Táctica Bolivia`,
            title: `MOTORIZADO EN RUTA #${orderId}`,
            message: `Estimado(a) ${o.customer_name}, el motorizado ya recogió tu paquete táctico y va en camino hacia tu dirección (${o.customer_address}). Mantente atento(a) a tu celular para la entrega inmediata.`,
            orderId,
            total: o.total,
            actionUrl: '/pedidos',
            actionLabel: 'VER RUTA DEL PEDIDO',
            role: 'client',
          }),
        }).catch(e => console.warn('Could not notify client in transit:', e));
      }
    }

    toast.info(`Orden ${orderId.toUpperCase()} en camino al cliente.`);
  };

  const driverDeliverOrder = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const deliveryTime = new Date().toISOString();

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'delivered',
            delivered_at: deliveryTime,
            paid_amount: o.total, // Fully collected upon delivery
            pending_amount: 0,
            paid_at: o.paid_at || deliveryTime,
          };
        }
        return o;
      })
    );

    // Auto-create driver commission earning
    const newEarning: DriverEarning = {
      id: `earn-${Date.now().toString(36)}`,
      driver_id: targetOrder.driver_id || 'vendor-01',
      order_id: targetOrder.id,
      amount: targetOrder.driver_commission,
      zone_id: targetOrder.shipping_zone_id || null,
      status: 'pending',
      paid_at: null,
      created_at: deliveryTime,
      zone: shippingZones.find(z => z.id === targetOrder.shipping_zone_id),
      order: targetOrder,
    };

    setDriverEarnings(prev => [newEarning, ...prev]);

    // 1. Notify Client: Delivery complete
    if (targetOrder.customer_email && targetOrder.customer_email.includes('@')) {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetOrder.customer_email,
          subject: `✅ ¡Paquete Táctico Entregado con Éxito! #${orderId} — Tienda Táctica Bolivia`,
          title: `MISIÓN CUMPLIDA #${orderId}`,
          message: `Estimado(a) ${targetOrder.customer_name}, confirmamos que tu paquete táctico ha sido entregado en tus manos. ¡Muchas gracias por tu compra en Tienda Táctica Cochabamba! Esperamos que tu nuevo equipamiento supere todas tus expectativas.`,
          orderId,
          total: targetOrder.total,
          actionUrl: '/pedidos',
          actionLabel: 'CALIFICAR ENTREGA',
          role: 'client',
        }),
      }).catch(e => console.warn('Could not notify client of delivery:', e));
    }

    // 2. Alert Admin: Delivery completed and funds collected
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'ayniprotocol@gmail.com',
        subject: `💰 ENTREGA COMPLETADA #${orderId} — Total: Bs. ${Number(targetOrder.total).toFixed(2)}`,
        title: `ENTREGA Y COBRO FINALIZADO #${orderId}`,
        message: `El repartidor ha completado con éxito la entrega #${orderId}:
• Cliente: ${targetOrder.customer_name}
• Total Orden: Bs. ${Number(targetOrder.total).toFixed(2)}
• Comisión Chofer: Bs. ${Number(targetOrder.driver_commission).toFixed(2)}
• Ganancia Neta Tienda: Bs. ${(Number(targetOrder.total) - Number(targetOrder.driver_commission)).toFixed(2)}
• Fecha y Hora: ${new Date(deliveryTime).toLocaleString('es-BO')}`,
        orderId,
        total: targetOrder.total,
        actionUrl: '/admin/orders',
        actionLabel: 'PANEL DE ÓRDENES ADMIN',
        role: 'admin',
      }),
    }).catch(e => console.warn('Could not alert admin of delivery:', e));

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: deliveryTime,
          paid_amount: targetOrder.total,
          pending_amount: 0,
          paid_at: targetOrder.paid_at || deliveryTime,
          updated_at: deliveryTime,
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Error updating driverDeliverOrder in Supabase:', error);
        });

      client
        .from('driver_earnings')
        .insert({
          id: newEarning.id,
          driver_id: newEarning.driver_id,
          order_id: newEarning.order_id,
          amount: newEarning.amount,
          zone_id: newEarning.zone_id,
          status: 'pending',
          created_at: newEarning.created_at,
        })
        .then(({ error }) => {
          if (error) console.error('Error inserting driver commission in Supabase:', error);
        });
    }

    toast.success(`¡Entrega de orden ${orderId.toUpperCase()} completada!`, {
      description: `Comisión registrada: +Bs. ${targetOrder.driver_commission.toFixed(2)}`,
    });
  };

  const rateDriver = (orderId: string, rating: number, review: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            customer_rating: rating,
            customer_review: review,
          };
        }
        return o;
      })
    );

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('orders')
        .update({
          customer_rating: rating,
          customer_review: review,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Error updating rating in Supabase:', error);
        });
    }

    toast.success('¡Gracias por calificar la entrega de tu pedido!');
  };

  const cancelOrder = (orderId: string, reason?: string): boolean => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    if (order.status !== 'pending' && order.status !== 'paid') {
      toast.error('Solo puedes cancelar pedidos en estado "Pendiente" o "Pagado" (antes de preparación)');
      return false;
    }

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason || 'Cancelado por el cliente',
          };
        }
        return o;
      })
    );

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || 'Cancelado por el cliente',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Error updating cancelOrder in Supabase:', error);
        });
    }

    toast.info(`Orden ${orderId.toUpperCase()} cancelada`);
    return true;
  };

  const toggleDriverAvailability = () => {
    setIsDriverAvailable(prev => {
      const next = !prev;
      toast.info(next ? 'Estado: DISPONIBLE para recibir repartos' : 'Estado: EN DESCANSO');
      return next;
    });
  };

  const settleDriverEarnings = (earningId: string) => {
    setDriverEarnings(prev =>
      prev.map(e => (e.id === earningId ? { ...e, status: 'paid', paid_at: new Date().toISOString() } : e))
    );

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('driver_earnings')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', earningId)
        .then(({ error }) => {
          if (error) console.error('Error updating driver earning in Supabase:', error);
        });
    }

    toast.success('Comisión de reparto liquidada con éxito');
  };

  // ============ CASH SETTLEMENT SYSTEM ============
  const getDriverCashOwed = (driverId: string): number => {
    // Sum of cash collected on delivery orders that haven't been settled
    const deliveredCashOrders = orders.filter(
      o => o.status === 'delivered' &&
           (o.driver_id === driverId || driverId === 'vendor-01') &&
           (o.payment_mode === 'cash_on_delivery' || o.payment_mode === 'partial_payment')
    );
    const totalCollected = deliveredCashOrders.reduce((acc, o) => {
      if (o.payment_mode === 'cash_on_delivery') return acc + o.total;
      if (o.payment_mode === 'partial_payment') return acc + (o.pending_amount || 0);
      return acc;
    }, 0);

    // Subtract already approved settlements
    const alreadySettled = cashSettlements
      .filter(s => (s.driver_id === driverId || driverId === 'vendor-01') && s.status === 'approved')
      .reduce((acc, s) => acc + s.amount, 0);

    return Math.max(0, totalCollected - alreadySettled);
  };

  const submitCashSettlement = (
    driverId: string,
    driverName: string,
    amount: number,
    method: CashSettlementMethod,
    orderIds: string[],
    proofUrl?: string,
    notes?: string
  ) => {
    const newSettlement: CashSettlement = {
      id: `csh-${Date.now().toString(36)}`,
      driver_id: driverId,
      driver_name: driverName,
      amount,
      method,
      proof_image_url: proofUrl || null,
      notes: notes || null,
      status: 'pending_review',
      order_ids: orderIds,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString(),
    };
    setCashSettlements(prev => {
      const updated = [...prev, newSettlement];
      localStorage.setItem('tacticos_cash_settlements', JSON.stringify(updated));
      return updated;
    });

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('cash_settlements')
        .insert({
          id: newSettlement.id,
          driver_id: newSettlement.driver_id,
          driver_name: newSettlement.driver_name,
          amount: newSettlement.amount,
          method: newSettlement.method,
          proof_image_url: newSettlement.proof_image_url || null,
          notes: newSettlement.notes || null,
          status: 'pending_review',
          order_ids: newSettlement.order_ids,
          created_at: newSettlement.created_at,
        })
        .then(({ error }) => {
          if (error) {
            console.warn('Could not insert cash settlement in Supabase (will remain in localStorage):', error);
          } else {
            console.log('✅ Cash settlement persisted to Supabase database');
          }
        });
    }

    // Notify admin
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'ayniprotocol@gmail.com',
        subject: `💰 RENDICIÓN DE CAJA: ${driverName} — Bs. ${amount.toFixed(2)}`,
        title: 'RENDICIÓN DE EFECTIVO PENDIENTE DE APROBACIÓN',
        message: `El repartidor ${driverName} ha enviado una rendición de caja por Bs. ${amount.toFixed(2)}.\nMétodo: ${method === 'qr_transfer' ? 'Transferencia QR Simple' : 'Entrega física en Base'}.\nÓrdenes cubiertas: ${orderIds.join(', ')}.\nRevisa y aprueba en el panel de administración.`,
      }),
    }).catch(e => console.warn('Could not notify admin of cash settlement:', e));

    toast.success(`Rendición de Bs. ${amount.toFixed(2)} enviada al administrador para revisión`);
  };

  const reviewCashSettlement = (settlementId: string, approved: boolean, reviewerName?: string) => {
    const reviewTime = new Date().toISOString();
    setCashSettlements(prev => {
      const updated = prev.map(s =>
        s.id === settlementId
          ? {
              ...s,
              status: approved ? 'approved' as const : 'rejected' as const,
              reviewed_by: reviewerName || 'Admin',
              reviewed_at: reviewTime,
            }
          : s
      );
      localStorage.setItem('tacticos_cash_settlements', JSON.stringify(updated));
      return updated;
    });

    // Sync to Supabase
    const client = supabase;
    if (client) {
      client
        .from('cash_settlements')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_by: reviewerName || 'Admin',
          reviewed_at: reviewTime,
        })
        .eq('id', settlementId)
        .then(({ error }) => {
          if (error) {
            console.warn('Could not update cash settlement in Supabase:', error);
          } else {
            console.log('✅ Cash settlement review synced to Supabase database');
          }
        });
    }

    toast.success(approved ? '✅ Rendición aprobada y cuadrada' : '❌ Rendición rechazada');
  };

  // ========================================================
  // MATRIZ DE QRs ESTÁTICOS (ImgBB & Supabase)
  // ========================================================
  const addFixedAmountQR = async (qrData: Omit<FixedAmountQR, 'id' | 'created_at'>): Promise<FixedAmountQR> => {
    const newQR: FixedAmountQR = {
      ...qrData,
      id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setFixedAmountQRs(prev => {
      let updated = [newQR, ...prev];
      if (newQR.is_default) {
        updated = updated.map(item => (item.id === newQR.id ? item : { ...item, is_default: false }));
      }
      localStorage.setItem('tacticos_fixed_amount_qrs', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (client) {
      try {
        const { data, error } = await client
          .from('fixed_amount_qrs')
          .insert({
            amount: newQR.amount,
            qr_image_url: newQR.qr_image_url,
            bank_name: newQR.bank_name,
            account_name: newQR.account_name,
            is_active: newQR.is_active,
            is_default: newQR.is_default,
            expiration_years: newQR.expiration_years || '3 años',
            expiration_date: newQR.expiration_date || null,
            notes: newQR.notes,
          })
          .select()
          .single();

        if (!error && data) {
          newQR.id = data.id;
        } else if (error) {
          console.warn('Error guardando QR en Supabase (se mantiene en local):', error.message);
        }
      } catch (err) {
        console.warn('No se pudo conectar a Supabase para guardar QR:', err);
      }
    }

    toast.success('Código QR agregado a la matriz exitosamente');
    return newQR;
  };

  const updateFixedAmountQR = async (id: string, updates: Partial<FixedAmountQR>): Promise<void> => {
    setFixedAmountQRs(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          return { ...item, ...updates, updated_at: new Date().toISOString() };
        }
        if (updates.is_default && item.id !== id) {
          return { ...item, is_default: false };
        }
        return item;
      });
      localStorage.setItem('tacticos_fixed_amount_qrs', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (client) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.amount !== undefined) payload.amount = updates.amount;
        if (updates.qr_image_url !== undefined) payload.qr_image_url = updates.qr_image_url;
        if (updates.bank_name !== undefined) payload.bank_name = updates.bank_name;
        if (updates.account_name !== undefined) payload.account_name = updates.account_name;
        if (updates.is_active !== undefined) payload.is_active = updates.is_active;
        if (updates.is_default !== undefined) payload.is_default = updates.is_default;
        if (updates.expiration_years !== undefined) payload.expiration_years = updates.expiration_years;
        if (updates.expiration_date !== undefined) payload.expiration_date = updates.expiration_date;
        if (updates.notes !== undefined) payload.notes = updates.notes;

        await client.from('fixed_amount_qrs').update(payload).eq('id', id);
      } catch (err) {
        console.warn('Error al actualizar QR en Supabase:', err);
      }
    }

    toast.success('Código QR actualizado en la matriz');
  };

  const deleteFixedAmountQR = async (id: string): Promise<boolean> => {
    setFixedAmountQRs(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('tacticos_fixed_amount_qrs', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (client) {
      try {
        await client.from('fixed_amount_qrs').delete().eq('id', id);
      } catch (err) {
        console.warn('Error al eliminar QR en Supabase:', err);
      }
    }

    toast.success('Código QR eliminado de la matriz');
    return true;
  };

  const toggleFixedAmountQRStatus = async (id: string): Promise<void> => {
    const target = fixedAmountQRs.find(q => q.id === id);
    if (!target) return;
    await updateFixedAmountQR(id, { is_active: !target.is_active });
  };

  const getQRForAmount = (amount: number): { qr: FixedAmountQR | null; isExactMatch: boolean; isDefault: boolean } => {
    const isExpired = (q: FixedAmountQR) => {
      if (!q.expiration_date) return false;
      const exp = new Date(q.expiration_date + 'T23:59:59');
      return !isNaN(exp.getTime()) && exp.getTime() < Date.now();
    };

    // 1. Coincidencia exacta con tolerancia de 0.01 centavos (priorizando no expirados)
    const exactValid = fixedAmountQRs.find(
      q => q.is_active && !isExpired(q) && q.amount !== null && Math.abs(q.amount - amount) < 0.01
    );
    if (exactValid) {
      return { qr: exactValid, isExactMatch: true, isDefault: false };
    }
    const exactAny = fixedAmountQRs.find(
      q => q.is_active && q.amount !== null && Math.abs(q.amount - amount) < 0.01
    );
    if (exactAny) {
      return { qr: exactAny, isExactMatch: true, isDefault: false };
    }

    // 2. QR comodín de respaldo (sin monto fijado o marcado como is_default, priorizando no expirados)
    const defaultValid = fixedAmountQRs.find(
      q => q.is_active && !isExpired(q) && (q.is_default || q.amount === null || q.amount === 0)
    );
    if (defaultValid) {
      return { qr: defaultValid, isExactMatch: false, isDefault: true };
    }
    const defaultAny = fixedAmountQRs.find(
      q => q.is_active && (q.is_default || q.amount === null || q.amount === 0)
    );
    if (defaultAny) {
      return { qr: defaultAny, isExactMatch: false, isDefault: true };
    }

    // 3. Cualquier QR activo disponible
    const anyActiveValid = fixedAmountQRs.find(q => q.is_active && !isExpired(q));
    if (anyActiveValid) {
      return { qr: anyActiveValid, isExactMatch: false, isDefault: anyActiveValid.is_default };
    }
    const anyActive = fixedAmountQRs.find(q => q.is_active);
    if (anyActive) {
      return { qr: anyActive, isExactMatch: false, isDefault: anyActive.is_default };
    }

    return { qr: null, isExactMatch: false, isDefault: false };
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, resolved: true, resolved_at: new Date().toISOString() } : a))
    );
    toast.success('Alerta resuelta');
  };

  const updatePaymentGatewaySettings = (settings: Partial<PaymentGatewaySettings>) => {
    setPaymentGatewaySettings(prev => {
      const updated = {
        ...prev,
        ...settings,
        updated_at: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tacticos_payment_gateway_settings', JSON.stringify(updated));
      }
      return updated;
    });
    toast.success('Configuración de pasarela guardada con éxito', {
      description: `Proveedor activo: ${settings.provider_name || paymentGatewaySettings.provider_name}`,
    });
  };

  const resetToDefaults = () => {
    setCategories(demoCategories);
    setProducts(demoProducts);
    setAlerts(demoAlerts);
    setOrders(demoOrders);
    setShippingZones(demoShippingZones);
    setDriverEarnings(demoDriverEarnings);
    setIsDriverAvailable(true);
    setStoreSettings(defaultStoreSettings);
    setPaymentGatewaySettings(defaultPaymentGatewaySettings);
    setCashSettlements([]);
    setFixedAmountQRs(demoFixedAmountQRs);
    localStorage.removeItem('tacticos_store_categories');
    localStorage.removeItem('tacticos_store_products');
    localStorage.removeItem('tacticos_store_alerts');
    localStorage.removeItem('tacticos_store_orders');
    localStorage.removeItem('tacticos_store_shipping_zones');
    localStorage.removeItem('tacticos_store_driver_earnings');
    localStorage.removeItem('tacticos_driver_available');
    localStorage.removeItem('tacticos_store_settings');
    localStorage.removeItem('tacticos_payment_gateway_settings');
    localStorage.removeItem('tacticos_cash_settlements');
    localStorage.removeItem('tacticos_fixed_amount_qrs');
    toast.info('Datos restaurados a valores de fábrica para Bolivia');
  };

  return (
    <StoreContext.Provider
      value={{
        categories,
        products,
        alerts,
        orders,
        shippingZones,
        driverEarnings,
        isDriverAvailable,
        storeSettings,
        updateStoreSettings,
        paymentGatewaySettings,
        updatePaymentGatewaySettings,
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        addShippingZone,
        updateShippingZone,
        deleteShippingZone,
        resetShippingZonesToDefaults,
        createOrder,
        adminSetOrderStatus,
        adminAssignDriver,
        driverAcceptOrder,
        driverPickupOrder,
        driverInTransit,
        driverDeliverOrder,
        rateDriver,
        cancelOrder,
        toggleDriverAvailability,
        settleDriverEarnings,
        cashSettlements,
        getDriverCashOwed,
        submitCashSettlement,
        reviewCashSettlement,
        fixedAmountQRs,
        addFixedAmountQR,
        updateFixedAmountQR,
        deleteFixedAmountQR,
        toggleFixedAmountQRStatus,
        getQRForAmount,
        resolveAlert,
        resetToDefaults,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
