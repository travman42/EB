// assets/scripts/data/ElfConfig.ts

import { _decorator } from 'cc';

// 1. 定义稀有度枚举 (严格按照你的设计：SR -> SSR -> UR)
export enum ElfRarity {
    SR = "SR",   // 普通 (对应之前的 R/SR)
    SSR = "SSR", // 稀有
    UR = "UR"    // 传说 (最高级)
}

// 2. 定义一只小灵兽的数据结构 (身份证模板)
export interface ElfData {
    id: string;      // 唯一ID，对应图片文件名 (如 "Elf_UR_yt")
    name: string;    // 显示名字 (如 "月兔")
    rarity: ElfRarity; // 稀有度
    desc: string;    // 描述文本
}

// 3. 【核心卡池配置】
// 这里是静态数据库。后续你想加新灵兽，就在这里接着写。
export const ELF_CONFIG_LIST: ElfData[] = [
    // ===========================
    // UR 等级 (传说 - 概率最低)
    // ===========================
    { 
        id: "Elf_UR_yt", 
        name: "月兔", 
        rarity: ElfRarity.UR, 
        desc: "来自月宫的捣药小能手，自带特产：桂花糕。" 
    },
    { 
        id: "Elf_UR_bz", 
        name: "白泽", 
        rarity: ElfRarity.UR, 
        desc: "通晓万物之言、能辟除人间邪祟的祥瑞之兽。" 
    },
    { 
        id: "Elf_UR_yz", 
        name: "英招", 
        rarity: ElfRarity.UR, 
        desc: "身负虎纹马身、为天帝看守昆仑神圃与悬圃的巡行神使。" 
    },

    // ===========================
    // SSR 等级 (稀有 - 概率中等)
    // ===========================
    { 
        id: "Elf_SSR_bf", 
        name: "毕方", 
        rarity: ElfRarity.SSR, 
        desc: "身披青焰、所到之处预示火灾的单足赤文之禽。" 
    },
    { 
        id: "Elf_SSR_jw", 
        name: "精卫", 
        rarity: ElfRarity.SSR, 
        desc: "衔石填海、至死不渝的复仇与抗争之魂所化青鸟。" 
    },
    { 
        id: "Elf_SSR_jq", 
        name: "庆忌", 
        rarity: ElfRarity.SSR, 
        desc: "栖身泽渊、能日行千里传递音讯的黄衣小车之精。" 
    },

    // ===========================
    // SR 等级 (普通 - 概率最高)
    // ===========================
    { 
        id: "Elf_SR_sh", 
        name: "超级神猴", 
        rarity: ElfRarity.SR, 
        desc: "古灵精怪。" 
    },
    { 
        id: "Elf_SR_ss", 
        name: "超级神鼠", 
        rarity: ElfRarity.SR, 
        desc: "古灵精怪。" 
    },
    { 
        id: "Elf_SR_sy", 
        name: "超级神羊", 
        rarity: ElfRarity.SR, 
        desc: "古灵精怪。" 
    },
];