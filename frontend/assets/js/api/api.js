
window.CloudTokAPI = {

    baseURL:
    "https://cloudtok-api.bossmanp16.workers.dev/api",


    async signup(data){

        const response =
        await fetch(
            this.baseURL + "/users/signup",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify(data)
            }
        );

        return await response.json();
    },


    async login(email, password){

    const response =
    await fetch(
        this.baseURL + "/users/login",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({ email, password })
        }
    );

    const raw = await response.json();

    const result = {
        ...raw,
        ...(raw.data || {})
    };

    if(result.token && result.user){

        localStorage.setItem(
            "CloudTokToken",
            result.token
        );

        localStorage.setItem(
            "CloudTokCurrentUser",
            result.user.username
        );

        if(result.user.email){
            localStorage.setItem(
                "CloudTokUserEmail",
                result.user.email
            );
        }

        if(result.user.displayName){
            localStorage.setItem(
                "CloudTokUserDisplayName",
                result.user.displayName
            );
        }

        if(result.user.avatar){
            localStorage.setItem(
                "CloudTokUserAvatar",
                result.user.avatar
            );
        }

        if(result.user.bio){
            localStorage.setItem(
                "CloudTokUserBio",
                result.user.bio
            );
        }

    }

    return result;
},


    async request(url, options={}){

    const token =
    localStorage.getItem("CloudTokToken");

    options.headers = {
        ...options.headers,
        "Authorization": "Bearer " + token
    };

    const response =
    await fetch(
        this.baseURL + url,
        options
    );

    let raw;
    try {
        raw = await response.json();
    } catch(e) {
        raw = { error: "Invalid response", success: false };
    }

    if(response.status === 401 &&
      (raw.error === "invalid_token" ||
       raw.error === "session_expired")){

      localStorage.removeItem("CloudTokToken");
      localStorage.removeItem("CloudTokUser");
      window.dispatchEvent(
        new CustomEvent("auth:expired", {
          detail: {
            message: raw.message ||
              "Your session has expired. Please log out and log back in"
          }
        })
      );

      return {
        ...raw,
        success: false,
        sessionExpired: true
      };

    }

    return {
        ...raw,
        ...(raw.data || {})
    };
},


    async getProfile(username){

    const response =
    await fetch(
        this.baseURL + "/users/" +
        encodeURIComponent(username)
    );

    const raw = await response.json();

    return {
        ...raw,
        ...(raw.data || {})
    };
},


    async getHashtag(tag, limit=20, offset=0){
    return await this.request(
        "/hashtag/" + encodeURIComponent(tag) +
        "?limit=" + limit + "&offset=" + offset
    );
},

    async getUserVideos(username){

    const response =
    await fetch(
        this.baseURL +
        "/users/" +
        encodeURIComponent(username) +
        "/videos"
    );

    const raw =
    await response.json();

    return {
        ...raw,
        ...(raw.data || {})
    };
},

    async getCreatorAnalytics(username){

    return await this.request(
        "/users/" +
        encodeURIComponent(username) +
        "/analytics"
    );
},


    async updateProfile(displayName, bio, website){

        return await this.request("/users/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayName, bio, website })
        });
    },


    async updateAvatar(file){

        const form = new FormData();
        form.append("avatar", file);

        return await this.request("/users/avatar", {
            method: "POST",
            body: form
        });
    },


    async getVideos(options={}){

    let url = this.baseURL + "/videos";
    const params = [];
    if(options.user) params.push("user=" + encodeURIComponent(options.user));
    if(options.limit) params.push("limit=" + options.limit);
    if(options.offset) params.push("offset=" + options.offset);
    if(options.following) params.push("following=1");
    if(params.length) url += "?" + params.join("&");

    const response =
    await fetch(url);

    const raw =
    await response.json();

    return {
        ...raw,
        ...(raw.data || {})
    };
},

    async blockUser(username){
    return this.request("/users/"+encodeURIComponent(username)+"/block",{method:"POST"});
},

    async reportVideo(videoId, reason, details){
    return this.request("/videos/"+videoId+"/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason,details})});
},

    async reportUser(username, reason){
    return this.request("/users/"+encodeURIComponent(username)+"/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})});
},

    async getPaystackConfig(){
    return this.request("/payments/config");
},

    async uploadVideo(file, caption="", thumbnail="", tags="[]", category="General"){

        const token = localStorage.getItem("CloudTokToken");
        const form = new FormData();

        form.append("file", file);
        form.append("caption", caption);
        form.append("tags", tags);
        form.append("category", category);

        if(thumbnail){
            form.append("thumbnail", thumbnail);
        }

        const response =
        await fetch(this.baseURL + "/videos", {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: form
        });

        return await response.json();
    },


    async deleteVideo(videoId){

        return await this.request("/videos/" + videoId, {
            method: "DELETE"
        });
    },


    async toggleLike(videoId){

        return await this.request(
            "/videos/" + videoId + "/like",
            { method: "POST" }
        );
    },


    async incrementViews(videoId){

        return await this.request(
            "/videos/" + videoId + "/view",
            { method: "POST" }
        );
    },


    async getComments(videoId){

        const response =
        await fetch(this.baseURL + "/videos/" + videoId + "/comments");

        return await response.json();
    },


    async addComment(videoId, comment){

        return await this.request(
            "/videos/" + videoId + "/comments",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment })
            }
        );
    },


    async toggleSave(videoId){

        return await this.request(
            "/videos/" + videoId + "/save",
            { method: "POST" }
        );
    },


    async getSavedVideos(){

        return await this.request("/videos/saved");
    },


    async getLikedVideos(){

        return await this.request("/videos/liked");
    },


    async follow(username){

        return await this.request(
            "/users/" + username + "/follow",
            { method: "POST" }
        );
    },


    async getFollowers(username){

        const response =
        await fetch(this.baseURL + "/users/" + username + "/followers");

        return await response.json();
    },


    async getFollowing(username){

        const response =
        await fetch(this.baseURL + "/users/" + username + "/following");

        return await response.json();
    },


    async search(query){

        const response =
        await fetch(this.baseURL + "/search?q=" + encodeURIComponent(query));

        return await response.json();
    },


    async getDiscover(category, limit){

        let url = this.baseURL + "/discover";
        const params = [];
        if(category) params.push("category=" + encodeURIComponent(category));
        if(limit) params.push("limit=" + limit);
        if(params.length) url += "?" + params.join("&");

        const response = await fetch(url);
        return await response.json();
    },


    async getTrending(limit){

        let url = this.baseURL + "/videos/trending";
        if(limit) url += "?limit=" + limit;

        const response = await fetch(url);
        return await response.json();
    },


    async getNotifications(){

        return await this.request("/notifications");
    },


    async markNotificationRead(notificationId){

        return await this.request(
            "/notifications/" + notificationId + "/read",
            { method: "POST" }
        );
    },


    async markAllNotificationsRead(){

        return await this.request(
            "/notifications/read",
            { method: "POST" }
        );
    },


    async clearNotifications(){

        return await this.request(
            "/notifications",
            { method: "DELETE" }
        );
    },


    async getConversations(){

        return await this.request("/messages/conversations");
    },


    async getMessages(username){

        return await this.request("/messages/" + username);
    },


    async sendMessage(username, text){

        return await this.request(
            "/messages/" + username,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            }
        );
    },


    async runMigration(){

        return await this.request("/admin/migrate", {
            method: "POST"
        });

    },


    async initializePayment(email, amount, description){

        return await this.request("/payments/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, amount, description })
        });

    },


    async verifyPayment(reference){

        return await this.request("/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference })
        });

    },


    async getTransactions(){

        return await this.request("/payments/transactions");

    }

};
