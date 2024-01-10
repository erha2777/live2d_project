// 初始化
function init() {
    console.debug(initLive2D);
    var resourcesPaths = `${resourcesPath}`;
    var backImageNames = `${backImageName}`;
    var modelDirString = `${modelDir}`;
    var modelDirs = modelDirString.split(',');

    initLive2D(resourcesPaths, backImageNames, modelDirs);  // lappdefine.ts开放的接口用于初始化常量被编译到bundle.js文件里
}

// 监听复制（这里简单添加了一些事件，可以添加更多的事件，比如报时等）




var resourcesPath = 'https://www.jawei.icu/live2d/model/' // 指定资源文件（模型）保存的路径
var backImageName = '' // 指定背景图片
var modelDir = ['whitecat'] // 指定需要加载的模型
init() // 初始化模型，属于message.js文件