import { DataManager } from './DataManager';
import { ConfigUtils } from './GameConfig'; // 确保这个文件存在！

// 1. 定义结算结果接口
export interface SettleResult {
    vitality: number;
    rewards: {
        id: string;
        type: 'specialty' | 'scenery';
        name: string;
    }[];
}

export class DispatchService {
    
    private static _instance: DispatchService;
    public static get instance() {
        if (!this._instance) {
            this._instance = new DispatchService();
        }
        return this._instance;
    }

    // 派遣时长 (秒) - 测试用 10秒
    private readonly DISPATCH_DURATION = 10; 

    // ==========================================
    // 1. 开始派遣
    // ==========================================
    public startDispatch(elfId: string): { success: boolean, msg: string } {
        const state = DataManager.instance.getDispatchState();
        
        if (state.isDispatching) {
            return { success: false, msg: "灵兽正在云游中..." };
        }

        // 随机选个省
        const target = ConfigUtils.getRandomProvince();
        
        // 写入存档
        DataManager.instance.startDispatch(elfId, target.id, this.DISPATCH_DURATION);

        return { 
            success: true, 
            msg: `出发去【${target.name}】了！` 
        };
    }

    // ==========================================
    // 2. 结算 (核心)
    // ==========================================
    public settle(): SettleResult | null {
        const state = DataManager.instance.getDispatchState();

        // 基础检查
        if (!state.isDispatching) return null;

        // 时间检查 (调试时可注释下一行)
        if (Date.now() < state.endTime) return null;

        const pid = state.targetProvinceId;
        const rewards: { id: string, type: 'specialty' | 'scenery', name: string }[] = [];
        let totalVitality = 0;

        // --- A. 拿特产 ---
        const specialty = ConfigUtils.getRandomSpecialty(pid);
        if (specialty) {
            totalVitality += specialty.vitality;
            rewards.push({
                id: specialty.id,
                type: 'specialty',
                name: specialty.name
            });
            // 解锁
            DataManager.instance.unlockItem(specialty.id);
        }

        // --- B. 拿风景 ---
        const sceneries = ConfigUtils.getSceneriesByProvince(pid);
        if (sceneries && sceneries.length > 0) {
            sceneries.forEach(view => {
                // 30% 概率掉落
                if (Math.random() < view.dropRate) {
                    rewards.push({
                        id: view.id,
                        type: 'scenery',
                        name: view.name
                    });
                    DataManager.instance.unlockItem(view.id);
                }
            });
        }

        // 结算入账
        DataManager.instance.addVitality(totalVitality);
        DataManager.instance.endDispatch();

        console.log(`[Dispatch] 结算完成: 元气+${totalVitality}`);

        return {
            vitality: totalVitality,
            rewards: rewards
        };
    }

    // ==========================================
    // 3. 调试加速
    // ==========================================
    public debugSpeedUp() {
        const state = DataManager.instance.getDispatchState();
        if (state.isDispatching) {
            state.endTime = 0; 
            DataManager.instance.save();
        }
    }
}