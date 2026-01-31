import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { LayoutDashboard, Building2, RefreshCw, Filter } from 'lucide-react'

export default function App() {
  const [vendas, setVendas] = useState([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState('Todas')
  const [carregando, setCarregando] = useState(true)

  // Extrai a lista de nomes de empresas únicas que existem nas vendas
  const listaEmpresas = ['Todas', ...new Set(vendas.map(v => v.empresa_nome).filter(Boolean))]

  async function buscarDados() {
    setCarregando(true)
    const { data, error } = await supabase.from('vendas').select('*')
    if (!error && data) setVendas(data)
    setCarregando(false)
  }

  useEffect(() => { buscarDados() }, [])

  // Filtra as vendas na tela baseado na escolha do usuário
  const vendasFiltradas = empresaSelecionada === 'Todas' 
    ? vendas 
    : vendas.filter(v => v.empresa_nome === empresaSelecionada)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <h1 className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <LayoutDashboard size={24} /> Amici BI <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">BPO Edition</span>
        </h1>
        
        {/* FILTRO DE EMPRESAS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border">
            <Filter size={16} className="text-slate-500" />
            <select 
              className="bg-transparent outline-none text-sm font-medium"
              value={empresaSelecionada}
              onChange={(e) => setEmpresaSelecionada(e.target.value)}
            >
              {listaEmpresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>
          <button onClick={buscarDados} className="p-2 hover:bg-slate-100 rounded-full transition">
            <RefreshCw size={20} className={carregando ? "animate-spin text-blue-500" : "text-slate-600"} />
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold">Resumo: {empresaSelecionada}</h2>
            <p className="text-slate-500">Visualizando dados de faturamento consolidados.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm font-medium uppercase">Volume de Vendas</p>
            <h2 className="text-4xl font-extrabold mt-2 text-blue-600">{vendasFiltradas.length}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm font-medium uppercase">Faturamento Bruto</p>
            <h2 className="text-4xl font-extrabold mt-2 text-green-600">
              R$ {vendasFiltradas.reduce((acc, v) => acc + (Number(v.valor) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {vendasFiltradas.map((v) => (
              <div key={v.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{v.cliente_nome}</p>
                    <p className="text-[10px] text-blue-500 font-bold uppercase">{v.empresa_nome}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">R$ {Number(v.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}