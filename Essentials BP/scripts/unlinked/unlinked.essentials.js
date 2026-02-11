import {
  world,
  system,
  EquipmentSlot,
  ItemStack,
  StructureSaveMode,
  ItemTypes,
} from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { EventUtils, Vec3 } from "./compiled";

let location;
let players;
let player;
let waypoint;
let tempPlayers;
let brokenItemStack;
let brokenWeapon;

world.beforeEvents.playerInteractWithEntity.subscribe(async (item) => {
  if (item.itemStack && item.itemStack.typeId.includes("ulkd_ess:empty_capture_cube")) {
    if (world.getDynamicProperty("ess:capture") != false) {
      let excludeTypes = [
      ];
      let targetMob;
      if (world.getDynamicProperty("ess:capture_boss") != false) {
        excludeTypes = [
          "item",
          "player",
          "ulkd_ess:waypoint",
          "boat",
          "chest_boat",
          "minecart",
          "chest_minecart",
          "command_block_minecart",
          "hopper_minecart",
          "tnt_minecart",
        ];
      } else {
        excludeTypes = [
          "item",
          "player",
          "ulkd_ess:waypoint",
          "boat",
          "chest_boat",
          "minecart",
          "chest_minecart",
          "command_block_minecart",
          "hopper_minecart",
          "tnt_minecart",
          "minecraft:ender_dragon",
          "minecraft:warden",
          "minecraft:wither",
        ];
      }
      targetMob = item.target;
      if (excludeTypes.includes(targetMob.typeId)) {
        return;
      }
      if (targetMob.isValid()) {
        item.cancel = true;
        await null;
        let captureID = Math.round(Math.random() * 99999);
        let captureCube = new ItemStack("ulkd_ess:capture_cube", 1);
        let adjustedIdentifier = targetMob.typeId.substring(
          targetMob.typeId.indexOf(":") + 1
        );
        adjustedIdentifier =
          adjustedIdentifier.charAt(0).toUpperCase() +
          adjustedIdentifier.slice(1);
        captureCube.setLore([
          `§r§b${adjustedIdentifier}`,
          `§r§bCapture Cube ID: ${captureID}`,
        ]);

        let captureLocationX = targetMob.location.x;
        let captureLocationY = targetMob.location.y;
        let captureLocationZ = targetMob.location.z;
        const min = targetMob.dimension.heightRange.min;
        targetMob.teleport({x: captureLocationX, y: min + 1, z: captureLocationZ});

        world.structureManager.createFromWorld(
          `unlinked_essentials:${captureID}`,
          item.player.dimension,
          {
            x: captureLocationX,
            y: min + 1,
            z: captureLocationZ,
          },
          {
            x: captureLocationX,
            y: min + 1,
            z: captureLocationZ,
          },
          {
            includeEntities: true,
            includeBlocks: false,
            saveMode: StructureSaveMode.World,
          }
        );
        targetMob.remove();
        item.player.runCommandAsync(
          `particle ulkd_ess:essentials22 ${captureLocationX} ${captureLocationY} ${captureLocationZ}`
        );
        item.player.runCommandAsync(
          `playsound unlinked.essentials.capture @s ${captureLocationX} ${captureLocationY} ${captureLocationZ}`
        );
        item.player.runCommandAsync(
          `clear @s ulkd_ess:empty_capture_cube 0 1`
        );
        item.player.dimension.spawnItem(captureCube, {
          x: captureLocationX,
          y: captureLocationY,
          z: captureLocationZ,
        });
      }
    } else {
      item.source.sendMessage(
        "§cCapture Cubes are disabled in the Admin Remote (creative only item)"
      );
    }
  }
});

