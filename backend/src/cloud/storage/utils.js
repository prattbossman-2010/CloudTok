class StorageUtils {



    static formatBytes(bytes){


        if(bytes === 0){

            return "0 Bytes";

        }


        const sizes = [

            "Bytes",

            "KB",

            "MB",

            "GB",

            "TB"

        ];



        const index =

        Math.floor(

            Math.log(bytes) /

            Math.log(1024)

        );



        return (

            Math.round(

                bytes /

                Math.pow(1024,index)

                * 100

            )

            / 100

        )

        +

        " "

        +

        sizes[index];


    }





    static getFileSizeMB(bytes){


        return (

            bytes /

            (1024 * 1024)

        );


    }





    static generateFileId(){


        return (

            Date.now()

            +

            "-"

            +

            Math.random()

            .toString(36)

            .substring(2,10)

        );


    }





    static startTimer(){


        return Date.now();


    }





    static endTimer(startTime){


        return Date.now()

        -

        startTime;


    }





    static validateFileSize(

        fileSize,

        maxSizeMB

    ){


        const sizeMB =

        this.getFileSizeMB(

            fileSize

        );



        return sizeMB <= maxSizeMB;


    }





    static detectFileType(type){


        if(

            type.startsWith("video")

        ){

            return "video";

        }



        if(

            type.startsWith("image")

        ){

            return "image";

        }



        return "unknown";


    }



}



export default StorageUtils;