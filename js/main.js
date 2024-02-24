//9 total values for each neighboring cell
//I would prefer the logic to fit within a u8
//0 does not contribute a value; if a neighbor cell does not exist (edge of map)
//  we can use 0 to represent no collision
//We can check the center cell with a bool
//  hopefully compiler optimizations means this will be more efficient
//  than allocating 7 extra unused bits in a u16
//This might look a little silly for the pattern matching metadata but
//  a pattern can be represented by
//  bool isCenterTile
//  u8 neighborTiles
/*const tilePatternEnum = {
    NW: 0b00000001,
    N:  0b00000010,
    NE: 0b00000100,
    W:  0b00001000,
    E:  0b00010000,
    SW: 0b00100000,
    S:  0b01000000,
    SE: 0b10000000,
};*/

const tilePatternEnum = {
    NW: 0b00000001,
    SE: 0b00000010,
    NE: 0b00000100,
    SW: 0b00001000,
    E:  0b00010000,
    W:  0b00100000,
    S:  0b01000000,
    N:  0b10000000,
};

class clsEditor {
    mapWidth = 16;
    mapHeight = 8;
    tileWidthPx = 64;
    tileHeightPx = 64;

    tileMapImage = null;
    tileMapBgElement = null;
    tileMapElements = [];
    tileDef = {};