world.afterEvents.itemUse.subscribe((item) => {
  if (
    world.getDynamicProperty("ess:detectors") != false &&
    item.itemStack.typeId.includes("ulkd_ess:detector")
  ) {
    let particleLength = 0;
    if (item.itemStack.typeId.includes("ulkd_ess:detector1")) {
      if (
        item.itemStack.getComponent("durability").maxDurability >
        item.itemStack.getComponent("durability").damage + 1
      ) {
        let brokenScanner = item.itemStack;
        brokenScanner.getComponent("durability").damage =
          brokenScanner.getComponent("durability").damage + 1;

        item.source
          .getComponent("equippable")
          .setEquipment("Mainhand", brokenScanner);

        let scan_x = item.source.getViewDirection().x * 30;
        let scan_y = item.source.getViewDirection().y * 30;
        let scan_z = item.source.getViewDirection().z * 30;
        for (let q = 0; q < 30; q += 0.2) {
          let targetBlock = item.source.dimension.getBlock({
            x: item.source.location.x + item.source.getViewDirection().x * q,
            y:
              item.source.location.y +
              1.5 +
              item.source.getViewDirection().y * q,
            z: item.source.location.z + item.source.getViewDirection().z * q,
          });
          if (targetBlock != null) {
            if (
              targetBlock.typeId.includes("coal_ore") ||
              targetBlock.typeId.includes("copper_ore") ||
              targetBlock.typeId.includes("redstone_ore")
            ) {
              let detectedCount = 0;
              let detectedPos = {
                x:
                  item.source.location.x + item.source.getViewDirection().x * q,
                y:
                  item.source.location.y +
                  1.5 +
                  item.source.getViewDirection().y * q,
                z:
                  item.source.location.z + item.source.getViewDirection().z * q,
              };
              for (let h = -5; h < 5; h++) {
                for (let t = -5; t < 5; t++) {
                  for (let r = -5; r < 5; r++) {
                    let extraOres = item.source.dimension.getBlock({
                      x: detectedPos.x + t,
                      y: detectedPos.y + h,
                      z: detectedPos.z + r,
                    });
                    if (extraOres.typeId == targetBlock.typeId) {
                      detectedCount++;
                    }
                  }
                }
              }
              if (targetBlock.typeId == "minecraft:coal_ore") {
                item.source.sendMessage(
                  `§aDetected Coal Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:deepslate_coal_ore") {
                item.source.sendMessage(
                  `§aDetected Coal Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:copper_ore") {
                item.source.sendMessage(
                  `§aDetected Copper Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:deepslate_copper_ore") {
                item.source.sendMessage(
                  `§aDetected Copper Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:redstone_ore") {
                item.source.sendMessage(
                  `§aDetected Redstone Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:deepslate_redstone_ore") {
                item.source.sendMessage(
                  `§aDetected Redstone Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              break;
            }
          }
          if (particleLength < 30) {
            particleLength++;
            item.source.runCommand(
              `execute positioned ${item.source.location.x} ${
                item.source.location.y + 1.5
              } ${item.source.location.z} facing ${
                item.source.location.x + scan_x
              } ${item.source.location.y + 1.5 + scan_y} ${
                item.source.location.z + scan_z
              } run particle ulkd_ess:essentials30 ^ ^ ^${particleLength}`
            );
          }
        }
      } else {
        item.source.getComponent("equippable").setEquipment("Mainhand", null);
        item.source.runCommandAsync("playsound random.break @s");
      }
    }
    if (item.itemStack.typeId.includes("ulkd_ess:detector2")) {
      if (
        item.itemStack.getComponent("durability").maxDurability >
        item.itemStack.getComponent("durability").damage + 1
      ) {
        let brokenScanner = item.itemStack;
        brokenScanner.getComponent("durability").damage =
          brokenScanner.getComponent("durability").damage + 1;

        item.source
          .getComponent("equippable")
          .setEquipment("Mainhand", brokenScanner);

        let scan_x = item.source.getViewDirection().x * 30;
        let scan_y = item.source.getViewDirection().y * 30;
        let scan_z = item.source.getViewDirection().z * 30;
        for (let q = 0; q < 30; q += 0.2) {
          let targetBlock = item.source.dimension.getBlock({
            x: item.source.location.x + item.source.getViewDirection().x * q,
            y:
              item.source.location.y +
              1.5 +
              item.source.getViewDirection().y * q,
            z: item.source.location.z + item.source.getViewDirection().z * q,
          });
          if (targetBlock != null) {
            if (
              targetBlock.typeId.includes("iron_ore") ||
              targetBlock.typeId.includes("gold_ore") ||
              targetBlock.typeId.includes("quartz_ore")
            ) {
              let detectedCount = 0;
              let detectedPos = {
                x:
                  item.source.location.x + item.source.getViewDirection().x * q,
                y:
                  item.source.location.y +
                  1.5 +
                  item.source.getViewDirection().y * q,
                z:
                  item.source.location.z + item.source.getViewDirection().z * q,
              };
              for (let h = -5; h < 5; h++) {
                for (let t = -5; t < 5; t++) {
                  for (let r = -5; r < 5; r++) {
                    let extraOres = item.source.dimension.getBlock({
                      x: detectedPos.x + t,
                      y: detectedPos.y + h,
                      z: detectedPos.z + r,
                    });
                    if (extraOres.typeId == targetBlock.typeId) {
                      detectedCount++;
                    }
                  }
                }
              }
              if (targetBlock.typeId == "minecraft:deepslate_iron_ore") {
                item.source.sendMessage(
                  `§aDetected Iron Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:iron_ore") {
                item.source.sendMessage(
                  `§aDetected Iron Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:deepslate_gold_ore") {
                item.source.sendMessage(
                  `§aDetected Gold Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:gold_ore") {
                item.source.sendMessage(
                  `§aDetected Gold Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:quartz_ore") {
                item.source.sendMessage(
                  `§aDetected Quartz Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              break;
            }
          }
          if (particleLength < 30) {
            particleLength++;
            item.source.runCommand(
              `execute positioned ${item.source.location.x} ${
                item.source.location.y + 1.5
              } ${item.source.location.z} facing ${
                item.source.location.x + scan_x
              } ${item.source.location.y + 1.5 + scan_y} ${
                item.source.location.z + scan_z
              } run particle ulkd_ess:essentials30 ^ ^ ^${particleLength}`
            );
          }
        }
      } else {
        item.source.getComponent("equippable").setEquipment("Mainhand", null);
        item.source.runCommandAsync("playsound random.break @s");
      }
    }
    if (item.itemStack.typeId.includes("ulkd_ess:detector3")) {
      if (
        item.itemStack.getComponent("durability").maxDurability >
        item.itemStack.getComponent("durability").damage + 1
      ) {
        let brokenScanner = item.itemStack;
        brokenScanner.getComponent("durability").damage =
          brokenScanner.getComponent("durability").damage + 1;

        item.source
          .getComponent("equippable")
          .setEquipment("Mainhand", brokenScanner);

        let scan_x = item.source.getViewDirection().x * 30;
        let scan_y = item.source.getViewDirection().y * 30;
        let scan_z = item.source.getViewDirection().z * 30;
        for (let q = 0; q < 30; q += 0.2) {
          let targetBlock = item.source.dimension.getBlock({
            x: item.source.location.x + item.source.getViewDirection().x * q,
            y:
              item.source.location.y +
              1.5 +
              item.source.getViewDirection().y * q,
            z: item.source.location.z + item.source.getViewDirection().z * q,
          });
          if (targetBlock != null) {
            if (
              targetBlock.typeId.includes("emerald_ore") ||
              targetBlock.typeId.includes("diamond_ore") ||
              targetBlock.typeId.includes("lapis_ore")
            ) {
              let detectedCount = 0;
              let detectedPos = {
                x:
                  item.source.location.x + item.source.getViewDirection().x * q,
                y:
                  item.source.location.y +
                  1.5 +
                  item.source.getViewDirection().y * q,
                z:
                  item.source.location.z + item.source.getViewDirection().z * q,
              };
              for (let h = -5; h < 5; h++) {
                for (let t = -5; t < 5; t++) {
                  for (let r = -5; r < 5; r++) {
                    let extraOres = item.source.dimension.getBlock({
                      x: detectedPos.x + t,
                      y: detectedPos.y + h,
                      z: detectedPos.z + r,
                    });
                    if (extraOres.typeId == targetBlock.typeId) {
                      detectedCount++;
                    }
                  }
                }
              }
              if (targetBlock.typeId == "minecraft:deepslate_lapis_ore") {
                item.source.sendMessage(
                  `§aDetected Lapis Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:lapis_ore") {
                item.source.sendMessage(
                  `§aDetected Lapis Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:deepslate_diamond_ore") {
                item.source.sendMessage(
                  `§aDetected Diamond Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:diamond_ore") {
                item.source.sendMessage(
                  `§aDetected Diamond Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:deepslate_emerald_ore") {
                item.source.sendMessage(
                  `§aDetected Emerald Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (targetBlock.typeId == "minecraft:emerald_ore") {
                item.source.sendMessage(
                  `§aDetected Emerald Ore x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              break;
            }
          }
          if (particleLength < 30) {
            particleLength++;
            item.source.runCommand(
              `execute positioned ${item.source.location.x} ${
                item.source.location.y + 1.5
              } ${item.source.location.z} facing ${
                item.source.location.x + scan_x
              } ${item.source.location.y + 1.5 + scan_y} ${
                item.source.location.z + scan_z
              } run particle ulkd_ess:essentials30 ^ ^ ^${particleLength}`
            );
          }
        }
      } else {
        item.source.getComponent("equippable").setEquipment("Mainhand", null);
        item.source.runCommandAsync("playsound random.break @s");
      }
    }
    if (item.itemStack.typeId.includes("ulkd_ess:detector4")) {
      if (
        item.itemStack.getComponent("durability").maxDurability >
        item.itemStack.getComponent("durability").damage + 1
      ) {
        let brokenScanner = item.itemStack;
        brokenScanner.getComponent("durability").damage =
          brokenScanner.getComponent("durability").damage + 1;

        item.source
          .getComponent("equippable")
          .setEquipment("Mainhand", brokenScanner);

        let scan_x = item.source.getViewDirection().x * 30;
        let scan_y = item.source.getViewDirection().y * 30;
        let scan_z = item.source.getViewDirection().z * 30;
        for (let q = 0; q < 30; q += 0.2) {
          let targetBlock = item.source.dimension.getBlock({
            x: item.source.location.x + item.source.getViewDirection().x * q,
            y:
              item.source.location.y +
              1.5 +
              item.source.getViewDirection().y * q,
            z: item.source.location.z + item.source.getViewDirection().z * q,
          });
          if (targetBlock != null) {
            if (targetBlock.typeId.includes("ancient_debris")) {
              let detectedCount = 0;
              let detectedPos = {
                x:
                  item.source.location.x + item.source.getViewDirection().x * q,
                y:
                  item.source.location.y +
                  1.5 +
                  item.source.getViewDirection().y * q,
                z:
                  item.source.location.z + item.source.getViewDirection().z * q,
              };
              for (let h = -5; h < 5; h++) {
                for (let t = -5; t < 5; t++) {
                  for (let r = -5; r < 5; r++) {
                    let extraOres = item.source.dimension.getBlock({
                      x: detectedPos.x + t,
                      y: detectedPos.y + h,
                      z: detectedPos.z + r,
                    });
                    if (extraOres.typeId == targetBlock.typeId) {
                      detectedCount++;
                    }
                  }
                }
              }
              if (targetBlock.typeId == "minecraft:ancient_debris") {
                item.source.sendMessage(
                  `§aDetected Ancient Debris x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              if (!targetBlock.typeId.includes("minecraft")) {
                item.source.sendMessage(
                  `§aDetected ${targetBlock.typeId} x${detectedCount}`
                );
                item.source.sendMessage(
                  `§2${Math.round(q * 10) / 10} blocks away`
                );
              }
              break;
            }
          }
          if (particleLength < 30) {
            particleLength++;
            item.source.runCommand(
              `execute positioned ${item.source.location.x} ${
                item.source.location.y + 1.5
              } ${item.source.location.z} facing ${
                item.source.location.x + scan_x
              } ${item.source.location.y + 1.5 + scan_y} ${
                item.source.location.z + scan_z
              } run particle ulkd_ess:essentials30 ^ ^ ^${particleLength}`
            );
          }
        }
      } else {
        item.source.getComponent("equippable").setEquipment("Mainhand", null);
        item.source.runCommandAsync("playsound random.break @s");
      }
    }
    item.source.runCommandAsync("playsound unlinked.essentials.scan @s");
  }
  if (item.itemStack.typeId.includes("ulkd_ess:mining.helmet")) {
    item.source.addTag("unlinked.essentials.mining_helmet");
    players = world.getPlayers();
  }

  if (item.itemStack.typeId.includes("ulkd_ess:checkpoint")) {
    player = item.source;
    system.run(() => checkpoint(player));

    function checkpoint() {
      const teleport = new ActionFormData();
      teleport.title("Checkpoint");
      if (player.hasTag("unlinked.essentials.checkpoint")) {
        teleport.button("Checkpoint 1", "textures/unlinked/essentials/star1");
      } else {
        teleport.button("Checkpoint 1", "textures/ui/emptyStar");
      }
      if (player.hasTag("unlinked.essentials.checkpoint2")) {
        teleport.button("Checkpoint 2", "textures/unlinked/essentials/star2");
      } else {
        teleport.button("Checkpoint 2", "textures/ui/emptyStar");
      }
      teleport.button("Delete Checkpoint", "textures/ui/cancel");

      teleport.show(player).then((r) => {
        let correctedName = player.id;
        switch (r.selection) {
          case 0:
            if (
              world.scoreboard.getObjective(
                "unlinked.essentials.checkpoint_x"
              ) == null
            ) {
              world.scoreboard.addObjective("unlinked.essentials.checkpoint_x");
              world.scoreboard.addObjective("unlinked.essentials.checkpoint_y");
              world.scoreboard.addObjective("unlinked.essentials.checkpoint_z");
              world.scoreboard.addObjective(
                "unlinked.essentials.checkpoint_r0"
              );
              world.scoreboard.addObjective(
                "unlinked.essentials.checkpoint_r1"
              );
            }
            if (
              !world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_x")
                .hasParticipant(`${correctedName}`)
            ) {
              if (player.dimension.id.includes("overworld")) {
                world.scoreboard
                  .getObjective("unlinked.essentials.checkpoint_x")
                  .setScore(`${correctedName}`, 1);
              }
              if (player.dimension.id.includes("nether")) {
                world.scoreboard
                  .getObjective("unlinked.essentials.checkpoint_x")
                  .setScore(`${correctedName}`, 2);
              }
              if (player.dimension.id.includes("the_end")) {
                world.scoreboard
                  .getObjective("unlinked.essentials.checkpoint_x")
                  .setScore(`${correctedName}`, 3);
              }
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_x")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.location.x * 100)
                );
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_y")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.location.y * 100)
                );
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_z")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.location.z * 100)
                );
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_r0")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.getRotation().x)
                );
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_r1")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.getRotation().y)
                );
              player.sendMessage("§aCheckpoint 1 Created");
              player.addTag("unlinked.essentials.checkpoint");
            } else {
              let dim = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_x")
                .getScore(`${correctedName}`);
              let dimName;
              if (dim == 1) {
                dimName = world.getDimension("minecraft:overworld");
              }
              if (dim == 2) {
                dimName = world.getDimension("minecraft:nether");
              }
              if (dim == 3) {
                dimName = world.getDimension("minecraft:the_end");
              }
              let x = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_x")
                .getScore(`${correctedName}_${dimName.id}`);
              let y = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_y")
                .getScore(`${correctedName}_${dimName.id}`);
              let z = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_z")
                .getScore(`${correctedName}_${dimName.id}`);
              let r0 = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_r0")
                .getScore(`${correctedName}_${dimName.id}`);
              let r1 = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_r1")
                .getScore(`${correctedName}_${dimName.id}`);
              player.teleport(
                { x: x / 100, y: y / 100, z: z / 100 },
                { dimension: dimName, rotation: { x: r0, y: r1 } }
              );
            }
            player.runCommandAsync("playsound unlinked.essentials.click_y @s");
            break;
          case 1:
            if (
              world.scoreboard.getObjective(
                "unlinked.essentials.checkpoint2_x"
              ) == null
            ) {
              world.scoreboard.addObjective(
                "unlinked.essentials.checkpoint2_x"
              );
              world.scoreboard.addObjective(
                "unlinked.essentials.checkpoint2_y"
              );
              world.scoreboard.addObjective(
                "unlinked.essentials.checkpoint2_z"
              );
              world.scoreboard.addObjective(
                "unlinked.essentials.checkpoint2_r0"
              );
              world.scoreboard.addObjective(
                "unlinked.essentials.checkpoint2_r1"
              );
            }
            if (
              !world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_x")
                .hasParticipant(`${correctedName}`)
            ) {
              if (player.dimension.id.includes("overworld")) {
                world.scoreboard
                  .getObjective("unlinked.essentials.checkpoint2_x")
                  .setScore(`${correctedName}`, 1);
              }
              if (player.dimension.id.includes("nether")) {
                world.scoreboard
                  .getObjective("unlinked.essentials.checkpoint2_x")
                  .setScore(`${correctedName}`, 2);
              }
              if (player.dimension.id.includes("the_end")) {
                world.scoreboard
                  .getObjective("unlinked.essentials.checkpoint2_x")
                  .setScore(`${correctedName}`, 3);
              }
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_x")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.location.x * 100)
                );
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_y")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.location.y * 100)
                );
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_z")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.location.z * 100)
                );
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_r0")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.getRotation().x)
                );
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_r1")
                .setScore(
                  `${correctedName}_${player.dimension.id}`,
                  Math.round(player.getRotation().y)
                );
              player.sendMessage("§aCheckpoint 2 Created");
              player.addTag("unlinked.essentials.checkpoint2");
            } else {
              let dim = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_x")
                .getScore(`${correctedName}`);
              let dimName;
              if (dim == 1) {
                dimName = world.getDimension("minecraft:overworld");
              }
              if (dim == 2) {
                dimName = world.getDimension("minecraft:nether");
              }
              if (dim == 3) {
                dimName = world.getDimension("minecraft:the_end");
              }
              let x = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_x")
                .getScore(`${correctedName}_${dimName.id}`);
              let y = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_y")
                .getScore(`${correctedName}_${dimName.id}`);
              let z = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_z")
                .getScore(`${correctedName}_${dimName.id}`);
              let r0 = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_r0")
                .getScore(`${correctedName}_${dimName.id}`);
              let r1 = world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_r1")
                .getScore(`${correctedName}_${dimName.id}`);
              player.teleport(
                { x: x / 100, y: y / 100, z: z / 100 },
                { dimension: dimName, rotation: { x: r0, y: r1 } }
              );
            }
            player.runCommandAsync("playsound unlinked.essentials.click_y @s");
            break;
          case 2:
            deleteCheckpoint(player);
            player.runCommandAsync("playsound unlinked.essentials.click_y @s");
            break;
        }
      });
    }
    function deleteCheckpoint() {
      const unteleport = new ActionFormData();
      unteleport.title("Delete Teleport");
      unteleport.button("Checkpoint 1", "textures/ui/cancel");
      unteleport.button("Checkpoint 2", "textures/ui/cancel");
      unteleport.button("Back", "textures/ui/import");
      unteleport.show(player).then((r) => {
        let correctedName = player.id;
        if (r.selection == 0) {
          if (
            world.scoreboard.getObjective("unlinked.essentials.checkpoint_x") !=
            null
          ) {
            if (
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_x")
                .hasParticipant(`${correctedName}`)
            ) {
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint_x")
                .removeParticipant(`${correctedName}`);
              player.sendMessage(`§cCheckpoint 1 Deleted`);
              player.removeTag("unlinked.essentials.checkpoint");
            }
          }
          player.runCommandAsync("playsound unlinked.essentials.click_y @s");
        }
        if (r.selection == 1) {
          if (
            world.scoreboard.getObjective(
              "unlinked.essentials.checkpoint2_x"
            ) != null
          ) {
            if (
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_x")
                .hasParticipant(`${correctedName}`)
            ) {
              world.scoreboard
                .getObjective("unlinked.essentials.checkpoint2_x")
                .removeParticipant(`${correctedName}`);
              player.sendMessage(`§cCheckpoint 2 Deleted`);
              player.removeTag("unlinked.essentials.checkpoint2");
            }
          }
          player.runCommandAsync("playsound unlinked.essentials.click_y @s");
        }
        if (r.selection == 2) {
          checkpoint(player);
          player.runCommandAsync("playsound unlinked.essentials.click_n @s");
        }
      });
    }
  }

  if (
    world.getDynamicProperty("ess:portables") != false &&
    item.itemStack.typeId.includes("ulkd_ess:portable")
  ) {
    if (item.itemStack.typeId.includes("ulkd_ess:portable.crafting.table")) {
      if (
        world.scoreboard.getObjective("unlinked.essentials.crafting_table_x") ==
        null
      ) {
        world.scoreboard.addObjective("unlinked.essentials.crafting_table_x");
        world.scoreboard.addObjective("unlinked.essentials.crafting_table_y");
        world.scoreboard.addObjective("unlinked.essentials.crafting_table_z");
      }
      if (item.source.hasTag("unlinked.essentials.crafting_table_activated")) {
        let crafting_x = world.scoreboard
          .getObjective("unlinked.essentials.crafting_table_x")
          .getScore(item.source);
        let crafting_y = world.scoreboard
          .getObjective("unlinked.essentials.crafting_table_y")
          .getScore(item.source);
        let crafting_z = world.scoreboard
          .getObjective("unlinked.essentials.crafting_table_z")
          .getScore(item.source);
        item.source.runCommandAsync(
          `/execute if block ${crafting_x} ${crafting_y} ${crafting_z} crafting_table run setblock ${crafting_x} ${crafting_y} ${crafting_z} air`
        );
      }
      if (!item.source.isSneaking) {
        location = item.source.getBlockFromViewDirection({ maxDistance: 8 })
          ?.block.location;
        if (location != null) {
          item.source.runCommandAsync(
            `/execute if block ${location.x} ${location.y + 1} ${
              location.z
            } air run setblock ${location.x} ${location.y + 1} ${
              location.z
            } crafting_table`
          );
          item.source.dimension.spawnParticle("unlinked:essentials15", {
            x: location.x + 0.5,
            y: location.y + 1,
            z: location.z + 0.5,
          });
          item.source.playSound("unlinked.essentials.pop");
          world.scoreboard
            .getObjective("unlinked.essentials.crafting_table_x")
            .setScore(item.source, location.x);
          world.scoreboard
            .getObjective("unlinked.essentials.crafting_table_y")
            .setScore(item.source, location.y + 1);
          world.scoreboard
            .getObjective("unlinked.essentials.crafting_table_z")
            .setScore(item.source, location.z);
          item.source.addTag("unlinked.essentials.crafting_table_activated");
        }
      }
    }

    if (item.itemStack.typeId.includes("ulkd_ess:portable.furnace")) {
      if (
        world.scoreboard.getObjective("unlinked.essentials.furnace_x") == null
      ) {
        world.scoreboard.addObjective("unlinked.essentials.furnace_x");
        world.scoreboard.addObjective("unlinked.essentials.furnace_y");
        world.scoreboard.addObjective("unlinked.essentials.furnace_z");
      }
      if (item.source.hasTag("unlinked.essentials.furnace_activated")) {
        let furnace_x = world.scoreboard
          .getObjective("unlinked.essentials.furnace_x")
          .getScore(item.source);
        let furnace_y = world.scoreboard
          .getObjective("unlinked.essentials.furnace_y")
          .getScore(item.source);
        let furnace_z = world.scoreboard
          .getObjective("unlinked.essentials.furnace_z")
          .getScore(item.source);
        item.source.runCommandAsync(
          `/execute if block ${furnace_x} ${furnace_y} ${furnace_z} furnace run setblock ${furnace_x} ${furnace_y} ${furnace_z} air destroy`
        );
        item.source.runCommandAsync(
          `/execute positioned ${furnace_x} ${furnace_y} ${furnace_z} run kill @e[type=item,name=furnace,r=5]`
        );
      }

      if (!item.source.isSneaking) {
        location = item.source.getBlockFromViewDirection({ maxDistance: 8 })
          ?.block.location;
        if (location != null) {
          item.source.runCommandAsync(
            `/execute if block ${location.x} ${location.y + 1} ${
              location.z
            } air run setblock ${location.x} ${location.y + 1} ${
              location.z
            } furnace`
          );
          item.source.dimension.spawnParticle("unlinked:essentials15", {
            x: location.x + 0.5,
            y: location.y + 1,
            z: location.z + 0.5,
          });
          item.source.playSound("unlinked.essentials.pop");
          world.scoreboard
            .getObjective("unlinked.essentials.furnace_x")
            .setScore(item.source, location.x);
          world.scoreboard
            .getObjective("unlinked.essentials.furnace_y")
            .setScore(item.source, location.y + 1);
          world.scoreboard
            .getObjective("unlinked.essentials.furnace_z")
            .setScore(item.source, location.z);
          item.source.addTag("unlinked.essentials.furnace_activated");
        }
      }
    }

    if (item.itemStack.typeId.includes("ulkd_ess:portable.ender.chest")) {
      if (
        world.scoreboard.getObjective("unlinked.essentials.ender_chest_x") ==
        null
      ) {
        world.scoreboard.addObjective("unlinked.essentials.ender_chest_x");
        world.scoreboard.addObjective("unlinked.essentials.ender_chest_y");
        world.scoreboard.addObjective("unlinked.essentials.ender_chest_z");
      }
      if (item.source.hasTag("unlinked.essentials.ender_chest_activated")) {
        let ender_x = world.scoreboard
          .getObjective("unlinked.essentials.ender_chest_x")
          .getScore(item.source);
        let ender_y = world.scoreboard
          .getObjective("unlinked.essentials.ender_chest_y")
          .getScore(item.source);
        let ender_z = world.scoreboard
          .getObjective("unlinked.essentials.ender_chest_z")
          .getScore(item.source);
        item.source.runCommandAsync(
          `/execute if block ${ender_x} ${ender_y} ${ender_z} ender_chest run setblock ${ender_x} ${ender_y} ${ender_z} air`
        );
      }

      if (!item.source.isSneaking) {
        location = item.source.getBlockFromViewDirection({ maxDistance: 8 })
          ?.block.location;
        if (location != null) {
          item.source.runCommandAsync(
            `/execute if block ${location.x} ${location.y + 1} ${
              location.z
            } air run setblock ${location.x} ${location.y + 1} ${
              location.z
            } ender_chest`
          );
          item.source.dimension.spawnParticle("unlinked:essentials15", {
            x: location.x + 0.5,
            y: location.y + 1,
            z: location.z + 0.5,
          });
          item.source.playSound("unlinked.essentials.pop");
          world.scoreboard
            .getObjective("unlinked.essentials.ender_chest_x")
            .setScore(item.source, location.x);
          world.scoreboard
            .getObjective("unlinked.essentials.ender_chest_y")
            .setScore(item.source, location.y + 1);
          world.scoreboard
            .getObjective("unlinked.essentials.ender_chest_z")
            .setScore(item.source, location.z);
          item.source.addTag("unlinked.essentials.ender_chest_activated");
        }
      }
    }

    if (item.itemStack.typeId.includes("ulkd_ess:portable.anvil")) {
      if (
        world.scoreboard.getObjective("unlinked.essentials.anvil_x") == null
      ) {
        world.scoreboard.addObjective("unlinked.essentials.anvil_x");
        world.scoreboard.addObjective("unlinked.essentials.anvil_y");
        world.scoreboard.addObjective("unlinked.essentials.anvil_z");
      }
      if (item.source.hasTag("unlinked.essentials.anvil_activated")) {
        let ender_x = world.scoreboard
          .getObjective("unlinked.essentials.anvil_x")
          .getScore(item.source);
        let ender_y = world.scoreboard
          .getObjective("unlinked.essentials.anvil_y")
          .getScore(item.source);
        let ender_z = world.scoreboard
          .getObjective("unlinked.essentials.anvil_z")
          .getScore(item.source);
        item.source.runCommandAsync(
          `/execute if block ${ender_x} ${ender_y} ${ender_z} damaged_anvil run setblock ${ender_x} ${ender_y} ${ender_z} air`
        );
      }

      if (!item.source.isSneaking) {
        location = item.source.getBlockFromViewDirection({ maxDistance: 8 })
          ?.block.location;
        if (location != null) {
          item.source.runCommandAsync(
            `/execute if block ${location.x} ${location.y + 1} ${
              location.z
            } air run setblock ${location.x} ${location.y + 1} ${
              location.z
            } damaged_anvil`
          );
          item.source.dimension.spawnParticle("unlinked:essentials15", {
            x: location.x + 0.5,
            y: location.y + 1,
            z: location.z + 0.5,
          });
          item.source.playSound("unlinked.essentials.pop");
          world.scoreboard
            .getObjective("unlinked.essentials.anvil_x")
            .setScore(item.source, location.x);
          world.scoreboard
            .getObjective("unlinked.essentials.anvil_y")
            .setScore(item.source, location.y + 1);
          world.scoreboard
            .getObjective("unlinked.essentials.anvil_z")
            .setScore(item.source, location.z);
          item.source.addTag("unlinked.essentials.anvil_activated");
        }
      }
    }
  }
  if (
    world.getDynamicProperty("ess:portables") == false &&
    item.itemStack.typeId.includes("ulkd_ess:portable")
  ) {
    item.source.sendMessage(
      "§cPortable Blocks are disabled in the Admin Remote (creative only item)"
    );
  }
  if (item.itemStack.typeId.includes("ulkd_ess:detector")) {
    system.runTimeout(() => {
      let coal = world.scoreboard
        .getObjective("unlinked.essentials.ore_coal")
        ?.getScore(item.source) || 0;
      let copper = world.scoreboard
        .getObjective("unlinked.essentials.ore_copper")
        ?.getScore(item.source) || 0;
      let diamond = world.scoreboard
        .getObjective("unlinked.essentials.ore_diamond")
        ?.getScore(item.source) || 0;
      let emerald = world.scoreboard
        .getObjective("unlinked.essentials.ore_emerald")
        ?.getScore(item.source) || 0;
      let gold = world.scoreboard
        .getObjective("unlinked.essentials.ore_gold")
        ?.getScore(item.source) || 0;
      let iron = world.scoreboard
        .getObjective("unlinked.essentials.ore_iron")
        ?.getScore(item.source) || 0;
      let lapis = world.scoreboard
        .getObjective("unlinked.essentials.ore_lapis")
        ?.getScore(item.source) || 0;
      let quartz = world.scoreboard
        .getObjective("unlinked.essentials.ore_quartz")
        ?.getScore(item.source) || 0;
      let redstone = world.scoreboard
        .getObjective("unlinked.essentials.ore_redstone")
        ?.getScore(item.source) || 0;
      let ancient_debris = world.scoreboard
        .getObjective("unlinked.essentials.ancient_debris")
        ?.getScore(item.source) || 0;
      if (coal > 0) {
        item.source.sendMessage(`§a[Scan] Detected Coal x${coal}`);
        world.scoreboard
          .getObjective("unlinked.essentials.ore_coal")
          ?.removeParticipant(item.source);
      }
      if (copper > 0) {
        item.source.sendMessage(`§a[Scan] Detected Copper x${copper}`);
        world.scoreboard
          .getObjective("unlinked.essentials.ore_copper")
          ?.removeParticipant(item.source);
      }
      if (diamond > 0) {
        item.source.sendMessage(`§a[Scan] Detected Diamond x${diamond}`);
        world.scoreboard
          .getObjective("unlinked.essentials.ore_diamond")
          ?.removeParticipant(item.source);
      }
      if (emerald > 0) {
        item.source.sendMessage(`§a[Scan] Detected Emerald x${emerald}`);
        world.scoreboard
          .getObjective("unlinked.essentials.ore_emerald")
          ?.removeParticipant(item.source);
      }
      if (gold > 0) {
        item.source.sendMessage(`§a[Scan] Detected Gold x${gold}`);
        world.scoreboard
          .getObjective("unlinked.essentials.ore_gold")
          ?.removeParticipant(item.source);
      }
      if (iron > 0) {
        item.source.sendMessage(`§a[Scan] Detected Iron x${iron}`);
        world.scoreboard
          .getObjective("unlinked.essentials.ore_iron")
          ?.removeParticipant(item.source);
      }
      if (lapis > 0) {
        item.source.sendMessage(`§a[Scan] Detected Lapis Lazuli x${lapis}`);
        world.scoreboard
          .getObjective("unlinked.essentials.ore_lapis")
          ?.removeParticipant(item.source);
      }
      if (quartz > 0) {
        item.source.sendMessage(`§a[Scan] Detected Quartz x${quartz}`);
        world.scoreboard
          .getObjective("unlinked.essentials.ore_quartz")
          ?.removeParticipant(item.source);
      }
      if (redstone > 0) {
        item.source.sendMessage(`§a[Scan] Detected Redstone x${redstone}`);
        world.scoreboard
          .getObjective("unlinked.essentials.ore_redstone")
          ?.removeParticipant(item.source);
      }
      if (ancient_debris > 0) {
        item.source.sendMessage(
          `§a[Scan] Detected Ancient Debris x${ancient_debris}`
        );
        world.scoreboard
          .getObjective("unlinked.essentials.ancient_debris")
          ?.removeParticipant(item.source);
      }
    }, 2);
  }
  if (item.itemStack.typeId.includes("ulkd_ess:measuring_tape")) {
    if (world.getDynamicProperty("ess:measuring_tape") === false) {
      item.source.sendMessage(
        "§cMeasuring tape is disabled in the Admin Remote (creative only item)"
      );
      return;
    }
    let measuring_x;
    let measuring_y;
    let measuring_z;
    if (world.scoreboard.getObjective("measuring_scoreboard_x") == null) {
      world.scoreboard.addObjective("measuring_scoreboard_x");
      world.scoreboard.addObjective("measuring_scoreboard_y");
      world.scoreboard.addObjective("measuring_scoreboard_z");
    }
    if (
      world.scoreboard
        .getObjective("measuring_scoreboard_x")
        .hasParticipant(item.source.id)
    ) {
      measuring_x = world.scoreboard
        .getObjective("measuring_scoreboard_x")
        .getScore(item.source.id);
      measuring_y = world.scoreboard
        .getObjective("measuring_scoreboard_y")
        .getScore(item.source.id);
      measuring_z = world.scoreboard
        .getObjective("measuring_scoreboard_z")
        .getScore(item.source.id);
      let viewBlock = item.source.getBlockFromViewDirection({
        maxDistance: 100,
      });
      let viewBlockPos;
      if (viewBlock != null) {
        viewBlockPos = viewBlock.block.location;
      } else {
        viewBlockPos = item.source.location;
      }
      let dx = measuring_x - viewBlockPos.x;
      let dy = measuring_y - (viewBlockPos.y + 0.5);
      let dz = measuring_z - viewBlockPos.z;
      let distance = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
      item.source.sendMessage(
        `§6Distance between two points: ${
          Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 10) / 10
        } blocks`
      );
      item.source.runCommandAsync(
        `particle ulkd_ess:essentials25 ${measuring_x} ${measuring_y} ${measuring_z}`
      );
      item.source.runCommandAsync(
        `particle ulkd_ess:essentials25 ${viewBlockPos.x} ${
          viewBlockPos.y + 0.5
        } ${viewBlockPos.z}`
      );
      for (let q = 0; q < distance; q++) {
        item.source.runCommand(
          `execute positioned ${viewBlockPos.x} ${viewBlockPos.y + 0.5} ${
            viewBlockPos.z
          } facing ${measuring_x} ${measuring_y} ${measuring_z} run particle ulkd_ess:essentials29 ^ ^ ^${q}`
        );
      }
    } else {
      item.source.sendMessage(
        "§cPunch a block to select where to measure from"
      );
    }
  }
  if (
    item.itemStack.typeId == "ulkd_ess:large_air_bladder" ||
    item.source.getComponent("equippable").getEquipment("Offhand") != null ||
    item.itemStack.typeId == "ulkd_ess:air_bladder"
  ) {
    if (
      item.source.getComponent("equippable").getEquipment("Offhand") != null
    ) {
      if (
        item.source.getComponent("equippable").getEquipment("Offhand").typeId ==
          "ulkd_ess:air_bladder" ||
        item.source.getComponent("equippable").getEquipment("Offhand").typeId ==
          "ulkd_ess:large_air_bladder"
      ) {
        if (
          item.source.dimension.getBlock({
            x: item.source.location.x,
            y: item.source.location.y + 1,
            z: item.source.location.z,
          }) != null
        ) {
          if (
            item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("water") ||
            (item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("light_block") &&
              item.source.dimension
                .getBlock({
                  x: item.source.location.x,
                  y: item.source.location.y,
                  z: item.source.location.z,
                })
                .typeId.includes("water")) ||
            item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("kelp") ||
            (item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("kelp") &&
              item.source.dimension
                .getBlock({
                  x: item.source.location.x,
                  y: item.source.location.y,
                  z: item.source.location.z,
                })
                .typeId.includes("kelp")) ||
            item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("seagrass") ||
            (item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("seagrass") &&
              item.source.dimension
                .getBlock({
                  x: item.source.location.x,
                  y: item.source.location.y,
                  z: item.source.location.z,
                })
                .typeId.includes("seagrass"))
          ) {
            let airBladder = item.source
              .getComponent("equippable")
              .getEquipment("Offhand");
            if (
              airBladder.getComponent("durability").maxDurability >
              airBladder.getComponent("durability").damage
            ) {
              airBladder.getComponent("durability").damage =
                airBladder.getComponent("durability").damage + 1000;
              item.source.runCommandAsync("effect @s water_breathing 3 0 true");
              item.source.runCommandAsync(
                "playsound unlinked.essentials.air_bladder @s"
              );
              item.source.runCommandAsync(
                "playsound unlinked.essentials.air_bubbles @s"
              );
              item.source.runCommandAsync("particle ulkd_ess:essentials20");
            }
            item.source
              .getComponent("equippable")
              .setEquipment("Offhand", airBladder);
          } else {
            let airBladder = item.source
              .getComponent("equippable")
              .getEquipment("Offhand");
            if (airBladder.getComponent("durability").damage >= 1000) {
              airBladder.getComponent("durability").damage =
                airBladder.getComponent("durability").damage - 1000;
              item.source.runCommandAsync(
                "playsound unlinked.essentials.air_bladder_inflate @s"
              );
            }
            item.source
              .getComponent("equippable")
              .setEquipment("Offhand", airBladder);
          }
        }
      } else {
        system.run(doBladderMainhand);
      }
    } else {
      system.run(doBladderMainhand);
    }
    function doBladderMainhand() {
      if (
        item.itemStack.typeId == "ulkd_ess:large_air_bladder" ||
        item.itemStack.typeId == "ulkd_ess:air_bladder"
      ) {
        if (
          item.source.dimension.getBlock({
            x: item.source.location.x,
            y: item.source.location.y + 1,
            z: item.source.location.z,
          }) != null
        ) {
          if (
            item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("water") ||
            (item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("light_block") &&
              item.source.dimension
                .getBlock({
                  x: item.source.location.x,
                  y: item.source.location.y,
                  z: item.source.location.z,
                })
                .typeId.includes("water")) ||
            item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("kelp") ||
            (item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("kelp") &&
              item.source.dimension
                .getBlock({
                  x: item.source.location.x,
                  y: item.source.location.y,
                  z: item.source.location.z,
                })
                .typeId.includes("kelp")) ||
            item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("seagrass") ||
            (item.source.dimension
              .getBlock({
                x: item.source.location.x,
                y: item.source.location.y + 1,
                z: item.source.location.z,
              })
              .typeId.includes("seagrass") &&
              item.source.dimension
                .getBlock({
                  x: item.source.location.x,
                  y: item.source.location.y,
                  z: item.source.location.z,
                })
                .typeId.includes("seagrass"))
          ) {
            let airBladder = item.itemStack;
            if (
              airBladder.getComponent("durability").maxDurability >
              airBladder.getComponent("durability").damage
            ) {
              airBladder.getComponent("durability").damage =
                airBladder.getComponent("durability").damage + 1000;
              item.source.runCommandAsync("effect @s water_breathing 3 0 true");
              item.source.runCommandAsync(
                "playsound unlinked.essentials.air_bladder @s"
              );
              item.source.runCommandAsync(
                "playsound unlinked.essentials.air_bubbles @s"
              );
              item.source.runCommandAsync("particle ulkd_ess:essentials20");
            }
            item.source
              .getComponent("equippable")
              .setEquipment("Mainhand", airBladder);
          } else {
            let airBladder = item.itemStack;
            if (airBladder.getComponent("durability").damage >= 1000) {
              airBladder.getComponent("durability").damage =
                airBladder.getComponent("durability").damage - 1000;
              item.source.runCommandAsync(
                "playsound unlinked.essentials.air_bladder_inflate @s"
              );
            }
            item.source
              .getComponent("equippable")
              .setEquipment("Mainhand", airBladder);
          }
        }
      }
    }
  }
  if (item.itemStack.typeId.includes("ulkd_ess:capture_cube")) {
    if (item.itemStack.getLore().length > 0) {
      for (let q = 0; q < item.itemStack.getLore().length; q++) {
        if (item.itemStack.getLore()[q].includes(`§r§bCapture Cube ID: `)) {
          let structureId = item.itemStack
            .getLore()
            [q].replace(`§r§bCapture Cube ID: `, "");
          let block = item.source.getBlockFromViewDirection({
            maxDistance: 10,
          });
          if (block) {
            let adjustedPosition = {
              x: block.block.location.x,
              y: block.block.location.y + 2,
              z: block.block.location.z,
            };

            world.structureManager.place(
              `unlinked_essentials:${structureId}`,
              item.source.dimension,
              adjustedPosition,
              { includeBlocks: false, includeEntities: true }
            );
            world.structureManager.delete(`unlinked_essentials:${structureId}`);
            const eq = item.source.getComponent("equippable");
            const mainhand = eq.getEquipment("Mainhand");
            if (mainhand != null) {
              if (world.getDynamicProperty("ess:reusable_capture_cubes")) {
                eq.setEquipment(
                  "Mainhand",
                  new ItemStack("ulkd_ess:empty_capture_cube", 1)
                );
              } else {
                eq.setEquipment("Mainhand", null);
              }
            }
            item.source.runCommandAsync(
              `particle ulkd_ess:essentials24 ${adjustedPosition.x} ${adjustedPosition.y} ${adjustedPosition.z}`
            );
            item.source.runCommandAsync(
              `playsound unlinked.essentials.release @s ${adjustedPosition.x} ${adjustedPosition.y} ${adjustedPosition.z}`
            );
          } else {
            item.source.sendMessage("§cNot a valid location to summon");
          }
        }
      }
    }
  }
  if (item.itemStack.typeId.includes("ulkd_ess:admin_remote")) {
    if (item.source.getGameMode() == "creative") {
      player = item.source;
      system.run(() => admin(player));
      function admin() {
        const admin = new ModalFormData();
        admin.title("Admin Settings - Allow / Deny usage");
        if (world.getDynamicProperty("ess:veinminer") != false) {
          admin.toggle("Ore Breaker", true);
        } else {
          admin.toggle("Ore Breaker", false);
        }
        if (world.getDynamicProperty("ess:treecapitator") != false) {
          admin.toggle("Tree Breaker", true);
        } else {
          admin.toggle("Tree Breaker", false);
        }
        if (world.getDynamicProperty("ess:recrop") != false) {
          admin.toggle("Crop Replanting", true);
        } else {
          admin.toggle("Crop Replanting", false);
        }
        if (world.getDynamicProperty("ess:deathpoint") != false) {
          admin.toggle("Death Waypoint", true);
        } else {
          admin.toggle("Death Waypoint", false);
        }
        if (world.getDynamicProperty("ess:chunks") != false) {
          admin.toggle("Chunk Borders", true);
        } else {
          admin.toggle("Chunk Borders", false);
        }
        if (world.getDynamicProperty("ess:tree_replant") != false) {
          admin.toggle("Tree Replanting", true);
        } else {
          admin.toggle("Tree Replanting", false);
        }
        if (world.getDynamicProperty("ess:spawners") != false) {
          admin.toggle("Breakable Spawners", true);
        } else {
          admin.toggle("Breakable Spawners", false);
        }
        if (world.getDynamicProperty("ess:replace") != false) {
          admin.toggle("Tool Replacement", true);
        } else {
          admin.toggle("Tool Replacement", false);
        }
        if (world.getDynamicProperty("ess:lava_reflow") != false) {
          admin.toggle("Lava Reflow", true);
        } else {
          admin.toggle("Lava Reflow", false);
        }
        if (world.getDynamicProperty("ess:double_door") != false) {
          admin.toggle("Double Door Opening", true);
        } else {
          admin.toggle("Double Door Opening", false);
        }
        if (world.getDynamicProperty("ess:automap") != false) {
          admin.toggle("Automatically Updating Map", true);
        } else {
          admin.toggle("Automatically Updating Map", false);
        }
        if (world.getDynamicProperty("ess:weather") != false) {
          admin.toggle("Weather Settings", true);
        } else {
          admin.toggle("Weather Settings", false);
        }
        if (world.getDynamicProperty("ess:time") != false) {
          admin.toggle("Time Settings", true);
        } else {
          admin.toggle("Time Settings", false);
        }
        if (world.getDynamicProperty("ess:capture") != false) {
          admin.toggle("Capture Cubes", true);
        } else {
          admin.toggle("Capture Cubes", false);
        }
        if (world.getDynamicProperty("ess:detectors") != false) {
          admin.toggle("Ore Scanners", true);
        } else {
          admin.toggle("Ore Scanners", false);
        }
        if (world.getDynamicProperty("ess:portables") != false) {
          admin.toggle("Portable Blocks", true);
        } else {
          admin.toggle("Portable Blocks", false);
        }
        if (world.getDynamicProperty("ess:player_tp") != false) {
          admin.toggle("Player Teleporter", true);
        } else {
          admin.toggle("Player Teleporter", false);
        }
        if (world.getDynamicProperty("ess:teleport") != false) {
          admin.toggle("Teleporter", true);
        } else {
          admin.toggle("Teleporter", false);
        }
        if (world.getDynamicProperty("ess:capture_boss") != false) {
          admin.toggle(
            "Capture Cube works on Wither, Warden, Ender Dragon",
            true
          );
        } else {
          admin.toggle(
            "Capture Cube works on Wither, Warden, Ender Dragon",
            false
          );
        }
        admin.toggle(
          "Leaves Breaker",
          !!world.getDynamicProperty("ess:leaves")
        );
        admin.toggle(
          "Stone Breaker",
          world.getDynamicProperty("ess:stonebreaker") !== false
        );
        admin.toggle(
          "Tree Breaker Fixed Durability",
          !!world.getDynamicProperty("ess:fixed_durability")
        );
        admin.toggle(
          "No Tree Breaker Limit",
          !!world.getDynamicProperty("ess:no_treebreaker_limit")
        );
        admin.toggle("Bribe", world.getDynamicProperty("ess:bribe") !== false);
        admin.toggle(
          "Bribe to Change Trades",
          !!world.getDynamicProperty("ess:change_trades_bribe")
        );
        admin.toggle(
          "Reusable Capture Cubes",
          !!world.getDynamicProperty("ess:reusable_capture_cubes")
        );
        admin.toggle(
          "Obsidian in Stone Breaker",
          !!world.getDynamicProperty("ess:obsidian_stonebreaker")
        );
        admin.toggle(
          "Sleeping Bag",
          world.getDynamicProperty("ess:sleeping_bag") !== false
        );
        admin.toggle(
          "Block Inspector",
          world.getDynamicProperty("ess:block_inspector") !== false
        );
        admin.toggle(
          "Measuring Tape",
          world.getDynamicProperty("ess:measuring_tape") !== false
        );
        admin.toggle(
          "Big Bucket",
          world.getDynamicProperty("ess:big_bucket") !== false
        );
        admin.toggle(
          "Satchel",
          world.getDynamicProperty("ess:satchel") !== false
        );
        admin.toggle(
          "Clear Waypoint",
          world.getDynamicProperty("ess:clear_waypoint") !== false
        );
        admin.toggle(
          "Circle Template",
          world.getDynamicProperty("ess:circle_template") !== false
        );
        admin.toggle(
          "Super Sponge",
          world.getDynamicProperty("ess:super_sponge") !== false
        );
        admin.toggle(
          "Sorting Stick",
          world.getDynamicProperty("ess:sorting_stick") !== false
        );
        admin.toggle(
          "Change Mob Spawner",
          !!world.getDynamicProperty("ess:change_mob_spawner")
        );
        admin.show(player).then((data) => {
          let { formValues, canceled } = data;
          if (canceled) return;
          if (formValues[0] == true) {
            world.setDynamicProperty("ess:veinminer", true);
          }
          if (formValues[0] == false) {
            world.setDynamicProperty("ess:veinminer", false);
          }
          if (formValues[1] == true) {
            world.setDynamicProperty("ess:treecapitator", true);
          }
          if (formValues[1] == false) {
            world.setDynamicProperty("ess:treecapitator", false);
          }
          if (formValues[2] == true) {
            world.setDynamicProperty("ess:recrop", true);
          }
          if (formValues[2] == false) {
            world.setDynamicProperty("ess:recrop", false);
          }
          if (formValues[3] == true) {
            world.setDynamicProperty("ess:deathpoint", true);
          }
          if (formValues[3] == false) {
            world.setDynamicProperty("ess:deathpoint", false);
          }
          if (formValues[4] == true) {
            world.setDynamicProperty("ess:chunks", true);
          }
          if (formValues[4] == false) {
            world.setDynamicProperty("ess:chunks", false);
          }
          if (formValues[5] == true) {
            world.setDynamicProperty("ess:tree_replant", true);
          }
          if (formValues[5] == false) {
            world.setDynamicProperty("ess:tree_replant", false);
          }
          if (formValues[6] == true) {
            world.setDynamicProperty("ess:spawners", true);
          }
          if (formValues[6] == false) {
            world.setDynamicProperty("ess:spawners", false);
          }
          if (formValues[7] == true) {
            world.setDynamicProperty("ess:replace", true);
          }
          if (formValues[7] == false) {
            world.setDynamicProperty("ess:replace", false);
          }
          if (formValues[8] == true) {
            world.setDynamicProperty("ess:lava_reflow", true);
          }
          if (formValues[8] == false) {
            world.setDynamicProperty("ess:lava_reflow", false);
          }
          if (formValues[9] == true) {
            world.setDynamicProperty("ess:double_door", true);
          }
          if (formValues[9] == false) {
            world.setDynamicProperty("ess:double_door", false);
          }
          if (formValues[10] == true) {
            world.setDynamicProperty("ess:automap", true);
          }
          if (formValues[10] == false) {
            world.setDynamicProperty("ess:automap", false);
          }
          if (formValues[11] == true) {
            world.setDynamicProperty("ess:weather", true);
          }
          if (formValues[11] == false) {
            world.setDynamicProperty("ess:weather", false);
          }
          if (formValues[12] == true) {
            world.setDynamicProperty("ess:time", true);
          }
          if (formValues[12] == false) {
            world.setDynamicProperty("ess:time", false);
          }
          if (formValues[13] == true) {
            world.setDynamicProperty("ess:capture", true);
          }
          if (formValues[13] == false) {
            world.setDynamicProperty("ess:capture", false);
          }
          if (formValues[14] == true) {
            world.setDynamicProperty("ess:detectors", true);
          }
          if (formValues[14] == false) {
            world.setDynamicProperty("ess:detectors", false);
          }
          if (formValues[15] == true) {
            world.setDynamicProperty("ess:portables", true);
          }
          if (formValues[15] == false) {
            world.setDynamicProperty("ess:portables", false);
          }
          if (formValues[16] == true) {
            world.setDynamicProperty("ess:player_tp", true);
          }
          if (formValues[16] == false) {
            world.setDynamicProperty("ess:player_tp", false);
          }
          if (formValues[17] == true) {
            world.setDynamicProperty("ess:teleport", true);
          }
          if (formValues[17] == false) {
            world.setDynamicProperty("ess:teleport", false);
          }
          if (formValues[18] == true) {
            world.setDynamicProperty("ess:capture_boss", true);
          }
          if (formValues[18] == false) {
            world.setDynamicProperty("ess:capture_boss", false);
          }
          if (formValues[19] == true) {
            world.setDynamicProperty("ess:leaves", true);
          }
          if (formValues[19] == false) {
            world.setDynamicProperty("ess:leaves", false);
          }
          if (formValues[20] == true) {
            world.setDynamicProperty("ess:stonebreaker", true);
          }
          if (formValues[20] == false) {
            world.setDynamicProperty("ess:stonebreaker", false);
          }
          world.setDynamicProperty("ess:fixed_durability", formValues[21]);
          world.setDynamicProperty("ess:no_treebreaker_limit", formValues[22]);
          world.setDynamicProperty("ess:bribe", formValues[23]);
          world.setDynamicProperty("ess:change_trades_bribe", formValues[24]);
          world.setDynamicProperty(
            "ess:reusable_capture_cubes",
            formValues[25]
          );
          world.setDynamicProperty("ess:obsidian_stonebreaker", formValues[26]);
          world.setDynamicProperty("ess:sleeping_bag", formValues[27]);
          world.setDynamicProperty("ess:block_inspector", formValues[28]);
          world.setDynamicProperty("ess:measuring_tape", formValues[29]);
          world.setDynamicProperty("ess:big_bucket", formValues[30]);
          world.setDynamicProperty("ess:satchel", formValues[31]);
          world.setDynamicProperty("ess:clear_waypoint", formValues[32]);
          world.setDynamicProperty("ess:circle_template", formValues[33]);
          world.setDynamicProperty("ess:super_sponge", formValues[34]);
          world.setDynamicProperty("ess:sorting_stick", formValues[35]);
          world.setDynamicProperty("ess:change_mob_spawner", formValues[36]);
        });
      }
    } else {
      item.source.sendMessage(
        "§cAdmin Remote can only be used in creative mode"
      );
    }
  }
  if (item.itemStack.typeId.includes("ulkd_ess:sponge")) {
    if (world.getDynamicProperty("ess:super_sponge") === false) {
      item.source.sendMessage(
        "§cSuper Sponge is disabled in the Admin Remote (creative only item)"
      );
      return;
    }
    let sponge = item.itemStack;
    if (
      sponge.getComponent("durability").maxDurability >
      sponge.getComponent("durability").damage
    ) {
      sponge.getComponent("durability").damage =
        sponge.getComponent("durability").damage + 100;
      item.source.runCommandAsync(
        `/fill ~-5 ~-5 ~-5 ~5 ~5 ~5 air replace seagrass`
      );
      item.source.runCommandAsync(
        `/fill ~-5 ~-5 ~-5 ~5 ~5 ~5 air replace water`
      );
      item.source.runCommandAsync(
        `/fill ~-5 ~-5 ~-5 ~5 ~5 ~5 air replace flowing_water`
      );
    }
    item.source.getComponent("equippable").setEquipment("Mainhand", sponge);
  }
});

world.afterEvents.entityHurt.subscribe((deadPlayer) => {
  if (deadPlayer.hurtEntity.typeId == "minecraft:player") {
    if (
      !deadPlayer.hurtEntity.hasTag("unlinked.essentials.deathpoint") &&
      world.getDynamicProperty("ess:deathpoint") != false
    ) {
      if (
        deadPlayer.hurtEntity.getComponent("minecraft:health").currentValue <= 0
      ) {
        let currentWaypoint;
        if (
          !deadPlayer.hurtEntity.hasTag(
            "unlinked.essentials.deathpoint_private"
          )
        ) {
          currentWaypoint = deadPlayer.hurtEntity.dimension.spawnEntity(
            "ulkd_ess:waypoint",
            deadPlayer.hurtEntity.location
          );
        }
        if (
          deadPlayer.hurtEntity.hasTag("unlinked.essentials.deathpoint_private")
        ) {
          currentWaypoint = deadPlayer.hurtEntity.dimension.spawnEntity(
            "ulkd_ess:waypoint_public",
            deadPlayer.hurtEntity.location
          );
        }
        deadPlayer.hurtEntity.sendMessage(
          `§6You died at: §c${Math.round(
            deadPlayer.hurtEntity.location.x
          )} ${Math.round(deadPlayer.hurtEntity.location.y)} ${Math.round(
            deadPlayer.hurtEntity.location.z
          )}`
        );
        system.runTimeout(() => {
          if (
            !deadPlayer.hurtEntity.hasTag(
              "unlinked.essentials.deathpoint_private"
            )
          ) {
            currentWaypoint.getComponent("projectile").owner =
              deadPlayer.hurtEntity;
          }
        }, 1);
        if (waypoint == null) {
          waypoint = deadPlayer.hurtEntity.dimension.getEntities({
            location: deadPlayer.hurtEntity.location,
            maxDistance: 5,
            families: ["ess_waypoint"],
          });
          let nearbyItems = deadPlayer.hurtEntity.dimension.getEntities({
            location: deadPlayer.hurtEntity.location,
            maxDistance: 5,
            type: "item",
          });

          if (waypoint[0] != null) {
            for (let y = 0; y < nearbyItems.length; y++) {
              waypoint[0]
                .getComponent("inventory")
                .container.addItem(
                  nearbyItems[y].getComponent("item").itemStack
                );
              nearbyItems[y].remove();
            }
          }
        } else {
          let additionalWaypoints = deadPlayer.hurtEntity.dimension.getEntities(
            {
              location: deadPlayer.hurtEntity.location,
              maxDistance: 5,
              families: ["ess_waypoint"],
            }
          );
          let nearbyItems = deadPlayer.hurtEntity.dimension.getEntities({
            location: deadPlayer.hurtEntity.location,
            maxDistance: 5,
            type: "item",
          });
          if (additionalWaypoints[0] != null) {
            for (let y = 0; y < nearbyItems.length; y++) {
              additionalWaypoints[0]
                .getComponent("inventory")
                .container.addItem(
                  nearbyItems[y].getComponent("item").itemStack
                );
              nearbyItems[y].remove();
            }
          }
          waypoint = waypoint.concat(additionalWaypoints);
        }
      }
    }
  }
});

system.runInterval(() => {
  tempPlayers = world.getPlayers();
  if (tempPlayers != null) {
    if (tempPlayers.length > 0) {
      for (let q = 0; q < tempPlayers.length; q++) {
        if (
          tempPlayers[q].hasTag("unlinked.essentials.crafting_table_activated")
        ) {
          let crafting_x = world.scoreboard
            .getObjective("unlinked.essentials.crafting_table_x")
            .getScore(tempPlayers[q]);
          let crafting_y = world.scoreboard
            .getObjective("unlinked.essentials.crafting_table_y")
            .getScore(tempPlayers[q]);
          let crafting_z = world.scoreboard
            .getObjective("unlinked.essentials.crafting_table_z")
            .getScore(tempPlayers[q]);
          if (
            Math.abs(
              crafting_x +
                crafting_y +
                crafting_z -
                (tempPlayers[q].location.x +
                  tempPlayers[q].location.y +
                  tempPlayers[q].location.z)
            ) > 20
          ) {
            if (
              Math.abs(
                crafting_x +
                  crafting_y +
                  crafting_z -
                  (tempPlayers[q].location.x +
                    tempPlayers[q].location.y +
                    tempPlayers[q].location.z)
              ) < 2000
            ) {
              tempPlayers[q].runCommandAsync(
                `/execute if block ${crafting_x} ${crafting_y} ${crafting_z} crafting_table run setblock ${crafting_x} ${crafting_y} ${crafting_z} air`
              );
            }
          }
        }
        if (
          tempPlayers[q].hasTag("unlinked.essentials.ender_chest_activated")
        ) {
          let crafting_x = world.scoreboard
            .getObjective("unlinked.essentials.ender_chest_x")
            .getScore(tempPlayers[q]);
          let crafting_y = world.scoreboard
            .getObjective("unlinked.essentials.ender_chest_y")
            .getScore(tempPlayers[q]);
          let crafting_z = world.scoreboard
            .getObjective("unlinked.essentials.ender_chest_z")
            .getScore(tempPlayers[q]);
          if (
            Math.abs(
              crafting_x +
                crafting_y +
                crafting_z -
                (tempPlayers[q].location.x +
                  tempPlayers[q].location.y +
                  tempPlayers[q].location.z)
            ) > 20
          ) {
            if (
              Math.abs(
                crafting_x +
                  crafting_y +
                  crafting_z -
                  (tempPlayers[q].location.x +
                    tempPlayers[q].location.y +
                    tempPlayers[q].location.z)
              ) < 2000
            ) {
              tempPlayers[q].runCommandAsync(
                `/execute if block ${crafting_x} ${crafting_y} ${crafting_z} ender_chest run setblock ${crafting_x} ${crafting_y} ${crafting_z} air`
              );
            }
          }
        }
        if (tempPlayers[q].hasTag("unlinked.essentials.anvil_activated")) {
          let crafting_x = world.scoreboard
            .getObjective("unlinked.essentials.anvil_x")
            .getScore(tempPlayers[q]);
          let crafting_y = world.scoreboard
            .getObjective("unlinked.essentials.anvil_y")
            .getScore(tempPlayers[q]);
          let crafting_z = world.scoreboard
            .getObjective("unlinked.essentials.anvil_z")
            .getScore(tempPlayers[q]);
          if (
            Math.abs(
              crafting_x +
                crafting_y +
                crafting_z -
                (tempPlayers[q].location.x +
                  tempPlayers[q].location.y +
                  tempPlayers[q].location.z)
            ) > 20
          ) {
            if (
              Math.abs(
                crafting_x +
                  crafting_y +
                  crafting_z -
                  (tempPlayers[q].location.x +
                    tempPlayers[q].location.y +
                    tempPlayers[q].location.z)
              ) < 2000
            ) {
              tempPlayers[q].runCommandAsync(
                `/execute if block ${crafting_x} ${crafting_y} ${crafting_z} damaged_anvil run setblock ${crafting_x} ${crafting_y} ${crafting_z} air`
              );
            }
          }
        }
        if (tempPlayers[q].hasTag("unlinked.essentials.furnace_activated")) {
          let crafting_x = world.scoreboard
            .getObjective("unlinked.essentials.furnace_x")
            .getScore(tempPlayers[q]);
          let crafting_y = world.scoreboard
            .getObjective("unlinked.essentials.furnace_y")
            .getScore(tempPlayers[q]);
          let crafting_z = world.scoreboard
            .getObjective("unlinked.essentials.furnace_z")
            .getScore(tempPlayers[q]);
          if (
            Math.abs(
              crafting_x +
                crafting_y +
                crafting_z -
                (tempPlayers[q].location.x +
                  tempPlayers[q].location.y +
                  tempPlayers[q].location.z)
            ) > 20
          ) {
            if (
              Math.abs(
                crafting_x +
                  crafting_y +
                  crafting_z -
                  (tempPlayers[q].location.x +
                    tempPlayers[q].location.y +
                    tempPlayers[q].location.z)
              ) < 2000
            ) {
              tempPlayers[q].runCommandAsync(
                `/execute if block ${crafting_x} ${crafting_y} ${crafting_z} furnace run setblock ${crafting_x} ${crafting_y} ${crafting_z} air`
              );
            }
          }
        }
      }
    }
  }
}, 20);

system.runInterval(() => {
  if (players != null) {
    if (players.length > 0) {
      for (let i = 0; i < players.length; i++) {
        if (players[i].isValid()) {
          if (players[i].hasTag("unlinked.essentials.mining_helmet")) {
            if (
              world.scoreboard.getObjective("ulkd_ess_mining_helmet_x") == null
            ) {
              world.scoreboard.addObjective("ulkd_ess_mining_helmet_x");
              world.scoreboard.addObjective("ulkd_ess_mining_helmet_y");
              world.scoreboard.addObjective("ulkd_ess_mining_helmet_z");
            }
            let miningScoreboardX = world.scoreboard.getObjective(
              "ulkd_ess_mining_helmet_x"
            );
            let miningScoreboardY = world.scoreboard.getObjective(
              "ulkd_ess_mining_helmet_y"
            );
            let miningScoreboardZ = world.scoreboard.getObjective(
              "ulkd_ess_mining_helmet_z"
            );
            let viewDir = players[i].getViewDirection();
            let currentPos = players[i].location;
            for (
              let t = 0;
              t < miningScoreboardX.getParticipants().length;
              t++
            ) {
              let correctedPlayerID = miningScoreboardX
                .getParticipants()
                [t].displayName.split("_");
              if (correctedPlayerID[0] == players[i].id) {
                let nukeX = miningScoreboardX.getScore(
                  miningScoreboardX.getParticipants()[t].displayName
                );
                let nukeY = miningScoreboardY.getScore(
                  miningScoreboardX.getParticipants()[t].displayName
                );
                let nukeZ = miningScoreboardZ.getScore(
                  miningScoreboardX.getParticipants()[t].displayName
                );
                players[i].runCommandAsync(
                  `fill ${nukeX} ${nukeY} ${nukeZ} ${nukeX} ${nukeY} ${nukeZ} air replace light_block`
                );
              }
            }
            for (let u = 0; u < 31; u += 3) {
              let stepX = Math.floor(viewDir.x * u + currentPos.x);
              let stepY = Math.floor(viewDir.y * u + currentPos.y + 1);
              let stepZ = Math.floor(viewDir.z * u + currentPos.z);
              miningScoreboardX.setScore(`${players[i].id}_${u}`, stepX);
              miningScoreboardY.setScore(`${players[i].id}_${u}`, stepY);
              miningScoreboardZ.setScore(`${players[i].id}_${u}`, stepZ);
              players[i].runCommandAsync(
                `fill ${stepX} ${stepY} ${stepZ} ${stepX} ${stepY} ${stepZ} light_block["block_light_level"=15] replace air`
              );
              players[i].runCommandAsync(
                `fill ${stepX} ${stepY} ${stepZ} ${stepX} ${stepY} ${stepZ} light_block["block_light_level"=15] replace water`
              );
            }
          }
        }
      }
    }
  }
}, 2);

system.runInterval(() => {
  if (players == null) {
    players = world.getPlayers();
  }
  if (players != null) {
    if (players.length > 0) {
      for (let i = 0; i < players.length; i++) {
        if (players[i].isValid()) {
          if (!players[i].hasTag("unlinked.essentials.guidebook")) {
            if (
              players[i].getComponent("inventory").container.emptySlotsCount > 0
            ) {
              players[i].runCommandAsync(
                "/function unlinked/essentials/giveGuidebook"
              );
            }
          }
          if (world.getDynamicProperty("ess:chunks") != false) {
            if (players[i].hasTag("unlinked.essentials.chunks")) {
              let currentX = Math.floor(players[i].location.x / 16) * 16;
              let currentY = Math.floor(players[i].location.y);
              let currentZ = Math.floor(players[i].location.z / 16) * 16;

              let x_unit = (currentX / 16) >>> 0;
              let z_unit = (currentZ / 16) >>> 0;
              let seed = umul32_lo(x_unit, 0x1f1f1f1f) ^ z_unit;
              let mt = new MersenneTwister(seed);
              let n = mt.random_int();
              let o = n % 10 == 0;

              if (o == true) {
                players[i].runCommandAsync(
                  `particle ulkd_ess:essentials16g ${
                    currentX + 16
                  }.0 ${currentY}.0 ${currentZ}.0`
                );
                players[i].runCommandAsync(
                  `particle ulkd_ess:essentials17g ${
                    currentX + 16
                  }.0 ${currentY}.0 ${currentZ}.0`
                );
                players[i].runCommandAsync(
                  `particle ulkd_ess:essentials18g ${
                    currentX + 16
                  }.0 ${currentY}.0 ${currentZ}.0`
                );
                players[i].runCommandAsync(
                  `particle ulkd_ess:essentials19g ${
                    currentX + 16
                  }.0 ${currentY}.0 ${currentZ}.0`
                );
              } else {
                players[i].runCommandAsync(
                  `particle ulkd_ess:essentials16 ${
                    currentX + 16
                  }.0 ${currentY}.0 ${currentZ}.0`
                );
                players[i].runCommandAsync(
                  `particle ulkd_ess:essentials17 ${
                    currentX + 16
                  }.0 ${currentY}.0 ${currentZ}.0`
                );
                players[i].runCommandAsync(
                  `particle ulkd_ess:essentials18 ${
                    currentX + 16
                  }.0 ${currentY}.0 ${currentZ}.0`
                );
                players[i].runCommandAsync(
                  `particle ulkd_ess:essentials19 ${
                    currentX + 16
                  }.0 ${currentY}.0 ${currentZ}.0`
                );
              }
            }
          }
          if (world.getDynamicProperty("ess:automap") != false) {
            if (players[i].hasTag("unlinked.essentials.automap")) {
              if (
                world.scoreboard.getObjective(
                  "unlinked.essentials.automap_x"
                ) != null
              ) {
                let mapX = Math.round(players[i].location.x / 128) * 128;
                let mapZ = Math.round(players[i].location.z / 128) * 128;
                if (
                  world.scoreboard
                    .getObjective("unlinked.essentials.automap_x")
                    .hasParticipant(players[i]) == true
                ) {
                  let storedX = world.scoreboard
                    .getObjective("unlinked.essentials.automap_x")
                    .getScore(players[i]);
                  let storedZ = world.scoreboard
                    .getObjective("unlinked.essentials.automap_z")
                    .getScore(players[i]);
                  if (storedX != mapX || storedZ != mapZ) {
                    if (
                      players[i]
                        .getComponent("equippable")
                        .getEquipment("Offhand") != null
                    ) {
                      if (
                        players[i]
                          .getComponent("equippable")
                          .getEquipment("Offhand").typeId ==
                        "minecraft:filled_map"
                      ) {
                        players[i]
                          .getComponent("equippable")
                          .setEquipment("Offhand", null);
                        players[i].runCommandAsync(`/give @s filled_map 1 2`);
                        let inventory =
                          players[i].getComponent("inventory").container;
                        if (inventory.emptySlotsCount > 0) {
                          system.runTimeout(() => {
                            for (let n = 0; n < 36; n++) {
                              if (inventory.getItem(n) != null) {
                                if (
                                  inventory.getItem(n).typeId ==
                                  "minecraft:filled_map"
                                ) {
                                  let newMap = inventory.getItem(n);
                                  inventory.setItem(n, null);
                                  system.runTimeout(
                                    () =>
                                      players[i]
                                        .getComponent("equippable")
                                        .setEquipment("Offhand", newMap),
                                    1
                                  );
                                  n = 36;
                                }
                              }
                            }
                          }, 1);
                        } else {
                          let cachedSlot = inventory.getItem(35);
                          inventory.setItem(35, null);
                          system.runTimeout(() => {
                            for (let n = 0; n < 36; n++) {
                              if (inventory.getItem(n) != null) {
                                if (
                                  inventory.getItem(n).typeId ==
                                  "minecraft:filled_map"
                                ) {
                                  let newMap = inventory.getItem(n);
                                  inventory.setItem(n, null);
                                  system.runTimeout(
                                    () =>
                                      players[i]
                                        .getComponent("equippable")
                                        .setEquipment("Offhand", newMap),
                                    1
                                  );
                                  n = 36;
                                }
                              }
                            }
                            system.runTimeout(
                              () => inventory.setItem(35, cachedSlot),
                              2
                            );
                          }, 1);
                        }
                      }
                    }

                    if (
                      players[i]
                        .getComponent("equippable")
                        .getEquipment("Mainhand") != null
                    ) {
                      if (
                        players[i]
                          .getComponent("equippable")
                          .getEquipment("Mainhand").typeId ==
                        "minecraft:filled_map"
                      ) {
                        players[i]
                          .getComponent("equippable")
                          .setEquipment("Mainhand", null);
                        players[i].runCommandAsync(`/give @s filled_map 1 2`);
                        let inventory =
                          players[i].getComponent("inventory").container;
                        system.runTimeout(() => {
                          for (let n = 0; n < 36; n++) {
                            if (inventory.getItem(n) != null) {
                              if (
                                inventory.getItem(n).typeId ==
                                "minecraft:filled_map"
                              ) {
                                let newMap = inventory.getItem(n);
                                inventory.setItem(n, null);
                                system.runTimeout(
                                  () =>
                                    players[i]
                                      .getComponent("equippable")
                                      .setEquipment("Mainhand", newMap),
                                  1
                                );
                                n = 36;
                              }
                            }
                          }
                        }, 1);
                      }
                    }
                    world.scoreboard
                      .getObjective("unlinked.essentials.automap_x")
                      .setScore(players[i], mapX);
                    world.scoreboard
                      .getObjective("unlinked.essentials.automap_z")
                      .setScore(players[i], mapZ);
                  }
                } else {
                  world.scoreboard
                    .getObjective("unlinked.essentials.automap_x")
                    .setScore(players[i], mapX);
                  world.scoreboard
                    .getObjective("unlinked.essentials.automap_z")
                    .setScore(players[i], mapZ);
                }
              } else {
                world.scoreboard.addObjective("unlinked.essentials.automap_x");
                world.scoreboard.addObjective("unlinked.essentials.automap_z");
              }
            }
          }
          players[i].runCommandAsync(
            "/function unlinked/essentials/undoMiningHelmet"
          );
          if (!players[i].hasTag("unlinked.essentials.mining_helmet")) {
            if (
              world.scoreboard.getObjective("ulkd_ess_mining_helmet_x") == null
            ) {
              world.scoreboard.addObjective("ulkd_ess_mining_helmet_x");
              world.scoreboard.addObjective("ulkd_ess_mining_helmet_y");
              world.scoreboard.addObjective("ulkd_ess_mining_helmet_z");
            }
            let miningScoreboardX = world.scoreboard.getObjective(
              "ulkd_ess_mining_helmet_x"
            );
            let miningScoreboardY = world.scoreboard.getObjective(
              "ulkd_ess_mining_helmet_y"
            );
            let miningScoreboardZ = world.scoreboard.getObjective(
              "ulkd_ess_mining_helmet_z"
            );
            for (
              let t = 0;
              t < miningScoreboardX.getParticipants().length;
              t++
            ) {
              let correctedPlayerID = miningScoreboardX
                .getParticipants()
                [t].displayName.split("_");
              if (correctedPlayerID[0] == players[i].id) {
                let nukeX = miningScoreboardX.getScore(
                  miningScoreboardX.getParticipants()[t].displayName
                );
                let nukeY = miningScoreboardY.getScore(
                  miningScoreboardX.getParticipants()[t].displayName
                );
                let nukeZ = miningScoreboardZ.getScore(
                  miningScoreboardX.getParticipants()[t].displayName
                );
                players[i].runCommandAsync(
                  `fill ${nukeX} ${nukeY} ${nukeZ} ${nukeX} ${nukeY} ${nukeZ} air replace light_block`
                );
              }
            }
          }
        }
      }
    } else {
      players = world.getPlayers();
    }
  }
  if (waypoint != null) {
    if (waypoint.length > 0) {
      for (let j = 0; j < waypoint.length; j++) {
        if (waypoint[j] != null) {
          if (waypoint[j].getComponent("inventory") != null) {
            let slotCounter = 0;
            for (let k = 0; k < 26; k++) {
              if (
                waypoint[j].getComponent("inventory").container.getItem(k) ==
                null
              ) {
                slotCounter++;
              }
            }
            if (
              slotCounter == 26 &&
              waypoint[j].getComponent("inventory").container.emptySlotsCount !=
                50
            ) {
              for (let k = 27; k < 50; k++) {
                waypoint[j]
                  .getComponent("inventory")
                  .container.moveItem(
                    k,
                    k - 27,
                    waypoint[j].getComponent("inventory").container
                  );
              }
            }
            if (
              waypoint[j].getComponent("inventory").container.emptySlotsCount ==
              50
            ) {
              waypoint[j].triggerEvent("instant_despawn");
              waypoint.splice(j, 1);
              j--;
            }
          }
        } else {
          waypoint.splice(j, 1);
          j--;
        }
      }
    }
  }
}, 10);
world.beforeEvents.playerBreakBlock.subscribe((event) => {
  let breakingTool = event.itemStack;
  let brokenBlock = event.block.permutation;
  if (event.player.isSneaking == false) {
    if (world.getDynamicProperty("ess:recrop") != false) {
      if (!event.player.hasTag("unlinked.essentials.recrop")) {
        if (brokenBlock.matches("carrots")) {
          system.run(() => {
            event.player.runCommandAsync(
              `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /function unlinked/essentials/doCarrot`
            );
          });
        }
        if (brokenBlock.matches("wheat")) {
          system.run(() => {
            event.player.runCommandAsync(
              `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /function unlinked/essentials/doWheat`
            );
          });
        }
        if (brokenBlock.matches("beetroot")) {
          system.run(() => {
            event.player.runCommandAsync(
              `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /function unlinked/essentials/doBeetroot`
            );
          });
        }
        if (brokenBlock.matches("potatoes")) {
          system.run(() => {
            event.player.runCommandAsync(
              `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /function unlinked/essentials/doPotato`
            );
          });
        }
        if (brokenBlock.matches("nether_wart")) {
          system.run(() => {
            event.player.runCommandAsync(
              `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /function unlinked/essentials/doNetherWart`
            );
          });
        }
        const droppedItem = brokenBlock.getItemStack();
        if (droppedItem) {
          if (
            event.player.hasTag(
              "darkosto_elemental_crops:spawn_guidebook_given"
            )
          ) {
            //elemental crops support
            if (
              droppedItem.typeId ==
              "darkosto_elemental_crops:water_essence_crop"
            ) {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:water_seeds,quantity=1..}] run setblock ~ ~ ~ darkosto_elemental_crops:water_essence_crop`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:water_seeds,quantity=1..}] run clear @s darkosto_elemental_crops:water_seeds 0 1`
                );
              });
            }
            if (
              droppedItem.typeId == "darkosto_elemental_crops:wind_essence_crop"
            ) {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:wind_seeds,quantity=1..}] run setblock ~ ~ ~ darkosto_elemental_crops:wind_essence_crop`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:wind_seeds,quantity=1..}] run clear @s darkosto_elemental_crops:wind_seeds 0 1`
                );
              });
            }
            if (
              droppedItem.typeId == "darkosto_elemental_crops:fire_essence_crop"
            ) {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:fire_seeds,quantity=1..}] run setblock ~ ~ ~ darkosto_elemental_crops:fire_essence_crop`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:fire_seeds,quantity=1..}] run clear @s darkosto_elemental_crops:fire_seeds 0 1`
                );
              });
            }
            if (
              droppedItem.typeId ==
              "darkosto_elemental_crops:ender_essence_crop"
            ) {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:ender_seeds,quantity=1..}] run setblock ~ ~ ~ darkosto_elemental_crops:ender_essence_crop`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:ender_seeds,quantity=1..}] run clear @s darkosto_elemental_crops:ender_seeds 0 1`
                );
              });
            }
            if (
              droppedItem.typeId ==
              "darkosto_elemental_crops:earth_essence_crop"
            ) {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:earth_seeds,quantity=1..}] run setblock ~ ~ ~ darkosto_elemental_crops:earth_essence_crop`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=darkosto_elemental_crops:earth_seeds,quantity=1..}] run clear @s darkosto_elemental_crops:earth_seeds 0 1`
                );
              });
            }
          }
          if (event.player.hasTag("xp_furniture_guide_book_given")) {
            //xp games furniture crops support
            if (droppedItem.typeId == "xp_furniture:bell_pepper_block") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:bell_pepper_seed,quantity=1..}] run setblock ~ ~ ~ xp_furniture:bell_pepper_block`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:bell_pepper_seed,quantity=1..}] run clear @s xp_furniture:bell_pepper_seed 0 1`
                );
              });
            }
            if (droppedItem.typeId == "xp_furniture:cabbage_block") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:cabbage_seed,quantity=1..}] run setblock ~ ~ ~ xp_furniture:cabbage_block`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:cabbage_seed,quantity=1..}] run clear @s xp_furniture:cabbage_seed 0 1`
                );
              });
            }
            if (droppedItem.typeId == "xp_furniture:corn_block") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:corn_seed,quantity=1..}] run setblock ~ ~ ~ xp_furniture:corn_block`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:corn_seed,quantity=1..}] run clear @s xp_furniture:corn_seed 0 1`
                );
              });
            }
            if (droppedItem.typeId == "xp_furniture:eggplant_block") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:eggplant_seed,quantity=1..}] run setblock ~ ~ ~ xp_furniture:eggplant_block`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:eggplant_seed,quantity=1..}] run clear @s xp_furniture:eggplant_seed 0 1`
                );
              });
            }
            if (droppedItem.typeId == "xp_furniture:tomato_block") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:tomato_seed,quantity=1..}] run setblock ~ ~ ~ xp_furniture:tomato_block`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=xp_furniture:tomato_seed,quantity=1..}] run clear @s xp_furniture:tomato_seed 0 1`
                );
              });
            }
          }
          //podcrash farming
          {
            if (droppedItem.typeId == "pod_farm:bean_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:bean_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run setblock ~ ~ ~ pod_farm:bean_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:bean_seeds,quantity=1..}] run clear @s pod_farm:bean_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:bell_pepper_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:bell_pepper_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run setblock ~ ~ ~ pod_farm:bell_pepper_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:bell_pepper_seeds,quantity=1..}] run clear @s pod_farm:bell_pepper_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:broccoli_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:broccoli_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:broccoli_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:broccoli_seeds,quantity=1..}] run clear @s pod_farm:broccoli_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:cauliflower_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:cauliflower_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:cauliflower_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:cauliflower_seeds,quantity=1..}] run clear @s pod_farm:cauliflower_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:chili_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:chili_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run setblock ~ ~ ~ pod_farm:chili_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:chili_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run clear @s pod_farm:chili_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:corn_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:corn_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run setblock ~ ~ ~ pod_farm:corn_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:corn_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run clear @s pod_farm:corn_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:cotton_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:cotton_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:cotton_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:cotton_seeds,quantity=1..}] run clear @s pod_farm:cotton_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:cucumber_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:cucumber_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run setblock ~ ~ ~ pod_farm:cucumber_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:cucumber_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run clear @s pod_farm:cucumber_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:ginger_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:ginger_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:ginger_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:ginger_seeds,quantity=1..}] run clear @s pod_farm:ginger_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:kohlrabi_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:kohlrabi_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:kohlrabi_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:kohlrabi_seeds,quantity=1..}] run clear @s pod_farm:kohlrabi_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:lettuce_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:lettuce_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:lettuce_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:lettuce_seeds,quantity=1..}] run clear @s pod_farm:lettuce_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:oat_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:oat_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:oat_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:oat_seeds,quantity=1..}] run clear @s pod_farm:oat_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:onion_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:onion_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:onion_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:onion_seeds,quantity=1..}] run clear @s pod_farm:onion_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:peanut_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:peanut_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:peanut_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:peanut_seeds,quantity=1..}] run clear @s pod_farm:peanut_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:rhubarb_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:rhubarb_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:rhubarb_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:rhubarb_seeds,quantity=1..}] run clear @s pod_farm:rhubarb_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:rice_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:rice_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:rice_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:rice_seeds,quantity=1..}] run clear @s pod_farm:rice_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:spinach_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:spinach_seeds,quantity=1..}] run setblock ~ ~ ~ pod_farm:spinach_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:spinach_seeds,quantity=1..}] run clear @s pod_farm:spinach_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:tomato_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:tomato_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run setblock ~ ~ ~ pod_farm:tomato_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:tomato_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run clear @s pod_farm:tomato_seeds 0 1`
                );
              });
            }
            if (droppedItem.typeId == "pod_farm:vanilla_plant") {
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:vanilla_seeds,quantity=1..}] if block ~ ~-1 ~ farmland run setblock ~ ~ ~ pod_farm:vanilla_plant`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=pod_farm:vanilla_seeds,quantity=1..}] run clear @s pod_farm:vanilla_seeds 0 1`
                );
              });
            }
          }
          //better_on_bedrock farming
          {
            const crops = [
              ["better_on_bedrock:barley_crop", "better_on_bedrock:barley_seed"],
              ["better_on_bedrock:cabbage_crop", "better_on_bedrock:cabbage_seed"],
              ["better_on_bedrock:eggplant_crop", "better_on_bedrock:eggplant_seed"],
              ["better_on_bedrock:healthy_carrot", "better_on_bedrock:wild_carrot"],
              ["better_on_bedrock:onion_crop", "better_on_bedrock:onion_seed"],
              ["better_on_bedrock:tomato_crop", "better_on_bedrock:tomato_seed"]
            ]
            const typeId = brokenBlock.typeId;
            for (const [crop, seed] of crops) {
              if (typeId == crop) {
                system.run(() => {
                  event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=${seed},quantity=1..}] if block ~ ~-1 ~ farmland run setblock ~ ~ ~ ${crop}`
                  );
                  event.player.runCommandAsync(
                    `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run /execute as @s[hasitem={item=${seed},quantity=1..}] run clear @s ${seed} 0 1`
                  );
                });
              }
            }
          }
        }
      }
    }
  }
  if (breakingTool != null) {
    if (
      breakingTool?.typeId.includes("pickaxe") ||
      breakingTool.typeId == "gf_wu:omni_tool" ||
      breakingTool.hasTag("minecraft:is_pickaxe")
    ) {
      if (world.getDynamicProperty("ess:spawners") != false) {
        if (!event.player.hasTag("unlinked.essentials.spawners")) {
          if (
            (breakingTool?.typeId.includes("diamond") ||
              breakingTool?.typeId.includes("netherite")) &&
            event.itemStack
              .getComponent("enchantable")
              .hasEnchantment("silk_touch")
          ) {
            if (event.block.permutation.matches("mob_spawner")) {
              event.cancel = true;
              let test = event.block.getItemStack(1, true);
              system.run(() => {
                event.player.runCommandAsync(
                  `setblock ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} air`
                );
              });
              system.run(() => {
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run kill @e[type=xp_orb,r=3]`
                );
              });
              system.run(() => {
                event.player.dimension.spawnItem(
                  test,
                  Vec3.from(event.block.location).add(0.5, 0, 0.5)
                );
              });
              system.run(() => {
                if (
                  event.itemStack.getComponent("durability").maxDurability >
                  event.itemStack.getComponent("durability").damage + 20
                ) {
                  let damagedTool = event.itemStack;
                  damagedTool.getComponent("durability").damage =
                    damagedTool.getComponent("durability").damage + 20;
                  event.player
                    .getComponent("equippable")
                    .setEquipment("Mainhand", damagedTool);
                } else {
                  event.player
                    .getComponent("equippable")
                    .setEquipment("Mainhand", null);
                  event.player.runCommandAsync(`/playsound random.break @s`);
                }
              });
            }
            if (event.block.permutation.matches("trial_spawner")) {
              event.cancel = true;
              let test = event.block.getItemStack(1, true);
              system.run(() => {
                event.player.runCommandAsync(
                  `setblock ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} air`
                );
                event.player.runCommandAsync(
                  `execute positioned ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} run kill @e[type=xp_orb,r=3]`
                );
                event.player.dimension.spawnItem(
                  test,
                  Vec3.from(event.block.location).add(0.5, 0, 0.5)
                );
                if (
                  event.itemStack.getComponent("durability").maxDurability >
                  event.itemStack.getComponent("durability").damage + 20
                ) {
                  let damagedTool = event.itemStack;
                  damagedTool.getComponent("durability").damage =
                    damagedTool.getComponent("durability").damage + 20;
                  event.player
                    .getComponent("equippable")
                    .setEquipment("Mainhand", damagedTool);
                } else {
                  event.player
                    .getComponent("equippable")
                    .setEquipment("Mainhand", null);
                  event.player.runCommandAsync(`/playsound random.break @s`);
                }
              });
            }
            if (event.block.typeId == "minecraft:budding_amethyst") {
              event.cancel = true;
              let test = event.block.getItemStack(1, true);
              system.run(() => {
                event.player.runCommandAsync(
                  `setblock ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} air`
                );
              });
              system.run(() => {
                event.player.dimension.spawnItem(
                  test,
                  Vec3.from(event.block.location).add(0.5, 0, 0.5)
                );
              });
              system.run(() => {
                if (
                  event.itemStack.getComponent("durability").maxDurability >
                  event.itemStack.getComponent("durability").damage + 20
                ) {
                  let damagedTool = event.itemStack;
                  damagedTool.getComponent("durability").damage =
                    damagedTool.getComponent("durability").damage + 20;
                  event.player
                    .getComponent("equippable")
                    .setEquipment("Mainhand", damagedTool);
                } else {
                  event.player
                    .getComponent("equippable")
                    .setEquipment("Mainhand", null);
                  event.player.runCommandAsync(`/playsound random.break @s`);
                }
              });
            }
          }
        }
      }
    }
  }

  if (event.block.typeId == "minecraft:crafting_table") {
    let storedBlockOwner = world.scoreboard
      .getObjective("unlinked.essentials.crafting_table_x")
      .getParticipants();
    let xMatch = false;
    let yMatch = false;
    let zMatch = false;
    if (storedBlockOwner != null) {
      if (storedBlockOwner.length > 0) {
        for (let i = 0; i < storedBlockOwner.length; i++) {
          let storedBlockX = world.scoreboard
            .getObjective("unlinked.essentials.crafting_table_x")
            .getScore(storedBlockOwner[i]);
          let storedBlockY = world.scoreboard
            .getObjective("unlinked.essentials.crafting_table_y")
            .getScore(storedBlockOwner[i]);
          let storedBlockZ = world.scoreboard
            .getObjective("unlinked.essentials.crafting_table_z")
            .getScore(storedBlockOwner[i]);
          if (storedBlockX == Math.floor(event.block.location.x)) {
            xMatch = true;
          }
          if (storedBlockY == Math.floor(event.block.location.y)) {
            yMatch = true;
          }
          if (storedBlockZ == Math.floor(event.block.location.z)) {
            zMatch = true;
          }
        }
      }
    }
    if (xMatch == true && yMatch == true && zMatch == true) {
      event.cancel = true;
      system.runTimeout(() => {
        event.block.setType('minecraft:air');
      })
    }
  }
  if (event.block.typeId == "minecraft:furnace") {
    const objective = world.scoreboard.getObjective(
      "unlinked.essentials.furnace_x"
    );
    if (objective) {
      let storedBlockOwner = objective.getParticipants();
      let xMatch = false;
      let yMatch = false;
      let zMatch = false;
      if (storedBlockOwner != null) {
        if (storedBlockOwner.length > 0) {
          for (let i = 0; i < storedBlockOwner.length; i++) {
            let storedBlockX = world.scoreboard
              .getObjective("unlinked.essentials.furnace_x")
              .getScore(storedBlockOwner[i]);
            let storedBlockY = world.scoreboard
              .getObjective("unlinked.essentials.furnace_y")
              .getScore(storedBlockOwner[i]);
            let storedBlockZ = world.scoreboard
              .getObjective("unlinked.essentials.furnace_z")
              .getScore(storedBlockOwner[i]);
            if (storedBlockX == Math.floor(event.block.location.x)) {
              xMatch = true;
            }
            if (storedBlockY == Math.floor(event.block.location.y)) {
              yMatch = true;
            }
            if (storedBlockZ == Math.floor(event.block.location.z)) {
              zMatch = true;
            }
          }
        }
      }
      if (xMatch == true && yMatch == true && zMatch == true) {
        event.cancel = true;
        system.runTimeout(() => {
          event.block.setType('minecraft:air');
        })
      }
    }
  }
  if (event.block.typeId == "minecraft:ender_chest") {
    let storedBlockOwner = world.scoreboard
      .getObjective("unlinked.essentials.ender_chest_x")
      .getParticipants();
    let xMatch = false;
    let yMatch = false;
    let zMatch = false;
    if (storedBlockOwner != null) {
      if (storedBlockOwner.length > 0) {
        for (let i = 0; i < storedBlockOwner.length; i++) {
          let storedBlockX = world.scoreboard
            .getObjective("unlinked.essentials.ender_chest_x")
            .getScore(storedBlockOwner[i]);
          let storedBlockY = world.scoreboard
            .getObjective("unlinked.essentials.ender_chest_y")
            .getScore(storedBlockOwner[i]);
          let storedBlockZ = world.scoreboard
            .getObjective("unlinked.essentials.ender_chest_z")
            .getScore(storedBlockOwner[i]);
          if (storedBlockX == Math.floor(event.block.location.x)) {
            xMatch = true;
          }
          if (storedBlockY == Math.floor(event.block.location.y)) {
            yMatch = true;
          }
          if (storedBlockZ == Math.floor(event.block.location.z)) {
            zMatch = true;
          }
        }
      }
    }
    if (xMatch == true && yMatch == true && zMatch == true) {
      event.cancel = true;
      system.runTimeout(() => {
        event.block.setType('minecraft:air');
      })
    }
  }
  if (event.block.typeId == "minecraft:damaged_anvil") {
    let storedBlockOwner = world.scoreboard
      .getObjective("unlinked.essentials.anvil_x")
      .getParticipants();
    let xMatch = false;
    let yMatch = false;
    let zMatch = false;
    if (storedBlockOwner != null) {
      if (storedBlockOwner.length > 0) {
        for (let i = 0; i < storedBlockOwner.length; i++) {
          let storedBlockX = world.scoreboard
            .getObjective("unlinked.essentials.anvil_x")
            .getScore(storedBlockOwner[i]);
          let storedBlockY = world.scoreboard
            .getObjective("unlinked.essentials.anvil_y")
            .getScore(storedBlockOwner[i]);
          let storedBlockZ = world.scoreboard
            .getObjective("unlinked.essentials.anvil_z")
            .getScore(storedBlockOwner[i]);
          if (storedBlockX == Math.floor(event.block.location.x)) {
            xMatch = true;
          }
          if (storedBlockY == Math.floor(event.block.location.y)) {
            yMatch = true;
          }
          if (storedBlockZ == Math.floor(event.block.location.z)) {
            zMatch = true;
          }
        }
      }
    }
    if (xMatch == true && yMatch == true && zMatch == true) {
      event.cancel = true;
      system.runTimeout(() => {
        event.block.setType('minecraft:air');
      })
    }
  }
  if (event.block.typeId == "ulkd_ess:world.anchor") {
    if (world.getDynamicProperty("ulkd_world_anchors") > 0) {
      let currentCount = world.getDynamicProperty("ulkd_world_anchors");
      event.player.runCommandAsync(
        `tickingarea remove ${event.block.location.x} ${event.block.location.y} ${event.block.location.z}`
      );
      world.setDynamicProperty("ulkd_world_anchors", (currentCount -= 1));
      event.player.sendMessage("§cTicking area removed!");
    }
  }
  if (event.itemStack != null) {
    if (event.itemStack.typeId == "ulkd_ess:measuring_tape") {
      event.cancel = true;
    }
  }
});

