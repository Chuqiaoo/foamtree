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
 */
window.CarrotSearchFoamTree.hints = function(foamtree) {
  var macOs = /Mac/.test(window["navigator"]["userAgent"]);
  var touch = ('ontouchstart' in window) || (!!window["DocumentTouch"] && document instanceof window["DocumentTouch"]);

  // The list of available interactions, used to build the
  // complete interaction guide screen.
  var interactions = [
    [
      {
        desktop: "Left click",
        touch: "Tap",
        action: "select group, again to deselect"
      },
      {
        desktop: (macOs ? "[&#8984;]" : "[Ctrl]") + " + Left click",
        action: "select multiple groups"
      }
    ],
    [
      {
        desktop: "Left double click",
        touch: "Double tap",
        action: "expose group"
      },
      {
        desktop: "Right double click<br /><small>or [Shift] + Left double click</small>",
        touch: "Two-finger double tap",
        action: "unexpose group"
      }
    ],
    [
      {
        desktop: "Left click-and-hold",
        touch: "Tap-and-hold",
        action: "open group"
      },
      {
        desktop: "Right click-and-hold<br /><small>or [Shift] + Left click-and-hold</small>",
        touch: "Two-finger tap-and-hold",
        action: "close group"
      }
    ],
    [
      {
        desktop: "Mouse wheel",
        touch: "Pinch",
        action: "zoom in / out"
      },
      {
        desktop: "Mouse drag",
        touch: "Drag",
        action: "pan around zoomed visualization"
      },
      {
        desktop: "[Esc] or rapid zoom out",
        touch: "Three-finger pinch",
        action: "unexpose &amp; close all groups"
      }
    ],
    [
      {
        desktop: "[?]",
        action: "show / hide this help"
      }
    ]
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

  var showHints = state.get("hints");

  // The hints box
  var hintsHtml =
    '<div class="visualization-hint">\
      <span class="slidable hint"></span>\
      <a href="#" class="slidable dont-show">don\'t show again</a>\
      <span class="slidable help">help</span><span class="info">i</span>\
    </div>';

  // The complete HTML, including interaction guide
  var html =
    (showHints ? hintsHtml : "") +
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

  // Shows/hides the contextual interaction hints
  var hint = (function() {
    var hint = $(".visualization-hint .hint"),
        hintContainer = $(".visualization-hint");

    return {
      show: function(text) {
        hint.innerHTML = text;
        hintContainer.setAttribute("class", "visualization-hint shown");
      },

      hide: function() {
        hint.innerHTML = "";
        hintContainer.setAttribute("class", "visualization-hint");
      }
    }
  })();

  // The list of interactions that trigger contextual hints.
  var hints = (function() {
    var current;

    var conditions = [
      {
        for: "expose",
        complete: false,
        condition: function(group, groupState, hasChildren, parent, parentState) {
          return hasChildren;
        },
        text: "To zoom in to sub-groups, double click the parent group"
      },
      {
        for: "unexpose",
        complete: false,
        condition: function(group, groupState, hasChildren, parent, parentState) {
          return parentState && parentState.exposed;
        },
        text: "To zoom out to parent group, double click with right mouse button"
      },
      {
        for: "open",
        complete: false,
        condition: function(group, groupState, hasChildren, parent, parentState) {
          return hasChildren;
        },
        text: "To access subgroups, click and hold"
      },
      {
        for: "close",
        complete: false,
        condition: function(group, groupState, hasChildren, parent, parentState) {
          return parent && parentState.open;
        },
        text: "To access parent group, click and hold right mouse button"
      },
      {
        for: "reset",
        complete: false,
        condition: function(group, groupState, hasChildren, parent, parentState) {
          return foamtree.get("exposure").length > 0;
        },
        text: "To zoom out and close all groups, press Esc"
      },
      {
        for: "mousewheel",
        complete: false,
        condition: function(group, groupState, hasChildren, parent, parentState) {
          return true;
        },
        text: "Use mouse wheel to zoom in and out"
      }
    ];

    function actionPerformed(action) {
      if (current && current.for === action) {
        hint.hide();
        current = undefined;
      }
      for (var i = conditions.length - 1; i >= 0; i--) {
        var condition = conditions[i];
        if (condition.for === action) {
          condition.complete = true;
        }
      }
    }

    return {
      hovered: function(event) {
        var group = event.group;
        var state = foamtree.get("state", group);
        var hasChildren = group.groups && group.groups.length > 0;
        var parent = event.bottommostOpenGroup;
        var parentState = parent && foamtree.get("state", parent);

        for (var i = 0; i < conditions.length; i++) {
          var condition = conditions[i];
          if (!condition.complete && condition.condition(group, state, hasChildren, parent, parentState)) {
            hint.show(condition.text);
            current = condition;
            break;
          }
        }
      },

      performed: actionPerformed
    };
  })();

  // Attach FoamTree listeners that will drive the contextual hints
  var foamtreeListeners = (function() {
    if (!state.get("hints")) {
      return;
    }

    var timeout;

    function clear() {
      window.clearTimeout(timeout);
    }

    foamtree.on("groupHover", function(event) {
      if (!event.group) {
        return;
      }

      window.clearTimeout(timeout);
      timeout = window.setTimeout(function() {
        hints.hovered(event);
      }, 1000);
    });

    foamtree.on("groupClick", clear);
    foamtree.on("groupDoubleClick", clear);
    foamtree.on("groupHold", clear);
    foamtree.on("groupMouseWheel", clear);

    var createDeltaCounter = function(onIncrease, onDecrease) {
      var previous = 0;
      return function(event) {
        if (!event.indirect) {
          hints.performed(previous <= event.groups.length ? onIncrease : onDecrease);
          previous = event.groups.length;
        }
      };
    };

    foamtree.on("groupExposureChanged", createDeltaCounter("expose", "unexpose"));
    foamtree.on("groupOpenOrCloseChanged", createDeltaCounter("open", "close"));
    foamtree.on("viewReset", function() {
      hints.performed("reset");
    });
    foamtree.on("groupMouseWheel", function() {
      hints.performed("mousewheel");
    })
  })();

  // Handle clicks on the hints and guide elements
  var guideElement = $(".visualization-help");


  listeners.on($(".visualization-hint"), "mousedown mouseup touchstart", function(event) {
    if (event.type !== "mousedown") {
      showHelp();
    }
    event.preventDefault();
    event.stopPropagation();
  });

  listeners.on($(".visualization-hint .dont-show"), "mousedown mouseup touchstart click", function(event) {
    if (event.type !== "mousedown") {
      $(".visualization-hint").style.display = "none";
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

  function showHelp() {
    guideElement.setAttribute("class", "visualization-help");
  }

  function hideHelp() {
    guideElement.setAttribute("class", "visualization-help fadeout");
  }
};