import { IconButton } from "@bezny/base";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAdminEntityCommands } from "./admin-entity-commands.js";
import { useAdminEntityContext } from "./admin-entity-context.js";
import type { AdminCommand } from "./admin-entity-model.js";

const minimumRefreshFeedbackMs = 666;

export const AdminRefreshButton = ({
  command,
  loading = false,
}: {
  command: AdminCommand;
  loading?: boolean;
}) => {
  const { t } = useTranslation("beznyAdmin");
  const [pending, setPending] = useState(false);
  const [feedbackActive, setFeedbackActive] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!feedbackActive) {
      return;
    }
    const timeout = setTimeout(() => {
      setFeedbackActive(false);
    }, minimumRefreshFeedbackMs);
    return () => clearTimeout(timeout);
  }, [feedbackActive]);
  const busy = loading || pending || feedbackActive;
  return (
    <>
      <IconButton
        variant="secondary"
        icon={RefreshCw}
        aria-label={command.label}
        loading={busy}
        onClick={async () => {
          setPending(true);
          setFeedbackActive(true);
          setFailed(false);
          try {
            await command.execute();
          } catch {
            setFailed(true);
          }
          setPending(false);
        }}
      />
      {failed && <span role="alert">{t("error")}</span>}
    </>
  );
};

export const ConnectedAdminRefreshButton = () => {
  const { refresh } = useAdminEntityCommands();
  const { kind } = useAdminEntityContext();
  return refresh ? (
    <AdminRefreshButton command={refresh} loading={kind === "loading"} />
  ) : null;
};
