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

        metadata.type === "video"

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






        return {


            success:true,


            provider:this.name,


            url:

            result.secure_url,


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