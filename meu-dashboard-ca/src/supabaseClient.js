import { createClient } from '@supabase/supabase-js'

// Linha 3: Definição da URL do projeto Supabase
const supabaseUrl = 'https://jlkrhoxfobsgeeyqkfqk.supabase.co'
// Linha 5: Chave de acesso anônima (mantida conforme original) 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsa3Job3hmb2JzZ2VleXFrZnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjcyMjMsImV4cCI6MjA4NTMwMzIyM30.He5VHvo9MsavmaF-ib6VTGwW6LoiqB8Iyw7oVqavSXM'

// Linha 8: Exportação da instância do cliente para uso em todo o projeto
export const supabase = createClient(supabaseUrl, supabaseAnonKey)