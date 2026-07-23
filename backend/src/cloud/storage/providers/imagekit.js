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





        let folder =
        "cloudtok/images";



        if(metadata.role === "thumbnail"){

            folder =
            "cloudtok/thumbnails";

        }



        if(metadata.role === "avatar"){

            folder =
            "cloudtok/avatars";

        }





        const form =

        new FormData();





        form.append(
            "file",
            file
        );



        form.append(
            "fileName",
            file.name || "cloudtok-upload"
        );



        form.append(
            "folder",
            folder
        );





        if(metadata.userId){

            form.append(
                "customMetadata",
                JSON.stringify({
                    userId: metadata.userId
                })
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

                result.message ||

                "ImageKit upload failed"

            };


        }





        return {


            success:true,


            provider:this.name,


            url:

            result.url,


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







    async healthCheck(){


        return {

            provider:this.name,

            healthy:true,

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