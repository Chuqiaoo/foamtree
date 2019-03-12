/**
 * Created by Chuqiao on 28/02/19.
 */

function getData(data) {

    //  json object container
    var groups = [];

    // save data as key => value pair, use dbId as key for per pairs
    var humanDataStId = {};
    $.each(data.nodes, function (key, val) {
        humanDataStId[val.dbId] = val.stId;
    });

    var humanDataName = {};
    $.each(data.nodes, function (key, val) {
        humanDataName[val.dbId] = val.name;
    });

    var humanDataRatio = {};
    $.each(data.nodes, function (key, val) {

        if (val.ratio != 0) {
            humanDataRatio[val.dbId] = val.ratio * 1000;

        } else {

            humanDataRatio[val.dbId] = (val.ratio + 0.009) * 1000;
        }

    });

    var humanDataUrl = {};
    $.each(data.nodes, function (key, val) {
        humanDataUrl[val.dbId] = "https://dev.reactome.org/PathwayBrowser/#/" + val.stId;
    });

    //get all nested children
    function getNestedChildren(arr, parentId) {
        // create a new object to store the result
        var out = [];

        for (var i = 0; i < arr.length; i++) {

            // find all children of parentId
            if (arr[i].from == parentId) {

                // recursively find children for each children of parentId
                var grandGroups = getNestedChildren(arr, arr[i].to);

                if (grandGroups.length) {
                    arr[i].groups = grandGroups
                }
                out.push(arr[i]);
            }
        }
        return out
    }

    // add all Nested children to level 1 parent
    function addAllNestedToParent(arr, parentID) {

        var allNestedChild = getNestedChildren(arr, parentID);

        var parent = {to: parentID, groups: []};

        parent.groups = Object.assign(parent.groups, allNestedChild);

        return parent
    }

    getFullLeveldbId();

    function getFullLeveldbId() {
        $.ajax({
            //warning here
            async: false,
            //human sapiens top data
            url: "https://dev.reactome.org/ContentService/data/pathways/top/9606",
            dataType: "json",
            success: function (topData) {

                topData.forEach(function (item) {
                    var each = addAllNestedToParent(data.edges, item.dbId);
                    groups.push(each);
                });
//                         for ( var j=0; j< topData.length; j++) {
//                              var each = {};
//                              each[j] = addAllNestedToParent(data.edges, topData[j].dbId);
//                              groups.push(each[j]);
//
//                         }
            }
        });
        return groups
    };

    //create a dedicated copy for each parent group tp remove shared references
    groups = JSON.parse(JSON.stringify(groups));

    addValue(groups);
    function addValue(groups) {

        for (var k = 0; k < groups.length; k++) {
            if (humanDataStId[groups[k].to]) {

                groups[k] = Object.assign(groups[k], {'stId': humanDataStId[groups[k].to]});
            }

            if (humanDataName[groups[k].to]) {

                groups[k] = Object.assign(groups[k], {'label': humanDataName[groups[k].to]});
            }

            if (humanDataRatio[groups[k].to]) {

                groups[k] = Object.assign(groups[k], {'weight': humanDataRatio[groups[k].to]});
            }

            if (humanDataUrl[groups[k].to]) {

                groups[k] = Object.assign(groups[k], {'url': humanDataUrl[groups[k].to]});
            }
            delete groups[k].to;
        }
    }

    groups.forEach(addValueToChildren);
    function addValueToChildren(group) {
        if (group.groups && group.groups.length >= 0) {
            group.groups.forEach(addValueToChildren);

            for (var i = 0; i < group.groups.length; i++) {

                // delete form (parent key) in arrary
                delete group.groups[i].from;


                if (humanDataStId[group.groups[i].to]) {

                    group.groups[i] = Object.assign(group.groups[i], {'stId': humanDataStId[group.groups[i].to]});
                }

                if (humanDataName[group.groups[i].to]) {

                    group.groups[i] = Object.assign(group.groups[i], {'label': humanDataName[group.groups[i].to]});
                }

                if (humanDataRatio[group.groups[i].to]) {

                    group.groups[i] = Object.assign(group.groups[i], {'weight': humanDataRatio[group.groups[i].to]});
                }

                if (humanDataUrl[group.groups[i].to]) {

                    group.groups[i] = Object.assign(group.groups[i], {'url': humanDataUrl[group.groups[i].to]});
                }

                // delete to (dbId) in arrary
                delete group.groups[i].to;

            }

        }
    }


    return groups
};
