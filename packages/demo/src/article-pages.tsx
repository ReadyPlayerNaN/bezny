import { AdminPage } from "@bezny/admin/page";
import {
  Badge,
  Button,
  CheckboxField,
  CheckboxInput,
  Submit,
  TextField,
  TextareaField,
} from "@bezny/base";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FormProvider, useForm } from "react-hook-form";

import { useArticleCommands } from "./article-actions.js";
import type { ArticleCommand } from "./article-actions.js";
import {
  articlesAtom,
  nextArticleIdAtom,
  noticeAtom,
  selectedArticleIdsAtom,
} from "./article-state.js";
import type { Article, ArticleValues } from "./article-state.js";

import styles from "./editorial-admin.module.scss";

export const ArticleCommandButton = ({
  command,
}: {
  command: ArticleCommand;
}) => (
  <Button
    variant={command.destructive ? "critical" : "secondary"}
    onClick={async () => {
      await command.execute();
    }}
  >
    {command.label}
  </Button>
);

export const ArticleListPage = () => {
  const articles = useAtomValue(articlesAtom);
  const selectedIds = new Set(useAtomValue(selectedArticleIdsAtom));
  const commands = useArticleCommands();
  return (
    <AdminPage
      heading="Articles"
      description="Write, publish, and manage your articles."
      actions={<ArticleCommandButton command={commands.create} />}
    >
      {commands.selectionCommands.length > 0 && (
        <div className={styles.actions} aria-label="Selection actions">
          {commands.selectionCommands.map((command) => (
            <ArticleCommandButton key={command.id} command={command} />
          ))}
        </div>
      )}
      {articles.length === 0 ? (
        <p>No articles yet. Create your first article.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <caption>Articles in this workspace</caption>
            <thead>
              <tr>
                <th scope="col">Select</th>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => {
                const select = commands.forSelection(article);
                return (
                  <tr key={article.id}>
                    <td>
                      <CheckboxInput
                        aria-label={select.label}
                        checked={selectedIds.has(article.id)}
                        onCheckedChange={async () => {
                          await select.execute();
                        }}
                      />
                    </td>
                    <th scope="row">{article.title}</th>
                    <td>
                      <Badge type={article.published ? "success" : "neutral"}>
                        {article.published ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {commands.forArticle(article).map((command) => (
                          <ArticleCommandButton
                            key={command.id}
                            command={command}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
};

export const MissingArticlePage = () => {
  const { list } = useArticleCommands();
  return (
    <AdminPage
      heading="Article not found"
      description="This article does not exist or has been deleted."
      actions={<ArticleCommandButton command={list} />}
    />
  );
};

const useCurrentArticle = () => {
  const { articleId } = useParams({ strict: false });
  const articles = useAtomValue(articlesAtom);
  return articles.find((article) => article.id === articleId);
};

export const ArticleDetailPage = () => {
  const article = useCurrentArticle();
  const commands = useArticleCommands();
  if (!article) {
    return <MissingArticlePage />;
  }
  return (
    <AdminPage
      heading={article.title}
      actions={
        <div className={styles.actions}>
          <ArticleCommandButton command={commands.list} />
          {commands
            .forArticle(article)
            .map((command) =>
              command.id.endsWith(".read") ? null : (
                <ArticleCommandButton key={command.id} command={command} />
              )
            )}
        </div>
      }
    >
      <p>
        <Badge type={article.published ? "success" : "neutral"}>
          {article.published ? "Published" : "Draft"}
        </Badge>
      </p>
      <p className={styles.articleBody}>{article.body}</p>
    </AdminPage>
  );
};

const ArticleForm = ({ article }: { article?: Article }) => {
  const form = useForm<ArticleValues>({
    defaultValues: {
      body: article?.body ?? "",
      published: article?.published ?? false,
      title: article?.title ?? "",
    },
  });
  const [articles, setArticles] = useAtom(articlesAtom);
  const [nextId, setNextId] = useAtom(nextArticleIdAtom);
  const setNotice = useSetAtom(noticeAtom);
  const navigate = useNavigate();
  const { cancelEditing } = useArticleCommands();
  const save = async (values: ArticleValues) => {
    const id = article?.id ?? String(nextId);
    const saved = {
      ...values,
      body: values.body.trim(),
      id,
      title: values.title.trim(),
    };
    if (article) {
      setArticles(
        articles.map((record) => (record.id === id ? saved : record))
      );
    } else {
      setArticles([...articles, saved]);
      setNextId(nextId + 1);
    }
    setNotice(article ? "Article updated." : "Article created.");
    await navigate({ params: { articleId: id }, to: "/articles/$articleId" });
  };
  return (
    <FormProvider {...form}>
      <form
        id="article-form"
        className={styles.form}
        noValidate
        onSubmit={form.handleSubmit(save)}
      >
        <TextField<ArticleValues>
          name="title"
          label="Title"
          rules={{
            required: "Enter a title.",
            validate: (value) =>
              (typeof value === "string" && value.trim().length > 0) ||
              "Enter a title.",
          }}
        />
        <TextareaField<ArticleValues>
          name="body"
          label="Body"
          rows={8}
          rules={{
            required: "Enter article content.",
            validate: (value) =>
              (typeof value === "string" && value.trim().length > 0) ||
              "Enter article content.",
          }}
        />
        <CheckboxField<ArticleValues> name="published" label="Published" />
        <div className={styles.actions}>
          <Submit>Save article</Submit>
          <ArticleCommandButton command={cancelEditing} />
        </div>
      </form>
    </FormProvider>
  );
};

export const ArticleCreatePage = () => (
  <AdminPage
    heading="Create article"
    description="Write a new article for your publication."
  >
    <ArticleForm />
  </AdminPage>
);
export const ArticleUpdatePage = () => {
  const article = useCurrentArticle();
  if (!article) {
    return <MissingArticlePage />;
  }
  return (
    <AdminPage heading={`Edit ${article.title}`}>
      <ArticleForm key={article.id} article={article} />
    </AdminPage>
  );
};
