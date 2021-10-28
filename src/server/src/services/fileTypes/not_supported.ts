import FileUtilsService from '../fileUtils';
import logger from '../../config/winston';

import path from 'path';
import FileType from 'file-type';
import { AnyFileData, AnyFileMetadata, FManager } from '../../types/fManagerTypes';
import GeneralUtilsService from '../generalUtils';

class NotSupportedTypeService {

    static getData = async (filePath: string): Promise<AnyFileData> => {

        // get file metadata
        let metadata: AnyFileMetadata;

        // extension
        let extension;
        try {
            const type = await FileType.fromFile(filePath);

            if (!type) {
                logger.warn(`Can't get file extension from its type for [${GeneralUtilsService.fileTypeStringToEnum(FManager.FileType.NOT_SUPPORTED)}] file: [${filePath}]`)

                // get extension from filename
                extension = FileUtilsService.getFileExtensionFromFilename(filePath);

                if (!extension) {
                    throw Error(`Can't get file extension from filename for [${GeneralUtilsService.fileTypeStringToEnum(FManager.FileType.NOT_SUPPORTED)}] file: [${filePath}]`)
                }

                logger.warn(`Got [${extension}] from filename string for [${GeneralUtilsService.fileTypeStringToEnum(FManager.FileType.NOT_SUPPORTED)}] file: [${filePath}]`);
            } else {
                extension = type.ext;
            }
            
        } catch (err) {
            logger.warn(`Can't get extension for file categorized as [${GeneralUtilsService.fileTypeStringToEnum(FManager.FileType.NOT_SUPPORTED)}]. ${err}`);
            extension = "unknown";
        }


        // checksum
        let checksum;
        try {
            checksum = await FileUtilsService.getFileChecksum(filePath);
        } catch (err) {
            logger.warn(`Can't get checksum for [${GeneralUtilsService.fileTypeStringToEnum(FManager.FileType.NOT_SUPPORTED)}] file [${filePath}]. ${err}`);
        }

        metadata = {
            extension: extension
        }

        const fileName = path.basename(filePath);
        const dirPath = path.dirname(filePath);

        return {
            filename: fileName,
            dirpath: dirPath,
            metadata: metadata,
            fileType: FManager.FileType.NOT_SUPPORTED,
            checksum: checksum
        }
    }
}

export default NotSupportedTypeService;