    mapElements = [];
    mapCollision = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];
    mapTileData = [];
    mapContainer = null;

    mouseCurrentMapElement = null;
    currentPaintTileIdx = null;
    tileDefMirrorX = false;
    tileDefMirrorY = false;

    Opt_ShowMapGrid = true;
    Opt_ShowMapPattern = true;
    Opt_ShowTileGrid = true;
    Opt_ShowTileCoord = true;

    init() {
        console.log("Init...");
        this.InitOptions();

        this.tileMapBgElement = document.getElementById("tilemap-src");
        this.mapContainer = document.getElementById("mapcontainer");
        this.mapContainer.addEventListener("mousemove", e => {
            var el = document.elementFromPoint(e.clientX, e.clientY);
            if (this.mapElements.includes(el) && this.mouseCurrentMapElement != el) {
                this.mouseCurrentMapElement = el;
            }
        }, {passive: true});

        this.InitMap();
        this.initDummyTiledef();
        this.LoadTilemapImage("./example/Mirkham_New_Tile_Set.png");
        this.RefreshMapCells();
    };

    InitMap() {
        this.mapContainer.replaceChildren([]);
        this.mapElements = [];

        for (var y = 0; y < this.mapHeight; y++) {
            for(var x = 0; x < this.mapWidth; x++) {
                var mapCell = document.createElement("div");
                mapCell.setAttribute("class", "map-cell");
                mapCell.style.width = this.tileWidthPx+"px";
                mapCell.style.height = this.tileHeightPx+"px";
                mapCell.style.top = (y*this.tileHeightPx)+"px";
                mapCell.style.left = (x*this.tileWidthPx)+"px";
                mapCell.setAttribute("id", (y*this.mapWidth)+x);

                mapCell.addEventListener("click", this.ClickMapCell.bind(this));
                mapCell.addEventListener('contextmenu', this.AssignMapCellTilemapDef.bind(this), false);

                this.mapElements[(y*this.mapWidth)+x] = mapCell;
                this.mapContainer.appendChild(mapCell);
            }
        }
    };

    initDummyTiledef() {
        this.tileDef = {
            "0":[
                [
                    {"tileX":7,"tileY":5}
                ],
                [
                    {"tileX":0,"tileY":0}
                ]
            ],
            "1":[
                [
                    {"tileX":1,"tileY":0}
                ],
                [
                    {"tileX":0,"tileY":0}
                ]
            ]
        };
    };

    InitTilemap() {
        this.tileMapBgElement.replaceChildren([]);
        this.tileMapElements = [];

        var tileCellWidth = this.tileMapImage.width / this.tileWidthPx;
        var tileCellHeight = this.tileMapImage.height / this.tileHeightPx;

        for (var y = 0; y < tileCellHeight; y++) {
            for(var x = 0; x < tileCellWidth; x++) {
                var tileContainer = document.createElement("div");
                tileContainer.setAttribute("class", "tilemap-cell");
                tileContainer.setAttribute("id", (y*tileCellWidth)+x);
                tileContainer.style.width = this.tileWidthPx+"px";
                tileContainer.style.height = this.tileHeightPx+"px";
                tileContainer.style.top = (y*this.tileHeightPx)+"px";
                tileContainer.style.left = (x*this.tileWidthPx)+"px";

                if (this.Opt_ShowTileCoord) {
                    tileContainer.setAttribute("data", x+","+y);
                } else {
                    tileContainer.setAttribute("data", "");
                }

                if (this.Opt_ShowTileGrid) {
                    tileContainer.style.borderColor = null;
                } else {
                    tileContainer.style.borderColor = "transparent";
                }

                tileContainer.addEventListener("click", this.ClickTilemapTile.bind(this));
                
                var XOffsetPx = x * this.tileWidthPx * -1;
                var YOffsetPx = y * this.tileHeightPx * -1;

                var tileBackground = document.createElement("div");
                tileBackground.setAttribute("class", "tilemap-cell-background");           
                tileBackground.style.width = this.tileWidthPx+"px";
                tileBackground.style.height = this.tileHeightPx+"px";
                tileBackground.style.backgroundImage = "url("+this.tileMapImage.src+")";
                tileBackground.style.backgroundPosition = XOffsetPx + "px " + YOffsetPx + "px";

                var mirrorTransform = "";
                if (this.tileDefMirrorX) {
                    mirrorTransform += "scalex(-1) ";
                }

                if (this.tileDefMirrorY) {
                    mirrorTransform += "scaley(-1) ";
                }

                tileBackground.style.transform = mirrorTransform;

                tileContainer.appendChild(tileBackground);

                this.tileMapElements[(y*tileCellWidth)+x] = tileContainer;
                this.tileMapBgElement.appendChild(tileContainer);
            }
        }
        
        this.RefreshMapCells();
    };

    InitOptions() {
        document.getElementById("opt-map-grid").checked = this.Opt_ShowMapGrid;
        document.getElementById("opt-map-pattern").checked = this.Opt_ShowMapPattern;
        document.getElementById("opt-tile-grid").checked = this.Opt_ShowTileGrid;
        document.getElementById("opt-tile-coord").checked = this.Opt_ShowTileCoord;
    };

    LoadTilemapImage(imageUrl) {
        if (this.tileMapBgElement == null || this.tileMapBgElement == undefined) {
            console.log("tileMapBgElement not set! Aborting tilemap load...");
            return;
        }

        this.tileMapImage = new Image();
        this.tileMapImage.onload = (function () {
            this.tileMapBgElement.style.width = this.tileMapImage.width+"px";
            this.tileMapBgElement.style.height = this.tileMapImage.height+"px";
            this.InitTilemap();
        }).bind(this);
        this.tileMapImage.src = imageUrl;

        this.InitTilemap();
    };

    SetTiledefData(obj) {
        this.tileDef = obj;
        this.RefreshMapCells();
    };

    LoadTiledefData(fileUrl) {
        //Stub, can't load from local disk without CORS issue
    };

    translateIdxToCoord(idx) {
        var x = idx % this.mapWidth;
        var y = Math.floor(idx / this.mapWidth);

        return {x: x, y: y};
    };

    translateCoordToIdx(x, y) {
        return (y * this.mapWidth) + x;
    };

    translateIdxToCustomCoord(idx, width) {
        var x = idx % width;
        var y = Math.floor(idx / width);

        return {x: x, y: y};
    };

    translateCustomCoordToIdx(x, y, width) {
        return (y * width) + x;
    };

    RefreshMapCells() {
        for (var y = 0; y < this.mapCollision.length; y++) {
            for(var x = 0; x < this.mapCollision[y].length; x++) {
                var i = this.translateCoordToIdx(x, y);
                var cellCollision = this.mapCollision[y][x];
                var mapElement = this.mapElements[i];

                var tilePattern = this.SumTilePattern(x, y);
                this.mapTileData[i] = tilePattern;

                var matchingPattern = 0;
                for(var p in this.tileDef) {
                    var pNum = parseInt(p);
                    if ((pNum & tilePattern.neighborTiles) == pNum && pNum > matchingPattern) {
                        var tileMapGroup = tilePattern.isCenter ? this.tileDef[pNum][1] : this.tileDef[pNum][0];
                        //Check that the pattern group exists before settling on a higher-order tile pattern; we want to 'fall-through' to a lower-order tile pattern
                        if (tilePattern.isCenter && this.tileDef[pNum][1] != undefined) {
                            matchingPattern = pNum;
                            continue;
                        }
                        else if (!tilePattern.isCenter && this.tileDef[pNum][0] != undefined) {
                            matchingPattern = pNum;
                            continue;
                        }
                    }
                }

                var tileMapGroup = tilePattern.isCenter ? this.tileDef[matchingPattern][1] : this.tileDef[matchingPattern][0];
                var tileMapPattern = tileMapGroup[0];

                //This allows for a random tile to be selected in a pattern group; patterns are arrays of tile defs
                if (tileMapGroup.length > 1) {
                    var pat = Math.floor(Math.random() * tileMapGroup.length);
                    tileMapPattern = tileMapGroup[pat];
                }

                var XOffsetPx = tileMapPattern.tileX * this.tileWidthPx * -1;
                var YOffsetPx = tileMapPattern.tileY * this.tileHeightPx * -1;

                mapElement.replaceChildren([]);
                var mapCellBackground = document.createElement("div");
                mapCellBackground.setAttribute("class", "map-cell-background");
                mapCellBackground.style.backgroundImage = "url("+this.tileMapImage.src+")";
                mapCellBackground.style.backgroundPosition = XOffsetPx + "px " + YOffsetPx + "px";
                mapCellBackground.style.width = this.tileWidthPx+"px";
                mapCellBackground.style.height = this.tileHeightPx+"px";

                var mirrorTransform = "";
                if (tileMapPattern.mirrorX) {
                    mirrorTransform += "scalex(-1) ";
                }

                if (tileMapPattern.mirrorY) {
                    mirrorTransform += "scaley(-1) ";
                }

                mapCellBackground.style.transform = mirrorTransform;

                mapElement.appendChild(mapCellBackground);

                if (this.Opt_ShowMapPattern) {
                    mapElement.setAttribute("data", tilePattern.isCenter+"-"+tilePattern.neighborTiles);
                } else {
                    mapElement.setAttribute("data", "");
                }

                if (this.Opt_ShowMapGrid) {
                    mapElement.style.borderColor = null;
                } else {
                    mapElement.style.borderColor = "transparent";
                }

                this.ElSetClass(mapElement, "collision", (cellCollision == 1));
            }
        }
    };

    ElToggleClass(el, strClassName) {
        if (el.classList.contains(strClassName)) {
            el.classList.remove(strClassName);
        } else {
            el.classList.add(strClassName);
        }
    };

    ElSetClass(el, strClassName, bEnabled) {
        if (bEnabled) {
            if (el.classList.contains(strClassName)) {
                return;
            } else {
                el.classList.add(strClassName);
            }
        } else {
            if (el.classList.contains(strClassName)) {
                el.classList.remove(strClassName);
            } else {
                return;
            }
        }
    };

    ClickMapCell(ev) {
        var el = ev.target;
        var coord = this.translateIdxToCoord(el.id);

        if (this.mapCollision[coord.y][coord.x] == 1) {
            this.mapCollision[coord.y][coord.x] = 0;
        } else {
            this.mapCollision[coord.y][coord.x] = 1;
        }

        this.RefreshMapCells();
    };

    AssignMapCellTilemapDef(ev) {
        var el = ev.target;
        ev.preventDefault();

        var tileCellWidth = this.tileMapImage.width / this.tileWidthPx;
        var tileCellHeight = this.tileMapImage.height / this.tileHeightPx;

        var elTileData = this.mapTileData[el.id];
        var tileGroup = [];
        
        if (this.tileDef[elTileData.neighborTiles] == undefined) {
            this.tileDef[elTileData.neighborTiles] = [];
        } else {
            tileGroup = this.tileDef[elTileData.neighborTiles];
        }

        var tilePatternIdx = (elTileData.isCenter) ? 1 : 0;
        var tilePattern = [];

        var tileCoord = this.translateIdxToCustomCoord(this.currentPaintTileIdx, tileCellWidth);

        tilePattern.push({
            tileX: tileCoord.x,
            tileY: tileCoord.y,
            mirrorX: this.tileDefMirrorX,
            mirrorY: this.tileDefMirrorY,
        });

        tileGroup[""+tilePatternIdx] = tilePattern;
        this.tileDef[""+elTileData.neighborTiles] = tileGroup;

        this.RefreshMapCells();

        return false;
    };

    ClickTilemapTile(ev) {
        console.log(ev);
        this.currentPaintTileIdx = ev.target.getAttribute("id");
        this.ElSetClass(ev.target, "selected", true);

        for (var i = 0; i < this.tileMapElements.length; i++) {
            if (i == this.currentPaintTileIdx) {
                continue;
            }

            this.ElSetClass(this.tileMapElements[i], "selected", false);
        }
    };

    CheckCoordInBounds(x, y) {
        return (x >= 0 && x <= this.mapWidth-1) && (y >= 0 && y <= this.mapHeight-1);
    };

    SumTilePattern(x, y) {
        var centerTile = (this.mapCollision[y][x] == 1);
        var neighborSum = 0;

        var neighborTiles = [
            (this.CheckCoordInBounds(x-1, y-1)) ? {obj: this.mapCollision[y-1][x-1], val: tilePatternEnum.NW} : null,
            (this.CheckCoordInBounds(x, y-1)) ? {obj: this.mapCollision[y-1][x], val: tilePatternEnum.N} : null,
            (this.CheckCoordInBounds(x+1, y-1)) ? {obj: this.mapCollision[y-1][x+1], val: tilePatternEnum.NE} : null,
            (this.CheckCoordInBounds(x-1, y)) ? {obj: this.mapCollision[y][x-1], val: tilePatternEnum.W} : null,
            (this.CheckCoordInBounds(x+1, y)) ? {obj: this.mapCollision[y][x+1], val: tilePatternEnum.E} : null,
            (this.CheckCoordInBounds(x-1, y+1)) ? {obj: this.mapCollision[y+1][x-1], val: tilePatternEnum.SW} : null,
            (this.CheckCoordInBounds(x, y+1)) ? {obj: this.mapCollision[y+1][x], val: tilePatternEnum.S} : null,
            (this.CheckCoordInBounds(x+1, y+1)) ? {obj: this.mapCollision[y+1][x+1], val: tilePatternEnum.SE} : null,
        ];

        for (var i = 0; i < neighborTiles.length; i++) {
            var tile = neighborTiles[i];

            if(tile != null && tile.obj == 1) {
                neighborSum += tile.val;
            }
        }

        return {isCenter: centerTile, neighborTiles: neighborSum};
    };

    OnMirrorXChange(ev) {
        this.tileDefMirrorX = ev.target.checked;
        this.InitTilemap();
    };

    OnMirrorYChange(ev) {
        this.tileDefMirrorY = ev.target.checked;
        this.InitTilemap();
    };

    OnOptShowMapGridChange(ev) {
        this.Opt_ShowMapGrid = ev.target.checked;
        this.RefreshMapCells();
    };

    OnOptShowMapPatternChange(ev) {
        this.Opt_ShowMapPattern = ev.target.checked;
        this.RefreshMapCells();
    };

    OnOptShowTileGridChange(ev) {
        this.Opt_ShowTileGrid = ev.target.checked;
        this.InitTilemap();
    };

    OnOptShowTileCoordChange(ev) {
        this.Opt_ShowTileCoord = ev.target.checked;
        this.InitTilemap();
    };

    OnLoadImage(ev) {
        if (ev.target.files.length <= 0) {
            return;
        }

        console.log("onLoadImage");
        var reader = new FileReader();
        reader.onload = (function(e) {
            this.LoadTilemapImage(e.target.result);
        }).bind(this);
        reader.readAsDataURL(ev.target.files[0]);
    };

    OnLoadTileDef(ev) {
        if (ev.target.files.length <= 0) {
            return;
        }

        console.log("onLoadTileDef");
        var reader = new FileReader();
        reader.onload =(function(e) {
            console.log(e);
            this.SetTiledefData(JSON.parse(e.target.result));
        }).bind(this);
        reader.readAsText(ev.target.files[0]);
    };

    OnExportTiledef() {
        var bytes = new TextEncoder().encode(JSON.stringify(this.tileDef));
        var fileblob = new Blob([bytes], {type:'application/json'});

        var el = document.createElement("a");
        el.download = "tilemap_data.json";
        el.href = window.URL.createObjectURL(fileblob);
        //document.body.appendChild(el);

        el.click();

        //document.body.removeChild(el);
        URL.revokeObjectURL(fileblob);
    };
};

var editor = new clsEditor();
document.addEventListener("DOMContentLoaded", editor.init.bind(editor));