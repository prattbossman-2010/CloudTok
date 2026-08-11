class CloudTokThumbnailAI {

  /**
   * Generate a thumbnail from either a File/Blob or a video URL (data: or https:)
   */
  static generate(source) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";

      // Support both File/Blob and string URLs
      if (source instanceof Blob || source instanceof File) {
        video.src = URL.createObjectURL(source);
      } else if (typeof source === "string" && source.length > 0) {
        video.src = source; // data: URL or remote URL
      } else {
        resolve("");
        return;
      }

      video.onloadedmetadata = () => {
        const duration = video.duration || 1;
        const times = [
          duration * 0.2,
          duration * 0.5,
          duration * 0.8
        ];

        let best = "";
        let index = 0;

        const capture = () => {
          if (index >= times.length) {
            // Clean up object URL if we created one
            if (source instanceof Blob || source instanceof File) {
              try { URL.revokeObjectURL(video.src); } catch (e) {}
            }
            resolve(best);
            return;
          }
          video.currentTime = times[index];
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 360;
            canvas.height = 640;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, 360, 640);
            const image = canvas.toDataURL("image/jpeg", 0.85);

            // Prefer the middle frame
            if (index === 1) {
              best = image;
            }
          } catch (e) {
            // ignore draw errors
          }

          index++;
          capture();
        };

        capture();
      };

      video.onerror = () => {
        resolve("");
      };
    });
  }
}

console.log("Thumbnail AI Ready");