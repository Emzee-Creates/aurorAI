AI Yield and Risk Optimizer: Intelligence LayerWelcome to the Intelligence Layer of our AI Yield and Risk Optimizer application. This part of the project is dedicated to analyzing on-chain data and identifying key risks and opportunities in a user's decentralized finance (DeFi) portfolio.This risk.ts file is a crucial component of this layer, specifically designed to assess concentration risk. It analyzes a wallet's asset balances to determine if the portfolio is overly exposed to any single asset, which is a common source of risk in DeFi.FeaturesConcentration Risk Analysis: Calculates the percentage of each asset in a portfolio against the total portfolio value.Risk Thresholding: Flags assets that exceed a predefined concentration threshold (currently 25%).Structured Output: Provides a clear, actionable summary with a status ("High Risk" or "Low Risk"), a descriptive message, and a list of all risky assets.Edge Case Handling: Safely handles portfolios with a total value of zero, preventing runtime errors.Setup and UsageFollow these steps to set up the project and use the analyzeConcentrationRisk function locally.PrerequisitesNode.js: Ensure you have Node.js (version 14 or higher) and npm/yarn installed on your machine.Git: You'll need Git to clone the repository.Step 1: Clone the RepositoryClone this repository to your local machine:git clone <repository-url>
cd <repository-name>
Step 2: Install DependenciesSince this is a TypeScript project, you'll need to install the necessary packages.npm install
# or
yarn install
Step 3: Run the ExampleThe index.ts file provides a simple example of how to use the analyzeConcentrationRisk function. You can run it directly using ts-node or by compiling the TypeScript to JavaScript.To install ts-node (a useful tool for running TypeScript files directly):npm install -g ts-node typescript
Now, you can run the example:ts-node index.ts
The output will be logged to your console, showing the risk analysis for the example portfolio.Endpoints (Functions)The core functionality is exposed through a single, well-defined function.analyzeConcentrationRisk(balances, totalPortfolioValueUSD)This function takes an array of asset balances and the total portfolio value to calculate and assess concentration risk.balances: An array of Balance objects, where each object should have a symbol and valueUSD.totalPortfolioValueUSD: A number representing the total value of the portfolio in USD.Return Value:The function returns a ConcentrationRiskAnalysis object with the following structure:{
  status: "High Risk" | "Low Risk",
  message: string,
  riskyAssets: Array<{
    symbol: string,
    valueUSD: number,
    percentage: number,
  }>
}
Example Usage:See the index.ts file for a complete, runnable example.ConfigurationYou can easily adjust the sensitivity of the concentration risk analysis by modifying the CONCENTRATION_RISK_THRESHOLD constant in the risk.ts file.const CONCENTRATION_RISK_THRESHOLD = 0.25; // Change this value to adjust the risk threshold
ContributionWe welcome contributions! If you have suggestions for new risk analysis features, performance improvements, or bug fixes, please open an issue or submit a pull request.LicenseThis project is licensed under the MIT License.