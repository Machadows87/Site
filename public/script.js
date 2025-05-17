document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const tableBody = document.querySelector('#partners-table tbody');

  const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

  // Cria cliente Supabase
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function loadPartners() {
    const { data, error } = await client
      .from('parceiros')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao carregar parceiros:', error);
      return;
    }

    tableBody.innerHTML = '';

    data.forEach(p => {
      const imgSrc = p.imagem_url ? p.imagem_url : 'sem-foto.png'; // Coloque uma imagem default ou deixe vazio
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nome}</td>
        <td>${p.email}</td>
        <td>${p.telefone}</td>
        <td>${p.endereco}</td>
        <td>${p.cnpj}</td>
        <td><img src="${imgSrc}" height="50" alt="Foto"></td>
      `;
      tableBody.appendChild(row);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    try {
      const response = await fetch('/.netlify/functions/createPartner', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        alert('Erro ao cadastrar parceiro: ' + (err.error || 'Erro desconhecido.'));
        return;
      }

      alert('Parceiro cadastrado com sucesso!');
      form.reset();
      loadPartners();
    } catch (error) {
      alert('Erro na requisição: ' + error.message);
    }
  });

  // Carrega os parceiros ao abrir a página
  loadPartners();
});
