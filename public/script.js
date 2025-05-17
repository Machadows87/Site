import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const tableBody = document.querySelector('#partners-table tbody');

  const SUPABASE_URL = 'https://<YOUR_SUPABASE_PROJECT>.supabase.co';
  const SUPABASE_ANON_KEY = '<YOUR_SUPABASE_ANON_KEY>';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function loadPartners() {
    const { data, error } = await supabase
      .from('parceiros')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    tableBody.innerHTML = '';
    data.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nome}</td>
        <td>${p.email}</td>
        <td>${p.telefone}</td>
        <td>${p.endereco}</td>
        <td>${p.cnpj}</td>
        <td><img src="${p.imagem_url}" height="50" alt="Foto"></td>
      `;
      tableBody.appendChild(row);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const response = await fetch('/.netlify/functions/createPartner', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        alert('Erro: ' + (err.error || 'Não foi possível cadastrar.'));
        return;
      }

      alert('Parceiro cadastrado com sucesso!');
      form.reset();
      loadPartners();
    } catch (error) {
      alert('Erro na requisição: ' + error.message);
    }
  });

  loadPartners();
});
