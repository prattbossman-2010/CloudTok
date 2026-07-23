const StorageConfig = {

    providers: [

        {
            id: "cloudinary",

            name: "Cloudinary",

            enabled: true,

            apiConfigured: true,

            roles: ["video"],

            priority: 1,

            maxFileSize: "500MB",

            freeStorage: 25,

            usedStorage: 0,

            storageUnit: "GB",

            uploadCount: 0,

            averageUpload: 0,

            health: 100,

            failures: 0,

            successRate: 100,

            latency: 0,

            lastHealthCheck: null,

            lastSuccess: null,

            lastFailure: null

        },


        {
            id: "backblaze",

            name: "Backblaze B2",

            enabled: true,

            apiConfigured: false,

            roles: ["video"],

            priority: 2,

            maxFileSize: "5GB",

            freeStorage: 10,

            usedStorage: 0,

            storageUnit: "GB",

            uploadCount: 0,

            averageUpload: 0,

            health: 100,

            failures: 0,

            successRate: 100,

            latency: 0,

            lastHealthCheck: null,

            lastSuccess: null,

            lastFailure: null

        },


        {
            id: "supabase",

            name: "Supabase Storage",

            enabled: true,

            apiConfigured: false,

            roles: ["video"],

            priority: 3,

            maxFileSize: "50MB",

            freeStorage: 1,

            usedStorage: 0,

            storageUnit: "GB",

            uploadCount: 0,

            averageUpload: 0,

            health: 100,

            failures: 0,

            successRate: 100,

            latency: 0,

            lastHealthCheck: null,

            lastSuccess: null,

            lastFailure: null

        },


        {
            id: "imagekit",

            name: "ImageKit",

            enabled: true,

            apiConfigured: false,

            roles: [
                "thumbnail",
                "avatar"
            ],

            priority: 4,

            maxFileSize: "2GB",

            freeStorage: 20,

            usedStorage: 0,

            storageUnit: "GB",

            uploadCount: 0,

            averageUpload: 0,

            health: 100,

            failures: 0,

            successRate: 100,

            latency: 0,

            lastHealthCheck: null,

            lastSuccess: null,

            lastFailure: null

        },


        {
            id: "r2",

            name: "Cloudflare R2",

            enabled: true,

            apiConfigured: false,

            roles: ["video"],

            priority: 5,

            maxFileSize: "5GB",

            freeStorage: 10,

            usedStorage: 0,

            storageUnit: "GB",

            uploadCount: 0,

            averageUpload: 0,

            health: 100,

            failures: 0,

            successRate: 100,

            latency: 0,

            lastHealthCheck: null,

            lastSuccess: null,

            lastFailure: null

        }

    ]

};


export default StorageConfig;