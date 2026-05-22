const defaultCode = `const storage = require("storage");
const display = require("display");
const device = require("device");
const keyboard = require("keyboard");
const dialog = require("dialog");

// Screen dimensions
const screenWidth = display.width();
const screenHeight = display.height();

// Menu
var redraw = true;
var settingsMenu = false;
var statsPanel = false;

var menuIndex = 0;
var menuItems = ["CONTINUE", "NEW GAME", "SETTINGS", "EXIT"];
var menuPositions = [
    { x: 110, y: 65 },
    { x: 110, y: 85 },
    { x: 110, y: 105 },
    { x: 110, y: 125 }
];

var GameTitle = "DUNGEON REALMS";

function hasSDCard() {
    try { 
        storage.readdir({ fs: "sd" }); 
        return true; 
    } catch(err) { 
        return false; 
    }
}

// file path directory
var stateSave = {
    mode: "SD",
    fileName: "/" + "rpg_save.json"
};

function getSavePath(){
    var mode = hasSDCard() ? "sd" : "littlefs";
    return { fs: mode, path: stateSave.fileName };
}


// --- DEBUG SYSTEM ---
var fps = 0;
var frameCount = 0;
var lastFpsTime = Date.now();

function bytesToMB(bytes) {
    if (!bytes) return "0.00";
    return (bytes / 1048576).toFixed(2);
}

function percent(used, total){
    if (!total) return "0%";
    return Math.floor((used / total) * 100) + "%";
}

var inGame = false;
var fpsPos, savePos, ramPos, psramPos;

function drawDebugOverlay(){
if (inGame === true) {
    fpsPos = {x: 5, y: 70};
    savePos = {x: 5, y: 78};
    ramPos = {x: 5, y: 86};
    psramPos = {x: 5, y: 94};
} else {
    fpsPos = {x: 5, y: 130};
    savePos = {x: 5, y: 140};
    ramPos = {x: 5, y: 150};
    psramPos = {x: 5, y: 160};
}

    var mem = device.getFreeHeapSize();

    var ramFree = bytesToMB(mem.ram_free);
    var ramTotal = bytesToMB(mem.ram_size);
    var ramUsed = mem.ram_size - mem.ram_free;

    var psFree = bytesToMB(mem.psram_free);
    var psTotal = bytesToMB(mem.psram_size);
    var psUsed = mem.psram_size - mem.psram_free;

    var saveStatus = saveExists() ? "OK" : "NONE";

    display.setTextSize(1);
    display.setTextColor(display.color(0,255,0));

    display.drawString("FPS: " + fps, fpsPos.x, fpsPos.y);

    display.drawString(
        "RAM: " + ramFree + "/" + ramTotal + "MB (" + percent(ramUsed, mem.ram_size) + ")", ramPos.x, ramPos.y);

    display.drawString(
        "PSRAM: " + psFree + "/" + psTotal + "MB (" + percent(psUsed, mem.psram_size) + ")", psramPos.x, psramPos.y);

    display.drawString(
        "SAVE: " + stateSave.mode + " [" + saveStatus + "]", savePos.x, savePos.y);
}

// Colors
var colors = {
    background: display.color(60,60,60),
    save: display.color(5,0,0),
    title: display.color(255,58,58),
    menu: display.color(198,88,88),
    menuHighlight: display.color(255,255,255),
    version: display.color(255,255,255),
    white: display.color(255,255,255),
    black: display.color(0,0,0),
    green: display.color(0,255,0),
    red: display.color(255,0,0),
    blue: display.color(0,0,255)
};

// --- SAVE / LOAD ---
function savePlayer(player){
    player.time = Date.now();
    try {
        storage.write(getSavePath(), JSON.stringify(player));
    } catch(err){}
}

function loadSave(){
    try {
        var data = storage.read(getSavePath());
        if(!data) return null;
        return JSON.parse(data);
    } catch(err){
        return null;
    }
}

function saveExists(){
    var data = "";
    try { data = storage.read(getSavePath()) || ""; } catch(err5){ return false; }
    return data.trim() !== "";
}

// --- DRAW MAIN MENU ---
function drawMenu(){
    // storage size
    display.drawFillRect(0,0,screenWidth,screenHeight, colors.background);
    display.setTextSize(1);

    if (saveExists()) {
    display.setTextColor(colors.green);    // GREEN if save found
    display.drawString("fs: " + stateSave.mode + "/" + stateSave.fileName + " > Save Found!", 15, 10);
    } else {
    display.setTextColor(colors.red);      // RED if no save
    display.drawString("fs: " + stateSave.mode + "/" + stateSave.fileName + " > Not Found!", 15, 10);
    }
    
    function bytesToMB(bytes) {
        if (!bytes) return "0.00";
        return (bytes / 1048576).toFixed(2);
    }

    //display.setTextColor(display.color(0,255,255));
    //display.drawString("RAM: " + bytesToMB(memoryStats.ram_free) + "MB / " + bytesToMB(memoryStats.ram_size) + "MB",15, 150);
    //display.drawString("PSRAM: " + bytesToMB(memoryStats.psram_free) + "MB / " + bytesToMB(memoryStats.psram_size) + "MB",15, 160);

    display.setTextSize(3);
    display.setTextColor(colors.title);
    display.drawString(GameTitle, 38, 35);

    display.setTextSize(2);
    for(var i=0;i<menuItems.length;i++){
        display.setTextColor(i===menuIndex?colors.menuHighlight:colors.menu);
        var text = menuItems[i];
        if(i===menuIndex) text = "> " + text;
        display.drawString(text, menuPositions[i].x, menuPositions[i].y);
    }

    display.setTextSize(1);
    display.setTextColor(colors.version);
    display.drawString("V1.0", 280, 155);
}

var optionIndex = 0;
var totalOptions = 6;
var optionState = {
    sound: false,
    music: false,
    db: false
};

function getOptionText(i){
    if(i === 0) return "SOUND: " + (optionState.sound ? "ON" : "OFF");
    if(i === 1) return "MUSIC: " + (optionState.music ? "ON" : "OFF");
    if(i === 2) return "SAVE: " + (stateSave.mode || "FS");
    if(i === 3) return "DEBUG: " + (optionState.db ? "ON" : "OFF");
    if(i === 4) return "DELETE SAVE";
    if(i === 5) return "BACK";
}

function drawSettings(){

    display.drawFillRect(0,0,screenWidth,screenHeight, colors.background);

    display.setTextSize(2);
    display.setTextColor(colors.white);
    display.drawString("Settings", screenWidth / 3, 30);

    display.setTextSize(1);

    if (saveExists()) {
    display.setTextColor(colors.green);    // GREEN if save found
    display.drawString("fs: " + stateSave.mode + "/" + stateSave.fileName + " > Save Found!", 15, 10);
    } else {
    display.setTextColor(colors.red);      // RED if no save
    display.drawString("fs: " + stateSave.mode + "/" + stateSave.fileName + " > Not Found!", 15, 10);
    }

    for(var i = 0; i < totalOptions; i++){
        var text = getOptionText(i);

        display.setTextColor(i === optionIndex ? colors.menuHighlight : colors.menu);

        if(i === optionIndex) text = "> " + text;

        var x = (screenWidth - text.length * 6) / 2;
        display.drawString(text, x, 60 + i * 13);
    }
}

// --- STATS PANEL ---
function showStats(player){
    display.fill(display.color(0,0,0)); // fill(0x0000)

    // ---- Outer panel ----
    display.drawFillRoundRect(4, 4, 312, 162, 4, display.color(0,63,255)); // lighter blue
    display.drawFillRoundRect(6, 6, 308, 158, 2, display.color(0,0,0));    // black inner

    // ---- STATUS Header ----
    display.drawFillRoundRect(100, 15, 112, 22, 0, display.color(0,63,255));
    display.drawFillRoundRect(101, 16, 110, 20, 0, display.color(0,0,0));

    display.setTextColor(display.color(0,63,255)); // blue header
    display.setTextSize(2);
    display.drawString("STATUS", 122, 19);

    // ---- JOB + TITLE ----
    display.setTextColor(display.color(255,255,255)); // white
    display.setTextSize(1);

    display.drawString("JOB: " + (player.identity.job || "N/A"), 151, 60);

    display.drawString("TITLE: " + (player.identity.title || "N/A"), 140, 70);

    // ---- LEVEL ----
    //display.setTextSize(2);
    //display.setCursor(90, 45);
    //drawString(player.level);

    display.setTextSize(2);
    var levelText = player.progression.level.toString();
    var centerX = 108;
    var charWidth = 6 * 2;
    var drawX = centerX - Math.floor(levelText.length * charWidth / 2);
    display.drawString(levelText, drawX, 50);

    display.setTextSize(1);
    display.drawString("LEVEL", 95, 70);

    // ---- HP / MP / FATIGUE BAR ----
    display.drawFillRoundRect(40, 85, 242, 22, 0, display.color(0,63,255));
    display.drawFillRoundRect(41, 86, 240, 20, 0, display.color(0,0,0));

    display.drawString("HP: " + player.combat.hp + "/" + player.combat.maxHp, 50, 92);

    display.drawString("MP: " + player.combat.mp + "/" + player.combat.maxMp, 125, 92);

    display.drawString("FATIGUE: " + player.combat.fatigue, 200, 92);

    // ---- STAT BOX ----
    display.drawFillRoundRect(40, 112, 242, 42, 0, display.color(0,63,255));
    display.drawFillRoundRect(41, 113, 240, 40, 0, display.color(0,0,0));

    // Left stats
    display.drawString("STR: " + player.stats.str.base + "(+" + (player.stats.str.bonus||0) + ")", 70, 120);

    display.drawString("AGI: " + player.stats.agi.base + "(+" + (player.stats.agi.bonus||0) + ")", 70, 130);

    display.drawString("PER: " + player.stats.per.base + "(+" + (player.stats.per.bonus||0) + ")", 70, 140);

    // Right stats
    display.drawString("VIT: " + player.stats.vit.base + "(+" + (player.stats.vit.bonus||0) + ")", 180, 120);

    display.drawString("INT: " + player.stats.int.base + "(+" + (player.stats.int.bonus||0) + ")", 180, 130);

    display.drawString("SP: " + player.progression.sp, 180, 140);
}

// --- LEVEL UP ---
function gainExp(player, exp){
    var prog = player.progression;

    prog.exp += exp;

    while(prog.exp >= prog.nextExp){
        prog.exp -= prog.nextExp;
        prog.level++;

        player.combat.maxHp += 10;
        player.combat.hp = player.combat.maxHp;
        player.combat.atk += 2;
        player.combat.def += 1;
        prog.sp += 1;

        dialog.info(player.identity.name + " leveled up! Now level " + prog.level);
        prog.level += 1;
        delay(2000);

        // Update next level requirement
        prog.nextExp = 20 + prog.level * 10;
    }
}

// --- BATTLE PANEL ---
function drawBattle(player, enemy){

    display.fill(display.color(0,0,0)); // clear screen

    // --- ENEMY CARD ---
    display.drawFillRoundRect(4,4,312,62,3,display.color(255,0,0));
    display.drawFillRoundRect(6,6,308,58,3,display.color(0,0,0));
    display.setTextColor(display.color(255,255,255));
    display.setTextSize(1);

    display.drawString("Enemy: " + enemy.name, 15, 15);
    display.drawString("LVL: " + enemy.level, 150, 15);
    display.drawString("HP: " + enemy.hp + "/" + enemy.maxHp, 235,27);
    display.drawString("MP: " + enemy.mp + "/" + enemy.maxMp, 235,35);
    display.drawString("ATK: " + enemy.atk, 15,25);
    display.drawString("DEF: " + enemy.def, 15,35);

    // --- ENEMY HP BAR ---
    var enemyHpPct = enemy.hp / enemy.maxHp;
    var enemyHpWidth = Math.floor(enemyHpPct * 100);
    var enemyHpColor = enemyHpPct > 0.7 ? display.color(0,255,0) :
                        enemyHpPct > 0.3 ? display.color(255,255,0) :
                        display.color(255,0,0);
    display.drawFillRoundRect(200,12,102,6,3,display.color(255,255,255));
    display.drawFillRoundRect(201,13,enemyHpWidth,4,3,enemyHpColor);

    // --- ENEMY MP BAR ---
    var enemyMpPct = enemy.mp / enemy.maxMp;
    var enemyMpWidth = Math.floor(enemyMpPct * 100);
    var enemyMpColor = enemyMpPct > 0.7 ? display.color(0,0,255) :
                        enemyMpPct > 0.3 ? display.color(0,255,255) :
                        display.color(128,0,128);
    display.drawFillRoundRect(200,20,102,5,3,display.color(255,255,255));
    display.drawFillRoundRect(201,21,enemyMpWidth,3,3,enemyMpColor);

    // --- PLAYER CARD ---
    display.drawFillRoundRect(4,104,312,62,3,display.color(0,0,255));
    display.drawFillRoundRect(6,106,308,58,3,display.color(0,0,0));

    display.drawString("Player: " + player.identity.name, 15,110);
    display.drawString("EXP: " + player.progression.exp + "/" + player.progression.nextExp, 15,124);
    display.drawString("LVL: " + player.progression.level, 150,115);
    display.drawString("HP: " + player.combat.hp + "/" + player.combat.maxHp, 235,127);
    display.drawString("MP: " + player.combat.mp + "/" + player.combat.maxMp, 235,135);
    display.drawString("ATK: " + player.combat.atk, 15,132);
    display.drawString("DEF: " + player.combat.def, 15,140);

    // --- PLAYER EXP BAR ---
    var playerExpPct = player.progression.exp / player.progression.nextExp;
    var playerExpWidth = Math.floor(playerExpPct * 100);
    var playerExpColor = playerExpPct > 0.7 ? display.color(0,255,0) :
                        playerExpPct > 0.3 ? display.color(0,255,0) :
                        display.color(100,255,100);
    display.drawFillRoundRect(15,119,102,4,3,display.color(255,255,255));
    display.drawFillRoundRect(16,120,playerExpWidth,2,3,playerExpColor);

    // --- PLAYER HP BAR ---
    var playerHpPct = player.combat.hp / player.combat.maxHp;
    var playerHpWidth = Math.floor(playerHpPct * 100);
    var playerHpColor = playerHpPct > 0.7 ? display.color(0,255,0) :
                        playerHpPct > 0.3 ? display.color(255,255,0) :
                        display.color(255,0,0);
    display.drawFillRoundRect(200,112,102,6,3,display.color(255,255,255));
    display.drawFillRoundRect(201,113,playerHpWidth,4,3,playerHpColor);

    // --- PLAYER MP BAR ---
    var playerMpPct = player.combat.mp / player.combat.maxMp;
    var playerMpWidth = Math.floor(playerMpPct * 100);
    var playerMpColor = playerMpPct > 0.7 ? display.color(0,0,255) :
                        playerMpPct > 0.3 ? display.color(0,255,255) :
                        display.color(128,0,128);
    display.drawFillRoundRect(200,120,102,5,3,display.color(255,255,255));
    display.drawFillRoundRect(201,121,playerMpWidth,3,3,playerMpColor);

    // Action hint
    display.drawString("PREV: Menu/Stats | NEXT: Actions", 60,154);

    // VS label
    display.setTextSize(3);
    display.drawString("VS", 140,75);
    display.setTextSize(1);

    if(optionState.db === true) drawDebugOverlay();
}

// --- ENEMY GENERATION ---
var enemyNames = ["Orc","Goblin","Troll","Elf","Dragon","Skeleton","Zombie","Lizardman","Warg","Shade","Giant","Harpy"];
function generateEnemy(playerLevel){
    playerLevel = Math.max(1, Number(playerLevel) || 1); // ensure at least 1

    var name = enemyNames[Math.floor(Math.random()*enemyNames.length)];
    var level = Math.max(1, Math.floor(Math.random() * playerLevel) + 1);

    // stats scale with level + random bonus
    var str = level + Math.floor(Math.random() * 3);
    var agi = level + Math.floor(Math.random() * 3);
    var per = level + Math.floor(Math.random() * 3);
    var vit = level + Math.floor(Math.random() * 3);
    var intel = level + Math.floor(Math.random() * 3);

    var atk = str * 2 + per;
    var def = vit * 2;
    var dodge = Math.min(0.3, agi * 0.01);

    var maxHp = 100 + vit * 10;
    var maxMp = 50 + intel * 5;

    return {
        name: name,
        level: level,
        str: str,
        agi: agi,
        per: per,
        vit: vit,
        intel: intel,
        atk: atk,
        def: def,
        dodge: dodge,
        hp: maxHp,
        maxHp: maxHp,
        mp: maxMp,
        maxMp: maxMp
    };
}

var itemDB = {
    hp_potion: { name: "HP Potion", type: "consumable" },
    mp_potion: { name: "MP Potion", type: "consumable" },
    dagger: { name: "Dagger", type: "weapon" },
    ruby: { name: "Ruby", type: "accessory" }
};

function getRandomLoot() {
    var lootTable = ["hp_potion", "mp_potion", "dagger", "ruby", "gold"];
    var index = Math.floor(Math.random() * lootTable.length);
    return lootTable[index];
}

function giveLoot(player) {
    var loot = getRandomLoot();

    if (loot === "gold") {
        var amount = Math.floor(Math.random() * 20) + 5;
        player.progression.gold = (player.progression.gold || 0) + amount;
        dialog.info("You found " + amount + " gold!");
    } else {
        player.inventory = player.inventory || [];

        var existing = null;

        for (var i = 0; i < player.inventory.length; i++) {
            if (player.inventory[i].id === loot) {
                existing = player.inventory[i];
                break;
            }
        }

        if (existing) {
            existing.qty += 1;
        } else {
            player.inventory.push({ id: loot, qty: 1 });
        }

        dialog.info("You found a " + itemDB[loot].name + "!");
    }

    delay(1000);
}

// --- ENEMY TURN ---
function enemyTurn(player, enemy) {
    if (player.combat.hp <= 0) return;

    var actionRoll = Math.random();
    var action = "attack";
    if (actionRoll < 0.1) action = "skill";
    else if (actionRoll < 0.2) action = "defend";

    if (action === "defend") {
        enemy.isDefending = true;
        dialog.info(enemy.name + " is defending!");
        delay(1500);
        return;
    } else {
        enemy.isDefending = false;
    }

    var baseDmg = (enemy.str * 2) + (enemy.agi * 0.5) + (enemy.per * 0.3);
    baseDmg = Math.floor(baseDmg * (0.9 + Math.random() * 0.2));

    var dodgeChance = getStat(player.stats.agi, player) * 0.01;
    if (Math.random() < (player.combat.dodge || dodgeChance)) {
        dialog.info("You dodged the attack!");
        delay(1500);
        return;
    }

    var defense = getStat(player.stats.vit, player) + (player.combat.def || 0);
    var dmg = Math.max(1, Math.floor(baseDmg - defense));

    if (player.isDefending) dmg = Math.floor(dmg * 0.5);

    if (Math.random() < 0.1) {
        dmg = Math.floor(dmg * 1.5);
        dialog.info("Critical hit by " + enemy.name + "!");
        delay(1500);
    }

    player.combat.hp = Math.max(0, player.combat.hp - dmg);
    dialog.info(enemy.name + " attacked! You took " + dmg + " damage.");
    delay(1500);
}

function playerAttack(player, enemy) {
    // ----- Calculate base damage from player's attributes -----
    var baseDmg = Math.floor(
        (player.stats.str.base + (player.stats.str.bonus || 0) - (player.stats.str.debuff || 0)) * 2 +
        (player.stats.agi.base + (player.stats.agi.bonus || 0) - (player.stats.agi.debuff || 0)) * 0.5 +
        (player.stats.per.base + (player.stats.per.bonus || 0) - (player.stats.per.debuff || 0)) * 0.3 +
        (player.stats.int.base + (player.stats.int.bonus || 0) - (player.stats.int.debuff || 0)) * 0.2 + player.combat.atk
    );

    // Random variation Â±10%
    baseDmg = Math.floor(baseDmg * (0.9 + Math.random() * 0.2));

    // Fatigue effect: chance to reduce damage
    var fatigueChance = Math.min(0.3, player.combat.fatigue / 100); // max 30% chance
    if (Math.random() < fatigueChance) {
        var fatigueModifier = 0.7 + Math.random() * 0.3; // reduce damage 70â€“100%
        baseDmg = Math.floor(baseDmg * fatigueModifier);
        dialog.info("Fatigue slightly weakened your attack!");
        delay(1500);
        dialog.info("You attacked! " + enemy.name + " took " + baseDmg + " damage.");
        delay(1500);
    }

    // Enemy dodge
    var enemyDodge = enemy.dodge || 0;
    if (Math.random() < enemyDodge) {
        dialog.info(enemy.name + " dodged your attack!");
        delay(1500);
        return;
    }

    // Reduce by enemy defense
    var dmg = Math.max(1, Math.floor(baseDmg - (enemy.def || 0)));

    // Critical hit chance (10%)
    if (Math.random() < 0.1) {
        dmg = Math.floor(dmg * 1.5);
        dialog.info("Critical hit!");
        delay(1500);
    }

    // Apply damage
    enemy.hp = Math.max(0, enemy.hp - dmg);

    // Increase fatigue slightly, independent of attack power
    player.combat.fatigue += Math.floor(Math.random() * 2) + 1; // 1â€“2 fatigue per attack

    dialog.info("You attacked! " + enemy.name + " took " + dmg + " damage.");
    delay(1500);
}

function getStat(stat, player) {
    // Base calculation: base + bonus - debuff
    var value = (stat.base || 0) + (stat.bonus || 0) - (stat.debuff || 0);

    // Apply fatigue penalty if player provided
    if (player && player.combat && player.combat.fatigue) {
        // Example: 1% stat penalty per 5 fatigue points
        var fatiguePenalty = Math.floor(player.combat.fatigue / 5);
        value = Math.max(0, value - fatiguePenalty);
    }

    return value;
}

function createPlayer(name) {
    var stats = {
        str: { base: 5, bonus: 0, debuff: 0 },
        agi: { base: 5, bonus: 0, debuff: 0 },
        per: { base: 5, bonus: 0, debuff: 0 },
        vit: { base: 0, bonus: 0, debuff: 0 },
        int: { base: 5, bonus: 0, debuff: 0 },
        mag: { base: 0, bonus: 0, debuff: 0 },
        mdef: { base: 0, bonus: 0, debuff: 0 },
        luck: { base: 0, bonus: 0, debuff: 0 }
    };

    // Calculate base combat stats from attributes
    var baseAtk = (getStat(stats.str) * 2)
                + (getStat(stats.agi) * 0.5)
                + (getStat(stats.per) * 0.3)
                + (getStat(stats.int) * 0.2);

    var baseDef = (getStat(stats.vit) * 2)
                + (getStat(stats.agi) * 0.5)
                + (getStat(stats.str) * 0.2);

    return {
        identity: {
            name: name || "Hero",
            job: null,
            title: null
        },

        progression: {
            level: 0,
            exp: 0,
            nextExp: 20,
            sp: 10,
            gold: 0
        },

        stats: stats,

        combat: {
            maxHp: 100 + getStat(stats.vit) * 10,
            hp: 100 + getStat(stats.vit) * 10,
            maxMp: 50 + getStat(stats.int) * 5,
            mp: 50 + getStat(stats.int) * 5,
            fatigue: 0,
            atk: baseAtk,
            def: baseDef,
            dodge: getStat(stats.agi) * 0.01
        },

        inventory: [
            { id: "hp_potion", qty: 1 },
            { id: "mp_potion", qty: 1 },
            { id: "dagger", qty: 1 }
        ]
    };
}

function calculateEscapeChance(player, enemy) {
    // Base chance from player stats
    var agiFactor = getStat(player.stats.agi, player) * 0.3;   // 0.3% per AGI
    var perFactor = getStat(player.stats.per, player) * 0.2;   // 0.2% per PER
    var luckFactor = getStat(player.stats.luck, player) * 0.5; // 0.5% per LUCK

    // Fatigue reduces effectiveness
    var fatiguePenalty = Math.floor(player.combat.fatigue / 5); // 1% per 5 fatigue
    var baseChance = agiFactor + perFactor + luckFactor - fatiguePenalty;

    // Enemy low HP bonus: easier to escape weak enemies
    var enemyHpPct = enemy.hp / enemy.maxHp;
    if (enemyHpPct < 0.3) baseChance += 20; // +20% if enemy under 30% HP
    else if (enemyHpPct < 0.6) baseChance += 10; // +10% if under 60%

    // Cap chance between 5% and 80%
    var finalChance = Math.min(0.8, Math.max(0.05, baseChance / 100));
    return finalChance;
}

function attemptEscape(player, enemy) {
    var escapeChance = calculateEscapeChance(player, enemy);
    if (Math.random() < escapeChance) {
        dialog.info("You escaped successfully!");
        delay(1500);
        return true; // escape success
    } else {
        // Failed escape: enemy gets free hit
        var baseDmg = Math.floor(enemy.atk * 0.4);
        player.combat.hp = Math.max(0, player.combat.hp - baseDmg);
        dialog.info("Escape failed! " + enemy.name + " dealt " + baseDmg + " damage.");
        delay(1500);
        return false;
    }
}

// --- MAIN GAME LOOP ---
function gameLoop(player, plrITEMS) {
    var lastSaveTime = Date.now();
    player.inventory = player.inventory || []; // ensure inventory
    var enemy = generateEnemy(player.progression.level);
    drawBattle(player, enemy);

    while(true) {

        if (player.hp <= 0) {
            dialog.info(player.name + " has died! Game over.");
            savePlayer(player);
            inGame = false;
            break;
        }

        if(enemy.hp <= 0){
            var exp = enemy.level*5 + Math.floor(Math.random()*6);
            var spGain = Math.floor(Math.random()*(enemy.level+1))+1;
            dialog.info(enemy.name + " defeated! +" + exp + " EXP, +" + spGain + " SP!");
            delay(1500);

            gainExp(player, exp);
            player.progression.sp += spGain;

            // Give random loot
            giveLoot(player);

            // Generate next enemy
            enemy = generateEnemy(player.progression.level);
            drawBattle(player, enemy);
        }

        if (keyboard.getNextPress()) {
            if (statsPanel === false) {
                var attackMenu = [
                ["ATTACK","attack"],
                ["DEFEND","defend"],
                ["SKILL","skill"],
                ["RUN","run"],
                ["BACK","back"]
            ];

            var action = dialog.choice(attackMenu);
            if (action === "back") {
                drawBattle(player, enemy);
                continue;
            } else if (action === "attack") {
                playerAttack(player, enemy);

                if (enemy.hp > 0) enemyTurn(player, enemy);
                drawBattle(player, enemy);

            } else if (action === "defend") {
                player.isDefending = true;

                dialog.info("You brace for impact!");
                delay(1000);

                enemyTurn(player, enemy);
                player.isDefending = false;
                drawBattle(player, enemy);

            } else if (action === "skill") {
                var skillMenu = [
                    ["Summon", "summon"],
                    ["Utility","utility"],
                    ["Passive","passive"],
                    ["Cancel","cancel"]
                ];

                var skill = dialog.choice(skillMenu);
                if (skill === "cancel") {
                }
                

                } else if (action === "run") {
                    if (attemptEscape(player, enemy)) {
                    // Generate new enemy if escaped
                    enemy = generateEnemy(player.level);
                    drawBattle(player, enemy);
                } else {
                    // Player took damage on failed escape
                    drawBattle(player, enemy);
                    }
                }
            }
        }

        if (keyboard.getPrevPress()) {
            if (statsPanel === true) {
                statsPanel = false;
            }
            var menuOptions = [
                ["STATS","stats"],
                ["INVENTORY","inventory"],
                ["BACK","back"],
            ];

            var menu = dialog.choice(menuOptions);
            if (menu === "back") {
                drawBattle(player, enemy);
                continue;
            } else if (menu === "stats") {
                showStats(player);
                statsPanel = true;
            } else if (menu === "inventory") {

                // Build menu from inventory objects
                var inventoryMenu = [];

                for (var i = 0; i < player.inventory.length; i++) {
                    var item = player.inventory[i];
                    var name = itemDB[item.id].name;
                    inventoryMenu.push(name + " x" + item.qty);
                }

                inventoryMenu.push("cancel");

                var choice = dialog.choice(inventoryMenu);

                if (!choice || choice === "cancel") {
                    drawBattle(player, enemy);
                    continue;
                }

                // Get selected index
                var index = inventoryMenu.indexOf(choice);
                var itemObj = player.inventory[index];
                var itemId = itemObj.id;

                // Actions
                var actions = ["Use", "Sell", "Info", "Cancel"];
                var action = dialog.choice(actions);

                if (action === "Use") {

                    if (itemId === "hp_potion") {
                        player.combat.hp = Math.min(player.combat.maxHp, player.combat.hp + 50);
                        dialog.info("Used HP Potion!");
                    } 
                    else if (itemId === "mp_potion") {
                        player.combat.mp = Math.min(player.combat.maxMp, player.combat.mp + 30);
                        dialog.info("Used MP Potion!");
                    }
                    else if (itemId === "dagger") {
                        player.combat.atk += 10;
                        dialog.info("Equipped Dagger!");
                    }

                    itemObj.qty--;

                    if (itemObj.qty <= 0) {
                        player.inventory.splice(index, 1);
                    }

                    delay(1000);
                }

                else if (action === "Sell") {
                    player.progression.gold = (player.progression.gold || 0) + 10;

                    itemObj.qty--;
                    if (itemObj.qty <= 0) {
                        player.inventory.splice(index, 1);
                    }

                    dialog.info("Sold item for 10 gold.");
                    delay(1000);
                }

                else if (action === "Info") {
                    dialog.info(itemDB[itemId].name);
                    delay(1000);
                }

                drawBattle(player, enemy);
                
            } else {
                drawBattle(player, enemy);
            }
        }
        
        if (keyboard.getSelPress()) {
            if (statsPanel === false) {
                var menuOptions = [
                ["BACK","back"],
                ["MAIN MENU","main menu"],
                ["SAVE & QUIT","save & quit"]
            ];

                var menu = dialog.choice(menuOptions);
                if (menu === "back") {
                    drawBattle(player, enemy);
                    continue;
                } else if (menu === "save & quit") {
                    savePlayer(player);
                    dialog.info("Game saved! Returning to main menu...");
                    inGame = false;
                    delay(1500);
                    break;

                } else if (menu === "main menu") {
                    dialog.info("Returning to main menu...");
                    inGame = false;
                    delay(1500);
                    break;
                }
            }
        }

        if (keyboard.getEscPress()) { savePlayer(player); break; }
        var now = Date.now();
        if (now - lastSaveTime >= 300000) { savePlayer(player); lastSaveTime = now; }
        delay(100);
    }
}

// --- MAIN LOOP ---
drawMenu();
while(true){
    // --- FPS COUNTER ---
    frameCount++;
    var now = Date.now();

    if (now - lastFpsTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFpsTime = now;
    }


    if (settingsMenu === false) {
    if(keyboard.getPrevPress()){ menuIndex=(menuIndex-1+menuItems.length)%menuItems.length; redraw=true; }
    if(keyboard.getNextPress()){ menuIndex=(menuIndex+1)%menuItems.length; redraw=true; }

    if(keyboard.getSelPress()){
        var sel = menuItems[menuIndex];
        if(sel==="CONTINUE"){
            var player = loadSave();

            if(player){
                inGame = true;          // âœ… only set when actually entering game
                gameLoop(player);
            } else {
                display.drawFillRect(0,0,screenWidth,screenHeight, colors.black);
                display.setTextSize(1);
                display.setTextColor(colors.red);

                display.drawString(
                    saveExists() ? "Save file corrupted!" : "No save found!",
                    screenWidth/2-50,
                    screenHeight/2-10
                );
                delay(1500);
            }

            redraw = true;
        }
        if(sel==="NEW GAME"){
            inGame = true;
            display.fill(colors.background);
            display.setTextSize(2);
            display.setTextColor(colors.white);

            var playerName = keyboard.keyboard("",12,"Enter your hero's name") || "Hero";
            var player = createPlayer(playerName);

            savePlayer(player); gameLoop(player); redraw=true;
        }
        if(sel==="SETTINGS"){
            settingsMenu = true;
            drawSettings(); 
            redraw = true; 
            continue;
        }
        if(sel==="EXIT") break;
    }

    if(keyboard.getEscPress()) break;
    if(redraw){ drawMenu(); if(optionState.db === true) { drawDebugOverlay(); } } redraw=false;
    delay(50);

    } else if (settingsMenu === true) {

        if(keyboard.getPrevPress()){
            optionIndex = (optionIndex - 1 + totalOptions) % totalOptions;
            redraw = true;
        }

        if(keyboard.getNextPress()){
            optionIndex = (optionIndex + 1) % totalOptions;
            redraw = true;
        }

        if(keyboard.getSelPress()){
            var i = optionIndex;

            if(i === 0){
                optionState.sound = !optionState.sound;
                dialog.info("FUNCTIONALITY NOT IMPLEMENTED: Sound " + (optionState.sound ? "ON" : "OFF"));
                delay(1500);
                drawSettings(); redraw = true;
            }

            if(i === 1){
                optionState.music = !optionState.music;
                dialog.info("FUNCTIONALITY NOT IMPLEMENTED: Music " + (optionState.music ? "ON" : "OFF"));
                delay(1500);
                drawSettings(); redraw = true;
            }

            if(i === 2){
                stateSave.mode = (stateSave.mode === "FS") ? "SD" : "FS";
                dialog.info("Save changed to " + stateSave.mode);
                delay(1500);
                drawSettings(); redraw = true;
            }

            if(i === 3){
                optionState.db = !optionState.db;
                dialog.info("Debug mode " + (optionState.db ? "ON" : "OFF"));
                delay(1500);
                drawSettings(); redraw = true;
            }

            if(i === 4){
                if(!saveExists()){
                    dialog.info("No save found!");
                    delay(1500);
                    redraw = true;
                    continue;
                }

                dialog.info("Delete save file? This cannot be undone.");
                delay(3000);

                var confirm = dialog.choice([["YES","yes"],["NO","no"]]);
                if (confirm === "yes") {
                    try {
                        storage.remove(getSavePath());
                        dialog.info("Save deleted!");
                    } catch(err) {
                        dialog.info("Failed to delete save file.");
                    } redraw = true;
                    delay(1500);
                }

                redraw = true;
            }

            if(i === 5){
                settingsMenu = false;
                dialog.info("Returning to main menu...");
                delay(1500);
                drawMenu(); redraw = true;
                continue;
            }

            redraw = true;
        }

        if(redraw){
            drawSettings(); if(optionState.db === true) { drawDebugOverlay(); }
            redraw = false;
        }
    }
}`;