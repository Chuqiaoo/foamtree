/**
 * Created by Chuqiao on 19/3/26.
 */
window.addEventListener("load", function(){

    var analysisParam =  getUrlVars()["analysis"];
    if (typeof analysisParam !== "undefined" ){
        foamtreeAnalysis(analysisParam);
    } else {
        foamtreeLoading();
    }
});

function foamtreeLoading(){

    $(".waiting").show();

    $.when(
        $.getJSON(speciesDataLocation, function(data) {
            speciesData = data;
        }),
        $.getJSON(topSpeciesDataLocation, function(topData) {
            topSpeciesData = topData;
        })
    ).then(function() {
            if ( typeof speciesData && topSpeciesData !== "undefined") {

                datasetInFoamtree = getData(speciesData, topSpeciesData);

                foamtreeStarts(datasetInFoamtree);
                $(".waiting").hide();
            }
            else {
                console.log("data not found");
            }
    })
}

function foamtreeAnalysis(analysisParam){

    function extractDataFromToken(response) {

        //read external Token data and save to key=>value pair R-HSA-5653656 =>1.1102230246251565e-16
        var responseFromToken = {};

        $.each(response.pathways, function (key, val) {
            responseFromToken[val.stId] = val.entities.pValue;
        });

        $.when(
            $.getJSON(speciesDataLocation, function(data) {
                speciesData = data;
            }),
            $.getJSON(topSpeciesDataLocation, function(topData) {
                topSpeciesData = topData;
            })
        ).then(function() {
                if (speciesData && topSpeciesData) {

                    dataSetInFoamtree = getData(speciesData, topSpeciesData);

                    foamtreeAnalysisStarts(responseFromToken, analysisParam, dataSetInFoamtree);

                    $(".waiting").hide();
                }
        });
    }

    function extractExpDataFromToken(response) {

        //Create columnArray of expression data sets to be added
        var columnArray = [];
        var columnNames = response.expressionSummary.columnNames;
        for (var key in columnNames) {
            columnArray.push(columnNames[key])
        }

        //get expression column data form token and save to key=>value pair R-HSA-5653656 => exp {...}
        //and save the pValue to key=>value pair R-HSA-5653656 => 1.1102230246251565e-16
        var columnNameResponse = {};
        var pvalueResponse = {};
        $.each(response.pathways, function (key, val) {
            pvalueResponse[val.stId] = val.entities.pValue;
            columnNameResponse[val.stId] = val.entities.exp;
            var exp = val.entities.exp;
            $.each(exp, function(key){
                exp[columnNames[key]] = exp[key];
                delete exp[key];
            });
        });

        // min and max value from token, the min max value in color bar
        var min = response.expressionSummary.min;
        var max = response.expressionSummary.max;

        $.when(
            $.getJSON(speciesDataLocation, function(data) {
                speciesData = data;
            }),
            $.getJSON(topSpeciesDataLocation, function(topData) {
                topSpeciesData = topData;
            })
        ).then(function() {
                if (speciesData && topSpeciesData) {

                    groups = getData(speciesData, topSpeciesData);

                    foamtreeExpStarts(columnNameResponse,pvalueResponse, analysisParam, groups, min, max, columnArray);

                    $(".waiting").hide();
                }
                else {
                    console.log("data not found");
                }
        });
    }
    $.ajax({
        // TODO PARSE FILTER PARAM -- FILTER=pValue:0.88$species:9606
        //url: "/AnalysisService/token/" + analysisParam + "?sortBy=ENTITIES_PVALUE&order=ASC&resource=TOTAL",
        url: "http://dev.reactome.org/AnalysisService/token/" + analysisParam + "/filter/species/"+ speciesIdFromUrl +"?sortBy=ENTITIES_PVALUE&order=ASC&resource=TOTAL",
        dataType: "json",
        type: "GET",
        beforeSend:  function() {
            $(".waiting").show()
        },
        success: function (json) {
            var type = json.type;
            if ( type == "OVERREPRESENTATION"){
                extractDataFromToken(json);
            } else {
                extractExpDataFromToken(json);
            }
        },
        error: function () {
            alert("data not found");

            //remove color and analysis parameter in current url without reloading page
            var newURL = location.href.split("?")[0];
            window.history.pushState('object', document.title, newURL);

            foamtreeLoading();
        }
    });
}