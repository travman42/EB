import { _decorator, sys } from 'cc';
const { ccclass } = _decorator;

// 1. 定义微信接口类型 (避免 TypeScript 报错)
// 只要声明了 wx 变量，TS 就会认为它存在
declare const wx: any; 

// 2. 定义分享参数结构
export interface ShareOption {
    title: string;
    imageUrl?: string; // 可选，不填就截屏
    query?: string;    // 比如 "inviterId=123"
}

// 3. 核心服务类 (单例)
export class WechatService {
    private static _instance: WechatService;

    public static get instance(): WechatService {
        if (!this._instance) {
            this._instance = new WechatService();
            this._instance.init();
        }
        return this._instance;
    }

    private init() {
        // 如果是微信小游戏环境，开启“被动转发”监听 (右上角三个点)
        if (sys.platform === sys.Platform.WECHAT_GAME && typeof wx !== 'undefined') {
            wx.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline']
            });
            
            // 设置默认分享文案
            wx.onShareAppMessage(() => {
                return {
                    title: '我的神兽正在为省争光，快来支援！',
                    imageUrlId: '', // 审核过的图片ID
                    imageUrl: ''    // 图片地址
                };
            });
        }
    }

    // --- 主动拉起分享 (点击按钮) ---
    public shareGame(option?: ShareOption) {
        const title = option?.title || "《元气大作战》火热公测中！";
        const query = option?.query || "";

        // A. 真实环境 (微信小游戏)
        if (sys.platform === sys.Platform.WECHAT_GAME && typeof wx !== 'undefined') {
            wx.shareAppMessage({
                title: title,
                imageUrl: option?.imageUrl || '', 
                query: query
            });
            console.log("已调用微信真实分享接口");
        } 
        // B. 模拟环境 (电脑浏览器/编辑器)
        else {
            console.log(`%c [模拟分享] 标题: ${title} | 参数: ${query}`, "color: green; font-weight: bold;");
            // 这里可以做一个假的弹窗提示“分享成功”
            alert(`[开发模式] 模拟分享成功！\n标题：${title}`);
        }
    }

    // --- 震动反馈 (顺手加上，增加手感) ---
    public vibrateShort() {
        if (sys.platform === sys.Platform.WECHAT_GAME && typeof wx !== 'undefined') {
            wx.vibrateShort({ type: 'heavy' });
        } else {
            console.log("[模拟震动] bzzzt!");
        }
    }
}