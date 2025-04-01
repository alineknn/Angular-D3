import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { ChartDataset } from '../chart-model';
import { ChartValue } from '../chart-value-model';

@Component({
  selector: 'app-bar',
  standalone: true,
  imports: [],
  templateUrl: './bar.component.html',
  styleUrl: './bar.component.scss'
})
export class BarComponent {
  @Input()
  datasets: ChartDataset[] = [];
  legendSpace = 30;
  chosenData = 2;
  private svg: any;
  private margin = { top: 20, right: 30, bottom: 40, left: 60 };
  private width = 660 - this.margin.left - this.margin.right;
  private height = 600 - this.margin.top - this.margin.bottom;
  private legendWidth = 150; // Width for the legend area
  private totalWidth = this.width + this.legendWidth; // Total SVG width including legend space


  private createSvg(): void {
    d3.select("#bar").selectAll("*").remove();
    this.svg = d3.select("#bar")
      .attr('class', 'svg')
      .append("svg")
      .attr("width", this.totalWidth + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }
  private drawChart(datasets: ChartDataset[]): void {

    const dataset = datasets[0];

    // X axis
    const x = d3.scaleBand()
      .range([0, this.width])
      .padding(0.1)
      .domain(dataset.data.map(d => d.x));

    this.svg.append("g")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("opacity", 0);


    //X Axis label
    this.svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", this.width / 2)
      .attr("y", this.height + this.margin.bottom)
      .style("fill", "currentColor")
      .text("Date");

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(dataset.data, d => d.y) || 50]) // Dynamically set Y domain based on data
      .range([this.height, 0]);

    this.svg.append("g")
      .call(d3.axisLeft(y));


    //Y Axis label
    this.svg.append("text")
      //has a class, like an ID
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("x", -(this.width / 2))
      .attr("y", -30)
      .attr('transform', 'rotate(-90)')
      .style("fill", "currentColor")
      .text(datasets[0].unit);


    // Add title
    this.svg.append("text")
      .attr("x", (this.width / 2))
      .attr("y", this.margin.top)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text(dataset.label);

    //Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("background-color", "black")
      .style("border", "solid 1px #d3d3d3")
      .style("padding", "5px")
      .style("display", "none");

    // Axis tooltip
    const xTooltip = d3.select('body').append('div')
      .attr('class', 'axis-tooltip')
      .style('opacity', 0);

    const yTooltip = d3.select('body').append('div')
      .attr('class', 'axis-tooltip')
      .style('opacity', 0);

    // Bars and drawing tooltip
    this.svg.selectAll(".bar")
      .data(dataset.data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d: { x: string; }) => x(d.x) || 0)
      .attr("y", (d: { y: d3.NumberValue; }) => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", (d: { y: d3.NumberValue; }) => this.height - y(d.y))
      .attr("fill", dataset.color)
      .on("mouseover", function (event: any, d: any) {
        tooltip.style("display", "block")
          .html(`Value: ${d.y}`);
      })
      .on("mousemove", function (event: any) {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
      });


    //Legend
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

    // Assuming x is a d3.scaleBand() and datasets[0].data holds the data points
    this.svg.append('rect')
      .attr('class', 'overlay')
      .attr('transform', `translate(0,${this.height})`)
      .attr('width', this.width)
      .attr('height', 30) // Height of the interactive area
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => xTooltip.style('opacity', 1))
      .on('mouseout', () => xTooltip.style('opacity', 0))
      .on('mousemove', (event: any) => {
        // Adjust mouse position to account for margins
        const mouseX = d3.pointer(event)[0] - this.margin.left;

        // Ensure mouseX is within the bounds of the chart
        if (mouseX >= 0 && mouseX <= this.width) {
          console.log("X AXs")
          const eachBand = x.bandwidth();
          const index = Math.floor(mouseX / eachBand);

          // Ensure the index is within the bounds of the data array
          if (index >= 0 && index < dataset.data.length) {
            const dataPoint = dataset.data[index];

            if (dataPoint) {
              xTooltip.html(`X-value: ${dataPoint.x}`)
                .style('left', `${event.pageX + 15}px`)
                .style('top', `${event.pageY - 28}px`);
            }
          }
        }
      });

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

    this.svg.append('rect')
      .attr('class', 'overlay')
      .attr('transform', `translate(0,${this.height})`)
      .attr('width', this.width)
      .attr('height', 30) // Height of the interactive area
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => xTooltip.style('opacity', 1))
      .on('mouseout', () => xTooltip.style('opacity', 0))
      .on('mousemove', (event: any) => {
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



  }


  ngOnInit(): void {
    this.createSvg()
    this.drawChart(this.datasets)
  }
}
