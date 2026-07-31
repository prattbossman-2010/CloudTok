document
.getElementById("signupBtn")
.onclick = async ()=>{


const username =
document
.getElementById("username")
.value.trim();


const email =
document
.getElementById("email")
.value.trim();


const password =
document
.getElementById("password")
.value;



const result =
await CloudTokAPI.signup({

displayName:
document
.getElementById("displayName")
.value.trim(),

username,

email,

password,

bio:""

});



if(!result.success){


alert(
result.error || "Signup failed"
);


return;


}



// Automatically login after signup

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



window.location.replace(

"profile.html?user=" +

encodeURIComponent(
loginResult.user.username
)

);


};