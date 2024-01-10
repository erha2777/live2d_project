/**
 * 版权所有（c）Live2D股份有限公司保留所有权利.
 *
 * 此源代码的使用受Live2D开放软件许可证的管辖
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * 用于抽象平台相关功能的 Cubism Platform Abstraction Layer.
 *
 * 总结文件读取和时间取得等依赖于平台的函数。
 */
export class LAppPal {
  /**
   * 将文件作为字节数据读取
   *
   * @param filePath 目标文件路径
   * @return
   * {
   *      buffer,   导入的字节数据
   *      size        文件大小
   * }
   */
  public static loadFileAsBytes(
    filePath: string,
    callback: (arrayBuffer: ArrayBuffer, size: number) => void
  ): void {
    fetch(filePath)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => callback(arrayBuffer, arrayBuffer.byteLength));
  }

  /**
   * 获取增量时间（与上一帧的差值）
   * @return 增量时间[ms]
   */
  public static getDeltaTime(): number {
    return this.s_deltaTime;
  }

  public static updateTime(): void {
    this.s_currentFrame = Date.now();
    this.s_deltaTime = (this.s_currentFrame - this.s_lastFrame) / 1000;
    this.s_lastFrame = this.s_currentFrame;
  }

  /**
   * 输出消息
   * @param message 文字列
   */
  public static printMessage(message: string): void {
    console.log(message);
  }

  static lastUpdate = Date.now();

  static s_currentFrame = 0.0;
  static s_lastFrame = 0.0;
  static s_deltaTime = 0.0;
}
