import generator

class Assigner(object):
    def assign_complex(self, placemark):
        return placemark.find('.//{http://www.opengis.net/kml/2.2}SimpleData[@name="STATEFP"]').text

def filter(polygon, id, group):
    return group != '15' or polygon[0]['lng'] > -160.649866

def translate(point, id, group):
    if group == '02':
        if point['lng'] > 160:
            lng = -360 + point['lng']
        else:
            lng = point['lng']
        return {'lat': point['lat'], 'lng': lng}
    else:
        return point

def main():
    g = generator.Generator(
            Assigner(),
            'GEOID',
            dest_id_attr='data-id',
            filter=filter,
            translator=translate)
    g.generate('cb_2018_us_county_5m.kml', 'state-counties')

if __name__ == '__main__':
    main()
