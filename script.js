document.addEventListener('DOMContentLoaded', () => {
    // Inicialize o Supabase com sua URL e anon key
    const SUPABASE_URL = 'https://<YOUR_SUPABASE_PROJECT>.supabase.co';
    const SUPABASE_ANON_KEY = '<YOUR_SUPABASE_ANON_KEY>';

    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const form = document.getElementById('register-form');
    const tableBody = document.querySelector('#partners-table tbody');

    // Função para carregar parceiros do Supabase
    async function loadPartners() {
        const { data, error } = await supabase
            .from('parceiros')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Erro ao carregar parceiros:', error);
            return;
        }

        tableBody.innerHTML = '';
        data.forEach(partner => appendToTable(partner));
    }

    // Função para adicionar uma linha na tabela
    function appendToTable(partner) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', partner.id);
        row.innerHTML = `
            <td>${partner.id}</td>
            <td>${partner.nome}</td>
            <td>${partner.email}</td>
            <td>${partner.telefone}</td>
            <td>${partner.endereco}</td>
            <td>${partner.cnpj}</td>
            <td>
                ${
                    partner.imagem_url
                        ? `<img src="${partner.imagem_url}" alt="Foto" height="50" />`
                        : 'Sem foto'
                }
            </td>
            <td class="actions">
                <button class="delete">Excluir</button>
            </td>
        `;
        tableBody.appendChild(row);
    }

    // Função para upload da imagem no Supabase Storage
    async function uploadImage(file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `parceiros/${fileName}`;

        let { error: uploadError } = await supabase.storage
            .from('parceiros')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError);
            return null;
        }

        // Obter URL pública da imagem
        const { data: publicUrlData } = supabase.storage
            .from('parceiros')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nome = form.nome.value.trim();
        const email = form.email.value.trim();
        const telefone = form.telefone.value.trim();
        const endereco = form.endereco.value.trim();
        const cnpj = form.cnpj.value.trim();
        const imagemFile = form.imagem.files[0];

        if (!imagemFile) {
            alert('Por favor, selecione uma imagem.');
            return;
        }

        // Upload da imagem e pegar URL pública
        const imagemUrl = await uploadImage(imagemFile);
        if (!imagemUrl) {
            alert('Falha ao fazer upload da imagem.');
            return;
        }

        // Inserir dados no Supabase
        const { data, error } = await supabase
            .from('parceiros')
            .insert([
                {
                    nome,
                    email,
                    telefone,
                    endereco,
                    cnpj,
                    imagem_url: imagemUrl,
                },
            ])
            .select()
            .single();

        if (error) {
            alert('Erro ao adicionar parceiro: ' + error.message);
            return;
        }

        appendToTable(data);
        form.reset();
    });

    // Deleção via delegação de evento
    tableBody.addEventListener('click', async (event) => {
        if (!event.target.classList.contains('delete')) return;

        const row = event.target.closest('tr');
        const id = row.getAttribute('data-id');

        // Excluir do banco
        const { error } = await supabase.from('parceiros').delete().eq('id', id);
        if (error) {
            alert('Erro ao excluir parceiro: ' + error.message);
            return;
        }

        // Remover da tabela
        row.remove();
    });

    // Carrega parceiros ao iniciar
    loadPartners();
});
