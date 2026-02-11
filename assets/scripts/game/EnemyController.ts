import { _decorator, Component, Node, ProgressBar, Sprite, Color, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EnemyController')
export class EnemyController extends Component {

    @property(ProgressBar)
    hpBar: ProgressBar = null!;

    private _maxHp: number = 100;
    private _currentHp: number = 100;
    private _isDead: boolean = false;

    // 记录初始位置，防止抖动后位置偏移
    private _originalPos: Vec3 = new Vec3();

    start() {
        // 记住出生时的位置
        this._originalPos = this.node.position.clone();
    }

    public init(hp: number) {
        this._maxHp = hp;
        this._currentHp = hp;
        this._isDead = false;
        this.updateUI();
    }

    public takeDamage(damage: number) {
        if (this._isDead) return;

        this._currentHp -= damage;
        // console.log(`BOSS 受到伤害: ${damage}`);

        // 1. 播放受击特效 (变白 + 抖动)
        this.playHitColor();
        this.playShakeEffect();

        this.updateUI();

        if (this._currentHp <= 0) {
            this.die();
        }
    }

    private updateUI() {
        if (this.hpBar) {
            this.hpBar.progress = this._currentHp / this._maxHp;
        }
    }

    private die() {
        this._isDead = true;
        tween(this.node)
            .to(0.2, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }

    // --- 变色闪白 ---
    private playHitColor() {
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            const originalColor = new Color(255, 255, 255); // 假设原色是白
            sprite.color = new Color(255, 200, 200); // 变红一点
            this.scheduleOnce(() => {
                sprite.color = originalColor;
            }, 0.1);
        }
    }

    // --- 【新增】受击抖动 ---
    private playShakeEffect() {
        // 先停止当前可能正在播放的缓动，防止鬼畜
        tween(this.node).stop();

        // 归位
        this.node.setPosition(this._originalPos);

        // 左右快速晃动：左 -> 右 -> 原位
        tween(this.node)
            .by(0.05, { position: new Vec3(-10, 0, 0) }) // 左移
            .by(0.05, { position: new Vec3(20, 0, 0) })  // 右移
            .by(0.05, { position: new Vec3(-10, 0, 0) }) // 回正
            .start();
    }
}