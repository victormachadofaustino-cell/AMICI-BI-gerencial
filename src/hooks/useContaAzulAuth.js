import { useState } from 'react';
import { contaAzulService } from '../services/contaAzulService';

export function useContaAzulAuth() {
  const [status, setStatus] = useState('Aguardando...');
  const [error, setError] = useState(null);

  const processarAuth = async (code, state) => {
    try {
      // Diferencia a mensagem inicial para ativação manual ou refresh automático
      if (code) {
        setStatus(`Ativando empresa: ${state}...`);
      } else {
        setStatus('Verificando sincronização...');
      }

      // Chama o serviço (que por sua vez chama a Edge Function corrigida)
      const result = await contaAzulService.ativarEmpresa(code, state);

      // Define a mensagem de sucesso específica retornada pela API (Ativação vs Refresh)
      setStatus(result.message || 'Operação concluída com sucesso!');
      setError(null);
    } catch (err) {
      setError(err.message);
      // Mensagem de erro contextualizada
      setStatus(code ? 'Falha na ativação.' : 'Erro ao validar conexão.');
    }
  };

  return { status, error, processarAuth };
}