import { authenticate } from "../middleware/auth.js";
import StorageCredentials from "../cloud/storage/credentials.js";

export async function testSupabaseUpload(request, env) {

const auth =
    await authenticate(request, env);


if(auth.error){

    return auth.error;

}


try{

    const form =
        await request.formData();


    const file =
        form.get("file");


    if(!file){

        return Response.json(
            {
                success:false,
                error:"No video file received"
            },
            {
                status:400
            }
        );

    }


    if(
        typeof file.arrayBuffer !== "function"
    ){

        return Response.json(
            {
                success:false,
                error:"Uploaded file is invalid"
            },
            {
                status:400
            }
        );

    }


    const credentials =
        StorageCredentials.getSupabase(env);


    if(
        !credentials.url ||
        !credentials.key
    ){

        return Response.json(
            {
                success:false,
                error:"Supabase credentials missing"
            },
            {
                status:500
            }
        );

    }


    const bucket =
        "cloudtok-videos";


    const extension =
        file.name &&
        file.name.includes(".")
        ?
        file.name
            .split(".")
            .pop()
            .toLowerCase()
        :
        "mp4";


    const filename =
        `${auth.user.id}_${Date.now()}.${extension}`;


    const path =
        filename;


    const arrayBuffer =
        await file.arrayBuffer();


    const uploadUrl =
        `${credentials.url}/storage/v1/object/${bucket}/${path}`;


    const response =
        await fetch(
            uploadUrl,
            {
                method:"POST",

                headers:{
                    Authorization:
                    `Bearer ${credentials.key}`,

                    apikey:
                    credentials.key,

                    "Content-Type":
                    file.type ||
                    "video/mp4",

                    "x-upsert":
                    "true"
                },

                body:arrayBuffer
            }
        );


    const responseText =
        await response.text();


    if(!response.ok){

        return Response.json(
            {
                success:false,

                error:
                "Supabase upload failed",

                status:
                response.status,

                response:
                responseText
            },
            {
                status:500
            }
        );

    }


    const publicUrl =
        `${credentials.url}/storage/v1/object/public/${bucket}/${path}`;


    return Response.json({

        success:true,

        provider:"supabase",

        bucket,

        path,

        url:publicUrl,

        filename,

        size:file.size,

        type:file.type,

        supabaseResponse:
        responseText

    });


}
catch(error){

    return Response.json(
        {
            success:false,

            error:
            error.message ||
            "Supabase test upload failed"
        },
        {
            status:500
        }
    );

}

}