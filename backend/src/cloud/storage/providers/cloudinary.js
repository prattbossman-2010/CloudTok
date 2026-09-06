import StorageCredentials from "../credentials.js";


class CloudinaryProvider {


    constructor(){

        this.id = "cloudinary";

        this.name = "Cloudinary";

    }





    async upload(file, env, metadata = {}){


        const credentials =
        StorageCredentials.getCloudinary(env);



        if(
            !credentials.cloudName ||
            !credentials.apiKey ||
            !credentials.apiSecret
        ){

            return {

                success:false,

                provider:this.name,

                error:
                "Cloudinary credentials missing"

            };

        }





        const folder =

        metadata.role === "video"

        ?

        "cloudtok/videos"

        :

        "cloudtok/images";





        const form =

        new FormData();



        form.append(
            "file",
            file
        );



        form.append(
            "folder",
            folder
        );



        if(metadata.userId){

            form.append(
                "context",
                `user_id=${metadata.userId}`
            );

        }

        // Free HLS for all videos - Cloudinary eager async (free tier 25K transfos)
        if(metadata.role === "video"){
            form.append("eager", "sp_hd/hls");
            form.append("eager_async", "true");
        }






        const authString =

        btoa(

            `${credentials.apiKey}:${credentials.apiSecret}`

        );





        const response =

        await fetch(

            `https://api.cloudinary.com/v1_1/${credentials.cloudName}/auto/upload`,

            {

                method:"POST",

                headers:{

                    Authorization:
                    `Basic ${authString}`

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

                result.error?.message ||

                "Cloudinary upload failed"

            };


        }






        const hls_url = result.secure_url ? result.secure_url.replace("/video/upload/", "/video/upload/sp_hd/").replace(/\.[^.]+$/, ".m3u8") : null;
        const eagerHls = result.eager && result.eager[0] ? result.eager[0].secure_url : null;
        return {


            success:true,


            provider:this.name,


            url:

            result.secure_url,

            hls_url: eagerHls || hls_url,

            thumbnail_url: result.secure_url ? result.secure_url.replace("/video/upload/", "/video/upload/so_2,w_360,h_640,c_fill/").replace(/\.[^.]+$/, ".jpg") : null,


            publicId:

            result.public_id


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







    async healthCheck(){


        return {

            provider:this.name,

            healthy:true

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



export default new CloudinaryProvider();