import MetadataAdapter from '../adapters/database/metadata';
import DigiKamAdapter from '../adapters/digikam/digikam';
import logger from '../config/winston';
import { MetadataUtilsService } from '../services/metadataUtils';
import GeneralUtilsService from '../services/generalUtils';

import { Request, Response } from 'express';

const search_getmenu = async (req: Request, res: Response) => {
    
    try {
        // get aggregated metadata json
        let metadata = await MetadataAdapter.getAllFileTypeMetadata() as {[key: string]: any};

        // make metadata keys user friendly
        metadata = MetadataUtilsService.makeMetadataUserFriendly(metadata);

        // get DigiKam categories tree
        const DigiKamCategories = await DigiKamAdapter.getCategoriesTree();

        // format response 
        const response = {
            metadata: GeneralUtilsService.jsonToCheckboxTreeStructure(metadata),
            categories: GeneralUtilsService.jsonToCheckboxTreeStructure(DigiKamCategories)
        }

        // return response
        res.json(response);
    } catch (err) {
        logger.error(`${err}`);
        res.status(500).send(`Woops, there is an error`)
    }
}

export default search_getmenu;