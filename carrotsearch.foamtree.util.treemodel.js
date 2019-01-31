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
 * A number of utilities for working with a hierarchical model of groups.
 */
window.CarrotSearchFoamTree.TreeModel = {
  eachDescendantAndSelf: function (root, callback) {
    if (!root) { return false; }
    return visit(root, 0, undefined, 0);

    function visit(group, index, parent, level) {
      if (group.groups) {
        var children = group.groups;

        for (var i = 0; i < children.length; i++) {
          if (visit(children[i], i, group, level + 1) === false) {
            return false;
          }
        }
      }
      return callback(group, index, parent, level);
    }
  },

  findFirstByProperty: function (root, property, value) {
    var result = undefined;
    window.CarrotSearchFoamTree.TreeModel.eachDescendantAndSelf(root, function (group) {
      if (group[property] == value) {
        result = group;
        return false;
      }
    });
    return result;
  }
};