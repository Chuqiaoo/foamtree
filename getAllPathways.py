__author__ = 'Chuqiao'


import pandas as pd
import json
from pprint import pprint




# reactome pathway relation
allpathwaysUrl="https://reactome.org/download/current/ReactomePathwaysRelation.txt"

allpathways = pd.read_csv(allpathwaysUrl, delimiter="\t", names = ["parents", "child"])

# get first human hierarchy identifier
parents_form_reactome_nav = pd.read_csv("parents.csv", names = ["parents"])

reactome_url_prefix = "https://reactome.org/PathwayBrowser/#/"

# uniprot 2 reactome data
uniprot2Reactome = pd.read_csv("UniProt2Reactome_All_Levels.txt", delimiter="\t", names = ["source identifier", "identifier", "URL", "name", "evidence code", "species"])

# look for identifier name
def lookup_name(identifier):
   for row in uniprot2Reactome.itertuples():
       if identifier in str(row.identifier):
           return row.name
   else:
    return 'N/A'

# look for identifier size
def lookup_size(identifier):
    for row in uniprot2Reactome.itertuples():
        if identifier in str(row.identifier):
            size = uniprot2Reactome.identifier.str.count(identifier).sum()
            return size


parents_form_reactome_nav['parent_name'] = parents_form_reactome_nav['parents'].apply(lookup_name)
parents_form_reactome_nav['parent_size'] = parents_form_reactome_nav['parents'].apply(lookup_size)


# merged a new df with reactome pathways releation on index [parents]
merged_df = parents_form_reactome_nav.merge(allpathways, how='left', on = ['parents'])

# get child info
merged_df['child_name'] = merged_df['child'].apply(lookup_name)
merged_df['child_size'] = merged_df['child'].apply(lookup_size)


# rename
merged_df.columns = ['parents', 'parent_name', 'parent_mass', 'id', 'label', 'weight']



merged_df['parents_url'] = reactome_url_prefix + merged_df['parents'].astype(str)

merged_df['url'] = reactome_url_prefix + merged_df['id'].astype(str)


merged_df = merged_df[['parents', 'parent_name', 'parent_mass', 'parents_url','id', 'label', 'weight', 'url']]
merged_df.head()



# pprint (merged_df)


# write result into CSV
merged_df.to_csv("merged_df.csv", encoding='utf-8', index=False)