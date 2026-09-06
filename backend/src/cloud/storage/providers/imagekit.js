import StorageCredentials from "../credentials.js";


class ImageKitProvider {


    constructor(){

        this.id = "imagekit";

        this.name = "ImageKit";

    }





    async upload(file, env, metadata = {}){


        const credentials =
        StorageCredentials.getImageKit(env);



        if(
            !credentials.publicKey ||
            !credentials.privateKey ||
            !credentials.urlEndpoint
        ){

            return {

                success:false,

                provider:this.name,

                error:
                "ImageKit credentials missing"

            };

        }





        const form =
        new FormData();



        form.append(
            "file",
            file
        );


        form.append(
            "fileName",
            isVideo ? "cloudtok-video-" + Date.now() + ".mp4" : "cloudtok-thumbnail-" + Date.now() + ".jpg"
        );



        // support both video and thumbnail roles
        const isVideo = metadata.role === "video";
        form.append(
            "folder",
            isVideo ? "/cloudtok/videos" : "/cloudtok/thumbnails"
        );



        if(metadata.userId){

            form.append(
                "tags",
                "user_" + metadata.userId
            );

        }





        const authString =
        btoa(
            credentials.privateKey + ":"
        );



        const response =
        await fetch(

            "https://upload.imagekit.io/api/v1/files/upload",

            {

                method:"POST",

                headers:{

                    Authorization:
                    "Basic " + authString,

                    "x-public-key":
                    credentials.publicKey

                },

                body:form

            }

        );





        const result =
        await response.json();





        if(!response.ok){

            return {

                success:false,

                provider:this.name,

                error:
                result.message ||
                "ImageKit upload failed"

            };

        }





        const hls_url = isVideo && result.url ? result.url + "?tr=h-720,cm-extract" : null;
        const thumb_url = isVideo && result.thumbnailUrl ? result.thumbnailUrl : result.url;
        return {

            success:true,

            provider:this.name,

            url:
            result.url,
            hls_url,
            thumbnail_url: thumb_url,

            fileId:
            result.fileId

        };


    }







    async delete(fileId){


        return {

            success:false,

            provider:this.name,

            error:
            "Delete not implemented"

        };


    }







    async healthCheck(env){


        const credentials =
        StorageCredentials.getImageKit(env);



        return {

            provider:this.name,

            healthy:
            Boolean(
                credentials.publicKey &&
                credentials.privateKey &&
                credentials.urlEndpoint
            ),

            message:
            "ImageKit configured"

        };


    }







    getStats(){


        return {


            provider:this.name,

            uploads:0,

            failures:0,

            averageUpload:0


        };


    }


}



export default new ImageKitProvider();