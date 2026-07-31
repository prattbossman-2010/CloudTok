class BottomNav{


constructor(){

    this.element = this.create();

}



create(){


const nav = document.createElement("div");

nav.className = "bottomNav";


nav.innerHTML = `

<button id="homeBtn">🏠</button>

<button id="discoverBtn">🔥</button>

<button id="uploadBtn">➕</button>

<button id="messageBtn">💬</button>

<button id="profileBtn">👤</button>


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

caption:file.name.replace(/\.[^/.]+$/,""),

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



return nav;


}


}