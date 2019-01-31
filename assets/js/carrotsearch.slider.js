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
 * A very simple slider control.
 *
 * Please see carrotsearch.settings.js for the usage example.
 */
(function ($) {
  // TODO: make the slider usable on touch devices
  var Slider = $.pluginhelper.make("slider", function (element, options) {
    var $container = $(element);

    this.$container = $container;
    this.$lower = $("<a href='#'></a>");
    this.$fill = $("<div></div>");

    this.min = options.min;
    this.max = options.max;
    this.step = options.step;
    this.precision = options.precision;

    // An optimization to avoid calls to the costly .width() method
    this.width = options.width ? options.width : $container.width();

    this.keyboardStepsMade = 0;
    this.keyboardRepetitionTimeout = null;

    this.lowerPos = 0;
    this.lowerValue = 0;
    this.lowerActive = false;
    this.lowerMoved = false;
    $container.empty().addClass("slider").append(this.$lower).append(this.$fill);
  });

  $(document).on("click", ".slider a", function (e) {
    e.preventDefault();
    e.stopPropagation();
  });

  $(document).on("click", ".slider", function (e) {
    var $slider = $(this).data("slider");
    $slider.setValue($slider.min + ($slider.max - $slider.min) * (e.offsetX / $slider.width));
    $slider.$container.trigger("slide", $slider.lowerValue);
    $slider.$container.trigger("change", $slider.lowerValue);
  });

  function getClientX(e) {
    return e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.clientX;
  }

  $(document).on("mousedown touchstart", ".slider", function (e) {
    var $slider = $(this).data("slider");
    $(document).data("slider", $slider);

    $slider.lowerActive = e.target === $slider.$lower.get(0);
    if ($slider.lowerActive) {
      $slider.$lower.focus();
      $slider.startClientX = getClientX(e);
    }
    return false;
  });

  $(document).on("keydown", ".slider", function (e) {
    var direction;

    switch (e.keyCode) {
      case 37:
      case 40:
        direction = -1;
        break;

      case 38:
      case 39:
        direction = 1;
        break;

      default:
        return;
    }

    var $slider = $(this).data("slider");
    var multiplier = $slider.keyboardStepsMade++ > 10 ? 5 : 1;

    window.clearTimeout($slider.keyboardRepetitionTimeout);
    $slider.keyboardRepetitionTimeout = window.setTimeout(function() {
      $slider.keyboardStepsMade = 0;
      $slider.keyboardRepetitionTimeout = null;
      $slider.$container.trigger("change", $slider.getValue());
    }, 1000);

    $slider.setValue($slider.getValue() + $slider.step * direction * multiplier);
    $slider.$container.trigger("slide", $slider.getValue());
  });

  $(document).on("mousemove touchmove", function(e) {
    var $slider = $(this).data("slider");
    if (!$slider) {
      return;
    }

    if ($slider.lowerActive) {
      var newPos = Math.max(0, Math.min($slider.width, $slider.lowerPos + (getClientX(e) - $slider.startClientX)));

      var newValue = getValueForPosition($slider, newPos);
      setPositionForValue($slider, newValue);

      if (newValue !== $slider.lowerValue) {
        $slider.lowerMoved = true;
        $slider.$container.trigger("slide", newValue);
      }
      $slider.lowerValue = newValue;
    }
    return false;
  });

  $(document).on("mouseup touchend", function(e) {
    var $slider = $(this).data("slider");
    if (!$slider) {
      return;
    }
    $(this).data("slider", null);
    $slider.lowerActive = false;

    if ($slider.lowerMoved) {
      $slider.lowerPos = parseInt($slider.$lower.css("left"));
      $slider.$container.trigger("change", $slider.lowerValue);
    }
  });

  $(document).on("keydown", function (e) {
    if (e.keyCode === 27) {
      // Cancel slide
      var $slider = $(document).data("slider");
      if (!$slider) {
        return;
      }
      var oldValue = getValueForPosition($slider, $slider.lowerPos);
      setPositionForValue($slider, oldValue);
      if ($slider.lowerValue !== oldValue) {
        $slider.$container.trigger("slide", oldValue);
      }
      $slider.lowerValue = oldValue;
      $(document).data("slider", null);
    }
  });

  Slider.prototype.getValue = function () {
    return this.lowerValue;
  };

  Slider.prototype.setValue = function (newValue) {
    this.lowerValue = Math.min(this.max, Math.max(this.min, newValue));
    this.lowerPos = setPositionForValue(this, this.lowerValue);
  };

  function getValueForPosition($slider, pos) {
    var val = $slider.min + ($slider.max - $slider.min) * pos / $slider.width;
    return Math.round(val / $slider.step) / (1 / $slider.step);
  }

  function setPositionForValue($slider, value) {
    var newPos = $slider.width * (value - $slider.min) / ($slider.max - $slider.min);
    $slider.$lower.css("left", newPos + "px");
    $slider.$fill.css("right", ($slider.width - newPos) + "px");
    return newPos;
  }

})(jQuery);