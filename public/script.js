import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('register-form');
const tableBody = document.querySelector('#partners-table tbody');

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

  data.forEach(p => {
    const imgSrc = p.imagem_url || 'sem-foto.png'; 
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nome}</td>
      <td>${p.email}</td>
      <td>${p.telefone}</td>
      <td>${p.endereco}</td>
      <td>${p.cnpj}</td>
      <td><img src="${imgSrc}" height="50" alt="Foto"></td>
      <td><button data-id="${p.id}" data-imgurl="${p.imagem_url}" class="delete-btn">Excluir</button></td>
    `;
    tableBody.appendChild(row);
  });
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
    alert('Por favor, selecione uma foto.');
    return;
  }

  // Upload da imagem para Supabase Storage
  const fileExt = imagemFile.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('imagens')
    .upload(filePath, imagemFile);

  if (uploadError) {
    alert('Erro ao enviar a imagem: ' + uploadError.message);
    return;
  }

  // Obter URL pública da imagem
  const { publicURL, error: urlError } = supabase.storage
    .from('imagens')
    .getPublicUrl(filePath);

  if (urlError) {
    alert('Erro ao obter URL da imagem: ' + urlError.message);
    return;
  }

  // Inserir dados no banco
  const { error: insertError } = await supabase
    .from('parceiros')
    .insert([
      {
        nome,
        email,
        telefone,
        endereco,
        cnpj,
        imagem_url: publicURL
      }
    ]);

  if (insertError) {
    alert('Erro ao cadastrar parceiro: ' + insertError.message);
    return;
  }

  alert('Parceiro cadastrado com sucesso!');
  form.reset();
  loadPartners();
});

// Função para deletar parceiro e imagem
async function deletePartner(id, imageUrl) {
  if (!confirm('Tem certeza que deseja excluir este parceiro?')) return;

  try {
    // Deletar registro da tabela 'parceiros'
    const { error: deleteError } = await supabase
      .from('parceiros')
      .delete()
      .eq('id', id);

    if (deleteError) {
      alert('Erro ao deletar parceiro: ' + deleteError.message);
      return;
    }

    // Deletar imagem do storage, extraindo o path da URL pública
    if (imageUrl) {
      const bucket = 'imagens';

      // A URL pública tem o formato:
      // https://{SUPABASE_URL}/storage/v1/object/public/imagens/{filePath}
      // Então para remover precisamos extrair só a parte após /imagens/
      const url = new URL(imageUrl);
      const pathIndex = url.pathname.indexOf('/public/' + bucket + '/');
      let filePath = null;
      if (pathIndex !== -1) {
        filePath = url.pathname.substring(pathIndex + (`/public/${bucket}/`).length);
      } else {
        // Caso não ache, tenta extrair o arquivo após bucket
        filePath = imageUrl.split(`${bucket}/`)[1];
      }

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([filePath]);

        if (storageError) {
          console.warn('Erro ao deletar imagem no storage:', storageError.message);
        }
      }
    }

    alert('Parceiro deletado com sucesso!');
    loadPartners();
  } catch (err) {
    alert('Erro ao deletar parceiro: ' + err.message);
  }
}

// Delegar evento click para os botões delete da tabela
tableBody.addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-btn')) {
    const partnerId = event.target.getAttribute('data-id');
    const imgUrl = event.target.getAttribute('data-imgurl');
    deletePartner(Number(partnerId), imgUrl);
  }
});

loadPartners();
