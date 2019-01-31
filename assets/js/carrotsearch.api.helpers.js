
(function() {
  //
  // Set up the demo container element and keyboard/ click hooks to hide it.
  //
  var $overlay = $("#example-overlay");
  var $visualization = $("#visualization");
  $overlay.on('click', function(e) {
    if (e.target === $overlay.get(0)) {
      closeExample();
    }
  });
  $("body").on('keydown', function(e) {
    if (e.which == 27) {
      closeExample();
    }
  });

  // Close the demo container and invoke any afterhooks, if defined.
  var afterhook;
  function closeExample() {
    if (!$overlay.hasClass("fadeout")) {
      $overlay.addClass("fadeout");
      if (afterhook) {
        eval.call(null, afterhook);
        afterhook = undefined;
      }
    }
  }

  //
  // Set up the environment for executable examples, including partial examples that require a model.
  //
  $("pre.executable").after(function() {
    var partial = $(this).is(".partial");
    var empty = $(this).is(".empty");
    var overlay = !($(this).is(".nooverlay"));
    var requiresFullVersion = $(this).is(".requiresFullVersion");
    var code = $(this).text();

    // Collect hooks before they're pretty printed.
    var runbefore = $(this).attr("data-runbefore");
    var runafter  = $(this).attr("data-runafter");
    if (runbefore) runbefore = $("#" + runbefore).text();
    if (runafter) runafter = $("#" + runafter).text();

    var $button = $('<button class="btn btn-xs btn-info" type="button">Run example</button>').on("click", function() {
      if ($button.hasClass("disabled")) return;

      window["foamtree"] && window["foamtree"].dispose();

      $visualization.empty();
      if (overlay) {
        $overlay.removeClass("fadeout");
      }

      setTimeout(function() {
        if (partial) { // requires initialization.
          window["foamtree"] = new CarrotSearchFoamTree({
            id: "visualization",
            pixelRatio: window.devicePixelRatio || 1,
            rolloutDuration: 0,
            pullbackDuration: 0,
            fadeDuration: 0
          });
          if (!empty) {
            window["foamtree"].set({
              dataObject: {
                groups: [
                  { id: "1", label: "Group 1", groups: [
                    { id: "1.1", label: "Group 1.1" },
                    { id: "1.2", label: "Group 1.2" }
                  ]},
                  { id: "2", label: "Group 2", groups: [
                    { id: "2.1", label: "Group 2.1" },
                    { id: "2.2", label: "Group 2.2" }
                  ]},
                  { id: "3", label: "Group 3", groups: [
                    { id: "3.1", label: "Group 3.1" },
                    { id: "3.2", label: "Group 3.2" }
                  ]},
                  { id: "4", label: "Group 4", groups: [
                    { id: "4.1", label: "Group 4.1" },
                    { id: "4.2", label: "Group 4.2" }
                  ]},
                  { id: "5", label: "Group 5", groups: [
                    { id: "5.1", label: "Group 5.1" },
                    { id: "5.2", label: "Group 5.2" }
                  ]}
                ]
              }
            });
          }
        }

        if (runbefore) {
          eval.call(null, runbefore);
        }
        if (runafter) {
          afterhook = runafter;
        }

        eval.call(null, code);
      }, 10);
    });

    var $buttonline = $('<div class="executable-buttons"></div>').append($button);

    if (document.location.protocol == "file:" && $(this).hasClass("requireshttp")) {
      $button.addClass("disabled");
      $buttonline.append(' <span class="label label-warning">Will not work when opened as file://</span>');
    }

    if (requiresFullVersion) {
      // Defer until we have the visualization loaded.
      $(document).ready(function() {
        if (!CarrotSearchFoamTree.version().brandingAllowed) {
          $button.addClass("disabled");
          $buttonline.append(' <span class="label label-warning">Requires full version</span>');
        }
      });
    }

    return $buttonline;
  });

  window.randomGroups = function (count, levels) {
    if (levels === undefined) {
      levels = 1;
    }
    var arr = [];
    if (levels > 0) {
      for (var i = 0; i < count; i++) {
        arr.push({
          label: "",
          weight: 0.1 + Math.random() +
            (Math.random() < 0.2 ? Math.random() * 3 : 0),
          groups: window.randomGroups(count, levels - 1)
        });
      }
    }
    return arr;
  };

  //
  // Configure pretty printed listings.
  //
  $(document).ready(function() {
    $("pre.example").addClass("javascript").each(function (i, e) {
        hljs.highlightBlock(e);
      }
    );
  });


  //
  // Add some styling to repeatable sections.
  //
  $(document).ready(function() {
    $(".api > h3").addClass("well");
  });

  //
  // Trigger full version class.
  //
  $(document).ready(function() {
    if (CarrotSearchFoamTree.version().brandingAllowed) {
      $("body").addClass("fullVersion");
    }
  });


  //
  // Trigger touch devices class.
  //
  $(document).ready(function() {
    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
      $("body").addClass("touchdev");
    }
  });


  // Update scroll spy after element positions change.
  var updateScrollSpy = function () {
    $('[data-spy="scroll"]').each(function () {
      $(this).scrollspy('refresh');
      $(this).scrollspy('process');
    });
  };

  //
  // Set up the version information, TOC and scrollspy once we're fully loaded.
  //
  $(document).ready(function() {
    // Create TOC bar.
    var $toc = $("#toc");
    makeToc($("section[role = 'main']").eq(0), $toc);

    // Support for searching
    var $tocLinks = $toc.find("a");

    // Index camel case strings separately
    $tocLinks.each(function() {
      var $link = $(this);
      $link.data("searchable", $link.text());
    });

    $("#search").on("keyup click", function(e) {
      // On enter -- go to the first highlighted result
      if (e.keyCode === 13) {
        var firstMatch = $tocLinks.filter(".matched").eq(0);
        if (firstMatch.size() === 1) {
          document.location.hash = firstMatch.attr("href").substring(1);
          return;
        }
      }

      var prefix = $.trim(this.value);
      var prefixForRegex = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      var regex = prefix.length > 0 ? new RegExp("(" + prefixForRegex + ")", "gi") : /a^/;

      // Highlight hits
      var anythingMatched = false;
      $tocLinks.each(function() {
        var $link = $(this);
        var text = $link.data("searchable");
        var replaced = text.replace(regex, "<span class='hl'>$1</span>");
        var matched = replaced !== text;
        if ($link.html() !== replaced) {
          $link.html(replaced);
        }
        $link.toggleClass("matched", matched);
        anythingMatched = anythingMatched || matched;
      });

      if (anythingMatched) {
        $tocLinks.parent().hide();
        $tocLinks.filter(".matched")
          .parentsUntil($toc).show().end()
          .siblings("ul").children().show();
      } else {
        $tocLinks.parent().show();
      }
    }).focus();

    // Focus search box when / is pressed
    $(document).keyup(function(e) {
      if (e.target === document.body) {
        if (e.keyCode === 191 && !e.shiftKey || e.keyCode === 220) {
          $("#search").select().focus();
        }
      }
    });

    function makeToc($parent, $target) {
      var $sections = $parent.find("section[id]").not(".notoc").filter(function () {
        return $(this).parent().closest("section").is($parent);
      });

      if ($sections.length > 0) {
        $target.append(
          $('<ul class="nav" />').append($sections.map(function (i, section) {
            var $section = $(section);
            var $h = $section.find("h1, h2, h3, h4, h5, h6").eq(0);
            var title = $h.attr("data-alt") || $h.text();

            var $li = $('<li><a></a></li>')
              .find("a")
                .attr("href", "#" + section.id)
                .attr("class", $section.attr("class"))
                .text(title)
              .end();
            makeToc($section, $li);
            return $li;
          }).toArray())
        );
      }
    }
  });


  //
  // Link up API references.
  //
  $(document).ready(function() {
    // Collect API entries.
    var apiEntries = {};
    $('.api[id]').each(function(i, e) {
      var key = $(e).attr("id");
      if (apiEntries.hasOwnProperty(key)) {
        console.error("Duplicate API key: " + key);
      }
      apiEntries[key] = true;
    });

    // Link up code references.
    var $code = $("code");
    $code.filter(function(e) {
      var $this = $(this);
      return $this.data("deprecation-href") || (apiEntries.hasOwnProperty($this.text()) && !$this.hasClass("nolink"));
    }).wrapInner(function() {
      var $this = $(this);
      return "<a href='" + ($this.data("href") || $this.data("deprecation-href") || ("#" + $this.text())) + "' />";
    });
  });


  //
  // Set up font size button
  //
  $(document).ready(function() {
    var toggleFont = function(advance) {
      var cookieName = "foamtree.api.font";
      var options = ['normal', 'small', 'large'];

      var $btn = $("#toggle-font");
      var value = $btn.data(cookieName) || (localStorage && localStorage[cookieName]);
      if (!value) {
        value = options[0];
      }

      if (advance) {
        value = options[(options.indexOf(value) + 1) % options.length];
      }

      $btn.data(cookieName, value);
      localStorage && (localStorage[cookieName] = value);

      var $body = $("body");
      $body.removeClass("navsmall navnormal navlarge");
      switch (value) {
        case "normal":
          $body.addClass("navnormal");
          break;
        case "large":
          $body.addClass("navlarge");
          break;
        case "small":
        default:
          $body.addClass("navsmall");
          break;
      }
      $btn.find("span").text(value);
    };

    $("#toggle-font").on("click", function() { toggleFont(true); });
    toggleFont(false);
  });


  //
  // Fill-in external attribute data (types, constraints).
  //
  $(document).ready(function() {
    // Because we're running after the DOM has been rendered the scroll position will be invalid after
    // we inject new elements. We can't run on document.ready though because by then the visualization
    // may not have fully loaded. Tough nut to crack.
    var defaults = {};
    // Copy manually (jquery's extend doesn't copy undefined values).
    var source = CarrotSearchFoamTree.defaults;
    for (var prop in source) {
      defaults[prop] = source[prop];
    }

    $('.api[id]').each(function(i, e) {
      var $section = $(e);
      var key = $section.attr("id");
      var isAMethod = $section.parents('[id="methods"]').length > 0;
      var specs = [];
      if (isAMethod) {
        if ($section.data("since")) {
          specs.push("@since " + $section.data("since"));
        }
      } else {
        var shouldBeDocumented = !$section.hasClass("nodefault");

        var attr = CarrotSearchFoamTree.asserts.spec(key);
        if (attr) {
          if (attr.type) {
            specs.push("@type " + attr.type);
          }
          if (attr.asserts) {
            specs.push("@assert " + attr.asserts);
          }
          if (attr.since) {
            specs.push("@since " + attr.since);
          } else {
            console.log("Missing @since information for " + key);
          }
          if (attr.deprecated) {
            specs.push("@deprecated " + attr.deprecated);
          }
        } else {
          if ($section.data("since")) {
            specs.push("@since " + $section.data("since"));
          }
          if (shouldBeDocumented) {
            console.error("No constraint for attribute: " + key);
          }
        }
        if (defaults.hasOwnProperty(key)) {
          var defValue = defaults[key];
          delete defaults[key];
          if (defValue === null) {
            defValue = undefined;
          }
          switch (typeof defValue) {
            case "undefined":
              // no default value.
              break;
            case "function":
              defValue = "[default implementation]";
              break;
            case "string":
              defValue = '"' + defValue + '"';
          }
          if (Array.isArray(defValue)) {
            defValue = "[" + (defValue.length > 0 ? "..." : "") + "]";
          }
          if (defValue != null && (typeof defValue != "undefined")) {
            specs.push("@defaultValue " + defValue);
          }
        } else {
          if (shouldBeDocumented && !attr.static) {
            console.error("Documented visualization attribute without a default value: " + key);
          }
        }
      }

      $section.find("h3").append(specs.reduce(function (html, s) {
        return html + "<div>" + s + "</div>";
      }, ""));
    });

    // Check for undocumented values.
    $.each(defaults, function(k,v) {
      console.error("Undocumented visualization attribute: " + k);
    });

    // If visited with empty cache, we still need to fix the offset
    var $anchor = $(document.location.hash);
    if ($anchor.size() === 1) {
      $(window).scrollTop($anchor.offset().top);
    }
  });


  //
  // Restore scroll positions from session storage.
  //
  $(window).load(function() {
    if (document.location.hash) {
      var $sidebar = $(".bs-sidebar").eq(0);
      var $anchor = $("#toc a[href='" + document.location.hash + "']");

      if ($anchor.size() > 0) {
        $sidebar.scrollTop($anchor.offset().top -
          $sidebar.offset().top - 40 /* search box margin */);
        updateScrollSpy();
      }
    }
  });
})();