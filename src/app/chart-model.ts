import { ChartValue } from "./chart-value-model";

export class ChartDataset {
    map(arg0: (d: any) => any): Iterable<string> {
      throw new Error('Method not implemented.');
    }
    static defaultColors: string[] = ['Red', 'Green', 'Blue', 'Purple', 'Orange'];
    static currentColorIndex: number = 0;

    data: ChartValue[];
    label: string;
    unit: string;
    color: string;
    title: string;
    height: number;
    width: number;

    constructor(data: ChartValue[], label: string, unit: string, height:number,width:number, color?: string, title?:string) {
        this.data = data;
        this.label = label;
        this.unit = unit;
        this.height= height;
        this.width= width;
        this.color = color || ChartDataset.defaultColors[ChartDataset.currentColorIndex];
        ChartDataset.currentColorIndex = (ChartDataset.currentColorIndex + 1) % ChartDataset.defaultColors.length;
        this.title = title || label;
    }
}