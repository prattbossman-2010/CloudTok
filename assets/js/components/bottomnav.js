class BottomNav{


constructor(){

    this.element = this.create();

}



create(){


const nav = document.createElement("div");

nav.className = "bottomNav";


nav.innerHTML = `

<button id="homeBtn"><span class="icon" style="width:1em;height:1em;display:inline-flex;vertical-align:middle;">${CloudTokIcons.home}</span></button>

<button id="discoverBtn"><span class="icon" style="width:1em;height:1em;display:inline-flex;vertical-align:middle;">${CloudTokIcons.search}</span></button>

<button id="uploadBtn"><span class="icon" style="width:1em;height:1em;display:inline-flex;vertical-align:middle;">${CloudTokIcons.plus}</span></button>

<button id="messageBtn"><span class="icon" style="width:1em;height:1em;display:inline-flex;vertical-align:middle;">${CloudTokIcons.chat}</span></button>

<button id="settingsBtn"><span class="icon" style="width:1em;height:1em;display:inline-flex;vertical-align:middle;">${CloudTokIcons.settings}</span></button>

<button id="profileBtn"><span class="icon" style="width:1em;height:1em;display:inline-flex;vertical-align:middle;">${CloudTokIcons.user}</span></button>


<input 
type="file"
id="uploadInput"
accept="video/*"
hidden>

`;



const input =
nav.querySelector("#uploadInput");



nav.querySelector("#uploadBtn").onclick=()=>{

window.location.href="upload.html";

};




input.addEventListener(
"change",
(e)=>{


const file =
e.target.files[0];


if(!file){

return;

}



const videoURL =
URL.createObjectURL(file);



const newVideo={

id:Date.now(),

username:"PrattBossman",

caption:"",

video:videoURL,

thumbnail:"",

tags:["upload"],

category:"general"

};




CloudTokDatabase.videos.push(newVideo);



console.log(
"Uploaded:",
newVideo
);



if(window.Engine){

window.Engine.loadVideos();

}



});





nav.querySelector("#homeBtn").onclick=()=>{

window.location.href="index.html";

};



nav.querySelector("#discoverBtn").onclick=()=>{

window.location.href="discover.html";

};



nav.querySelector("#messageBtn").onclick=()=>{

window.location.href="chat.html";

};



nav.querySelector("#profileBtn").onclick=()=>{

window.location.href="profile.html";

};



nav.querySelector("#settingsBtn").onclick=()=>{

window.location.href="settings.html";

};



return nav;


}


}