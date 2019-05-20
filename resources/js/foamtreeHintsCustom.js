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
 * Copyright 2002-2019, Carrot Search s.c, All Rights Reserved.
 *
 *
 * A utility that displays contextual interaction hints
 * and the full interaction guide when requested. The utility
 * will insert all required HTML into the page.
 *
 * Please see demos/hints.html for the usage example.
 *
 * @param foamtree the FoamTree instance to be the source
 *        of interaction events for this utility.
 *
 * Chuqiao - A custom version of carrotsearch.foamtree.util.hints.js
 *         - Comment div .slidable  style in carrotsearch.foamtree.utill.hints.css and custom css style in custom.css
 *
 */

window.CarrotSearchFoamTree.hints = function(foamtree) {
  var macOs = /Mac/.test(window["navigator"]["userAgent"]);
  var touch = ('ontouchstart' in window) || (!!window["DocumentTouch"] && document instanceof window["DocumentTouch"]);

  //The list of available interactions, used to build the
  //complete interaction guide screen.
  var interactions = [
    [{desktop: "Left click", touch: "Tap", action: "select group, again to deselect"}],
    [{desktop: "Left click +Hold", action: "Reactome pathway diagram page"}],

    [{desktop: "Left double click", touch: "Double tap", action: "expose group"},
     {desktop: "Right double click<br /><small>or [Shift] + Left double click</small>", touch: "Two-finger double tap", action: "unexpose group"}],

    [{desktop: "Left double click", touch: "Tap-and-hold", action: "open group"},
     {desktop: "Right double click<br /><small>or [Shift] + Left click</small>", action: "close group"}],

    [{desktop: "Mouse wheel", touch: "Pinch", action: "zoom in / out"},
     {desktop: "Mouse drag", touch: "Drag", action: "pan around zoomed visualization"},
     {desktop: "[Esc] or rapid zoom out", touch: "Three-finger pinch", action: "unexpose &amp; close all groups"}],

    [{desktop: "[?]", action: "show / hide this help"}]
  ];
  // A simple persistent state manager
  var state = (function(key, def) {
    var hasStorage = (function() {
      try {
        var key = "ftap5caavc";
        window.localStorage.setItem(key, key);
        window.localStorage.removeItem(key);
        return true;
      } catch(e) {
        return false;
      }
    }());

    var json = hasStorage && window.localStorage[key];
    var object;
    if (json === undefined) {
      object = def;
      save();
    } else {
      object = JSON.parse(json);
    }

    function save() {
      if (hasStorage) {
        window.localStorage[key] = JSON.stringify(object);
      }
    }

    return {
      get: function(prop) {
        return object[prop];
      },
      set: function(prop, value) {
        object[prop] = value;
        save();
      }
    };
  })(
    "foamtree.help.state", {
      hints: true
    });

  var hintsHtml =
    '<div class="visualization-hint">\
      <span class="slidable hint">Left double click to zoom in, hold for details, right double click to zoom out :\
      &nbsp;<a href="#" class="slidable dont-show">Don\'t show again</a>\
      <span>&nbsp;:&nbsp;</span>\
      <span class="slidable help">Help</span></span><span class="info">i</span>\
    </div>';

  // The complete HTML, including interaction guide
  var html =
      hintsHtml +
  '<div class="visualization-help fadeout">\
      <a href="#close">&times;</a>' +
      interactions.reduce(function(html, group) {
        return html +
          "<dl>" +
            group.reduce(function (html, interaction) {
              if ((touch && !interaction.touch) || (!touch && !interaction.desktop)) {
                return html;
              }
              var trigger = touch ? interaction.touch : interaction.desktop;
              var event = trigger.replace(/\[/, "<span class='key'>").replace(/\]/, "</span>");
              return html +
                "<dt>" + event + "</dt>" +
                "<dd>" + interaction.action + "</dd>";
            }, "") +
          "</dl>";
      }, "") +
    '</div>';

  // Insert the HTML into the page
  var element = document.createElement("div");
  element.className = "visualization-hints";
  element.innerHTML = html;

  var foamtreeElement = foamtree.get("element");
  foamtreeElement.querySelector("div").appendChild(element);

  // For quick element selection
  var $ = function(selector) {
    return foamtreeElement.querySelector(selector);
  };

  // Manages HTML event listeners
  var listeners = (function() {
    var listeners = [];

    return {
      on: function(element, events, listener) {
        if (!element) {
          return;
        }
        events.split(/\s+/).forEach(function(event) {
          element.addEventListener(event, listener, false);
          listeners.push({
            element: element,
            event: event,
            listener: listener
          });
        });
      },

      dispose: function() {
        for (var i = listeners.length - 1; i >= 0; i--) {
          var info = listeners[i];
          info.element.removeEventListener(info.event, info.listener);
        }
      }
    }
  })();

  // Handle clicks on the hints and guide elements
  var guideElement = $(".visualization-help");

  listeners.on($(".visualization-hint .slidable.help"), "mousedown mouseup touchstart", function(event) {
    if (event.type !== "mousedown") {
      showHelp();
    }
    event.preventDefault();
    event.stopPropagation();
  });

  /* Custom event listeners: click info icon to trigger sticky text */
  listeners.on($(".visualization-hint .info"), "mousedown mouseup touchstart click", function(event) {
        if (event.type !== "mousedown") {
            $(".visualization-hint span:first-child").style.display = "";
            state.set("hints", false);
        }
        event.preventDefault();
        event.stopPropagation();
    });
    /* end spinner */
  listeners.on($(".visualization-hint .dont-show"), "mousedown mouseup touchstart click", function(event) {
    if (event.type !== "mousedown") {
      //  replace .visualization-hint with .slidable.hint in query selector by Chuqiao
      $(".slidable.hint").style.display = "none";
      state.set("hints", false);
    }
    event.preventDefault();
    event.stopPropagation();
  });

  listeners.on($(".visualization-help a[href='#close']"), "mousedown mouseup touchstart click", function(event) {
    if (event.type !== "mousedown") {
      hideHelp();
    }
    event.preventDefault();
    event.stopPropagation();
  });

  listeners.on(document, "keyup", function (event) {
    switch (event.keyCode) {
      case 27:
        hideHelp();
        break;
      case 191:
        if (event.shiftKey) {
          if (guideElement.getAttribute("class").indexOf("fadeout") >= 0) {
            showHelp();
          } else {
            hideHelp();
          }
        }
        break;
    }
  });

  function showHelp() {guideElement.setAttribute("class", "visualization-help");}

  function hideHelp() {guideElement.setAttribute("class", "visualization-help fadeout");}
};