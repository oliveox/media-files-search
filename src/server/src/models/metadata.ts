import { DataTypes, Sequelize } from "sequelize";

const metadata = (sequelize: Sequelize) => {
    const metadata = sequelize.define('Metadata', {
        fileType: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        }},
        {tableName: 'Metadata'}
    );
}

export default metadata;