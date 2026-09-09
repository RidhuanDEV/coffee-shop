import { useTranslation } from "react-i18next";
import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { LoadingOverlay } from "@/components/feedback";
import { AppProviders } from "./providers";
import { router } from "./router";

const App = () => {
  const { t } = useTranslation("coffee");
  return (
    <AppProviders>
      <Suspense fallback={<LoadingOverlay visible message={t("loading")} />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
};

export default App;
