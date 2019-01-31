/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * Copyright 2002-2017, Carrot Search s.c, All Rights Reserved.
 *
 *
 * Drives FoamTree to create a demo of some of FoamTree's features.
 * Study the code for advanced usage of FoamTree API.
 *
 * Please see index.html for the usage example.
 */
var CarrotSearchFoamTreeDemo = function(options) {
  // Load some example data sets
  var topicsData, domainsData, censusData, tagsData;
  JSONP.load("demos/assets/data/data-mining-100-topic-hierarchical.js", "modelDataAvailable", function (data) {
    topicsData = data;
  });
  JSONP.load("demos/assets/data/data-mining-100-url-hierarchical.js", "modelDataAvailable", function (data) {
    domainsData = data;
  });
  JSONP.load("demos/assets/data/census-foamtree.js", "modelDataAvailable", function (data) {
    censusData = data;
  });
  JSONP.load("demos/assets/data/tags.js", "modelDataAvailable", function (data) {
    tagsData = data;
  });

  // The FoamtTree instance this demo will be driving
  var foamtree = options.foamtree;

  // We'll need it for animations
  var requestAnimationFrame =
    window["requestAnimationFrame"] ||
    window["webkitRequestAnimationFrame"] ||
    window["mozRequestAnimationFrame"] ||
    window["oRequestAnimationFrame"] ||
    window["msRequestAnimationFrame"] ||
    (function() {
      return function (fn) {
        var lastDuration = 0;
        window.setTimeout(function() {
          var start = Date.now();
          fn();
          lastDuration = Date.now() - start;
        }, lastDuration < 16 ? 16 - lastDuration : 0);
      };
    })();

  // A simple utility for waiting for more then one
  // asynchronously completing tasks.
  var PromiseCounter = function (done) {
    var count = 0;
    var running = false;

    function checkDone() {
      if (count === 0 && running) {
        done();
      }
    }

    this.resolver = function () {
      count++;
      return function () {
        count--;
        checkDone();
      };
    };

    this.start = function() {
      running = true;
      checkDone();
    };
  };

  // The animated radar-like group color decorator.
  var radarGroupColorDecorator = (function(foamtree) {
    var frame = 0;
    var running = false;

    var previousGroupFillType, previousGroupStrokeType;

    function decorator(opts, params, vars) {
      // We change the color only for top-level groups. For child groups,
      // FoamTree will generate brightness variations of the parent group's color.
      if (params.level == 0) {
        var delay = 10;
        var count = 3;
        var frameDiv = Math.floor(frame / delay);
        var mod = frameDiv % params.siblingCount;
        var diff = (mod - params.index + params.siblingCount) % params.siblingCount;
        if (diff < count) {
          vars.groupColor.g = 255 *
            (1 - ((diff * delay + frame % delay) / (delay * count)));
        } else {
          vars.groupColor.g = 40;
        }
        vars.groupColor.r = 40;
        vars.groupColor.b = 40;
        vars.groupColor.model = "rgb";
      }
    }

    function start() {
      previousGroupFillType = foamtree.get("groupFillType");
      previousGroupStrokeType = foamtree.get("groupStrokeType");

      foamtree.set({
        groupColorDecorator: decorator,
        groupFillType: "plain",
        groupStrokeType: "none"
      });

      // If data changes, stop the animation
      once("modelChanged", stop);

      frame = 0;
      running = true;
      requestAnimationFrame(function redraw() {
        if (!running) {
          return;
        }

        foamtree.redraw(true);
        frame++;
        requestAnimationFrame(redraw); // next frame
      });
    }

    function stop() {
      running = false;
      if (foamtree.get("groupColorDecorator") === decorator) {
        foamtree.set("groupColorDecorator", null);
      }
      foamtree.set({
        groupFillType: previousGroupFillType,
        groupStrokeType: previousGroupStrokeType
      })
    }

    return {
      start: start,
      stop: stop,
      decorator: decorator
    }
  })(foamtree);

  // The main data set that contains all elements of the demo
  var introData = {
    groups: [
      {
        id: "foamtree-is",
        type: "demo",
        label: "FoamTree is\u00a0a\u00a0hierarchical tree map",
        weight: 9,
        groups: pad(8, [
          {
            id: "with",
            label: "with",
            weight: 10,
            groups: pad(3, [
              { id:"non-rectangular-layouts", label: "non-rectangular layouts", weight: 8, groups: pad(5, [
                { label: "based on Voronoi treemaps", id: "based-on-voronoi", weight: 10 }
              ]) },
              { label: "animated interactions", id: "animated-interactions", weight: 6 },
              {
                label: "such as zooming", id: "zooming",
                weight: 4
              },
              {
                label: "and exposure",
                id: "exposing",
                weight: 5,
                groups: [
                  { label: "that"     , id: "exposing-that"      },
                  { label: "helps"    , id: "exposing-helps"     },
                  { label: "to"       , id: "exposing-to"        },
                  { label: "highlight", id: "exposing-highlight" },
                  { label: "content"  , id: "exposing-content"   },
                  { label: "of"       , id: "exposing-of"        },
                  { label: "specific" , id: "exposing-specific"  },
                  { label: "groups"   , id: "exposing-groups"    }
                ]
              }
            ])
          }
        ])
      },
      {
        id: "foamtree-can-visualize",
        type: "demo",
        label: "FoamTree can visualize...",
        weight: 5,
        groups: [
          {
            label: "Tag clouds",
            title: "Click-and-hold to load an example tag cloud data set",
            holdAction: function() {
              foamtree.set({
                dataObject: addBackGroup(tagsData),
                groupColorDecorator: backGroupColorDecorator
              });
            }
          },
          {
            label: "Topics in a set of documents",
            title: "Click-and-hold to load topics discovered by the Lingo3G clustering engine in web search results for the query \"data mining\"",
            id: "topics",
            holdAction: function() {
              foamtree.set({
                dataObject: addBackGroup(topicsData),
                groupColorDecorator: backGroupColorDecorator
              });
            }
          },
          {
            label: "Internet domains",
            title: "Click-and-hold to load web search results for query \"data mining\" grouped by domain",
            id: "domains",
            holdAction: function() {
              foamtree.set({
                dataObject: addBackGroup(domainsData),
                groupColorDecorator: backGroupColorDecorator
              });
            }
          },
          {
            label: "Statistical data",
            id: "statistical-data",
            title: "Click-and-hold to load US census data",
            holdAction: function() {
              foamtree.set({
                dataObject: addBackGroup(censusData),
                groupColorDecorator: backGroupColorDecorator
              });
            }
          }
        ]
      },
      {
        id: "layout-options",
        type: "demo",
        label: "Layout options include...",
        weight: 5,
        groups: [
          {
            label: "Large in the center",
            id: "fisheye",
            title: "Click-and-hold to put large groups in the center",
            holdAction: function() {
              setChildSelected("layout-options", "fisheye");
              changeInitializer("fisheye");
            }
          },
          {
            label: "Small in the center",
            id: "blackhole",
            title: "Click-and-hold to put small groups in the center",
            holdAction: function() {
              setChildSelected("layout-options", "blackhole");
              changeInitializer("blackhole");
            }
          },
          {
            label: "Diagonal",
            id: "diagonal",
            title: "Click-and-hold to use diagonal layout",
            holdAction: function() {
              setChildSelected("layout-options", "diagonal");
              changeInitializer("treemap");
            }
          },
          {
            label: "Dynamic relaxation",
            id: "dynamic-relaxation",
            title: "Click-and-hold to enable dynamic relaxation",
            holdAction: function() {
              foamtree.set({
                relaxationVisible: true,
                relaxationMaxDuration: 12000,
                relaxationQualityThreshold: 0.1
              });
              setChildSelected("layout-options", "dynamic-relaxation");
              changeInitializer(foamtree.get("relaxationInitializer"));
            }
          },
          {
            label: "Rectangular",
            id: "rectangular",
            title: "Click-and-hold to use rectangular layout",
            holdAction: function() {
              setChildSelected("layout-options", "rectangular");
              foamtree.set({
                layout: "squarified",
                dataObject: foamtree.get("dataObject"),
                rolloutDuration: 0,
                pullbackDuration: 0,
                fadeDuration: 0
              });
            }
          }
        ],
        open: false
      },
      {
        id: "content-customization",
        type: "demo",
        label: "Content customization",
        weight: 4.5,
        groups: [
          {
            id: "decorated-label",
            label: "Your\u00a0code can\u00a0draw custom\u00a0content in\u00a0each\u00a0cell",
            title: "Click-and-hold for a demo that displays extra information below the main labels",
            url: "demos/coverage.html",
            weight: 2,
            content: function (opts, props, vars) {
              if (props.labelDrawn) {
                var ctx = props.context;

                // Fit a box below the main label
                var box = CarrotSearchFoamTree.geometry.rectangleInPolygon(
                  props.polygon, props.polygonCenterX, props.labelBoxTop + props.labelBoxHeight,
                  10.0, 0.6, 0.5, -1);

                // Draw the box
                var margin = box.h * 0.1;
                ctx.lineWidth = margin * 0.5;
                ctx.globalAlpha = 0.5;
                ctx.roundRect(box.x, box.y, box.w, box.h, margin);
                ctx.stroke();

                ctx.globalAlpha = 0.2;
                ctx.roundRect(box.x + margin, box.y + margin, box.w * 0.95 - 2 * margin, box.h - 2 * margin, margin);
                ctx.fill();

                // Draw the label inside the bar. Some browsers draw ugly text when the font size is very small.
                // The workaround is to draw the text at a constant large size (100px in our case), but scale
                // the canvas appropriately so that the text appears at the size we really want.
                var s = box.h * 0.7 / 100;
                ctx.globalAlpha = 1.0;
                ctx.textAlign = "center";
                ctx.save();
                ctx.translate( box.x + box.w / 2, box.y + box.h * 0.75);
                ctx.scale(s, s);
                ctx.font = "100px Oxygen";
                ctx.fillText("Awesomeness: 99.5%", 0, 0);
                ctx.restore();
              }
            }
          },
          {
            id: "pie-chart",
            weight: 2,
            title: "Click-and-hold for a demo that lays out complex custom content inside FoamTree polygons",
            url: "demos/github.html",
            content: (function() {
              var cache = {};
              return function (opts, props, vars) {
                var ctx = props.context;
                var centerX = props.polygonCenterX;
                var centerY = props.polygonCenterY;

                var chartBox = CarrotSearchFoamTree.geometry.rectangleInPolygon(
                  props.polygon, centerX, centerY, 1.0, 0.9, 0.9, 0.7);

                var legendBox = CarrotSearchFoamTree.geometry.rectangleInPolygon(
                  props.polygon, centerX, centerY, 0.7, 0.9, -0.35, 0.7);

                var radius = chartBox.w / 2;
                var cx = chartBox.x + radius;
                var cy = chartBox.y + radius;

                // Increase stroke width on selection,
                // use thinner lines on lower hierarchy levels
                ctx.save();
                ctx.lineWidth = (props.selected ? 3.0 : 1.5) * Math.pow(0.5, props.level);

                var ranks = [2, 5, 6, 10, 12, 15];
                var labels = ["colors", "layout", "effects", "API", "speed", "docs"];
                var totalRank = ranks[ranks.length - 1];

                var i;
                var fontSize = legendBox.h / (1.2 * labels.length);
                for (i = 0; i < ranks.length; i++) {
                  var rank = ranks[i] / totalRank;
                  var prevRank = ranks[(i > 0 ? i : ranks.length) - 1] / totalRank;
                  ctx.beginPath();
                  ctx.moveTo(cx, cy);
                  ctx.arc(cx, cy, radius, 2 * Math.PI * prevRank, 2 * Math.PI * rank);
                  ctx.closePath();
                  ctx.fillStyle = "hsl(" + i * 360 / ranks.length + ", 80%, 50%)";
                  ctx.globalAlpha = 0.7;
                  ctx.fill();
                  ctx.fillRect(legendBox.x, legendBox.y + i * 1.2 * fontSize, fontSize, fontSize);
                }

                ctx.restore();
                ctx.font = "100px Oxygen";
                for (i = 0; i < labels.length; i++) {
                  var l = labels[i];
                  ctx.save();
                  ctx.translate(legendBox.x + fontSize * 1.5, legendBox.y + i * 1.2 * fontSize + 0.8 * fontSize);
                  ctx.scale(fontSize / 100, fontSize / 100);
                  ctx.fillText(l, 0, 0);
                  ctx.restore();
                }

                ctx.fillPolygonWithText(props.polygon, centerX, Math.max(chartBox.y + chartBox.h, legendBox.y + legendBox.h),
                  "FoamTree awesomeness factors", {
                    verticalAlign: "top",
                    fontFamily: "Oxygen",
                    cache: cache,
                    area: props.polygonArea,
                    horizontalPadding: 2
                  });
              }
            })()
          },
          {
            id: "sparkline",
            weight: 2,
            content: (function() {
              var data = [];
              var val = 0.5;
              var i;
              for (i = 0; i < 100; i++) {
                var v = Math.min(Math.max(0.1, val * 0.8 + 0.4 * Math.random()), 1.0);
                data.push(v);
                val = v;
              }
              var avgs = movingAverage(data, 1), avgs2 = movingAverage(data, 4);

              function movingAverage(data, n) {
                var avgs = [];
                for (i = 0; i < data.length; i++) {
                  var sum = 0;
                  for (j = -n; j <= n; j++) {
                    var index = Math.max(0, Math.min(data.length - 1, i + j));
                    sum += data[index];
                  }
                  avgs.push(sum / (2 * n + 1));
                }
                return avgs;
              }


              return function (opts, props, vars) {
                var ctx = props.context;
                var centerX = props.polygonCenterX;
                var centerY = props.polygonCenterY;
                var i;

                // Compute pie chart radius
                var wth = 4.0;
                var box = CarrotSearchFoamTree.geometry.rectangleInPolygon(
                  props.polygon, centerX, centerY, wth, 0.8);

                ctx.save();
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                ctx.lineWidth = 0.01;
                ctx.translate(box.x, box.y + box.h);
                ctx.scale(box.w, -box.w);

                dataPath(avgs);
                ctx.stroke();
                ctx.lineTo(1, 0);
                ctx.lineTo(0, 0);
                ctx.fill();

                ctx.lineWidth = 0.005;
                ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
                dataPath(avgs2);
                ctx.stroke();

                ctx.beginPath();
                ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
                ctx.moveTo(0, 0);
                ctx.lineTo(1, 0);
                ctx.stroke();

                ctx.restore();

                function dataPath(data) {
                  ctx.beginPath();
                  ctx.moveTo(0, data[0] / wth);
                  for (var i = 1; i < data.length; i++) {
                    ctx.lineTo(i / (data.length - 1), data[i] / wth);
                  }
                }
              }
            })()
          },
          {
            id: "image",
            weight: 2,
            title: "Click-and-hold for a demo that displays SVG images inside FoamTree polygons",
            url: "demos/images.html",
            content: (function() {
              var image = { };
              var tiger = new Image();
              tiger.onload = function() {
                image.image = tiger;
                foamtree.redraw();
              };
              tiger.src = "demos/assets/svg/tiger.svg";

              return function (opts, props, vars) {
                if (image.image) {
                  var ctx = props.context;
                  var centerX = props.polygonCenterX;
                  var centerY = props.polygonCenterY;

                  // Compute pie chart radius
                  var box = CarrotSearchFoamTree.geometry.rectangleInPolygon(
                    props.polygon, centerX, centerY, 1.0, 0.8);

                  ctx.drawImage(tiger, box.x, box.y, box.w, box.h);
                }
              }
            })()
          }
        ]
      },
      {
        id: "color-customization",
        type: "demo",
        label: "Color customization",
        weight: 5,
        groups: [
          {
            id: "rainbow",
            label: "HSL rainbow",
            weight: 2,
            groups: [
              {
                label: "Full",
                id: "full",
                title: "Click-and-hold to set the default rainbow colors",
                holdAction: function (event) {
                  radarGroupColorDecorator.stop();
                  foamtree.set(defaults);
                  foamtree.set("groupColorDecorator", null);
                  setChildSelected("color-customization", "full");
                  foamtree.redraw();
                }
              },
              {
                label: "Warm",
                id: "warm",
                run: function() {
                  foamtree.set({
                    groupSelectionFillSaturationShift: -80,
                    groupSelectionFillLightnessShift: 40,
                    rainbowColorDistribution: "linear",
                    rainbowColorDistributionAngle: 45,
                    rainbowStartColor: "hsla(60, 100%, 55%, 1)",
                    rainbowEndColor: "hsla(0, 100%, 60%, 1)"
                  });
                  foamtree.redraw();
                },
                title: "Click-and-hold to use warm colors",
                holdAction: function (event) {
                  radarGroupColorDecorator.stop();
                  foamtree.set(defaults);
                  setChildSelected("color-customization", "warm");
                  event.group.run();
                }
              },
              {
                label: "Cold",
                id: "cold",
                run: function() {
                  foamtree.set({
                    groupSelectionFillSaturationShift: -50,
                    groupSelectionFillLightnessShift: 30,
                    rainbowColorDistribution: "linear",
                    rainbowColorDistributionAngle: 45,
                    rainbowStartColor: "hsla(140, 100%, 55%, 1)",
                    rainbowEndColor: "hsla(250, 100%, 60%, 1)"
                  });
                  foamtree.redraw();
                },
                title: "Click-and-hold to use cold colors",
                holdAction: function (event) {
                  radarGroupColorDecorator.stop();
                  foamtree.set(defaults);
                  setChildSelected("color-customization", "cold");
                  event.group.run();
                }
              }
            ]
          },
          {
            id: "type",
            label: "Your own, e.g. by type",
            weight: 2,
            title: "Click-and-hold to color groups by type: links in yellow, visualization changes in red, inactive in grey",
            run: function() {
              foamtree.set({
                groupSelectionFillSaturationShift: -50,
                groupSelectionFillLightnessShift: 30,
                groupColorDecorator: function (opts, params, vars) {
                  switch (params.group.type) {
                    case "demo":
                      vars.groupColor = "hsl(0, 80%, 70%)";
                      break;

                    case "link":
                      vars.groupColor = "hsl(60, 90%, 65%)";
                      break;

                    case "inactive":
                      vars.groupColor = "hsl(90, 0%, 80%)";
                      break;
                  }
                }
              });
              foamtree.redraw();
            },
            holdAction: function (event) {
              radarGroupColorDecorator.stop();
              foamtree.set(defaults);
              setChildSelected("color-customization", "type");
              event.group.run();
            }
          },
          {
            id: "radar",
            label: "Animated!",
            title: "Click-and-hold to show an example of color animation",
            holdAction: function() {
              setChildSelected("color-customization", "radar");
              radarGroupColorDecorator.start();
            }
          }
        ]
      },
      {
        id: "appearance",
        label: "Appearance tuning",
        type: "demo",
        weight: 5,
        groups: [
          {
            label: "Border radius",
            id: "border-radius",
            title: "Click to alter group border radius",
            clickAction: (function() {
              var current = 0;
              var radii = [0, 0.3, 0.5, 0.7, 0.9];
              return function(event) {
                foamtree.set("groupBorderRadius", radii[current]);
                foamtree.redraw();
                current = (current + 1) % radii.length;
                event.preventDefault();
              };
            })()
          },
          {
            label: "Border width",
            id: "border-width",
            title: "Click to alter group border width",
            clickAction: (function() {
              var current = 0;
              var widths = [0, 2, 4, 6, 8];
              return function(event) {
                var width = widths[current];
                foamtree.set("groupBorderWidth", width);
                foamtree.set("groupInsetWidth", width * 1.5);
                foamtree.redraw(true);
                current = (current + 1) % widths.length;
                event.preventDefault();
              };
            })()
          },
          {
            label: "Fill type", id: "fill-type",
            groups: [
              {
                label: "Plain",
                id: "plain",
                title: "Click to fill group polygons with a plain color",
                clickAction: function() {
                  foamtree.set("groupFillType", "plain");
                  foamtree.redraw();
                }
              },
              {
                label: "Gradient",
                id: "gradient",
                title: "Click to fill group polygons with a gradient color",
                clickAction: function() {
                  foamtree.set("groupFillType", "gradient");
                  foamtree.set("finalCompleteDrawMaxDuration", 500);
                  foamtree.set("finalIncrementalDrawMaxDuration", 500);
                  foamtree.redraw();
                }
              },
              {
                label: "Opacity",
                id: "opacity",
                title: "Click to alter the opacity of the parent groups",
                clickAction: (function() {
                  var current = 0;
                  var opacities = [0.9, 0.7, 0.5, 0.3, 0.1];
                  return function(event) {
                    var opacity = opacities[current];
                    foamtree.set("parentFillOpacity", opacity);
                    foamtree.set("parentLabelOpacity", opacity);
                    foamtree.redraw(true);
                    current = (current + 1) % opacities.length;
                    event.preventDefault();
                  };
                })()
              }
            ]
          },
          {
            label: "Font family",
            id: "font-family",
            title: "Click to alter the font family used to draw labels",
            fontFamilies: [ "monospace", "PT Serif", "sans-serif", "Oxygen" ],
            clickAction: (function() {
              var current = 0;
              return function(event) {
                var families = findById(introData, "font-family").fontFamilies;
                var fontFamily = families[current];
                foamtree.set("groupLabelFontFamily", fontFamily);
                foamtree.redraw(true);
                current = (current + 1) % families.length;
                event.preventDefault();
              };
            })()
          },
          {
            label: "Font size",
            id: "font-size",
            title: "Click to alter the label size",
            clickAction: (function() {
              var current = 0;
              var heights = [0.2, 0.4, 0.6, 0.8, 1];
              return function(event) {
                var height = heights[current];
                foamtree.set("groupLabelMaxTotalHeight", height);
                foamtree.redraw(true);
                current = (current + 1) % heights.length;
                event.preventDefault();
              };
            })()
          },
          {
            label: "And a lot more!",
            title: "Click-and-hold to go to FoamTree settings panel where you will be able to experiment with a lot more settings",
            url: "demos/settings.html"
          }
        ]
      },
      {
        id: "effects",
        label: "Effects",
        type: "demo",
        weight: 5,
        groups: [
          {
            label: "Fading",
            id: "fading",
            title: "Click-and-hold to see the simple fading effect",
            holdAction: function() {
              foamtree.set({
                dataObject: addBackGroup(randomGroups(50)),
                groupColorDecorator: backGroupColorDecorator,
                rolloutDuration: 0,
                pullbackDuration: 0,
                fadeDuration: 1000
              });
            }
          },
          {
            label: "Gentle scaling",
            id: "scaling",
            title: "Click-and-hold to see the gentle scaling effect",
            holdAction: function() {
              foamtree.set({
                dataObject: addBackGroup(randomGroups(50)),
                groupColorDecorator: backGroupColorDecorator,
                rolloutDuration: 2000,
                rolloutEasing: "squareInOut",
                rolloutScalingStrength: -0.3,
                rolloutRotationStrength: 0,
                pullbackEasing: "squareInOut",
                pullbackDuration: 2000,
                pullbackScalingStrength: -0.3,
                pullbackRotationStrength: 0,
                pullbackPolygonDelay: 0.1
              });
            }
          },
          {
            label: "Bouncy rotation",
            id: "rotation",
            title: "Click-and-hold to see the bouncy rotation effect",
            holdAction: function() {
              foamtree.set({
                dataObject: addBackGroup(randomGroups(50)),
                groupColorDecorator: backGroupColorDecorator,
                rolloutEasing: "bounce",
                rolloutDuration: 4000,
                rolloutScalingStrength: -0.65,
                rolloutRotationStrength: 0.7,
                rolloutTransformationCenter: 1,
                pullbackEasing: "bounce",
                pullbackDuration: 4000,
                pullbackScalingStrength: -0.65,
                pullbackRotationStrength: 0.7,
                pullbackTransformationCenter: 1,
                pullbackPolygonDelay: 1
              });
            }
          },
          {
            label: "Ripple",
            id: "ripple",
            title: "Click-and-hold to see the ripple effect",
            holdAction: function() {
              foamtree.set({
                dataObject: addBackGroup(randomGroups(50)),
                groupColorDecorator: backGroupColorDecorator,
                rolloutDuration: 6000,
                rolloutEasing: "bounce",
                rolloutScalingStrength: -0.4,
                rolloutRotationStrength: 0,
                rolloutPolygonDrag: 0.08,
                pullbackDuration: 3000,
                pullbackEasing: "quadOut",
                pullbackScalingStrength: -0.4,
                pullbackRotationStrength: 0,
                pullbackPolygonDrag: 0.08
              });
            }
          },
          {
            label: "Flyout",
            id: "flyout",
            title: "Click-and-hold to see the flyout effect",
            holdAction: function() {
              foamtree.set({
                dataObject: addBackGroup(randomGroups(50)),
                groupColorDecorator: backGroupColorDecorator,
                rolloutEasing: "squareOut",
                rolloutScalingStrength: 1,
                rolloutDuration: 4000,
                rolloutRotationStrength: 0,
                rolloutTransformationCenter: 0,
                pullbackScalingStrength: 0.5,
                pullbackDuration: 2500,
                pullbackEasing: "quadOut",
                pullbackRotationStrength: 0,
                pullbackTransformationCenter: 0
              });
            }
          },
          {
            label: "You can create your own too!",
            title: "Click-and-hold to go to FoamTree settings panel where you will be able to create your own effects",
            url: "demos/settings.html"
          }
        ]
      },
      {
        label: "Multilingual",
        type: "inactive",
        weight: 5,
        groups: [
          { label: "可視化" },
          { label: "दृश्य" },
          { label: "تصور" },
          { label: "визуализация"},
          { label: "การสร้างภาพ"},
          { label: "görüntüleme"}
        ]
      },
      { label: "Gorgeous on Retina", type: "inactive" },
      { label: "Perfect for touch screens & mobile", type: "inactive" },
      { label: "HTML5", type: "inactive" },
      { label: "JavaScript API, 35k gzipped", type: "inactive" },
      {
        label: "Complements Lingo3G clustering engine",
        type: "link",
        url: "https://carrotsearch.com/lingo3g",
        title: "You can use FoamTree as an interactive presentation layer for the topics the Lingo3G clustering engine " +
          "discovers in text documents. Click-and-hold to find out more about Lingo3G."
      },
      {
        label: "API Reference",
        type: "link",
        url: "api/index.html",
        title: "Click-and-hold to open FoamTree API Reference."
      },
      {
        label: "Demos",
        type: "link",
        url: "demos/index.html",
        title: "Click-and-hold to see more FoamTree demos and code examples."
      },
      {
        label: "Pricing",
        type: "link",
        url: "https://carrotsearch.com/foamtree/how-to-order",
        title: "Click-and-hold to find out more about FoamTree pricing."
      },
      {
        label: "Contact",
        type: "link",
        url: "https://carrotsearch.com/contact",
        title: "Click-and-hold to find out more about Carrot Search, the creator of FoamTree."
      },
      {
        label: "FAQ",
        type: "link",
        url: "https://carrotsearch.com/foamtree/faq",
        title: "Click-and-hold for FoamTree Frequently Asked Questions"
      },
      {
        label: "Circles",
        type: "link",
        url: "https://carrotsearch.com/circles",
        title: "Click-and-hold to see Circles, the multi-level interactive pie-chart from Carrot Search."
      },
      {
        label: "Branded version free!",
        type: "link",
        url: "download/index.html",
        title: "Click-and-hold to download a Carrot Search-branded version of FoamTree free of charge."
      },
      {
        label: "Download",
        type: "link",
        url: "download/index.html",
        title: "Click-and-hold to download a Carrot Search-branded version of FoamTree free of charge."
      },
      {
        id: "print",
        label: "Printing",
        type: "demo",
        title: "Click-and-hold for a high-resolution printable image of this visualization."
      },
      {
        label: "Bitmap export",
        title: "Click-and-hold to open a window with a bitmap snapshot of the current visualization image",
        type: "demo",
        holdAction: function() {
          var element = foamtree.get("element");
          var popup = window.open("", "", "innerWidth=" + (element.clientWidth + 30) +
            ", innerHeight=" + (element.clientHeight + 100));
          if (popup) {
            popup.document.write('<!DOCTYPE html><html lang="en"><head><title>FoamTree image export</title></head><body>');
            popup.document.write("<p style='font-family: sans-serif;'>Below is FoamTree bitmap image that can be printed or embedded in other documents. " +
              "High-resolution bitmaps can also be generated.</p>");
            popup.document.write("<img src='" + foamtree.get("imageData") + "' />");
            popup.document.write('</body>');
          }
        }
      },
      { label: "The demo is over, it's your turn now. Click-and-hold groups to explore! ", type: "demo", id: "explore" }
    ]
  };

  // The list of steps of the demo sequence
  var steps = [
    // Load the demo data set
    {
      action: function(done) {
        options.started();
        foamtree.set("dataObject", introData);
        once("rolloutComplete", done);
      },
      waitAfter: 2000
    },

    //
    // Introduction
    //

    // Fly down to the "based on Voronoi treemaps" group
    {
      action: function(done) {
        foamtree.set("zoomMouseWheelDuration", 700);
        foamtree.select("foamtree-is");
        foamtree.zoom("foamtree-is").then(done);
      },
      waitAfter: 1000
    },
    {
      action: function(done) {
        foamtree.set("exposeDuration", 1500);
        foamtree.set("exposeEasing", "quadInOut");
        foamtree.expose("with").then(done);
      }
    },
    {
      action: function(done) {
        foamtree.set("exposeDuration", 1500);
        foamtree.set("exposeEasing", "quadInOut");
        foamtree.expose("non-rectangular-layouts").then(done);
      }
    },
    {
      action: function(done) {
        foamtree.set("exposeDuration", 1500);
        foamtree.set("exposeEasing", "quadInOut");
        foamtree.expose("based-on-voronoi").then(done);
      },
      waitAfter: 2000
    },

    // Show more interactions
    {
      action: function(done) {
        foamtree.set("exposeDuration", 800);
        foamtree.set("exposeEasing", "quadInOut");
        foamtree.expose("animated-interactions").then(done);
      },
      waitAfter: 500
    },

    // Zoom out
    {
      action: function(done) {
        foamtree.set({
          exposeEasing: "cubicInOut",
          exposeDuration: 1500
        });
        var counter = new PromiseCounter(done);
        foamtree.open("foamtree-is").then(counter.resolver());
        foamtree.expose("foamtree-is").then(counter.resolver());
        counter.start();
      }
    },

    // ...and zoom in
    {
      action: function(done) {
        foamtree.set({
          zoomMouseWheelEasing: "bounce",
          zoomMouseWheelDuration: 2000
        });
        var counter = new PromiseCounter(done);
        foamtree.open(["foamtree-is", "with"]).then(counter.resolver());
        foamtree.zoom("zooming").then(counter.resolver());
        counter.start();
      }
    },

    // Expose a few sites
    {
      action: function(done) {
        foamtree.expose("exposing").then(done);
      },
      waitAfter: 500
    },
    { action: function(done) { foamtree.expose("exposing-that"     ).then(done); } },
    { action: function(done) { foamtree.expose("exposing-helps"    ).then(done); } },
    { action: function(done) { foamtree.expose("exposing-to"       ).then(done); } },
    { action: function(done) { foamtree.expose("exposing-highlight").then(done); } },
    { action: function(done) { foamtree.expose("exposing-content"  ).then(done); } },
    { action: function(done) { foamtree.expose("exposing-of"       ).then(done); } },
    { action: function(done) { foamtree.expose("exposing-specific" ).then(done); } },
    { action: function(done) { foamtree.expose("exposing-groups"   ).then(done); }, waitAfter: 1000 },

    // Slowly reset view
    {
      action: function(done) {
        foamtree.set("openCloseDuration", 7000);
        foamtree.set("zoomMouseWheelDuration", 5000);
        foamtree.set("zoomMouseWheelEasing", "quadInOut");
        resetViewAndState(done);
      },
      waitAfter: 1000
    },

    //
    // Load a few demo data sets
    //
    {
      action: function(done) {
        foamtree.select({ groups: "foamtree-can-visualize", keepPrevious: false });
        foamtree.expose("foamtree-can-visualize").then(done);
      },
      waitAfter: 1000
    },
    {
      action: function(done) {
        foamtree.set("wireframeDrawMaxDuration", 200);

        var counter = new PromiseCounter(done);
        foamtree.expose("foamtree-can-visualize").then(counter.resolver());
        foamtree.open("foamtree-can-visualize").then(counter.resolver());
        counter.start();
      },
      waitAfter: 500
    },

    {
      condition: function() { return topicsData !== undefined; },
      action: function(done) {
        var counter = new PromiseCounter(function() {
          blinkSelection("topics", done);
        });
        foamtree.expose("foamtree-can-visualize").then(counter.resolver());
        foamtree.open("foamtree-can-visualize").then(counter.resolver());
        counter.start();
      },
      waitAfter: 500
    },
    {
      condition: function() { return topicsData !== undefined; },
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set("dataObject", topicsData)
      },
      waitAfter: 2500
    },

    {
      condition: function() { return domainsData !== undefined; },
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set("dataObject", introData);
        foamtree.expose("foamtree-can-visualize").then(function() {
          foamtree.open("foamtree-can-visualize");
        });
      },
      waitAfter: 0
    },
    {
      condition: function() { return domainsData !== undefined; },
      action: function(done) {
        var counter = new PromiseCounter(function() {
          blinkSelection("domains", done);
        });
        foamtree.expose("foamtree-can-visualize").then(counter.resolver());
        foamtree.open("foamtree-can-visualize").then(counter.resolver());
        counter.start();
      },
      waitAfter: 500
    },
    {
      condition: function() { return domainsData !== undefined; },
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set("dataObject", domainsData);
      },
      waitAfter: 2500
    },

    {
      condition: function() { return censusData !== undefined; },
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set("dataObject", introData);
        foamtree.expose("foamtree-can-visualize").then(function() {
          foamtree.open("foamtree-can-visualize");
        });
      },
      waitAfter: 0
    },
    {
      condition: function() { return censusData !== undefined; },
      action: function(done) {
        var counter = new PromiseCounter(function() {
          blinkSelection("statistical-data", done);
        });
        foamtree.expose("foamtree-can-visualize").then(counter.resolver());
        foamtree.open("foamtree-can-visualize").then(counter.resolver());
        counter.start();
      },
      waitAfter: 500
    },
    {
      condition: function() { return censusData !== undefined; },
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set({
          dataObject: censusData,
          groupColorDecorator: function (opts, props, vars) {
            var diversity = props.group.diversity;
            if (diversity) {
              vars.groupColor.l = diversity * 100;
            }
          }
        });
      },
      waitAfter: 3500
    },

    {
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set("dataObject", introData);
      },
      waitAfter: 0
    },

    //
    // Custom content
    //
    {
      action: function(done) {
        foamtree.set("exposeDuration", 1500);
        foamtree.set("exposeEasing", "quadInOut");
        foamtree.expose("content-customization").then(done);
      },
      waitAfter: 0
    },
    {
      action: function(done) {
        foamtree.expose("decorated-label").then(done);
      },
      waitAfter: 2500
    },
    {
      action: function(done) {
        foamtree.expose("sparkline").then(done);
      },
      waitAfter: 1300
    },
    {
      action: function(done) {
        foamtree.expose("image").then(done);
      },
      waitAfter: 1300
    },
    {
      action: function(done) {
        foamtree.expose("pie-chart").then(done);
      },
      waitAfter: 3000
    },
    {
      action: function(done) {
        resetViewAndState(done);
      },
      waitAfter: 500
    },

    //
    // Layout options
    //
    {
      action: function(done) {
        foamtree.select("layout-options");
        done();
      },
      waitAfter: 1500
    },

    {
      action: function(done) {
        foamtree.open("layout-options").then(done);
        foamtree.set({
          selection: { groups: "diagonal", keepPrevious: false },
          groupSelectionOutlineColor: "#000",
          groupSelectionFillLightnessShift: 20,
          groupSelectionFillHueShift: -180
        });
      },
      waitAfter: 500
    },
    {
      action: function(done) {
        once("rolloutComplete", done);
        findById(introData, "layout-options").open = true;
        foamtree.set({
          relaxationInitializer: "treemap",
          pullbackDuration: 0,
          rolloutDuration: 0,
          fadeDuration: 250,
          dataObject: introData,
          groupSelectionOutlineColor: "#000",
          groupSelectionFillLightnessShift: 20,
          groupSelectionFillHueShift: -180
        });
        foamtree.select("diagonal");
      },
      waitAfter: 3000
    },

    {
      action: function(done) {
        foamtree.select({ all: true, selected: false });
        foamtree.open("layout-options").then(done);
        foamtree.set({
          selection: { groups: "blackhole", keepPrevious: false },
          groupSelectionOutlineColor: "#000",
          groupSelectionFillLightnessShift: 20,
          groupSelectionFillHueShift: -180
        });
      },
      waitAfter: 500
    },
    {
      action: function(done) {
        once("rolloutComplete", done);
        findById(introData, "layout-options").open = true;
        foamtree.set({
          relaxationInitializer: "blackhole",
          pullbackDuration: 0,
          rolloutDuration: 0,
          fadeDuration: 250,
          dataObject: introData,
          groupSelectionOutlineColor: "#000",
          groupSelectionFillLightnessShift: 20,
          groupSelectionFillHueShift: -180
        });
        foamtree.select("blackhole");
      },
      waitAfter: 3000
    },

    {
      action: function(done) {
        foamtree.select({ all: true, selected: false });
        foamtree.open("layout-options").then(done);
        foamtree.set({
          selection: { groups: "rectangular", keepPrevious: false },
          groupSelectionOutlineColor: "#000",
          groupSelectionFillLightnessShift: 20,
          groupSelectionFillHueShift: -180
        });
      },
      waitAfter: 500
    },
    {
      action: function(done) {
        once("rolloutComplete", done);
        findById(introData, "layout-options").open = true;
        foamtree.set({
          layout: "squarified",
          pullbackDuration: 0,
          rolloutDuration: 0,
          fadeDuration: 250,
          dataObject: introData,
          groupSelectionOutlineColor: "#000",
          groupSelectionFillLightnessShift: 20,
          groupSelectionFillHueShift: -180
        });
        foamtree.select("rectangular");
      },
      waitAfter: 3000
    },

    {
      action: function(done) {
        foamtree.open("layout-options").then(done);
        foamtree.set({
          selection: { groups: "dynamic-relaxation", keepPrevious: false },
          groupSelectionOutlineColor: "#000",
          groupSelectionFillLightnessShift: 20,
          groupSelectionFillHueShift: -180
        });
      },
      waitAfter: 500
    },
    {
      action: function(done) {
        once("rolloutComplete", done);
        findById(introData, "layout-options").open = true;
        foamtree.set({
          layout: "relaxed",
          relaxationInitializer: "fisheye",
          relaxationVisible: true,
          relaxationMaxDuration: 12000,
          groupGrowingDuration: 2000,
          groupGrowingDrag: 0.1,
          relaxationQualityThreshold: 0.01,
          pullbackDuration: 0,
          rolloutDuration: 0,
          fadeDuration: 250,
          dataObject: introData,
          groupSelectionOutlineColor: "#000",
          groupSelectionFillLightnessShift: 20,
          groupSelectionFillHueShift: -180
        });
        foamtree.select("dynamic-relaxation");
      },
      waitAfter: 2000
    },

    //
    // Color customizations
    //
    {
      action: function (done) {
        foamtree.open({ all: true, open: false });
        foamtree.select({ groups: "color-customization", keepPrevious: false });
        done();
      },
      waitAfter: 1500
    },
    {
      action: function (done) {
        foamtree.open("color-customization").then(done);
      },
      waitAfter: 1000
    },
    {
      action: function (done) {
        foamtree.open("color-customization").then(done);
        foamtree.select("rainbow");
      },
      waitAfter: 1000
    },
    {
      action: function (done) {
        foamtree.open(["color-customization", "rainbow"]).then(done);
      },
      waitAfter: 1000
    },
    {
      action: function (done) {
        foamtree.open(["color-customization", "rainbow"]).then(done);
        foamtree.select({groups: "warm", keepPrevious: false });
        findById(introData, "warm").run();
      },
      waitAfter: 2000
    },
    {
      action: function (done) {
        foamtree.open(["color-customization", "rainbow"]).then(done);
        foamtree.select({ groups: "cold", keepPrevious: false });
        findById(introData, "cold").run();
      },
      waitAfter: 2000
    },
    {
      action: function (done) {
        foamtree.open(["color-customization"]).then(done);
        foamtree.select({ groups: "type", keepPrevious: false });
        findById(introData, "type").run();
      },
      waitAfter: 3000
    },
    {
      action: function (done) {
        foamtree.open(["color-customization"]);
        foamtree.select({ groups: "radar", keepPrevious: false });

        // Start the animation. It will be stopped in the next step.
        radarGroupColorDecorator.start();
        done();
      },
      waitAfter: 5000
    },

    {
      action: function(done) {
        // The decorator will stop the animation when the data
        // is reloaded, so we simply load the intro data here.
        // We want to use two fading speeds, so we set an intermediate
        // null data set.
        once("modelChanging", function() {
          foamtree.set({
            dataObject: introData,
            fadeDuration: 200
          });
          done();
        });
        foamtree.set({
          pullbackDuration: 0,
          fadeDuration: 3000,
          dataObject: null
        });
      },
      resetOptions: false,
      waitAfter: 1000
    },

    //
    // Appearance
    //
    {
      action: function (done) {
        foamtree.select({ groups: "appearance", keepPrevious: false });
        foamtree.expose({ groups: "appearance", keepPrevious: false });
        done();
      },
      waitAfter: 1500
    },
    {
      action: function (done) {
        var counter = new PromiseCounter(done);
        foamtree.open("appearance").then(counter.resolver());
        foamtree.expose("appearance").then(counter.resolver());
        counter.start();
      },
      waitAfter: 1000
    },
    {
      action: function (done) {
        var counter = new PromiseCounter(done);
        foamtree.open("appearance").then(counter.resolver());
        foamtree.expose("appearance").then(counter.resolver());

        foamtree.select({ groups: "border-radius", keepPrevious: false });
        tween(foamtree.get("groupBorderRadius"), 0, 1, 150, 2, function (value) {
          foamtree.set("groupBorderRadius", value);
          foamtree.redraw(true);
        }, counter.resolver());
        counter.start();
      },
      waitAfter: 1000
    },
    {
      action: function (done) {
        var counter = new PromiseCounter(done);
        foamtree.open("appearance").then(counter.resolver());
        foamtree.expose("appearance").then(counter.resolver());

        foamtree.select({ groups: "border-width", keepPrevious: false });
        tween(foamtree.get("groupBorderWidth"), 0, 8, 150, 2, function (value) {
          foamtree.set("groupBorderWidth", value);
          foamtree.set("groupInsetWidth", value * 1.5);
          foamtree.redraw(true);
        }, counter.resolver());
        counter.start();
      },
      waitAfter: 1000
    },
    {
      action: function (done) {
        var counter = new PromiseCounter(done);
        foamtree.open("appearance").then(counter.resolver());
        foamtree.expose("appearance").then(counter.resolver());

        foamtree.select({ groups: "font-size", keepPrevious: false});
        tween(0.2, 0.2, foamtree.get("groupLabelMaxTotalHeight"), 150, 0.5, function (value, frame) {
          if (frame % 30 === 0) {
            foamtree.set("groupLabelMaxTotalHeight", value);
            foamtree.redraw(false);
          }
        }, counter.resolver());
        counter.start();
      },
      waitAfter: 1000
    },
    {
      action: function (done) {
        var counter = new PromiseCounter(done);
        foamtree.open("appearance").then(counter.resolver());
        foamtree.expose("appearance").then(counter.resolver());

        foamtree.select({ groups: "font-family", keepPrevious: false });
        var fonts = findById(introData, "font-family").fontFamilies;
        tween(0, 0, 1, 400, 1, function (value, frame) {
          if (frame % 100 === 0) {
            foamtree.set("groupLabelFontFamily", fonts[frame / 100]);
            foamtree.redraw(false);
          }
        }, counter.resolver());
        counter.start();
      },
      waitAfter: 1000
    },
    {
      action: function (done) {
        foamtree.select({ groups: "fill-type", keepPrevious: false });
        done();
      },
      waitAfter: 1500
    },
    {
      action: function (done) {
        foamtree.open(["appearance", "fill-type"]).then(done);
      },
      waitAfter: 1000
    },
    {
      action: function (done) {
        var counter = new PromiseCounter(done);
        foamtree.open(["appearance", "fill-type"]).then(counter.resolver());
        foamtree.expose("appearance").then(counter.resolver());

        foamtree.select({ groups: "opacity", keepPrevious: false });
        tween(0.99, 0.2, 1.0, 200, 2, function (value) {
          foamtree.set({
            rainbowStartColor: "hsla(0, 100%, 55%, " + value + ")",
            rainbowEndColor: "hsla(359, 100%, 55%, " + value + ")"
          });
          foamtree.redraw(false);
        }, counter.resolver());
        counter.start();
      },
      waitAfter: 2500
    },
    {
      action: function (done) {
        var counter = new PromiseCounter(done);
        foamtree.open(["appearance", "fill-type"]).then(counter.resolver());
        foamtree.expose("appearance").then(counter.resolver());

        foamtree.select({ groups: "plain", keepPrevious: false });
        foamtree.set({
          groupFillType: "plain"
        });
        foamtree.redraw();
        counter.start();
      },
      waitAfter: 2500
    },
    {
      action: function (done) {
        var counter = new PromiseCounter(done);
        foamtree.open(["appearance", "fill-type"]).then(counter.resolver());
        foamtree.expose("appearance").then(counter.resolver());

        foamtree.select({ groups: "gradient", keepPrevious: false });
        foamtree.set({
          groupFillType: "gradient",
          finalCompleteDrawMaxDuration: 2000
        });
        foamtree.redraw();
        counter.start();
      },
      waitAfter: 2500
    },

    //
    // Effects
    //
    {
      action: function(done) {
        resetViewAndState(done);
      },
      waitAfter: 500
    },

    // Effects: open group
    {
      action: function(done) {
        foamtree.select({ groups: "effects", keepPrevious: false });
        foamtree.expose("effects").then(done);
      },
      waitAfter: 1000
    },
    {
      action: function(done) {
        var counter = new PromiseCounter(done);
        foamtree.set("wireframeDrawMaxDuration", 200);
        foamtree.expose("effects").then(counter.resolver());
        foamtree.open("effects").then(counter.resolver());
        counter.start();
      },
      waitAfter: 500
    },

    // Effects: fading
    {
      action: function(done) {
        var counter = new PromiseCounter(done);
        foamtree.expose("effects").then(counter.resolver());
        foamtree.open("effects").then(counter.resolver());
        blinkSelection("fading", counter.resolver());
        counter.start();
      },
      waitAfter: 0
    },
    {
      action: function(done) {
        foamtree.set({
          dataObject: randomGroups(50),
          rolloutDuration: 0,
          pullbackDuration: 0,
          fadeDuration: 750
        });
        once("rolloutComplete", done);
      },
      waitAfter: 2000
    },
    {
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set({
          dataObject: introData,
          rolloutDuration: 0,
          pullbackDuration: 0,
          fadeDuration: 750
        });
        foamtree.expose("effects");
        foamtree.open("effects");
      },
      waitAfter: 1000
    },


    // Effects: gentle scaling 61
    {
      action: function(done) {
        var counter = new PromiseCounter(done);
        foamtree.expose("effects").then(counter.resolver());
        foamtree.open("effects").then(counter.resolver());
        blinkSelection("scaling", counter.resolver());
        counter.start();
      },
      waitAfter: 0
    },
    {
      action: function(done) {
        once("modelChanged", function() {
          once("rolloutComplete", done);
          foamtree.set({
            dataObject: randomGroups(50),
            rolloutDuration: 2000,
            rolloutEasing: "squareInOut",
            rolloutScalingStrength: -0.3,
            rolloutRotationStrength: 0
          });
        });
        foamtree.set({
          dataObject: null,
          pullbackDuration: 0,
          fadeDuration: 500
        });
      },
      waitAfter: 1000
    },
    {
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set({
          dataObject: introData,
          rolloutDuration: 0,
          pullbackEasing: "squareInOut",
          pullbackDuration: 2000,
          pullbackScalingStrength: -0.3,
          pullbackRotationStrength: 0,
          pullbackPolygonDelay: 0.1,
          fadeDuration: 750
        });
        foamtree.expose("effects");
        foamtree.open("effects");
      },
      waitAfter: 1000
    },

    // Effects: rotation
    {
      action: function(done) {
        var counter = new PromiseCounter(done);
        foamtree.expose("effects").then(counter.resolver());
        foamtree.open("effects").then(counter.resolver());
        blinkSelection("rotation", counter.resolver());
        counter.start();
      },
      waitAfter: 0
    },
    {
      action: function(done) {
        once("modelChanged", function() {
          once("rolloutComplete", done);
          foamtree.set({
            dataObject: randomGroups(50),
            rolloutEasing: "bounce",
            rolloutDuration: 4000,
            rolloutScalingStrength: -0.65,
            rolloutRotationStrength: 0.7,
            rolloutTransformationCenter: 1
          });
        });
        foamtree.set({
          dataObject: null,
          pullbackDuration: 0,
          fadeDuration: 500
        });
      },
      waitAfter: 1000
    },
    {
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set({
          dataObject: introData,
          rolloutDuration: 0,
          pullbackEasing: "bounce",
          pullbackDuration: 4000,
          pullbackScalingStrength: -0.65,
          pullbackRotationStrength: 0.7,
          pullbackTransformationCenter: 1,
          pullbackPolygonDelay: 1,
          fadeDuration: 750
        });
        foamtree.expose("effects");
        foamtree.open("effects");
      },
      waitAfter: 1000
    },

    // Effects: ripple
    {
      action: function(done) {
        var counter = new PromiseCounter(done);
        foamtree.expose("effects").then(counter.resolver());
        foamtree.open("effects").then(counter.resolver());
        blinkSelection("ripple", counter.resolver());
        counter.start();
      },
      waitAfter: 0
    },
    {
      action: function(done) {
        once("modelChanged", function() {
          once("rolloutComplete", done);
          foamtree.set({
            dataObject: randomGroups(50),
            rolloutDuration: 6000,
            rolloutEasing: "bounce",
            rolloutScalingStrength: -0.4,
            rolloutRotationStrength: 0,
            rolloutPolygonDrag: 0.08
          });
        });
        foamtree.set({
          dataObject: null,
          pullbackDuration: 0,
          fadeDuration: 500
        });
      },
      waitAfter: 1000
    },
    {
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set({
          dataObject: introData,
          rolloutDuration: 0,
          fadeDuration: 750,
          pullbackDuration: 3000,
          pullbackEasing: "quadOut",
          pullbackScalingStrength: -0.4,
          pullbackRotationStrength: 0,
          pullbackPolygonDrag: 0.08
        });
        foamtree.expose("effects");
        foamtree.open("effects");
      },
      waitAfter: 1000
    },

    // Effects: flyout
    {
      action: function(done) {
        var counter = new PromiseCounter(done);
        foamtree.expose("effects").then(counter.resolver());
        foamtree.open("effects").then(counter.resolver());
        blinkSelection("flyout", counter.resolver());
        counter.start();
      },
      waitAfter: 0
    },
    {
      action: function(done) {
        once("modelChanged", function() {
          once("rolloutComplete", done);
          foamtree.set({
            dataObject: randomGroups(50),
            rolloutScalingStrength: 1,
            rolloutDuration: 4000,
            rolloutRotationStrength: 0,
            rolloutTransformationCenter: 0
          });
        });
        foamtree.set({
          dataObject: null,
          pullbackDuration: 0,
          fadeDuration: 500
        });
      },
      waitAfter: 1000
    },
    {
      action: function(done) {
        once("rolloutComplete", done);
        foamtree.set({
          dataObject: introData,
          rolloutDuration: 0,
          fadeDuration: 750,
          pullbackScalingStrength: 0.5,
          pullbackDuration: 2500,
          pullbackEasing: "quadOut",
          pullbackRotationStrength: 0,
          pullbackTransformationCenter: 0
        });
      },
      waitAfter: 0
    },

    // The final message
    {
      action: function(done) {
        foamtree.set({
          selection: "explore",
          zoomMouseWheelEasing: "quadInOut",
          zoomMouseWheelDuration: 12000
        });
        foamtree.zoom("explore").then(done);
      },
      waitAfter: 0
    },
    {
      action: function(done) {
        foamtree.set("zoomMouseWheelDuration", 10000);
        foamtree.set("zoomMouseWheelEasing", "quadInOut");
        resetViewAndState(done);
      }
    }
  ];

  /**
   * A simple sequence runner. Supports pausing and resuming the sequence.
   */
  var sequence = (function(options) {
    var currentStep;
    var nextStepTimeout;
    var paused = false;
    var waiting = false;
    var interrupted = false;

    /**
     * Runs the provided step of the sequence, waits the amount of
     * time specified in the step config and advances the counter
     * to the next runnable step in the sequence.
     */
    function run(step) {
      if (!step) {
        options.onFinish();
        return;
      }

      options.onStep(currentStep, options.steps.length, step);

      // Run the step and advance to the next one when
      // the step has called the provided done callback.
      step.action(function() {
        // Advance to the next runnable step
        var nextStep;
        do {
          nextStep = options.steps[++currentStep];
        } while(nextStep && nextStep.condition && nextStep.condition() === false);

        // Don't trigger the next step if we were paused during
        // the execution of the step.
        waiting = true;
        if (paused) {
          return;
        }

        // Wait the specified amount of time and run the next step.
        // Pausing during waiting is handled by clearing this timeout.
        nextStepTimeout = window.setTimeout(function() {
          waiting = false;
          run(nextStep);
        }, step.waitAfter || 1);
      });
    }

    function pause() {
      if (!paused) {
        paused = true;
        window.clearTimeout(nextStepTimeout);
        options.onPause();
      }
    }

    function resume() {
      paused = false;
      if (waiting) {
        waiting = false;

        if (interrupted) {
          options.returnFromInterrupt(function () {
            run(steps[currentStep]);
          });
        } else {
          run(steps[currentStep]);
        }
      }
      interrupted = false;
      options.onResume();
    }

    return {
      start: function() {
        currentStep = 0;
        options.onStep(currentStep, options.steps.length, options.steps[currentStep]);
        waiting = true;
        resume();
      },
      pause: pause,

      /**
       * A version of pause() that sets a special flag and lets
       * the caller perform custom actions before resuming after an interrupt.
       */
      interrupt: function() {
        interrupted = true;
        pause();
      },
      resume: resume
    };
  })({
    steps: steps,
    returnFromInterrupt: function (done) {
      // When resuming after the sequence was interrupted
      // by user's interactions, reset the view to make sure
      // that groups activated by the sequence are visible
      // and in the right state.
      resetViewAndState(done);
    },
    onStep: function(current, total, currentStep) {
      // Reset state
      if (currentStep.resetOptions === undefined || currentStep.resetOptions) {
        foamtree.set(defaults);
      }
      findById(introData, "layout-options").open = false;

      // Report progress
      options.progress(current, total);
    },
    onPause: function() {
      // Show hints
      hints.className = "visualization-hints";

      // Report to the UI
      options.paused();
    },
    onResume: function() {
      // Hide hints
      hints.className = "visualization-hints fadeout";

      // Report to the UI
      options.resumed();
    },
    onFinish: options.finished
  });


  // Set the default options for FoamTree
  foamtree.set({
    wireframeLabelDrawing: "always",
    wireframeContentDecorationDrawing: "always",
    titleBarDecorator: function (opts, params, vars) {
      if (params.group.title) {
        // Force showing the title bar
        vars.titleBarShown = true;
        vars.titleBarText = params.group.title;
        vars.titleBarMaxFontSize = 20;
      }
    },
    groupContentDecorator: function (opts, params, vars) {
      params.group.content && params.group.content(opts, params, vars);
    }
  });

  // Remember the default options, we'll be restoring them after each demo step
  var skipOptions = [
    "dataObject", "open", "selection", "exposure", "groupLabelDecorator"
  ].reduce(function(index, opt) { index[opt] = true; return index}, {});
  var readOnlyDefaults = foamtree.get(), defaults = {};
  for (var option in readOnlyDefaults) {
    if (readOnlyDefaults.hasOwnProperty(option) && option.indexOf("on") !== 0 && !skipOptions[option]) {
      defaults[option] = readOnlyDefaults[option];
    }
  }


  // We'll be hiding the hints when the demo sequence is running
  var hints = document.getElementsByClassName("visualization-hints")[0];

  // Start in paused mode
  sequence.pause();
  sequence.start();

  // Interrupt the demo on user interactions
  foamtree.on("groupClick", sequence.interrupt);
  foamtree.on("groupDoubleClick", sequence.interrupt);
  foamtree.on("groupHold", sequence.interrupt);
  foamtree.on("groupDragStart", sequence.interrupt);
  foamtree.on("groupTransformStart", sequence.interrupt);
  foamtree.on("groupMouseWheel", sequence.interrupt);
  foamtree.on("keyUp", sequence.interrupt);

  // Remember the user-changed state of the main visualization groups.
  // We'll be restoring the state when the user from some example data set
  // back to the main demo data set. With state restored, the groups the user
  // had previously open will be still open.
  foamtree.on("groupExposureChanging", function (info) {
    if (foamtree.get("dataObject") === introData) {
      info.group.exposed =  info.exposed;
    }
  });
  foamtree.on("groupOpenOrCloseChanging", function (info) {
    if (foamtree.get("dataObject") === introData) {
      info.group.open =  info.open;
    }
  });

  // Invoke custom actions on hold and click
  foamtree.on("groupHold", function (event) {
    var group = event.group;
    if (!group) {
      return;
    }
    if (group.url) {
      event.preventDefault();
      window.location.href = group.url;
    } else if (group.holdAction) {
      group.holdAction(event);
    }
  });
  foamtree.on("groupClick", function (event) {
    var group = event.group;
    if (!group) {
      return;
    }
    if (group.clickAction) {
      group.clickAction(event);
    }
  });

  // Install the resizing listener that makes the relaxation visible during resizing
  var resize = (function() {
    var timeout;
    return function() {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(function () {
        var lastRelaxationVisible = foamtree.get("relaxationVisible");
        var lastRelaxationMaxDuration = foamtree.get("relaxationMaxDuration");
        var lastRelaxationQualityThreshold = foamtree.get("relaxationQualityThreshold");
        once("relaxationComplete", function() {
          foamtree.set("relaxationVisible", lastRelaxationVisible);
          foamtree.set("relaxationMaxDuration", lastRelaxationMaxDuration);
          foamtree.set("relaxationQualityThreshold", lastRelaxationQualityThreshold);
        });
        foamtree.set("relaxationVisible", true);
        foamtree.set("relaxationMaxDuration", 6000);
        foamtree.set("relaxationQualityThreshold", 0.1);
        foamtree.resize();
      }, 300);
    };
  })();
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  // Expose the public API
  this.start = sequence.start;
  this.pause = sequence.pause;
  this.resume = function() {
    if (foamtree.get("dataObject") !== introData) {
      once("rolloutComplete", sequence.resume);
      foamtree.set("dataObject", introData);

      // Let the UI know immediately
      options.resumed();
    } else {
      sequence.resume();
    }
  };

  // Model walking utilities
  function eachDescendant(root, callback) {
    var groups = root.groups;
    if (groups) {
      for (var i = groups.length - 1; i >= 0; i--) {
        var subgroup = groups[i];

        if (callback(subgroup, i) === false) {
          return false;
        }
        if (eachDescendant(subgroup, callback) === false) {
          return false;
        }
      }
    }
    return true;
  }

  function findById(group, id) {
    var found = null;
    eachDescendant(group, function (g) {
      if (g.id === id) {
        found = g;
        return false;
      }
    });
    return found;
  }

  function blinkSelection(group, done) {
    foamtree.set("selection", { all: true, selected: false });
    foamtree.set("groupSelectionOutlineColor", "#000");
    foamtree.set("groupSelectionFillLightnessShift", 20);
    foamtree.set("groupSelectionFillHueShift", -180);
    blink(8);

    function blink(timesLeft) {
      var state = foamtree.get("state", group);
      foamtree.set("selection", { groups: group, selected: !state.selected });
      if (timesLeft > 0) {
        window.setTimeout(function() {
          blink(timesLeft - 1);
        }, 300);
      } else {
        done && done();
      }
    }
  }

  // Registers a one-off FoamTree listener
  function once(type, listener) {
    foamtree.on(type, function onceListener() {
      this.off(type, onceListener);
      return listener.apply(this, arguments);
    });
  }

  function tween(start, min, max, frames, cycles, frame, done) {
    var range = max - min;
    var startNormalized = ((start - min) / range - 0.5) * 2;
    var startAngle = Math.asin(startNormalized), angleIncrement = cycles * 2 * Math.PI / frames;
    var currentFrame = 0;

    requestAnimationFrame(function step() {
      frame((Math.sin(startAngle + currentFrame * angleIncrement) / 2 + 0.5) * range + min, currentFrame);
      currentFrame++;
      if (currentFrame <= frames) {
        requestAnimationFrame(step);
      } else {
        done();
      }
    });
  }

  function randomGroups(count) {
    var arr = [];
    for (var i = 0; i < count; i++) {
      arr.push({
        label: "",
        weight: 0.1 + Math.random() +
          (Math.random() < 0.2 ? Math.random() * 3 : 0)
      });
    }
    return { groups: arr };
  }

  function pad(count, array) {
    var minWeight = 0;
    var maxWeight = array.reduce(function (max, group) {
      return Math.max(max, group.weight)
    }, 0) * 0.5;

    for (var i = 0; i < count; i++) {
      array.push({
        label: "",
        weight: minWeight + (maxWeight - minWeight) * Math.pow(i / count, 0.7)
      })
    }
    return array;
  }

  function addBackGroup(dataObject) {
    return {
      groups: dataObject.groups.slice(0).concat({
        id: "back",
        label: "\u00ab\u00a0BACK",
        title: "Click-and-hold to go back to the main visualization",
        weight: 1,
        holdAction: function(event) {
          event.preventDefault();
          foamtree.set("dataObject", introData);
        }
      })
    };
  }

  function backGroupColorDecorator(options, params, vars) {
    if (params.group.id === "back") {
      vars.groupColor = "#333";
    }
  }

  function changeInitializer(initializer) {
    foamtree.set({
      relaxationInitializer: initializer,
      dataObject: foamtree.get("dataObject"),
      rolloutDuration: 0,
      pullbackDuration: 0,
      fadeDuration: 0
    });
  }

  function resetViewAndState(done) {
    eachDescendant(introData, function (group) {
      group.open = false;
      group.exposed = false;
    });
    foamtree.reset().then(function() {
      foamtree.set(defaults);
      done();
    });
  }

  function setChildSelected(parentId, childId) {
    eachDescendant(findById(introData, parentId), function (group) {
      group.selected = group.id === childId;
    });
  }
};