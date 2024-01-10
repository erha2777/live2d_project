/**
 * 版权所有（c）Live2D股份有限公司保留所有权利.
 *
 * 此源代码的使用受Live2D开放软件许可证的管辖
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismViewMatrix } from '@framework/math/cubismviewmatrix';

import * as LAppDefine from './lappdefine';
import { canvas, gl, LAppDelegate } from './lappdelegate';
import { LAppLive2DManager } from './lapplive2dmanager';
import { LAppPal } from './lapppal';
import { LAppSprite } from './lappsprite';
import { TextureInfo } from './lapptexturemanager';
import { TouchManager } from './touchmanager';

/**
 * 绘图类。
 */
export class LAppView {
  /**
   * 构造函数
   */
  constructor() {
    this._programId = null;
    this._back = null;
    this._gear = null;

    // 触摸事件管理
    this._touchManager = new TouchManager();

    // 用于将设备坐标转换为屏幕坐标
    this._deviceToScreen = new CubismMatrix44();

    // 进行画面的显示的放大缩小和移动的变换的行列
    this._viewMatrix = new CubismViewMatrix();
  }

  /**
   * 初始化。
   */
  public initialize(): void {
    const { width, height } = canvas;

    const ratio: number = width / height;
    const left: number = -ratio;
    const right: number = ratio;
    const bottom: number = LAppDefine.ViewLogicalLeft;
    const top: number = LAppDefine.ViewLogicalRight;

    this._viewMatrix.setScreenRect(left, right, bottom, top); // 与设备相对应的屏幕范围。X左端、X右端、Y下端、Y上端
    this._viewMatrix.scale(LAppDefine.ViewScale, LAppDefine.ViewScale);

    this._deviceToScreen.loadIdentity();
    if (width > height) {
      const screenW: number = Math.abs(right - left);
      this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    } else {
      const screenH: number = Math.abs(top - bottom);
      this._deviceToScreen.scaleRelative(screenH / height, -screenH / height);
    }
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    // 设置显示范围
    this._viewMatrix.setMaxScale(LAppDefine.ViewMaxScale); // 极限扩展率
    this._viewMatrix.setMinScale(LAppDefine.ViewMinScale); // 极限收缩率

    // 可显示的最大范围
    this._viewMatrix.setMaxScreenRect(
      LAppDefine.ViewLogicalMaxLeft,
      LAppDefine.ViewLogicalMaxRight,
      LAppDefine.ViewLogicalMaxBottom,
      LAppDefine.ViewLogicalMaxTop
    );
  }

  /**
   * 释放
   */
  public release(): void {
    this._viewMatrix = null;
    this._touchManager = null;
    this._deviceToScreen = null;

    this._gear.release();
    this._gear = null;

    this._back.release();
    this._back = null;

    gl.deleteProgram(this._programId);
    this._programId = null;
  }

  /**
   * 绘制。
   */
  public render(): void {
    gl.useProgram(this._programId);

    if (this._back) {
      this._back.render(this._programId);
    }
    if (this._gear) {
      this._gear.render(this._programId);
    }

    gl.flush();

    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();

    live2DManager.setViewMatrix(this._viewMatrix);

    live2DManager.onUpdate();
  }

