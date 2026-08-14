document
.getElementById("loginBtn")
.onclick = async ()=>{


    const email =
    document
    .getElementById("email")
    .value
    .trim();


    const password =
    document
    .getElementById("password")
    .value;


    if(!email || !password){

        alert("Please fill in all fields");

        return;

    }


    try{


        const result =
        await CloudTokAPI.login(
            email,
            password
        );


        if(!result.success){

            alert(
                result.error ||
                "Login failed"
            );

            return;

        }


        /*
         * The backend response is:
         *
         * result.data.token
         * result.data.user
         *
         * CloudTokAPI.login() has already
         * saved the token and username.
         */


        const user =
        result.data &&
        result.data.user;


        if(!user){

            alert(
                "Login succeeded, but user data was not returned."
            );

            return;

        }


        const redirect =
        localStorage.getItem(
            "CloudTokReturnPage"
        );


        if(redirect){

            localStorage.removeItem(
                "CloudTokReturnPage"
            );


            window.location.replace(
                redirect
            );

        }
        else{

            window.location.replace(

                "profile.html?user=" +

                encodeURIComponent(
                    user.username
                )

            );

        }


    }
    catch(e){

        alert(
            "Login failed. Please try again."
        );

        console.log(
            "Login error:",
            e
        );

    }

};