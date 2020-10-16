/**
 * **********************************************************************************
 * @example 
 * **********************************************************************************
 */

var uploadFileToOssTools = require('./uploadFileToOss.js');


wx.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 60,
    camera: 'back',
    compressed: true,
    success(res) {
        that.uploadMedia(res);
    },
    fail(res) {
        console.log("cancel select video-")
        console.log(res);
    },
});


/** 
 * 上传视频 至 oss
 */
function uploadMedia(cres) {
    var that = this;
    // 视频数据校验-----50mb 以内才可以上传
    var size = (cres.size / (1024 * 1024)).toFixed(2);
    if (size > 50) {
        wx.showToast({ title: '此视频过大，建议分多次上传', icon: 'none' });
        return;
    }

    wx.showLoading({
        title: '正在上传'
    });

    new uploadFileToOssTools({
            fileSize: 50 * 1024 * 1024, // 文件大小限制 单位byte
            tempFilePath: cres.tempFilePath, // 调用wx.chooseVideo 返回的文件路径
            ossPath: 'dirA/dirB/', // oss 存储目录  文件存储方式是 dirA/dirB/年/月/日/
            ossUrl: 'https://oss.xxxx.com', // oss 绑定的域名
        })
        .uploadFileToOss(function(res) {
            wx.hideLoading();
            if (res.statusCode == 204) { // 上传成功 返回204 ，也可设置成 200
                var src = res.data; // 文件路径
                app.msg('视频上传成功');
            } else {
                app.msg('视频上传出错 请重试');
            }
        });
}