  /**
   * 图像的初始化。
   */
  // 进行图像的初始化，一些不重要的元素初始化。这里有一个齿轮设置的图像，里面的内容替换成了眼睛的图标，没用所以注释掉，还加了一个背景图片加载的判断，没有背景图片就不加载
  public initializeSprite(): void {
    const width: number = canvas.width;
    const height: number = canvas.height;

    const textureManager = LAppDelegate.getInstance().getTextureManager();
    const resourcesPath = LAppDefine.ResourcesPath;

    let imageName = '';

    // 背景图像初始化
    imageName = LAppDefine.BackImageName;

    //如果指定了背景图片，就加载
    if (imageName != "" && imageName != null) {
      // 由于异步，创建回调函数
      const initBackGroundTexture = (textureInfo: TextureInfo): void => {
        const x: number = width * 0.5; //背景图片出现宽度的位置
        const y: number = height * 0.5; //背景图片出现高度的位置

        const fwidth = textureInfo.width * 2.0; //背景图片的宽度
        const fheight = height * 0.95; //背景图片的高度
        this._back = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
      };

      textureManager.createTextureFromPngFile( //回调函数
        resourcesPath + imageName,
        false,
        initBackGroundTexture
      );
    }


    // 齿轮图像初始化 （原来是右上角有一个齿轮的图片，点击齿轮图片切换模型
    // imageName = LAppDefine.GearImageName;
    // // 齿轮初始化后的回调函数
    // const initGearTexture = (textureInfo: TextureInfo): void => {
    //   const x = width - textureInfo.width * 0.5; //出现在右上角
    //   const y = height - textureInfo.height * 0.5;
    //   const fwidth = textureInfo.width;
    //   const fheight = textureInfo.height;
    //   this._gear = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
    // };

    // textureManager.createTextureFromPngFile(
    //   resourcesPath + imageName,
    //   false,
    //   initGearTexture
    // );

    // 创建阴影
    if (this._programId == null) {
      this._programId = LAppDelegate.getInstance().createShader();
    }
  }

  /**
   * 被触摸时被叫到。
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesBegan(pointX: number, pointY: number): void {
    this._touchManager.touchesBegan(pointX, pointY);
  }

  /**
   * 触摸时指针移动的话会被呼叫
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesMoved(pointX: number, pointY: number): void {
    const viewX: number = this.transformViewX(this._touchManager.getX());
    const viewY: number = this.transformViewY(this._touchManager.getY());

    this._touchManager.touchesMoved(pointX, pointY);

    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
    live2DManager.onDrag(viewX, viewY);
  }

  /**
   * 触摸结束后被呼叫
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesEnded(pointX: number, pointY: number): void {
    // 触摸结束
    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
    live2DManager.onDrag(0.0, 0.0);

    {
      // 单击
      const x: number = this._deviceToScreen.transformX(
        this._touchManager.getX()
      ); // 获取逻辑坐标转换后的坐标
      const y: number = this._deviceToScreen.transformY(
        this._touchManager.getY()
      ); // 获取逻辑坐标变化的坐标

      if (LAppDefine.DebugTouchLogEnable) {
        LAppPal.printMessage(`[APP]touchesEnded x: ${x} y: ${y}`);
      }
      live2DManager.onTap(x, y);

      // 是轻敲齿轮吗
      // if (this._gear.isHit(pointX, pointY)) {
      //   live2DManager.nextScene();
      // }
    }
  }

  /**
   * 将X坐标转换为View坐标
   *
   * @param deviceX 设备X坐标
   */
  public transformViewX(deviceX: number): number {
    const screenX: number = this._deviceToScreen.transformX(deviceX); // 获得逻辑坐标变换后的坐标
    return this._viewMatrix.invertTransformX(screenX); // 放大、缩小、移动后的值
  }

  /**
   * 将Y坐标转换为View坐标
   *
   * @param deviceY 设备Y坐标
   */
  public transformViewY(deviceY: number): number {
    const screenY: number = this._deviceToScreen.transformY(deviceY); // 取得逻辑坐标变换后的坐标
    return this._viewMatrix.invertTransformY(screenY);
  }

  /**
   * 将X坐标转换为Screen坐标
   * @param deviceX 设备X坐标
   */
  public transformScreenX(deviceX: number): number {
    return this._deviceToScreen.transformX(deviceX);
  }

  /**
   * 将设备X坐标Y坐标转换为Screen坐标
   *
   * @param deviceY 设备Y坐标
   */
  public transformScreenY(deviceY: number): number {
    return this._deviceToScreen.transformY(deviceY);
  }

  _touchManager: TouchManager; // 触控
  _deviceToScreen: CubismMatrix44; // 从设备到屏幕的矩阵
  _viewMatrix: CubismViewMatrix; // viewMatrix
  _programId: WebGLProgram; // 着色器ID
  _back: LAppSprite; // 背景画像
  _gear: LAppSprite; // ギア画像
  _changeModel: boolean; // 模型切换标志
  _isClick: boolean; // 点击中
}
