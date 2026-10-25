// Diálogs:
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import Stack from "./Stack";
import { getDialogPaperSx, getSoftBackground } from "./styles";

const padX = { xs: 2, md: 2.75 };

const paperSm = {
  m: { xs: 1.5, sm: 2 },
  maxHeight: { xs: "calc(100% - 24px)", sm: "calc(100% - 32px)" },
};

export const CloseButton = ({ onClick, disabled }) => {
  const theme = useTheme();

  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      aria-label="Cerrar"
      sx={{
        position: "absolute",
        top: 14,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: "11px",
        color: theme.palette.app.secondary,
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        "&:hover": {
          color: theme.palette.primary.main,
          backgroundColor: theme.palette.app.primarySoft,
        },
      }}
    >
      <CloseRoundedIcon sx={{ fontSize: 19 }} />
    </IconButton>
  );
};

export const AppDialog = ({
  open,
  onClose,
  locked = false,
  maxWidth = "sm",
  icon,
  iconColor,
  header,
  title,
  subtitle,
  children,
  actions,
  onSubmit,
  contentSx,
}) => {
  const theme = useTheme();
  const color = iconColor || theme.palette.primary.main;
  const body = (
    <>
      <DialogTitle sx={{ position: "relative", px: padX, pt: 2.25, pb: 1.9, pr: 7 }}>
        {header ?? (
          <Stack direction="row" alignItems="center" spacing={1.4}>
            {icon && (
              <Avatar
                variant="rounded"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "13px",
                  color,
                  backgroundColor: alpha(color, 0.12),
                  border: `1px solid ${alpha(color, 0.18)}`,
                  "& svg": { fontSize: 21 },
                }}
              >
                {icon}
              </Avatar>
            )}

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontSize: "1.08rem",
                  fontWeight: 850,
                  lineHeight: 1.25,
                }}
              >
                {title}
              </Typography>

              {subtitle && (
                <Typography
                  sx={{
                    mt: 0.25,
                    color: theme.palette.app.secondary,
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        <CloseButton onClick={onClose} disabled={locked} />
      </DialogTitle>

      <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />
      <DialogContent sx={{ px: padX, py: 2.25, ...contentSx }}>{children}</DialogContent>

      {actions && (
        <>
          <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />
          <DialogActions
            sx={{ px: padX, py: 1.6, gap: 1, backgroundColor: getSoftBackground(theme) }}
          >
            {actions}
          </DialogActions>
        </>
      )}
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={locked ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
      slotProps={{ paper: { sx: { ...getDialogPaperSx(theme), overflow: "hidden", ...paperSm } } }}
    >
      {onSubmit ? (
        <Box component="form" onSubmit={onSubmit} noValidate>
          {body}
        </Box>
      ) : (
        body
      )}
    </Dialog>
  );
};

export const FormError = ({ message }) =>
  message ? (
    <Alert severity="error" sx={{ borderRadius: "14px", fontWeight: 700 }}>
      {message}
    </Alert>
  ) : null;

export const FormDialog = ({
  saving,
  submitLabel,
  submitIcon,
  submitDisabled,
  error,
  onClose,
  children,
  ...props
}) => (
  <AppDialog
    {...props}
    onClose={onClose}
    locked={saving}
    actions={
      <>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            minHeight: 40,
            px: 1.8,
            borderRadius: "12px",
            fontWeight: 750,
            color: "text.secondary",
          }}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={saving || submitDisabled}
          startIcon={submitIcon}
          sx={{ minHeight: 40, px: 2.2, borderRadius: "12px", fontWeight: 800, boxShadow: "none" }}
        >
          {saving ? "Guardando..." : submitLabel}
        </Button>
      </>
    }
  >
    <Stack spacing={2}>
      <FormError message={error} />
      {children}
    </Stack>
  </AppDialog>
);

export const ConfirmDialog = ({
  open,
  title,
  text = "Esta acción no se puede deshacer.",
  icon = <DeleteRoundedIcon />,
  confirmLabel = "Eliminar",
  confirmIcon = <DeleteRoundedIcon />,
  previewTitle,
  previewSubtitle,
  preview,
  deleting = false,
  onClose,
  onConfirm,
}) => {
  const theme = useTheme();
  const error = theme.palette.error.main;
  const dark = theme.palette.mode === "dark";
  const isDelete = confirmLabel === "Eliminar";

  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            ...getDialogPaperSx(theme),
            ...paperSm,
            overflow: "hidden",
            backgroundImage: `radial-gradient(360px 160px at 50% 0%, ${alpha(error, dark ? 0.16 : 0.08)}, transparent 70%)`,
          },
        },
      }}
    >
      <DialogContent sx={{ px: 3, pt: 3.5, pb: 1, textAlign: "center" }}>
        {/* Ícono con anillos */}
        <Box
          sx={{
            mx: "auto",
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: error,
            bgcolor: alpha(error, dark ? 0.18 : 0.1),
            boxShadow: `0 0 0 8px ${alpha(error, dark ? 0.08 : 0.05)}, 0 0 0 16px ${alpha(error, dark ? 0.04 : 0.025)}`,
            "& svg": { fontSize: 26 },
          }}
        >
          {icon}
        </Box>

        <Typography
          sx={{
            mt: 3,
            color: theme.palette.app.text,
            fontSize: "1.15rem",
            fontWeight: 850,
            letterSpacing: "-0.3px",
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 0.6,
            mx: "auto",
            maxWidth: 320,
            color: theme.palette.app.secondary,
            fontSize: "0.86rem",
            fontWeight: 550,
            lineHeight: 1.5,
          }}
        >
          {text}
        </Typography>

        {(preview || previewTitle) && (
          <Box
            sx={{
              mt: 2,
              px: 1.5,
              py: 1.25,
              borderRadius: "14px",
              textAlign: "center",
              backgroundColor: getSoftBackground(theme),
              border: `1px solid ${theme.palette.app.borderSoft}`,
              "& > .MuiStack-root": { justifyContent: "center" },
              "& > .MuiStack-root > .MuiBox-root": { textAlign: "left" },
              "& .MuiAlert-root": { textAlign: "left" },
            }}
          >
            {preview ?? (
              <>
                <Typography
                  sx={{
                    color: theme.palette.app.text,
                    fontSize: "0.9rem",
                    fontWeight: 750,
                    overflowWrap: "anywhere",
                  }}
                >
                  {previewTitle}
                </Typography>
                {previewSubtitle && (
                  <Typography
                    sx={{
                      mt: 0.25,
                      color: theme.palette.app.secondary,
                      fontWeight: 600,
                      fontSize: "0.78rem",
                    }}
                  >
                    {previewSubtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}

        {isDelete && text !== "Esta acción no se puede deshacer." && (
          <Typography
            sx={{ mt: 1.5, fontSize: "0.74rem", fontWeight: 650, color: alpha(error, 0.9) }}
          >
            Esta acción no se puede deshacer.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button
          fullWidth
          onClick={onClose}
          disabled={deleting}
          sx={{
            minHeight: 42,
            borderRadius: "12px",
            fontWeight: 750,
            color: theme.palette.app.text,
            bgcolor: getSoftBackground(theme),
            border: `1px solid ${theme.palette.app.borderSoft}`,
            "&:hover": { bgcolor: theme.palette.app.surfaceSoft },
          }}
        >
          Cancelar
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : confirmIcon}
          onClick={onConfirm}
          disabled={deleting}
          sx={{
            minHeight: 42,
            borderRadius: "12px",
            fontWeight: 800,
            color: "#fff",
            background: "linear-gradient(180deg, #EF4444 0%, #DC2626 100%)",
            boxShadow: `0 8px 20px ${alpha("#DC2626", dark ? 0.35 : 0.28)}`,
            "&:hover": {
              background: "linear-gradient(180deg, #E53E3E 0%, #C81E1E 100%)",
              boxShadow: `0 10px 24px ${alpha("#DC2626", dark ? 0.45 : 0.36)}`,
            },
            "&.Mui-disabled": { color: "#fff", opacity: 0.7 },
          }}
        >
          {deleting ? "Procesando..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const DeleteDialog = ConfirmDialog;
