import { DataTypes } from "sequelize";

export function createProgettoModel(database) {
  return database.define('progetto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    }
  }, {
    tableName: 'progetto',
    timestamps: false
  });
}