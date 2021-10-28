import { ExpandedTags } from "exifreader"
import { IAudioMetadata } from "music-metadata"

export namespace FManager {
    export enum FileType {
        IMAGE="IMAGE",
        VIDEO="VIDEO",
        AUDIO="AUDIO",
        NOT_SUPPORTED="NOT_SUPPORTED"
    }
}

export type AnalysedFileType = {
    filename: string,
    dirpath: string,
    metadata: JSON, 
    fileType: FManager.FileType
}

export type AggregatedMetadataType = {
    fileType: FManager.FileType,
    metadata: JSON
}

export type AnyFileMetadata = {
    extension: string | undefined,

    // audio
    mm?: IAudioMetadata,

    // image
    exif?: ExpandedTags,
    sharp?: JSON,

    // video
    probe?: JSON,
}

export type AnyFileData = {
    filename: string,
    dirpath: string
    metadata: AnyFileMetadata,
    fileType: FManager.FileType,
    checksum: string | undefined
}

export type FilesByType = {
    [key: string]: Array<string>
}
