import { _decorator, Component, Node, Label, Prefab, instantiate } from 'cc';
import { DataManager } from '../data/DataManager';
import { DispatchService } from '../data/DispatchService';
// 引入弹窗控制器，以便调用 init 方法
import { DispatchSettleController } from './DispatchSettleController';

const { ccclass, property } = _decorator;

@ccclass('ElfMenuController')
export class ElfMenuController extends Component {

    @property(Label) 
    statusLabel: Label = null!; // 绑定 Lab_Status

    @property(Label) 
    actionBtnLabel: Label = null!; // 绑定 Btn_MainAction 下的 Label

    @property(Prefab) 
    galleryPrefab: Prefab = null!; // 绑定 Panel_Gallery 预制体，用于打开图鉴

    // 【新增】结算弹窗预制体
    @property(Prefab) 
    settlePrefab: Prefab = null!;

    start() {
        this.refreshUI();
        // 开启一个计时器，每秒刷新一次状态（主要为了看倒计时）
        this.schedule(this.refreshUI, 1.0);
    }

    refreshUI() {
        const state = DataManager.instance.getDispatchState();

        if (!state.isDispatching) {
            // 状态：空闲
            this.statusLabel.string = "灵兽正在休息，精力充沛！";
            this.actionBtnLabel.string = "派遣云游";
        } else {
            // 状态：云游中
            const now = Date.now();
            if (now >= state.endTime) {
                // 时间到了，待结算
                this.statusLabel.string = "灵兽云游归来，带回了礼物！";
                this.actionBtnLabel.string = "领取特产";
            } else {
                // 还在跑
                const remainSec = Math.ceil((state.endTime - now) / 1000);
                this.statusLabel.string = `正在云游中... 剩余 ${remainSec} 秒`;
                this.actionBtnLabel.string = "云游中..."; 
            }
        }
    }

    // --- 按钮事件：主操作 (派遣/结算) ---
    onMainActionClick() {
        const state = DataManager.instance.getDispatchState();

        if (!state.isDispatching) {
            // 派遣逻辑 (保持不变)
            const result = DispatchService.instance.startDispatch("Elf_001");
            if (result.success) {
                this.refreshUI();
            }
        } else {
            // 结算逻辑
            const now = Date.now();
            if (now >= state.endTime) {
                
                // 1. 调用 Service 结算
                const result = DispatchService.instance.settle();

                if (result) {
                    // 2. 弹出结算窗口
                    if (this.settlePrefab) {
                        const node = instantiate(this.settlePrefab);
                        // 挂载到 Canvas (确保在最上层)
                        const canvas = this.node.scene.getChildByName('Canvas');
                        if (canvas) {
                            node.parent = canvas;
                        }
                        
                        // 3. 传递数据
                        const ctrl = node.getComponent(DispatchSettleController);
                        if (ctrl) {
                            ctrl.init(result);
                        }
                    }

                    // 4. 关闭当前的灵兽小菜单 (体验更好)
                    this.node.destroy();
                }
            } else {
                console.log("还没回来呢！");
            }
        }
    }

    // --- 按钮事件：打开图鉴 ---
    onGalleryClick() {
        if (this.galleryPrefab) {
            const node = instantiate(this.galleryPrefab);
            // 挂载到 Canvas (父节点的父节点，或者直接找 Canvas)
            // 这里假设 Menu 的父级就是 Canvas 或者 MainUI
            // 为了保险，我们直接找 Canvas
            const canvas = this.node.scene.getChildByName('Canvas');
            if (canvas) {
                node.parent = canvas;
            }
            // 关闭自己，或者保持开启都可以，这里选择保持开启
        }
    }

    // --- 按钮事件：加速 (作弊) ---
    onSpeedUpClick() {
        DispatchService.instance.debugSpeedUp();
        this.refreshUI(); // 立即刷新，按钮应该变成“领取特产”
    }

    // --- 按钮事件：关闭 ---
    onCloseClick() {
        this.node.destroy();
    }
    
    // 【新增】更换灵兽按钮点击
    onReplaceClick() {
        // 方法A: 简单粗暴，直接通知主界面打开手账
        // 我们利用 director 发个事件，或者直接找 MainUIController
        const canvas = this.node.scene.getChildByName('Canvas');
        const mainUI = canvas?.getComponent('MainUIController') as any; // 用 any 偷个懒，或者 import 类型
        
        if (mainUI && mainUI.onOpenHandbook) {
            mainUI.onOpenHandbook();
        }
        
        // 关闭当前小菜单
        this.node.destroy();
    }
}