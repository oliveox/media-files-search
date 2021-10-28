import logger from '../../config/winston';

import path, { resolve } from 'path';
const fs = require('fs').promises;
import url from 'url';
const si = require('systeminformation');


class DigiKamAdapter {

    static getFileLabels(filename: string, dirpath: string) {
        const sqliteDB = require('../../models/sqlite_index');
        return new Promise((resolve, reject) => {

            sqliteDB.all(
                // TODO - relativePath different than Folders
                getFileLabelsQuery,
                [dirpath, filename],
                (err: Error, result: Array<string>) => {
                    if (err) reject(err);
                    else resolve(result.map(label => Object.values(label)[0]));
                }
            );
        })
    }

    static async getCategoriesTree(parentID?: number): Promise<object> {
        return new Promise(async (resolve, reject) => {
            try {
                if (parentID !== undefined) {
                    let tagIDs: Array<string> = await DigiKamUtils.getOneTagTreeLevel(parentID);

                    let tree: { [key: string]: object } = {};
                    if (tagIDs.length > 0) {
                        for (let tagID of tagIDs) {
                            let tagLabel: string = await DigiKamUtils.getTagLabelByID(tagID);
                            let subTree = await DigiKamAdapter.getCategoriesTree(parseInt(tagID));
                            tree[tagLabel] = subTree;
                        }
                    }
                    resolve(tree);
                } else {
                    let result = await DigiKamAdapter.getCategoriesTree(0); // root categories have parentId = 0
                    resolve(result);
                }
            } catch (err) {
                reject(err);
            }
        })
    }

    static async getFilesByLabels(labels: Array<string>): Promise<Array<FilesByLabelType>> {

        // get files by labels
        logger.debug(`Fetching files with labels [${labels}]`);

        // label -> TagID -> ImageID -> filename, folderID -> filename, folder
        const filenamesAndDirs: Array<FilesByLabelType> = await DigiKamUtils.getFilesAndFoldersByLabels(labels);
        const albumRootIdentifierPathMap = await DigiKamUtils.getAlbumRootIdentifierPathMap();

        let validPaths: Array<FilesByLabelType> = [];

        // filter for only files    
        let e: any;
        for (e of filenamesAndDirs) {
            let fileName = e.name;
            let deviceUUID = e.identifier.split("uuid=")[1];
            let devicePath = albumRootIdentifierPathMap[deviceUUID.toLowerCase()];
            
            let dir = path.join(devicePath, e.dirPath);

            // workaround white-space escaping for fs.stat
            let filePath = `file://${path.join(dir, fileName)}`;
            filePath = url.fileURLToPath(filePath);

            try {
                const stats = await fs.stat(filePath);
                if (!stats.isDirectory()) validPaths.push({ Filename: fileName, Pathname: dir });
            } catch (err) {
                logger.error((<any>err).message);
            }

        }

        return validPaths;
    }
}


class DigiKamUtils {
    
    static getAlbumRootIdentifierPathMap = async() => {
        
        let albumRootIdentifierPathMap: any = {};
        let albumRootIdenfitiers;
        try {
            albumRootIdenfitiers = await this.getAlbumRootIdentifiers();

            if (!albumRootIdenfitiers || albumRootIdenfitiers.length == 0) throw `No album root identifiers found.`
        } catch (err) {
            logger.error(`Could not fetch DigiKam album root identifiers: ${err}`);
            throw err;
        }

        let albumRootBlockDevicesUUIDs: Array<string> = <Array<string>> albumRootIdenfitiers?.map(i => i.split("uuid=")[1].toLowerCase())

        // get device root path
        try {
            let blockdevides = await si.blockDevices();
            for (let device of blockdevides) {
                let deviceUUID: string = device.uuid.toLowerCase();
                let deviceIdentifier: string = device.identifier;
                if (albumRootBlockDevicesUUIDs.includes(deviceUUID)) {
                    albumRootIdentifierPathMap[deviceUUID] = deviceIdentifier;
                }
            }

            return albumRootIdentifierPathMap;
        } catch (err) {
            logger.error(`Could not fetch block devices UUIDs`);
            throw err;
        }
    }

    static getAlbumRootIdentifiers(): Promise<Array<string>> {
        const sqliteDB = require('../../models/sqlite_index');
        return new Promise((resolve, reject) => {
            sqliteDB.all(
                getAlbumRootsIdentifiersQuery,
                (err: Error, result: Array<string>) => {
                    if (err) reject(err);
                    else resolve(result.map(label => Object.values(label)[0]));
                }
            );
        })
    }
    
    static getOneTagTreeLevel(parentID: number): Promise<Array<string>> {
        const sqliteDB = require('../../models/sqlite_index');
        return new Promise((resolve, reject) => {
            sqliteDB.all(
                getOneTagTreeLevelQuery,
                [parentID],
                (err: Error, result: Array<string>) => {
                    if (err) reject(err);
                    else resolve(result.map(label => Object.values(label)[0]));
                }
            );
        })
    }

    static getTagLabelByID(tagID: string): Promise<string> {
        const sqliteDB = require('../../models/sqlite_index');
        return new Promise((resolve, reject) => {
            sqliteDB.all(
                getTagLabelByIDQuery,
                [tagID],
                (err: Error, result: Array<string>) => {
                    if (err) reject(err);
                    else resolve(result.map(label => Object.values(label)[0])[0]);
                }
            );
        })
    }

    static getFilesAndFoldersByLabels(labels: Array<string>): Promise<Array<FilesByLabelType>> {
        const sqliteDB = require('../../models/sqlite_index');
        return new Promise((resolve, reject) => {
            const placeholder: string = labels.map(() => "?").join(",");
            const query = DigiKamUtils.getFilesByLabels(placeholder);
            sqliteDB.all(
                query,
                labels,
                (err: Error, result: Array<FilesByLabelType>) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        })
    }

    static getFilesByLabels = (placeholder: string) => {
        const query = `
            select t3.name, t4.specificPath || t3.relativePath as dirPath, t4.identifier from
            (select t1.name, t2.relativePath, t2.albumRoot from
            (select album, name from Images
            where id in
            (select imageid from ImageTags
            where tagid IN
            (select id from tags
            where name in (${placeholder})
            ))) as t1
            JOIN 
            Albums as t2
            ON t1.album = t2.id
            ) as t3 
            JOIN
            AlbumRoots as t4
            ON t3.albumRoot = t4.id
        `;

        return query;
    }

}

type FilesByLabelType = {
    Filename: string
    Pathname: string
}

const getFileLabelsQuery = `
select name from Tags
where id like
(select tagid from ImageTags
where imageid like
(select id from Images 
where album like
(select id from Albums where relativePath LIKE ?)
and
name like ?))
`

const getOneTagTreeLevelQuery =
    `
select id from Tags
where pid = ?
`;

const getTagLabelByIDQuery =
    `
select name from Tags
where id = ?
`;

const getAlbumRootsIdentifiersQuery = 
`
select identifier from AlbumRoots
`

export default DigiKamAdapter;
