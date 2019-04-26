[<img src=https://user-images.githubusercontent.com/6883670/31999264-976dfb86-b98a-11e7-9432-0316345a72ea.png height=75 />](https://reactome.org)

# Reacfoam
## About
A hierarchical visualisation of Reactome pathways in a voronoi treemap.

<img width="900" alt="Reacfome_example" align="center"  src="https://user-images.githubusercontent.com/6442828/56794008-2ff19f00-6805-11e9-8537-f454a2b318e5.png">

## Aim
  Visualisation of Reactome pathways and pathways analysis results,it's useful for figures, slides, etc. And easy navigation.

## Dependency

Reacfoam uses Foamtree as visualization library. FoamTree is a JavaScript Voronoi treemap visualization with innovative layouts,animated interactions and endless customization. More details at https://carrotsearch.com/foamtree/

## Features
* Varied layout
    *   Flattened(default)
        * A flattened view of the hierarchy, all levels of the hierarchical are visible at once.
    * Hierarchical
        *  A layered view of the hierarchy, only the top level of the hierarchy is visible and double click to "open" it for further inspection.
* Interaction hints and guide
    *   Hints are provided at the right corner of visualization to guide users to interact with Reacfoam, zooming, selecting, and opening.
* Works on all modern desktop and mobile browsers responsively, it also supports touch event on tablets.
* Corresponding with the selected color profile at Reactome pathway browser.
* Hold a polygon to go to the current Reactome page for more details.

## Visualization Analysis Result
* The Reacfoam also supports to visualize the Reactome overrepresentation data type analysis results by receiving a token.
    * Corresponding with the selected color profile at Reactome analysis service.
    * Hold a polygon to go to the current Reactome page for more analysis details.

<img width="900" alt="Reacfoam_analysis_example" src="https://user-images.githubusercontent.com/6442828/56794318-ce7e0000-6805-11e9-8794-da0c04c59c8f.png">

## Demo
A beta version of Reacfoam has been integrated in [Reactome Pathway Browser](http://dev.reactome.org/reacfoam/).


<img width="900" alt="Reacfoam_dev" src="https://user-images.githubusercontent.com/6442828/56794384-ea81a180-6805-11e9-81c6-3564580275da.png">


## declaration

Reacfome is now using trial version of Foamtree which is displaying a small FoamTree logo in the visualization area. Otherwise, it's fully functional.

