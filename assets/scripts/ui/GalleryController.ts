import { _decorator, Component, Node, Prefab, instantiate, Label, Sprite, resources, SpriteFrame } from 'cc';
import { SpecialtyData, SceneryData } from '../data/GameConfig'; // 确保 GameConfig 存在
import { DataManager } from '../data/DataManager'; // 确保 DataManager 存在

const { ccclass, property } = _decorator;

@ccclass('GalleryController')
export class GalleryController extends Component {

    @property(Node) 
    content: Node = null!;      // 绑定 ScrollView 的 content 节点

    @property(Prefab) 
    itemPrefab: Prefab = null!; // 绑定 Item_Gallery 预制体

    private _curTab: 'specialty' | 'scenery' = 'specialty';

    start() {
        this.refresh();
    }

    // 切换到特产
    onTabSpecialty() {
        this._curTab = 'specialty';
        this.refresh();
    }

    // 切换到风景
    onTabScenery() {
        this._curTab = 'scenery';
        this.refresh();
    }

    // 关闭面板
    onClose() {
        this.node.destroy();
    }

    refresh() {
        // 1. 清空旧列表
        this.content.removeAllChildren();

        // 2. 获取对应的数据列表
        const dataList: any[] = this._curTab === 'specialty' ? SpecialtyData : SceneryData;

        // 3. 生成格子
        dataList.forEach(data => {
            const node = instantiate(this.itemPrefab);
            node.parent = this.content;

            // 获取解锁状态
            const isUnlocked = DataManager.instance.isItemUnlocked(data.id);

            // A. 设置名字
            const lab = node.getChildByName("Lab_Name")?.getComponent(Label);
            if (lab) lab.string = data.name;

            // B. 设置遮罩 (未解锁显示，解锁隐藏)
            const mask = node.getChildByName("Mask_Lock");
            if (mask) mask.active = !isUnlocked;

            // C. 动态加载图片 (仅当解锁时)
            if (isUnlocked) {
                const icon = node.getChildByName("Img_Icon")?.getComponent(Sprite);
                if (icon) {
                    // 路径对应: assets/resources/icons/ID.png
                    // 注意：resources.load 不需要加 "resources/" 前缀，也不加后缀
                    resources.load(`icons/${data.id}/spriteFrame`, SpriteFrame, (err, sprite) => {
                        if (err) {
                            console.warn(`图片加载失败: icons/${data.id}`);
                            return;
                        }
                        if (node.isValid && icon) {
                            icon.spriteFrame = sprite;
                        }
                    });
                }
            }
        });
    }
}