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
 * Adds folding/unfolding functionality to section elements.
 *
 * Please see demos/settings.html for the usage example.
 */
(function ($) {
  $.pluginhelper.make("foldable", function (element, options) {
    $(element).addClass("foldable")
              .children().children("h4").append(' <span class="down fa fa-chevron-down"></span>\
                                   <i class="right fa fa-chevron-right"></i>').end().end()
              .on("click", "header", function() {
                $(this).closest("section").toggleClass("folded");
              });
  });
})(jQuery);