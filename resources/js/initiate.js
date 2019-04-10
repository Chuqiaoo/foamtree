/**
 * Created by Chuqiao on 19/3/26.
 */
window.addEventListener("load", function(){
    // Hide progress spinner when all elements are loaded here because this ajax call is async
    $(".waiting").hide();

    var analysisParam =  getUrlVars()["analysis"];
    if (typeof analysisParam !== "undefined" ){
        analysis(analysisParam);
    } else {
        foamtreeLoading();
    }
});

// Load homo sapiens data TODO a async ajax call here
// getUrlVar["species"]; you'll get species id
//var speciesName = getName from the mapping (tools.js)
    $.ajax({
            url: (typeof speciesValue !== "undefined" && speciesIdFromUrl in SPECIES_MAP ? "resources/dataset/fireworks/" + speciesValue + ".json" : "resources/dataset/fireworks/" + Homo_sapiens + ".json"),
            dataType: "json",
            async: false,
            beforeSend: function () {
                $(".waiting").show();
            },
            success: function (data) {
                foamtreeData = data;
            },
            error: function () {
                alert("data not found");
            }
        });

function analysis(analysisParam){
    function extractDataFromToken(response) {
        // Read external Token data and save to key=>value pair R-HSA-5653656 =>1.1102230246251565e-16
        var newResponse = {};
        $.each(response.pathways, function (key, val) {
            newResponse[val.stId] = val.entities.pValue;
        });
        foamtreeStarts(newResponse, analysisParam);
    }
    // Load Token data
    $.ajax({
        url: "/AnalysisService/token/" + analysisParam + "?sortBy=ENTITIES_PVALUE&order=ASC&resource=TOTAL",
        dataType: "json",
        type: "GET",
        beforeSend: function(){
            $(".waiting").show()
        },
        success: function (json) {
            extractDataFromToken(json);
        },
        complete: function(){
            // Hide progress spinner
            $(".waiting").hide();
        },
        error: function () {
            alert("data not found");
            // Remove color and analysis parameter in current url without reloading page
            var newURL = location.href.split("?")[0];
            window.history.pushState('object', document.title, newURL);

            foamtreeLoading ();
        }
    });
}
