/**
 * @description 封装一个文件上传类 （ 上传至 OSS ）
 * 
 * @author wangzhishuang
 * 
 * @date 2020-10-15 18:30:05
 * 
 * @action new uploadFileToOssTools(params).uploadFileToOss(function(res){})
 * 
 */


var crypto = require('./lib/Crypto.js').Crypto;
import { Base64 } from './lib/base64.min.js'

['HMAC.js', 'SHA1.js'].forEach(function(path) {
    require('./cryptoJs/lib/' + path);
});

/**
 * class uploadFileFormData 文件上传类
 * params 参数简介
 * @param {*} params 
 * tempFilePath     // 文件本地缓存路径
 * ossPath          // 要上传的文件目录路径
 * fileSize         // 文件限制大小 单位 byte 
 * ossUrl           // oss 绑定的域名
 */
let uploadFileToOssTools = class uploadFileToOssTools {

    constructor(params) {
        this.date = new Date();
        this.params = params;
        this.fileSize = params.fileSize;
        this.tempFilePath = params.tempFilePath;
        this.ossPath = params.ossPath;
        this.ossUrl = params.ossUrl;
        this.app = getApp();
    }

    /**
     * 上传文件到oss
     * 生成oss 所需参数
     */
    uploadFileToOss(callback) {
        var that = this;
        // ajax请求 sts 服务器 ，获取上传签名
        this.app.query('/v1/stsServer/getToken?user_token=' + this.app.get_token(), {}, function(res) {
            if (res.code == 0) {
                var formData = that.generateOssFormData(res.data);
                // 上传文件
                wx.uploadFile({
                    url: that.ossUrl,
                    filePath: that.tempFilePath, // 文件路径
                    name: 'file', // name 必须是 file （ali oss 强制约定）
                    formData: formData,
                    success: function(res) {
                        // oss文件路径返回
                        res.data = that.ossUrl + '/' + formData.key;
                    },
                    complete: function(res) {
                        typeof callback == 'function' && callback(res); // 回调
                    }
                });
            } else {
                this.app.errorHandle(res.message);
                return false;
            }
        });
    }

    /**
     * 生成 oss 请求数据
     * cres：接收一个从 wx.chooseVideo 等 返回的参数 
     * params = {filename}
     * 50 * 1024 * 1024
     */
    generateOssFormData(tokenInfo) {
        if (!tokenInfo) {
            return false;
        }
        this.date.setHours(this.date.getHours() + 1);
        var policyText = {
            expiration: this.date.toISOString(), // 设置policy过期时间。
            conditions: [
                // 限制上传大小。
                ["content-length-range", 0, this.fileSize], // 设置上传文件的大小限制,50mb
            ],
        };
        var policy = Base64.encode(JSON.stringify(policyText)) // policy必须为base64的string。
        var bytes = crypto.HMAC(crypto.SHA1, policy, tokenInfo.keySecret, { asBytes: true });
        // signature 生成规则
        var signature = crypto.util.bytesToBase64(bytes);
        var key = this.generateOssFilePath(); // 文件路径
        var formData = {
            key,
            OSSAccessKeyId: tokenInfo.keyId,
            signature,
            policy,
            'x-oss-security-token': tokenInfo.token
        }
        return formData;
    }


    /**
     * 生成文件名称
     */
    generateOssFilePath() {
        if (!this.tempFilePath || !this.ossPath) {
            return '';
        }
        var filenameArr = this.tempFilePath.split('.');
        var ext = filenameArr[filenameArr.length - 1];
        // 文件名规则：user_token + unix 时间戳
        var filename = this.app.get_token() + this.date.getTime() + '.' + ext;
        // oss路径规则： path/年/月/日/文件名称
        return this.ossPath + this.date.getFullYear() + '/' + (this.date.getMonth() + 1) + '/' + this.date.getDate() + "/" + filename;
    }

}

module.exports = uploadFileToOssTools;