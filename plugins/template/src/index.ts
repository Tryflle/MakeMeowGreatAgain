import { findByProps, findByName, findByDisplayName } from "@vendetta/metro";
import { patch, unpatchAll, instead } from "@vendetta/patcher";
import { logger } from "@vendetta";

const SERVER_ID = "1250917677078151268"; // Replace with your target server ID
const NEW_ICON_URL =
  "https://cdn.discordapp.com/icons/1250917677078151268/bbf76e3dcd1d846e3bfd6382da4aa879.png?size=96&quality=lossless"; // Replace with your desired icon URL

export const onLoad = () => {
  logger.log("IconReplace Plugin Loaded");

  try {
    // Method 1: Try to patch the icon URL generation function (most reliable)
    const IconUtils = findByProps("getGuildIconURL");
    if (IconUtils && IconUtils.getGuildIconURL) {
      logger.log("✅ Found IconUtils.getGuildIconURL, patching");
      
      instead("IconReplaceIconUtils", IconUtils, "getGuildIconURL", function(args) {
        const [guild, size, canAnimate] = args;
        
        if (guild && guild.id === SERVER_ID) {
          logger.log(`🎯 Intercepted getGuildIconURL for server ${SERVER_ID}`);
          return NEW_ICON_URL;
        }
        
        // Call original function
        return IconUtils.getGuildIconURL.apply(this, args);
      });
    }

    // Method 2: Patch the GuildIcon component
    const GuildIcon = findByDisplayName("GuildIcon") || findByName("GuildIcon");
    if (GuildIcon) {
      logger.log("✅ Found GuildIcon component, patching");
      
      // Handle function components
      if (typeof GuildIcon === "function" && !GuildIcon.prototype?.render) {
        instead("IconReplaceGuildIcon", GuildIcon, "default", function(args) {
          const props = args[0];
          const result = GuildIcon.default ? GuildIcon.default.apply(this, args) : GuildIcon.apply(this, args);
          
          if (props?.guild?.id === SERVER_ID) {
            logger.log(`🎯 GuildIcon render for server ${SERVER_ID}`);
            return modifyIconResult(result);
          }
          
          return result;
        });
      }
      
      // Handle class components
      if (GuildIcon.prototype?.render) {
        instead("IconReplaceGuildIconRender", GuildIcon.prototype, "render", function(args) {
          const result = GuildIcon.prototype.render.apply(this, args);
          
          if (this.props?.guild?.id === SERVER_ID) {
            logger.log(`🎯 GuildIcon class render for server ${SERVER_ID}`);
            return modifyIconResult(result);
          }
          
          return result;
        });
      }
    }

  } catch (error) {
    logger.error("Error during plugin initialization:", error);
  }
};

function modifyIconResult(result) {
  if (!result || typeof result !== 'object') {
    return result;
  }

  try {
    // Create a shallow copy to avoid mutation issues
    const modified = { ...result };
    
    if (modified.props) {
      modified.props = { ...modified.props };
      
      // Replace common icon properties
      if (modified.props.src && modified.props.src.includes('icons/')) {
        modified.props.src = NEW_ICON_URL;
        logger.log("✅ Modified src property");
      }
      
      if (modified.props.iconURL) {
        modified.props.iconURL = NEW_ICON_URL;
        logger.log("✅ Modified iconURL property");
      }
      
      // Add border styling
      modified.props.style = {
        ...(modified.props.style || {}),
        border: "2px solid #57F287",
        borderRadius: "50%"
      };
      
      // Check children for nested img elements
      if (modified.props.children) {
        modified.props.children = modifyChildren(modified.props.children);
      }
    }
    
    return modified;
  } catch (error) {
    logger.error("Error modifying icon result:", error);
    return result;
  }
}

function modifyChildren(children) {
  if (!children) return children;
  
  if (Array.isArray(children)) {
    return children.map(child => {
      if (child && typeof child === 'object' && child.props) {
        if (child.type === 'img' && child.props.src && child.props.src.includes(`icons/${SERVER_ID}/`)) {
          return {
            ...child,
            props: {
              ...child.props,
              src: NEW_ICON_URL
            }
          };
        }
        
        // Recursively check children
        if (child.props.children) {
          return {
            ...child,
            props: {
              ...child.props,
              children: modifyChildren(child.props.children)
            }
          };
        }
      }
      return child;
    });
  } else if (children && typeof children === 'object' && children.props) {
    if (children.type === 'img' && children.props.src && children.props.src.includes(`icons/${SERVER_ID}/`)) {
      return {
        ...children,
        props: {
          ...children.props,
          src: NEW_ICON_URL
        }
      };
    }
    
    if (children.props.children) {
      return {
        ...children,
        props: {
          ...children.props,
          children: modifyChildren(children.props.children)
        }
      };
    }
  }
  
  return children;
}

export const onUnload = () => {
  try {
    unpatchAll("IconReplaceIconUtils");
    unpatchAll("IconReplaceGuildIcon");
    unpatchAll("IconReplaceGuildIconRender");
    logger.log("IconReplace Plugin Unloaded");
  } catch (error) {
    logger.error("Error during plugin unload:", error);
  }
};