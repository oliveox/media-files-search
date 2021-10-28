import FileItemAdapter from '../adapters/database/fileItem';
import MetadataAdapter from '../adapters/database/metadata';
import { config } from '../config/config';
import logger from '../config/winston';
import { fileTypesList } from '../models/fileItem';
import { AnyFileData, AnyFileMetadata, FilesByType, FManager, AnalysedFileType } from '../types/fManagerTypes';
import parallelExtractFileData from './fileAnalysis/master';
import FileService from './fileService';
import FileSystemService from './fileSystem';
import AudioUtils from './fileTypes/audio';
import ImageUtils from './fileTypes/image';
import NotSupportedTypeService from './fileTypes/not_supported';
import VideoUtils from './fileTypes/video';
import FileUtilsService from './fileUtils';
import GeneralUtilsService from './generalUtils';
import { MetadataUtilsService } from './metadataUtils';
import spawnRAMmemoryChecker from './memoryMonitor/master';

// import launchWorkers from './workerThreads/main';

class FileItemPersistService {

    static persistFileItemsByFilePaths = async (filePaths: Array<string>) => {

        try {
            const filePathsByType: FilesByType = await FileService.mapFilesByFileType(filePaths);

            // bulk upload each media type associated files
            logger.info(`Bulk persisting each category of files`);
            for (let fileType of fileTypesList) {
                const filePaths = filePathsByType[fileType];
    
                // await MediaPersistService.bulkPersist(filePaths, (<any>MediaType)[mediaType]);
                await FileItemPersistService.bulkPersistByType(filePaths, GeneralUtilsService.fileTypeStringToEnum(fileType));
            }
    
            return;
        } catch (err) {
            throw err;
        }
        
    }

    static persistFileItemsByRootPath = async (rootPath: string) => {
        try {
            logger.info(`Attempting to recursively persist in the database all files under path [${rootPath}]`);
            let filePaths = await FileSystemService.getFilesList(rootPath);

            const filePathsByType: FilesByType = await FileService.mapFilesByFileType(filePaths);

            // bulk upload each media type associated files
            logger.info(`Bulk persisting each category of files`);
            for (let fileType of fileTypesList) {
                const filePaths = filePathsByType[fileType];

                // await MediaPersistService.bulkPersist(filePaths, (<any>MediaType)[mediaType]);
                await FileItemPersistService.bulkPersistByType(filePaths, GeneralUtilsService.fileTypeStringToEnum(fileType));
            }

            return;
        } catch (err) {
            throw err;
        }
    }

    static parallelPersistFileItemsByRootPath = async (rootPath: string) => {
        try {

            // launchWorkers();

            logger.info(`Persist in the database all files under path [${rootPath}]`);
            let filePaths = await FileSystemService.getFilesList(rootPath);

            // map file paths by its media type
            // const filesByType: FilesByType = await FileService.mapFilesByFileType(filePaths);

            // spawn memory monitoring thread

            await spawnRAMmemoryChecker();

            // extract data from each file  
            const filesData: Array<any> = await parallelExtractFileData(filePaths);

            ////////////////////////////////////////
            // map file data by type

            // parallel? persist file data by type

            // parallel aggregate metadata by type
            ////////////////////////////////////////

            // 
            let fileType: string;
            for (fileType of Object.keys(FManager.FileType)) {
                let typeFilesData = filesData.filter(f => f.type === fileType).map(f => f.data);

                if (typeFilesData.length > 0) {
                    // let fileTypeEnum = (<any>MediaType)[fileType];
                    let fileTypeEnum = GeneralUtilsService.fileTypeStringToEnum(fileType);
                    // if error occurs --> try persisting the next file type
                    try {

                        // persist file data
                        await FileItemAdapter.bulkPersistByTypeWithSequelize(typeFilesData, fileTypeEnum);

                        // aggregate and persist metadata
                        let fileTypeMetadata: any = await MetadataAdapter.getFileTypeMetadata(fileTypeEnum);
                        if (!fileTypeMetadata) fileTypeMetadata = {};
                        for (let fileData of typeFilesData) {
                            if (fileData.metadata) {
                                let fileMetadata = fileData.metadata;
                                fileTypeMetadata = MetadataUtilsService.getUpdatedMetadataCollection(fileMetadata, fileTypeMetadata);
                            }
                        }

                        await MetadataAdapter.persistMetadata(fileTypeMetadata, fileTypeEnum);
                    } catch (err) {
                        logger.error(`Error: [${err}]`);
                    }
                }
            }

            return;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    static bulkPersistByType = async (filePaths: Array<string>, fileType: FManager.FileType) => {

        try {
            logger.info(`Attempting to persist [${fileType}] files.`);
            logger.debug(`Attempting to persist [${fileType}] files [${filePaths}]`);

            let filesDataList: Array<AnyFileData> = [];
            let fileTypeMetadata: any;

            fileTypeMetadata = await MetadataAdapter.getFileTypeMetadata(fileType);
            if (!fileTypeMetadata) fileTypeMetadata = {};

            const fileTypeDataFetcher = FileItemPersistService.getFileTypeDataFetcher(fileType);

            logger.info(`Analysing [${fileType}] files and aggregating their metadata`);
            for (const filePath of filePaths) {

                // let fileData = FileService.extractFileData(filePath, FManager.FileType[fileType]);

                // extract media file data
                const fileData = await fileTypeDataFetcher(filePath);

                // filter metadata for each media type file
                if (fileData.metadata) {
                    let filter = undefined;
                    let metadataToRemove: Array<string> = config.metadataToBeRemoved[fileType];

                    if (metadataToRemove && metadataToRemove.length > 0) {

                        // removal filter
                        filter = (key: string) => {
                            for (let m of metadataToRemove) {
                                if (key.startsWith(m)) return false;
                            }
                            return true;
                        }
                    }

                    let formatedAndFilteredMetadata = FileUtilsService.formatAndFilterMetadataJSON(fileData.metadata, fileType, undefined, filter);
                    fileData.metadata = formatedAndFilteredMetadata as AnyFileMetadata;
                }

                filesDataList.push(fileData);

                // update searchable media type metadata
                let fileMetadata = fileData.metadata;
                if (fileMetadata) {
                    // filter to be aggregated metadata
                    fileMetadata = FileUtilsService.filterToBeAggregatedMetadata(fileMetadata, fileType);

                    // update aggregated metadata
                    fileTypeMetadata = MetadataUtilsService.getUpdatedMetadataCollection(fileMetadata, fileTypeMetadata);
                }
            }

            // persist media type metadata
            await MetadataAdapter.persistMetadata(fileTypeMetadata, fileType);

            // persist media files data
            // await MediaFileAdapter.bulkPersistWithQuery(mediaFilesDataList);
            await FileItemAdapter.bulkPersistByTypeWithSequelize(filesDataList, fileType);

            logger.debug(`[${fileType}] files successfully inserted in the database [${filePaths}]`);
            logger.info(`[${fileType}] files successfully inserted in the database`);

        } catch (err) {
            throw err;
        }
    }

    static getFileTypeDataFetcher = (fileType: FManager.FileType) => {
        switch (fileType) {
            case FManager.FileType.IMAGE:
                return ImageUtils.getData;
            case FManager.FileType.VIDEO:
                return VideoUtils.getData;
            case FManager.FileType.AUDIO:
                return AudioUtils.getData;
            case FManager.FileType.NOT_SUPPORTED:
                return NotSupportedTypeService.getData;
            default:
                return NotSupportedTypeService.getData;
        }
    }
}

export default FileItemPersistService;
