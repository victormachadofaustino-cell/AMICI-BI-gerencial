import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useContaAzulAuth } from './hooks/useContaAzulAuth';
import { contaAzulService } from './services/contaAzulService';

export default function App() {
  const [empresa, setEmpresa] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const { status, error, processarAuth } = useContaAzulAuth();

  // CONFIGURAÇÃO - Deve ser IGUAL ao painel do Conta Azul
  const CLIENT_ID = "21f1rfs2bj8pl0pml94hrpf2ch";
  const REDIRECT_URI = "https://amici-bi-gerencial.vercel.app";
  const SCOPE = "sales"; 
  // CORREÇÃO: Declarando a variável que estava faltando para o código funcionar
  const COMPANY_ID = "b6739d59-7b44-4411-a252-27964f11641b";
  
  const carregarDadosLocais = async () => {
    // Busca status da empresa
    const { data: emp } = await supabase.from('empresas').select('*').eq('id', COMPANY_ID).single();
    setEmpresa(emp);

    // Busca dados para confirmar que a conexão salvou algo no banco
    if (emp?.ativado) {
      const { data: vds } = await supabase.from('vendas').select('*').limit(5);
      const { data: fin } = await supabase.from('financeiro').select('*').limit(5);
      setVendas(vds || []);
      setFinanceiro(fin || []);
    }
  };

  const executarSincronizacao = async () => {
    try {
      await contaAzulService.sincronizarDados(COMPANY_ID);
      await carregarDadosLocais();
    } catch (err) {
      console.error("Erro ao sincronizar:", err.message);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    const gerenciarConexao = async () => {
      // Se houver código na URL, processa a ativação inicial
      if (code && state) {
        await processarAuth(code, state);
        // Limpa a URL para evitar reuso do código ao dar F5
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Se não houver código, tenta apenas validar/refresh o token silenciosamente
        processarAuth(null, COMPANY_ID);
      }

      await carregarDadosLocais();
    };

    gerenciarConexao();
  }, [processarAuth]);

  // AJUSTE CRÍTICO: Adicionado response_type=code para evitar erro 500 invalid_client
  const linkAutorizacao = `https://api.contaazul.com/auth/authorize?client_id=${CLIENT_ID}&scope=${SCOPE}&redirect_uri=${REDIRECT_URI}&state=${COMPANY_ID}&response_type=code`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Amici BI</h1>
        <p className="text-gray-500 mb-6">Gestão Auto Capas Mustha</p>

        {empresa && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Status da Conexão</p>
            <div className="flex items-center justify-center gap-2">
              <span className={`h-3 w-3 rounded-full ${empresa.ativado ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              <span className="font-medium text-gray-700">
                {empresa.ativado ? 'Conta Azul Conectado' : 'Integração Pendente'}
              </span>
            </div>
          </div>
        )}

        {!empresa?.ativado ? (
          <a 
            href={linkAutorizacao}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-none"
          >
            Conectar Conta Azul
          </a>
        ) : (
          <button 
            onClick={executarSincronizacao}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Sincronizar Vendas e Financeiro
          </button>
        )}

        {(status || error) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className={`text-sm ${error ? 'text-red-500' : 'text-blue-600 animate-pulse'}`}>
              {status || error}
            </p>
          </div>
        )}
      </div>

      {/* Visualização Simples para Teste de Conexão */}
      {empresa?.ativado && (
        <div className="mt-8 w-full max-w-2xl grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-sm mb-2">Vendas Recentes</h3>
            {vendas.length > 0 ? (
              vendas.map(v => <div key={v.id} className="text-xs border-b py-1">R$ {v.valor_total} - {v.status_venda}</div>)
            ) : <p className="text-xs text-gray-400">Aguardando sincronização...</p>}
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-sm mb-2">Lançamentos Financeiros</h3>
            {financeiro.length > 0 ? (
              financeiro.map(f => <div key={f.id} className="text-xs border-b py-1">R$ {f.valor} - {f.status}</div>)
            ) : <p className="text-xs text-gray-400">Aguardando sincronização...</p>}
          </div>
        </div>
      )}
    </div>
  );
}