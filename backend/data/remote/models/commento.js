import { DataTypes } from "sequelize";

export function createCommentoModel(database) {
  return database.define('commento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    testo: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    id_utente: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_issue: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    tableName: 'commento',
    timestamps: false
  });
}