import StorageConfig from "./config.js";
import StorageProviders from "./providers/index.js";


class StorageManager {


    constructor(){

        this.providers =
        StorageConfig.providers;

    }





    getAvailableProviders(role = "video"){


        return this.providers

        .filter(provider =>

            provider.enabled &&

            provider.apiConfigured &&

            provider.roles &&
            provider.roles.includes(role)

        )

        .sort((a,b)=>

            a.priority - b.priority

        );

    }





    getBestProvider(role = "video"){


        const providers =

        this.getAvailableProviders(role);



        if(providers.length === 0){


            return null;


        }



        return providers.sort((a,b)=>{


            const scoreA =

            this.calculateScore(a);



            const scoreB =

            this.calculateScore(b);



            return scoreB - scoreA;


        })[0];


    }






    getProviderModule(providerId){


        return StorageProviders[providerId]

        ||

        null;


    }





    calculateScore(provider){


        let score = 0;



        score += provider.health;


        score += provider.successRate;



        score += provider.priority === 1
        ? 20
        : 0;



        if(provider.latency > 0){


            score -= provider.latency;


        }



        score -= provider.failures * 5;



        return score;


    }







    recordSuccess(providerId, uploadTime){


        const provider =

        this.providers.find(

            p => p.id === providerId

        );



        if(!provider){

            return;

        }



        provider.uploadCount++;



        provider.lastSuccess =

        new Date().toISOString();



        provider.averageUpload =

        (

            (

            provider.averageUpload *

            (provider.uploadCount - 1)

            )

            +

            uploadTime

        )

        /

        provider.uploadCount;



        provider.health = 100;


    }







    recordFailure(providerId){


        const provider =

        this.providers.find(

            p => p.id === providerId

        );



        if(!provider){

            return;

        }



        provider.failures++;



        provider.lastFailure =

        new Date().toISOString();



        provider.health -= 10;



        if(provider.health < 0){

            provider.health = 0;

        }


    }



}



export default new StorageManager();