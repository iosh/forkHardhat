import chalk from "chalk";
import path from "path";
import { builtinChains } from "./chain-config";
import {
  ImportingModuleError,
  InvalidConstructorArgumentsModule,
  InvalidLibrariesModule,
} from "./errors";

import { ChainConfig } from "./types";

export const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const printSupportedNetworks = async (customChains: ChainConfig[]) => {
  const { table } = await import("table");

  // supported networks
  const supportedNetworks = builtinChains.map(({ network, chainId }) => [
    network,
    chainId,
  ]);

  const supportedNetworksTable = table([
    [chalk.bold("network"), chalk.bold("chain id")],
    ...supportedNetworks,
  ]);

  // custom networks
  const customNetworks = customChains.map(({ network, chainId }) => [
    network,
    chainId,
  ]);

  const customNetworksTable =
    customNetworks.length > 0
      ? table([
          [chalk.bold("network"), chalk.bold("chain id")],
          ...customNetworks,
        ])
      : table([["No custom networks were added"]]);

  // print message
  console.log(
    `
Networks supported by hardhat-etherscan:

${supportedNetworksTable}

Custom networks added by you or by plugins:

${customNetworksTable}

To learn how to add custom networks, follow these instructions: https://hardhat.org/verify-custom-networks
`.trimStart()
  );
};

/**
 * Returns true if the contract name is fully qualified.
 *
 * Note that the fully qualified contract name is the path of its source
 * file and the contract name separated by a colon.
 */
export const isFullyQualifiedName = (name: string): boolean => {
  return /^[^:]+:[^:]+$/.test(name);
};

/**
 * Returns the list of constructor arguments from the constructorArgsModule
 * or the constructorArgsParams if the first is not defined.
 */
export const resolveConstructorArguments = async (
  constructorArgsParams: string[],
  constructorArgsModule?: string
) => {
  if (constructorArgsModule === undefined) {
    return constructorArgsParams;
  }

  const constructorArgsModulePath = path.resolve(
    process.cwd(),
    constructorArgsModule
  );

  try {
    const constructorArguments = (await import(constructorArgsModulePath))
      .default;

    if (!Array.isArray(constructorArguments)) {
      throw new InvalidConstructorArgumentsModule(constructorArgsModulePath);
    }

    return constructorArguments;
  } catch (error: any) {
    throw new ImportingModuleError("constructor arguments list", error);
  }
};

/**
 * Returns a dictionary of library addresses from the librariesModule or
 * an empty object if not defined.
 */
export const resolveLibraries = async (
  librariesModule?: string
): Promise<Record<string, string>> => {
  if (librariesModule === undefined) {
    return {};
  }

  const librariesModulePath = path.resolve(process.cwd(), librariesModule);

  try {
    const libraries = (await import(librariesModulePath)).default;

    if (typeof libraries !== "object" || Array.isArray(libraries)) {
      throw new InvalidLibrariesModule(librariesModulePath);
    }

    return libraries;
  } catch (error: any) {
    throw new ImportingModuleError("libraries dictionary", error);
  }
};
