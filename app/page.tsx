"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [status, setStatus] = useState("Testando conexão...");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      setStatus(error ? `Erro: ${error.message}` : "Conectado ao Supabase ✅");
    })();
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Projeto Social da Igreja</h1>
      <p>Deploy automático funcionando no Vercel</p>
    </main>
  );
}
