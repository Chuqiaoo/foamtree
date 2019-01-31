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
 * Implements FoamTree settings panel.
 *
 * Please see demos/settings.html for the usage example.
 */
(function ($) {
  $.pluginhelper.make("settings", function (element, options) {
    var $container = $(element);

    // Templates
    var optionGroupTemplate = Template.make(
     '<section>\
        <header><h4 id="<%- id %>"><span><%- label %></span></h4></header>\
        <p><%- description %></p>\
        <div></div>\
      </section>');

    var presetsTemplate = Template.make(
     '<section class="links">\
        <header><h4>Presets</h4></header>\
      </section>');
    var presetGroupTemplate = Template.make("<section><header><h5><%- label %></h5></header></section>");
    var presetLinkTemplate = Template.make('<a href="#"><%- label %></a>');
    var presetResetToDefaultsTemplate = Template.make('<section><a href="#reset"><i class="fa fa-lg fa-repeat"></i> Reset all to factory defaults</a></section>');


    // Create presets section
    var allPresetGroups = [];
    var $presets = $(presetsTemplate());
    var resetPreset = null;
    $.each(options.presetGroups, function (index, presetGroup) {
      if (presetGroup.defaults) {
        resetPreset = presetGroup;
        return;
      }

      var $presetGroup = $(presetGroupTemplate(presetGroup)).appendTo($presets);
      var presetLinks = [];

      $.each(presetGroup.presets, function (index, preset) {
        var $preset = $(presetLinkTemplate(preset)).appendTo($presetGroup).data("preset", preset);
        presetLinks.push({
          link: $preset,
          config: preset
        })
      });
      allPresetGroups.push({
        container: $presetGroup,
        config: presetGroup,
        links: presetLinks
      });
    });
    $(presetResetToDefaultsTemplate()).find("a").data("preset", resetPreset).end().appendTo($presets);
    $presets.appendTo($container);
    $presets.on("click", "a", function(e) {
      var preset = $(this).data("preset");
      var presetOptions = preset.options;

      preset.before && preset.before();

      // Update controls
      $container.triggerHandler("update", presetOptions);

      // Update the visualization
      options.onPreset(presetOptions);
      e.preventDefault();
    });

    // Create option group sections
    var allOptionGroups = [];
    var allOptionControls = [];
    $.each(options.optionGroups, function (index, optionGroup) {
      var $optionGroup = $(optionGroupTemplate($.extend({ description: "" }, optionGroup))).appendTo($container);
      var groupControls = [];

      // Create controls for each option
      var $options = $optionGroup.children("div").eq(0);
      $.each(optionGroup.options, function (optionIndex, optionConfig) {
        var factory = controlFactories[optionConfig.type];
        if (!factory) {
          throw "Unknown option type: " + optionConfig.type;
        }

        var $control = factory($("<div class='form-inline' />").appendTo($options), $.extend({}, optionConfig, {
          onChange: options.onChange
        }));

        // Add documentation link
        $control.find("label:eq(0)").append("<a class='fa fa-lg fa-info-circle' target='_blank' href='../api/index.html#" + optionConfig.option + "'></a>");

        var control = {
          container: $control,
          config: optionConfig
        };
        allOptionControls.push(control);
        groupControls.push(control);
      });

      allOptionGroups.push({
        container: $optionGroup,
        config: optionGroup,
        controls: groupControls
      });
    });

    // Set initial values
    $container.on("update", function(e, values) {
      $.each(allOptionControls, function(index, control) {
        if (typeof values[control.config.option] !== "undefined") {
          control.container.triggerHandler("update", values);
        }
      });
    }).triggerHandler("update", options.initial);

    // Hide pop-up components (color pickers) on scroll
    $container.on("scroll", function() {
      $.each(allOptionControls, function(index, control) {
        control.container.trigger("scrolled");
      });
    });

    // React to search
    $container.on("search", function (event, prefix) {
      if (prefix === undefined) {
        return;
      }

      var prefixForRegex = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      var regex = new RegExp("\\b(" + prefixForRegex + ")", "gi");

      // Search options
      $.each(allOptionGroups, function (index, group) {
        // Try matching the group's legend. If matched, we
        // won't be matching individual controls.
        var groupMatched = highlight(group.container.find("h4 > span:eq(0)"), group.config);

        var anyOptionMatched = false;
        $.each(group.controls, function (index, control) {
          var optionMatched = highlight(control.container.find(".control-label > span"), control.config);
          anyOptionMatched = anyOptionMatched || optionMatched;
          control.container.toggle(optionMatched || groupMatched);
        });

        group.container.toggle(anyOptionMatched || groupMatched);
      });

      // Search presets
      var anyPresetMatched = false;
      $.each(allPresetGroups, function (index, preset) {
        var groupMatched = highlight(preset.container.find("h5"), preset.config);
        anyPresetMatched = anyPresetMatched || groupMatched;

        var anyPresetInGroupMatched = false;
        $.each(preset.links, function (index, presetLink) {
          var linkMatched = highlight(presetLink.link, presetLink.config);
          anyPresetInGroupMatched = anyPresetInGroupMatched || linkMatched;
          anyPresetMatched = anyPresetMatched || linkMatched;
          presetLink.link.toggle(linkMatched || groupMatched);
        });

        preset.container.toggle(anyPresetInGroupMatched || groupMatched);
      });
      $presets.toggle(anyPresetMatched);


      function highlight($label, config) {
        var replaced = config.label.replace(regex, "<b class='hl'>$1</b>");
        var matched = replaced !== config.label;
        var updateNeeded = $label.html() !== replaced;
        if (updateNeeded) {
          $label.html(replaced);
        }
        return matched;
      }
    });
  });

  var controlFactories = {
    /**
     * Color editor.
     */
    color: function ($container, config) {
      var template = Template.make(
          '<label class="control-label"><span><%- label %></span></label>\
           <div>\
             <div class="color input-group" data-color-format="hsla">\
               <span class="input-group-addon"><i></i></span>\
               <input type="text" class="form-control" />\
             </div>\
           </div>');

      $container.addClass("settings-color")
                .html(template(config));
      var $color = $container.find(".input-group").colorpicker();
      var $input = $container.find("input");

      // React to external change events
      $container.on("update", function(e, values) {
        var value = values[config.option];
        $color.colorpicker("setValue", value);
      });

      $container.on("scrolled", function() {
        $(".colorpicker.dropdown-menu").hide();
      });

      // Update color based on the manual input
      $input.on("change", function() {
        $color.colorpicker("setValue", this.value);
        var correctedValue = $color.colorpicker("getValue");
        $input.val(correctedValue);
        triggerChange(correctedValue);
      });

      // Triggering of change events
      $color.on("changeColor", function(e) {
        triggerChange(e.colorString);
      });

      return $container;

      function triggerChange(newValue) {
        config.onChange(config.option, newValue);
      }
    },

    /**
     * Radio-based editor for enum options.
     */
    enum: function ($container, config) {
      if (config.ui === "combo") {
        return comboEnum($container, config);
      } else {
        return radioEnum($container, config);
      }

      function comboEnum($container, config) {
        var template = Template.make(
            '<label class="control-label"><span><%- label %></span></label>\
             <select class="form-control"><%= optionsHtml %></select>');
        var optionTemplate = Template.make(
          '<option value="<%- value %>"><%= typeof label !== "undefined" ? label : value %></option>'
        );

        var optionsHtml = config.values.reduce(function (html, value) {
          html += optionTemplate($.extend({ option: config.option }, value));
          return html;
        }, "");

        $container.addClass("settings-combo")
                  .html(template($.extend({ optionsHtml: optionsHtml }, config)));

        var $select = $container.find("select");

        // React to external change events
        $container.on("update", function(e, values) {
          var value = values[config.option];
          $select.val(value);
        });

        // Triggering of change events
        $select.on("change", function() {
          config.onChange(config.option, this.value);
        });

        return $container;
      }

      function radioEnum($container, config) {
        var template = Template.make(
            '<label class="control-label"><span><%- label %></span></label>\
             <div class="settings-enum-options"><%= optionsHtml %></div>');
        var optionTemplate = Template.make(
          '<div class="radio">\
            <label>\
              <input type="radio" name="<%- option %>" value="<%- value %>"> <%- typeof label !== "undefined" ? label : value %>\
            </label>\
          </div>'
        );

        var optionsHtml = config.values.reduce(function (html, value) {
          html += optionTemplate($.extend({ option: config.option }, value));
          return html;
        }, "");

        $container.addClass("settings-enum")
                  .html(template($.extend({ optionsHtml: optionsHtml }, config)));

        // React to external change events
        $container.on("update", function(e, values) {
          var value = values[config.option];
          $container.find("input[value='" + value + "']").prop("checked", true)
        });

        // Triggering of change events
        $container.find("input").on("change", function() {
          config.onChange(config.option, this.value);
        });

        return $container;
      }
    },

    /**
     * Text-box based editor for string options.
     */
    string: function ($container, config) {
      var template = Template.make(
          '<label for="<%- option %>" class="control-label"><span><%- label %></span></label>\
             <input class="form-control" type="text" id="<%- option %>" \
                    <%= typeof enabled !== \'undefined\' && !enabled ? "disabled" : "" %> \
                    title="<%= typeof hint !== \'undefined\' ? hint : \'\' %>" >\
           ');

      $container.addClass("settings-string")
                .html(template(config));

      // React to external change events
      $container.on("update", function(e, values) {
        var value = values[config.option];
        $container.find("input").val(value);
      });

      // Triggering of change events
      $container.find("input").on("change", function() {
        config.onChange(config.option, this.value);
      });

      return $container;
    },

    /**
     * Check-box based editor for boolean options.
     */
    boolean: function ($container, config) {
      var template = Template.make(
          '<label for="<%- option %>" class="control-label"><span><%- label %></span></label>\
           <div class="checkbox-inline">\
             <label>\
               <input id="<%- option %>" type="checkbox">\
             </label>\
           </div>');

      $container.addClass("settings-boolean")
                .html(template(config));

      // React to external change events
      $container.on("update", function(e, values) {
        var value = values[config.option];
        $container.find("input").prop("checked", value === true);
      });

      // Triggering of change events
      $container.find("input").on("change", function() {
        config.onChange(config.option, this.checked);
      });

      return $container;
    },

    /**
     * Link-based editor for options for which it's difficult to
     * choose the currently selected option (decorators).
     */
    link: function ($container, config) {
      var template = Template.make(
          '<label class="control-label"><span><%- label %></span></label>\
           <div class="settings-link-options"><%= linksHtml %></div>');
      var linkTemplate = Template.make(
        '<a href="#<%- label %>"><%- label %></a>'
      );

      var linksHtml = config.values.reduce(function (html, value) {
        html += linkTemplate($.extend({ option: config.option }, value));
        return html;
      }, "");

      $container.addClass("settings-link")
                .html(template($.extend({ linksHtml: linksHtml }, config)));

      // Triggering of change events
      $container.find("a").on("click", function(e) {
        e.preventDefault();

        var values = config.values;
        for (var i = values.length - 1; i >= 0; i--) {
          var val = values[i];
          if (val.label === this.hash.substring(1)) {
            config.onChange(config.option, val.value);
            return;
          }
        }
      });

      return $container;
    },

    /**
     * A slider for single-value numeric options.
     */
    number: function ($container, config) {
      return $container.settingsnumber(config);
    }
  };
})(jQuery);