import React from 'react';
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Popover from '@material-ui/core/Popover';

const useStyles = makeStyles(theme => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
}));

const DialogTitle = (props) => {
    const classes = useStyles()

    const { children, onClose, ...other } = props;
    return (
        <MuiDialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose
                ? (
                <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                    <CloseIcon />
                </IconButton>)
                : null
            }
        </MuiDialogTitle>
    );
};

const DialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

const asDialogue = (Component, title, open, handleClose, buttonText = false) => {

    return (
        <Dialog maxWidth="md" fullWidth={true} onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
            <DialogTitle id="customized-dialog-title" onClose={handleClose}>
                {title}
            </DialogTitle>
            <DialogContent dividers>
                <Component/>
            </DialogContent>
            {buttonText
                ? <DialogActions>
                    <Button autoFocus onClick={handleClose} color="primary">
                        {buttonText}
                    </Button>
                  </DialogActions>
                : null
            }

        </Dialog>
  );
}

const asPopOver = (
    Component,
    open,
    anchorEl,
    handleClose,
    props = {
        anchorOrigin: {
            vertical: 'top',
            horizontal: 'left'
        },
        transformOrigin: {
            vertical: 'bottom',
            horizontal: 'center'
        }
    }) => {
    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            {...props}
        >
            <Component />
        </Popover>
    )
}

export { asDialogue, asPopOver }
