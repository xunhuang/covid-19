from collections import defaultdict
import csv
import generator

class Assigner(object):
    def __init__(self):
        with open('sources/zcta_place_rel_10.txt') as f:
            parsed = csv.DictReader(f)
            self.zip_to_states = defaultdict(set)
            for line in parsed:
                self.zip_to_states[line['ZCTA5']].add(line['STATE'])

    def assign(self, zipcode):
        return self.zip_to_states[zipcode]

def main():
    g = generator.Generator(Assigner(), 'ZCTA5CE10')
    g.generate('cb_2018_us_zcta510_500k.kml', 'state-zips')

if __name__ == '__main__':
    main()
