if (localStorage.getItem("adminLogado") !== "true") {
  window.location.href = "login.html";
}

let todosPedidos = [];
let statusAtual = "Todos";

function classeStatus(status) {
  return status === "Novo" ? "status-novo" :
    status === "Em análise" ? "status-analise" :
    status === "Agendado" ? "status-agendado" :
    status === "Finalizado" ? "status-finalizado" :
    status === "Cancelado" ? "status-cancelado" : "";
}

function montarCards(pedidos) {
  const lista = document.getElementById("listaPedidos");

  if (!pedidos.length) {
    lista.innerHTML = "<p>Nenhum pedido encontrado.</p>";
    return;
  }

  lista.innerHTML = pedidos.map(pedido => `
    <div class="pedido ${classeStatus(pedido.status)}">

      <div class="pedido-topo">
        <p><strong>📋 Protocolo:</strong> ${pedido.protocolo || "Sem protocolo"}</p>

        <span class="status-resumo">
          ${pedido.status || "Novo"}
        </span>
      </div>

      <h2>${pedido.nome || "Sem nome"}</h2>

      <p><strong>📞 Telefone:</strong> ${pedido.telefone || "Não informado"}</p>

      <p><strong>📅 Data:</strong> ${
        pedido.criadoEm 
          ? new Date(pedido.criadoEm).toLocaleDateString("pt-BR") 
          : "Sem data"
      }</p>

      <div class="acoes-pedido">

        <button class="btn-atendimento" onclick="abrirAtendimento('${pedido._id}')">
          📁 Atendimento
        </button>

        <button class="btn-whatsapp" onclick="enviarWhatsApp('${pedido._id}')">
          💬 Notificar Cliente
        </button>

        <button class="btn-excluir" onclick="excluirPedido('${pedido._id}')">
          🗑 Excluir
        </button>

      </div>

    </div>
  `).join("");
}

function atualizarContadores(pedidos) {
  const total = pedidos.length;
  const novo = pedidos.filter(p => p.status === "Novo").length;
  const analise = pedidos.filter(p => p.status === "Em análise").length;
  const agendado = pedidos.filter(p => p.status === "Agendado").length;
  const finalizado = pedidos.filter(p => p.status === "Finalizado").length;
  const cancelado = pedidos.filter(p => p.status === "Cancelado").length;

  const contadores = document.getElementById("contadores");

  if (!contadores) return;

  contadores.innerHTML = `
    <div class="contador" onclick="filtrarStatus('Todos')">
      Total
      <span>${total}</span>
    </div>

    <div class="contador" onclick="filtrarStatus('Novo')">
      Novo
      <span>${novo}</span>
    </div>

    <div class="contador" onclick="filtrarStatus('Em análise')">
      Em análise
      <span>${analise}</span>
    </div>

    <div class="contador" onclick="filtrarStatus('Agendado')">
      Agendado
      <span>${agendado}</span>
    </div>

    <div class="contador" onclick="filtrarStatus('Finalizado')">
      Finalizado
      <span>${finalizado}</span>
    </div>

    <div class="contador" onclick="filtrarStatus('Cancelado')">
      Cancelado
      <span>${cancelado}</span>
    </div>
  `;
}

function aplicarFiltros() {
  const campoBusca = document.getElementById("campoBusca");
  const textoBusca = campoBusca ? campoBusca.value.trim().toLowerCase() : "";

  let pedidosFiltrados = todosPedidos;

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
    const resposta = await fetch("https://toquedivinohigienizacao.onrender.com/orcamentos");
    todosPedidos = await resposta.json();

    atualizarContadores(todosPedidos);
    aplicarFiltros();

  } catch (erro) {
    console.error("Erro no admin:", erro);
    document.getElementById("listaPedidos").innerHTML =
      "<p>Erro ao carregar pedidos.</p>";
  }
}

