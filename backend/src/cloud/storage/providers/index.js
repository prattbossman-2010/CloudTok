import CloudinaryProvider from "./cloudinary.js";
import BackblazeProvider from "./backblaze.js";
import SupabaseProvider from "./supabase.js";
import ImageKitProvider from "./imagekit.js";
import R2Provider from "./r2.js";


const StorageProviders = {


    cloudinary:
    CloudinaryProvider,


    backblaze:
    BackblazeProvider,


    supabase:
    SupabaseProvider,


    imagekit:
    ImageKitProvider,


    r2:
    R2Provider


};



export default StorageProviders;