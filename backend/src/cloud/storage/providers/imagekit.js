class ImageKitProvider {


    constructor(){

        this.id = "imagekit";

        this.name = "ImageKit";

    }





    async upload(file, env, metadata = {}){


        /*
        
        ImageKit upload logic
        will be added here.

        */


        return {

            success:false,

            provider:this.name,

            error:
            "ImageKit credentials not configured"

        };


    }





    async delete(fileId){


        return {

            success:false,

            provider:this.name,

            error:
            "Delete not configured"

        };


    }





    async healthCheck(){


        return {

            provider:this.name,

            healthy:false,

            message:
            "ImageKit credentials missing"

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