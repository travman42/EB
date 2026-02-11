import { _decorator, Component, Label } from 'cc';
import { DataManager } from '../data/DataManager';
import { StepService } from '../data/StepService';

const { ccclass, property } = _decorator;

@ccclass('DebugStepController')
export class DebugStepController extends Component {

    @property(Label)
    resultLabel: Label = null!; // 用于显示结果文本

    // 按钮点击事件：一键获取并注入
    onGetAndConvertClicked() {
        // 1. 获取随机步数
        const steps = StepService.instance.getRandomSteps();

        // 2. 计算元气 (反作弊)
        const vitality = StepService.instance.calculateVitality(steps);

        // 3. 注入神兽 (增加总余额)
        DataManager.instance.addVitality(vitality);

        // 4. 更新UI显示的步数
        DataManager.instance.setTodaySteps(steps);

        // 5. 显示结果反馈
        if (this.resultLabel) {
            this.resultLabel.string = `步数: ${steps}\n元气: +${vitality}\n(已注入神兽)`;
        }
        
        console.log(`[调试] 随机步数:${steps}, 增加元气:${vitality}`);
    }

    // 关闭面板
    onCloseClicked() {
        this.node.destroy();
    }
}