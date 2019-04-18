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

                    datasetInFoamtree = getData(speciesData, topSpeciesData);

                    foamtreeAnalysisStarts(responseFromToken, analysisParam, datasetInFoamtree);

                    $(".waiting").hide();
                }
        });
    }

    $.ajax({
        url: "/AnalysisService/token/" + analysisParam + "?sortBy=ENTITIES_PVALUE&order=ASC&resource=TOTAL",
        dataType: "json",
        type: "GET",
        beforeSend:  function() {
            $(".waiting").show()
        },
        success: function (json) {
            extractDataFromToken(json);
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