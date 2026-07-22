const CloudTokAPI = {

    baseURL:
    "https://cloudtok-api.bossmanp16.workers.dev/api",


    async signup(data){

        const response =
        await fetch(
            this.baseURL + "/users/signup",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:
                JSON.stringify(data)

            }
        );


        return await response.json();

    },



    async login(email,password){


        const response =
        await fetch(
            this.baseURL + "/users/login",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:
                JSON.stringify({
                    email,
                    password
                })

            }
        );


        const result =
        await response.json();


        if(result.token){

            localStorage.setItem(
                "CloudTokToken",
                result.token
            );


            localStorage.setItem(
                "CloudTokCurrentUser",
                result.user.username
            );

        }


        return result;

    },



    async request(url,options={}){


        const token =
        localStorage.getItem(
            "CloudTokToken"
        );


        options.headers = {

            ...options.headers,

            "Authorization":
            "Bearer " + token

        };


        const response =
        await fetch(
            this.baseURL + url,
            options
        );


        return await response.json();

    },  // <-- THIS COMMA WAS MISSING



    async getProfile(username){

        const response =
        await fetch(
            this.baseURL +
            "/users/" +
            username
        );


        return await response.json();

    }

    async uploadVideo(file, caption = ""){

    const token =
    localStorage.getItem(
        "CloudTokToken"
    );


    const form =
    new FormData();


    form.append(
        "file",
        file
    );


    form.append(
        "caption",
        caption
    );


    const response =
    await fetch(

        this.baseURL +
        "/videos",

        {

            method:"POST",

            headers:{

                Authorization:
                "Bearer " + token

            },

            body:form

        }

    );


    return await response.json();

}

};