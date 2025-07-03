import { findByProps, findByName, findByDisplayName } from "@vendetta/metro";
import { patch, unpatchAll, instead, before, after } from "@vendetta/patcher";
import { logger } from "@vendetta";

const SERVER_ID = "1250917677078151268"; // Replace with your target server ID
const NEW_ICON_URL =
  "https://cdn.discordapp.com/icons/1250917677078151268/bbf76e3dcd1d846e3bfd6382da4aa879.png?size=96&quality=lossless"; // Replace with your desired icon URL

export const onLoad = () => {
  logger.log("IconReplace Plugin Loaded");

  // Method 1: Patch the icon URL generation function
  const IconUtils = findByProps("getGuildIconURL", "getGuildIcon") || findByProps("getGuildIconURL");
  if (IconUtils && IconUtils.getGuildIconURL) {
    logger.log("✅ Found IconUtils, patching getGuildIconURL");
    
    instead("IconReplaceIconUtils", IconUtils, "getGuildIconURL", function(original, args) {
      const [guild, size, canAnimate] = args;
      
      if (guild && guild.id === SERVER_ID) {
        logger.log(`🎯 Intercepted icon request for server ${SERVER_ID}`);
        return NEW_ICON_URL;
      }
      
      return original.apply(this, args);
    });
  }

  // Method 2: Patch the component render with more aggressive replacement
  let GuildIcon = findByDisplayName("GuildIcon") || findByName("GuildIcon") || findByProps("guild", "size", "animate");
  
  if (GuildIcon) {
    logger.log("✅ Found GuildIcon component, applying patches");
    
    // Patch function components
    if (typeof GuildIcon === "function" && !GuildIcon.prototype?.render) {
      instead("IconReplaceGuildIconFunc", GuildIcon, "type", function(original, args) {
        const props = args[0];
        const result = original.apply(this, args);
        
        if (props?.guild?.id === SERVER_ID) {
          logger.log(`🎯 Function component render for server ${SERVER_ID}`);
          return modifyIconResult(result, props);
        }
        
        return result;
      });
    }
    
    // Patch class components
    if (GuildIcon.prototype?.render) {
      instead("IconReplaceGuildIconClass", GuildIcon.prototype, "render", function(original, args) {
        const result = original.apply(this, args);
        
        if (this.props?.guild?.id === SERVER_ID) {
          logger.log(`🎯 Class component render for server ${SERVER_ID}`);
          return modifyIconResult(result, this.props);
        }
        
        return result;
      });
    }
    
    // Patch default export if it exists
    if (GuildIcon.default) {
      instead("IconReplaceGuildIconDefault", GuildIcon, "default", function(original, args) {
        const props = args[0];
        const result = original.apply(this, args);
        
        if (props?.guild?.id === SERVER_ID) {
          logger.log(`🎯 Default export render for server ${SERVER_ID}`);
          return modifyIconResult(result, props);
        }
        
        return result;
      });
    }
  }

  // Method 3: Patch image/avatar components directly
  const Avatar = findByDisplayName("Avatar") || findByProps("src", "size", "className");
  if (Avatar) {
    logger.log("✅ Found Avatar component, patching");
    
    if (typeof Avatar === "function") {
      instead("IconReplaceAvatar", Avatar, "type", function(original, args) {
        const props = args[0];
        const result = original.apply(this, args);
        
        // Check if this avatar is for our target server
        if (props?.src && props.src.includes(`icons/${SERVER_ID}/`)) {
          logger.log(`🎯 Avatar component for server ${SERVER_ID}`);
          return modifyIconResult(result, { ...props, src: NEW_ICON_URL });
        }
        
        return result;
      });
    }
  }

  // Method 4: Patch any img elements that might be guild icons
  const React = findByProps("createElement");
  if (React) {
    const originalCreateElement = React.createElement;
    React.createElement = function(type, props, ...children) {
      // Intercept img elements that look like guild icons
      if (type === "img" && props?.src && props.src.includes(`icons/${SERVER_ID}/`)) {
        logger.log(`🎯 Intercepted img element for server ${SERVER_ID}`);
        props = {
          ...props,
          src: NEW_ICON_URL,
          style: {
            ...(props.style || {}),
            border: "2px solid #57F287",
            borderRadius: "50%"
          }
        };
      }
      
      return originalCreateElement.call(this, type, props, ...children);
    };
  }
};

function modifyIconResult(result, props) {
  if (!result) return result;
  
  try {
    // Clone the result to avoid mutations
    const modifiedResult = { ...result };
    
    if (modifiedResult.props) {
      modifiedResult.props = { ...modifiedResult.props };
      
      // Replace various possible icon props
      if (modifiedResult.props.src) {
        modifiedResult.props.src = NEW_ICON_URL;
        logger.log("✅ Modified src prop");
      }
      
      if (modifiedResult.props.icon) {
        modifiedResult.props.icon = NEW_ICON_URL;
        logger.log("✅ Modified icon prop");
      }
      
      if (modifiedResult.props.iconURL) {
        modifiedResult.props.iconURL = NEW_ICON_URL;
        logger.log("✅ Modified iconURL prop");
      }
      
      if (modifiedResult.props.guild && modifiedResult.props.guild.icon) {
        modifiedResult.props.guild = {
          ...modifiedResult.props.guild,
          icon: NEW_ICON_URL
        };
        logger.log("✅ Modified guild.icon prop");
      }
      
      // Add custom styling
      modifiedResult.props.style = {
        ...(modifiedResult.props.style || {}),
        border: "2px solid #57F287",
        borderRadius: "50%"
      };
      
      // Recursively modify children
      if (modifiedResult.props.children) {
        modifiedResult.props.children = modifyChildren(modifiedResult.props.children);
      }
    }
    
    return modifiedResult;
  } catch (err) {
    logger.error("Error modifying icon result:", err);
    return result;
  }
}

function modifyChildren(children) {
  if (Array.isArray(children)) {
    return children.map(child => {
      if (child && typeof child === 'object' && child.props) {
        if (child.type === 'img' && child.props.src && child.props.src.includes(`icons/${SERVER_ID}/`)) {
          return {
            ...child,
            props: {
              ...child.props,
              src: NEW_ICON_URL,
              style: {
                ...(child.props.style || {}),
                border: "2px solid #57F287",
                borderRadius: "50%"
              }
            }
          };
        }
        return {
          ...child,
          props: {
            ...child.props,
            children: child.props.children ? modifyChildren(child.props.children) : child.props.children
          }
        };
      }
      return child;
    });
  } else if (children && typeof children === 'object' && children.props) {
    if (children.type === 'img' && children.props.src && children.props.src.includes(`icons/${SERVER_ID}/`)) {
      return {
        ...children,
        props: {
          ...children.props,
          src: NEW_ICON_URL,
          style: {
            ...(children.props.style || {}),
            border: "2px solid #57F287",
            borderRadius: "50%"
          }
        }
      };
    }
    return {
      ...children,
      props: {
        ...children.props,
        children: children.props.children ? modifyChildren(children.props.children) : children.props.children
      }
    };
  }
  return children;
}

export const onUnload = () => {
  // Restore React.createElement if we patched it
  const React = findByProps("createElement");
  if (React && React.createElement.__original) {
    React.createElement = React.createElement.__original;
  }
  
  unpatchAll("IconReplaceIconUtils");
  unpatchAll("IconReplaceGuildIconFunc");
  unpatchAll("IconReplaceGuildIconClass");
  unpatchAll("IconReplaceGuildIconDefault");
  unpatchAll("IconReplaceAvatar");
  logger.log("IconReplace Plugin Unloaded");
};