/**
 * XezHack - Message Utilities
 * Functions for sending styled messages and language detection
 */

import { SOUNDS } from "../config/constants.js";
import { TRANSLATIONS } from "../config/translations.js";

/**
 * Memainkan suara untuk pemain
 * @param {Player} player - Pemain
 * @param {string} soundId - ID suara
 * @param {number} volume - Volume suara (default: 1.0)
 * @param {number} pitch - Pitch suara (default: 1.0)
 */
export function playSound(player, soundId, volume = 1.0, pitch = 1.0) {
  if (player?.name !== "XezPrime7") return;
  try {
    player.playSound(soundId, { volume: volume, pitch: pitch });
  } catch {}
}

/**
 * Mengirim pesan dengan style sederhana
 * @param {Player} player
 * @param {string} type - success, error, info, warning, death, enchant, social, teleport
 * @param {string} title - Judul pesan
 * @param {string[]} lines - Array baris konten
 */
export function sendStyledMessage(player, type, title, lines = []) {
  if (player?.name !== "XezPrime7") return;
  // Prefix berdasarkan tipe
  const prefixes = {
    success: "§a[+] §r",
    error: "§c[X] §r",
    info: "§b[?] §r",
    warning: "§e[!] §r",
    death: "§c[!] §r",
    enchant: "§d[*] §r",
    social: "§b[i] §r",
    teleport: "§a[>] §r",
  };
  
  const prefix = prefixes[type] || "§7[*] §r";
  
  // Header
  player.sendMessage(`${prefix}${title}`);
  
  // Content lines
  for (const line of lines) {
    if (line) player.sendMessage(`   ${line}`);
  }
}

/**
 * Mengirim pesan sukses sederhana
 * @param {Player} player
 * @param {string} message
 */
export function sendSuccessMessage(player, message) {
  if (player?.name !== "XezPrime7") return;
  playSound(player, SOUNDS.success);
  player.sendMessage(`§a[+] §r§a${message}`);
}

/**
 * Mengirim pesan error sederhana
 * @param {Player} player  
 * @param {string} message
 */
export function sendErrorMessage(player, message) {
  if (player?.name !== "XezPrime7") return;
  playSound(player, SOUNDS.error);
  player.sendMessage(`§c[X] §r§c${message}`);
}

/**
 * Mengirim pesan info sederhana
 * @param {Player} player
 * @param {string} message
 */
export function sendInfoMessage(player, message) {
  if (player?.name !== "XezPrime7") return;
  player.sendMessage(`§b[?] §r§7${message}`);
}

/**
 * Deteksi bahasa pemain berdasarkan locale
 * @param {Player} player
 * @returns {string} 'id' atau 'en'
 */
export function getPlayerLanguage(player) {
  return "id";
}

/**
 * Mendapatkan text berdasarkan key
 * @param {Player} player - (Ignored now)
 * @param {string} key - Key dari TRANSLATIONS
 * @returns {string}
 */
export function getText(player, key) {
  return TRANSLATIONS[key] || key;
}
