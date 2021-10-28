import FileUtilsService from '../fileUtils';
import { config } from  '../../config/config';

import ExifReader from 'exifreader';
import path from 'path';
import FileType from 'file-type';
const sharp = require('sharp');
import logger from '../../config/winston';
import { AnyFileData, AnyFileMetadata, FManager } from '../../types/fManagerTypes';
import GeneralUtilsService from '../generalUtils';
const fs = require('fs').promises;

class ImageUtils {
    
    static getData = async (filePath: string): Promise<AnyFileData> => {

        // get file metadata
        let metadata: AnyFileMetadata;

        // exif
        let exif;
        try {
            exif = await ImageUtils.getExif(filePath);
            let exif2 = await sharp(filePath).metadata();
            console.log(exif2);
        } catch (err) {
            logger.warn(`Can't get exif with for image [${filePath}]. ${err}`);
        }

        // extension
        let extension;
        try {
            const type = await FileType.fromFile(filePath);

            if (!type) {
                throw new Error(`Can't get any file type data about ${filePath}`);
            }

            extension = type.ext;
        } catch (err) {
            logger.warn(`Can't get extension for file categorized as [${GeneralUtilsService.fileTypeEnumToString(FManager.FileType.IMAGE)}]. ${err}`);
        }

        // general image metadata using 'sharp' library
        let sharpResult;
        try {
            sharpResult = await sharp(filePath).metadata();
        } catch (err) {
            logger.warn(`Can't get image metadata with 'sharp' library for [${filePath}]. ${err}`);
        }
        

        // checksum
        let checksum;
        try {
            checksum = await FileUtilsService.getFileChecksum(filePath);
        } catch (err) {
            logger.warn(`Can't get checksum for image file [${filePath}]. ${err}`);
        }

        // thumbnail
        let thumbnailExists = true;
        const thumbnailFilename = `${checksum}.${path.extname(filePath)}`;
        const thumbnailFilePath = path.join(config.configFolderPath, thumbnailFilename);

        // check if thumbnail exists already
        try {
            await fs.promises.access(thumbnailFilePath);
            logger.warn(`Image already has GIF thumbnail. Image: [${filePath}]. Thumbnail: [${thumbnailFilePath}]`);    
        } catch(err) {
            thumbnailExists = false;
        }

        if (!thumbnailExists) {
            try {
                await sharp(filePath).resize({width: 500}).toFile(thumbnailFilePath);
            } catch (err) {
                logger.error(`Could not create thumbnail [${thumbnailFilePath}] for image file [${filePath}]. ${err}`);
            }
        }

        metadata = {
            extension: extension,
            exif: exif,
            sharp: sharpResult
        }

        const fileName = path.basename(filePath);
        const dirPath = path.dirname(filePath);

        return {
            filename: fileName,
            dirpath: dirPath,
            metadata: metadata,
            fileType: FManager.FileType.IMAGE,
            checksum: checksum
        }
    }

    static getExif = async (imagePath: string) => {
        try {
            let fileContent = await fs.readFile(imagePath);
            const exif = ExifReader.load(fileContent, {expanded: true});
            return exif;
        } catch (err) {
            throw err;
        }
    }   
}


export default ImageUtils;