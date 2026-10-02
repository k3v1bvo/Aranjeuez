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
    <div style={{ minHeight:"100vh", background:"#0b0a16", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#a78bfa", fontSize:"1.2rem" }}>Cargando ecosistema...</div>
    </div>
  )

  return (
    <div style={{ minHeight:"100vh", background:"#0b0a16", fontFamily:"'Segoe UI', system-ui, sans-serif", color:"#fff", paddingBottom: "4rem" }}>
      {/* Nav */}
      <nav style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"1rem 1.8rem", borderBottom:"1px solid rgba(255,255,255,0.08)",
        position:"sticky", top:0, zIndex:50, background:"rgba(11,10,22,0.85)", backdropFilter:"blur(16px)"
      }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:"0.6rem", textDecoration:"none", color:"#fff" }}>
          <div style={{
            width: "36px", height: "36px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem"
          }}>🛍️</div>
          <div>
            <span style={{ fontWeight:800, fontSize:"1.05rem", display: "block", lineHeight: 1.1 }}>PaseoYa</span>
            <span style={{ fontSize: "0.68rem", color: "#a78bfa", fontWeight: 600 }}>Marketplace Oficial</span>
          </div>
        </Link>

        <div style={{ display:"flex", gap:"0.7rem", alignItems:"center", flexWrap: "wrap" }}>
          <Link href="/jarvis" style={{ padding:"0.45rem 0.9rem", borderRadius:"10px", background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)", color:"#34d399", textDecoration:"none", fontSize:"0.85rem", fontWeight: 600 }}>
            🤖 Jarvis IA
          </Link>
          <Link href="/cliente/puntos" style={{ padding:"0.45rem 0.9rem", borderRadius:"10px", background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.3)", color:"#fbbf24", textDecoration:"none", fontSize:"0.85rem", fontWeight: 600 }}>
            ⭐ {user.points} pts
          </Link>
          <Link href="/cliente/pedidos" style={{ padding:"0.45rem 0.9rem", borderRadius:"10px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", textDecoration:"none", fontSize:"0.85rem", fontWeight: 600 }}>
            🛍️ Pedidos
          </Link>
          <Link href="/cliente/perfil" style={{ padding:"0.45rem 0.9rem", borderRadius:"10px", background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", color:"#c4b5fd", textDecoration:"none", fontSize:"0.85rem", fontWeight: 600 }}>
            👤 Mi QR
          </Link>
          <button onClick={() => logout().then(() => router.push("/"))} style={{ padding:"0.45rem 0.8rem", borderRadius:"10px", background:"none", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:"0.85rem" }}>
            Salir
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"1.8rem 1.5rem" }}>
        
        {/* Bienvenida + Tarjeta de Nivel */}
        <div style={{ marginBottom:"2rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1.2rem" }}>
          <div>
            <h1 style={{ fontSize:"1.8rem", fontWeight:800, margin:"0 0 0.3rem" }}>¡Hola, {user.name.split(" ")[0]}! 👋</h1>
            <p style={{ color:"rgba(255,255,255,0.6)", margin:0, fontSize:"0.95rem" }}>
              Explora las tiendas de Paseo Aranjuez, haz tus pedidos con retiro presencial y acumula puntos.
            </p>
          </div>
          {levelInfo && (
            <div style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${levelInfo.color}44`, borderRadius:"16px", padding:"0.9rem 1.4rem", minWidth:"200px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.4rem" }}>
                <span style={{ color:levelInfo.color, fontWeight:700, fontSize:"0.9rem" }}>⭐ Nivel {levelInfo.label}</span>
                <span style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.82rem", fontWeight: 600 }}>{user.points} pts</span>
              </div>
              <div style={{ height:"6px", background:"rgba(255,255,255,0.1)", borderRadius:"99px", overflow: "hidden" }}>
                <div style={{ height:"100%", background:levelInfo.color, borderRadius:"99px", width: user.level==="platino" ? "100%" : `${Math.min(100, Math.round((user.points - levelInfo.min) / (levelInfo.max - levelInfo.min) * 100))}%`, transition:"width 0.5s" }} />
              </div>
            </div>
          )}
        </div>

        {/* Buscador + Jarvis */}
        <div style={{ marginBottom:"1.8rem", display:"flex", gap:"0.8rem", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar tiendas, productos, categorías o servicios..."
            style={{
              flex:1, minWidth: "260px", padding:"0.85rem 1.2rem", borderRadius:"14px",
              border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.05)",
              color:"#fff", fontSize:"0.95rem", outline:"none"
            }}
          />
          <Link href="/jarvis" style={{
            padding:"0.85rem 1.4rem", borderRadius:"14px",
            background:"linear-gradient(135deg,#059669,#10b981)", border:"none",
            color:"#fff", fontSize:"0.9rem", fontWeight:700, textDecoration:"none",
            whiteSpace:"nowrap", display:"flex", alignItems:"center", gap: "8px",
            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
          }}>
            🤖 Pregúntale a Jarvis IA
          </Link>
        </div>

        {/* Categorías */}
        <div style={{ display:"flex", gap:"0.6rem", marginBottom:"2rem", overflowX:"auto", paddingBottom:"0.5rem" }}>
          <button
            onClick={() => setCategory("")}
            style={{
              padding:"0.55rem 1.2rem", borderRadius:"100px",
              border:`1px solid ${!category?"#7c3aed":"rgba(255,255,255,0.15)"}`,
              background: !category?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.04)",
              color:"#fff", cursor:"pointer", whiteSpace:"nowrap", fontSize:"0.88rem", fontWeight: 600,
            }}
          >
            🏬 Todas las Tiendas
          </button>
          {STORE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id === category ? "" : cat.id)}
              style={{
                padding:"0.55rem 1.2rem", borderRadius:"100px",
                border:`1px solid ${category===cat.id?cat.color+"88":"rgba(255,255,255,0.15)"}`,
                background: category===cat.id?`${cat.color}25`:"rgba(255,255,255,0.04)",
                color: category===cat.id?cat.color:"#fff", cursor:"pointer", whiteSpace:"nowrap", fontSize:"0.88rem", fontWeight: 600,
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Productos destacados */}
        {featured.length > 0 && !search && !category && (
          <section style={{ marginBottom:"2.5rem" }}>
            <h2 style={{ fontSize:"1.25rem", fontWeight:800, marginBottom:"1rem", color:"rgba(255,255,255,0.9)" }}>
              ⭐ Productos Destacados del Paseo
            </h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:"1.2rem" }}>
              {featured.slice(0, 4).map(p => (
                <div key={p.id} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"18px", overflow:"hidden" }}>
                  <div style={{ height:"120px", background:`linear-gradient(135deg,rgba(124,58,237,0.25),rgba(79,70,229,0.25))`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem" }}>
                    🛍️
                  </div>
                  <div style={{ padding:"1rem" }}>
                    <p style={{ margin:"0 0 0.4rem", fontWeight:700, fontSize:"0.95rem" }}>{p.name}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color:"#34d399", fontWeight:800, fontSize: "1.1rem" }}>Bs. {p.price}</span>
                      <span style={{ color: "#fbbf24", fontSize: "0.75rem", fontWeight: 700 }}>+{Math.floor(p.price)} Pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tiendas */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
            <h2 style={{ fontSize:"1.25rem", fontWeight:800, margin: 0, color:"rgba(255,255,255,0.9)" }}>
              🏬 {filteredStores.length} {category ? "tiendas en esta categoría" : "tiendas en Paseo Aranjuez"}
            </h2>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
              Retiro presencial en tienda
            </span>
          </div>

          {fetching ? (
            <div style={{ textAlign:"center", padding:"3rem", color:"rgba(255,255,255,0.4)" }}>Cargando tiendas...</div>
          ) : filteredStores.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem", color:"rgba(255,255,255,0.4)" }}>
              <p style={{ fontSize:"2rem", margin: "0 0 8px 0" }}>🔍</p>
              <p style={{ margin: "0 0 12px 0" }}>No encontramos tiendas con esos criterios.</p>
              <button onClick={() => { setSearch(""); setCategory("") }} style={{ background:"rgba(124,58,237,0.2)", border:"1px solid #7c3aed", color:"#c4b5fd", padding: "6px 14px", borderRadius: "8px", cursor:"pointer", fontWeight: 600 }}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:"1.4rem" }}>
              {filteredStores.map(store => {
                const cat = STORE_CATEGORIES.find(c => c.id === store.category)
                return (
                  <Link key={store.id} href={`/cliente/tiendas/${store.id}`} style={{ textDecoration:"none" }}>
                    <div style={{
                      background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:"20px", padding: "1.6rem", transition:"all 0.2s ease", cursor:"pointer",
                      display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box"
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform="translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.borderColor=cat?.color+"88" || "rgba(255,255,255,0.3)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform="translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor="rgba(255,255,255,0.1)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                        <span style={{
                          background: `${cat?.color || "#7c3aed"}22`, color: cat?.color || "#c4b5fd",
                          padding: "3px 10px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase"
                        }}>
                          {cat?.icon} {cat?.label || store.category}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#a78bfa", fontWeight: 600 }}>
                          {store.floor} • {store.local_num}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.4rem 0", color: "#fff" }}>
                        {store.name}
                      </h3>

                      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 1.2rem 0", flex: 1 }}>
                        {store.description}
                      </p>

                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)"
                      }}>
                        <span>🕒 {store.schedule?.split(",")[0] || "Abierto hoy"}</span>
                        <span style={{ color: "#34d399", fontWeight: 700 }}>Ver Catálogo →</span>
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