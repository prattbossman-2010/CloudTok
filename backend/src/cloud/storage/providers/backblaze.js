import StorageCredentials from "../credentials.js";


class BackblazeProvider{


constructor(){
    this.id="backblaze";
    this.name="Backblaze B2";
}


async upload(file,env,metadata={}){

    const credentials=StorageCredentials.getBackblaze(env);

    if(!credentials.keyId||!credentials.applicationKey||!credentials.bucket){
        return{
            success:false,
            provider:this.name,
            error:"Backblaze credentials missing"
        };
    }

    try{

        const token=btoa(`${credentials.keyId}:${credentials.applicationKey}`);

        const authResponse=
        await fetch(
            `https://api.backblazeb2.com/b2api/v2/b2_authorize_account`,
            {
                headers:{
                    Authorization:`Basic ${token}`
                }
            }
        );

        if(!authResponse.ok){
            return{
                success:false,
                provider:this.name,
                error:"Backblaze auth failed"
            };
        }

        const authData=await authResponse.json();

        const folder=
        metadata.role==="video"?"cloudtok/videos":"cloudtok/images";

        const ext=
        file.name?
        file.name.split(".").pop():
        "bin";

        const filename=
        `${folder}/${metadata.userId||"unknown"}_${Date.now()}.${ext}`;

        const getUploadUrlResponse=
        await fetch(
            `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
            {
                method:"POST",
                headers:{
                    Authorization:authData.authorizationToken,
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    bucketId:credentials.bucket
                })
            }
        );

        if(!getUploadUrlResponse.ok){
            return{
                success:false,
                provider:this.name,
                error:"Failed to get upload URL"
            };
        }

        const uploadUrlData=await getUploadUrlResponse.json();

        const arrayBuffer=await file.arrayBuffer();

        const sha1=await this.hashSHA1(arrayBuffer);

        const uploadResponse=
        await fetch(
            uploadUrlData.uploadUrl,
            {
                method:"POST",
                headers:{
                    Authorization:uploadUrlData.authorizationToken,
                    "X-Bz-File-Name":encodeURIComponent(filename),
                    "Content-Type":"b2/x-auto",
                    "X-Bz-Content-Sha1":sha1
                },
                body:arrayBuffer
            }
        );

        if(!uploadResponse.ok){
            const errorText=await uploadResponse.text();
            return{
                success:false,
                provider:this.name,
                error:`Upload failed: ${errorText}`
            };
        }

        const uploadResult=await uploadResponse.json();

        const url=
        `${authData.downloadUrl}/file/${credentials.bucket}/${filename}`;

        return{
            success:true,
            provider:this.name,
            url:url,
            fileId:uploadResult.fileId
        };

    }
    catch(error){
        return{
            success:false,
            provider:this.name,
            error:error.message||"Backblaze upload failed"
        };
    }

}


async hashSHA1(buffer){
    const hashBuffer=await crypto.subtle.digest("SHA-1",buffer);
    const hashArray=Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b=>b.toString(16).padStart(2,"0")).join("");
}


async delete(fileId){

    return{
        success:false,
        provider:this.name,
        error:"Delete not implemented"
    };

}


async healthCheck(env){

    const credentials=StorageCredentials.getBackblaze(env);

    const healthy=
    Boolean(credentials.keyId&&credentials.applicationKey&&credentials.bucket);

    return{
        provider:this.name,
        healthy:healthy,
        message:healthy?
        "Backblaze configured":
        "Backblaze credentials missing"
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


export default new BackblazeProvider();
