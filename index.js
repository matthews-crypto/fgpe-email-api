const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware pour parser le JSON et activer CORS
app.use(express.json());
app.use(cors({
  origin: '*', // En production, limitez ceci à votre domaine frontend
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Route pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
  res.send('FGPE Email API is running');
});

// Route pour envoyer un email
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false,
        message: 'Les paramètres to, subject et html sont requis' 
      });
    }
    
    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
    
    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
    
    console.log('Email envoyé avec succès:', data);
    return res.status(200).json({ 
      success: true,
      message: 'Email envoyé avec succès',
      data 
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`FGPE Email API running at http://localhost:${port}`);
});