import FileItemAdapter from '../adapters/database/fileItem';
import logger from '../config/winston';
import FileUtilsService from '../services/fileUtils';

import { Request, Response } from 'express';

const gallery_index = async (req: Request, res: Response) => {

    try {
        let fileItems = await FileItemAdapter.getAllFileItems();

        // filter media paths and format response
        fileItems = await FileUtilsService.getUISupportedFiles(fileItems);
        
        res.json(fileItems);
    } catch (err) {
        logger.error(`${err}`);
        res.status(500).send(`Woops, there is an error!`)
    }
}

const gallery_search =  async (req: Request, res: Response) => {

    try {
        const searchData = JSON.parse(req.body);
        const textSearchTerm = searchData["textField"];

        logger.info(`Text field search term: ${textSearchTerm}`);

        let filePaths = await FileItemAdapter.getFileItemsBySearch(searchData);
        filePaths = await FileUtilsService.getUISupportedFiles(filePaths);

        res.json(filePaths);
    } catch (err) {
        logger.error(`${err}`)
        res.status(500).send(`Woops, there is an error: ${err}`)
    }
}

export = {
    gallery_index, 
    gallery_search
}