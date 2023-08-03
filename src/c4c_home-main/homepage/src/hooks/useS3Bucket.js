import AWS from 'aws-sdk'
AWS.config.update({
    accessKeyId: process.env.REACT_APP_S3_ACCESS_KEY,
    secretAccessKey: process.env.REACT_APP_S3_SECRET_KEY,
})

export const deleteFile = (url, callback) => {
    if (!url) {
        callback(null, null);
        return;
    }

    const myBucket = new AWS.S3({
        params: { Bucket: process.env.REACT_APP_S3_BUCKET },
        region: process.env.REACT_APP_S3_REGION,
    })

    const params = {
        Bucket: process.env.REACT_APP_S3_BUCKET,
        Key: url.split('com/')[1]
    };

    myBucket.deleteObject(params, callback);
}

export const uploadCollectionFile = (collectionInfo, uid, callback) => {
    uploadFile(collectionInfo.file, '2_market_place/1_nft/' + uid + '/' + collectionInfo.title, "collection_" + collectionInfo.file.name, callback);
}

export const uploadCollectionJson = (collectionInfo, jsonData, uid, callback) => {
    uploadFile(JSON.stringify(jsonData), '2_market_place/1_nft/' + uid + '/' + collectionInfo.title, "collection_metadata.json", callback);
}

export const uploadNftFile = (collectionInfo, nftInfo, uid, callback) => {
    uploadFile(nftInfo.file, '2_market_place/1_nft/' + uid + '/' + collectionInfo.title, nftInfo.title + "_" + nftInfo.file.name, callback);
}

export const uploadNftJson = (collectionInfo, jsonData, fileName, uid, callback) => {
    uploadFile(JSON.stringify(jsonData), '2_market_place/1_nft/' + uid + '/' + collectionInfo.title, fileName, callback);
}

export const uploadAvatarFile = (file, uid, callback) => {
    if (!file) {
        callback(null, null);
        return;
    }

    uploadFile(file, '2_market_place/2_user/1_avatar', uid + '_' + file.name, callback);
}

export const uploadBackgroundFile = (file, uid, callback) => {
    if (!file) {
        callback(null, null);
        return;
    }

    uploadFile(file, '2_market_place/2_user/2_background', uid + '_' + file.name, callback);
}

export const uploadCategoryFile = (file, name, callback) => {
    if (!file) {
        callback(null, null);
        return;
    }

    uploadFile(file, '2_market_place/3_admin/1_category', name + '_' + file.name, callback);
}

export const uploadPromotionFile = (file, callback) => {
    if (!file) {
        callback(null, null);
        return;
    }

    uploadFile(file, '2_market_place/3_admin/2_promotion', file.name, callback);
}

const uploadFile = (file, pathPrefix, fileName, callback) => {
    const myBucket = new AWS.S3({
        params: { Bucket: process.env.REACT_APP_S3_BUCKET },
        region: process.env.REACT_APP_S3_REGION,
    })

    const params = {
        ACL: 'public-read',
        Body: file,
        Bucket: process.env.REACT_APP_S3_BUCKET,
        Key: pathPrefix + '/' + fileName
    };

    if (fileName.includes("json")) {
        params.ContentType = "application/json"
    }

    myBucket.upload(params, callback);
}