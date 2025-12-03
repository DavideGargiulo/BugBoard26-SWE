import { Utente } from '../data/remote/Database.js';

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