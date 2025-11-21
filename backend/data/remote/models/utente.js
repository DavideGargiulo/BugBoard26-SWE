import { DataTypes } from "sequelize";

export function createUtenteModel(database) {
  return database.define('utente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cognome: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ruolo: {
      type: DataTypes.ENUM('Amministratore', 'Standard'),
      allowNull: false
    }
  }, {
    tableName: 'utente',
    timestamps: false,
  });
}