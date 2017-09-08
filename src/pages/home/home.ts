import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as moment from 'moment';
import * as d3 from 'd3';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController) {

  }

  ionViewDidLoad(){
    this.initialize();
  }

  initialize(){
    var area,
    canvas,
    context,
    barChart,
    brush,
    dispatch = d3.dispatch('zoomedGraph', 'changeArea'),
    container,
    containerHeight,
    containerWidth,
    data,
    dailyData,
    dayDiff,
    height,
    hourlyData,
    focus,
    line,
    margin,
    mode,
    monthly,
    monthlyData,
    selectedNode,
    usageAreaPath,
    usageLinePath,
    weatherChart,
    xExtent,
    yExtent,
    xScale,
    x,
    x2,
    viewPortData,
    width,
    y,
    yScale,
    zoom;


var jData = getData();
    dailyData = convertSqlSet(jData.daily);
    monthlyData = convertSqlSet(jData.monthly);
    data = monthlyData;
    initializeGraph();

var minDollar = 1;
var maxDollar = 150;
/// Implementation details...




function initializeGraph(){


  mode = 'monthly';
  
  canvas = document.querySelector("canvas");
  context = canvas.getContext("2d");

  margin = { top: 20, right: 20, bottom: 30, left: 50 },
      width = canvas.width - margin.left - margin.right,
      height = canvas.height - margin.top - margin.bottom;

  var parseTime = d3.timeParse("%d-%b-%y");

  // setup scales
  x = d3.scaleTime()
      .range([0, width]);
  x2 = d3.scaleTime().range([0, width]);
  y = d3.scaleLinear()
      .range([height, 0]);

  // setup domain
  x.domain(d3.extent(data, function (d) { return moment(d.usageTime); }));
  y.domain(d3.extent(data, function (d) { return d.kWh; }));

  x2.domain(x.domain());



  // get day range
  dayDiff = daydiff(x.domain()[0], x.domain()[1]);

  // line generator
  line = d3.line()
      .x(function (d) { return x(moment(d.usageTime)); })
      .y(function (d) { return y(d.kWh); })
      .curve(d3.curveMonotoneX)
      .context(context);

  area = d3.area()
      .curve(d3.curveMonotoneX)
      .x(function (d) { return x(moment(d.usageTime)); })
      .y0(height)
      .y1(function (d) { return y(d.kWh); })
      .context(context);

  // zoom
  zoom = d3.zoom()
      .scaleExtent([1, dayDiff * 12])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);

  d3.select("canvas").call(zoom)

  context.translate(margin.left, margin.top);

  draw();
}

function draw() {

  // remove everything:
  context.clearRect(-margin.left, -margin.top, canvas.width, canvas.height);

  // draw axes:
  xAxis();
  yAxis();

  // save the context without a clip path
  context.save();

  // create a clip path:
  context.beginPath()
  context.rect(0, 0, width, height);
  context.lineWidth = 0;
  context.strokeStyle = "none";
  context.stroke();
  context.clip();

  // draw line in clip path
  line(data);
  context.lineWidth = 1.5;
  context.strokeStyle = "steelblue";
  context.stroke();

  context.beginPath();
  area(data);
  context.fillStyle = 'steelblue';
  context.strokeStyle = 'steelblue';
  context.fill();


  // restore without a clip path
  context.restore();

}

function zoomed() {
  var t = d3.event.transform;
  x = t.rescaleX(x2);


  draw();

  var diff = daydiff(x.domain()[0], x.domain()[1]);
  if (diff < 366 && diff > 120 && mode !== 'monthly') {
      mode = 'monthly';
      data = monthlyData;
      y.domain(d3.extent(data, function (d) { return d.kWh; }));
      return;
  }

  if (diff <= 120 && diff > 2 && mode !== 'daily') {
      mode = 'daily';
      data = dailyData;
      y.domain(d3.extent(data, function (d) { return d.kWh; }));
      return;
  }
}

function changeArea(data) {
  console.log('change granularity', data);
}
function xAxis() {
  var tickCount = 10,
      tickSize = 6,
      ticks = x.ticks(tickCount),
      tickFormat = x.tickFormat();

  context.beginPath();
  ticks.forEach(function (d) {
      context.moveTo(x(d), height);
      context.lineTo(x(d), height + tickSize);
  });
  context.strokeStyle = "black";
  context.stroke();

  context.textAlign = "center";
  context.textBaseline = "top";
  ticks.forEach(function (d) {
      context.fillText(tickFormat(d), x(d), height + tickSize);
  });
}

function yAxis() {
  var tickCount = 10,
      tickSize = 6,
      tickPadding = 3,
      ticks = y.ticks(tickCount),
      tickFormat = y.tickFormat(tickCount);

  context.beginPath();
  ticks.forEach(function (d) {
      context.moveTo(0, y(d));
      context.lineTo(-6, y(d));
  });
  context.strokeStyle = "black";
  context.stroke();

  context.beginPath();
  context.moveTo(-tickSize, 0);
  context.lineTo(0.5, 0);
  context.lineTo(0.5, height);
  context.lineTo(-tickSize, height);
  context.strokeStyle = "black";
  context.stroke();

  context.textAlign = "right";
  context.textBaseline = "middle";
  ticks.forEach(function (d) {
      context.fillText(tickFormat(d), -tickSize - tickPadding, y(d));
  });

  context.save();
  context.rotate(-Math.PI / 2);
  context.textAlign = "right";
  context.textBaseline = "top";
  context.font = "bold 10px sans-serif";
  context.fillText("Price (US$)", -10, 10);
  context.restore();
}

function getDate(d) {
  return new Date(d.Ind);
}