world.beforeEvents.itemUseOn.subscribe(async (item) => {
  if (item.itemStack.typeId == "minecraft:bucket") {
    if (world.getDynamicProperty("ess:lava_reflow") != false) {
      if (item.source.hasTag("unlinked.essentials.lava_reflow")) {
        let currentDimension = world.getDimension(item.source.dimension.id);
        let originLocation = item.block.location;
        let count = 0;
        if (
          currentDimension.getBlock({
            x: originLocation.x,
            y: originLocation.y - 1,
            z: originLocation.z,
          }).typeId != "minecraft:lava"
        ) {
          if (
            currentDimension
              .getBlock({
                x: originLocation.x - 1,
                y: originLocation.y,
                z: originLocation.z,
              })
              .permutation.matches("minecraft:lava")
          ) {
            count++;
          }
          if (
            currentDimension
              .getBlock({
                x: originLocation.x + 1,
                y: originLocation.y,
                z: originLocation.z,
              })
              .permutation.matches("minecraft:lava")
          ) {
            count++;
          }
          if (
            currentDimension
              .getBlock({
                x: originLocation.x,
                y: originLocation.y,
                z: originLocation.z + 1,
              })
              .permutation.matches("minecraft:lava")
          ) {
            count++;
          }
          if (
            currentDimension
              .getBlock({
                x: originLocation.x,
                y: originLocation.y,
                z: originLocation.z - 1,
              })
              .permutation.matches("minecraft:lava")
          ) {
            count++;
          }
          if (
            currentDimension
              .getBlock({
                x: originLocation.x - 1,
                y: originLocation.y,
                z: originLocation.z - 1,
              })
              .permutation.matches("minecraft:lava")
          ) {
            count++;
          }
          if (
            currentDimension
              .getBlock({
                x: originLocation.x + 1,
                y: originLocation.y,
                z: originLocation.z - 1,
              })
              .permutation.matches("minecraft:lava")
          ) {
            count++;
          }
          if (
            currentDimension
              .getBlock({
                x: originLocation.x + 1,
                y: originLocation.y,
                z: originLocation.z + 1,
              })
              .permutation.matches("minecraft:lava")
          ) {
            count++;
          }
          if (
            currentDimension
              .getBlock({
                x: originLocation.x - 1,
                y: originLocation.y,
                z: originLocation.z + 1,
              })
              .permutation.matches("minecraft:lava")
          ) {
            count++;
          }
          if (count >= 2) {
            system.runTimeout(() => {
              system.run(() => {
                if (item.source != null) {
                  if (item.source.isValid()) {
                    item.source.runCommandAsync(
                      `setblock ${originLocation.x} ${originLocation.y} ${originLocation.z} lava`
                    );
                  }
                }
              });
            }, 20);
          }
        }
      }
    }
  }
  if (
    item.itemStack.typeId == "ulkd_ess:capture_cube" &&
    item.block.typeId == "minecraft:mob_spawner"
  ) {
    if (!world.getDynamicProperty("ess:change_mob_spawner")) {
      if (!EventUtils.debounce("Essentials.captureCube", item.source)) {
        item.source.sendMessage(
          "§cCapture Cubes are disabled in the Admin Remote (creative only item)"
        );
      }
      return;
    }
    let structureId = undefined;
    if (item.itemStack.getLore().length > 0) {
      for (let q = 0; q < item.itemStack.getLore().length; q++) {
        if (item.itemStack.getLore()[q].includes(`§r§bCapture Cube ID: `)) {
          structureId = item.itemStack
            .getLore()
            [q].replace(`§r§bCapture Cube ID: `, "");
          break;
        }
      }
    }
    if (!structureId) {
      return;
    }
    // Place the structure high in the sky
    await null;
    if (!world.structureManager.get(`unlinked_essentials:${structureId}`)) {
      return;
    }
    const place = {
      x: item.block.location.x,
      y: 300,
      z: item.block.location.z,
    };
    world.structureManager.place(
      `unlinked_essentials:${structureId}`,
      item.source.dimension,
      place,
      { includeBlocks: false, includeEntities: true }
    );
    // Find the entity
    const entities = item.source.dimension.getEntities({
      location: place,
      closest: 1,
    });
    if (entities.length === 1) {
      if (entities[0].typeId.startsWith("minecraft:")) {
        const spawnEggId =
          "minecraft:" + entities[0].typeId.substring(10) + "_spawn_egg";
        try {
          const itemType = ItemTypes.get(spawnEggId);
          const is = new ItemStack(itemType, 1);
          const eq = item.source.getComponent("equippable");
          const mainhand = eq.getEquipment("Mainhand");
          if (mainhand != null) {
            eq.setEquipment("Mainhand", is);
            world.structureManager.delete(`unlinked_essentials:${structureId}`);
          }
          entities[0].remove();
          return;
        } catch (e) {}
      }
      entities[0].remove();
    }
  }
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  if (event.block.typeId == "ulkd_ess:world.anchor") {
    if (world.getDynamicProperty("ulkd_world_anchors") == null) {
      world.setDynamicProperty("ulkd_world_anchors", 0);
    }
    if (world.getDynamicProperty("ulkd_world_anchors") < 10) {
      let currentCount = world.getDynamicProperty("ulkd_world_anchors");
      event.player.runCommandAsync(
        `/tickingarea add ${event.block.location.x - 10} ${
          event.block.location.y - 10
        } ${event.block.location.z} ${event.block.location.x + 10} ${
          event.block.location.y + 20
        } ${event.block.location.z + 10} ulkd_anchor${currentCount} true`
      );
      world.setDynamicProperty("ulkd_world_anchors", (currentCount += 1));
      event.player.sendMessage("§aTicking area created!");
      event.player.runCommandAsync(
        `/particle ulkd_ess:essentials26 ${event.block.location.x} ${
          event.block.location.y + 10
        } ${event.block.location.z + 10}`
      );
      event.player.runCommandAsync(
        `/particle ulkd_ess:essentials26 ${event.block.location.x} ${
          event.block.location.y + 10
        } ${event.block.location.z - 10}`
      );
      event.player.runCommandAsync(
        `/particle ulkd_ess:essentials27 ${event.block.location.x + 10} ${
          event.block.location.y + 10
        } ${event.block.location.z}`
      );
      event.player.runCommandAsync(
        `/particle ulkd_ess:essentials27 ${event.block.location.x - 10} ${
          event.block.location.y + 10
        } ${event.block.location.z}`
      );
      event.player.runCommandAsync(
        `/particle ulkd_ess:essentials28 ${event.block.location.x} ${
          event.block.location.y + 0.1
        } ${event.block.location.z}`
      );
      event.player.runCommandAsync(
        `/particle ulkd_ess:essentials28 ${event.block.location.x} ${
          event.block.location.y + 20
        } ${event.block.location.z}`
      );
    } else {
      event.player.sendMessage(
        "§cThere can only be 10 world anchors active at once. This limit has already been reached. Remove old anchors to place this one."
      );
      event.player.runCommandAsync(
        `setblock ${event.block.location.x} ${event.block.location.y} ${event.block.location.z} air destroy`
      );
    }
  }
});

