class CloudTokAuthGuard{


static isLoggedIn(){

const user =
localStorage.getItem(
"CloudTokCurrentUser"
);


return user !== null &&
user.trim() !== "";

}





static requireLogin(action=null, data=null){


if(
!this.isLoggedIn()
){


localStorage.setItem(
"CloudTokReturnPage",
window.location.href
);



if(action){

localStorage.setItem(
"CloudTokReturnAction",
action
);

}



if(data){

localStorage.setItem(
"CloudTokReturnData",
JSON.stringify(data)
);

}



window.location.href =
"login.html";


return false;


}


return true;


}






static currentUser(){


return localStorage.getItem(
"CloudTokCurrentUser"
);


}







static logout(){


localStorage.removeItem(
"CloudTokCurrentUser"
);



localStorage.removeItem(
"CloudTokReturnPage"
);



localStorage.removeItem(
"CloudTokReturnAction"
);



localStorage.removeItem(
"CloudTokReturnData"
);



window.location.replace(
"login.html"
);



}



}