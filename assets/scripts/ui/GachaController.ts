
import { _decorator, Component, Node, Label, Sprite, Color, resources, SpriteFrame } from 'cc';
// 引入我们之前写好的配置数据
import { ELF_CONFIG_LIST, ElfRarity, ElfData } from '../data/ElfConfig';
import { DataManager } from '../data/DataManager';


const { ccclass, property } = _decorator;

@ccclass('GachaController')
export class GachaController extends Component {

    // --- 绑定 UI 组件 ---
    @property(Label)
    nameLabel: Label = null!;   // 显示名字

    @property(Label)
    rarityLabel: Label = null!; // 显示稀有度

    @property(Sprite)
    cardSprite: Sprite = null!; // 显示卡牌图片

    // --- 生命周期 ---
    start() {
        // 刚打开时，清空显示，或者显示“请许愿”
        this.resetUI();
    }

    resetUI() {
        this.nameLabel.string = "点击下方许愿";
        this.rarityLabel.string = "";
        this.cardSprite.color = Color.GRAY; // 变灰表示未抽取
    }

    // --- 功能 1：关闭弹窗 ---
    onCloseClicked() {
        // 销毁当前节点 (也就是整个弹窗)
        this.node.destroy();
    }

    // --- 功能 2：核心抽卡逻辑 ---
    onDrawClicked() {
        console.log("开始抽卡...");

        // 1. 简单的概率算法 (0-100)
        const rand = Math.random() * 100;
        let targetRarity: ElfRarity;

        // 设定概率：UR 10%, SSR 30%, SR 60%
        if (rand < 10) {
            targetRarity = ElfRarity.UR;
        } else if (rand < 40) { // 10 + 30
            targetRarity = ElfRarity.SSR;
        } else {
            targetRarity = ElfRarity.SR;
        }

        // 2. 从配置表中，筛选出符合该稀有度的灵兽
        const pool = ELF_CONFIG_LIST.filter(elf => elf.rarity === targetRarity);

        // 3. 随机取一只
        if (pool.length > 0) {
            const index = Math.floor(Math.random() * pool.length);
            const resultElf = pool[index];
            
            // 4. 展示结果
            this.showResult(resultElf);
        } else {
            console.error("配置表中没有这个稀有度的灵兽！");
        }
    }

    // --- 展示结果 ---
    showResult(elf: ElfData) {
        console.log(`抽到了：[${elf.rarity}] ${elf.name}`);

        // 【新增】保存到数据中心！
        DataManager.instance.addElf(elf.id);

        // 更新文字
        this.nameLabel.string = elf.name;
        this.rarityLabel.string = elf.rarity;

        // 根据稀有度改变文字颜色 (可选)
        if (elf.rarity === ElfRarity.UR) this.rarityLabel.color = Color.RED;
        else if (elf.rarity === ElfRarity.SSR) this.rarityLabel.color = Color.YELLOW;
        else this.rarityLabel.color = Color.WHITE;

        // 恢复卡牌颜色
        this.cardSprite.color = Color.WHITE;

        // 动态加载图片 (重要：图片必须在 resources/elf_images/ 下)
        // 路径示例: "elf_images/Elf_UR_yt"
        const path = `elf_images/${elf.id}/spriteFrame`; 
        
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn("图片加载失败，请检查路径: " + path);
                return;
            }
            this.cardSprite.spriteFrame = spriteFrame;
        });
    }
}