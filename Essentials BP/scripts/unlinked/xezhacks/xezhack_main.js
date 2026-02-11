/**
 * XezHack - Main Entry Point
 * Imports all modules and registers event handlers
 */

import { world, ItemStack, system } from "@minecraft/server";

// Import config
import {
  SOUNDS,
  commandHistoryMap,
  confirmationSettings,
  deathLocationMap,
  teleportConfirmationSettings,
} from "./config/constants.js";

// Import utils
import {
  playSound,
  sendStyledMessage,
  sendSuccessMessage,
  sendErrorMessage,
  sendInfoMessage,
  getText,
} from "./utils/message.js";

// Import systems
import {
  isWorldOwner,
  setWorldOwner,
  hasWorldOwner,
  getPlayerPermission,
  setPlayerPermission,
  canExecuteCommand,
  canAccessXezHack,
  getAutoGiveItemSetting,
  toggleAutoGiveItem,
  setMainMenuCallback,
  showPermissionMenu,
  notifyAdminOfBlockedAttempt,
} from "./systems/permission.js";

import {
  ENCHANTMENT_LIST,
  isEnchantable,
  getAvailableEnchantments,
  formatItemName,
  applyEnchantment,
  applyAllEnchantments,
} from "./systems/enchant.js";

// Import Auto Totem & Achievement systems
import { showAutoTotemMenu, startAutoTotemLoop } from "./systems/autototem.js";

// Import UI forms
import {
  ModalFormData,
  MessageFormData,
  ActionFormData,
} from "@minecraft/server-ui";

import { PERMISSION_LEVELS } from "./config/constants.js";

// =====================================================
// CONFIRMATION SETTINGS
// =====================================================
function isConfirmationEnabled(player) {
  return confirmationSettings.get(player.id) !== false;
}

function toggleConfirmation(player) {
  const current = isConfirmationEnabled(player);
  confirmationSettings.set(player.id, !current);
  return !current;
}

function isTeleportConfirmEnabled(player) {
  return teleportConfirmationSettings.get(player.id) !== false;
}

function toggleTeleportConfirm(player) {
  const current = isTeleportConfirmEnabled(player);
  teleportConfirmationSettings.set(player.id, !current);
  return !current;
}

// =====================================================
// FORMAT HELPERS
// =====================================================
function formatDimension(dimId) {
  const dims = {
    "minecraft:overworld": "§aOverworld",
    "minecraft:nether": "§cNether",
    "minecraft:the_end": "§5The End",
  };
  return dims[dimId] || dimId;
}

function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

// =====================================================
// COMMAND HISTORY
// =====================================================
function saveCommandToHistory(player, command) {
  if (!commandHistoryMap.has(player.id)) {
    commandHistoryMap.set(player.id, []);
  }
  const history = commandHistoryMap.get(player.id);
  const existingIndex = history.indexOf(command);
  if (existingIndex !== -1) history.splice(existingIndex, 1);
  history.unshift(command);
  if (history.length > 10) history.pop();
}

// =====================================================
// MENUS
// =====================================================

// Main Menu
function showMainMenu(player) {
  if (!canAccessXezHack(player)) {
    sendErrorMessage(player, getText(player, "perm.no_permission"));
    return;
  }

  const isOwner = isWorldOwner(player);

  // Index 0-3: Core Features
  // Index 0-3: Core Features
  const form = new ActionFormData()
    .title(getText(player, "menu.title"))
    .body(getText(player, "menu.body"))
    .button(getText(player, "menu.run_command"))
    .button(getText(player, "menu.enchant"))
    .button(getText(player, "menu.death_tracker"))
    .button("§l§6Auto Totem");

  // Index 4: Teleport Player (Replaces Manage Players)
  form.button("§bTeleport Player");

  // Play open sound
  playSound(player, SOUNDS.menuOpen);

  form.show(player).then((response) => {
    if (response.canceled) return;

    // Core (0-3)
    if (response.selection === 0) {
      showCommandInputForm(player);
      return;
    }
    if (response.selection === 1) {
      showEnchantMenu(player);
      return;
    }
    if (response.selection === 2) {
      showDeathTracker(player);
      return;
    }
    if (response.selection === 3) { showAutoTotemMenu(player, showMainMenu); return; }
    
    // Teleport Player (Index 4)
    if (response.selection === 4) { showTeleportMenu(player); return; }
  });
}

