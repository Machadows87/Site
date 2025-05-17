const { createClient } = require('@supabase/supabase-js');

// Conectar ao Supabase
const supabaseUrl = 'https://jpylyvstgewqndjmasqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';
const supabase = createClient('https://jpylyvstgewqndjmasqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg');

// Rotas
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Adicionar um parceiro
app.post('/parceiros', async (req, res) => {
    const { nome, email, telefone, endereco, imagem } = req.body;

    const { data, error } = await supabase
        .from('parceiros')
        .insert([{ nome, email, telefone, endereco, imagem }]);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
});

// Listar todos os parceiros
app.get('/parceiros', async (req, res) => {
    const { data, error } = await supabase
        .from('parceiros')
        .select('*');

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
});

// Subir o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
