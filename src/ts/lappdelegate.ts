/**
 * 版权所有（c）Live2D股份有限公司保留所有权利.
 *
 * 此源代码的使用受Live2D开放软件许可证的管辖
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismFramework, Option } from '@framework/live2dcubismframework';

import * as LAppDefine from './lappdefine';
import { LAppLive2DManager } from './lapplive2dmanager';
import { LAppPal } from './lapppal';
import { LAppTextureManager } from './lapptexturemanager';
import { LAppView } from './lappview';

export let canvas: HTMLCanvasElement = null;
export let s_instance: LAppDelegate = null;
export let gl: WebGLRenderingContext = null;
export let frameBuffer: WebGLFramebuffer = null;
// 眼睛
export let fui_eye: HTMLSpanElement = null;


/**
 * 应用程序类。
 * 管理Cubism SDK。
 */
export class LAppDelegate {
  /**
   * 返回一个类实例。
   * 如果未生成实例，则在内部生成实例。
   *
   * @return 类实例
   */
  public static getInstance(): LAppDelegate {
    if (s_instance == null) {
      s_instance = new LAppDelegate();
    }

    return s_instance;
  }

  /**
   * 释放类实例（单个）。
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance.release();
    }

    s_instance = null;
  }

  /**
   * 初始化APP需要的东西。
   */
  public initialize(): boolean {
    // 创建画布
    // canvas = document.createElement('canvas');
    // if (LAppDefine.CanvasSize === 'auto') {
    //   this._resizeCanvas();
    // } else {
    //   canvas.width = LAppDefine.CanvasSize.width;
    //   canvas.height = LAppDefine.CanvasSize.height;
    // }

    canvas = <HTMLCanvasElement>document.getElementById("live2d"); // index.html中的id为live2d的画布
    canvas.width = canvas.width;
    canvas.height = canvas.height;
    canvas.toDataURL("image/png");

    // 这个是index.html工具栏中的眼睛图标，点击眼睛图标就切换下一个模型
    // 正规来说应该留个切换模型的口子，在message.js中调用，因为懒就直接在这里写了
    fui_eye = <HTMLSpanElement>document.getElementsByClassName("fui-eye")[0];


    // 初始化gl上下文 （代码段结束后有解释）
    // @ts-ignore
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      alert('Cannot initialize WebGL. This browser does not support.\n不能初始化WebGL，该浏览器不支持WebGL，请切换浏览器重试');
      gl = null;

      document.body.innerHTML =
        '该浏览器不支持 <code>&lt;canvas&gt;</code> 标签元素，请切换浏览器重试.';

      // gl初期化失敗
      return false;
    }

    // 向DOM添加画布
    // document.body.appendChild(canvas);

    if (!frameBuffer) {
      frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    }

    // 透明设置
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const supportTouch: boolean = 'ontouchend' in canvas;  //是否支持触碰（触摸屏）

    if (supportTouch) { // 区分手机和电脑（两种事件都要注册）
      // 注册触摸相关的回调函数  （触摸屏）
      canvas.ontouchstart = onTouchBegan;
      canvas.ontouchmove = onTouchMoved;
      canvas.ontouchend = onTouchEnded;
      canvas.ontouchcancel = onTouchCancel;
    } else {
      // 注册鼠标相关的回调函数
      canvas.onmousedown = onClickBegan;
      canvas.onmousemove = onMouseMoved;
      canvas.onmouseup = onClickEnded;
      fui_eye.onmousedown = (): void => {	// 工具栏眼睛图标点击事件
        const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
        live2DManager.nextScene();
      };
    }

    // AppView的初始化
    this._view.initialize();

    // Cubism SDK的初始化
    this.initializeCubism();

