import StorageCredentials from "../credentials.js";

class SupabaseProvider {

  constructor() {
    this.id = "supabase";
    this.name = "Supabase Storage";
  }

  async upload(file, env, metadata = {}) {

    const credentials = StorageCredentials.getSupabase(env);

    if (!credentials.url || !credentials.key) {
      return {
        success: false,
        provider: this.name,
        error: "Supabase credentials missing"
      };
    }

    try {
      // Choose bucket based on role
      const bucket = metadata.role === "video"
        ? "cloudtok-videos"
        : "cloudtok-images";

      // File extension
      const extension = file.name && file.name.includes(".")
        ? file.name.split(".").pop().toLowerCase()
        : (metadata.role === "video" ? "mp4" : "jpg");

      const filename = `\( {metadata.userId || "unknown"}_ \){Date.now()}.${extension}`;
      const path = filename;

      const arrayBuffer = await file.arrayBuffer();

      const uploadUrl = `\( {credentials.url}/storage/v1/object/ \){bucket}/${path}`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.key}`,
          apikey: credentials.key,                    // ← this was missing
          "Content-Type": file.type || (metadata.role === "video" ? "video/mp4" : "image/jpeg"),
          "x-upsert": "true"
        },
        body: arrayBuffer
      });

      const responseText = await response.text();

      if (!response.ok) {
        return {
          success: false,
          provider: this.name,
          error: "Supabase upload failed",
          status: response.status,
          response: responseText
        };
      }

      // Public URL
      const publicUrl = `\( {credentials.url}/storage/v1/object/public/ \){bucket}/${path}`;

      return {
        success: true,
        provider: this.name,
        url: publicUrl,
        path: `\( {bucket}/ \){path}`,
        filename
      };

    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error.message || "Supabase upload failed"
      };
    }
  }

  async delete(path) {
    return {
      success: false,
      provider: this.name,
      error: "Delete not implemented"
    };
  }

  async healthCheck(env) {
    const credentials = StorageCredentials.getSupabase(env);
    const healthy = Boolean(credentials.url && credentials.key);

    return {
      provider: this.name,
      healthy,
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