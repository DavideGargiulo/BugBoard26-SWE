import { Commento } from '../data/remote/Database.js';

export const countCommentsByIssueId = async (issueId) => {
  try {
    const count = await Commento.count({
      where: { id_issue: issueId }
    });
    return count;
  }
  catch (error) {
    throw new Error(`Errore nel conteggio dei commenti: ${error.message}`);
  }
};