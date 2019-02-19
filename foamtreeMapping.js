/**
 * Created by Chuqiao on 19/02/19.
 */

var newMapping = [];

function extractDataFromToken(response) {
//      read external Token data and save to key=>value pair R-HSA-5653656 =>1.1102230246251565e-16
    var newResponse = {};

    $.each(response.pathways, function (key, val) {
        newResponse[val.stId] = val.entities.pValue;
    });


    $.ajax({
        url: "clean_data_all_level.json",
        dataType: "json",
        success: function (data) {
            for (var i = 0; i < data.length; i++) {
                //(data[i].id) => R-HSA-5653656
                //newResponse[(data[i].id)] = 1.1102230246251565e-16
                //get the pvalue of assigned id, if the id doesn't exists, return undefined
                if (newResponse[data[i].id]) {
                    newMapping.push({
                        id: data[i].id,
                        label: data[i].label,
                        pValue: newResponse[data[i].id],
                        weight: data[i].weight,
                        groups: data[i].groups
                    });
                } else {
                    newMapping.push({
                        id: data[i].id,
                        label: data[i].label,
                        pValue: undefined,
                        weight: data[i].weight,
                        groups: data[i].groups
                    });
                }
            }
            function traverse(item) {
                if (item.groups != '') {
                    for (var index in item.groups) {
                        data = item.groups[index];
                        if (newResponse[data.id]) {
                            item.groups[index] = Object.assign({'pValue': newResponse[item.groups[index].id]}, item.groups[index]);
                        } else {
                            item.groups[index] = Object.assign({'pValue': undefined}, item.groups[index]);
                        }
                    }
                }
            }
            // mapping with second hierarchy
            for (var n in newMapping) {
                item_2 = newMapping[n];
                traverse(item_2)
            }
            //mapping with third hierarchy
            for (var n in newMapping) {
                for (var m in newMapping[n].groups) {
                    item_3 = newMapping[n].groups[m];
                    traverse(item_3)
                }
            }
            //mapping with fourth hierarchy
            for (var n in newMapping) {
                for (var m in newMapping[n].groups) {
                    for (var y in newMapping[n].groups[m].groups) {
                        item_4 = newMapping[n].groups[m].groups[y];
                        traverse(item_4)
                    }
                }
            }
            //mapping with fifth hierarchy
            for (var n in newMapping) {
                for (var m in newMapping[n].groups) {
                    for (var k in newMapping[n].groups[m].groups) {
                        for (var v in newMapping[n].groups[m].groups[k].groups) {
                            item_5 = newMapping[n].groups[m].groups[k].groups[v];
                            traverse(item_5)
                        }
                    }
                }
            }
            // mapping with sixth hierarchy
            for (var n in newMapping) {
                for (var m in newMapping[n].groups) {
                    for (var k in newMapping[n].groups[m].groups) {
                        for (var v in newMapping[n].groups[m].groups[k].groups) {
                            for (var p in newMapping[n].groups[m].groups[k].groups[v].groups) {
                                item_6 = newMapping[n].groups[m].groups[k].groups[v].groups[p];
                                traverse(item_6)
                            }
                        }
                    }
                }
            }
        }
    });

    setTimeout(foamtreeStarts, 500);

    function convert(groups) {
        return groups.map(function (group) {
            return {
                id: group.id,
                label: group.label,
                weight: Math.pow(group.weight, 0.5),
                url: group.url,
                pValue: group.pValue != null ? group.pValue : undefined,
                groups: group.groups ? convert(group.groups) : []
            }
        });
    }


    function foamtreeStarts() {
        var foamtree = new CarrotSearchFoamTree({
            id: "visualization",
            dataObject: {
                groups: convert(newMapping)
            }
        });
//              basic  definition
        foamtree.set({
            pixelRatio: window.devicePixelRatio || 1,
            // Disable animations
            rolloutDuration: 0,
            pullbackDuration: 0,
            //Customize borders, fill and strokes
            groupBorderWidth: 2,
            groupInsetWidth: 4,
            groupBorderRadius: 0.1,
            groupBorderRadiusCorrection: 1,
            groupSelectionOutlineWidth: 3.5,
            groupFillType: "gradient",
            groupFillGradientRadius: 3,
            groupFillGradientCenterLightnessShift: 20,
            groupStrokeWidth: 0.33,
            groupStrokeType: "plain",
            groupStrokePlainLightnessShift: -10,
            // Allow some more time to draw
            finalCompleteDrawMaxDuration: 500,
            finalIncrementalDrawMaxDuration: 500,
            // Make the line spacing and the total height of the
            // label smaller than the default to make space for
            // the coverage value display
            groupLabelLineHeight: 1.0,
            groupSelectionOutlineColor: "#58C3E5",
            titleBar: "inscribed",
            titleBarFontFamily: "monospace",
            //maxLabelSizeForTitleBar: Number.MAX_VALUE,
            groupLabelFontFamily: "Arial, sans-serif"
        });
        //hold a polygonal to junp to real reactome page
        foamtree.set({
            onGroupHold: function (event) {
                event.preventDefault();
                window.open(event.group.url);
            }
        });
//              Assign colors based on the  Pvalue
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
//              title bar
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
}



