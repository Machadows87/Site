const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-aqui'; // substitua pela sua chave anon

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('register-form');
const tableBody = document.querySelector('#students-table tbody');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const parceiro = Object.fromEntries(formData.entries());

  try {
    let imagemURL = '';

    const imagemFile = formData.get('imagem');
    if (imagemFile && imagemFile.size > 0) {
      // Limpa nome do arquivo
      const safeFileName = sanitizeFileName(`${Date.now()}_${imagemFile.name}`);

      // Faz upload para o bucket 'parceiros' na pasta 'imagens'
      const { data, error: uploadError } = await supabase.storage
        .from('parceiros')
        .upload(`imagens/${safeFileName}`, imagemFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Pega a URL pública do arquivo
      const { publicURL, error: urlError } = supabase.storage
        .from('parceiros')
        .getPublicUrl(data.path);

      if (urlError) throw urlError;

      imagemURL = publicURL;
    }

    // Insere o parceiro no banco, incluindo a URL da imagem
    const { data: insertData, error: insertError } = await supabase
      .from('parceiros')
      .insert([{ ...parceiro, imagem: imagemURL }]);

    if (insertError) throw insertError;

    alert('Parceiro adicionado com sucesso!');
    appendToTable(insertData[0]);
    form.reset();

  } catch (error) {
    alert(`Erro: ${error.message}`);
  }
});

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
      alert(`Erro: ${error.message}`);
    }
  }
});

// Função para limpar nome do arquivo
function sanitizeFileName(name) {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\.-]/g, '');
}

// Carrega a lista de parceiros ao iniciar a página
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

fetchParceiros();
