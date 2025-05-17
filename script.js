// Configurar o Supabase
const SUPABASE_URL = 'https://jpylyvstgewqndjmasqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweWx5dnN0Z2V3cW5kam1hc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjIwMjYsImV4cCI6MjA2MzAzODAyNn0.vP9c5I6OtEX8tyuCHSotScm03vs1O6xZGGnhFAbECKg';

// Note o S maiúsculo em Supabase, e a variável supabase (minúsculo)
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// O resto do código usa a variável supabase normalmente:

const form = document.getElementById('register-form');
const tableBody = document.querySelector('#partners-table tbody');

function appendToTable(parceiro) {
  const row = document.createElement('tr');
  row.dataset.id = parceiro.id;
  row.innerHTML = `
    <td>${parceiro.id}</td>
    <td>${parceiro.nome}</td>
    <td>${parceiro.email}</td>
    <td>${parceiro.telefone}</td>
    <td>${parceiro.endereco}</td>
    <td>${parceiro.cnpj}</td>
    <td class="actions">
      <button class="delete">Excluir</button>
    </td>
  `;
  tableBody.appendChild(row);
}

async function fetchParceiros() {
  tableBody.innerHTML = '';
  const { data, error } = await supabase.from('parceiros').select('*');
  if (error) {
    alert('Erro ao carregar parceiros: ' + error.message);
    return;
  }
  data.forEach(appendToTable);
}

form.addEventListener('submit', async e => {
  e.preventDefault();

  const formData = new FormData(form);
  const parceiro = Object.fromEntries(formData.entries());

  try {
    const { data, error } = await supabase
      .from('parceiros')
      .insert([{ ...parceiro }]);

    if (error) throw error;

    alert('Parceiro cadastrado com sucesso!');
    appendToTable(data[0]);
    form.reset();
  } catch (error) {
    alert('Erro ao cadastrar parceiro: ' + error.message);
  }
});

tableBody.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('delete')) return;

  const row = e.target.closest('tr');
  const id = row.dataset.id;

  if (confirm('Tem certeza que deseja excluir este parceiro?')) {
    const { error } = await supabase
      .from('parceiros')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao excluir parceiro: ' + error.message);
    } else {
      row.remove();
      alert('Parceiro excluído com sucesso!');
    }
  }
});

fetchParceiros();
