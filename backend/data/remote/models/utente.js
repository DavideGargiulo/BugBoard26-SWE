import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";

export function createUtenteModel(database) {
  return database.define('utente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cognome: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      set(value) {
        const hashedPassword = bcrypt.hashSync(value, 10);
        this.setDataValue('password', hashedPassword);
      }
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