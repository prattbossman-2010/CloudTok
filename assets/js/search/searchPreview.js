class SearchPreviewManager{


constructor(){

this.videos=[];

this.current=0;

this.timer=null;

}




start(){


this.stop();


this.videos =
Array.from(
document.querySelectorAll(".resultVideo")
);



this.current=0;



if(this.videos.length===0){

return;

}



this.playNext();


}





playNext(){



if(
this.current >= this.videos.length
){

return;

}



const video =
this.videos[this.current];



video.currentTime=0;


video.play()
.catch(error=>{

console.log(
"PREVIEW ERROR",
error
);

});




this.timer=setTimeout(()=>{


video.pause();


video.currentTime=0;



this.current++;


this.playNext();



},3000);



}






stop(){


if(this.timer){

clearTimeout(
this.timer
);

}



this.videos.forEach(video=>{


video.pause();


});



this.videos=[];


this.current=0;



}



}