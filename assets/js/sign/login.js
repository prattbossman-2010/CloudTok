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



const result =
await CloudTokAPI.login(
email,
password
);



if(!result.success){


alert(
result.error || "Login failed"
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
result.user.username
)

);


}


};