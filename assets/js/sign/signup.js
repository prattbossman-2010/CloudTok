document
.getElementById("signupBtn")
.onclick = async ()=>{


    const username =
    document
    .getElementById("username")
    .value
    .trim();


    const email =
    document
    .getElementById("email")
    .value
    .trim();


    const password =
    document
    .getElementById("password")
    .value;


    if(!username || !email || !password){

        alert(
            "Please fill in all fields"
        );

        return;

    }


    try{


        const result =
        await CloudTokAPI.signup({

            displayName:
            document
            .getElementById("displayName")
            .value
            .trim(),

            username,

            email,

            password,

            bio:""

        });


        if(!result.success){

            alert(
                result.error ||
                "Signup failed"
            );

            return;

        }


        /*
         * Account was successfully created.
         *
         * Now automatically login.
         */


        const loginResult =
        await CloudTokAPI.login(
            email,
            password
        );


        if(!loginResult.success){

            alert(
                "Account created. Please login."
            );

            window.location.replace(
                "login.html"
            );

            return;

        }


        const user =
        loginResult.data &&
        loginResult.data.user;


        if(!user){

            alert(
                "Account created, but automatic login failed. Please login."
            );

            window.location.replace(
                "login.html"
            );

            return;

        }


        window.location.replace(

            "profile.html?user=" +

            encodeURIComponent(
                user.username
            )

        );


    }
    catch(e){

        alert(
            "Signup failed. Please try again."
        );

        console.log(
            "Signup error:",
            e
        );

    }

};