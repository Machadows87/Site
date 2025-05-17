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

  data.forEach((partner) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${partner.id}</td>
      <td>${partner.nome}</td>
      <td>${partner.email}</td>
      <td>${partner.telefone}</td>
      <td>${partner.endereco}</td>
      <td>${partner.cnpj}</td>
      <td>
        <img src="${partner.imagem_url}" alt="Foto do Parceiro" height="50" />
      </td>
    `;
    tableBody.appendChild(row);
  });
}
