import { _decorator, Component, Node, Label, Sprite, resources, SpriteFrame } from 'cc';
// 引入数据结构 (确保路径正确)
import { SettleResult } from '../data/DispatchService';

const { ccclass, property } = _decorator;

@ccclass('DispatchSettleController')
export class DispatchSettleController extends Component {

    @property(Node) specialtyNode: Node = null!; // 特产容器
    @property(Node) sceneryNode: Node = null!;   // 风景容器
    @property(Label) vitalityLabel: Label = null!; // 元气文本

    // --- 核心方法：初始化界面 ---
    // data 参数就是 DispatchService.settle() 返回的结果
    public init(data: SettleResult) {
        // 1. 显示获得的元气
        this.vitalityLabel.string = `元气 +${data.vitality}`;

        // 2. 查找特产数据 (type === 'specialty')
        const specialtyData = data.rewards.find(r => r.type === 'specialty');
        
        // 3. 查找风景数据 (type === 'scenery')
        const sceneryData = data.rewards.find(r => r.type === 'scenery');

        // --- 刷新特产 (必定显示) ---
        if (specialtyData) {
            this.updateItem(this.specialtyNode, specialtyData.name, specialtyData.id);
        }

        // --- 刷新风景 (有则显示，无则隐藏) ---
        if (sceneryData) {
            this.sceneryNode.active = true;
            this.updateItem(this.sceneryNode, sceneryData.name, sceneryData.id);
        } else {
            this.sceneryNode.active = false;
        }
    }

    // 辅助方法：设置图标和名字
    private updateItem(container: Node, name: string, iconId: string) {
        // 设置名字
        const labName = container.getChildByName("Lab_Name")?.getComponent(Label);
        if (labName) labName.string = name;

        // 加载图片
        const imgIcon = container.getChildByName("Img_Icon")?.getComponent(Sprite);
        if (imgIcon) {
            // 动态加载 resources/icons/xxx.png
            resources.load(`icons/${iconId}/spriteFrame`, SpriteFrame, (err, sprite) => {
                if (err) {
                    console.warn(`图片加载失败: icons/${iconId}`);
                    return;
                }
                // 检查节点是否还存在 (防止异步加载完界面已关闭)
                if (imgIcon.node && imgIcon.node.isValid) {
                    imgIcon.spriteFrame = sprite;
                }
            });
        }
    }

    // 按钮点击：关闭弹窗
    onConfirmClick() {
        this.node.destroy();
    }
}