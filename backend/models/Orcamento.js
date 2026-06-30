const mongoose = require("mongoose");

const OrcamentoSchema = new mongoose.Schema({
  protocolo: {
    type: String,
    unique: true
  },

  nome: String,
  telefone: String,
  email: String,

  cep: String,
  logradouro: String,
  numero: String,
  bairro: String,
  cidade: String,
  estado: String,
  complemento: String,
  descricao: String,

  fotos: [String],

  status: {
    type: String,
    default: "Novo"
  },

  observacoes: {
    type: String,
    default: ""
  },

  criadoEm: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Orcamento", OrcamentoSchema);