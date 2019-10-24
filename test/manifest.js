/*
 * This file is part of Privacy Manager.
 * Copyright (C) 2017-present Manvel Saroyan
 * 
 * Privacy Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Privacy Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Privacy Manager. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Currently there is no way to request and remove "<all_urls>" optional
 * permissions when running tests in puppeteer, so in order to test the
 * functionality that rely on the permission, the manifest file needs to be
 * modified before running the puppeteer test.
 * https://github.com/GoogleChrome/puppeteer/issues/5054
 */

const {readFile, writeFile} = require("fs").promises;
const manifestFile = "dist/manifest.json";
const allOrigins = "<all_urls>";

/**
 * Move "<all_urls>" from optional_permissions to permissions
 */
async function allUrlsToPermissions()
{
  const manifest = await getManifestFile();
  manifest.permissions.push(manifest.optional_permissions[0]);
  delete manifest.optional_permissions;
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2), "utf8");
}

/**
 * Move "<all_urls>" back from permissions to optional_permissions.
 */
async function restorePermissions()
{
  const manifest = await getManifestFile();
  manifest.optional_permissions = [allOrigins];
  manifest.permissions = manifest.permissions.filter(e => e !== allOrigins);
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2), "utf8");
}

async function getManifestFile()
{
  return JSON.parse(await readFile(manifestFile));
}

module.exports = {allUrlsToPermissions, restorePermissions};
