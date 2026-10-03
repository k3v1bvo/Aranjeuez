'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { Toaster, toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { CartItem, Product, User } from '@/lib/paseo/model';

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch('/api/paseo/' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    cache: 'no-store',
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('El servidor no respondió correctamente. Vuelve a intentar.');
  }
  if (!response.ok) throw new Error(data.error || 'No pudimos completar la solicitud.');
  return data as T;
}
export function useResource<T>(path: string | null, poll = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    async function load() {
      try {
        const result = await api<T>(path!, { signal: controller.signal });
        setData(result);
        setError('');
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Error de conexión.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    const timer = poll ? window.setInterval(load, poll) : null;
    return () => {
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, [path, poll, version]);
  return { data, error, loading, reload };
}
interface SessionContext {
  user: User | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}
const Auth = createContext<SessionContext | null>(null);
export function useSession() {
  const value = useContext(Auth);
  if (!value) throw new Error('Falta el proveedor de sesión.');
  return value;
}
const CART = 'paseo-cart-v2';
const getCartSnapshot = () => {
  try {
    return window.localStorage.getItem(CART) || '[]';
  } catch {
    return '[]';
  }
};
const subscribeCart = (notify: () => void) => {
  window.addEventListener('storage', notify);
  window.addEventListener('paseo-cart', notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener('paseo-cart', notify);
  };
};
export function useCart() {
  const raw = useSyncExternalStore(subscribeCart, getCartSnapshot, () => '[]');
  const items = useMemo<CartItem[]>(() => {
    try {
      const values = JSON.parse(raw);
      return Array.isArray(values)
        ? values.filter((v) => v?.product?.id && Number.isInteger(v.quantity) && v.quantity > 0)
        : [];
    } catch {
      return [];
    }
  }, [raw]);
  const save = (value: CartItem[]) => {
    try {
      localStorage.setItem(CART, JSON.stringify(value));
      window.dispatchEvent(new Event('paseo-cart'));
    } catch {
      toast.error('No pudimos guardar el carrito en este navegador.');
    }
  };
  return {
    items,
    total: items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    clear: () => save([]),
    remove: (id: string) => save(items.filter((i) => i.product.id !== id)),
    quantity: (id: string, qty: number) =>
      save(
        items.map((i) =>
          i.product.id === id
            ? { ...i, quantity: Math.max(1, Math.min(100, i.product.stock, qty)) }
            : i,
        ),
      ),
    add: (product: Product) => {
      if (product.stock < 1) {
        toast.error('Este producto está agotado.');
        return;
      }
      if (items.length && items[0].product.store_id !== product.store_id) {
        toast.info(
          'Finaliza el pedido de tu tienda actual o vacía el carrito antes de comprar en otra.',
        );
        return;
      }
      const existing = items.find((i) => i.product.id === product.id);
      if (existing && existing.quantity >= Math.min(product.stock, 100)) {
        toast.info('Ya agregaste la cantidad disponible.');
        return;
      }
      save(
        existing
          ? items.map((i) =>
              i.product.id === product.id ? { product, quantity: i.quantity + 1 } : i,
            )
          : [...items, { product, quantity: 1 }],
      );
      toast.success(`${product.name} agregado al carrito`);
    },
  };
}
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: User | null }>('auth');
      setUser(data.user);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos consultar la sesión.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api<{ user: User | null }>('auth', { signal: controller.signal })
      .then((data) => {
        setUser(data.user);
        setError('');
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'No pudimos consultar la sesión.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  async function logout() {
    await api('auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
    setUser(null);
    toast.success('Sesión cerrada');
    router.push('/');
    router.refresh();
  }
  return (
    <Auth.Provider value={{ user, loading, error, refresh, setUser, logout }}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </Auth.Provider>
  );
}
