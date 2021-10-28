import { config } from '../config/config';
import logger from '../config/winston';
import { fileTypesList } from '../models/fileItem';
import { AnyFileMetadata, FManager } from '../types/fManagerTypes';
import FileUtilsService from './fileUtils';
import FileItemPersistService from './filePersist';
import GeneralUtilsService from './generalUtils';

type FileByType = {
    [key: string]: Array<string>
}

class FileService {

    static mapFilesByFileType = async (filePaths: Array<string>):  Promise<FileByType> => {
        
        // create empty object based on supported media types
        let filePathsByType: FileByType = {};

        fileTypesList.forEach(fileType => {
            filePathsByType[fileType] = [];
        });
        

        // categorize files based on media type
        logger.info(`Categorizing each file with a certain media type`);
        for (const filePath of filePaths) {
            const fileType = await FileUtilsService.getFileType(filePath);
            filePathsByType[fileType].push(filePath);
        }

        return filePathsByType;
    }

    // static extractFileData = async (filePath: string, fileType: string) => {
    static extractFileData = async (filePath: string) => {
        // const fileTypeEnum = (<any>MediaType)[fileType];
        const fileType = await FileUtilsService.getFileType(filePath);
        const fileTypeEnum = GeneralUtilsService.fileTypeStringToEnum(fileType);
        try {
            logger.info(`Extracting data from [${fileType}] file.`);
            logger.debug(`Extracting data from from [${fileType}] file [${filePath}]`);

            const fileTypeDataFetcher = FileItemPersistService.getFileTypeDataFetcher(fileTypeEnum);
            const fileData = await fileTypeDataFetcher(filePath);

            // filter metadata for each file type
            if (fileData.metadata) {
                let filter = undefined;
                let metadataToRemove: Array<string> = config.metadataToBeRemoved[fileTypeEnum];
                
                if (metadataToRemove && metadataToRemove.length > 0 ) {
                    
                    // removal filter
                    filter = (key: string) => {
                        for (let m of metadataToRemove) {
                            if (key.startsWith(m)) return false;
                        }
                        return true;
                    }
                } 

                fileData.metadata = FileUtilsService.formatAndFilterMetadataJSON(fileData.metadata, fileType, undefined, filter) as AnyFileMetadata;
            }   

            return {
                type: fileType,
                data: fileData
            };

        } catch (err) {
            throw err;
        }
    }
}

export default FileService;

