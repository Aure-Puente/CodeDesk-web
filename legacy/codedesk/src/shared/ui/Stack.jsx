//Stack:
import { Stack as MuiStack } from "@mui/material";

const Stack = ({ alignItems, justifyContent, flexWrap, sx, ...props }) => (
  <MuiStack
    {...props}
    sx={[{ alignItems, justifyContent, flexWrap }, ...(Array.isArray(sx) ? sx : [sx])]}
  />
);

export default Stack;
