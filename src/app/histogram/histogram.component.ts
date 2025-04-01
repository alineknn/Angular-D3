import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { ChartDataset } from '../chart-model';
import { ChartValue } from '../chart-value-model';

@Component({
  selector: 'app-histogram',
  standalone: true,
  imports: [],
  templateUrl: './histogram.component.html',
  styleUrl: './histogram.component.scss'
})
export class HistogramComponent {
  @Input()
  datasets: ChartDataset[] = [];
  legendSpace = 30;
  private svg: any;
  private margin = { top: 20, right: 30, bottom: 40, left: 60 };
  private width = 660 - this.margin.left - this.margin.right;
  private height = 600 - this.margin.top - this.margin.bottom;
  private legendWidth = 150; // Width for the legend area
  private totalWidth = this.width + this.legendWidth; // Total SVG width including legend space

  private createSvg(): void {
    d3.select("#histogram").selectAll("*").remove(); // Clear previous elements
    this.svg = d3.select("#histogram")
      .append("svg")
      .attr("width", this.totalWidth + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  private drawChart(datasets: ChartDataset[]): void {
    //Pick first dataset
    const dataset = datasets[0];
    const data = dataset.data.map(d => d.y);

    // Create a histogram generator
    const histogram = d3.bin()
        .value(d => d)
        .domain([0, d3.max(data) || 0]) // Set the domain to the range of your data
        .thresholds(20); // Number of bins

    const bins = histogram(data);

    // X axis
    const x = d3.scaleBand()
        .range([0, this.width])
        .padding(0.1)
        .domain(bins.map(d => `${d.x0}-${d.x1}`)); // Bin ranges as domain

    this.svg.append("g")
        .attr("transform", `translate(0,${this.height})`)
        .call(d3.axisBottom(x));

    // X Axis label
    this.svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", this.width / 2)
        .attr("y", this.height + this.margin.bottom)
        .style("fill", "currentColor")
        .text("Bins");

    // Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length) || 50]) // Dynamically set Y domain based on data
        .range([this.height, 0]);

    this.svg.append("g")
        .call(d3.axisLeft(y));

    // Y Axis label
    this.svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("x", -(this.height / 2))
        .attr("y", -this.margin.left + 15)
        .attr('transform', 'rotate(-90)')
        .style("fill", "currentColor")
        .text(dataset.unit);

    // Add title
    this.svg.append("text")
        .attr("x", (this.width / 2))
        .attr("y", -this.margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(dataset.label);

    // Tooltip for bars
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background-color", "black")
        .style("border", "solid 1px #d3d3d3")
        .style("padding", "5px")
        .style("color", "white")
        .style("display", "none");

    // Draw bars
    this.svg.selectAll(".bar")
        .data(bins)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d: any) => x(`${d.x0}-${d.x1}`) || 0)
        .attr("y", (d: any) => y(d.length))
        .attr("width", x.bandwidth())
        .attr("height", (d: any) => this.height - y(d.length))
        .attr("fill", dataset.color)
        .on("mouseover", function (event: any, d: any) {
            tooltip.style("display", "block")
                .html(`Frequency: ${d.length}`);
        })
        .on("mousemove", function (event: any) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        });

    // X-axis tooltip
    this.svg.append('rect')
        .attr('class', 'overlay')
        .attr('transform', `translate(0,${this.height})`)
        .attr('width', this.width)
        .attr('height', 30) // Height of the interactive area
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', () => tooltip.style('opacity', 1))
        .on('mouseout', () => tooltip.style('opacity', 0))
        .on('mousemove', (event: any) => {
            const mouseX = d3.pointer(event)[0];
            const index = Math.floor(mouseX / (this.width / bins.length));
            const bin = bins[index];
            if (bin) {
                tooltip.html(`Bin: ${bin.x0}-${bin.x1}`)
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY - 28}px`)
                    .style('display', 'block');
            }
        });

    // Y-axis tooltip
    this.svg.append('rect')
        .attr('class', 'overlay')
        .attr('x', -30) // Width of the interactive area
        .attr('width', 30)
        .attr('height', this.height)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', () => tooltip.style('opacity', 1))
        .on('mouseout', () => tooltip.style('opacity', 0))
        .on('mousemove', (event: any) => {
            const mouseY = d3.pointer(event)[1];
            const value = y.invert(mouseY).toFixed(2);
            tooltip.html(`Frequency: ${value}`)
                .style('left', `${event.pageX + 15}px`)
                .style('top', `${event.pageY - 28}px`)
                .style('display', 'block');
        });

    // Legend
    this.svg.append("circle")
        .attr('class', 'ball')
        .style("fill", dataset.color)
        .attr("cx", this.width + 70)  // Position legend outside chart area
        .attr("cy", this.legendSpace)
        .attr("r", 6);

    this.svg.append("text")
        .attr("x", this.width + 80)  // Position text next to the circle
        .attr("y", this.legendSpace)
        .text(dataset.label)
        .style("font-size", "15px")
        .attr("alignment-baseline", "middle");

    this.legendSpace += 30;
}





  ngOnInit(): void {
    this.createSvg();
    this.drawChart(this.datasets);
  }
}
