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
 * A UI component for editing numbers, used mostly in demos/settings.html.
 */
(function ($) {
  $.pluginhelper.make("settingsnumber", function (element, config) {
    var $container = $(element);

    var template = Template.make(
        '<label for="<%- option %>" class="control-label"><span><%- label %></span></label>\
         <input id="<%- option %>" type="text" class="form-control settings-number-value" />\
         <div class="settings-number-slider" />');

    $container.addClass("settings-number").html(template(config));
    var $input = $container.find(".settings-number-value");

    var $slider = $container.find(".settings-number-slider").slider({
      tooltip: "hide",
      min: config.min,
      max: config.max,
      step: config.step,
      value: config.min, // will be properly initialized later,
      width: config.width || 120 // provide width right away to speed up instantiation
    });

    // Update input when slider position changes
    $slider.on("slide", function(e, value) {
      $input.val(value);
    });

    // React to external change events
    $container.on("update", function(e, values) {
      var value = values[config.option];
      $input.val(value);
      $slider.slider("setValue", value);
    });

    // Triggering of change events
    $slider.on(config.immediate ? "slide" : "change", function(e, value) {
      triggerChange(value);
    });
    $input.on("change", function() {
      var value = $input.val();
      if (!isNaN(value * 1)) {
        $slider.slider("setValue", value);
      }
      var correctedValue = $slider.slider("getValue");
      $input.val(correctedValue);
      triggerChange(correctedValue);
    });
    return $container;

    function triggerChange(newValue) {
      config.onChange(config.option, newValue);
    }
  });
})(jQuery);