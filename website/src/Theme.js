import { createMuiTheme } from '@material-ui/core/styles';

export const compactTheme = createMuiTheme({
    palette: {
        primary: {
            main: '#00aeef',
        },
        secondary: {
            main: '#00aeef',
        },
    },
    overrides: {
        MuiTableCell: {
            sizeSmall: {  //This can be referred from Material UI API documentation.
                padding: '1px 1px 1px 1px',
            },
        },
        MuiToggleButton: {
            sizeSmall: {
                //This can be referred from Material UI API documentation.
                maxHeight: 24,
            }
        }
    },
});