window.alterarStatus = async function (id, status) {
  try {
    const resposta = await fetch(
      `https://toquedivinohigienizacao.onrender.com/orcamentos/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      }
    );

    const dados = await resposta.json();

    if (dados.success) {
      alert("Status atualizado!");
      carregarPedidos();
    } else {
      alert("Erro ao atualizar status: " + (dados.erro || "Erro desconhecido."));
    }

  } catch (erro) {
    console.log(erro);
    alert("Erro ao atualizar status");
  }
};

window.excluirPedido = async function (id) {
  const confirmar = confirm("Tem certeza que deseja excluir este pedido?");

  if (!confirmar) return;

  try {
    const resposta = await fetch(
      `https://toquedivinohigienizacao.onrender.com/orcamentos/${id}`,
      {
        method: "DELETE"
      }
    );

    const dados = await resposta.json();

    if (dados.success) {
      alert("Pedido excluído com sucesso!");
      carregarPedidos();
    } else {
      alert("Erro ao excluir: " + (dados.erro || "Erro desconhecido."));
    }

  } catch (erro) {
    console.log("Erro no front-end ao excluir:", erro);
    alert("Erro ao excluir pedido.");
  }
};

window.enviarWhatsApp = function (id) {
  const pedido = todosPedidos.find(p => p._id === id);

  console.log(pedido);

  if (!pedido) {
    alert("Pedido não encontrado.");
    return;
  }

  const telefone = (pedido.telefone || "").replace(/\D/g, "");
  const nome = pedido.nome || "cliente";
  const protocolo = pedido.protocolo || "Sem protocolo";
  const status = pedido.status || "Novo";

  let mensagem = "";

  if (status === "Novo") {
    mensagem = `Olá, ${nome}!

Recebemos sua solicitação de orçamento.

📋 Protocolo: ${protocolo}

Em breve nossa equipe fará a análise e entrará em contato.

Toque Divino Higienização`;
  }

  if (status === "Em análise") {
    mensagem = `Olá, ${nome}!

Seu orçamento ${protocolo} está em análise.

Estamos avaliando as informações e fotos enviadas.

Em breve retornaremos.

Toque Divino Higienização`;
  }

  if (status === "Agendado") {
    mensagem = `Olá, ${nome}!

Seu atendimento referente ao protocolo ${protocolo} foi agendado.

Nossa equipe entrará em contato para confirmar data e horário.

Agradecemos a confiança!

Toque Divino Higienização`;
  }

  if (status === "Finalizado") {
    mensagem = `Olá, ${nome}!

O serviço referente ao protocolo ${protocolo} foi concluído.

Esperamos que tenha ficado satisfeito(a).

Sua avaliação é muito importante para nós:
https://maps.app.goo.gl/fDjtaHeZBuj5QLrg8

Toque Divino Higienização`;
  }

  if (status === "Cancelado") {
    mensagem = `Olá, ${nome}!

O orçamento ${protocolo} foi cancelado.

Caso deseje retomá-lo futuramente, estaremos à disposição.

Toque Divino Higienização`;
  }

  const link = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;

  window.open(link, "_blank");
};

window.abrirFoto = function (url) {
  const modalAtendimento = document.getElementById("modalAtendimento");
  const modalFoto = document.getElementById("modalFoto");
  const fotoAmpliada = document.getElementById("fotoAmpliada");

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

  modalFoto.style.display = "none";
  fotoAmpliada.src = "";

  if (modalAtendimento) {
    modalAtendimento.style.display = "block";
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
    <p><strong>📋 Protocolo:</strong> ${pedido.protocolo || "Sem protocolo"}</p>
    <p><strong>👤 Nome:</strong> ${pedido.nome || "Sem nome"}</p>
    <p><strong>📞 Telefone:</strong> ${pedido.telefone || "Não informado"}</p>
    <p><strong>📧 Email:</strong> ${pedido.email || "Não informado"}</p>

    <p><strong>📍 Endereço:</strong>
      ${pedido.logradouro || ""}, 
      ${pedido.numero || ""}, 
      ${pedido.bairro || ""}, 
      ${pedido.cidade || ""} - 
      ${pedido.estado || ""}
    </p>

    <hr>

    <p><strong>Descrição:</strong></p>
    <p>${pedido.descricao || "Sem descrição."}</p>

    <hr>

    <p><strong>📷 Fotos enviadas:</strong></p>

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

  if (modal) {
    modal.style.display = "none";
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