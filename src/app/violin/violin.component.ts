import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { ChartDataset } from '../chart-model';
import { ChartValue } from '../chart-value-model';

@Component({
  selector: 'app-violin',
  standalone: true,
  imports: [],
  templateUrl: './violin.component.html',
  styleUrl: './violin.component.scss'
})
export class ViolinComponent {
  @Input()
  datasets: ChartDataset[] = [];
  color = ''
  unit = ''
  legendSpace = 30;
  chosenData = 2;
  private svg: any;
  private margin = { top: 20, right: 30, bottom: 40, left: 60 };
  private width = 660 - this.margin.left - this.margin.right;
  private height = 600 - this.margin.top - this.margin.bottom;
  private legendWidth = 150; // Width for the legend area
  private totalWidth = this.width + this.legendWidth; // Total SVG width including legend space


  private createSvg(): void {
    d3.select("#violin").selectAll("*").remove();
    this.svg = d3.select("figure#violin")
      .attr('class', 'svg')
      .append("svg")
      .attr("width", this.totalWidth + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  private drawChart(datasets: ChartDataset[]): void {
    if (datasets.length === 0) return;

    // Dynamically determine Y domain based on all dataset values
    const yMin = d3.min(datasets, dataset => d3.min(dataset.data, d => d.y)) as number;
    const yMax = d3.max(datasets, dataset => d3.max(dataset.data, d => d.y)) as number;

    // Y Scale
    const y = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([this.height, 0]);

    this.svg.append("g")
      .call(d3.axisLeft(y));

    // Dynamically determine X domain based on dataset labels
    const x = d3.scaleBand()
      .range([0, this.width])
      .domain(datasets.map(dataset => dataset.label))
      .padding(0.05);

    this.svg.append("g")
      .attr("transform", `translate(0, ${this.height})`)
      .call(d3.axisBottom(x));

    // Features of the histogram
    const histogram = d3.bin()
      .domain(y.domain() as [number, number])
      .thresholds(y.ticks(20));  // Number of bins for the violin plot

    // Compute the binning for each group of the dataset
    const sumstat = datasets.map(dataset => {
      const input = dataset.data.map(g => g.y);
      const bins = histogram(input);
      return { key: dataset.label, value: bins, color: dataset.color };
    });

    // Find the maximum number of values in a bin
    const maxNum = d3.max(sumstat, s => d3.max(s.value, b => b.length)) as number;

    // X scale for the violin width
    const xNum = d3.scaleLinear()
      .range([0, x.bandwidth()])
      .domain([-maxNum, maxNum]);

    // Tooltip setup
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "black")
      .style("color", "white")
      .style("border", "solid 1px #d3d3d3")
      .style("padding", "5px")
      .style("visibility", "hidden");
    // Axis tooltip
    const xTooltip = d3.select('body').append('div')
      .attr('class', 'axis-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'black')
      .style('color', 'white')
      .style('border', 'solid 1px #d3d3d3')
      .style('padding', '5px');

    const yTooltip = d3.select('body').append('div')
      .attr('class', 'axis-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'black')
      .style('color', 'white')
      .style('border', 'solid 1px #d3d3d3')
      .style('padding', '5px');

    // Add X-axis overlay for tooltip
    this.svg.append('rect')
      .attr('class', 'overlay')
      .attr('transform', `translate(0,${this.height})`)
      .attr('width', this.width)
      .attr('height', 30)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => xTooltip.style('opacity', 1))
      .on('mouseout', () => xTooltip.style('opacity', 0))
      .on('mousemove', (event: any) => {
        const mouseX = d3.pointer(event)[0] - this.margin.left;

        if (mouseX >= 0 && mouseX <= this.width) {
          const eachBand = x.bandwidth();
          const index = Math.floor(mouseX / eachBand);
          const domainValue = x.domain()[index];

          if (domainValue) {
            xTooltip.html(`X-value: ${domainValue}`)
              .style('left', `${event.pageX + 15}px`)
              .style('top', `${event.pageY - 28}px`);
          }
        }
      });

    // Add Y-axis overlay for tooltip
    this.svg.append('rect')
      .attr('class', 'overlay')
      .attr('x', -30)
      .attr('width', 30)
      .attr('height', this.height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => yTooltip.style('opacity', 1))
      .on('mouseout', () => yTooltip.style('opacity', 0))
      .on('mousemove', (event: any) => {
        const y0 = y.invert(d3.pointer(event)[1]);
        yTooltip.html(`Y-value: ${y0.toFixed(2)}`)
          .style('left', `${event.pageX + 15}px`)
          .style('top', `${event.pageY - 28}px`);
      });


    // Draw the violin plot with color support
    this.svg.selectAll("myViolin")
      .data(sumstat)
      .enter()
      .append("g")
      .attr("transform", (d: { key: string; }) => `translate(${x(d.key)}, 0)`)
      .append("path")
      .attr("stroke", "none")
      .attr("fill", (d: { color: any; key: any; }) => d.color)
      .attr("d", (d: { value: d3.Bin<number, number>[] | Iterable<d3.Bin<number, number>>; }) => d3.area<d3.Bin<number, number>>()
        .x0(d => xNum(-d.length))
        .x1(d => xNum(d.length))
        .y(d => y(d.x0!))
        .curve(d3.curveCatmullRom)(d.value))
      .on("mouseover", function (event: any, d: any) {
        tooltip.style("visibility", "visible")
          .html(() => {
            const minVal = d3.min(d.value, (b: d3.Bin<number, number>) => b.x0!);
            const maxVal = d3.max(d.value, (b: d3.Bin<number, number>) => b.x1!);
            const sumVal = d3.sum(d.value, (b: d3.Bin<number, number>) => b.length);
            return `Bin Range: ${minVal} - ${maxVal}<br>Frequency: ${sumVal}`;
          });
      })
      .on("mousemove", function (event: any) {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    // Add a legend for the colors
    datasets.forEach((dataset, i) => {
      this.svg.append("circle")
        .attr('class', 'ball')
        .style("fill", dataset.color)
        .attr("cx", this.width + 70)
        .attr("cy", this.legendSpace + i * 30)
        .attr("r", 6);

      this.svg.append("text")
        .attr("x", this.width + 80)
        .attr("y", this.legendSpace + i * 30)
        .text(dataset.label)
        .style("font-size", "15px")
        .attr("alignment-baseline", "middle");
    });
  }
  ngOnInit(): void {
    this.createSvg()
    this.drawChart(this.datasets)
  }

}
