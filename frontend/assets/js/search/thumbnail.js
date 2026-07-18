class ThumbnailGenerator {

    constructor(){

        this.cache = {};

    }


    async generate(videoPath){

        // Already generated
        if(this.cache[videoPath]){

            return this.cache[videoPath];

        }

        return new Promise((resolve)=>{

            const video = document.createElement("video");

            video.src = videoPath;

            video.muted = true;

            video.playsInline = true;

            video.preload = "metadata";

            video.crossOrigin = "anonymous";

            video.addEventListener("loadeddata",()=>{

                // Skip the black first frame
                video.currentTime = 1;

            });


            video.addEventListener("seeked",()=>{

                const canvas = document.createElement("canvas");

                canvas.width = video.videoWidth;

                canvas.height = video.videoHeight;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(
                    video,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const thumbnail =
                    canvas.toDataURL("image/jpeg",0.8);

                this.cache[videoPath] = thumbnail;

                resolve(thumbnail);

            });


            video.addEventListener("error",()=>{

                resolve(null);

            });

        });

    }

}


const ThumbnailEngine =
    new ThumbnailGenerator();