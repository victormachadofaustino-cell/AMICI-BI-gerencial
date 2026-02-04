const fs = require('fs');
const path = require('path');

const ARQUIVO_SAIDA = 'projeto_completo_amici.txt';
const IGNORAR = ['node_modules', '.git', '.vercel', '.vscode', 'dist'];

let output = "=== ESTRUTURA E CÓDIGO DO PROJETO ===\n\n";

function processar(diretorio) {
    const itens = fs.readdirSync(diretorio);
    itens.forEach(item => {
        if (IGNORAR.includes(item)) return;
        const caminho = path.join(diretorio, item);
        const stats = fs.statSync(caminho);

        if (stats.isDirectory()) {
            processar(caminho);
        } else {
            console.log('Lendo:', caminho);
            output += `\n\nFILE: ${caminho}\n${"=".repeat(30)}\n`;
            try {
                const conteudo = fs.readFileSync(caminho, 'utf8');
                output += conteudo;
            } catch (e) {
                output += `[Erro ao ler: ${e.message}]`;
            }
        }
    });
}

try {
    processar('./');
    fs.writeFileSync(ARQUIVO_SAIDA, output);
    console.log(`\n✅ SUCESSO! Verifique o arquivo: ${ARQUIVO_SAIDA}`);
} catch (err) {
    console.error('❌ ERRO FATAL:', err.message);
}