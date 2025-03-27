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
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Route pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
  res.send('FGPE Email API is running');
});

// Route pour envoyer un email
app.post('/send-email', async (req, res) => {
  try {
    const { email, requestData, previousStatus } = req.body;
    
    if (!email || !requestData || !requestData.status) {
      return res.status(400).json({ 
        error: 'Les paramètres email et requestData sont requis' 
      });
    }

    // Générer le sujet de l'email en fonction du statut
    const subject = getEmailSubject(requestData.status);
    
    // Générer le contenu HTML de l'email
    const htmlContent = generateEmailContent(requestData, previousStatus);
    
    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: subject,
      html: htmlContent,
    });
    
    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return res.status(500).json({ error });
    }
    
    console.log('Email envoyé avec succès:', data);
    return res.json({ data });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`FGPE Email API running at http://localhost:${port}`);
});

// Fonction pour obtenir le sujet de l'email en fonction du statut
function getEmailSubject(status) {
  switch (status) {
    case 'submitted':
      return 'Votre demande de garantie a été soumise avec succès';
    case 'under_review':
      return 'Votre demande de garantie est en cours d\'examen';
    case 'draft':
      return 'Votre demande a été approuvée par le comité d\'évaluation';
    case 'approved':
      return 'Félicitations ! Votre demande de garantie a été approuvée';
    case 'rejected':
      return 'Votre demande de garantie n\'a pas été retenue';
    case 'cancelled':
      return 'Votre demande de garantie a été annulée';
    default:
      return 'Mise à jour de votre demande de garantie';
  }
}

