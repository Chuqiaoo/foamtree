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
 * Handles the export section of the settings panel.
 *
 * Please see demos/settings.html for the usage example.
 */
(function ($) {
  jQuery.fn.selectText = function () {
    var doc = document,
       element = this[0],
       range, selection;
    if (doc.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(element);
      range.select();
    } else if (window.getSelection) {
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  $.pluginhelper.make("export", function (element, options) {
    var skipByName = options.skip.reduce(function (byName, option) {
      byName[option] = true;
      return byName;
    }, {});

    // Templates
    var dialogTemplate = Template.make(
      '<div class="export modal fade in" tabindex="-1" role="dialog">\
        <div class="modal-dialog">\
          <div class="modal-content">\
            <div class="modal-header">\
              <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
              <h4 class="modal-title">Settings as JSON</h4>\
              <div>Current values of all options, copy and paste into your code.</div>\
            </div>\
            <div class="modal-body">\
              <div class="form-inline">\
                <div class="checkbox">\
                  <label><input type="checkbox" checked="checked" class="only-different"> Only include options different from defaults</label>\
                </div>\
                <div class="checkbox">\
                  <label><input type="checkbox" class="include-data"> Include data object</label>\
                </div>\
                <button type="button" class="select btn btn-default btn-xs">select all</button>\
                <pre class="json form-control-static">test</pre>\
              </div>\
            </div>\
          </div>\
        </div>\
      </div>');

    var $dialog = $(dialogTemplate()).modal({
      show: false,
      keyboard: true
    });

    var $trigger = $(element);
    var $json = $dialog.find(".json");

    $dialog.find(".select").click(function () {
      $json.selectText();
    });

    $dialog.find(":checkbox").change(function() {
      $trigger.triggerHandler("click");
    });

    $trigger.click(function (e) {
      var current = options.current();
      var defaults = options.defaults();

      var onlyDifferent = $dialog.find(".only-different").is(":checked");
      var includeData = $dialog.find(".include-data").is(":checked");

      var changed = {};
      $.each(defaults, function (option, value) {
        if (option === "dataObject" && !includeData) {
          return;
        }

        if (skipByName[option] !== true && (current[option] !== value || !onlyDifferent)) {
          changed[option] = current[option];
        }
      });

      // Remove quotes from property names
      var json = JSON.stringify(changed, null, 2).replace(/"([a-zA-Z]+)":/g, "$1:");
      $json.html(hljs.highlight("javascript", json).value);
      e.preventDefault();

      $dialog.modal('show');
    });
  });
})(jQuery);