world.afterEvents.entityHitBlock.subscribe((event) => {
  if (event.damagingEntity.typeId == "minecraft:player") {
    if (
      event.damagingEntity
        .getComponent("equippable")
        .getEquipment("Mainhand") != null
    ) {
      if (
        event.damagingEntity.getComponent("equippable").getEquipment("Mainhand")
          .typeId == "ulkd_ess:measuring_tape"
      ) {
        if (world.getDynamicProperty("ess:measuring_tape") === false) {
          event.damagingEntity.sendMessage(
            "§cMeasuring tape is disabled in the Admin Remote (creative only item)"
          );
          return;
        }
        if (world.scoreboard.getObjective("measuring_scoreboard_x") == null) {
          world.scoreboard.addObjective("measuring_scoreboard_x");
          world.scoreboard.addObjective("measuring_scoreboard_y");
          world.scoreboard.addObjective("measuring_scoreboard_z");
        }
        world.scoreboard
          .getObjective("measuring_scoreboard_x")
          .setScore(
            event.damagingEntity.id,
            Math.round(event.hitBlock.location.x)
          );
        world.scoreboard
          .getObjective("measuring_scoreboard_y")
          .setScore(
            event.damagingEntity.id,
            Math.round(event.hitBlock.location.y + 1)
          );
        world.scoreboard
          .getObjective("measuring_scoreboard_z")
          .setScore(
            event.damagingEntity.id,
            Math.round(event.hitBlock.location.z)
          );
        event.damagingEntity.runCommandAsync(
          `particle ulkd_ess:essentials25 ${event.hitBlock.location.x} ${
            event.hitBlock.location.y + 1
          } ${event.hitBlock.location.z}`
        );
        event.damagingEntity.sendMessage("§6Measurement origin set");
      }
    }
  }
  if (event.hitBlock.typeId == "ulkd_ess:world.anchor") {
    event.damagingEntity.runCommandAsync(
      `/particle ulkd_ess:essentials26 ${event.hitBlock.location.x} ${
        event.hitBlock.location.y + 10
      } ${event.hitBlock.location.z + 10}`
    );
    event.damagingEntity.runCommandAsync(
      `/particle ulkd_ess:essentials26 ${event.hitBlock.location.x} ${
        event.hitBlock.location.y + 10
      } ${event.hitBlock.location.z - 10}`
    );
    event.damagingEntity.runCommandAsync(
      `/particle ulkd_ess:essentials27 ${event.hitBlock.location.x + 10} ${
        event.hitBlock.location.y + 10
      } ${event.hitBlock.location.z}`
    );
    event.damagingEntity.runCommandAsync(
      `/particle ulkd_ess:essentials27 ${event.hitBlock.location.x - 10} ${
        event.hitBlock.location.y + 10
      } ${event.hitBlock.location.z}`
    );
    event.damagingEntity.runCommandAsync(
      `/particle ulkd_ess:essentials28 ${event.hitBlock.location.x} ${
        event.hitBlock.location.y + 0.1
      } ${event.hitBlock.location.z}`
    );
    event.damagingEntity.runCommandAsync(
      `/particle ulkd_ess:essentials28 ${event.hitBlock.location.x} ${
        event.hitBlock.location.y + 20
      } ${event.hitBlock.location.z}`
    );
  }
});
world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  players = world.getPlayers();

  // Give Essentials Guidebook on Spawn
  system.runTimeout(() => {
    if (player.isValid()) {
        player.runCommandAsync("/function unlinked/essentials/giveGuidebook");
    }
    players = world.getPlayers();
  }, 40); // Delay to ensure player is loaded
});
world.afterEvents.playerLeave.subscribe(() => {
  players = world.getPlayers();
});
world.afterEvents.entityHitEntity.subscribe((event) => {
  if (brokenWeapon != null) {
    let inventory = event.damagingEntity.getComponent("inventory").container;
    for (let g = 0; g < 36; g++) {
      if (event.damagingEntity.hasTag(`unlinked.essentials.replace_next`)) {
        if (inventory.getItem(g) != null) {
          if (inventory.getItem(g).typeId == brokenWeapon) {
            event.damagingEntity.runCommandAsync(
              `playsound unlinked.essentials.switch @s`
            );
            event.damagingEntity
              .getComponent("equippable")
              .setEquipment(EquipmentSlot.Mainhand, inventory.getItem(g));
            inventory.setItem(g, null);
            brokenWeapon = null;
          }
        }
      }
    }
  }

  event.damagingEntity.removeTag(`unlinked.essentials.replace_next`);
  if (!event.damagingEntity.hasTag(`unlinked.essentials.replace_next`)) {
    if (event.damagingEntity.typeId == "minecraft:player") {
      if (
        event.damagingEntity
          .getComponent("equippable")
          .getEquipment("Mainhand") != null
      ) {
        let attackItem = event.damagingEntity
          .getComponent("equippable")
          .getEquipment("Mainhand");
        if (attackItem.getComponent("durability") != null) {
          if (
            attackItem.getComponent("durability").damage ==
            attackItem.getComponent("durability").maxDurability
          ) {
            brokenWeapon = attackItem.typeId;
            event.damagingEntity.addTag(`unlinked.essentials.replace_next`);
          }
        }
      }
    }
  }
});

