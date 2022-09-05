# Generate a Postman Collection

This guide explains how to generate a Postman Collection from a branch in [commercetools-docs](https://github.com/commercetools/commercetools-docs). It is useful for testing out features that are in development. If you are looking for Postman Collections to our live APIs, you can download them [here](https://github.com/commercetools/commercetools-postman-collection).

You can generate a Postman Collection for a documentation branch using a GitHub Action or by running a set of steps locally. Both approaches are explained below.

Prerequisites:

- Familiarity with [Postman](https://learning.postman.com/docs/getting-started/introduction/) and using Postman Collections.
- Familiarity with [importing a Postman Collection](https://learning.postman.com/docs/getting-started/importing-and-exporting-data/).
- A working [Postman environment](https://github.com/commercetools/commercetools-postman-collection/blob/master/GettingStarted.md) that can access Composable Commerce APIs.

Additionally, for [generating a Postman Collection locally](#generate-a-postman-collection-locally), you will require:

- Familiarity with using a Terminal, git, and GitHub.
- A local clone of the [commercetools-docs repository](https://github.com/commercetools/commercetools-docs) with the [first time setup](https://github.com/commercetools/commercetools-docs#first-time-setup) completed.

## Generate a Postman Collection using GitHub

With this approach, you do not need to install anything locally. You can generate a Postman Collection by running a [GitHub Action](https://github.com/commercetools/commercetools-docs/actions/workflows/generate-postman.yaml) in the [commercetools-docs repository](https://github.com/commercetools/commercetools-docs/). This Action can generate a Postman collection for any branch in the repository.

1. Go to [commercetools-docs repository](https://github.com/commercetools/commercetools-docs/) and click the **Actions** tab.
2. In the list of Workflows, find the **Generate postman collection** Action and click **Run workflow**.
3. Select your branch from the drop-down menu and click **Run workflow**.
4. The **Generate postman collection** action runs and is added to the list of workflow runs. If there are errors in the branch the workflow will fail. Upon successfully finishing, the workflow produces an artifact called `commercetools-postman-collection.zip`. You can find this in the **Artifacts** section of your workflow run.
5. Unzip `commercetools-postman-collection.zip` and import it to your Postman application.

## Generate a Postman Collection locally

1. Open /commercetools-docs in your Terminal and check out a branch.
2. Run the following command:

```bash
yarn run generate-postman
```

If there are any errors in your Terminal, run:

```bash
yarn install

yarn run generate-postman
```

3. Navigate to `commercetools-docs/api-specs/postman`. You can find the `collection.json` and `template.json` files in the respective folders for each API:

- api: HTTP API
- history: Change History API
- import: Import API
- ml: Machine Learning API

4. Choose one of the APIs and import the corresponding `collection.json` and `template.json` files to Postman.
