import { _decorator, sys } from 'cc';
const { ccclass } = _decorator;

// 1. 派遣状态
interface DispatchState {
    isDispatching: boolean;
    elfId: string;
    targetProvinceId: number;
    endTime: number;
}

// 2. 玩家总存档
interface UserData {
    // === [Phase 4 新增] ===
    playerInfo: {
        playerId: string;
        nickName: string;
        isGuest: boolean;
        province: string;
        city: string;
    } | null;
    hasFinishedTutorial: boolean; 

    // === [旧核心数据] ===
    vitality: number;
    ownedElves: string[];    
    dispatchCount: number;
    lastLoginDate: string;
    totalVitality: number;
    todaySteps: number;
    dispatchState: DispatchState;
    unlockedItems: string[];
    currentElfId: string; 

    // === [Phase 5 新增: 装备系统] ===
    ownedEquips: string[]; // 拥有的装备ID列表 (可重复)
    equippedIds: [string, string, string]; // 3个装备槽 [slot1, slot2, slot3]
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

    private _data: UserData = {
        playerInfo: null,
        hasFinishedTutorial: false,
        vitality: 0,
        ownedElves: [],    
        currentElfId: "",  
        dispatchCount: 0,
        lastLoginDate: "",
        totalVitality: 0,
        todaySteps: 0,
        dispatchState: { isDispatching: false, elfId: "", targetProvinceId: 0, endTime: 0 },
        unlockedItems: [],
        
        // Phase 5 初始化
        ownedEquips: [],
        equippedIds: ["", "", ""] 
    };

    private readonly STORAGE_KEY = 'energy_battle_data_v2'; 

    public save() {
        sys.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data));
    }

    public load() {
        const raw = sys.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
            try {
                const savedData = JSON.parse(raw);
                this._data = { ...this._data, ...savedData };
                
                // 容错处理
                if (!this._data.dispatchState) this._data.dispatchState = { isDispatching: false, elfId: "", targetProvinceId: 0, endTime: 0 };
                if (!this._data.unlockedItems) this._data.unlockedItems = [];
                if (this._data.playerInfo === undefined) this._data.playerInfo = null;
                
                // Phase 5 容错
                if (!this._data.ownedEquips) this._data.ownedEquips = [];
                if (!this._data.equippedIds) this._data.equippedIds = ["", "", ""];

            } catch (e) {
                console.error("存档读取失败，使用默认值");
            }
        }
    }

    // ==========================================
    // Phase 5: 装备系统数据操作
    // ==========================================

    // 1. 获得装备
    public addEquip(equipId: string) {
        this._data.ownedEquips.push(equipId);
        this.save();
        console.log(`[DataManager] 获得装备: ${equipId}`);
    }

    // 2. 穿戴装备 (slotIndex: 0-2)
    public equipItem(slotIndex: number, equipId: string) {
        if (slotIndex < 0 || slotIndex > 2) return;
        
        // 只有拥有的装备才能穿
        if (this._data.ownedEquips.includes(equipId)) {
            this._data.equippedIds[slotIndex] = equipId;
            this.save();
        }
    }

    // 3. 卸下装备
    public unequipItem(slotIndex: number) {
        if (slotIndex < 0 || slotIndex > 2) return;
        this._data.equippedIds[slotIndex] = "";
        this.save();
    }

    public getOwnedEquips() { return this._data.ownedEquips; }
    public getEquippedIds() { return this._data.equippedIds; }


    // ==========================================
    // Phase 4: 玩家身份 (包含地域)
    // ==========================================
    public setPlayerInfo(id: string, name: string, province: string, city: string) {
        this._data.playerInfo = {
            playerId: id,
            nickName: name,
            isGuest: false,
            province: province,
            city: city
        };
        this.save();
    }

    public getPlayerInfo() { return this._data.playerInfo; }
    public isNewPlayer(): boolean { return !this._data.hasFinishedTutorial; }
    
    public finishTutorial() {
        this._data.hasFinishedTutorial = true;
        this.save();
    }

    public resetAccount() {
        sys.localStorage.removeItem(this.STORAGE_KEY);
        console.log("⚠️ 账号已重置");
    }

    // ==========================================
    // Phase 1-3 核心业务 (保持不变)
    // ==========================================
    public addElf(elfId: string) {
        if (!this._data.ownedElves.includes(elfId)) {
            this._data.ownedElves.push(elfId);
            this.save();
        }
    }
    public getOwnedElves(): string[] { return this._data.ownedElves; }
    public getTotalVitality(): number { return this._data.totalVitality; }
    public getTodaySteps(): number { return this._data.todaySteps; }
    public addVitality(amount: number) { this._data.totalVitality += amount; this.save(); }
    public setTodaySteps(steps: number) { this._data.todaySteps = steps; this.save(); }
    public consumeVitality(amount: number): boolean {
        if (this._data.totalVitality >= amount) {
            this._data.totalVitality -= amount;
            this.save();
            return true;
        }
        return false;
    }
    public unlockItem(itemId: string) {
        if (!this._data.unlockedItems.includes(itemId)) {
            this._data.unlockedItems.push(itemId);
            this.save();
        }
    }
    public isItemUnlocked(itemId: string): boolean { return this._data.unlockedItems.includes(itemId); }
    public getDispatchState(): DispatchState { return this._data.dispatchState; }
    public startDispatch(elfId: string, provinceId: number, durationSec: number) {
        this._data.dispatchState.isDispatching = true;
        this._data.dispatchState.elfId = elfId;
        this._data.dispatchState.targetProvinceId = provinceId;
        this._data.dispatchState.endTime = Date.now() + (durationSec * 1000);
        this.save();
    }
    public endDispatch() {
        this._data.dispatchState.isDispatching = false;
        this.save();
    }
    public getCurrentElfId(): string { return this._data.currentElfId; }
    public setCurrentElfId(id: string) {
        if (this._data.ownedElves.includes(id)) {
            this._data.currentElfId = id;
            this.save();
        }
    }
}