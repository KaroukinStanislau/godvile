module.exports = {
    app: {
        port: process.env.PORT || 3000,
        username_val: process.env.GODVILE_USERNAME,
        password_val: process.env.GODVILE_PASSWORD,
        hoursBetweenExec: process.env.HOURS_BETWEEN_SCREENSHOOTS || 12,
        fileName: process.env.FILE_NAME || 'prevExecTime.txt',
    },
    cloudinary: {
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET
    }
}