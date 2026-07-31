class R2Provider{


constructor(){
    this.id="r2";
    this.name="Cloudflare R2";
}


async upload(file,env,metadata={}){

    const credentials=StorageCredentials.getR2(env);

    if(!credentials.bucket){
        return{
            success:false,
            provider:this.name,
            error:"R2 bucket not configured"
        };
    }

    try{

        const folder=
        metadata.role==="video"?"cloudtok/videos":"cloudtok/images";

        const ext=
        file.name?
        file.name.split(".").pop():
        "bin";

        const filename=
        `${folder}/${metadata.userId||"unknown"}_${Date.now()}.${ext}`;

        const arrayBuffer=await file.arrayBuffer();

        const result=
        await env.R2_BUCKET.put(
            filename,
            arrayBuffer,
            {
                httpMetadata:{
                    contentType:file.type||"video/mp4"
                }
            }
        );

        const url=
        `https://${credentials.bucket}.r2.dev/${filename}`;

        return{
            success:true,
            provider:this.name,
            url:url,
            key:filename
        };

    }
    catch(error){
        return{
            success:false,
            provider:this.name,
            error:error.message||"R2 upload failed"
        };
    }

}


async delete(key){

    try{
        await env.R2_BUCKET.delete(key);
        return{success:true,provider:this.name};
    }
    catch(error){
        return{
            success:false,
            provider:this.name,
            error:error.message||"R2 delete failed"
        };
    }

}


async healthCheck(env){

    const credentials=StorageCredentials.getR2(env);

    return{
        provider:this.name,
        healthy:Boolean(credentials.bucket),
        message:credentials.bucket?
        "R2 configured":
        "R2 bucket not configured"
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


export default new R2Provider();
