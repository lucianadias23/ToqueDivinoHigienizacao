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

      const novoOrcamento = new Orcamento({
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

      await novoOrcamento.save();

      res.json({
        success: true,
        mensagem: "Orçamento enviado com sucesso!"
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

    app.listen(3000, () => {
      console.log("Servidor rodando na porta 3000");
    });

  } catch (err) {
    console.log("Erro ao conectar MongoDB:", err.message);
  }
}

iniciarServidor();