const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Orcamento = require("./models/Orcamento");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

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

      for (const arquivo of arquivosFotos) {
        const b64 = Buffer.from(arquivo.buffer).toString("base64");
        const dataURI = `data:${arquivo.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
          resource_type: "image"
        });

        fotosUrls.push(result.secure_url);
      }

      const quantidade = await Orcamento.countDocuments();
      const protocolo = `TD${String(quantidade + 1).padStart(6, "0")}`;

      const novoOrcamento = new Orcamento({
        protocolo,
        nome: req.body.nome,
        telefone: req.body.telefone,
        email: req.body.email,
        cep: req.body.cep,
        logradouro: req.body.logradouro,
        numero: req.body.numero,
        bairro: req.body.bairro,
        cidade: req.body.cidade,
        estado: req.body.estado,
        descricao: req.body.descricao,
        fotos: fotosUrls,
        status: "Novo",
        observacoes: ""
      });

      await novoOrcamento.save();

      res.json({
        success: true,
        mensagem: "Orçamento enviado com sucesso!",
        protocolo
      });

    } catch (err) {
      console.error("Erro ao enviar orçamento:", err.message);

      res.status(500).json({
        success: false,
        erro: err.message
      });
    }
  }
);

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

app.put("/orcamentos/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const pedido = await Orcamento.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!pedido) {
      return res.status(404).json({
        success: false,
        erro: "Pedido não encontrado."
      });
    }

    res.json({
      success: true,
      pedido
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      erro: "Erro ao atualizar status."
    });
  }
});

app.put("/orcamentos/:id/observacoes", async (req, res) => {
  try {
    const observacoes = req.body.observacoes || "";

    const pedido = await Orcamento.findByIdAndUpdate(
      req.params.id,
      { $set: { observacoes } },
      { new: true }
    );

    if (!pedido) {
      return res.status(404).json({
        success: false,
        erro: "Pedido não encontrado."
      });
    }

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

app.delete("/orcamentos/:id", async (req, res) => {
  try {
    const pedidoExcluido = await Orcamento.findByIdAndDelete(req.params.id);

    if (!pedidoExcluido) {
      return res.status(404).json({
        success: false,
        erro: "Pedido não encontrado."
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