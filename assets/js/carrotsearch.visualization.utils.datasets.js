/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * Copyright 2002-2017, Carrot Search s.c, All Rights Reserved.
 *
 *
 * Utilities for generating and manipulating data sets for Carrot Search visualizations.
 */
var CarrotSearchVisualizationDatasets = (function() {
  // Static methods only
  return {
    /**
     */
    generate: function(params) {
      var levels = param("levels", 2);
      var countMean = param("countMean", 15);
      var countDeviation = param("countDeviation", 5);
      var countBalance = param("countBalance", 1);
      var weightMean = param("weightMean", 50);
      var weightDeviation = param("weightDeviation", 40);
      var weightBalance = param("weightBalance", 1);
      var childProbability = param("childProbability", 0.5);
      var childCountFallOff = param("childCountFallOff", 0.5);
      var labelType = param("label", "hierarchy+weight");
      var maxGroups = param("maxGroups", 20000);

      var dataObject = { groups: generateLevel(maxGroups) };
      return {
        dataObject: dataObject,
        stats: stats(dataObject)
      };

      function generateLevel(maxGroups) {
        var groupsLeft = maxGroups;
        return generate(0, "");

        function generate(level, labelPrefix) {
          var groups = [];
          var fallOff = Math.pow(childCountFallOff, level);
          var count = random(countMean * fallOff, countDeviation * fallOff, countBalance);
          for (var i = 0; i < count; i++) {
            var weight = random(weightMean, weightDeviation, weightBalance);
            var label;
            var hierarchyLabel = labelPrefix + (i + 1);
            switch (labelType) {
              case "weight":
                label = weight.toString();
                break;
              case "hierarchy":
                label = hierarchyLabel;
                break;
              case "hierarchy+weight":
                label = hierarchyLabel + " (" + weight.toString() + ")";
                break;
            }

            var group = {
              weight: weight,
              label: label
            };
            if (level < levels - 1 && Math.random() < childProbability) {
              group.groups = generate(level + 1, hierarchyLabel + ".");
            }
            if (--groupsLeft < 0) {
              throw "Maximum number of groups exceeded.";
            }
            groups.push(group);
          }
          return groups;
        }
      }

      function stats(dataObject) {
        return update({ maxLevel: 0, totalGroups: 0, maxGroupsAtOneLevel: 0 }, dataObject, 0);

        function update(stats, group, level) {
          stats.maxLevel = Math.max(stats.maxLevel, level);
          var groups = group.groups;
          if (groups) {
            stats.totalGroups += groups.length;
            stats.maxGroupsAtOneLevel = Math.max(stats.maxGroupsAtOneLevel, groups.length);
            for (var i = 0; i < groups.length; i++) {
              update(stats, groups[i], level + 1);
            }
          }
          return stats;
        }
      }


      function random(mean, deviation, balance) {
        return mean + Math.floor((Math.pow(Math.random(), balance) - 0.5) * 2 * deviation);
      }

      function param(name, def) {
        return typeof params[name] !== "undefined" ? params[name] : def;
      }
    }
  };
})();
