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
        username: localStorage.getItem("CloudTokCurrentUser") || "user",
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
        const MAX_DURATION = 360; // 6 minutes

        if (duration > MAX_DURATION) {
          URL.revokeObjectURL(tempURL);
          reject(new Error("Video too long. Maximum duration is 6 minutes."));
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
  if(!CloudTokAuthGuard.isLoggedIn()){
    throw new Error("Please log in to upload videos");
  }
  uploadResult = await CloudTokAPI.uploadVideo(
    file,
    caption,
    localThumbnail,
    JSON.stringify(tags),
    category
  );
} catch (err) {
  console.error("Upload API error:", err);
  uploadResult = { error: err.message || "Upload failed" };
}

// Clean up the temporary object URL
URL.revokeObjectURL(tempURL);

progress(80);

// Support both old and new response shapes
const isSuccess = uploadResult && uploadResult.success === true;
const videoUrl = uploadResult?.data?.videoUrl || uploadResult?.videoUrl;
const videoId = uploadResult?.data?.videoId || uploadResult?.videoId;
const provider = uploadResult?.data?.provider || uploadResult?.provider;

if (!isSuccess || !videoUrl) {
  const fullError = JSON.stringify(uploadResult, null, 2);
  console.error("FULL UPLOAD ERROR:", fullError);
  reject(new Error(
    (uploadResult && uploadResult.error)
      ? uploadResult.error
      : "Upload failed. Video was not saved to cloud storage."
  ));
  return;
}

            // Success – use the real cloud URL
const video = {
  id: videoId || Date.now(),
  username: "@" + this.currentUser.username,
  displayName: this.currentUser.displayName,
  avatar: this.currentUser.avatar,
  caption: caption,
  tags: tags,
  category: category,
  thumbnail: localThumbnail,
  video: videoUrl,                    // ← extracted from new API shape
  likes: 0,
  comments: [],
  shares: 0,
  saves: 0,
  views: 0,
  uploaded: Date.now(),
  provider: provider || null
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

    let finished = false;

    const finish = (result) => {
      if (finished) return;

      finished = true;

      video.removeAttribute("src");
      video.load();

      resolve(result || "");
    };

    video.onerror = () => {
      finish("");
    };

    video.onloadedmetadata = () => {

      const duration = video.duration;

      if (
        !Number.isFinite(duration) ||
        duration <= 0
      ) {
        finish("");
        return;
      }

      // Capture the exact middle of the video.
      const middle = duration / 2;

      video.currentTime = middle;
    };

    video.onseeked = () => {

      try {

        const canvas =
          document.createElement("canvas");

        const videoWidth =
          video.videoWidth || 360;

        const videoHeight =
          video.videoHeight || 640;

        // Keep the thumbnail reasonably sized
        // while preserving the video's aspect ratio.
        const maxWidth = 360;
        const maxHeight = 640;

        const scale =
          Math.min(
            maxWidth / videoWidth,
            maxHeight / videoHeight
          );

        canvas.width =
          Math.max(1, Math.round(videoWidth * scale));

        canvas.height =
          Math.max(1, Math.round(videoHeight * scale));

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          finish("");
          return;
        }

        ctx.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const thumbnail =
          canvas.toDataURL(
            "image/jpeg",
            0.85
          );

        finish(thumbnail);

      } catch (error) {

        console.error(
          "Thumbnail generation failed:",
          error
        );

        finish("");
      }
    };

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