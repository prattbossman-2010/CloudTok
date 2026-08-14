import StorageCredentials from "../credentials.js";

class SupabaseProvider {

  constructor() {
    this.id = "supabase";
    this.name = "Supabase Storage";
  }

  async upload(file, env, metadata = {}) {

    const credentials = StorageCredentials.getSupabase(env);

    // Extra safety checks
    if (!credentials || !credentials.url || !credentials.key) {
      return {
        success: false,
        provider: this.name,
        error: "Supabase credentials missing (url or key is empty)"
      };
    }

    // Remove trailing slash if present
    const baseUrl = credentials.url.replace(/\/$/, "");

    try {
      const bucket = (metadata.role === "video")
        ? "cloudtok-videos"
        : "cloudtok-images";

      const extension = (file.name && file.name.includes("."))
        ? file.name.split(".").pop().toLowerCase()
        : "mp4";

      const userId = metadata.userId || "unknown";
      const filename = userId + "_" + Date.now() + "." + extension;

      const arrayBuffer = await file.arrayBuffer();

      const uploadUrl = baseUrl + "/storage/v1/object/" + bucket + "/" + filename;

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + credentials.key,
          "apikey": credentials.key,
          "Content-Type": file.type || "video/mp4",
          "x-upsert": "true"
        },
        body: arrayBuffer
      });

      const responseText = await response.text();

      if (!response.ok) {
        return {
          success: false,
          provider: this.name,
          error: "Supabase upload failed – status " + response.status,
          response: responseText
        };
      }

      const publicUrl = baseUrl + "/storage/v1/object/public/" + bucket + "/" + filename;

      return {
        success: true,
        provider: this.name,
        url: publicUrl,
        path: bucket + "/" + filename,
        filename: filename
      };

    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error.message || "Supabase upload failed"
      };
    }
  }

  async delete(pathOrUrl, env) {
  try {
    const credentials = StorageCredentials.getSupabase(env);

    if (!credentials || !credentials.url || !credentials.key) {
      return {
        success: false,
        provider: this.name,
        error: "Supabase credentials missing"
      };
    }

    const baseUrl = credentials.url.replace(/\/$/, "");

    // Accept either a full public URL or a path like "cloudtok-videos/filename.mp4"
    let path = pathOrUrl;

    if (pathOrUrl.includes("/storage/v1/object/public/")) {
      path = pathOrUrl.split("/storage/v1/object/public/")[1];
    } else if (pathOrUrl.includes("/storage/v1/object/")) {
      path = pathOrUrl.split("/storage/v1/object/")[1];
    }

    if (!path) {
      return {
        success: false,
        provider: this.name,
        error: "Could not extract file path"
      };
    }

    const deleteUrl = baseUrl + "/storage/v1/object/" + path;

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + credentials.key,
        "apikey": credentials.key
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        provider: this.name,
        error: "Delete failed – status " + response.status,
        response: text
      };
    }

    return {
      success: true,
      provider: this.name,
      path: path
    };

  } catch (error) {
    return {
      success: false,
      provider: this.name,
      error: error.message || "Supabase delete failed"
    };
  }
}

  async healthCheck(env) {
    const credentials = StorageCredentials.getSupabase(env);
    const healthy = Boolean(credentials && credentials.url && credentials.key);

    return {
      provider: this.name,
      healthy: healthy,
      message: healthy ? "Supabase configured" : "Supabase credentials missing"
    };
  }

  getStats() {
    return {
      provider: this.name,
      uploads: 0,
      failures: 0,
      averageUpload: 0
    };
  }
}

export default new SupabaseProvider();