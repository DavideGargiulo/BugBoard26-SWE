import { DataTypes } from "sequelize";

export function createUtenteModel(database) {
  return database.define('utente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    keycloak_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
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
    ruolo: {
      type: DataTypes.ENUM('Amministratore', 'Standard'),
      allowNull: false
    },
    ultimo_sync: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: 'utente',
    timestamps: true,
  });
}