// Fonction pour générer le contenu HTML de l'email
function generateEmailContent(requestData, previousStatus) {
  // Obtenir la description du statut actuel
  const statusDescription = getStatusDescription(requestData.status);
  
  // Générer le fil d'Ariane
  const breadcrumb = generateBreadcrumb(requestData.status);
  
  // Formater les montants
  const formattedLoanAmount = formatAmount(requestData.loanAmount);
  const formattedGuaranteeAmount = requestData.guaranteeAmount 
    ? formatAmount(requestData.guaranteeAmount) 
    : 'Non défini';
  
  // Générer le contenu HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${getEmailSubject(requestData.status)}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 3px solid #0056b3;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .breadcrumb {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        .breadcrumb-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        .breadcrumb-item.active {
          font-weight: bold;
          color: #0056b3;
        }
        .breadcrumb-item.completed {
          color: #28a745;
        }
        .breadcrumb-item.pending {
          color: #6c757d;
        }
        .breadcrumb-item.rejected {
          color: #dc3545;
        }
        .breadcrumb-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #f8f9fa;
          border: 2px solid #6c757d;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 5px;
        }
        .breadcrumb-item.active .breadcrumb-circle {
          border-color: #0056b3;
          background-color: #0056b3;
          color: white;
        }
        .breadcrumb-item.completed .breadcrumb-circle {
          border-color: #28a745;
          background-color: #28a745;
          color: white;
        }
        .breadcrumb-item.rejected .breadcrumb-circle {
          border-color: #dc3545;
          background-color: #dc3545;
          color: white;
        }
        .breadcrumb-line {
          position: absolute;
          top: 15px;
          left: 50%;
          width: 100%;
          height: 2px;
          background-color: #6c757d;
          z-index: -1;
        }
        .breadcrumb-item:first-child .breadcrumb-line {
          display: none;
        }
        .details {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        .details-item {
          margin-bottom: 10px;
        }
        .details-item strong {
          display: inline-block;
          width: 150px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #0056b3;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FGPE - Fonds de Garantie</h1>
          <p>Mise à jour de votre demande de garantie</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          
          <p>${statusDescription}</p>
          
          <div class="breadcrumb">
            ${breadcrumb}
          </div>
          
          <div class="details">
            <h3>Détails de votre demande</h3>
            <div class="details-item">
              <strong>Référence :</strong> ${requestData.id}
            </div>
            <div class="details-item">
              <strong>Entreprise :</strong> ${requestData.companyName}
            </div>
            <div class="details-item">
              <strong>Montant du prêt :</strong> ${formattedLoanAmount} GNF
            </div>
            ${requestData.guaranteePercentage ? `
            <div class="details-item">
              <strong>Pourcentage garanti :</strong> ${requestData.guaranteePercentage}%
            </div>
            ` : ''}
            ${requestData.guaranteeAmount ? `
            <div class="details-item">
              <strong>Montant garanti :</strong> ${formattedGuaranteeAmount} GNF
            </div>
            ` : ''}
            <div class="details-item">
              <strong>Statut actuel :</strong> ${getStatusLabel(requestData.status)}
            </div>
          </div>
          
          <p>Pour suivre l'évolution de votre demande, vous pouvez vous connecter à votre espace personnel sur notre plateforme.</p>
          
          <a href="https://fgpe.gn/login" class="button">Accéder à mon espace</a>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          
          <p>Cordialement,<br>L'équipe FGPE</p>
        </div>
        
        <div class="footer">
          <p>Fonds de Garantie des Prêts aux Entreprises de Guinée (FGPE)</p>
          <p>Adresse : Immeuble Kakandé, 5ème étage, Kaloum, Conakry, Guinée</p>
          <p>Téléphone : +224 XXX XXX XXX | Email : contact@fgpe.gn</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Fonction pour générer le fil d'Ariane
function generateBreadcrumb(currentStatus) {
  const statuses = [
    { status: 'submitted', label: 'Soumise' },
    { status: 'under_review', label: 'En examen' },
    { status: 'draft', label: 'Évaluée' },
    { status: 'approved', label: 'Approuvée' }
  ];
  
  // Déterminer l'index du statut actuel
  const currentIndex = statuses.findIndex(s => s.status === currentStatus);
  
  // Si le statut est rejeté ou annulé, utiliser un fil d'Ariane spécial
  if (currentStatus === 'rejected' || currentStatus === 'cancelled') {
    return statuses.map((status, index) => {
      let className = 'breadcrumb-item';
      
      if (status.status === 'under_review') {
        className += ' completed';
      } else if (index < statuses.findIndex(s => s.status === 'under_review')) {
        className += ' completed';
      } else if (status.status === currentStatus) {
        className += ' rejected';
      } else {
        className += ' pending';
      }
      
      return `
        <div class="${className}">
          ${index > 0 ? '<div class="breadcrumb-line"></div>' : ''}
          <div class="breadcrumb-circle">${index + 1}</div>
          <div>${status.label}</div>
        </div>
      `;
    }).join('') + `
      <div class="breadcrumb-item rejected">
        <div class="breadcrumb-line"></div>
        <div class="breadcrumb-circle">X</div>
        <div>${currentStatus === 'rejected' ? 'Rejetée' : 'Annulée'}</div>
      </div>
    `;
  }
  
  // Fil d'Ariane normal
  return statuses.map((status, index) => {
    let className = 'breadcrumb-item';
    
    if (status.status === currentStatus) {
      className += ' active';
    } else if (index < currentIndex) {
      className += ' completed';
    } else {
      className += ' pending';
    }
    
    return `
      <div class="${className}">
        ${index > 0 ? '<div class="breadcrumb-line"></div>' : ''}
        <div class="breadcrumb-circle">${index + 1}</div>
        <div>${status.label}</div>
      </div>
    `;
  }).join('');
}

// Fonction pour obtenir la description du statut
function getStatusDescription(status) {
  switch (status) {
    case 'submitted':
      return 'Nous avons bien reçu votre demande de garantie. Elle a été enregistrée dans notre système et sera examinée par notre équipe dans les plus brefs délais.';
    case 'under_review':
      return 'Votre demande de garantie est actuellement en cours d\'examen par notre comité de vérification. Nous vous tiendrons informé de l\'avancement de votre dossier.';
    case 'draft':
      return 'Nous avons le plaisir de vous informer que votre demande a été approuvée par notre comité d\'évaluation. Elle est maintenant en attente de la décision finale de notre comité de décision.';
    case 'approved':
      return 'Félicitations ! Votre demande de garantie a été approuvée par notre comité de décision. Vous pouvez maintenant procéder aux étapes suivantes avec votre institution financière.';
    case 'rejected':
      return 'Nous regrettons de vous informer que votre demande de garantie n\'a pas été retenue par notre comité d\'évaluation. Vous trouverez ci-dessous les détails et les raisons de cette décision.';
    case 'cancelled':
      return 'Nous regrettons de vous informer que votre demande de garantie a été annulée par notre comité de décision. Vous trouverez ci-dessous les détails et les raisons de cette décision.';
    default:
      return 'Votre demande de garantie a été mise à jour. Veuillez trouver ci-dessous les détails actuels de votre dossier.';
  }
}

// Fonction pour obtenir le libellé du statut
function getStatusLabel(status) {
  switch (status) {
    case 'submitted':
      return 'Soumise';
    case 'under_review':
      return 'En cours d\'examen';
    case 'draft':
      return 'Approuvée par le comité d\'évaluation';
    case 'approved':
      return 'Approuvée';
    case 'rejected':
      return 'Rejetée';
    case 'cancelled':
      return 'Annulée';
    default:
      return status;
  }
}

// Fonction pour formater les montants
function formatAmount(amount) {
  return new Intl.NumberFormat('fr-GN').format(amount);
}