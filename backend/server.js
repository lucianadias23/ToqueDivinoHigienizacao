const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const app = express();

app.use(cors());
app.use(express.json());

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// Modelo do orçamento
const Orcamento = mongoose.model("Orcamento", {
  protocolo: {
    type: String,
    unique: true
  },
  nome: String,
  telefone: String,
  email: String,
  cep: String,
  logradouro: String,
  bairro: String,
  cidade: String,
  estado: String,
  numero: String,
  descricao: String,
  fotos: [String],
  status: {
    type: String,
    default: "Novo"
  },
  criadoEm: {
    type: Date,
    default: Date.now
  }
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Enviar orçamento
app.post(
  "/enviar",
  upload.fields([
    { name: "fotos", maxCount: 5 },
    { name: "foto", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      let fotosUrls = [];

      const arquivosFotos = [
        ...(req.files?.fotos || []),
        ...(req.files?.foto || [])
      ];

      if (arquivosFotos.length > 0) {
        for (const arquivo of arquivosFotos) {
          const b64 = Buffer.from(arquivo.buffer).toString("base64");
          const dataURI = `data:${arquivo.mimetype};base64,${b64}`;

          const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "image"
          });

          fotosUrls.push(result.secure_url);
        }
      }

      const quantidade = await Orcamento.countDocuments();
      const protocolo = `TD${String(quantidade + 1).padStart(6, "0")}`;

      const novoOrcamento = new Orcamento({
        protocolo: protocolo,
        nome: req.body.nome,
        telefone: req.body.telefone,
        email: req.body.email,
        cep: req.body.cep,
        logradouro: req.body.logradouro,
        bairro: req.body.bairro,
        cidade: req.body.cidade,
        estado: req.body.estado,
        numero: req.body.numero,
        descricao: req.body.descricao,
        fotos: fotosUrls,
        status: "Novo"
      });

      console.log("Protocolo gerado:", protocolo);
      console.log(novoOrcamento);

      await novoOrcamento.save();

     res.json({
     success: true,
     mensagem: "VERSAO NOVA AGORA",
     protocolo: protocolo
    });

    } catch (err) {
      console.log("ERRO AO ENVIAR ORÇAMENTO:");
      console.log(err.message);

      res.status(500).json({
        success: false,
        erro: err.message
      });
    }
  }
);

// Listar orçamentos
app.get("/orcamentos", async (req, res) => {
  try {
    const orcamentos = await Orcamento.find().sort({ criadoEm: -1 });
    res.json(orcamentos);
  } catch (erro) {
    res.status(500).json({
      success: false,
      erro: erro.message
    });
  }
});

// Atualizar status
app.put("/orcamentos/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const orcamento = await Orcamento.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({
      success: true,
      orcamento
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      erro: erro.message
    });
  }
});

app.put("/orcamentos/:id/observacoes", async (req, res) => {
  try {
    const { observacoes } = req.body;

    const pedido = await Orcamento.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        erro: "Pedido não encontrado."
      });
    }

    pedido.observacoes = observacoes;
    await pedido.save();

    res.json({
      success: true,
      pedido
    });

  } catch (erro) {
    console.error("Erro ao salvar observações:", erro);

    res.status(500).json({
      success: false,
      erro: "Erro ao salvar observações."
    });
  }
});

// Excluir orçamento
app.delete("/orcamentos/:id", async (req, res) => {
  try {
    const pedidoExcluido = await Orcamento.findByIdAndDelete(req.params.id);

    if (!pedidoExcluido) {
      return res.status(404).json({
        success: false,
        erro: "Pedido não encontrado"
      });
    }

    res.json({
      success: true,
      mensagem: "Pedido excluído com sucesso!"
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      erro: erro.message
    });
  }
});

async function iniciarServidor() {
  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB conectado");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
     console.log(`Servidor rodando na porta ${PORT}`);
});

  } catch (err) {
    console.log("Erro ao conectar MongoDB:", err.message);
  }
}

iniciarServidor();