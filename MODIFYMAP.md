```
   ____   __  __ _          __  __             _       
  / __ \ / _|/ _(_)        |  \/  |           (_)      
 | |  | | |_| |_ _  ___ ___| \  / | __ _ _ __  _  __ _ 
 | |  | |  _|  _| |/ __/ _ \ |\/| |/ _` | '_ \| |/ _` |
 | |__| | | | | | | (_|  __/ |  | | (_| | | | | | (_| |
  \____/|_| |_| |_|\___\___|_|  |_|\__,_|_| |_|_|\__,_|
```

#
Want to customize it even more? OfficeMania supports map swaps. Build your own map to use for all what you can think of or modify the default map.

#

## Modifying the Map

To modify the existing map, you need to download [the Tiled map editor](https://thorbjorn.itch.io/tiled). Open the current `Map.json` file via `Import file...`. In the middle you can see the provided map and on the top right there are all available layers. Layers can be toggled on or off with the eye symbol in each line. Please read about the usage of layers in the next section.

# 

## Creating a new Map

To create a new `.json` file for a new map we recommend using [the Tiled map editor](https://thorbjorn.itch.io/tiled).
You also need textures of the things you want to create. Either use our provided texture pack or import your own. There are two nessecary files called `pixel.png` and `rooms.png` provided in `/assets/templates`. Be aware: all textures must be 48x48 pixels in size!

To create a new project click on `File > new > new map`. The new window shows a few options:
Toggle `Map size` to `infinite` and `Tile size` to 48 pixels.

We recommend by starting with the visual layers. You can create as many new layers as you want as long as they are not called
"Solid", "Content", "Rooms" or "Conference rooms". These names are reserved for special purposes. The editor also shows a preview of how your creation will look like. Please keep in mind that the player's spawn coordinates are fixed at `(x = 5, y = -10)`.

Now, we create the functional layers. Create a layer called "Solid". On this Layer you can place the tiles from `pixel.png` to create an outline of solid walls. The black color marks all spots, where the player is not able to walk into. Pleace do not place other textures on this layer. Also, do not mark the player spawn as solid. Users might not be able to walk away.

After that, create a layer called "Rooms" in which you mark all rooms. Each room gets a different color from `rooms.png`. Please no not leave any room uncolored. Every color represents a zone for the proximity based video chat to stop people from talking through walls. It is possible to color all parts of the hallway in the same color, but not nessecary. Doors must not be colored, resulting in a `room id` for doors equal to 0.

To make interactive objects create a layer called "Content". On this layer mark the different objects with
colors from the file `rooms.png` as well. Duplicate colors between rooms ans interactive objects are allowed and distinguished through the layer name. Multiple interactive objects of the same type get the same color (e.g. two coffee machines). You can find the allocations below. 

Lastly, create a layer called "Conference rooms" in which you mark every office space with the first red tone from `rooms.png`. All rooms colored in red are one zone for the video chat. All users in the same room can hear and see each other, independent from the size of the room.

After creating all these layers arrange the layers in the following order:
1. Solid
2. Content
3. Conference rooms
4. Rooms
5. all your custom layers

Besides their use in the "Rooms" layer, the colors in `rooms.png` represent different interactives when used in the "Content" layer:
1. doors with room on the north
2. doors with room on the west
3. doors with room on the south
4. doors with room on the east
5. door that is supposed to be always open
6. pingpong table
7. whiteboard
8. Post-its
9. coffee machine
10. Donuts
11. vending machine
12. computer
15. chess table
16. watercooler
17. notes
18. cat

To insert the newly created `Map.json` file in the application, stop the server by typing 

```
$ npm stop
```

or press `ctrl + c` in the console. Then replace the old `Map.json` in the `/assets/map` folder with your new one.
Start OfficeMania with

```
$ npm start
```


#