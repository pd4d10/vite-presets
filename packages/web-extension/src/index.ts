import fs from 'fs-extra'
import { mergeConfig, Plugin, ResolvedConfig, UserConfig } from 'vite'
import get from 'lodash/get'
import set from 'lodash/set'
import path from 'path'

export interface WebExtensionOptions {
  /**
   * A path to `manifest.json` file or a `Manifest` object
   */
  manifest: string | chrome.runtime.Manifest
}

export default function webExtension({
  manifest: manifestOrPath,
}: WebExtensionOptions): Plugin {
  let finalConfig: ResolvedConfig
  let manifest: chrome.runtime.Manifest
  const entryMap = new Map<
    string,
    { name: string; type: 'html' | 'js' | 'css' }
  >()

  return {
    name: 'vite-preset:web-extension',
    async config(c) {
      manifest =
        typeof manifestOrPath === 'string'
          ? await fs.readJson(
              path.resolve(c.root ?? process.cwd(), manifestOrPath)
            )
          : manifestOrPath

      if (manifest.manifest_version === 2 && manifest.background?.scripts) {
        // TODO: content_scripts
        throw new Error(
          "`background.scripts` doesn't support ES module, please use `background.page` instead: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Anatomy_of_a_WebExtension#specifying_background_scripts"
        )
      }

      ;['devtools_page', 'options_page', 'options_ui.page'].forEach((path) => {
        const entry = get(manifest, path)
        if (entry) entryMap.set(path, { name: entry, type: 'html' })
      })

      manifest.content_scripts?.forEach((s, i) => {
        s.js?.forEach((entry, j) => {
          entryMap.set(`content_scripts[${i}].js[${j}]`, {
            name: entry,
            type: 'js',
          })
        })
        s.css?.forEach((entry, j) => {
          entryMap.set(`content_scripts[${i}].css[${j}]`, {
            name: entry,
            type: 'css',
          })
        })
      })

      if (manifest.manifest_version === 2) {
        ;[
          'background.page',
          'browser_action.default_popup',
          'page_action.default_popup',
        ].forEach((path) => {
          const entry = get(manifest, path) as string | undefined
          if (entry) entryMap.set(path, { name: entry, type: 'html' })
        })
      } else if (manifest.manifest_version === 3) {
        ;['action.default_popup'].forEach((path) => {
          const entry = get(manifest, path) as string | undefined
          if (entry) entryMap.set(path, { name: entry, type: 'html' })
        })
        ;['background.service_worker'].forEach((path) => {
          const entry = get(manifest, path) as string | undefined
          if (entry) entryMap.set(path, { name: entry, type: 'js' })
        })
      } else {
        throw new Error(`invalid manifest version`)
      }

      // console.log(entryMap)

      const configPreset: UserConfig = {
        build: {
          polyfillModulePreload: false, // for service worker
          rollupOptions: {
            input: [...entryMap.values()].map((v) => v.name),
            output: {
              entryFileNames: 'assets/[name].js',
            },
          },
        },
      }
      return mergeConfig(configPreset, c)
    },
    configResolved(c) {
      finalConfig = c
    },
    generateBundle(options, bundle) {
      const m = JSON.parse(JSON.stringify(manifest))

      entryMap.forEach((entry, key) => {
        Object.values(bundle).forEach((chunk) => {
          if (
            entry.type === 'js' &&
            chunk.type === 'chunk' &&
            chunk.isEntry &&
            chunk.facadeModuleId?.endsWith(entry.name) // TODO:
          ) {
            set(m, key, chunk.fileName)
          }
        })
      })

      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(m),
      })
    },
    async closeBundle() {
      // pack
      const { default: AdmZip } = await import('adm-zip')
      const zip = new AdmZip()
      const outDirAbs = path.resolve(finalConfig.root, finalConfig.build.outDir)

      zip.addLocalFolder(outDirAbs)
      zip.writeZip(path.resolve(outDirAbs, 'extension.zip'))
    },
  }
}
