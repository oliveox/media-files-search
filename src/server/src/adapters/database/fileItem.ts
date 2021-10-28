import path from 'path';
import { Op } from 'sequelize';
import logger from '../../config/winston';
import { AnyFileData, AnalysedFileType, FManager } from '../../types/fManagerTypes';
import sequelize from '../../models/postgres_index';
import { MetadataUtilsService } from '../../services/metadataUtils';
import DigiKamAdapter from '../digikam/digikam';


class FileItemAdapter {

    static getAllFilePaths() {
        return new Promise((resolve, reject) => {
            const FileItemModel = sequelize.models.FileItem;
            let filePaths: Array<string> = [];

            FileItemModel.findAll({
                attributes: ['filename', 'dirpath']
            })
            .then((files: Array<any>) => {
                for (let file of files) {
                    const fileObject = file.toJSON() as AnalysedFileType;

                    const filename = fileObject.filename;
                    const dirname = fileObject.dirpath;
                    
                    const filePath = path.join(dirname, filename);
                    filePaths.push(filePath);
                }
                resolve(filePaths);
            })
            .catch(reject);
        })
    }

    static getAllFileItemsByFilename = async (filename: string) => {
        try {
            const FileItemModel = sequelize.models.FileItem;
            const fileItems = await FileItemModel.findAll({
                where: {
                    filename: { [Op.like]: `%${filename}%` }
                }
            });
            return fileItems;
        } catch (err) {
            throw new Error(<any> err);
        }
    }

    // TODO - isolate in a method the image.filename + directory concatenation for full-path
    // TODO - create a const ImageModel = sequelize.models.Image; on ImageAdapter import
    static getFilePathsFilename(filename: string) {
        return new Promise((resolve, reject) => {
            const FileItemModel = sequelize.models.FileItem;
            let filePaths: Array<string> = [];
            
            FileItemModel.findAll({
                where: {
                    filename: { [Op.like]: `%${filename}%` }
                }
            })
            .then((files: Array<any>) => {
                for (let file of files) {
                    const fileObject = file.toJSON() as AnalysedFileType;

                    const filename = fileObject.filename;
                    const dirname = fileObject.dirpath;
                    
                    const filePath = path.join(dirname, filename);
                    filePaths.push(filePath);
                }
                resolve(filePaths);
            })
            .catch(reject);
        })
    }

    static getAllFileItems = async () => {
        try {
            const FileItemModel = sequelize.models.FileItem;
            const fileItems = await FileItemModel.findAll();
            
            return fileItems;
        } catch (err) {
            throw new Error(<any> err);
        }
    }

    // TODO - isolate in a method the image.filename + directory concatenation for full-path
    // TODO - create a const ImageModel = sequelize.models.Image; on ImageAdapter import
    static getFilePathByFilename(filename: string) {

        return new Promise((resolve, reject) => {
            const FileItemModel = sequelize.models.FileItem;
            
            FileItemModel.findAll({
                where: {
                    filename: { [Op.like]: `%${filename}%` }
                }
            })
            .then(files => {
                let filePaths: Array<string> = [];
                files.forEach(fileData => {
                    const fileObject = fileData.toJSON() as AnalysedFileType;

                    const filename = fileObject.filename;
                    const dirname = fileObject.dirpath;

                    const filePath = path.join(dirname, filename);
                    filePaths.push(filePath);
                })
                resolve(filePaths);
            })
            .catch(reject);
        })
    }

    static persistFileItem = async (fileItemData: AnyFileData) => {
        const FileItemModel = sequelize.models.FileItem;
        const fileName = fileItemData.filename;

        FileItemModel.create(fileItemData)
        .then(res => {
            logger.debug(`Persisted file [${fileName}]`);
            return;
        })
        .catch(err => {
            throw new Error(`Error persisting file ${fileName}: \n ${err}`);
        });
    }

