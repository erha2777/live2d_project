/**
 * 版权所有（c）Live2D股份有限公司保留所有权利.
 *
 * 此源代码的使用受Live2D开放软件许可证的管辖
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LAppDelegate } from './lappdelegate';
import * as LAppDefine from './lappdefine';

// 浏览器装入后的处理（打开页面）
window.onload = (): void => {
  // 创建应用程序实例
  if (LAppDelegate.getInstance().initialize() == false) {
    return;
  }

  LAppDelegate.getInstance().run();
};

//结束时的处理 (刷新或关闭页面)
window.onbeforeunload = (): void => LAppDelegate.releaseInstance();

/**
 * 更改屏幕尺寸时的处理.
 */
window.onresize = () => {
  if (LAppDefine.CanvasSize === 'auto') {
    LAppDelegate.getInstance().onResize();
  }
};
