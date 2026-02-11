import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween, Label } from 'cc';
import { EnemyController } from './EnemyController';
import { DataManager } from '../data/DataManager';
import { DamageEffect } from './DamageEffect';

const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {

    @property(Prefab)
    enemyPrefab: Prefab = null!; 

    @property(Node)
    enemyContainer: Node = null!;

    @property(Node)
    startBtnNode: Node = null!;

    @property(Prefab)
    damagePrefab: Prefab = null!;

    @property(Label)
    statusLabel: Label = null!;

    @property(Node)
    battleGuardian: Node = null!;

    private _currentEnemy: Node | null = null;
    private _isFighting: boolean = false;
    private _timer: number = 0;
    
    // 攻速稍微调慢一点，因为动画变长了，1.2秒一轮比较合适
    private _attackInterval: number = 1.2; 
    private readonly DAMAGE_PER_HIT = 2000; 

    // 【新增】记录神兽的初始位置 (老家)
    private _guardianStartPos: Vec3 = new Vec3();

    onLoad() {
        // 记录神兽分身一开始站在哪里
        if (this.battleGuardian) {
            this._guardianStartPos = this.battleGuardian.position.clone();
        }
    }

    onStartClicked() {
        const totalV = DataManager.instance.getTotalVitality();
        if (totalV <= 0) {
            this.showStatus("元气不足！请先获取步数！");
            return;
        }

        this._isFighting = true;
        this.startBtnNode.active = false;
        this.spawnEnemy();
        this.showStatus("战斗开始！");
    }

    onCloseClicked() {
        this.stopBattle();
        this.node.destroy();
    }

    stopBattle() {
        this._isFighting = false;
        if (this._currentEnemy && this._currentEnemy.isValid) {
            this._currentEnemy.destroy();
            this._currentEnemy = null;
        }
    }

    update(dt: number) {
        if (!this._isFighting) return;

        this._timer += dt;
        if (this._timer >= this._attackInterval) {
            this._timer = 0;
            // 执行炫酷攻击！
            this.performAdvancedAttack();
        }
    }

    spawnEnemy() {
        if (!this._isFighting) return;
        if (this._currentEnemy && this._currentEnemy.isValid) return;

        const enemy = instantiate(this.enemyPrefab);
        enemy.parent = this.enemyContainer;
        enemy.setPosition(0, 350, 0); 
        enemy.getComponent(EnemyController)?.init(100000); // 加点血，多打会儿

        this._currentEnemy = enemy;
    }

    // --- 【核心重构】炫酷连击逻辑 ---
    performAdvancedAttack() {
        if (!this._currentEnemy || !this._currentEnemy.isValid) {
            this.spawnEnemy();
            return;
        }
        if (!this.battleGuardian) return;

        // 1. 计算目标位置 (跳到 BOSS 面前下方 100 像素的位置)
        // 假设 BOSS 在 (0, 350), 我们跳到 (0, 250)
        const enemyPos = this._currentEnemy.position;
        const attackPos = new Vec3(enemyPos.x, enemyPos.y - 120, 0);

        // 2. 随机决定是 1连击 还是 2连击 (30%概率触发二连击)
        const isDoubleHit = Math.random() < 0.3;

        // 3. 开始编排动作链 (Tween Chain)
        const t = tween(this.battleGuardian);

        // --- 动作 A: 冲刺 ---
        // 0.2秒冲到 BOSS 面前，使用 backOut (略微冲过头再回来) 增加打击感
        t.to(0.2, { position: attackPos }, { easing: 'backOut' })
        
        // --- 动作 B: 第一击 ---
         .call(() => {
             this.dealDamage(); // 造成伤害 + 震动
         })
         
        // --- 动作 C: 连击判定 ---
         .call(() => {
             if (isDoubleHit) {
                 // 如果触发连击：原地后退一点 -> 再撞一次
                 tween(this.battleGuardian)
                    .by(0.1, { position: new Vec3(0, -30, 0) }) // 后摇
                    .by(0.05, { position: new Vec3(0, 30, 0) })  // 再次撞击
                    .call(() => this.dealDamage()) // 第二次伤害
                    .start();
             }
         })

         // --- 动作 D: 停顿一小会儿 ---
         // 如果是连击，这里的时间正好给连击动画播放
         .delay(0.3) 

         // --- 动作 E: 归位 ---
         // 跳回老家
         .to(0.2, { position: this._guardianStartPos }, { easing: 'cubicOut' })
         
         .start();
    }

    // --- 伤害结算封装 ---
    dealDamage() {
        if (!this._currentEnemy || !this._currentEnemy.isValid) return;

        // 扣除元气
        const damage = this.DAMAGE_PER_HIT;
        const hasEnergy = DataManager.instance.consumeVitality(damage);
        
        if (!hasEnergy) {
            this.showStatus("元气耗尽！");
            this._isFighting = false;
            return;
        }

        this.showStatus(`剩余元气: ${DataManager.instance.getTotalVitality()}`);

        // 通知怪物受伤 (怪物会自己抖动)
        const enemyScript = this._currentEnemy.getComponent(EnemyController);
        if (enemyScript) {
            enemyScript.takeDamage(damage);
            this.spawnDamageEffect(damage);
        }
    }

    spawnDamageEffect(damage: number) {
        if (this.damagePrefab && this.enemyContainer) {
            const node = instantiate(this.damagePrefab);
            node.parent = this.enemyContainer;
            // 飘字位置稍微随机一点，防止重叠
            const randX = (Math.random() * 60) - 30;
            const randY = 350 + (Math.random() * 40);
            node.setPosition(randX, randY, 0); 
            node.getComponent(DamageEffect)?.init(damage);
        }
    }

    showStatus(msg: string) {
        if (this.statusLabel) {
            this.statusLabel.string = msg;
        }
    }
}