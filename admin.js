if (localStorage.getItem("adminLogado") !== "true") {
  window.location.href = "login.html";
}

const API_URL = "http://localhost:3000";

let todosPedidos = [];
let statusAtual = "Todos";

function montarCards(pedidos) {
  const lista = document.getElementById("listaPedidos");
  if (!lista) return;

  if (!pedidos.length) {
    lista.innerHTML = "<p>Nenhum pedido encontrado.</p>";
    return;
  }

  lista.innerHTML = pedidos.map(pedido => `
    <div class="pedido">

      <div class="pedido-topo">
        <p><span class="rotulo-protocolo">Prot.</span> <strong>${pedido.protocolo || "Sem protocolo"}</strong></p>
        <span class="status-resumo">${pedido.status || "Novo"}</span>
      </div>

      <h2>${pedido.nome || "Sem nome"}</h2>

      <p class="data-pedido">
        ${
          pedido.criadoEm
            ? new Date(pedido.criadoEm).toLocaleDateString("pt-BR")
            : "Sem data"
        }
      </p>

      <div class="divisor-card"></div>

      <div class="acoes-pedido">
        <button class="btn-atendimento" onclick="abrirAtendimento('${pedido._id}')">
          Atendimento
        </button>

        <button class="btn-excluir" onclick="excluirPedido('${pedido._id}')">
          Excluir
        </button>
      </div>

    </div>
  `).join("");
}

function atualizarContadores(pedidos) {
  const contadores = document.getElementById("contadores");
  if (!contadores) return;

  const total = pedidos.length;
  const novo = pedidos.filter(p => p.status === "Novo").length;
  const analise = pedidos.filter(p => p.status === "Em análise").length;
  const agendado = pedidos.filter(p => p.status === "Agendado").length;
  const finalizado = pedidos.filter(p => p.status === "Finalizado").length;
  const cancelado = pedidos.filter(p => p.status === "Cancelado").length;

  contadores.innerHTML = `
  <div class="contador" onclick="filtrarStatus('Todos')">
    <i class="fa-regular fa-clipboard"></i>
    <div>Total</div>
    <span>${total}</span>
  </div>

  <div class="contador" onclick="filtrarStatus('Novo')">
    <i class="fa-regular fa-file-lines"></i>
    <div>Novo</div>
    <span>${novo}</span>
  </div>

  <div class="contador" onclick="filtrarStatus('Em análise')">
    <i class="fa-regular fa-eye"></i>
    <div>Em análise</div>
    <span>${analise}</span>
  </div>

  <div class="contador" onclick="filtrarStatus('Agendado')">
    <i class="fa-regular fa-calendar-check"></i>
    <div>Agendado</div>
    <span>${agendado}</span>
  </div>

  <div class="contador" onclick="filtrarStatus('Finalizado')">
    <i class="fa-regular fa-circle-check"></i>
    <div>Finalizado</div>
    <span>${finalizado}</span>
  </div>

  <div class="contador" onclick="filtrarStatus('Cancelado')">
    <i class="fa-regular fa-circle-xmark"></i>
    <div>Cancelado</div>
    <span>${cancelado}</span>
  </div>
`;
}

function aplicarFiltros() {
  const campoBusca = document.getElementById("campoBusca");
  const textoBusca = campoBusca ? campoBusca.value.trim().toLowerCase() : "";

  let pedidosFiltrados = [...todosPedidos];

  if (statusAtual !== "Todos") {
    pedidosFiltrados = pedidosFiltrados.filter(pedido => pedido.status === statusAtual);
  }

  if (textoBusca) {
    pedidosFiltrados = pedidosFiltrados.filter(pedido =>
      (pedido.nome || "").toLowerCase().includes(textoBusca) ||
      (pedido.telefone || "").toLowerCase().includes(textoBusca) ||
      (pedido.email || "").toLowerCase().includes(textoBusca) ||
      (pedido.protocolo || "").toLowerCase().includes(textoBusca)
    );
  }

  montarCards(pedidosFiltrados);
}

window.filtrarStatus = function (status) {
  statusAtual = status;
  aplicarFiltros();
};

async function carregarPedidos() {
  try {
    const resposta = await fetch(`${API_URL}/orcamentos`);
    todosPedidos = await resposta.json();

    atualizarContadores(todosPedidos);
    aplicarFiltros();

  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);

    const lista = document.getElementById("listaPedidos");
    if (lista) {
      lista.innerHTML = "<p>Erro ao carregar pedidos.</p>";
    }
  }
}