/*

  https://github.com/banksean wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace

  so it's better encapsulated. Now you can have multiple random number generators

  and they won't stomp all over eachother's state.


  If you want to use this as a substitute for Math.random(), use the random()

  method like so:


  var m = new MersenneTwister();

  var randomNumber = m.random();


  You can also call the other genrand_{foo}() methods on the instance.


  If you want to use a specific seed in order to get a repeatable random

  sequence, pass an integer into the constructor:


  var m = new MersenneTwister(123);


  and that will always produce the same random sequence.


  Sean McCullough (banksean@gmail.com)

*/

/*

   A C-program for MT19937, with initialization improved 2002/1/26.

   Coded by Takuji Nishimura and Makoto Matsumoto.


   Before using, initialize the state by using init_seed(seed)

   or init_by_array(init_key, key_length).


   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,

   All rights reserved.


   Redistribution and use in source and binary forms, with or without

   modification, are permitted provided that the following conditions

   are met:


     1. Redistributions of source code must retain the above copyright

        notice, this list of conditions and the following disclaimer.


     2. Redistributions in binary form must reproduce the above copyright

        notice, this list of conditions and the following disclaimer in the

        documentation and/or other materials provided with the distribution.


     3. The names of its contributors may not be used to endorse or promote

        products derived from this software without specific prior written

        permission.


   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS

   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT

   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR

   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR

   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,

   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,

   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR

   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF

   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING

   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS

   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



   Any feedback is very welcome.

   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html

   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)

*/

