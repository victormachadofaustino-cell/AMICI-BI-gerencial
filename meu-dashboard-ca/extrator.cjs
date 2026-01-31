const fs = require('fs');
const path = require('path');

// Nome do arquivo de saída
const outputFileName = 'projeto_resumo.txt';

// Pastas e arquivos que NÃO queremos ler
const ignoreList = [
    'node_modules',
    '.git',
    'dist',
    '.temp',
    'package-lock.json',
    'extrator.js', // ignora o próprio script
    outputFileName
];

// Extensões de arquivos que interessam para o BI
const allowedExtensions = ['.ts', '.js', '.sql', '.json', '.toml'];

function getFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (ignoreList.some(ignore => filePath.includes(ignore))) return;

        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, allFiles);
        } else {
            if (allowedExtensions.includes(path.extname(filePath))) {
                allFiles.push(filePath);
            }
        }
    });
    return allFiles;
}

const filesToRead = getFiles('./');
let consolidatedContent = "=== RESUMO DO PROJETO PARA REVISÃO DE BI ===\n\n";

filesToRead.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    consolidatedContent += `\n--- ARQUIVO: ${file} ---\n`;
    consolidatedContent += content + "\n";
    consolidatedContent += "-".repeat(50) + "\n";
});

fs.writeFileSync(outputFileName, consolidatedContent);
console.log(`✅ Sucesso! O arquivo '${outputFileName}' foi gerado com todos os seus códigos.`);