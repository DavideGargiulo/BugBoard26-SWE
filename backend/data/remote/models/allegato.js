import { DataTypes } from "sequelize";

export function createAllegatoModel(database) {
  return database.define('allegato', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome_file_originale: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    nome_file_storage: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    percorso_relativo: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    tipo_mime: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    dimensione_byte: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        max: 5242880
      }
    },
    hash_sha256: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    id_commento: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    id_issue: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'allegato',
    timestamps: false,
    validate: {
      checkXor() {
        const commento = this.id_commento || null;
        const issue = this.id_issue || null;

        if ((commento !== null && issue !== null) ||
            (commento === null && issue === null)) {
          throw new Error('Un allegato deve essere associato O a un commento O a un\'issue');
        }
      }
    }
  });
}