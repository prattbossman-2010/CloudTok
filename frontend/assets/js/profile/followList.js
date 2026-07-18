class CloudTokFollowList{


constructor(){

const params =
new URLSearchParams(
window.location.search
);


this.username =
params.get("user")

||

localStorage.getItem(
"CloudTokCurrentUser"
)

||

"";


this.username =
CloudTokUsers.normalizeUsername(
this.username
);


this.currentUser =
CloudTokUsers.getCurrentUser();


this.list =
document.getElementById(
"userList"
);


this.load();


this.setupBackButton();


}




load(){


const user =
CloudTokUsers.find(
this.username
);


if(!user){

this.list.innerHTML = `

<h3>
Users not found
</h3>

`;

return;

}



const isFollowersPage =
window.location.pathname.includes(
"followers.html"
);



const usernames =

isFollowersPage

?

(user.followers || [])

:

(user.following || []);





if(usernames.length===0){


this.list.innerHTML=`

<div class="emptyFollow">

<h3>
No users yet
</h3>

</div>

`;


return;


}




this.list.innerHTML="";



usernames.forEach(username=>{


const person =

CloudTokUsers.find(
username
);



if(person){

this.createUserCard(
person
);

}


});



}





createUserCard(user){


const card =
document.createElement(
"div"
);


card.className =
"followUserCard";



card.innerHTML = `

<img

class="followAvatar"

src="${user.avatar || "assets/images/default-avatar.png"}"

>


<div class="followInfo">

<h3>
${user.displayName}
</h3>

<p>
@${user.username}
</p>

</div>


<button class="followAction">

${this.getFollowText(user.username)}

</button>


`;





card.onclick=(e)=>{


if(
e.target.classList.contains(
"followAction"
)
){

return;

}



window.location.href =

"profile.html?user="

+

encodeURIComponent(
user.username
);


};




const button =

card.querySelector(
".followAction"
);



button.onclick=()=>{


this.toggleFollow(
user.username,
button
);


};



this.list.appendChild(
card
);



}




getFollowText(username){


const current =
CloudTokUsers.getCurrentUser();



if(!current){

return "Follow";

}


if(

current.following.includes(
username

)

){

return "Following";

}


const target =
CloudTokUsers.find(
username
);



if(

target.followers.includes(
current.username
)

){

return "Follow Back";

}



return "Follow";


}





toggleFollow(username,button){


if(
!CloudTokAuthGuard.requireLogin()
){

return;

}



const current =
CloudTokUsers.getCurrentUser();



if(
current.following.includes(username)
){

console.log("FOLLOW LIST: Unfollowing", username);

CloudTokUsers.unfollow(username);

}
else{

console.log("FOLLOW LIST: Following", username);

CloudTokUsers.follow(username);

}



button.textContent =
this.getFollowText(
username
);



}






setupBackButton(){


const back =
document.getElementById(
"backBtn"
);


if(back){

back.onclick=()=>{

history.back();

};

}


}



}




document.addEventListener(

"DOMContentLoaded",

()=>{


new CloudTokFollowList();


}

);