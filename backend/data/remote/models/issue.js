import { DataTypes } from "sequelize";

export function createIssueModel(database) {
  return database.define('issue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titolo: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    descrizione: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('Question', 'Bug', 'Documentation', 'Feature'),
      allowNull: false,
      validate: {
        isIn: [['Question', 'Bug', 'Documentation', 'Feature']]
      }
    },
    stato: {
      type: DataTypes.ENUM('TODO', 'In-Progress', 'Done'),
      allowNull: false,
      validate: {
        isIn: [['TODO', 'In-Progress', 'Done']]
      }
    },
    priorita: {
      type: DataTypes.ENUM('Alta', 'Media', 'Bassa'),
      allowNull: true,
      validate: {
        isIn: [['Alta', 'Media', 'Bassa']]
      }
    },
    id_creatore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_progetto: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    tableName: 'issue',
    timestamps: false
  });
}