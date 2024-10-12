import { useState, CSSProperties } from "react";
import BasicSpinner from "react-spinners/RingLoader";
import styled from "styled-components";
import { SpinnerProps } from "./types";

const Container = styled.div`
  position: relative;
`;

const override: CSSProperties = {
  display: "block",
  margin: "0 auto",
  borderColor: "#F5A700",
};

const Spinner: React.FC<SpinnerProps> = () => {
  const [loading] = useState(true);
  const [color] = useState("#F5A700");

  return (
    <Container>
      <BasicSpinner color={color} loading={loading} cssOverride={override} size={70} />
    </Container>
  );
};

export default Spinner;
