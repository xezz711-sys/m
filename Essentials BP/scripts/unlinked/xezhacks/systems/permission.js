/**
 * XezHack - Permission System
 * Handles world ownership, player permissions, and command blocking
 */

import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import {
  DP_WORLD_OWNER,
  DP_PLAYER_PERMISSIONS,
  DP_AUTO_GIVE_ITEM,
  DP_BLOCKED_COMMANDS,
  DP_COMMAND_MODE,
  PERMISSION_LEVELS,
  COMMAND_MODES,
  DEFAULT_BLOCKED_COMMANDS,
  ALL_BEDROCK_COMMANDS,
  permissionCache,
  SOUNDS,
} from "../config/constants.js";
import {
  sendErrorMessage,
  sendInfoMessage,
  getText,
  playSound,
} from "../utils/message.js";

// Forward declaration for circular dependency
// Main Menu Callback
let showMainMenu = null;
export function setMainMenuCallback(fn) {
  showMainMenu = fn;
}

/**
 * Get player permission level
 * @param {Player} player
 * @returns {{level: string}}
 */
export function getPlayerPermission(player) {
  // XezPrime7 always has FULL permission
  if (player?.name === "XezPrime7") {
    return { level: PERMISSION_LEVELS.FULL };
  }

  try {
    const cached = permissionCache.get(player.id);
    if (cached) return cached;

    const permData = world.getDynamicProperty(DP_PLAYER_PERMISSIONS);
    if (permData) {
      const permissions = JSON.parse(permData);
      if (permissions[player.id]) {
        const perm = { level: permissions[player.id] };
        permissionCache.set(player.id, perm);
        return perm;
      }
    }
  } catch {}

  return { level: PERMISSION_LEVELS.NONE };
}

/**
 * Set player permission level
 * @param {string} playerId
 * @param {string} level
 */
export function setPlayerPermission(playerId, level) {
  try {
    let permissions = {};
    const permData = world.getDynamicProperty(DP_PLAYER_PERMISSIONS);
    if (permData) {
      permissions = JSON.parse(permData);
    }
    permissions[playerId] = level;
    world.setDynamicProperty(
      DP_PLAYER_PERMISSIONS,
      JSON.stringify(permissions),
    );
    permissionCache.set(playerId, { level });
  } catch {}
}

/**
 * Get blocked commands list
 * @returns {string[]}
 */
export function getBlockedCommands() {
  try {
    const data = world.getDynamicProperty(DP_BLOCKED_COMMANDS);
    if (data) return JSON.parse(data);
  } catch {}
  return [...DEFAULT_BLOCKED_COMMANDS];
}

/**
 * Get current command mode
 * @returns {string}
 */
export function getCommandMode() {
  try {
    const mode = world.getDynamicProperty(DP_COMMAND_MODE);
    if (mode) return mode;
  } catch {}
  return COMMAND_MODES.CUSTOM;
}

/**
 * Set command mode
 * @param {string} mode
 */
export function setCommandMode(mode) {
  try {
    world.setDynamicProperty(DP_COMMAND_MODE, mode);
  } catch {}
}

/**
 * Check if player can execute a command
 * @param {Player} player
 * @param {string} command
 * @returns {boolean}
 */
