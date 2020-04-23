import { State, Country } from './UnitedStates';
import { MapUS } from './MapUS'

function maybeMapTabFor(source) {
    if (source instanceof State) {
        return {
            id: 'map',
            label: 'Map',
            content: MapUS,
        };
    } else if (source instanceof Country) {
        return {
            id: 'map',
            label: 'Map',
            content: MapUS,
        };
    } else {
        return undefined;
    }
}

export { maybeMapTabFor }