// Command Input Form
function showCommandInputForm(player) {
  const history = commandHistoryMap.get(player.id) || [];
  const historyOptions = [getText(player, "history.select"), ...history];
  const confirmEnabled = isConfirmationEnabled(player);

  const form = new ModalFormData()
    .title(getText(player, "cmd.title"))
    .textField(
      getText(player, "cmd.input_label"),
      getText(player, "cmd.input_placeholder"),
      "",
    )
    .dropdown(getText(player, "history.label"), historyOptions, 0)
    .toggle(getText(player, "cmd.confirm_toggle"), confirmEnabled);

  playSound(player, SOUNDS.menuOpen);

  form.show(player).then((response) => {
    if (response.canceled) return;

    const [textInput, historyIndex, confirmToggle] = response.formValues;

    if (confirmToggle !== confirmEnabled) {
      playSound(player, SOUNDS.pop);
      toggleConfirmation(player);
    }

    let command = textInput?.trim();
    if (!command && historyIndex > 0) {
      command = history[historyIndex - 1];
    }

    if (!command) {
      sendErrorMessage(player, getText(player, "cmd.invalid"));
      return;
    }

    handleCommandExecution(player, command, confirmToggle);
  });
}

// Handle Command Execution
function handleCommandExecution(player, command, confirmEnabled) {
  if (!canExecuteCommand(player, command)) {
    playSound(player, SOUNDS.error);
    sendStyledMessage(player, "error", getText(player, "perm.denied_title"), [
      getText(player, "perm.denied_body"),
    ]);
    notifyAdminOfBlockedAttempt(player, command);
    return;
  }

  const lowerCommand = command.toLowerCase();
  const isSpectatorCommand =
    lowerCommand.includes("gamemode spectator") ||
    lowerCommand.includes("gamemode 6") ||
    (lowerCommand.includes("gamemode") && lowerCommand.includes("spectator"));

  if (isSpectatorCommand) {
    playSound(player, SOUNDS.spectatorWarn);
    showSpectatorWarning(player, command);
  } else if (!confirmEnabled) {
    runCommand(player, command);
  } else {
    confirmAndRun(player, command);
  }
}

// Spectator Warning
function showSpectatorWarning(player, command) {
  const form = new MessageFormData()
    .title(getText(player, "cmd.spectator_warning_title"))
    .body(getText(player, "cmd.spectator_warning_body"))
    .button1(getText(player, "cmd.spectator_confirm"))
    .button2(getText(player, "confirm.no"));

  // Warning sound is already played before calling this function

  form.show(player).then((response) => {
    if (response.selection === 0) {
      playSound(player, SOUNDS.spectatorWarn);
      showSpectatorWarning2(player, command);
    }
  });
}

// Spectator Final Warning
function showSpectatorWarning2(player, command) {
  const form = new MessageFormData()
    .title(getText(player, "cmd.spectator_warning_title_2"))
    .body(getText(player, "cmd.spectator_warning_body_2"))
    .button1(getText(player, "cmd.spectator_confirm_2"))
    .button2(getText(player, "confirm.no"));

  form.show(player).then((response) => {
    if (response.selection === 0) {
      runCommand(player, command);
    }
  });
}

// Run Command
function runCommand(player, command) {
  if (command.startsWith("/")) command = command.substring(1);

  player
    .runCommandAsync(command)
    .then(() => {
      // For informational commands, suppress the generic success message
      // so the user can see the actual command output (e.g., coordinates)
      const cmdLower = command.toLowerCase().trim();
      const isInfoCommand =
        cmdLower.startsWith("locate") ||
        cmdLower.startsWith("list") ||
        cmdLower.startsWith("help") ||
        cmdLower.startsWith("?");

      if (!isInfoCommand) {
        playSound(player, SOUNDS.success);
        sendStyledMessage(
          player,
          "success",
          getText(player, "success.berhasil"),
          [
            `§7${getText(player, "success.perintah_dijalankan")}`,
            `§8/§f${command}`,
          ],
        );
      } else {
        // Just play a sound for info commands
        playSound(player, SOUNDS.success);
      }
      saveCommandToHistory(player, command);
    })
    .catch((err) => {
      playSound(player, SOUNDS.error);
      const errorStr = String(err);
      let errorDetail = command.split(" ")[0];
      const unexpectedMatch = errorStr.match(/Unexpected "([^"]+)"/i);
      const unknownMatch = errorStr.match(/Unknown command: ([^,.]+)/i);
      if (unexpectedMatch) errorDetail = unexpectedMatch[1];
      else if (unknownMatch) errorDetail = unknownMatch[1].trim();

      player.sendMessage(
        `§c[X] ${getText(player, "error.kesalahan")}: §f${errorDetail}`,
      );
      player.sendMessage(`§8${getText(player, "error.perintah")}: /${command}`);
    });
}

