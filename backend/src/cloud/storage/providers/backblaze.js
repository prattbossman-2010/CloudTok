class BackblazeProvider {


    constructor(){

        this.id = "backblaze";

        this.name = "Backblaze B2";

    }





    async upload(file, env, metadata = {}){


        /*
        
        Backblaze B2 upload logic
        will be added here.

        */


        return {

            success:false,

            provider:this.name,

            error:
            "Backblaze credentials not configured"

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
            "Backblaze credentials missing"

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



export default new BackblazeProvider();