import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

// Linha 3: Inicialização do servidor Deno para a Edge Function do Supabase
Deno.serve(async (req) => {
  // Linhas 5-6: Conexão com o banco usando credenciais de ambiente internas
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Linhas 11-14: Busca todas as 6 empresas cadastradas na tabela profissional
    const { data: empresas, error: dbError } = await supabase
      .from('empresas')
      .select('*');

    if (dbError) throw dbError;

    const resultados = [];

    // Linha 20: Início da iteração pelas contas (Multi-tenant)
    for (const empresa of empresas) {
      try {
        let tokenAtual = empresa.access_token;
        
        // Linha 25: Lógica de expiração (Margem de 5 minutos para segurança)
        const agora = new Date().getTime();
        const expiraEm = empresa.expires_at ? new Date(empresa.expires_at).getTime() : 0;
        const expirado = expiraEm <= (agora + 300000);

        if (expirado && empresa.refresh_token) {
          // Linha 30: Renovação automática se houver refresh_token disponível
          tokenAtual = await realizarRefresh(empresa, supabase);
        }

        resultados.push({ empresa: empresa.nome_exibicao, status: "Pronto para Sincronizar" });
      } catch (e) {
        resultados.push({ empresa: empresa.nome_exibicao, status: "Erro", detalhe: e.message });
      }
    }

    return new Response(JSON.stringify(resultados), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ erro: "Falha na varredura das empresas" }), { status: 500 });
  }
});

// Linha 51: Função auxiliar para renovar tokens de qualquer uma das 6 empresas
async function realizarRefresh(empresa: any, supabase: any) {
  const authHeader = btoa(`${empresa.conta_azul_client_id}:${empresa.conta_azul_client_secret}`);
  
  const resp = await fetch("https://api.contaazul.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      "grant_type": "refresh_token",
      "refresh_token": empresa.refresh_token
    })
  });

  if (!resp.ok) throw new Error("Erro na comunicação com Conta Azul");

  const dados = await resp.json();
  
  // Linha 72: Atualização persistente no banco de dados para evitar nova troca manual
  await supabase.from('empresas').update({
    access_token: dados.access_token,
    refresh_token: dados.refresh_token,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    status: 'ativo'
  }).eq('id', empresa.id);

  return dados.access_token;
}