// Confirm and Run
function confirmAndRun(player, command) {
  const form = new MessageFormData()
    .title(getText(player, "confirm.title"))
    .body(getText(player, "confirm.body") + command)
    .button1(getText(player, "confirm.yes"))
    .button2(getText(player, "confirm.no"));

  playSound(player, SOUNDS.pop);

  form.show(player).then((response) => {
    if (response.selection === 0) {
      runCommand(player, command);
    }
  });
}

// Local showPermissionMenu removed - using imported version from permission.js

// Register showMainMenu for navigation callback
setMainMenuCallback(showMainMenu);

// Enchant Menu
function showEnchantMenu(player) {
  const inventory = player.getComponent("inventory");
  if (!inventory?.container) {
    sendErrorMessage(player, getText(player, "enchant.inventory_not_found"));
    return;
  }

  const container = inventory.container;
  const enchantableItems = [];

  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && isEnchantable(item.typeId)) {
      enchantableItems.push({ slot: i, item: item });
    }
  }

  if (enchantableItems.length === 0) {
    const form = new ActionFormData()
      .title(getText(player, "enchant.title"))
      .body(
        getText(player, "enchant.no_items") +
          "\n\n" +
          getText(player, "enchant.item_info"),
      )
      .button(getText(player, "common.back_menu"));

    form.show(player).then((response) => {
      if (!response.canceled) showMainMenu(player);
    });
    return;
  }

  const form = new ActionFormData()
    .title(getText(player, "enchant.title"))
    .body(getText(player, "enchant.select_item") + enchantableItems.length);

  for (const { slot, item } of enchantableItems) {
    form.button(
      `${formatItemName(item.typeId)}\n${getText(player, "common.slot")}${slot}`,
    );
  }

  form.button(getText(player, "common.back_menu"));

  playSound(player, SOUNDS.uiEnchant);

  form.show(player).then((response) => {
    if (response.canceled) return;

    if (response.selection === enchantableItems.length) {
      showMainMenu(player);
      return;
    }

    const selected = enchantableItems[response.selection];
    playSound(player, SOUNDS.click);
    showEnchantmentList(player, selected.slot);
  });
}

// Enchantment List
function showEnchantmentList(player, slot) {
  const inventory = player.getComponent("inventory");
  const item = inventory?.container?.getItem(slot);

  if (!item) {
    sendErrorMessage(player, getText(player, "enchant.not_found"));
    return;
  }

  const availableEnchants = getAvailableEnchantments(item.typeId);

  if (availableEnchants.length === 0) {
    const form = new ActionFormData()
      .title(getText(player, "enchant.title"))
      .body(getText(player, "enchant.no_enchant_available"))
      .button(getText(player, "common.back"));

    form.show(player).then((response) => {
      if (!response.canceled) showEnchantMenu(player);
    });
    return;
  }

  const form = new ActionFormData()
    .title(`§l§d${formatItemName(item.typeId)}`)
    .body(getText(player, "enchant.select_enchant"));

  for (const ench of availableEnchants) {
    form.button(
      `${ench.name}${getText(player, "enchant.level")}${ench.maxLevel}`,
    );
  }

  form.button(getText(player, "enchant.all_max"));
  form.button(getText(player, "common.back"));

  form.show(player).then((response) => {
    if (response.canceled) return;

    if (response.selection === availableEnchants.length + 1) {
      showEnchantMenu(player);
      return;
    }

    if (response.selection === availableEnchants.length) {
      applyAllEnchantments(player, slot);
      return;
    }

    const selectedEnchant = availableEnchants[response.selection];
    playSound(player, SOUNDS.click);
    showEnchantLevelSelector(player, slot, selectedEnchant);
  });
}

