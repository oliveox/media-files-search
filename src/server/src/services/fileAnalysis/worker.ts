import FileService from '../fileService';

const fileAnalysisWorker = async ({filePath, fileType}: {[key: string]: string}) => {
    try {
        const fileData: any = await FileService.extractFileData(filePath);
        return fileData;
    } catch (err) {
        throw err;
    }
}

export default fileAnalysisWorker;