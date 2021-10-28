import logger from '../config/winston';
import FileItemPersistService from '../services/filePersist';

import { Request, Response } from 'express';

const analyseByRootPath = async (req: Request, res: Response) => {

    if (req.body.constructor === Object && Object.keys(req.body).length === 0) 
        res.status(500).send(`No path received for files persistance`);
    
    const rootPath = req.body;
    logger.debug(`Received [${rootPath}] as root path for files persistance.`);

    try {
        await FileItemPersistService.parallelPersistFileItemsByRootPath(rootPath);
        res.send("ok");
    } catch (err) {
        logger.error(`${err}`);
        if ((<any> err).code === 'ENOENT') 
            res.status(500).send(`Path [${rootPath}] doesn't exist`);
        else 
            res.status(500).send(`Woops, there is an error`)
    }
}

const analysByFilePaths = async (req: Request, res: Response) => {

    const filePaths = req.body;

    logger.debug(`Received [${JSON.stringify(filePaths)}] as root path for files persistance.`);

    try {
        await FileItemPersistService.persistFileItemsByFilePaths(filePaths);
        res.send("ok");
    } catch (err) {
        logger.error(`${err}`);
        res.status(500).send(`Woops, there is an error`)
    }

}

export default analyseByRootPath;