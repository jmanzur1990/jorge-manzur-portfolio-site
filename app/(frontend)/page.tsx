import App from "../../src/App.jsx";
import { getFrontendPortfolioData } from "../../lib/frontend-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const portfolioData = await getFrontendPortfolioData();

  return <App initialData={portfolioData} />;
}
