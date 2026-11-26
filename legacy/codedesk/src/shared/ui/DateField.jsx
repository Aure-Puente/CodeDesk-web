// DateField:
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { esES } from "@mui/x-date-pickers/locales";
import dayjs from "dayjs";
import es from "dayjs/locale/es";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const LOCALE = "es-cap";
dayjs.locale(
  {
    ...es,
    name: LOCALE,
    months: es.months.map(capitalize),
    monthsShort: es.monthsShort.map(capitalize),
  },
  null,
  true,
);
const localeText = esES.components.MuiLocalizationProvider.defaultProps.localeText;

const DateField = ({ label = "Fecha", value, onChange, disabled, clearable = true, size }) => {
  const theme = useTheme();
  const date = value ? dayjs(value) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={LOCALE} localeText={localeText}>
      <DatePicker
        label={label}
        value={date?.isValid() ? date : null}
        onChange={(next) => onChange(next?.isValid() ? next.format("YYYY-MM-DD") : "")}
        disabled={disabled}
        format="DD/MM/YYYY"
        slotProps={{
          field: { clearable },
          textField: {
            fullWidth: true,
            size,
            sx: {
              "& .MuiPickersOutlinedInput-root, & .MuiOutlinedInput-root": { borderRadius: "12px" },
            },
          },
          openPickerButton: { sx: { color: theme.palette.app.secondary } },
          desktopPaper: {
            sx: {
              mt: 0.75,
              borderRadius: "16px",
              backgroundImage: "none",
              backgroundColor: theme.palette.app.surface,
              border: `1px solid ${theme.palette.app.borderSoft}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 18px 50px rgba(0,0,0,0.5)"
                  : "0 18px 50px rgba(15,23,42,0.14)",
            },
          },
          calendarHeader: { sx: { "& .MuiPickersCalendarHeader-label": { fontWeight: 800 } } },
          day: { sx: { fontWeight: 600, "&.Mui-selected": { fontWeight: 800 } } },
        }}
      />
    </LocalizationProvider>
  );
};

export default DateField;
