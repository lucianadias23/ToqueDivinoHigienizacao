if (localStorage.getItem("adminLogado") !== "true") {
    window.location.href = "login.html";
}


let todosPedidos = [];

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

      <h2>${pedido.nome || "Sem nome"}</h2>

      <p class="data-pedido">
        <strong>Recebido em:</strong>
        ${pedido.criadoEm ? new Date(pedido.criadoEm).toLocaleString("pt-BR") : "Data não informada"}
      </p>

      <p><strong>Telefone:</strong> ${pedido.telefone || ""}</p>
      <p><strong>Email:</strong> ${pedido.email || ""}</p>
      <p><strong>CEP:</strong> ${pedido.cep || ""}</p>
      <p><strong>Endereço:</strong> ${pedido.logradouro || ""}, ${pedido.numero || ""}</p>
      <p><strong>Bairro:</strong> ${pedido.bairro || ""}</p>
      <p><strong>Cidade:</strong> ${pedido.cidade || ""} - ${pedido.estado || ""}</p>
      <p><strong>Descrição:</strong> ${pedido.descricao || ""}</p>

      ${pedido.fotos && pedido.fotos.length ? `
      <div class="galeria-fotos">
      ${pedido.fotos.map(foto => `
      <a href="javascript:void(0)">
     <a href="#" onclick="abrirFoto('${foto}'); return false;">
     <img
         src="${foto}"
         alt="Foto do estofado"
         width="120"
         style="border-radius:8px; cursor:pointer; margin:5px;"
         >
          </a>

    `).join("")}
  </div>
` : ""}

      <br><br>

      <label><strong>Status:</strong></label>

      <select onchange="alterarStatus('${pedido._id}', this.value)">
        <option value="Novo" ${pedido.status === "Novo" ? "selected" : ""}>Novo</option>
        <option value="Em análise" ${pedido.status === "Em análise" ? "selected" : ""}>Em análise</option>
        <option value="Agendado" ${pedido.status === "Agendado" ? "selected" : ""}>Agendado</option>
        <option value="Finalizado" ${pedido.status === "Finalizado" ? "selected" : ""}>Finalizado</option>
        <option value="Cancelado" ${pedido.status === "Cancelado" ? "selected" : ""}>Cancelado</option>
      </select>

      <br><br>

      <button onclick="excluirPedido('${pedido._id}')">
        Excluir
      </button>

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

window.filtrarStatus = function (status) {
  const campoBusca = document.getElementById("campoBusca");
  const textoBusca = campoBusca ? campoBusca.value.toLowerCase() : "";

  let pedidosFiltrados = todosPedidos;

  if (status !== "Todos") {
    pedidosFiltrados = pedidosFiltrados.filter(pedido => pedido.status === status);
  }

  if (textoBusca) {
    pedidosFiltrados = pedidosFiltrados.filter(pedido =>
      (pedido.nome || "").toLowerCase().includes(textoBusca) ||
      (pedido.telefone || "").toLowerCase().includes(textoBusca) ||
      (pedido.email || "").toLowerCase().includes(textoBusca)
    );
  }

  montarCards(pedidosFiltrados);
};

async function carregarPedidos() {
  try {
    const resposta = await fetch("https://toquedivinohigienizacao.onrender.com/orcamentos");
    todosPedidos = await resposta.json();

    atualizarContadores(todosPedidos);
    montarCards(todosPedidos);

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

const campoBusca = document.getElementById("campoBusca");

if (campoBusca) {
  campoBusca.addEventListener("input", function () {
    const texto = this.value.toLowerCase();

    const pedidosFiltrados = todosPedidos.filter(pedido =>
      (pedido.nome || "").toLowerCase().includes(texto) ||
      (pedido.telefone || "").toLowerCase().includes(texto) ||
      (pedido.email || "").toLowerCase().includes(texto)
    );

    montarCards(pedidosFiltrados);
  });
}

carregarPedidos();

const btnSair = document.getElementById("btnSair");

if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem("adminLogado");
    window.location.href = "login.html";
  });
}

function abrirFoto(url) {
  document.getElementById("fotoAmpliada").src = url;
  document.getElementById("modalFoto").style.display = "flex";
}

function fecharFoto() {
  document.getElementById("modalFoto").style.display = "none";
  document.getElementById("fotoAmpliada").src = "";
}