// Configuração Supabase
const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Seleciona o formulário e tabela
const form = document.getElementById('register-form');
const tableBody = document.querySelector('#students-table tbody');

// Função para carregar parceiros ao iniciar a página
async function fetchParceiros() {
    try {
        const { data, error } = await supabase
            .from('parceiros')
            .select('*');

        if (error) throw error;

        data.forEach(appendToTable);
    } catch (error) {
        alert('Erro ao buscar parceiros: ' + error.message);
    }
}

// Função para adicionar parceiro à tabela HTML
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
        <td>
          ${parceiro.imagem ? `<img src="${parceiro.imagem}" alt="Foto" height="50" />` : 'Sem foto'}
        </td>
        <td class="actions">
            <button class="delete">Excluir</button>
        </td>
    `;
    tableBody.appendChild(row);
}

// Envio do formulário
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const parceiro = Object.fromEntries(formData.entries());

    try {
        // Upload da imagem
        let imagemURL = '';
        const imagemFile = formData.get('imagem');

        if (imagemFile && imagemFile.size > 0) {
            // Faz o upload no bucket "parceiros"
            const filePath = `imagens/${Date.now()}_${imagemFile.name}`;

            const { data, error } = await supabase.storage
                .from('parceiros')
                .upload(filePath, imagemFile);

            if (error) throw error;

            // Pega URL pública
            const { publicURL, error: urlError } = supabase.storage
                .from('parceiros')
                .getPublicUrl(filePath);

            if (urlError) throw urlError;

            imagemURL = publicURL;
        }

        // Insere parceiro no banco
        const { data, error } = await supabase
            .from('parceiros')
            .insert([{ 
                nome: parceiro.nome,
                email: parceiro.email,
                telefone: parceiro.telefone,
                endereco: parceiro.endereco,
                curso: parceiro.curso,
                imagem: imagemURL
            }]);

        if (error) throw error;

        appendToTable(data[0]);
        form.reset();
        alert('Parceiro adicionado com sucesso!');

    } catch (error) {
        alert('Erro: ' + error.message);
    }
});

// Deletar parceiro da tabela e do banco
tableBody.addEventListener('click', async (event) => {
    if (!event.target.classList.contains('delete')) return;

    const row = event.target.closest('tr');
    const parceiroId = row.getAttribute('data-id');

    if (confirm('Tem certeza que deseja excluir este parceiro?')) {
        try {
            const { error } = await supabase
                .from('parceiros')
                .delete()
                .eq('id', parceiroId);

            if (error) throw error;

            row.remove();
            alert('Parceiro excluído com sucesso!');
        } catch (error) {
            alert('Erro ao excluir parceiro: ' + error.message);
        }
    }
});

// Chama a função para carregar parceiros quando a página carregar
window.addEventListener('load', fetchParceiros);
