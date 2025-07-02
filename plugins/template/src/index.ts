import { logger, patch, unpatchAll } from "@vendetta";
import { findByDisplayName } from "@vendetta/metro";

const SERVER_ID = "1250917677078151268";
const NEW_ICON_URL = "https://cdn.discordapp.com/icons/1250917677078151268/bbf76e3dcd1d846e3bfd6382da4aa879.png?size=96&quality=lossless";

export default {
  onLoad() {
    logger.log("Server Icon Replace Plugin Loaded");

    const GuildIcon = findByDisplayName("GuildIcon");
    if (!GuildIcon) {
      logger.warn("GuildIcon component not found!");
      return;
    }

    patch("server-icon-replace", GuildIcon.prototype, "render", (args, res) => {
      try {
        const props = res?.props;
        if (props?.guild?.id === SERVER_ID) {
          props.icon = NEW_ICON_URL;
          logger.log(`Replaced icon for server ID ${SERVER_ID}`);
        }
      } catch (e) {
        logger.error("Error patching GuildIcon:", e);
      }
      return res;
    });
  },

  onUnload() {
    unpatchAll("server-icon-replace");
    logger.log("Server Icon Replace Plugin Unloaded");
  },

  settings: null,
};
