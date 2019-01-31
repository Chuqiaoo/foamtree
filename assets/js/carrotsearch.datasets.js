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
 * Handles the data sets section of the settings panel.
 *
 * Please see demos/settings.html for the usage example.
 */
(function ($) {
  $.pluginhelper.make("datasets", function (element, options) {
    var $container = $(element);

    // Templates
    var sectionTemplate = Template.make(
     '<section class="links">\
        <header><h4>Data sets</h4></header>\
      </section>');
    var categoryTemplate = Template.make("<section><header><h5><%= label %></h5></header></section>");
    var datasetLinkTemplate = Template.make('<a class="dataset" href="<%- url %>"><%- label %></a>');

    // Initialize dataset sections
    var $datasets = $(sectionTemplate()).appendTo($container);
    $.each(options.categories, function (index, category) {
      var $category = $(categoryTemplate(category));
      $category.append(category.datasets.reduce(function (html, dataset) {
        html += datasetLinkTemplate(dataset);
        return html;
      }, ""));
      $category.appendTo($datasets);
    });

    $datasets.on("click", "a.dataset", function(e) {
      options.onLoadingStart();
      JSONP.load(this.href, "modelDataAvailable", function(data) {
        options.onChange(data);
      });
      e.preventDefault();
    });

    var $pasteJsonDialog = createPasteJsonDialog();
    var $generatorDialog = createGeneratorDialog();

    var $tools = $("<section class='full'>\
        <a href='#json'><i class='fa fa-lg fa-paste'></i> Paste JSON</a>\
        <a href='#random'><i class='fa fa-lg fa-cogs'></i> Generate data</a>\
      </section>").appendTo($datasets);

    $tools.find("a[href = '#json']").click(function(e) {
      $pasteJsonDialog.datasetmodal('show');
      e.preventDefault();
    });

    $tools.find("a[href = '#random']").click(function(e) {
      $generatorDialog.datasetmodal('show');
      e.preventDefault();
    });


    // Don't search data sets at all
    $container.on("search", function(e, prefix) {
      $datasets.toggle($.trim(prefix).length === 0);
    });

    // Load some default data set
    setTimeout(function() {
      $container.find(".dataset:eq(2)").trigger("click");
    }, 1);

    function createPasteJsonDialog() {
      var pasteJsonTemplate = Template.make('<div>\
        <textarea class="json form-control"><%= json %></textarea>\
        <span class="help-block error">&nbsp;</span></div>');

    // Initialize the JSON input link
    var exampleData = {
      groups: [
        { label: "Group 1", weight: 1 },
        {
          label: "Group 2", weight: 2, groups: [
            { label: "Group 2.2", weight: 1 },
            { label: "Group 2.2", weight: 0.5 }
          ]
        }
      ]
    };
      return $(pasteJsonTemplate({json: JSON.stringify(exampleData, null, 2)})).datasetmodal({
        title: "Paste JSON data to visualize",
        subtitle: 'Data must be in the <a href="../api/index.html#dataObject" target="_blank">FoamTree data format</a>',
        size: "def",
        onVisualize: function() {
          var $json = this.find(".json");
          var $error = this.find(".error");

      try {
        $error.html("&nbsp;");
        var dataObject = JSON.parse($json.val());
            options.onLoadingStart();
            this.datasetmodal('hide');
        options.onChange(dataObject);
      } catch (e) {
        $error.text("Invalid JSON data: " + e);
      }
        }
    });
    }

    function createGeneratorDialog() {
      var generatorTemplate = Template.make('\
        <form class="generator form-horizontal" style="overflow: hidden">\
          <section class="settings" style="width: 60%; float: left"></section>\
          <section class="side" style="width: 40%; float: left">\
            <section class="presets">\
              <h5>Presets</h5>\
              <p>\
                <a href="#defaults">Defaults: a few groups on 2 levels</a>\
                <a href="#1-level-many">Many groups on 1 level</a>\
                <a href="#2-levels-fanout">Few groups on 1<sup>st</sup> level, many groups on 2<sup>nd</sup> level</a>\
                <a href="#4-levels-full">4 levels, full hierarchy</a>\
                <a href="#8-levels-full">8 levels, full hierarchy</a>\
                <a href="#10-levels">10 levels</a>\
              </p>\
              <p>\
                <a href="#uniform">Uniform weights</a>\
                <a href="#balanced">Balanced weights</a>\
                <a href="#unbalanced">Unbalanced weights</a>\
              </p>\
            </section>\
            <section>\
              <h5>Currently generated</h5>\
              <dl class="stats dl-horizontal">\
                <dt>Total groups:</dt>\
                <dd class="total-groups">50</dd>\
                <dt>Max hierarchy depth:</dt>\
                <dd class="max-depth">50</dd>\
                <dt>Max groups at one level:</dt>\
                <dd class="max-groups-at-one-level">50</dd>\
              </dl>\
              <p class="too-much">\
                <i class="fa fa-warning" style="color: orange"></i> More than 20000 groups were generated, try changing the settings to lower the number of groups.\
              </p>\
            </section>\
          </section>\
        </form>');

      var $body = $(generatorTemplate({}));
      var $settings = $body.find(".settings");
      var $side = $body.find(".side");

      var params = [
        {
          option: "levels",
          label: "Hierarchy depth",
          min: 1,
          max: 10,
          step: 1
        },
        {
          option: "countMean",
          label: "Group number average",
          min: 1,
          max: 5000,
          step: 1
        },
        {
          option: "countDeviation",
          label: "Group number deviation",
          min: 1,
          max: 1000,
          step: 1
        },
        {
          option: "countBalance",
          label: "Group number balance",
          min: 1,
          max: 10,
          step: 1
        },
        {
          option: "weightMean",
          label: "Group weight average",
          min: 1,
          max: 500,
          step: 1
        },
        {
          option: "weightDeviation",
          label: "Group weight deviation",
          min: 1,
          max: 500,
          step: 1
        },
        {
          option: "weightBalance",
          label: "Group weight balance",
          min: 1,
          max: 10,
          step: 1
        },

        {
          option: "childProbability",
          label: "Child group probability",
          min: 0,
          max: 1,
          step: 0.01
        },
        {
          option: "childCountFallOff",
          label: "Child group count scaling",
          min: 0,
          max: 20,
          step: 0.01
        }
      ];
      var values = {
        "levels": 2,
        "countMean": 15,
        "countDeviation": 5,
        "countBalance": 1,
        "weightMean": 50,
        "weightDeviation": 40,
        "weightBalance": 1,
        "childProbability": 0.5,
        "childCountFallOff": 0.5
      };
      
      var presets = {
        "defaults": $.extend({}, values),
        "1-level-many": { levels: 1, countMean: 1000, countDeviation: 100 },
        "2-levels-fanout": { levels: 2, countMean: 10, countDeviation: 5, childProbability: 1, childCountFallOff: 10 },
        "4-levels-full": { levels: 4, countMean: 7, countDeviation: 1, childProbability: 1, childCountFallOff: 1 },
        "8-levels-full": { levels: 8, countMean: 3, countDeviation: 0, childProbability: 1.0, childCountFallOff: 1.0 },
        "10-levels": { levels: 10, countMean: 5, countDeviation: 0, childProbability: 0.5, childCountFallOff: 0.9 },
        "uniform": { weightBalance: 0 },
        "balanced": { weightBalance: 1 },
        "unbalanced": { weightBalance: 3 }
      };

      var currentData = generateAndUpdateStats(values);

      var controls = [];
      params.forEach(function (param) {
        var $control = $("<div class='form-inline' />").settingsnumber($.extend({}, param, {
          onChange: function(param, newValue) {
            values[param] = newValue;
            currentData = generateAndUpdateStats();
          }
        })).appendTo($settings);
        controls.push($control);
    });
      updateControls();

      $side.find(".presets a").click(function (e) {
        var preset = presets[this.hash.substring(1)];
        $.extend(values, preset);
        updateControls();
        currentData = generateAndUpdateStats();
        e.preventDefault();
  });

      return $body.datasetmodal({
        title: "Generate data",
        size: "lg",
        subtitle: '',
        onVisualize: function($dialog) {
          if (currentData) {
            options.onLoadingStart();
            this.datasetmodal('hide');
            options.onChange(currentData);
          }
        }
      });

      function updateControls() {
        controls.forEach(function (control) {
          control.triggerHandler("update", values);
        });
      }

      function generateAndUpdateStats() {
        try {
          var result, stats;
          result = CarrotSearchVisualizationDatasets.generate(values);
          stats = result.stats;
          $side.find(".total-groups").html(stats.totalGroups);
          $side.find(".max-depth").html(stats.maxLevel);
          $side.find(".max-groups-at-one-level").html(stats.maxGroupsAtOneLevel);

          $side.find(".stats").show();
          $side.find(".too-much").hide();
          return result.dataObject;
        } catch (e) {
          $side.find(".stats").hide();
          $side.find(".too-much").show();
          return undefined;
        }
      }
    }
  });

  var DataSetModal = $.pluginhelper.make("datasetmodal", function (element, options) {
    var $content = $(element);
    var dialogTemplate = Template.make(
      '<div class="data-json modal fade in" tabindex="-1" role="dialog">\
        <div class="modal-dialog modal-<%- size %>">\
          <div class="modal-content">\
            <div class="modal-header">\
              <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
              <h4 class="modal-title"><%= title %></h4>\
              <div><%= subtitle %></div>\
            </div>\
            <div class="modal-body" style="padding-bottom: 0">\
            </div>\
            <div class="modal-footer">\
              <button type="button" class="visualize btn btn-primary">Visualize</button>\
            </div>\
          </div>\
        </div>\
      </div>');

    var $dialog = $(dialogTemplate(options)).modal({
      show: false,
      keyboard: true
    });

    $dialog.find(".modal-body").append(element);
    $dialog.find(".visualize").click(function () {
      options.onVisualize.call($content);
    });
    this.$dialog = $dialog;
  });

  DataSetModal.prototype.show = function() {
    this.$dialog.modal("show");
  };

  DataSetModal.prototype.hide = function() {
    this.$dialog.modal("hide");
  };
})(jQuery);