class SupabaseProvider {


    constructor(){

        this.id = "supabase";

        this.name = "Supabase Storage";

    }





    async upload(file, env, metadata = {}){


        /*
        
        Supabase Storage upload logic
        will be added here.

        */


        return {

            success:false,

            provider:this.name,

            error:
            "Supabase credentials not configured"

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
            "Supabase credentials missing"

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



export default new SupabaseProvider();