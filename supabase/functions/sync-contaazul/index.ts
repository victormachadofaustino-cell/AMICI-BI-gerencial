import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, companyId } = await req.json()

    if (!companyId) {
      throw new Error("Parâmetro 'companyId' não fornecido.")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Busca credenciais e tokens atuais
    const { data: empresa, error: fetchError } = await supabaseAdmin
      .from('empresas')
      .select('conta_azul_client_id, conta_azul_client_secret, refresh_token, access_token, expires_at, ativado')
      .eq('id', companyId)
      .single()

    if (fetchError || !empresa) throw new Error("Empresa não encontrada ou credenciais ausentes.")

    const agora = new Date()
    const expirado = empresa.expires_at ? new Date(empresa.expires_at) <= agora : true
    let currentAccessToken = empresa.access_token

    // 2. Lógica de Refresh Token (Se necessário)
    if (code || (empresa.ativado && expirado)) {
      const authHeader = btoa(`${empresa.conta_azul_client_id}:${empresa.conta_azul_client_secret}`)
      const payload = code 
        ? { grant_type: "authorization_code", redirect_uri: "https://amici-bi-gerencial.vercel.app", code }
        : { grant_type: "refresh_token", refresh_token: empresa.refresh_token }

      const tokenResponse = await fetch("https://api.contaazul.com/oauth2/token", {
        method: "POST",
        headers: { "Authorization": `Basic ${authHeader}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok) throw new Error(`Erro Conta Azul Token: ${tokenData.error_description || tokenData.error}`)

      currentAccessToken = tokenData.access_token
      
      await supabaseAdmin.from('empresas').update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
        ativado: true,
        updated_at: new Date().toISOString()
      }).eq('id', companyId)
    }

    // 3. Sincronização de Vendas e Financeiro (Se já estiver ativado)
    if (currentAccessToken) {
      const apiHeaders = { "Authorization": `Bearer ${currentAccessToken}`, "Content-Type": "application/json" }

      // Buscar Vendas
      const vRes = await fetch("https://api.contaazul.com/v1/sales", { headers: apiHeaders })
      if (vRes.ok) {
        const vendas = await vRes.json()
        for (const v of (vendas || [])) {
          await supabaseAdmin.from('vendas').upsert({
            empresa_id: companyId,
            ca_venda_id: v.id,
            valor_total: v.total,
            data_emissao: v.emission,
            status_venda: v.status,
            dados_brutos: v
          }, { onConflict: 'ca_venda_id' })
        }
      }

      // Buscar Financeiro (Recebíveis)
      const fRes = await fetch("https://api.contaazul.com/v1/receivables", { headers: apiHeaders })
      if (fRes.ok) {
        const financeiro = await fRes.json()
        for (const f of (financeiro || [])) {
          await supabaseAdmin.from('financeiro').upsert({
            empresa_id: companyId,
            ca_id: f.id,
            tipo: 'RECEBIVEL',
            descricao: f.description,
            valor: f.value,
            data_vencimento: f.due_date,
            status: f.status,
            dados_brutos: f
          }, { onConflict: 'ca_id' })
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Dados sincronizados com sucesso!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    )
  }
})