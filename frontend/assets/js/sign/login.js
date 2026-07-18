document
.getElementById("loginBtn")
.onclick=()=>{

const result=

CloudTokUsers.login(

document
.getElementById("username")
.value.trim(),

document
.getElementById("password")
.value

);

if(!result.success){

alert(result.message);

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

}else{

window.location.replace(

"profile.html?user="+
encodeURIComponent(
result.user.username
)

);

}

};