import { _decorator } from 'cc';

// 这是一个纯逻辑类，负责计算反作弊公式
export class StepService {
    private static _instance: StepService;
    
    public static get instance(): StepService {
        if (!this._instance) {
            this._instance = new StepService();
        }
        return this._instance;
    }

    // --- 核心算法：步数转元气 ---
    // 规则：0-3万步(100%), 3万-5万步(50%), >5万步(封顶)
    public calculateVitality(steps: number): number {
        let vitality = 0;

        if (steps <= 30000) {
            vitality = steps;
        } else if (steps <= 50000) {
            // 前3万满收益
            vitality = 30000;
            // 溢出部分减半
            const overflow = steps - 30000;
            vitality += Math.floor(overflow * 0.5);
        } else {
            // 超过5万步，按5万步封顶算
            // 30000 + (20000 * 0.5) = 40000
            vitality = 40000;
        }

        return vitality;
    }

    // --- 生成随机步数 (2000 - 60000) ---
    public getRandomSteps(): number {
        const min = 2000;
        const max = 60000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}