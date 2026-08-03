
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


    async login(email,password){

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

        const result = await response.json();

        if(result.token){
            localStorage.setItem("CloudTokToken", result.token);
            localStorage.setItem("CloudTokCurrentUser", result.user.username);
        }

        return result;
    },


    async request(url, options={}){

        const token = localStorage.getItem("CloudTokToken");

        options.headers = {
            ...options.headers,
            "Authorization": "Bearer " + token
        };

        const response =
        await fetch(this.baseURL + url, options);

        return await response.json();
    },


    async getProfile(username){

        const response =
        await fetch(this.baseURL + "/users/" + username);

        return await response.json();
    },


    async getUserVideos(username){

        const response =
        await fetch(this.baseURL + "/users/" + username + "/videos");

        return await response.json();
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


    async getVideos(){

        const response =
        await fetch(this.baseURL + "/videos");

        return await response.json();
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
