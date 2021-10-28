// import fs from 'fs';

// const getFiles = async (path, validExtensions) => {

//     try {
//         const pathExists = await checkPathExists(path);
//         if (!pathExists) {
//             throw new Error(`Path doesn't exist: ${path}`);
//         }

//         const dirFiles = await getValidDirectoryFiles(path, validExtensions);

//         return dirFiles;
//     } catch(err) {
//         throw err;
//     } 
// }

// const checkPathExists = (path) => {
//     return new Promise((resolve, reject) => {
//         fs.exists(path, exists => resolve(exists))
//     })
// }

// const getValidDirectoryFiles = (path, validExtList) => {
//     return new Promise((resolve, reject) => {
//         fs.readdir(path, (err, files) => {
//             if (err) throw new Error(err);
    
//             const filePaths = files.filter(file => validExtList.includes
//                 (file.split('.').pop().toUpperCase()) // file extension
//             );

//             resolve(filePaths);
//         })
//     })
// }

// exports = {
//     getFiles
// }

