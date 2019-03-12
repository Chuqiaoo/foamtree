/**
 * Created by Chuqiao on 07/03/19.
 */

function foamtreeStarts(newResponse, tokenUrl) {

    var foamtreeMapping = getData(foamtreeData);

    //set Max Level for debugging
    foamtreeMapping.forEach(setMaxLevel);
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

    //add Pvalue and new url to Top 1 level
    foamtreeMapping.forEach(addTopPvalueAndUrl);
    function addTopPvalueAndUrl(group){

        if (newResponse[group.stId]) {

            group = Object.assign( group, {'pValue': newResponse[group.stId], 'url': group.url+ "&DTAB=AN&ANALYSIS=" + tokenUrl.value });

        } else {

            group = Object.assign(group, {'pValue': undefined, 'url': group.url+ "&DTAB=AN&ANALYSIS=" + tokenUrl.value  });
        }
    }

    //add Pvalue to child groups
    foamtreeMapping.forEach(addPvalueToChild);
    function addPvalueToChild(group) {
        if (group.groups && group.groups.length > 0) {

            group.groups.forEach(addPvalueToChild);

            for (var i =0; i < group.groups.length; i++){

                if (newResponse[group.groups[i].stId]) {

                    group.groups[i] = Object.assign( group.groups[i],{'pValue': newResponse[group.groups[i].stId]});

                } else {

                    group.groups[i] = Object.assign(group.groups[i],{'pValue': undefined });
                }
            }
        }
    }


    //add analysis result url to child groups
    foamtreeMapping.forEach(addAnalysisUrl);
    function addAnalysisUrl(group) {
        if (group.groups && group.groups.length > 0) {

            group.groups.forEach(addAnalysisUrl);

            for (var i =0; i < group.groups.length; i++){

                if (newResponse[group.groups[i].stId]) {

                    group.groups[i] = Object.assign( group.groups[i],{'url': group.groups[i].url + "&DTAB=AN&ANALYSIS=" + tokenUrl.value});

                }
            }
        }
    }

    //basic  definition
    var foamtree = new CarrotSearchFoamTree({
        id: "visualization",
        pixelRatio: window.devicePixelRatio || 1,

        stacking: "flattened",

        //Attach and draw a maximum of 8 levels of groups
        maxGroupLevelsAttached: 8,
        maxGroupLevelsDrawn: 8,
        maxGroupLabelLevelsDrawn: 8,

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

    foamtree.set({
        dataObject: {
            groups: foamtreeMapping
        }
    });

    //hold a polygonal to jump to real reactome page
    foamtree.set({
        onGroupHold: function (event) {
            event.preventDefault();
            window.open(event.group.url);
        }
    });

    //Assign colors based on the  Pvalue
    foamtree.set({
        groupColorDecorator: function (opts, params, vars) {
            var coverage = params.group.pValue;
            if (coverage !== undefined && coverage >= 0 && coverage <= 0.05) {
                // Coverage defined. 0% coverage will be yellow,
                // 100% coverage will be olive.
                // min yellow : hsl(52, 98%, 60%)
                //max: olive  : hsl (58, 100, 29)
                vars.groupColor.h = 52 + 6 * (coverage / 0.05 );
                vars.groupColor.s = 98 + 2 * (coverage / 0.05 );
                vars.groupColor.l = 60 - 31 * (coverage / 0.05 );
            } else {
                // Coverage not defined, draw the group in grey.
                vars.groupColor.s = 0;
                vars.groupColor.l = 75;
            }
        }
    });
    //title bar
    foamtree.set({
        maxLabelSizeForTitleBar: Number.MAX_VALUE,
        titleBarDecorator: function (options, parameters, variables) {
            variables.titleBarText = parameters.group.label;
        }
    });

    CarrotSearchFoamTree.hints(foamtree);
    // Handle customization links

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

};