var MersenneTwister = function (seed) {
  if (seed == undefined) {
    seed = new Date().getTime();
  }

  /* Period parameters */

  this.N = 624;

  this.M = 397;

  this.MATRIX_A = 0x9908b0df; /* constant vector a */

  this.UPPER_MASK = 0x80000000; /* most significant w-r bits */

  this.LOWER_MASK = 0x7fffffff; /* least significant r bits */

  this.mt = new Array(this.N); /* the array for the state vector */

  this.mti = this.N + 1; /* mti==N+1 means mt[N] is not initialized */

  if (seed.constructor == Array) {
    this.init_by_array(seed, seed.length);
  } else {
    this.init_seed(seed);
  }
};

/* initializes mt[N] with a seed */

/* origin name init_genrand */

MersenneTwister.prototype.init_seed = function (s) {
  this.mt[0] = s >>> 0;

  for (this.mti = 1; this.mti < this.N; this.mti++) {
    var s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);

    this.mt[this.mti] =
      ((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
      (s & 0x0000ffff) * 1812433253 +
      this.mti;

    /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */

    /* In the previous versions, MSBs of the seed affect   */

    /* only MSBs of the array mt[].                        */

    /* 2002/01/09 modified by Makoto Matsumoto             */

    this.mt[this.mti] >>>= 0;

    /* for >32 bit machines */
  }
};

/* initialize by an array with array-length */

/* init_key is the array for initializing keys */

/* key_length is its length */

/* slight change for C++, 2004/2/26 */

MersenneTwister.prototype.init_by_array = function (init_key, key_length) {
  var i, j, k;

  this.init_seed(19650218);

  i = 1;
  j = 0;

  k = this.N > key_length ? this.N : key_length;

  for (; k; k--) {
    var s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);

    this.mt[i] =
      (this.mt[i] ^
        (((((s & 0xffff0000) >>> 16) * 1664525) << 16) +
          (s & 0x0000ffff) * 1664525)) +
      init_key[j] +
      j; /* non linear */

    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */

    i++;
    j++;

    if (i >= this.N) {
      this.mt[0] = this.mt[this.N - 1];
      i = 1;
    }

    if (j >= key_length) j = 0;
  }

  for (k = this.N - 1; k; k--) {
    var s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);

    this.mt[i] =
      (this.mt[i] ^
        (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) +
          (s & 0x0000ffff) * 1566083941)) -
      i; /* non linear */

    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */

    i++;

    if (i >= this.N) {
      this.mt[0] = this.mt[this.N - 1];
      i = 1;
    }
  }

  this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
};

