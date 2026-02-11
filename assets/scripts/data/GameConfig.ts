import { _decorator } from 'cc';

// ==========================================
// 表1：省份基础表 (Provinces)
// ==========================================
export interface IProvince {
    id: number;      // 101, 102...
    name: string;    // 北京, 四川
    desc: string;    // 描述
}

export const ProvinceData: IProvince[] = [
    { id: 101, name: "北京", desc: "古都风韵，胡同与高楼共存。" },
    { id: 102, name: "四川", desc: "天府之国，美食与熊猫的故乡。" },
    // 你可以在这里无限添加省份...
];

// ==========================================
// 表2：特产配置表 (Specialties) - 核心产出
// ==========================================
export interface ISpecialty {
    id: string;        // 唯一ID (建议: sp_省份ID_序号)
    provinceId: number;// 归属哪个省 (外键)
    name: string;      // 特产名
    vitality: number;  // 转化元气值
    rarity: number;    // 权重 (1-100)，越高越容易掉落
}

export const SpecialtyData: ISpecialty[] = [
    // --- 北京特产 (101) ---
    { id: "sp_101_01", provinceId: 101, name: "全聚德烤鸭", vitality: 2000, rarity: 10 },
    { id: "sp_101_02", provinceId: 101, name: "冰糖葫芦", vitality: 500, rarity: 50 },
    { id: "sp_101_03", provinceId: 101, name: "景泰蓝", vitality: 3000, rarity: 5 }, // 稀有

    // --- 四川特产 (102) ---
    { id: "sp_102_01", provinceId: 102, name: "麻辣火锅底料", vitality: 1800, rarity: 10 },
    { id: "sp_102_02", provinceId: 102, name: "蜀绣", vitality: 3500, rarity: 2 }, // 超稀有
];

// ==========================================
// 表3：风景立绘表 (Sceneries) - 稀有掉落
// ==========================================
export interface IScenery {
    id: string;        // 唯一ID (建议: view_省份ID_序号)
    provinceId: number;// 归属哪个省
    name: string;      // 风景名
    dropRate: number;  // 掉率 (0.0 - 1.0)
}

export const SceneryData: IScenery[] = [
    // --- 北京风景 ---
    { id: "view_101_01", provinceId: 101, name: "万里长城", dropRate: 0.2 },
    { id: "view_101_02", provinceId: 101, name: "故宫雪景", dropRate: 0.1 },

    // --- 四川风景 ---
    { id: "view_102_01", provinceId: 102, name: "九寨沟", dropRate: 0.3 },
];

// ==========================================
// 数据查询工具 (类似于数据库查询)
// ==========================================
export class ConfigUtils {
    
    // 随机获取一个省份 (灵兽瞎跑用)
    public static getRandomProvince(): IProvince {
        const idx = Math.floor(Math.random() * ProvinceData.length);
        return ProvinceData[idx];
    }
    
    public static getProvinceById(id: number): IProvince | null {
        return ProvinceData.find(p => p.id === id) || null;
    }

    // 【核心】根据省份ID，获取该省所有特产
    public static getSpecialtiesByProvince(pid: number): ISpecialty[] {
        return SpecialtyData.filter(s => s.provinceId === pid);
    }

    // 【核心】从某省随机抽一个特产 (基于权重算法)
    public static getRandomSpecialty(pid: number): ISpecialty | null {
        const list = this.getSpecialtiesByProvince(pid);
        if (list.length === 0) return null;

        // 1. 算总权重
        let totalWeight = 0;
        list.forEach(s => totalWeight += s.rarity);

        // 2. 随机
        let rand = Math.random() * totalWeight;

        // 3. 命中
        for (const item of list) {
            rand -= item.rarity;
            if (rand <= 0) return item;
        }
        return list[0];
    }

    // 获取某省风景
    public static getSceneriesByProvince(pid: number): IScenery[] {
        return SceneryData.filter(s => s.provinceId === pid);
    }
}