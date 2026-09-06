// --- localStorage quota + timeout helpers (surgical fix) ---
const CLOUDTOK_MAX_STORED = 20;
function cloudTokStripThumb(t){ return (t && typeof t==="string" && t.startsWith("http")) ? t : null; }
function cloudTokSafeSetJSON(key, arr){
  let toStore = Array.isArray(arr) ? arr.slice(0, CLOUDTOK_MAX_STORED) : arr;
  for(let attempt=0; attempt<3; attempt++){
    try{
      const json = JSON.stringify(toStore);
      // proactive size check ~4MB before hitting quota
      if(json.length > 4 * 1024 * 1024 && toStore.length > 5){
        toStore = toStore.slice(0, Math.max(5, Math.floor(toStore.length/2)));
        continue;
      }
      localStorage.setItem(key, json);
      return true;
    }catch(e){
      const isQuota = e && (e.name==="QuotaExceededError" || e.code===22 || /quota|exceeded/i.test(e.message||""));
      if(isQuota && toStore.length > 1){
        toStore = toStore.slice(0, Math.max(1, Math.floor(toStore.length/2)));
        if(attempt===1 && Array.isArray(toStore)) toStore = toStore.map(v=> ({...v, thumbnail: cloudTokStripThumb(v.thumbnail)}));
        continue;
      }
      console.warn("Could not save to localStorage:", e.message);
      try{ localStorage.removeItem(key); localStorage.setItem(key, JSON.stringify(Array.isArray(toStore)?toStore.slice(0,5):toStore)); }catch(_){}
      return false;
    }
  }
  return false;
}

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

            // === CLIENT-SIDE 720p compress (free, all providers) ===
            let uploadFile = file;
            try {
              const compressed = await this.compressTo720p(file, tempURL, (p)=>progress(60 + Math.round(p*0.15)));
              if (compressed && compressed.size < file.size * 0.95) uploadFile = compressed;
            } catch(e) { console.warn("Compress skip:", e.message); }

            // === REAL UPLOAD TO BACKEND (with 60s timeout to avoid stuck at 80%) ===
progress(75);
let uploadResult = null;
try {
  if(!CloudTokAuthGuard.isLoggedIn()){
    throw new Error("Please log in to upload videos");
  }
  const UPLOAD_TIMEOUT_MS = 60000;
  const ctrl = new AbortController();
  const timeoutId = setTimeout(()=> { try{ ctrl.abort(); }catch(_){} }, UPLOAD_TIMEOUT_MS);
  const timeoutPromise = new Promise((_, rej)=> setTimeout(()=> rej(new Error("Upload timed out after 60s. Please check your connection and retry.")), UPLOAD_TIMEOUT_MS));
  try{
    const apiPromise = CloudTokAPI.uploadVideo(uploadFile, caption, localThumbnail, JSON.stringify(tags), category, { signal: ctrl.signal });
    uploadResult = await Promise.race([apiPromise, timeoutPromise]);
  } finally { clearTimeout(timeoutId); }
} catch (err) {
  console.error("Upload API error:", err);
  URL.revokeObjectURL(tempURL);
  const msg = (err && err.name==="AbortError") ? "Upload timed out after 60s. Please retry." : (err.message || "Upload failed");
  if(typeof options.onProgress==="function") try{ options.onProgress(80); }catch(_){}
  reject(new Error(msg));
  return;
}

// Clean up the temporary object URL
URL.revokeObjectURL(tempURL);

progress(80);

// Support both old and new response shapes (including hls across all providers)
const isSuccess = uploadResult && uploadResult.success === true;
const videoUrl = uploadResult?.data?.videoUrl || uploadResult?.videoUrl;
const hlsUrl = uploadResult?.data?.hlsUrl || uploadResult?.hlsUrl || null;
const dashUrl = uploadResult?.data?.dashUrl || uploadResult?.dashUrl || null;
const thumbUrl = uploadResult?.data?.thumbnailUrl || uploadResult?.thumbnailUrl || null;
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

            // Success – use the real cloud URL (hls for Cloudinary/ImageKit, progressive for Backblaze/Supabase/R2)
