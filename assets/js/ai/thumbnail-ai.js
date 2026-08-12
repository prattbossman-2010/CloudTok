class CloudTokThumbnailAI {

  static generate(source) {

    return new Promise((resolve) => {

      const video = document.createElement("video");

      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";

      let objectUrl = null;

      if (source instanceof Blob || source instanceof File) {

        objectUrl = URL.createObjectURL(source);
        video.src = objectUrl;

      } else if (
        typeof source === "string" &&
        source.length > 0
      ) {

        video.src = source;

      } else {

        console.log(
          "[ThumbnailAI] Invalid source"
        );

        resolve("");
        return;

      }


      const cleanup = () => {

        if (objectUrl) {

          try {
            URL.revokeObjectURL(objectUrl);
          }
          catch(e) {}

        }

      };


      video.onloadedmetadata = () => {

        console.log(
          "[ThumbnailAI] Metadata loaded"
        );

        console.log(
          "[ThumbnailAI] Duration:",
          video.duration
        );

        console.log(
          "[ThumbnailAI] Video size:",
          video.videoWidth,
          "x",
          video.videoHeight
        );


        if (
          !video.videoWidth ||
          !video.videoHeight
        ) {

          console.error(
            "[ThumbnailAI] Video has no dimensions"
          );

          cleanup();
          resolve("");

          return;

        }


        const duration =
          Number.isFinite(video.duration)
            ? video.duration
            : 1;


        const captureTime =
          Math.min(
            Math.max(duration * 0.25, 0.1),
            Math.max(duration - 0.1, 0.1)
          );


        console.log(
          "[ThumbnailAI] Seeking to:",
          captureTime
        );


        video.currentTime =
          captureTime;

      };


      video.onseeked = () => {

        console.log(
          "[ThumbnailAI] Seek completed"
        );

        console.log(
          "[ThumbnailAI] Current time:",
          video.currentTime
        );

        console.log(
          "[ThumbnailAI] Ready state:",
          video.readyState
        );

        console.log(
          "[ThumbnailAI] Video dimensions:",
          video.videoWidth,
          "x",
          video.videoHeight
        );


        try {

          const canvas =
            document.createElement("canvas");


          /*
           * Preserve the video's real aspect ratio.
           */

          const width = 360;

          const height =
            Math.round(
              width *
              (
                video.videoHeight /
                video.videoWidth
              )
            );


          canvas.width = width;
          canvas.height = height;


          const ctx =
            canvas.getContext("2d");


          if (!ctx) {

            console.error(
              "[ThumbnailAI] Could not create canvas context"
            );

            cleanup();
            resolve("");

            return;

          }


          ctx.drawImage(
            video,
            0,
            0,
            width,
            height
          );


          console.log(
            "[ThumbnailAI] Frame drawn to canvas:",
            width,
            "x",
            height
          );


          const image =
            canvas.toDataURL(
              "image/jpeg",
              0.82
            );


          console.log(
            "[ThumbnailAI] Generated image length:",
            image.length
          );


          if (
            !image ||
            image.length < 1000
          ) {

            console.error(
              "[ThumbnailAI] Generated image appears empty"
            );

            cleanup();
            resolve("");

            return;

          }


          const score =
            this.getBrightnessScore(
              ctx,
              width,
              height
            );


          console.log(
            "[ThumbnailAI] Brightness score:",
            score
          );


          cleanup();

          resolve(image);

        }
        catch(error) {

          console.error(
            "[ThumbnailAI] Canvas capture failed:",
            error
          );

          cleanup();

          resolve("");

        }

      };


      video.onerror = () => {

        console.error(
          "[ThumbnailAI] Video loading error:",
          video.error
        );

        cleanup();

        resolve("");

      };

    });

  }


  static getBrightnessScore(
    ctx,
    width,
    height
  ) {

    try {

      const sampleWidth =
        Math.max(
          1,
          Math.floor(width * 0.5)
        );

      const sampleHeight =
        Math.max(
          1,
          Math.floor(height * 0.5)
        );


      const sample =
        ctx.getImageData(
          Math.floor(width * 0.25),
          Math.floor(height * 0.25),
          sampleWidth,
          sampleHeight
        );


      let total = 0;

      const data =
        sample.data;


      for(
        let i = 0;
        i < data.length;
        i += 16
      ) {

        total +=
          data[i] +
          data[i + 1] +
          data[i + 2];

      }


      return total;

    }
    catch(error) {

      console.error(
        "[ThumbnailAI] Brightness analysis failed:",
        error
      );

      return 0;

    }

  }

}


console.log(
  "Thumbnail AI Ready"
);