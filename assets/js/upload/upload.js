class CloudTokUploader {

  constructor() {
    let username = localStorage.getItem("CloudTokCurrentUser");

    if (
      typeof CloudTokUsers !== "undefined" &&
      typeof CloudTokUsers.find === "function"
    ) {
      this.currentUser = CloudTokUsers.find(username);
    }

    if (!this.currentUser) {
      this.currentUser = {
        displayName: "CloudTok User",
        username: "PrattBossman",
        avatar: "assets/images/default-avatar.png"
      };
    }
  }

  uploadVideo(file, options = {}) {
    return new Promise((resolve, reject) => {

      // Limits
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error("File too large. Maximum size is 100MB."));
        return;
      }

      if (!file.type.startsWith("video/")) {
        reject(new Error("Only video files are allowed."));
        return;
      }

      const progress = options.onProgress || function () {};
      progress(5);

      // Create a temporary object URL only for duration + first thumbnail
      const tempURL = URL.createObjectURL(file);
      const tempVideo = document.createElement("video");
      tempVideo.src = tempURL;
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.preload = "metadata";

      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration;
        const MAX_DURATION = 180; // 3 minutes

        if (duration > MAX_DURATION) {
          URL.revokeObjectURL(tempURL);
          reject(new Error("Video too long. Maximum duration is 3 minutes."));
          return;
        }

        progress(25);

        // Create a quick local thumbnail for immediate UI feedback
        this.createThumbnail(tempURL)
          .then(async (localThumbnail) => {
            progress(50);

            const caption = (options.caption && options.caption.trim())
              ? options.caption.trim()
              : "New video";

            const tags = this.generateTags(caption, options.tags);
            const category = this.detectCategory(caption, tags, options.category);

            progress(60);

            // === REAL UPLOAD TO BACKEND ===
            let uploadResult = null;
            try {
              uploadResult = await CloudTokAPI.uploadVideo(
                file,
                caption,
                localThumbnail,          // send the dataURL thumbnail if the API accepts it
                JSON.stringify(tags),
                category
              );
            } catch (err) {
              console.error("Upload API error:", err);
              uploadResult = null;
            }

            // Clean up the temporary object URL
            URL.revokeObjectURL(tempURL);

            progress(80);

            // STRICT: only continue if the backend really saved the video
            if (!uploadResult || !uploadResult.success || !uploadResult.videoUrl) {
  // Show the full error so we can see why Supabase failed
  const fullError = JSON.stringify(uploadResult, null, 2);
  console.error("FULL UPLOAD ERROR:", fullError);
  reject(new Error(
    (uploadResult && uploadResult.error) 
      ? uploadResult.error + "\n\n" + fullError
      : "Upload failed. Video was not saved to cloud storage.\n\n" + fullError
  ));
  return;
}

            // Success – use the real cloud URL
            const video = {
              id: uploadResult.videoId || Date.now(),
              username: "@" + this.currentUser.username,
              displayName: this.currentUser.displayName,
              avatar: this.currentUser.avatar,
              caption: caption,
              tags: tags,
              category: category,
              thumbnail: localThumbnail,          // temporary local thumbnail
              video: uploadResult.videoUrl,       // REAL cloud URL
              likes: 0,
              comments: [],
              shares: 0,
              saves: 0,
              views: 0,
              uploaded: Date.now()
            };

            // Keep a light local list (never store base64 video data)
            if (!CloudTokDatabase.videos) {
              CloudTokDatabase.videos = [];
            }
            CloudTokDatabase.videos.unshift(video);

            // Only store metadata + remote URLs (no huge data URLs)
            try {
              const safeVideos = CloudTokDatabase.videos.map(v => ({
                id: v.id,
                username: v.username,
                displayName: v.displayName,
                avatar: v.avatar,
                caption: v.caption,
                tags: v.tags,
                category: v.category,
                thumbnail: (v.thumbnail && v.thumbnail.startsWith("http"))
                  ? v.thumbnail
                  : null,                       // drop large data URLs
                video: v.video,                 // must be the cloud URL
                likes: v.likes,
                comments: v.comments,
                shares: v.shares,
                saves: v.saves,
                views: v.views,
                uploaded: v.uploaded
              }));

              localStorage.setItem("CloudTokVideos", JSON.stringify(safeVideos));
            } catch (e) {
              console.warn("Could not save to localStorage:", e.message);
            }

            progress(90);

            this.finishUpload(video, progress, options, resolve);
          })
          .catch(err => {
            URL.revokeObjectURL(tempURL);
            reject(err);
          });
      };

      tempVideo.onerror = () => {
        URL.revokeObjectURL(tempURL);
        reject(new Error("Could not read video file."));
      };
    });
  }

  createThumbnail(videoURL) {
    return new Promise(resolve => {
      const video = document.createElement("video");
      video.src = videoURL;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";

      video.onloadeddata = () => {
        video.currentTime = 0.5;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 360;
          canvas.height = 640;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, 360, 640);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } catch (e) {
          resolve("");
        }
      };

      video.onerror = () => resolve("");
    });
  }

  finishUpload(video, progress, options, resolve) {
    if (!CloudTokDatabase.searchIndex) {
      CloudTokDatabase.searchIndex = [];
    }

    CloudTokDatabase.searchIndex.unshift({
      id: video.id,
      type: "video",
      username: video.username,
      displayName: video.displayName,
      caption: video.caption,
      tags: video.tags,
      category: video.category,
      thumbnail: video.thumbnail,
      video: video.video
    });

    try {
      localStorage.setItem(
        "CloudTokSearchIndex",
        JSON.stringify(CloudTokDatabase.searchIndex)
      );
    } catch (e) {}

    progress(100);

    if (typeof Engine !== "undefined" && typeof Engine.reloadFeed === "function") {
      Engine.reloadFeed();
    }

    // Optional AI enhancement (safe now – passes a real URL string)
    if (typeof CloudTokAI !== "undefined") {
      // Improved thumbnail (now accepts both File and URL)
      if (typeof CloudTokThumbnailAI !== "undefined") {
        CloudTokThumbnailAI.generate(video.video)   // video.video is now a real https URL
          .then(thumb => {
            if (thumb) {
              video.thumbnail = thumb;
              const index = CloudTokDatabase.videos.findIndex(v => v.id === video.id);
              if (index !== -1) {
                CloudTokDatabase.videos[index].thumbnail = thumb;
              }
            }
          })
          .catch(() => {});
      }

      CloudTokAI.enhanceVideo(video)
        .then(ai => {
          if (!ai) return;

          video.caption = ai.caption;
          video.tags = ai.tags;
          video.category = ai.category;

          const index = CloudTokDatabase.videos.findIndex(v => v.id === video.id);
          if (index !== -1) {
            CloudTokDatabase.videos[index] = video;
            try {
              localStorage.setItem(
                "CloudTokVideos",
                JSON.stringify(CloudTokDatabase.videos)
              );
            } catch (e) {}
          }
        })
        .catch(() => {});
    }

    if (typeof options.onComplete === "function") {
      options.onComplete(video);
    }

    resolve(video);
  }

  generateTags(caption, manualTags) {
    if (manualTags && manualTags.trim() !== "") {
      return manualTags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length);
    }

    const tags = [];
    caption
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .split(" ")
      .forEach(word => {
        if (word.length >= 4 && !tags.includes(word)) {
          tags.push(word);
        }
      });

    if (tags.length === 0) tags.push("upload");
    if (!tags.includes("upload")) tags.push("upload");

    return tags;
  }

  detectCategory(caption, tags, selected) {
    if (selected && selected !== "Auto Detect") {
      return selected;
    }

    const text = (caption + " " + tags.join(" ")).toLowerCase();

    if (text.includes("game") || text.includes("gaming") || text.includes("pubg") || text.includes("freefire")) {
      return "Gaming";
    }
    if (text.includes("music") || text.includes("song") || text.includes("dance")) {
      return "Music";
    }
    if (text.includes("football") || text.includes("basketball")) {
      return "Sports";
    }
    if (text.includes("html") || text.includes("javascript") || text.includes("coding") || text.includes("program")) {
      return "Technology";
    }
    if (text.includes("learn") || text.includes("science") || text.includes("math")) {
      return "Education";
    }
    if (text.includes("food") || text.includes("cook")) {
      return "Food";
    }
    if (text.includes("dog") || text.includes("cat")) {
      return "Pets";
    }

    return "General";
  }

  static loadSavedVideos() {
    // Intentionally left empty – we no longer restore huge base64 videos
  }
}

document.addEventListener("DOMContentLoaded", () => {
  CloudTokUploader.loadSavedVideos();
});