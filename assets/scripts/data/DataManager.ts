import { _decorator, sys } from 'cc';
const { ccclass } = _decorator;

// --- 定义数据结构 ---

// 1. 派遣状态 (新功能)
interface DispatchState {
    isDispatching: boolean;   // 是否正在派遣
    elfId: string;            // 派出的灵兽ID
    targetProvinceId: number; // 目标省份
    endTime: number;          // 归来时间戳
}

// 2. 玩家总存档
interface UserData {
    // === [Phase 1 & 2 旧数据 - 必须保留] ===
    vitality: number;        // (兼容旧代码)
    ownedElves: string[];    // 已拥有的灵兽ID (抽卡系统核心)
    dispatchCount: number;   // 每日派遣次数记录
    lastLoginDate: string;   // 上次登录日期
    
    // === [Phase 3 新数据] ===
    totalVitality: number;   // 玩家当前的元气总余额 (战力)
    todaySteps: number;      // 今日已同步的步数
    
    // 派遣系统
    dispatchState: DispatchState;

    // 图鉴系统 (存特产ID和风景ID)
    unlockedItems: string[];
    // 【新增】当前出战/跟随的灵兽ID
    currentElfId: string; 
}

@ccclass('DataManager')
export class DataManager {

    private static _instance: DataManager;
    public static get instance(): DataManager {
        if (!this._instance) {
            this._instance = new DataManager();
            this._instance.load();
        }
        return this._instance;
    }

    // 初始化默认数据
    private _data: UserData = {
        // 旧数据默认值
        vitality: 0,
        ownedElves: [],
        dispatchCount: 0,
        lastLoginDate: "",
        
        // 新数据默认值
        totalVitality: 0,
        todaySteps: 0,
        dispatchState: {
            isDispatching: false,
            elfId: "",
            targetProvinceId: 0,
            endTime: 0
        },
        unlockedItems: [],
        // 【新增】默认给一只初始灵兽 (假设叫 Elf_001)
        currentElfId: "Elf_SSR_jq",
        
        // 确保你的 ownedElves 里至少有一只初始的，防止报错
        ownedElves: ["Elf_SSR_jq"]
    };

    // 建议使用新的Key，或者保留旧Key (如果想继承之前的测试数据就用旧的)
    // 这里我们沿用你刚才上传文件里的 Key，保证不丢失之前的元气
    private readonly STORAGE_KEY = 'energy_battle_data_v2'; 

    public save() {
        sys.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data));
    }

    public load() {
        const raw = sys.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
            try {
                // 深度合并：防止新加的字段在旧存档里没有而报错
                const savedData = JSON.parse(raw);
                this._data = { ...this._data, ...savedData };
                
                // 特殊处理：如果旧存档里没有 dispatchState (因为是新加的)，手动补上
                if (!this._data.dispatchState) {
                    this._data.dispatchState = {
                        isDispatching: false,
                        elfId: "",
                        targetProvinceId: 0,
                        endTime: 0
                    };
                }
                if (!this._data.unlockedItems) {
                    this._data.unlockedItems = [];
                }

            } catch (e) {
                console.error("存档读取失败，使用默认值");
            }
        }
    }

    // ==========================================
    // Phase 1 & 2 核心方法 (许愿池/手账依赖这些)
    // ==========================================

    // 添加灵兽 (抽卡用)
    public addElf(elfId: string) {
        if (!this._data.ownedElves.includes(elfId)) {
            this._data.ownedElves.push(elfId);
            this.save();
        }
    }
    
    // 获取拥有的灵兽列表 (手账用)
    public getOwnedElves(): string[] {
        return this._data.ownedElves;
    }

    // ==========================================
    // Phase 3 核心方法 (元气/派遣/图鉴)
    // ==========================================

    // 1. 元气管理
    public getTotalVitality(): number {
        return this._data.totalVitality;
    }

    public getTodaySteps(): number {
        return this._data.todaySteps;
    }

    public addVitality(amount: number) {
        this._data.totalVitality += amount;
        this.save();
        console.log(`[DataManager] 元气增加: ${amount}, 当前余额: ${this._data.totalVitality}`);
    }

    public setTodaySteps(steps: number) {
        this._data.todaySteps = steps;
        this.save();
    }

    public consumeVitality(amount: number): boolean {
        if (this._data.totalVitality >= amount) {
            this._data.totalVitality -= amount;
            this.save();
            return true;
        }
        return false;
    }

    // 2. 图鉴解锁 (特产 & 风景)
    public unlockItem(itemId: string) {
        if (!this._data.unlockedItems.includes(itemId)) {
            this._data.unlockedItems.push(itemId);
            this.save();
            console.log(`[图鉴] 恭喜解锁新物品: ${itemId}`);
        }
    }

    public isItemUnlocked(itemId: string): boolean {
        return this._data.unlockedItems.includes(itemId);
    }

    // 3. 派遣状态读写
    public getDispatchState(): DispatchState {
        return this._data.dispatchState;
    }
    
    public startDispatch(elfId: string, provinceId: number, durationSec: number) {
        this._data.dispatchState.isDispatching = true;
        this._data.dispatchState.elfId = elfId;
        this._data.dispatchState.targetProvinceId = provinceId;
        // 结束时间 = 当前时间 + 持续秒数 * 1000
        this._data.dispatchState.endTime = Date.now() + (durationSec * 1000);
        this.save();
    }

    public endDispatch() {
        this._data.dispatchState.isDispatching = false;
        // 不清空 elfId 和 targetProvinceId 也可以，保留作为"上次派遣"的记录
        this.save();
    }

    // --- 【新增】获取/设置当前灵兽 ---
    
    public getCurrentElfId(): string {
        return this._data.currentElfId;
    }

    public setCurrentElfId(id: string) {
        // 安全检查：必须是已拥有的才能装备
        if (this._data.ownedElves.includes(id)) {
            this._data.currentElfId = id;
            this.save();
        }
    }
}