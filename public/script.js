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
      <td><img src="${imgSrc}" height="50" alt="Foto do parceiro"></td>
      <td><button class="delete-btn" data-id="${p.id}" data-image-url="${p.imagem_url}">Excluir</button></td>
    `;
    tableBody.appendChild(row);
  });

  // Adiciona eventos de delete aos botões
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const imageUrl = button.getAttribute('data-image-url');
      if (confirm('Deseja realmente deletar esse parceiro?')) {
        await deletePartner(id, imageUrl);
      }
    });
  });
}

async function deletePartner(id, imageUrl) {
  // Extrai o caminho do arquivo no storage a partir da URL pública
  const url = new URL(imageUrl);
  const path = url.pathname.replace('/storage/v1/object/public/', '');

  // Deleta a imagem do storage
  const { error: deleteImageError } = await supabase.storage
    .from('imagens')
    .remove([path]);

  if (deleteImageError) {
    alert('Erro ao deletar imagem: ' + deleteImageError.message);
    return;
  }

  // Deleta o registro do parceiro no banco
  const { error: deletePartnerError } = await supabase
    .from('parceiros')
    .delete()
    .eq('id', id);

  if (deletePartnerError) {
    alert('Erro ao deletar parceiro: ' + deletePartnerError.message);
    return;
  }

  alert('Parceiro deletado com sucesso!');
  loadPartners();
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

  const { data, error: urlError } = supabase.storage
    .from('imagens')
    .getPublicUrl(filePath);

  if (urlError) {
    alert('Erro ao obter URL da imagem: ' + urlError.message);
    return;
  }

  const publicURL = data.publicUrl;

  const { error: insertError } = await supabase
    .from('parceiros')
    .insert([{
      nome,
      email,
      telefone,
      endereco,
      cnpj,
      imagem_url: publicURL
    }]);

  if (insertError) {
    alert('Erro ao cadastrar parceiro: ' + insertError.message);
    return;
  }

  alert('Parceiro cadastrado com sucesso!');
  form.reset();
  loadPartners();
});

loadPartners();
