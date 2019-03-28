/**
 * Created by Chuqiao on 19/3/26.
 */


window.addEventListener("load", function() {

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m ,key, value) {
            vars[key] = value;
        });
        return vars
    }
    var analysisParam =  getUrlVars()["analysis"];

    if (typeof analysisParam !== "undefined" ){
        analysis(analysisParam);

    } else {
        foamtreeLoading();
    }
});

var foamtreeData;

//Following same color profile from current Fireworks implementation. Note: For better look and feel we changed calcium salts hits (FFB2B2)
var ColorProfileEnum = {
    COPPER: 1,
    COPPER_PLUS: 2,
    BARIUM_LITHIUM: 3,
    CALCIUM_SALTS: 4,
    properties: {
        1: {group: "#58C3E5", label: "#000", fadeout: "#E6E6E6", hit: "#C2C2C2", min: "#FDE233", max: "#959000", min_h: 52, min_s: 98,  min_l: 60, max_h: 58, max_s: 100, max_l: 29},
        2: {group: "#58C3E5", label: "#000", fadeout: "#E6E6E6", hit: "#C2C2C2", min: "#FDE233", max: "#959000", min_h: 52, min_s: 98,  min_l: 60, max_h: 58, max_s: 100, max_l: 29},
        3: {group: "#FF9999", label: "#000", fadeout: "#F8F8F8", hit: "#E0E0E0", min: "#A0A0A0", max: "#000000", min_h: 0,  min_s: 0,   min_l: 63, max_h: 0,  max_s: 0,   max_l: 0},
        4: {group: "#FF9999", label: "#000", fadeout: "#FFE4E1", hit: "#FFCCCC", min: "#934A00", max: "#FFAD33", min_h: 30, min_s: 100, min_l: 29, max_h: 36, max_s: 100, max_l: 60}
    }
};

//load homo sapiens data TODO a ajax call here
$.ajax({
    url: "dataset/Homo_sapiens.json",
    dataType: "json",
    async: false,
    success: function(data) {

        foamtreeData = data;
    } ,
    error: function(){
        alert("data not found");
    }

});

function analysis(analysisParam){

    function extractDataFromToken(response) {

        //read external Token data and save to key=>value pair R-HSA-5653656 =>1.1102230246251565e-16
        var newResponse = {};

        $.each(response.pathways, function (key, val) {
            newResponse[val.stId] = val.entities.pValue;
        });

        foamtreeStarts(newResponse, analysisParam);

    }

    //Load Token data. TODO a ajax call here
    $.ajax({
        url: "http://dev.reactome.org/AnalysisService/token/" + analysisParam + "?sortBy=ENTITIES_PVALUE&order=ASC&resource=TOTAL",
        dataType: "json",
        type: "GET",
        success: function (json) {
            extractDataFromToken(json);
        },
        error: function () {
            alert("data not found");

            //remove color and analysis parameter in current url without reloading page
            var newURL = location.href.split("?")[0];
            window.history.pushState('object', document.title, newURL);
            foamtreeLoading ();
        }
    });
}

//back to default view when click overview
var overview = document.getElementById("overview");
overview.addEventListener("click", function(){

    //remove div and recreate to clear previous embedded foamtree
    $("#visualization").remove();
    var container = document.getElementById("container");
    var div = document.createElement('div');
    div.id = 'visualization';
    container.prepend(div);

    //remove color and analysis parameter in current url without reloading page
    var newURL = location.href.split("?")[0];
    window.history.pushState('object', document.title, newURL);

    foamtreeLoading ();

});

