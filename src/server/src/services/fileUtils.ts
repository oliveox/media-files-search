const fs = require('fs').promises;
import crypto from 'crypto';
import FileType from 'file-type';
import path from 'path';
import { config } from '../config/config';
import logger from '../config/winston';
import { FManager } from '../types/fManagerTypes';

class FileUtilsService {

    static getFileTypeByExtension(fileExtension: string) {
        const supportedFileExtensions = config.supportedFileTypeExtensions;
        for (const fileType of Object.keys(supportedFileExtensions)) {
            if (supportedFileExtensions[fileType].includes(fileExtension))
                return fileType;
        }

        return FManager.FileType.NOT_SUPPORTED;
    }

    /*
        get a nested json in format of 
        'the.whole.json.path.to.the.last.key.level' : last_key_level_value

        useful for file metadata formating before persisting in DB
    */
    static formatAndFilterMetadataJSON = (jsonObject: any, fileType: string, keyPrefix?: string, filter?: any,) => {
        let formatedJSON: {[key: string]: any} = {};
        let displayedMetadataKeys = Object.keys(config.displayedMetadata[fileType]); // RAM eater ? 
        // logger.debug(`Metadata: [${config.displayedMetadata[fileType]}]`);

        if (jsonObject)
            for (let key of Object.keys(jsonObject)) {
                let keyString = keyPrefix ? `${keyPrefix}.${key.toString()}` : key.toString();
                const value = jsonObject[key];

                if (typeof(value) === 'object') {
                    const result = FileUtilsService.formatAndFilterMetadataJSON(value, fileType, keyString, filter);
                    Object.assign(formatedJSON, result);

                } else if (displayedMetadataKeys.includes(keyString) && !FileUtilsService.isInvalidForPersist(keyString)) {
                    if (filter) {
                        // check filter exists and keyString is valid according to filter
                        if (filter(keyString)) formatedJSON[keyString] = value;     
                    } else {
                        formatedJSON[keyString] = value;
                    }
                }
            }

        return formatedJSON;
    }   

    static getFileChecksum = async (filePath: string) => {
        
        const checksum = (str: string) => crypto
                        .createHash(config.algorithm)
                        .update(str)
                        .digest(config.encoding);

        try {
            const fileContent = await fs.readFile(filePath);
            const fileChecksum = checksum(fileContent);
            return fileChecksum;
        } catch (err) {
            throw err;
        }
    }

    static getFileType = async (filePath: string): Promise<FManager.FileType> => {
        const fileType = await FileType.fromFile(filePath);
        const mimeSplit: string| undefined = fileType ? fileType.mime.split('/')[0].toUpperCase() : undefined;

        if (mimeSplit) {
            let fileType: FManager.FileType;
            switch (mimeSplit) {
                case "AUDIO":
                    fileType = FManager.FileType.AUDIO;
                    break;  
                case "VIDEO":
                    fileType = FManager.FileType.VIDEO;
                    break;
                case "IMAGE":
                    fileType = FManager.FileType.IMAGE;
                    break;
                default:
                    fileType = FManager.FileType.NOT_SUPPORTED;
                    break;
            }
    
            logger.debug(`File [${filePath}] has type: [${fileType}]`);
            return fileType;
        }

        logger.warn(`Can't get type for file [${filePath}]`);
        return FManager.FileType.NOT_SUPPORTED;
    }

    static getUISupportedFiles = async (fileItems: any) => {

        let supportedFilePaths: Array<any> = [];
        let fileUnit: {[key: string]: any};
        for(let fileItem of fileItems) {
            const filePath = path.join(fileItem.dirpath, fileItem.filename);
            const fileType = fileItem.fileType;
            const extension = fileItem.metadata.extension;

            if (extension && config.UiSupportedExtensions.includes(extension.toLowerCase())){
                // get formated response
                fileUnit = {
                    type: fileType,
                    filePath: filePath
                };

                if (fileType === FManager.FileType.VIDEO) {
                    const thumbnailFilename = `${fileItem.checksum}.gif`;
                    const thumbnailPath = path.join(config.configFolderName, thumbnailFilename);
                    fileUnit["thumbnailPath"] = thumbnailPath;
                }

                if (fileType === FManager.FileType.IMAGE) {
                    const thumbnailFilename = `${fileItem.checksum}.${path.extname(filePath)}`;
                    const thumbnailPath = path.join(config.configFolderName, thumbnailFilename);
                    fileUnit["thumbnailPath"] = thumbnailPath;
                }

                supportedFilePaths.push(fileUnit);    
            }
        }

        return supportedFilePaths;
    }

    static filterToBeAggregatedMetadata(metadata: any, fileType: FManager.FileType) {

        const fileTypeDisplayedMetadata = config.displayedMetadata[fileType];
        if (fileTypeDisplayedMetadata) {
            const toBeDisplayedMetadata = Object.keys(fileTypeDisplayedMetadata);
            let filteredMetadata: {[key: string]: any} = {};
    
            for (const key in metadata) {
                if (toBeDisplayedMetadata.includes(key)) filteredMetadata[key] = metadata[key];
            }
    
            return filteredMetadata;
        }

        return metadata;
        
    }

    static getFileExtensionFromFilename(filePath: string): string | undefined{
        const fileName = path.basename(filePath);
        const ext: string = path.extname(fileName);

        if (ext.length < 0) {
            return undefined;
        }

        return ext;
    }

    static async getFileExtensionFromType(filePath: string): Promise<string | undefined> {
        // extension
        let extension = undefined;
        const type = await FileType.fromFile(filePath);

        if (!type) {
            logger.warn(`Can't get any file type data about ${filePath}`);
        } else {
            extension = type.ext;
        }

        return extension;
    }

    static async getFileExtension(filePath: string): Promise<string | undefined> {

        let extension;

        // get extension using file type
        extension = await FileUtilsService.getFileExtensionFromType(filePath);

        
        // get extension using filename
        if (!extension) {
            extension = FileUtilsService.getFileExtensionFromFilename(filePath);            
        }
        
        return extension;
    }

    static isInvalidForPersist(value: string) {
        // detect weird unicode characters that break persistance in postgres (C in regex means -- Other)
        return value.match(/\p{C}/gu) !== null; 
    }
}

export default FileUtilsService;