function montarMensagemWhatsApp(pedido) {
  const nome = pedido.nome || "cliente";
  const protocolo = pedido.protocolo || "Sem protocolo";
  const status = pedido.status || "Novo";

  if (status === "Novo") {
    return `Olá, ${nome}!

Recebemos sua solicitação de orçamento.

Protocolo: ${protocolo}

Em breve nossa equipe fará a análise e entrará em contato.

Toque Divino Higienização`;
  }

  if (status === "Em análise") {
    return `Olá, ${nome}!

Seu orçamento ${protocolo} está em análise.

Estamos avaliando as informações e fotos enviadas.

Em breve retornaremos.

Toque Divino Higienização`;
  }

  if (status === "Agendado") {
    return `Olá, ${nome}!

Seu atendimento referente ao protocolo ${protocolo} foi agendado.

Nossa equipe entrará em contato para confirmar data e horário.

Agradecemos a confiança!

Toque Divino Higienização`;
  }

  if (status === "Finalizado") {
    return `Olá, ${nome}!

O serviço referente ao protocolo ${protocolo} foi concluído.

Esperamos que tenha ficado satisfeito(a).

Sua avaliação é muito importante para nós:
https://maps.app.goo.gl/fDjtaHeZBuj5QLrg8

Toque Divino Higienização`;
  }

  if (status === "Cancelado") {
    return `Olá, ${nome}!

O orçamento ${protocolo} foi cancelado.

Caso deseje retomá-lo futuramente, estaremos à disposição.

Toque Divino Higienização`;
  }

  return `Olá, ${nome}!

Entramos em contato sobre sua solicitação.

Protocolo: ${protocolo}

Toque Divino Higienização`;
}

function abrirWhatsApp(pedido) {
  let telefone = (pedido.telefone || "").replace(/\D/g, "");

  if (!telefone) {
    alert("Este pedido não possui telefone válido.");
    return;
  }

  if (!telefone.startsWith("55")) {
    telefone = "55" + telefone;
  }

  const mensagem = montarMensagemWhatsApp(pedido);
  const link = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

  window.location.href = link;
}

