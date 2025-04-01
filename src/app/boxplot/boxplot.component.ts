import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { ChartDataset } from '../chart-model';
import { ChartValue } from '../chart-value-model';

@Component({
  selector: 'app-boxplot',
  standalone: true,
  imports: [],
  templateUrl: './boxplot.component.html',
  styleUrl: './boxplot.component.scss'
})
export class BoxplotComponent {
  @Input()
  datasets: ChartDataset[] = [];
  color = ''
  unit = ''
  legendSpace = 30;
  private svg: any;
  private margin = { top: 20, right: 30, bottom: 40, left: 60 };
  private width = 660 - this.margin.left - this.margin.right;
  private height = 600 - this.margin.top - this.margin.bottom;
  private legendWidth = 150; // Width for the legend area
  private totalWidth = this.width + this.legendWidth; // Total SVG width including legend space



  private createSvg(): void {
    this.svg = d3.select("figure#boxplot")
      .attr('class', 'svg')
      .append("svg")
      .attr("width", this.totalWidth + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  private drawChart(datasets: ChartDataset[]): void {
    if (datasets.length === 0) return;

    // Axis tooltip
    const xTooltip = d3.select('body').append('div')
      .attr('class', 'axis-tooltip')
      .style('opacity', 0);

    const yTooltip = d3.select('body').append('div')
      .attr('class', 'axis-tooltip')
      .style('opacity', 0);

    // X axis
    const x = d3.scaleBand()
      .range([0, this.width])
      .domain(datasets.map(d => d.label))
      .padding(0.4);

    this.svg.append("g")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    this.svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", this.width / 2)
      .attr("y", this.height + this.margin.bottom)
      .style("fill", "currentColor")
      .text("X Value");



    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(datasets, d => d3.max(d.data, v => v.y))!])
      .range([this.height, 0]);

    this.svg.append("g").call(d3.axisLeft(y));

    // Y Axis label
    this.svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("x", -(this.width / 2))
      .attr("y", -30)
      .attr('transform', 'rotate(-90)')
      .style("fill", "currentColor")
      .text(datasets[0].unit);

    // Y-axis overlay
    this.svg.append('rect')
      .attr('class', 'overlay')
      .attr('x', -30) // Width of the interactive area
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

    // Add title
    this.svg.append("text")
      .attr("x", (this.width / 2))
      .attr("y", this.margin.top - 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text(datasets[0].title);


    this.svg.append('rect')
      .attr('class', 'overlay')
      .attr('transform', `translate(0,${this.height})`)
      .attr('width', this.width)
      .attr('height', 30) // Height of the interactive area
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => xTooltip.style('opacity', 1))
      .on('mouseout', () => xTooltip.style('opacity', 0))
      .on('mousemove', (event:any) => {
        const mouseX = d3.pointer(event)[0] - this.margin.left;
        if (mouseX >= 0 && mouseX <= this.width) {
          // Calculate the index of the band
          const eachBand = x.bandwidth();
          const index = Math.floor(mouseX / eachBand);

          // Get the corresponding value from the domain
          const domainValue = x.domain()[index];

          if (domainValue) {
            xTooltip.html(`X-value: ${domainValue}`)
              .style('left', `${event.pageX + 15}px`)
              .style('top', `${event.pageY - 28}px`);
          }
        }
      });

    // Draw the boxplot for each dataset
    datasets.forEach(dataset => {
      const data = dataset.data.map(d => d.y);
      data.sort(d3.ascending);

      const q1 = d3.quantile(data, 0.25)!;
      const median = d3.quantile(data, 0.5)!;
      const q3 = d3.quantile(data, 0.75)!;
      const iqr = q3 - q1;
      const min = Math.max(d3.min(data)!, q1 - 1.5 * iqr);
      const max = Math.min(d3.max(data)!, q3 + 1.5 * iqr);

      // Legend
      this.svg.append("circle")
        .attr('class', 'ball')
        .style("fill", dataset.color)
        .attr("cx", this.width + 70)
        .attr("cy", this.legendSpace)
        .attr("r", 6);

      this.svg.append("text")
        .attr("x", this.width + 80)
        .attr("y", this.legendSpace)
        .text(dataset.label)
        .style("font-size", "15px")
        .attr("alignment-baseline", "middle");

      this.legendSpace += 30;

      // Box
      this.svg.append("rect")
        .attr("x", x(dataset.label)!)
        .attr("y", y(q3))
        .attr("height", y(q1) - y(q3))
        .attr("width", x.bandwidth())
        .attr("stroke", "black")
        .style("fill", dataset.color);

      // Median line
      this.svg.append("line")
        .attr("x1", x(dataset.label)! + x.bandwidth() / 2)
        .attr("x2", x(dataset.label)! + x.bandwidth() / 2)
        .attr("y1", y(median))
        .attr("y2", y(median))
        .attr("stroke", "black");

      // Whiskers
      this.svg.append("line")
        .attr("x1", x(dataset.label)! + x.bandwidth() / 2)
        .attr("x2", x(dataset.label)! + x.bandwidth() / 2)
        .attr("y1", y(min))
        .attr("y2", y(q1))
        .attr("stroke", "black");

      this.svg.append("line")
        .attr("x1", x(dataset.label)! + x.bandwidth() / 2)
        .attr("x2", x(dataset.label)! + x.bandwidth() / 2)
        .attr("y1", y(q3))
        .attr("y2", y(max))
        .attr("stroke", "black");

      // Outliers if there, will be colored yellow
      this.svg.selectAll("circle")
        .data(data.filter(d => d < min || d > max))
        .enter()
        .append("circle")
        .attr("cx", x(dataset.label)! + x.bandwidth() / 2)
        .attr("cy", (d: d3.NumberValue) => y(d))
        .attr("r", 4)
        .style("fill", "yellow");
    });  

  }
  ngOnInit(): void {
    this.createSvg();
    this.drawChart(this.datasets);
  }
}

