import { config } from  '../../config/config';
import FileUtilsService from '../fileUtils';
const ffprobe = require('ffprobe-client') ;
import logger from '../../config/winston';
import { AnyFileData, AnyFileMetadata, FManager } from '../../types/fManagerTypes';
import GeneralUtilsService from '../generalUtils';

import path from 'path';
import FileType from 'file-type';
import fs from 'fs';
const shell = require('any-shell-escape');

class VideoUtils {

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
            logger.warn(`Can't get extension for file categorized as [${GeneralUtilsService.fileTypeStringToEnum(FManager.FileType.VIDEO)}]. ${err}`);
        }

        // general video metadata using 'ffprobe'
        let probe;
        try {
            probe = await ffprobe(filePath);
        } catch (err) {
            logger.warn(`Can't get video metadata with 'ffprobe' library for file [${filePath}]. ${err}`);
        }

        
        // checksum
        let checksum;
        try {
            checksum = await FileUtilsService.getFileChecksum(filePath);
        } catch (err) {
            logger.warn(`Can't get checksum for video file [${filePath}]. ${err}`);
        }


        // thumbnail
        let gifExists = true;
        const gifFilename = `${checksum}.gif`;
        const gifFilePath = path.join(config.configFolderPath, gifFilename);

        // check if thumbnail exists already
        try {
            await fs.promises.access(gifFilePath);
            logger.warn(`Video already has GIF thumbnail. Video: [${filePath}]. Gif: [${gifFilePath}]`);    
        } catch(err) {
            gifExists = false;
        }

        if (!gifExists) {
            try {
                await VideoUtils.convertVideoToGIF(filePath, gifFilePath);
            } catch (err) {
                logger.error(`Could not create thumbnail for video file [${filePath}]. ${err}`);
            }
        }


        metadata = {
            extension: extension,
            probe: probe
        }

        const fileName = path.basename(filePath);
        const dirPath = path.dirname(filePath);

        return {
            filename: fileName,
            dirpath: dirPath,
            metadata: metadata,
            fileType: FManager.FileType.VIDEO,
            checksum: checksum
        }
    }


    static convertVideoToGIF = async (videoPath: string, gifPath: string) => {

        logger.debug(`Converting video to GIF. Src [${videoPath}]. Dest [${gifPath}]`);

        const convertVidToGif = shell([
            'ffmpeg',
            '-ss', config.videoStartPosition,
            '-t', config.videoAnalyseLength,
            '-i', videoPath,
        
            '-filter_complex', 
            "[0:v] fps=12,scale=480:-1,split [a][b];[a] palettegen [p];[b][p] paletteuse",
        
            gifPath
        ]);
        
        try {
            await GeneralUtilsService.executeProcess(convertVidToGif);
        } catch (err) {
            throw new Error(<any> err);
        }
    }
}

export default VideoUtils;