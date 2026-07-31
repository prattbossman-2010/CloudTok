class CloudTokFollowList{


constructor(){

const params=
new URLSearchParams(window.location.search);

this.username=
params.get("user")
||
localStorage.getItem("CloudTokCurrentUser")
||"";

this.username=
CloudTokUsers.normalizeUsername(this.username);

this.currentUser=
CloudTokUsers.getCurrentUser();

this.list=
document.getElementById("userList");

this.isFollowersPage=
window.location.pathname.includes("followers.html");

this.load();

this.setupBackButton();

}


async load(){

let users=[];

if(typeof CloudTokAPI!=="undefined"){

    try{

        if(this.isFollowersPage){

            const result=
            await CloudTokAPI.getFollowers(this.username);

            if(result.followers){
                users=result.followers.map(u=>({
                    username:u.username,
                    displayName:u.display_name,
                    avatar:u.avatar||
                    "assets/images/default-avatar.png",
                    bio:u.bio||""
                }));
            }

        }
        else{

            const result=
            await CloudTokAPI.getFollowing(this.username);

            if(result.following){
                users=result.following.map(u=>({
                    username:u.username,
                    displayName:u.display_name,
                    avatar:u.avatar||
                    "assets/images/default-avatar.png",
                    bio:u.bio||""
                }));
            }

        }

    }
    catch(e){
        console.log("Follow API failed, using localStorage");
    }

}

if(users.length===0){

    const user=CloudTokUsers.find(this.username);

    if(!user){
        this.list.innerHTML=`
        <h3>Users not found</h3>
        `;
        return;
    }

    const usernames=
    this.isFollowersPage
    ?(user.followers||user.followersList||[])
    :(user.following||user.followingList||[]);

    this.list.innerHTML="";

    if(usernames.length===0){
        this.list.innerHTML=`
        <div class="emptyFollow">
        <h3>No users yet</h3>
        </div>
        `;
        return;
    }

    usernames.forEach(username=>{
        const person=CloudTokUsers.find(username);
        if(person)this.createUserCard(person);
    });
    return;

}


this.list.innerHTML="";

if(users.length===0){
    this.list.innerHTML=`
    <div class="emptyFollow">
    <h3>No users yet</h3>
    </div>
    `;
    return;
}

users.forEach(user=>{
    this.createUserCard(user);
});

}


createUserCard(user){

const card=
document.createElement("div");

card.className="followUserCard";

card.innerHTML=`

<img
class="followAvatar"
src="${user.avatar||"assets/images/default-avatar.png"}"
>

<div class="followInfo">
<h3>${user.displayName}</h3>
<p>@${user.username}</p>
</div>

<button class="followAction">
${this.getFollowText(user.username)}
</button>

`;

card.onclick=(e)=>{
    if(e.target.classList.contains("followAction"))return;
    window.location.href=
    "profile.html?user="+encodeURIComponent(user.username);
};

const button=
card.querySelector(".followAction");

button.onclick=async()=>{
    await this.toggleFollow(user.username,button);
};

this.list.appendChild(card);

}


getFollowText(username){

const current=CloudTokUsers.getCurrentUser();
if(!current)return"Follow";

if((current.following||[]).includes(username)){
    return"Following";
}

return"Follow";

}


async toggleFollow(username,button){

if(!CloudTokAuthGuard.requireLogin())return;

const current=CloudTokUsers.getCurrentUser();
if(!current)return;

const isFollowing=(current.following||[]).includes(username);

if(isFollowing){
    await CloudTokUsers.unfollow(username);
}
else{
    await CloudTokUsers.follow(username);
}

button.textContent=this.getFollowText(username);

}


setupBackButton(){

const back=document.getElementById("backBtn");
if(back){back.onclick=()=>{history.back();};}

}


}


document.addEventListener(
"DOMContentLoaded",
()=>{
    new CloudTokFollowList();
}
);
