// PageShell:
import { Alert, Box } from "@mui/material";
import Stack from "./Stack";

export const PageAlert = ({ message, severity = "error", onClose }) =>
  message ? (
    <Alert severity={severity} onClose={onClose} sx={{ borderRadius: "18px", fontWeight: 700 }}>
      {message}
    </Alert>
  ) : null;

const PageShell = ({ loading, children, after }) => (
  <Box sx={{ width: "100%", maxWidth: 1280, mx: "auto", pb: { xs: 4, md: 6 } }}>
    {!loading && <Stack spacing={{ xs: 2, md: 2.4 }}>{children}</Stack>}
    {after}
  </Box>
);

export default PageShell;
