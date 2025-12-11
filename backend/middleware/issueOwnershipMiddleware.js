import { Issue } from '../data/remote/Database.js';

/**
 * Verifica che l'utente possa modificare l'issue:
 * - Gli amministratori possono modificare qualsiasi issue
 * - Gli utenti normali possono modificare solo le issue da loro create (id_creatore)
 */
export const canModifyIssue = async (req, res, next) => {
  try {
    const issueId = req.params.id;
    const userId = req.user.sub || req.user.id;

    // Verifica se l'utente è amministratore
    const realmRoles = req.user.realm_access?.roles || [];
    const resourceAccess = req.user.resource_access || {};

    const allClientRoles = [];
    for (const clientData of Object.values(resourceAccess)) {
      if (clientData.roles) {
        allClientRoles.push(...clientData.roles);
      }
    }

    const allRoles = [...realmRoles, ...allClientRoles];
    const isAdmin = allRoles.includes('Amministratore');

    if (isAdmin) {
      return next();
    }

    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue non trovata' });
    }

    if (issue.id_creatore && issue.id_creatore.toString() === userId.toString()) {
      return next();
    }

    return res.status(403).json({
      message: 'Non hai i permessi per modificare questa issue',
      reason: 'Puoi modificare solo le issue da te create'
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Errore nel controllo dei permessi',
      error: error.message
    });
  }
};