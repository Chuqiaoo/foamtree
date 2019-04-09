/**
 * Created by Chuqiao on 28/02/19.
 */

function getData(data) {

    // Json object container
    var groups = [];

    // Save data as key => value pair, use dbId as key for per pairs
    var humanDataStId = {};
    var humanDataName = {};
    var humanDataRatio = {};
    var humanDataUrl = {};
    $.each(data.nodes, function (key, val) {
        humanDataStId[val.dbId] = val.stId;
        humanDataName[val.dbId] = val.name;
        if (val.ratio != 0) {
            humanDataRatio[val.dbId] = val.ratio * 1000;
        } else {
            // Set ratio = 0.009 when ratio = 0
            humanDataRatio[val.dbId] = 9
        }
        humanDataUrl[val.dbId] = "/PathwayBrowser/#/" + val.stId;
    });

    // Get all nested children
    function getNestedChildren(arr, parentId) {
        var out = [];

        for (var i = 0; i < arr.length; i++) {
            // Find all children of parentId
            if (arr[i].from == parentId) {
                // Recursively find children for each children of parentId
                var grandGroups = getNestedChildren(arr, arr[i].to);
                if (grandGroups.length) {arr[i].groups = grandGroups}
                out.push(arr[i]);
            }
        }
        return out
    }

    // Add all Nested children to level 1 parent
    function addAllNestedToParent(arr, parentID) {
        var allNestedChild = getNestedChildren(arr, parentID);
        var parent = {to: parentID, groups: []};
        parent.groups = Object.assign(parent.groups, allNestedChild);
        return parent
    }

    // TODO a async ajax call here
    (function getFullLeveldbId() {
        $.ajax({
            async: false,
            //human sapiens top 1 level data
            url: "resources/dataset/toplevel/Homo_sapiens.json",
            dataType: "json",
            success: function (topData) {
                topData.forEach(function (item) {
                    var each = addAllNestedToParent(data.edges, item.dbId);
                    groups.push(each);
                });
            }
        });
    }());

    // Create a dedicated copy for each parent group to remove shared references
    groups = JSON.parse(JSON.stringify(groups));

    addValue(groups);
    function addValue(groups) {
        for (var k = 0; k < groups.length; k++) {
            if (humanDataStId[groups[k].to]) groups[k] = Object.assign(groups[k], {'stId': humanDataStId[groups[k].to]});
            if (humanDataName[groups[k].to]) groups[k] = Object.assign(groups[k], {'label': humanDataName[groups[k].to]});
            if (humanDataRatio[groups[k].to]) groups[k] = Object.assign(groups[k], {'weight': humanDataRatio[groups[k].to]});
            if (humanDataUrl[groups[k].to]) groups[k] = Object.assign(groups[k], {'url': humanDataUrl[groups[k].to]});
            // Delete to (dbId) in arrary
            delete groups[k].to;
        }
    }

    groups.forEach(addValueToChildren);
    function addValueToChildren(group) {
        if (group.groups && group.groups.length >= 0) {
            group.groups.forEach(addValueToChildren);

            for (var i = 0; i < group.groups.length; i++) {
                // Delete form (parent key) in arrary
                delete group.groups[i].from;
                if (humanDataStId[group.groups[i].to]) group.groups[i] = Object.assign(group.groups[i], {'stId': humanDataStId[group.groups[i].to]});
                if (humanDataName[group.groups[i].to]) group.groups[i] = Object.assign(group.groups[i], {'label': humanDataName[group.groups[i].to]});
                if (humanDataRatio[group.groups[i].to]) group.groups[i] = Object.assign(group.groups[i], {'weight': humanDataRatio[group.groups[i].to]});
                if (humanDataUrl[group.groups[i].to]) group.groups[i] = Object.assign(group.groups[i], {'url': humanDataUrl[group.groups[i].to]});
                // Delete to (dbId) in arrary
                delete group.groups[i].to;
            }
        }
    }
    return groups
}

