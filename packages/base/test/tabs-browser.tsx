import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TextInput,
  Button,
} from "@bezny/base";
import { createRoot } from "react-dom/client";

import "@bezny/base/style.css";

const direction =
  new URLSearchParams(location.search).get("dir") === "rtl" ? "rtl" : "ltr";
const App = () => (
  <main>
    <Tabs defaultValue="english" dir={direction}>
      <TabsList aria-label="Locale">
        <TabsTrigger value="english">English content</TabsTrigger>
        <TabsTrigger value="czech">Czech content</TabsTrigger>
        <TabsTrigger value="german" disabled>
          German content
        </TabsTrigger>
        <TabsTrigger value="other">Other language content</TabsTrigger>
      </TabsList>
      <TabsContent value="english" forceMount>
        <TextInput aria-label="English draft" />
      </TabsContent>
      <TabsContent value="czech">
        <Button>Translate</Button>
      </TabsContent>
      <TabsContent value="other">Other language</TabsContent>
    </Tabs>
  </main>
);
const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing fixture root");
}
createRoot(root).render(<App />);
