import { supabase } from '../supabaseClient';

export const contaAzulService = {
  async ativarEmpresa(code, companyId) {
    const { data, error } = await supabase.functions.invoke('sync-contaazul', {
      body: { code, companyId }
    });

    if (error) throw new Error(error.message || 'Falha na comunicação com o servidor');
    
    return data;
  },

  async sincronizarDados(companyId) {
    const { data, error } = await supabase.functions.invoke('sync-contaazul', {
      body: { companyId }
    });

    if (error) throw new Error(error.message || 'Falha na sincronização de dados');

    return data;
  }
};