import { getExtracted } from "next-intl/server";

export default async function Page() {
  const t = await getExtracted();

  return <h1>{t("Hello from the catalog")}</h1>;
}
