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

<span class="icon" style="width:1em;height:1em;display:inline-flex;vertical-align:middle;">${CloudTokIcons.cloud}</span> CloudTok

</div>

<div class="topActions">

<button id="liveBtn" style="background:rgba(255,45,85,.15);color:#ff2d55;border:none;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;"><span class="icon" style="width:1em;height:1em;display:inline-flex;vertical-align:middle;color:#ff2d55;">${CloudTokIcons.liveDot}</span> LIVE</button>

<button id="searchBtn"><span class="icon" style="width:1em;height:1em;display:inline-flex;vertical-align:middle;">${CloudTokIcons.search}</span></button>

${loggedIn ? "" : `

<button id="loginBtn">Login</button>

<button id="signupBtn">Sign Up</button>

`}

</div>

`;



top.querySelector("#liveBtn").onclick=()=>{

window.location.href="liveStreams.html";

};



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