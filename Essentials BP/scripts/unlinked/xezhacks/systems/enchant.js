/**
 * XezHack - Enchantment System
 * Contains enchantment data and helper functions
 */

import { EnchantmentTypes, ItemComponentTypes } from "@minecraft/server";
import { SOUNDS } from "../config/constants.js";
import { playSound, sendStyledMessage, getText } from "../utils/message.js";

// =====================================================
// ENCHANTMENT DATA
// =====================================================
export const ENCHANTMENT_LIST = [
  // Senjata melee
  { id: "sharpness", name: "§6Sharpness", maxLevel: 5, items: ["sword", "axe", "mace", "spear"] },
  { id: "smite", name: "§6Smite", maxLevel: 5, items: ["sword", "axe", "mace", "spear"] },
  { id: "bane_of_arthropods", name: "§6Bane of Arthropods", maxLevel: 5, items: ["sword", "axe", "mace", "spear"] },
  { id: "knockback", name: "§6Knockback", maxLevel: 2, items: ["sword", "mace", "spear"] },
  { id: "fire_aspect", name: "§cFire Aspect", maxLevel: 2, items: ["sword", "mace", "spear"] },
  { id: "looting", name: "§aLooting", maxLevel: 3, items: ["sword", "mace", "spear"] },
  { id: "sweeping", name: "§bSweeping Edge", maxLevel: 3, items: ["sword"] },
  // Mace exclusive (1.21+)
  { id: "density", name: "§5Density", maxLevel: 5, items: ["mace"] },
  { id: "breach", name: "§cBreach", maxLevel: 4, items: ["mace"] },
  { id: "wind_burst", name: "§bWind Burst", maxLevel: 3, items: ["mace"] },
  // Tools
  { id: "efficiency", name: "§bEfficiency", maxLevel: 5, items: ["pickaxe", "shovel", "axe", "hoe", "shears", "brush", "tool"] },
  { id: "silk_touch", name: "§dSilk Touch", maxLevel: 1, items: ["pickaxe", "shovel", "axe", "hoe", "shears", "brush", "tool"] },
  { id: "fortune", name: "§aFortune", maxLevel: 3, items: ["pickaxe", "shovel", "axe", "hoe", "tool"] },
  // Universal
  { id: "unbreaking", name: "§7Unbreaking", maxLevel: 3, items: ["all"] },
  { id: "mending", name: "§aMending", maxLevel: 1, items: ["all"] },
  // Armor
  { id: "protection", name: "§9Protection", maxLevel: 4, items: ["helmet", "chestplate", "leggings", "boots", "head"] },
  { id: "fire_protection", name: "§cFire Protection", maxLevel: 4, items: ["helmet", "chestplate", "leggings", "boots", "head"] },
  { id: "blast_protection", name: "§8Blast Protection", maxLevel: 4, items: ["helmet", "chestplate", "leggings", "boots", "head"] },
  { id: "projectile_protection", name: "§fProjectile Protection", maxLevel: 4, items: ["helmet", "chestplate", "leggings", "boots", "head"] },
  { id: "thorns", name: "§cThorns", maxLevel: 3, items: ["helmet", "chestplate", "leggings", "boots", "head"] },
  { id: "respiration", name: "§bRespiration", maxLevel: 3, items: ["helmet", "head"] },
  { id: "aqua_affinity", name: "§3Aqua Affinity", maxLevel: 1, items: ["helmet", "head"] },
  { id: "depth_strider", name: "§3Depth Strider", maxLevel: 3, items: ["boots"] },
  { id: "frost_walker", name: "§bFrost Walker", maxLevel: 2, items: ["boots"] },
  { id: "feather_falling", name: "§fFeather Falling", maxLevel: 4, items: ["boots"] },
  { id: "soul_speed", name: "§5Soul Speed", maxLevel: 3, items: ["boots"] },
  { id: "swift_sneak", name: "§5Swift Sneak", maxLevel: 3, items: ["leggings"] },
  // Ranged
  { id: "power", name: "§cPower", maxLevel: 5, items: ["bow"] },
  { id: "punch", name: "§6Punch", maxLevel: 2, items: ["bow"] },
  { id: "flame", name: "§cFlame", maxLevel: 1, items: ["bow"] },
  { id: "infinity", name: "§dInfinity", maxLevel: 1, items: ["bow"] },
  // Trident
  { id: "loyalty", name: "§9Loyalty", maxLevel: 3, items: ["trident", "spear"] },
  { id: "impaling", name: "§3Impaling", maxLevel: 5, items: ["trident", "spear"] },
  { id: "riptide", name: "§bRiptide", maxLevel: 3, items: ["trident"] },
  { id: "channeling", name: "§eChanneling", maxLevel: 1, items: ["trident"] },
  // Crossbow
  { id: "multishot", name: "§6Multishot", maxLevel: 1, items: ["crossbow"] },
  { id: "quick_charge", name: "§bQuick Charge", maxLevel: 3, items: ["crossbow"] },
  { id: "piercing", name: "§7Piercing", maxLevel: 4, items: ["crossbow"] },
  // Fishing Rod
  { id: "lure", name: "§bLure", maxLevel: 3, items: ["fishing_rod"] },
  { id: "luck_of_the_sea", name: "§aLuck of the Sea", maxLevel: 3, items: ["fishing_rod"] },
  // Curses
  { id: "vanishing_curse", name: "§4Curse of Vanishing", maxLevel: 1, items: ["all"] },
  { id: "binding_curse", name: "§4Curse of Binding", maxLevel: 1, items: ["helmet", "chestplate", "leggings", "boots", "elytra", "head"] },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Mendapatkan tipe item dari typeId
 */
export function getItemType(typeId) {
  const id = typeId.toLowerCase();
  if (id.includes("sword")) return "sword";
  if (id.includes("mace")) return "mace";
  if (id.includes("pickaxe")) return "pickaxe";
  if (id.includes("axe")) return "axe";
  if (id.includes("shovel") || id.includes("spade")) return "shovel";
  if (id.includes("hoe")) return "hoe";
  if (id.includes("helmet") || id.includes("cap") || id.includes("turtle_shell")) return "helmet";
  if (id.includes("chestplate") || id.includes("tunic")) return "chestplate";
  if (id.includes("leggings") || id.includes("pants")) return "leggings";
  if (id.includes("boots")) return "boots";
  if (id.includes("bow") && !id.includes("crossbow")) return "bow";
  if (id.includes("crossbow")) return "crossbow";
  if (id.includes("trident")) return "trident";
  if (id.includes("spear")) return "spear";
  if (id.includes("fishing_rod")) return "fishing_rod";
  if (id.includes("shears")) return "shears";
  if (id.includes("elytra")) return "elytra";
  if (id.includes("shield")) return "shield";
  if (id.includes("brush")) return "brush";
  if (id.includes("flint_and_steel")) return "tool";
  if (id.includes("carrot_on_a_stick") || id.includes("warped_fungus_on_a_stick")) return "tool";
  if (id.includes("pumpkin") && id.includes("carved")) return "head";
  if (id.includes("skull") || id.includes("head")) return "head";
  if (id.includes("diamond_") || id.includes("netherite_") || id.includes("iron_") || 
      id.includes("golden_") || id.includes("gold_") || id.includes("wooden_") || 
      id.includes("stone_") || id.includes("leather_") || id.includes("chainmail_")) {
    return "tool";
  }
  return null;
}

/**
 * Cek apakah item bisa di-enchant
 */
export function isEnchantable(typeId) {
  return getItemType(typeId) !== null;
}

/**
 * Mendapatkan daftar enchantment yang cocok untuk item
 */
export function getAvailableEnchantments(typeId) {
  const itemType = getItemType(typeId);
  if (!itemType) return [];
  return ENCHANTMENT_LIST.filter((ench) => {
    return ench.items.includes("all") || ench.items.includes(itemType);
  });
}

/**
 * Format nama item untuk tampilan
 */
export function formatItemName(typeId) {
  let name = typeId.split(":").pop();
  name = name.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return name;
}

/**
 * Apply single enchantment ke item
 */
export function applyEnchantment(player, slot, enchantId, level) {
  const inventory = player.getComponent("inventory");
  const container = inventory?.container;
  const item = container?.getItem(slot);

  if (!item) {
    if (player.name === "XezPrime7") player.sendMessage(getText(player, "enchant.not_found"));
    return;
  }

  try {
    const enchantComp = item.getComponent(ItemComponentTypes.Enchantable);
    if (!enchantComp) {
      if (player.name === "XezPrime7") player.sendMessage(getText(player, "enchant.cant_enchant"));
      return;
    }

    const enchantType = EnchantmentTypes.get(enchantId);
    if (!enchantType) {
      if (player.name === "XezPrime7") player.sendMessage(getText(player, "enchant.failed") + enchantId);
      return;
    }

    enchantComp.addEnchantment({ type: enchantType, level: level });
    container.setItem(slot, item);

    playSound(player, SOUNDS.enchant);
    const enchantInfo = ENCHANTMENT_LIST.find((e) => e.id === enchantId);
    const enchantName = enchantInfo ? enchantInfo.name : enchantId;
    sendStyledMessage(player, "enchant", getText(player, "enchant.success_title"), [
      `§7${getText(player, "enchant.item_label")}: §f${formatItemName(item.typeId)}`,
      "",
      `§d✨ ${enchantName} §7Level §f${level}`
    ]);
  } catch (error) {
    playSound(player, SOUNDS.error);
    sendStyledMessage(player, "error", getText(player, "enchant.fail_title"), [
      `§7${getText(player, "enchant.cannot_apply")}`,
      "",
      `§8Error: §7${error}`
    ]);
  }
}

/**
 * Apply all enchantments ke item dengan level maksimal
 */
export function applyAllEnchantments(player, slot) {
  const inventory = player.getComponent("inventory");
  const container = inventory?.container;
  const item = container?.getItem(slot);

  if (!item) {
    if (player.name === "XezPrime7") player.sendMessage(getText(player, "enchant.not_found"));
    return;
  }

  const enchantComp = item.getComponent(ItemComponentTypes.Enchantable);
  if (!enchantComp) {
    if (player.name === "XezPrime7") player.sendMessage(getText(player, "enchant.cant_enchant"));
    return;
  }

  const availableEnchants = getAvailableEnchantments(item.typeId);
  let successCount = 0;
  let failCount = 0;

  for (const ench of availableEnchants) {
    try {
      const enchantType = EnchantmentTypes.get(ench.id);
      if (enchantType) {
        enchantComp.addEnchantment({ type: enchantType, level: ench.maxLevel });
        successCount++;
      }
    } catch {
      failCount++;
    }
  }

  container.setItem(slot, item);

  if (successCount > 0) {
    playSound(player, SOUNDS.enchantAll);
    sendStyledMessage(player, "enchant", getText(player, "enchant.all_success_title"), [
      `§7${getText(player, "enchant.item_label")}: §f${formatItemName(item.typeId)}`,
      "",
      `§d✨ §f${successCount} §7${getText(player, "enchant.applied")}`,
      failCount > 0 ? `§8(${failCount} ${getText(player, "enchant.incompatible_note")})` : ""
    ].filter(line => line !== ""));
  } else {
    playSound(player, SOUNDS.error);
    sendStyledMessage(player, "error", getText(player, "enchant.fail_title"), [
      `§7${getText(player, "enchant.none_available")}`
    ]);
  }
}
