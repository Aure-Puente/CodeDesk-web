//App:
import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import { useAuth } from "./context/AuthContext";

const FullScreenLoader = () => (
  <Box
    sx={{
      width: "100%",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#020617",
    }}
  >
    <CircularProgress sx={{ color: "#60A5FA" }} />
  </Box>
);

const Guard = ({ isPrivate, children }) => {
  const { user, checkingAuth } = useAuth();

  if (checkingAuth) return <FullScreenLoader />;
  if (isPrivate && !user) return <Navigate to="/login" replace />;
  if (!isPrivate && user) return <Navigate to="/" replace />;

  return children;
};

const App = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <Guard isPrivate={false}>
          <Login />
        </Guard>
      }
    />
    <Route
      path="/"
      element={
        <Guard isPrivate>
          <Dashboard />
        </Guard>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
