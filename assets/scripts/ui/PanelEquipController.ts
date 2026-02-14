import { _decorator, Component, Node, Label, Sprite, resources, SpriteFrame, instantiate, Prefab, Color } from 'cc';
import { DataManager } from '../data/DataManager';
import { EquipConfig } from '../data/EquipConfig';
import { EquipService } from '../data/EquipService';

const { ccclass, property } = _decorator;

@ccclass('PanelEquipController')
export class PanelEquipController extends Component {

    // 1. 顶部 3 个装备槽位 (绑定 Slot_1, Slot_2, Slot_3)
    @property([Node]) 
    equipSlots: Node[] = []; 

    // 2. 属性显示文本
    @property(Label) 
    statsLabel: Label = null!;

    // 3. 背包滚动容器
    @property(Node) 
    inventoryContent: Node = null!;

    // 4. 物品图标预制体 (复用之前的 Item_Equip)
    @property(Prefab) 
    itemPrefab: Prefab = null!;

    start() {
        this.refreshUI();
    }

    onCloseClicked() {
        this.node.destroy();
    }

    refreshUI() {
        this.refreshSlots();
        this.refreshInventory();
        this.refreshStats();
    }

    // --- A. 刷新顶部装备槽 ---
    refreshSlots() {
        const equippedIds = DataManager.instance.getEquippedIds(); // 获取 [id, id, id]
        
        for (let i = 0; i < 3; i++) {
            // 容错：防止编辑器没拖够3个槽
            if (!this.equipSlots[i]) continue;

            const slotNode = this.equipSlots[i];
            const iconNode = slotNode.getChildByName("Img_Icon");
            const equipId = equippedIds[i];

            // 1. 绑定点击事件 (点击已装备的 -> 卸下)
            slotNode.off(Node.EventType.TOUCH_END); // 先移除旧监听
            slotNode.on(Node.EventType.TOUCH_END, () => {
                if (equipId) {
                    // 卸下逻辑
                    DataManager.instance.unequipItem(i);
                    // 播放一个简单的点击反馈 (可选)
                    console.log(`[PanelEquip] 卸下第 ${i} 格装备`);
                    this.refreshUI();
                }
            });

            // 2. 显示/隐藏图标
            if (iconNode) {
                if (equipId) {
                    iconNode.active = true;
                    const sprite = iconNode.getComponent(Sprite);
                    // 加载装备图片
                    if (sprite) {
                        const path = `textures/equips/${equipId}/spriteFrame`;
                        resources.load(path, SpriteFrame, (err, sp) => {
                            if (!err && sprite.isValid) sprite.spriteFrame = sp;
                        });
                    }
                } else {
                    iconNode.active = false; // 空槽不显示图标
                }
            }
        }
    }

    // --- B. 刷新下方背包 ---
    refreshInventory() {
        this.inventoryContent.removeAllChildren();
        
        // 获取所有拥有的装备ID
        const ownedIds = DataManager.instance.getOwnedEquips();
        // 获取当前已穿戴的ID (用于排除或标记，这里简单起见我们允许重复显示，或者你可以过滤掉已穿戴的)
        // 这里的逻辑是：背包显示所有拥有的，点击穿戴
        
        ownedIds.forEach(id => {
            const data = EquipConfig.getEquipById(id);
            if (!data) return;

            const item = instantiate(this.itemPrefab);
            item.parent = this.inventoryContent;

            // 设置名字
            const nameLabel = item.getComponentInChildren(Label);
            if (nameLabel) nameLabel.string = data.name;

            // 设置图标
            const sprite = item.getChildByName("Img_Icon")?.getComponent(Sprite);
            if (sprite) {
                resources.load(`textures/equips/${id}/spriteFrame`, SpriteFrame, (err, sp) => {
                    if (!err && sprite.isValid) sprite.spriteFrame = sp;
                });
            }

            // 点击事件：穿戴
            item.on(Node.EventType.TOUCH_END, () => {
                this.equipToEmptySlot(id);
            });
        });
    }

    // --- C. 刷新属性面板 ---
    refreshStats() {
        const stats = EquipService.instance.getCurrentStats();
        // 格式化显示
        const bonusStr = (stats.vitalityBonus * 100).toFixed(0) + "%";
        this.statsLabel.string = 
            `=== 当前加成 ===\n` +
            `⚡ 元气获取: +${bonusStr}\n` +
            `🍀 幸运值: ${stats.luck}\n` +
            `✨ 套装: ${stats.setBonusDesc}`;
    }

    // --- 逻辑：自动穿戴 ---
    equipToEmptySlot(equipId: string) {
        const equippedIds = DataManager.instance.getEquippedIds();
        let targetSlot = -1;

        // 1. 优先找空位
        for (let i = 0; i < 3; i++) {
            if (!equippedIds[i]) {
                targetSlot = i;
                break;
            }
        }

        // 2. 如果满了，默认替换第1格 (Slot 0)
        if (targetSlot === -1) targetSlot = 0;

        // 3. 执行穿戴
        DataManager.instance.equipItem(targetSlot, equipId);
        console.log(`[PanelEquip] 装备 ${equipId} 到插槽 ${targetSlot}`);
        
        // 4. 刷新界面
        this.refreshUI();
        
    }

        // --- 按钮事件：关闭 ---
    onCloseClick() {
        this.node.destroy();
    }
}