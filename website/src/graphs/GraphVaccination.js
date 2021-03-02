import React from 'react'
import { County, Country, State } from "../UnitedStates";
import { GraphVaccinationState, GraphVaccinationUSA, GraphVaccinationCounty } from "./GraphHospitalizationProjection"

export const GraphVaccination = (props) => {
    if (props.source instanceof Country) {
        return <div>
            <GraphVaccinationUSA source={props.source} key="USA_vaccine" />
        </div >;
    }

    if (props.source instanceof State) {
        return <div>
            <GraphVaccinationState state={props.source} key="state_vaccine" />
        </div >;
    }

    if (props.source instanceof County) {
        return <div>
            {props.source.state().shortName === "CA" &&
                <GraphVaccinationCounty source={props.source} key="county_vaccine" />
            }
        </div >;
    }

    return <div> </div >;
}
