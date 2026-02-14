import { _decorator, Component, Label, Prefab, instantiate, director, Sprite, resources, SpriteFrame } from 'cc';
import { DataManager } from '../data/DataManager';
// 1. 引入微信服务
import { WechatService } from '../data/WechatService';

// 定义一个全局事件名
export const EVENT_ELF_CHANGED = "event_elf_changed";

const { ccclass, property } = _decorator;

@ccclass('MainUIController')
export class MainUIController extends Component {

    @property(Label)
    vitalityLabel: Label = null!; // 显示总元气

    @property(Prefab)
    debugPanelPrefab: Prefab = null!; // 调试面板预制体

    @property(Prefab)
    elfMenuPrefab: Prefab = null!; // 拖入 Popup_ElfMenu

    // 1. 【新增】图鉴预制体引用
    @property(Prefab)
    galleryPrefab: Prefab = null!; 

    // 【新增】绑定主界面那个小灵兽的 Sprite
    @property(Sprite)
    travelElfSprite: Sprite = null!; 

    // 【新增】手账预制体 (用于打开手账)
    @property(Prefab)
    handbookPrefab: Prefab = null!;

    // === [Phase 4 新增：显示玩家昵称] ===
    @property(Label)
    playerNameLabel: Label = null!;


    // 【新增】系统广播框预制体
    @property(Prefab)
    systemLogPrefab: Prefab = null!;

    // 【新增】装备面板预制体
    @property(Prefab)
    equipPanelPrefab: Prefab = null!;

    start() {
        // 1. 【核心】最先加载日志框，这样后续的 Log 才能被捕获
        this.initSystemLog();
        
        // 每0.5秒刷新一次界面
        this.schedule(this.refreshUI, 0.5);
        this.refreshUI();

        // 1. 监听“换人”事件 (当手账里点击装备时触发)
        director.on(EVENT_ELF_CHANGED, this.updateElfImage, this);

        // 2. 【核心修改】检查登录状态与新手引导
        // 注意：这里把原来的 updateElfImage 调用移到了 checkLoginStatus 内部
        this.checkLoginStatus();
    }

    onDestroy() {
        // 记得移除监听，养成好习惯
        director.off(EVENT_ELF_CHANGED, this.updateElfImage, this);
    }

    // ==========================================
    // Phase 4: 登录与新手引导逻辑
    // ==========================================
    async checkLoginStatus() {
        let player = DataManager.instance.getPlayerInfo();

        if (!player) {
            console.log("🆕 未检测到玩家信息，开始模拟登录...");
            // 调用服务进行登录
            const wxInfo = await WechatService.instance.login();
            
            // 写入存档
            DataManager.instance.setPlayerInfo(wxInfo.openId, wxInfo.nickName);
            player = DataManager.instance.getPlayerInfo();
        }

        console.log(`✅ 登录成功，欢迎：${player?.nickName}`);

        // 刷新界面昵称
        if (this.playerNameLabel && player) {
            this.playerNameLabel.string = player.nickName;
        }

        // 检查新手引导：如果是新号，发放初始灵兽
        if (DataManager.instance.isNewPlayer()) {
            this.giveInitialElf();
        } else {
            // 老玩家，直接显示当前的灵兽
            this.updateElfImage();
        }
    }

    // 发放初始灵兽 (新手福利)
    giveInitialElf() {
        // 这里设定初始送的灵兽 ID，例如庆忌 "Elf_SSR_jq"
        const initElfId = "Elf_SSR_jq"; 

        console.log("🎁 触发新手引导福利，发放初始灵兽:", initElfId);
        
        // 1. 数据层操作：添加并装备
        DataManager.instance.addElf(initElfId);
        DataManager.instance.setCurrentElfId(initElfId);
        
        // 2. 标记新手引导已完成 (下次就不送了)
        DataManager.instance.finishTutorial(); 

        // 3. 表现层操作：立刻刷出立绘
        this.updateElfImage();

        // TODO: 这里以后可以加一个弹窗提示 "恭喜获得伙伴：庆忌！"
    }

    refreshUI() {
        // 从数据中心读取最新数据
        const totalV = DataManager.instance.getTotalVitality();
        
        // 更新文字
        if (this.vitalityLabel) {
            this.vitalityLabel.string = `元气: ${totalV}`;
        }
    }

    // 按钮点击：打开步数模拟器
    onOpenDebugClicked() {
        if (this.debugPanelPrefab) {
            const panel = instantiate(this.debugPanelPrefab);
            panel.parent = this.node; // 挂载到 Canvas
        }
    }

    // 2. 【新增】分享按钮点击回调
    onShareClicked() {
        // 播放震动 (提升手感)
        WechatService.instance.vibrateShort();

        // 获取当前玩家的省份或步数，放在分享文案里
        const steps = DataManager.instance.getTodaySteps();
        
        // 发起分享
        WechatService.instance.shareGame({
            title: `我今天走了${steps}步，神兽战斗力爆表！快来PK！`,
            query: "source=invite_button"
        });
    }
    
    // --- 核心：刷新灵兽立绘 ---
    updateElfImage() {
        if (!this.travelElfSprite) return;

        const currentId = DataManager.instance.getCurrentElfId();
        
        // 如果数据还没准备好(比如刚重置)，则不显示
        if (!currentId) return;

        // 假设灵兽图片放在 resources/elf_images/ 下
        // 请根据你昨天的实际路径修改！
        const path = `elf_images/${currentId}/spriteFrame`;

        resources.load(path, SpriteFrame, (err, sprite) => {
            if (!err && this.travelElfSprite.isValid) {
                this.travelElfSprite.spriteFrame = sprite;
            } else {
                console.warn("灵兽图片加载失败，请检查路径:", path);
            }
        });
    }
    
    // --- 打开手账 (供菜单调用) ---
    onOpenHandbook() {
        if (this.handbookPrefab) {
            const node = instantiate(this.handbookPrefab);
            node.parent = this.node;
        }
    }

    // 【修正】改名为 onElfClicked，逻辑不变
    onElfClicked() {
        if (this.elfMenuPrefab) {
            const node = instantiate(this.elfMenuPrefab);
            node.parent = this.node; 
        }
    }

    // 2. 【新增】底部按钮点击回调
    onOpenGalleryClicked() {
        if (this.galleryPrefab) {
            // 实例化图鉴面板
            const node = instantiate(this.galleryPrefab);
            // 挂载到当前节点 (Canvas)
            node.parent = this.node; 
        }
    }



    // 【新增】初始化日志框
    initSystemLog() {
        if (this.systemLogPrefab) {
            const node = instantiate(this.systemLogPrefab);
            node.parent = this.node; // 挂载到 Canvas
            node.setSiblingIndex(999); // 设为最上层 (Z-Index)，保证不被遮挡
        }
    }

    // 【新增】打开装备面板的方法
    public onOpenEquipPanel() {
        if (this.equipPanelPrefab) {
            const node = instantiate(this.equipPanelPrefab);
            node.parent = this.node; // 挂载到 Canvas
        } else {
            console.warn("未绑定装备面板 Prefab！");
        }
    }
}