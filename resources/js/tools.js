/**
 * Created by Chuqiao on 19/4/1.
 */

// species map
/*
 <option value="48887">Homo sapiens</option><option value="48898">Bos taurus</option><option value="68320">Caenorhabditis elegans</option><option value="49646">Canis familiaris</option><option value="68323">Danio rerio</option><option value="170941">Dictyostelium discoideum</option><option value="56210">Drosophila melanogaster</option><option value="49591">Gallus gallus</option><option value="48892">Mus musculus</option><option value="176806">Mycobacterium tuberculosis</option><option value="170928">Plasmodium falciparum</option><option value="48895">Rattus norvegicus</option><option value="68322">Saccharomyces cerevisiae</option><option value="68324">Schizosaccharomyces pombe</option><option value="49633">Sus scrofa</option><option value="205621">Xenopus tropicalis</option>
 */

// Following same color profile from current Fireworks implementation. Note: For better look and feel we changed calcium salts hits (FFB2B2)
var ColorProfileEnum = {
    COPPER: 1,
    COPPER_PLUS: 2,
    BARIUM_LITHIUM: 3,
    CALCIUM_SALTS: 4,
    properties: {
        1: {group: "#58C3E5", label: "#000", fadeout: "#E6E6E6", hit: "#C2C2C2", min: "#FDE233", max: "#959000", min_h: 52, min_s: 98,  min_l: 60, max_h: 58, max_s: 100, max_l: 29,
            min_exp: "#FFFF00", max_exp: "#0000FF" ,stop_exp: null} ,
        2: {group: "#58C3E5", label: "#000", fadeout: "#E6E6E6", hit: "#C2C2C2", min: "#FDE233", max: "#959000", min_h: 52, min_s: 98,  min_l: 60, max_h: 58, max_s: 100, max_l: 29,
            min_exp: "#FFFF00", max_exp: "#0000FF", stop_exp:"#56D7EE" },
        3: {group: "#FF9999", label: "#000", fadeout: "#F8F8F8", hit: "#E0E0E0", min: "#A0A0A0", max: "#000000", min_h: 0,  min_s: 0,   min_l: 63, max_h: 0,  max_s: 0,   max_l: 0,
            min_exp: "#00FF00", max_exp: "#FF0000", stop_exp:"#000000"},
        4: {group: "#FF9999", label: "#000", fadeout: "#FFE4E1", hit: "#FFCCCC", min: "#934A00", max: "#FFAD33", min_h: 30, min_s: 100, min_l: 29, max_h: 36, max_s: 100, max_l: 60,
            min_exp: "#934A00", max_exp: "#FFAD33", stop_exp: null}
    }
};

var SPECIES_MAP = {
    "48887" : "Homo_sapiens"
};

// Get species info from url and fetch the data file locally
var speciesData, topSpeciesData, datasetInFoamtree;
var speciesIdFromUrl = typeof getUrlVars()["species"] !== "undefined" ? getUrlVars()["species"] : 48887;
var speciesValue = SPECIES_MAP[speciesIdFromUrl];
var Homo_sapiens = "Homo_sapiens";

var speciesDataLocation =  typeof speciesValue !== "undefined" && speciesIdFromUrl in SPECIES_MAP ? "resources/dataset/fireworks/" + speciesValue + ".json" : "resources/dataset/fireworks/" + Homo_sapiens + ".json";
var topSpeciesDataLocation = typeof speciesValue !== "undefined" && speciesIdFromUrl in SPECIES_MAP ? "resources/dataset/toplevel/" + speciesValue + ".json" : "resources/dataset/toplevel/" + Homo_sapiens + ".json";

// Get parameters from URL and save data as key => value pair
function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m ,key, value) {
        vars[key] = value;
    });
    return vars
}
var colorParam =  getUrlVars()["color"];

/* Set the largest nesting level for debugging and color in red when there is no space to draw
 *  usage: data.forEach(setMaxLevel);
 * */
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

// Get color value in expression data analysis
function twoGradient(ratio, colorBottomInBar,colorTopInBar){

    colorBottomInBar = colorBottomInBar.replace(/#/g, "");
    colorTopInBar = colorTopInBar.replace(/#/g, "");

    var gradient;
    gradient = {
        red: Math.ceil(parseInt(colorBottomInBar.substring(0, 2), 16) * ratio + parseInt(colorTopInBar.substring(0, 2), 16) * (1 - ratio)),
        green: Math.ceil(parseInt(colorBottomInBar.substring(2, 4), 16) * ratio + parseInt(colorTopInBar.substring(2, 4), 16) * (1 - ratio)),
        blue: Math.ceil(parseInt(colorBottomInBar.substring(4, 6), 16) * ratio + parseInt(colorTopInBar.substring(4, 6), 16) * (1 - ratio))
    };

    return gradient
}

function threeGradient(ratio, ColorStart, ColorEnd, ColorMiddle) {

    // Do we have stop colors for the gradient? Need to adjust the params.
    var twoColor;
    if (ColorMiddle) {
        ColorMiddle = ColorMiddle.replace(/#/g, "");
        ratio = ratio * 2;
        var color;
        switch (true) {
            case  ratio < 1:
                color = twoGradient(ratio, ColorMiddle, ColorStart);
                break;
            case  ratio >= 1:
                ratio -= 1;
                var colorStartNew = ColorEnd;
                var colorEndNew = ColorMiddle;
                color = twoGradient(ratio, colorStartNew, colorEndNew);
                break;
        }
        return color
    }
    //
    twoColor = twoGradient(ratio, ColorEnd, ColorStart);
    return twoColor
}

