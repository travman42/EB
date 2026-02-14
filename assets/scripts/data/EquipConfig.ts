import { _decorator } from 'cc';

// 1. 稀有度枚举
export enum EquipRarity {
    R = "R",
    SR = "SR",
    SSR = "SSR",
    UR = "UR",
    EPIC = "EPIC"
}

// 2. 文物代号映射 (拼音缩写 -> 中文名)
export const ARTIFACT_NAMES: { [key: string]: string } = {
    "MTFY": "马踏飞燕",
    "YWGJJ": "越王勾践剑",
    "SMWD": "司母戊鼎",
    "SYFZ": "四羊方尊",
    "CHYBZ": "曾侯乙编钟",
    "LG": "利簋",
    "DYD": "大盂鼎",
    "MGD": "毛公鼎",
    "SSP": "散氏盘",
    "GJZBP": "虢季子白盘",

    // --- 新增 15 种 ---
    "GGZXSTG": "元青花鬼谷子下山图罐",
    "DCJGB": "明成化斗彩鸡缸杯",
    "QQLFLCC": "清乾隆珐琅彩瓷",
    "JTLQSFL": "景泰蓝掐丝珐琅",
    "QMSHT": "清明上河图",
    "QLJST": "千里江山图",
    "FCSJT": "富春山居图",
    "LSFT": "洛神赋图",
    "BNT": "步辇图",
    "HXZYYT": "韩熙载夜宴图",
    "CJYYWTXZ": "错金银云纹铜犀尊",
    "LZYC": "良渚玉琮",
    "HSWHYL": "红山文化玉龙",
    "SDQTXZ": "商代青铜鸮尊",
    "HSB": "和氏璧"
};

// 3. 装备数据结构
export interface IEquipData {
    id: string;        // 唯一ID: Equip_MTFY_SSR 或 Equip_MTFY_SSR_T
    name: string;      // 显示名: [真] 马踏飞燕
    artifactId: string;// 文物代号: MTFY
    rarity: EquipRarity;
    isTrue: boolean;   // 是否为真品
    
    // 属性
    vitalityBonus: number; // 元气加成倍率 (0.1 = +10%)
    luck: number;          // 幸运值
    dropWeight: number;    // 掉落权重 (数值越大越容易掉)
}

// 4. 配置生成器
export class EquipConfig {
    private static _equips: IEquipData[] = [];

    // 稀有度对应的基础属性配置 (测试期爆率已调高)
    // [元气加成, 幸运值, 仿品掉落权重, 真品掉落权重]
    private static RARITY_STATS = {
        [EquipRarity.R]:    [0.05,  1,  10000, 500],   // R: 权重极高
        [EquipRarity.SR]:   [0.10,  3,  5000,  200],
        [EquipRarity.SSR]:  [0.20,  5,  2000,  100],
        [EquipRarity.UR]:   [0.35,  10, 10000,   10000], //50
        [EquipRarity.EPIC]: [0.50,  20, 10000,   10000]  //10   // EPIC: 权重最低
    };

    public static getAllEquips(): IEquipData[] {
        if (this._equips.length > 0) return this._equips;

        const artifactCodes = Object.keys(ARTIFACT_NAMES);
        const rarities = [EquipRarity.R, EquipRarity.SR, EquipRarity.SSR, EquipRarity.UR, EquipRarity.EPIC];

        // 双层循环生成 10文物 x 5稀有度 = 50种
        // 再 x 2 (真/假) = 100种
        artifactCodes.forEach(code => {
            rarities.forEach(rarity => {
                const stats = this.RARITY_STATS[rarity];
                
                // 1. 生成【仿品】(Standard)
                this._equips.push({
                    id: `Equip_${code}_${rarity}`,
                    name: ARTIFACT_NAMES[code], // e.g. 马踏飞燕
                    artifactId: code,
                    rarity: rarity,
                    isTrue: false,
                    vitalityBonus: stats[0],
                    luck: stats[1],
                    dropWeight: stats[2] // 仿品权重
                });

                // 2. 生成【真品】(True - 属性翻倍)
                this._equips.push({
                    id: `Equip_${code}_${rarity}_T`,
                    name: `真·${ARTIFACT_NAMES[code]}`, // e.g. 真·马踏飞燕
                    artifactId: code,
                    rarity: rarity,
                    isTrue: true,
                    vitalityBonus: stats[0] * 2, // 真品元气加成翻倍
                    luck: stats[1] * 2,          // 真品幸运值翻倍
                    dropWeight: stats[3]         // 真品权重极低
                });
            });
        });

        return this._equips;
    }

    public static getEquipById(id: string): IEquipData | null {
        return this.getAllEquips().find(e => e.id === id) || null;
    }
}