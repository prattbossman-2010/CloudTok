class CloudTokUploader{
    
constructor(){

let username =
localStorage.getItem("CloudTokCurrentUser");


if(
typeof CloudTokUsers !== "undefined" &&
typeof CloudTokUsers.find === "function"
){

this.currentUser =
CloudTokUsers.find(username);

}


if(!this.currentUser){

this.currentUser = {

displayName:"CloudTok User",

username:"PrattBossman",

avatar:"assets/images/default-avatar.png"

};

}


}

uploadVideo(file,options={}){
    

return new Promise((resolve,reject)=>{

const reader=new FileReader();

const progress=
options.onProgress||function(){};

progress(5);

reader.onload=(e)=>{
    
const videoURL=e.target.result;

progress(25);

this.createThumbnail(videoURL)

.then((thumbnail)=>{

progress(60);

const caption=
(options.caption&&options.caption.trim())
?options.caption.trim()
:file.name.replace(/\.[^/.]+$/,"");

const tags=
this.generateTags(
caption,
options.tags
);

const category=
this.detectCategory(
caption,
tags,
options.category
);

const video={

id:Date.now(),

username:
"@"+this.currentUser.username,

displayName:
this.currentUser.displayName,

avatar:
this.currentUser.avatar,

caption:caption,

tags:tags,

category:category,

thumbnail:
thumbnail,

video:videoURL,

likes:0,

comments:[],

shares:0,

saves:0,

views:0,

uploaded:Date.now()

};

if(!CloudTokDatabase.videos){

CloudTokDatabase.videos=[];

}

CloudTokDatabase.videos.unshift(video);

try{

const safeVideos =
CloudTokDatabase.videos.map(video=>{


return {

id:video.id,

username:video.username,

displayName:video.displayName,

avatar:video.avatar,

caption:video.caption,

tags:video.tags,

category:video.category,

thumbnail:video.thumbnail,

video:video.video,

likes:video.likes,

comments:video.comments,

shares:video.shares,

saves:video.saves,

views:video.views,

uploaded:video.uploaded

};


});



localStorage.setItem(

"CloudTokVideos",

JSON.stringify(
safeVideos
)

);

}catch(e){}

progress(85);

this.finishUpload(

video,

progress,

options,

resolve

);

});

};

reader.onerror=reject;

reader.readAsDataURL(file);

});

}

createThumbnail(videoURL){

return new Promise(resolve=>{

const video=
document.createElement("video");

video.src=videoURL;

video.muted=true;

video.playsInline=true;

video.preload="metadata";

video.onloadeddata=()=>{

video.currentTime=0.5;

};

video.onseeked=()=>{

const canvas=
document.createElement("canvas");

canvas.width=360;

canvas.height=640;

const ctx=
canvas.getContext("2d");

ctx.drawImage(

video,

0,

0,

360,

640

);

resolve(

canvas.toDataURL(

"image/jpeg",

0.8

)

);

};

video.onerror=()=>{

resolve("");

};

});

}
    
finishUpload(video,progress,options,resolve){

if(!CloudTokDatabase.searchIndex){

CloudTokDatabase.searchIndex=[];

}

CloudTokDatabase.searchIndex.unshift({

id:video.id,

type:"video",

username:video.username,

displayName:video.displayName,

caption:video.caption,

tags:video.tags,

category:video.category,

thumbnail:video.thumbnail,

video:video.video

});

try{

localStorage.setItem(

"CloudTokSearchIndex",

JSON.stringify(

CloudTokDatabase.searchIndex

)

);

}catch(e){}

progress(100);

if(

typeof Engine!=="undefined"&&

typeof Engine.reloadFeed==="function"

){

Engine.reloadFeed();

}

// AI enhancement runs after upload

if(
typeof CloudTokAI !== "undefined"
){

if(
typeof CloudTokThumbnailAI !== "undefined"
){


CloudTokThumbnailAI.generate(video.video)

.then((thumb)=>{


if(thumb){


video.thumbnail = thumb;



const index =
CloudTokDatabase.videos.findIndex(
v=>v.id===video.id
);



if(index!==-1){

CloudTokDatabase.videos[index]
.thumbnail=thumb;


}


}


});


}
    
CloudTokAI.enhanceVideo(video)

.then((ai)=>{


if(!ai)
return;



video.caption =
ai.caption;


video.tags =
ai.tags;


video.category =
ai.category;



// update database

const index =
CloudTokDatabase.videos.findIndex(
v=>v.id===video.id
);



if(index!==-1){


CloudTokDatabase.videos[index]=video;


localStorage.setItem(

"CloudTokVideos",

JSON.stringify(
CloudTokDatabase.videos
)

);


}



console.log(
"AI UPDATED VIDEO",
video
);



});


}





if(
typeof options.onComplete==="function"
){

options.onComplete(video);

}


resolve(video);

}

generateTags(caption,manualTags){

if(

manualTags&&

manualTags.trim()!==""

){

return manualTags

.split(",")

.map(tag=>tag.trim())

.filter(tag=>tag.length);

}

const tags=[];

caption

.toLowerCase()

.replace(/[^a-z0-9 ]/g,"")

.split(" ")

.forEach(word=>{

if(

word.length>=4&&

!tags.includes(word)

){

tags.push(word);

}

});

if(tags.length===0){

tags.push("upload");

}

if(!tags.includes("upload")){

tags.push("upload");

}

return tags;

}

detectCategory(caption,tags,selected){

if(

selected&&

selected!=="Auto Detect"

){

return selected;

}

const text=(

caption+

" "+

tags.join(" ")

).toLowerCase();

if(

text.includes("game")||

text.includes("gaming")||

text.includes("pubg")||

text.includes("freefire")

){

return"Gaming";

}

if(

text.includes("music")||

text.includes("song")||

text.includes("dance")

){

return"Music";

}

if(

text.includes("football")||

text.includes("basketball")

){

return"Sports";

}

if(

text.includes("html")||

text.includes("javascript")||

text.includes("coding")||

text.includes("program")

){

return"Technology";

}

if(

text.includes("learn")||

text.includes("science")||

text.includes("math")

){

return"Education";

}

if(

text.includes("food")||

text.includes("cook")

){

return"Food";

}

if(

text.includes("dog")||

text.includes("cat")

){

return"Pets";

}

return"General";

}

static loadSavedVideos(){

try{

// Disabled temporarily.
// We will replace this with IndexedDB later.

}
catch(e){}

}

}

document.addEventListener(

"DOMContentLoaded",

()=>{

CloudTokUploader.loadSavedVideos();

}); 

