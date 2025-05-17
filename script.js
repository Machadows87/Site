document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const tableBody = document.querySelector('#students-table tbody');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Gerar ID único para cada parceiro
        data.id = Date.now();
        appendToTable(data);

        // Limpar o formulário
        form.reset();
    });

    function appendToTable(data) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', data.id); // Armazena o ID na linha
        row.innerHTML = `
            <td>${data.id}</td>
            <td>${data.nome}</td>
            <td>${data.email}</td>
            <td>${data.telefone}</td>
            <td>${data.endereco}</td>
            <td><img src="${URL.createObjectURL(document.getElementById('imagem').files[0])}" alt="Foto" height="50"></td>
            <td class="actions">
                <button class="delete">Excluir</button>
            </td>
        `;
        tableBody.appendChild(row);
    }

    // Delegação de eventos para excluir
    tableBody.addEventListener('click', (event) => {
        const target = event.target;

        if (target.classList.contains('delete')) {
            const row = target.closest('tr');
            tableBody.removeChild(row); // Remove a linha da tabela
        }
    });
});
