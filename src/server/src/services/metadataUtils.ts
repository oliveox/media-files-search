import { config } from '../config/config';

export class MetadataUtilsService {

    static makeMetadataUserFriendly(metadata: {[key: string]: any}) {

        let renamedMetadata: {[key: string]: any} = {};
        for (let fileType in metadata) {
            let fileTypeMetadata = metadata[fileType].metadata;
            let renamedFileTypeMetadata: {[key: string]: any} = {};
            let UIFriendlyKey;

            for (let key in fileTypeMetadata) {
                UIFriendlyKey = config.displayedMetadata[fileType][key];
                renamedFileTypeMetadata[UIFriendlyKey] = fileTypeMetadata[key];
            }

            renamedMetadata[fileType] = renamedFileTypeMetadata;
        }

        return renamedMetadata;
    }

    static UIFriendlyToRaw(UIFriendlyName: string, fileType: string) {
        const displayedMetadata = config.displayedMetadata[fileType];
        const rawPaths = Object.keys(displayedMetadata);
        for (let rawPath of rawPaths) {
            if (displayedMetadata[rawPath] === UIFriendlyName) {
                return rawPath;
            }
        }
        
        // no raw path found
        throw new Error(`No raw path was found for UI friendly [${fileType}] metadata [${UIFriendlyName}]`);
    }

     // merge new exif with an exif collection
    static getUpdatedMetadataCollection = (newExif: {[key: string] : any}, existingExif: {[key: string] : any}) => {
        for (let exifKey of Object.keys(newExif)) {
            const exifValue = newExif[exifKey];
            if (!Object.keys(existingExif).includes(exifKey)) {
                existingExif[exifKey] = [ exifValue ]; // add exif key to DB 
            } else if (!existingExif[exifKey].includes(exifValue)) {
                existingExif[exifKey].push(exifValue); // add value to persisted exif key
            }
        }

        return existingExif;
    }
}