import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import DemoBanner from "./components/DemoBanner";

function App() {
  return (
    <>
      <div className="pb-12">
        <RouterProvider router={router} />
      </div>
      <DemoBanner />
    </>
  );
}

export default App;
