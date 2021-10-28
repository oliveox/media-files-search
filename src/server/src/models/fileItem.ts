import { DataTypes, Sequelize } from 'sequelize';
import {FManager} from '../types/fManagerTypes';

// export const mediaTypesList: Array<string> = Object.keys(MediaType).filter(k => typeof MediaType[k as any] === "number");
export const fileTypesList: Array<string> = Object.keys(FManager.FileType);

export const fileItem = (sequelize: Sequelize) => {
    const FileItem = sequelize.define('FileItem', {
        filename: {
            type: DataTypes.STRING,
            unique: 'uniqueFileComposite',
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        dirpath: {
            type: DataTypes.STRING,
            unique: 'uniqueFileComposite',
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        fileType: {
            type: DataTypes.ENUM({values: fileTypesList}),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        checksum: {
            // primaryKey: true,
            type: DataTypes.STRING,
            unique: 'uniqueFileComposite',
            allowNull: true,
            validate: {
                notEmpty: true
            }
        },
    }, 
    {
        tableName: 'FileItems',
        timestamps: false
    }
)};