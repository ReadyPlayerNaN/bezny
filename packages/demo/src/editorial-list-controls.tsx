import { useAdminListControls } from "@bezny/admin/list";
import { ChoiceFilter, ValueFilter, Button } from "@bezny/base";

export const EditorialListControls = () => {
  const { filterCommands, paginationCommands, clear, query, pageCount, total } =
    useAdminListControls();
  return (
    <section aria-label="Collection controls">
      <div>
        {filterCommands.map((command) => {
          const { input } = command;
          if (!input) {
            return null;
          }
          return input.options ? (
            <ChoiceFilter
              key={command.id}
              label={input.label}
              value={input.value || null}
              options={input.options}
              onChange={(value) => {
                void input.execute(value ?? "");
              }}
            />
          ) : (
            <ValueFilter
              maxLength={input.maxLength}
              key={command.id}
              label={input.label}
              value={input.value || null}
              onChange={(value) => {
                void input.execute(value ?? "");
              }}
            />
          );
        })}
        {clear && (
          <Button
            variant="secondary"
            onClick={() => {
              void clear.execute();
            }}
          >
            {clear.label}
          </Button>
        )}
      </div>
      <output aria-label="Pagination">
        Page {query.page} of {pageCount ?? "…"} · {total ?? "…"} records
      </output>
      <div>
        {paginationCommands.map((command) =>
          command.input ? null : (
            <Button
              key={command.id}
              variant="secondary"
              onClick={() => {
                void command.execute();
              }}
            >
              {command.label}
            </Button>
          )
        )}
      </div>
    </section>
  );
};
