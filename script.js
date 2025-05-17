// Inicialização do Supabase (substitua pelas suas credenciais)
const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Seleciona o formulário e o corpo da tabela
const form = document.getElementById('register-form');
const tableBody = document.querySelector('#students-table tbody');

// Função para sanitizar nome do arquivo (remove espaços, acentos e caracteres especiais)
function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '_') // espaços para underline
    .replace(/[^a-z0-9_\.-]/g, ''); // remove caracteres inválidos
}

// Evento do envio do formulário
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const parceiro = Object.fromEntries(formData.entries());

  try {
    let imagemURL = '';

    // Upload da imagem se existir
    const imagemFile = formData.get('imagem');
    if (imagemFile && imagemFile.size > 0) {
      const sanitizedFileName = sanitizeFileName(imagemFile.name);
      const filePath = `imagens/${Date.now()}_${sanitizedFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parceiros')
        .upload(filePath, imagemFile);

      if (uploadError) throw uploadError;

      const { publicURL } = supabase.storage
        .from('parceiros')
        .getPublicUrl(uploadData.path);

      imagemURL = publicURL;
    }

    // Insere parceiro na tabela do Supabase
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

// Função para buscar parceiros já cadastrados
async function fetchParceiros() {
  try {
    const { data, error } = await supabase.from('parceiros').select('*');
    if (error) throw error;

    tableBody.innerHTML = ''; // limpa tabela antes de popular

    data.forEach(appendToTable);
  } catch (error) {
    alert(`Erro: ${error.message}`);
  }
}

// Função para adicionar um parceiro na tabela HTML
function appendToTable(parceiro) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', parceiro.id);
  row.innerHTML = `
    <td>${parceiro.id}</td>
    <td>${parceiro.nome}</td>
    <td>${parceiro.email}</td>
    <td>${parceiro.telefone}</td>
    <td>${parceiro.endereco}</td>
    <td>${parceiro.curso || ''}</td>
    <td>${parceiro.imagem ? `<img src="${parceiro.imagem}" alt="Foto" height="50">` : ''}</td>
    <td class="actions">
      <button class="delete">Excluir</button>
    </td>
  `;
  tableBody.appendChild(row);
}

// Evento para deletar parceiro clicando no botão excluir
tableBody.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('delete')) return;

  const row = event.target.closest('tr');
  const parceiroId = row.getAttribute('data-id');

  if (confirm('Tem certeza que deseja excluir este parceiro?')) {
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

// Ao carregar a página, buscar os parceiros
fetchParceiros();
