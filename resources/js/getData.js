/**
 * Created by Chuqiao on 28/02/19.
 */

function getData(data, topData) {

    // Json object container
    var groups = [];

    // Save data as key => value pair, use dbId as key for per pairs
    var dataStId = {};
    var dataName = {};
    var dataRatio = {};
    var dataUrl = {};
    $.each(data.nodes, function (key, val) {
        dataStId[val.dbId] = val.stId;
        dataName[val.dbId] = val.name;
        if (val.ratio != 0) {
            dataRatio[val.dbId] = val.ratio * 1000;
        } else {
            // Set ratio = 0.009 when ratio = 0
            dataRatio[val.dbId] = 9
        }
        dataUrl[val.dbId] = "/PathwayBrowser/#/" + val.stId;
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
    // Add all nested children to level 1 parent
    function addAllNestedToParent(arr, parentID) {
        var allNestedChild = getNestedChildren(arr, parentID);
        var parent = {to: parentID, groups: []};
        parent.groups = Object.assign(parent.groups, allNestedChild);
        return parent
    }

    topData.forEach(function (item) {
        var each = addAllNestedToParent(data.edges, item.dbId);
        groups.push(each);
    });

    // Create a dedicated copy for each parent group to remove shared references
    groups = JSON.parse(JSON.stringify(groups));

    addValue(groups);
    function addValue(groups) {
        for (var k = 0; k < groups.length; k++) {
            if (dataStId[groups[k].to]) groups[k] = Object.assign(groups[k], {'stId': dataStId[groups[k].to]});
            if (dataName[groups[k].to]) groups[k] = Object.assign(groups[k], {'label': dataName[groups[k].to]});
            if (dataRatio[groups[k].to]) groups[k] = Object.assign(groups[k], {'weight': dataRatio[groups[k].to]});
            if (dataUrl[groups[k].to]) groups[k] = Object.assign(groups[k], {'url': dataUrl[groups[k].to]});
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
                if (dataStId[group.groups[i].to]) group.groups[i] = Object.assign(group.groups[i], {'stId': dataStId[group.groups[i].to]});
                if (dataName[group.groups[i].to]) group.groups[i] = Object.assign(group.groups[i], {'label': dataName[group.groups[i].to]});
                if (dataRatio[group.groups[i].to]) group.groups[i] = Object.assign(group.groups[i], {'weight': dataRatio[group.groups[i].to]});
                if (dataUrl[group.groups[i].to]) group.groups[i] = Object.assign(group.groups[i], {'url': dataUrl[group.groups[i].to]});
                // Delete to (dbId) in arrary
                delete group.groups[i].to;
            }
        }
    }
    return groups
}

