// Inicialize o cliente Supabase (substitua pelos seus valores)
const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('formParceiro');
const tableBody = document.querySelector('#tableParceiros tbody');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  // Pegando os dados do formulário
  const nome = formData.get('nome');
  const email = formData.get('email');
  const telefone = formData.get('telefone');
  const endereco = formData.get('endereco');
  const cnpj = formData.get('cnpj');
  const imagemFile = formData.get('imagem');

  if (!imagemFile || imagemFile.size === 0) {
    alert('Por favor, selecione uma imagem.');
    return;
  }

  try {
    // Criar um nome único para a imagem
    const fileExt = imagemFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `imagens/${fileName}`;

    // Upload da imagem no bucket 'parceiros'
    let { error: uploadError } = await supabase.storage
      .from('parceiros')
      .upload(filePath, imagemFile, { upsert: true });

    if (uploadError) throw uploadError;

    // Pegar URL pública da imagem
    const { publicUrl, error: urlError } = supabase.storage
      .from('parceiros')
      .getPublicUrl(filePath);

    if (urlError) throw urlError;

    // Inserir dados no banco
    const { data, error: insertError } = await supabase
      .from('parceiros')
      .insert([
        { nome, email, telefone, endereco, cnpj, imagem: publicUrl }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Atualiza a tabela com o novo parceiro
    addRowToTable(data);

    form.reset();
    alert('Parceiro cadastrado com sucesso!');
  } catch (error) {
    alert('Erro: ' + error.message);
  }
});

// Função para mostrar os parceiros já cadastrados
async function loadParceiros() {
  try {
    const { data, error } = await supabase
      .from('parceiros')
      .select('*');

    if (error) throw error;

    data.forEach(addRowToTable);
  } catch (error) {
    alert('Erro ao carregar parceiros: ' + error.message);
  }
}

function addRowToTable(parceiro) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${parceiro.id}</td>
    <td>${parceiro.nome}</td>
    <td>${parceiro.email}</td>
    <td>${parceiro.telefone}</td>
    <td>${parceiro.endereco}</td>
    <td>${parceiro.cnpj}</td>
    <td><img src="${parceiro.imagem}" height="50" alt="Foto do parceiro" /></td>
    <td><button data-id="${parceiro.id}" class="btnDelete">Excluir</button></td>
  `;

  tableBody.appendChild(tr);
}

// Excluir parceiro
tableBody.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('btnDelete')) return;

  const id = event.target.getAttribute('data-id');
  if (!confirm('Deseja realmente excluir esse parceiro?')) return;

  try {
    const { error } = await supabase
      .from('parceiros')
      .delete()
      .eq('id', id);

    if (error) throw error;

    event.target.closest('tr').remove();
    alert('Parceiro excluído com sucesso!');
  } catch (error) {
    alert('Erro ao excluir parceiro: ' + error.message);
  }
});

// Carregar parceiros na inicialização da página
loadParceiros();
