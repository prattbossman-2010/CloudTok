import StorageCredentials from "../credentials.js";


class SupabaseProvider{


constructor(){
    this.id="supabase";
    this.name="Supabase Storage";
}


async upload(file,env,metadata={}){

    const credentials=StorageCredentials.getSupabase(env);

    if(!credentials.url||!credentials.key){
        return{
            success:false,
            provider:this.name,
            error:"Supabase credentials missing"
        };
    }

    try{

        const bucket=
        metadata.role==="video"?"cloudtok-videos":"cloudtok-images";

        const ext=
        file.name?
        file.name.split(".").pop():
        "bin";

        const filename=
        `${metadata.userId||"unknown"}_${Date.now()}.${ext}`;

        const arrayBuffer=await file.arrayBuffer();

        const uploadUrl=
        `${credentials.url}/storage/v1/object/${bucket}/${filename}`;

        const response=
        await fetch(
            uploadUrl,
            {
                method:"POST",
                headers:{
                    Authorization:`Bearer ${credentials.key}`,
                    "Content-Type":file.type||"video/mp4",
                    "x-upsert":"true"
                },
                body:arrayBuffer
            }
        );

        if(!response.ok){
            const errorData=await response.json();
            return{
                success:false,
                provider:this.name,
                error:errorData.message||"Upload failed"
            };
        }

        const result=await response.json();

        const publicUrl=
        `${credentials.url}/storage/v1/object/public/${bucket}/${filename}`;

        return{
            success:true,
            provider:this.name,
            url:publicUrl,
            path:`${bucket}/${filename}`
        };

    }
    catch(error){
        return{
            success:false,
            provider:this.name,
            error:error.message||"Supabase upload failed"
        };
    }

}


async delete(path){

    return{
        success:false,
        provider:this.name,
        error:"Delete not implemented"
    };

}


async healthCheck(env){

    const credentials=StorageCredentials.getSupabase(env);

    const healthy=
    Boolean(credentials.url&&credentials.key);

    return{
        provider:this.name,
        healthy:healthy,
        message:healthy?
        "Supabase configured":
        "Supabase credentials missing"
    };

}


getStats(){
    return{
        provider:this.name,
        uploads:0,
        failures:0,
        averageUpload:0
    };
}


}


export default new SupabaseProvider();