window.alterarStatus = async function (id, novoStatus) {
  const pedido = todosPedidos.find(p => p._id === id);

  if (!pedido) {
    alert("Pedido não encontrado.");
    return;
  }

  if (pedido.status === novoStatus) return;

  try {
    const resposta = await fetch(`${API_URL}/orcamentos/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: novoStatus })
    });

    const dados = await resposta.json();

    if (dados.success) {
      pedido.status = novoStatus;
      atualizarContadores(todosPedidos);
      aplicarFiltros();
      abrirWhatsApp(pedido);
    } else {
      alert("Erro ao atualizar status: " + (dados.erro || "Erro desconhecido."));
    }

  } catch (erro) {
    console.error("Erro ao atualizar status:", erro);
    alert("Erro ao atualizar status.");
  }
};

window.abrirAtendimento = function (id) {
  const pedido = todosPedidos.find(p => p._id === id);

  if (!pedido) {
    alert("Pedido não encontrado.");
    return;
  }

  const modal = document.getElementById("modalAtendimento");
  const conteudo = document.getElementById("conteudoAtendimento");

  if (!modal || !conteudo) {
    alert("Modal de atendimento não encontrado no HTML.");
    return;
  }

  conteudo.innerHTML = `
    <p><strong>Protocolo:</strong> ${pedido.protocolo || "Sem protocolo"}</p>
    <p><strong>Nome:</strong> ${pedido.nome || "Sem nome"}</p>
    <p><strong>Telefone:</strong> ${pedido.telefone || "Não informado"}</p>
    <p><strong>Email:</strong> ${pedido.email || "Não informado"}</p>

    <p><strong>Endereço:</strong><br>
     ${pedido.logradouro || ""}, ${pedido.numero || ""}<br>

     ${pedido.complemento
     ? `<strong>Complemento:</strong> ${pedido.complemento}<br>`
     : ""}

     ${pedido.bairro || ""}<br>
     ${pedido.cidade || ""} - ${pedido.estado || ""}
    </p>

    <hr>

    <p><strong>Status do Pedido</strong></p>

    <div class="status-area">
      <select id="statusPedido" onchange="alterarStatus('${pedido._id}', this.value)">
        <option value="Novo" ${pedido.status === "Novo" ? "selected" : ""}>Novo</option>
        <option value="Em análise" ${pedido.status === "Em análise" ? "selected" : ""}>Em análise</option>
        <option value="Agendado" ${pedido.status === "Agendado" ? "selected" : ""}>Agendado</option>
        <option value="Finalizado" ${pedido.status === "Finalizado" ? "selected" : ""}>Finalizado</option>
        <option value="Cancelado" ${pedido.status === "Cancelado" ? "selected" : ""}>Cancelado</option>
      </select>
    </div>

    <hr>

    <p><strong>Descrição:</strong></p>
    <p>${pedido.descricao || "Sem descrição."}</p>

    <hr>

    <p><strong>Anotações</strong></p>

    <textarea
      id="observacoes"
      class="campo-observacoes"
      placeholder="Digite aqui suas anotações..."
    >${pedido.observacoes || ""}</textarea>

    <button
      class="btn-observacoes"
      onclick="salvarObservacoes('${pedido._id}')">
      Salvar
    </button>

    <hr>

    <p><strong>Fotos enviadas:</strong></p>

    <div class="galeria-atendimento">
      ${
        pedido.fotos && Array.isArray(pedido.fotos) && pedido.fotos.length > 0
          ? pedido.fotos.map(foto => `
              <img
                src="${foto}"
                class="foto-atendimento"
                onclick="abrirFoto('${foto}')"
              >
            `).join("")
          : "<p>Nenhuma foto enviada.</p>"
      }
    </div>
  `;

  modal.style.display = "block";
};

window.fecharAtendimento = function () {
  const modal = document.getElementById("modalAtendimento");
  if (modal) modal.style.display = "none";
};

window.salvarObservacoes = async function (id) {
  const campoObservacoes = document.getElementById("observacoes");

  if (!campoObservacoes) {
    alert("Campo de anotações não encontrado.");
    return;
  }

  const observacoes = campoObservacoes.value;

  try {
    const resposta = await fetch(`${API_URL}/orcamentos/${id}/observacoes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ observacoes })
    });

    const dados = await resposta.json();

    if (dados.success) {
      const pedido = todosPedidos.find(p => p._id === id);
      if (pedido) pedido.observacoes = observacoes;

      alert("Anotações salvas com sucesso!");
    } else {
      alert("Erro ao salvar anotações.");
    }

  } catch (erro) {
    console.error("Erro ao salvar anotações:", erro);
    alert("Erro ao salvar anotações.");
  }
};

window.abrirFoto = function (url) {
  const modalAtendimento = document.getElementById("modalAtendimento");
  const modalFoto = document.getElementById("modalFoto");
  const fotoAmpliada = document.getElementById("fotoAmpliada");

  if (!modalFoto || !fotoAmpliada) return;

  if (modalAtendimento) {
    modalAtendimento.style.display = "none";
  }

  fotoAmpliada.src = url;
  modalFoto.style.display = "flex";
};

window.fecharFoto = function () {
  const modalAtendimento = document.getElementById("modalAtendimento");
  const modalFoto = document.getElementById("modalFoto");
  const fotoAmpliada = document.getElementById("fotoAmpliada");

  if (!modalFoto || !fotoAmpliada) return;

  modalFoto.style.display = "none";
  fotoAmpliada.src = "";

  if (modalAtendimento) {
    modalAtendimento.style.display = "block";
  }
};

window.excluirPedido = async function (id) {
  const confirmar = confirm("Tem certeza que deseja excluir este pedido?");
  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API_URL}/orcamentos/${id}`, {
      method: "DELETE"
    });

    const dados = await resposta.json();

    if (dados.success) {
      alert("Pedido excluído com sucesso!");
      carregarPedidos();
    } else {
      alert("Erro ao excluir: " + (dados.erro || "Erro desconhecido."));
    }

  } catch (erro) {
    console.error("Erro ao excluir pedido:", erro);
    alert("Erro ao excluir pedido.");
  }
};

const campoBusca = document.getElementById("campoBusca");

if (campoBusca) {
  campoBusca.addEventListener("input", aplicarFiltros);
}

const btnSair = document.getElementById("btnSair");

if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem("adminLogado");
    window.location.href = "login.html";
  });
}

carregarPedidos();