/**
 * 版权所有（c）Live2D股份有限公司保留所有权利.
 *
 * 此源代码的使用受Live2D开放软件许可证的管辖
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

export class TouchManager {
  /**
   * 构造函数
   */
  constructor() {
    this._startX = 0.0;
    this._startY = 0.0;
    this._lastX = 0.0;
    this._lastY = 0.0;
    this._lastX1 = 0.0;
    this._lastY1 = 0.0;
    this._lastX2 = 0.0;
    this._lastY2 = 0.0;
    this._lastTouchDistance = 0.0;
    this._deltaX = 0.0;
    this._deltaY = 0.0;
    this._scale = 1.0;
    this._touchSingle = false;
    this._flipAvailable = false;
  }

  public getCenterX(): number {
    return this._lastX;
  }

  public getCenterY(): number {
    return this._lastY;
  }

  public getDeltaX(): number {
    return this._deltaX;
  }

  public getDeltaY(): number {
    return this._deltaY;
  }

  public getStartX(): number {
    return this._startX;
  }

  public getStartY(): number {
    return this._startY;
  }

  public getScale(): number {
    return this._scale;
  }

  public getX(): number {
    return this._lastX;
  }

  public getY(): number {
    return this._lastY;
  }

  public getX1(): number {
    return this._lastX1;
  }

  public getY1(): number {
    return this._lastY1;
  }

  public getX2(): number {
    return this._lastX2;
  }

  public getY2(): number {
    return this._lastY2;
  }

  public isSingleTouch(): boolean {
    return this._touchSingle;
  }

  public isFlickAvailable(): boolean {
    return this._flipAvailable;
  }

  public disableFlick(): void {
    this._flipAvailable = false;
  }

  /**
   * 触摸开始时事件
   * @param deviceX 触摸画面的x值
   * @param deviceY 触摸画面的y值
   */
  public touchesBegan(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._startX = deviceX;
    this._startY = deviceY;
    this._lastTouchDistance = -1.0;
    this._flipAvailable = true;
    this._touchSingle = true;
  }

  /**
   * 拖动事件
   * @param deviceX 触摸画面的x值
   * @param deviceY 触摸画面的y值
   */
  public touchesMoved(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._lastTouchDistance = -1.0;
    this._touchSingle = true;
  }

  /**
   * 轻拂的距离测量
   * @return 摆动距离
   */
  public getFlickDistance(): number {
    return this.calculateDistance(
      this._startX,
      this._startY,
      this._lastX,
      this._lastY
    );
  }

  /**
   * 求从点1到点2的距离
   *
   * @param x1 第一个触摸的画面x的值
   * @param y1 第一个触摸的画面y的值
   * @param x2 第二个触摸的画面x的值
   * @param y2 第二个触摸的画面y的值
   */
  public calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  /**
   * 根据第二个值计算移动量。
   * 如果方向不同，移动量为0。方向相同的情况下，参照绝对值小的值。
   *
   * @param v1 第一个移动量
   * @param v2 第二个移动量
   *
   * @return 小的移动量
   */
  public calculateMovingAmount(v1: number, v2: number): number {
    if (v1 > 0.0 != v2 > 0.0) {
      return 0.0;
    }

    const sign: number = v1 > 0.0 ? 1.0 : -1.0;
    const absoluteValue1 = Math.abs(v1);
    const absoluteValue2 = Math.abs(v2);
    return (
      sign * (absoluteValue1 < absoluteValue2 ? absoluteValue1 : absoluteValue2)
    );
  }

  _startY: number; // 开始触摸时x的值
  _startX: number; // 开始触摸时的y值
  _lastX: number; // 单一触摸时x的值
  _lastY: number; // 单触时的y值
  _lastX1: number; // 双触时的第一个x的值
  _lastY1: number; // 双触时的第一个y值
  _lastX2: number; // 双重触碰时的第二个x的值
  _lastY2: number; // 双重触碰时的第二个y值
  _lastTouchDistance: number; // 两个以上触摸时手指的距离
  _deltaX: number; // x从上次值到这次值的移动距离
  _deltaY: number; // y从上次值到这次值的移动距离
  _scale: number; // 用这个空格相乘的放大率。放大操作中以外1
  _touchSingle: boolean; // 单触时为true
  _flipAvailable: boolean; // 翻转是否有效
}
