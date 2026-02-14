import { _decorator, Component, Node, Label, Sprite, resources, SpriteFrame, instantiate, Prefab } from 'cc';
import { IEquipData } from '../data/EquipConfig';

const { ccclass, property } = _decorator;

@ccclass('PopupDropController')
export class PopupDropController extends Component {

    @property(Node) itemsContainer: Node = null!; // 用 Layout 自动排列
    @property(Prefab) itemPrefab: Prefab = null!; // 物品图标 Prefab

    public init(drops: IEquipData[]) {
        // 清空容器
        this.itemsContainer.removeAllChildren();

        drops.forEach(equip => {
            const itemNode = instantiate(this.itemPrefab);
            itemNode.parent = this.itemsContainer;

            // 设置名字
            const nameLabel = itemNode.getComponentInChildren(Label);
            if (nameLabel) nameLabel.string = equip.name;

            // 设置图片 (Equip_MTFY_SSR.png)
            const sprite = itemNode.getChildByName("Img_Icon")?.getComponent(Sprite);
            if (sprite) {
                resources.load(`textures/equips/${equip.id}/spriteFrame`, SpriteFrame, (err, sp) => {
                    if (!err) sprite.spriteFrame = sp;
                });
            }
        });
    }

    onConfirmClicked() {
        this.node.destroy();
    }
}