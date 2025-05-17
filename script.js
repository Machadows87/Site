// Inicializa o cliente Supabase
const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('register-form');
const tableBody = document.querySelector('#students-table tbody');

// Função para sanitizar nome do arquivo (remove espaços e caracteres especiais)
function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')         // espaços viram underline
    .replace(/[^a-z0-9_\.-]/g, ''); // remove tudo que não é letra, número, underline, ponto ou hífen
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const parceiro = Object.fromEntries(formData.entries());

  try {
    let imagemURL = '';

    // Pega o arquivo
    const imagemFile = formData.get('imagem');

    if (imagemFile && imagemFile.size > 0) {
      // Sanitiza o nome para evitar erro 400
      const sanitizedFileName = sanitizeFileName(imagemFile.name);
      const filePath = `imagens/${Date.now()}_${sanitizedFileName}`;

      // Faz upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parceiros')
        .upload(filePath, imagemFile);

      if (uploadError) throw uploadError;

      // Pega URL pública
      const { publicURL, error: urlError } = supabase.storage
        .from('parceiros')
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      imagemURL = publicURL;
    }

    // Insere no banco
    const { data, error } = await supabase
      .from('parceiros')
      .insert([{ ...parceiro, imagem: imagemURL }])
      .select()
      .single();

    if (error) throw error;

    alert('Parceiro adicionado com sucesso!');
    appendToTable(data);
    form.reset();
  } catch (error) {
    alert(`Erro: ${error.message}`);
    console.error(error);
  }
});

async function fetchParceiros() {
  try {
    const { data, error } = await supabase.from('parceiros').select('*');

    if (error) throw error;

    tableBody.innerHTML = '';
    data.forEach(appendToTable);
  } catch (error) {
    alert(`Erro ao carregar parceiros: ${error.message}`);
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
    <td><img src="${parceiro.imagem || ''}" alt="Foto" height="50"></td>
    <td>${parceiro.curso || ''}</td>
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
      // Apaga do banco
      const { error } = await supabase.from('parceiros').delete().eq('id', parceiroId);
      if (error) throw error;

      // Remove da tabela
      row.remove();
      alert('Parceiro excluído com sucesso!');
    } catch (error) {
      alert(`Erro ao excluir parceiro: ${error.message}`);
    }
  }
});

// Carrega parceiros ao iniciar
fetchParceiros();
