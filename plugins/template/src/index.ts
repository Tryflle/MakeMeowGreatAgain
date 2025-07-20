import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { logger } from "@vendetta";

const SERVER_ID     = "1250917677078151268";
const NEW_ICON_URL  = "https://raw.githubusercontent.com/Tryflle/MakeMeowGreatAgain/57c9cf47a676be4c27f7cbc54771a88783985e49/msmpicon.png;

let patches: Array<() => void> = [];

function forceGuildUpdate(delay: number) {
  setTimeout(() => {
    const D = findByProps("dispatch", "subscribe");
    if (!D) return;
    D.dispatch({ type: "GUILD_UPDATE", guild: { id: SERVER_ID, icon: NEW_ICON_URL } });
  }, delay);
}

export const onLoad = () => {
  logger.log("🚀 IconReplace v223 starting patches in 1s…");
  setTimeout(() => {
    const IconUtils = findByProps("getGuildIconURL", "getGuildIconSource");
    logger.log("🔧 IconUtils methods available:", Object.keys(IconUtils ?? {}).join(", "));

    // Patch URL function
    if (IconUtils?.getGuildIconURL) {
      patches.push(instead("getGuildIconURL", IconUtils, (args, orig) => {
        const guild = args[0];
        const original = orig(...args);
        if (guild?.id === SERVER_ID) {
          logger.log("✅ Replacing icon URL for target guild");
          return NEW_ICON_URL;
        }
        return original;
      }));
    }

    // Patch source function
    if (IconUtils?.getGuildIconSource) {
      patches.push(instead("getGuildIconSource", IconUtils, (args, orig) => {
        const guild = args[0];
        const original = orig(...args);
        if (guild?.id === SERVER_ID) {
          logger.log("✅ Replacing icon source for target guild");
          return { uri: NEW_ICON_URL };
        }
        return original;
      }));
    }

    // Force UI to repaint
    forceGuildUpdate(500);
    forceGuildUpdate(1500);
    logger.log("🌟 IconReplace patches applied.");
  }, 1000);
};

export const onUnload = () => {
  logger.log("🔄 Unloading IconReplace…");
  patches.forEach((unpatch) => unpatch());
  forceGuildUpdate(500);
  forceGuildUpdate(1500);
  patches = [];
};