// Enchant Level Selector
function showEnchantLevelSelector(player, slot, enchant) {
  const form = new ModalFormData()
    .title(`§l§d${enchant.name}`)
    .slider(
      getText(player, "enchant.select_level") + enchant.name,
      1,
      enchant.maxLevel,
      1,
      enchant.maxLevel,
    );

  form.show(player).then((response) => {
    if (response.canceled) {
      const inventory = player.getComponent("inventory");
      const item = inventory?.container?.getItem(slot);
      if (item) showEnchantmentList(player, slot);
      return;
    }

    const level = response.formValues[0];
    playSound(player, SOUNDS.slider);
    applyEnchantment(player, slot, enchant.id, level);
  });
}

// Death Tracker
// Death Tracker
function showDeathTracker(player) {
  const deathList = deathLocationMap.get(player.id) || [];

  const form = new ActionFormData()
    .title(getText(player, "death.title"))
    .body(
      deathList.length > 0
        ? getText(player, "death.select_death")
        : getText(player, "death.no_data"),
    );

  // Tampilkan list kematian sebagai tombol (terbaru di atas)
  for (let i = 0; i < deathList.length; i++) {
    const death = deathList[i];
    const coords = `${Math.floor(death.x)}, ${Math.floor(death.y)}, ${Math.floor(death.z)}`;
    const dimName = formatDimension(death.dimension);
    form.button(`§c#${i + 1} §f${coords}\n§8${dimName} - ${death.time}`);
  }

  // Tombol hapus semua (jika ada data)
  if (deathList.length > 0) {
    form.button(getText(player, "death.delete_all"));
  }

  form.button(getText(player, "common.back_menu"));

  playSound(player, SOUNDS.uiDeath);

  form.show(player).then((response) => {
    if (response.canceled) return;

    const backButtonIndex = deathList.length > 0 ? deathList.length + 1 : 0;
    const deleteAllIndex = deathList.length;

    // Kembali
    if (response.selection === backButtonIndex) {
      showMainMenu(player);
      return;
    }

    // Hapus semua (dengan konfirmasi)
    if (deathList.length > 0 && response.selection === deleteAllIndex) {
      confirmDeleteAllDeaths(player);
      return;
    }

    // Pilih lokasi kematian
    if (response.selection < deathList.length) {
      playSound(player, SOUNDS.click);
      showDeathDetail(player, response.selection);
    }
  });
}

// Death Detail
function showDeathDetail(player, index) {
  const deathList = deathLocationMap.get(player.id) || [];
  const death = deathList[index];

  if (!death) {
    showDeathTracker(player);
    return;
  }

  const coords = `${Math.floor(death.x)}, ${Math.floor(death.y)}, ${Math.floor(death.z)}`;

  const form = new ActionFormData()
    .title(`§l§c#${index + 1} Death`)
    .body(
      `§fKoordinat: §b${coords}\n§fDimensi: ${formatDimension(death.dimension)}\n§fWaktu: §7${death.time}`,
    )
    .button(getText(player, "death.teleport"))
    .button(getText(player, "death.copy"))
    .button(getText(player, "death.delete"))
    .button(getText(player, "common.back"));

  form.show(player).then((response) => {
    if (response.canceled) return;

    switch (response.selection) {
      case 0:
        if (isTeleportConfirmEnabled(player)) {
          teleportToDeathLocation(player, death);
        } else {
          executeTeleport(player, death);
        }
        break;
      case 1:
        playSound(player, SOUNDS.copy);
        const coordsStr = `${Math.floor(death.x)} ${Math.floor(death.y)} ${Math.floor(death.z)}`;
        sendStyledMessage(
          player,
          "info",
          getText(player, "death.coords_title"),
          [
            `§fX: §b${Math.floor(death.x)}`,
            `§fY: §b${Math.floor(death.y)}`,
            `§fZ: §b${Math.floor(death.z)}`,
            "",
            `§7/tp @s ${coordsStr}`,
          ],
        );
        break;
      case 2:
        playSound(player, SOUNDS.deleteSingle);
        deathList.splice(index, 1);
        if (deathList.length === 0) {
          deathLocationMap.delete(player.id);
        } else {
          deathLocationMap.set(player.id, deathList);
        }
        player.sendMessage(
          `§a[+] §r§a${getText(player, "death.single_deleted")}`,
        );
        showDeathTracker(player);
        break;
      case 3:
        showDeathTracker(player);
        break;
    }
  });
}