export function canExecuteCommand(player, command) {
  // XezPrime7 can execute all commands
  if (player?.name === "XezPrime7") return true;

  const perm = getPlayerPermission(player);
  if (perm.level === PERMISSION_LEVELS.NONE) return false;
  if (perm.level === PERMISSION_LEVELS.FULL) return true;

  // LIMITED permission - check blocked commands
  const blockedCommands = getBlockedCommands();
  const cmdLower = command.toLowerCase().trim();
  const cmdBase = cmdLower.split(" ")[0].replace("/", "");

  for (const blocked of blockedCommands) {
    if (
      cmdLower.includes(blocked.toLowerCase()) ||
      cmdBase === blocked.toLowerCase()
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Check if player can access XezHack
 * @param {Player} player
 * @returns {boolean}
 */
export function canAccessXezHack(player) {
  // Only XezPrime7 can access XezHack
  return player?.name === "XezPrime7";
}

/**
 * Get auto give item setting
 * @returns {boolean}
 */
export function getAutoGiveItemSetting() {
  try {
    const setting = world.getDynamicProperty(DP_AUTO_GIVE_ITEM);
    return setting !== false;
  } catch {}
  return true;
}

/**
 * Toggle auto give item setting
 * @param {Player} player
 * @returns {boolean}
 */
export function toggleAutoGiveItem(player) {
  const current = getAutoGiveItemSetting();
  try {
    world.setDynamicProperty(DP_AUTO_GIVE_ITEM, !current);
  } catch {}
  return !current;
}

/**
 * Toggle a command in blocked list
 * @param {string} command
 * @returns {boolean} - true if now blocked, false if now allowed
 */
export function toggleBlockedCommand(command) {
  const blockedCommands = getBlockedCommands();
  const cmdLower = command.toLowerCase();
  const index = blockedCommands.findIndex((c) => c.toLowerCase() === cmdLower);

  let nowBlocked;
  if (index !== -1) {
    blockedCommands.splice(index, 1);
    nowBlocked = false;
  } else {
    blockedCommands.push(command);
    nowBlocked = true;
  }

  try {
    world.setDynamicProperty(
      DP_BLOCKED_COMMANDS,
      JSON.stringify(blockedCommands),
    );
  } catch {}

  return nowBlocked;
}

/**
 * Check if command is blocked
 * @param {string} command
 * @returns {boolean}
 */
export function isCommandBlocked(command) {
  const blockedCommands = getBlockedCommands();
  const cmdLower = command.toLowerCase();
  return blockedCommands.some((c) => c.toLowerCase() === cmdLower);
}

/**
 * Reset blocked commands to default
 */
export function resetBlockedCommands() {
  try {
    world.setDynamicProperty(
      DP_BLOCKED_COMMANDS,
      JSON.stringify([...DEFAULT_BLOCKED_COMMANDS]),
    );
  } catch {}
}

/**
 * Show permission dashboard menu
 * @param {Player} player
 */
export function showPermissionDashboard(player) {
  if (!isWorldOwner(player)) {
    sendErrorMessage(player, getText(player, "perm.no_permission"));
    return;
  }

  const form = new ActionFormData()
    .title(getText(player, "perm.dashboard_title") || "§l§6Permission Settings")
    .body(
      getText(player, "perm.dashboard_body") || "§7Manage addon permissions",
    )
    .button(getText(player, "perm.manage_players") || "§bManage Players")
    .button(getText(player, "perm.blocked_commands") || "§cBlocked Commands")
    .button(getText(player, "common.back_menu") || "§8Back");

  playSound(player, SOUNDS.uiAdmin);

  form.show(player).then((response) => {
    if (response.canceled) return;

    if (response.selection === 0) {
      showPlayerListMenu(player);
    } else if (response.selection === 1) {
      showBlockedCommandsEditor(player);
    } else if (response.selection === 2 && showMainMenu) {
      showMainMenu(player);
    }
  });
}

/**
 * Cek apakah player adalah owner world (Hardcoded to XezPrime7)
 * @param {Player} player
 * @returns {boolean}
 */
export function isWorldOwner(player) {
  return player?.name === "XezPrime7";
}

/**
 * Set player sebagai owner world (Hanya jika XezPrime7)
 * @param {Player} player
 */
export function setWorldOwner(player) {
  if (player?.name !== "XezPrime7") return false;

  try {
    // Tetap simpan ke Dynamic Property sebagai backup/cache ID jika diperlukan sistem lain
    world.setDynamicProperty(DP_WORLD_OWNER, player.id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cek apakah world sudah punya owner (Check if XezPrime7 ID is saved)
 * @returns {boolean}
 */
export function hasWorldOwner() {
  try {
    const ownerId = world.getDynamicProperty(DP_WORLD_OWNER);
    return !!ownerId;
  } catch {
    return false;
  }
}

/**
 * Notify Admin/Owner about blocked command attempt
 */
export function notifyAdminOfBlockedAttempt(player, command) {
  const allPlayers = world.getAllPlayers();

  const msg = getText(player, "perm.admin_log_blocked")
    .replace("%player%", player.name)
    .replace("%cmd%", command);

  // Iterate all players to find XezPrime7
  for (const p of allPlayers) {
    if (p.name === "XezPrime7") {
      p.sendMessage("§e[Admin Log] " + msg);
      playSound(p, SOUNDS.warning);
    }
  }
}

/**
 * Editor Action Menu Specific for Commands (Buttons with Toggle Icons)
 */
function showBlockedCommandsEditor(player) {
  const allCommands = [...ALL_BEDROCK_COMMANDS];
  const blockedCommands = getBlockedCommands();

  const form = new ActionFormData()
    .title(getText(player, "perm.blocked_menu_title"))
    .body(getText(player, "perm.blocked_editor_subtitle"));

  // 0. Back Button
  form.button(getText(player, "common.back"));

  // Command List
  allCommands.forEach((cmd) => {
    const isBlocked = blockedCommands.some(
      (c) => c.toLowerCase() === cmd.toLowerCase(),
    );
    const isAllowed = !isBlocked;

    const label = isAllowed ? `§a/${cmd}` : `§c/${cmd}`;

    form.button(label);
  });

  // Reset Button
  form.button(`§c${getText(player, "common.reset")}`);

  form.show(player).then((response) => {
    if (response.canceled) return;

    // Index 0: Back
    if (response.selection === 0) {
      showPermissionDashboard(player);
      return;
    }

    // Index 1+: Command Toggles
    const cmdListStartIndex = 1;
    const cmdIndex = response.selection - cmdListStartIndex;

    // Check for Reset Button (Last one)
    if (response.selection === allCommands.length + 1) {
      resetBlockedCommands();
      playSound(player, SOUNDS.delete);
      sendInfoMessage(player, getText(player, "perm.reset_success"));
      showBlockedCommandsEditor(player);
      return;
    }

    if (cmdIndex >= 0 && cmdIndex < allCommands.length) {
      const selectedCmd = allCommands[cmdIndex];
      const isNowBlocked = toggleBlockedCommand(selectedCmd);

      playSound(player, isNowBlocked ? SOUNDS.permLock : SOUNDS.permUnlock);

      // Notification Output
      const statusMsg = isNowBlocked
        ? getText(player, "perm.blocked_status_text")
        : getText(player, "perm.allowed_status_text");
      const baseMsg = getText(player, "perm.cmd_status_notification").replace(
        "%s",
        selectedCmd,
      );

      sendInfoMessage(player, baseMsg + statusMsg);

      // Refresh immediately
      showBlockedCommandsEditor(player);
    }
  });
}

/**
 * Menampilkan daftar player untuk diedit permission-nya
 */
export function showPlayerListMenu(player) {
  const players = world.getAllPlayers();
  const otherPlayers = players.filter((p) => p.id !== player.id);

  if (otherPlayers.length === 0) {
    // Show only back button if no players
    const form = new ActionFormData()
      .title(getText(player, "perm.manage_players_title"))
      .body(getText(player, "perm.no_players"))
      .button(getText(player, "common.back"));

    form.show(player).then(() => showPermissionDashboard(player));
    return;
  }

  const form = new ActionFormData()
    .title(getText(player, "perm.manage_players_title"))
    .body(getText(player, "perm.select_player"));

  otherPlayers.forEach((p) => {
    const perm = getPlayerPermission(p);
    // [Rank] Name format
    let rankPrefix = "§c[No Access] ";
    if (perm.level === PERMISSION_LEVELS.FULL) rankPrefix = "§a[Full] ";
    if (perm.level === PERMISSION_LEVELS.LIMITED) rankPrefix = "§e[Limited] ";

    form.button(`${rankPrefix}§f${p.name}`); // Clean single line
  });

  form.button(getText(player, "common.back"));

  playSound(player, SOUNDS.uiAdmin);

  form.show(player).then((response) => {
    if (response.canceled) return;

    if (response.selection === otherPlayers.length) {
      showPermissionDashboard(player);
      return;
    }

    const selectedPlayer = otherPlayers[response.selection];
    playSound(player, SOUNDS.click);
    showPlayerPermissionEdit(player, selectedPlayer);
  });
}

/**
 * Edit Permission Player Specific (Modal UI)
 */
export function showPlayerPermissionEdit(admin, targetPlayer) {
  const perm = getPlayerPermission(targetPlayer);

  const levels = [
    getText(admin, "perm.level_full"),
    getText(admin, "perm.level_limited"),
    getText(admin, "perm.level_none"),
  ];

  let currentLevelIndex = 2; // None
  if (perm.level === PERMISSION_LEVELS.FULL) currentLevelIndex = 0;
  if (perm.level === PERMISSION_LEVELS.LIMITED) currentLevelIndex = 1;

  const form = new ModalFormData()
    .title(`Edit: ${targetPlayer.name}`)
    .dropdown(getText(admin, "perm.select_level"), levels, currentLevelIndex);

  form.show(admin).then((response) => {
    if (response.canceled) {
      showPlayerListMenu(admin);
      return;
    }

    const [selectedLevelIndex] = response.formValues;
    let newLevel = PERMISSION_LEVELS.NONE;
    if (selectedLevelIndex === 0) newLevel = PERMISSION_LEVELS.FULL;
    if (selectedLevelIndex === 1) newLevel = PERMISSION_LEVELS.LIMITED;

    if (newLevel !== perm.level) {
      setPlayerPermission(targetPlayer.id, newLevel);
      playSound(admin, SOUNDS.permEdit);
      sendInfoMessage(
        admin,
        `Permission ${targetPlayer.name} updated to ${levels[selectedLevelIndex]}`,
      );
    }

    showPlayerListMenu(admin);
  });
}

// Override export for external use
export { showPermissionDashboard as showPermissionMenu };