/* generates a random number on [0,0xffffffff]-interval */

/* origin name genrand_int32 */

MersenneTwister.prototype.random_int = function () {
  var y;

  var mag01 = new Array(0x0, this.MATRIX_A);

  /* mag01[x] = x * MATRIX_A  for x=0,1 */

  if (this.mti >= this.N) {
    /* generate N words at one time */

    var kk;

    if (this.mti == this.N + 1)
      /* if init_seed() has not been called, */

      this.init_seed(5489); /* a default initial seed is used */

    for (kk = 0; kk < this.N - this.M; kk++) {
      y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);

      this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
    }

    for (; kk < this.N - 1; kk++) {
      y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);

      this.mt[kk] =
        this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
    }

    y =
      (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);

    this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

    this.mti = 0;
  }

  y = this.mt[this.mti++];

  /* Tempering */

  y ^= y >>> 11;

  y ^= (y << 7) & 0x9d2c5680;

  y ^= (y << 15) & 0xefc60000;

  y ^= y >>> 18;

  return y >>> 0;
};

/* generates a random number on [0,0x7fffffff]-interval */

/* origin name genrand_int31 */

MersenneTwister.prototype.random_int31 = function () {
  return this.random_int() >>> 1;
};

/* generates a random number on [0,1]-real-interval */

