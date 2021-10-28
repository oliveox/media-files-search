import sequelize from '../../models/postgres_index';

import logger from '../../config/winston';
import { FManager, AggregatedMetadataType} from '../../types/fManagerTypes';

class MetadataAdapter {

    static getAllFileTypeMetadata = () => {
        return new Promise((resolve, reject) => {
            const MetadataModel = sequelize.models.Metadata;
            let response: {[key: string]: object} = {};
    
            MetadataModel.findAll()
            .then(rows => {
                rows.forEach(row => {
                    
                    const metadataObject = row.toJSON() as AggregatedMetadataType;

                    const fileType = metadataObject.fileType;
                    response[fileType] = row;
                })
                resolve(response)
            })
            .catch(reject);
        })
    }

    static persistMetadata = async (metadata: object, fileType: FManager.FileType) => {
        const Metadata = sequelize.models.Metadata;
    
        Metadata.findOne({where: {fileType: fileType}})
        .then(obj => {
            if (obj) {
                obj.update({metadata: metadata});
                logger.debug(`Updated [${fileType}] file type metadata collection`);
            }
            else {
                Metadata.create({fileType: fileType, metadata: metadata});
                logger.debug(`Created [${fileType}] file type metadata collection`);
            }
        })
        .catch(err => {throw err});
    }

    static getFileTypeMetadata = async (fileType: FManager.FileType) => {

        const MetadataModel = sequelize.models.Metadata;
    
        MetadataModel.findOne({
            where: { fileType: fileType }
        })
        .then(res => res)
        .catch(err => {throw err});
    }
}

export default MetadataAdapter;