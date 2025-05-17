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
      // Upload da imagem para o bucket 'parceiros'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parceiros')
        .upload(`imagens/${Date.now()}_${imagemFile.name}`, imagemFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Pega a URL pública da imagem
      const { publicURL, error: urlError } = supabase.storage
        .from('parceiros')
        .getPublicUrl(uploadData.path);

      if (urlError) throw urlError;

      imagemURL = publicURL;
    }

    // Insere o parceiro no banco
    const { data, error } = await supabase
      .from('parceiros')
      .insert([{ ...parceiro, imagem: imagemURL }]);

    if (error) throw error;

    alert('Parceiro adicionado com sucesso!');
    addRowToTable(data[0]);
    form.reset();
  } catch (error) {
    alert(`Erro: ${error.message}`);
  }
});

async function fetchParceiros() {
  try {
    const { data, error } = await supabase.from('parceiros').select('*');

    if (error) throw error;

    data.forEach(addRowToTable);
  } catch (error) {
    alert(`Erro: ${error.message}`);
  }
}

function addRowToTable(parceiro) {
  const tr = document.createElement('tr');
  tr.setAttribute('data-id', parceiro.id);
  tr.innerHTML = `
    <td>${parceiro.id}</td>
    <td>${parceiro.nome}</td>
    <td>${parceiro.email}</td>
    <td>${parceiro.telefone}</td>
    <td>${parceiro.endereco}</td>
    <td>${parceiro.cnpj}</td>
    <td><img src="${parceiro.imagem}" alt="Foto do parceiro" height="50" /></td>
    <td><button class="btnDelete" data-id="${parceiro.id}">Excluir</button></td>
  `;
  tableBody.appendChild(tr);
}

// Excluir parceiro
tableBody.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('btnDelete')) return;

  const id = event.target.getAttribute('data-id');
  if (!confirm('Tem certeza que deseja excluir este parceiro?')) return;

  try {
    // Deletar do banco
    const { error } = await supabase.from('parceiros').delete().eq('id', id);
    if (error) throw error;

    // Remover da tabela
    const row = event.target.closest('tr');
    row.remove();

    alert('Parceiro excluído com sucesso!');
  } catch (error) {
    alert(`Erro: ${error.message}`);
  }
});

// Ao carregar a página, busca os parceiros
document.addEventListener('DOMContentLoaded', fetchParceiros);
