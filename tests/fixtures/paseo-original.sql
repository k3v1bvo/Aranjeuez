-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.paseo_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  name text NOT NULL,
  phone text,
  role text DEFAULT 'cliente'::text CHECK (role = ANY (ARRAY['cliente'::text, 'comercio'::text, 'admin'::text])),
  qr_token text DEFAULT (gen_random_uuid())::text UNIQUE,
  points integer DEFAULT 0,
  level text DEFAULT 'bronce'::text CHECK (level = ANY (ARRAY['bronce'::text, 'plata'::text, 'oro'::text, 'platino'::text])),
  birthday date,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paseo_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.paseo_stores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  floor text,
  sector text,
  local_num text,
  schedule text,
  image_url text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paseo_stores_pkey PRIMARY KEY (id),
  CONSTRAINT paseo_stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.paseo_users(id)
);
CREATE TABLE public.paseo_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text,
  stock integer DEFAULT 10,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paseo_products_pkey PRIMARY KEY (id),
  CONSTRAINT paseo_products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.paseo_stores(id)
);
CREATE TABLE public.paseo_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid,
  store_id uuid,
  status text DEFAULT 'recibido'::text CHECK (status = ANY (ARRAY['recibido'::text, 'preparando'::text, 'listo'::text, 'llego'::text, 'entregado'::text, 'cancelado'::text])),
  total numeric NOT NULL,
  pickup_code text NOT NULL,
  qr_token text DEFAULT (gen_random_uuid())::text UNIQUE,
  notes text,
  points_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paseo_orders_pkey PRIMARY KEY (id),
  CONSTRAINT paseo_orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.paseo_users(id),
  CONSTRAINT paseo_orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.paseo_stores(id)
);
CREATE TABLE public.paseo_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  product_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  CONSTRAINT paseo_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT paseo_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.paseo_orders(id),
  CONSTRAINT paseo_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.paseo_products(id)
);
CREATE TABLE public.paseo_point_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  amount integer NOT NULL,
  concept text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paseo_point_movements_pkey PRIMARY KEY (id),
  CONSTRAINT paseo_point_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.paseo_users(id)
);
CREATE TABLE public.paseo_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  category text DEFAULT 'descuento'::text,
  stock integer DEFAULT '-1'::integer,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paseo_rewards_pkey PRIMARY KEY (id)
);
CREATE TABLE public.paseo_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  reward_id uuid,
  code text NOT NULL UNIQUE,
  is_used boolean DEFAULT false,
  expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paseo_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT paseo_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.paseo_users(id),
  CONSTRAINT paseo_redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.paseo_rewards(id)
);
CREATE TABLE public.paseo_promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  store_id uuid,
  discount text,
  expires_at date,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paseo_promotions_pkey PRIMARY KEY (id),
  CONSTRAINT paseo_promotions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.paseo_stores(id)
);
CREATE TABLE public.paseo_cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paseo_cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT paseo_cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.paseo_users(id),
  CONSTRAINT paseo_cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.paseo_products(id)
);