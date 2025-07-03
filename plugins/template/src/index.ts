import { findByProps, findByName, findByDisplayName } from "@vendetta/metro";
import { patch, unpatchAll, instead } from "@vendetta/patcher";
import { logger } from "@vendetta";

const SERVER_ID = "1250917677078151268"; // Replace with your target server ID
const NEW_ICON_URL =
  "https://cdn.discordapp.com/icons/1250917677078151268/bbf76e3dcd1d846e3bfd6382da4aa879.png?size=96&quality=lossless"; // Replace with your desired icon URL

export const onLoad = () => {
  logger.log("IconReplace Plugin Loaded");

  // Method 1: Try to find GuildIcon by display name
  let GuildIcon = findByDisplayName("GuildIcon");
  if (!GuildIcon) {
    // Method 2: Try to find by name
    GuildIcon = findByName("GuildIcon");
  }
  if (!GuildIcon) {
    // Method 3: Try to find by props that are more likely to exist
    GuildIcon = findByProps("guild", "size", "animate");
  }
  if (!GuildIcon) {
    // Method 4: Try alternative prop combinations
    GuildIcon = findByProps("guild", "size");
  }

  if (!GuildIcon) {
    logger.error("❌ GuildIcon component not found! Trying alternative approach...");
    
    // Alternative: Try to find the guild list or sidebar component
    const GuildList = findByProps("guilds", "selectedGuildId") || findByProps("guild", "selected");
    if (GuildList) {
      logger.log("Found alternative component, patching that instead");
      patchComponent(GuildList, "GuildList");
    } else {
      logger.error("❌ No suitable component found!");
      return;
    }
  } else {
    logger.log("✅ Found GuildIcon component");
    patchComponent(GuildIcon, "GuildIcon");
  }
};

function patchComponent(component, name) {
  // Try patching the render method
  if (component.prototype && component.prototype.render) {
    patch(`IconReplace${name}Render`, component.prototype, "render", function(original, args) {
      const result = original.apply(this, args);
      return modifyResult(result, this.props);
    });
  }
  // Try patching the component as a function component
  else if (typeof component === "function") {
    patch(`IconReplace${name}Function`, component, "default", function(original, args) {
      const result = original.apply(this, args);
      return modifyResult(result, args[0]);
    });
  }
  // Try patching common method names
  else if (component.default) {
    patch(`IconReplace${name}Default`, component, "default", function(original, args) {
      const result = original.apply(this, args);
      return modifyResult(result, args[0]);
    });
  }
}

function modifyResult(result, props) {
  if (!result) return result;
  
  try {
    // Check if this is the target server
    const guildId = props?.guild?.id || props?.guildId || result?.props?.guild?.id;
    
    if (guildId === SERVER_ID) {
      logger.log(`🎯 Found target server ${SERVER_ID}, modifying icon`);
      
      // Method 1: Direct props modification
      if (result.props) {
        if (result.props.src) {
          result.props.src = NEW_ICON_URL;
        }
        if (result.props.icon) {
          result.props.icon = NEW_ICON_URL;
        }
        if (result.props.guild) {
          result.props.guild.icon = NEW_ICON_URL;
        }
        
        // Add styling
        result.props.style = {
          ...(result.props.style ?? {}),
          border: "2px solid #57F287",
          borderRadius: "50%",
        };
      }
      
      // Method 2: Deep search and replace in children
      modifyIconInChildren(result);
      
      logger.log(`✅ Modified icon for server ${SERVER_ID}`);
    }
  } catch (err) {
    logger.error("Error in IconReplace patch:", err);
  }
  
  return result;
}

function modifyIconInChildren(element) {
  if (!element || !element.props) return;
  
  // Check current element
  if (element.props.src && element.props.src.includes('icons/')) {
    element.props.src = NEW_ICON_URL;
  }
  
  // Recursively check children
  if (element.props.children) {
    if (Array.isArray(element.props.children)) {
      element.props.children.forEach(child => modifyIconInChildren(child));
    } else if (typeof element.props.children === 'object') {
      modifyIconInChildren(element.props.children);
    }
  }
}

export const onUnload = () => {
  unpatchAll("IconReplaceGuildIconRender");
  unpatchAll("IconReplaceGuildIconFunction");
  unpatchAll("IconReplaceGuildIconDefault");
  unpatchAll("IconReplaceGuildListRender");
  unpatchAll("IconReplaceGuildListFunction");
  unpatchAll("IconReplaceGuildListDefault");
  logger.log("IconReplace Plugin Unloaded");
};