/**
 * Created by Chuqiao on 28/02/19.
 */


function foamtreeLoading(){

    var groupsData = getData(foamtreeData);

    var foamtree = new CarrotSearchFoamTree({
        id: "visualization",
        pixelRatio: window.devicePixelRatio || 1,

        stacking: "flattened",

        //Attach and draw a maximum of 12 levels of groups
        maxGroupLevelsAttached: 12,
        maxGroupLevelsDrawn: 12,
        maxGroupLabelLevelsDrawn: 12,
        //maximum duration of a complete high-quality redraw of the visualization
        finalCompleteDrawMaxDuration: 50000,
        finalIncrementalDrawMaxDuration: 50000,
        wireframeDrawMaxDuration: 5000,

        // resize
        relaxationVisible: false,
        relaxationQualityThreshold: 5,
        rolloutDuration: 0,
        pullbackDuration: 0,

        // Use a simple fading animation. Animated rollouts are very expensive for large hierarchies.
        //rolloutDuration: 0.5,
        //pullbackDuration: 0,

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

    //set the largest nesting level for debugging.
    groupsData.forEach(setMaxLevel);
    function setMaxLevel(group) {
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(setMaxLevel);
            group.maxLevel = group.groups.reduce(function (max, group) {
                return Math.max(max, group.maxLevel);
            }, 0) + 1;
        } else {
            group.maxLevel = 1;
        }
    }

    foamtree.set({
        dataObject: {
            groups: groupsData
        }
    });

    //title bar
    foamtree.set({

        // Setting the option to Number.MAX_VALUE will cause the title bar to appear for all groups.
        maxLabelSizeForTitleBar: Number.MAX_VALUE,
        titleBarDecorator: function(options, parameters, variables) {
            variables.titleBarText = parameters.group.label;
        }
    });

    //hold a polygonal to jump to Reactome pathway page
    foamtree.set({
        onGroupHold: function (e) {
            e.preventDefault();
            window.open(e.group.url);
        }
    });

    //customization colors, use COPPER as default color profile
    foamtree.set({
        groupColorDecorator: function (opts, props, vars) {
            // If child groups of some group don't have enough space to
            // render, draw the parent group in red.
            if (props.hasChildren && props.browseable === false) {
                vars.groupColor = "#E86365";
                vars.labelColor = "#000";
            } else {
                //vars.groupColor = "#58C3E5";
                //vars.labelColor = "#000";
                var profileSelected = ColorProfileEnum.COPPER;
                // check in the Enum to get value and to change profileSelected
                vars.groupColor = ColorProfileEnum.properties[profileSelected].group;
                vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
            }
        }
    });

    //switching color profiles by url
    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m ,key, value) {
            vars[key] = value;
        });
        return vars
    }

    var colorParam =  getUrlVars()["color"];
    if (typeof colorParam !== "undefined" ) {
        foamtree.set({
            groupColorDecorator: function (opts, props, vars) {
                // If child groups of some group don't have enough space to
                // render, draw the parent group in red.
                if (props.hasChildren && props.browseable === false) {
                    vars.groupColor = "#E86365";
                    vars.labelColor = "#000";
                } else {
                    //vars.groupColor = "#58C3E5";
                    //vars.labelColor = "#000";
                    var profileSelected = ColorProfileEnum[colorParam];
                    //var colorParam = ""; // TODO get color from queryString
                    // check in the Enum to get value and to change profileSelected
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].group;
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
                }
            }
        });
    } else {
        foamtree.set({

            groupColorDecorator: function (opts, props, vars) {
                // If child groups of some group don't have enough space to
                // render, draw the parent group in red.
                if (props.hasChildren && props.browseable === false) {
                    vars.groupColor = "#E86365";
                    vars.labelColor = "#000";
                } else {
                    //vars.groupColor = "#58C3E5";
                    //vars.labelColor = "#000";
                    var profileSelected = ColorProfileEnum.COPPER;
                    //var colorParam = ""; // TODO get color from queryString
                    // check in the Enum to get value and to change profileSelected
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].group;
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
                }
            }
        });
    }


    //load hints
    CarrotSearchFoamTree.hints(foamtree);

    //switching views
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

    //switching color profiles
    document.getElementById("colorSelector").addEventListener("change", function (e) {
        e.preventDefault();

        var color = e.target.value;

        foamtree.set({
            groupColorDecorator: function (opts, props, vars) {
                // If child groups of some group don't have enough space to
                // render, draw the parent group in red.
                if (props.hasChildren && props.browseable === false) {
                    vars.groupColor = "#E86365";
                    vars.labelColor = "#000";
                } else {
                    //vars.groupColor = "#58C3E5";
                    //vars.labelColor = "#000";
                    var profileSelected = ColorProfileEnum[color];
                    //var colorParam = ""; // TODO get color from queryString
                    // check in the Enum to get value and to change profileSelected
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].group;
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
                }
            }
        });

        foamtree.set("dataObject", foamtree.get("dataObject"));
    });

    // resize FoamTree on orientation change
    window.addEventListener("orientationchange", foamtree.resize);

    // resize on window size changes
    window.addEventListener("resize", (function() {
        var timeout;
        return function() {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(foamtree.resize, 300);
        }
    })());

}