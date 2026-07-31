class CloudTokUsers{

static storageKey="CloudTokUsers";

static currentUserKey="CloudTokCurrentUser";

static tokenKey="CloudTokToken";

static users=[];

static _initialized=false;

static _profileCache={};


static async init(){

    const username=
    localStorage.getItem(this.currentUserKey);

    if(username && typeof CloudTokAPI!=="undefined"){

        try{

            const result=
            await CloudTokAPI.getProfile(username);

            if(!result.error){

                this._profileCache[username]=result;

            }

        }
        catch(e){}

    }

    this._initialized=true;

}



static load(){

const saved=
localStorage.getItem(this.storageKey);

if(saved){
try{
this.users=JSON.parse(saved);
}
catch(error){
this.users=[];
}
}

if(this.users.length===0){

this.users=[{
    privacy:{
    privateAccount:false,
    allowComments:true,
    allowDownloads:true,
    showOnlineStatus:true
},
id:1,
username:"PrattBossman",
displayName:"Pratt Bossman",
email:"",
password:"",
bio:"Welcome to CloudTok",
avatar:"assets/images/default-avatar.png",
verified:false,
followers:[],
following:[],
likes:0,
notificationsList:[],
joined:Date.now()
}];

this.save();
}

}

static save(){
localStorage.setItem(
this.storageKey,
JSON.stringify(this.users)
);
}

static normalizeUsername(username){
return String(username)
.replace(/^@+/,"")
.trim()
.toLowerCase();
}

static find(username){
username=this.normalizeUsername(username);

const cached=this._profileCache[username];
if(cached){
    return {
        id:cached.id,
        username:cached.username,
        displayName:cached.displayName,
        email:cached.email,
        bio:cached.bio,
        avatar:cached.avatar,
        website:cached.website,
        followers:cached.followersCount||0,
        following:cached.followingCount||0,
        followersList:[],
        followingList:[],
        verified:false,
        privacy:{privateAccount:false},
        notificationsList:[],
        showLikedVideos:true,
        showSavedVideos:true
    };
}

return this.users.find(
user=>this.normalizeUsername(user.username)===username
);
}

static findById(id){
return this.users.find(user=>user.id===id);
}

static signUp(data){
data.username=this.normalizeUsername(data.username);

if(!data.username){
return{success:false,message:"Username cannot be empty."};
}

const user={
    privacy:{
    privateAccount:false,
    allowComments:true,
    allowDownloads:true,
    showOnlineStatus:true
},
id:Date.now(),
username:data.username,
displayName:data.displayName,
email:data.email,
password:data.password,
bio:data.bio||"",
avatar:"assets/images/default-avatar.png",
verified:false,
followers:[],
following:[],
likes:0,
notificationsList:[],
joined:Date.now()
};

this.users.push(user);
this.save();

localStorage.setItem(this.currentUserKey,user.username);

return{success:true,user:user};
}

static login(username,password){
username=this.normalizeUsername(username);
const user=this.find(username);
if(!user){
return{success:false,message:"User not found."};
}
localStorage.setItem(this.currentUserKey,user.username);
return{success:true,user:user};
}

static logout(){
localStorage.removeItem(this.currentUserKey);
localStorage.removeItem(this.tokenKey);
}

static getCurrentUser(){
const username=
localStorage.getItem(this.currentUserKey);
if(!username)return null;
return this.find(username);
}

static updateProfile(data){
const user=this.getCurrentUser();
if(!user)return false;
if(data.username){
data.username=this.normalizeUsername(data.username);
}
Object.assign(user,data);
this.save();
return true;
}

static async follow(username){
username=this.normalizeUsername(username);
const current=this.getCurrentUser();
if(!current)return;

if(typeof CloudTokAPI!=="undefined"){
    try{
        const result=await CloudTokAPI.follow(username);
        if(result.success){
            if(!current.following.includes(username)){
                current.following.push(username);
            }
            this.save();
        }
    }
    catch(e){
        if(!current.following.includes(username)){
            current.following.push(username);
        }
        this.save();
    }
}
else{
    if(!current.following.includes(username)){
        current.following.push(username);
    }
    this.save();
}
}

static async unfollow(username){
username=this.normalizeUsername(username);
const current=this.getCurrentUser();
if(!current)return;

if(typeof CloudTokAPI!=="undefined"){
    try{
        const result=await CloudTokAPI.follow(username);
        if(result.success){
            current.following=
            current.following.filter(u=>u!==username);
            this.save();
        }
    }
    catch(e){
        current.following=
        current.following.filter(u=>u!==username);
        this.save();
    }
}
else{
    current.following=
    current.following.filter(u=>u!==username);
    this.save();
}
}

static getAllUsers(){
return this.users;
}

static deleteUser(username){
username=this.normalizeUsername(username);
this.users=this.users.filter(
user=>this.normalizeUsername(user.username)!==username
);
this.save();
}

static isLoggedIn(){
return(
localStorage.getItem(this.currentUserKey)!==null
);
}

static search(query){
query=query.toLowerCase();
return this.users.filter(
user=>
user.username.toLowerCase().includes(query)
||
user.displayName.toLowerCase().includes(query)
);
}

}


/* ---------- Initialize ---------- */

CloudTokUsers.load();

CloudTokUsers.init();


/* ---------- Sync with CloudTokDatabase ---------- */

if(typeof CloudTokDatabase!=="undefined"){
CloudTokDatabase.users=CloudTokUsers.getAllUsers();
}
