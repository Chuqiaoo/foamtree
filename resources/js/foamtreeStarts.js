/**
 * Created by Chuqiao on 28/02/19.
 */

function foamtreeStarts(groupsData){

    var foamtree = new CarrotSearchFoamTree({
        id: "visualization",
        stacking: "flattened",
        pixelRatio: window.devicePixelRatio || 1,

        // Lower groupMinDiameter to fit as many groups as possible
        groupMinDiameter: 0,

        // Set a simple fading animation. Animated rollouts are very expensive for large hierarchies
        rolloutDuration: 0,
        pullbackDuration: 0,

        // Lower the border radius a bit to fit more groups
        groupBorderWidth: 2,
        groupInsetWidth: 3,
        groupBorderRadius:0,

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
        finalCompleteDrawMaxDuration: 40000,
        finalIncrementalDrawMaxDuration: 40000,
        wireframeDrawMaxDuration: 4000
    });

    // Loading data
    foamtree.set({
        dataObject: {
            groups: groupsData
        }
    });

    // Hold a polygonal to jump to Reactome pathway page
    foamtree.set({
        onGroupHold: function (e) {
            e.preventDefault();
            window.open(e.group.url);
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

    // Switching color profiles by color param from url and save to profileSelected
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