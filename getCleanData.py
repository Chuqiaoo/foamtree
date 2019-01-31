__author__ = 'Chuqiao'

import pandas as pd
import json
from csv import DictReader
from itertools import groupby
from pprint import pprint



# group by first hierarchy data info to make a list of dict
with open('merged_df.csv') as csvfile:

    r = DictReader(csvfile, skipinitialspace=True)
    data = [dict(d) for d in r]

    groups = []
    uniquekeys = []

    for k, g in groupby(data, lambda r: (r['parents'], r['parent_name'], r['parent_mass'], r['parents_url'])):

        groups.append({
            "id": k[0],
            "label": k[1],
            # size shoube be int
            "weight" : int(k[2]),
            "url" : k[3],
            "groups": [{k:v for k, v in d.items() if k not in ['parents','parent_name', 'parent_mass', 'parents_url']} for d in list(g)]
        })
        uniquekeys.append(k)

# convert size to from string to int
for dict_item in groups:
    for d in dict_item['groups']:
        d['weight'] = int(d['weight'])



# pprint (groups)

# write result into json
json.dump(groups, open('clean_data.json','w'), indent=4, sort_keys=False)





