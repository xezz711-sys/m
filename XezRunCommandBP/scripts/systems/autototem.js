/**
 * XezHack - Auto Totem System
 * Automatically equips Totem of Undying to offhand slot
 * Two modes: Unlimited (spawns totem) and Limited (from inventory only)
 */

import { world, system, EquipmentSlot, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { SOUNDS, autoTotemSettings } from "../config/constants.js";
import { playSound, sendSuccessMessage, getText } from "../utils/message.js";

// Mode: "off" | "unlimited" | "limited"
// autoTotemSettings stores: { mode: "off"|"unlimited"|"limited" }

// =====================================================
// AUTO TOTEM FUNCTIONS
// =====================================================

export function getAutoTotemMode(player) {
  if (!player || !player.id) return "off";
  const setting = autoTotemSettings.get(player.id);
  if (!setting) return "off";
  return setting.mode || "off";
}

export function setAutoTotemMode(player, mode) {
  if (!player || !player.id) return;
  autoTotemSettings.set(player.id, { mode: mode });
}

export function autoEquipTotemUnlimited(player) {
  try {
    if (!player || !player.isValid()) return;
    
    const equippable = player.getComponent("minecraft:equippable");
    if (!equippable) return;
    
    // Cek apakah sudah ada totem di offhand
    const offhand = equippable.getEquipment(EquipmentSlot.Offhand);
    if (offhand && offhand.typeId === "minecraft:totem_of_undying") return;
    
    // Unlimited mode: spawn totem langsung ke offhand
    const totem = new ItemStack("minecraft:totem_of_undying", 1);
    equippable.setEquipment(EquipmentSlot.Offhand, totem);
    
  } catch (e) {
    // Silent fail
  }
}

export function autoEquipTotemLimited(player) {
  try {
    if (!player || !player.isValid()) return;
    
    const equippable = player.getComponent("minecraft:equippable");
    if (!equippable) return;
    
    // Cek apakah sudah ada totem di offhand
    const offhand = equippable.getEquipment(EquipmentSlot.Offhand);
    if (offhand && offhand.typeId === "minecraft:totem_of_undying") return;
    
    // Limited mode: cari totem di inventory
    const inventory = player.getComponent("minecraft:inventory");
    if (!inventory || !inventory.container) return;
    
    for (let i = 0; i < inventory.container.size; i++) {
      const item = inventory.container.getItem(i);
      if (item && item.typeId === "minecraft:totem_of_undying") {
        // Pindahkan ke offhand
        equippable.setEquipment(EquipmentSlot.Offhand, item);
        // Hapus dari inventory atau swap
        if (offhand) {
          inventory.container.setItem(i, offhand);
        } else {
          inventory.container.setItem(i, undefined);
        }
        playSound(player, SOUNDS.totemEquip);
        break;
      }
    }
  } catch (e) {
    // Silent fail
  }
}

// =====================================================
// AUTO TOTEM MENU
// =====================================================

export function showAutoTotemMenu(player, showMainMenuCallback) {
  const mode = getAutoTotemMode(player);
  
  let statusText = "§c§lOFF";
  if (mode === "unlimited") statusText = "§a§lUNLIMITED";
  else if (mode === "limited") statusText = "§e§lLIMITED";
  
  const form = new ActionFormData()
    .title(getText(player, "totem.title"))
    .body(getText(player, "totem.body") + "\n\n" + getText(player, "totem.current") + statusText)
    .button(getText(player, "totem.mode_unlimited"))
    .button(getText(player, "totem.mode_limited"))
    .button(getText(player, "totem.mode_off"))
    .button(getText(player, "common.back_menu"));
  
  playSound(player, SOUNDS.menuOpen);

  form.show(player).then((response) => {
    if (response.canceled) return;
    
    switch (response.selection) {
      case 0: // Unlimited
        setAutoTotemMode(player, "unlimited");
        playSound(player, SOUNDS.pop);
        sendSuccessMessage(player, getText(player, "totem.unlimited_on"));
        // Langsung equip totem
        autoEquipTotemUnlimited(player);
        showAutoTotemMenu(player, showMainMenuCallback);
        break;
      case 1: // Limited
        setAutoTotemMode(player, "limited");
        playSound(player, SOUNDS.pop);
        sendSuccessMessage(player, getText(player, "totem.limited_on"));
        // Coba equip dari inventory
        autoEquipTotemLimited(player);
        showAutoTotemMenu(player, showMainMenuCallback);
        break;
      case 2: // Off
        setAutoTotemMode(player, "off");
        playSound(player, SOUNDS.pop);
        sendSuccessMessage(player, getText(player, "totem.disabled"));
        showAutoTotemMenu(player, showMainMenuCallback);
        break;
      case 3: // Back
        showMainMenuCallback(player);
        break;
    }
  });
}

// =====================================================
// AUTO TOTEM TICK LOOP
// =====================================================

export function startAutoTotemLoop() {
  system.runInterval(() => {
    try {
      const players = world.getAllPlayers();
      for (const player of players) {
        if (!player || !player.isValid()) continue;
        
        const mode = getAutoTotemMode(player);
        if (mode === "unlimited") {
          autoEquipTotemUnlimited(player);
        } else if (mode === "limited") {
          autoEquipTotemLimited(player);
        }
      }
    } catch (e) {
      // Silent fail
    }
  }, 1); // Check setiap tick - instant response
}