// =====================================================
// TELEPORT PLAYER SYSTEM
// =====================================================

function showTeleportMenu(player) {
  const players = world.getAllPlayers();
  const otherPlayers = players.filter(p => p.id !== player.id);

  if (otherPlayers.length === 0) {
    const form = new ActionFormData()
      .title("§lTeleport Player")
      .body("§cNo other players found.")
      .button(getText(player, "common.back_menu"));
      
    form.show(player).then(() => showMainMenu(player));
    return;
  }

  const form = new ActionFormData()
      .title("§lTeleport Player")
      .body("§7Select a player to teleport to:");

  otherPlayers.forEach(p => {
    form.button(`§f${p.name}\n§7Click to teleport`);
  });
  
  form.button(getText(player, "common.back_menu"));

  playSound(player, SOUNDS.menuOpen);

  form.show(player).then((response) => {
    if (response.canceled) return;
    
    if (response.selection === otherPlayers.length) {
      showMainMenu(player);
      return;
    }

    const targetPlayer = otherPlayers[response.selection];
    teleportToPlayer(player, targetPlayer);
  });
}

function teleportToPlayer(player, target) {
  if (!target || !target.isValid()) {
    sendErrorMessage(player, "§cTarget player is no longer available.");
    return;
  }

  // Use runCommand to teleport for cleaner execution
  player.runCommandAsync(`tp @s "${target.name}"`).then(() => {
     playSound(player, SOUNDS.teleport);
     sendSuccessMessage(player, `§aTeleported to §f${target.name}`);
  }).catch(e => {
     sendErrorMessage(player, "§cTeleport failed.");
  });
}

// Confirm Delete All Deaths
function confirmDeleteAllDeaths(player) {
  const bodyText =
    getText(player, "death.delete_all_confirm") +
    "\n\n" +
    getText(player, "death.delete_all_warning");

  const form = new MessageFormData()
    .title(getText(player, "death.delete_all"))
    .body(bodyText)
    .button1(getText(player, "confirm.yes"))
    .button2(getText(player, "confirm.no"));

  playSound(player, SOUNDS.pop);

  form.show(player).then((response) => {
    if (response.selection === 0) {
      playSound(player, SOUNDS.delete);
      deathLocationMap.delete(player.id);
      player.sendMessage(
        `§a[+] §r§a${getText(player, "death.all_deleted").replace(/§[a-z0-9\[\]]/gi, "")}`,
      );
    } else {
      showDeathTracker(player);
    }
  });
}

// Teleport to Death Location (with confirm)
function teleportToDeathLocation(player, location) {
  const form = new MessageFormData()
    .title(getText(player, "death.teleport"))
    .body(
      getText(player, "death.teleport_confirm") +
        "\n\n" +
        getText(player, "death.teleport_warning"),
    )
    .button1(getText(player, "confirm.yes"))
    .button2(getText(player, "confirm.no"));

  playSound(player, SOUNDS.pop);

  form.show(player).then((response) => {
    if (response.selection === 0) {
      executeTeleport(player, location);
    }
  });
}

// Execute Teleport
function executeTeleport(player, location) {
  const command = `tp @s ${Math.floor(location.x)} ${Math.floor(location.y)} ${Math.floor(location.z)}`;
  player.dimension
    .runCommandAsync(`execute as "${player.name}" at @s run ${command}`)
    .then(() => {
      playSound(player, SOUNDS.teleport);
      sendStyledMessage(
        player,
        "teleport",
        getText(player, "death.teleport_success_title"),
        [
          `§7${getText(player, "death.teleport_success_body")}`,
          "",
          `§fX: §b${Math.floor(location.x)}`,
          `§fY: §b${Math.floor(location.y)}`,
          `§fZ: §b${Math.floor(location.z)}`,
        ],
      );
    })
    .catch((err) => {
      playSound(player, SOUNDS.error);
      sendStyledMessage(
        player,
        "error",
        getText(player, "death.teleport_fail_title"),
        [
          `§7${getText(player, "death.teleport_fail_body")}`,
          "",
          `§8Error: §7${err}`,
        ],
      );
    });
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================
function hasXezHackItem(player) {
  const inventory = player.getComponent("inventory");
  if (!inventory?.container) return false;

  const container = inventory.container;
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item?.typeId === "xezhack_rc:item") return true;
  }
  return false;
}

