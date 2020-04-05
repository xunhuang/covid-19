# SVG map generators

## I don't want to think

Run the following commands

```sh
./setup.sh
./generate.sh
```

## I am okay with thinking

### Set up
1. Run `./setup.sh` in order to download the source data and set up a Python
environment.
1. As that command suggests at the end, run `source venv/bin/activate`.

### Generation
Running `python generate-state-counties.py` (or the other `generate-*` files)
will cause images to be dumped into `out/`. If you want the images to be
compressed with a naive algorithm, add the `--crush` option.

Running `./copy.sh` will copy the generated images into the `website/public`
with the correct names.
