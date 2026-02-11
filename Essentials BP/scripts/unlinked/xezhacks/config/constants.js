/**
 * XezHack - Constants & Configuration
 * Contains all constant values used across the addon
 */

import { world } from "@minecraft/server";

// =====================================================
// DYNAMIC PROPERTY KEYS
// =====================================================
export const DP_WORLD_OWNER = "xezhack_rc:world_owner";
export const DP_PLAYER_PERMISSIONS = "xezhack_rc:permissions";
export const DP_AUTO_GIVE_ITEM = "xezhack_rc:auto_give_item";
export const DP_BLOCKED_COMMANDS = "xezhack_rc:blocked_commands";
export const DP_COMMAND_MODE = "xezhack_rc:command_mode";

// =====================================================
// PERMISSION LEVELS
// =====================================================
export const PERMISSION_LEVELS = {
  FULL: "full",       // Semua command diizinkan
  LIMITED: "limited", // Hanya command tertentu (diblokir yang berbahaya)
  NONE: "none"        // Tidak bisa pakai XezHack
};

export const COMMAND_MODES = {
  ALLOW_ALL: "allow_all", // Mode 1: Izinkan Semua
  CUSTOM: "custom",       // Mode 2: Izinkan Command Tertentu (List)
  BLOCK_ALL: "block_all"  // Mode 3: Jangan Izinkan Apapun
};

// =====================================================
// BLOCKED COMMANDS (for LIMITED permission)
// =====================================================
// ALL BEDROCK COMMANDS (Used for UI List)
// =====================================================
export const ALL_BEDROCK_COMMANDS = [
  "?", "alwaysday", "camera", "camerashake", 
  "changesetting", "clear", "clearspawnpoint", "clone", "connect", 
  "damage", "daylock", "dedicatedwsserver", "deop", "dialogue", 
  "difficulty", "effect", "enchant", "event", "execute", 
  "fog", "function", "gamemode", "gamemode spectator", "gamerule", 
  "gametest", "give", "help", "hud", 
  "inputpermission", "kick", "kill", "list", "locate", 
  "loot", "me", "mobevent", "msg", "music", 
  "op", "particle", "playanimation", "playsound", "recipe", 
  "reload", "replaceitem", "ride", "say", "schedule", 
  "scoreboard", "scriptevent", "setblock", "setmaxplayers", "setworldspawn", 
  "spawnpoint", "spreadplayers", "stopsound", "structure", "summon", 
  "tag", "teleport", "tell", "tellraw", "testfor", 
  "testforblock", "testforblocks", "tickingarea", "time", "title", 
  "titleraw", "toggledownfall", "tp", "videostream", "volumearea", 
  "w", "weather", "wsserver", "xp"
];

// =====================================================
// DEFAULT BLOCKED COMMANDS (Initial Configuration)
// =====================================================
export const DEFAULT_BLOCKED_COMMANDS = [
  "camera",
  "clear",
  "clone",
  "damage",
  "deop",
  "difficulty",
  "execute",
  "fill",
  "function",
  "gamemode spectator",
  "gamerule",
  "give",
  "kick",
  "kill",
  "loot",
  "op",
  "replaceitem",
  "schedule",
  "scoreboard",
  "scriptevent",
  "setblock",
  "setmaxplayers",
  "setworldspawn",
  "spawnpoint",
  "spreadplayers",
  "structure",
  "summon",
  "tag",
  "tickingarea",
  "xp"
];

// =====================================================
// SOUND EFFECTS
// =====================================================
export const SOUNDS = {
  // Success/Error
  success: "random.orb",
  error: "mob.villager.no",
  warning: "note.bass",
  spectatorWarn: "mob.vex.hurt", // Eerie warning
  
  // Specific Actions
  enchant: "random.anvil_use",
  enchantAll: "random.levelup",
  teleport: "mob.endermen.portal",
  death: "mob.wither.death",
  delete: "mob.zombie.woodbreak", // Big delete
  deleteSingle: "ui.stonecutter.take_result", // Sharp/Single delete
  copy: "ui.cartography_table.take_result", // Writing/Copying
  socialMedia: "random.levelup", 

  // UI Sounds - General
  menuOpen: "armor.equip_generic", // Soft swish (replacing loud chest open)
  menuClose: "armor.equip_leather", 
  click: "ui.button.click",
  pop: "random.pop",
  back: "ui.button.click",
  slider: "ui.button.click",

  // UI Sounds - Thematic
  uiEnchant: "block.enchanting_table.use", 
  uiDeath: "block.respawn_anchor.charge", 
  uiAdmin: "item.book.page_turn", 

  // Permission Sounds
};

// =====================================================
// RUNTIME CACHES (Maps)
// =====================================================
export const commandHistoryMap = new Map();
export const confirmationSettings = new Map();
export const deathLocationMap = new Map();
export const teleportConfirmationSettings = new Map();
export const permissionCache = new Map();
export const autoTotemSettings = new Map();
