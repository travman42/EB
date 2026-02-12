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

// 【新增】定义玩家信息接口 (标准微信用户信息结构)
export interface IPlayerInfo {
    openId: string;      // 唯一标识
    nickName: string;    // 昵称
    avatarUrl: string;   // 头像
    gender: number;      // 0:未知, 1:男, 2:女
}

// 【新增】随机昵称库
const ADJECTIVES = ["元气的", "迷糊的", "暴躁的", "贪吃的", "失眠的", "焦虑的", "佛系的", "热血的", "摸鱼的"];
const NOUNS = ["大熊猫", "考拉", "水豚", "哈士奇", "橘猫", "小脑斧", "程序猿", "打工人", "干饭人"];

// 3. 核心服务类 (单例)
@ccclass('WechatService')
export class WechatService {
    private static _instance: WechatService;

    public static get instance(): WechatService {
        if (!this._instance) {
            this._instance = new WechatService();
            this._instance.init();
        }
        return this._instance;
    }

    // 【新增】开关：是否使用真实微信登录 (调试阶段设为 false)
    private readonly USE_REAL_WECHAT = false;

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

    // ==========================================
    // 【新增】核心功能：登录 (Login)
    // ==========================================
    public login(): Promise<IPlayerInfo> {
        return new Promise((resolve, reject) => {
            // A. 真实环境 (微信小游戏)
            if (this.USE_REAL_WECHAT && sys.platform === sys.Platform.WECHAT_GAME && typeof wx !== 'undefined') {
                console.log("正在调用微信真实接口...");
                // TODO: 这里填入真实的 wx.login 和 wx.getUserProfile 逻辑
                // 暂时留空，后续 Phase 5 再填
            } 
            // B. 模拟环境 (开发调试)
            else {
                // 模拟登录：延迟 500ms 模拟网络请求
                setTimeout(() => {
                    const mockUser = this.generateMockUser();
                    console.log("【模拟登录成功】", mockUser);
                    resolve(mockUser);
                }, 500);
            }
        });
    }

    // 生成模拟用户数据
    private generateMockUser(): IPlayerInfo {
        // 随机生成一个 ID
        const mockOpenId = "user_" + Math.floor(Math.random() * 1000000);
        
        // 随机生成昵称 (不超过6个汉字)
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        const name = adj + noun; // 例如：元气的橘猫

        return {
            openId: mockOpenId,
            nickName: name,
            avatarUrl: "", 
            gender: 1
        };
    }

    // ==========================================
    // 原有功能：分享与震动 (保持不变)
    // ==========================================

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