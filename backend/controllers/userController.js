import { Utente } from '../data/remote/Database.js';
import KeycloakService from '../services/KeycloakService.js';
import 'dotenv/config';

export const getAllUsers = async (req, res) => {
  try {
    const users = await Utente.findAll({
      attributes: ['nome', 'cognome', 'ruolo', 'email'],
      order: [['cognome', 'ASC'], ['nome', 'ASC']]
    });

    const frontendUsers = users.map(userProfile => ({
      name: `${userProfile.nome} ${userProfile.cognome}`,
      role: userProfile.ruolo === 'Amministratore' ? 'Amministratore' : 'Standard',
      email: userProfile.email
    }));

    res.json(frontendUsers);
  } catch (error) {
    console.error('Errore recupero utenti:', error);
    res.status(500).json({ error: 'Errore nel recupero degli utenti' });
  }
};

export const deleteUser = async (req, res) => {
  const { email } = req.params;

  console.log(`Richiesta di eliminazione utente ricevuta: ${email}`);

  try {
    // 1. Verifica che l'utente esista nel database locale
    const user = await Utente.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        error: 'Utente non trovato nel database locale'
      });
    }

    // 2. Impedisci l'auto-eliminazione (opzionale ma consigliato)
    if (req.user && req.user.email === email) {
      return res.status(403).json({
        error: 'Non puoi eliminare il tuo stesso account'
      });
    }

    // 3. Verifica che l'utente abbia un keycloak_id
    if (user.keycloak_id) {
      // 4. Elimina l'utente da Keycloak
      try {
        await KeycloakService.deleteUser(user.keycloak_id);
        console.log(`Utente eliminato da Keycloak: ${email} (ID: ${user.keycloak_id})`);
      } catch (keycloakError) {
        console.error('Errore durante l\'eliminazione da Keycloak:', keycloakError);

        // Se l'utente non esiste più su Keycloak, continua comunque
        // altrimenti restituisci errore
        if (!keycloakError.message.includes('404') && !keycloakError.message.includes('Not Found')) {
          return res.status(500).json({
            error: 'Errore durante l\'eliminazione da Keycloak',
            details: keycloakError.message
          });
        }
        console.log('Utente non trovato su Keycloak, procedo con eliminazione locale');
      }
    } else {
      console.warn(`Utente ${email} non ha keycloak_id, elimino solo dal DB locale`);
    }

    // 5. Elimina l'utente dal database locale
    const deletedUserData = {
      email: user.email,
      name: `${user.nome} ${user.cognome}`,
      ruolo: user.ruolo
    };

    await user.destroy();
    console.log(`Utente eliminato dal database locale: ${email}`);

    // 6. Risposta di successo
    res.json({
      message: 'Utente eliminato con successo',
      deletedUser: deletedUserData
    });

  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'utente:', error);
    res.status(500).json({
      error: 'Errore durante l\'eliminazione dell\'utente',
      details: error.message
    });
  }
};