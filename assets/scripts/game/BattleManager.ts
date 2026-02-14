import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween, Label } from 'cc';
import { EnemyController } from './EnemyController';
import { DataManager } from '../data/DataManager';
import { DamageEffect } from './DamageEffect';
// 引入装备服务
import { EquipService } from '../data/EquipService';
import { PopupDropController } from '../ui/PopupDropController';

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

    // 【新增】掉落弹窗预制体
    @property(Prefab)
    dropPopupPrefab: Prefab = null!;

    private _currentEnemy: Node | null = null;
    private _isFighting: boolean = false;
    private _timer: number = 0;
    
    private _attackInterval: number = 1.2; 
    private readonly DAMAGE_PER_HIT = 100000; 

    private _guardianStartPos: Vec3 = new Vec3();

    onLoad() {
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
            this.performAdvancedAttack();
        }
    }

    spawnEnemy() {
        if (!this._isFighting) return;
        if (this._currentEnemy && this._currentEnemy.isValid) return;

        const enemy = instantiate(this.enemyPrefab);
        enemy.parent = this.enemyContainer;
        enemy.setPosition(0, 350, 0); 
        
        // 绑定死亡回调
        const enemyCtrl = enemy.getComponent(EnemyController);
        if (enemyCtrl) {
            enemyCtrl.init(100000); 
            // 当 BOSS 死亡时调用 onVictory
            enemyCtrl.onDeath = () => {
                this.onVictory();
            };
        }

        this._currentEnemy = enemy;
    }

    // --- 【核心重构】炫酷连击逻辑 ---
    performAdvancedAttack() {
        if (!this._currentEnemy || !this._currentEnemy.isValid) {
            this.spawnEnemy();
            return;
        }
        if (!this.battleGuardian) return;

        const enemyPos = this._currentEnemy.position;
        const attackPos = new Vec3(enemyPos.x, enemyPos.y - 120, 0);

        const isDoubleHit = Math.random() < 0.3;

        const t = tween(this.battleGuardian);

        t.to(0.2, { position: attackPos }, { easing: 'backOut' })
         .call(() => {
             this.dealDamage(); 
         })
         .call(() => {
             if (isDoubleHit) {
                 tween(this.battleGuardian)
                    .by(0.1, { position: new Vec3(0, -30, 0) }) 
                    .by(0.05, { position: new Vec3(0, 30, 0) }) 
                    .call(() => this.dealDamage()) 
                    .start();
             }
         })
         .delay(0.3) 
         .to(0.2, { position: this._guardianStartPos }, { easing: 'cubicOut' })
         .start();
    }

    dealDamage() {
        if (!this._currentEnemy || !this._currentEnemy.isValid) return;

        const damage = this.DAMAGE_PER_HIT;
        const hasEnergy = DataManager.instance.consumeVitality(damage);
        
        if (!hasEnergy) {
            this.showStatus("元气耗尽！");
            this._isFighting = false;
            return;
        }

        this.showStatus(`剩余元气: ${DataManager.instance.getTotalVitality()}`);

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

    // ==========================================
    // Phase 5: 战斗胜利与掉落
    // ==========================================
    onVictory() {
        this._isFighting = false;
        this.showStatus("战斗胜利！BOSS 已被击败！");

        // 1. 生成掉落数据
        const drops = EquipService.instance.generateBossDrops();
        console.log("【战斗掉落】:", drops);

        // 2. 弹出掉落界面
        if (this.dropPopupPrefab) {
            // 延迟一点点，让BOSS死亡动画播完
            this.scheduleOnce(() => {
                const node = instantiate(this.dropPopupPrefab);
                // 挂载到 BattleManager 的父节点 (即 Canvas)，保证覆盖在战斗界面之上
                node.parent = this.node.parent; 
                node.getComponent(PopupDropController)?.init(drops);
            }, 0.5);
        }
    }
}