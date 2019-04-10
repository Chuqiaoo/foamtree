/**
 * Created by Chuqiao on 28/02/19.
 */

function foamtreeLoading(){
    var groupsData = getData(foamtreeData);
    var foamtree = new CarrotSearchFoamTree({
        id: "visualization",
        stacking: "flattened",
        pixelRatio: window.devicePixelRatio || 1,

        // Lower groupMinDiameter to fit as many groups as possible
        groupMinDiameter: 0,

        // Set a simple fading animation. Animated rollouts are very expensive for large hierarchies
        rolloutDuration: 0.5,
        pullbackDuration: 0,

        // Lower the border radius a bit to fit more groups
        groupBorderWidth: 2,
        groupInsetWidth: 4,

        // Don't use gradients and rounded corners for faster rendering
        groupFillType: "plain",

        // Lower the minimum label font size a bit to show more labels
        groupLabelMinFontSize: 3,

        // Attach and draw a maximum of 8 levels of groups
        maxGroupLevelsAttached: 12,
        maxGroupLevelsDrawn: 12,
        maxGroupLabelLevelsDrawn: 12,

        // Tune the border options to make them more visible
        groupBorderWidthScaling: 0.5,

        // Width of the selection outline to draw around selected groups
        groupSelectionOutlineWidth: 3,

        // Show labels during relaxation
        wireframeLabelDrawing: "always",

        // Make the description group (in flattened view) smaller to make more space for child groups
        descriptionGroupMaxHeight: 0.25,

        // Maximum duration of a complete high-quality redraw of the visualization
        finalCompleteDrawMaxDuration: 50000,
        finalIncrementalDrawMaxDuration: 50000,
        wireframeDrawMaxDuration: 5000
    });

    // Set the largest nesting level for debugging and color in red when there is no space to draw
    groupsData.forEach(setMaxLevel);

    foamtree.set({
        dataObject: {
            groups: groupsData
        }
    });

    // Title bar
    foamtree.set({
        // Setting the option to Number.MAX_VALUE will cause the title bar to appear for all groups.
        maxLabelSizeForTitleBar: Number.MAX_VALUE,
        titleBarDecorator: function(options, parameters, variables) {
            variables.titleBarText = parameters.group.label;
        }
    });

    // Hold a polygonal to jump to Reactome pathway page
    foamtree.set({
        onGroupHold: function (e) {
            e.preventDefault();
            window.open(e.group.url);
        }
    });

    /*Switching color profiles by url
    * Color foamtree by Reactome color profiles*/
    var colorParam =  getUrlVars()["color"];
    if (typeof colorParam !== "undefined" && colorParam.toUpperCase() in ColorProfileEnum) {
        var profileSelected = ColorProfileEnum[colorParam.toUpperCase()];
        foamtree.set({
            groupColorDecorator: function (opts, props, vars) {
                // If child groups of some group don't have enough space to
                // render, draw the parent group in red.
                if (props.hasChildren && props.browseable === false) {
                    vars.groupColor = "#E86365";
                    vars.labelColor = "#000";
                } else {
                    // Check in the Enum to get value and to change profileSelected
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].group;
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
                }
            },
            // Color of the outline stroke for the selected groups
            groupSelectionOutlineColor : ColorProfileEnum.properties[profileSelected].group
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
                    var profileSelected = ColorProfileEnum.COPPER;
                    // Check in the Enum to get value and to change profileSelected
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].group;
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
                }
            },
            groupSelectionOutlineColor: ColorProfileEnum.properties[ColorProfileEnum.COPPER].group
        });
    }

    // Load hints
    CarrotSearchFoamTree.hints(foamtree);

    // Switching views
    document.addEventListener("click", function (e) {
        if (!e.target.href) {
            return;
        }
        e.preventDefault();
        var href = e.target.href.substring(e.target.href.indexOf("#"));
        switch (href) {
            case "#flattened":
                foamtree.set({stacking: "flattened"});
                break;
            case "#hierarchical":
                foamtree.set({stacking: "hierarchical"});
                break;
        }
        foamtree.set("dataObject", foamtree.get("dataObject"));
    });

    // Resize FoamTree on orientation change
    window.addEventListener("orientationchange", foamtree.resize);

    // Resize on window size changes
    window.addEventListener("resize", (function() {
        var timeout;
        return function() {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(foamtree.resize, 300);
        }
    })());

}