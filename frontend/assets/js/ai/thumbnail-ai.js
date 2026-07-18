class CloudTokThumbnailAI{


static generate(videoFile){


return new Promise(resolve=>{


const video =
document.createElement("video");


video.src =
URL.createObjectURL(videoFile);


video.muted=true;

video.playsInline=true;



video.onloadedmetadata=()=>{


const duration =
video.duration;


const times=[

duration*0.2,

duration*0.5,

duration*0.8

];



let best =
"";

let index=0;



const capture=()=>{


if(index>=times.length){


resolve(best);

return;


}



video.currentTime =
times[index];



};



video.onseeked=()=>{


const canvas =
document.createElement("canvas");


canvas.width=360;

canvas.height=640;



const ctx =
canvas.getContext("2d");



ctx.drawImage(
video,
0,
0,
360,
640
);



const image =
canvas.toDataURL(
"image/jpeg",
0.85
);



/*
Future AI scoring goes here.
For now choose middle frame.
*/


if(index===1){

best=image;

}



index++;

capture();


};



capture();


};



video.onerror=()=>{


resolve("");


};


});


}


}


console.log(
"Thumbnail AI Ready"
);