import { _decorator, Component, Label, tween, Vec3, Color, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DamageEffect')
export class DamageEffect extends Component {

    @property(Label)
    label: Label = null!;

    @property(UIOpacity)
    uiOpacity: UIOpacity = null!; // 用来控制透明度

    // 初始化方法
    public init(damage: number) {
        this.label.string = `-${damage}`;
        
        // 播放动画：向上飘 + 变透明
        // 1. 先确保完全不透明
        this.uiOpacity.opacity = 255;

        // 2. 动画链
        tween(this.node)
            .by(0.8, { position: new Vec3(0, 100, 0) }) // 0.8秒内向上飘100像素
            .start();

        tween(this.uiOpacity)
            .to(0.5, { opacity: 255 }) // 前0.5秒保持可见
            .to(0.3, { opacity: 0 })   // 后0.3秒淡出
            .call(() => {
                this.node.destroy();   // 动画结束销毁自己
            })
            .start();
    }
}