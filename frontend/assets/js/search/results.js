let previewManager =
new SearchPreviewManager();

const params =
new URLSearchParams(window.location.search);


const query =
(params.get("query") || "")
.toLowerCase();


const results =
document.getElementById("results");


let mode="videos";



function searchVideos(){

previewManager.stop();
results.innerHTML="";



CloudTokDatabase.videos.forEach(video=>{


let data =
(
(video.username || "")+
(video.caption || "")+
(video.tags || []).join(" ")
)
.toLowerCase();



if(data.includes(query)){


results.innerHTML += `

<div class="resultCard"
data-id="${video.id}">


<video

class="resultVideo"

src="${video.video || ""}"

poster="${video.thumbnail || ""}"

muted

loop

playsinline>

</video>



<div class="resultInfo">


<h3>
${video.username}
</h3>


<p>
${video.caption}
</p>


<span>
#${(video.tags || []).join(" #")}
</span>


</div>


</div>


`;



}


});



activatePreviews();

previewManager.start();


}




function activatePreviews(){


document
.querySelectorAll(".resultVideo")
.forEach(video=>{


video.onmouseenter=()=>{


video.play()
.catch(()=>{});


};



video.onmouseleave=()=>{


video.pause();


};




// TM1 tablet support

video.onclick=()=>{


const card =
video.closest(".resultCard");


const id =
card.dataset.id;



console.log(
"OPEN VIDEO ID:",
id
);



window.location.href =
"watch.html?id="+id;



};



});



}






function searchUsers(){

previewManager.stop();

results.innerHTML="";


const users =

JSON.parse(

localStorage.getItem("CloudTokUsers")

||

"[]"

);



users.forEach(user=>{


const username =

String(user.username || "")
.replace(/^@+/,"")
.trim()
.toLowerCase();



const displayName =

String(user.displayName || "");


const searchText =

(
username +
" " +
displayName
)
.trim();



if(
searchText.includes(query)
){


const avatar =

user.avatar ||

"assets/images/default-avatar.png";



results.innerHTML += `


<div class="resultCard userResult"

data-user="${username}">


<img

class="userAvatar"

src="${avatar}"

onerror="this.src='assets/images/default-avatar.png'"

>


<div class="resultInfo">


<h3>

${user.displayName || user.username}

</h3>


<p>

@${username}

</p>


</div>


</div>


`;


}


});



document
.querySelectorAll(".userResult")
.forEach(card=>{


card.onclick=()=>{


const username =
card.dataset.user;



window.location.href =

"profile.html?user="

+

encodeURIComponent(username);



};


});


}

function updateActiveTab(activeId){


document
.querySelectorAll(".tabs button")
.forEach(button=>{

button.classList.remove("active");

});


document
.getElementById(activeId)
.classList.add("active");


}



document
.getElementById("videosTab")
.onclick=()=>{


mode="videos";


updateActiveTab("videosTab");


searchVideos();


};






document
.getElementById("usersTab")
.onclick=()=>{


mode="users";


updateActiveTab("usersTab");


searchUsers();


};





updateActiveTab("videosTab");

searchVideos();