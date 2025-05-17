// Inicialização do Supabase
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
    let imagemURL = '';

    const imagemFile = formData.get('imagem');
    if (imagemFile && imagemFile.size > 0) {
      const filePath = `imagens/${Date.now()}_${imagemFile.name}`;

      // Upload da imagem
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parceiros')
        .upload(filePath, imagemFile);

      if (uploadError) throw uploadError;

      // Obter URL público da imagem
      const { data, error: urlError } = supabase.storage
        .from('parceiros')
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      imagemURL = data.publicUrl;
    }

    // Inserir no banco de dados com URL da imagem
    const { data, error } = await supabase
      .from('parceiros')
      .insert([{ ...parceiro, imagem: imagemURL }]);

    if (error) throw error;

    alert('Parceiro adicionado com sucesso!');
    appendToTable(data[0]);
    form.reset();
  } catch (error) {
    alert('Erro: ' + error.message);
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
    alert('Erro: ' + error.message);
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
    <td>${parceiro.curso || parceiro.cnpj || ''}</td>
    <td><img src="${parceiro.imagem}" alt="Foto" height="50"></td>
    <td class="actions">
      <button class="delete">Excluir</button>
    </td>
  `;

  tableBody.appendChild(row);
}

// Excluir parceiro
tableBody.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('delete')) return;

  const row = event.target.closest('tr');
  const parceiroId = row.getAttribute('data-id');

  if (!confirm('Tem certeza que deseja excluir esse parceiro?')) return;

  try {
    const { error } = await supabase
      .from('parceiros')
      .delete()
      .eq('id', parceiroId);

    if (error) throw error;

    row.remove();
    alert('Parceiro excluído com sucesso!');
  } catch (error) {
    alert('Erro: ' + error.message);
  }
});

// Carrega a lista ao iniciar
fetchParceiros();
