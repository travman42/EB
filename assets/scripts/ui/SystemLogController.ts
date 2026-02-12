import { _decorator, Component, Node, Label, Prefab, instantiate, Color, ScrollView, Layout, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SystemLogController')
export class SystemLogController extends Component {

    @property(Node) content: Node = null!; // ScrollView 的 Content
    @property(Prefab) logItemPrefab: Prefab = null!; // 单条日志模版
    @property(ScrollView) scrollView: ScrollView = null!; // 用于自动滚动

    // 保存原始的 console 方法，防止死循环
    private _originalLog: any = null;
    private _originalWarn: any = null;
    private _originalError: any = null;

    private readonly MAX_LOGS = 50; // 最多显示50条，防止卡顿

    onLoad() {
        this.hookConsole();
        this.addLog("系统", "通信频道已建立...", new Color(0, 255, 0)); // 绿色初始消息
    }

    onDestroy() {
        this.restoreConsole();
    }

    // --- 核心：劫持控制台 ---
    private hookConsole() {
        if (this._originalLog) return; // 已经劫持过了

        // 1. 保存原始方法
        this._originalLog = console.log;
        this._originalWarn = console.warn;
        this._originalError = console.error;

        // 2. 覆盖 console.log
        console.log = (...args) => {
            this._originalLog.apply(console, args); // 先执行原始打印
            this.addLog("系统", this.formatArgs(args), new Color(255, 255, 255)); // 白色
        };

        // 3. 覆盖 console.warn
        console.warn = (...args) => {
            this._originalWarn.apply(console, args);
            this.addLog("警告", this.formatArgs(args), new Color(255, 255, 0)); // 黄色
        };

        // 4. 覆盖 console.error
        console.error = (...args) => {
            this._originalError.apply(console, args);
            this.addLog("错误", this.formatArgs(args), new Color(255, 0, 0)); // 红色
        };
    }

    // --- 还原控制台 (组件销毁时) ---
    private restoreConsole() {
        if (this._originalLog) {
            console.log = this._originalLog;
            console.warn = this._originalWarn;
            console.error = this._originalError;
            this._originalLog = null;
        }
    }

    // --- 添加日志到 UI ---
    private addLog(tag: string, msg: string, color: Color) {
        if (!this.content || !this.logItemPrefab) return;

        // 1. 实例化
        const node = instantiate(this.logItemPrefab);
        node.parent = this.content;
        
        // 2. 设置颜色和文字
        const label = node.getComponent(Label);
        if (label) {
            label.color = color;
            // 格式：[系统] 登录成功...
            label.string = `[${tag}] ${msg}`;
        }

        // 3. 限制数量 (移除最早的)
        if (this.content.children.length > this.MAX_LOGS) {
            this.content.children[0].destroy();
        }

        // 4. 自动滚动到底部 (稍微延迟一下等待Layout排版)
        this.scheduleOnce(() => {
            if (this.scrollView && this.scrollView.isValid) {
                this.scrollView.scrollToBottom(0.1);
            }
        }, 0.1);
    }

    // 辅助：把参数数组转成字符串
    private formatArgs(args: any[]): string {
        return args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return '[Object]';
                }
            }
            return String(arg);
        }).join(" ");
    }
}