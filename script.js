document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://toquedivinohigienizacao-backend.onrender.com";// atualização netlify
  const TELEFONE_EMPRESA = "5511989671290";

  const formOrcamento = document.getElementById("formOrcamento");
  const cepInput = document.getElementById("cep");
  const inputFotos = document.getElementById("fotos");

  window.abrirMenu = function () {
    const menu = document.querySelector(".menu");
    if (menu) menu.classList.toggle("ativo");
  };

  function validarQuantidadeFotos() {
    if (inputFotos && inputFotos.files.length > 5) {
      alert("Você pode enviar no máximo 5 fotos.");
      return false;
    }
    return true;
  }

  function montarMensagemWhatsApp(formData) {
    return `Olá! Recebemos um novo orçamento.

Nome: ${formData.get("nome")}
Telefone: ${formData.get("telefone")}
Email: ${formData.get("email")}
Endereço: ${formData.get("logradouro")}, ${formData.get("numero")}
Bairro: ${formData.get("bairro")}
Cidade: ${formData.get("cidade")} - ${formData.get("estado")}
Descrição: ${formData.get("descricao")}
`;
  }

  function abrirWhatsAppEmpresa(formData) {
    const mensagem = montarMensagemWhatsApp(formData);
    const linkWhatsApp =
      `https://wa.me/${TELEFONE_EMPRESA}?text=${encodeURIComponent(mensagem)}`;

    window.open(linkWhatsApp, "_blank");
  }

  async function enviarFormulario(e) {
    e.preventDefault();

    const form = e.target;
    const botao = form.querySelector("button[type='submit']");
    const formData = new FormData(form);

    if (!validarQuantidadeFotos()) return;

    if (botao) {
      botao.disabled = true;
      botao.innerText = "Enviando...";
    }

    try {
      console.log("API_URL usada:", API_URL);

      const resposta = await fetch(`${API_URL}/enviar`, {
        method: "POST",
        body: formData
      });

      const dados = await resposta.json();

      console.log("RESPOSTA DO BACKEND:", dados);

      if (!dados.success) {
        alert("Erro ao enviar: " + (dados.erro || "Erro desconhecido."));
        return;
      }

      alert(`Orçamento enviado com sucesso!

Protocolo: ${dados.protocolo}

Guarde este número para acompanhar seu atendimento.

Aguarde o nosso retorno, será um prazer atendê-lo!`);

      
      form.reset();

      if (typeof fecharModal === "function") {
        fecharModal();
      }

    } catch (erro) {
      console.error("Erro no envio:", erro);
      alert("Erro no servidor.");
    } finally {
      if (botao) {
        botao.disabled = false;
        botao.innerText = "Enviar";
      }
    }
  }

  if (formOrcamento) {
    formOrcamento.addEventListener("submit", enviarFormulario);
  }

  async function buscarEnderecoPorCep() {
    const cep = cepInput.value.replace(/\D/g, "");

    if (cep.length !== 8) {
      alert("Digite um CEP válido com 8 números.");
      return;
    }

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await resposta.json();

      if (dados.erro) {
        alert("CEP não encontrado.");
        return;
      }

      preencherEndereco(dados);

    } catch (erro) {
      console.error("Erro ViaCEP:", erro);
      alert("Erro ao buscar o CEP. Tente novamente.");
    }
  }

  function preencherEndereco(dados) {
    const logradouro = document.getElementById("logradouro");
    const bairro = document.getElementById("bairro");
    const cidade = document.getElementById("cidade");
    const estado = document.getElementById("estado");

    if (logradouro) logradouro.value = dados.logradouro || "";
    if (bairro) bairro.value = dados.bairro || "";
    if (cidade) cidade.value = dados.localidade || "";
    if (estado) estado.value = dados.uf || "";
  }

  if (cepInput) {
    cepInput.addEventListener("blur", buscarEnderecoPorCep);
  }
});