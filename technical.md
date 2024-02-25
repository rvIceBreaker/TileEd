# Implementation Specification

## TileDefs
Tile definitions are json objects composed in the following format

```
{
    //Pattern
    <int>: [
        //Group
        <int>: [
            //Tile Set
            [
                //Tile
                {
                    tileX: <int>,
                    tileY: <int>,
                    mirrorX: <bool>,
                    mirrorY: <bool>
                },
                ...
            ],
            ...
        ],
        ...
    ],
    ...
}
```

Currently, collision is the only supported group selector, resulting in the following pattern groups
```
//No Collision
0: [ ... ],
//Collision
1: [ ... ]
```

This can be expanded later to allow additional flags to determine a pattern group based on data for the cell.

## Calculating Pattern Values
A pattern for a given cell is calculated based on the presence of adjacent cells and their positions; Each location relative to a target cell contributes to a summed value for the target cell.

Cells that are not present do not contribute a value (or contribute 0).

Cell positions are associated with an unsigned integer value based on their adjacency to the target cell. The values are chosen to allow for bitmasking against the sum, granting the fuzzy-match functionality when a definition is missing.

Currently, cell position values are defined in the following way
```
    NW  =   0b00000001, //  dec 1       hex 01
    SE  =   0b00000010, //  dec 2       hex 02
    NE  =   0b00000100, //  dec 4       hex 04
    SW  =   0b00001000, //  dec 8       hex 08
    E   =   0b00010000, //  dec 16      hex 10
    W   =   0b00100000, //  dec 32      hex 20
    S   =   0b01000000, //  dec 64      hex 40
    N   =   0b10000000, //  dec 128     hex 80
```

## Calculating Pattern Groups
Once a pattern value is summed for a target cell, the TileDef will return an array of groups to further match against.

At the time of writing, the expected entries in this array are `index 0` for `No Collision on Target Cell` and `index 1` for `Collision on Target Cell`.

In the editor implementaion, the target cell's collision is represented with a boolean value.

### Technical Considerations

#### Pattern Weight
Its currently unknown if you can separate the ideas of position and value with this implementation; the presence of a cell relative to a target always inherently has some kind of weight.

Because of this factor, greater weight is given to cells adjacent on the primary X and Y axes, which should result in prioritized 4-direction tile patterns.

Diagonally adjacent patterns are given less weight by associating them with lower values.

#### Memory Efficiency
Because the pattern for a target tile is summed from 9 potential values, there's an obvious conversation about how to get these values to fit efficiently in 8-bit bytes.

I've opted in this implementation to represent the 8 surrounding neighbor cells as each bit in an 8-bit byte, with the target tile presence being represented by a bool.

## Searching Patterns
After summing the pattern value for a target cell, we can check for a valid pattern by performing a bitwise `&` between a pattern value and the sum, checking for equality against the pattern value.

<details>
<summary>Code Example</summary>

```
if ((testPattern & sum) == testPattern)
{
    ...
}
```
</details>

This should be checking that the pattern we're testing against has less or equal matching adjacent cells as our target sum, but not more.

This means complex cell patterns will fall-through to simpler patterns if a more complex one is not defined.

Because each cell adds to the summed pattern value, we can test each pattern and pick the highest to find a pattern that best fits the summed pattern of our target cell.

<details>
<summary>Code Example</summary>

```
int currPattern = 0;
for (p in patterns)
{
    if ((p & sum) == p)
    {
        if (p > currPattern)
        {
            p = currPattern;
        }
    }
}
```
</details>

## Picking a Tile Set
You might have noticed in the TileDef specification that Tile Groups are arrays of Tile Objects; Tile Groups allow for multiple tiles to be defined for a pattern, referred to as a Tile Set.

Currently, the intended use-case is allowing the selection of a random Tile object.

Defining multiple tiles for a pattern is not currently supported in the editor.

## Tile Metadata
Tile Objects are defined as a collection of properties which are defined as follows

`tileX` and `tileY` are the index values of the tile slice on the X and Y axes respectively. These are not pixel values, they are a fixed-width index that assumes the tileset image has been split by the desired tile dimensions.

`mirrorX` and `mirrorY` are booleans that indicate if the tile at the specified slice should be mirrored on either axis, or both, when rendered.

## Displaying the Tile
This is highly dependent on your rendering implementation.

The Tile Object should provide you the necessary data to select a slice of the tileset image, transform it if needed, and render it.