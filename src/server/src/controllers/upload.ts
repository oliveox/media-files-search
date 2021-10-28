import { config } from  '../config/config';
import FileItemPersistService from '../services/filePersist';

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage(
    {
        destination: (req, file, cb) => {
            cb(null, config.uploadFolderPath);
        },
        filename:  (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    }
);

const upload = multer({storage: storage}).array('file');  

const upload_files = async (req: Request, res: Response) => {
    upload(req, res, async (err: any) => {

        if (err) res.status(500).json(err).end();

        if (req.files.length > 0) {
            let filePaths: Array<any> = [];
            const fileObjects: any = req.files;
            for (let i = 0; i < fileObjects.length; i++) {
                let fileName = fileObjects[i].filename;
                let fullPath = path.join(config.uploadFolderPath, fileName);
                filePaths.push(fullPath);
            }

            // analyse file
            await FileItemPersistService.persistFileItemsByFilePaths(filePaths);

            res.status(200).json(req.files).end();
        }
        
        res.status(200).send("No files uploaded");
    });
}

export default upload_files;    