function daydiff(first, second) {
  return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

function convertSqlSet(result) {
  var newResult = [];
  for (var i = 0; i < result.length; i++) {
      newResult.push({
          briteID: result[i].BriteID,
          kWh: result[i].KSum,
          maxTemp: result[i].TMax,
          minTemp: result[i].TMin,
          usageTime: moment(result[i].Ind.toString(), 'YYYYMMDD').format() // Must convert number to string
      });
  }
  return newResult;
}

function convertSqlSetHourly(result) {
  var newResult = [];
  for (var i = 0; i < result.length; i++) {
      newResult.push({
          briteID: result[i].BriteID,
          kWh: result[i].KWH,
          temp: result[i].CurTemp,
          usageTime: moment(result[i].UsageDateTime.toString(), 'YYYYMMDDHHmm').format() // Must convert number to string
      });
  }
  return newResult;
}

function toggleCost() {
  var axis = d3.select('.axis-cost');
  var add = true;

  if (axis.classed('on')) {
      add = false;
  }
  axis.classed('on', add);
  d3.selectAll('.cost-bar').classed('on', add);
}

function getYScaleKwh(d) { return yScale(d.kWh); }
function getXScaleDate(d) { return xScale(d.date); }


function datumMaxTemp(datum) {
  return datum.maxTemp;
}

function datumMinTemp(datum) {
  return datum.minTemp;
}
function parseDate(str) {
  var mdy = str.split('/');
  return new Date(mdy[2], mdy[0] - 1, mdy[1]);
}

function getData(){
  return {
    "monthly": [
        {
    "Ind": 201501,
    "TMin": 30.43,
    "TMax": 77.4,
    "KMin": 0.041,
    "KMax": 1.364,
    "KSum": 625.08
  },
  {
    
    "Ind": 201502,
    "TMin": 35.3,
    "TMax": 81.34,
    "KMin": 0.036,
    "KMax": 1.401,
    "KSum": 542.57
  },
  {
    
    "Ind": 201503,
    "TMin": 32.58,
    "TMax": 81.32,
    "KMin": 0.036,
    "KMax": 1.325,
    "KSum": 577.83
  },
  {
    
    "Ind": 201504,
    "TMin": 54.54,
    "TMax": 86.55,
    "KMin": 0.036,
    "KMax": 1.587,
    "KSum": 814.62
  },
  {
    
    "Ind": 201505,
    "TMin": 61.35,
    "TMax": 88.61,
    "KMin": 0.036,
    "KMax": 1.988,
    "KSum": 2429.56
  },
  {
    
    "Ind": 201506,
    "TMin": 69.5,
    "TMax": 92.42,
    "KMin": 0.037,
    "KMax": 1.995,
    "KSum": 2484.93
  },
  {
    
    "Ind": 201507,
    "TMin": 71.95,
    "TMax": 98.62,
    "KMin": 0.037,
    "KMax": 1.864,
    "KSum": 2062.05
  },
  {
    
    "Ind": 201508,
    "TMin": 76.13,
    "TMax": 99.59,
    "KMin": 0.045,
    "KMax": 1.977,
    "KSum": 900.05
  },
  {
    
    "Ind": 201509,
    "TMin": 70,
    "TMax": 91.8,
    "KMin": 0.034,
    "KMax": 1.458,
    "KSum": 401.39
  },
  {
    
    "Ind": 201510,
    "TMin": 56.1,
    "TMax": 91.81,
    "KMin": 0.03,
    "KMax": 1.418,
    "KSum": 765.06
  },
  {
    
    "Ind": 201511,
    "TMin": 38.36,
    "TMax": 82.43,
    "KMin": 0.038,
    "KMax": 1.813,
    "KSum": 843.82
  },
  {
    
    "Ind": 201512,
    "TMin": 39.51,
    "TMax": 81.81,
    "KMin": 0.035,
    "KMax": 1.81,
    "KSum": 447.59
  },
  {
    
    "Ind": 201601,
    "TMin": 36.04,
    "TMax": 76.59,
    "KMin": 0.036,
    "KMax": 1.437,
    "KSum": 446.34
  },
  {
    
    "Ind": 201602,
    "TMin": 38.23,
    "TMax": 79,
    "KMin": 0.041,
    "KMax": 1.337,
    "KSum": 490.05
  },
  {
    
    "Ind": 201603,
    "TMin": 40.77,
    "TMax": 85,
    "KMin": 0.039,
    "KMax": 1.505,
    "KSum": 425.83
  },
  {
    
    "Ind": 201604,
    "TMin": 48.02,
    "TMax": 85.62,
    "KMin": 0.039,
    "KMax": 1.553,
    "KSum": 959.95
  },
  {
    
    "Ind": 201605,
    "TMin": 58.33,
    "TMax": 88.36,
    "KMin": 0.042,
    "KMax": 1.81,
    "KSum": 1437.54
  },
  {
    
    "Ind": 201606,
    "TMin": 67.97,
    "TMax": 94.8,
    "KMin": 0.04,
    "KMax": 1.957,
    "KSum": 2040.62
  },
  {
    
    "Ind": 201607,
    "TMin": 75.72,
    "TMax": 97.71,
    "KMin": 0.038,
    "KMax": 1.961,
    "KSum": 2083.82
  },
  {
    
    "Ind": 201608,
    "TMin": 73.4,
    "TMax": 99.3,
    "KMin": 0.037,
    "KMax": 1.928,
    "KSum": 1771.66
  },
  {
    
    "Ind": 201609,
    "TMin": 72.53,
    "TMax": 95.95,
    "KMin": 0.04,
    "KMax": 1.915,
    "KSum": 1021.25
  }
    ],
  "daily" : [
    {
    
    "Ind": 20150101,
    "TMin": 41.3,
    "TMax": 45.1,
    "KMin": 0.056,
    "KMax": 0.229,
    "KSum": 12.92
  },
  {
    
    "Ind": 20150102,
    "TMin": 44.88,
    "TMax": 52.95,
    "KMin": 0.056,
    "KMax": 0.212,
    "KSum": 11.74
  },
  {
    
    "Ind": 20150103,
    "TMin": 40.79,
    "TMax": 52.18,
    "KMin": 0.055,
    "KMax": 0.264,
    "KSum": 11.67
  },
  {
    
    "Ind": 20150104,
    "TMin": 36.6,
    "TMax": 52.73,
    "KMin": 0.063,
    "KMax": 0.576,
    "KSum": 20.76
  },
  {
    
    "Ind": 20150105,
    "TMin": 32.45,
    "TMax": 50.41,
    "KMin": 0.122,
    "KMax": 0.604,
    "KSum": 22.69
  },
  {
    
    "Ind": 20150106,
    "TMin": 37.98,
    "TMax": 63.39,
    "KMin": 0.079,
    "KMax": 1.05,
    "KSum": 22.04
  },
  {
    
    "Ind": 20150107,
    "TMin": 41.56,
    "TMax": 59.52,
    "KMin": 0.073,
    "KMax": 0.617,
    "KSum": 23.69
  },
  {
    
    "Ind": 20150108,
    "TMin": 30.43,
    "TMax": 41.6,
    "KMin": 0.094,
    "KMax": 0.423,
    "KSum": 21.3
  },
  {
    
    "Ind": 20150109,
    "TMin": 36.45,
    "TMax": 40.83,
    "KMin": 0.103,
    "KMax": 1.026,
    "KSum": 25.57
  },
  {
    
    "Ind": 20150110,
    "TMin": 36.77,
    "TMax": 40.27,
    "KMin": 0.082,
    "KMax": 0.572,
    "KSum": 23.15
  },
  {
    
    "Ind": 20150111,
    "TMin": 39.52,
    "TMax": 47.53,
    "KMin": 0.063,
    "KMax": 0.843,
    "KSum": 28.02
  },
  {
    
    "Ind": 20150112,
    "TMin": 42.15,
    "TMax": 46.48,
    "KMin": 0.066,
    "KMax": 0.567,
    "KSum": 25.31
  },
  {
    
    "Ind": 20150113,
    "TMin": 42.05,
    "TMax": 44.42,
    "KMin": 0.058,
    "KMax": 1.06,
    "KSum": 25.76
  },
  {
    
    "Ind": 20150114,
    "TMin": 40.09,
    "TMax": 43.72,
    "KMin": 0.065,
    "KMax": 0.756,
    "KSum": 23.75
  },
  {
    
    "Ind": 20150115,
    "TMin": 38.37,
    "TMax": 52.07,
    "KMin": 0.06,
    "KMax": 0.6,
    "KSum": 21.78
  },
  {
    
    "Ind": 20150116,
    "TMin": 33.54,
    "TMax": 58.4,
    "KMin": 0.081,
    "KMax": 0.554,
    "KSum": 21.7
  },
  {
    
    "Ind": 20150117,
    "TMin": 42.04,
    "TMax": 66.24,
    "KMin": 0.066,
    "KMax": 0.504,
    "KSum": 19.42
  },
  {
    
    "Ind": 20150118,
    "TMin": 46.44,
    "TMax": 66.25,
    "KMin": 0.063,
    "KMax": 0.938,
    "KSum": 18.2
  },
  {
    
    "Ind": 20150119,
    "TMin": 41.95,
    "TMax": 69.4,
    "KMin": 0.064,
    "KMax": 0.793,
    "KSum": 19.62
  },
  {
    
    "Ind": 20150120,
    "TMin": 50.66,
    "TMax": 71.66,
    "KMin": 0.059,
    "KMax": 0.664,
    "KSum": 18.42
  },
  {
    
    "Ind": 20150121,
    "TMin": 55.97,
    "TMax": 61.99,
    "KMin": 0.041,
    "KMax": 0.929,
    "KSum": 18.56
  },
  {
    
    "Ind": 20150122,
    "TMin": 44.26,
    "TMax": 59.9,
    "KMin": 0.043,
    "KMax": 1.011,
    "KSum": 19.61
  },
  {
    
    "Ind": 20150123,
    "TMin": 40.28,
    "TMax": 44.11,
    "KMin": 0.061,
    "KMax": 0.564,
    "KSum": 26.74
  },
  {
    
    "Ind": 20150124,
    "TMin": 36.99,
    "TMax": 59.85,
    "KMin": 0.069,
    "KMax": 0.503,
    "KSum": 20.61
  },
  {
    
    "Ind": 20150125,
    "TMin": 43.33,
    "TMax": 68.23,
    "KMin": 0.062,
    "KMax": 0.553,
    "KSum": 19.41
  },
  {
    
    "Ind": 20150126,
    "TMin": 46.79,
    "TMax": 66.22,
    "KMin": 0.061,
    "KMax": 0.423,
    "KSum": 17.38
  },
  {
    
    "Ind": 20150127,
    "TMin": 49.9,
    "TMax": 77.4,
    "KMin": 0.061,
    "KMax": 0.529,
    "KSum": 20.24
  },
  {
    
    "Ind": 20150128,
    "TMin": 49.09,
    "TMax": 75.27,
    "KMin": 0.042,
    "KMax": 1.364,
    "KSum": 18.44
  },
  {
    
    "Ind": 20150129,
    "TMin": 52.58,
    "TMax": 73.12,
    "KMin": 0.042,
    "KMax": 0.622,
    "KSum": 15.97
  },
  {
    
    "Ind": 20150130,
    "TMin": 50.64,
    "TMax": 62.75,
    "KMin": 0.044,
    "KMax": 0.365,
    "KSum": 15.39
  },
  {
    
    "Ind": 20150131,
    "TMin": 47.1,
    "TMax": 61.57,
    "KMin": 0.054,
    "KMax": 0.58,
    "KSum": 15.24
  },
  {
    
    "Ind": 20150201,
    "TMin": 51.36,
    "TMax": 74.55,
    "KMin": 0.039,
    "KMax": 1.393,
    "KSum": 25.87
  },
  {
    
    "Ind": 20150202,
    "TMin": 37.82,
    "TMax": 50.66,
    "KMin": 0.07,
    "KMax": 1.068,
    "KSum": 23.07
  },
  {
    
    "Ind": 20150203,
    "TMin": 42.86,
    "TMax": 47.67,
    "KMin": 0.105,
    "KMax": 0.467,
    "KSum": 21.47
  },
  {
    
    "Ind": 20150204,
    "TMin": 42.08,
    "TMax": 58.68,
    "KMin": 0.069,
    "KMax": 1.317,
    "KSum": 21.41
  },
  {
    
    "Ind": 20150205,
    "TMin": 41.08,
    "TMax": 54.72,
    "KMin": 0.065,
    "KMax": 0.423,
    "KSum": 18.5
  },
  {
    
    "Ind": 20150206,
    "TMin": 41.32,
    "TMax": 55.07,
    "KMin": 0.056,
    "KMax": 0.621,
    "KSum": 16.78
  },
  {
    
    "Ind": 20150207,
    "TMin": 43.5,
    "TMax": 66.47,
    "KMin": 0.054,
    "KMax": 0.334,
    "KSum": 13.82
  },
  {
    
    "Ind": 20150208,
    "TMin": 53.89,
    "TMax": 72.89,
    "KMin": 0.038,
    "KMax": 1.067,
    "KSum": 13.88
  },
  {
    
    "Ind": 20150209,
    "TMin": 57.41,
    "TMax": 81.34,
    "KMin": 0.042,
    "KMax": 1.362,
    "KSum": 23.44
  },
  {
    
    "Ind": 20150210,
    "TMin": 53.17,
    "TMax": 72.61,
    "KMin": 0.096,
    "KMax": 0.825,
    "KSum": 22.15
  },
  {
    
    "Ind": 20150211,
    "TMin": 53.34,
    "TMax": 71.89,
    "KMin": 0.039,
    "KMax": 0.454,
    "KSum": 13.17
  },
  {
    
    "Ind": 20150212,
    "TMin": 52.74,
    "TMax": 66.51,
    "KMin": 0.043,
    "KMax": 0.392,
    "KSum": 13.22
  },
  {
    
    "Ind": 20150213,
    "TMin": 45.81,
    "TMax": 65.05,
    "KMin": 0.043,
    "KMax": 0.601,
    "KSum": 12.42
  },
  {
    
    "Ind": 20150214,
    "TMin": 48.41,
    "TMax": 76.71,
    "KMin": 0.036,
    "KMax": 0.202,
    "KSum": 8.78
  },
  {
    
    "Ind": 20150215,
    "TMin": 55.01,
    "TMax": 70.16,
    "KMin": 0.037,
    "KMax": 0.426,
    "KSum": 8.47
  },
  {
    
    "Ind": 20150216,
    "TMin": 38.82,
    "TMax": 68.17,
    "KMin": 0.041,
    "KMax": 1.152,
    "KSum": 24.42
  },
  {
    
    "Ind": 20150217,
    "TMin": 37.29,
    "TMax": 53.7,
    "KMin": 0.065,
    "KMax": 0.522,
    "KSum": 24.43
  },
  {
    
    "Ind": 20150218,
    "TMin": 38.46,
    "TMax": 63.47,
    "KMin": 0.06,
    "KMax": 0.598,
    "KSum": 18.27
  },
  {
    
    "Ind": 20150219,
    "TMin": 42.36,
    "TMax": 62.19,
    "KMin": 0.061,
    "KMax": 0.363,
    "KSum": 15.35
  },
  {
    
    "Ind": 20150220,
    "TMin": 58.38,
    "TMax": 70.43,
    "KMin": 0.06,
    "KMax": 1.125,
    "KSum": 16.45
  },
  {
    
    "Ind": 20150221,
    "TMin": 66.32,
    "TMax": 73.87,
    "KMin": 0.043,
    "KMax": 1.07,
    "KSum": 21.58
  },
  {
    
    "Ind": 20150222,
    "TMin": 47.87,
    "TMax": 76.55,
    "KMin": 0.038,
    "KMax": 1.401,
    "KSum": 19.5
  },
  {
    
    "Ind": 20150223,
    "TMin": 36.29,
    "TMax": 47.72,
    "KMin": 0.062,
    "KMax": 0.612,
    "KSum": 26.93
  },
  {
    
    "Ind": 20150224,
    "TMin": 35.3,
    "TMax": 43.38,
    "KMin": 0.072,
    "KMax": 0.98,
    "KSum": 25.53
  },
  {
    
    "Ind": 20150225,
    "TMin": 38.73,
    "TMax": 49.92,
    "KMin": 0.068,
    "KMax": 0.669,
    "KSum": 23.84
  },
  {
    
    "Ind": 20150226,
    "TMin": 35.37,
    "TMax": 54.9,
    "KMin": 0.085,
    "KMax": 1.138,
    "KSum": 23.72
  },
  {
    
    "Ind": 20150227,
    "TMin": 39.89,
    "TMax": 46.52,
    "KMin": 0.063,
    "KMax": 0.636,
    "KSum": 26.76
  },
  {
    
    "Ind": 20150228,
    "TMin": 41.08,
    "TMax": 58.5,
    "KMin": 0.06,
    "KMax": 0.526,
    "KSum": 19.32
  },
  {
    
    "Ind": 20150301,
    "TMin": 52.03,
    "TMax": 64.29,
    "KMin": 0.064,
    "KMax": 0.531,
    "KSum": 16.74
  },
  {
    
    "Ind": 20150302,
    "TMin": 49.01,
    "TMax": 61.76,
    "KMin": 0.058,
    "KMax": 0.422,
    "KSum": 14.93
  },
  {
    
    "Ind": 20150303,
    "TMin": 56.51,
    "TMax": 76.92,
    "KMin": 0.046,
    "KMax": 1.218,
    "KSum": 17.19
  },
  {
    
    "Ind": 20150304,
    "TMin": 43.48,
    "TMax": 80.42,
    "KMin": 0.037,
    "KMax": 1.162,
    "KSum": 23.71
  },
  {
    
    "Ind": 20150305,
    "TMin": 37.82,
    "TMax": 48.53,
    "KMin": 0.061,
    "KMax": 0.685,
    "KSum": 23.94
  },
  {
    
    "Ind": 20150306,
    "TMin": 32.58,
    "TMax": 55.31,
    "KMin": 0.067,
    "KMax": 0.633,
    "KSum": 23.57
  },
  {
    
    "Ind": 20150307,
    "TMin": 45.03,
    "TMax": 61.9,
    "KMin": 0.072,
    "KMax": 0.73,
    "KSum": 21.69
  },
  {
    
    "Ind": 20150308,
    "TMin": 47.24,
    "TMax": 54.25,
    "KMin": 0.056,
    "KMax": 0.57,
    "KSum": 17.2
  },
  {
    
    "Ind": 20150309,
    "TMin": 50.55,
    "TMax": 65.8,
    "KMin": 0.065,
    "KMax": 1.265,
    "KSum": 23.53
  },
  {
    
    "Ind": 20150310,
    "TMin": 54.07,
    "TMax": 59.13,
    "KMin": 0.058,
    "KMax": 0.535,
    "KSum": 16.51
  },
  {
    
    "Ind": 20150311,
    "TMin": 54,
    "TMax": 59.42,
    "KMin": 0.06,
    "KMax": 0.473,
    "KSum": 16.1
  },
  {
    
    "Ind": 20150312,
    "TMin": 54.42,
    "TMax": 59.65,
    "KMin": 0.07,
    "KMax": 0.662,
    "KSum": 21.32
  },
  {
    
    "Ind": 20150313,
    "TMin": 57,
    "TMax": 64.8,
    "KMin": 0.063,
    "KMax": 0.281,
    "KSum": 14.88
  },
  {
    
    "Ind": 20150314,
    "TMin": 56.16,
    "TMax": 76.28,
    "KMin": 0.06,
    "KMax": 1.106,
    "KSum": 16.62
  },
  {
    
    "Ind": 20150315,
    "TMin": 56.56,
    "TMax": 73.16,
    "KMin": 0.041,
    "KMax": 1.163,
    "KSum": 12.99
  },
  {
    
    "Ind": 20150316,
    "TMin": 59.97,
    "TMax": 75.37,
    "KMin": 0.039,
    "KMax": 0.682,
    "KSum": 15.09
  },
  {
    
    "Ind": 20150317,
    "TMin": 62.05,
    "TMax": 80.77,
    "KMin": 0.041,
    "KMax": 1.069,
    "KSum": 18.92
  },
  {
    
    "Ind": 20150318,
    "TMin": 65.02,
    "TMax": 78.77,
    "KMin": 0.043,
    "KMax": 1.149,
    "KSum": 24.05
  },
  {
    
    "Ind": 20150319,
    "TMin": 67.57,
    "TMax": 79.03,
    "KMin": 0.048,
    "KMax": 1.293,
    "KSum": 26.56
  },
  {
    
    "Ind": 20150320,
    "TMin": 68.02,
    "TMax": 79.77,
    "KMin": 0.048,
    "KMax": 1.231,
    "KSum": 33.5
  },
  {
    
    "Ind": 20150321,
    "TMin": 64.18,
    "TMax": 69.45,
    "KMin": 0.055,
    "KMax": 1.03,
    "KSum": 29.96
  },
  {
    
    "Ind": 20150322,
    "TMin": 62.82,
    "TMax": 73.84,
    "KMin": 0.045,
    "KMax": 1.115,
    "KSum": 24.52
  },
  {
    
    "Ind": 20150323,
    "TMin": 56.83,
    "TMax": 78.74,
    "KMin": 0.036,
    "KMax": 0.987,
    "KSum": 14.87
  },
  {
    
    "Ind": 20150324,
    "TMin": 58.34,
    "TMax": 76.5,
    "KMin": 0.044,
    "KMax": 1.002,
    "KSum": 21.49
  },
  {
    
    "Ind": 20150325,
    "TMin": 61.12,
    "TMax": 77.36,
    "KMin": 0.04,
    "KMax": 0.995,
    "KSum": 14.33
  },
  {
    
    "Ind": 20150326,
    "TMin": 59.66,
    "TMax": 67.18,
    "KMin": 0.037,
    "KMax": 0.801,
    "KSum": 10.53
  },
  {
    
    "Ind": 20150327,
    "TMin": 50.51,
    "TMax": 78.72,
    "KMin": 0.038,
    "KMax": 0.178,
    "KSum": 7.11
  },
  {
    
    "Ind": 20150328,
    "TMin": 56.73,
    "TMax": 81.25,
    "KMin": 0.037,
    "KMax": 0.6,
    "KSum": 7.93
  },
  {
    
    "Ind": 20150329,
    "TMin": 58.51,
    "TMax": 79.31,
    "KMin": 0.037,
    "KMax": 1.062,
    "KSum": 11.16
  },
  {
    
    "Ind": 20150330,
    "TMin": 62.95,
    "TMax": 81.32,
    "KMin": 0.037,
    "KMax": 1.325,
    "KSum": 18.28
  },
  {
    
    "Ind": 20150331,
    "TMin": 63.52,
    "TMax": 81.31,
    "KMin": 0.037,
    "KMax": 1.265,
    "KSum": 18.61
  },
  {
    
    "Ind": 20150401,
    "TMin": 67.66,
    "TMax": 77.8,
    "KMin": 0.043,
    "KMax": 1.109,
    "KSum": 17.06
  },
  {
    
    "Ind": 20150402,
    "TMin": 69.87,
    "TMax": 81.5,
    "KMin": 0.038,
    "KMax": 1.325,
    "KSum": 24.83
  },
  {
    
    "Ind": 20150403,
    "TMin": 72.4,
    "TMax": 80.53,
    "KMin": 0.037,
    "KMax": 1.376,
    "KSum": 39.73
  },
  {
    
    "Ind": 20150404,
    "TMin": 65.92,
    "TMax": 73.31,
    "KMin": 0.037,
    "KMax": 1.035,
    "KSum": 14.56
  },
  {
    
    "Ind": 20150405,
    "TMin": 63.18,
    "TMax": 70.01,
    "KMin": 0.042,
    "KMax": 0.175,
    "KSum": 7.66
  },
  {
    
    "Ind": 20150406,
    "TMin": 69.79,
    "TMax": 79.13,
    "KMin": 0.037,
    "KMax": 1.202,
    "KSum": 15.88
  },
  {
    
    "Ind": 20150407,
    "TMin": 69.37,
    "TMax": 83.66,
    "KMin": 0.045,
    "KMax": 1.456,
    "KSum": 45.65
  },
  {
    
    "Ind": 20150408,
    "TMin": 72.76,
    "TMax": 81.56,
    "KMin": 0.041,
    "KMax": 1.487,
    "KSum": 38.65
  },
  {
    
    "Ind": 20150409,
    "TMin": 73.43,
    "TMax": 83.91,
    "KMin": 0.047,
    "KMax": 1.232,
    "KSum": 39.71
  },
  {
    
    "Ind": 20150410,
    "TMin": 63.62,
    "TMax": 74.02,
    "KMin": 0.038,
    "KMax": 1.119,
    "KSum": 24.65
  },
  {
    
    "Ind": 20150411,
    "TMin": 65.19,
    "TMax": 74.04,
    "KMin": 0.043,
    "KMax": 1.224,
    "KSum": 21.66
  },
  {
    
    "Ind": 20150412,
    "TMin": 69.08,
    "TMax": 76.76,
    "KMin": 0.04,
    "KMax": 1.266,
    "KSum": 28.3
  },
  {
    
    "Ind": 20150413,
    "TMin": 70.02,
    "TMax": 85.38,
    "KMin": 0.062,
    "KMax": 1.401,
    "KSum": 43.32
  },
  {
    
    "Ind": 20150414,
    "TMin": 66.85,
    "TMax": 75.62,
    "KMin": 0.039,
    "KMax": 1.282,
    "KSum": 35.71
  },
  {
    
    "Ind": 20150415,
    "TMin": 62,
    "TMax": 79.55,
    "KMin": 0.038,
    "KMax": 1.326,
    "KSum": 25.29
  },
  {
    
    "Ind": 20150416,
    "TMin": 66.33,
    "TMax": 80.06,
    "KMin": 0.039,
    "KMax": 0.763,
    "KSum": 31.06
  },
  {
    
    "Ind": 20150417,
    "TMin": 66.18,
    "TMax": 80.17,
    "KMin": 0.037,
    "KMax": 0.924,
    "KSum": 27.92
  },
  {
    
    "Ind": 20150418,
    "TMin": 66.49,
    "TMax": 76.64,
    "KMin": 0.04,
    "KMax": 1.396,
    "KSum": 22.47
  },
  {
    
    "Ind": 20150419,
    "TMin": 61.25,
    "TMax": 85.36,
    "KMin": 0.041,
    "KMax": 1.587,
    "KSum": 33.98
  },
  {
    
    "Ind": 20150420,
    "TMin": 61.92,
    "TMax": 74.08,
    "KMin": 0.041,
    "KMax": 0.56,
    "KSum": 8.52
  },
  {
    
    "Ind": 20150421,
    "TMin": 61.37,
    "TMax": 76.86,
    "KMin": 0.036,
    "KMax": 1.344,
    "KSum": 15.76
  },
  {
    
    "Ind": 20150422,
    "TMin": 69,
    "TMax": 81.93,
    "KMin": 0.036,
    "KMax": 1.307,
    "KSum": 28.35
  },
  {
    
    "Ind": 20150423,
    "TMin": 70.49,
    "TMax": 86.55,
    "KMin": 0.037,
    "KMax": 1.557,
    "KSum": 45
  },
  {
    
    "Ind": 20150424,
    "TMin": 72.86,
    "TMax": 83.57,
    "KMin": 0.036,
    "KMax": 1.092,
    "KSum": 34.24
  },
  {
    
    "Ind": 20150425,
    "TMin": 67.64,
    "TMax": 83.31,
    "KMin": 0.037,
    "KMax": 1.537,
    "KSum": 37.44
  },
  {
    
    "Ind": 20150426,
    "TMin": 70.4,
    "TMax": 82.56,
    "KMin": 0.038,
    "KMax": 1.285,
    "KSum": 30.25
  },
  {
    
    "Ind": 20150427,
    "TMin": 68.2,
    "TMax": 75.66,
    "KMin": 0.037,
    "KMax": 1.4,
    "KSum": 35.49
  },
  {
    
    "Ind": 20150428,
    "TMin": 59.35,
    "TMax": 70.93,
    "KMin": 0.037,
    "KMax": 0.998,
    "KSum": 17.74
  },
  {
    
    "Ind": 20150429,
    "TMin": 54.54,
    "TMax": 76.68,
    "KMin": 0.036,
    "KMax": 0.509,
    "KSum": 8.37
  },
  {
    
    "Ind": 20150430,
    "TMin": 58.54,
    "TMax": 82.53,
    "KMin": 0.036,
    "KMax": 1.309,
    "KSum": 15.37
  },
  {
    
    "Ind": 20150501,
    "TMin": 61.35,
    "TMax": 82.88,
    "KMin": 0.036,
    "KMax": 1.687,
    "KSum": 32.69
  },
  {
    
    "Ind": 20150502,
    "TMin": 62.54,
    "TMax": 82.04,
    "KMin": 0.042,
    "KMax": 1.812,
    "KSum": 55.57
  },
  {
    
    "Ind": 20150503,
    "TMin": 63.21,
    "TMax": 81.3,
    "KMin": 0.14,
    "KMax": 1.799,
    "KSum": 66.19
  },
  {
    
    "Ind": 20150504,
    "TMin": 65.36,
    "TMax": 82.26,
    "KMin": 0.139,
    "KMax": 1.8,
    "KSum": 75.62
  },
  {
    
    "Ind": 20150505,
    "TMin": 68.33,
    "TMax": 80.11,
    "KMin": 0.146,
    "KMax": 1.717,
    "KSum": 72.63
  },
  {
    
    "Ind": 20150506,
    "TMin": 74.15,
    "TMax": 81.67,
    "KMin": 0.146,
    "KMax": 1.794,
    "KSum": 80.82
  },
  {
    
    "Ind": 20150507,
    "TMin": 74.98,
    "TMax": 83.3,
    "KMin": 0.161,
    "KMax": 1.875,
    "KSum": 85.96
  },
  {
    
    "Ind": 20150508,
    "TMin": 77,
    "TMax": 84.68,
    "KMin": 0.23,
    "KMax": 1.95,
    "KSum": 102.47
  },
  {
    
    "Ind": 20150509,
    "TMin": 76.99,
    "TMax": 85.1,
    "KMin": 0.287,
    "KMax": 1.958,
    "KSum": 124.73
  },
  {
    
    "Ind": 20150510,
    "TMin": 77.79,
    "TMax": 82.98,
    "KMin": 0.174,
    "KMax": 1.924,
    "KSum": 105.21
  },
  {
    
    "Ind": 20150511,
    "TMin": 71.98,
    "TMax": 81.2,
    "KMin": 0.23,
    "KMax": 1.681,
    "KSum": 82.75
  },
  {
    
    "Ind": 20150512,
    "TMin": 70,
    "TMax": 77.8,
    "KMin": 0.141,
    "KMax": 1.514,
    "KSum": 57.05
  },
  {
    
    "Ind": 20150513,
    "TMin": 69.98,
    "TMax": 80.2,
    "KMin": 0.132,
    "KMax": 1.878,
    "KSum": 72.37
  },
  {
    
    "Ind": 20150514,
    "TMin": 73.68,
    "TMax": 83.59,
    "KMin": 0.069,
    "KMax": 1.844,
    "KSum": 83.71
  },
  {
    
    "Ind": 20150515,
    "TMin": 74.3,
    "TMax": 81.29,
    "KMin": 0.039,
    "KMax": 1.216,
    "KSum": 43.25
  },
  {
    
    "Ind": 20150516,
    "TMin": 75.06,
    "TMax": 86.37,
    "KMin": 0.036,
    "KMax": 1.6,
    "KSum": 54.49
  },
  {
    
    "Ind": 20150517,
    "TMin": 71.96,
    "TMax": 83.23,
    "KMin": 0.036,
    "KMax": 1.656,
    "KSum": 57.24
  },
  {
    
    "Ind": 20150518,
    "TMin": 76.52,
    "TMax": 85.01,
    "KMin": 0.161,
    "KMax": 1.613,
    "KSum": 100.24
  },
  {
    
    "Ind": 20150519,
    "TMin": 75.68,
    "TMax": 84.74,
    "KMin": 0.216,
    "KMax": 1.979,
    "KSum": 113.19
  },
  {
    
    "Ind": 20150520,
    "TMin": 75.89,
    "TMax": 84.8,
    "KMin": 0.248,
    "KMax": 1.638,
    "KSum": 105.79
  },
  {
    
    "Ind": 20150521,
    "TMin": 72.56,
    "TMax": 82.34,
    "KMin": 0.111,
    "KMax": 1.988,
    "KSum": 73.53
  },
  {
    
    "Ind": 20150522,
    "TMin": 66.35,
    "TMax": 78.17,
    "KMin": 0.144,
    "KMax": 1.48,
    "KSum": 72.34
  },
  {
    
    "Ind": 20150523,
    "TMin": 75.57,
    "TMax": 84.05,
    "KMin": 0.181,
    "KMax": 1.591,
    "KSum": 79.13
  },
  {
    
    "Ind": 20150524,
    "TMin": 70.52,
    "TMax": 79.76,
    "KMin": 0.168,
    "KMax": 1.748,
    "KSum": 88.26
  },
  {
    
    "Ind": 20150525,
    "TMin": 66.13,
    "TMax": 85.23,
    "KMin": 0.047,
    "KMax": 1.627,
    "KSum": 63.52
  },
  {
    
    "Ind": 20150526,
    "TMin": 65.51,
    "TMax": 81.47,
    "KMin": 0.127,
    "KMax": 1.577,
    "KSum": 62.78
  },
  {
    
    "Ind": 20150527,
    "TMin": 66,
    "TMax": 85.78,
    "KMin": 0.153,
    "KMax": 1.527,
    "KSum": 80.08
  },
  {
    
    "Ind": 20150528,
    "TMin": 73.34,
    "TMax": 87.55,
    "KMin": 0.094,
    "KMax": 1.764,
    "KSum": 101.19
  },
  {
    
    "Ind": 20150529,
    "TMin": 70.91,
    "TMax": 86.97,
    "KMin": 0.149,
    "KMax": 1.753,
    "KSum": 87.08
  },
  {
    
    "Ind": 20150530,
    "TMin": 69.95,
    "TMax": 88.61,
    "KMin": 0.139,
    "KMax": 1.606,
    "KSum": 80.18
  },
  {
    
    "Ind": 20150531,
    "TMin": 69.76,
    "TMax": 86.61,
    "KMin": 0.057,
    "KMax": 1.557,
    "KSum": 69.49
  },
  {
    
    "Ind": 20150601,
    "TMin": 69.5,
    "TMax": 87.57,
    "KMin": 0.089,
    "KMax": 1.798,
    "KSum": 79.15
  },
  {
    
    "Ind": 20150602,
    "TMin": 71.04,
    "TMax": 89.04,
    "KMin": 0.156,
    "KMax": 1.657,
    "KSum": 88.23
  },
  {
    
    "Ind": 20150603,
    "TMin": 72.23,
    "TMax": 88.47,
    "KMin": 0.163,
    "KMax": 1.838,
    "KSum": 92.02
  },
  {
    
    "Ind": 20150604,
    "TMin": 71.87,
    "TMax": 88.97,
    "KMin": 0.183,
    "KMax": 1.831,
    "KSum": 105.43
  },
  {
    
    "Ind": 20150605,
    "TMin": 73.99,
    "TMax": 89.38,
    "KMin": 0.282,
    "KMax": 1.67,
    "KSum": 129.59
  },
  {
    
    "Ind": 20150606,
    "TMin": 71.82,
    "TMax": 90.99,
    "KMin": 0.096,
    "KMax": 1.78,
    "KSum": 106.78
  },
  {
    
    "Ind": 20150607,
    "TMin": 73.46,
    "TMax": 90.99,
    "KMin": 0.297,
    "KMax": 1.788,
    "KSum": 116.73
  },
  {
    
    "Ind": 20150608,
    "TMin": 71.8,
    "TMax": 91.63,
    "KMin": 0.204,
    "KMax": 1.733,
    "KSum": 116.82
  },
  {
    
    "Ind": 20150609,
    "TMin": 75.82,
    "TMax": 90.38,
    "KMin": 0.05,
    "KMax": 1.619,
    "KSum": 103.43
  },
  {
    
    "Ind": 20150610,
    "TMin": 74.58,
    "TMax": 92.42,
    "KMin": 0.049,
    "KMax": 1.555,
    "KSum": 74.15
  },
  {
    
    "Ind": 20150611,
    "TMin": 74.76,
    "TMax": 90.96,
    "KMin": 0.065,
    "KMax": 1.549,
    "KSum": 70.37
  },
  {
    
    "Ind": 20150612,
    "TMin": 76.65,
    "TMax": 90.25,
    "KMin": 0.058,
    "KMax": 1.52,
    "KSum": 69.74
  },
  {
    
    "Ind": 20150613,
    "TMin": 73.04,
    "TMax": 83.04,
    "KMin": 0.038,
    "KMax": 1.355,
    "KSum": 49.46
  },
  {
    
    "Ind": 20150614,
    "TMin": 75.36,
    "TMax": 86.76,
    "KMin": 0.038,
    "KMax": 1.358,
    "KSum": 52.82
  },
  {
    
    "Ind": 20150615,
    "TMin": 78.17,
    "TMax": 85.7,
    "KMin": 0.047,
    "KMax": 1.243,
    "KSum": 44.45
  },
  {
    
    "Ind": 20150616,
    "TMin": 74.88,
    "TMax": 79.34,
    "KMin": 0.037,
    "KMax": 0.846,
    "KSum": 27.67
  },
  {
    
    "Ind": 20150617,
    "TMin": 74.28,
    "TMax": 81.33,
    "KMin": 0.06,
    "KMax": 1.122,
    "KSum": 33.45
  },
  {
    
    "Ind": 20150618,
    "TMin": 78.41,
    "TMax": 84.57,
    "KMin": 0.072,
    "KMax": 1.631,
    "KSum": 87.74
  },
  {
    
    "Ind": 20150619,
    "TMin": 76.94,
    "TMax": 87.04,
    "KMin": 0.267,
    "KMax": 1.969,
    "KSum": 102.2
  },
  {
    
    "Ind": 20150620,
    "TMin": 75.4,
    "TMax": 87.1,
    "KMin": 0.038,
    "KMax": 1.846,
    "KSum": 104.36
  },
  {
    
    "Ind": 20150621,
    "TMin": 78.71,
    "TMax": 89.29,
    "KMin": 0.062,
    "KMax": 1.86,
    "KSum": 117.45
  },
  {
    
    "Ind": 20150622,
    "TMin": 77.4,
    "TMax": 87.67,
    "KMin": 0.106,
    "KMax": 1.842,
    "KSum": 101.18
  },
  {
    
    "Ind": 20150623,
    "TMin": 77.83,
    "TMax": 89.78,
    "KMin": 0.495,
    "KMax": 1.684,
    "KSum": 118.56
  },
  {
    
    "Ind": 20150624,
    "TMin": 75.03,
    "TMax": 90.44,
    "KMin": 0.067,
    "KMax": 1.995,
    "KSum": 105.42
  },
  {
    
    "Ind": 20150625,
    "TMin": 75.28,
    "TMax": 90.06,
    "KMin": 0.111,
    "KMax": 1.77,
    "KSum": 111.22
  },
  {
    
    "Ind": 20150626,
    "TMin": 77.4,
    "TMax": 90.65,
    "KMin": 0.062,
    "KMax": 1.628,
    "KSum": 84.92
  },
  {
    
    "Ind": 20150627,
    "TMin": 76.99,
    "TMax": 91.64,
    "KMin": 0.052,
    "KMax": 1.487,
    "KSum": 61.84
  },
  {
    
    "Ind": 20150628,
    "TMin": 73.91,
    "TMax": 87.94,
    "KMin": 0.046,
    "KMax": 1.383,
    "KSum": 45.32
  },
  {
    
    "Ind": 20150629,
    "TMin": 75.85,
    "TMax": 88.53,
    "KMin": 0.037,
    "KMax": 1.419,
    "KSum": 49.75
  },
  {
    
    "Ind": 20150630,
    "TMin": 72.33,
    "TMax": 88.61,
    "KMin": 0.042,
    "KMax": 1.016,
    "KSum": 34.69
  },
  {
    
    "Ind": 20150701,
    "TMin": 71.95,
    "TMax": 82.53,
    "KMin": 0.037,
    "KMax": 1.116,
    "KSum": 21.13
  },
  {
    
    "Ind": 20150702,
    "TMin": 72.76,
    "TMax": 88.31,
    "KMin": 0.037,
    "KMax": 1.39,
    "KSum": 33.5
  },
  {
    
    "Ind": 20150703,
    "TMin": 75.47,
    "TMax": 88.27,
    "KMin": 0.195,
    "KMax": 0.314,
    "KSum": 23.17
  },
  {
    
    "Ind": 20150704,
    "TMin": 76.04,
    "TMax": 88.93,
    "KMin": 0.198,
    "KMax": 0.297,
    "KSum": 23.43
  },
  {
    
    "Ind": 20150705,
    "TMin": 77.05,
    "TMax": 89.13,
    "KMin": 0.201,
    "KMax": 0.369,
    "KSum": 23.9
  },
  {
    
    "Ind": 20150706,
    "TMin": 78.44,
    "TMax": 88.32,
    "KMin": 0.077,
    "KMax": 0.362,
    "KSum": 15.38
  },
  {
    
    "Ind": 20150707,
    "TMin": 79.24,
    "TMax": 88.94,
    "KMin": 0.098,
    "KMax": 1.684,
    "KSum": 75.45
  },
  {
    
    "Ind": 20150708,
    "TMin": 77.86,
    "TMax": 88.93,
    "KMin": 0.064,
    "KMax": 1.451,
    "KSum": 72.99
  },
  {
    
    "Ind": 20150709,
    "TMin": 76.3,
    "TMax": 89.79,
    "KMin": 0.06,
    "KMax": 1.841,
    "KSum": 74.67
  },
  {
    
    "Ind": 20150710,
    "TMin": 76.15,
    "TMax": 89.73,
    "KMin": 0.217,
    "KMax": 1.723,
    "KSum": 88.08
  },
  {
    
    "Ind": 20150711,
    "TMin": 76.51,
    "TMax": 90.35,
    "KMin": 0.051,
    "KMax": 1.672,
    "KSum": 84.22
  },
  {
    
    "Ind": 20150712,
    "TMin": 75.64,
    "TMax": 91.73,
    "KMin": 0.06,
    "KMax": 1.864,
    "KSum": 85.44
  },
  {
    
    "Ind": 20150713,
    "TMin": 72.87,
    "TMax": 93.76,
    "KMin": 0.059,
    "KMax": 1.741,
    "KSum": 80.89
  },
  {
    
    "Ind": 20150714,
    "TMin": 74.88,
    "TMax": 92.1,
    "KMin": 0.049,
    "KMax": 1.742,
    "KSum": 82.06
  },
  {
    
    "Ind": 20150715,
    "TMin": 75.31,
    "TMax": 91.72,
    "KMin": 0.082,
    "KMax": 1.456,
    "KSum": 64.49
  },
  {
    
    "Ind": 20150716,
    "TMin": 76.85,
    "TMax": 91.59,
    "KMin": 0.038,
    "KMax": 1.42,
    "KSum": 58.01
  },
  {
    
    "Ind": 20150717,
    "TMin": 76.88,
    "TMax": 89.92,
    "KMin": 0.061,
    "KMax": 1.451,
    "KSum": 57.8
  },
  {
    
    "Ind": 20150718,
    "TMin": 77.5,
    "TMax": 93.08,
    "KMin": 0.046,
    "KMax": 1.476,
    "KSum": 58.83
  },
  {
    
    "Ind": 20150719,
    "TMin": 76.73,
    "TMax": 93.79,
    "KMin": 0.058,
    "KMax": 1.453,
    "KSum": 58.96
  },
  {
    
    "Ind": 20150720,
    "TMin": 76.74,
    "TMax": 93.76,
    "KMin": 0.066,
    "KMax": 1.457,
    "KSum": 56.98
  },
  {
    
    "Ind": 20150721,
    "TMin": 76.92,
    "TMax": 93.07,
    "KMin": 0.037,
    "KMax": 1.434,
    "KSum": 53.87
  },
  {
    
    "Ind": 20150722,
    "TMin": 79.52,
    "TMax": 93.5,
    "KMin": 0.05,
    "KMax": 1.504,
    "KSum": 56.37
  },
  {
    
    "Ind": 20150723,
    "TMin": 78.28,
    "TMax": 95.96,
    "KMin": 0.052,
    "KMax": 1.696,
    "KSum": 83.04
  },
  {
    
    "Ind": 20150724,
    "TMin": 78.61,
    "TMax": 95.94,
    "KMin": 0.063,
    "KMax": 1.633,
    "KSum": 86.75
  },
  {
    
    "Ind": 20150725,
    "TMin": 77.16,
    "TMax": 95.18,
    "KMin": 0.073,
    "KMax": 1.733,
    "KSum": 90.46
  },
  {
    
    "Ind": 20150726,
    "TMin": 78.7,
    "TMax": 95.77,
    "KMin": 0.064,
    "KMax": 1.637,
    "KSum": 85.66
  },
  {
    
    "Ind": 20150727,
    "TMin": 80.33,
    "TMax": 93.4,
    "KMin": 0.079,
    "KMax": 1.669,
    "KSum": 94.51
  },
  {
    
    "Ind": 20150728,
    "TMin": 77.99,
    "TMax": 96.18,
    "KMin": 0.054,
    "KMax": 1.837,
    "KSum": 93.67
  },
  {
    
    "Ind": 20150729,
    "TMin": 78.01,
    "TMax": 97.78,
    "KMin": 0.04,
    "KMax": 1.751,
    "KSum": 90.03
  },
  {
    
    "Ind": 20150730,
    "TMin": 79.08,
    "TMax": 98.62,
    "KMin": 0.059,
    "KMax": 1.824,
    "KSum": 89.92
  },
  {
    
    "Ind": 20150731,
    "TMin": 81.61,
    "TMax": 97.4,
    "KMin": 0.146,
    "KMax": 1.673,
    "KSum": 98.37
  },
  {
    
    "Ind": 20150801,
    "TMin": 76.13,
    "TMax": 95.77,
    "KMin": 0.069,
    "KMax": 1.578,
    "KSum": 86.03
  },
  {
    
    "Ind": 20150802,
    "TMin": 76.17,
    "TMax": 97.45,
    "KMin": 0.121,
    "KMax": 1.577,
    "KSum": 84.03
  },
  {
    
    "Ind": 20150803,
    "TMin": 77.24,
    "TMax": 95.18,
    "KMin": 0.192,
    "KMax": 1.705,
    "KSum": 91.26
  },
  {
    
    "Ind": 20150804,
    "TMin": 78.18,
    "TMax": 93.04,
    "KMin": 0.225,
    "KMax": 1.655,
    "KSum": 88.39
  },
  {
    
    "Ind": 20150805,
    "TMin": 79.47,
    "TMax": 95.17,
    "KMin": 0.229,
    "KMax": 1.977,
    "KSum": 93.41
  },
  {
    
    "Ind": 20150806,
    "TMin": 78.76,
    "TMax": 96.48,
    "KMin": 0.201,
    "KMax": 1.798,
    "KSum": 91.91
  },
  {
    
    "Ind": 20150807,
    "TMin": 78.94,
    "TMax": 98.24,
    "KMin": 0.223,
    "KMax": 1.763,
    "KSum": 99.1
  },
  {
    
    "Ind": 20150808,
    "TMin": 78.57,
    "TMax": 97.57,
    "KMin": 0.133,
    "KMax": 1.73,
    "KSum": 93.53
  },
  {
    
    "Ind": 20150809,
    "TMin": 77.18,
    "TMax": 99.4,
    "KMin": 0.109,
    "KMax": 1.892,
    "KSum": 85.85
  },
  {
    
    "Ind": 20150810,
    "TMin": 77.97,
    "TMax": 99.59,
    "KMin": 0.045,
    "KMax": 1.869,
    "KSum": 86.53
  },
  {
    
    "Ind": 20150919,
    "TMin": 71.8,
    "TMax": 88.99,
    "KMin": 0.052,
    "KMax": 1.303,
    "KSum": 51.77
  },
  {
    
    "Ind": 20150920,
    "TMin": 72.38,
    "TMax": 89.77,
    "KMin": 0.057,
    "KMax": 1.458,
    "KSum": 48.21
  },
  {
    
    "Ind": 20150921,
    "TMin": 74.74,
    "TMax": 89.42,
    "KMin": 0.036,
    "KMax": 1.111,
    "KSum": 35.75
  },
  {
    
    "Ind": 20150922,
    "TMin": 75.04,
    "TMax": 89.62,
    "KMin": 0.04,
    "KMax": 1.119,
    "KSum": 36.24
  },
  {
    
    "Ind": 20150923,
    "TMin": 71.01,
    "TMax": 89.4,
    "KMin": 0.035,
    "KMax": 1.056,
    "KSum": 31.71
  },
  {
    
    "Ind": 20150924,
    "TMin": 70.19,
    "TMax": 87.38,
    "KMin": 0.036,
    "KMax": 0.985,
    "KSum": 28.93
  },
  {
    
    "Ind": 20150925,
    "TMin": 73.5,
    "TMax": 90.22,
    "KMin": 0.035,
    "KMax": 1.306,
    "KSum": 35.17
  },
  {
    
    "Ind": 20150926,
    "TMin": 71.99,
    "TMax": 91.8,
    "KMin": 0.034,
    "KMax": 1.254,
    "KSum": 38.69
  },
  {
    
    "Ind": 20150927,
    "TMin": 71.46,
    "TMax": 76.41,
    "KMin": 0.036,
    "KMax": 0.814,
    "KSum": 22.79
  },
  {
    
    "Ind": 20150928,
    "TMin": 70.4,
    "TMax": 77.28,
    "KMin": 0.038,
    "KMax": 0.695,
    "KSum": 14.64
  },
  {
    
    "Ind": 20150929,
    "TMin": 70,
    "TMax": 86.79,
    "KMin": 0.038,
    "KMax": 1.31,
    "KSum": 23.8
  },
  {
    
    "Ind": 20150930,
    "TMin": 71.7,
    "TMax": 89.8,
    "KMin": 0.038,
    "KMax": 1.272,
    "KSum": 33.68
  },
  {
    
    "Ind": 20151001,
    "TMin": 70.7,
    "TMax": 87.21,
    "KMin": 0.039,
    "KMax": 1.15,
    "KSum": 31.57
  },
  {
    
    "Ind": 20151002,
    "TMin": 64.08,
    "TMax": 81.99,
    "KMin": 0.038,
    "KMax": 0.694,
    "KSum": 17.15
  },
  {
    
    "Ind": 20151003,
    "TMin": 59.49,
    "TMax": 80.8,
    "KMin": 0.038,
    "KMax": 0.846,
    "KSum": 10.29
  },
  {
    
    "Ind": 20151004,
    "TMin": 61.06,
    "TMax": 80.98,
    "KMin": 0.038,
    "KMax": 0.528,
    "KSum": 10.62
  },
  {
    
    "Ind": 20151005,
    "TMin": 61.7,
    "TMax": 82.38,
    "KMin": 0.038,
    "KMax": 0.707,
    "KSum": 12.11
  },
  {
    
    "Ind": 20151006,
    "TMin": 67.79,
    "TMax": 86.81,
    "KMin": 0.038,
    "KMax": 0.934,
    "KSum": 20.86
  },
  {
    
    "Ind": 20151007,
    "TMin": 69.59,
    "TMax": 87.41,
    "KMin": 0.038,
    "KMax": 0.76,
    "KSum": 23.05
  },
  {
    
    "Ind": 20151008,
    "TMin": 71.33,
    "TMax": 86.03,
    "KMin": 0.038,
    "KMax": 0.891,
    "KSum": 25.04
  },
  {
    
    "Ind": 20151009,
    "TMin": 72.31,
    "TMax": 86.2,
    "KMin": 0.038,
    "KMax": 1.045,
    "KSum": 24.86
  },
  {
    
    "Ind": 20151010,
    "TMin": 70.63,
    "TMax": 87.61,
    "KMin": 0.038,
    "KMax": 0.991,
    "KSum": 24.26
  },
  {
    
    "Ind": 20151011,
    "TMin": 64.5,
    "TMax": 87.61,
    "KMin": 0.041,
    "KMax": 0.847,
    "KSum": 22.31
  },
  {
    
    "Ind": 20151012,
    "TMin": 70.39,
    "TMax": 89.17,
    "KMin": 0.043,
    "KMax": 1.066,
    "KSum": 28.25
  },
  {
    
    "Ind": 20151013,
    "TMin": 71.4,
    "TMax": 91.81,
    "KMin": 0.038,
    "KMax": 1.342,
    "KSum": 31.28
  },
  {
    
    "Ind": 20151014,
    "TMin": 62.12,
    "TMax": 89.16,
    "KMin": 0.035,
    "KMax": 0.993,
    "KSum": 19.8
  },
  {
    
    "Ind": 20151015,
    "TMin": 62.89,
    "TMax": 89.71,
    "KMin": 0.035,
    "KMax": 1.115,
    "KSum": 20.72
  },
  {
    
    "Ind": 20151016,
    "TMin": 64.53,
    "TMax": 88.22,
    "KMin": 0.035,
    "KMax": 0.897,
    "KSum": 19.93
  },
  {
    
    "Ind": 20151017,
    "TMin": 63.24,
    "TMax": 80.98,
    "KMin": 0.035,
    "KMax": 0.74,
    "KSum": 12.56
  },
  {
    
    "Ind": 20151018,
    "TMin": 57.48,
    "TMax": 78.79,
    "KMin": 0.035,
    "KMax": 0.145,
    "KSum": 7.26
  },
  {
    
    "Ind": 20151019,
    "TMin": 56.1,
    "TMax": 79.22,
    "KMin": 0.036,
    "KMax": 0.165,
    "KSum": 7.35
  },
  {
    
    "Ind": 20151020,
    "TMin": 64.92,
    "TMax": 76.33,
    "KMin": 0.03,
    "KMax": 0.441,
    "KSum": 8.13
  },
  {
    
    "Ind": 20151021,
    "TMin": 72.71,
    "TMax": 81.63,
    "KMin": 0.036,
    "KMax": 0.882,
    "KSum": 16.54
  },
  {
    
    "Ind": 20151022,
    "TMin": 73.47,
    "TMax": 81.79,
    "KMin": 0.035,
    "KMax": 1.418,
    "KSum": 35.6
  },
  {
    
    "Ind": 20151023,
    "TMin": 76.87,
    "TMax": 83.21,
    "KMin": 0.158,
    "KMax": 1.377,
    "KSum": 57.93
  },
  {
    
    "Ind": 20151024,
    "TMin": 70.95,
    "TMax": 77.3,
    "KMin": 0.063,
    "KMax": 1.003,
    "KSum": 41.96
  },
  {
    
    "Ind": 20151025,
    "TMin": 60.81,
    "TMax": 70.85,
    "KMin": 0.04,
    "KMax": 0.635,
    "KSum": 24.11
  },
  {
    
    "Ind": 20151026,
    "TMin": 61,
    "TMax": 71.78,
    "KMin": 0.041,
    "KMax": 0.967,
    "KSum": 20.53
  },
  {
    
    "Ind": 20151027,
    "TMin": 63.52,
    "TMax": 78.82,
    "KMin": 0.052,
    "KMax": 1.026,
    "KSum": 26.97
  },
  {
    
    "Ind": 20151028,
    "TMin": 64.59,
    "TMax": 84.81,
    "KMin": 0.179,
    "KMax": 1.352,
    "KSum": 45.26
  },
  {
    
    "Ind": 20151029,
    "TMin": 58.22,
    "TMax": 78.46,
    "KMin": 0.173,
    "KMax": 0.824,
    "KSum": 36.6
  },
  {
    
    "Ind": 20151030,
    "TMin": 68.38,
    "TMax": 77.23,
    "KMin": 0.077,
    "KMax": 1.041,
    "KSum": 43.17
  },
  {
    
    "Ind": 20151031,
    "TMin": 68.61,
    "TMax": 76.66,
    "KMin": 0.045,
    "KMax": 1.341,
    "KSum": 39
  },
  {
    
    "Ind": 20151101,
    "TMin": 64.46,
    "TMax": 69.01,
    "KMin": 0.093,
    "KMax": 1.229,
    "KSum": 41.85
  },
  {
    
    "Ind": 20151102,
    "TMin": 61.84,
    "TMax": 74.03,
    "KMin": 0.043,
    "KMax": 0.701,
    "KSum": 27.4
  },
  {
    
    "Ind": 20151103,
    "TMin": 61.75,
    "TMax": 76.58,
    "KMin": 0.05,
    "KMax": 0.892,
    "KSum": 35.12
  },
  {
    
    "Ind": 20151104,
    "TMin": 65.43,
    "TMax": 77.36,
    "KMin": 0.053,
    "KMax": 0.9,
    "KSum": 38.07
  },
  {
    
    "Ind": 20151105,
    "TMin": 70.06,
    "TMax": 82.43,
    "KMin": 0.041,
    "KMax": 1.726,
    "KSum": 47.19
  },
  {
    
    "Ind": 20151106,
    "TMin": 72.05,
    "TMax": 81.3,
    "KMin": 0.045,
    "KMax": 1.304,
    "KSum": 34.59
  },
  {
    
    "Ind": 20151107,
    "TMin": 56.43,
    "TMax": 74.01,
    "KMin": 0.038,
    "KMax": 0.504,
    "KSum": 11.01
  },
  {
    
    "Ind": 20151108,
    "TMin": 53.68,
    "TMax": 70.99,
    "KMin": 0.038,
    "KMax": 1.183,
    "KSum": 10.8
  },
  {
    
    "Ind": 20151109,
    "TMin": 54.27,
    "TMax": 74.01,
    "KMin": 0.17,
    "KMax": 0.689,
    "KSum": 25.77
  },
  {
    
    "Ind": 20151110,
    "TMin": 59.95,
    "TMax": 75.63,
    "KMin": 0.168,
    "KMax": 1.649,
    "KSum": 36.71
  },
  {
    
    "Ind": 20151111,
    "TMin": 68.23,
    "TMax": 81.57,
    "KMin": 0.038,
    "KMax": 1.813,
    "KSum": 53.48
  },
  {
    
    "Ind": 20151112,
    "TMin": 60.81,
    "TMax": 72.81,
    "KMin": 0.046,
    "KMax": 1.051,
    "KSum": 34.38
  },
  {
    
    "Ind": 20151113,
    "TMin": 56.59,
    "TMax": 67.24,
    "KMin": 0.078,
    "KMax": 0.525,
    "KSum": 25.02
  },
  {
    
    "Ind": 20151114,
    "TMin": 55.42,
    "TMax": 69.23,
    "KMin": 0.04,
    "KMax": 0.449,
    "KSum": 17.59
  },
  {
    
    "Ind": 20151115,
    "TMin": 54.68,
    "TMax": 72.16,
    "KMin": 0.044,
    "KMax": 1.209,
    "KSum": 18.14
  },
  {
    
    "Ind": 20151116,
    "TMin": 65.34,
    "TMax": 79.59,
    "KMin": 0.043,
    "KMax": 1.236,
    "KSum": 25.7
  },
  {
    
    "Ind": 20151117,
    "TMin": 52.7,
    "TMax": 77.18,
    "KMin": 0.045,
    "KMax": 1.476,
    "KSum": 26.33
  },
  {
    
    "Ind": 20151118,
    "TMin": 52.16,
    "TMax": 72.61,
    "KMin": 0.045,
    "KMax": 1.01,
    "KSum": 17.13
  },
  {
    
    "Ind": 20151119,
    "TMin": 53.58,
    "TMax": 77.4,
    "KMin": 0.168,
    "KMax": 1.368,
    "KSum": 27.91
  },
  {
    
    "Ind": 20151120,
    "TMin": 55.51,
    "TMax": 71.59,
    "KMin": 0.045,
    "KMax": 1.221,
    "KSum": 24.57
  },
  {
    
    "Ind": 20151121,
    "TMin": 47.39,
    "TMax": 67.09,
    "KMin": 0.045,
    "KMax": 1.415,
    "KSum": 22.43
  },
  {
    
    "Ind": 20151122,
    "TMin": 39.65,
    "TMax": 54.82,
    "KMin": 0.044,
    "KMax": 0.951,
    "KSum": 19.21
  },
  {
    
    "Ind": 20151123,
    "TMin": 38.36,
    "TMax": 60.78,
    "KMin": 0.061,
    "KMax": 0.431,
    "KSum": 17.86
  },
  {
    
    "Ind": 20151124,
    "TMin": 47.23,
    "TMax": 66.24,
    "KMin": 0.041,
    "KMax": 1.351,
    "KSum": 20.52
  },
  {
    
    "Ind": 20151125,
    "TMin": 61.15,
    "TMax": 74.21,
    "KMin": 0.047,
    "KMax": 1.69,
    "KSum": 25.81
  },
  {
    
    "Ind": 20151126,
    "TMin": 67.5,
    "TMax": 76.59,
    "KMin": 0.074,
    "KMax": 1.512,
    "KSum": 57.19
  },
  {
    
    "Ind": 20151127,
    "TMin": 69.63,
    "TMax": 77.63,
    "KMin": 0.079,
    "KMax": 1.515,
    "KSum": 46.39
  },
  {
    
    "Ind": 20151128,
    "TMin": 48.63,
    "TMax": 72,
    "KMin": 0.062,
    "KMax": 1.252,
    "KSum": 19.94
  },
  {
    
    "Ind": 20151129,
    "TMin": 48.05,
    "TMax": 53.26,
    "KMin": 0.068,
    "KMax": 0.894,
    "KSum": 20.15
  },
  {
    
    "Ind": 20151130,
    "TMin": 52.45,
    "TMax": 62.07,
    "KMin": 0.051,
    "KMax": 0.754,
    "KSum": 15.56
  },
  {
    
    "Ind": 20151201,
    "TMin": 52.26,
    "TMax": 60.01,
    "KMin": 0.049,
    "KMax": 0.398,
    "KSum": 17.27
  },
  {
    
    "Ind": 20151202,
    "TMin": 49.8,
    "TMax": 60.53,
    "KMin": 0.067,
    "KMax": 0.401,
    "KSum": 21.06
  },
  {
    
    "Ind": 20151203,
    "TMin": 43.78,
    "TMax": 61,
    "KMin": 0.052,
    "KMax": 0.388,
    "KSum": 13.86
  },
  {
    
    "Ind": 20151204,
    "TMin": 42.55,
    "TMax": 59.99,
    "KMin": 0.045,
    "KMax": 0.699,
    "KSum": 16.22
  },
  {
    
    "Ind": 20151205,
    "TMin": 40.11,
    "TMax": 65.01,
    "KMin": 0.045,
    "KMax": 0.337,
    "KSum": 13.57
  },
  {
    
    "Ind": 20151206,
    "TMin": 39.51,
    "TMax": 69.42,
    "KMin": 0.045,
    "KMax": 0.59,
    "KSum": 13.61
  },
  {
    
    "Ind": 20151207,
    "TMin": 48.91,
    "TMax": 69.01,
    "KMin": 0.05,
    "KMax": 0.277,
    "KSum": 11
  },
  {
    
    "Ind": 20151208,
    "TMin": 49.62,
    "TMax": 71.57,
    "KMin": 0.046,
    "KMax": 0.823,
    "KSum": 14.27
  },
  {
    
    "Ind": 20151209,
    "TMin": 53.25,
    "TMax": 75,
    "KMin": 0.044,
    "KMax": 1.433,
    "KSum": 14.41
  },
  {
    
    "Ind": 20151210,
    "TMin": 58.25,
    "TMax": 78.53,
    "KMin": 0.048,
    "KMax": 1.362,
    "KSum": 28.28
  },
  {
    
    "Ind": 20151211,
    "TMin": 69.84,
    "TMax": 80.14,
    "KMin": 0.062,
    "KMax": 1.406,
    "KSum": 38.13
  },
  {
    
    "Ind": 20151212,
    "TMin": 71.45,
    "TMax": 76.57,
    "KMin": 0.051,
    "KMax": 1.81,
    "KSum": 43.59
  },
  {
    
    "Ind": 20151213,
    "TMin": 50.91,
    "TMax": 73.43,
    "KMin": 0.049,
    "KMax": 1.203,
    "KSum": 26.77
  },
  {
    
    "Ind": 20151214,
    "TMin": 50.6,
    "TMax": 72.23,
    "KMin": 0.036,
    "KMax": 0.255,
    "KSum": 11.08
  },
  {
    
    "Ind": 20151215,
    "TMin": 54.7,
    "TMax": 75.06,
    "KMin": 0.039,
    "KMax": 0.253,
    "KSum": 14.16
  },
  {
    
    "Ind": 20151216,
    "TMin": 53.16,
    "TMax": 72.24,
    "KMin": 0.035,
    "KMax": 1.124,
    "KSum": 13.21
  },
  {
    
    "Ind": 20151217,
    "TMin": 45.64,
    "TMax": 63.01,
    "KMin": 0.035,
    "KMax": 0.368,
    "KSum": 10.87
  },
  {
    
    "Ind": 20151218,
    "TMin": 42.89,
    "TMax": 60.2,
    "KMin": 0.036,
    "KMax": 0.239,
    "KSum": 8.99
  },
  {
    
    "Ind": 20151219,
    "TMin": 43.4,
    "TMax": 62.16,
    "KMin": 0.035,
    "KMax": 0.165,
    "KSum": 8.73
  },
  {
    
    "Ind": 20151220,
    "TMin": 52.73,
    "TMax": 69.05,
    "KMin": 0.035,
    "KMax": 0.15,
    "KSum": 7.42
  },
  {
    
    "Ind": 20151221,
    "TMin": 64.04,
    "TMax": 74.6,
    "KMin": 0.053,
    "KMax": 0.148,
    "KSum": 7.9
  },
  {
    
    "Ind": 20151222,
    "TMin": 58.9,
    "TMax": 72.1,
    "KMin": 0.053,
    "KMax": 0.167,
    "KSum": 8.12
  },
  {
    
    "Ind": 20151223,
    "TMin": 65.28,
    "TMax": 80.81,
    "KMin": 0.053,
    "KMax": 0.15,
    "KSum": 8.24
  },
  {
    
    "Ind": 20151224,
    "TMin": 62.79,
    "TMax": 78.82,
    "KMin": 0.053,
    "KMax": 0.145,
    "KSum": 8.41
  },
  {
    
    "Ind": 20151225,
    "TMin": 73.64,
    "TMax": 81.81,
    "KMin": 0.053,
    "KMax": 0.172,
    "KSum": 8.88
  },
  {
    
    "Ind": 20151226,
    "TMin": 74.6,
    "TMax": 78.57,
    "KMin": 0.053,
    "KMax": 0.15,
    "KSum": 8.87
  },
  {
    
    "Ind": 20151227,
    "TMin": 47.32,
    "TMax": 76.59,
    "KMin": 0.053,
    "KMax": 0.144,
    "KSum": 8.82
  },
  {
    
    "Ind": 20151228,
    "TMin": 40.03,
    "TMax": 50.63,
    "KMin": 0.054,
    "KMax": 0.2,
    "KSum": 9.9
  },
  {
    
    "Ind": 20151229,
    "TMin": 41.64,
    "TMax": 52.45,
    "KMin": 0.054,
    "KMax": 0.186,
    "KSum": 11.65
  },
  {
    
    "Ind": 20151230,
    "TMin": 49.41,
    "TMax": 55.43,
    "KMin": 0.054,
    "KMax": 0.177,
    "KSum": 10.17
  },
  {
    
    "Ind": 20151231,
    "TMin": 49.82,
    "TMax": 54.2,
    "KMin": 0.054,
    "KMax": 0.177,
    "KSum": 10.13
  },
  {
    
    "Ind": 20160101,
    "TMin": 46.21,
    "TMax": 50.21,
    "KMin": 0.054,
    "KMax": 0.227,
    "KSum": 11.66
  },
  {
    
    "Ind": 20160102,
    "TMin": 45.63,
    "TMax": 50.62,
    "KMin": 0.053,
    "KMax": 0.233,
    "KSum": 12.6
  },
  {
    
    "Ind": 20160103,
    "TMin": 43.77,
    "TMax": 60.21,
    "KMin": 0.085,
    "KMax": 0.242,
    "KSum": 13.96
  },
  {
    
    "Ind": 20160104,
    "TMin": 40.52,
    "TMax": 60.39,
    "KMin": 0.085,
    "KMax": 0.253,
    "KSum": 13.82
  },
  {
    
    "Ind": 20160105,
    "TMin": 36.98,
    "TMax": 55,
    "KMin": 0.085,
    "KMax": 0.236,
    "KSum": 14.18
  },
  {
    
    "Ind": 20160106,
    "TMin": 46.05,
    "TMax": 60.66,
    "KMin": 0.084,
    "KMax": 0.206,
    "KSum": 13.25
  },
  {
    
    "Ind": 20160107,
    "TMin": 56.01,
    "TMax": 68.18,
    "KMin": 0.084,
    "KMax": 0.177,
    "KSum": 10.96
  },
  {
    
    "Ind": 20160108,
    "TMin": 51.87,
    "TMax": 67.19,
    "KMin": 0.084,
    "KMax": 0.179,
    "KSum": 10.65
  },
  {
    
    "Ind": 20160109,
    "TMin": 42.96,
    "TMax": 62.64,
    "KMin": 0.084,
    "KMax": 0.267,
    "KSum": 12.11
  },
  {
    
    "Ind": 20160110,
    "TMin": 38.68,
    "TMax": 51.2,
    "KMin": 0.084,
    "KMax": 0.229,
    "KSum": 15.57
  },
  {
    
    "Ind": 20160111,
    "TMin": 36.69,
    "TMax": 53.35,
    "KMin": 0.084,
    "KMax": 0.258,
    "KSum": 15.16
  },
  {
    
    "Ind": 20160112,
    "TMin": 39.97,
    "TMax": 62.03,
    "KMin": 0.037,
    "KMax": 0.312,
    "KSum": 10.57
  },
  {
    
    "Ind": 20160113,
    "TMin": 41.01,
    "TMax": 63.18,
    "KMin": 0.036,
    "KMax": 0.421,
    "KSum": 11.27
  },
  {
    
    "Ind": 20160114,
    "TMin": 50.47,
    "TMax": 63.44,
    "KMin": 0.036,
    "KMax": 1.204,
    "KSum": 11.17
  },
  {
    
    "Ind": 20160115,
    "TMin": 51.89,
    "TMax": 71.39,
    "KMin": 0.041,
    "KMax": 0.327,
    "KSum": 12.36
  },
  {
    
    "Ind": 20160116,
    "TMin": 45.73,
    "TMax": 56.27,
    "KMin": 0.055,
    "KMax": 0.418,
    "KSum": 18.02
  },
  {
    
    "Ind": 20160117,
    "TMin": 39.84,
    "TMax": 55.84,
    "KMin": 0.069,
    "KMax": 1.188,
    "KSum": 17.35
  },
  {
    
    "Ind": 20160118,
    "TMin": 38.67,
    "TMax": 60.23,
    "KMin": 0.045,
    "KMax": 0.715,
    "KSum": 17.86
  },
  {
    
    "Ind": 20160119,
    "TMin": 47.2,
    "TMax": 67.01,
    "KMin": 0.045,
    "KMax": 0.307,
    "KSum": 14.49
  },
  {
    
    "Ind": 20160120,
    "TMin": 53.39,
    "TMax": 64.4,
    "KMin": 0.046,
    "KMax": 0.406,
    "KSum": 13.92
  },
  {
    
    "Ind": 20160121,
    "TMin": 44.31,
    "TMax": 71.41,
    "KMin": 0.045,
    "KMax": 0.348,
    "KSum": 13.33
  },
  {
    
    "Ind": 20160122,
    "TMin": 40.07,
    "TMax": 53.01,
    "KMin": 0.072,
    "KMax": 1.005,
    "KSum": 21.31
  },
  {
    
    "Ind": 20160123,
    "TMin": 36.06,
    "TMax": 55.49,
    "KMin": 0.048,
    "KMax": 0.283,
    "KSum": 14.96
  },
  {
    
    "Ind": 20160124,
    "TMin": 42.89,
    "TMax": 65.94,
    "KMin": 0.047,
    "KMax": 0.368,
    "KSum": 13.93
  },
  {
    
    "Ind": 20160125,
    "TMin": 57.01,
    "TMax": 73.4,
    "KMin": 0.041,
    "KMax": 0.379,
    "KSum": 13.94
  },
  {
    
    "Ind": 20160126,
    "TMin": 50.51,
    "TMax": 63.2,
    "KMin": 0.041,
    "KMax": 0.331,
    "KSum": 12.94
  },
  {
    
    "Ind": 20160127,
    "TMin": 44.54,
    "TMax": 55.86,
    "KMin": 0.052,
    "KMax": 0.392,
    "KSum": 17.21
  },
  {
    
    "Ind": 20160128,
    "TMin": 36.04,
    "TMax": 64.62,
    "KMin": 0.061,
    "KMax": 0.502,
    "KSum": 17.35
  },
  {
    
    "Ind": 20160129,
    "TMin": 44.59,
    "TMax": 72.47,
    "KMin": 0.039,
    "KMax": 0.72,
    "KSum": 14.99
  },
  {
    
    "Ind": 20160130,
    "TMin": 52.54,
    "TMax": 73.38,
    "KMin": 0.039,
    "KMax": 0.393,
    "KSum": 12.78
  },
  {
    
    "Ind": 20160131,
    "TMin": 63.3,
    "TMax": 76.59,
    "KMin": 0.045,
    "KMax": 1.437,
    "KSum": 22.69
  },
  {
    
    "Ind": 20160201,
    "TMin": 64.44,
    "TMax": 74.95,
    "KMin": 0.042,
    "KMax": 1.294,
    "KSum": 20.26
  },
  {
    
    "Ind": 20160202,
    "TMin": 57.35,
    "TMax": 73.24,
    "KMin": 0.055,
    "KMax": 1.137,
    "KSum": 19.78
  },
  {
    
    "Ind": 20160203,
    "TMin": 46.85,
    "TMax": 60.81,
    "KMin": 0.049,
    "KMax": 0.575,
    "KSum": 14.97
  },
  {
    
    "Ind": 20160204,
    "TMin": 39.71,
    "TMax": 57.41,
    "KMin": 0.06,
    "KMax": 0.403,
    "KSum": 17.62
  },
  {
    
    "Ind": 20160205,
    "TMin": 39.9,
    "TMax": 56.97,
    "KMin": 0.055,
    "KMax": 0.967,
    "KSum": 19.59
  },
  {
    
    "Ind": 20160206,
    "TMin": 44.21,
    "TMax": 59.37,
    "KMin": 0.043,
    "KMax": 0.388,
    "KSum": 15.26
  },
  {
    
    "Ind": 20160207,
    "TMin": 38.23,
    "TMax": 63.56,
    "KMin": 0.078,
    "KMax": 0.558,
    "KSum": 20.25
  },
  {
    
    "Ind": 20160208,
    "TMin": 47.08,
    "TMax": 62.02,
    "KMin": 0.047,
    "KMax": 0.572,
    "KSum": 16.84
  },
  {
    
    "Ind": 20160209,
    "TMin": 42.32,
    "TMax": 64.8,
    "KMin": 0.05,
    "KMax": 0.483,
    "KSum": 19.76
  },
  {
    
    "Ind": 20160210,
    "TMin": 44.39,
    "TMax": 67.18,
    "KMin": 0.049,
    "KMax": 0.744,
    "KSum": 16.41
  },
  {
    
    "Ind": 20160211,
    "TMin": 55.02,
    "TMax": 76.8,
    "KMin": 0.048,
    "KMax": 1.172,
    "KSum": 14.75
  },
  {
    
    "Ind": 20160212,
    "TMin": 56.4,
    "TMax": 78.01,
    "KMin": 0.046,
    "KMax": 1.159,
    "KSum": 18.03
  },
  {
    
    "Ind": 20160213,
    "TMin": 56.49,
    "TMax": 65.29,
    "KMin": 0.045,
    "KMax": 0.438,
    "KSum": 13.73
  },
  {
    
    "Ind": 20160214,
    "TMin": 57.9,
    "TMax": 71.77,
    "KMin": 0.042,
    "KMax": 1.176,
    "KSum": 18.17
  },
  {
    
    "Ind": 20160215,
    "TMin": 55.4,
    "TMax": 75,
    "KMin": 0.049,
    "KMax": 0.59,
    "KSum": 19.86
  },
  {
    
    "Ind": 20160216,
    "TMin": 49.35,
    "TMax": 79,
    "KMin": 0.042,
    "KMax": 0.33,
    "KSum": 11.95
  },
  {
    
    "Ind": 20160217,
    "TMin": 52.75,
    "TMax": 70.71,
    "KMin": 0.042,
    "KMax": 0.382,
    "KSum": 11.73
  },
  {
    
    "Ind": 20160218,
    "TMin": 50.53,
    "TMax": 74.13,
    "KMin": 0.043,
    "KMax": 0.297,
    "KSum": 12
  },
  {
    
    "Ind": 20160219,
    "TMin": 62.88,
    "TMax": 77.33,
    "KMin": 0.044,
    "KMax": 1.332,
    "KSum": 16.43
  },
  {
    
    "Ind": 20160220,
    "TMin": 62.72,
    "TMax": 76.17,
    "KMin": 0.041,
    "KMax": 0.84,
    "KSum": 22
  },
  {
    
    "Ind": 20160221,
    "TMin": 66.05,
    "TMax": 73,
    "KMin": 0.047,
    "KMax": 1.15,
    "KSum": 24.35
  },
  {
    
    "Ind": 20160222,
    "TMin": 62.87,
    "TMax": 69.62,
    "KMin": 0.048,
    "KMax": 0.783,
    "KSum": 16.59
  },
  {
    
    "Ind": 20160223,
    "TMin": 49.48,
    "TMax": 73.23,
    "KMin": 0.048,
    "KMax": 0.786,
    "KSum": 15.39
  },
  {
    
    "Ind": 20160224,
    "TMin": 44.14,
    "TMax": 62.24,
    "KMin": 0.051,
    "KMax": 0.583,
    "KSum": 16.27
  },
  {
    
    "Ind": 20160225,
    "TMin": 42.49,
    "TMax": 70.58,
    "KMin": 0.049,
    "KMax": 0.494,
    "KSum": 15.53
  },
  {
    
    "Ind": 20160226,
    "TMin": 44.31,
    "TMax": 62.63,
    "KMin": 0.049,
    "KMax": 0.303,
    "KSum": 14.53
  },
  {
    
    "Ind": 20160227,
    "TMin": 44.62,
    "TMax": 68.14,
    "KMin": 0.047,
    "KMax": 0.471,
    "KSum": 15.03
  },
  {
    
    "Ind": 20160228,
    "TMin": 52.2,
    "TMax": 72.43,
    "KMin": 0.043,
    "KMax": 0.315,
    "KSum": 11.97
  },
  {
    
    "Ind": 20160229,
    "TMin": 61.72,
    "TMax": 74.96,
    "KMin": 0.043,
    "KMax": 1.337,
    "KSum": 21
  },
  {
    
    "Ind": 20160301,
    "TMin": 60.47,
    "TMax": 77.42,
    "KMin": 0.043,
    "KMax": 1.045,
    "KSum": 22.28
  },
  {
    
    "Ind": 20160302,
    "TMin": 54.89,
    "TMax": 66.59,
    "KMin": 0.044,
    "KMax": 0.586,
    "KSum": 14.12
  },
  {
    
    "Ind": 20160303,
    "TMin": 64.87,
    "TMax": 83.42,
    "KMin": 0.043,
    "KMax": 1.331,
    "KSum": 22.96
  },
  {
    
    "Ind": 20160304,
    "TMin": 52.98,
    "TMax": 72.21,
    "KMin": 0.044,
    "KMax": 0.676,
    "KSum": 12.94
  },
  {
    
    "Ind": 20160305,
    "TMin": 51.19,
    "TMax": 74.57,
    "KMin": 0.039,
    "KMax": 0.631,
    "KSum": 10.61
  },
  {
    
    "Ind": 20160306,
    "TMin": 54.26,
    "TMax": 72.99,
    "KMin": 0.046,
    "KMax": 1.01,
    "KSum": 17.47
  },
  {
    
    "Ind": 20160307,
    "TMin": 62.53,
    "TMax": 73.17,
    "KMin": 0.042,
    "KMax": 1.5,
    "KSum": 21.09
  },
  {
    
    "Ind": 20160308,
    "TMin": 68.43,
    "TMax": 72.2,
    "KMin": 0.042,
    "KMax": 0.622,
    "KSum": 11.96
  },
  {
    
    "Ind": 20160309,
    "TMin": 63.63,
    "TMax": 73.04,
    "KMin": 0.042,
    "KMax": 0.133,
    "KSum": 7.52
  },
  {
    
    "Ind": 20160310,
    "TMin": 63.63,
    "TMax": 73.61,
    "KMin": 0.041,
    "KMax": 0.195,
    "KSum": 7.52
  },
  {
    
    "Ind": 20160311,
    "TMin": 63.64,
    "TMax": 74.19,
    "KMin": 0.041,
    "KMax": 1.201,
    "KSum": 10.95
  },
  {
    
    "Ind": 20160312,
    "TMin": 63.3,
    "TMax": 74.84,
    "KMin": 0.042,
    "KMax": 0.972,
    "KSum": 22.71
  },
  {
    
    "Ind": 20160313,
    "TMin": 59.91,
    "TMax": 80.82,
    "KMin": 0.053,
    "KMax": 1.183,
    "KSum": 18.1
  },
  {
    
    "Ind": 20160314,
    "TMin": 61.65,
    "TMax": 85,
    "KMin": 0.041,
    "KMax": 1.278,
    "KSum": 22.53
  },
  {
    
    "Ind": 20160315,
    "TMin": 67.42,
    "TMax": 83.01,
    "KMin": 0.041,
    "KMax": 0.77,
    "KSum": 13.72
  },
  {
    
    "Ind": 20160316,
    "TMin": 67.51,
    "TMax": 77.58,
    "KMin": 0.058,
    "KMax": 0.558,
    "KSum": 12.82
  },
  {
    
    "Ind": 20160317,
    "TMin": 68.73,
    "TMax": 79.79,
    "KMin": 0.046,
    "KMax": 0.536,
    "KSum": 13.34
  },
  {
    
    "Ind": 20160318,
    "TMin": 67.86,
    "TMax": 81.58,
    "KMin": 0.041,
    "KMax": 0.532,
    "KSum": 14.07
  },
  {
    
    "Ind": 20160319,
    "TMin": 55.76,
    "TMax": 70.23,
    "KMin": 0.04,
    "KMax": 0.368,
    "KSum": 7.46
  },
  {
    
    "Ind": 20160320,
    "TMin": 46.87,
    "TMax": 61.41,
    "KMin": 0.04,
    "KMax": 0.185,
    "KSum": 7.63
  },
  {
    
    "Ind": 20160321,
    "TMin": 40.77,
    "TMax": 62.76,
    "KMin": 0.041,
    "KMax": 0.16,
    "KSum": 8.33
  },
  {
    
    "Ind": 20160322,
    "TMin": 48.85,
    "TMax": 69.59,
    "KMin": 0.041,
    "KMax": 0.15,
    "KSum": 7.33
  },
  {
    
    "Ind": 20160323,
    "TMin": 63,
    "TMax": 74.81,
    "KMin": 0.041,
    "KMax": 0.14,
    "KSum": 6.75
  },
  {
    
    "Ind": 20160324,
    "TMin": 54.13,
    "TMax": 69.83,
    "KMin": 0.04,
    "KMax": 0.118,
    "KSum": 6.74
  },
  {
    
    "Ind": 20160325,
    "TMin": 46.24,
    "TMax": 68.61,
    "KMin": 0.041,
    "KMax": 0.17,
    "KSum": 7.39
  },
  {
    
    "Ind": 20160326,
    "TMin": 51.6,
    "TMax": 73.19,
    "KMin": 0.04,
    "KMax": 0.144,
    "KSum": 6.87
  },
  {
    
    "Ind": 20160327,
    "TMin": 61.24,
    "TMax": 76.38,
    "KMin": 0.046,
    "KMax": 0.117,
    "KSum": 6.96
  },
  {
    
    "Ind": 20160328,
    "TMin": 52.88,
    "TMax": 74.4,
    "KMin": 0.04,
    "KMax": 0.201,
    "KSum": 7.1
  },
  {
    
    "Ind": 20160329,
    "TMin": 63.12,
    "TMax": 69.84,
    "KMin": 0.04,
    "KMax": 0.122,
    "KSum": 7.01
  },
  {
    
    "Ind": 20160330,
    "TMin": 68.21,
    "TMax": 74.02,
    "KMin": 0.041,
    "KMax": 1.349,
    "KSum": 19.18
  },
  {
    
    "Ind": 20160331,
    "TMin": 71.66,
    "TMax": 84.42,
    "KMin": 0.101,
    "KMax": 1.505,
    "KSum": 50.37
  },
  {
    
    "Ind": 20160401,
    "TMin": 53,
    "TMax": 72.71,
    "KMin": 0.042,
    "KMax": 0.822,
    "KSum": 23.79
  },
  {
    
    "Ind": 20160402,
    "TMin": 48.02,
    "TMax": 71.2,
    "KMin": 0.039,
    "KMax": 0.352,
    "KSum": 12.17
  },
  {
    
    "Ind": 20160403,
    "TMin": 48.47,
    "TMax": 73.62,
    "KMin": 0.057,
    "KMax": 0.634,
    "KSum": 18.13
  },
  {
    
    "Ind": 20160404,
    "TMin": 52.86,
    "TMax": 79.61,
    "KMin": 0.059,
    "KMax": 1.553,
    "KSum": 31.24
  },
  {
    
    "Ind": 20160405,
    "TMin": 55.31,
    "TMax": 79.16,
    "KMin": 0.069,
    "KMax": 1.465,
    "KSum": 37.52
  },
  {
    
    "Ind": 20160406,
    "TMin": 59.17,
    "TMax": 78.24,
    "KMin": 0.06,
    "KMax": 1.062,
    "KSum": 33.08
  },
  {
    
    "Ind": 20160407,
    "TMin": 53.96,
    "TMax": 83.24,
    "KMin": 0.063,
    "KMax": 1.184,
    "KSum": 31.22
  },
  {
    
    "Ind": 20160408,
    "TMin": 57.44,
    "TMax": 79.4,
    "KMin": 0.062,
    "KMax": 1.131,
    "KSum": 23.04
  },
  {
    
    "Ind": 20160409,
    "TMin": 59.6,
    "TMax": 75.82,
    "KMin": 0.054,
    "KMax": 0.769,
    "KSum": 13.06
  },
  {
    
    "Ind": 20160410,
    "TMin": 61.95,
    "TMax": 77.77,
    "KMin": 0.055,
    "KMax": 1.231,
    "KSum": 20.15
  },
  {
    
    "Ind": 20160411,
    "TMin": 69.83,
    "TMax": 78.47,
    "KMin": 0.063,
    "KMax": 1.235,
    "KSum": 37.5
  },
  {
    
    "Ind": 20160412,
    "TMin": 68.07,
    "TMax": 76.36,
    "KMin": 0.071,
    "KMax": 1.081,
    "KSum": 37.53
  },
  {
    
    "Ind": 20160413,
    "TMin": 62.81,
    "TMax": 73.44,
    "KMin": 0.06,
    "KMax": 1.38,
    "KSum": 25.38
  },
  {
    
    "Ind": 20160414,
    "TMin": 62.84,
    "TMax": 76.24,
    "KMin": 0.061,
    "KMax": 1.087,
    "KSum": 27.11
  },
  {
    
    "Ind": 20160415,
    "TMin": 61.69,
    "TMax": 75.94,
    "KMin": 0.076,
    "KMax": 1.383,
    "KSum": 34.36
  },
  {
    
    "Ind": 20160416,
    "TMin": 62.66,
    "TMax": 75.49,
    "KMin": 0.062,
    "KMax": 1.319,
    "KSum": 35.03
  },
  {
    
    "Ind": 20160417,
    "TMin": 68.63,
    "TMax": 75.57,
    "KMin": 0.065,
    "KMax": 1.087,
    "KSum": 32.46
  },
  {
    
    "Ind": 20160418,
    "TMin": 64.65,
    "TMax": 72.63,
    "KMin": 0.068,
    "KMax": 1.244,
    "KSum": 30.17
  },
  {
    
    "Ind": 20160419,
    "TMin": 66.25,
    "TMax": 78.07,
    "KMin": 0.061,
    "KMax": 1.139,
    "KSum": 29.79
  },
  {
    
    "Ind": 20160420,
    "TMin": 65.66,
    "TMax": 78.47,
    "KMin": 0.062,
    "KMax": 1.351,
    "KSum": 35.14
  },
  {
    
    "Ind": 20160421,
    "TMin": 63.81,
    "TMax": 73.23,
    "KMin": 0.066,
    "KMax": 1.489,
    "KSum": 28.17
  },
  {
    
    "Ind": 20160422,
    "TMin": 63.07,
    "TMax": 81.63,
    "KMin": 0.063,
    "KMax": 1.304,
    "KSum": 42.03
  },
  {
    
    "Ind": 20160423,
    "TMin": 60.97,
    "TMax": 79.62,
    "KMin": 0.057,
    "KMax": 1.223,
    "KSum": 27.98
  },
  {
    
    "Ind": 20160424,
    "TMin": 63.04,
    "TMax": 75.56,
    "KMin": 0.059,
    "KMax": 1.233,
    "KSum": 25.82
  },
  {
    
    "Ind": 20160425,
    "TMin": 68.69,
    "TMax": 82.39,
    "KMin": 0.058,
    "KMax": 1.328,
    "KSum": 37.92
  },
  {
    
    "Ind": 20160426,
    "TMin": 73.65,
    "TMax": 82.3,
    "KMin": 0.061,
    "KMax": 1.48,
    "KSum": 44.45
  },
  {
    
    "Ind": 20160427,
    "TMin": 63.01,
    "TMax": 83.32,
    "KMin": 0.061,
    "KMax": 1.371,
    "KSum": 42.11
  },
  {
    
    "Ind": 20160428,
    "TMin": 69.7,
    "TMax": 82.43,
    "KMin": 0.06,
    "KMax": 1.439,
    "KSum": 48.77
  },
  {
    
    "Ind": 20160429,
    "TMin": 75.05,
    "TMax": 83.98,
    "KMin": 0.046,
    "KMax": 1.354,
    "KSum": 42.53
  },
  {
    
    "Ind": 20160430,
    "TMin": 71.18,
    "TMax": 85.62,
    "KMin": 0.077,
    "KMax": 1.53,
    "KSum": 52.31
  },
  {
    
    "Ind": 20160501,
    "TMin": 73.43,
    "TMax": 82.79,
    "KMin": 0.059,
    "KMax": 1.284,
    "KSum": 36.43
  },
  {
    
    "Ind": 20160502,
    "TMin": 63.06,
    "TMax": 74.86,
    "KMin": 0.044,
    "KMax": 0.893,
    "KSum": 34.08
  },
  {
    
    "Ind": 20160503,
    "TMin": 59.44,
    "TMax": 76.03,
    "KMin": 0.062,
    "KMax": 1.072,
    "KSum": 34.98
  },
  {
    
    "Ind": 20160504,
    "TMin": 58.33,
    "TMax": 81.43,
    "KMin": 0.059,
    "KMax": 1.22,
    "KSum": 35.44
  },
  {
    
    "Ind": 20160505,
    "TMin": 63.28,
    "TMax": 85.24,
    "KMin": 0.047,
    "KMax": 1.175,
    "KSum": 32.32
  },
  {
    
    "Ind": 20160506,
    "TMin": 61.01,
    "TMax": 82.18,
    "KMin": 0.042,
    "KMax": 1.288,
    "KSum": 39.96
  },
  {
    
    "Ind": 20160507,
    "TMin": 62.24,
    "TMax": 80.77,
    "KMin": 0.045,
    "KMax": 1.352,
    "KSum": 35.2
  },
  {
    
    "Ind": 20160508,
    "TMin": 67.26,
    "TMax": 77.79,
    "KMin": 0.045,
    "KMax": 0.962,
    "KSum": 28.12
  },
  {
    
    "Ind": 20160509,
    "TMin": 71.9,
    "TMax": 81.99,
    "KMin": 0.052,
    "KMax": 1.118,
    "KSum": 34.11
  },
  {
    
    "Ind": 20160510,
    "TMin": 73.87,
    "TMax": 85.37,
    "KMin": 0.06,
    "KMax": 1.494,
    "KSum": 67.18
  },
  {
    
    "Ind": 20160511,
    "TMin": 73.94,
    "TMax": 84.97,
    "KMin": 0.056,
    "KMax": 1.488,
    "KSum": 55.53
  },
  {
    
    "Ind": 20160512,
    "TMin": 74.07,
    "TMax": 87.68,
    "KMin": 0.047,
    "KMax": 1.476,
    "KSum": 52.43
  },
  {
    
    "Ind": 20160513,
    "TMin": 72.53,
    "TMax": 86.41,
    "KMin": 0.051,
    "KMax": 1.184,
    "KSum": 39.99
  },
  {
    
    "Ind": 20160514,
    "TMin": 68.43,
    "TMax": 86,
    "KMin": 0.047,
    "KMax": 0.967,
    "KSum": 39.12
  },
  {
    
    "Ind": 20160515,
    "TMin": 68.29,
    "TMax": 79.78,
    "KMin": 0.043,
    "KMax": 0.911,
    "KSum": 30.87
  },
  {
    
    "Ind": 20160516,
    "TMin": 66.67,
    "TMax": 73.05,
    "KMin": 0.048,
    "KMax": 0.999,
    "KSum": 25.1
  },
  {
    
    "Ind": 20160517,
    "TMin": 67.63,
    "TMax": 83.38,
    "KMin": 0.05,
    "KMax": 1.201,
    "KSum": 38.36
  },
  {
    
    "Ind": 20160518,
    "TMin": 70.68,
    "TMax": 81.82,
    "KMin": 0.042,
    "KMax": 1.336,
    "KSum": 40.75
  },
  {
    
    "Ind": 20160519,
    "TMin": 65.01,
    "TMax": 72.24,
    "KMin": 0.051,
    "KMax": 1.353,
    "KSum": 31.84
  },
  {
    
    "Ind": 20160520,
    "TMin": 66.02,
    "TMax": 82.03,
    "KMin": 0.072,
    "KMax": 1.571,
    "KSum": 41.53
  },
  {
    
    "Ind": 20160521,
    "TMin": 70.24,
    "TMax": 82.59,
    "KMin": 0.08,
    "KMax": 1.405,
    "KSum": 54.01
  },
  {
    
    "Ind": 20160522,
    "TMin": 73.65,
    "TMax": 83.24,
    "KMin": 0.049,
    "KMax": 1.468,
    "KSum": 59.73
  },
  {
    
    "Ind": 20160523,
    "TMin": 72.13,
    "TMax": 83.42,
    "KMin": 0.048,
    "KMax": 1.398,
    "KSum": 50.39
  },
  {
    
    "Ind": 20160524,
    "TMin": 75.07,
    "TMax": 85.2,
    "KMin": 0.063,
    "KMax": 1.476,
    "KSum": 61.62
  },
  {
    
    "Ind": 20160525,
    "TMin": 78.65,
    "TMax": 88.36,
    "KMin": 0.074,
    "KMax": 1.527,
    "KSum": 73.89
  },
  {
    
    "Ind": 20160526,
    "TMin": 71.71,
    "TMax": 83.4,
    "KMin": 0.085,
    "KMax": 1.599,
    "KSum": 63.18
  },
  {
    
    "Ind": 20160527,
    "TMin": 65.67,
    "TMax": 82.62,
    "KMin": 0.077,
    "KMax": 1.449,
    "KSum": 48.88
  },
  {
    
    "Ind": 20160528,
    "TMin": 67.68,
    "TMax": 88,
    "KMin": 0.115,
    "KMax": 1.81,
    "KSum": 60.02
  },
  {
    
    "Ind": 20160529,
    "TMin": 73.36,
    "TMax": 86.63,
    "KMin": 0.081,
    "KMax": 1.606,
    "KSum": 67.57
  },
  {
    
    "Ind": 20160530,
    "TMin": 72.18,
    "TMax": 85.65,
    "KMin": 0.073,
    "KMax": 1.525,
    "KSum": 61.03
  },
  {
    
    "Ind": 20160531,
    "TMin": 72.35,
    "TMax": 86.84,
    "KMin": 0.088,
    "KMax": 1.508,
    "KSum": 63.85
  },
  {
    
    "Ind": 20160601,
    "TMin": 73.1,
    "TMax": 84.07,
    "KMin": 0.141,
    "KMax": 1.119,
    "KSum": 61.28
  },
  {
    
    "Ind": 20160602,
    "TMin": 67.97,
    "TMax": 77.12,
    "KMin": 0.067,
    "KMax": 1.309,
    "KSum": 48.21
  },
  {
    
    "Ind": 20160603,
    "TMin": 70.68,
    "TMax": 80.23,
    "KMin": 0.099,
    "KMax": 1.471,
    "KSum": 52.11
  },
  {
    
    "Ind": 20160604,
    "TMin": 70.05,
    "TMax": 76.05,
    "KMin": 0.061,
    "KMax": 1.164,
    "KSum": 42.69
  },
  {
    
    "Ind": 20160605,
    "TMin": 70.02,
    "TMax": 81.57,
    "KMin": 0.046,
    "KMax": 1.41,
    "KSum": 48.36
  },
  {
    
    "Ind": 20160606,
    "TMin": 72.06,
    "TMax": 87.02,
    "KMin": 0.044,
    "KMax": 1.517,
    "KSum": 54.23
  },
  {
    
    "Ind": 20160607,
    "TMin": 73.88,
    "TMax": 89.48,
    "KMin": 0.055,
    "KMax": 1.655,
    "KSum": 71.49
  },
  {
    
    "Ind": 20160608,
    "TMin": 74.37,
    "TMax": 88.82,
    "KMin": 0.041,
    "KMax": 1.544,
    "KSum": 73.28
  },
  {
    
    "Ind": 20160609,
    "TMin": 75.65,
    "TMax": 89.85,
    "KMin": 0.098,
    "KMax": 1.459,
    "KSum": 70.71
  },
  {
    
    "Ind": 20160610,
    "TMin": 75.71,
    "TMax": 89.21,
    "KMin": 0.316,
    "KMax": 1.71,
    "KSum": 86.3
  },
  {
    
    "Ind": 20160611,
    "TMin": 77.72,
    "TMax": 91.22,
    "KMin": 0.199,
    "KMax": 1.79,
    "KSum": 92.85
  },
  {
    
    "Ind": 20160612,
    "TMin": 74.37,
    "TMax": 84.56,
    "KMin": 0.07,
    "KMax": 1.658,
    "KSum": 79.14
  },
  {
    
    "Ind": 20160613,
    "TMin": 76.11,
    "TMax": 91.23,
    "KMin": 0.067,
    "KMax": 1.932,
    "KSum": 71.27
  },
  {
    
    "Ind": 20160614,
    "TMin": 78.52,
    "TMax": 91.73,
    "KMin": 0.04,
    "KMax": 1.957,
    "KSum": 78.2
  },
  {
    
    "Ind": 20160615,
    "TMin": 78.86,
    "TMax": 94.19,
    "KMin": 0.065,
    "KMax": 1.621,
    "KSum": 81.66
  },
  {
    
    "Ind": 20160616,
    "TMin": 78.62,
    "TMax": 94.8,
    "KMin": 0.149,
    "KMax": 1.701,
    "KSum": 99.08
  },
  {
    
    "Ind": 20160617,
    "TMin": 77.91,
    "TMax": 93.44,
    "KMin": 0.062,
    "KMax": 1.775,
    "KSum": 93.29
  },
  {
    
    "Ind": 20160618,
    "TMin": 75.65,
    "TMax": 94.77,
    "KMin": 0.08,
    "KMax": 1.301,
    "KSum": 70.56
  },
  {
    
    "Ind": 20160619,
    "TMin": 73.77,
    "TMax": 88.85,
    "KMin": 0.063,
    "KMax": 1.356,
    "KSum": 56.91
  },
  {
    
    "Ind": 20160620,
    "TMin": 77.98,
    "TMax": 91.84,
    "KMin": 0.05,
    "KMax": 1.733,
    "KSum": 65.9
  },
  {
    
    "Ind": 20160621,
    "TMin": 77.94,
    "TMax": 88.75,
    "KMin": 0.052,
    "KMax": 1.401,
    "KSum": 58.54
  },
  {
    
    "Ind": 20160622,
    "TMin": 78.21,
    "TMax": 91.02,
    "KMin": 0.049,
    "KMax": 1.812,
    "KSum": 64.37
  },
  {
    
    "Ind": 20160623,
    "TMin": 76.36,
    "TMax": 90.4,
    "KMin": 0.058,
    "KMax": 1.567,
    "KSum": 66.63
  },
  {
    
    "Ind": 20160624,
    "TMin": 76.23,
    "TMax": 89.41,
    "KMin": 0.052,
    "KMax": 1.681,
    "KSum": 63.71
  },
  {
    
    "Ind": 20160625,
    "TMin": 79.19,
    "TMax": 91,
    "KMin": 0.044,
    "KMax": 1.446,
    "KSum": 67.85
  },
  {
    
    "Ind": 20160626,
    "TMin": 78.96,
    "TMax": 90.88,
    "KMin": 0.089,
    "KMax": 1.448,
    "KSum": 67.26
  },
  {
    
    "Ind": 20160627,
    "TMin": 78.67,
    "TMax": 92.78,
    "KMin": 0.077,
    "KMax": 1.389,
    "KSum": 67.36
  },
  {
    
    "Ind": 20160628,
    "TMin": 74.61,
    "TMax": 92.62,
    "KMin": 0.057,
    "KMax": 1.281,
    "KSum": 56.4
  },
  {
    
    "Ind": 20160629,
    "TMin": 74.44,
    "TMax": 91.61,
    "KMin": 0.076,
    "KMax": 1.529,
    "KSum": 63.24
  },
  {
    
    "Ind": 20160630,
    "TMin": 76.52,
    "TMax": 92.84,
    "KMin": 0.051,
    "KMax": 1.957,
    "KSum": 67.72
  },
  {
    
    "Ind": 20160701,
    "TMin": 79.16,
    "TMax": 91.82,
    "KMin": 0.049,
    "KMax": 1.52,
    "KSum": 65.89
  },
  {
    
    "Ind": 20160702,
    "TMin": 78.96,
    "TMax": 94.01,
    "KMin": 0.047,
    "KMax": 1.47,
    "KSum": 64.4
  },
  {
    
    "Ind": 20160703,
    "TMin": 79.53,
    "TMax": 93.41,
    "KMin": 0.058,
    "KMax": 1.499,
    "KSum": 67.44
  },
  {
    
    "Ind": 20160704,
    "TMin": 81.7,
    "TMax": 93.38,
    "KMin": 0.048,
    "KMax": 1.62,
    "KSum": 67.93
  },
  {
    
    "Ind": 20160705,
    "TMin": 82.25,
    "TMax": 93.4,
    "KMin": 0.046,
    "KMax": 1.581,
    "KSum": 69.33
  },
  {
    
    "Ind": 20160706,
    "TMin": 81.27,
    "TMax": 92.78,
    "KMin": 0.048,
    "KMax": 1.473,
    "KSum": 67.49
  },
  {
    
    "Ind": 20160707,
    "TMin": 80.72,
    "TMax": 93.75,
    "KMin": 0.042,
    "KMax": 1.505,
    "KSum": 62.79
  },
  {
    
    "Ind": 20160708,
    "TMin": 80.32,
    "TMax": 94.16,
    "KMin": 0.038,
    "KMax": 1.475,
    "KSum": 64.44
  },
  {
    
    "Ind": 20160709,
    "TMin": 79.56,
    "TMax": 94.34,
    "KMin": 0.043,
    "KMax": 1.518,
    "KSum": 64.53
  },
  {
    
    "Ind": 20160710,
    "TMin": 80.4,
    "TMax": 93.44,
    "KMin": 0.039,
    "KMax": 1.538,
    "KSum": 59.27
  },
  {
    
    "Ind": 20160711,
    "TMin": 81.09,
    "TMax": 93.57,
    "KMin": 0.038,
    "KMax": 1.689,
    "KSum": 87.96
  },
  {
    
    "Ind": 20160712,
    "TMin": 80.33,
    "TMax": 93.76,
    "KMin": 0.049,
    "KMax": 1.638,
    "KSum": 74.77
  },
  {
    
    "Ind": 20160713,
    "TMin": 80.72,
    "TMax": 94.56,
    "KMin": 0.043,
    "KMax": 1.627,
    "KSum": 79.25
  },
  {
    
    "Ind": 20160714,
    "TMin": 79.64,
    "TMax": 95.36,
    "KMin": 0.06,
    "KMax": 1.875,
    "KSum": 84.35
  },
  {
    
    "Ind": 20160715,
    "TMin": 79.76,
    "TMax": 97.01,
    "KMin": 0.058,
    "KMax": 1.748,
    "KSum": 82.57
  },
  {
    
    "Ind": 20160716,
    "TMin": 78.97,
    "TMax": 94.7,
    "KMin": 0.049,
    "KMax": 1.884,
    "KSum": 84.57
  },
  {
    
    "Ind": 20160717,
    "TMin": 78.52,
    "TMax": 90.48,
    "KMin": 0.095,
    "KMax": 1.343,
    "KSum": 67.43
  },
  {
    
    "Ind": 20160718,
    "TMin": 79.22,
    "TMax": 91.65,
    "KMin": 0.05,
    "KMax": 1.361,
    "KSum": 55.52
  },
  {
    
    "Ind": 20160719,
    "TMin": 79.91,
    "TMax": 90.21,
    "KMin": 0.055,
    "KMax": 1.422,
    "KSum": 52.87
  },
  {
    
    "Ind": 20160720,
    "TMin": 79.13,
    "TMax": 94.6,
    "KMin": 0.076,
    "KMax": 1.841,
    "KSum": 64.51
  },
  {
    
    "Ind": 20160721,
    "TMin": 78.45,
    "TMax": 97.71,
    "KMin": 0.055,
    "KMax": 1.931,
    "KSum": 88.3
  },
  {
    
    "Ind": 20160722,
    "TMin": 79.2,
    "TMax": 96.48,
    "KMin": 0.046,
    "KMax": 1.961,
    "KSum": 79.7
  },
  {
    
    "Ind": 20160723,
    "TMin": 79.39,
    "TMax": 97.51,
    "KMin": 0.07,
    "KMax": 1.696,
    "KSum": 78.67
  },
  {
    
    "Ind": 20160724,
    "TMin": 79.96,
    "TMax": 97.42,
    "KMin": 0.053,
    "KMax": 1.498,
    "KSum": 70.02
  },
  {
    
    "Ind": 20160725,
    "TMin": 77.64,
    "TMax": 94.28,
    "KMin": 0.081,
    "KMax": 1.515,
    "KSum": 63.89
  },
  {
    
    "Ind": 20160726,
    "TMin": 75.72,
    "TMax": 83.62,
    "KMin": 0.052,
    "KMax": 1.345,
    "KSum": 43.55
  },
  {
    
    "Ind": 20160727,
    "TMin": 76.21,
    "TMax": 89.12,
    "KMin": 0.045,
    "KMax": 1.703,
    "KSum": 51.39
  },
  {
    
    "Ind": 20160728,
    "TMin": 78.07,
    "TMax": 89.12,
    "KMin": 0.04,
    "KMax": 1.313,
    "KSum": 52.1
  },
  {
    
    "Ind": 20160729,
    "TMin": 80.13,
    "TMax": 95.36,
    "KMin": 0.056,
    "KMax": 1.34,
    "KSum": 55.76
  },
  {
    
    "Ind": 20160730,
    "TMin": 79.98,
    "TMax": 97.39,
    "KMin": 0.044,
    "KMax": 1.213,
    "KSum": 51.01
  },
  {
    
    "Ind": 20160731,
    "TMin": 80.43,
    "TMax": 93.64,
    "KMin": 0.051,
    "KMax": 1.47,
    "KSum": 62.11
  },
  {
    
    "Ind": 20160801,
    "TMin": 79.63,
    "TMax": 98.04,
    "KMin": 0.063,
    "KMax": 1.7,
    "KSum": 75.02
  },
  {
    
    "Ind": 20160802,
    "TMin": 80.14,
    "TMax": 94.79,
    "KMin": 0.048,
    "KMax": 1.573,
    "KSum": 79.14
  },
  {
    
    "Ind": 20160803,
    "TMin": 80.36,
    "TMax": 97.43,
    "KMin": 0.072,
    "KMax": 1.77,
    "KSum": 75.61
  },
  {
    
    "Ind": 20160804,
    "TMin": 78.74,
    "TMax": 97.63,
    "KMin": 0.045,
    "KMax": 1.928,
    "KSum": 71.5
  },
  {
    
    "Ind": 20160805,
    "TMin": 80.64,
    "TMax": 97.59,
    "KMin": 0.072,
    "KMax": 1.615,
    "KSum": 74.39
  },
  {
    
    "Ind": 20160806,
    "TMin": 80.45,
    "TMax": 98.73,
    "KMin": 0.06,
    "KMax": 1.619,
    "KSum": 81.47
  },
  {
    
    "Ind": 20160807,
    "TMin": 80.78,
    "TMax": 98.71,
    "KMin": 0.09,
    "KMax": 1.604,
    "KSum": 81.47
  },
  {
    
    "Ind": 20160808,
    "TMin": 80.22,
    "TMax": 99.3,
    "KMin": 0.052,
    "KMax": 1.519,
    "KSum": 69.96
  },
  {
    
    "Ind": 20160809,
    "TMin": 80.49,
    "TMax": 99.08,
    "KMin": 0.04,
    "KMax": 1.659,
    "KSum": 70.05
  },
  {
    
    "Ind": 20160810,
    "TMin": 81.56,
    "TMax": 98.79,
    "KMin": 0.04,
    "KMax": 1.635,
    "KSum": 71.31
  },
  {
    
    "Ind": 20160811,
    "TMin": 81.12,
    "TMax": 98.96,
    "KMin": 0.082,
    "KMax": 1.477,
    "KSum": 68.29
  },
  {
    
    "Ind": 20160812,
    "TMin": 80.9,
    "TMax": 96.34,
    "KMin": 0.07,
    "KMax": 1.483,
    "KSum": 64.9
  },
  {
    
    "Ind": 20160813,
    "TMin": 75.19,
    "TMax": 95.86,
    "KMin": 0.089,
    "KMax": 1.39,
    "KSum": 55.89
  },
  {
    
    "Ind": 20160814,
    "TMin": 75.31,
    "TMax": 88.86,
    "KMin": 0.062,
    "KMax": 0.965,
    "KSum": 35.61
  },
  {
    
    "Ind": 20160815,
    "TMin": 74.93,
    "TMax": 85.47,
    "KMin": 0.063,
    "KMax": 1.299,
    "KSum": 36.47
  },
  {
    
    "Ind": 20160816,
    "TMin": 75.23,
    "TMax": 84.65,
    "KMin": 0.079,
    "KMax": 1.255,
    "KSum": 33.79
  },
  {
    
    "Ind": 20160817,
    "TMin": 73.4,
    "TMax": 82.29,
    "KMin": 0.064,
    "KMax": 0.953,
    "KSum": 33.03
  },
  {
    
    "Ind": 20160818,
    "TMin": 75.31,
    "TMax": 84.43,
    "KMin": 0.048,
    "KMax": 0.999,
    "KSum": 34.49
  },
  {
    
    "Ind": 20160819,
    "TMin": 77.1,
    "TMax": 90.36,
    "KMin": 0.049,
    "KMax": 1.239,
    "KSum": 44.93
  },
  {
    
    "Ind": 20160820,
    "TMin": 76.74,
    "TMax": 88.58,
    "KMin": 0.065,
    "KMax": 1.658,
    "KSum": 60.94
  },
  {
    
    "Ind": 20160821,
    "TMin": 76.8,
    "TMax": 83.6,
    "KMin": 0.059,
    "KMax": 1.318,
    "KSum": 51.55
  },
  {
    
    "Ind": 20160822,
    "TMin": 73.44,
    "TMax": 85.76,
    "KMin": 0.039,
    "KMax": 1.304,
    "KSum": 47.67
  },
  {
    
    "Ind": 20160823,
    "TMin": 78.77,
    "TMax": 91.94,
    "KMin": 0.055,
    "KMax": 1.419,
    "KSum": 53.87
  },
  {
    
    "Ind": 20160824,
    "TMin": 78.77,
    "TMax": 92.8,
    "KMin": 0.044,
    "KMax": 1.44,
    "KSum": 61.59
  },
  {
    
    "Ind": 20160825,
    "TMin": 77.53,
    "TMax": 92.65,
    "KMin": 0.042,
    "KMax": 1.278,
    "KSum": 44.95
  },
  {
    
    "Ind": 20160826,
    "TMin": 75.44,
    "TMax": 89.39,
    "KMin": 0.039,
    "KMax": 1.268,
    "KSum": 52.65
  },
  {
    
    "Ind": 20160827,
    "TMin": 75.41,
    "TMax": 89.48,
    "KMin": 0.045,
    "KMax": 1.214,
    "KSum": 48.09
  },
  {
    
    "Ind": 20160828,
    "TMin": 75,
    "TMax": 86.52,
    "KMin": 0.037,
    "KMax": 1.114,
    "KSum": 45
  },
  {
    
    "Ind": 20160829,
    "TMin": 75,
    "TMax": 81.55,
    "KMin": 0.057,
    "KMax": 1.287,
    "KSum": 40.65
  },
  {
    
    "Ind": 20160830,
    "TMin": 74.82,
    "TMax": 90.45,
    "KMin": 0.055,
    "KMax": 1.403,
    "KSum": 48.3
  },
  {
    
    "Ind": 20160831,
    "TMin": 77.84,
    "TMax": 93.05,
    "KMin": 0.044,
    "KMax": 1.445,
    "KSum": 59.07
  },
  {
    
    "Ind": 20160901,
    "TMin": 78.38,
    "TMax": 95.44,
    "KMin": 0.051,
    "KMax": 1.509,
    "KSum": 65.51
  },
  {
    
    "Ind": 20160902,
    "TMin": 77.09,
    "TMax": 93,
    "KMin": 0.044,
    "KMax": 1.795,
    "KSum": 66.73
  },
  {
    
    "Ind": 20160903,
    "TMin": 76.07,
    "TMax": 92.66,
    "KMin": 0.061,
    "KMax": 1.414,
    "KSum": 62.87
  },
  {
    
    "Ind": 20160904,
    "TMin": 76.65,
    "TMax": 92.25,
    "KMin": 0.067,
    "KMax": 1.504,
    "KSum": 56.23
  },
  {
    
    "Ind": 20160905,
    "TMin": 78.83,
    "TMax": 90.1,
    "KMin": 0.07,
    "KMax": 1.915,
    "KSum": 58.53
  },
  {
    
    "Ind": 20160906,
    "TMin": 78.71,
    "TMax": 92.46,
    "KMin": 0.048,
    "KMax": 1.506,
    "KSum": 69.34
  },
  {
    
    "Ind": 20160907,
    "TMin": 76.88,
    "TMax": 93.69,
    "KMin": 0.049,
    "KMax": 1.515,
    "KSum": 61.76
  },
  {
    
    "Ind": 20160908,
    "TMin": 77.16,
    "TMax": 91.99,
    "KMin": 0.047,
    "KMax": 1.331,
    "KSum": 61.38
  },
  {
    
    "Ind": 20160909,
    "TMin": 76.6,
    "TMax": 89.33,
    "KMin": 0.059,
    "KMax": 1.31,
    "KSum": 45.19
  },
  {
    
    "Ind": 20160910,
    "TMin": 75.61,
    "TMax": 85.24,
    "KMin": 0.04,
    "KMax": 0.846,
    "KSum": 26.75
  },
  {
    
    "Ind": 20160911,
    "TMin": 72.53,
    "TMax": 89.74,
    "KMin": 0.04,
    "KMax": 1.008,
    "KSum": 34.37
  },
  {
    
    "Ind": 20160912,
    "TMin": 74.09,
    "TMax": 90.55,
    "KMin": 0.044,
    "KMax": 1.709,
    "KSum": 45.1
  },
  {
    
    "Ind": 20160913,
    "TMin": 75.24,
    "TMax": 89.54,
    "KMin": 0.055,
    "KMax": 1.469,
    "KSum": 52.52
  },
  {
    
    "Ind": 20160914,
    "TMin": 75.48,
    "TMax": 91.59,
    "KMin": 0.044,
    "KMax": 1.477,
    "KSum": 55.31
  },
  {
    
    "Ind": 20160915,
    "TMin": 75.76,
    "TMax": 92.49,
    "KMin": 0.066,
    "KMax": 1.412,
    "KSum": 58.98
  },
  {
    
    "Ind": 20160916,
    "TMin": 77.61,
    "TMax": 89.29,
    "KMin": 0.058,
    "KMax": 1.634,
    "KSum": 65.09
  },
  {
    
    "Ind": 20160917,
    "TMin": 76.65,
    "TMax": 93.33,
    "KMin": 0.052,
    "KMax": 1.408,
    "KSum": 62.57
  },
  {
    
    "Ind": 20160918,
    "TMin": 77.65,
    "TMax": 95.95,
    "KMin": 0.046,
    "KMax": 1.664,
    "KSum": 73.02
  }
  ]
  }
}
  }
}