    return true;
  }

  /**
   * 调整画布并重新初始化视图.
   */
  public onResize(): void {
    this._resizeCanvas();
    this._view.initialize();
    this._view.initializeSprite();

    // 传递画布大小
    const viewport: number[] = [0, 0, canvas.width, canvas.height];

    gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
  }

  /**
   * 释放。
   */
  public release(): void {
    this._textureManager.release();
    this._textureManager = null;

    this._view.release();
    this._view = null;

    // 释放资源
    LAppLive2DManager.releaseInstance();

    // 释放Cubism SDK
    CubismFramework.dispose();
  }

  /**
   * 执行处理。
   */
  public run(): void {
    // 主循环
    const loop = (): void => {
      // 确认有无实例
      if (s_instance == null) {
        return;
      }

      // 更新时间
      LAppPal.updateTime();

      // 画面的初始化
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      // 启动深度测试
      gl.enable(gl.DEPTH_TEST);

      // 附近的物体将远处的物体遮盖起来
      gl.depthFunc(gl.LEQUAL);

      // 清除彩色缓冲区和深度缓冲区  （加上这一句会导致有些浏览器背景变成黑色，而不是透明）
      // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.clearDepth(1.0);

      // 透明设置
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // 绘图更新
      this._view.render();

      // 循环递归调用
      requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * 注册着色器。
   */
  public createShader(): WebGLProgram {
    // 编译条形着色器
    const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);

    if (vertexShaderId == null) {
      LAppPal.printMessage('failed to create vertexShader');
      return null;
    }

    const vertexShader: string =
      'precision mediump float;' +
      'attribute vec3 position;' +
      'attribute vec2 uv;' +
      'varying vec2 vuv;' +
      'void main(void)' +
      '{' +
      '   gl_Position = vec4(position, 1.0);' +
      '   vuv = uv;' +
      '}';

    gl.shaderSource(vertexShaderId, vertexShader);
    gl.compileShader(vertexShaderId);

    // 编译碎片着色器
    const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

    if (fragmentShaderId == null) {
      LAppPal.printMessage('failed to create fragmentShader');
      return null;
    }

    const fragmentShader: string =
      'precision mediump float;' +
      'varying vec2 vuv;' +
      'uniform sampler2D texture;' +
      'void main(void)' +
      '{' +
      '   gl_FragColor = texture2D(texture, vuv);' +
      '}';

    gl.shaderSource(fragmentShaderId, fragmentShader);
    gl.compileShader(fragmentShaderId);

    // 创建程序对象
    const programId = gl.createProgram();
    gl.attachShader(programId, vertexShaderId);
    gl.attachShader(programId, fragmentShaderId);

    gl.deleteShader(vertexShaderId);
    gl.deleteShader(fragmentShaderId);

    // 链接
    gl.linkProgram(programId);

    gl.useProgram(programId);

    return programId;
  }

  /**
   * 获取查看信息。
   */
  public getView(): LAppView {
    return this._view;
  }

  public getTextureManager(): LAppTextureManager {
    return this._textureManager;
  }

  /**
   * 构造函数
   */
  constructor() {
    this._captured = false;
    this._mouseX = 0.0;
    this._mouseY = 0.0;
    this._isEnd = false;

    this._cubismOption = new Option();
    this._view = new LAppView();
    this._textureManager = new LAppTextureManager();
    this.live2DManager = null;
  }

  /**
   * Cubism SDK的初始化
   */
  public initializeCubism(): void {
    // setup cubism 设置cubism
    this._cubismOption.logFunction = LAppPal.printMessage; //初始化控制台打印信息工具，就是console.log
    this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel; //指定打印日志的等级
    CubismFramework.startUp(this._cubismOption);

    // initialize cubism 初始化设置cubism
    CubismFramework.initialize();

    // load model 加载模型
    this.live2DManager = LAppLive2DManager.getInstance();

    // 更新时间
    LAppPal.updateTime();

    this._view.initializeSprite();
  }

  /**
   * 调整画布以填充屏幕.
   */
  private _resizeCanvas(): void {
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
    canvas.width = canvas.width;
    canvas.height = canvas.height;
  }

  _cubismOption: Option; // Cubism SDK选项
  _view: LAppView; // 视图信息
  live2DManager: LAppLive2DManager | null; // Live2d管理
  _captured: boolean; // 是否单击
  _mouseX: number; // 鼠标X坐标
  _mouseY: number; // 鼠标Y坐标
  _isEnd: boolean; // APP是否结束
  _textureManager: LAppTextureManager; // 纹理管理器
}

/**
 * 单击时调用。
 */
function onClickBegan(e: MouseEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }
  LAppDelegate.getInstance()._captured = true;

  const posX: number = e.pageX;
  const posY: number = e.pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * 鼠标移动后的回调
 */
function onMouseMoved(e: MouseEvent): void {
  // if (!LAppDelegate.getInstance()._captured) { // 判断是否单击，原来是要按住鼠标左键图像才会跟着鼠标动
  //   return;
  // }

  if (!LAppDelegate.getInstance()._view) { //获得lappview.ts的实例对象
    LAppPal.printMessage('view notfound');
    return;
  }

  // e.clientX和e.clientY获取的坐标点都是以左上角为原点
  const rect = (e.target as Element).getBoundingClientRect();
  // const posX: number = e.clientX - rect.left;
  // const posY: number = e.clientY - rect.top;
  let posX: number = e.clientX;
  let posY: number = e.clientY - window.innerHeight + canvas.height;

  // 图像在网页的坐下角，简单处理坐标将超过画布边界坐标就等与边界坐标
  posX = (posX > canvas.width) ? canvas.width : posX;
  posY = (posY < 0) ? 0 : posY;

  // 转换坐标，调用LAppLive2DManager类重新绘制图像
  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * 点击结束后被叫（回调）。
 */
function onClickEnded(e: MouseEvent): void {
  LAppDelegate.getInstance()._captured = false;
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * 触摸的时候被叫到（回调）。
 */
function onTouchBegan(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  LAppDelegate.getInstance()._captured = true;

  const posX = e.changedTouches[0].pageX;
  const posY = e.changedTouches[0].pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * 滑动时回调。
 */
function onTouchMoved(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._captured) {
    return;
  }

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * 触摸结束后回调。
 */
function onTouchEnded(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * 触摸被取消回调。
 */
function onTouchCancel(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}
