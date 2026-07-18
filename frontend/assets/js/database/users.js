class CloudTokUsers{

static storageKey="CloudTokUsers";

static currentUserKey="CloudTokCurrentUser";

static users=[];





static load(){


const saved=

localStorage.getItem(
this.storageKey
);



if(saved){


try{


this.users=
JSON.parse(saved);


}
catch(error){


this.users=[];


}


}





if(this.users.length===0){



this.users=[

{

    privacy:{

    privateAccount:false,

    allowComments:true,

    allowDownloads:true,

    showOnlineStatus:true,

    allowDuet:true,

    allowStitch:true,

    allowMentions:true,

    allowMessagesFrom:"everyone"

},
    
id:1,

username:"PrattBossman",

displayName:"Pratt Bossman",

email:"",

password:"",

bio:"Welcome to CloudTok",

avatar:"assets/images/default-avatar.png",

verified:false,
privateAccount:false,
followers:[],

following:[],

likes:0,
privateAccount:false,

showLikedVideos:true,

showSavedVideos:true,

notificationsList:[],

joined:Date.now()

}

];



this.save();


}



}






static save(){


localStorage.setItem(

this.storageKey,

JSON.stringify(
this.users
)

);


}

    static normalizeUsername(username){

return String(username)
.replace(/^@+/,"")
.trim()
.toLowerCase();

}

static find(username){


username =
this.normalizeUsername(username);


return this.users.find(

user=>

this.normalizeUsername(user.username)
===
username

);


}







static findById(id){


return this.users.find(

user=>

user.id===id

);


}







static signUp(data){


data.username =
this.normalizeUsername(
data.username
);


if(!data.username){

return{

success:false,

message:
"Username cannot be empty."

};

}



if(this.find(data.username)){


return{

success:false,

message:
"Username already exists."

};


}



const user={

    privacy:{

    privateAccount:false,

    allowComments:true,

    allowDownloads:true,

    showOnlineStatus:true,

    allowDuet:true,

    allowStitch:true,

    allowMentions:true,

    allowMessagesFrom:"everyone"

},
    
id:Date.now(),

username:data.username,

displayName:data.displayName,

email:data.email,

password:data.password,

bio:data.bio||"",

avatar:
"assets/images/default-avatar.png",

verified:false,
privateAccount:false,
followers:[],

following:[],

likes:0,
privateAccount:false,

showLikedVideos:true,

showSavedVideos:true,

notificationsList:[],

joined:Date.now()

};



this.users.push(user);



this.save();



localStorage.setItem(

this.currentUserKey,

user.username

);



return{

success:true,

user:user

};



}
static login(username,password){

username =
this.normalizeUsername(username);


const user=
this.find(username);

if(!user){

return{

success:false,

message:"User not found."

};

}

if(user.password!==password){

return{

success:false,

message:"Incorrect password."

};

}

localStorage.setItem(

this.currentUserKey,

user.username

);

return{

success:true,

user:user

};

}







static logout(){

localStorage.removeItem(

this.currentUserKey

);

}







static getCurrentUser(){

const username=

localStorage.getItem(

this.currentUserKey

);

if(!username){

return null;

}

return this.find(username);

}







static updateProfile(data){

const user=

this.getCurrentUser();

if(!user){

return false;

}

    if(data.username){

data.username =
this.normalizeUsername(
data.username
);

}
    
Object.assign(

user,

data

);

this.save();

return true;

}







static follow(username){

username =
this.normalizeUsername(username);


const current =
this.getCurrentUser();


const target =
this.find(username);



if(!current || !target){

return;

}



if(current.username === target.username){

return;

}



if(
!current.following.includes(
target.username
)

){

current.following.push(
target.username
);

}



if(
!target.followers.includes(
current.username
)

){

target.followers.push(
current.username
);

}



if(typeof CloudTokNotifications !== "undefined"){

    console.log("ABOUT TO CREATE NOTIFICATION");

    CloudTokNotifications.add(
        target.username,
        {
            type:"follow",
            message:
            (current.displayName || current.username)
            + " started following you"
        }
    );

}
else{

    console.log("CloudTokNotifications IS UNDEFINED");

}

this.save();


}



static unfollow(username){

username =
this.normalizeUsername(username);

const current=

this.getCurrentUser();

const target=

this.find(username);

if(!current||!target){

return;

}

current.following=

current.following.filter(

u=>u!==target.username

);

target.followers=

target.followers.filter(

u=>u!==current.username

);

this.save();

}
static getAllUsers(){

return this.users;

}





static deleteUser(username){

username =
this.normalizeUsername(username);


this.users =

this.users.filter(

user =>

this.normalizeUsername(user.username)
!==
username

);


this.save();

}


static isLoggedIn(){

return(

localStorage.getItem(

this.currentUserKey

)!==null

);

}





static changePassword(

oldPassword,

newPassword

){

const user=

this.getCurrentUser();

if(!user){

return{

success:false,

message:"Not logged in."

};

}

if(user.password!==oldPassword){

return{

success:false,

message:"Incorrect current password."

};

}

user.password=newPassword;

this.save();

return{

success:true

};

}







static search(query){

query=query.toLowerCase();

return this.users.filter(

user=>

user.username
.toLowerCase()
.includes(query)

||

user.displayName
.toLowerCase()
.includes(query)

);

}

}






/* ---------- Initialize ---------- */

CloudTokUsers.load();






/* ---------- Sync with CloudTokDatabase ---------- */

if(

typeof CloudTokDatabase!=="undefined"

){

CloudTokDatabase.users=

CloudTokUsers.getAllUsers();

}   