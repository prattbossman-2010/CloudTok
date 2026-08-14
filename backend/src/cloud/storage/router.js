import StorageManager from "./manager.js";
import StorageConfig from "./config.js";



class StorageRouter {



    async upload(file, options = {}){


        const role =
options.role || "video";



        const providers =

        StorageManager.getAvailableProviders(role);



        if(providers.length === 0){


            return {

                success:false,

                error:
                "No storage providers available"

            };


        }



        const attempts = [];




        for(const providerInfo of providers){



            const provider =

            StorageManager.getProviderModule(
                providerInfo.id
            );



            if(!provider){


                continue;


            }



            const start = Date.now();



            try {



                const result =
                await provider.upload(
                    file,
                    options.env,
                    options
                );



                const uploadTime =

                (Date.now() - start) / 1000;



                if(result.success){



                    StorageManager.recordSuccess(

                        providerInfo.id,

                        uploadTime

                    );



                    return {

                        ...result,

                        provider:
                        providerInfo.id

                    };


                }





                StorageManager.recordFailure(

                    providerInfo.id

                );



                attempts.push({

                    provider:
                    providerInfo.id,

                    error:
                    result.error

                });



            }

            catch(error){



                StorageManager.recordFailure(

                    providerInfo.id

                );



                attempts.push({

                    provider:
                    providerInfo.id,

                    error:
                    error.message

                });



            }



        }





        return {


            success:false,


            error:
            "All storage providers failed",


            attempts



        };


    }

    async delete(pathOrUrl, env) {
  // For now we only try Supabase (we can expand later)
  const provider = StorageManager.getProviderModule("supabase");

  if (!provider || typeof provider.delete !== "function") {
    return {
      success: false,
      error: "No delete method available"
    };
  }

  try {
    return await provider.delete(pathOrUrl, env);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
    
async healthCheck(env){

    const results = [];

    const providers =
    StorageManager.providers
    .filter(provider =>
        provider.enabled &&
        provider.apiConfigured
    );


    for(const providerInfo of providers){

        const provider =
        StorageManager.getProviderModule(
            providerInfo.id
        );


        if(!provider){

            continue;

        }


        if(
            typeof provider.healthCheck === "function"
        ){

            const check =
            await provider.healthCheck(
                env
            );


            results.push({

                id:
                providerInfo.id,

                ...check

            });

        }


    }


    return {

        status:"complete",

        providers:results

    };

}


}



export default new StorageRouter();