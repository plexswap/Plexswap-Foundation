import React, { useState } from "react";
import PlexToggle from "./PlexToggle";

export default {
  title: "Components/PlexToggle",
  component: PlexToggle,
};

export const Default: React.FC<React.PropsWithChildren> = () => {
  const [isChecked, setIsChecked] = useState(false);

  const toggle = () => setIsChecked(!isChecked);

  return (
    <>
      <div style={{ marginBottom: "32px" }}>
        <PlexToggle checked={isChecked} onChange={toggle} />
      </div>
      <div style={{ marginBottom: "32px" }}>
        <PlexToggle checked={isChecked} onChange={toggle} scale="md" />
      </div>
      <div>
        <PlexToggle checked={isChecked} onChange={toggle} scale="sm" />
      </div>
    </>
  );
};
