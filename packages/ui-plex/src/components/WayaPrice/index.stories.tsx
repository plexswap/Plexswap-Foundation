import React from "react";
import { WayaPrice, WayaPriceProps } from ".";
import { Flex } from "../Box";

export default {
  title: "Components/WayaPrice",
  component: WayaPrice,
};

const Template: React.FC<React.PropsWithChildren<WayaPriceProps>> = ({ ...args }) => {
  return (
    <Flex p="10px">
      <WayaPrice {...args} />
    </Flex>
  );
};

export const Default = Template.bind({});
Default.args = {
  wayaPriceUsd: 20.0,
};
