// Substitua pela sua URL e chave do projeto Supabase
const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'COLOQUE_A_SUA_CHAVE_ANON_AQUI';

// Inicializa o cliente Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('register-form');
const tableBody = document.querySelector('#students-table tbody');

// Função para limpar nome do arquivo
function sanitizeFileName(name) {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\.-]/g, '');
}

// Carrega parceiros ao abrir a página
async function fetchParceiros() {
  try {
    const { data, error } = await supabase
      .from('parceiros')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    tableBody.innerHTML = '';
    data.forEach(appendToTable);
  } catch (err) {
    alert('Erro ao carregar parceiros: ' + err.message);
  }
}

// Adiciona parceiro na tabela
function appendToTable(parceiro) {
  const row = document.createElement('tr');
  row.dataset.id = parceiro.id;
  row.innerHTML = `
    <td>${parceiro.id}</td>
    <td>${parceiro.nome}</td>
    <td>${parceiro.email}</td>
    <td>${parceiro.telefone}</td>
    <td>${parceiro.endereco}</td>
    <td><img src="${parceiro.imagem || ''}" alt="Foto" height="50" /></td>
    <td>${parceiro.curso}</td>
    <td><button class="delete">Excluir</button></td>
  `;
  tableBody.appendChild(row);
}

// Evento submit para salvar parceiro e upload da imagem
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const parceiro = Object.fromEntries(formData.entries());

  try {
    let imagemURL = '';

    const imagemFile = formData.get('imagem');
    if (imagemFile && imagemFile.size > 0) {
      const safeFileName = sanitizeFileName(`${Date.now()}_${imagemFile.name}`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parceiros')
        .upload(`imagens/${safeFileName}`, imagemFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = supabase.storage
        .from('parceiros')
        .getPublicUrl(uploadData.path);

      if (urlError) throw urlError;

      imagemURL = urlData.publicUrl;
    }

    // Insere no banco
    const { data: insertData, error: insertError } = await supabase
      .from('parceiros')
      .insert([{ ...parceiro, imagem: imagemURL }])
      .select();

    if (insertError) throw insertError;

    alert('Parceiro adicionado com sucesso!');
    appendToTable(insertData[0]);
    form.reset();

  } catch (error) {
    alert('Erro: ' + error.message);
  }
});

// Excluir parceiro ao clicar no botão excluir
tableBody.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('delete')) return;

  const row = event.target.closest('tr');
  const parceiroId = row.dataset.id;

  if (!parceiroId) return;

  if (confirm('Confirma exclusão deste parceiro?')) {
    try {
      const { error } = await supabase
        .from('parceiros')
        .delete()
        .eq('id', parceiroId);

      if (error) throw error;

      row.remove();
      alert('Parceiro excluído!');
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    }
  }
});

// Inicializa a lista ao carregar a página
fetchParceiros();
