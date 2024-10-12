import React from "react";
import { PlexStack, PlexInput, PlexLabel } from "./StyledPlexToggle";
import { PlexToggleProps, scales } from "./types";

const PlexToggle: React.FC<React.PropsWithChildren<PlexToggleProps>> = ({ checked, scale = scales.LG, ...props }) => (
  <PlexStack scale={scale}>
    <PlexInput id={props.id || "plex-toggle"} scale={scale} type="checkbox" checked={checked} {...props} />
    <PlexLabel scale={scale} checked={checked} htmlFor={props.id || "plex-toggle"}>
      <div className="plex">
        <div className="plex" />
        <div className="plex" />
        <div className="plex" />
        <div className="butter" />
      </div>
    </PlexLabel>
  </PlexStack>
);

export default PlexToggle;
