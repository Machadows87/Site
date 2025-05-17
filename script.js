const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('register-form');
const tableBody = document.querySelector('#students-table tbody');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const parceiro = Object.fromEntries(formData.entries());

    try {
        // Inserir parceiro no banco, sem imagem
        const { data, error } = await supabase
            .from('parceiros')
            .insert([{ ...parceiro, imagem: null }]); // passando imagem null porque não tem campo mais

        if (error) throw error;

        alert('Parceiro adicionado com sucesso!');
        appendToTable(data[0]);
        form.reset();
    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
});

async function fetchParceiros() {
    try {
        const { data, error } = await supabase
            .from('parceiros')
            .select('*');

        if (error) throw error;

        data.forEach(appendToTable);
    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
}

function appendToTable(parceiro) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', parceiro.id);
    row.innerHTML = `
        <td>${parceiro.id}</td>
        <td>${parceiro.nome}</td>
        <td>${parceiro.email}</td>
        <td>${parceiro.telefone}</td>
        <td>${parceiro.endereco}</td>
        <td>${parceiro.curso}</td>
        <td class="actions">
            <button class="delete">Excluir</button>
        </td>
    `;
    tableBody.appendChild(row);
}

tableBody.addEventListener('click', async (event) => {
    if (!event.target.classList.contains('delete')) return;

    const row = event.target.closest('tr');
    const parceiroId = row.getAttribute('data-id');

    if (confirm('Tem certeza de que deseja excluir este parceiro?')) {
        try {
            const { error } = await supabase
                .from('parceiros')
                .delete()
                .eq('id', parceiroId);

            if (error) throw error;

            row.remove();
            alert('Parceiro excluído com sucesso!');
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
});

fetchParceiros();
