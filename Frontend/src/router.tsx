import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/login/Login";
import Agenda from "./pages/principal/Agenda";
import Pacientes from "./pages/principal/Pacientes";
import PacienteDetalle from "./pages/principal/PacienteDetalle";
import ResetPassword from "../src/pages/login/ResetPassword";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/agenda",
        element: <Agenda />,
      },
      {
        path: "/pacientes",
        element: <Pacientes />,
      },
      {
        path: "/pacientes/:id",
        element: <PacienteDetalle />,
      },
    ],
  },
]);
