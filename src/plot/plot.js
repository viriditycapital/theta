/**
 * Helpers to plot with d3 library
 */

import * as d3 from 'd3';
import * as CONST_STYLE from '../CONST_STYLE.js';

/**
 * Plots data
 *
 * @param { String } chart_id The name of the chart svg to add the plot on
 * @param { data[] } data
 * @param { String } data_x x field of data
 * @param { String } data_y y field of data
 * @param { top, right, bottom, left } margin
 */
export function plot_line (
  chart_id,
  data,
  data_x,
  data_y,
  color = CONST_STYLE.BLUE_FB,
  margin = {
    top: 20, 
    right: 20, 
    bottom: 50, 
    left: 70
  }
) {
  // set the dimensions and margins of the graph
  let width = 460 - margin.left - margin.right;
  let height = 450 - margin.top - margin.bottom;

  // set the ranges
  let x = d3.scaleTime().range([0, width]);
  let y = d3.scaleLinear().range([height, 0]);

  // append the svg obgect to the body of the page
  let svg = d3.select(`#${chart_id}`)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr(
      'transform',
      `translate(${margin.left}, ${margin.top})`
    );

  // Scale the range of the data
  x.domain(d3.extent(data, (d) => d[data_x]));
  y.domain([d3.min(data, (d) => d[data_y]), d3.max(data, (d) => d[data_y])]);

  // Add the line data
  svg.append('path')
    .data([data])
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x((d) => x(d[data_x]))
      .y((d) => y(d[data_y]))
    );

  // Add the x Axis
  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('y', 0)
    .attr('x', 9)
    .attr('dy', '.35em')
    .attr('transform', 'rotate(90)')
    .style('text-anchor', 'start');

  // Add the y Axis
  svg.append('g')
    .call(d3.axisLeft(y));

  return svg;
}

export function plot_line_only (
  chart_obj,
  data,
  data_x,
  data_y,
  color,
  margin
) {
  // set the dimensions and margins of the graph
  let width = 460 - margin.left - margin.right;
  let height = 450 - margin.top - margin.bottom;

  // set the ranges
  let x = d3.scaleTime().range([0, width]);
  let y = d3.scaleLinear().range([height, 0]);

  // Scale the range of the data
  x.domain(d3.extent(data, (d) => d[data_x]));
  y.domain([d3.min(data, (d) => d[data_y]), d3.max(data, (d) => d[data_y])]);

  chart_obj.append('path')
    .data([data])
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x((d) => x(d.date))
      .y((d) => y(d.close))
    );

  // Add the y Axis
  // TODO: this is a temporary fix to plot two series on one plot
  chart_obj.append('g')
    .attr('transform', `translate(${width}, 0)`)
    .call(d3.axisRight(y));
}

export function add_legend(
  chart_obj,
  labels,
  colors,
  margin
) {
  let width = 460 - margin.left - margin.right;

  // Handmade legend
  for (let i = 0; i < labels.length; i++) {
    let curr_y = 20*(i+1);

    chart_obj.append('circle')
      .attr('cx', width - 80)
      .attr('cy', curr_y)
      .attr('r', 6)
      .style('fill', colors[i]);

    chart_obj.append('text')
      .attr('x', width - 60)
      .attr('y', curr_y)
      .text(labels[i])
      .style('font-size', '15px')
      .attr('alignment-baseline', 'middle');
  }
}

/**
 * Removes all parts of a chart, leaving the svg blank 
 * @param { String } chart_id 
 */
export function remove_plot (chart_id) {
  d3.selectAll(`#${chart_id}> *`).remove();
}