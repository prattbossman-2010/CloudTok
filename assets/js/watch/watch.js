let WatchEngine = null;



document.addEventListener(
"DOMContentLoaded",
async ()=>{


console.log(
"CloudTok Watch Started"
);



const params =
new URLSearchParams(
window.location.search
);



const id =
Number(
params.get("id")
);


// Wait for videos to load from API
if(window._cloudtokStorageReady){
    try{ await window._cloudtokStorageReady; }
    catch(e){}
}


/*
START VIDEO ENGINE
*/


if(
typeof CloudTokWatchEngine !== "undefined"
){


WatchEngine =
new CloudTokWatchEngine();



await WatchEngine.init(id);



}
else{


console.log(
"Watch Engine Missing"
);


}

// Show PC hint
if(!("ontouchstart" in window)){
    const hint=document.createElement("div");
    hint.id="pcHint";
    hint.textContent="Use ↑ ↓ arrow keys or scroll to navigate";
    hint.style.cssText="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.7);color:#fff;padding:10px 20px;border-radius:999px;font-size:13px;z-index:9999;pointer-events:none;transition:opacity .5s;";
    document.body.appendChild(hint);
    setTimeout(()=>{hint.style.opacity="0";},4000);
    setTimeout(()=>{hint.remove();},4500);
}

/*
BACK BUTTON
*/


const backBtn =
document.getElementById(
"backBtn"
);



if(backBtn){



backBtn.addEventListener(

"click",

(e)=>{


e.preventDefault();


e.stopPropagation();



history.back();



}

);



}



const soundBtn =
document.getElementById(
"watchSoundBtn"
);

if(soundBtn){

soundBtn.onclick=()=>{

WatchEngine.toggleSound();

};

}






/*
LOAD ACTION BUTTONS
*/


setTimeout(()=>{


if(
typeof loadWatchActions === "function"
){

loadWatchActions(id);

}



if(
typeof loadWatchComments === "function"
){

loadWatchComments(id);

}





const action =
localStorage.getItem(
"CloudTokReturnAction"
);



const data =
JSON.parse(

localStorage.getItem(
"CloudTokReturnData"
)

||

"null"

);





if(
action === "comments"
&&
data
&&
Number(data.videoId) === Number(id)

){


setTimeout(()=>{


if(
typeof WatchActions !== "undefined"
&&
WatchActions
){

WatchActions.openComments();

}


localStorage.removeItem(
"CloudTokReturnAction"
);


localStorage.removeItem(
"CloudTokReturnData"
);


},500);



}



},300);




});
