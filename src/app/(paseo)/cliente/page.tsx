"use client"
import { useState, useEffect } from "react"
import { usePaseoAuth } from "@/context/paseo/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { PaseoStore, PaseoProduct } from "@/lib/paseo/types"
import { STORE_CATEGORIES, LEVEL_THRESHOLDS } from "@/lib/paseo/types"

export default function ClienteHomePage() {
  const { user, loading, logout } = usePaseoAuth()
  const router = useRouter()
  const [stores, setStores] = useState<PaseoStore[]>([])
  const [featured, setFeatured] = useState<PaseoProduct[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login")
  }, [user, loading, router])

  useEffect(() => {
    Promise.all([
      fetch(`/api/paseo/tiendas${category ? `?category=${category}` : ""}`).then(r => r.json()),
      fetch("/api/paseo/productos?featured=true").then(r => r.json()),
    ]).then(([storesData, featData]) => {
      setStores(storesData.stores || [])
      setFeatured(featData.products || [])
      setFetching(false)
    })
  }, [category])

  const filteredStores = stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const levelInfo = user ? LEVEL_THRESHOLDS[user.level] : null

  if (loading || !user) return (
    <div style={{ minHeight:"100vh", background:"#0f0c29", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#a78bfa", fontSize:"1.2rem" }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ minHeight:"100vh", background:"#0f0c29", fontFamily:"system-ui,sans-serif", color:"#fff" }}>
      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.5rem", borderBottom:"1px solid rgba(255,255,255,0.08)", position:"sticky", top:0, zIndex:50, background:"rgba(15,12,41,0.9)", backdropFilter:"blur(12px)" }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:"0.5rem", textDecoration:"none", color:"#fff" }}>
          <span style={{ fontSize:"1.5rem" }}>🏛️</span>
          <span style={{ fontWeight:700, fontSize:"1rem" }}>PaseoYa</span>
        </Link>
        <div style={{ display:"flex", gap:"0.8rem", alignItems:"center" }}>
          <Link href="/jarvis" style={{ padding:"0.4rem 0.9rem", borderRadius:"8px", background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)", color:"#34d399", textDecoration:"none", fontSize:"0.85rem" }}>🤖 Jarvis</Link>
          <Link href="/cliente/puntos" style={{ padding:"0.4rem 0.9rem", borderRadius:"8px", background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.3)", color:"#fbbf24", textDecoration:"none", fontSize:"0.85rem" }}>⭐ {user.points} pts</Link>
          <Link href="/cliente/pedidos" style={{ padding:"0.4rem 0.9rem", borderRadius:"8px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", textDecoration:"none", fontSize:"0.85rem" }}>📦 Pedidos</Link>
          <button onClick={() => logout().then(() => router.push("/"))} style={{ padding:"0.4rem 0.9rem", borderRadius:"8px", background:"none", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:"0.85rem" }}>Salir</button>
        </div>
      </nav>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"1.5rem" }}>
        {/* Bienvenida + nivel */}
        <div style={{ marginBottom:"1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h1 style={{ fontSize:"1.6rem", fontWeight:800, margin:"0 0 0.2rem" }}>Hola, {user.name.split(" ")[0]} 👋</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", margin:0, fontSize:"0.9rem" }}>¿Qué quieres encontrar hoy en Paseo Aranjuez?</p>
          </div>
          {levelInfo && (
            <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${levelInfo.color}44`, borderRadius:"12px", padding:"0.8rem 1.2rem", minWidth:"180px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.4rem" }}>
                <span style={{ color:levelInfo.color, fontWeight:700, fontSize:"0.9rem" }}>🏆 {levelInfo.label}</span>
                <span style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.8rem" }}>{user.points} pts</span>
              </div>
              <div style={{ height:"4px", background:"rgba(255,255,255,0.1)", borderRadius:"2px" }}>
                <div style={{ height:"100%", background:levelInfo.color, borderRadius:"2px", width: user.level==="platino" ? "100%" : `${Math.min(100, Math.round((user.points - levelInfo.min) / (levelInfo.max - levelInfo.min) * 100))}%`, transition:"width 0.5s" }} />
              </div>
            </div>
          )}
        </div>

        {/* Buscador */}
        <div style={{ marginBottom:"1.5rem", display:"flex", gap:"0.8rem" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar tiendas o productos..."
            style={{ flex:1, padding:"0.85rem 1.2rem", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:"1rem", outline:"none" }} />
          <Link href="/jarvis" style={{ padding:"0.85rem 1.2rem", borderRadius:"12px", background:"linear-gradient(135deg,#059669,#10b981)", border:"none", color:"#fff", fontSize:"0.9rem", fontWeight:600, textDecoration:"none", whiteSpace:"nowrap", display:"flex", alignItems:"center" }}>
            🤖 Pregúntale a Jarvis
          </Link>
        </div>

        {/* Categorías */}
        <div style={{ display:"flex", gap:"0.6rem", marginBottom:"1.5rem", overflowX:"auto", paddingBottom:"0.5rem" }}>
          <button onClick={() => setCategory("")} style={{ padding:"0.5rem 1rem", borderRadius:"100px", border:`1px solid ${!category?"#7c3aed":"rgba(255,255,255,0.15)"}`, background: !category?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.05)", color:"#fff", cursor:"pointer", whiteSpace:"nowrap", fontSize:"0.85rem" }}>
            🏪 Todas
          </button>
          {STORE_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id === category ? "" : cat.id)}
              style={{ padding:"0.5rem 1rem", borderRadius:"100px", border:`1px solid ${category===cat.id?cat.color+"66":"rgba(255,255,255,0.15)"}`, background: category===cat.id?`${cat.color}22`:"rgba(255,255,255,0.05)", color: category===cat.id?cat.color:"#fff", cursor:"pointer", whiteSpace:"nowrap", fontSize:"0.85rem" }}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Productos destacados */}
        {featured.length > 0 && !search && !category && (
          <section style={{ marginBottom:"2rem" }}>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, marginBottom:"1rem", color:"rgba(255,255,255,0.9)" }}>⚡ Destacados</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:"1rem" }}>
              {featured.slice(0, 4).map(p => (
                <div key={p.id} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"14px", overflow:"hidden" }}>
                  <div style={{ height:"120px", background:`linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.3))`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem" }}>
                    📦
                  </div>
                  <div style={{ padding:"0.8rem" }}>
                    <p style={{ margin:"0 0 0.3rem", fontWeight:600, fontSize:"0.9rem" }}>{p.name}</p>
                    <p style={{ margin:0, color:"#a78bfa", fontWeight:700 }}>Bs. {p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tiendas */}
        <section>
          <h2 style={{ fontSize:"1.1rem", fontWeight:700, marginBottom:"1rem", color:"rgba(255,255,255,0.9)" }}>
            🏪 {filteredStores.length} {category ? "tiendas en esta categoría" : "tiendas disponibles"}
          </h2>
          {fetching ? (
            <div style={{ textAlign:"center", padding:"3rem", color:"rgba(255,255,255,0.4)" }}>Cargando tiendas...</div>
          ) : filteredStores.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem", color:"rgba(255,255,255,0.4)" }}>
              <p style={{ fontSize:"2rem" }}>🔍</p>
              <p>No encontramos tiendas. <button onClick={() => { setSearch(""); setCategory("") }} style={{ background:"none", border:"none", color:"#a78bfa", cursor:"pointer" }}>Limpiar filtros</button></p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:"1.2rem" }}>
              {filteredStores.map(store => {
                const cat = STORE_CATEGORIES.find(c => c.id === store.category)
                return (
                  <Link key={store.id} href={`/cliente/tiendas/${store.id}`} style={{ textDecoration:"none" }}>
                    <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"16px", overflow:"hidden", transition:"transform 0.2s,border-color 0.2s", cursor:"pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform="translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.borderColor=cat?.color+"66" || "rgba(255,255,255,0.2)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform="translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor="rgba(255,255,255,0.1)" }}>
                      <div style={{ height:"100px", background:`linear-gradient(135deg,${cat?.color || "#4f46e5"}33,${cat?.color || "#7c3aed"}11)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3rem" }}>
                        {cat?.icon || "🏪"}
                      </div>
                      <div style={{ padding:"1rem" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.4rem" }}>
                          <h3 style={{ margin:0, fontSize:"1rem", fontWeight:700, color:"#fff" }}>{store.name}</h3>
                          <span style={{ fontSize:"0.7rem", padding:"0.2rem 0.6rem", borderRadius:"100px", background:`${cat?.color || "#4f46e5"}22`, color: cat?.color || "#a78bfa" }}>{cat?.label || store.category}</span>
                        </div>
                        <p style={{ margin:"0 0 0.8rem", fontSize:"0.82rem", color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>{store.description?.slice(0, 60)}...</p>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)" }}>
                          <span>📍 {store.floor}, {store.local_num}</span>
                          <span>🕐 {store.schedule?.split(",")[0]}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}