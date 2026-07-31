let WatchEngine = null;



document.addEventListener(
"DOMContentLoaded",
()=>{


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





/*
START VIDEO ENGINE
*/


if(
typeof CloudTokWatchEngine !== "undefined"
){


WatchEngine =
new CloudTokWatchEngine();



WatchEngine.init(id);



}
else{


console.log(
"Watch Engine Missing"
);


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