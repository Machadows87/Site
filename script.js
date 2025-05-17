// Inicialização do Supabase
const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Seleciona o formulário e a tabela
const form = document.getElementById('register-form');
const tableBody = document.querySelector('#students-table tbody');

// Evento de envio do formulário
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Coleta os dados do formulário
    const formData = new FormData(form);
    const parceiro = Object.fromEntries(formData.entries());

    try {
        // Upload da imagem, se houver
        let imagemURL = '';
        const imagemFile = formData.get('imagem');
        if (imagemFile && imagemFile.size > 0) {
            const { data, error } = await supabase.storage
                .from('parceiros')
                .upload(`imagens/${Date.now()}_${imagemFile.name}`, imagemFile);

            if (error) {
                throw error;
            }

            // URL pública da imagem
            const { publicURL } = supabase.storage
                .from('parceiros')
                .getPublicUrl(data.path);

            imagemURL = publicURL;
        }

        // Inserir parceiro no banco
        const { data, error } = await supabase
            .from('parceiros')
            .insert([{ ...parceiro, imagem: imagemURL }]);

        if (error) {
            throw error;
        }

        alert('Parceiro adicionado com sucesso!');
        appendToTable(data[0]); // Adiciona o parceiro à tabela
        form.reset(); // Limpa o formulário
    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
});

// Carregar a lista de parceiros ao carregar a página
async function fetchParceiros() {
    try {
        const { data, error } = await supabase
            .from('parceiros')
            .select('*');

        if (error) {
            throw error;
        }

        // Adiciona cada parceiro à tabela
        data.forEach(appendToTable);
    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
}

// Adiciona uma linha à tabela
function appendToTable(parceiro) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', parceiro.id);
    row.innerHTML = `
        <td>${parceiro.id}</td>
        <td>${parceiro.nome}</td>
        <td>${parceiro.email}</td>
        <td>${parceiro.telefone}</td>
        <td>${parceiro.endereco}</td>
        <td><img src="${parceiro.imagem}" alt="Foto" height="50"></td>
        <td class="actions">
            <button class="delete">Excluir</button>
        </td>
    `;

    tableBody.appendChild(row);
}

// Excluir um parceiro
tableBody.addEventListener('click', async (event) => {
    if (!event.target.classList.contains('delete')) {
        return;
    }

    const row = event.target.closest('tr');
    const parceiroId = row.getAttribute('data-id');

    if (confirm('Tem certeza de que deseja excluir este parceiro?')) {
        try {
            const { error } = await supabase
                .from('parceiros')
                .delete()
                .eq('id', parceiroId);

            if (error) {
                throw error;
            }

            row.remove(); // Remove a linha da tabela
            alert('Parceiro excluído com sucesso!');
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
});

// Carrega a lista de parceiros ao iniciar
fetchParceiros();
