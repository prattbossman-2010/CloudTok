class StorageCredentials {

    getCloudinary(env){

        return {

            cloudName:
            env.CLOUDINARY_CLOUD_NAME,

            apiKey:
            env.CLOUDINARY_API_KEY,

            apiSecret:
            env.CLOUDINARY_API_SECRET

        };

    }



    getBackblaze(env){

        return {

            keyId:
            env.B2_KEY_ID,

            applicationKey:
            env.B2_APPLICATION_KEY,

            bucket:
            env.B2_BUCKET

        };

    }



    getSupabase(env){

        return {

            url:
            env.SUPABASE_URL,

            key:
            env.SUPABASE_SERVICE_KEY

        };

    }



    getImageKit(env){

        return {

            publicKey:
            env.IMAGEKIT_PUBLIC_KEY,

            privateKey:
            env.IMAGEKIT_PRIVATE_KEY,

            urlEndpoint:
            env.IMAGEKIT_URL_ENDPOINT

        };

    }



    getR2(env){

        return {

            bucket:
            env.R2_BUCKET

        };

    }

}



export default new StorageCredentials();