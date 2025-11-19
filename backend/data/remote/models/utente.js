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
      allowNull: false,
      validate: {
        notEmpty: true
      }
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
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      set(value) {
        const hashedPassword = bcrypt.hashSync(value, 10);
        this.setDataValue('password', hashedPassword);
      },
      validate: {
        notEmpty: true
      }
    },
    ruolo: {
      type: DataTypes.ENUM('Amministratore', 'Standard'),
      allowNull: false,
      validate: {
        isIn: [['Amministratore', 'Standard']]
      }
    }
  }, {
    tableName: 'utente',
    timestamps: false,
  });
}