import { exec } from 'child_process';
import logger from '../config/winston';
import { FilesByType, FManager } from '../types/fManagerTypes';

class GeneralUtilsService {

    /*
    Formats 
    from a json structure to a format suitable for CheckboxTree React component
    */
   
    static jsonToCheckboxTreeStructure = (initialStructure: {[key: string]: any}, prefix?: string) => {
        let result = Object.keys(initialStructure).map(key => {
            
            const nestedStructure = initialStructure[key];
            let formatedStructure: any = [];
            const uniqueID = prefix ? `${prefix}_${key}` : key;

            if (nestedStructure.constructor == Array) {
                nestedStructure.forEach(item => {
                    formatedStructure.push(
                        {
                            value: `${uniqueID}_${item}`,
                            label: item
                        }
                    );
                });

                formatedStructure = {
                    value: uniqueID, // compose unique ID key
                    label: key,
                    children: formatedStructure
                }   

                return formatedStructure;
            }

            if (nestedStructure.constructor == Object) {
                formatedStructure = {
                    value: uniqueID,
                    label: key,
                };    

                let nestedStructureChildren = GeneralUtilsService.jsonToCheckboxTreeStructure(
                    nestedStructure,
                    uniqueID
                );

                if (Object.keys(nestedStructureChildren).length > 0) {
                    formatedStructure["children"] = nestedStructureChildren;
                }

                return formatedStructure;
            }
        })

        return result;
    }

    static executeProcess = async (command: string) => {
        return new Promise((resolve, reject) => {
            logger.debug(`Executhing shell command: [${command}]`);
            exec(command, (err) => {
                if (err) reject(err);
                else resolve("done");
            })
        })
    }

    static splitFilesByType = (filesByType: FilesByType, splitNr: number): Array<any> => {
        let allFilesByTypeSplitted: Array<any> = [];
        for (let i = 0; i < splitNr; i++) {
            let filesByTypeFraction: FilesByType = {};
            Object.keys(FManager.FileType).forEach((type: string) => {
                let typeFiles: Array<string> = [];
                typeFiles = filesByType[type].filter((_, index) => index % splitNr === i);
                filesByTypeFraction[type] = typeFiles;
            });
            allFilesByTypeSplitted.push(filesByTypeFraction);
        }

        return allFilesByTypeSplitted;
    }

    static fileTypeEnumToString = (fileTypeEnum: FManager.FileType) => {
        return FManager.FileType[fileTypeEnum];
    }

    static fileTypeStringToEnum = (fileTypeString: string) => {
        return (<any>FManager.FileType)[fileTypeString];
    }
}

export default GeneralUtilsService;