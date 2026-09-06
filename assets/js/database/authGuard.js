class CloudTokAuthGuard{

static isLoggedIn(){
const user = localStorage.getItem("CloudTokCurrentUser");
const token = localStorage.getItem("CloudTokToken");
return user !== null && user.trim() !== "" && token !== null && token.trim() !== "";
}

static requireLogin(action=null, data=null){
if(!this.isLoggedIn()){
const current = window.location.href;
const isAuthPage = /login\.html|signup\.html/i.test(current);
if(!isAuthPage){
try{ sessionStorage.setItem("CloudTokPrevPage", current); }catch(e){}
localStorage.setItem("CloudTokReturnPage", current);
} else {
const ref = document.referrer;
if(ref && !/login\.html|signup\.html/i.test(ref) && ref !== current){
try{ sessionStorage.setItem("CloudTokPrevPage", ref); }catch(e){}
localStorage.setItem("CloudTokReturnPage", ref);
}
}
if(action) localStorage.setItem("CloudTokReturnAction", action);
if(data) localStorage.setItem("CloudTokReturnData", JSON.stringify(data));
window.location.replace("login.html");
return false;
}
return true;
}

static currentUser(){
return localStorage.getItem("CloudTokCurrentUser");
}

static getCurrentUser(){
const username = this.currentUser();
if(!username) return null;
return {
id: null,
username: username,
displayName: localStorage.getItem("CloudTokUserDisplayName") || username,
email: localStorage.getItem("CloudTokUserEmail") || "",
avatar: localStorage.getItem("CloudTokUserAvatar") || "",
bio: localStorage.getItem("CloudTokUserBio") || ""
};
}

static logout(){
localStorage.removeItem("CloudTokCurrentUser");
localStorage.removeItem("CloudTokToken");
localStorage.removeItem("CloudTokReturnPage");
localStorage.removeItem("CloudTokReturnAction");
localStorage.removeItem("CloudTokReturnData");
try{ sessionStorage.removeItem("CloudTokPrevPage"); }catch(e){}
window.location.replace("login.html");
}

}
