const defaultCode = `// Beispiel Code - probiere es aus!
const display = require("display");

// Colors
// rarity
var rare = display.color(120,0,185);
var epic = display.color(0,150,255);
// Common
var black = display.color(0,0,0);
var blai =display.color(0,20,30);
var white = display.color(255,255,255);
var blue  = display.color(0,150,255);
var blui = display.color(0,0,255);
var yellow = display.color(255,255,0);
var green = display.color(0,255,0);
var bluv =display.color(100,120,250)

//Inventory
var selected = 1; //select a slot
var totalSlots = 24; //howmany slot you need

// Items
var items = [
  {name:"Elder Chestplate", itemtype:"ChestPlate", stat:"DEF", rarity:"Epic", value:10,
  description:"strong armor",
  icon: [
  0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,0,0,0,0,1,0,1,0,1,1,0,1,0,
  1,0,0,1,1,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  0,1,1,1,1,1,1,0,1,0,1,0,0,1,0,1,
  1,0,0,0,0,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  ]
  },
  {name:"Elder Sword", itemtype:"Sword", stat:"ATK", value:15, rarity:"Rare",
  description:"k s j d k k k h s d k k j s h d k j s d h f k j s h f k j s h h f k j d h f k k s j d h f k s k j f h k s h h s",
  icon: [
  0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,0,0,0,0,1,0,1,0,1,1,0,1,0,
  1,0,0,1,1,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  0,1,1,1,1,1,1,0,1,0,1,0,0,1,0,1,
  1,0,0,0,0,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  ]
  },
  {name:"Potion", stat:"HEAL", value:50, rarity:"Rare",
  description:"",
  icon: [
  0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,0,0,0,0,1,0,1,0,1,1,0,1,0,
  1,0,0,1,1,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,
  1,0,0,0,0,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  0,1,1,1,1,1,1,0,1,0,1,0,0,1,0,1,
  1,0,0,0,0,0,0,1,1,0,1,0,0,1,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,
  ]
  },
  {name:"Helmet", stat:"DEF", value:5,
  icon:"H"
  },
  {name:"Boots", stat:"SPD", value:3,
  icon:"B"
  },
  {name:"Ring", stat:"MAG", value:7,
  icon:"R"
  },
 ];

function drawBitmap(x, y, width, height, bitmap, rarity) {

  for (var j = 0; j < height; j++) {
    for (var i = 0; i < width; i++) {
      let pixel = bitmap[j * width + i];

      if (pixel === 1) {
        var drawColor = rarity === "Rare" ? rare : rarity === "Epic" ? epic : white;
        display.drawPixel(x + i, y + j, drawColor);
      }
    }
  }
}

function drawCenteredText(text, y) {
  var textWidth = text.length * 7;
  var x = (320 - textWidth) / 2;
  display.drawText(text, x, y);
}

function drawWrappedText(text, x, y, maxWidth, lineHeight) {
  var words = text.split(" ");
  var line = "";

  for (var i = 0; i < words.length; i++) {
    var testLine = line + words[i] + " ";
    var testWidth = testLine.length * 6; // adjust based on text size

    if (testWidth > maxWidth && i > 0) {
      display.drawText(line, x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  display.drawText(line, x, y);
}

function drawInventory() {
  display.fill(black);

  // Title
  display.setTextSize(2);
  display.setTextColor(blue); 
  display.drawFillRect(1, 1, 317, 157, blui);
  display.drawFillRect(3, 3, 313, 153, black);
  display.drawRect(103, 7, 110, 20, blue);
  display.drawText("INVENTORY", 105, 10);

  // Grid
  var x = 15;
  var y = 36;

  for (var i = 0; i < totalSlots; i++) {

  var color = (i == selected) ? yellow : blue;
  display.drawRect(x, y, 30, 30, color);

  // check if item exists
  if (items[i]) {
    var item = items[i];
    if (item.icon) {
      drawBitmap(x + (30-16)/2, y + (30-16)/2, 16, 16, item.icon, item.rarity);
    } 
  } else {
    // placeholder (empty slot)
    display.setTextColor(display.color(0,0,0));
    display.drawText("-", x + 10, y + 10);
  }

  x += 37;

  if ((i+1) % 8 == 0) {
    x =15;
    y += 40;
  }
  }
}

//Item Description
function drawDescription() {
  
  // Divider
  display.drawFillRect(1, 1, 317, 157, blui);
  display.drawFillRect(3, 3, 313, 153, black);
  display.drawRect(80, 10, 230, 20, blui);
  display.drawRect(10,10,63, 63,blui);
  display.drawLine(2, 80, 317, 80, white);

  // Selected item info
  if (selected != -1 && items[selected]) {
  var item = items[selected];

  display.setTextSize(2);
  display.setTextColor(white)
  if (item.rarity === "Rare"){
    display.setTextColor(rare);
    drawCenteredText(item.name, 13);
    drawBitmap(30,30, 16, 16, item.icon, item.rarity);
  } else if (item.rarity === "Epic"){
    display.setTextColor(epic);
    drawCenteredText(item.name, 13);
    drawBitmap(30,30, 16, 16, item.icon, item.rarity);
  }
  
  display.setTextSize(1);
  display.setTextColor(white);
  display.drawText("ITEM: " + item.itemtype, 80, 40);

  display.setTextColor(green);
  display.drawText(item.stat + ": +" + item.value, 80, 60);

  display.setTextColor(bluv)
  drawWrappedText("Description: " + item.description, 10, 87, 310, 12);
  }
}

// Run once
drawInventory();
if (selected != -1){
  drawDescription();
}`;
