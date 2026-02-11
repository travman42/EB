import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ViewManager')
export class ViewManager extends Component {

    // 1. 定义一个槽位，用来放“许愿池”的模具
    @property({ type: Prefab, tooltip: "拖入 Panel_Gacha 预制体" })
    gachaPanelPrefab: Prefab = null!;
    // A. 新增一个属性
    @property({ type: Prefab, tooltip: "拖入 Panel_Handbook 预制体" })
    handbookPanelPrefab: Prefab = null!;
    // A. 新增属性
    @property({ type: Prefab, tooltip: "拖入 Panel_Battle" })
    battlePanelPrefab: Prefab = null!;

    // 2. 许愿按钮的点击回调函数
    onOpenGachaClicked() {
        console.log("正在打开许愿池...");

        // 检查是否已经拖入了预制体，防止报错
        if (this.gachaPanelPrefab) {
            // A. 实例化：拿着模具印出一个新节点
            const panel = instantiate(this.gachaPanelPrefab);
            
            // B. 挂载：把它挂在当前节点（Canvas）下面，这样才能显示出来
            panel.parent = this.node;
            
            // C. (可选) 确保它覆盖在最上层
            // panel.setSiblingIndex(999); 
        } else {
            console.error("错误：请在编辑器里把 Panel_Gacha 拖给 ViewManager！");
        }
    }
    // B. 新增打开手账的方法
    onOpenHandbookClicked() {
        console.log("正在打开手账...");
        if (this.handbookPanelPrefab) {
            const panel = instantiate(this.handbookPanelPrefab);
            panel.parent = this.node;
        }
    }

    // B. 新增打开方法
    onOpenBattleClicked() {
        if (this.battlePanelPrefab) {
            const panel = instantiate(this.battlePanelPrefab);
            panel.parent = this.node;
        }
    }
    
}