/**
 * Created by Chuqiao on 19/5/9.
 */

function foamtreeExpStarts(columnNameResponse, pvalueResponse, token, foamtreeMapping, min, max, columnArray) {

    // Add Exp to Top 1 level
    foamtreeMapping.forEach(addTopExpAndUrl);
    function addTopExpAndUrl(group) {
        group = columnNameResponse[group.stId] ? Object.assign(group, {'exp': columnNameResponse[group.stId]}) : Object.assign(group, {'exp': undefined});
    }

    // Add Exp to child groups
    foamtreeMapping.forEach(addExpToChild);
    function addExpToChild(group) {
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(addExpToChild);

            for (var i = 0; i < group.groups.length; i++) {
                if (columnNameResponse[group.groups[i].stId]) {
                    group.groups[i] = Object.assign(group.groups[i], {'exp': columnNameResponse[group.groups[i].stId]});
                } else {
                    group.groups[i] = Object.assign(group.groups[i], {'exp': undefined});
                }
            }
        }
    }

    // Add pValue and new url to Top 1 level
    foamtreeMapping.forEach(addTopPvalueAndUrl);
    function addTopPvalueAndUrl(group){
        group = pvalueResponse[group.stId] ? Object.assign(group, {'pValue': pvalueResponse[group.stId], 'url': group.url + "&DTAB=AN&ANALYSIS=" + token}) : Object.assign(group, {'pValue': undefined, 'url': group.url + "&DTAB=AN&ANALYSIS=" + token});
    }

    // Add analysis colorValue url to child groups
    foamtreeMapping.forEach(addAnalysisUrl);
    function addAnalysisUrl(group) {
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(addAnalysisUrl);

            for (var i = 0; i < group.groups.length; i++) {
                if (columnNameResponse[group.groups[i].stId]) {
                    group.groups[i] = Object.assign(group.groups[i], {'url': group.groups[i].url + "&DTAB=AN&ANALYSIS=" + token});
                }
            }
        }
    }

    // Add pValue to child groups
    foamtreeMapping.forEach(addPvalueToChild);
    function addPvalueToChild(group) {
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(addPvalueToChild);

            for (var i =0; i < group.groups.length; i++){
                if (pvalueResponse[group.groups[i].stId]) {
                    group.groups[i] = Object.assign( group.groups[i],{'pValue': pvalueResponse[group.groups[i].stId]});
                } else {
                    group.groups[i] = Object.assign(group.groups[i],{'pValue': undefined });
                }
            }
        }
    }

    // Basic definitions
    var foamtree = new CarrotSearchFoamTree({
        id: "visualization",
        pixelRatio: window.devicePixelRatio || 1,

        stacking: "flattened",

        //Attach and draw a maximum of 8 levels of groups
        maxGroupLevelsAttached: 12,
        maxGroupLevelsDrawn: 12,
        maxGroupLabelLevelsDrawn: 12,

        //maximum duration of a complete high-quality redraw of the visualization
        finalCompleteDrawMaxDuration: 50000,
        finalIncrementalDrawMaxDuration: 50000,
        wireframeDrawMaxDuration: 5000,

        // Use a simple fading animation. Animated rollouts are very expensive for large hierarchies.
        rolloutDuration: 0.5,
        pullbackDuration: 0,

        // Lower groupMinDiameter to fit as many groups as possible
        groupMinDiameter: 0,

        // Lower the minimum label font size a bit to show more labels.
        groupLabelMinFontSize: 3,

        // Lower the border radius a bit to fit more groups.
        groupBorderWidth: 2,
        groupInsetWidth: 4,

        groupSelectionOutlineWidth: 3,

        // Tune the border options to make them more visible
        groupBorderWidthScaling: 0.5,

        // Make the description group (in flattened view) smaller to make more space for child groups.
        descriptionGroupMaxHeight: 0.25,


        // Don't use gradients and rounded cornrs for faster rendering.
        groupFillType: "plain",

        groupSelectionOutlineColor: "#58C3E5",

        //show labels during relaxation
        wireframeLabelDrawing: "always"

    });

    // Loading data set
    foamtree.set({
        dataObject: {
            groups: foamtreeMapping
        }
    });

    /* Replacing the costly "expose" animation on double click
     with a simple zoom, which is faster to execute.
     Store references to parent groups*/
    foamtree.set({
        onModelChanging: function addParent(group, parent) {
            if (!group) {
                return;
            }
            group.parent = parent;
            if (group.groups) {
                group.groups.forEach(function (g) {
                    addParent(g, group);
                });
            }
        },
        onGroupDoubleClick: function (e) {
            e.preventDefault();
            var group = e.secondary ? e.bottommostOpenGroup : e.topmostClosedGroup;
            var toZoom;
            if (group) {
                // Open on left-click, close on right-click
                this.open({
                    groups: group,
                    open: !e.secondary
                });
                toZoom = e.secondary ? group.parent : group;
            } else {
                toZoom = this.get("dataObject");
            }
            this.zoom(toZoom);
        }
    });

    // Hold a polygonal to jump to Reactome page
    foamtree.set({
        onGroupHold: function (event) {
            event.preventDefault();
            window.open(event.group.url);
        }
    });

    // Title bar
    foamtree.set({
        maxLabelSizeForTitleBar: Number.MAX_VALUE,
        titleBarDecorator: function (options, parameters, variables) {
            variables.titleBarText = parameters.group.label;
        }
    });

    // Display hints
    CarrotSearchFoamTree.hints(foamtree);

    // Coloring foamtree by color profile param from url with Exp data
    var colorParam = getUrlVars()["color"];
    var colorProfile = typeof colorParam !== "undefined" && colorParam.toUpperCase().replace(/%20/g, "_") in ColorProfileEnum ? colorParam.toUpperCase().replace(/%20/g, "_") : "COPPER";
    var profileSelected = ColorProfileEnum[colorProfile];

    var colorMaxExpInBar = ColorProfileEnum.properties[profileSelected].min_exp;
    var colorMinExpInBar = ColorProfileEnum.properties[profileSelected].max_exp;
    var colorStopExpInBar = ColorProfileEnum.properties[profileSelected].stop_exp;

    foamtree.set({
        groupColorDecorator: function (opts, params, vars) {
            if (typeof params.group.exp != "undefined") {

                // Use the first data set as default
                var coverage = params.group.exp[Object.keys(params.group.exp)[0]];
                var ratio = 1 - ((coverage - min) / (max - min));
                var pValue = params.group.pValue;
                var colorValue = threeGradient(ratio, colorMaxExpInBar, colorMinExpInBar, colorStopExpInBar);

                if (pValue !== undefined && pValue >= 0 && pValue <= 0.05) {
                    vars.groupColor.r = colorValue.red;
                    vars.groupColor.g = colorValue.green;
                    vars.groupColor.b = colorValue.blue;

                    vars.groupColor.model = "rgb";

                } else if (pValue !== undefined && pValue > 0.05) {
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].hit;
                }
            } else {
                vars.groupColor = ColorProfileEnum.properties[profileSelected].fadeout;
            }
        },
        //Color of the outline stroke for the selected groups
        groupSelectionOutlineColor: ColorProfileEnum.properties[profileSelected].hit
    });

    //Create expression data sets div and append span list
    var columnNames = document.createElement("div");
    columnNames.setAttribute("id", "columnNames");
    expressionBar.appendChild(columnNames);

    for (var j = 0; j < columnArray.length; j++) {
        var span = document.createElement("span");
        span.setAttribute("value", columnArray[j]);
        var textnode = document.createTextNode( j+1 + "/"  + columnArray.length + " :: " +columnArray[j]);
        span.appendChild(textnode);
        columnNames.appendChild(span);
    }

    // Expression bar to change color
    $(document).ready(function () {

        var divs = $('#columnNames>span');
        var now = 0;
        $("#expressionBar").show();
        // Currently shown span
        divs.hide().first().show();

        $("button[name=next]").click(function () {

            divs.eq(now).hide();
            now = (now + 1 < divs.length) ? now + 1 : 0;
            divs.eq(now).show(); // show next
            var column = divs.eq(now).show().attr('value');

            foamtree.set({
                groupColorDecorator: function (opts, params, vars) {
                    if (typeof params.group.exp != "undefined") {

                        var coverage = params.group.exp[column];
                        var pValue = params.group.pValue;
                        var ratio = 1 - ((coverage - min) / (max - min));
                        var colorValue = threeGradient(ratio, colorMaxExpInBar, colorMinExpInBar, colorStopExpInBar);

                        if (pValue !== undefined && pValue >= 0 && pValue <= 0.05) {
                            vars.groupColor.r = colorValue.red;
                            vars.groupColor.g = colorValue.green;
                            vars.groupColor.b = colorValue.blue;

                            vars.groupColor.model = "rgb";

                        } else if (pValue !== undefined && pValue > 0.05) {
                            vars.groupColor = ColorProfileEnum.properties[profileSelected].hit;
                        }
                    } else {
                        vars.groupColor = ColorProfileEnum.properties[profileSelected].fadeout;
                    }
                },
                groupSelectionOutlineColor: ColorProfileEnum.properties[profileSelected].hit
            });
            // Schedule a redraw to draw the new colors
            window.setTimeout(foamtree.redraw, 0);
        });

        $("button[name=prev]").click(function () {
            divs.eq(now).hide();
            now = (now > 0) ? now - 1 : divs.length - 1;
            divs.eq(now).show();
            var column = divs.eq(now).show().attr('value');

            //TODO foamtreePrevNextExp(column);
            foamtree.set({
                groupColorDecorator: function (opts, params, vars) {
                    if (typeof params.group.exp != "undefined") {

                        var coverage = params.group.exp[column];
                        var pValue = params.group.pValue;
                        var ratio = 1 - ((coverage - min) / (max - min));
                        var colorValue = threeGradient(ratio, colorMaxExpInBar, colorMinExpInBar, colorStopExpInBar);

                        if (pValue !== undefined && pValue >= 0 && pValue <= 0.05) {
                            vars.groupColor.r = colorValue.red;
                            vars.groupColor.g = colorValue.green;
                            vars.groupColor.b = colorValue.blue;

                            vars.groupColor.model = "rgb";

                        } else if (pValue !== undefined && pValue > 0.05) {
                            vars.groupColor = ColorProfileEnum.properties[profileSelected].hit;
                        }
                    } else {
                        vars.groupColor = ColorProfileEnum.properties[profileSelected].fadeout;
                    }
                },
                groupSelectionOutlineColor: ColorProfileEnum.properties[profileSelected].hit
            });

            // Schedule a redraw to draw the new colors
            window.setTimeout(foamtree.redraw, 0);
        });
    });

    // switching views
    document.addEventListener("click", function (e) {
        if (!e.target.href) {
            return;
        }
        e.preventDefault();
        var href = e.target.href.substring(e.target.href.indexOf("#"));
        switch (href) {
            case "#flattened":
                foamtree.set({
                    stacking: "flattened"

                });
                break;
            case "#hierarchical":
                foamtree.set({
                    stacking: "hierarchical"
                });
                break;
        }
        foamtree.set("dataObject", foamtree.get("dataObject"));
    });

    // Resize FoamTree on orientation change
    window.addEventListener("orientationchange", foamtree.resize);

    // Resize on window size changes
    window.addEventListener("resize", (function () {
        var timeout;
        return function () {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(foamtree.resize, 300);
        }
    })());

    var intervalId = null;
    var playButton = document.getElementById("playButton");
    playButton.addEventListener("click", function(){

        playButton.title = playButton.title =="Play" ? playButton.title = "Pause" : playButton.title = "Play";

        if (!intervalId) {
            intervalId = setInterval(function () {
               document.getElementById("playNext").click();
            }, 2000);
        } else {
            clearInterval(intervalId);
            intervalId = null;
        }
    });

}