    static bulkPersistWithQuery = async (fileItemsData: Array<AnyFileData>) => {

        const FileItemModel = sequelize.models.FileItem;
        const tableName = FileItemModel.tableName;
        // const tableColumns = Object.keys(MediaFileModel.tableAttributes).filter(c => c != 'id').map(c => `"${c}"`);
        const tableColumns = Object.keys(FileItemModel.rawAttributes).filter(c => c != 'id').map(c => `"${c}"`);
        const conflictColumn = "checksum";

        let values = "";
        fileItemsData.forEach(fileItemData => {
            values += `(\
                '${fileItemData.filename}',\
                '${fileItemData.dirpath}',\
                '{}',\
                '${fileItemData.fileType}',\
                '${fileItemData.checksum}'\
                ),`;
        });
        values = values.slice(0, -1); // remove last ','

        // build query
        let queryString = 
        `INSERT INTO "${FileItemModel.tableName}" (${tableColumns})\
        VALUES ${values}\
        ON CONFLICT (checksum)\
        DO update SET\
        filename = EXCLUDED.filename,\
        dirpath = EXCLUDED.dirpath`;

        try {
            // execute query
            await sequelize.query(queryString, {logging: false});
        } catch (err) {
            throw err;
        }
    }

    static bulkPersistByTypeWithSequelize = async (filesData: Array<AnyFileData>, fileType: FManager.FileType) => {
        const FileItemModel = sequelize.models.FileItem;
        try {
            let result = await FileItemModel.bulkCreate(
                filesData,     
                {
                    //  updateOnDuplicate: ["filename", "dirpath"],
                    ignoreDuplicates: true 
                }
            );

            logger.debug(`Successfully persisted [${filesData.length}] [${fileType}] files: [${filesData}]`);
            logger.info(`Successfully persisted [${filesData.length}] [${fileType}] files`);

            return;
        } catch (err) {
            throw new Error(`Could not insert [${fileType}] files in the database: ${err}`);
        }
    }

    static getFileItemsBySearch = async (searchData: {[key: string]: any}) => {
        try {
            const FileItemModel = sequelize.models.FileItem;

            let queryConditionsList = [];
            const categoriesChain: Array<string> = searchData["categories"];
            const textField = searchData["textField"];
            const metadata = searchData["metadata"];

            let fileObject: Array<any>;
            if (categoriesChain && categoriesChain.length > 0) {

                let categories: Array<string> = [];

                // check categories for nested structures
                categoriesChain.forEach(c => {
                    // take the last element from the chain (separated by '_') 
                    let categorySteps = c.split("_");
                    let category = categorySteps[categorySteps.length-1]; 
                    categories.push(category);
                });


                fileObject = await DigiKamAdapter.getFilesByLabels(categories);

                // create condition for the DB query
                // (Filename is A AND Pathname is B) OR (Filename is C AND Pathname is D)
                let allCategoryConditions: Array<any> = [];
                fileObject.forEach(f => {
                    let fileName: string = f.Filename;

                    let dir: string = f.Pathname;
                    // check if last character is '/' and remove it
                    if (dir.substr(-1) === "/" || dir.endsWith("\\")) {
                        dir = dir.slice(0, dir.length-1);
                    }

                    let fileNameCondition = { filename: { [Op.eq]: fileName }};
                    let dirCondition = { dirpath: { [Op.eq]: dir }};
                    let fullPathCondition = { [Op.and]: [fileNameCondition, dirCondition] }
                    allCategoryConditions.push(fullPathCondition);
                });

                queryConditionsList.push( { [Op.or]: allCategoryConditions } );
            }

            if (textField && textField !== "") {
                queryConditionsList.push(
                    {filename: { [Op.like]: `%${textField}%` }}
                );
            }
    
            let jsonSearch;
            if (metadata && metadata.length > 0) {
                metadata.forEach((m: string) => {

                    // transform and split metadata path from a_b to a.b -> [a,b]
                    // /g = replace globally regex
                    let pathSteps = m.split("_");
                    let stepsLength = pathSteps.length;
                    let fileType = pathSteps[0];
                    
                    // retranslate the UI friendly part path in raw format
                    let UIFriendlyPartPath = pathSteps.slice(1, stepsLength - 1).join(".");
                    let rawPartPath = MetadataUtilsService.UIFriendlyToRaw(UIFriendlyPartPath, fileType);

                    let fullPath = `metadata.${rawPartPath}`;
                    let value: string | number = pathSteps[stepsLength-1];
                    
                    // check if string value is number
                    if (typeof value === "string" && !Number.isNaN(Number(value))) {
                        value = Number(value);
                    }

                    let searchCondition: {[key: string]: any} = {};
                    searchCondition[rawPartPath] = {[Op.eq]: value};
                    queryConditionsList.push({ 
                        metadata: searchCondition
                    });
                });
            }

            const fileItems = await FileItemModel.findAll({
                where: {    
                    [Op.and]: queryConditionsList
                }
            });

            return fileItems;
        } catch (err) {
            throw new Error(<any> err);
        }
    }
}

export default FileItemAdapter;