import type { SelectableRowMenuItem } from "./selectable-row.js";

export type EntityRowAction = SelectableRowMenuItem & {
  bulkable?: boolean;
  onBulkSelect?: (ids: string[]) => void | Promise<void>;
  submenu?: readonly EntityRowAction[];
};
export interface EntityActionContext {
  id: string;
  actions?: readonly EntityRowAction[];
}
export const hasSharedActions = (actions: readonly EntityRowAction[] = []) =>
  actions.some(
    (action) => Boolean(action.onSelect) && action.bulkable !== false
  );
export const combineEntityRowActions = (
  contexts: readonly EntityActionContext[],
  onSuccess: () => void
): SelectableRowMenuItem[] => {
  const [first] = contexts;
  if (!first) {
    return [];
  }
  return (first.actions ?? []).flatMap((action): SelectableRowMenuItem[] => {
    if (
      contexts.length > 1 &&
      (!action.onSelect || action.bulkable === false)
    ) {
      return [];
    }
    const matches = contexts.map((context) =>
      context.actions?.find((candidate) => candidate.key === action.key)
    );
    if (
      matches.some(
        (candidate) =>
          !candidate ||
          (contexts.length > 1 &&
            (!candidate.onSelect || candidate.bulkable === false))
      )
    ) {
      return [];
    }
    if (action.href !== undefined) {
      return [action];
    }
    const submenu = action.submenu
      ? combineEntityRowActions(
          contexts.map((context, index) => ({
            actions: matches[index]?.submenu ?? [],
            id: context.id,
          })),
          onSuccess
        )
      : undefined;
    return [
      {
        ...action,
        disabled: matches.some((candidate) => candidate?.disabled),
        ...(submenu ? { submenu } : {}),
        onSelect: async () => {
          if (contexts.length === 1) {
            await action.onSelect();
          } else if (action.onBulkSelect) {
            await action.onBulkSelect(contexts.map((context) => context.id));
          } else {
            await Promise.all(
              matches.map((candidate) => candidate?.onSelect?.())
            );
          }
          onSuccess();
        },
      },
    ];
  });
};
