"use client"
import { useEffect } from "react"
import { getPublicDB } from "./supabase"
import type { PaseoOrder } from "./types"

export function useRealtimeOrders(onOrderUpdate: (order: PaseoOrder) => void) {
  useEffect(() => {
    const supabase = getPublicDB()
    const channel = supabase
      .channel("public:paseo_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "paseo_orders" },
        (payload) => {
          if (payload.new) {
            onOrderUpdate(payload.new as PaseoOrder)
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[WebSocket] Conectado a canal en vivo de pedidos Paseo Aranjuez")
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onOrderUpdate])
}

export function useRealtimePoints(userId: string | undefined, onPointChange: (movement: any) => void) {
  useEffect(() => {
    if (!userId) return
    const supabase = getPublicDB()
    const channel = supabase
      .channel(`public:points_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "paseo_point_movements",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            onPointChange(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onPointChange])
}