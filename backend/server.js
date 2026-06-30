const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");


require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
        complemento: req.body.complemento,
        bairro: req.body.bairro,
        cidade: req.body.cidade,
        estado: req.body.estado,
        descricao: req.body.descricao,
        fotos: fotosUrls,
        status: "Novo",
        observacoes: ""
      });

      await novoOrcamento.save();

      try {
         await transporter.sendMail({

      
          from: `"Toque Divino Higienização" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_TO,
          subject: `📩 Novo orçamento recebido - Protocolo ${protocolo}`,
          html: `
            <h2>Novo orçamento recebido pelo site</h2>

            <p><strong>Protocolo:</strong> ${protocolo}</p>
            <p><strong>Cliente:</strong> ${req.body.nome}</p>
            <p><strong>Telefone:</strong> ${req.body.telefone}</p>
            <p><strong>E-mail:</strong> ${req.body.email || "Não informado"}</p>

            <hr>

            <p>
             ${req.body.logradouro || ""}, ${req.body.numero || ""}<br>
             ${req.body.complemento ? "Complemento: " + req.body.complemento + "<br>" : ""}
             ${req.body.bairro || ""}<br>
             ${req.body.cidade || ""} - ${req.body.estado || ""}<br>
             CEP: ${req.body.cep || ""}

            </p>
            
                       
            <hr>

            <p><strong>Descrição do serviço:</strong></p>
            <p>${req.body.descricao || "Não informado"}</p>

            <hr>

            <p><strong>Quantidade de fotos enviadas:</strong> ${fotosUrls.length}</p>

            <p>Acesse o painel administrativo para visualizar o pedido completo.</p>
          `,
        });

        console.log("E-mail de notificação enviado com sucesso.");
      } catch (emailErro) {
        console.error("Erro ao enviar e-mail:", emailErro.message);
      }

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