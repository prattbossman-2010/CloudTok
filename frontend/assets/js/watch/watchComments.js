class CloudTokComments {


constructor(video){


this.video = video;


this.currentUser =
localStorage.getItem(
"CloudTokCurrentUser"
)
||
"PrattBossman";



this.panel =
document.getElementById(
"commentsPanel"
);



this.list =
document.getElementById(
"commentsList"
);



this.input =
document.getElementById(
"commentInput"
);



this.sendBtn =
document.getElementById(
"sendCommentBtn"
);



this.closeBtn =
document.getElementById(
"closeCommentsBtn"
);



this.setup();



}





setup(){



if(!this.video.comments){


this.video.comments=[];


}



if(this.sendBtn){


this.sendBtn.onclick =
()=>{


this.addComment();


};


}





if(this.closeBtn){


this.closeBtn.onclick =
()=>{


this.close();


};


}





this.render();



}









open(){


if(this.panel){


this.panel.style.display =
"flex";


}


this.render();


}









close(){


if(this.panel){


this.panel.style.display =
"none";


}


}









render(){


if(!this.list){

return;

}



this.list.innerHTML="";



if(
this.video.comments.length === 0
){


this.list.innerHTML =
`
<p class="noComments">
No comments yet
</p>
`;


return;

}





this.video.comments.forEach(
comment=>{


const item =
document.createElement(
"div"
);


item.className =
"commentItem";





let avatar =
"assets/images/default-avatar.png";



if(
typeof CloudTokUserManager !== "undefined"
){

avatar =
CloudTokUserManager.getAvatar(
comment.username
)
||
avatar;

}





item.innerHTML =
`

<div class="commentProfile">

<img 
class="commentAvatar"
src="${avatar}"
onerror="
this.src='assets/images/default-avatar.png'
">

<div class="commentContent">


<h4>
@${comment.username}
</h4>


<p>
${comment.text}
</p>


<span>
${new Date(
comment.time
).toLocaleString()
}
</span>


</div>


</div>


`;




this.list.appendChild(
item
);



});


}









addComment(){


if(
!CloudTokAuthGuard.requireLogin()
){

return;

}

    
const owner =
CloudTokUsers.find(
this.video.username
);

if(
owner &&
owner.privacy &&
owner.privacy.allowComments === false
){

    alert(
    "This creator has disabled comments."
    );

    return;

}
    
if(!this.input){

return;

}


const text =
this.input.value.trim();


if(!text){

return;

}


const comment = {

id:Date.now(),

username:this.currentUser,

text:text,

time:Date.now()

};


this.video.comments.push(comment);


this.save();


this.input.value="";


this.render();


this.updateCount();


if(window.CloudTokActiveVideoCard){

    window.CloudTokActiveVideoCard
    .updateCommentCount();

}


};



save(){



const index =
CloudTokDatabase.videos.findIndex(

video =>

video.id === this.video.id

);



if(index !== -1){


CloudTokDatabase.videos[index] =
this.video;


}





try{


localStorage.setItem(

"CloudTokVideos",

JSON.stringify(
CloudTokDatabase.videos
)

);



}

catch(error){



console.log(
"COMMENT SAVE ERROR:",
error
);



}



}









updateCount(){


/*
    UPDATE WATCH PAGE COUNT
*/

const watchCount =
document.getElementById(
"watchCommentCount"
);


if(watchCount){

    watchCount.textContent =
    this.video.comments.length;

}



/*
    UPDATE INDEX PAGE COUNT
*/

if(
window.CloudTokActiveVideoCard
){

    window.CloudTokActiveVideoCard.updateCommentCount();

}


}







}





let WatchComments = null;









function loadWatchComments(videoId){



const video =

CloudTokDatabase.videos.find(

v=>v.id===videoId

);



if(!video){


console.log(
"COMMENT VIDEO NOT FOUND"
);


return;


}





WatchComments =
new CloudTokComments(
video
);



}    