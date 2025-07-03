import { findByProps } from "@vendetta/metro";
import { patch, unpatchAll } from "@vendetta/patcher";
import { logger } from "@vendetta";

const SERVER_ID = "1250917677078151268";
const NEW_ICON_URL =
  "https://cdn.discordapp.com/icons/1250917677078151268/bbf76e3dcd1d846e3bfd6382da4aa879.png?size=96&quality=lossless";

export const onLoad = () => {
  logger.log("IconReplace Plugin Loaded");

  // Attempt to find the GuildIcon component by its props
  const GuildIcon = findByProps("guild", "icon");
  if (!GuildIcon) {
    logger.error("❌ GuildIcon component not found!");
    return;
  }

  patch("IconReplaceGuildIcon", GuildIcon.prototype, "render", (_this, _args, res: any) => {
    try {
      if (res.props?.guild?.id === SERVER_ID) {
        res.props.icon = NEW_ICON_URL;
        res.props.style = {
          ...(res.props.style ?? {}),
          border: "2px solid #57F287",
          borderRadius: "50%",
        };
        logger.log(`✅ Replaced and styled icon for server ${SERVER_ID}`);
      }
    } catch (err) {
      logger.error("Error in IconReplace patch:", err);
    }
    return res;
  });
};

export const onUnload = () => {
  unpatchAll("IconReplaceGuildIcon");
  logger.log("IconReplace Plugin Unloaded");
};