const video = {
  id: videoId || Date.now(),
  username: "@" + this.currentUser.username,
  displayName: this.currentUser.displayName,
  avatar: this.currentUser.avatar,
  caption: caption,
  tags: tags,
  category: category,
  thumbnail: thumbUrl || localThumbnail,
  video: videoUrl,
  hls_url: hlsUrl,
  dash_url: dashUrl,
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

            // Only store metadata + remote URLs (no huge data URLs) — keep last 20, quota-aware
            if (CloudTokDatabase.videos.length > CLOUDTOK_MAX_STORED) CloudTokDatabase.videos = CloudTokDatabase.videos.slice(0, CLOUDTOK_MAX_STORED);
            const safeVideos = CloudTokDatabase.videos.map(v => ({
                id: v.id,
                username: v.username,
                displayName: v.displayName,
                avatar: v.avatar,
                caption: v.caption,
                tags: v.tags,
                category: v.category,
                thumbnail: cloudTokStripThumb(v.thumbnail),
                video: v.video,
                likes: v.likes,
                comments: v.comments,
                shares: v.shares,
                saves: v.saves,
                views: v.views,
                uploaded: v.uploaded
              }));
            cloudTokSafeSetJSON("CloudTokVideos", safeVideos);

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
      thumbnail: cloudTokStripThumb(video.thumbnail),
      video: video.video
    });
    if (CloudTokDatabase.searchIndex.length > CLOUDTOK_MAX_STORED) CloudTokDatabase.searchIndex = CloudTokDatabase.searchIndex.slice(0, CLOUDTOK_MAX_STORED);
    // prune searchIndex: store only metadata, no data URLs, quota-aware
    cloudTokSafeSetJSON("CloudTokSearchIndex", CloudTokDatabase.searchIndex.map(v=> ({...v, thumbnail: cloudTokStripThumb(v.thumbnail)})));

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
            // re-sanitize before save (prune + drop data URLs, quota-aware)
            const sanitized = CloudTokDatabase.videos.slice(0, CLOUDTOK_MAX_STORED).map(v=> ({
              id:v.id, username:v.username, displayName:v.displayName, avatar:v.avatar,
              caption:v.caption, tags:v.tags, category:v.category,
              thumbnail: cloudTokStripThumb(v.thumbnail), video:v.video,
              likes:v.likes, comments:v.comments, shares:v.shares, saves:v.saves, views:v.views, uploaded:v.uploaded
            }));
            cloudTokSafeSetJSON("CloudTokVideos", sanitized);
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

  async compressTo720p(file, tempURL, onProg){
    return new Promise((resolve)=>{
      const v=document.createElement("video");
      v.src=tempURL; v.muted=true; v.playsInline=true; v.preload="metadata";
      v.onloadedmetadata=async()=>{
        const w=v.videoWidth||1280, h=v.videoHeight||720;
        if(w<=1280 && h<=720 && file.size < 20*1024*1024) return resolve(null);
        // try ffmpeg.wasm if available, else canvas+MediaRecorder fallback
        try{
          if(!window.FFmpeg) {
            const s=document.createElement("script");
            s.src="https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js";
            s.onload=()=>resolve(null); s.onerror=()=>resolve(null);
            document.head.appendChild(s);
            setTimeout(()=>resolve(null), 1500);
            return;
          }
          const { createFFmpeg } = window.FFmpeg;
          const ffmpeg=createFFmpeg({log:false});
          await ffmpeg.load();
          ffmpeg.FS("writeFile","input", await fetch(tempURL).then(r=>r.arrayBuffer()));
          onProg&&onProg(0.3);
          await ffmpeg.run("-i","input","-vf","scale='min(1280,iw)':-2","-c:v","libx264","-preset","veryfast","-crf","28","-c:a","aac","-b:a","96k","output.mp4");
          const data=ffmpeg.FS("readFile","output.mp4");
          const blob=new Blob([data.buffer],{type:"video/mp4"});
          blob.name=file.name.replace(/\.[^.]+$/,"")+"_720p.mp4";
          onProg&&onProg(1);
          resolve(blob);
        }catch(e){ resolve(null); }
      };
      v.onerror=()=>resolve(null);
      setTimeout(()=>resolve(null), 3000);
    });
  }

  static loadSavedVideos() {
    // Intentionally left empty – we no longer restore huge base64 videos
  }
}

document.addEventListener("DOMContentLoaded", () => {
  CloudTokUploader.loadSavedVideos();
});