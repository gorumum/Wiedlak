npm init -y
npm install express multer
node server.js
// server.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Para lidar com o sistema de arquivos

const app = express();
const PORT = 3000;
const SECRET_PIN = "12345"; // O mesmo PIN usado no frontend

// --- Configuração do Multer (Onde e como salvar) ---

// 1. Define o destino e o nome do arquivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    // Cria o diretório se ele não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Cria um nome de arquivo único (ex: 1678889999-imagem.jpg)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB por arquivo
});

// --- Configuração do Express ---

// Serve arquivos estáticos (HTML, CSS, JS) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Middleware para permitir que o Express leia o corpo de requisições JSON e de formulários simples
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// --- Rota de Upload (POST /upload) ---

app.post('/upload', upload.single('imageFile'), (req, res) => {
  // 1. Verifica a segurança (o PIN é enviado no corpo da requisição)
  const userPin = req.body.pinCode;

  if (userPin !== SECRET_PIN) {
    // Se o PIN estiver errado, deleta o arquivo que o Multer acabou de salvar
    if (req.file) {
        fs.unlinkSync(req.file.path);
    }
    return res.status(401).json({ success: false, message: 'Código de segurança incorreto.' });
  }

  // 2. Verifica se o arquivo foi realmente enviado e salvo
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
  }

  // 3. Sucesso!
  // Retorna o caminho público da imagem
  // Nota: req.file.filename é o nome que o Multer criou (ex: 1678889999-imagem.jpg)
  const imageUrl = `/uploads/${req.file.filename}`;

  console.log(`[Upload SUCESSO]: Imagem salva em: ${imageUrl}`);
  return res.json({ success: true, url: imageUrl, message: 'Imagem postada com sucesso!' });

});


// --- Iniciar o Servidor ---

app.listen(PORT, () => {
  console.log(`🚀 Servidor Wiedlak Gallery rodando em http://localhost:${PORT}`);
});
