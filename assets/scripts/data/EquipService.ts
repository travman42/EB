import { _decorator } from 'cc';
import { EquipConfig, IEquipData } from './EquipConfig';
import { DataManager } from './DataManager';

// 【修正点】补上了这行解构代码，定义 ccclass
const { ccclass } = _decorator;

@ccclass('EquipService')
export class EquipService {
    private static _instance: EquipService;
    public static get instance() {
        if (!this._instance) this._instance = new EquipService();
        return this._instance;
    }

    // ==========================================
    // 1. 掉落算法 (Drop Logic)
    // ==========================================
    
    // 模拟 BOSS 掉落 (必爆 1-3 个)
    public generateBossDrops(): IEquipData[] {
        const dropCount = Math.floor(Math.random() * 3) + 1; // 随机 1~3 个
        const result: IEquipData[] = [];
        const allEquips = EquipConfig.getAllEquips();
        
        // 计算总权重
        const totalWeight = allEquips.reduce((sum, item) => sum + item.dropWeight, 0);

        for (let i = 0; i < dropCount; i++) {
            let randomVal = Math.random() * totalWeight;
            
            for (const item of allEquips) {
                randomVal -= item.dropWeight;
                if (randomVal <= 0) {
                    result.push(item);
                    // 自动收入背包 (核心体验优化：防止玩家漏捡)
                    DataManager.instance.addEquip(item.id);
                    break;
                }
            }
        }
        
        return result;
    }

    // ==========================================
    // 2. 属性计算 (Stats Calculation)
    // ==========================================

    // 获取当前综合属性 (包含套装加成)
    public getCurrentStats() {
        const equippedIds = DataManager.instance.getEquippedIds();
        let totalVitalityBonus = 0;
        let totalLuck = 0;
        let equippedCount = 0;

        // 1. 累加单件属性
        equippedIds.forEach(id => {
            if (!id) return;
            const data = EquipConfig.getEquipById(id);
            if (data) {
                totalVitalityBonus += data.vitalityBonus;
                totalLuck += data.luck;
                equippedCount++;
            }
        });

        // 2. 套装加成 (Set Bonus)
        // 简单逻辑：穿满3件，基础属性再提升 20%
        let setBonusDesc = "未激活";
        if (equippedCount === 3) {
            const setBonusMultiplier = 1.2; // 额外 20%
            totalVitalityBonus *= setBonusMultiplier;
            totalLuck = Math.ceil(totalLuck * setBonusMultiplier);
            setBonusDesc = "三件套激活：全属性 +20%";
        }

        return {
            vitalityBonus: totalVitalityBonus, // e.g. 0.5 表示 +50%
            luck: totalLuck,
            setBonusDesc: setBonusDesc
        };
    }
}