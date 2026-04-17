const form = document.getElementById('form');
const status = document.getElementById('status');
const lista = document.getElementById('lista');
const submitButton = document.getElementById('submitButton');

function renderStatus(message, type) {
  status.className = type;
  status.textContent = message;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  renderStatus('Consultando API...', 'info');
  lista.innerHTML = '';
  submitButton.disabled = true;

  const cep = document.getElementById('cep').value.trim();
  const raioKm = document.getElementById('raioKm').value.trim();
  const url = `http://localhost:3000/ceps/radius?cep=${encodeURIComponent(cep)}&raioKm=${encodeURIComponent(raioKm)}`;

  try {
    const response = await fetch(url);
    const body = await response.json();
    if (!response.ok) {
      const message = Array.isArray(body.message) ? body.message.join(' | ') : body.message;
      renderStatus(`Erro ${response.status}: ${message || 'Erro ao consultar API.'}`, 'error');
      return;
    }

    renderStatus(`Consulta realizada com sucesso. Total encontrado: ${body.total}`, 'success');

    if (!body.ceps.length) {
      const li = document.createElement('li');
      li.textContent = 'Nenhum CEP encontrado para o raio informado.';
      lista.appendChild(li);
      return;
    }

    body.ceps.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-main">${item.cep} - ${item.logradouro || 'Logradouro não informado'}</div>
        <div class="item-meta">
          ${item.bairro || 'Bairro não informado'} | ${item.cidade} - ${item.uf} | Distância: ${item.distanciaKm} km
        </div>
      `;
      lista.appendChild(li);
    });
  } catch (_error) {
    renderStatus(
      'Falha de conexão com a API. Verifique se o backend está rodando em http://localhost:3000.',
      'error',
    );
  } finally {
    submitButton.disabled = false;
  }
});
