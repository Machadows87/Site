// Inicialização do Supabase
const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sanitiza nome do arquivo para evitar erros no upload
function sanitizeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\.-]/g, '')
    .toLowerCase();
}

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
      const safeFileName = sanitizeFileName(`${Date.now()}_${imagemFile.name}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parceiros')
        .upload(`imagens/${safeFileName}`, imagemFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { publicURL } = supabase.storage
        .from('parceiros')
        .getPublicUrl(uploadData.path);

      imagemURL = publicURL;
    }

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

async function fetchParceiros() {
  try {
    const { data, error } = await supabase.from('parceiros').select('*');
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
    <td><img src="${parceiro.imagem}" alt="Foto" height="50"></td>
    <td>${parceiro.curso || parceiro.cnpj || ''}</td>
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
      const { error } = await supabase.from('parceiros').delete().eq('id', parceiroId);
      if (error) throw error;

      row.remove();
      alert('Parceiro excluído com sucesso!');
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  }
});

// Carrega a lista ao iniciar
fetchParceiros();