/* origin name genrand_real1 */

MersenneTwister.prototype.random_incl = function () {
  return this.random_int() * (1.0 / 4294967295.0);

  /* divided by 2^32-1 */
};

/* generates a random number on [0,1)-real-interval */

MersenneTwister.prototype.random = function () {
  return this.random_int() * (1.0 / 4294967296.0);

  /* divided by 2^32 */
};

/* generates a random number on (0,1)-real-interval */

/* origin name genrand_real3 */

MersenneTwister.prototype.random_excl = function () {
  return (this.random_int() + 0.5) * (1.0 / 4294967296.0);

  /* divided by 2^32 */
};

/* generates a random number on [0,1) with 53-bit resolution*/

/* origin name genrand_res53 */

MersenneTwister.prototype.random_long = function () {
  var a = this.random_int() >>> 5,
    b = this.random_int() >>> 6;

  return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
};

/* These real versions are due to Isaku Wada, 2002/01/09 added */

/* Lower 32-bits of multiplication of two uint32 values a * b.
 */
export function umul32_lo(a, b) {
  let a00 = a & 0xffff;
  let a16 = a >>> 16;
  let b00 = b & 0xffff;
  let b16 = b >>> 16;

  let c00 = a00 * b00;
  let c16 = c00 >>> 16;

  c16 += a16 * b00;
  c16 &= 0xffff;
  c16 += a00 * b16;

  let lo = c00 & 0xffff;
  let hi = c16 & 0xffff;

  return ((hi << 16) | lo) >>> 0;
}

/* Higher 32-bits of multiplication of two uint32 values a * b.
 */
export function umul32_hi(a, b) {
  let a00 = a & 0xffff;
  let a16 = a >>> 16;
  let b00 = b & 0xffff;
  let b16 = b >>> 16;

  let c00 = a00 * b00;

  let c16 = c00 >>> 16;
  c16 += a00 * b16;
  let c32 = c16 >>> 16;
  c16 &= 0xffff;
  c16 += a16 * b00;

  c32 += c16 >>> 16;
  let c48 = c32 >>> 16;
  c32 &= 0xffff;
  c32 += a16 * b16;
  c48 += c32 >>> 16;

  let lo = c32 & 0xffff;
  let hi = c48 & 0xffff;

  return ((hi << 16) | lo) >>> 0;
}

// =====================================================
// XEZHACK INTEGRATION
// =====================================================
import "./xezhacks/xezhack_main.js";
