// StatsGrid:
import { Avatar, Box, Card, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Stack from "./Stack";
import { getCardStyles, getSoftFadeSx, softTint } from "./styles";

const StatsGrid = ({ items, columns = 4 }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: `repeat(${columns}, 1fr)` },
        gap: { xs: 1.2, md: 1.6 },
      }}
    >
      {items.map((item, index) => (
        <Card
          key={item.label}
          elevation={0}
          sx={{
            ...getCardStyles(theme, "20px"),
            ...getSoftFadeSx(index * 45),
            p: { xs: 1.6, md: 1.9 },
            minWidth: 0,
            transition: "all 0.18s ease",
            "&:hover": { transform: "translateY(-2px)", borderColor: alpha(item.color, 0.28) },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Avatar
              variant="rounded"
              sx={{
                width: { xs: 40, md: 44 },
                height: { xs: 40, md: 44 },
                borderRadius: "15px",
                color: item.color,
                backgroundColor: softTint(theme, item.color),
              }}
            >
              {item.icon}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  color: theme.palette.app.text,
                  fontWeight: 950,
                  fontSize: item.small
                    ? { xs: "1.1rem", md: "1.35rem" }
                    : { xs: "1.45rem", md: "1.75rem" },
                  lineHeight: 1,
                  letterSpacing: "-0.6px",
                }}
              >
                {item.value}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.55,
                  color: theme.palette.app.secondary,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                }}
              >
                {item.label}
              </Typography>

              {item.helper && (
                <Typography
                  noWrap
                  sx={{
                    mt: 0.25,
                    color: theme.palette.app.muted,
                    fontSize: "0.72rem",
                    fontWeight: 650,
                  }}
                >
                  {item.helper}
                </Typography>
              )}
            </Box>
          </Stack>
        </Card>
      ))}
    </Box>
  );
};

export default StatsGrid;
