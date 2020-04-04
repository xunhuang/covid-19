import generator

class Assigner(object):
    def assign(self, zipcode):
        z3 = zipcode[:3]
        if z3 in ('006', '007', '009'):
            return 'PR'
        elif z3 in ('995', '996', '997', '998', '999'):
            return 'AK'
        elif zipcode == '96799':
            return 'AS'
        elif z3 == '969':
            return 'PWFMMHMPGU'
        elif z3 in ('962', '963', '964', '965', '966'):
            return 'AP'
        elif z3 in ('967', '968'):
            return 'HI'
        else:
            return 'continental'

def main():
    g = generator.Generator(
            Assigner(), 'ZCTA5CE10', dest_id_attr='data-zip')
    g.generate('cb_2018_us_zcta510_500k.kml', 'landmass-zips')

if __name__ == '__main__':
    main()
