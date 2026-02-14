import { _decorator, Component, Node, ProgressBar, Sprite, Color, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EnemyController')
export class EnemyController extends Component {

    @property(ProgressBar)
    hpBar: ProgressBar = null!;

    private _maxHp: number = 100;
    private _currentHp: number = 100;
    private _isDead: boolean = false;

    private _originalPos: Vec3 = new Vec3();

    // 【新增】死亡回调函数，由 BattleManager 赋值
    public onDeath: (() => void) | null = null;

    start() {
        this._originalPos = this.node.position.clone();
    }

    public init(hp: number) {
        this._maxHp = hp;
        this._currentHp = hp;
        this._isDead = false;
        this.updateUI();
        this.node.scale = new Vec3(1, 1, 1); // 重置缩放
    }

    public takeDamage(damage: number) {
        if (this._isDead) return;

        this._currentHp -= damage;
        
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
        if (this._isDead) return; // 防止重复死亡
        this._isDead = true;

        // 播放死亡动画 (缩放消失)
        tween(this.node)
            .to(0.3, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                // 触发死亡回调
                if (this.onDeath) {
                    this.onDeath();
                }
                this.node.destroy();
            })
            .start();
    }

    private playHitColor() {
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            const originalColor = new Color(255, 255, 255); 
            sprite.color = new Color(255, 200, 200); 
            this.scheduleOnce(() => {
                sprite.color = originalColor;
            }, 0.1);
        }
    }

    private playShakeEffect() {
        tween(this.node).stop();
        this.node.setPosition(this._originalPos);

        tween(this.node)
            .by(0.05, { position: new Vec3(-10, 0, 0) }) 
            .by(0.05, { position: new Vec3(20, 0, 0) })  
            .by(0.05, { position: new Vec3(-10, 0, 0) }) 
            .start();
    }
}