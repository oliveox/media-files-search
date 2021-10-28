import FileUtilsService from '../fileUtils';
import logger from '../../config/winston';
import { AnyFileData, AnyFileMetadata, FManager } from '../../types/fManagerTypes';

import path from 'path';
import FileType from 'file-type';
const MusicMetadata = require('music-metadata');

class AudioUtils {

    static getData = async (filePath: string): Promise<AnyFileData> => {
        
        // get file metadata
        let metadata: AnyFileMetadata;

        // extension
        let extension;
        try {
            const type = await FileType.fromFile(filePath);

            if (!type) {
                throw new Error(`Can't get any file type data about ${filePath}`);
            }

            extension = type.ext;
        } catch (err) {
            logger.warn(`Can't get extension for file categorized as [${FManager.FileType[FManager.FileType.AUDIO]}]. ${err}`); // refactor
        }

        // general image metadata using 'ffprobe'
        let mm;
        try {
            mm = await MusicMetadata.parseFile(filePath);
        } catch (err) {
            logger.warn(`Can't get audio metadata with 'MusicMetadata' library. ${err}`);
        }


        // checksum
        let checksum;
        try {
            checksum = await FileUtilsService.getFileChecksum(filePath);
        } catch (err) {
            logger.error(`Can't get audio file checksum. ${err}`);
        }

        metadata = {
            extension: extension,
            mm: mm,
        }

        const fileName = path.basename(filePath);
        const dirPath = path.dirname(filePath);

        return {
            filename: fileName,
            dirpath: dirPath,
            metadata: metadata,
            fileType: FManager.FileType.AUDIO,
            checksum: checksum
        }
    }
}

export default AudioUtils;