
import { win } from './lappdefine';
import { LAppDelegate } from './lappdelegate';

// 配置参数
export interface Live2dOptions {
    // 容器 querySelector 选择器，默认值 #live2d
    el?: any
    canvasSize?: { width: number; height: number } | 'auto'
    resourcesPath?: string
    backImageNames?: string
    modelDirs?: string[]
}

export class Live2d {

    // 画布id
    el: null;

    Live2dOptions: Live2dOptions;

    // 应用程序类,管理Cubism SDK
    App: LAppDelegate | null = null;

    /**
    * 构造函数
    */
    constructor(live2dOptions: Live2dOptions) {
        this.Live2dOptions = live2dOptions;
        this.el = live2dOptions?.el || '#live2d';

        let { resourcesPath = '', backImageNames = '', modelDirs = [] } = live2dOptions

        win?.initLive2D(resourcesPath, backImageNames, modelDirs)
        this.init()
    }

    /**
   * 初始化。
   *
   * @return 类实例
   */
    public init(): void {
        // 浏览器装入后的处理（打开页面）
        window.onload = (): void => {
            this.App = LAppDelegate.getInstance()
            console.log(this.App);
            if (this.App?.initialize() == false) {
                console.debug('初始化失败');
                return;
            }
            this.App?.run();
        }

        //结束时的处理 (刷新或关闭页面)
        window.onbeforeunload = (): void => LAppDelegate.releaseInstance();

        /**
        * 更改屏幕尺寸时的处理.
        */
        window.onresize = () => {
            this.App?.onResize();
        };
    }


}