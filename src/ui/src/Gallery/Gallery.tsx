import React from 'react';

type MediaUnit = {
    type: string,
    thumbnailPath: string,
    filePath: string
}

type GalleryProps = {
    mediaUnits: Array<MediaUnit>
}

const Gallery = (props: GalleryProps) => {

    // if (!props.mediaUnits) {
    //     // console.error(`Gallery component needs array prop. Recieved: ${mediaUnits}`);
    //     return null;
    // }

    const gallery = (
            <div className="row text-center text-lg-left">
            {
                props.mediaUnits.map(mediaUnit =>
                    {
                        let mediaType = mediaUnit.type;
                        let thumbnailPath: string = "";
                        let hoverControl = null;
                        switch(mediaUnit.type) {
                            case "AUDIO":
                                thumbnailPath = "audio_thumbnail.png";                                
                                break;
                            case "VIDEO": 
                            case "IMAGE":
                                if (mediaUnit.thumbnailPath)
                                    thumbnailPath = mediaUnit.thumbnailPath;
                                break;
                            // case "IMAGE":
                            //     thumbnailPath = mediaUnit.filePath;
                            //     break;
                            default:
                                thumbnailPath = "not_supported.png";
                                break;
                        }

                        if (thumbnailPath) {
                            thumbnailPath = `${process.env.PUBLIC_URL}${thumbnailPath}`
                        }

                        return (
                            <div className="col-lg-3 col-md-4 col-6">
                                <a href="#" className="d-block mb-4 h-100">
                                    <img 
                                        className="img-fluid img-thumbnail" 
                                        src={encodeURI(thumbnailPath)} 
                                        alt={mediaType}
                                    />
                                </a>
                            </div>
                        );
                    }
                )
            }
            </div>
    );

    return gallery;                

}

export default Gallery;