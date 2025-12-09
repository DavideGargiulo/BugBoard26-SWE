import { Progetto } from '../data/remote/Database.js';

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Progetto.findAll({
      attributes: ['nome'],
      order: [['nome', 'ASC']]
    });
    const frontendProjects = projects.map(project => ({
      nome: project.nome // Corretto: mappa su 'nome'
    }));
    res.json(frontendProjects);
  } catch (error) {
    console.error('Errore recupero progetti:', error);
    res.status(500).json({ error: 'Errore nel recupero dei progetti' });
  }
};

export const createProject = async (req, res) => {
  const { nome } = req.body;

  try {
    const newProject = await Progetto.create({ nome });
    res.status(201).json({ id: newProject.id, nome: newProject.nome });
  } catch (error) {
    console.error('Errore creazione progetto:', error);
    res.status(500).json({ error: 'Errore nella creazione del progetto' });
  }
};