// =====================================================
// EVENT HANDLERS
// =====================================================

// Item Use Event
world.afterEvents.itemUse.subscribe((event) => {
  const { itemStack, source } = event;

  if (itemStack?.typeId === "xezhack_rc:item") {
    // Security check: Ensure player has permission
    if (!canAccessXezHack(source)) {
      playSound(source, SOUNDS.error);
      sendStyledMessage(source, "error", getText(source, "perm.denied_title"), [
        getText(source, "perm.denied_body"),
      ]);
      return;
    }
    playSound(source, "random.pop");
    showMainMenu(source);
  }
});

// Player Spawn Event
world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  const isInitialSpawn = event.initialSpawn;

  system.run(() => {
    if (!hasWorldOwner()) {
      setWorldOwner(player);
      if (canAccessXezHack(player)) player.sendMessage(getText(player, "perm.owner_set"));
    }

    // Auto-disable commandBlockOutput to prevent spam
    player.runCommandAsync("gamerule commandblockoutput false").catch(() => {});

    // ITEM SPAWN LOGIC:
    // Only give item if auto-give is enabled AND player has permission.
    
    const giveItemDelay = isInitialSpawn ? 40 : 20;
    
    system.runTimeout(() => {
      try {
        if (!player || !player.isValid()) return;
        
        // If player is authorized and doesn't have the item, give it.
        if (canAccessXezHack(player)) {
             giveXezHackItemWithRetry(player, 3);
        }
      } catch (err) {
        console.warn("[XezHack] Error in playerSpawn item logic:", err);
      }
    }, giveItemDelay);
  });
});

/**
 * Memberikan XezHack item dengan retry mechanism
 * @param {Player} player 
 * @param {number} retriesLeft 
 */
function giveXezHackItemWithRetry(player, retriesLeft) {
  try {
    if (!player || !player.isValid()) return;
    
    // Cek apakah sudah punya item
    if (hasXezHackItem(player)) {
      return; // Sudah punya, tidak perlu kasih lagi
    }
    
    const inventory = player.getComponent("inventory");
    if (inventory?.container) {
      const commandItem = new ItemStack("xezhack_rc:item", 1);
      inventory.container.addItem(commandItem);
      player.sendMessage(getText(player, "item.received"));
    } else if (retriesLeft > 0) {
      // Inventory belum ready, retry setelah delay
      system.runTimeout(() => {
        giveXezHackItemWithRetry(player, retriesLeft - 1);
      }, 20); // Retry setelah 1 detik
    }
  } catch (err) {
    if (retriesLeft > 0) {
      system.runTimeout(() => {
        giveXezHackItemWithRetry(player, retriesLeft - 1);
      }, 20);
    } else {
      console.warn("[XezHack] Failed to give item after all retries:", err);
    }
  }
}

// Entity Die Event (Death Tracker)
world.afterEvents.entityDie.subscribe((event) => {
  const entity = event.deadEntity;

  if (entity.typeId === "minecraft:player") {
    const player = entity;
    const location = player.location;
    const dimension = player.dimension.id;

    const deathList = deathLocationMap.get(player.id) || [];

    deathList.unshift({
      x: location.x,
      y: location.y,
      z: location.z,
      dimension: dimension,
      time: formatTime(new Date()),
    });

    if (deathList.length > 10) deathList.pop();

    deathLocationMap.set(player.id, deathList);

    system.runTimeout(() => {
      try {
        sendStyledMessage(
          player,
          "death",
          getText(player, "death.recorded_title"),
          [
            `§7${getText(player, "death.recorded_body")}`,
            "",
            `§fX: §b${Math.floor(location.x)}`,
            `§fY: §b${Math.floor(location.y)}`,
            `§fZ: §b${Math.floor(location.z)}`,
            "",
            `§8${formatDimension(dimension)}`,
          ],
        );
      } catch {}
    }, 60);
  }
});

// =====================================================
// SECURITY & PERSISTENCE LOOP
// =====================================================

// Removed aggressive anti-drop and inventory enforcement to allow standard gameplay.
// Now relies on 'canAccessXezHack' check when item is used.

// Start Auto Totem tick loop
startAutoTotemLoop();

console.log("[XezHack] Addon loaded successfully!");
