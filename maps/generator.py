from collections import defaultdict
from pykml import parser
import argparse
import math
import os
import sys

PRECISION = 0
MIN_WRITABLE = 0.5
MAX_WIDTH = 1000
LEVEL = 12

def project(point):
    lat = math.radians(point['lat'])
    lng = math.radians(point['lng'])
    return {
        'x': 256 / 2 / math.pi * math.pow(2, LEVEL) * (lng + math.pi),
        'y': 256 / 2 / math.pi * math.pow(2, LEVEL) * (math.pi - math.log(math.tan(math.pi / 4 + lat / 2))),
    }


class Generator(object):
    def __init__(
            self,
            assigner,
            source_id_attr,
            filter=None,
            translator=None,
            dest_id_attr='id'):
        self.root = os.path.dirname(sys.argv[0])
        if not self.root:
            self.root = '.'
        self.assigner = assigner
        self.source_id_attr = source_id_attr
        self.filter = filter
        self.translator = translator
        self.dest_id_attr = dest_id_attr

        parser = argparse.ArgumentParser()
        parser.add_argument('--crush', action='store_true', required=False)
        parser.add_argument('--exact', action='store_true', required=False)
        args = parser.parse_args()
        self.pretty_print = not args.crush
        self.print_exact = args.exact

    def generate(self, source, output_type):
        with open('{}/sources/{}'.format(self.root, source)) as f:
            doc = parser.parse(f)

        print('opened')

        groups = defaultdict(list)
        for placemark in doc.findall('.//{http://www.opengis.net/kml/2.2}Placemark'):
            id_query = ('.//{{http://www.opengis.net/kml/2.2}}SimpleData'
                        '[@name="{}"]'.format(self.source_id_attr))
            id = placemark.find(id_query).text
            print('reading ' + id)

            if hasattr(self.assigner, 'assign'):
                assignment = self.assigner.assign(id)
            elif hasattr(self.assigner, 'assign_complex'):
                assignment = self.assigner.assign_complex(placemark)
            else:
                raise Exception("Can't find assigner attribute")

            if not assignment:
                continue

            polygons = []
            bound = {
                'low': {'lat': 180, 'lng': 180},
                'high': {'lat': -180, 'lng': -180},
            }
            for polygon in placemark.findall('.//{http://www.opengis.net/kml/2.2}Polygon'):
                extrude = polygon.find('.//{http://www.opengis.net/kml/2.2}extrude')
                if extrude.text != '0':
                    raise Exception('Extrude is set')
                coordinates = polygon.find('.//{http://www.opengis.net/kml/2.2}coordinates')
                converted = []
                for vertex in coordinates.text.split(' '):
                    r = [float(p) for p in vertex.split(',')]
                    pos = {'lat': r[1], 'lng': r[0]}
                    if self.translator:
                        pos = self.translator(pos, id, assignment)
                    converted.append(pos)

                    if pos['lat'] < bound['low']['lat']:
                        bound['low']['lat'] = pos['lat']
                    if bound['high']['lat'] < pos['lat']:
                        bound['high']['lat'] = pos['lat']
                    if pos['lng'] < bound['low']['lng']:
                        bound['low']['lng'] = pos['lng']
                    if bound['high']['lng'] < pos['lng']:
                        bound['high']['lng'] = pos['lng']
                if self.filter:
                    if self.filter(converted, id, assignment):
                        polygons.append(converted)
                else:
                    polygons.append(converted)

            if isinstance(assignment, str):
                assignment = [assignment]
            for assign in assignment:
                groups[assign].append({
                    'id': id,
                    'bound': bound,
                    'polygons': polygons,
                })

        for group, shapes in groups.items():
            bound = {
                'low': {'lat': 180, 'lng': 180},
                'high': {'lat': -180, 'lng': -180},
            }
            for shape in shapes:
                if shape['bound']['low']['lat'] < bound['low']['lat']:
                    bound['low']['lat'] = shape['bound']['low']['lat']
                if bound['high']['lat'] < shape['bound']['high']['lat']:
                    bound['high']['lat'] = shape['bound']['high']['lat']
                if shape['bound']['low']['lng'] < bound['low']['lng']:
                    bound['low']['lng'] = shape['bound']['low']['lng']
                if bound['high']['lng'] < shape['bound']['high']['lng']:
                    bound['high']['lng'] = shape['bound']['high']['lng']

            top_left = project(bound['low'])
            bottom_right = project(bound['high'])
            scale = MAX_WIDTH / (bottom_right['x'] - top_left['x'])
            if scale > 1:
                scale = 1

            try:
                os.makedirs('{}/out/{}'.format(self.root, output_type))
            except FileExistsError:
                pass

            with open(
                    '{}/out/{}/{}.svg'.format(self.root, output_type, group),
                    'w') as f:
                self.print_header(f, scale, top_left, bottom_right)

                for shape in shapes:
                    self.print_shape(f, shape, scale, top_left, bottom_right)
                f.write('</svg>\n')

    def print_header(self, f, scale, top_left, bottom_right):
        f.write(('<?xml version="1.0" encoding="UTF-8"?>{nl}'
                 '''<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'>{nl}'''
                 '<svg viewBox="0 0 {width:g} {height:g}" xmlns="http://www.w3.org/2000/svg">{nl}').format(
                     nl='\n' if self.pretty_print else '',
                     width=scale * (bottom_right['x'] - top_left['x']),
                     height=scale * (top_left['y'] - bottom_right['y'])))

    def print_shape(self, f, shape, scale, top_left, bottom_right):
        print('writing ' + shape['id'])

        if self.pretty_print:
            f.write('  ')

        f.write('<path {}="{}" d="'.format(self.dest_id_attr, shape['id']))

        cursor = [scale * top_left['x'], scale * bottom_right['y']]
        for polygon in shape['polygons']:
            cursor = self.print_polygon(f, polygon, scale, cursor)
            if self.pretty_print:
                f.write('\n')

        if self.pretty_print:
            f.write('" />\n')
        else:
            f.write('"/>')

    def print_polygon(self, f, polygon, scale, cursor):
        projected = project(polygon[0])
        last = projected
        transformed = {
                'x': scale * projected['x'] - cursor[0],
                'y': scale * projected['y'] - cursor[1],
        }
        acc = self.write_vertex(f, 'm', transformed)
        cursor[0] += transformed['x'] + acc['x']
        cursor[1] += transformed['y'] + acc['y']

        for point in polygon[1:-1]:
            projected = project(point)
            transformed = {
                    'x': scale * (projected['x'] - last['x']) - acc['x'],
                    'y': scale * (projected['y'] - last['y']) - acc['y'],
            }
            if abs(transformed['x']) < MIN_WRITABLE and not self.print_exact:
                acc['x'] = -transformed['x']
                transformed['x'] = 0
            else:
                acc['x'] = 0
            last['x'] = projected['x']

            if abs(transformed['y']) < MIN_WRITABLE and not self.print_exact:
                acc['y'] = -transformed['y']
                transformed['y'] = 0
            else:
                acc['y'] = 0
            last['y'] = projected['y']

            diff = self.write_vertex(f, 'l', transformed)
            acc['x'] += diff['x']
            acc['y'] += diff['y']
        f.write('z')
        return cursor

    def write_vertex(self, f, command, vertex):
        rounded = [
                self.maybe_round(vertex['x']),
                self.maybe_round(vertex['y']),
        ]

        if rounded[0] == 0 and rounded[1] == 0:
            if command == 'm':
                f.write('m0 0')
            return {'x': -vertex['x'], 'y': -vertex['y']}

        x = '{:g}'.format(rounded[0]).lstrip('0').replace('-0', '-') or '0'
        if x == '-':
            x = '0'
        y = '{:g}'.format(rounded[1]).lstrip('0').replace('-0', '-') or '0'
        if y == '-':
            y = '0'

        if (x != '0' and y != '0') or command == 'm':
            f.write('{}{}{}{}'.format(command, x, '' if not self.pretty_print and y[0] == '-' else ' ', y))
        elif x != '0':
            f.write('h{}'.format(x))
        elif y != '0':
            f.write('v{}'.format(y))
        return {'x': rounded[0] - vertex['x'], 'y': rounded[1] - vertex['y']}

    def maybe_round(self, x):
        if self.print_exact:
            return x
        else:
            return round(x, PRECISION)

