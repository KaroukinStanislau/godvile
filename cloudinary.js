var cloudinary = require('cloudinary');
var config = require('./config');

cloudinary.config(config.cloudinary);

module.exports = {
    sendScreenshootToCloudinary: function(shot, action) {
        return new Promise(function (resolve, reject) {
            cloudinary.v2.uploader.upload_stream({
                    public_id: `godvile/${action}`
                },
                function (error, cloudinary_result) {
                    if (error) {
                        console.error('Upload to cloudinary failed: ', error);
                        reject(error);
                    } else {
                        console.log({
                            time: cloudinary_result.created_at,
                            url: cloudinary_result.secure_url
                        });
                        resolve(cloudinary_result);
                    }
                }
            ).end(shot);
        });
    }
}