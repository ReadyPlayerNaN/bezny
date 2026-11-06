import {
  Button,
  EntityRowListSkeleton,
  LoadingSkeleton,
  Skeleton,
} from "@bezny/base";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAdminDataSession } from "./admin-entity-context.js";

export const AdminDefaultLoadingPage = ({
  collection = false,
}: {
  collection?: boolean;
}) => {
  const { t } = useTranslation("beznyAdmin");
  if (collection) {
    return (
      <div aria-label={t("loading")}>
        <EntityRowListSkeleton label={t("loading")} />
      </div>
    );
  }
  return (
    <LoadingSkeleton label={t("loading")} aria-label={t("loading")}>
      <Skeleton variant="heading" />
      <Skeleton />
      <Skeleton variant="block" />
    </LoadingSkeleton>
  );
};

export const AdminDefaultCollectionLoadingPage = () => (
  <AdminDefaultLoadingPage collection />
);

/** Errors deliberately use safe localized text, never raw transport diagnostics. */
export const AdminDefaultErrorPage = () => {
  const { t } = useTranslation("beznyAdmin");
  const session = useAdminDataSession();
  const [pending, setPending] = useState(false);
  return (
    <div>
      <p role="alert">{t("error")}</p>
      <Button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            await session.refresh();
          } catch {
            // Keep the safe error state retryable if refresh itself fails.
          }
          setPending(false);
        }}
      >
        {t("retry")}
      </Button>
    </div>
  );
};
