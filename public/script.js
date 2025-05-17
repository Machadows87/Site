import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

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
      <td><button data-id="${p.id}" data-image="${p.imagem_url || ''}" class="delete-btn">Excluir</button></td>
    `;
    tableBody.appendChild(row);
  });

  // Adiciona evento de click em todos os botões delete criados
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const imageUrl = button.getAttribute('data-image');
      await deletePartner(id, imageUrl);
    });
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

  const { publicURL, error: urlError } = supabase.storage
    .from('imagens')
    .getPublicUrl(filePath);

  if (urlError) {
    alert('Erro ao obter URL da imagem: ' + urlError.message);
    return;
  }

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
      let filePath = null;

      try {
        const url = new URL(imageUrl);
        const bucketPrefix = `/storage/v1/object/public/${bucket}/`;
        const index = url.pathname.indexOf(bucketPrefix);
        if (index !== -1) {
          filePath = url.pathname.substring(index + bucketPrefix.length);
        }
      } catch {
        if (imageUrl.includes(`${bucket}/`)) {
          filePath = imageUrl.split(`${bucket}/`)[1];
        }
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

loadPartners();
