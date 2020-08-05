/**
 * Wrapper for plotting in d3
 */

import * as d3 from 'd3';
import * as CONST_STYLE from '../CONST_STYLE.js';
import * as CONST_PLOT from './CONST_PLOT.js';

export class Chart_d3 {
  /**
   * Initializes the chart, given an existing div
   * @param { string } chart_id 
   * @param { {left, right, top, bottom} } margin 
   */
  constructor (
    chart_id,
    margin
  ) {
    // set the dimensions and margins of the graph
    this.margin = margin;
    let width = 460 - margin.left - margin.right;
    let height = 400 - margin.top - margin.bottom;

    this.svg = d3.select(`#${chart_id}`)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr(
        'transform',
        `translate(${margin.left}, ${margin.top})`
      );

    // Initialize axes
    this.x = d3.scaleTime().range([0, width]);
    this.x_axis = d3.axisBottom().scale(this.x);
    this.svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr('class', CONST_PLOT.X_AXIS_CLASS);

    this.y = d3.scaleLinear().range([height, 0]);
    this.y_axis = d3.axisLeft().scale(this.y);
    this.svg.append('g')
      .attr('class', CONST_PLOT.Y_AXIS_CLASS);

    this.margin = margin;
    this.width = width;
    this.height = height;
    this.chart_id = chart_id;

    // Keep track of all of our lines
    // name (string) -> line object
    this.line = new Map();
  }

  /**
   * TODO: there is a bug here where the this.x/this.y is not line dependent, it is shared by everyone.
   * I think each line Map entry should contain its own x and y domain
   * @param { float[] } data 
   * @param { string } data_x 
   * @param { string } data_y 
   * @param { string } color Color of the line, any CSS color accepted
   * @param { float } stroke_width CSS stroke-width
   * @param { int } transition_duration How long the chart takes to transition
   */
  plot_line (
    data_name,
    data,
    data_x,
    data_y,
    cursor = false,
    color = CONST_STYLE.GREEN_BYND,
    stroke_width = CONST_PLOT.LINE_THICKNESS_THIN,
    transition_duration = CONST_PLOT.TRANSITION_DURATION
  ) {
    // Create the X axis:
    this.x.domain(d3.extent(data, (d) => d[data_x]));
    this.svg.selectAll(`.${CONST_PLOT.X_AXIS_CLASS}`)
      .transition()
      .duration(transition_duration)
      .call(this.x_axis);

    this.svg.selectAll(`.${CONST_PLOT.X_AXIS_CLASS}`)
      .selectAll('text')
      .attr('y', 0)
      .attr('x', 9)
      .attr('dy', '.35em')
      .attr('transform', 'rotate(90)')
      .style('text-anchor', 'start');

    // create the Y axis
    this.y.domain(d3.extent(data, d => d[data_y]));
    this.svg.selectAll(`.${CONST_PLOT.Y_AXIS_CLASS}`)
      .transition()
      .duration(transition_duration)
      .call(this.y_axis);

    // If not initialized
    if (!(this.line.has(data_name))) {
      let curr_line = this.svg
        .append('g')
        .append('path')
        .datum(data)
        .attr('d', d3.line()
          .x((d) => this.x(d[data_x]))
          .y((d) => this.y(d[data_y]))
        )
        .attr('stroke', color)
        .style('stroke-width', stroke_width)
        .style('fill', 'none');

      this.line.set(data_name, curr_line);
    } 
    // New data to update line
    else {
      this.line.get(data_name)
        .datum(data)
        .transition()
        .duration(1000)
        .attr('d', d3.line()
          .x((d) => this.x(d[data_x]))
          .y((d) => this.y(d[data_y]))
        )
        .attr('stroke', color);
    }

    // Add cursor 
    if (cursor) {
      // Create the circle that travels along the curve of chart
      let focus = this.svg
        .append('g')
        .append('circle')
        .style('fill', color)
        .attr('r', stroke_width + 3)
        .style('opacity', 1);

      // Create the text that travels along the curve of chart
      let focusText = this.svg
        .append('g')
        .append('text')
        .style('opacity', 0)
        .attr('text-anchor', 'left')
        .attr('alignment-baseline', 'middle');

      // Create a rect on top of the svg area: this rectangle recovers mouse position
      this.svg
        .append('rect')
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .attr('width', this.width)
        .attr('height', this.height)
        .on('mouseover', () => {
          focus.style('opacity', 1);
          focusText.style('opacity', 1);
        })
        .on('mousemove', () => {
          let x0 = this.x.invert(d3.mouse(this.svg.node())[0]);
          let bisect = d3.bisector((d, x) => x - d[data_x]).left;
          let i = bisect(data, x0, 0, data.length - 1);
          let sel_x = data[i][data_x];
          let sel_y = data[i][data_y];

          focus
            .attr('cx', this.x(sel_x))
            .attr('cy', this.y(sel_y));
          focusText
            .html(`${(sel_y).toFixed(2)}`)
            .attr('x', this.x(sel_x)+15)
            .attr('y', this.y(sel_y));
        })
        .on('mouseout', () => {
          focus.style('opacity', 0);
          focusText.style('opacity', 0);
        });
    }
  }
  
  /**
   * Adds a hand-made legend to the chart
   * @param { string[] } labels 
   * @param { colors[] } colors 
   */
  add_legend(
    labels,
    colors
  ) {
    // Handmade legend
    for (let i = 0; i < labels.length; i++) {
      let curr_y = 20*(i+1);

      this.svg.append('circle')
        .attr('cx', this.width - 80)
        .attr('cy', curr_y)
        .attr('r', 6)
        .style('fill', colors[i]);

      this.svg.append('text')
        .attr('x', this.width - 60)
        .attr('y', curr_y)
        .text(labels[i])
        .style('font-size', '15px')
        .attr('alignment-baseline', 'middle');
    }
  }

  clear_plot () {
    d3.selectAll(`#${this.chart_id} svg > *`).remove();
  }
} 