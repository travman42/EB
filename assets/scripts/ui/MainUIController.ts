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

    start() {
        // 每0.5秒刷新一次界面
        this.schedule(this.refreshUI, 0.5);
        this.refreshUI();

        // 1. 初始化显示当前灵兽
        this.updateElfImage();

        // 2. 监听“换人”事件 (当手账里点击装备时触发)
        director.on(EVENT_ELF_CHANGED, this.updateElfImage, this);
    }

    onDestroy() {
        // 记得移除监听，养成好习惯
        director.off(EVENT_ELF_CHANGED, this.updateElfImage, this);
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
        
        // 假设灵兽图片放在 resources/textures/elves/ 下
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
}