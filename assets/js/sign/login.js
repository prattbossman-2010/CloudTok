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

if(!email||!password){
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

}

catch(e){

alert("Login failed. Please try again.");
console.log("Login error:",e);

}


};
