//Section:
import { Box } from "@mui/material";
import { getFadeInSx } from "./styles";

const Section = ({ delay = 0, children, sx }) => (
  <Box sx={{ ...getFadeInSx(delay), ...sx }}>{children}</Box>
);

export default Section;
