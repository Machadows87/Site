const { createClient } = require('@supabase/supabase-js');

// Conectar ao Supabase
const supabaseUrl = 'https://jpylyvstgewqndjmasqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Rotas
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Adicionar um parceiro
app.post('/parceiros', async (req, res) => {
    try {
        const { nome, email, telefone, endereco, cnpj } = req.body;

        // Verifica se todos os campos obrigatórios estão preenchidos
        if (!nome || !email || !telefone || !endereco) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }

        const { data, error } = await supabase
            .from('parceiros')
            .insert([{ nome, email, telefone, endereco, cnpj }]);

        if (error) {
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Listar todos os parceiros
app.get('/parceiros', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('parceiros')
            .select('*');

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Subir o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
