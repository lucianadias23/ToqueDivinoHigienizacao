// Aguarda o HTML carregar antes de executar o JavaScript
document.addEventListener("DOMContentLoaded", () => {

  const formOrcamento = document.getElementById("formOrcamento");
  const cepInput = document.getElementById("cep");

  // =========================
  // ENVIO DO FORMULÁRIO
  // =========================
if (formOrcamento) {
  formOrcamento.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const botao = form.querySelector("button[type='submit']");
    const formData = new FormData(form);

    const inputFotos = document.getElementById("fotos");

    if (inputFotos && inputFotos.files.length > 5) {
      alert("Você pode enviar no máximo 5 fotos.");
      return;
    }

    botao.disabled = true;
    botao.innerText = "Enviando...";

    try {
      const resposta = await fetch("http://localhost:3000/enviar", {
        method: "POST",
        body: formData
      });

      const dados = await resposta.json();

      if (!dados.success) {
        alert("Erro ao enviar: " + (dados.erro || "Erro desconhecido."));
        return;
      }

      const mensagem = `Olá! Recebemos um novo orçamento.

Nome: ${formData.get("nome")}
Telefone: ${formData.get("telefone")}
Email: ${formData.get("email")}
Endereço: ${formData.get("logradouro")}, ${formData.get("numero")}
Bairro: ${formData.get("bairro")}
Cidade: ${formData.get("cidade")} - ${formData.get("estado")}
Descrição: ${formData.get("descricao")}
`;

      const telefoneEmpresa = "5511989671290";
      const linkWhatsApp =
        "https://wa.me/" + telefoneEmpresa + "?text=" + encodeURIComponent(mensagem);

      alert("Orçamento enviado com sucesso!");

      form.reset();

      if (typeof fecharModal === "function") {
        fecharModal();
      }
      
       function abrirMenu() {
    document.querySelector(".menu").classList.toggle("ativo");
      }

     
      setTimeout(() => {
        window.open(linkWhatsApp, "_blank");
      }, 300);

    } catch (erro) {
      console.error("Erro no envio:", erro);
      alert("Erro no servidor.");
    } finally {
      botao.disabled = false;
      botao.innerText = "Enviar";
    }
  });
}

  // =========================
  // API VIACEP
  // =========================
  if (cepInput) {
    cepInput.addEventListener("blur", async () => {
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

        document.getElementById("logradouro").value = dados.logradouro || "";
        document.getElementById("bairro").value = dados.bairro || "";
        document.getElementById("cidade").value = dados.localidade || "";
        document.getElementById("estado").value = dados.uf || "";

      } catch (erro) {
        console.error("Erro ViaCEP:", erro);
        alert("Erro ao buscar o CEP. Tente novamente.");
      }
    });
  }

});