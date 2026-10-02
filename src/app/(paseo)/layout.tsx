import type { Metadata } from "next"
import { PaseoAuthProvider } from "@/context/paseo/AuthContext"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Paseo Aranjuez — Ecosistema Digital",
  description: "PaseoYa, Paseo Points y Jarvis. El ecosistema digital de Paseo Aranjuez.",
}

export default function PaseoLayout({ children }: { children: React.ReactNode }) {
  return (
    <PaseoAuthProvider>
      <div className="paseo-app">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </div>
    </PaseoAuthProvider>
  )
}
