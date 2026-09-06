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

        if(typeof showToast==="function"){ showToast("Please fill in all fields", "warning"); } else { alert("Please fill in all fields"); }

        return;

    }


    try{


        const result =
        await CloudTokAPI.login(
            email,
            password
        );


        if(!result.success){

            var errMsg = result.error || "Login failed";

            if(errMsg.toLowerCase().includes("invalid") ||
               errMsg.toLowerCase().includes("password") ||
               errMsg.toLowerCase().includes("credential")){

                errMsg = "Invalid email or password. If you recently updated your password, please use your new password. You can also try resetting your password.";

            }

            if(typeof showToast==="function"){ showToast(errMsg, "error"); } else { alert(errMsg); }

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

            if(typeof showToast==="function"){ showToast("Login succeeded, but user data was not returned.", "error"); } else { alert("Login succeeded, but user data was not returned."); }

            return;

        }


        // Prefer sessionStorage (previous page before login) then localStorage fallback.
        // Filter out login/signup loops and ensure back button goes to valid previous page.
        let redirect = null;
        try{
            redirect = sessionStorage.getItem("CloudTokPrevPage") || localStorage.getItem("CloudTokReturnPage");
        }catch(e){
            redirect = localStorage.getItem("CloudTokReturnPage");
        }
        // Fallback to referrer if no stored page and referrer is not auth page
        if(!redirect){
            try{
                const ref = document.referrer;
                if(ref && !/login\.html|signup\.html/i.test(ref) && ref !== window.location.href){
                    redirect = ref;
                }
            }catch(e){}
        }
        // Prevent loop: if redirect is login/signup itself, discard
        if(redirect && /login\.html|signup\.html/i.test(redirect)){
            redirect = null;
        }

        if(redirect){

            try{ sessionStorage.removeItem("CloudTokPrevPage"); }catch(e){}
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

        if(typeof showToast==="function"){ showToast("Login failed. Please try again.", "error"); } else { alert("Login failed. Please try again."); }

        console.log(
            "Login error:",
            e
        );

    }

};