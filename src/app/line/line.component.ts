import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { ChartDataset } from '../chart-model';
import { ChartValue } from '../chart-value-model';


@Component({
  selector: 'app-line',
  standalone: true,
  imports: [],
  templateUrl: './line.component.html',
  styleUrl: './line.component.scss'
})
export class LineComponent {
  @Input()
  datasets: ChartDataset[] = [];
  legendSpace = 30;
  private svg: any;
  private margin = { top: 20, right: 30, bottom: 40, left: 60 };
  private height = 600 - this.margin.top - this.margin.bottom;
  private width = 660 - this.margin.left - this.margin.right;
  private legendWidth = 150; // Width for the legend area
  private totalWidth = this.width + this.legendWidth; // Total SVG width including legend space


  private createSvg(): void {
    d3.select("#line").selectAll("*").remove();
    this.svg = d3.select("#line")
      .attr('class', 'svg')
      .append("svg")
      .attr("width", this.totalWidth + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  private drawChart(datasets: ChartDataset[]): void {
    if (datasets.length === 0) return;

    // Determine if x values are Date or Number by checking the first dataset's first entry
    const isDate = datasets[0].data.every(d => !isNaN(Date.parse(d.x)));

    // X Axis
    let x: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>;

    if (isDate) {
      x = d3.scaleTime()
        .domain(d3.extent(datasets[0].data, d => new Date(d.x)) as [Date, Date])
        .range([0, this.width]);

      this.svg.append('g')
        .attr('transform', `translate(0,${this.height})`)
        .call(d3.axisBottom(x));

      // X Axis label for Date
      this.svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", this.width / 2)
        .attr("y", this.height + this.margin.bottom)
        .style("fill", "currentColor")
        .text("Date");
    } else {
      x = d3.scaleLinear()
        .domain(d3.extent(datasets[0].data, d => +d.x) as [number, number])
        .range([0, this.width]);

      this.svg.append('g')
        .attr('transform', `translate(0,${this.height})`)
        .call(d3.axisBottom(x));

      // X Axis label for Number
      this.svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", this.width / 2)
        .attr("y", this.height + this.margin.bottom)
        .style("fill", "currentColor")
        .text("X Value");
    }

    // Find min and max Y value across all datasets
    const minY = d3.min(datasets, dataset => d3.min(dataset.data, d => d.y)) as number;
    const maxY = d3.max(datasets, dataset => d3.max(dataset.data, d => d.y)) as number;

    // Y Axis
    const y = d3.scaleLinear()
      .domain([minY, maxY])
      .range([this.height, 0]);

    this.svg.append('g')
      .call(d3.axisLeft(y));

    // Y Axis label
    this.svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("x", -(this.width / 2))
      .attr("y", -30)
      .attr('transform', 'rotate(-90)')
      .style("fill", "currentColor")
      .text(datasets[0].unit);

    // Axis tooltip
    const xTooltip = d3.select('body').append('div')
      .attr('class', 'axis-tooltip')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    const yTooltip = d3.select('body').append('div')
      .attr('class', 'axis-tooltip')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    // X-axis tooltip with dynamic handling
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
        const mouseX = d3.pointer(event)[0];
        const x0 = x.invert(mouseX);

        const dataset = datasets[0].data;

        if (isDate) {
          const bisectDate = d3.bisector((d: any) => new Date(d.x)).left;
          const i = bisectDate(dataset, x0 as Date, 1);

          let d0 = dataset[i - 1];
          let d1 = dataset[i];

          // Find the closest data point
          if (!d1 || (d0 && Math.abs(x(new Date(d0.x)) - mouseX) < Math.abs(x(new Date(d1.x)) - mouseX))) {
            d1 = d0;
          }

          const displayValue = new Date(d1.x).toLocaleDateString();

          xTooltip.html(`X-value: ${displayValue}`)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`);

        } else {
          const bisectNumber = d3.bisector((d: any) => +d.x).left;
          const i = bisectNumber(dataset, x0 as number, 1);

          let d0 = dataset[i - 1];
          let d1 = dataset[i];

          // Find the closest data point
          if (!d1 || (d0 && Math.abs(x(d0.x) - mouseX) < Math.abs(x(d1.x) - mouseX))) {
            d1 = d0;
          }

          const displayValue = (d1.x as number).toFixed(2);

          xTooltip.html(`X-value: ${displayValue}`)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`);
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
      .on('mouseover', () => yTooltip.style('opacity', 1))
      .on('mouseout', () => yTooltip.style('opacity', 0))
      .on('mousemove', (event: any) => {
        const mouseY = d3.pointer(event)[1] - this.margin.top;

        if (mouseY >= 0 && mouseY <= this.height) {
          const value = y.invert(mouseY).toFixed(2);
          yTooltip.html(`Y-value: ${value}`)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`);
        }
      });

    // Add title
    this.svg.append("text")
      .attr("x", (this.width / 2))
      .attr("y", this.margin.top - 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text(datasets[0].title);

    // Draw each dataset
    datasets.forEach(dataset => {
      this.svg.append('path')
        .datum(dataset.data)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', dataset.color)
        .attr('stroke-width', 1.5)
        .attr('d', d3.line<ChartValue>()
          .x(d => isDate ? x(new Date(d.x)) : x(+d.x))
          .y(d => y(d.y))
        );

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
    });

    // Add tooltip
    this.addTooltip(x, y, datasets, isDate);
  }

  private addTooltip(x: any, y: any, datasets: ChartDataset[], isDate: boolean): void {
    // Tooltip Div
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('color', 'white')
      .style('padding', '8px');

    // Create the circle that travels along the curve of chart
    const focus = this.svg.append('g')
      .append('circle')
      .style("fill", "none")
      .attr("stroke", "black")
      .attr('r', 8.5)
      .style("opacity", 0)

    // Rect to capture mouse movements
    this.svg.append('rect')
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr('width', this.width)
      .attr('height', this.height)
      .on('mouseover', () => tooltip.style("opacity", 1), focus.style("opacity", 1))
      .on('mouseout', () => tooltip.style("opacity", 0), focus.style("opacity", 0))
      .on('mousemove', (event: any) => {
        const [mouseX, mouseY] = d3.pointer(event);
        const x0 = x.invert(mouseX);
        let closestData: ChartValue | undefined;
        let closestDatasetLabel: string | undefined;
        let minDistance = Infinity;

        datasets.forEach(dataset => {
          dataset.data.forEach(point => {
            const pointX = isDate ? new Date(point.x as string) : point.x as number;
            const px = x(pointX);
            const py = y(point.y);
            focus
              .attr("cx", x(px))
              .attr("cy", y(py));
            const distance = Math.sqrt(Math.pow(px - mouseX, 2) + Math.pow(py - mouseY, 2));

            if (distance < minDistance) {
              closestData = point;
              closestDatasetLabel = dataset.label; // Capture the label of the dataset
              minDistance = distance;
            }
          });
        });

        if (closestData && closestDatasetLabel) {
          tooltip
            .html(`Label: ${closestDatasetLabel}<br>x: ${closestData.x}<br>y: ${closestData.y}`)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`)
            .style('opacity', 1);
        }
      });
  }


  ngAfterViewInit(): void {
    this.createSvg()
    this.drawChart(this.datasets)
  }
}
