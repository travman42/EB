import { _decorator, Component, Node, Prefab, instantiate, Label, Sprite, resources, SpriteFrame, Color, director } from 'cc';
import { DataManager } from '../data/DataManager';
import { ELF_CONFIG_LIST } from '../data/ElfConfig';

const { ccclass, property } = _decorator;

// 定义事件名称，必须和 MainUIController 里监听的一致
const EVENT_ELF_CHANGED = "event_elf_changed";

@ccclass('HandbookController')
export class HandbookController extends Component {

    // 1. 绑定 ScrollView 的 content 节点
    @property(Node)
    contentNode: Node = null!;

    // 2. 绑定小卡片模具 (Item_Elf)
    @property(Prefab)
    itemPrefab: Prefab = null!;

    start() {
        this.refreshList();
    }

    onCloseClicked() {
        this.node.destroy();
    }

    refreshList() {
        // A. 获取玩家拥有的灵兽ID列表
        const ownedIds = DataManager.instance.getOwnedElves();
        console.log("当前拥有灵兽:", ownedIds);

        // B. 清空当前列表 (防止重复生成)
        this.contentNode.removeAllChildren(); // 3.8.x 推荐清理方式

        // C. 遍历所有配置表里的灵兽
        ELF_CONFIG_LIST.forEach(elfConfig => {
            // 1. 判断是否拥有
            const isOwned = ownedIds.includes(elfConfig.id);

            // 2. 生成一个小格子
            const item = instantiate(this.itemPrefab);
            
            // 3. 找到格子里的组件
            const nameLabel = item.getComponentInChildren(Label);
            // 注意：这里查找子节点名字必须和你的 Item_Elf 里的名字一致 (Img_Icon)
            const iconSprite = item.getChildByName("Img_Icon")?.getComponent(Sprite); 

            // 4. 设置名字
            if (nameLabel) {
                nameLabel.string = elfConfig.name;
            }

            // 5. 设置图片 & 点击事件
            if (iconSprite) {
                // 【原有逻辑】设置颜色：未拥有变灰
                iconSprite.color = isOwned ? new Color(255, 255, 255) : new Color(100, 100, 100);
                
                // 【原有逻辑】加载图片 (保持你原来的路径 elf_images)
                resources.load(`elf_images/${elfConfig.id}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                    if (!err && iconSprite.isValid) {
                        iconSprite.spriteFrame = spriteFrame;
                    }
                });
            }

            // 6. 【新增核心逻辑】点击装备
            if (isOwned) {
                // 只有拥有的灵兽才能点击
                item.on(Node.EventType.TOUCH_END, () => {
                    this.onEquipElf(elfConfig.id);
                });
            } else {
                // 未拥有的可以弹个提示，或者什么都不做
                // item.on(Node.EventType.TOUCH_END, () => console.log("请先去许愿池获取！"));
            }

            // 7. 放入 content 容器
            item.parent = this.contentNode;
        });
    }

    // --- 【新增】装备灵兽逻辑 ---
    onEquipElf(elfId: string) {
        // 1. 修改 DataManager 里的当前灵兽
        DataManager.instance.setCurrentElfId(elfId);

        // 2. 发送广播：通知主界面 (MainUIController) 刷新立绘
        director.emit(EVENT_ELF_CHANGED);

        console.log(`[Handbook] 已更换跟随灵兽为: ${elfId}`);

        // 3. 关闭手账 (体验更流畅)
        this.onCloseClicked();
    }
}