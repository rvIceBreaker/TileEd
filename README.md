# Tile Editor
A prototype implementation of a 9-way dynamic tilemap algorithm(?) and pattern editor written in html and vanilla javascript.

## Usage
The editor can be run offline by opening the index.html directly, or it can be found at [the github.io page](https://rvicebreaker.github.io/TileEd)

### Current Limitations
- Tile size is forced to `64px` x `64px`
- Map size is forced to `8` x `16`

### Patterns At a Glance
Each cell of the map calculates a value based on the configuration of the cells surrounding it and some additional properties of cell in question.

This value is used to determine a pattern for the given tile, and additional properties can be used to select a sub-group which defines the actual slice of the tileset to display.

Currently the only additional property is whether the current tile has collision or not, but support could be added for more.

The more complicated the configuration of neighboring tiles, the higher the value of the pattern.

If an exact match for the pattern isn't found, a lower-value pattern will be used if it is similar enough; this allows for defining exact results for a complex configuration of cells, while effectively fuzzy-matching if an exact pattern isn't defined.

### Using the Editor
On the right side of the application you'll find the tool panel.

Browse for a Tileset Image to fill the tile painter. The image will be divided into 64x64 pixel tiles.

You can browse for a TileDef .json file if you have an existing Tile Definition file you wish to continue working on.

The `Save TileDef...` button will export the current TileDef data to a file.

Clicking the cells in the map view (the green cells) will toggle collision, and change the pattern values of the revelant cells. Red means that cell has collision, green means it does not.

Clicking cells in the tile painter will mark that tile as the active tile for assigning to a pattern.

Right-clicking a tile in the map view will assign the active tile to the tile pattern.

The editor initializes with sample data in the map view.

### Defining Patterns
Its important to keep in mind that pattern matching is based on the configuration of tiles in any 3x3 space, with the center tile being the target cell.

I recommend starting your tile definitions by working in a 3x3 space and starting with simple configurations and working towards more complex ones; T shapes, cross shapes, corners, C shapes, U shapes, etc. and defining the desired slices for those tiles first.

When you start to test more complicated shapes, the simpler patterns should fill many of the gaps and you can begin defining more complex edge-case patterns as needed.

## Implementation Details
A technical write-up is defined in [technical.md](technical.md)