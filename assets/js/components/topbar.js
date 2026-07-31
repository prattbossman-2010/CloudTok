class TopBar{

constructor(){

this.element=this.create();

}

create(){

const top=document.createElement("div");

top.className="topBar";


const loggedIn =
typeof CloudTokAuthGuard !== "undefined" &&
CloudTokAuthGuard.isLoggedIn();



top.innerHTML=`

<div class="logo">

☁ CloudTok

</div>

<div class="topActions">

<button id="searchBtn">🔍</button>

${loggedIn ? "" : `

<button id="loginBtn">Login</button>

<button id="signupBtn">Sign Up</button>

`}

</div>

`;



top.querySelector("#searchBtn").onclick=()=>{

window.location.href="search.html";

};



const loginBtn =
top.querySelector("#loginBtn");


if(loginBtn){

loginBtn.onclick=()=>{

window.location.href="login.html";

};

}



const signupBtn =
top.querySelector("#signupBtn");


if(signupBtn){

signupBtn.onclick=()=>{

window.location.href="signup.html";

};

}



return top;

}

}