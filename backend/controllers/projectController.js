import { Progetto } from '../data/remote/Database.js';

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Progetto.findAll({
      attributes: ['nome'],
      order: [['nome', 'ASC']]
    });
    const frontendProjects = projects.map(project => ({
      name: project.nome
    }));
    res.json(frontendProjects);
  } catch (error) {
    console.error('Errore recupero progetti:', error);
    res.status(500).json({ error: 'Errore nel recupero dei progetti' });
  }
};