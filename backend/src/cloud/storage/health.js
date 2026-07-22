import StorageConfig from "./config.js";


class StorageHealth {



    constructor(){

        this.providers =
        StorageConfig.providers;

    }





    updateHealth(
        providerId,
        data = {}
    ){


        const provider =

        this.providers.find(

            p => p.id === providerId

        );



        if(!provider){

            return false;

        }



        Object.assign(

            provider,

            data

        );



        provider.lastHealthCheck =

        new Date().toISOString();



        return true;


    }







    markHealthy(providerId, latency = 0){



        const provider =

        this.providers.find(

            p => p.id === providerId

        );



        if(!provider){

            return;

        }



        provider.health = 100;


        provider.latency = latency;


        provider.lastHealthCheck =

        new Date().toISOString();


    }







    markUnhealthy(providerId){



        const provider =

        this.providers.find(

            p => p.id === providerId

        );



        if(!provider){

            return;

        }



        provider.health -= 20;



        if(provider.health < 0){

            provider.health = 0;

        }



        provider.lastHealthCheck =

        new Date().toISOString();


    }







    getProviderStatus(){



        return this.providers.map(

            provider => ({


                name:
                provider.name,


                health:
                provider.health,


                latency:
                provider.latency,


                failures:
                provider.failures,


                lastCheck:
                provider.lastHealthCheck


            })

        );


    }





}



export default new StorageHealth();